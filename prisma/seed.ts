import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const totalRows = 15;

  for (let row = 1; row <= totalRows; row++) {
    const seatLabels =
      row <= 3
        ? ['B', 'C', 'D', 'E', 'F', 'G']
        : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let seat of seatLabels) {
      const seatId = `${seat}${row}`;
      await prisma.seat.upsert({
        where: { id: seatId },
        update: {},
        create: {
          id: seatId,
          row: row,
          number: seat.charCodeAt(0) - 64,
        },
      });
    }
  }
}

main().then(() => prisma.$disconnect());