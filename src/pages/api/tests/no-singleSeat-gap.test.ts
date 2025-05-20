import handler from '../bookSeats';
import { createMocks } from 'node-mocks-http';

const STANDARD_MIDDLE_COLUMNS = ['B', 'C', 'F', 'G'];
const VIP_MIDDLE_COLUMNS = ['C', 'F'];

type Seat = {
  id: string;
  row: number;
  column: string;
  booked: boolean;
  type: 'Standard' | 'VIP';
};

// check for single seat gaps
function hasSingleSeatGaps(seatMap: Seat[], seatType: 'Standard' | 'VIP'): boolean {
  const middleColumns = seatType === 'VIP' ? VIP_MIDDLE_COLUMNS : STANDARD_MIDDLE_COLUMNS;
  const rows = Array.from(new Set(seatMap.map(seat => seat.row)));

  for (const row of rows) {
    const seatsInRow = seatMap
      .filter(seat => seat.row === row && middleColumns.includes(seat.column))
      .sort((a, b) => a.column.charCodeAt(0) - b.column.charCodeAt(0));

    for (let i = 1; i < seatsInRow.length - 1; i++) {
      const prev = seatsInRow[i - 1];
      const curr = seatsInRow[i];
      const next = seatsInRow[i + 1];

      if (!curr.booked && prev.booked && next.booked) {
        return true;
      }
    }
  }

  return false;
}

describe('No single-seat gaps in middle columns', () => {
  it('ensures no single seat gaps exist in standard middle columns', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { passengerCategories: Array(20).fill('Standard') },
    });

    await handler(req, res);
    const data = JSON.parse(res._getData());

    const seatMap: Seat[] = data.seatMap; // This must be returned by your API

    const hasGaps = hasSingleSeatGaps(seatMap, 'Standard');
    expect(hasGaps).toBe(false);
  });

  it('ensures no single seat gaps exist in VIP middle columns', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { passengerCategories: Array(10).fill('VIP') },
    });

    await handler(req, res);
    const data = JSON.parse(res._getData());

    const seatMap: Seat[] = data.seatMap;

    const hasGaps = hasSingleSeatGaps(seatMap, 'VIP');
    expect(hasGaps).toBe(false);
  });
});