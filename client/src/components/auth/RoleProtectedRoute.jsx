import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingScreen from "../Loading/LoadingScreen";
import { getUserRole } from "../../utils/userHelpers";

/**
 * RoleProtectedRoute - Protects routes based on user roles
 * @param {React.ReactNode} children - The component to render if authorized
 * @param {string[]} allowedRoles - Array of role names that can access this route (e.g., ['hr', 'admin'])
 */
export default function RoleProtectedRoute({ children, allowedRoles = [] }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    // If no user, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Get user's role - handles both belongsTo and many-to-many relationships
    const userRole = getUserRole(user);
    
    // Check if user has one of the allowed roles
    const hasAccess = userRole && allowedRoles.includes(userRole);

    if (!hasAccess) {
        // Redirect unauthorized users to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

