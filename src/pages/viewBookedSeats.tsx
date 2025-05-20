import { useEffect, useState } from 'react';

type Seat = {
  id: string;
  row: number;
  number: number;
  booked: boolean;
  disabled?: boolean;
};

const DISABLED_SEATS = ['4E', '6E', '5D', '7D'];

const ViewBookings = () => {
  const [allSeats, setAllSeats] = useState<Seat[]>([]);

  useEffect(() => {
    const fetchSeats = async () => {
      const res = await fetch('/api/seatingPlan');
      const data = await res.json();
      setAllSeats(data);
    };

    fetchSeats();
  }, []);

  const renderRows = (rowNums: number[]) => {
    return rowNums.map(rowNum => {
      const rowSeats = allSeats.filter(seat => seat.row === rowNum);
      const isShortRow = rowNum <= 3;

      return (
        <div key={rowNum} className="flex mb-2 items-center">
          <span className="w-18 font-semibold">Row {rowNum}</span>

          <div className={`flex ${isShortRow ? 'justify-center' : ''} flex-grow`}>
            {rowSeats.map(seat => {
              const isBooked = seat.booked;
              let bgColor = isBooked ? 'bg-red-400' : 'bg-green-300';

              return (
                <div
                  key={seat.id}
                  className={`relative w-10 h-10 ${seat.id.endsWith('E') ? 'ml-10' : 'm-1'} m-1 flex items-center justify-center rounded text-sm text-white font-medium ${bgColor}`}
                  title={seat.id}
                >
                  {seat.id}
                  {DISABLED_SEATS.includes(seat.id) && (
                    <img
                      src="/images/Wheelchair_symbol.png"
                      alt="Disabled Seat"
                      className="absolute w-4 h-4 top-0 right-0"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Full Seating Plan</h1>

      <div className="flex mb-2 items-center">
        <span className='w-18'></span>
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(letter => (
          <div key={letter} className={`w-10 h-10 ${letter === 'E' ? 'ml-10' : 'm-1'} m-1 flex items-center justify-center text-sm font-semibold text-gray-700`}>
            {letter}
          </div>
        ))}
      </div>

      <div className="flex relative">
        {/* VIP Section */}
        <div>
          <div className="flex items-center mt-2 mb-1">
            <span className="w-18 font-bold text-gray-600">VIP</span>
            <div className="border-t border-gray-600 flex-grow ml-2" />
          </div>

          {renderRows([1, 2, 3])}

          {/* Standard Section */}
          <div className="flex items-center mt-4 mb-1">
            <span className="w-18 font-bold text-gray-600">Standard</span>
            <div className="border-t border-gray-600 flex-grow ml-2" />
          </div>

          {renderRows(Array.from({ length: 12 }, (_, i) => i + 4))}
        </div>

        {/* No Children Zone Label */}
        <div className="absolute left-130 top-[calc(4*61px)]">
          <div className="w-px h-[100px] bg-gray-600 relative">
            <div className="absolute top-0 left-[-8px] w-2 h-px bg-gray-600" />
            <div className="absolute bottom-0 left-[-8px] w-2 h-px bg-gray-600" />
            <div className="absolute -right-40 top-1/2 transform -translate-y-1/2 font-semibold text-gray-600">
              No Children Zone
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="ml-12 mt-6 space-y-1">
          <p><span className="inline-block w-4 h-4 bg-red-400 mr-2 rounded"></span>Booked</p>
          <p><span className="inline-block w-4 h-4 bg-green-300 mr-2 rounded"></span>Available</p>
        </div>
      </div>
    </div>
  );
};

export default ViewBookings;