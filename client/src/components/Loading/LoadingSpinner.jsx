import React from 'react';

/**
 * Standardized loading spinner component
 * @param {string} size - Size of spinner: 'sm' (h-4 w-4), 'md' (h-8 w-8), 'lg' (h-12 w-12)
 * @param {string} text - Optional text to display below spinner
 * @param {boolean} inline - If true, renders inline without container padding. If false, renders in centered container
 * @param {string} className - Additional CSS classes
 * @param {string} color - Spinner color: 'blue' (default), 'white'
 */
function LoadingSpinner({ 
    size = 'md', 
    text = '', 
    inline = false,
    className = '',
    color = 'blue'
}) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    const colorClasses = {
        blue: 'border-blue-200 border-t-blue-600',
        white: 'border-white/30 border-t-white',
    };

    const spinner = (
        <div className={`${sizeClasses[size]} border-4 ${colorClasses[color]} rounded-full animate-spin ${inline ? '' : 'mb-2'}`}></div>
    );

    if (inline) {
        return (
            <div className={`flex items-center ${className}`}>
                {spinner}
                {text && <span className={`ml-2 text-sm ${color === 'white' ? 'text-white' : 'text-gray-600'}`}>{text}</span>}
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
            {spinner}
            {text && <p className={`text-sm ${color === 'white' ? 'text-white' : 'text-gray-600'}`}>{text}</p>}
        </div>
    );
}

export default LoadingSpinner;

