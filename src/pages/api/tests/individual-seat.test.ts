import handler from '../bookSeats'; 
import { createMocks } from 'node-mocks-http';

const VIP_WINDOW_COLUMNS = ['B', 'G'];
const STANDARD_WINDOW_COLUMNS = ['A', 'H'];
const AISLE_COLUMNS = ['D', 'E'];

function isPreferredColumn(column: string, category: string) {
  if (category === 'VIP') {
    return VIP_WINDOW_COLUMNS.includes(column) || AISLE_COLUMNS.includes(column);
  }
  return STANDARD_WINDOW_COLUMNS.includes(column) || AISLE_COLUMNS.includes(column);
}

describe('Individual seat assignment', () => {
  const categories = ['Standard', 'Under 10', 'Disabled', 'VIP'];

  for (const category of categories) {
    it(`assigns a preferred seat (window or aisle) for single ${category} passenger`, async () => {
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

      const column = seatId.slice(-1);
      expect(isPreferredColumn(column, category)).toBe(true);
    });
  }
});