import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <body className="flex justify-center items-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-6">Welcome to your seat allocator</h1>    

        <div className="mb-6">
          <Image
            src="/images/home_plane.png"
            alt="Plane"
            width={500}
            height={500}
          />
        </div>  

        <div className="flex justify-center space-x-4">
          <div>
            <Link href="/bookSeats" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Book Seats
            </Link>
          </div>

          <div>
            <Link href="/viewBookedSeats" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              View Bookings
            </Link>
          </div>
        </div>
      </div>
    </body>
  );
}