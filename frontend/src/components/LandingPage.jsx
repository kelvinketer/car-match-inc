import { useState, useEffect } from 'react';
import axios from 'axios';
import VehicleCard from './VehicleCard';
import ChatUI from './ChatUI';
import SupportBot from './SupportBot';
import AuthModals from './AuthModals'; // NEW: Secure entry point

// Dynamically route to Render in production, or localhost during development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  
  // Real User State: Replaces the testUserId toggle
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('username') || null);

  // Smart Match Algorithm States
  const [matchMake, setMatchMake] = useState('');
  const [matchMaxPrice, setMatchMaxPrice] = useState('');
  const [matchVerified, setMatchVerified] = useState(false);

  // Dynamic filtering engine
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        // UPDATED: Using the dynamic API_BASE_URL
        const res = await axios.get(`${API_BASE_URL}/api/vehicles/`, {
          params: {
            make: matchMake,
            max_price: matchMaxPrice,
            verified_only: matchVerified ? 'true' : ''
          }
        });
        setVehicles(res.data);
      } catch (err) {
        console.error("Error fetching vehicles", err);
      }
    };
    fetchVehicles();
  }, [matchMake, matchMaxPrice, matchVerified]); 

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    setStatusMessage(''); 
    setIsError(false);

    try {
      // UPDATED: Using the dynamic API_BASE_URL
      const response = await axios.post(`${API_BASE_URL}/api/waitlist/`, {
        email: email
      });
      
      setStatusMessage(response.data.message);
      setEmail('');
    } catch (error) {
      setIsError(true);
      if (error.response && error.response.data.error) {
        setStatusMessage(error.response.data.error);
      } else {
        setStatusMessage("Could not connect to the server. Is Django running?");
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col relative">
      {/* Navigation Bar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white text-xl shadow-md">
            🫂
          </div>
          <div className="text-2xl font-bold text-brand-dark tracking-tight">
            Car Match <span className="text-brand-primary">Inc.</span>
          </div>
        </div>
        
        {currentUser ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-brand-dark">Welcome, {currentUser}</span>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 text-red-500 font-medium hover:bg-red-50 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <button className="hidden md:block px-6 py-2 text-brand-dark font-medium hover:text-brand-primary transition-colors">
            Member Access
          </button>
        )}
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center text-center px-6 mt-12 mb-24">
        <h1 className="text-5xl md:text-7xl font-extrabold text-brand-dark max-w-4xl tracking-tight leading-tight mb-6">
          The smarter way to meet your <span className="text-brand-primary">next car.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10">
          Swipe right on verified private sellers. Integrated escrow, smart titles, and zero dealership fees. Experience the first peer-to-peer car marketplace built on absolute trust.
        </p>

        {/* Waitlist Form */}
        <div className="w-full max-w-md flex flex-col items-center">
          <form onSubmit={handleJoinWaitlist} className="w-full flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-grow px-4 py-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm text-brand-dark"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className="px-8 py-4 bg-brand-primary hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105"
            >
              Join Waitlist
            </button>
          </form>
          {statusMessage && (
            <p className={`mt-4 text-sm font-medium ${isError ? 'text-red-500' : 'text-green-600'}`}>
              {statusMessage}
            </p>
          )}
        </div>
      </main>

      {/* Vehicle Feed Section */}
      <section className="bg-white py-16 px-6 border-t border-gray-200 w-full">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-extrabold text-brand-dark mb-8">Verified Inventory</h2>

          {/* Smart Match Control Panel */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <select 
                className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none bg-white font-medium"
                value={matchMake}
                onChange={(e) => setMatchMake(e.target.value)}
              >
                <option value="">Any Make</option>
                <option value="Tesla">Tesla</option>
                <option value="Toyota">Toyota</option>
                <option value="Ford">Ford</option>
              </select>

              <input 
                type="number" 
                placeholder="Max Price ($)" 
                className="px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-primary outline-none w-full sm:w-40 font-medium"
                value={matchMaxPrice}
                onChange={(e) => setMatchMaxPrice(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer bg-white px-5 py-3 rounded-xl border border-gray-300 shadow-sm w-full md:w-auto hover:bg-gray-50 transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-brand-primary rounded focus:ring-brand-primary"
                checked={matchVerified}
                onChange={(e) => setMatchVerified(e.target.checked)}
              />
              <span className="text-sm font-bold text-brand-dark">Verified Matches Only</span>
            </label>
          </div>
          
          {vehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
              <p className="text-gray-500 font-medium text-lg">No vehicles match your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* Real-time Secure Negotiation Section */}
      <section className="bg-gray-100 py-16 px-6 w-full border-t border-gray-300">
        <div className="max-w-3xl mx-auto">
          {currentUser ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-brand-dark mb-6">Live Secure Chat</h2>
              {/* Note: In a full app, the roomId would be dynamic based on the vehicle clicked */}
              <ChatUI roomId={1} currentUserId={currentUser} />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold text-brand-dark mb-4 text-center">Ready to negotiate?</h2>
              <p className="text-gray-600 mb-8 text-center max-w-sm">
                Login or create a secure account to message verified sellers directly and start the escrow process.
              </p>
              <AuthModals onLoginSuccess={(user) => setCurrentUser(user)} />
            </div>
          )}
        </div>
      </section>

      <SupportBot />
    </div>
  );
}