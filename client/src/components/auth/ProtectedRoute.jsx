import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import LoadingScreen from "../Loading/LoadingScreen";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <LoadingScreen />;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If user must change password, redirect to password change page
    // Allow access to the password change page itself
    // Only redirect if we're not already on the password change page to prevent loops
    if (user.must_change_password && location.pathname !== '/force-change-password') {
        return <Navigate to="/force-change-password" replace />;
    }

    // If user is on password change page but doesn't need to change password, redirect to dashboard
    if (!user.must_change_password && location.pathname === '/force-change-password') {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

