import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import MatchCard from '../components/MatchCard';
import BetModal from '../components/BetModal';
import { Activity, LayoutDashboard, Search, Calendar, Ghost } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Dashboard = () => {
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const q = query(collection(db, 'matches'), orderBy('matchTime', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredMatches = matches.filter(m => {
        if (filter === 'All') return true;
        return m.status === filter;
    });

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-[2px] mb-4 italic">
                        <Activity size={12} className="animate-pulse" />
                        Live Betting Open
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none">
                        Market <span className="logo-red">Explorer</span>
                    </h1>
                    <p className="text-zinc-500 max-w-lg font-medium mt-4">Predict match outcomes in real-time. Highest odds and instant settlements on all international tournaments.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {['All', 'Live', 'Upcoming'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'bg-zinc-900 text-zinc-500 hover:text-white border border-white/5'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-80 rounded-[32px] glass-card animate-pulse shadow-none" />
                    ))}
                </div>
            ) : (
                <>
                    {filteredMatches.length === 0 ? (
                        <div className="glass-card py-32 text-center flex flex-col items-center border-dashed border-zinc-800">
                            < Ghost size={64} className="text-zinc-800 mb-6" />
                            <h3 className="text-2xl font-black italic text-zinc-600 uppercase tracking-tight">No Active Markets</h3>
                            <p className="text-zinc-500 font-medium">There are currently no {filter.toLowerCase()} matches available for betting.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            {filteredMatches.map(match => (
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

            {/* Modals */}
            <AnimatePresence>
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
