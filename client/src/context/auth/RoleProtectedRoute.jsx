import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingScreen from "../../components/Loading/LoadingScreen";

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

    // Get user's role - handle both array and object formats
    const userRole = user?.roles?.[0]?.name || user?.roles?.[0];
    
    // Check if user has one of the allowed roles
    const hasAccess = allowedRoles.includes(userRole);

    if (!hasAccess) {
        // Redirect unauthorized users to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

