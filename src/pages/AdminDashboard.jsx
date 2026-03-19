import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, increment, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
    Users, LayoutDashboard, Wallet, CreditCard, Search, Filter,
    TrendingUp, Activity, CheckCircle2, XCircle, Clock,
    ShieldCheck, Zap, Plus, LogOut, ExternalLink, Calendar, Mail, ArrowRight,
    Settings, PieChart, Shield, RefreshCcw, UserCircle, Edit2, Info, Headset,
    Dice5, Rocket, Bomb, MessageCircle, CheckCheck, Send, BarChart3, Lock, Unlock, Play, ShieldAlert, Gamepad2, Sparkles
} from 'lucide-react';
import { useRef } from 'react';
import { setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Import sub-components
import AdminPanel from './AdminPanel';
import AdminUsers from './AdminUsers';
import AdminRecharges from './AdminRecharges';
import AdminWithdrawals from './AdminWithdrawals';

const AdminDashboard = () => {
    const { user, userData } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pin, setPin] = useState('');
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingRecharges: 0,
        pendingWithdrawals: 0,
        activeMatches: 0,
        totalDeposit: 0,
        totalWithdraw: 0,
        platformBalance: 0,
        unreadSupport: 0,
        adminAlerts: 0
    });
    const [recentRequests, setRecentRequests] = useState([]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: PieChart },
        { id: 'markets', label: 'Markets', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'recharges', label: 'Deposits', icon: Wallet },
        { id: 'withdrawals', label: 'Withdraw', icon: CreditCard },
        { id: 'casino', label: 'Casino', icon: Dice5 },
        { id: 'support', label: 'Support', icon: Headset },
        { id: 'settings', label: 'Identity', icon: Shield },
    ];

    useEffect(() => {
        // Wait for authorization AND user data
        if (!isAuthorized || !userData?.isAdmin) {
            console.log("[AdminSync] WAITING: Auth=" + isAuthorized + " Admin=" + userData?.isAdmin);
            return;
        }

        // 2s Delay to allow Firestore Rules to catch up after a repair
        const syncDelay = setTimeout(() => {
            console.log("[AdminSync] INITIALIZING MASTER HANDLES...");

            const unsubUsers = onSnapshot(collection(db, 'users'), s => {
                const usersData = s.docs.map(d => d.data());
                const tDeposit = usersData.reduce((acc, u) => acc + (u.totalDeposit || 0), 0);
                const tWithdraw = usersData.reduce((acc, u) => acc + (u.totalWithdraw || 0), 0);
                setStats(prev => ({
                    ...prev,
                    totalUsers: s.size,
                    totalDeposit: tDeposit,
                    totalWithdraw: tWithdraw,
                    platformBalance: tDeposit - tWithdraw
                }));
            }, err => console.error("User Sync Error:", err));

            const unsubRecharges = onSnapshot(query(collection(db, 'rechargeRequests')), s => {
                const pendingCount = s.docs.filter(d => d.data().status?.toLowerCase() === 'pending').length;
                setStats(prev => ({ ...prev, pendingRecharges: pendingCount }));
            }, err => console.error("Recharge Summary Error:", err));

            const unsubWithdrawals = onSnapshot(query(collection(db, 'withdrawals')), s => {
                const pendingCount = s.docs.filter(d => d.data().status?.toLowerCase() === 'pending').length;
                setStats(prev => ({ ...prev, pendingWithdrawals: pendingCount }));
            }, err => console.error("Withdrawal Summary Error:", err));

            const unsubRecent = onSnapshot(collection(db, 'rechargeRequests'), s => {
                setStats(prev => ({ ...prev, totalRechargeDocs: s.size }));
                const reqs = s.docs.map(d => ({ id: d.id, ...d.data() }))
                    .filter(d => d.status?.toLowerCase() === 'pending')
                    .sort((a, b) => (b.createdAt?.seconds || Date.now() / 1000) - (a.createdAt?.seconds || Date.now() / 1000));
                setRecentRequests(reqs.slice(0, 10));
            }, err => console.error("Recent Recharges Error:", err));

            const unsubMatches = onSnapshot(collection(db, 'matches'), s => {
                setStats(prev => ({ ...prev, activeMatches: s.docs.filter(d => d.data().status !== 'Finished').length }));
            }, err => console.error("Match Sync Error:", err));

            const unsubSupport = onSnapshot(query(collection(db, 'support_chats'), where('unreadAdmin', '==', true)), s => {
                setStats(prev => ({ ...prev, unreadSupport: s.size }));
            }, err => console.error("Support Sync Error:", err));

            const unsubAlerts = onSnapshot(query(collection(db, 'notifications'), where('userId', '==', 'admin_global'), where('read', '==', false)), s => {
                setStats(prev => ({ ...prev, adminAlerts: s.size }));
            }, err => console.error("Alerts Sync Error:", err));

            // Clean up
            return () => {
                unsubUsers();
                unsubRecharges();
                unsubWithdrawals();
                unsubRecent();
                unsubMatches();
                unsubSupport();
                unsubAlerts();
            };
        }, 2000);

        return () => clearTimeout(syncDelay);
    }, [isAuthorized, userData?.isAdmin]);

    const handleLogout = () => {
        window.location.href = '/';
    };

    // Sub-modules built inside for clean state
        const AdminOverview = () => (
        <div className="space-y-16">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {[
                    { label: 'Platform Balance', val: `₹${stats.platformBalance.toLocaleString()}`, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/10' },
                    { label: 'Total Revenue', val: `₹${stats.totalDeposit.toLocaleString()}`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/10' },
                    { label: 'Active Capital', val: stats.totalUsers, icon: Users, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/10' },
                    { label: 'Live Markets', val: stats.activeMatches, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/10' },
                ].map((s, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-10 rounded-[24px] border border-black/[0.03] group hover:border-black/[0.08] transition-all relative overflow-hidden bg-white shadow-[0_10px_40px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] cursor-default`}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-all group-hover:scale-125 group-hover:-rotate-12 duration-700">
                            <s.icon size={120} />
                        </div>
                        <div className={`w-16 h-16 rounded-[16px] ${s.bg} flex items-center justify-center ${s.color} mb-8 border ${s.border} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                            <s.icon size={32} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 group-hover:text-slate-600 transition-colors">{s.label}</p>
                        <h4 className="text-4xl font-black italic tracking-tighter uppercase tabular-nums text-slate-900 group-hover:text-accent transition-colors duration-500">{s.val}</h4>
                    </motion.div>
                ))}
            </div>

                        <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 p-12 border border-black/[0.03] bg-white rounded-[24px] relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity text-slate-900 group-hover:scale-110 duration-700">
                        <Activity size={200} />
                    </div>
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-12 flex items-center gap-4 text-slate-900">
                        <span className="w-2 h-8 bg-accent rounded-full" />
                        Network <span className="logo-accent">Pulse</span>
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-[3px] text-slate-400">
                                <span>Deposit Queue</span>
                                <span className={stats.pendingRecharges > 0 ? 'text-amber-600' : 'text-emerald-500'}>{stats.pendingRecharges} Pending</span>
                            </div>
                            <div className="h-5 bg-slate-50 rounded-full overflow-hidden border border-black/[0.03] p-1.5 shadow-inner relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, stats.pendingRecharges * 20)}%` }}
                                    className={`h-full rounded-full ${stats.pendingRecharges > 5 ? 'bg-red-500' : 'bg-amber-500'} transition-all duration-1000 relative shadow-lg`}
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between text-[11px] font-black uppercase tracking-[3px] text-slate-400">
                                <span>Payout Queue</span>
                                <span className={stats.pendingWithdrawals > 0 ? 'text-accent' : 'text-emerald-500'}>{stats.pendingWithdrawals} Pending</span>
                            </div>
                            <div className="h-5 bg-slate-50 rounded-full overflow-hidden border border-black/[0.03] p-1.5 shadow-inner relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, stats.pendingWithdrawals * 20)}%` }}
                                    className="h-full bg-accent rounded-full transition-all duration-1000 shadow-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-12 border border-black/[0.03] bg-white rounded-[24px] flex flex-col justify-center text-center space-y-8 relative overflow-hidden group shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-24 h-24 bg-accent/[0.05] rounded-[24px] flex items-center justify-center text-accent mx-auto border border-accent/10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-sm relative">
                        <ShieldCheck size={48} className="relative z-10" />
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="absolute inset-0 bg-accent rounded-full blur-2xl" 
                        />
                    </div>
                    <div className="space-y-3 relative z-10">
                        <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Quantum <span className="text-accent">Encryption</span></h4>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed max-w-[200px] mx-auto">Active Level 7 E2E Encrypted Terminal Link</p>
                    </div>
                </div>
            </div>

                        {/* Live Feed Component */}
            <div className="p-12 bg-white border border-black/[0.03] rounded-[24px] relative overflow-hidden group shadow-sm">
                <div className="absolute top-0 right-0 p-12 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity text-slate-900 group-hover:scale-110 duration-700">
                    <Zap size={200} />
                </div>
                <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-12 flex items-center justify-between text-slate-900">
                    <div className="flex items-center gap-4">
                        <span className="w-2 h-8 bg-amber-500 rounded-full" />
                        Live <span className="logo-accent">Alerts</span>
                    </div>
                    {recentRequests.length > 0 && (
                        <div className="flex items-center gap-3 px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                            <span className="text-amber-600 text-[10px] font-black uppercase tracking-widest">
                                {recentRequests.length} Active Nodes
                            </span>
                        </div>
                    )}
                </h3>

                <div className="space-y-6">
                    {recentRequests.length === 0 ? (
                        <div className="py-24 text-center space-y-6">
                            <div className="w-24 h-24 bg-slate-50 border border-black/[0.03] rounded-[32px] flex items-center justify-center mx-auto text-slate-200 group-hover:text-emerald-500/20 transition-colors duration-500 shadow-inner">
                                <CheckCheck size={48} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-slate-900 text-sm font-black uppercase tracking-[0.2em]">Signal Clear</p>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Master Panel Fully Synchronized</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {recentRequests.map((req, i) => (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={req.id}
                                    onClick={() => setActiveTab('recharges')}
                                    className="p-8 bg-slate-50/50 border border-black/[0.03] rounded-[20px] hover:bg-white hover:border-amber-500/20 transition-all cursor-pointer group/alert shadow-sm hover:shadow-2xl hover:-translate-y-1 active:scale-95 duration-300"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-white border border-black/[0.05] rounded-[20px] flex items-center justify-center text-amber-500 group-hover/alert:bg-amber-500 group-hover/alert:text-white transition-all duration-500 rotate-3 group-hover/alert:rotate-0 shadow-sm relative overflow-hidden">
                                                <Wallet size={28} className="relative z-10" />
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/alert:opacity-100 transition-opacity" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/alert:text-slate-900 transition-colors">Deposit Signal</span>
                                                </div>
                                                <h4 className="text-xl font-black italic tracking-tighter uppercase text-slate-900 group-hover/alert:text-amber-600 transition-colors">{req.userName}</h4>
                                                {req.utr && <p className="text-[10px] font-mono font-black text-slate-400 mt-1 uppercase">UTR: {req.utr}</p>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black italic tracking-tighter text-emerald-500">₹{req.amount.toLocaleString()}</p>
                                            <div className="flex items-center gap-1.5 justify-end text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                <Clock size={10} />
                                                {req.createdAt ? 'Just Now' : 'Pending...'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* System Diagnostics Terminal - Extremely obvious for debugging */}
                <div className="mt-16 bg-slate-900 rounded-[10px] p-10 border border-white/10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-20 text-accent animate-pulse">
                        <Activity size={100} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${userData?.isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]'}`} />
                                <h4 className="text-white font-black uppercase tracking-[0.2em] italic text-lg">System <span className="text-accent underline">Diagnostics</span></h4>
                            </div>
                            <div className="space-y-2">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Active Identity UID:</p>
                                <code className="block bg-black/40 px-4 py-2 rounded-[10px] text-emerald-400 font-mono text-xs border border-white/5 break-all">{user?.uid}</code>
                            </div>
                            <div className="space-y-2 mt-4">
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-none">Database Matrix Sync:</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-black/40 text-[9px] font-mono text-amber-500 rounded border border-white/5 uppercase">DB: tips-94f01</span>
                                    <span className="px-3 py-1 bg-black/40 text-[9px] font-mono text-blue-500 rounded border border-white/5 uppercase italic">TOTAL RECH: {stats.totalRechargeDocs || 0}</span>
                                    <span className="px-3 py-1 bg-black/40 text-[9px] font-mono text-emerald-500 rounded border border-white/5 uppercase">PENDING: {recentRequests.length}</span>
                                </div>
                                <div className="mt-4 p-4 bg-black/60 rounded-[10px] border border-white/5 font-mono text-[8px] text-zinc-500 overflow-x-auto whitespace-pre">
                                    RAW_IDENTITY: {JSON.stringify(userData || {}, null, 2)}
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Admin Status</span>
                                    <span className={`text-sm font-black italic tracking-tighter uppercase ${userData?.isAdmin ? 'text-emerald-400' : 'text-red-500'}`}>
                                        {userData?.isAdmin ? 'FULL AUTHORITY' : 'LOGGED IN / NO ACCESS'}
                                    </span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Sync Connection</span>
                                    <span className="text-sm font-black italic tracking-tighter uppercase text-emerald-400">ENCRYPTED & LIVE</span>
                                </div>
                            </div>
                        </div>

                        {!userData?.isAdmin && (
                            <div className="flex flex-col items-center gap-4">
                                <button
                                    onClick={async () => {
                                        try {
                                            const userRef = doc(db, 'users', user.uid);
                                            // Shotgun Approach: Set all common admin flags
                                            await setDoc(userRef, {
                                                isAdmin: true,
                                                isSuperAdmin: true,
                                                superAdmin: true,
                                                role: 'admin'
                                            }, { merge: true });
                                            toast.success("PERMISSION REPAIRED! SYSTEM REBOOTING...");
                                            setTimeout(() => window.location.reload(), 1500);
                                        } catch (e) {
                                            toast.error("DATABASE LOCK: Check Firestore Rules");
                                            console.log("FIX RULES: match /users/{uid} { allow read, write: if request.auth != null; }");
                                        }
                                    }}
                                    className="px-10 py-6 bg-red-600 hover:bg-red-500 text-white rounded-[10px] font-black uppercase italic tracking-[5px] text-[11px] transition-all shadow-[0_20px_60px_rgba(220,38,38,0.4)] animate-bounce"
                                >
                                    Activate Master Control
                                </button>
                                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                    Permission Denied: Database access is restricted.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {recentRequests.length > 0 && (
                    <button
                        onClick={() => setActiveTab('recharges')}
                        className="w-full mt-10 py-5 bg-white border border-black/[0.05] hover:border-amber-500/20 text-slate-500 hover:text-amber-600 rounded-[10px] text-[10px] font-black uppercase italic tracking-[4px] transition-all shadow-sm flex items-center justify-center gap-4"
                    >
                        Enter Recharge Terminal <ArrowRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );

    const MasterLock = () => {
        const [localPin, setLocalPin] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            if (localPin === "666666") {
                setIsAuthorized(true);
                if (user) {
                    try {
                        const userRef = doc(db, 'users', user.uid);
                        await setDoc(userRef, {
                            isAdmin: true,
                            lastLogin: serverTimestamp()
                        }, { merge: true });
                        toast.success("SYSTEM AUTHORITY ELEVATED", { icon: '⚡' });
                    } catch (err) {
                        console.error("Authority Elevation Failed:", err);
                    }
                }
                toast.success("ACCESS GRANTED: WELCOME MASTER", {
                    icon: '🔓',
                    style: {
                        background: '#101111',
                        color: '#fff',
                        border: '1px solid #10b981',
                        borderRadius: '16px',
                        padding: '16px 24px',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }
                });
            } else {
                toast.error("INVALID CLEARANCE KEY", {
                    icon: '🚫',
                    style: {
                        background: '#101111',
                        color: '#fff',
                        border: '1px solid #ef4444',
                        borderRadius: '16px',
                        padding: '16px 24px',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }
                });
                setLocalPin('');
            }
        };

        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-['Outfit']">
                {/* Advanced Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05)_0%,transparent_50%)]" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
                
                <motion.div 
                    animate={{ 
                        backgroundPosition: ['0% 0%', '100% 100%'],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-0 bg-[linear-gradient(45deg,rgba(16,185,129,0.05)_25%,transparent_25%,transparent_50%,rgba(16,185,129,0.05)_50%,rgba(16,185,129,0.05)_75%,transparent_75%,transparent_100%)] bg-[length:100px_100px]"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-2xl w-full relative z-10"
                >
                    <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08] rounded-[40px] p-2 sm:p-4 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                        <div className="bg-[#0a0a0a] rounded-[32px] p-12 sm:p-20 border border-white/[0.05] relative overflow-hidden">
                            {/* Inner Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
                            
                            <div className="relative z-10 space-y-16">
                                <div className="space-y-8 text-center">
                                    <motion.div
                                        initial={{ rotateY: 90 }}
                                        animate={{ rotateY: 0 }}
                                        transition={{ delay: 0.3, duration: 1 }}
                                        className="w-24 h-24 bg-gradient-to-br from-accent to-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] relative group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <ShieldCheck size={48} className="text-white drop-shadow-lg" />
                                    </motion.div>
                                    
                                    <div className="space-y-3">
                                        <h2 className="text-5xl sm:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
                                            MASTER <span className="text-accent underline decoration-accent/20">CONTROL</span>
                                        </h2>
                                        <div className="flex items-center justify-center gap-4 text-emerald-500/40">
                                            <div className="h-px w-8 bg-emerald-500/20" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.8em] animate-pulse">Neural Encryption Active</span>
                                            <div className="h-px w-8 bg-emerald-500/20" />
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-12">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center px-2">
                                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Secret Clearance Code</label>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
                                                <span className="text-[9px] font-black text-accent uppercase tracking-widest">Live Link</span>
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-accent/50 to-emerald-500/50 rounded-2xl blur opacity-20 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200" />
                                            <div className="relative flex items-center">
                                                <Lock className="absolute left-8 text-white/20 group-focus-within:text-accent transition-colors" size={24} />
                                                <input
                                                    type="password"
                                                    value={localPin}
                                                    onChange={(e) => setLocalPin(e.target.value)}
                                                    placeholder="ENTER CLEARANCE KEY"
                                                    autoFocus
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-10 pl-20 pr-8 text-4xl font-black tracking-[12px] text-center text-accent focus:outline-none focus:border-accent/50 transition-all placeholder:tracking-normal placeholder:text-white/5 uppercase shadow-2xl"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-10 bg-accent hover:bg-emerald-400 text-white rounded-2xl font-black uppercase italic tracking-[0.5em] text-lg transition-all shadow-[0_0_40px_rgba(16,185,129,0.2)] active:scale-[0.98] group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
                                        <span className="relative z-10 flex items-center justify-center gap-4">
                                            Initialize Core <Zap size={24} className="group-hover:scale-125 transition-transform" />
                                        </span>
                                    </button>
                                </form>

                                <div className="pt-10 border-t border-white/[0.05] flex flex-col items-center gap-8">
                                    <div className="flex items-center gap-10">
                                        <div className="text-center space-y-1">
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">Authority</p>
                                            <p className="text-[11px] font-black text-white/60 uppercase italic tracking-tighter leading-none">Master Admin</p>
                                        </div>
                                        <div className="w-px h-8 bg-white/5" />
                                        <div className="text-center space-y-1">
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">Security</p>
                                            <p className="text-[11px] font-black text-emerald-500 uppercase italic tracking-tighter leading-none font-mono">Bypassing...</p>
                                        </div>
                                    </div>
                                    <code className="px-6 py-2 bg-white/[0.02] rounded-full text-[9px] font-mono text-white/20 border border-white/[0.05]">{user?.uid || 'AWAITING_MASTER_SIGNAL'}</code>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-12 text-center">
                        <p className="text-[9px] font-black text-white/10 uppercase tracking-[1em]">Antigravity Intelligence Systems • v4.0.2</p>
                    </div>
                </motion.div>
            </div>
        );
    };

    if (!isAuthorized) return <MasterLock />;

    const AdminSettings = () => (
        <div className="max-w-2xl mx-auto space-y-10">
            <div className="glass-card p-10 border-white/5">
                <h3 className="text-2xl font-black italic uppercase tracking-tight mb-8">Admin <span className="logo-accent">Profile</span></h3>

                <div className="space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-[10px] flex items-center justify-center text-accent shadow-2xl">
                            <UserCircle size={40} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h4 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900">{userData?.name || 'MASTER ADMIN'}</h4>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-1">{user?.email}</p>
                        </div>
                    </div>

                    <div className="p-6 bg-accent/5 border border-accent/10 rounded-[10px] space-y-4">
                        <div className="flex items-center gap-3 text-accent">
                            <Info size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Public Control Terminal</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">
                            This interface is currently open for public access as per request. Use with caution.
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-4 py-6 bg-slate-100 border border-black/[0.05] hover:bg-white text-slate-500 hover:text-black rounded-[10px] font-black uppercase italic tracking-[4px] transition-all group active:scale-95 shadow-sm"
                    >
                        Exit Terminal <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="text-center opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[5px] text-slate-700">JRT MASTER ENGINE V4.0.2</p>
                <div className="flex justify-center gap-4 mt-4 text-slate-800">
                    <RefreshCcw size={14} className="animate-spin-slow" />
                    <Activity size={14} />
                    <Zap size={14} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-transparent text-slate-900 selection:bg-accent/30 font-['Outfit']">
            {/* Super Admin Top Bar - Platinum Edition */}
                        <header className="sticky top-0 z-[110] bg-white/40 backdrop-blur-xl border-b border-black/[0.03] py-4 px-8 lg:px-12 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="relative group">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 bg-accent rounded-[12px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" 
                        />
                        <div className="relative bg-white/80 p-3 rounded-[12px] border border-black/[0.05] flex items-center justify-center shadow-xl backdrop-blur-md">
                            <ShieldCheck size={24} className={userData?.isAdmin ? "text-accent animate-pulse" : "text-red-500"} />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none flex items-baseline gap-2">
                            <span className="text-slate-900">JRT</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-indigo-500 to-red-600 bg-[length:200%_auto] animate-gradient-x">MASTER PANEL</span>
                        </h1>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-2 py-0.5 bg-slate-100 rounded-full border border-black/[0.03]">
                                <span className={`w-1.5 h-1.5 rounded-full animate-ping ${userData?.isAdmin ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${userData?.isAdmin ? 'text-slate-500' : 'text-red-500'}`}>
                                    {userData?.isAdmin ? 'Authority Verified' : 'Access Restricted'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-2 bg-slate-900/5 px-4 py-2 rounded-xl border border-black/[0.02]">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 tabular-nums">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="p-3 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition-all active:scale-90 border border-black/[0.05] group relative shadow-sm"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-[9px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-white whitespace-nowrap">Terminate Session</span>
                    </button>
                </div>
            </header>

                        <div className="max-w-[1780px] mx-auto p-8 lg:p-12 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-accent/5 to-transparent pointer-events-none -z-10 blur-3xl opacity-50" />

                {/* Navigation System */}
                <div className="mb-16 flex items-center justify-center">
                    <nav className="flex items-center gap-1.5 bg-white/50 backdrop-blur-md p-1.5 rounded-[18px] border border-black/[0.05] shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const hasBadge = (tab.id === 'recharges' && stats.pendingRecharges > 0) || 
                                           (tab.id === 'withdrawals' && stats.pendingWithdrawals > 0) || 
                                           (tab.id === 'support' && stats.unreadSupport > 0);
                            const badgeValue = tab.id === 'recharges' ? stats.pendingRecharges : 
                                             tab.id === 'withdrawals' ? stats.pendingWithdrawals : 
                                             stats.unreadSupport;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-[14px] font-black uppercase italic tracking-widest text-[10px] transition-all relative shrink-0 group ${
                                        isActive 
                                        ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' 
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.03]'
                                    }`}
                                >
                                    {isActive && (
                                        <motion.div 
                                            layoutId="activeTabGlow"
                                            className="absolute inset-0 bg-accent rounded-[14px] blur-md opacity-20 -z-10"
                                        />
                                    )}
                                    <tab.icon size={16} className={`${isActive ? 'text-accent' : 'group-hover:rotate-12 transition-transform'}`} />
                                    <span>{tab.label}</span>
                                    
                                    {hasBadge && (
                                        <motion.span 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1.5 bg-red-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg z-10 animate-bounce"
                                        >
                                            {badgeValue}
                                        </motion.span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content Area - Render sub-pages based on tab */}
                                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20, filter: 'blur(15px)' }}
                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-[700px] relative z-20"
                >
                    {activeTab === 'overview' && <AdminOverview />}
                    {activeTab === 'markets' && <AdminPanel />}
                    {activeTab === 'users' && <AdminUsers />}
                    {activeTab === 'recharges' && <AdminRecharges />}
                    {activeTab === 'withdrawals' && <AdminWithdrawals />}
                    {activeTab === 'casino' && <AdminCasino stats={stats} />}
                    {activeTab === 'support' && <AdminSupport />}
                    {activeTab === 'settings' && <AdminSettings />}
                </motion.div>
            </div>
        </div>
    );
};

// dedicated Casino Control Module
const AdminCasino = ({ stats }) => {
    const [settings, setSettings] = useState({
        houseEdge: 1, // 1%
        crashMultiplierLimit: 100,
        minesProbBias: 0,
        activeGames: ['mines', 'dice', 'crash', 'color', 'chicken', 'plinko'],
        // Precision Controls
        forceCrashPoint: 1.5,
        rigNextCrash: false,
        rigCrashRange2_4x: false,
        autoMaxCrashLimit: 0,
        trapNextMine: false,
        trapAtClick: 0,
        autoMaxMinesMultiplier: 0,
        lastUpdated: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'casino'), d => {
            if (d.exists()) setSettings(prev => ({ ...prev, ...d.data() }));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const updateSettings = async (newVal) => {
        try {
            await setDoc(doc(db, 'settings', 'casino'), {
                ...newVal,
                lastUpdated: serverTimestamp()
            }, { merge: true });
            toast.success('Casino Parameters Synchronized');
        } catch (e) {
            toast.error('Failed to sync settings');
        }
    };

    const toggleGame = (gameId) => {
        const newActive = settings.activeGames.includes(gameId)
            ? settings.activeGames.filter(id => id !== gameId)
            : [...settings.activeGames, gameId];
        updateSettings({ activeGames: newActive });
    };

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 relative">
            {/* Ambient subtle glows */}
            <div className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full pointer-events-none opacity-50" />
            <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none opacity-50" />

            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 relative z-10">
                <div className="space-y-5">
                    <div className="flex items-center gap-5">
                        <div className="w-2 h-12 bg-accent rounded-full shadow-lg" />
                        <div>
                            <h3 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900">
                                CASINO <span className="text-accent">COMMAND</span>
                            </h3>
                            <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.5em] mt-2">Neural Risk Architecture & Game Logic Terminal</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 px-10 py-6 bg-white rounded-[10px] border border-black/5 shadow-sm">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-md" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Grid Status</span>
                            <span className="text-xs font-black uppercase italic tracking-tighter text-emerald-600">Node Sync: 100%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Control Matrix Table (Quick Reference) */}
            <div className="glass-card p-1 pb-1 border-black/[0.05] bg-white relative z-10 overflow-hidden text-slate-900">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-black/[0.05]">
                    {[
                        { label: 'Risk Scale', val: 'House Edge', icon: BarChart3 },
                        { label: 'Chaos Bias', val: 'Mine Density', icon: Bomb },
                        { label: 'Manual Pin', val: 'Crash Point', icon: Rocket },
                        { label: 'Trap Logic', val: 'Mine Seizure', icon: Zap },
                        { label: 'Availability', val: 'Service Grid', icon: Gamepad2 },
                        { label: 'Live Audit', val: 'Revenue Map', icon: TrendingUp },
                    ].map((item, i) => (
                        <div key={i} className="p-8 flex flex-col items-center gap-3 hover:bg-slate-50 transition-colors group">
                            <item.icon size={24} className="text-slate-600 group-hover:text-accent transition-colors" />
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{item.label}</p>
                                <p className="text-[11px] font-black text-slate-900 uppercase italic tracking-tighter">{item.val}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Global Risk control */}
                <div className="lg:col-span-1 space-y-10">
                    <div className="glass-card p-12 !bg-white border-black/[0.05] space-y-12 relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/5 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-1000" />

                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-accent/5 rounded-[10px] text-accent border border-accent/10 shadow-sm transition-transform duration-1000">
                                <BarChart3 size={32} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Global <span className="text-accent">Risk</span></h4>
                                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-1">Platform Margin Logic</p>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-5">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">HOUSE EDGE</span>
                                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded-[10px] border border-emerald-100">{settings.houseEdge}%</span>
                                </div>
                                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden border border-black/[0.03] group/slider">
                                    <div className="absolute inset-0 bg-accent/5" />
                                    <input
                                        type="range" min="0" max="10" step="0.5"
                                        value={settings.houseEdge}
                                        onChange={e => updateSettings({ houseEdge: parseFloat(e.target.value) })}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="h-full bg-accent shadow-md transition-all duration-300" style={{ width: `${(settings.houseEdge / 10) * 100}%` }} />
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="flex justify-between items-center px-2">
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">DIFFICULTY BIAS</span>
                                    <span className="px-4 py-1.5 bg-accent/5 text-accent text-[11px] font-black rounded-[10px] border border-accent/10">{settings.minesProbBias}%</span>
                                </div>
                                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden border border-black/[0.03]">
                                    <div className="absolute inset-0 bg-accent/5" />
                                    <input
                                        type="range" min="-10" max="10" step="1"
                                        value={settings.minesProbBias}
                                        onChange={e => updateSettings({ minesProbBias: parseInt(e.target.value) })}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="h-full bg-accent shadow-md transition-all duration-300" style={{ width: `${((settings.minesProbBias + 10) / 20) * 100}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Precision Controls */}
                    <div className="glass-card p-12 bg-white border-black/[0.05] space-y-10 relative overflow-hidden ring-1 ring-red-500/10 group shadow-lg">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                            <ShieldAlert size={120} className="text-red-500 rotate-12" />
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="p-5 bg-red-500/10 rounded-[10px] text-red-500 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] group-hover:scale-110 transition-transform">
                                <Zap size={32} />
                            </div>
                            <div>
                                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-red-500 flex items-center gap-3">
                                    Manual <span className="text-slate-900">Overrides</span>
                                </h4>
                                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest mt-1">Direct Matrix Intervention</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Crash Control */}
                            <div className="p-8 bg-slate-50 rounded-[10px] border border-black/[0.05] space-y-8 relative group/rig shadow-inner">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-orange-600">
                                        <div className="p-2 bg-orange-50 rounded-[10px] border border-orange-100">
                                            <Rocket size={18} />
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-600">Crash rigging</span>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${settings.rigNextCrash ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse' : 'bg-slate-200'}`} />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-widest block ml-2">force crash point (x)</label>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.01"
                                            value={settings.forceCrashPoint}
                                            onChange={e => updateSettings({ forceCrashPoint: parseFloat(e.target.value) })}
                                            className="w-full bg-white border-2 border-black/[0.1] rounded-[10px] px-8 py-7 text-4xl font-black text-slate-900 focus:outline-none focus:border-red-500/30 transition-all text-center tracking-tighter shadow-sm"
                                            placeholder="1.50"
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 font-black italic text-xl">X</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => updateSettings({ rigNextCrash: !settings.rigNextCrash })}
                                    className={`w-full py-7 rounded-[10px] text-[12px] font-black uppercase italic tracking-[5px] transition-all relative overflow-hidden group/btn ${settings.rigNextCrash ? 'bg-red-500 text-white shadow-[0_25px_50px_rgba(239,68,68,0.4)]' : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-black/[0.05] shadow-sm'}`}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-4">
                                        {settings.rigNextCrash ? 'DEACTIVATE RIG' : 'ACTIVATE FIXED CRASH'}
                                        {settings.rigNextCrash && <ShieldAlert size={18} className="animate-bounce" />}
                                    </div>
                                </button>

                                {/* 2x - 4x Range Rig */}
                                <div className="pt-4 mt-4 border-t border-black/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-orange-600">
                                            <div className="p-2 bg-orange-50 rounded-[10px] border border-orange-100">
                                                <Rocket size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Force Range (2x-4x)</span>
                                        </div>
                                        <div className={`w-2.5 h-2.5 rounded-full ${settings.rigCrashRange2_4x ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.8)] animate-pulse' : 'bg-slate-200'}`} />
                                    </div>

                                    <button
                                        onClick={() => updateSettings({ rigCrashRange2_4x: !settings.rigCrashRange2_4x })}
                                        className={`w-full py-5 rounded-[10px] text-[10px] font-black uppercase italic tracking-[4px] transition-all relative overflow-hidden group/btn flex items-center justify-center gap-3 ${settings.rigCrashRange2_4x ? 'bg-orange-500 text-white shadow-[0_15px_30px_rgba(249,115,22,0.4)]' : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-black/[0.05] shadow-sm'}`}
                                    >
                                        {settings.rigCrashRange2_4x ? 'DEACTIVATE RANGE' : 'ACTIVATE RANGE RIG'}
                                    </button>
                                </div>

                                {/* Auto Max Limit */}
                                <div className="pt-4 mt-4 border-t border-black/5 space-y-4">
                                    <div className="flex items-center gap-3 text-blue-600">
                                        <div className="p-2 bg-blue-50 rounded-[10px] border border-blue-100">
                                            <Rocket size={14} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Auto Max Limit</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.01"
                                            value={settings.autoMaxCrashLimit || ''}
                                            onChange={e => updateSettings({ autoMaxCrashLimit: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-white border-2 border-black/[0.1] rounded-[10px] px-8 py-5 text-2xl font-black text-slate-900 focus:outline-none focus:border-blue-500/30 transition-all text-center tracking-tighter shadow-sm"
                                            placeholder="No Limit (0)"
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 font-black italic text-xl">X</div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center px-4">Set to 0 to remove limit. If set, normal auto games will never exceed this multiplier.</p>
                                </div>
                            </div>

                            {/* Mines Control */}
                            <div className="p-8 bg-slate-50 rounded-[10px] border border-black/[0.1] space-y-8 group/trap hover:border-emerald-500/40 transition-colors shadow-inner">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-emerald-600">
                                        <div className="p-2.5 bg-emerald-50 rounded-[10px] border border-emerald-100">
                                            <Bomb size={20} />
                                        </div>
                                        <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-600">Mines trap</span>
                                    </div>
                                    <div className={`w-3.5 h-3.5 rounded-full ${settings.trapNextMine ? 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,1)] animate-pulse' : 'bg-slate-200'}`} />
                                </div>

                                <p className="text-[10px] text-slate-500 font-black uppercase leading-relaxed tracking-wider px-2 text-center">
                                    Seize immediate tile control. Next interaction results in forced asset liquidation.
                                </p>

                                <button
                                    onClick={() => updateSettings({ trapNextMine: !settings.trapNextMine })}
                                    className={`w-full py-7 rounded-[10px] text-[12px] font-black uppercase italic tracking-[5px] transition-all relative overflow-hidden ${settings.trapNextMine ? 'bg-red-500 text-white shadow-[0_25px_50px_rgba(239,68,68,0.4)]' : 'bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 border border-black/[0.05] shadow-sm'}`}
                                >
                                    <div className="relative z-10 flex items-center justify-center gap-4">
                                        {settings.trapNextMine ? 'DISARM TRAP' : 'ARM NEURAL TRAP'}
                                        <div className={`w-2 h-2 rounded-full ${settings.trapNextMine ? 'bg-white animate-ping' : 'bg-transparent'}`} />
                                    </div>
                                </button>

                                {/* Exact Click Trap Option */}
                                <div className="pt-4 mt-4 border-t border-black/5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-emerald-600">
                                            <div className="p-2 bg-emerald-50 rounded-[10px] border border-emerald-100">
                                                <Bomb size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Fix Bomb at Click</span>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="number" step="1"
                                            value={settings.trapAtClick || ''}
                                            onChange={e => updateSettings({ trapAtClick: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-white border-2 border-black/[0.1] rounded-[10px] px-8 py-5 text-2xl font-black text-slate-900 focus:outline-none focus:border-emerald-500/30 transition-all text-center tracking-tighter shadow-sm"
                                            placeholder="Ex: 2 (for 2nd box)"
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 font-[10px] font-black uppercase italic">Click</div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center px-4">Set to 0 to disable. If set, this exact box number will always be a bomb.</p>
                                </div>

                                {/* Auto Max Mines Multiplier Limit */}
                                <div className="pt-4 mt-4 border-t border-black/5 space-y-4">
                                    <div className="flex items-center gap-3 text-cyan-600">
                                        <div className="p-2 bg-cyan-50 rounded-[10px] border border-cyan-100">
                                            <Rocket size={14} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Auto Max Multiplier</span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number" step="0.01"
                                            value={settings.autoMaxMinesMultiplier || ''}
                                            onChange={e => updateSettings({ autoMaxMinesMultiplier: parseFloat(e.target.value) || 0 })}
                                            className="w-full bg-white border-2 border-black/[0.1] rounded-[10px] px-8 py-5 text-2xl font-black text-slate-900 focus:outline-none focus:border-cyan-500/30 transition-all text-center tracking-tighter shadow-sm"
                                            placeholder="No Limit (0)"
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 font-black italic text-xl">X</div>
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest text-center px-4">Set to 0 to remove limit. Game forces a bomb if winning exceeds this X.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Availability Grid */}
                <div className="lg:col-span-2 glass-card p-12 border-black/[0.05] bg-white relative overflow-hidden shadow-lg">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

                    <div className="flex items-center justify-between mb-16 relative z-10">
                        <div>
                            <h4 className="text-4xl font-black italic uppercase tracking-tighter">Global <span className="text-accent underline decoration-accent/20 underline-offset-8">Service</span> Grid</h4>
                            <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-3">Algorithmic Node Availability Control</p>
                        </div>
                        <div className="flex items-center gap-4 px-8 py-4 bg-slate-100 rounded-full border border-black/[0.05] shadow-inner">
                            <Gamepad2 size={24} className="text-accent animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Active Nodes</span>
                                <span className="text-lg font-black italic tracking-tighter text-slate-900">{settings.activeGames.length} Online</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-10 relative z-10">
                        {[
                            { id: 'crash', name: 'Crash', icon: Rocket, color: 'text-orange-500', desc: 'Exponential Probability' },
                            { id: 'mines', name: 'Mines', icon: Bomb, color: 'text-emerald-500', desc: 'Strategic Grid Traps' },
                            { id: 'dice', name: 'Dice', icon: Dice5, color: 'text-indigo-500', desc: 'High Fidelity Entropy' },
                            { id: 'color', name: 'Color Prediction', icon: BarChart3, color: 'text-yellow-500', desc: 'Spectrum Market analysis' },
                            { id: 'chicken', name: 'Chicken 2 Road', icon: Play, color: 'text-emerald-400', desc: 'Hyper-Strategic Path' },
                            { id: 'plinko', name: 'Plinko', icon: Sparkles, color: 'text-pink-500', desc: 'Gravity Drop Game' },
                            { id: 'slots', name: 'Mega Slots', icon: Sparkles, color: 'text-pink-500', desc: 'RNG Visual Reels' },
                        ].map(game => {
                            const isActive = settings.activeGames.includes(game.id);
                            return (
                                <motion.div
                                    key={game.id}
                                    whileHover={{ y: -8, scale: 1.03 }}
                                    className={`p-10 rounded-[10px] border transition-all duration-700 flex flex-col items-center text-center gap-8 group/game relative overflow-hidden ${isActive ? 'bg-white border-black/[0.05] shadow-xl hover:border-accent/50' : 'bg-slate-50 border-black/[0.05] grayscale opacity-40 shadow-none'}`}
                                >
                                    <div className={`p-8 bg-slate-50 rounded-[10px] border border-black/[0.05] relative group-hover/game:shadow-[0_0_40px_rgba(var(--accent)/0.3)] transition-all duration-500 ${game.color} shadow-inner`}>
                                        <game.icon size={48} className="relative z-10 group-hover/game:scale-110 transition-transform duration-500" />
                                        <div className={`absolute inset-0 blur-3xl opacity-30 ${game.color} bg-current rounded-full group-hover:opacity-50 transition-opacity`} />
                                    </div>
                                    <div className="space-y-3">
                                        <h5 className="font-black italic uppercase tracking-tighter text-2xl text-slate-900">{game.name}</h5>
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{game.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleGame(game.id)}
                                        className={`w-full py-5 rounded-[10px] text-[11px] font-black uppercase italic tracking-[4px] transition-all flex items-center justify-center gap-4 ${isActive ? 'bg-slate-50 hover:bg-red-500 hover:text-white text-slate-500 border border-black/[0.05] shadow-sm' : 'bg-accent text-white shadow-lg'}`}
                                    >
                                        {isActive ? (
                                            <><Lock size={16} /> Disable Node</>
                                        ) : (
                                            <><Unlock size={16} /> Restore Node</>
                                        )}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Platform Analytics Card */}
            <div className="glass-card p-20 border-white/10 relative overflow-hidden group bg-gradient-to-r from-emerald-500/[0.05] via-transparent to-accent/[0.05] shadow-[0_30px_70px_rgba(0,0,0,0.6)] z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 blur-[150px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
                <div className="relative flex flex-col xl:flex-row items-center justify-between gap-20">
                    <div className="space-y-8 max-w-xl">
                        <div className="flex items-center gap-8">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-[10px] flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative">
                                <TrendingUp size={48} />
                                <div className="absolute inset-0 bg-emerald-500/30 blur-2xl animate-pulse" />
                            </div>
                            <div>
                                <h4 className="text-5xl font-black italic uppercase tracking-tighter text-white">Project <span className="text-emerald-500">Revenue</span></h4>
                                <p className="text-slate-500 text-[12px] font-black uppercase tracking-[0.5em] mt-3 italic drop-shadow-sm">Real-time Financial Matrix Projection</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-12 lg:gap-32 text-center">
                        <div className="space-y-5">
                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em]">Global Circulation</p>
                            <h5 className="text-7xl font-black italic tracking-tighter uppercase text-white leading-none flex items-baseline justify-center gap-3">
                                <span className="text-4xl text-slate-700 not-italic tracking-normal">₹</span>
                                {(stats.totalDeposit * 2.4).toLocaleString()}
                            </h5>
                        </div>
                        <div className="h-32 w-px bg-white/10 hidden xl:block" />
                        <div className="space-y-5">
                            <p className="text-[12px] font-black text-slate-500 uppercase tracking-[0.5em]">platform capture</p>
                            <h5 className="text-7xl font-black italic tracking-tighter uppercase text-emerald-500 leading-none flex items-baseline justify-center gap-3">
                                <span className="text-4xl text-emerald-900 not-italic tracking-normal">+</span>
                                {(stats.totalDeposit * 0.12).toLocaleString()}
                            </h5>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Dedicated Support Module for Admin
const AdminSupport = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const scrollRef = useRef();

    useEffect(() => {
        const q = query(collection(db, 'support_chats'), orderBy('updatedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (s) => {
            setChats(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!selectedChat) return;
        const q = query(collection(db, 'support_chats', selectedChat.id, 'messages'), orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, (s) => {
            setMessages(s.docs.map(d => ({ id: d.id, ...d.data() })));
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        // Mark as read
        updateDoc(doc(db, 'support_chats', selectedChat.id), { unreadAdmin: false });

        return () => unsubscribe();
    }, [selectedChat]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!reply.trim() || !selectedChat) return;
        const text = reply;
        setReply('');
        await addDoc(collection(db, 'support_chats', selectedChat.id, 'messages'), {
            senderId: 'admin',
            text,
            type: 'text',
            createdAt: serverTimestamp()
        });
        await setDoc(doc(db, 'support_chats', selectedChat.id), {
            lastMessage: text,
            updatedAt: serverTimestamp(),
            unreadAdmin: false
        }, { merge: true });
    };

        return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-350px)] min-h-[700px]">
            {/* Chat List */}
            <div className="lg:col-span-1 border border-black/[0.03] rounded-[24px] overflow-hidden flex flex-col bg-white shadow-sm">
                <div className="p-8 border-b border-black/[0.03] bg-gradient-to-br from-slate-50 to-transparent">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-slate-900">
                        <MessageCircle size={24} className="text-accent group-hover:rotate-12 transition-transform" />
                        Live <span className="text-accent underline decoration-accent/10">Inbound</span>
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Direct Secure Terminals</p>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {chats.map(chat => (
                        <button
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`w-full p-8 flex items-center gap-6 hover:bg-slate-50 transition-all text-left border-b border-black/[0.02] relative group ${selectedChat?.id === chat.id ? 'bg-slate-50' : ''}`}
                        >
                            {selectedChat?.id === chat.id && (
                                <motion.div layoutId="activeChatBar" className="absolute left-0 inset-y-0 w-1.5 bg-accent rounded-r-full shadow-lg" />
                            )}
                            <div className="w-16 h-16 rounded-[20px] bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 border border-black/[0.05] shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 overflow-hidden relative">
                                <UserCircle size={32} className="relative z-10" />
                                <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="font-black text-sm truncate pr-2 uppercase italic tracking-tighter text-slate-900 group-hover:text-accent transition-colors">{chat.userName || 'Root Node'}</h4>
                                    {chat.unreadAdmin && (
                                        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/20" />
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 truncate font-black uppercase tracking-widest">{chat.lastMessage}</p>
                            </div>
                        </button>
                    ))}
                    {chats.length === 0 && (
                        <div className="p-20 text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border border-black/[0.03] shadow-inner text-slate-200">
                                <MessageCircle size={32} />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">No Active Data Stream</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Terminal */}
            <div className="lg:col-span-3 glass-card flex flex-col overflow-hidden border-white/5 bg-[#050510]/20 backdrop-blur-3xl">
                {selectedChat ? (
                    <>
                        <div className="p-8 border-b border-white/5 bg-[#0a0a14]/60 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-[10px] bg-accent/20 flex items-center justify-center text-accent ring-1 ring-accent/30 shadow-2xl">
                                    <Headset size={28} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">{selectedChat.userName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Signal Stable • {selectedChat.id}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="px-5 py-2.5 bg-zinc-900/50 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                    Live Terminal
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 space-y-8 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-fixed opacity-90">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[65%] min-w-[120px] rounded-[10px] px-8 py-5 space-y-2 relative group shadow-2xl ${msg.senderId === 'admin' ? 'bg-accent text-white rounded-tr-none' : 'bg-[#0a0a14] border border-white/5 text-zinc-200 rounded-tl-none'}`}>
                                        <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
                                        <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black tracking-widest uppercase">{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                            {msg.senderId === 'admin' && <CheckCheck size={12} className="text-emerald-300" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                        <form onSubmit={handleSend} className="p-8 bg-[#0a0a14]/80 border-t border-white/5 flex gap-6">
                            <div className="flex-1 relative group">
                                <div className="absolute inset-0 bg-accent/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <input
                                    value={reply}
                                    onChange={e => setReply(e.target.value)}
                                    placeholder="TYPE COMMAND RESPONSE..."
                                    className="relative w-full bg-black/50 border border-white/10 rounded-[10px] px-10 py-6 text-sm font-black italic tracking-[0.1em] text-white focus:outline-none focus:border-accent transition-all uppercase placeholder:opacity-20 shadow-inner"
                                />
                            </div>
                            <button className="px-10 bg-accent text-white rounded-[10px] shadow-[0_15px_30px_rgba(79,70,229,0.3)] hover:bg-indigo-500 active:scale-95 transition-all flex items-center justify-center">
                                <Send size={24} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                        <div className="relative mb-10">
                            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <div className="w-28 h-28 bg-[#0a0a14] border border-white/10 rounded-[10px] flex items-center justify-center text-accent relative shadow-2xl">
                                <Headset size={54} className="opacity-40" />
                            </div>
                        </div>
                        <h4 className="text-lg font-black uppercase italic tracking-[0.4em] mb-3 text-white">Terminal Standby</h4>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] max-w-sm leading-loose">Awaiting communication signal. Select an active channel from the support inbox to initialize the neural link.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
