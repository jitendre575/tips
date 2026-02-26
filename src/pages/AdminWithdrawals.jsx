import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { Wallet, Clock, CheckCircle2, XCircle, Search, Filter, Mail, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminWithdrawals = () => {
    const [requests, setRequests] = useState([]);
    const [filter, setFilter] = useState('pending');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAction = async (request, action) => {
        try {
            const reqRef = doc(db, 'withdrawals', request.id);
            const userRef = doc(db, 'users', request.userId);

            if (action === 'approved') {
                await updateDoc(reqRef, { status: 'approved' });
                await updateDoc(userRef, {
                    activeWithdrawals: increment(-1)
                });
                toast.success('Withdrawal approved!');
            } else {
                await updateDoc(reqRef, { status: 'rejected' });
                // Return coins to user balance on rejection
                await updateDoc(userRef, {
                    balance: increment(request.amount),
                    activeWithdrawals: increment(-1)
                });
                toast.success('Withdrawal rejected and coins returned.');
            }
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesFilter = filter === 'all' || req.status === filter;
        const matchesSearch = req.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">Transaction <span className="logo-red">Requests</span></h1>
                    <p className="text-zinc-500 font-medium">Review and process withdrawal requests</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-zinc-900 border border-white/[0.05] rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-red-500/50 transition-all text-sm w-full sm:w-64"
                        />
                    </div>

                    <div className="flex bg-zinc-900 p-1 rounded-2xl border border-white/[0.05]">
                        {['pending', 'approved', 'rejected', 'all'].map(option => (
                            <button
                                key={option}
                                onClick={() => setFilter(option)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filter === option
                                        ? 'bg-red-500 text-white shadow-lg'
                                        : 'text-zinc-500 hover:text-white'
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-28 glass-card animate-pulse" />)}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredRequests.length === 0 ? (
                        <div className="glass-card py-20 text-center flex flex-col items-center">
                            <Filter size={48} className="text-zinc-800 mb-4" />
                            <p className="text-zinc-500 font-medium">No requests found matching your filter</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredRequests.map(req => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={req.id}
                                    className="glass-card hover:bg-white/[0.02] flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-6 flex-1">
                                        <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                                req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    'bg-red-500/10 text-red-500'
                                            }`}>
                                            <Wallet size={24} />
                                        </div>

                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-black text-white italic tracking-tighter">
                                                    {req.amount.toLocaleString()}
                                                </span>
                                                <span className="text-[10px] bg-white/[0.05] border border-white/5 px-2 py-0.5 rounded text-zinc-500 font-black uppercase tracking-widest">
                                                    Coins
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 font-medium underline-offset-2">
                                                <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
                                                    <Mail size={14} className="text-zinc-600" />
                                                    {req.userEmail}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard size={14} className="text-zinc-600" />
                                                    <span className="uppercase text-zinc-400 font-black tracking-widest">{req.method}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="sm:border-l border-white/[0.05] sm:pl-6 space-y-2">
                                            <span className="label-sm !mb-0 text-zinc-600">Payment Details</span>
                                            <p className="text-xs font-medium text-zinc-300 bg-zinc-950/50 p-3 rounded-xl border border-white/[0.02] break-all max-w-sm">
                                                {req.details}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 border-t lg:border-t-0 lg:border-l border-white/[0.05] pt-6 lg:pt-0 lg:pl-10 min-w-[180px]">
                                        <div className="text-right hidden lg:block mb-2">
                                            <div className="text-[10px] text-zinc-600 font-mono italic">#{req.id.slice(0, 12)}</div>
                                            <div className="text-[10px] text-zinc-600 font-medium">Requested: {req.createdAt?.toDate().toLocaleString()}</div>
                                        </div>

                                        {req.status === 'pending' ? (
                                            <div className="flex gap-2 w-full lg:w-auto">
                                                <button
                                                    onClick={() => handleAction(req, 'approved')}
                                                    className="flex-1 lg:flex-none px-6 py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl font-bold text-xs transition-all active:scale-95"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleAction(req, 'rejected')}
                                                    className="flex-1 lg:flex-none px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl font-bold text-xs transition-all active:scale-95"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ) : (
                                            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[2px] border ${req.status === 'approved' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-500' : 'bg-red-500/5 border-red-500/20 text-red-500'
                                                }`}>
                                                {req.status}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminWithdrawals;
