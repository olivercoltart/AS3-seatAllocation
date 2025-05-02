import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const AllocatedSeats = () => {
  const router = useRouter();
  const [assignedSeats, setAssignedSeats] = useState<string[]>([]);

  useEffect(() => {
    if (router.query.seats) {
      setAssignedSeats(JSON.parse(router.query.seats as string));
    }
  }, [router.query.seats]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Your Assigned Seats</h1>
      <ul className="list-disc pl-6">
        {assignedSeats.map((seat, i) => (
          <li key={i}>{seat}</li>
        ))}
      </ul>
    </div>
  );
};

export default AllocatedSeats;