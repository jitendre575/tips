import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Medal, Star, Crown, TrendingUp, User } from 'lucide-react';
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
            case 1: return <div className="bg-yellow-400 p-2 rounded-xl shadow-lg shadow-yellow-400/20"><Crown className="text-black" size={24} /></div>;
            case 2: return <div className="bg-slate-300 p-2 rounded-xl shadow-lg shadow-slate-300/20"><Medal className="text-black" size={24} /></div>;
            case 3: return <div className="bg-amber-600 p-2 rounded-xl shadow-lg shadow-amber-600/20"><Medal className="text-black" size={24} /></div>;
            default: return <span className="text-zinc-600 font-black text-xl italic ml-4">#{rank}</span>;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <div className="flex flex-col items-center text-center space-y-6">
                <div className="bg-red-500/10 p-5 rounded-[32px] border border-red-500/20 shadow-2xl relative">
                    <Trophy className="text-red-500 group-hover:animate-float" size={64} />
                    <div className="absolute -top-2 -right-2 bg-yellow-500 p-2 rounded-full border-4 border-[#050505]">
                        <Star className="text-black fill-current" size={16} />
                    </div>
                </div>
                <div>
                    <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none mb-4">
                        Hall of <span className="logo-red">Fame</span>
                    </h1>
                    <p className="text-zinc-500 max-w-lg font-medium">The top predictors and master strategists dominating the arena</p>
                </div>
            </div>

            <div className="glass-card !p-0 overflow-hidden border-white/[0.05]">
                {/* Header Row */}
                <div className="bg-white/[0.02] p-6 lg:p-8 border-b border-white/[0.05] grid grid-cols-12 gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                    <div className="col-span-2">Position</div>
                    <div className="col-span-6">Predictor</div>
                    <div className="col-span-4 text-right">Points / Balance</div>
                </div>

                {loading ? (
                    <div className="p-20 text-center">
                        <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Calculating Standings...</span>
                    </div>
                ) : (
                    <div className="divide-y divide-white/[0.03]">
                        {leaders.map((leader, index) => (
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={leader.id}
                                className={`grid grid-cols-12 gap-4 p-6 lg:p-8 items-center group hover:bg-white/[0.01] transition-all ${index === 0 ? 'bg-yellow-400/[0.03]' : ''
                                    }`}
                            >
                                <div className="col-span-2 flex items-center">
                                    {getRankBadge(leader.rank)}
                                </div>
                                <div className="col-span-6 flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center relative ${index === 0 ? 'bg-yellow-400/10 border-2 border-yellow-400/30' :
                                            index === 1 ? 'bg-slate-300/10 border-2 border-slate-300/30' :
                                                index === 2 ? 'bg-amber-600/10 border-2 border-amber-600/30' :
                                                    'bg-zinc-900 border border-white/5'
                                        }`}>
                                        <img
                                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${leader.email}`}
                                            alt=""
                                            className="w-full h-full rounded-2xl p-1"
                                        />
                                        {index < 3 && (
                                            <div className="absolute -bottom-1 -right-1 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#121212]">
                                                <Star className="text-white fill-current" size={8} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`font-black italic tracking-tight text-lg uppercase truncate ${index === 0 ? 'text-yellow-400' : 'text-zinc-200'
                                            }`}>
                                            {leader.email?.split('@')[0]}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Level {Math.floor((leader.totalBets || 0) / 5) + 1}</span>
                                            {leader.isAdmin && (
                                                <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 font-black uppercase">Admin</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-2xl lg:text-3xl font-black italic tracking-tighter ${index === 0 ? 'text-yellow-400' : 'text-white'
                                                }`}>
                                                {leader.balance?.toLocaleString()}
                                            </span>
                                            <TrendingUp size={16} className={index === 0 ? 'text-yellow-400' : 'text-zinc-700'} />
                                        </div>
                                        <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1">Total Wealth</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="glass-card p-10 bg-gradient-to-br from-[#121212] to-[#1a1a1a] relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-red-500 mb-6">
                            <Star size={24} />
                        </div>
                        <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-4">Master <span className="logo-red">Rewards</span></h4>
                        <p className="text-zinc-500 text-sm leading-relaxed mb-8">Top 3 performers every month receive exclusive profile badges and 20,000 bonus coins for our upcoming tournaments. Keep predicting to climb!</p>
                        <button className="text-[10px] font-black uppercase tracking-widest text-white hover:text-red-500 flex items-center gap-2 group/link">
                            View Reward Schedule <div className="w-1 h-1 bg-white rounded-full transition-all group-hover/link:w-4 group-hover/link:bg-red-500" />
                        </button>
                    </div>
                </div>

                <div className="glass-card p-10 flex flex-col items-center justify-center text-center border-dashed border-zinc-800">
                    <div className="bg-zinc-900 w-16 h-16 rounded-full flex items-center justify-center text-zinc-700 mb-6 border border-white/5">
                        <User size={32} />
                    </div>
                    <h4 className="text-xl font-bold text-zinc-500 mb-2">Showcase Your Progress</h4>
                    <p className="text-zinc-600 text-xs max-w-[200px]">Profiles are public. Win big and let the community see your prediction prowess.</p>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
