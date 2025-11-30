import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'


// --- Placeholder Data (Updated with ID and Percentage) ---
const employees = [
    { id: 101, name: "Maria S. Dela Cruz", role: "Software Engineer", initials: "MC", percentage: 85 },
    { id: 102, name: "Juan P. Reyes", role: "Project Manager", initials: "JR", percentage: 92 },
    { id: 103, name: "Cris L. Santos", role: "HR Specialist", initials: "CS", percentage: 78 },
    { id: 104, name: "Rina B. Garcia", role: "Accountant", initials: "RG", percentage: 95 },
    { id: 105, name: "Ben A. Lopez", role: "UX Designer", initials: "BL", percentage: 65 },
    { id: 106, name: "Lia T. Ramos", role: "Marketing Lead", initials: "LR", percentage: 88 },
];

// --- Main Component: EmployeeManager ---

function EmployeeManager() {
    // State to toggle between 'cards' and 'table' view
    const [viewMode, setViewMode] = useState('cards');

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">

            <Link 
                to="/dashboard"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline transition-colors text-base mb-2"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 mr-1" 
                >
                    <path d="M19 12H5" />
                    <path d="M12 5l-7 7 7 7" />
                </svg>
                <span>Back</span>
            </Link>
            
            {/* Header: Manage Employees & View Toggles */}
            <div className="flex justify-between items-center border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Manage Employees
                </h1>
                
                {/* View Mode Toggle Buttons */}
                <div className="flex space-x-2">
                    <button 
                        onClick={() => setViewMode('cards')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            viewMode === 'cards' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Card View
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            viewMode === 'table' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Table View
                    </button>
                </div>
            </div>

            {/* Conditional Rendering of Views */}
            {viewMode === 'cards' ? (
                <EmployeeCardsView employees={employees} />
            ) : (
                <EmployeeTableView employees={employees} />
            )}
            
        </div>
    );
}

export default EmployeeManager;

// --- Sub-Component: EmployeeCardsView (Existing Logic) ---

const EmployeeCardsView = ({ employees }) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((employee) => (
            <div 
                key={employee.id}
                className="p-4 border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition duration-300 flex items-start space-x-4 cursor-pointer"
            >
                {/* Profile Picture Placeholder (Rounded) */}
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-semibold text-blue-600 flex-shrink-0">
                    {employee.initials}
                </div>

                {/* Name and Role Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-gray-800 truncate">
                        {employee.name}
                    </p>
                    <p className="text-sm text-blue-500 font-medium truncate">
                        {employee.role}
                    </p>
                    
                    <button className="mt-2 text-xs text-gray-500 hover:text-blue-600 transition duration-150">
                        View Profile →
                    </button>
                </div>
            </div>
        ))}
    </div>
);


// --- New Sub-Component: EmployeeTableView ---

const EmployeeTableView = ({ employees }) => {

    // Dummy handlers for demonstration
    const handleAction = (action, employeeId) => {
        alert(`${action} action triggered for ID ${employeeId}`);
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PDS Score (%)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                        <tr key={employee.id} className="hover:bg-gray-50">
                            
                            {/* ID */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {employee.id}
                            </td>

                            {/* Name */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 mr-3">
                                        {employee.initials}
                                    </div>
                                    {employee.name}
                                </div>
                            </td>

                            {/* Role */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {employee.role}
                            </td>

                            {/* Percentage (with color indicator) */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${
                                    employee.percentage >= 90 ? 'bg-green-100 text-green-800' :
                                    employee.percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {employee.percentage}%
                                </span>
                            </td>

                            {/* Actions (View, Edit, Delete) */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                <button 
                                    onClick={() => handleAction('View', employee.id)}
                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                >
                                    View
                                </button>
                                <button 
                                    onClick={() => handleAction('Edit', employee.id)}
                                    className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleAction('Delete', employee.id)}
                                    className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};