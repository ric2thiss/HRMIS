import React, { useState } from 'react';
import EmployeeCardsView from './EmployeeCardsView';
import EmployeeTableView from './EmployeeTableView';

// Placeholder Data
const employees = [
    { id: 101, name: "Maria S. Dela Cruz", role: "Software Engineer", initials: "MC", percentage: 85 },
    { id: 102, name: "Juan P. Reyes", role: "Project Manager", initials: "JR", percentage: 92 },
    { id: 103, name: "Cris L. Santos", role: "HR Specialist", initials: "CS", percentage: 78 },
    { id: 104, name: "Rina B. Garcia", role: "Accountant", initials: "RG", percentage: 95 },
    { id: 105, name: "Ben A. Lopez", role: "UX Designer", initials: "BL", percentage: 65 },
    { id: 106, name: "Lia T. Ramos", role: "Marketing Lead", initials: "LR", percentage: 88 },
];

function EmployeeManager() {
    const [viewMode, setViewMode] = useState('cards');

    const handleAction = (action, employeeId) => {
        alert(`${action} action triggered for ID ${employeeId}`);
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Manage Employees
                </h1>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('cards')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'cards'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Cards
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            viewMode === 'table'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Table
                    </button>
                </div>
            </div>

            {viewMode === 'cards' ? (
                <EmployeeCardsView employees={employees} onAction={handleAction} />
            ) : (
                <EmployeeTableView employees={employees} onAction={handleAction} />
            )}
        </div>
    );
}

export default EmployeeManager;

