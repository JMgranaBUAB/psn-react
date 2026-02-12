import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Gamepad2, Loader2, AlertCircle } from 'lucide-react';
import UserProfile from './components/UserProfile';
import TrophyList from './components/TrophyList';
import GameTrophies from './pages/GameTrophies';

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch MY Profile
        const profileRes = await axios.get(`http://localhost:3001/api/profile/me`);
        setProfile(profileRes.data);

        // 2. Fetch MY Trophies (Titles)
        const trophiesRes = await axios.get(`http://localhost:3001/api/trophies/me`);
        setTitles(trophiesRes.data?.trophyTitles || []);

      } catch (err) {
        console.error("Error fetching PSN data:", err);
        setError("Failed to load data. Please check if the backend is running and the NPSSO token is valid in .env");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f15] text-white font-sans selection:bg-purple-500 selection:text-white">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto px-6 py-8 max-w-6xl w-full">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-2">
            <Gamepad2 className="text-purple-500" size={32} />
            <h1 className="text-2xl font-bold tracking-tight">PSN <span className="text-purple-400">Trophies</span></h1>
          </div>
          <div className="text-sm text-gray-500">
            v1.0.0
          </div>
        </header>

        <main>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
              <p className="text-gray-400 animate-pulse">Connecting to PlayStation Network...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
              <AlertCircle className="text-red-500 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">Connection Error</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {profile && <UserProfile profile={profile} />}

              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                  Recent Games
                </h3>
                <div className="max-w-5xl mx-auto">
                  <TrophyList titles={titles} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/game/:npCommunicationId" element={<GameTrophies />} />
      </Routes>
    </Router>
  );
}

export default App;
