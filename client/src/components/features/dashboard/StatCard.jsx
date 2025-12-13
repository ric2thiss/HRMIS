// StatCard.js
import React from 'react';
import LoadingSpinner from '../../Loading/LoadingSpinner';

const StatCard = ({ title, value, icon, bgColorClass, hoverClass, loading = false }) => {
    return (
        <div className={`text-white p-4 sm:p-5 rounded-lg shadow-md h-24 sm:h-28 flex flex-col justify-between ${bgColorClass} transition duration-300 ${hoverClass}`}>
            <div className="text-xs opacity-80 uppercase font-semibold">
                {title}
            </div>
            <div className="flex justify-between items-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
                    {loading ? (
                        <LoadingSpinner size="md" inline={true} color="white" className="py-0" />
                    ) : (
                        value
                    )}
                </div>
                <div className="text-xl sm:text-2xl">
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;