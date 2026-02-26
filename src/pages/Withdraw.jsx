import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Wallet, Landmark, ArrowRight, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Withdraw = () => {
    const { user, userData } = useAuth();
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('UPI');
    const [paymentDetails, setPaymentDetails] = useState('');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'withdrawals'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const withdrawAmount = Number(amount);

        if (withdrawAmount < 500) {
            return toast.error('Minimum withdrawal is 500 Coins');
        }

        if (withdrawAmount > userData.balance) {
            return toast.error('Insufficient balance');
        }

        if (!paymentDetails) {
            return toast.error('Please provide payment details');
        }

        setLoading(true);
        try {
            // 1. Create withdrawal request
            await addDoc(collection(db, 'withdrawals'), {
                userId: user.uid,
                userEmail: user.email,
                amount: withdrawAmount,
                method: paymentMethod,
                details: paymentDetails,
                status: 'pending',
                createdAt: serverTimestamp()
            });

            // 2. Deduct from user balance immediately
            await updateDoc(doc(db, 'users', user.uid), {
                balance: increment(-withdrawAmount),
                activeWithdrawals: increment(1)
            });

            toast.success('Withdrawal request submitted!');
            setAmount('');
            setPaymentDetails('');
        } catch (error) {
            console.error(error);
            toast.error('Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10">
            <div>
                <h1 className="text-4xl font-black italic tracking-tighter uppercase">Withdraw <span className="logo-red">Earnings</span></h1>
                <p className="text-zinc-500 font-medium">Quick and secure payouts to your preferred method</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="bg-red-500/10 p-3 rounded-2xl text-red-500">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Request Payout</h3>
                                <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Min 500 Coins</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="label-sm">Amount</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Enter amount"
                                        className="input-field"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black italic text-zinc-600 uppercase text-xs">Coins</span>
                                </div>
                                <p className="text-[10px] text-zinc-500 pl-1">Available: {userData?.balance?.toLocaleString()} Coins</p>
                            </div>

                            <div className="space-y-2">
                                <label className="label-sm">Payment Method</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['UPI', 'BANK'].map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentMethod(method)}
                                            className={`py-3 rounded-2xl font-bold transition-all border ${paymentMethod === method
                                                    ? 'bg-red-500/10 border-red-500/50 text-red-500'
                                                    : 'bg-zinc-900 border-white/[0.05] text-zinc-500'
                                                }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="label-sm">{paymentMethod} Details</label>
                                <textarea
                                    required
                                    value={paymentDetails}
                                    onChange={(e) => setPaymentDetails(e.target.value)}
                                    placeholder={paymentMethod === 'UPI' ? 'Enter VPA (e.g. name@upi)' : 'Account No, IFSC, Name'}
                                    className="input-field min-h-[100px] resize-none py-4"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-red py-4 text-sm"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>Submit Request <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-6 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                        <AlertCircle className="text-amber-500 shrink-0" size={24} />
                        <div className="text-xs text-amber-500/80 leading-relaxed">
                            <p className="font-bold mb-1 uppercase tracking-widest">Important Note</p>
                            Withdrawals are usually processed within 6-12 hours. Ensure your payment details are 100% correct.
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold uppercase italic tracking-tighter">Recent <span className="logo-red">Requests</span></h2>
                        <Landmark size={20} className="text-zinc-600" />
                    </div>

                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="glass-card py-20 text-center flex flex-col items-center">
                                <Clock size={48} className="text-zinc-800 mb-4" />
                                <p className="text-zinc-500 font-medium">No withdrawal history found</p>
                            </div>
                        ) : (
                            requests.map((req, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={req.id}
                                    className="glass-card group hover:bg-white/[0.02] flex items-center justify-between gap-6"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${req.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                                req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    'bg-red-500/10 text-red-500'
                                            }`}>
                                            {req.status === 'pending' ? <Clock size={20} /> :
                                                req.status === 'approved' ? <CheckCircle2 size={20} /> :
                                                    <XCircle size={20} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-black text-lg tracking-tight">{req.amount.toLocaleString()}</span>
                                                <span className="text-[10px] font-black text-zinc-600 uppercase">Coins</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                                <span className="uppercase">{req.method}</span>
                                                <span>•</span>
                                                <span>{req.createdAt?.toDate().toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${req.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                                req.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                    'bg-red-500/10 border-red-500/20 text-red-500'
                                            }`}>
                                            {req.status}
                                        </div>
                                        <p className="text-[10px] text-zinc-600 mt-2 font-mono italic">#{req.id.slice(0, 8)}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Withdraw;
