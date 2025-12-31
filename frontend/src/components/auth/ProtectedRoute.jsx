/**
 * @fileoverview Protected Route Guard Component
 * 
 * Restricts access to authenticated users only. Redirects unauthenticated
 * users to login or landing page based on their session history.
 * 
 * @module components/auth/ProtectedRoute
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Route guard for protected pages requiring authentication.
 * 
 * Redirect Logic:
 * - Authenticated users → Allow access
 * - Known returning users → Login (with return location preserved)
 * - Unknown users → Landing page
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Protected content to render
 * @returns {JSX.Element} Children, redirect, or loading state
 */
const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // Show loading state while auth initializes
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    // Handle unauthenticated access
    if (!currentUser) {
        const lastKnownUser = localStorage.getItem('lastKnownUser');

        // Known user with expired session → Login with return path
        if (lastKnownUser) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }

        // Unknown user → Landing page
        return <Navigate to="/" replace />;
    }

    // Allow authenticated access
    return children;
};

export default ProtectedRoute;
