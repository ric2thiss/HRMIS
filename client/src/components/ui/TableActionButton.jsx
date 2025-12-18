import React from 'react';

/**
 * Standardized Table Action Button Component
 * Based on the design from /my-leave route
 * 
 * @param {string} variant - Color variant: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'gray' | 'indigo'
 * @param {ReactNode} icon - Lucide React icon component
 * @param {string} label - Button text label
 * @param {function} onClick - Click handler
 * @param {string} title - Tooltip text (optional)
 * @param {boolean} disabled - Disabled state (optional)
 * @param {string} className - Additional custom classes (optional)
 */
function TableActionButton({ 
  variant = 'blue', 
  icon: Icon, 
  label, 
  onClick, 
  title, 
  disabled = false,
  className = ''
}) {
  // Color mapping based on variant
  const colorClasses = {
    blue: 'text-blue-600 hover:text-blue-900 border-blue-600 hover:bg-blue-50',
    green: 'text-green-600 hover:text-green-900 border-green-600 hover:bg-green-50',
    red: 'text-red-600 hover:text-red-900 border-red-600 hover:bg-red-50',
    purple: 'text-purple-600 hover:text-purple-900 border-purple-600 hover:bg-purple-50',
    orange: 'text-orange-600 hover:text-orange-900 border-orange-600 hover:bg-orange-50',
    gray: 'text-gray-600 hover:text-gray-900 border-gray-600 hover:bg-gray-50',
    indigo: 'text-indigo-600 hover:text-indigo-900 border-indigo-600 hover:bg-indigo-50',
    yellow: 'text-yellow-600 hover:text-yellow-900 border-yellow-600 hover:bg-yellow-50',
  };

  const baseClasses = 'flex items-center gap-1 px-3 py-1 transition-colors border rounded disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = colorClasses[variant] || colorClasses.blue;

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
      title={title || label}
      disabled={disabled}
    >
      {Icon && <Icon size={16} />}
      <span>{label}</span>
    </button>
  );
}

export default TableActionButton;

