import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InterviewWizard from './pages/InterviewWizard';
import DashboardPage from './pages/DashboardPage';

import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RootGuard from './components/auth/RootGuard';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={
            <RootGuard>
              <LandingPage />
            </RootGuard>
          } />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/wizard" element={<InterviewWizard />} />

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