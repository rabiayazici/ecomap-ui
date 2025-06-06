import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPage from './pages/DashboardPage';
import RoutePlanningPage from './pages/RoutePlanningPage';
import EcomapLandingPage from './pages/EcomapLandingPage';
import SatelliteRoutePage from './pages/SatelliteRoutePage';
import './App.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<EcomapLandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/plan-route"
            element={
              <PrivateRoute>
                <RoutePlanningPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/satellite-route"
            element={
              <PrivateRoute>
                <SatelliteRoutePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
