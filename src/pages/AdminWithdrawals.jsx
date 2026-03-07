import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Wallet, Clock, CheckCircle2, XCircle, Search, Filter, Mail, CreditCard, ArrowRight, ShieldCheck, Activity, AlertCircle, TrendingDown, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminWithdrawals = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all requests and sort in JS to avoid index requirement errors
        const q = query(collection(db, 'withdrawals'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort in JS to avoid index requirements
            data.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });
            setRequests(data);
            setLoading(false);
        }, (error) => {
            console.error("Snapshot error:", error);
            toast.error("Failed to load withdrawals. Check database permissions.");
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAction = async (request, action) => {
        const loadingToast = toast.loading(`Processing ${action}...`);
        try {
            const reqRef = doc(db, 'withdrawals', request.id);
            const userRef = doc(db, 'users', request.userId);

            if (action === 'approved') {
                await updateDoc(reqRef, {
                    status: 'approved',
                    processedAt: serverTimestamp()
                });
                await updateDoc(userRef, {
                    activeWithdrawals: increment(-1),
                    totalWithdraw: increment(request.amount)
                });

                // Add to history
                await addDoc(collection(db, 'history'), {
                    userId: request.userId,
                    type: 'withdrawal',
                    amount: request.amount,
                    status: 'success',
                    description: 'Withdrawal Approved',
                    createdAt: serverTimestamp()
                });

                toast.success('Withdrawal approved successfully!', { id: loadingToast });
            } else {
                await updateDoc(reqRef, {
                    status: 'rejected',
                    processedAt: serverTimestamp()
                });
                // Return coins to user balance on rejection
                await updateDoc(userRef, {
                    balance: increment(request.amount),
                    activeWithdrawals: increment(-1)
                });

                // Add to history
                await addDoc(collection(db, 'history'), {
                    userId: request.userId,
                    type: 'withdrawal',
                    amount: request.amount,
                    status: 'rejected',
                    description: 'Withdrawal Rejected (Coins Returned)',
                    createdAt: serverTimestamp()
                });

                toast.success('Withdrawal rejected. Coins returned to user.', { id: loadingToast });
            }
        } catch (error) {
            console.error('Action error:', error);
            toast.error('Failed to update transaction status', { id: loadingToast });
        }
    };

    const filteredRequests = requests.filter(req => {
        // Case-insensitive status matching
        const matchesFilter = filter === 'all' ||
            req.status?.toLowerCase() === filter.toLowerCase();

        const matchesSearch =
            (req.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.method || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'approved': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'rejected': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 px-4 lg:px-0">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-[30px] border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-sm">
                        <CreditCard size={40} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="text-emerald-500" size={14} />
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-[4px]">Financial Operations</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
                            Payout <span className="logo-accent">Terminal</span>
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-2">Process and audit member withdrawal requests securely.</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group min-w-[280px]">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Email or Transaction ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-black/[0.05] rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-accent/30 transition-all text-sm font-medium shadow-sm"
                        />
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-black/[0.05] shadow-inner">
                        {['pending', 'approved', 'rejected', 'all'].map(option => (
                            <button
                                key={option}
                                onClick={() => setFilter(option)}
                                className={`px-4 lg:px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === option
                                    ? 'bg-accent text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-900 hover:bg-white'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {loading ? (
                    <div className="grid gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-zinc-900/50 rounded-[40px] animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence mode='popLayout'>
                            {filteredRequests.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white border-2 border-dashed border-black/[0.1] rounded-[40px] p-24 text-center shadow-lg"
                                >
                                    <Filter size={48} className="mx-auto text-slate-300 mb-6" />
                                    <h3 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter">No Requests Identified</h3>
                                    <p className="text-slate-500 text-sm font-medium mt-1">Clear filters or check again later for new submissions.</p>
                                </motion.div>
                            ) : (
                                filteredRequests.map((req) => (
                                    <motion.div
                                        key={req.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group bg-white border border-black/[0.05] rounded-[40px] p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 hover:border-accent/20 transition-all shadow-sm overflow-hidden"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-8 flex-1">
                                            {/* Amount Circle */}
                                            <div className="relative">
                                                <div className={`w-24 h-24 rounded-[32px] flex flex-col items-center justify-center shrink-0 border transition-all duration-500 ${getStatusColor(req.status)} shadow-2xl`}>
                                                    <span className="text-[10px] font-black uppercase tracking-tighter mb-1 opacity-60">Payout</span>
                                                    <span className="text-2xl font-black italic tracking-tighter leading-none">₹{req.amount.toLocaleString()}</span>
                                                </div>
                                                {req.status === 'pending' && (
                                                    <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-amber-500 rounded-full border-4 border-white flex items-center justify-center animate-bounce">
                                                        <Clock size={10} className="text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4 flex-1">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className={`text-[8px] font-black uppercase tracking-[3px] px-3 py-1 rounded-full border ${getStatusColor(req.status)}`}>
                                                            {req.status}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">ID: {req.id.slice(0, 10)}</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 leading-none mb-2">
                                                        {req.userEmail}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-black/[0.05]">
                                                            <Calendar size={12} className="text-accent" />
                                                            {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-black/[0.05]">
                                                            <Clock size={12} className="text-accent" />
                                                            {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-black/[0.05]">
                                                            <CreditCard size={12} className="text-accent" />
                                                            {req.method}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Details Section */}
                                            <div className="lg:border-l border-black/[0.05] lg:pl-10 space-y-3 lg:max-w-xs w-full">
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Transfer Credentials</span>
                                                <div className="bg-slate-50 p-5 rounded-3xl border border-black/[0.01] group/details hover:border-black/10 transition-all shadow-inner">
                                                    <p className="text-xs font-bold text-slate-500 leading-relaxed font-mono break-all line-clamp-2 group-hover:line-clamp-none transition-all">
                                                        {req.details}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-6 min-w-[180px]">
                                            {req.status === 'pending' ? (
                                                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full">
                                                    <button
                                                        onClick={() => handleAction(req, 'approved')}
                                                        className="flex-1 px-8 py-4 bg-emerald-500 text-white rounded-[20px] font-black uppercase italic tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                        Verify Payout
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(req, 'rejected')}
                                                        className="flex-1 px-8 py-4 bg-slate-100 hover:bg-red-600 border border-black/[0.05] text-slate-500 hover:text-white rounded-[20px] font-black uppercase italic tracking-widest text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle size={16} />
                                                        Decline
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-right space-y-2">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        {req.status === 'approved' ? <CheckCircle2 className="text-emerald-500" size={16} /> : <XCircle className="text-red-500" size={16} />}
                                                        <span className={`text-[10px] font-black uppercase tracking-[3px] ${req.status === 'approved' ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            Transaction {req.status}
                                                        </span>
                                                    </div>
                                                    {req.processedAt && req.processedAt.toDate && (
                                                        <span className="text-[10px] text-slate-600 font-medium block">
                                                            {req.processedAt.toDate().toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Quick Stats Overlay (Floating or Inline) */}
            {!loading && filteredRequests.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 lg:px-0 mt-20">
                    <div className="bg-white border border-black/[0.05] p-6 rounded-[32px] shadow-sm">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Queue Size</p>
                        <p className="text-2xl font-black italic text-slate-900">{requests.filter(r => r.status === 'pending').length}</p>
                    </div>
                    <div className="bg-white border border-black/[0.05] p-6 rounded-[32px] shadow-sm">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Audited</p>
                        <p className="text-2xl font-black italic text-slate-900">{requests.filter(r => r.status !== 'pending').length}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;

