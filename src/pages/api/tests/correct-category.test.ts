import handler from '../bookSeats'; 
import { createMocks } from 'node-mocks-http';

const VIP_rows = Array.from({ length: 3 }, (_, i) => i + 1);
const STANDARD_rows = Array.from({ length: 12 }, (_, i) => i + 4);
const UNDER10_BLOCKED_ROWS = [4, 5];
const DISABLED_SEATS = ['4E', '6E', '5D', '7D'];

function isCorrectCategory(row: number, column: string, category: string): boolean {
    switch (category) {
    case 'VIP':
      return VIP_rows.includes(row);
    case 'Under 10':
      return (
        !VIP_rows.includes(row) &&
        !UNDER10_BLOCKED_ROWS.includes(row)
      );
    case 'Disabled':
      return DISABLED_SEATS.includes(`${row}${column}`);
    case 'Standard':
    default:
      return (
        STANDARD_rows.includes(row) &&
        !DISABLED_SEATS.includes(`${row}${column}`)
      );
  }
}

describe('Seat assignment by category', () => {
  const categories = ['VIP', 'Under 10', 'Disabled', 'Standard'];

  for (const category of categories) {
    it(`assigns a seat in the correct location for ${category}`, async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { passengerCategories: [category] },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);

      const data = JSON.parse(res._getData());
      expect(data.success).toBe(true);

      const seatId = data.assignedSeats[0];
      expect(seatId).toBeDefined();

      const row = parseInt(seatId.slice(0, -1), 10);
      const column = seatId.slice(-1);

      expect(isCorrectCategory(row, column, category)).toBe(true);
    });
  }
});
