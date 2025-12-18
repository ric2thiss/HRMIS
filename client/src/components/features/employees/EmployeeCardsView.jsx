import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import TableActionButton from '../../ui/TableActionButton';

function EmployeeCardsView({ employees, onAction }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {employees.map((employee) => {
        const fullName = employee.name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'N/A';
        const position = employee.position?.title || 'N/A';
        
        return (
          <div 
            key={employee.id}
            className="p-4 border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition duration-300"
          >
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              {employee.profile_image ? (
                <img 
                  src={employee.profile_image} 
                  alt={fullName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-lg font-semibold text-blue-600 flex-shrink-0 ${employee.profile_image ? 'hidden' : 'flex'}`}
              >
                {employee.initials || 'NA'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-gray-800 truncate" title={fullName}>
                  {fullName}
                </p>
                <p className="text-sm text-blue-500 font-medium truncate" title={position}>
                  {position}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1" title={employee.role}>
                  {employee.role}
                </p>
                
                {/* PDS Completion */}
                <div className="mt-2 mb-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">PDS Completion:</span>
                    <span className={`font-medium ${
                      employee.percentage >= 90 ? 'text-green-600' :
                      employee.percentage >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {employee.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        employee.percentage >= 90 ? 'bg-green-500' :
                        employee.percentage >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${employee.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Status Badge */}
                {employee.is_locked && (
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded mb-2">
                    Locked
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <TableActionButton
                    variant="blue"
                    icon={Eye}
                    label="View"
                    onClick={() => onAction('View', employee.id)}
                    title="View Profile"
                  />
                  <TableActionButton
                    variant="indigo"
                    icon={Pencil}
                    label="Edit"
                    onClick={() => onAction('Edit', employee.id)}
                    title="Edit Employee"
                  />
                  <TableActionButton
                    variant="red"
                    icon={Trash2}
                    label="Delete"
                    onClick={() => onAction('Delete', employee.id)}
                    title="Delete Employee"
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default React.memo(EmployeeCardsView);

