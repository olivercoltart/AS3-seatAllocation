import type { NextPage } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';

function NumberOfSeats({
  onSubmit,
  submitted,
  setSubmitted
}: { 
    onSubmit : (seats: number) => void; 
    submitted: boolean;
    setSubmitted: (val: boolean) => void;
  }) {
  const[value, setValue] = useState(1);

  const handleSubmit = () => {
    onSubmit(value);
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value) || 1;
    setValue(newValue);
    setSubmitted(false);
  };

  return (
    <div className='flex flex-row items-center space-x-4'>
      <input 
      type="number" 
      min={1}
      max={7}
      value={value}
      onChange={handleChange}
      className="border border-gray-400 rounded p-2 w-16 text-center"
      />

      <button 
        type="button"
        onClick={handleSubmit}
        disabled={submitted}
        className={`px-4 py-2 rounded transition ${
          submitted
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}>
          Confirm
        </button>
    </div>
  );
}

const BookSeats: NextPage = () => {
  const router = useRouter();

  const [numSeats, setNumSeats] = useState<number|null>(null);
  const [passengerCategories, setPassengerCategories] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleSeatSelection = (seats: number) => {
    setNumSeats(seats);
    setPassengerCategories(Array(seats).fill('Standard'));
  };

  const handleCategoryChange = (index: number, category: string) => {
    const newCategories = [...passengerCategories];
    newCategories[index] = category;
    setPassengerCategories(newCategories);
  };

  const handleBooking = async () => {
    const response = await fetch('/api/bookSeats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passengerCategories }),
    });
  
    const data = await response.json();
  
    if (data.success) {
      router.push({
        pathname: '/allocatedSeats',
        query: { seats: JSON.stringify(data.assignedSeats) },
      });
    } else {
      alert(data.error || 'Seat allocation failed');
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <h1>Please enter the number of passengers:</h1>
        <NumberOfSeats 
          onSubmit={handleSeatSelection}
          submitted={submitted}
          setSubmitted={setSubmitted}
        />

        {numSeats !== null && (
          <div>
            <h2>List of Passengers:</h2>
            <ul className="space-y-4">
              {Array.from({ length: numSeats }, (_, index) => (
                <li key={index} className="flex flex-col space-y-2">
                  <h3 className="font-medium">Passenger {index + 1}:</h3>
                  <div className="flex flex-wrap gap-4">
                    {['Standard', 'VIP', 'Under 10', 'Disabled'].map((type) => (
                      <label key={type} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`category-${index}`}
                          value={type}
                          checked={passengerCategories[index] === type}
                          onChange={() => handleCategoryChange(index, type)}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {submitted && (
        <div className="fixed bottom-4 w-full flex justify-center">
          <button 
          onClick={handleBooking}
          className="px-4 py-2 rounded transition bg-blue-600 text-white hover:bg-blue-700">
            Book Seats
          </button>
        </div>
      )}
    </div>
  );
};

export default BookSeats;

