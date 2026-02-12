import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Lock, Unlock, Loader2 } from 'lucide-react';

const GameTrophies = () => {
    const { npCommunicationId } = useParams();
    const [trophies, setTrophies] = useState([]);
    const [titleName, setTitleName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTrophies = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:3001/api/titles/${npCommunicationId}/trophies`);

                const fetchedTrophies = response.data.trophies || [];
                // Sort by rarity (lowest rate = rarest)
                const sortedTrophies = [...fetchedTrophies].sort((a, b) => {
                    return parseFloat(a.trophyEarnedRate || 0) - parseFloat(b.trophyEarnedRate || 0);
                });

                setTrophies(sortedTrophies);
                setTitleName(response.data.titleName || '');
            } catch (err) {
                console.error("Error fetching game trophies:", err);
                setError("Failed to load trophies.");
            } finally {
                setLoading(false);
            }
        };

        if (npCommunicationId) {
            fetchTrophies();
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
        <div className="min-h-screen bg-[#0f0f15] text-white font-sans p-8">
            <div className="max-w-4xl mx-auto">
                <Link to="/" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </Link>

                <h1 className="text-3xl font-bold mb-8 flex items-center">
                    <Trophy className="text-yellow-500 mr-3" size={32} />
                    {titleName || 'Game Trophies'}
                </h1>

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
        </div>
    );
};

export default GameTrophies;
