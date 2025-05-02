import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Seat logic helpers
const VIP_ROWS = [1, 2, 3];
const UNDER10_BLOCKED_ROWS = [4, 5];
const DISABLED_SEATS = ['4E', '5D', '7D'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { passengerCategories } = req.body;

  if (!Array.isArray(passengerCategories)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  const assignedSeats: string[] = [];

  for (const category of passengerCategories) {
    // Fetch all available seats
    const availableSeats = await prisma.seat.findMany({
      where: { booked: false },
      orderBy: [{ row: 'asc' }, { number: 'asc' }],
    });

    let filtered = availableSeats;

    if (category === 'VIP') {
      filtered = availableSeats.filter((s) => VIP_ROWS.includes(s.row));
    } else if (category === 'Under 10') {
      filtered = availableSeats.filter((s) => !UNDER10_BLOCKED_ROWS.includes(s.row));
    } else if (category === 'Disabled') {
      filtered = availableSeats.filter((s) => DISABLED_SEATS.includes(s.id));
    } else {
      filtered = availableSeats.filter((s) => !VIP_ROWS.includes(s.row));
    }

    if (filtered.length === 0) {
      return res.status(400).json({ error: `No available seats for category ${category}` });
    }

    const seat = filtered[0];
    assignedSeats.push(seat.id);

    await prisma.seat.update({
      where: { id: seat.id },
      data: { booked: true },
    });
  }

  res.status(200).json({ success: true, assignedSeats });
}