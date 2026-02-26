import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { History as HistoryIcon, Archive, TrendingUp, TrendingDown, Clock, Zap, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const History = () => {
    const { user } = useAuth();
    const [bets, setBets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'bets'),
            where('userId', '==', user.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setBets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">Betting <span className="logo-red">History</span></h1>
                    <p className="text-zinc-500 font-medium">Track your performance and previous predictions</p>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-3xl border border-white/[0.05] hidden md:block">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right">Total Bets</span>
                            <span className="text-xl font-black italic tracking-tight text-right">{bets.length}</span>
                        </div>
                        <div className="h-10 w-px bg-white/5" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-right">Win Rate</span>
                            <span className="text-xl font-black italic tracking-tight text-right text-emerald-500">
                                {bets.length > 0 ? ((bets.filter(b => b.status === 'won').length / bets.length) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 glass-card animate-pulse" />)}
                </div>
            ) : (
                <div className="space-y-4">
                    {bets.length === 0 ? (
                        <div className="glass-card py-32 text-center flex flex-col items-center">
                            <Archive size={64} className="text-zinc-800 mb-6" />
                            <h3 className="text-2xl font-black italic text-zinc-600 uppercase">No bets found</h3>
                            <p className="text-zinc-500 font-medium">Start predicting matches to see your history here.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {bets.map((bet, idx) => (
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

                                        <div className="text-zinc-800 hover:text-zinc-500 transition-colors hidden lg:block">
                                            <ExternalLink size={18} />
                                        </div>
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

export default History;
