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
        { id: 'dice', name: 'Dice', image: '/casino/dice.png', activePlayers: '2,325', provider: 'ORIGINALS' },
        { id: 'plinko', name: 'Plinko', image: '/casino/plinko.png', activePlayers: '1,598', provider: 'ORIGINALS' },
        { id: 'crash', name: 'Crash', image: '/casino/crash.png', activePlayers: '1,232', provider: 'ORIGINALS' },
        { id: 'limbo', name: 'Limbo', image: '/casino/blackjack.png', activePlayers: '2,257', provider: 'ORIGINALS' },
        { id: 'hilo', name: 'Hilo', image: '/casino/poker.png', activePlayers: '502', provider: 'ORIGINALS' },
        { id: 'color', name: 'Color Prediction', image: '/casino/roulette.png', activePlayers: '3,842', provider: 'ORIGINALS' },
        { id: 'chicken', name: 'Chicken 2 Road', image: '/casino/baccarat.png', activePlayers: '1,120', provider: 'ORIGINALS' },
    ];

    const slotGames = [
        { id: 'bonanza', name: 'Sweet Bonanza', image: '/casino/slots.png', activePlayers: '381', provider: 'PRAGMATIC' },
        { id: 'olympus', name: 'Gates of Olympus', image: '/casino/slots.png', activePlayers: '391', provider: 'PRAGMATIC' },
        { id: 'fisherman', name: 'Le Fisherman', image: '/casino/slots.png', activePlayers: '205', provider: 'HACKSAW' },
    ];

    return (
        <div className="space-y-8 sm:space-y-12">
            {/* Page Header */}
            <div className="flex flex-col items-center gap-6 pt-4 sm:pt-6">
                <div className="flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-accent/5 border border-accent/10 rounded-full text-accent text-[8px] sm:text-[10px] font-black uppercase tracking-[2px] sm:tracking-[3px] mb-4 sm:mb-8 italic shadow-sm">
                        <Activity size={14} className="animate-pulse" />
                        {activeTab === 'Sports' ? 'Market Pulse Active' : 'Casino Floor Live'}
                    </div>
                    <h1 className="text-3xl sm:text-6xl font-black italic tracking-tighter uppercase leading-[0.85] text-center text-slate-900">
                        {activeTab === 'Sports' ? (
                            <>Market <span className="text-accent underline decoration-accent/10">Explorer</span></>
                        ) : (
                            <>Gaming <span className="text-accent underline decoration-accent/10">Universe</span></>
                        )}
                    </h1>
                </div>

                <div className="flex flex-col gap-6 sm:gap-8 items-center w-full">
                    {/* View Switcher */}
                    <div className="bg-slate-100/80 backdrop-blur-xl p-1.5 sm:p-2 rounded-[10px] border border-black/[0.05] flex gap-1 sm:gap-2 w-full max-w-sm mx-auto shadow-inner">
                        {[
                            { id: 'Sports', icon: Trophy },
                            { id: 'Casino', icon: Gamepad2 }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3.5 sm:py-4.5 rounded-[10px] flex items-center justify-center gap-2 text-[10px] sm:text-[12px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-[#b91c1c] text-white shadow-xl shadow-red-900/20 !px-0'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.id}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'Sports' && (
                        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto px-2">
                            {/* NEW SECTION FOR 3 OVER BONUS */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, type: 'spring' }}
                                className="w-full bg-gradient-to-br from-[#b91c1c] via-[#dc2626] to-[#f97316] rounded-[10px] p-6 sm:p-10 shadow-2xl shadow-red-500/20 text-white relative overflow-hidden group border border-white/20"
                            >
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 -mr-16 -mt-16 opacity-10 blur-sm group-hover:rotate-12 transition-transform duration-700">
                                    <Zap size={250} />
                                </div>
                                <div className="absolute bottom-0 left-0 ml-12 mb-[-30px] opacity-20 hidden sm:block">
                                    <Flame size={120} />
                                </div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                                    <div className="bg-white/20 p-5 rounded-[10px] backdrop-blur-md shadow-inner border border-white/30 hidden sm:block">
                                        <Trophy size={56} className="text-white drop-shadow-lg" />
                                    </div>
                                    <div className="text-center md:text-left flex-1">
                                        <div className="inline-block px-5 py-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/30 text-[10px] sm:text-xs font-black uppercase tracking-[4px] text-white shadow-sm mb-4">
                                            Major Update
                                        </div>
                                        <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter mb-4 drop-shadow-md uppercase leading-none">
                                            6 Bonus Extended <br className="hidden md:block"/> to <span className="text-[#fde047]">3 Overs!</span> 🏏
                                        </h3>
                                        <p className="text-sm sm:text-lg font-medium text-white/90 leading-relaxed max-w-2xl drop-shadow-sm">
                                            We've upgraded the thrill! The Six Bonus you previously enjoyed in the first 2 overs is now extended to the <span className="font-black bg-white/20 px-2 py-0.5 rounded text-white inline-block mt-1 sm:mt-0">First 3 Overs</span>. Place your bets and win bigger!
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Filters */}
                            <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
                                {['All', 'Live', 'Upcoming', 'Six Bonus'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-5 sm:px-8 py-3.5 sm:py-4 rounded-[10px] text-[10px] sm:text-[11px] font-black uppercase tracking-widest sm:tracking-[3px] transition-all duration-300 flex items-center gap-2.5 ${filter === f
                                            ? f === 'Six Bonus'
                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/30 border border-amber-400/50 scale-105'
                                                : 'bg-white text-[#b91c1c] border-2 border-[#b91c1c] shadow-lg scale-105'
                                            : 'bg-white/80 backdrop-blur-sm text-slate-500 hover:text-slate-900 hover:bg-white border-2 border-transparent hover:border-slate-200 shadow-sm'
                                            }`}
                                    >
                                        {f === 'Six Bonus' && <Zap size={14} className={filter === f ? 'fill-white animate-pulse' : 'text-amber-500'} />}
                                        {f}
                                    </button>
                                ))}
                            </div>
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
                                    <div key={i} className="h-80 rounded-[10px] bg-white border border-black/[0.05] animate-pulse shadow-sm" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {filteredMatches.length === 0 ? (
                                    <div className="bg-slate-50 py-32 text-center flex flex-col items-center border-dashed border-slate-200 border-2 rounded-[10px]">
                                        <Ghost size={64} className="text-slate-300 mb-6" />
                                        <h3 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">Arena is Empty</h3>
                                        <p className="text-slate-500 font-medium text-sm">No {filter.toLowerCase()} matches are active right now.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
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
                                        <h2 className="text-base sm:text-xl font-black italic uppercase tracking-tighter text-slate-500">Originals</h2>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 sm:p-2 bg-[#1a2c38] rounded-[10px] text-zinc-500 hover:text-white transition-colors"><Search size={14} /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 sm:gap-4 px-1">
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
                                        <h2 className="text-base sm:text-xl font-black italic uppercase tracking-tighter text-slate-500">Slots</h2>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-6 px-1">
                                    {slotGames.map(game => (
                                        <CasinoCard key={game.id} game={game} onPlay={(g) => navigate(`/casino/${g.id}`)} />
                                    ))}
                                </div>
                            </section>

                            {/* Promotional Banner */}
                            <div className="relative group overflow-hidden bg-gradient-to-r from-indigo-900/20 to-black border border-indigo-500/10 p-10 rounded-[10px] flex flex-col items-center text-center space-y-6">
                                <div className="p-3 bg-indigo-500/10 rounded-[10px] text-indigo-400 border border-indigo-500/20">
                                    <Flame size={24} className="animate-bounce" />
                                </div>
                                <h4 className="text-2xl lg:text-4xl font-black italic uppercase tracking-tighter text-white">VIP LOUNGE UNLOCKED</h4>
                                <p className="text-zinc-500 max-w-xl font-medium text-sm leading-relaxed">Join high-stakes tables and win exclusive bonuses. The ultimate experience awaits.</p>
                                <button className="px-8 py-4 bg-white text-black rounded-[10px] font-black uppercase italic tracking-widest text-xs hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95">
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
