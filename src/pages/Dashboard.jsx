import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import BetModal from '../components/BetModal';
import { Activity, LayoutDashboard, Search, Calendar, Ghost, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Dashboard = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const filter = searchParams.get('filter') || 'Upcoming';

    const setFilter = (f) => {
        setSearchParams({ filter: f });
    };

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
        if (filter === 'Six Bonus') return m.sixInPowerplay;
        return m.status === filter;
    });

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 text-center lg:text-left pt-6">
                <div className="flex flex-col items-center lg:items-start">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-[3px] mb-8 italic shadow-xl shadow-red-500/5">
                        <Activity size={16} className="animate-pulse" />
                        Live Betting Open
                    </div>
                    <h1 className="text-5xl lg:text-8xl font-black italic tracking-tighter uppercase leading-[0.85] mb-6">
                        Market <br className="lg:hidden" />
                        <span className="text-red-600 block lg:inline drop-shadow-[0_10px_20px_rgba(239,68,68,0.3)]">Explorer</span>
                    </h1>
                    <p className="text-zinc-500 max-w-lg font-medium text-base lg:text-lg leading-relaxed px-4 lg:px-0 opacity-80">
                        Predict match outcomes in real-time. Highest odds and instant settlements on all international tournaments.
                    </p>
                </div>

                <div className="flex flex-wrap justify-center lg:justify-end gap-3 lg:pb-2 mt-4 lg:mt-0">
                    {['All', 'Live', 'Upcoming', 'Six Bonus'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-8 py-4 sm:px-10 sm:py-5 rounded-[20px] sm:rounded-[24px] text-[10px] sm:text-[12px] font-black uppercase tracking-[2px] transition-all duration-300 flex items-center gap-2 ${filter === f
                                ? f === 'Six Bonus'
                                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-[0_15px_40px_rgba(245,158,11,0.4)] scale-105'
                                    : 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-[0_15px_40px_rgba(239,68,68,0.4)] scale-105'
                                : 'bg-[#151515] text-zinc-500 hover:text-white border border-white/5 hover:bg-zinc-800'
                                }`}
                        >
                            {f === 'Six Bonus' && <Zap size={14} className={filter === f ? 'fill-black' : 'text-amber-500'} />}
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            {
                loading ? (
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
                )
            }

            {/* Modals */}
            <AnimatePresence>
                {selectedMatch && (
                    <BetModal
                        match={selectedMatch}
                        onClose={() => setSelectedMatch(null)}
                    />
                )}
            </AnimatePresence>
        </div >
    );
};

export default Dashboard;
