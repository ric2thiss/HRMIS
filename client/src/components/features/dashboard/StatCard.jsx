// StatCard.js
import React from 'react';

const StatCard = ({ title, value, icon, bgColorClass, hoverClass }) => {
    return (
        <div className={`text-white p-5 rounded-lg shadow-md h-28 flex flex-col justify-between ${bgColorClass} transition duration-300 ${hoverClass}`}>
            <div className="text-xs opacity-80 uppercase font-semibold">
                {title}
            </div>
            <div className="flex justify-between items-center">
                <div className="text-4xl font-extrabold">
                    {value}
                </div>
                <div className="text-2xl">
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;