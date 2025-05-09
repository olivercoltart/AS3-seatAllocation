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
  hasDisabled: boolean
): boolean {
  const rows = group.map(s => s.row);
  const row = rows[0];
  
  const hasBlockedRow = UNDER10_BLOCKED_ROWS.includes(row);
  const includesDisabledSeat = group.some(s => DISABLED_SEATS.includes(s.id));
  const isConsecutive = group.every((s, idx) =>
    idx === 0 || s.number === group[idx - 1].number + 1
  );

  return (
    isConsecutive &&
    (!hasUnder10 || !hasBlockedRow) &&
    (!hasDisabled || includesDisabledSeat)
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

  if (isSingle) {
    const category = passengerCategories[0];
    let filtered: Seat[] = [];

    if (category === 'VIP') {
      filtered = availableSeats.filter(s => VIP_ROWS.includes(s.row));
      const preferred = filtered.find(s => {
        const col = s.id[s.id.length - 1];
        return VIP_WINDOW_COLUMNS.includes(col) || AISLE_COLUMNS.includes(col);
      });
      const seat = preferred || filtered[0];
      if (!seat) return res.status(400).json({ error: 'No VIP seats available' });
      assignedSeats.push(seat.id);
      await prisma.seat.update({ where: { id: seat.id }, data: { booked: true } });

    } else if (category === 'Standard') {
      filtered = availableSeats.filter(s =>
        !VIP_ROWS.includes(s.row) && !DISABLED_SEATS.includes(s.id)
      );
      const preferred = filtered.find(s => {
        const col = s.id[s.id.length - 1];
        return STANDARD_WINDOW_COLUMNS.includes(col) || AISLE_COLUMNS.includes(col);
      });
      const seat = preferred || filtered[0];
      if (!seat) return res.status(400).json({ error: 'No Standard seats available' });
      assignedSeats.push(seat.id);
      await prisma.seat.update({ where: { id: seat.id }, data: { booked: true } });

    } else if (category === 'Under 10') {
      filtered = availableSeats.filter(s =>
        !VIP_ROWS.includes(s.row) &&
        !DISABLED_SEATS.includes(s.id) &&
        !UNDER10_BLOCKED_ROWS.includes(s.row)
      );
      const seat = filtered[0];
      if (!seat) return res.status(400).json({ error: 'No Under 10 seats available' });
      assignedSeats.push(seat.id);
      await prisma.seat.update({ where: { id: seat.id }, data: { booked: true } });

    } else if (category === 'Disabled') {
      filtered = availableSeats.filter(s => DISABLED_SEATS.includes(s.id));
      const seat = filtered[0];
      if (!seat) return res.status(400).json({ error: 'No Disabled seats available' });
      assignedSeats.push(seat.id);
      await prisma.seat.update({ where: { id: seat.id }, data: { booked: true } });
    }

    return res.status(200).json({ success: true, assignedSeats });
  }

  const isAllVIP = passengerCategories.every(c => c === 'VIP');

  // Group booking logic
  const eligibleSeats = availableSeats.filter(s => {
    if (isAllVIP) return VIP_ROWS.includes(s.row); 
    return !VIP_ROWS.includes(s.row);              
  });
  
  const grouped = groupSeatsByRow(eligibleSeats);
  let foundGroup: Seat[] | null = null;

  for (const seats of grouped.values()) {
    for (let i = 0; i <= seats.length - groupSize; i++) {
      const group = seats.slice(i, i + groupSize);
      if (isGroupBlockValid(group, hasUnder10, hasDisabled)) {
        foundGroup = group;
        break;
      }
    }
    if (foundGroup) break;
  }

  if (!foundGroup) {
    return res.status(400).json({ error: 'No valid group seating available for these categories' });
  }

  for (const seat of foundGroup) {
    assignedSeats.push(seat.id);
    await prisma.seat.update({ where: { id: seat.id }, data: { booked: true } });
  }

  return res.status(200).json({ success: true, assignedSeats });
}