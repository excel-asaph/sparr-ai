/**
 * @fileoverview Root Route Guard Component
 * 
 * Protects the landing page route by redirecting authenticated users
 * to the dashboard. Also handles returning user detection for session
 * recovery flows.
 * 
 * @module components/auth/RootGuard
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Route guard for the landing page (root route).
 * 
 * Redirect Logic:
 * - Authenticated users → Dashboard
 * - Known returning users (expired session) → Login
 * - New/anonymous users → Allow access to landing page
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if allowed
 * @returns {JSX.Element} Children, redirect, or loading state
 */
const RootGuard = ({ children }) => {
    const { currentUser, loading } = useAuth();

    // Show loading state while auth initializes
    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    // Redirect authenticated users to dashboard
    if (currentUser && !currentUser.isAnonymous) {
        return <Navigate to="/dashboard" replace />;
    }

    // Redirect known returning users to login
    if (!currentUser) {
        const lastKnownUser = localStorage.getItem('lastKnownUser');
        if (lastKnownUser) {
            return <Navigate to="/login" replace />;
        }
    }

    // Allow new/anonymous users to see landing page
    return children;
};

export default RootGuard;
