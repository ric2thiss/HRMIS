import React from 'react';

/**
 * Standardized Table Action Button Component
 * Based on the design from Manage Announcements route
 * Icon-only buttons with tooltips on hover
 * 
 * @param {string} variant - Color variant: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'gray' | 'indigo' | 'yellow'
 * @param {ReactNode} icon - Lucide React icon component
 * @param {string} label - Button text label (used for tooltip)
 * @param {function} onClick - Click handler
 * @param {string} title - Tooltip text (optional, defaults to label)
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
  // Color mapping based on variant - matching Manage Announcements design
  const colorClasses = {
    blue: 'text-blue-600 hover:text-blue-900',
    green: 'text-green-600 hover:text-green-900',
    red: 'text-red-600 hover:text-red-900',
    purple: 'text-purple-600 hover:text-purple-900',
    orange: 'text-orange-600 hover:text-orange-900',
    gray: 'text-gray-600 hover:text-gray-900',
    indigo: 'text-indigo-600 hover:text-indigo-900',
    yellow: 'text-yellow-600 hover:text-yellow-900',
  };

  const baseClasses = 'transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = colorClasses[variant] || colorClasses.blue;
  const tooltipText = title || label || '';

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
      title={tooltipText}
      disabled={disabled}
    >
      {Icon && <Icon className="w-5 h-5" />}
    </button>
  );
}

export default TableActionButton;

