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
        <div className="flex items-center justify-center min-h-screen bg-primary">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-[6px] animate-spin"></div>
        </div>
    );

    // Security Check: If already admin, bypass the gatekeeper for efficiency
    // If NOT admin, show gatekeeper to allow "Master Key" (JAAT) to repair status.
    if (userData?.isAdmin) {
        return <AdminDashboard />;
    }
    
    // No initial redirect - the route is its own protection.
    // Entering JAAT then 666666 allows repair if status is lost.

    // Gatekeeper: Must have entered the correct MASTER KEY (JAAT)
    if (!isGateAuthorized) {
        return <JrtGatekeeper onAuthorized={() => setIsGateAuthorized(true)} />;
    }

    return <AdminDashboard />;
};

export default JrtMaster;
