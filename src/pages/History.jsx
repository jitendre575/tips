import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { History as HistoryIcon, Archive, TrendingUp, TrendingDown, Clock, Zap, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const History = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('bets'); // 'bets' or 'transactions'
    const [bets, setBets] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [pendingRecharges, setPendingRecharges] = useState([]);
    const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all'); // all, six_bonus

    useEffect(() => {
        if (!user) return;

        const betsQ = query(
            collection(db, 'bets'),
            where('userId', '==', user.uid)
        );

        const transQ = query(
            collection(db, 'history'),
            where('userId', '==', user.uid)
        );

        const unsubBets = onSnapshot(betsQ, (snapshot) => {
            const betsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Improved sort for pending timestamps
            betsData.sort((a, b) => {
                const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
                const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
                return timeB - timeA;
            });
            setBets(betsData);
            if (activeTab === 'bets') setLoading(false);
        });

        const unsubTrans = onSnapshot(transQ, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Improved sort for pending timestamps
            transData.sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
                return timeB - timeA;
            });
            setTransactions(transData);
            if (activeTab === 'transactions') setLoading(false);
        });

        // Sync Pending Requests (Recharges and Withdrawals)
        const pendingRechargeQ = query(
            collection(db, 'rechargeRequests'),
            where('userId', '==', user.uid),
            where('status', '==', 'Pending')
        );

        const pendingWithdrawQ = query(
            collection(db, 'withdrawals'),
            where('userId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubRecharges = onSnapshot(pendingRechargeQ, (s) => {
            setPendingRecharges(s.docs.map(d => ({ id: d.id, ...d.data(), type: 'deposit', isPending: true })));
        });

        const unsubWithdrawals = onSnapshot(pendingWithdrawQ, (s) => {
            setPendingWithdrawals(s.docs.map(d => ({ id: d.id, ...d.data(), type: 'withdrawal', isPending: true })));
        });

        setLoading(false);
        return () => {
            unsubBets();
            unsubTrans();
            unsubRecharges();
            unsubWithdrawals();
        };
    }, [user, activeTab]);

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-slate-900">Activity <span className="text-accent">History</span></h1>
                    <p className="text-slate-500 font-medium text-sm sm:text-base mt-1">Track your performance and previous transactions</p>
                </div>

                <div className="flex bg-white shadow-sm p-1.5 rounded-[6px] border border-black/5 w-fit">
                    {['bets', 'transactions'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-[6px] text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-accent text-white shadow-md shadow-accent/20'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {activeTab === 'bets' && (
                <div className="flex gap-4">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all border ${filterType === 'all' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/20'}`}
                    >
                        All Bets
                    </button>
                    <button
                        onClick={() => setFilterType('six_bonus')}
                        className={`px-4 py-2 rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${filterType === 'six_bonus' ? 'bg-amber-500 text-black border-amber-500' : 'bg-transparent text-amber-500/50 border-amber-500/10 hover:border-amber-500'}`}
                    >
                        <Zap size={12} className={filterType === 'six_bonus' ? 'fill-black' : ''} />
                        Six Bonus
                    </button>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 glass-card animate-pulse shadow-2xl bg-zinc-900/50" />)}
                </div>
            ) : (
                <div className="space-y-4">
                    {activeTab === 'bets' ? (
                        (() => {
                            const filteredBets = filterType === 'six_bonus'
                                ? bets.filter(b => b.sixRewardAppliedAtBet || b.sixRewardApplied)
                                : bets;

                            if (filteredBets.length === 0) {
                                return (
                                    <div className="bg-white border border-black/5 shadow-sm rounded-[6px] py-32 text-center flex flex-col items-center">
                                        <Archive size={64} className="text-slate-300 mb-6" />
                                        <h3 className="text-2xl font-black italic text-slate-900 uppercase">
                                            {filterType === 'six_bonus' ? 'No Six Bonus Bets' : 'No bets found'}
                                        </h3>
                                        <p className="text-slate-500 font-medium mt-2">
                                            {filterType === 'six_bonus' ? 'Participate in 2X Market to see bonus bets.' : 'Start predicting matches to see your history here.'}
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <AnimatePresence>
                                    {filteredBets.map((bet, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={bet.id}
                                            className="bg-white border border-black/5 shadow-sm rounded-[6px] sm:rounded-[6px] p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className={`w-14 h-14 rounded-[6px] flex items-center justify-center shrink-0 ${bet.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    bet.status === 'lost' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-zinc-900 text-zinc-500'
                                                    }`}>
                                                    {bet.status === 'won' ? <TrendingUp size={24} /> :
                                                        bet.status === 'lost' ? <TrendingDown size={24} /> :
                                                            <Clock size={24} />}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl sm:text-2xl text-slate-900 font-black italic tracking-tighter uppercase whitespace-nowrap">
                                                            {bet.teamA} VS {bet.teamB}
                                                        </h3>
                                                        <div className={`px-2 py-0.5 rounded-[6px] text-[8px] font-black uppercase tracking-widest ${bet.status === 'won' ? 'bg-emerald-500 flex text-white' :
                                                            bet.status === 'lost' ? 'bg-red-500 text-white' :
                                                                'bg-slate-200 text-slate-500'
                                                            }`}>
                                                            {bet.status === 'pending' ? 'CONFIRMED' : bet.status}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1 sm:gap-3 text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                                        <span>Predicted: <span className="text-slate-800">{bet.selectedTeam}</span></span>
                                                        <span className="text-slate-300 hidden sm:inline">•</span>
                                                        <span>Odds: <span className="text-slate-800">{bet.odds}</span></span>
                                                        <span className="text-slate-300 hidden sm:inline">•</span>
                                                        <span>{new Date(bet.timestamp?.toDate ? bet.timestamp.toDate() : bet.timestamp).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-10 md:border-l border-white/5 md:pl-10">
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Stake</span>
                                                    <span className="text-lg font-black text-zinc-300 tracking-tight">{bet.amount.toLocaleString()}</span>
                                                </div>

                                                <div className="flex flex-col text-right min-w-[100px]">
                                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Result</span>
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-2xl font-black italic tracking-tighter ${bet.status === 'won' ? 'text-emerald-400' :
                                                            bet.status === 'lost' ? 'text-red-500' :
                                                                'text-zinc-600'
                                                            }`}>
                                                            {bet.status === 'won' ? `+${bet.payout?.toFixed(0)}` :
                                                                bet.status === 'lost' ? `-${bet.amount}` :
                                                                    'Awaiting Outcome'}
                                                        </span>
                                                        {bet.sixRewardApplied && (
                                                            <div className="flex items-center gap-1 text-[8px] text-amber-500 font-bold uppercase tracking-widest mt-1">
                                                                <Zap size={8} className="fill-current" /> 2X Return Applied
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            );
                        })()
                    ) : (
                        (pendingRecharges.length + pendingWithdrawals.length) === 0 && transactions.length === 0 ? (
                            <div className="bg-white border border-black/5 shadow-sm rounded-[6px] py-32 text-center flex flex-col items-center">
                                <HistoryIcon size={64} className="text-slate-300 mb-6" />
                                <h3 className="text-2xl font-black italic text-slate-900 uppercase">No transactions</h3>
                                <p className="text-slate-500 font-medium mt-2">Your wallet activity will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Combine and Sort Pending Section */}
                                {[...pendingRecharges, ...pendingWithdrawals]
                                    .sort((a, b) => {
                                        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : Date.now();
                                        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : Date.now();
                                        return timeB - timeA;
                                    })
                                    .map((req) => (
                                        <div key={req.id} className="bg-amber-50/80 border border-amber-200/50 rounded-[6px] sm:rounded-[6px] flex items-center justify-between p-4 sm:p-6 shadow-sm">
                                            <div className="flex items-center gap-3 sm:gap-5">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[6px] flex items-center justify-center bg-amber-500/10 text-amber-600 shrink-0 border border-amber-500/20">
                                                    <Clock size={20} className="animate-pulse" />
                                                </div>
                                                <div>
                                                    <p className="text-base sm:text-lg font-black italic uppercase tracking-tight text-slate-900">
                                                        {req.type === 'deposit' ? 'Deposit' : 'Withdrawal'} Verification
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                        <span>{req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                                                        <span className="text-slate-300 hidden sm:inline">•</span>
                                                        <span className="text-amber-600 animate-pulse">Awaiting Approval</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl sm:text-2xl font-black italic tracking-tighter text-amber-500">
                                                    {req.type === 'deposit' ? '+' : '-'}{req.amount?.toLocaleString()}
                                                </p>
                                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing</span>
                                            </div>
                                        </div>
                                    ))}

                                {transactions.map((trans, idx) => (
                                    <div key={trans.id} className="bg-white border border-black/5 rounded-[6px] sm:rounded-[6px] flex items-center justify-between p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 sm:gap-5">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[6px] flex items-center justify-center shrink-0 border ${trans.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                                                }`}>
                                                {trans.type === 'deposit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-base sm:text-lg font-black italic uppercase tracking-tight text-slate-900">{trans.description}</p>
                                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                    <span>{trans.createdAt?.toDate ? trans.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                                                    <span className="text-slate-300 hidden sm:inline">•</span>
                                                    <span className={trans.status === 'success' ? 'text-emerald-500' : 'text-red-500'}>{trans.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-xl sm:text-2xl font-black italic tracking-tighter ${trans.type === 'deposit' ? 'text-emerald-500' : 'text-red-500'
                                                }`}>
                                                {trans.type === 'deposit' ? '+' : '-'}{trans.currency === 'USDT' ? '₮' : '₹'}{trans.amount.toLocaleString()}
                                            </p>
                                            <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{trans.currency === 'USDT' ? 'USDT' : 'Coins'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default History;
