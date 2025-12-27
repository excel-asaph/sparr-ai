import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    // Strict Protection: Must be authenticated
    // Note: If you want to allow ANONYMOUS users to verify before dashboard, 
    // you might need to relax this OR rely on LandingPage's explicit redirect logic.
    // However, Dashboard usually requires full account for persistence.
    // If we allow Guest Dashboard, we change this check.
    // User Requirement: "if session has expired we send the authpage".
    // "if user is not... temporarily save... then send authentication page".
    // This implies Dashboard is BEHIND Auth.

    if (!currentUser) {
        const lastKnownUser = localStorage.getItem('lastKnownUser');

        // If we know who they are (Expired Session), send to Login to re-auth
        if (lastKnownUser) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }

        // If completely new/unknown, send to Landing Page to start fresh
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
