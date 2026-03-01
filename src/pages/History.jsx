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
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('all'); // all, six_bonus

    useEffect(() => {
        if (!user) return;

        const betsQ = query(
            collection(db, 'bets'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );

        const transQ = query(
            collection(db, 'history'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubBets = onSnapshot(betsQ, (snapshot) => {
            setBets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            if (activeTab === 'bets') setLoading(false);
        });

        const unsubTrans = onSnapshot(transQ, (snapshot) => {
            setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            if (activeTab === 'transactions') setLoading(false);
        });

        setLoading(false);
        return () => {
            unsubBets();
            unsubTrans();
        };
    }, [user, activeTab]);

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">Activity <span className="logo-red">History</span></h1>
                    <p className="text-zinc-500 font-medium">Track your performance and previous transactions</p>
                </div>

                <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
                    {['bets', 'transactions'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                ? 'bg-red-600 text-white shadow-lg'
                                : 'text-zinc-500 hover:text-white'
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
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${filterType === 'all' ? 'bg-white text-black border-white' : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/20'}`}
                    >
                        All Bets
                    </button>
                    <button
                        onClick={() => setFilterType('six_bonus')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${filterType === 'six_bonus' ? 'bg-amber-500 text-black border-amber-500' : 'bg-transparent text-amber-500/50 border-amber-500/10 hover:border-amber-500'}`}
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
                                    <div className="glass-card py-32 text-center flex flex-col items-center">
                                        <Archive size={64} className="text-zinc-800 mb-6" />
                                        <h3 className="text-2xl font-black italic text-zinc-600 uppercase">
                                            {filterType === 'six_bonus' ? 'No Six Bonus Bets' : 'No bets found'}
                                        </h3>
                                        <p className="text-zinc-500 font-medium">
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
                                            transition={{ delay: idx * 0.05 }}
                                            key={bet.id}
                                            className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.02] border-white/5"
                                        >
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bet.status === 'won' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    bet.status === 'lost' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-zinc-900 text-zinc-500'
                                                    }`}>
                                                    {bet.status === 'won' ? <TrendingUp size={24} /> :
                                                        bet.status === 'lost' ? <TrendingDown size={24} /> :
                                                            <Clock size={24} />}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-xl font-black italic tracking-tighter uppercase whitespace-nowrap">
                                                            {bet.teamA} VS {bet.teamB}
                                                        </h3>
                                                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${bet.status === 'won' ? 'bg-emerald-500 text-white' :
                                                            bet.status === 'lost' ? 'bg-red-500 text-white' :
                                                                'bg-zinc-800 text-zinc-500'
                                                            }`}>
                                                            {bet.status}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
                                                        <span>Predicted: <span className="text-zinc-300">{bet.selectedTeam}</span></span>
                                                        <span className="text-zinc-800">•</span>
                                                        <span>Odds: <span className="text-zinc-300">{bet.odds}</span></span>
                                                        <span className="text-zinc-800">•</span>
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
                                                                    'Pending'}
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
                        transactions.length === 0 ? (
                            <div className="glass-card py-32 text-center flex flex-col items-center">
                                <HistoryIcon size={64} className="text-zinc-800 mb-6" />
                                <h3 className="text-2xl font-black italic text-zinc-600 uppercase">No transactions</h3>
                                <p className="text-zinc-500 font-medium">Your wallet activity will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {transactions.map((trans, idx) => (
                                    <div key={trans.id} className="glass-card flex items-center justify-between p-6 border-white/5">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${trans.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {trans.type === 'deposit' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-lg font-black italic uppercase tracking-tight text-white">{trans.description}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                                    <span>{trans.createdAt?.toDate ? trans.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                                                    <span className="text-zinc-800">•</span>
                                                    <span className={trans.status === 'success' ? 'text-emerald-500' : 'text-amber-500'}>{trans.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-black italic tracking-tighter ${trans.type === 'deposit' ? 'text-emerald-400' : 'text-red-500'
                                                }`}>
                                                {trans.type === 'deposit' ? '+' : '-'}{trans.amount.toLocaleString()}
                                            </p>
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Coins</span>
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
