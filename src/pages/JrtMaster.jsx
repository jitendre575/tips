import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import JrtGatekeeper from './JrtGatekeeper';
import AdminDashboard from './AdminDashboard';

const JrtMaster = () => {
    const { user, userData, loading } = useAuth();
    const [isGateAuthorized, setIsGateAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const authorized = sessionStorage.getItem('jrt_access') === 'true';
            setIsGateAuthorized(authorized);
        };

        checkAuth();
        // Listen for changes in session storage (e.g. from JrtGatekeeper)
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#050505]">
            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
        </div>
    );

    // Security Check: Must be logged in AND must be an admin
    if (!user || !userData?.isAdmin) {
        return <Navigate to="/" />;
    }

    // Gatekeeper: Must have entered the correct MASTER KEY (JAAT)
    if (!isGateAuthorized) {
        return <JrtGatekeeper onAuthorized={() => setIsGateAuthorized(true)} />;
    }

    return <AdminDashboard />;
};

export default JrtMaster;
