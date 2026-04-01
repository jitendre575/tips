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
import Withdraw from './pages/Withdraw';
import Profile from './pages/Profile';
import AddBalance from './pages/AddBalance';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';
import CasinoGame from './pages/CasinoGame';
import CrashGame from './pages/CrashGame';
import PWAInstallPrompt from './components/PWAInstallPrompt';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-primary">
      <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-[6px] animate-spin"></div>
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
        <div className="min-h-screen bg-[#f5f5f9] selection:bg-accent/30 overflow-x-hidden relative font-['Outfit']">
          {/* Global Light Theme Background */}
          <div className="mesh-bg" />

          <div className="relative z-10 w-full min-h-screen">
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

              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              <Route path="/jrt" element={
                <div className="w-full min-h-screen bg-[#0a0a0c] text-white">
                  <AdminDashboard />
                </div>
              } />

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

              <Route path="/casino/crash" element={
                <ProtectedRoute>
                  <CrashGame />
                </ProtectedRoute>
              } />

              <Route path="/casino/:gameId" element={
                <ProtectedRoute>
                  <CasinoGame />
                </ProtectedRoute>
              } />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>

            <Toaster
              position="top-center"
              toastOptions={{
                className: '!bg-white !text-slate-900 !border !border-black/[0.05] !rounded-[6px] !p-6 !font-black !text-[11px] !uppercase !tracking-[0.1em] !shadow-2xl',
                duration: 4000,
                success: {
                  iconTheme: { primary: '#10b981', secondary: '#fff' }
                },
                error: {
                  iconTheme: { primary: '#d11b1b', secondary: '#fff' }
                }
              }}
            />
            <PWAInstallPrompt />
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
