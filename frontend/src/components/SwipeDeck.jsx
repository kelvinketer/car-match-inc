import React, { useState, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import axios from 'axios';

const SwipeDeck = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch the dealer stack when the component loads
  useEffect(() => {
    const fetchStack = async () => {
      try {
        // Remember to pass the JWT token so Django knows who is swiping!
        const token = localStorage.getItem('access_token'); 
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/vehicles/stack/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCars(response.data.stack);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching car stack:", error);
        setLoading(false);
      }
    };

    fetchStack();
  }, []);

  // 2. The Swipe Handler (The Catcher)
  const onSwipe = async (direction, vehicleId) => {
    console.log(`You swiped ${direction} on car ID: ${vehicleId}`);
    
    const isLiked = direction === 'right';

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/vehicles/swipe/`, 
        {
          vehicle_id: vehicleId,
          is_liked: isLiked
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. INSTANT MATCH TRIGGER!
      if (response.data.status === 'match') {
        alert(`IT'S A MATCH! 🚗💨\nOpening secure escrow chat...`);
        // TODO: Redirect the user to the ChatUI component using response.data.room_id
        // e.g., navigate(`/chat/${response.data.room_id}`);
      }
      
    } catch (error) {
      console.error("Error recording swipe:", error);
    }
  };

  const onCardLeftScreen = (myIdentifier) => {
    console.log(myIdentifier + ' left the screen');
  };

  if (loading) return <div className="text-center mt-20 font-bold">Finding cars near you...</div>;
  if (cars.length === 0) return <div className="text-center mt-20 font-bold">You've swiped through all local cars! Check back later.</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] overflow-hidden bg-gray-50">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Swipe Right to Match</h2>
      
      {/* The Deck Container */}
      <div className="relative w-full max-w-sm h-[400px]">
        {cars.map((car) => (
          <TinderCard
            className="absolute w-full h-full cursor-grab active:cursor-grabbing"
            key={car.id}
            onSwipe={(dir) => onSwipe(dir, car.id)}
            onCardLeftScreen={() => onCardLeftScreen(car.vin)}
            preventSwipe={['up', 'down']} // We only want Left/Right like Tinder
          >
            {/* The Physical Card UI */}
            <div className="relative w-full h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col">
              
              {/* Placeholder Image (You can wire up real images later) */}
              <div className="h-2/3 bg-gray-300 flex items-center justify-center text-gray-500 text-lg font-bold">
                {car.year} {car.make} {car.model}
              </div>
              
              {/* Car Data & Distance */}
              <div className="h-1/3 p-4 bg-white flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">${car.price}</h3>
                  <p className="text-gray-600 font-medium">{car.mileage.toLocaleString()} miles</p>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm">
                  <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full font-bold">
                    {car.distance_miles} mi away
                  </span>
                  <span className="text-gray-400 text-xs">VIN: {car.vin.slice(-6)}</span>
                </div>
              </div>

            </div>
          </TinderCard>
        ))}
      </div>
      
      <p className="mt-8 text-gray-400 text-sm">Swipe Left to Pass • Swipe Right to Escrow</p>
    </div>
  );
};

export default SwipeDeck;
