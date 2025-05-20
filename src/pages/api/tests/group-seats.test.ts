import handler from '../bookSeats'; 
import { createMocks } from 'node-mocks-http';

// run tests for multiple standard, VIP, children, as well as combination of children, disable, standard

const VIP_group = ['VIP', 'VIP', 'VIP'];
const STANDARD_group = ['Standard', 'Standard', 'Standard'];
const HYBRID_group = ['Standard', 'Standard', 'Under 10', 'Disabled'];

function parseSeat(seatId: string): { row: number; column: string } {
  const row = parseInt(seatId.slice(0, -1), 10);
  const column = seatId.slice(-1);
  return { row, column };
}

function seatsAreTogether(seats: string[]): boolean {
  const parsedSeats = seats.map(parseSeat);

  const allSameRow = parsedSeats.every(seat => seat.row === parsedSeats[0].row);
  if (!allSameRow) return false;

  const columnValues = parsedSeats.map(seat => seat.column.charCodeAt(0)).sort((a, b) => a - b);

  for (let i = 1; i < columnValues.length; i++) {
    if (columnValues[i] !== columnValues[i - 1] + 1) {
      return false;
    }
  }

  return true;
}

describe('Group seat assignment', () => {
  const groups = [
    { name: 'VIP_group', passengers: VIP_group },
    { name: 'STANDARD_group', passengers: STANDARD_group },
    { name: 'HYBRID_group', passengers: HYBRID_group },
  ];

  for (const group of groups) {
    it(`assigns seats in the same row and adjacent for ${group.name}`, async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { passengerCategories: group.passengers },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);
      expect(data.assignedSeats.length).toBe(group.passengers.length);

      const areTogether = seatsAreTogether(data.assignedSeats);
      expect(areTogether).toBe(true);
    });
  }
});