import React from 'react';

function EmployeeCardsView({ employees, onAction }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => (
        <div 
          key={employee.id}
          className="p-4 border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition duration-300 flex items-start space-x-4 cursor-pointer"
        >
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-semibold text-blue-600 flex-shrink-0">
            {employee.initials}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold text-gray-800 truncate">
              {employee.name}
            </p>
            <p className="text-sm text-blue-500 font-medium truncate">
              {employee.role}
            </p>
            
            <button 
              onClick={() => onAction('View', employee.id)}
              className="mt-2 text-xs text-gray-500 hover:text-blue-600 transition duration-150"
            >
              View Profile →
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default React.memo(EmployeeCardsView);

