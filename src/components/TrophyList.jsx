import React from 'react';
import TrophyCard from './TrophyCard';

const TrophyList = ({ titles }) => {
    if (!titles || titles.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No game titles found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-4 pb-20 max-w-7xl mx-auto">
            {titles.map((title, index) => (
                <TrophyCard key={title.npCommunicationId || index} title={title} index={index} />
            ))}
        </div>
    );
};

export default TrophyList;
