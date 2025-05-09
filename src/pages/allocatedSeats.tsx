import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type Seat = {
  id: string;
  row: number;
  number: number;
  booked: boolean;
};

const AllocatedSeats = () => {
  const router = useRouter();
  const [allSeats, setAllSeats] = useState<Seat[]>([]);
  const [assignedSeats, setAssignedSeats] = useState<string[]>([]);

  useEffect(() => {
    if (router.query.seats) {
      try {
      setAssignedSeats(JSON.parse(router.query.seats as string));
      } catch (error) {
        console.error("Error parsing assigned seats:", error);
      }
    }

    const fetchSeats = async () => {
      const res = await fetch('/api/seatingPlan');
      const data = await res.json();
      setAllSeats(data);
    };

    fetchSeats();
  }, [router.query.seats]);

  const renderGrid = () => {
    const rows = Array.from(new Set(allSeats.map(seat => seat.row))).sort((a, b) => a - b);

    return rows.map(rowNum => {
      const rowSeats = allSeats.filter(seat => seat.row === rowNum);
      const isShortRow = rowNum <= 3;

      return (
        <div key={rowNum} className="flex mb-2 items-center">
          <span className="w-18 font-semibold">Row {rowNum}</span>
          
          <div className={`flex ${isShortRow ? 'justify-center' : ''} flex-grow`}>
            {rowSeats.map(seat => {
              const isBooked = seat.booked;
              const isNewlyBooked = assignedSeats.includes(seat.id);

              let bgColor = 'bg-green-300'; // default: available
              if (isBooked) bgColor = 'bg-red-400';
              if (isNewlyBooked) bgColor = 'bg-blue-500';

              return (
                <div
                  key={seat.id}
                  className={`w-10 h-10 ${seat.id.endsWith('E') ? 'ml-10' : 'm-1'} m-1 flex items-center justify-center rounded text-sm text-white font-medium ${bgColor}`}
                  title={seat.id}
                >
                  {seat.id}
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
        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter) => (
              <div key={letter} className={`w-10 h-10 ${letter==='E' ? 'ml-10' : 'm-1'} m-1 flex items-center justify-center text-sm font-semibold text-gray-700`}>
                {letter}
              </div>  
            ))}
      </div>

      <div className='flex'>
        <div>{renderGrid()}</div>
        <div className="ml-12 mt-6 space-y-1">
          <p><span className="inline-block w-4 h-4 bg-blue-500 mr-2 rounded"></span>Your Seats</p>
          <p><span className="inline-block w-4 h-4 bg-red-400 mr-2 rounded"></span>Booked</p>
          <p><span className="inline-block w-4 h-4 bg-green-300 mr-2 rounded"></span>Available</p>
        </div>
      </div>
    </div>
  );
};

export default AllocatedSeats;