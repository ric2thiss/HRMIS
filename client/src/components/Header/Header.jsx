import React from 'react';
import { Link, useNavigate, useLocation  } from 'react-router-dom'

import Logo from '../../asset/DICT logo.svg'
import NotificationDropdown from './NotificationDropdown';
import '../../styles/drop-down.css';

function Header({ user, logout }) {
  const location = useLocation();
  // console.log(user.role?.name)

  return (
    <header className="bg-white shadow-lg p-3 flex items-center justify-between sticky top-0 z-50">
      
      {/* 🧭 Left Side: Logo, HRMIS Title, and Menu */}
      <div className="flex items-center gap-x-20">
        {/* Logo and HRMIS Title */}
        <div className="flex items-center gap-2">
          <img src={Logo} alt="DICT Logo" className="w-8 h-8" />
          <h1 className="text-xl font-semibold text-gray-800">HRMIS</h1>
        </div>
        
        {/* Conditional Element based on user state */}
        {user ? (
          // Logged In: Show Toggle Menu Icon
          <label htmlFor="menu-toggle" className="ml-4 text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-100 cursor-pointer">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </label>
        ) : null}
      </div>
      
      {/* 👤 Right Side: User Controls or Auth Links */}
      <div className="flex items-center space-x-4">
        
        {user ? (
          // Logged In: Notifications and Profile Dropdowns
          <>
            {/* Notification Dropdown */}
            <NotificationDropdown />

            {/* Vertical Separator */}
            <div className="h-6 w-px bg-gray-300"></div>

            {/* User Profile Dropdown */}
            <details className="relative">
              <summary className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 focus:outline-none cursor-pointer">
                {user.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4a4 4 0 100 8 4 4 0 000-8zm0 10c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8z"/></svg>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
                <svg className="w-4 h-4 text-gray-500 transition-transform duration-200 arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </summary>

              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl z-50">
                <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</Link>
                {user.role?.name === "hr" && <Link to="/hr/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link>}
                {user.role?.name === "admin" && <Link to="/admin/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Admin Dashboard</Link>}
                {/* <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link> */}
                <a onClick={logout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t mt-1 cursor-pointer">Logout</a>
              </div>
            </details>
          </>
        ) : (
          // Logged Out: Login/Register Links
          <>
          {location.pathname !== "/login" && (
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Login
            </Link>
          )}
            <Link to="/" className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-150">Home</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;