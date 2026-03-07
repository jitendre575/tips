import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Check, X, ExternalLink, Calendar, User, IndianRupee, Clock, Search, Filter, AlertCircle, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminRecharges = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending'); // Pending, Approved, Rejected, All
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch all requests and sort in memorial to avoid Firebase Index requirement errors
        const q = query(collection(db, 'rechargeRequests'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date();
                return dateB - dateA;
            });
            setRequests(reqs);
            setLoading(false);
        }, (error) => {
            console.error("Snapshot error:", error);
            // Fallback for basic view if complex query fails
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const deleteRequest = async (id) => {
        if (!window.confirm('Delete this record permanently?')) return;
        try {
            await deleteDoc(doc(db, 'rechargeRequests', id));
            toast.success('Request scrubbed');
        } catch (e) {
            toast.error('Failed to delete');
        }
    };

    const handleAction = async (requestId, userId, amount, action) => {
        try {
            const requestRef = doc(db, 'rechargeRequests', requestId);
            const userRef = doc(db, 'users', userId);

            if (action === 'Approve') {
                // Update user balance and total deposit
                await updateDoc(userRef, {
                    balance: increment(amount),
                    totalDeposit: increment(amount)
                });

                // Update request status
                await updateDoc(requestRef, {
                    status: 'Approved',
                    processedAt: serverTimestamp()
                });

                // Add to history
                await addDoc(collection(db, 'history'), {
                    userId,
                    type: 'deposit',
                    amount,
                    status: 'success',
                    description: 'Wallet Recharge Approved',
                    createdAt: serverTimestamp()
                });

                // Notify User
                await addDoc(collection(db, 'notifications'), {
                    userId,
                    type: 'recharge_approved',
                    message: `Your recharge of ₹${amount} has been approved!`,
                    createdAt: serverTimestamp(),
                    read: false
                });

                toast.success('Recharge approved and balance added!');
            } else {
                // Reject request
                await updateDoc(requestRef, {
                    status: 'Rejected',
                    processedAt: serverTimestamp()
                });

                // Notify User
                await addDoc(collection(db, 'notifications'), {
                    userId,
                    type: 'recharge_rejected',
                    message: `Your recharge of ₹${amount} was rejected. Please contact support.`,
                    createdAt: serverTimestamp(),
                    read: false
                });

                toast.error('Recharge request rejected');
            }
        } catch (error) {
            console.error('Action error:', error);
            toast.error('Failed to process request');
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesFilter = filter === 'All' || req.status === filter;
        const matchesSearch =
            req.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.userId?.includes(searchTerm) ||
            req.amount?.toString().includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#f5f5f9] p-4 lg:p-10 pb-24 text-slate-900 selection:bg-accent/30 font-['Outfit']">
            <div className="max-w-7xl mx-auto space-y-10">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin')}
                            className="p-4 bg-slate-100 rounded-[20px] border border-black/[0.05] text-slate-500 hover:text-slate-900 transition-all shadow-sm active:scale-95"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="text-accent" size={14} />
                                <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Transaction Queue</span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">
                                Recharge <span className="logo-accent">Requests</span>
                            </h1>
                            <p className="text-slate-500 text-sm font-medium mt-2">Verify and approve user deposit screenshots.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="relative w-full sm:w-80 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search by user or amount..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-black/[0.05] rounded-[20px] py-4 pl-14 pr-6 text-sm text-slate-900 focus:outline-none focus:border-accent/30 transition-all font-medium shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-xl border border-black/[0.05] text-slate-600 mr-2 shadow-sm">
                        <Filter size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filter</span>
                    </div>
                    {['Pending', 'Approved', 'Rejected', 'All'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border whitespace-nowrap active:scale-95 ${filter === f
                                ? 'bg-accent border-accent text-white shadow-lg'
                                : 'bg-white border-black/[0.05] text-slate-600 hover:border-accent'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Requests Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <div key={n} className="h-96 rounded-[40px] skeleton-loading border border-white/5 shadow-2xl"></div>
                        ))}
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-black/[0.05] rounded-[40px] p-12 sm:p-24 text-center shadow-lg">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 shadow-inner">
                            <ImageIcon size={40} />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 italic uppercase tracking-tight leading-tight">No Requests Found</h3>
                        <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2 text-sm">No {filter.toLowerCase()} requests found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredRequests.map((req) => (
                            <div key={req.id} className="group bg-white border border-black/[0.05] rounded-[40px] overflow-hidden hover:border-accent/20 transition-all duration-500 shadow-sm hover:shadow-xl flex flex-col">
                                {/* Screenshot Preview */}
                                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 border-b border-black/[0.05]">
                                    <img
                                        src={req.screenshot}
                                        alt="Payment"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 group-hover:opacity-90"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />

                                    <button
                                        onClick={() => setSelectedImage(req.screenshot)}
                                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm"
                                    >
                                        <div className="px-6 py-3 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                            <ExternalLink size={16} />
                                            View Full Size
                                        </div>
                                    </button>

                                    <div className={`absolute top-6 right-6 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[2px] shadow-2xl ${req.status === 'Pending' ? 'bg-amber-500 text-black shadow-amber-500/20' :
                                        req.status === 'Approved' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                            'bg-red-600 text-white shadow-red-500/20'
                                        }`}>
                                        {req.status}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 space-y-8 flex-1 flex flex-col">
                                    <div className="flex justify-between items-end">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-slate-500 font-black">
                                                <User size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Player</span>
                                            </div>
                                            <p className="text-xl font-black italic uppercase tracking-tight text-slate-900">{req.userName}</p>
                                        </div>
                                        <div className="text-right space-y-1.5">
                                            <div className="flex items-center gap-2 justify-end text-slate-600 font-black">
                                                <IndianRupee size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Amount</span>
                                            </div>
                                            <p className="text-3xl font-black italic tracking-tighter text-emerald-500 leading-none">₹{req.amount?.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-6 border-y border-black/[0.05]">
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-tight">
                                            <Calendar size={14} className="text-accent" />
                                            <span>{req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'Today'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-tight">
                                            <Clock size={14} className="text-accent" />
                                            <span>{req.createdAt?.toDate ? req.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                        </div>
                                    </div>

                                    {req.status === 'Pending' ? (
                                        <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 mt-auto">
                                            <button
                                                onClick={() => handleAction(req.id, req.userId, req.amount, 'Reject')}
                                                className="flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-2xl font-black uppercase tracking-widest transition-all border border-black/[0.05] active:scale-95 shadow-sm"
                                            >
                                                <X size={18} />
                                                <span>Reject</span>
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, req.userId, req.amount, 'Approve')}
                                                className="flex items-center justify-center gap-2 py-4 bg-accent hover:bg-accent-hover text-white rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-accent/20"
                                            >
                                                <Check size={18} />
                                                <span>Approve</span>
                                            </button>
                                            <button
                                                onClick={() => deleteRequest(req.id)}
                                                className="col-span-2 mt-2 flex items-center justify-center gap-2 py-3 text-[9px] font-black text-slate-500 hover:text-red-500 uppercase tracking-widest transition-all"
                                            >
                                                <Trash2 size={12} />
                                                Scrub Request from Logs
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4 mt-auto w-full">
                                            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-black/[0.05] rounded-2xl shadow-inner">
                                                <AlertCircle size={16} className="text-slate-600" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                                    Processed on {req.processedAt?.toDate ? req.processedAt.toDate().toLocaleString() : 'N/A'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => deleteRequest(req.id)}
                                                className="flex items-center justify-center gap-2 py-3 text-[9px] font-black text-slate-500 hover:text-red-500 uppercase tracking-widest transition-all"
                                            >
                                                <Trash2 size={12} />
                                                Scrub Log
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Image Modal */}
            {
                selectedImage && (
                    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setSelectedImage(null)} />
                        <div className="relative max-w-5xl w-full h-[80vh] flex items-center justify-center animate-in zoom-in-95 duration-300">
                            <img src={selectedImage} alt="Payment Proof" className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,1)]" />
                            <button
                                onClick={() => setSelectedImage(null)}
                                className="absolute -top-12 right-0 p-3 bg-white/10 hover:bg-accent rounded-full text-white transition-all shadow-2xl"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default AdminRecharges;

