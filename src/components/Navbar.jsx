import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Trophy, History, ShieldCheck, LogOut, Wallet, LayoutDashboard, PlusCircle, Home } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
    const { user, userData } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/');
    };

    const handleRecharge = async () => {
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                balance: increment(5000)
            });
            toast.success('Demo: 5,000 Coins added to your wallet!');
        } catch (error) {
            toast.error('Recharge failed');
        }
    };

    if (!user) return null;

    return (
        <nav className="sticky top-0 z-[100] bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link to="/dashboard" className="cricwin-logo">
                    <span className="text-white">CRIC</span>
                    <span className="logo-red">WIN</span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm">
                    <Link to="/dashboard" className="nav-link">
                        <Home size={18} />
                        <span>Matches</span>
                    </Link>
                    <Link to="/history" className="nav-link">
                        <History size={18} />
                        <span>History</span>
                    </Link>
                    <Link to="/leaderboard" className="nav-link">
                        <Trophy size={18} />
                        <span>Leaderboard</span>
                    </Link>
                    {userData?.isAdmin && (
                        <Link to="/admin" className="nav-link text-yellow-500 hover:text-yellow-400">
                            <ShieldCheck size={18} />
                            <span>Admin</span>
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleRecharge}
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        <PlusCircle size={14} />
                        <span>Refill</span>
                    </button>

                    <div className="bg-zinc-900 px-4 py-2 rounded-xl border border-white/[0.05] flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-yellow-500" />
                        <span className="font-black text-yellow-500 tracking-tight">{userData?.balance?.toLocaleString()}</span>
                        <span className="text-[10px] font-black text-zinc-500 uppercase">Coins</span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

