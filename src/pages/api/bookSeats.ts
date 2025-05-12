import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient, Seat } from '@prisma/client';

const prisma = new PrismaClient();

// Seat config
const VIP_ROWS = [1, 2, 3];
const UNDER10_BLOCKED_ROWS = [4, 5];
const DISABLED_SEATS = ['4E', '6E', '5D', '7D'];
const AISLE_COLUMNS = ['D', 'E'];
const VIP_WINDOW_COLUMNS = ['B', 'G'];
const STANDARD_WINDOW_COLUMNS = ['A', 'H'];

// Group seats by row
function groupSeatsByRow(seats: Seat[]): Map<number, Seat[]> {
  const map = new Map<number, Seat[]>();
  for (const seat of seats) {
    if (!map.has(seat.row)) map.set(seat.row, []);
    map.get(seat.row)!.push(seat);
  }

  for (const row of map.values()) {
    row.sort((a, b) => a.number - b.number);
  }

  return map;
}

// Find adjacent group seats
function findGroupSeats(groupSize: number, grouped: Map<number, Seat[]>): Seat[] | null {
  for (const seats of grouped.values()) {
    for (let i = 0; i <= seats.length - groupSize; i++) {
      const group = seats.slice(i, i + groupSize);
      const isConsecutive = group.every((s, idx) =>
        idx === 0 || s.number === group[idx - 1].number + 1
      );
      if (isConsecutive) return group;
    }
  }
  return null;
}

// Filter by passenger type
function filterSeats(seats: Seat[], category: string): Seat[] {
  switch (category) {
    case 'VIP':
      return seats.filter(s => VIP_ROWS.includes(s.row));
    case 'Under 10':
      return seats.filter(s =>
        !UNDER10_BLOCKED_ROWS.includes(s.row) &&
        !VIP_ROWS.includes(s.row) &&
        !DISABLED_SEATS.includes(s.id)
      );
    case 'Disabled':
      return seats.filter(s => DISABLED_SEATS.includes(s.id));
    default:
      return seats.filter(s =>
        !VIP_ROWS.includes(s.row) &&
        !DISABLED_SEATS.includes(s.id)
      );
  }
}

// Find preferred seat for individual
function findPreferredSeat(seats: Seat[], category: string): Seat {
  const columns = category === 'VIP' ? VIP_WINDOW_COLUMNS : STANDARD_WINDOW_COLUMNS;
  const preferred = seats.find(s => {
    const col = s.id.slice(-1);
    return columns.includes(col) || AISLE_COLUMNS.includes(col);
  });
  return preferred || seats[0];
}

// Check if group block is valid
function isGroupBlockValid(
  group: Seat[],
  hasUnder10: boolean,
  hasDisabled: boolean,
  rowSeats: Seat[]
): boolean {
  if (group.length === 0) return false;

  const row = group[0].row;
  const hasBlockedRow = UNDER10_BLOCKED_ROWS.includes(row);
  const includesDisabledSeat = group.some(s => DISABLED_SEATS.includes(s.id));
  const isConsecutive = group.every((s, idx) =>
    idx === 0 || s.number === group[idx - 1].number + 1
  );

  // Get seat numbers
  const start = group[0].number;
  const end = group[group.length - 1].number;

  const seatBefore = rowSeats.find(s => s.number === start - 1);
  const seatAfter = rowSeats.find(s => s.number === end + 1);

  const createsBadGap = (seat: Seat | undefined) => {
    if (!seat) return false; // No seat = no problem
    const col = seat.id.slice(-1);
    return !AISLE_COLUMNS.includes(col) && !STANDARD_WINDOW_COLUMNS.includes(col);
  };

  const leavesBadGap = createsBadGap(seatBefore) || createsBadGap(seatAfter);

  return (
    isConsecutive &&
    (!hasUnder10 || !hasBlockedRow) &&
    (!hasDisabled || includesDisabledSeat) &&
    !leavesBadGap
  );
}

// Main handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { passengerCategories } = req.body;

  if (!Array.isArray(passengerCategories)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const assignedSeats: string[] = [];

  const groupSize = passengerCategories.length;
  const hasUnder10 = passengerCategories.includes('Under 10');
  const hasDisabled = passengerCategories.includes('Disabled');
  const isSingle = groupSize === 1;

  const availableSeats = await prisma.seat.findMany({
    where: { booked: false },
    orderBy: [{ row: 'asc' }, { number: 'asc' }],
  });

  // Step 1: Handle VIPs together
  const vipCount = passengerCategories.filter(c => c === 'VIP').length;
  const nonVipCategories = passengerCategories.filter(c => c !== 'VIP');

  if (vipCount > 0) {
    const vipSeats = filterSeats(availableSeats, 'VIP');
    const groupedVIP = groupSeatsByRow(vipSeats);
    const vipGroup = findGroupSeats(vipCount, groupedVIP);

    if (!vipGroup || vipGroup.length < vipCount) {
      return res.status(400).json({ error: 'Not enough adjacent VIP seats' });
    }

    for (const seat of vipGroup.slice(0, vipCount)) {
      assignedSeats.push(seat.id);
      await prisma.seat.update({ where: { id: seat.id }, data: { booked: true } });
    }

    // Remove VIP-assigned seats from available pool
    const vipSeatIds = new Set(vipGroup.map(s => s.id));
    for (let i = availableSeats.length - 1; i >= 0; i--) {
      if (vipSeatIds.has(availableSeats[i].id)) {
        availableSeats.splice(i, 1);
      }
    }
  }

  // Step 2: Try to seat non-VIP passengers together
  if (nonVipCategories.length > 0) {
    const filteredSeats = availableSeats.filter(s =>
      !VIP_ROWS.includes(s.row)
    );

    const grouped = groupSeatsByRow(filteredSeats);
    let foundGroup: Seat[] | null = null;

    for (const seats of grouped.values()) {
      for (let i = 0; i <= seats.length - nonVipCategories.length; i++) {
        const group = seats.slice(i, i + nonVipCategories.length);
        if (isGroupBlockValid(group, hasUnder10, hasDisabled, seats)) {
          foundGroup = group;
          break;
        }
      }
      if (foundGroup) break;
    }

    if (foundGroup) {
      for (let i = 0; i < nonVipCategories.length; i++) {
        const category = nonVipCategories[i];
        const seat = foundGroup[i];
        assignedSeats.push(seat.id);
        await prisma.seat.update({ where: { id: seat.id }, data: { booked: true } });
      }

      return res.status(200).json({ success: true, assignedSeats });
    }

    // Step 3: Couldn’t group — assign individually
    for (const category of nonVipCategories) {
      const filtered = filterSeats(availableSeats, category);
      const seat = findPreferredSeat(filtered, category);

      if (!seat) {
        return res.status(400).json({ error: `No available seats for ${category}` });
      }

      assignedSeats.push(seat.id);
      await prisma.seat.update({ where: { id: seat.id }, data: { booked: true } });

      // Remove from pool
      const idx = availableSeats.findIndex(s => s.id === seat.id);
      if (idx !== -1) availableSeats.splice(idx, 1);
    }
  }

  return res.status(200).json({ success: true, assignedSeats });
}