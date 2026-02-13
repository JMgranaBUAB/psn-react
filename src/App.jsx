import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Gamepad2, Loader2, AlertCircle, LogOut, Trophy } from 'lucide-react';
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
          timeout: 20000 // 20s timeout for fetching data (PSN can be slow)
        };

        console.log("Dashboard: Fetching profile and trophies in parallel...");

        // Parallel fetching to save time and stay within Vercel execution limits
        const [profileRes, trophiesRes] = await Promise.all([
          axios.get(`${API_URL}/api/profile/me`, config),
          axios.get(`${API_URL}/api/trophies/me`, config)
        ]);

        console.log("Dashboard: Data received successfully.");
        setProfile(profileRes.data);
        setTitles(trophiesRes.data?.trophyTitles || []);

      } catch (err) {
        console.error("Error fetching PSN data:", err);
        const errorMsg = err.response?.data?.error || err.message || "Error al cargar los datos.";
        setError(errorMsg);
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
              <p className="text-gray-400 animate-pulse font-medium">Conectando con PlayStation Network...</p>
              <p className="text-[10px] text-gray-600 mt-4 max-w-xs text-center leading-relaxed">
                Estamos recuperando tu perfil y tus últimos trofeos. La primera vez puede tardar un poco mientras la nube despierta.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-lg mx-auto px-6">
              <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl backdrop-blur-xl">
                <AlertCircle className="text-red-500 mx-auto mb-6" size={64} />
                <h2 className="text-2xl font-bold mb-3 text-white">Oops! Algo no salió bien</h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                  {error.includes("timeout")
                    ? "La conexión con PlayStation ha tardado demasiado. Esto suele pasar si los servidores de Sony están lentos o si es el primer arranque."
                    : error}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-purple-500/25 active:scale-95"
                  >
                    Reintentar ahora
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-all font-medium border border-white/10"
                  >
                    Cambiar código NPSSO
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {profile && <UserProfile profile={profile} />}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <Trophy size={20} className="text-yellow-500" />
                  Juegos Recientes
                </h3>
                <TrophyList titles={titles} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [isAuth, setIsAuth] = useState(null); // null = checking, true = auth, false = no auth
  const [runtimeError, setRuntimeError] = useState(null);

  useEffect(() => {
    // Catch window errors to prevent blank screen
    const handleError = (e) => setRuntimeError(e.message);
    window.addEventListener('error', handleError);

    // 45 second safety fallback (increased for very slow cold starts)
    const timer = setTimeout(() => {
      if (isAuth === null) {
        console.warn("Auth check timed out after 45s, falling back to login.");
        setIsAuth(false);
      }
    }, 45000);

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
          timeout: 20000
        });

        if (data.authenticated) {
          setIsAuth(true);
        } else {
          try {
            const loginRes = await axios.post(`${API_URL}/api/auth/login`,
              { npsso },
              { headers: { 'Authorization': `Bearer ${npsso}` }, timeout: 25000 }
            );
            if (loginRes.data.success) setIsAuth(true);
            else setIsAuth(false);
          } catch (e) {
            setIsAuth(false);
          }
        }
      } catch (err) {
        setIsAuth(false);
      } finally {
        clearTimeout(timer);
      }
    };

    checkAuth();
    return () => {
      clearTimeout(timer);
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (runtimeError) {
    return (
      <div className="min-h-screen bg-[#0f0f15] flex items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h1 className="text-xl font-bold text-white mb-2">Error Crítico del Navegador</h1>
          <p className="text-gray-400 text-sm mb-6">{runtimeError}</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="text-purple-400 underline">Borrar todo y reiniciar</button>
        </div>
      </div>
    );
  }

  if (isAuth === null) {
    return (
      <div className="min-h-screen bg-[#0f0f15] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
          <p className="text-gray-600 text-xs animate-pulse">Verificando sesión segura...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={() => setIsAuth(true)} />} />
        <Route path="/" element={isAuth ? <Dashboard /> : <Login onLoginSuccess={() => setIsAuth(true)} />} />
        <Route path="/game/:npCommunicationId" element={isAuth ? <GameTrophies /> : <Login onLoginSuccess={() => setIsAuth(true)} />} />
      </Routes>
    </Router>
  );
}

export default App;
