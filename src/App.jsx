import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import CurrentWeather from './pages/CurrentWeather';
import Historical from './pages/Historical';
import './App.css';

export default function App() {
  const [coords, setCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  useEffect(() => {
    // Step 1: get a fast IP-based location immediately so fetch can start right away
    const ipFallback = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.latitude && data.longitude) {
          setCoords(c => c || { lat: data.latitude, lon: data.longitude });
        }
      } catch {
        // ignore, GPS will handle it
      }
    };
    ipFallback();

    // Step 2: get precise GPS in parallel, override IP coords when ready
    if (!navigator.geolocation) {
      setGpsError('Geolocation not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {
        setCoords(c => c || { lat: 19.076, lon: 72.8777 });
        setGpsError('GPS access denied — using approximate location.');
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⛅</span>
              <span className="text-white font-bold text-lg">Weather Dashboard</span>
            </div>
            <div className="flex gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-blue-500 text-white' : 'text-blue-200 hover:bg-white/10'}`
                }
              >Today</NavLink>
              <NavLink
                to="/historical"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-blue-500 text-white' : 'text-blue-200 hover:bg-white/10'}`
                }
              >Historical</NavLink>
            </div>
          </div>
        </nav>

        {/* GPS banner */}
        {gpsError && (
          <div className="bg-yellow-500/20 border-b border-yellow-500/30 text-yellow-200 text-xs text-center py-2 px-4">
            ⚠️ {gpsError}
          </div>
        )}

        {/* Coords info */}
        {coords && (
          <div className="text-center text-blue-300/50 text-xs py-1">
            📍 {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}
          </div>
        )}

        <Routes>
          <Route path="/" element={<CurrentWeather coords={coords} />} />
          <Route path="/historical" element={<Historical coords={coords} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
