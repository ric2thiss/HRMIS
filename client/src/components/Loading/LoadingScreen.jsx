import React from 'react';
import Logo from '../../asset/DICT logo.svg'
function LoadingScreen() {
    return (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
            {/* Logo */}
            <div className="mb-4">
                {/* TODO: Replace '/your-logo.svg' with the actual path to your logo. 
                  Ensure the image is in your public folder or imported correctly.
                */}
                <img 
                    src={Logo} 
                    alt="Company Logo" 
                    className="h-24 w-auto animate-pulse" // h-24 is 6rem/96px
                />
            </div>
            
            {/* Loading text */}
            <p className="text-xl font-semibold text-gray-700">Loading...</p>
        </div>
    );
}

export default LoadingScreen;