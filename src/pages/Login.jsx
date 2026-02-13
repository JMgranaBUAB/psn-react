import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Shield, Key, Info, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [npsso, setNpsso] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (npsso.length !== 64) {
            setError('El código NPSSO debe tener exactamente 64 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const API_URL = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168.')
                ? `http://${window.location.hostname}:3001`
                : '';
            const response = await axios.post(`${API_URL}/api/auth/login`,
                { npsso },
                { headers: { 'Authorization': `Bearer ${npsso}` } }
            );
            if (response.data.success) {
                // Store in localStorage for persistence across sessions
                localStorage.setItem('psn_npsso', npsso);
                if (onLoginSuccess) onLoginSuccess();
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al autenticar. Verifica el código NPSSO.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f15] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg z-10"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="inline-flex p-4 bg-purple-500/10 rounded-2xl mb-4 border border-purple-500/20 shadow-lg shadow-purple-500/5"
                    >
                        <Shield size={48} className="text-purple-500" />
                    </motion.div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        PSN Trophies Viewer
                    </h1>
                    <p className="text-gray-400 mt-2 text-lg">Inicia sesión en tu cuenta para ver tus trofeos</p>
                </div>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                                <Key size={16} className="text-purple-400" />
                                Código NPSSO
                            </label>
                            <input
                                type="password"
                                value={npsso}
                                onChange={(e) => setNpsso(e.target.value.trim())}
                                placeholder="Pega aquí tu código de 64 caracteres"
                                className="w-full bg-[#1a1a25] border border-white/10 rounded-xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-mono text-sm"
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
                            >
                                <AlertCircle size={18} className="flex-shrink-0" />
                                <p>{error}</p>
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 group"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>Conectar con PSN</span>
                                    <CheckCircle size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <button
                            onClick={() => setShowInstructions(!showInstructions)}
                            className="w-full flex items-center justify-between text-gray-400 hover:text-white transition-colors group"
                        >
                            <div className="flex items-center gap-2">
                                <Info size={18} className="text-blue-400" />
                                <span className="text-sm font-medium">¿Qué es el código NPSSO y cómo se obtiene?</span>
                            </div>
                            <ExternalLink size={16} className={`transition-transform ${showInstructions ? 'rotate-180' : ''}`} />
                        </button>

                        <motion.div
                            initial={false}
                            animate={{ height: showInstructions ? 'auto' : 0, opacity: showInstructions ? 1 : 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-4 space-y-4 text-sm text-gray-400 leading-relaxed">
                                <p>Por seguridad de Sony, no podemos pedirte tu contraseña directamente. El código **NPSSO** es una llave segura que te permite ver tus trofeos.</p>
                                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="flex items-start gap-3">
                                        <span className="w-5 h-5 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                                        <span>Inicia sesión en <a href="https://www.playstation.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1">PlayStation.com <ExternalLink size={10} /></a></span>
                                    </p>
                                    <p className="flex items-start gap-3">
                                        <span className="w-5 h-5 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                                        <span>Luego, visita esta dirección en la misma pestaña: <a href="https://ca.account.sony.com/api/v1/ssocookie" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all">ca.account.sony.com/api/v1/ssocookie</a></span>
                                    </p>
                                    <p className="flex items-start gap-3">
                                        <span className="w-5 h-5 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                                        <span>Copia el código de 64 letras y números que aparece donde dice **"npsso": "..."**</span>
                                    </p>
                                </div>
                                <p className="text-[11px] text-gray-500 italic flex items-center gap-2">
                                    <Shield size={12} />
                                    Tus datos se manejan de forma local y nunca se comparten.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="text-center mt-8 text-xs text-gray-600">
                    PSN Trophies Viewer &bull; Built for Gamers
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
