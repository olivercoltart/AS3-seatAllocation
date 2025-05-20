import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const { seats } = req.body;

  try {
    const updates = await Promise.all(
      seats.map((seat: { id: string; booked: boolean }) =>
        prisma.seat.update({
          where: { id: seat.id },
          data: { booked: seat.booked },
        })
      )
    );

    return res.status(200).json({ success: true, updated: updates });
  } catch (error) {
    console.error('Seat update failed:', error);
    return res.status(500).json({ success: false, error: 'Failed to update seats' });
  }
}