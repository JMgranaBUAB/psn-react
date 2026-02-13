import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Gamepad2, Loader2, AlertCircle, LogOut } from 'lucide-react';
import UserProfile from './components/UserProfile';
import TrophyList from './components/TrophyList';
import GameTrophies from './pages/GameTrophies';
import Login from './pages/Login';

// Configure global axios defaults for consistency
axios.defaults.timeout = 10000; // 10 seconds global timeout

function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const API_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.')
        ? `http://${window.location.hostname}:3001`
        : '';
      const npsso = localStorage.getItem('psn_npsso');
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        headers: npsso ? { 'Authorization': `Bearer ${npsso}` } : {}
      });
      localStorage.removeItem('psn_npsso');
      navigate('/login');
    } catch (err) {
      console.error("Error logging out:", err);
      // Even if API fails, clear local storage and navigate
      localStorage.removeItem('psn_npsso');
      navigate('/login');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const API_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.')
          ? `http://${window.location.hostname}:3001`
          : '';

        const npsso = localStorage.getItem('psn_npsso');
        const config = {
          headers: npsso ? { 'Authorization': `Bearer ${npsso}` } : {},
          timeout: 8000 // 8s timeout for fetching data
        };

        // 1. Fetch Profile
        const profileRes = await axios.get(`${API_URL}/api/profile/me`, config);
        setProfile(profileRes.data);

        // 2. Fetch Trophies (Titles)
        const trophiesRes = await axios.get(`${API_URL}/api/trophies/me`, config);
        setTitles(trophiesRes.data?.trophyTitles || []);

      } catch (err) {
        console.error("Error fetching PSN data:", err);
        if (err.code === 'ECONNABORTED') {
          setError("La conexión con PlayStation ha tardado demasiado. Por favor, reintenta.");
        } else {
          setError(err.response?.data?.error || "Error al cargar los datos. Verifica tu conexión.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f15] text-white font-sans selection:bg-purple-500 selection:text-white">
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
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors px-3 py-1 bg-white/5 hover:bg-red-500/10 rounded-lg border border-white/5 hover:border-red-500/20"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium text-white">Salir</span>
          </button>
        </header>

        <main>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[60vh]">
              <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
              <p className="text-gray-400 animate-pulse">Conectando con PlayStation Network...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
              <AlertCircle className="text-red-500 mb-4" size={48} />
              <h2 className="text-xl font-bold mb-2">Error de Conexión</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-lg shadow-purple-500/20"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              {profile && <UserProfile profile={profile} />}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  Juegos Recientes
                </h3>
                <TrophyList titles={titles} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [isAuth, setIsAuth] = useState(null); // null = checking, true = auth, false = no auth

  useEffect(() => {
    // 10 second fallback to prevent infinite gray screen
    const timer = setTimeout(() => {
      if (isAuth === null) {
        console.warn("Auth check timed out, falling back to login.");
        setIsAuth(false);
      }
    }, 10000);

    const checkAuth = async () => {
      try {
        const API_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.')
          ? `http://${window.location.hostname}:3001`
          : '';

        const npsso = localStorage.getItem('psn_npsso');
        if (!npsso) {
          setIsAuth(false);
          clearTimeout(timer);
          return;
        }

        const { data } = await axios.get(`${API_URL}/api/auth/status`, {
          headers: { 'Authorization': `Bearer ${npsso}` },
          timeout: 6000 // 6s timeout for initial check
        });

        if (data.authenticated) {
          setIsAuth(true);
        } else {
          // If session expired on server, try to login again with NPSSO
          try {
            const loginRes = await axios.post(`${API_URL}/api/auth/login`,
              { npsso },
              { headers: { 'Authorization': `Bearer ${npsso}` }, timeout: 8000 }
            );
            if (loginRes.data.success) {
              setIsAuth(true);
            } else {
              setIsAuth(false);
            }
          } catch (e) {
            console.error("Auto-login failed:", e);
            setIsAuth(false);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuth(false);
      } finally {
        clearTimeout(timer);
      }
    };

    checkAuth();
    return () => clearTimeout(timer);
  }, []);

  if (isAuth === null) {
    return (
      <div className="min-h-screen bg-[#0f0f15] flex items-center justify-center">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={() => setIsAuth(true)} />} />
        <Route
          path="/"
          element={isAuth ? <Dashboard /> : <Login onLoginSuccess={() => setIsAuth(true)} />}
        />
        <Route
          path="/game/:npCommunicationId"
          element={isAuth ? <GameTrophies /> : <Login onLoginSuccess={() => setIsAuth(true)} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
