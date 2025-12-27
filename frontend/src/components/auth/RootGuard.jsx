import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RootGuard = ({ children }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    // If Authenticated (Registered User), Redirect to Dashboard
    if (currentUser && !currentUser.isAnonymous) {
        return <Navigate to="/dashboard" replace />;
    }

    // Check if Known User (Expired Session) -> Redirect to Login
    if (!currentUser) {
        const lastKnownUser = localStorage.getItem('lastKnownUser');
        if (lastKnownUser) {
            return <Navigate to="/login" replace />;
        }
    }

    // If Anonymous or Null (and Unknown), Allow Access to Landing Page
    return children;
};

export default RootGuard;
