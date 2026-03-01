import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Leaderboard from './pages/Leaderboard';
import Withdraw from './pages/Withdraw';
import Profile from './pages/Profile';
import AddBalance from './pages/AddBalance';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505]">
      <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/" />;

  if (adminOnly && !userData?.isAdmin) {
    return <UnauthorizedRedirect />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
};

const UnauthorizedRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error("You are not authorized to access admin panel", {
      id: 'unauthorized-status',
      icon: '🚫',
      style: {
        borderRadius: '20px',
        background: '#121212',
        color: '#fff',
        border: '1px solid rgba(255, 51, 51, 0.2)',
        padding: '16px 24px',
        fontFamily: 'Outfit, sans-serif',
        textTransform: 'uppercase',
        fontSize: '10px',
        fontWeight: '900',
        letterSpacing: '1px'
      }
    });
    navigate('/dashboard');
  }, [navigate]);

  return null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#050505]">
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/history" element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } />

            <Route path="/withdraw" element={
              <ProtectedRoute>
                <Withdraw />
              </ProtectedRoute>
            } />

            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            {/* JRT MASTER CONTROL - NOW OPEN PUBLIC ACCESS */}
            <Route path="/jrt" element={<AdminDashboard />} />

            {/* Redirect all legacy admin routes to the master portal */}
            <Route path="/admin/*" element={<Navigate to="/jrt" />} />
            <Route path="/admin" element={<Navigate to="/jrt" />} />

            <Route path="/add-balance" element={
              <ProtectedRoute>
                <AddBalance />
              </ProtectedRoute>
            } />

            <Route path="/payment" element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'glass !bg-[#121212] !text-white !border-white/10 !rounded-2xl',
              duration: 4000
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
