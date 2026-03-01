import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, increment, setDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { User, Mail, Wallet, TrendingUp, CreditCard, Edit2, Check, X, Search, Shield, Phone, Calendar, ArrowUpCircle, ArrowDownCircle, Plus, Minus, AlertCircle, FileText, MessageCircle, Send, CheckCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [chattingUser, setChattingUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [supportStatus, setSupportStatus] = useState({});
    const [walletAction, setWalletAction] = useState({ type: 'add', amount: '', note: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef();

    useEffect(() => {
        // Sync Users
        const qUsers = query(collection(db, 'users'));
        const unsubUsers = onSnapshot(qUsers, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
            setLoading(false);
        });

        // Sync Support Status
        const qSupport = query(collection(db, 'support_chats'));
        const unsubSupport = onSnapshot(qSupport, (snapshot) => {
            const statusMap = {};
            snapshot.docs.forEach(doc => {
                statusMap[doc.id] = doc.data();
            });
            setSupportStatus(statusMap);
        });

        return () => {
            unsubUsers();
            unsubSupport();
        };
    }, []);

    // Sync Messages when chatting with a user
    useEffect(() => {
        if (!chattingUser) return;

        const q = query(
            collection(db, 'support_chats', chattingUser.id, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        // Mark as read when admin opens chat
        updateDoc(doc(db, 'support_chats', chattingUser.id), {
            unreadAdmin: false
        }).catch(err => console.error("Error marking as read:", err));

        return () => unsubscribe();
    }, [chattingUser]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !chattingUser) return;

        const text = newMessage;
        setNewMessage('');

        await addDoc(collection(db, 'support_chats', chattingUser.id, 'messages'), {
            senderId: 'admin',
            text,
            type: 'text',
            createdAt: serverTimestamp()
        });

        await setDoc(doc(db, 'support_chats', chattingUser.id), {
            lastMessage: text,
            updatedAt: serverTimestamp(),
            unreadAdmin: false
        }, { merge: true });
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`ARE YOU ABSOLUTELY SURE? \n\nThis will permanently delete ${user.name || user.email}'s account, wallet, and history. This action cannot be reversed.`)) return;

        try {
            await deleteDoc(doc(db, 'users', user.id));
            toast.success(`User data terminated successfully`);
        } catch (error) {
            console.error("Delete error:", error);
            toast.error("Failed to delete user");
        }
    };

    const handleWalletUpdate = async (userId) => {
        if (!walletAction.amount || parseFloat(walletAction.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        const amount = parseFloat(walletAction.amount);
        const finalAmount = walletAction.type === 'add' ? amount : -amount;

        try {
            await updateDoc(doc(db, 'users', userId), {
                balance: increment(finalAmount),
                ...(walletAction.type === 'add'
                    ? { totalDeposit: increment(amount) }
                    : { totalWithdraw: increment(amount) }
                )
            });

            await addDoc(collection(db, 'history'), {
                userId,
                type: walletAction.type === 'add' ? 'deposit' : 'withdrawal',
                amount: amount,
                status: 'success',
                description: walletAction.note || `Manual ${walletAction.type} by Admin`,
                createdAt: serverTimestamp(),
                isAdminAction: true
            });

            toast.success(`Wallet updated: ${walletAction.type === 'add' ? '+' : '-'}₹${amount}`);
            setEditingUser(null);
            setWalletAction({ type: 'add', amount: '', note: '' });
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update wallet');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-2 w-8 bg-red-500 rounded-full" />
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[4px]">System Overview</span>
                    </div>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                        User <span className="logo-red">Management</span>
                    </h1>
                    <p className="text-zinc-500 font-medium mt-2">Monitor {users.length} registered accounts and control their wallets.</p>
                </div>

                <div className="relative group w-full md:w-96">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-red-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/[0.05] rounded-[24px] py-4 pl-14 pr-6 outline-none focus:border-red-500/30 focus:ring-4 focus:ring-red-500/5 transition-all text-sm font-medium shadow-2xl"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-[400px] glass-card animate-pulse rounded-[32px] bg-zinc-900/50" />
                    ))}
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-zinc-900/30 border-2 border-dashed border-white/5 rounded-[40px] p-20 text-center">
                    <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-600">
                        <User size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">No Users Found</h3>
                    <p className="text-zinc-500 font-medium max-w-xs mx-auto mt-2">Try searching with a different keyword or check your filters.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredUsers.map(user => {
                        const hasUnread = supportStatus[user.id]?.unreadAdmin === true;
                        return (
                            <div key={user.id} className={`group relative bg-[#0a0a0a] border ${hasUnread ? 'border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'border-white/[0.05]'} hover:border-red-500/20 rounded-[40px] p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden`}>
                                {/* Gradient Background Decoration */}
                                <div className={`absolute -top-20 -right-20 w-40 h-40 ${hasUnread ? 'bg-emerald-500/10' : 'bg-red-500/5'} blur-[80px] rounded-full group-hover:bg-red-500/10 transition-colors`} />

                                {hasUnread && (
                                    <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full animate-pulse">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none">New Message</span>
                                    </div>
                                )}

                                {/* User Header */}
                                <div className="flex items-start gap-5 mb-8 relative">
                                    <div className={`w-16 h-16 rounded-[24px] bg-zinc-900 border border-white/5 flex items-center justify-center ${hasUnread ? 'text-emerald-500' : 'text-zinc-500'} group-hover:bg-red-500/10 group-hover:text-red-500 transition-all duration-500 border-red-500/0 group-hover:border-red-500/20 group-hover:scale-110`}>
                                        <User size={32} />
                                    </div>
                                    <div className="flex-1 min-w-0 pt-1">
                                        <h3 className="font-black text-2xl italic tracking-tighter uppercase truncate pr-16 leading-none mb-1">
                                            {user.name || user.email?.split('@')[0]}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                                            Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                    {user.isAdmin && (
                                        <div className="absolute top-0 right-0 p-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
                                            <Shield size={14} />
                                        </div>
                                    )}
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/50 rounded-2xl border border-white/[0.02]">
                                        <Mail size={16} className="text-zinc-600" />
                                        <span className="text-sm font-medium text-zinc-300 truncate">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-zinc-950/50 rounded-2xl border border-white/[0.02]">
                                        <Phone size={16} className="text-zinc-600" />
                                        <span className="text-sm font-medium text-zinc-300">{user.phone || 'No phone added'}</span>
                                    </div>
                                </div>

                                {/* Wallet Stats Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-zinc-950/50 rounded-[32px] p-5 border border-white/[0.03] group/stat hover:bg-zinc-900/50 transition-colors">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Balance</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl font-black italic tracking-tighter text-yellow-500">
                                                ₹{user.balance?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-950/50 rounded-[32px] p-5 border border-white/[0.03] group/stat hover:bg-zinc-900/50 transition-colors">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Bets</span>
                                        <span className="text-2xl font-black italic tracking-tighter text-blue-500">
                                            {user.totalBets || 0}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-950/50 rounded-[32px] p-5 border border-white/[0.03] group/stat hover:bg-zinc-900/50 transition-colors">
                                        <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest block mb-1">Deposit</span>
                                        <span className="text-xl font-black italic tracking-tighter text-emerald-500">
                                            ₹{user.totalDeposit?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-950/50 rounded-[32px] p-5 border border-white/[0.03] group/stat hover:bg-zinc-900/50 transition-colors">
                                        <span className="text-[10px] font-black text-red-500/50 uppercase tracking-widest block mb-1">Withdraw</span>
                                        <span className="text-xl font-black italic tracking-tighter text-red-500">
                                            ₹{user.totalWithdraw?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setChattingUser(user)}
                                        className={`flex items-center justify-center gap-3 py-4 rounded-[24px] font-black uppercase italic tracking-widest transition-all duration-300 shadow-xl group/btn ${hasUnread ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                                    >
                                        <MessageCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        <span>Chat</span>
                                    </button>
                                    <button
                                        onClick={() => setEditingUser(user)}
                                        className="flex items-center justify-center gap-3 py-4 bg-zinc-900 hover:bg-white text-zinc-400 hover:text-black rounded-[24px] font-black uppercase italic tracking-widest transition-all duration-300 shadow-xl group/btn"
                                    >
                                        <Wallet size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        <span>Wallet</span>
                                    </button>
                                </div>
                                <button
                                    onClick={() => handleDeleteUser(user)}
                                    className="w-full mt-4 flex items-center justify-center gap-3 py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-[24px] font-black uppercase italic tracking-widest transition-all duration-300 group/delete hover:scale-[1.02]"
                                >
                                    <Trash2 size={18} className="group-hover/delete:animate-bounce" />
                                    <span>Delete User</span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Support Chat Modal */}
            {chattingUser && (
                <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setChattingUser(null)} />
                    <div className="relative w-full max-w-lg h-[600px] bg-zinc-950 border border-white/10 rounded-[40px] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(16,185,129,0.1)] animate-in zoom-in-95 duration-200">
                        {/* Chat Header */}
                        <div className="p-6 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-emerald-500">
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
                                        Chat with <span className="logo-red">{chattingUser.name || chattingUser.email?.split('@')[0]}</span>
                                    </h3>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{chattingUser.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setChattingUser(null)} className="p-3 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all hover:rotate-90">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <MessageCircle size={48} className="mb-4" />
                                    <p className="text-sm font-black uppercase tracking-widest">No conversation history</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderId === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 space-y-1 ${msg.senderId === 'admin' ? 'bg-red-600 text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                            <div className="flex items-center justify-end gap-1 opacity-50">
                                                <span className="text-[9px] font-medium">{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                {msg.senderId === 'admin' && <CheckCheck size={10} />}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-6 bg-zinc-900/50 border-t border-white/5 flex items-center gap-4">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your reply..."
                                className="flex-1 bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all font-medium"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-4 bg-red-600 text-white rounded-2xl hover:bg-red-500 transition-all active:scale-95 disabled:opacity-50"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Wallet Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setEditingUser(null)} />

                    <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(239,68,68,0.15)] animate-in zoom-in-95 duration-200">
                        <div className="p-10 space-y-8">
                            {/* Modal Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wallet className="text-red-500" size={20} />
                                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Wallet System</span>
                                    </div>
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                                        Add / <span className="logo-red">Deduct</span>
                                    </h3>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 bg-white/5 py-1 px-3 rounded-full inline-block">
                                        User: {editingUser.name || editingUser.email?.split('@')[0]}
                                    </p>
                                </div>
                                <button onClick={() => setEditingUser(null)} className="p-3 bg-zinc-900 rounded-full text-zinc-500 hover:text-white transition-all hover:rotate-90">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Action Type Toggle */}
                            <div className="grid grid-cols-2 gap-4 p-1.5 bg-zinc-900 rounded-[24px]">
                                <button
                                    onClick={() => setWalletAction({ ...walletAction, type: 'add' })}
                                    className={`flex items-center justify-center gap-2 py-4 rounded-[20px] font-black uppercase italic tracking-widest transition-all ${walletAction.type === 'add'
                                        ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
                                        : 'text-zinc-500 hover:text-white'
                                        }`}
                                >
                                    <ArrowUpCircle size={20} /> Add
                                </button>
                                <button
                                    onClick={() => setWalletAction({ ...walletAction, type: 'deduct' })}
                                    className={`flex items-center justify-center gap-2 py-4 rounded-[20px] font-black uppercase italic tracking-widest transition-all ${walletAction.type === 'deduct'
                                        ? 'bg-red-600 text-white shadow-xl shadow-red-600/20'
                                        : 'text-zinc-500 hover:text-white'
                                        }`}
                                >
                                    <ArrowDownCircle size={20} /> Deduct
                                </button>
                            </div>

                            {/* Input Fields */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Amount (₹)</label>
                                    <div className="relative">
                                        <Plus className={`absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 ${walletAction.type === 'add' ? 'text-emerald-500/50' : 'text-red-500/50 hidden'}`} size={24} />
                                        <Minus className={`absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 ${walletAction.type === 'deduct' ? 'text-red-500/50' : 'hidden'}`} size={24} />
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={walletAction.amount}
                                            onChange={(e) => setWalletAction({ ...walletAction, amount: e.target.value })}
                                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-6 pl-14 pr-6 text-3xl font-black text-white focus:outline-none focus:border-red-500/50 transition-all placeholder:text-zinc-800"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Transaction Note</label>
                                    <div className="relative">
                                        <FileText className="absolute left-5 top-4 text-zinc-700" size={18} />
                                        <textarea
                                            placeholder="Reason for this change..."
                                            value={walletAction.note}
                                            onChange={(e) => setWalletAction({ ...walletAction, note: e.target.value })}
                                            rows={2}
                                            className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-medium text-white focus:outline-none focus:border-red-500/50 transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Info Box */}
                            <div className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl">
                                <AlertCircle className="text-zinc-600 shrink-0" size={18} />
                                <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-widest">
                                    Balance will be updated instantly and the transaction will be recorded in user history.
                                </p>
                            </div>

                            <button
                                onClick={() => handleWalletUpdate(editingUser.id)}
                                className={`w-full py-6 rounded-[24px] font-black uppercase italic tracking-widest transition-all shadow-2xl active:scale-95 ${walletAction.type === 'add' ? 'btn-red shadow-red-500/20' : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20'
                                    }`}
                            >
                                Confirm {walletAction.type === 'add' ? 'Addition' : 'Deduction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;


