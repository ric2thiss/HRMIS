import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUserRole, hasSystemSettingsAccess } from '../../utils/userHelpers';
import { useGlobalPrefetch } from '../../hooks/useGlobalPrefetch';

import './Sidebar.css'

function Sidebar({ user, role: roleProp }) {
  const location = useLocation();
  const sidebarRef = useRef(null);
  // Use prop if provided, otherwise get from user
  const role = roleProp || getUserRole(user);
  
  // Global prefetch hook for module-based prefetching
  const { prefetchModule } = useGlobalPrefetch();

  // Handle scrollbar visibility on mobile during scrolling
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    let scrollTimeout;
    let isScrolling = false;

    const handleScroll = () => {
      if (!isScrolling) {
        isScrolling = true;
        sidebar.classList.add('sidebar-scrolling');
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
        sidebar.classList.remove('sidebar-scrolling');
      }, 1000); // Hide scrollbar 1 second after scrolling stops
    };

    sidebar.addEventListener('scroll', handleScroll, { passive: true });
    sidebar.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      sidebar.removeEventListener('scroll', handleScroll);
      sidebar.removeEventListener('touchmove', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);
  
  return (
    <aside 
      id="sidebar" 
      ref={sidebarRef}
      className="w-64 bg-white p-4 flex flex-col shadow-lg flex-shrink-0 overflow-y-auto"
    >
            
        <div className="mb-6 p-4 border rounded-lg flex justify-center">
            {user.profile_image ? (
                <img 
                    src={user.profile_image} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
            ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4a4 4 0 100 8 4 4 0 000-8zm0 10c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8z"/></svg>
                </div>
            )}
        </div>

        <h2 className="text-lg font-semibold mb-1 text-gray-800 sidebar-content">
            {user.first_name && user.last_name
                ? `${user.first_name} ${user.middle_initial || ''} ${user.last_name}`.trim().toUpperCase()
                : (user.name?.toUpperCase() || '')}
        </h2>
        <p className="text-sm text-gray-600 mb-4 sidebar-content">
            {user.position?.title || 'N/A'}
        </p>
        
        <div className="space-y-3 mb-6">
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">EMPLOYEE ID:</p>
                <p className="font-medium text-sm sidebar-content">{user.employee_id}</p>
            </div>
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">EMAIL ADDRESS:</p>
                <p className="font-medium text-sm truncate sidebar-content">{user.email?.toUpperCase() || ''}</p>
            </div>
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">ROLE:</p>
                <p className="font-medium text-sm sidebar-content">
                    {role ? `${role.toUpperCase()} (${((user.employmentTypes || user.employment_types)?.[0]?.name || 'N/A').toUpperCase()})` : 'N/A'}
                </p>
            </div>
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">PROJECT:</p>
                <p className="font-medium text-sm sidebar-content">
                    {user.project?.project_code || 'N/A'}
                </p>
            </div>
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">OFFICE:</p>
                <p className="font-medium text-sm sidebar-content">{user.office?.name || 'N/A'} ({user.office?.code || 'N/A'})</p>
            </div>
        </div>

        <nav className="flex-1 space-y-2">
            <Link to="/dashboard" className={`flex items-center p-2 rounded-lg text-sm font-medium ${location.pathname === '/dashboard' ? 'bg-blue-100': ''} text-blue-700`}>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-9v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                HOME
            </Link>
            
            <details className="relative">
                <summary className="flex items-center justify-between w-full p-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
                    <span className="flex items-center">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        MY APPLICATION
                    </span>
                    <svg className="w-4 h-4 transition-transform duration-200 arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </summary>

                <div className="pl-6 space-y-1 mt-1">
                    <Link to="/my-leave" className={`block p-2 text-sm rounded-lg transition-colors ${
                        location.pathname === '/my-leave' 
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                        My Leave
                    </Link>
                    <Link to="/my-dtr" className={`block p-2 text-sm rounded-lg transition-colors ${
                        location.pathname === '/my-dtr' 
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                        My DTR
                    </Link>
                    <Link to="/my-pds" className={`block p-2 text-sm rounded-lg transition-colors ${
                        location.pathname === '/my-pds' 
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                        My PDS
                    </Link>
                </div>
            </details>

            {/* HR only Navigation */}
            {role === 'hr' && (
                <details className="relative">
                    <summary className="flex items-center justify-between w-full p-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
                        <span className="flex items-center">
                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            HR MANAGEMENT
                        </span>
                        <svg className="w-4 h-4 transition-transform duration-200 arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </summary>

                    <div className="pl-6 space-y-1 mt-1">
                        <Link 
                            to="/my-approval" 
                            className={`block p-2 text-sm rounded-lg transition-colors ${
                                location.pathname === '/my-approval' 
                                    ? 'bg-blue-100 text-blue-700 font-medium' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            onMouseEnter={() => prefetchModule('my-approval', user)}
                            onFocus={() => prefetchModule('my-approval', user)}
                        >
                            My Approval
                        </Link>
                        <Link 
                            to="/manage-pds" 
                            className={`block p-2 text-sm rounded-lg transition-colors ${
                                location.pathname === '/manage-pds' 
                                    ? 'bg-blue-100 text-blue-700 font-medium' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            onMouseEnter={() => prefetchModule('manage-pds', user)}
                            onFocus={() => prefetchModule('manage-pds', user)}
                        >
                            Manage PDS
                        </Link>
                        <Link to="/manage-leave" className={`block p-2 text-sm rounded-lg transition-colors ${
                            location.pathname === '/manage-leave' 
                                ? 'bg-blue-100 text-blue-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}>
                            Manage Leave
                        </Link>
                        <Link to="/manage-employees" className={`block p-2 text-sm rounded-lg transition-colors ${
                            location.pathname === '/manage-employees' 
                                ? 'bg-blue-100 text-blue-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}>
                            Manage Employees
                        </Link>
                        <Link to="/manage-accounts" className={`block p-2 text-sm rounded-lg transition-colors ${
                            location.pathname === '/manage-accounts' 
                                ? 'bg-blue-100 text-blue-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}>
                            Manage Accounts
                        </Link>
                        <Link to="/import-attendance" className={`block p-2 text-sm rounded-lg transition-colors ${
                            location.pathname === '/import-attendance' 
                                ? 'bg-blue-100 text-blue-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}>
                            Import Attendance
                        </Link>
                        <Link to="/master-lists" className={`block p-2 text-sm rounded-lg transition-colors ${
                            location.pathname === '/master-lists' 
                                ? 'bg-blue-100 text-blue-700 font-medium' 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}>
                            Master Lists
                        </Link>
                    </div>
                </details>
            )}

            {/* Admin only Navigation */}
            {role === 'admin' && (
                <Link to="/system-settings" className={`flex items-center p-2 rounded-lg text-sm font-medium ${
                    location.pathname === '/system-settings' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                }`}>
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    SYSTEM SETTINGS
                </Link>
            )}
        </nav>

    </aside>
  )
}

export default Sidebar