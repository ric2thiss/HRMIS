import React from 'react'
import { Link, useNavigate, useLocation  } from 'react-router-dom'

import './Sidebar.css'

function Sidebar({user, role}) {
  return (
    <aside id="sidebar" className="w-64 bg-white p-4 flex flex-col shadow-lg flex-shrink-0 overflow-y-auto">
            
        <div className="mb-6 p-4 border rounded-lg flex justify-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 4a4 4 0 100 8 4 4 0 000-8zm0 10c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8z"/></svg>
            </div>
        </div>

        <h2 className="text-lg font-semibold mb-4 text-gray-800 sidebar-content">{user.name}</h2>
        
        <div className="space-y-3 mb-6">
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">EMPLOYEE ID:</p>
                <p className="font-medium text-sm sidebar-content">{user.id}</p>
            </div>
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">EMAIL ADDRESS:</p>
                <p className="font-medium text-sm truncate sidebar-content">{user.email}</p>
            </div>
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">ROLE:</p>
                <p className="font-medium text-sm sidebar-content">{role}</p>
            </div>
            <div className="p-3 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500">OFFICE:</p>
                <p className="font-medium text-sm sidebar-content">REGION13</p>
            </div>
        </div>

        <nav className="flex-1 space-y-2">
            <Link to="/dashboard" className={`flex items-center p-2 rounded-lg text-sm font-medium ${location.pathname === '/dashboard' ? 'bg-blue-100': ''} text-blue-700`}>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-9v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                DASHBOARD
            </Link>
            
            <details className="relative">
                <summary className="flex items-center justify-between w-full p-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer">
                    <span className="flex items-center">
                        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        MY APPLICATION
                    </span>
                    <svg className="w-4 h-4 transition-transform duration-200 arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </summary>

                <div className="pl-6 space-y-1 mt-1">
                    <a href="#" className="block p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">File Leave</a>
                    <a href="#" className="block p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">View DTR</a>
                    <a href="#" className="block p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">View PDS</a>
                </div>
            </details>
        </nav>

    </aside>
  )
}

export default Sidebar