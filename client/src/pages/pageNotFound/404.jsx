import React from 'react';
import { Link } from 'react-router-dom'; // Still assuming you use react-router-dom

/**
 * A simple 404 Not Found component styled with Tailwind CSS.
 */
const NotFoundPage = () => {
  return (
    // Outer container: Full screen height, centered content, light background
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800 p-4">
      
      {/* 404 Title */}
      <h1 className="text-9xl font-extrabold text-red-600 tracking-wider">
        404
      </h1>
      
      {/* Subtitle/Message */}
      <div className="bg-red-600 text-white px-2 text-sm rounded rotate-12 absolute top-1/4">
        ERROR
      </div>
      
      <h2 className="text-3xl font-semibold mt-4 mb-4">
        Page Not Found
      </h2>
      
      {/* Description */}
      <p className="text-lg text-center mb-8 max-w-md">
        Oops! The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      
      {/* Call-to-Action Link */}
      {/* <Link> component is from react-router-dom, pointing to the home route. */}
      <Link 
        to="/" 
        className="
          px-6 py-3 
          text-lg font-medium 
          text-white bg-indigo-600 
          rounded-md 
          hover:bg-indigo-700 
          transition-colors duration-200 
          shadow-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
        "
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;