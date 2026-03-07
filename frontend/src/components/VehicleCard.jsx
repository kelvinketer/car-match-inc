export default function VehicleCard({ vehicle }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
        {/* Placeholder for Car Image */}
        <span className="text-xs uppercase font-bold tracking-widest">Image Coming Soon</span>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-brand-dark">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
          {vehicle.is_verified_match && (
            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
              Verified Match
            </span>
          )}
        </div>
        <p className="text-2xl font-black text-brand-primary mb-4">${parseFloat(vehicle.asking_price).toLocaleString()}</p>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-2">
            <span>🛣️ {vehicle.mileage.toLocaleString()} mi</span>
          </div>
          <div className="flex items-center gap-2">
            <span>👤 {vehicle.seller_name}</span>
          </div>
        </div>
        <button className="w-full py-3 bg-brand-dark text-white font-bold rounded-xl hover:bg-opacity-90 transition-all">
          View Details
        </button>
      </div>
    </div>
  );
}
