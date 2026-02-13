import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrophyCard = ({ title }) => {
    // Check if platinum trophy is earned
    const hasPlatinum = title.earnedTrophies?.platinum > 0;

    // Platform badge styling
    const getPlatformInfo = (platform) => {
        if (platform?.includes('PS5')) return { text: 'PS5', color: 'bg-blue-600' };
        if (platform?.includes('PS4')) return { text: 'PS4', color: 'bg-blue-500' };
        if (platform?.includes('VITA')) return { text: 'Vita', color: 'bg-purple-500' };
        if (platform?.includes('PS3')) return { text: 'PS3', color: 'bg-gray-600' };
        return { text: 'PSN', color: 'bg-gray-500' };
    };

    const platformInfo = getPlatformInfo(title.trophyTitlePlatform);

    return (
        <Link to={`/game/${title.npCommunicationId}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                transition={{ duration: 0.2 }}
                className={`bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden cursor-pointer 
                    shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300
                    ${hasPlatinum ? 'ring-2 ring-blue-400 shadow-blue-400/30' : 'border border-white/10'}`}
            >
                {/* Game Image */}
                <div className="relative h-40 overflow-hidden">
                    <img
                        src={title.trophyTitleIconUrl}
                        alt={title.trophyTitleName}
                        className="w-full h-full object-cover"
                    />
                    {/* Platform Badge */}
                    <div className={`absolute top-2 right-2 ${platformInfo.color} text-white text-xs font-bold px-2 py-1 rounded`}>
                        {platformInfo.text}
                    </div>
                    {/* Platinum Badge */}
                    {hasPlatinum && (
                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                            <Trophy size={12} />
                            Platino
                        </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0f0f15] to-transparent"></div>
                </div>

                {/* Game Info */}
                <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-1">{title.trophyTitleName}</h3>

                    {/* Trophy Counts */}
                    <div className="flex justify-between items-center text-sm mb-3">
                        <div className="flex gap-2">
                            {title.definedTrophies?.platinum > 0 && (
                                <span className="text-blue-300 flex items-center gap-1">
                                    <Trophy size={14} /> {title.earnedTrophies?.platinum || 0}/{title.definedTrophies?.platinum || 0}
                                </span>
                            )}
                            <span className="text-yellow-300">
                                {title.earnedTrophies?.gold || 0}/{title.definedTrophies?.gold || 0}
                            </span>
                            <span className="text-gray-300">
                                {title.earnedTrophies?.silver || 0}/{title.definedTrophies?.silver || 0}
                            </span>
                            <span className="text-orange-300">
                                {title.earnedTrophies?.bronze || 0}/{title.definedTrophies?.bronze || 0}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${title.progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 text-right">{title.progress}% completado</p>
                </div>
            </motion.div>
        </Link>
    );
};

export default TrophyCard;
