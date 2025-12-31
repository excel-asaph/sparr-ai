/**
 * @fileoverview Root Application Component
 * 
 * Configures React Router routes and wraps the application with
 * authentication context. Defines the main navigation structure
 * with protected and public routes.
 * 
 * @module App
 * @requires react-router-dom
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RootGuard from './components/auth/RootGuard';
import ProtectedRoute from './components/auth/ProtectedRoute';

/**
 * Root application component with routing configuration.
 * 
 * Route Structure:
 * - "/" - Landing page (public, redirects authenticated users)
 * - "/login" - Authentication page
 * - "/dashboard" - Main app (protected, requires authentication)
 * 
 * @function App
 * @returns {JSX.Element} The application with routing and auth context
 */
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Landing page with root guard for auth redirects */}
          <Route path="/" element={
            <RootGuard>
              <LandingPage />
            </RootGuard>
          } />

          {/* Public login route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected dashboard route */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;