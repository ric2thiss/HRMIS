import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import TableActionButton from '../../ui/TableActionButton';

function EmployeeTableView({ employees, onAction }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PDS Completion</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {employees.map((employee) => {
            const fullName = employee.name || `${employee.first_name || ''} ${employee.middle_initial || ''} ${employee.last_name || ''}`.trim() || 'N/A';
            const position = employee.position?.title || 'N/A';
            
            return (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {employee.employee_id || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex items-center">
                    {employee.profile_image ? (
                      <img 
                        src={employee.profile_image} 
                        alt={fullName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 mr-3 flex-shrink-0"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600 mr-3 flex-shrink-0 ${employee.profile_image ? 'hidden' : 'flex'}`}
                    >
                      {employee.initials || 'NA'}
                    </div>
                    <span className="truncate max-w-xs" title={fullName}>
                      {fullName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="truncate max-w-xs block" title={position}>
                    {position}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {employee.role || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="truncate max-w-xs block" title={employee.email}>
                    {employee.email || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium ${
                      employee.percentage >= 90 ? 'bg-green-100 text-green-800' :
                      employee.percentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {employee.percentage}%
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          employee.percentage >= 90 ? 'bg-green-500' :
                          employee.percentage >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${employee.percentage}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    employee.is_locked 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {employee.is_locked ? 'Locked' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default React.memo(EmployeeTableView);

