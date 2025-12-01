import React from 'react';

function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2`}></div>
            {text && <p className="text-sm text-gray-600">{text}</p>}
        </div>
    );
}

export default LoadingSpinner;

