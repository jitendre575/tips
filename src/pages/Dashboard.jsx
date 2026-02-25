import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import MatchCard from '../components/MatchCard';
import BetModal from '../components/BetModal';
import { Trophy, Zap, Calendar, Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Dashboard = () => {
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'matches'), orderBy('matchTime', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMatches(matchesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 bg-grid min-h-screen">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                <div className="space-y-4 text-left">
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-red-500 font-bold uppercase tracking-[2px] text-[10px] w-fit italic">
                        <Activity size={12} className="animate-pulse" />
                        <span>Markets are Live</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-black italic tracking-tighter uppercase leading-none">
                        Cricket <span className="logo-red">Dashboard</span>
                    </h1>
                    <p className="text-zinc-500 max-w-lg font-medium">Real-time match updates and betting markets. Predict the winners and boost your balance.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-zinc-900 border border-white/[0.05] px-8 py-4 rounded-[24px] flex flex-col">
                        <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Live Matches</span>
                        <span className="text-3xl font-black italic logo-red tracking-tighter leading-tight">
                            {matches.filter(m => m.status === 'Live').length}
                        </span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[400px] rounded-[32px] animate-pulse bg-zinc-900/50 border border-white/[0.05]" />
                    ))}
                </div>
            ) : (
                <>
                    {matches.length === 0 ? (
                        <div className="py-32 text-center bg-zinc-900/30 rounded-[32px] border border-white/[0.05]">
                            <Calendar className="mx-auto mb-6 text-zinc-800" size={64} />
                            <h3 className="text-2xl font-black italic text-zinc-600 uppercase tracking-tight">No markets found</h3>
                            <p className="text-zinc-500 font-medium">Check back later for upcoming tournaments</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {matches.map(match => (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    onBet={(m) => setSelectedMatch(m)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            <AnimatePresence mode="wait">
                {selectedMatch && (
                    <BetModal
                        match={selectedMatch}
                        onClose={() => setSelectedMatch(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;

