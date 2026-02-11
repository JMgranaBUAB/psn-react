import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const TrophyCard = ({ title, index }) => {
    // Determine gradient based on generic status or type if available
    // For now using a generic cool gradient

    return (
        <Link to={`/game/${title.npCommunicationId}`}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/80 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden shadow-lg group hover:shadow-purple-500/20 hover:border-purple-500/30 transition-all duration-300 h-full flex flex-col cursor-pointer"
            >
                <div className="aspect-video relative overflow-hidden">
                    <img
                        src={title.trophyTitleIconUrl || 'https://via.placeholder.com/300x169'}
                        alt={title.trophyTitleName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-80" />

                    <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-white font-semibold text-lg truncate drop-shadow-md">{title.trophyTitleName}</h3>
                        <p className="text-gray-300 text-xs">{title.platform}</p>
                    </div>
                </div>

                <div className="p-4 flex items-center justify-between mt-auto">
                    <div className="flex space-x-2">
                        <div className="flex items-center space-x-1 text-blue-400" title="Platinum">
                            <Trophy size={14} />
                            <span className="text-xs font-mono">{title.earnedTrophies?.platinum || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-yellow-400" title="Gold">
                            <Trophy size={14} />
                            <span className="text-xs font-mono">{title.earnedTrophies?.gold || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-gray-300" title="Silver">
                            <Trophy size={14} />
                            <span className="text-xs font-mono">{title.earnedTrophies?.silver || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-orange-400" title="Bronze">
                            <Trophy size={14} />
                            <span className="text-xs font-mono">{title.earnedTrophies?.bronze || 0}</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase">Progress</div>
                        <div className="text-sm font-bold text-white">{title.progress}%</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1 w-full bg-gray-800">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${title.progress}%` }}
                    />
                </div>
            </motion.div>
        </Link>
    );
};

export default TrophyCard;
