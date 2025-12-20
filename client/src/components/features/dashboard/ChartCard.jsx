// ChartCard.js
import React from 'react';

const ChartCard = ({ title, children }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col h-full">
            {title && (
                <div className="font-bold text-sm mb-3 pb-2 border-b border-gray-200 uppercase text-gray-700">
                    {title}
                </div>
            )}
            <div className="chart-card-content flex-1 flex flex-col">
                {children}
            </div>
        </div>
    );
};

export default ChartCard;