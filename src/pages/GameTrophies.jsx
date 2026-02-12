import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Lock, Unlock, Loader2, RefreshCw } from 'lucide-react';

const GameTrophies = () => {
    const { npCommunicationId } = useParams();
    const [groupedTrophies, setGroupedTrophies] = useState({});
    const [titleName, setTitleName] = useState('');
    const [platform, setPlatform] = useState('');
    const [trophyGroupNames, setTrophyGroupNames] = useState({});
    const [translations, setTranslations] = useState({});
    const [filter, setFilter] = useState('all'); // 'all', 'earned', 'unearned'
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Translation function using MyMemory API
    const translateText = async (text, trophyId) => {
        // Skip if already translated or text is too short
        if (translations[trophyId] || text.length < 10) return;

        try {
            const response = await axios.get(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`
            );

            if (response.data.responseData.translatedText) {
                const translated = response.data.responseData.translatedText;
                // Only use translation if it's different from original
                if (translated.toLowerCase() !== text.toLowerCase()) {
                    setTranslations(prev => ({
                        ...prev,
                        [trophyId]: translated
                    }));
                }
            }
        } catch (err) {
            // Silently fail - translation is optional
            console.debug('Translation failed for:', trophyId);
        }
    };

    const fetchTrophies = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await axios.get(`http://localhost:3001/api/titles/${npCommunicationId}/trophies`);

            const fetchedTrophies = response.data.trophies || [];

            // Group by trophyGroupId
            const groups = {};
            fetchedTrophies.forEach(trophy => {
                const groupId = trophy.trophyGroupId || 'default';
                if (!groups[groupId]) {
                    groups[groupId] = [];
                }
                groups[groupId].push(trophy);
            });

            // Sort each group by rarity
            Object.keys(groups).forEach(groupId => {
                groups[groupId].sort((a, b) => {
                    return parseFloat(a.trophyEarnedRate || 0) - parseFloat(b.trophyEarnedRate || 0);
                });
            });

            setGroupedTrophies(groups);
            setTitleName(response.data.titleName || '');
            setPlatform(response.data.platform || '');
            setTrophyGroupNames(response.data.trophyGroups || {});

            // Translate trophy descriptions (with small delay to avoid rate limiting)
            if (isManualRefresh === false) {
                Object.values(groups).flat().forEach((trophy, index) => {
                    setTimeout(() => {
                        translateText(trophy.trophyDetail, trophy.trophyId);
                    }, index * 200);
                });
            }
        } catch (err) {
            console.error("Error fetching game trophies:", err);
            setError("Failed to load trophies.");
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (npCommunicationId) {
            fetchTrophies();

            // Auto-refresh every 60 seconds
            const intervalId = setInterval(() => {
                fetchTrophies(true);
            }, 60000);

            return () => clearInterval(intervalId);
        }
    }, [npCommunicationId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0f0f15] text-white">
                <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
                <p className="text-gray-400">Loading trophies...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#0f0f15] text-white">
                <p className="text-red-500 mb-4">{error}</p>
                <Link to="/" className="text-purple-400 hover:text-purple-300 flex items-center">
                    <ArrowLeft size={20} className="mr-2" /> Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f15] text-white font-sans px-6 py-8">
            <div className="max-w-5xl mx-auto w-full">
                <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </Link>

                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-3xl font-bold flex items-center">
                        <Trophy className="text-yellow-500 mr-3" size={32} />
                        {titleName || 'Game Trophies'}
                    </h1>
                    <div className="flex items-center gap-3">
                        {platform && (
                            <span className={`px-3 py-1 rounded text-sm font-semibold ${platform.includes('PS5') ? 'bg-blue-600' :
                                platform.includes('PS4') ? 'bg-blue-500' :
                                    platform.includes('VITA') ? 'bg-purple-500' :
                                        platform.includes('PS3') ? 'bg-gray-600' :
                                            'bg-gray-500'
                                }`}>
                                {platform.includes('PS5') ? 'PS5' :
                                    platform.includes('PS4') ? 'PS4' :
                                        platform.includes('VITA') ? 'Vita' :
                                            platform.includes('PS3') ? 'PS3' : 'PSN'}
                            </span>
                        )}
                        <button
                            onClick={() => fetchTrophies(true)}
                            disabled={isRefreshing}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Actualizar trofeos"
                        >
                            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex gap-3 mb-8">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all'
                            ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('earned')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'earned'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        Obtenidos
                    </button>
                    <button
                        onClick={() => setFilter('unearned')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'unearned'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                            }`}
                    >
                        No obtenidos
                    </button>
                </div>

                <div className="space-y-8">
                    {Object.keys(groupedTrophies).map((groupId) => {
                        const groupName = groupId === 'default'
                            ? 'Base Game'
                            : (trophyGroupNames[groupId] || `DLC: ${groupId}`);
                        let trophies = groupedTrophies[groupId];

                        // Apply filter
                        if (filter === 'earned') {
                            trophies = trophies.filter(t => t.earned);
                        } else if (filter === 'unearned') {
                            trophies = trophies.filter(t => !t.earned);
                        }

                        // Skip empty groups after filtering
                        if (trophies.length === 0) return null;

                        return (
                            <div key={groupId}>
                                <h2 className="text-xl font-semibold mb-3 flex items-center text-purple-400">
                                    <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                                    {groupName}
                                </h2>

                                {/* Trophy Statistics */}
                                <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
                                    <div className="grid grid-cols-4 gap-4 text-center">
                                        {['platinum', 'gold', 'silver', 'bronze'].map(type => {
                                            const total = trophies.filter(t => t.trophyType === type).length;
                                            const earned = trophies.filter(t => t.trophyType === type && t.earned).length;
                                            const pending = total - earned;

                                            if (total === 0) return null;

                                            return (
                                                <div key={type} className="flex flex-col">
                                                    <div className={`text-2xl font-bold ${type === 'platinum' ? 'text-blue-300' :
                                                        type === 'gold' ? 'text-yellow-300' :
                                                            type === 'silver' ? 'text-gray-300' :
                                                                'text-orange-300'
                                                        }`}>
                                                        {earned}/{total}
                                                    </div>
                                                    <div className="text-xs text-gray-500 uppercase mt-1">{type}</div>
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {pending > 0 ? `${pending} pendiente${pending > 1 ? 's' : ''}` : '✓ Completo'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {trophies.map((trophy, index) => (
                                        <motion.div
                                            key={trophy.trophyId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`flex items-center p-4 rounded-xl border ${trophy.earned ? 'bg-purple-900/20 border-purple-500/30' : 'bg-white/5 border-white/5'} backdrop-blur-sm hover:bg-white/10 transition-colors`}
                                        >
                                            <div className="flex-shrink-0 mr-4 relative">
                                                <img
                                                    src={trophy.trophyIconUrl}
                                                    alt={trophy.trophyName}
                                                    className={`w-16 h-16 rounded-md object-cover ${!trophy.earned ? 'grayscale opacity-50' : ''}`}
                                                />
                                                {trophy.earned && (
                                                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-[#0f0f15]">
                                                        <Unlock size={12} className="text-black" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <h3 className={`font-bold text-lg ${trophy.earned ? 'text-white' : 'text-gray-400'}`}>
                                                        {trophy.trophyName}
                                                    </h3>
                                                    <span className={`text-xs px-2 py-1 rounded font-mono uppercase tracking-wider
                                                        ${trophy.trophyType === 'platinum' ? 'bg-blue-500/20 text-blue-300' :
                                                            trophy.trophyType === 'gold' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                trophy.trophyType === 'silver' ? 'bg-gray-400/20 text-gray-300' :
                                                                    'bg-orange-500/20 text-orange-300'
                                                        }`}>
                                                        {trophy.trophyType}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-sm mt-1">{trophy.trophyDetail}</p>
                                                {translations[trophy.trophyId] && (
                                                    <p className="text-blue-300 text-sm mt-1 italic">
                                                        {translations[trophy.trophyId]}
                                                    </p>
                                                )}
                                                <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                                                    <span>Rarity: {trophy.trophyEarnedRate}%</span>
                                                    {trophy.earned && (
                                                        <span className="text-green-400">
                                                            Earned on {new Date(trophy.earnedDateTime).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default GameTrophies;
