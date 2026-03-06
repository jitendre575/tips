import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MatchCard from '../components/MatchCard';
import BetModal from '../components/BetModal';
import CasinoCard from '../components/CasinoCard';
import { Activity, LayoutDashboard, Search, Calendar, Ghost, Zap, Trophy, Gamepad2, Sparkles, Flame } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [loading, setLoading] = useState(true);

    const activeTab = searchParams.get('view') || 'Sports';
    const filter = searchParams.get('filter') || 'Upcoming';

    const setActiveTab = (tab) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', tab);
        if (tab === 'Casino') {
            newParams.delete('filter'); // Clean up sports filters when in casino
        }
        setSearchParams(newParams);
    };

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

    const originalGames = [
        { id: 'mines', name: 'Mines', image: '/casino/mines.png', activePlayers: '2,683', provider: 'ORIGINALS' },
        { id: 'dice', name: 'Dice', image: '/casino/blackjack.png', activePlayers: '2,325', provider: 'ORIGINALS' },
        { id: 'plinko', name: 'Plinko', image: '/casino/baccarat.png', activePlayers: '1,598', provider: 'ORIGINALS' },
        { id: 'crash', name: 'Crash', image: '/casino/roulette.png', activePlayers: '1,232', provider: 'ORIGINALS' },
        { id: 'limbo', name: 'Limbo', image: '/casino/poker.png', activePlayers: '2,257', provider: 'ORIGINALS' },
        { id: 'hilo', name: 'Hilo', image: '/casino/blackjack.png', activePlayers: '502', provider: 'ORIGINALS' },
    ];

    const slotGames = [
        { id: 'bonanza', name: 'Sweet Bonanza', image: '/casino/slots.png', activePlayers: '381', provider: 'PRAGMATIC' },
        { id: 'olympus', name: 'Gates of Olympus', image: '/casino/roulette.png', activePlayers: '391', provider: 'PRAGMATIC' },
        { id: 'fisherman', name: 'Le Fisherman', image: '/casino/poker.png', activePlayers: '205', provider: 'HACKSAW' },
    ];

    return (
        <div className="space-y-12">
            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 text-center lg:text-left pt-6">
                <div className="flex flex-col items-center lg:items-start">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent/10 border border-accent/20 rounded-full text-accent text-[10px] font-black uppercase tracking-[3px] mb-8 italic shadow-xl shadow-accent/5">
                        <Activity size={16} className="animate-pulse" />
                        {activeTab === 'Sports' ? 'Live Markets Active' : 'Casino Floor Open'}
                    </div>
                    <h1 className="text-4xl lg:text-7xl font-black italic tracking-tighter uppercase leading-[0.85] mb-6">
                        {activeTab === 'Sports' ? (
                            <>Market <br className="lg:hidden" /> <span className="text-accent block lg:inline drop-shadow-[0_10px_20px_rgba(59,130,246,0.3)]">Explorer</span></>
                        ) : (
                            <>Gaming <br className="lg:hidden" /> <span className="text-indigo-500 block lg:inline drop-shadow-[0_10px_20px_rgba(99,102,241,0.3)]">Universe</span></>
                        )}
                    </h1>
                </div>

                <div className="flex flex-col gap-6 items-center lg:items-end">
                    {/* View Switcher */}
                    <div className="bg-[#121212] p-2 rounded-[28px] border border-white/5 flex gap-2">
                        {[
                            { id: 'Sports', icon: Trophy },
                            { id: 'Casino', icon: Gamepad2 }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-8 py-4 rounded-[22px] flex items-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                                    ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-105'
                                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.id}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'Sports' && (
                        <div className="flex flex-wrap justify-center lg:justify-end gap-2">
                            {['All', 'Live', 'Upcoming', 'Six Bonus'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-[2px] transition-all duration-300 flex items-center gap-2 ${filter === f
                                        ? f === 'Six Bonus'
                                            ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-black shadow-lg shadow-amber-500/20'
                                            : 'bg-[#1a1a1a] text-accent border border-accent/20'
                                        : 'bg-[#0c0c0c] text-zinc-600 hover:text-white border border-white/5'
                                        }`}
                                >
                                    {f === 'Six Bonus' && <Zap size={12} className={filter === f ? 'fill-black' : 'text-amber-500'} />}
                                    {f}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'Sports' ? (
                        loading ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-80 rounded-[32px] glass-card animate-pulse shadow-none" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {filteredMatches.length === 0 ? (
                                    <div className="glass-card py-32 text-center flex flex-col items-center border-dashed border-zinc-900 border-2">
                                        <Ghost size={64} className="text-zinc-900 mb-6" />
                                        <h3 className="text-2xl font-black italic text-zinc-800 uppercase tracking-tight">Arena is Empty</h3>
                                        <p className="text-zinc-600 font-medium text-sm">No {filter.toLowerCase()} matches are active right now.</p>
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
                    ) : (
                        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-5 duration-500">
                            {/* Originals Section */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-3">
                                        <Sparkles size={18} className="text-indigo-500" />
                                        <h2 className="text-base sm:text-xl font-black italic uppercase tracking-tighter text-white">Originals</h2>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 sm:p-2 bg-[#1a2c38] rounded-lg text-zinc-500 hover:text-white transition-colors"><Search size={14} /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-6 px-1">
                                    {originalGames.map(game => (
                                        <CasinoCard key={game.id} game={game} onPlay={(g) => navigate(`/casino/${g.id}`)} />
                                    ))}
                                </div>
                            </section>

                            {/* Slots Section */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm sm:text-lg font-black text-indigo-500 italic">777</div>
                                        <h2 className="text-base sm:text-xl font-black italic uppercase tracking-tighter text-white">Slots</h2>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-6 px-1">
                                    {slotGames.map(game => (
                                        <CasinoCard key={game.id} game={game} onPlay={(g) => navigate(`/casino/${g.id}`)} />
                                    ))}
                                </div>
                            </section>

                            {/* Promotional Banner */}
                            <div className="relative group overflow-hidden bg-gradient-to-r from-indigo-900/20 to-black border border-indigo-500/10 p-10 rounded-[40px] flex flex-col items-center text-center space-y-6">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                                    <Flame size={24} className="animate-bounce" />
                                </div>
                                <h4 className="text-2xl lg:text-4xl font-black italic uppercase tracking-tighter text-white">VIP LOUNGE UNLOCKED</h4>
                                <p className="text-zinc-500 max-w-xl font-medium text-sm leading-relaxed">Join high-stakes tables and win exclusive bonuses. The ultimate experience awaits.</p>
                                <button className="px-8 py-4 bg-white text-black rounded-xl font-black uppercase italic tracking-widest text-xs hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95">
                                    Join VIP Table
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

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
