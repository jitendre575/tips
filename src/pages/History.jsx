import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { History as HistoryIcon, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-center gap-4 mb-10">
                <div className="bg-blue-600 p-3 rounded-2xl">
                    <HistoryIcon className="text-white" size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-black">Betting History</h1>
                    <p className="text-slate-400">View your predictions and returns</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 glass rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="space-y-4">
                    {bets.length === 0 ? (
                        <div className="glass-card py-20 text-center">
                            <HistoryIcon className="mx-auto mb-4 text-slate-700" size={48} />
                            <p className="text-slate-500">No bets placed yet</p>
                        </div>
                    ) : (
                        bets.map((bet, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={bet.id}
                                className="glass-card flex flex-col md:flex-row md:items-center justify-between gap-6 hover:translate-x-1"
                            >
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${bet.status === 'won' ? 'bg-green-500 text-white' :
                                                bet.status === 'lost' ? 'bg-red-500 text-white' :
                                                    'bg-slate-700 text-slate-300'
                                            }`}>
                                            {bet.status}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono italic">#{bet.id.slice(0, 8)}</span>
                                    </div>
                                    <h3 className="text-lg font-bold">{bet.teamA} vs {bet.teamB}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Selected:</span>
                                            <span className="text-slate-200">{bet.selectedTeam}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium">Odds:</span>
                                            <span className="text-slate-200">{bet.odds}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 pr-4">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Stake</p>
                                        <p className="text-xl font-black text-slate-200">{bet.amount}</p>
                                    </div>

                                    <div className="text-right border-l border-slate-800 pl-8 min-w-[120px]">
                                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Return</p>
                                        <div className="flex flex-col items-end">
                                            <p className={`text-xl font-black ${bet.status === 'won' ? 'text-green-400' :
                                                    bet.status === 'lost' ? 'text-red-500' :
                                                        'text-slate-500'
                                                }`}>
                                                {bet.status === 'won' ? `+${bet.payout.toFixed(0)}` :
                                                    bet.status === 'lost' ? `-${bet.amount}` :
                                                        '---'}
                                            </p>
                                            {bet.sixRewardApplied && (
                                                <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                                    <Zap size={10} className="fill-current" />
                                                    <span>2X BONUS APPLIED</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default History;
