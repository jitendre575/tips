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
    Zap,
    Gamepad2,
    MessageCircle
} from 'lucide-react';
import { auth } from '../firebase';

const Sidebar = ({ isOpen, onClose }) => {
    const { userData } = useAuth();
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Markets', path: '/dashboard' },
        { icon: Gamepad2, label: 'Casino', path: '/dashboard?view=Casino' },
        { icon: Zap, label: 'Six Bonus Markets', path: '/dashboard?filter=Six Bonus' },
        { icon: History, label: 'Bet History', path: '/history' },
        { icon: CreditCard, label: 'Withdraw', path: '/withdraw' },
        { icon: User, label: 'Profile', path: '/profile' },
        { icon: MessageCircle, label: 'Support', action: () => window.dispatchEvent(new CustomEvent('openSupportChat')) }
    ];


    const handleLogout = () => {
        auth.signOut();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[150]"
                    onClick={onClose}
                />
            )}

            <aside className={`
                absolute inset-y-0 left-0 z-[200] w-[280px] 
                bg-white border-r border-black/[0.05] shadow-2xl
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            `}>
                <div className="h-full flex flex-col p-6">
                    <div className="flex items-center justify-between mb-10 pl-2 lg:mb-12">
                        <Link to="/dashboard" className="cricwin-logo !text-accent flex items-center gap-2" onClick={onClose}>
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-black not-italic"><Trophy size={16}/></div>
                            <span>WIN</span>
                        </Link>
                        <button onClick={onClose} className="text-slate-600 lg:hidden hover:text-accent transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-2">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[2px] mb-4 pl-4">
                            Platform Navigation
                        </div>
                        {menuItems.map((item, idx) => (
                            item.action ? (
                                <button
                                    key={idx}
                                    onClick={() => { item.action(); onClose(); }}
                                    className="sidebar-item w-full text-left"
                                >
                                    <item.icon size={18} className="text-slate-600" />
                                    <span>{item.label}</span>
                                </button>
                            ) : (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={`sidebar-item ${location.pathname + location.search === item.path ? 'active' : ''}`}
                                >
                                    <item.icon size={18} className={location.pathname + location.search === item.path ? 'text-white' : 'text-slate-600'} />
                                    <span>{item.label}</span>
                                </Link>
                            )
                        ))}

                        {/* Admin gateway removed as per request - only accessible via manual /jrt entry */}
                    </nav>

                    <div className="mt-auto pt-6 border-t border-black/[0.05]">
                        <button
                            onClick={handleLogout}
                            className="sidebar-item w-full text-slate-600 hover:text-accent hover:bg-accent/5"
                        >
                            <LogOut size={18} />
                            <span>Exit Arena</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
