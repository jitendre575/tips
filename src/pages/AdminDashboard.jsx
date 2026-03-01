import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, increment, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
    Users, LayoutDashboard, Wallet, CreditCard, Search, Filter,
    TrendingUp, Activity, CheckCircle2, XCircle, Clock,
    ShieldCheck, Zap, Plus, LogOut, ExternalLink, Calendar, Mail,
    Settings, PieChart, Shield, RefreshCcw, UserCircle, Edit2, Info, Headset
} from 'lucide-react';
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
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingRecharges: 0,
        pendingWithdrawals: 0,
        activeMatches: 0,
        totalDeposit: 0,
        totalWithdraw: 0,
        platformBalance: 0,
        unreadSupport: 0
    });

    const tabs = [
        { id: 'overview', label: 'Overview', icon: PieChart },
        { id: 'markets', label: 'Markets', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'recharges', label: 'Deposits', icon: Wallet },
        { id: 'withdrawals', label: 'Withdraw', icon: CreditCard },
        { id: 'support', label: 'Support', icon: Headset },
        { id: 'settings', label: 'Identity', icon: Shield },
    ];

    useEffect(() => {
        // Comprehensive Multi-Stat Listener
        const unsubUsers = onSnapshot(collection(db, 'users'), s => {
            const usersData = s.docs.map(d => d.data());
            // const activeMatchesCount = s.docs.filter(d => d.data().status !== 'Finished').length; // This line was incorrect, activeMatches should come from 'matches' collection

            const tDeposit = usersData.reduce((acc, u) => acc + (u.totalDeposit || 0), 0);
            const tWithdraw = usersData.reduce((acc, u) => acc + (u.totalWithdraw || 0), 0);

            setStats(prev => ({
                ...prev,
                totalUsers: s.size,
                totalDeposit: tDeposit,
                totalWithdraw: tWithdraw,
                platformBalance: tDeposit - tWithdraw
            }));
        });

        const unsubRecharges = onSnapshot(query(collection(db, 'rechargeRequests')), s => {
            setStats(prev => ({ ...prev, pendingRecharges: s.docs.filter(d => d.data().status === 'Pending').length }));
        });

        const unsubWithdrawals = onSnapshot(query(collection(db, 'withdrawals')), s => {
            setStats(prev => ({ ...prev, pendingWithdrawals: s.docs.filter(d => d.data().status === 'pending').length }));
        });

        const unsubMatches = onSnapshot(collection(db, 'matches'), s => {
            setStats(prev => ({ ...prev, activeMatches: s.docs.filter(d => d.data().status !== 'Finished').length }));
        });

        const unsubSupport = onSnapshot(query(collection(db, 'support_chats'), where('unreadAdmin', '==', true)), s => {
            setStats(prev => ({ ...prev, unreadSupport: s.size }));
        });

        return () => {
            unsubUsers();
            unsubRecharges();
            unsubWithdrawals();
            unsubMatches();
            unsubSupport();
        };
    }, []);

    const handleLogout = () => {
        window.location.href = '/';
    };

    // Sub-modules built inside for clean state
    const AdminOverview = () => (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
                {[
                    { label: 'Platform Balance', val: `₹${stats.platformBalance.toLocaleString()}`, icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'Total Revenue', val: `₹${stats.totalDeposit.toLocaleString()}`, icon: TrendingUp, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                    { label: 'Active Capital', val: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Live Markets', val: stats.activeMatches, icon: Activity, color: 'text-red-500', bg: 'bg-red-500/10' },
                ].map((s, i) => (
                    <div key={i} className="glass-card p-8 border-white/5 group hover:border-red-500/30 transition-all">
                        <div className={`w-14 h-14 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} mb-6 border border-white/5`}>
                            <s.icon size={28} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600 mb-2">{s.label}</p>
                        <h4 className="text-3xl font-black italic tracking-tighter uppercase tabular-nums">{s.val}</h4>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass-card p-10 border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <Activity size={120} />
                    </div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tight mb-8">System <span className="logo-red">Health</span></h3>
                    <div className="grid sm:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-zinc-500">
                                <span>Recharge Queue</span>
                                <span className={stats.pendingRecharges > 0 ? 'text-yellow-500' : 'text-emerald-500'}>{stats.pendingRecharges} Pending</span>
                            </div>
                            <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                <div className={`h-full bg-yellow-500 transition-all duration-1000`} style={{ width: `${Math.min(100, stats.pendingRecharges * 20)}%` }} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-zinc-500">
                                <span>Withdrawal Queue</span>
                                <span className={stats.pendingWithdrawals > 0 ? 'text-red-500' : 'text-emerald-500'}>{stats.pendingWithdrawals} Pending</span>
                            </div>
                            <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                <div className={`h-full bg-red-600 transition-all duration-1000`} style={{ width: `${Math.min(100, stats.pendingWithdrawals * 20)}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-10 border-white/5 flex flex-col justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center text-red-500 mx-auto shadow-2xl shadow-red-500/20">
                        <ShieldCheck size={32} />
                    </div>
                    <h4 className="text-xl font-black italic uppercase tracking-tighter">Secure Backend</h4>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed">Platform is running on encrypted Firebase Firestore. All logs are being recorded for audit.</p>
                </div>
            </div>
        </div>
    );

    const AdminSettings = () => (
        <div className="max-w-2xl mx-auto space-y-10">
            <div className="glass-card p-10 border-white/5">
                <h3 className="text-2xl font-black italic uppercase tracking-tight mb-8">Admin <span className="logo-red">Profile</span></h3>

                <div className="space-y-8">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-[30px] flex items-center justify-center text-red-500 shadow-2xl">
                            <UserCircle size={40} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3">
                                <h4 className="text-3xl font-black italic tracking-tighter uppercase">{userData?.name || 'MASTER ADMIN'}</h4>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">{user?.email}</p>
                        </div>
                    </div>

                    <div className="p-6 bg-red-600/5 border border-red-500/10 rounded-3xl space-y-4">
                        <div className="flex items-center gap-3 text-red-500">
                            <Info size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Public Control Terminal</span>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                            This interface is currently open for public access as per request. Use with caution.
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-4 py-6 bg-zinc-900 border border-white/5 hover:bg-white text-zinc-400 hover:text-black rounded-[32px] font-black uppercase italic tracking-[4px] transition-all group active:scale-95"
                    >
                        Exit Terminal <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="text-center opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[5px] text-zinc-600">JRT MASTER ENGINE V4.0.2</p>
                <div className="flex justify-center gap-4 mt-4 text-zinc-700">
                    <RefreshCcw size={14} className="animate-spin-slow" />
                    <Activity size={14} />
                    <Zap size={14} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-red-500/30">
            {/* Super Admin Top Bar */}
            <header className="sticky top-0 z-[100] bg-red-600 border-b border-red-500 py-4 px-6 lg:px-10 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2 rounded-xl border border-white/20">
                        <Zap size={20} className="text-white animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">JRT <span className="text-red-200">MASTER PANEL</span></h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-100 opacity-80">Full Authority Initialized</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {(stats.pendingRecharges > 0 || stats.pendingWithdrawals > 0 || stats.unreadSupport > 0) && (
                        <div className="lg:flex items-center gap-3 bg-white/20 px-4 py-2 rounded-full border border-white/20 hidden">
                            <RefreshCcw size={14} className="animate-spin text-white" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                {stats.pendingRecharges + stats.pendingWithdrawals + stats.unreadSupport} Action Required
                            </span>
                        </div>
                    )}

                    {/* CricWin Support Button */}
                    <button
                        onClick={() => {
                            toast.success("CONNECTING TO CRICWIN SUPPORT...", {
                                icon: '🎧',
                                style: {
                                    background: '#050505',
                                    color: '#fff',
                                    border: '1px solid #ff3333',
                                    fontFamily: 'Outfit, sans-serif',
                                    fontWeight: '900',
                                    textTransform: 'uppercase'
                                }
                            });
                        }}
                        className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white text-white hover:text-red-600 rounded-xl transition-all active:scale-95 border border-white/10 group relative"
                    >
                        <Headset size={20} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">CricWin Support</span>
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-zinc-900 border border-white/10 text-[9px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Help Desk</span>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="p-3 bg-white/10 hover:bg-white text-white hover:text-red-600 rounded-xl transition-all active:scale-95 border border-white/10 group relative"
                    >
                        <LogOut size={20} />
                        <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-zinc-900 border border-white/10 text-[9px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Logout</span>
                    </button>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto p-6 lg:p-10">
                {/* Unified Tab Navigation */}
                <div className="flex flex-wrap gap-4 mb-12 bg-zinc-900/50 p-2 rounded-[32px] border border-white/5 w-fit overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-8 py-4 rounded-[24px] font-black uppercase italic tracking-widest text-xs transition-all relative shrink-0 ${activeTab === tab.id
                                ? 'bg-red-600 text-white shadow-xl shadow-red-600/20'
                                : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span>{tab.label}</span>
                            {(tab.id === 'recharges' || tab.id === 'withdrawals' || tab.id === 'support') && (
                                tab.id === 'recharges' ? stats.pendingRecharges :
                                    tab.id === 'withdrawals' ? stats.pendingWithdrawals :
                                        stats.unreadSupport
                            ) > 0 && (
                                    <span className={`absolute -top-1 -right-1 w-5 h-5 ${tab.id === 'recharges' ? 'bg-yellow-500' : 'bg-red-600'} text-white text-[10px] rounded-full flex items-center justify-center animate-bounce border-2 border-[#050505]`}>
                                        {tab.id === 'recharges' ? stats.pendingRecharges : tab.id === 'withdrawals' ? stats.pendingWithdrawals : stats.unreadSupport}
                                    </span>
                                )}
                        </button>
                    ))}
                </div>

                {/* Main Content Area - Render sub-pages based on tab */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                >
                    {activeTab === 'overview' && <AdminOverview />}
                    {activeTab === 'markets' && <AdminPanel />}
                    {activeTab === 'users' && <AdminUsers />}
                    {activeTab === 'recharges' && <AdminRecharges />}
                    {activeTab === 'withdrawals' && <AdminWithdrawals />}
                    {activeTab === 'support' && <AdminSupport />}
                    {activeTab === 'settings' && <AdminSettings />}
                </motion.div>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]">
            {/* Chat List */}
            <div className="lg:col-span-1 glass-card overflow-hidden flex flex-col border-white/5">
                <div className="p-6 border-b border-white/5">
                    <h3 className="text-xl font-black italic uppercase italic tracking-tighter">Support <span className="text-red-500">Inbox</span></h3>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                    {chats.map(chat => (
                        <button
                            key={chat.id}
                            onClick={() => setSelectedChat(chat)}
                            className={`w-full p-6 flex items-center gap-4 hover:bg-white/5 transition-all text-left border-b border-white/[0.02] ${selectedChat?.id === chat.id ? 'bg-red-600/10 border-l-4 border-l-red-600' : ''}`}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-500 shrink-0">
                                <UserCircle size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-bold text-sm truncate pr-2 uppercase italic tracking-tighter">{chat.userName || 'User'}</h4>
                                    {chat.unreadAdmin && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                                </div>
                                <p className="text-[10px] text-zinc-500 truncate font-medium uppercase tracking-widest">{chat.lastMessage}</p>
                            </div>
                        </button>
                    ))}
                    {chats.length === 0 && (
                        <div className="p-10 text-center opacity-30">
                            <MessageCircle size={40} className="mx-auto mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest">No active chats</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Terminal */}
            <div className="lg:col-span-2 glass-card flex flex-col overflow-hidden border-white/5">
                {selectedChat ? (
                    <>
                        <div className="p-6 border-b border-white/5 bg-zinc-900/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-[15px] bg-red-600/20 flex items-center justify-center text-red-500">
                                    <MessageCircle size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black uppercase italic tracking-tighter text-white">{selectedChat.userName}</h4>
                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[2px]">{selectedChat.id}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] rounded-2xl px-5 py-3 space-y-1 ${msg.senderId === 'admin' ? 'bg-red-600 text-white rounded-tr-none shadow-xl' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                        <div className="flex items-center justify-end gap-1 opacity-50">
                                            <span className="text-[9px] font-bold">{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                            {msg.senderId === 'admin' && <CheckCheck size={10} />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                        <form onSubmit={handleSend} className="p-6 bg-zinc-900/50 border-t border-white/5 flex gap-4">
                            <input
                                value={reply}
                                onChange={e => setReply(e.target.value)}
                                placeholder="TYPE SYSTEM RESPONSE..."
                                className="flex-1 bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm font-black italic tracking-widest text-white focus:outline-none focus:border-red-500/50 transition-all uppercase"
                            />
                            <button className="p-4 bg-red-600 text-white rounded-2xl shadow-xl hover:bg-red-500 active:scale-95 transition-all">
                                <Send size={20} />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 p-10 text-center">
                        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                            <MessageCircle size={40} className="opacity-20" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-[5px] mb-2">Terminal Standby</h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">Select a channel from the inbox to initialize communication.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
