import React from 'react';
import { motion } from 'framer-motion';

const UserProfile = ({ profile }) => {
    if (!profile) return null;

    const getAvatarUrl = () => {
        const pics = profile.personalDetail?.profilePictures;
        const avatars = profile.avatars;

        if (pics && pics.length > 0) {
            return pics.find(p => p.size === 'xl')?.url || pics[0]?.url || 'https://via.placeholder.com/150';
        }
        if (avatars && avatars.length > 0) {
            return avatars.find(a => a.size === 'xl')?.url || avatars[0]?.url || 'https://via.placeholder.com/150';
        }
        return 'https://via.placeholder.com/150';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-2xl shadow-xl w-full max-w-2xl mx-auto mb-8"
        >
            <div className="flex items-start gap-6">
                {/* Avatar Section */}
                <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-purple-500/50 shadow-lg shadow-purple-500/20">
                        <img
                            src={getAvatarUrl()}
                            alt={profile.onlineId}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-black font-bold text-xs px-2 py-1 rounded-full border-2 border-gray-900">
                        LVL {profile.trophySummary?.level || profile.trophySummary?.trophyLevel || '?'}
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 truncate">
                        {profile.onlineId}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1 truncate">{profile.aboutMe || 'PlayStation Gamer'}</p>

                    {/* Trophy Grid */}
                    <div className="grid grid-cols-5 gap-3 mt-4">
                        <div className="flex flex-col items-center border-r border-white/10 pr-3">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Total</span>
                            <span className="text-lg font-bold text-white">
                                {(profile.trophySummary?.earnedTrophies?.platinum || 0) +
                                    (profile.trophySummary?.earnedTrophies?.gold || 0) +
                                    (profile.trophySummary?.earnedTrophies?.silver || 0) +
                                    (profile.trophySummary?.earnedTrophies?.bronze || 0)}
                            </span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Platinum</span>
                            <span className="text-lg font-bold text-blue-400">{profile.trophySummary?.earnedTrophies?.platinum || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Gold</span>
                            <span className="text-lg font-bold text-yellow-400">{profile.trophySummary?.earnedTrophies?.gold || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Silver</span>
                            <span className="text-lg font-bold text-gray-300">{profile.trophySummary?.earnedTrophies?.silver || 0}</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 uppercase tracking-wider">Bronze</span>
                            <span className="text-lg font-bold text-orange-400">{profile.trophySummary?.earnedTrophies?.bronze || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UserProfile;
