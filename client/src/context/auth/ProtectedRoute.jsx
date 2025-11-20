import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import LoadingScreen from "../../components/Loading/LoadingScreen";

export default function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    return user ? children : <Navigate to="/login" replace />;
}
