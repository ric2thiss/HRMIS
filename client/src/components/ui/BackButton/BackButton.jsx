import { Link } from 'react-router-dom';

/**
 * Reusable back button component
 * @param {string} to - Route to navigate to (default: '/dashboard')
 * @param {string} label - Button label (default: 'Back')
 */
function BackButton({ to = '/dashboard', label = 'Back' }) {
  return (
    <Link 
      to={to}
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
      <span>{label}</span>
    </Link>
  );
}

export default BackButton;
