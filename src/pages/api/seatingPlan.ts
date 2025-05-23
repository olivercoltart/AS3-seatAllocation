import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const seats = await prisma.seat.findMany({
    orderBy: [{ row: 'asc' }, { number: 'asc' }],
  });

  res.status(200).json(seats);
}