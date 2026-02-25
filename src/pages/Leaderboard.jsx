import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Medal, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const Leaderboard = () => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            orderBy('balance', 'desc'),
            limit(10)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setLeaders(snapshot.docs.map((doc, index) => ({
                id: doc.id,
                rank: index + 1,
                ...doc.data()
            })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getRankBadge = (rank) => {
        switch (rank) {
            case 1: return <Medal className="text-yellow-400" size={24} />;
            case 2: return <Medal className="text-slate-300" size={24} />;
            case 3: return <Medal className="text-amber-600" size={24} />;
            default: return <span className="text-slate-500 font-bold ml-1.5">{rank}</span>;
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex flex-col items-center text-center mb-16 space-y-4">
                <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-4 rounded-3xl shadow-2xl shadow-yellow-500/20">
                    <Trophy className="text-white" size={48} />
                </div>
                <div>
                    <h1 className="text-5xl font-black mb-2">Hall of Fame</h1>
                    <p className="text-slate-400">The top predictors in the CricBet universe</p>
                </div>
            </div>

            <div className="glass overflow-hidden rounded-[32px] border-slate-700/50 shadow-2xl">
                <div className="bg-slate-900/40 p-6 border-b border-slate-800 grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">
                    <div className="col-span-2">Rank</div>
                    <div className="col-span-6">User</div>
                    <div className="col-span-4 text-right">Balance</div>
                </div>

                {loading ? (
                    <div className="p-12 text-center animate-pulse text-slate-700 font-bold">CALCULATING STANDINGS...</div>
                ) : (
                    <div className="divide-y divide-slate-800/50">
                        {leaders.map((leader, index) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                key={leader.id}
                                className={`grid grid-cols-12 gap-4 p-8 items-center transition-colors group ${index === 0 ? 'bg-yellow-400/5' :
                                        index === 1 ? 'bg-slate-400/5' :
                                            index === 2 ? 'bg-amber-600/5' : ''
                                    }`}
                            >
                                <div className="col-span-2 flex items-center">
                                    {getRankBadge(leader.rank)}
                                </div>
                                <div className="col-span-6 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold border-2 ${index === 0 ? 'bg-yellow-400/10 border-yellow-400/30' :
                                            'bg-slate-800/50 border-slate-700'
                                        }`}>
                                        {leader.email?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg group-hover:text-blue-400 transition-colors uppercase truncate max-w-[200px]">
                                            {leader.email?.split('@')[0]}
                                        </p>
                                        {index === 0 && <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Master Predictor</span>}
                                    </div>
                                </div>
                                <div className="col-span-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-white">{leader.balance.toLocaleString()}</span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Coins</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-12 glass p-8 rounded-3xl border-slate-800 text-center">
                <Star className="mx-auto mb-4 text-blue-500" />
                <h4 className="font-bold text-lg mb-2">Reach the Top!</h4>
                <p className="text-slate-400 text-sm max-w-md mx-auto">Winning bets and hitting the 2x Six Powerplay logic will boost your ranking. Every Sunday, the Top 3 win exclusive virtual badges.</p>
            </div>
        </div>
    );
};

export default Leaderboard;
