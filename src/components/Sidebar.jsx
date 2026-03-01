import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    History,
    Trophy,
    ShieldCheck,
    Wallet,
    User,
    LogOut,
    X,
    TrendingUp,
    CreditCard,
    Zap
} from 'lucide-react';
import { auth } from '../firebase';

const Sidebar = ({ isOpen, onClose }) => {
    const { userData } = useAuth();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Markets', path: '/dashboard' },
        { icon: Zap, label: 'Six Bonus Markets', path: '/dashboard?filter=Six Bonus' },
        { icon: History, label: 'Bet History', path: '/history' },
        { icon: CreditCard, label: 'Withdraw', path: '/withdraw' },
        { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    const adminItems = [
        { icon: ShieldCheck, label: 'Master Control', path: '/jrt' },
    ];

    const handleLogout = () => {
        auth.signOut();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-[200] w-[var(--sidebar-width)] 
                bg-[#050505] border-r border-white/[0.05] 
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:block
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center justify-between mb-10 pl-2">
                        <Link to="/dashboard" className="cricwin-logo" onClick={onClose}>
                            <span className="text-white">CRIC</span>
                            <span className="logo-red">WIN</span>
                        </Link>
                        <button onClick={onClose} className="lg:hidden text-zinc-500">
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[2px] mb-4 pl-4">
                            Menu
                        </div>
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={`sidebar-item ${location.pathname + location.search === item.path ? 'active' : ''}`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        ))}

                        {userData?.isAdmin && (
                            <>
                                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[2px] mt-10 mb-4 pl-4">
                                    Admin Control
                                </div>
                                {adminItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                                    >
                                        <item.icon size={20} />
                                        <span>{item.label}</span>
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-white/[0.05]">
                        <button
                            onClick={handleLogout}
                            className="sidebar-item w-full text-zinc-500 hover:text-red-500 hover:bg-red-500/5"
                        >
                            <LogOut size={20} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
