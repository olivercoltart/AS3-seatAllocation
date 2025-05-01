import type { NextPage } from 'next';
import { useState } from 'react';

function NumberOfSeats({ onSubmit }: { onSubmit: (seats: number) => void }) {
  const[value, setValue] = useState(0);

  const handleSubmit = () => {
    onSubmit(value);
  }

  return (
    <div>
      <input 
      type="number" 
      min={1}
      max={7}
      value={value}
      onChange={(e) => setValue(parseInt(e.target.value))}
      className="border border-gray-400 rounded p-2 w-15 text-center"
      />

      <button 
        type="button"
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Proceed
        </button>
    </div>
  );
}

const BookSeats: NextPage = () => {
  const [numSeats, setNumSeats] = useState<number|null>(null);
  const [passengerCategories, setPassengerCategories] = useState<string[]>([]);

  const handleSeatSelection = (seats: number) => {
    setNumSeats(seats);
    setPassengerCategories(Array(seats).fill('Standard'));
  };

  const handleCategoryChange = (index: number, category: string) => {
    const newCategories = [...passengerCategories];
    newCategories[index] = category;
    setPassengerCategories(newCategories);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
      <div className="flex items-center space-x-4">
        <h1>Please enter the number of passengers:</h1>
        <NumberOfSeats onSubmit={handleSeatSelection}/>
        {numSeats !== null && (
          <div>
            <h2>List of Passengers:</h2>
            <ul className='space-y-4'>
              {Array.from({length: numSeats }, (_, index) => (
                <li key={index} className="flex flex-col space-y-2">
                  <h3>Passenger {index + 1}:</h3>
                  <div className='flex space-x-4'>
                    <label>
                      <input 
                        type="radio" 
                        name={`category-${index}`}
                        value="Standard" 
                        checked={passengerCategories[index] === 'Standard'}
                        onChange={() => handleCategoryChange(index, 'Standard')}
                      />
                      Standard
                    </label>

                    <label>
                      <input 
                        type="radio" 
                        name={`category-${index}`}
                        value="VIP" 
                        checked={passengerCategories[index] === 'VIP'}
                        onChange={() => handleCategoryChange(index, 'VIP')}
                      />
                      VIP
                    </label>

                    <label>
                      <input 
                        type="radio" 
                        name={`category-${index}`}
                        value="Under 10" 
                        checked={passengerCategories[index] === 'Under 10'}
                        onChange={() => handleCategoryChange(index, 'Under 10')}
                      />
                      Under 10
                      </label>

                    <label>
                      <input 
                        type="radio" 
                        name={`category-${index}`}
                        value="Disabled" 
                        checked={passengerCategories[index] === 'Disabled'}
                        onChange={() => handleCategoryChange(index, 'Disabled')}
                      />
                      Disabled
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSeats;

