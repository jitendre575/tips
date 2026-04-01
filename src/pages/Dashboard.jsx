import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, getDocs, limit, addDoc } from 'firebase/firestore';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MatchCard from '../components/MatchCard';
import BetModal from '../components/BetModal';
import CasinoCard from '../components/CasinoCard';
import { Activity, LayoutDashboard, Search, Calendar, Ghost, Zap, Trophy, Gamepad2, Sparkles, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const Dashboard = () => {
    const { user, userData } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null); // null = show today's + 4 default
    const calendarRef = useRef(null);

    const activeTab = searchParams.get('view') || 'Sports';
    const filter = searchParams.get('filter') || 'Upcoming';

    // Build next 14 days strip
    const dateStrip = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

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
        if (!user || !user.uid) return;
        const userRef = doc(db, 'users', user.uid);
        
        updateDoc(userRef, {
            lastActiveAt: serverTimestamp(),
            currentLocation: activeTab === 'Sports' ? 'Sports Market' : 'Casino Lobby',
            isOnline: true
        }).catch(err => console.error("Tracking Error:", err));
    }, [activeTab, user]);

    useEffect(() => {
        const q = query(collection(db, 'matches'), orderBy('matchTime', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filter matches that are more than 5 hours old
            const currentTime = new Date().getTime();
            const fiveHoursInMs = 5 * 60 * 60 * 1000;
            
            const validMatches = allMatches.filter(match => {
                const matchTimeMs = new Date(match.matchTime).getTime();
                return (currentTime - matchTimeMs) < fiveHoursInMs;
            });

            // Deduplicate: keep only first occurrence of each unique match (teamA+teamB+time)
            const seen = new Set();
            const uniqueMatches = validMatches.filter(match => {
                const key = `${match.teamA}-${match.teamB}-${match.matchTime}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });

            setMatches(uniqueMatches);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // One-time seeding logic — StrictMode safe via sessionStorage guard
    useEffect(() => {
        if (!user) return;
        if (sessionStorage.getItem('matchesSeeded')) return; // Prevent double-run in StrictMode
        sessionStorage.setItem('matchesSeeded', '1');
        const seedMatches = async () => {
            const q = query(collection(db, 'matches'), limit(1));
            const snapshot = await getDocs(q);
            if (snapshot.empty) {
                const iplMatches = [
                    { teamA: 'Sunrisers Hyderabad', teamB: 'Royal Challengers Bengaluru', matchTime: '2026-04-02T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                    { teamA: 'Kolkata Knight Riders', teamB: 'Mumbai Indians', matchTime: '2026-04-03T19:30', oddsTeamA: 1.8, oddsTeamB: 2.1, status: 'Upcoming', sixInPowerplay: true },
                    { teamA: 'Chennai Super Kings', teamB: 'Rajasthan Royals', matchTime: '2026-04-04T15:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                    { teamA: 'Gujarat Titans', teamB: 'Punjab Kings', matchTime: '2026-04-04T19:30', oddsTeamA: 2.0, oddsTeamB: 1.8, status: 'Upcoming', sixInPowerplay: true },
                    { teamA: 'Delhi Capitals', teamB: 'Lucknow Super Giants', matchTime: '2026-04-05T15:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                    { teamA: 'Sunrisers Hyderabad', teamB: 'Kolkata Knight Riders', matchTime: '2026-04-06T19:30', oddsTeamA: 1.8, oddsTeamB: 2.2, status: 'Upcoming', sixInPowerplay: true },
                    { teamA: 'Punjab Kings', teamB: 'Chennai Super Kings', matchTime: '2026-04-07T19:30', oddsTeamA: 2.1, oddsTeamB: 1.7, status: 'Upcoming', sixInPowerplay: true },
                    { teamA: 'Mumbai Indians', teamB: 'Delhi Capitals', matchTime: '2026-04-08T15:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                    { teamA: 'Rajasthan Royals', teamB: 'Gujarat Titans', matchTime: '2026-04-09T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                    { teamA: 'Lucknow Super Giants', teamB: 'Sunrisers Hyderabad', matchTime: '2026-04-10T19:30', oddsTeamA: 1.8, oddsTeamB: 2.2, status: 'Upcoming', sixInPowerplay: true }
                ];
                for (const match of iplMatches) {
                    await addDoc(collection(db, 'matches'), { ...match, createdAt: serverTimestamp() });
                }
            }
        };
        seedMatches();
    }, [user]);

    const toDateStr = (d) => new Date(d).toDateString();

    const filteredMatches = matches.filter(m => {
        // Date filter first
        if (selectedDate) {
            if (toDateStr(m.matchTime) !== toDateStr(selectedDate)) return false;
        }
        if (filter === 'All') return true;
        if (filter === 'Six Bonus') return m.sixInPowerplay;
        return m.status === filter;
    });

    // Default view: show only first 4 matches (when no date selected)
    const displayedMatches = selectedDate ? filteredMatches : filteredMatches.slice(0, 4);
    const hiddenCount = selectedDate ? 0 : Math.max(0, filteredMatches.length - 4);

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
                    <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-accent/5 border border-accent/10 rounded-[6px] text-accent text-[8px] sm:text-[10px] font-black uppercase tracking-[2px] sm:tracking-[3px] mb-4 sm:mb-8 italic shadow-sm">
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
                    <div className="bg-slate-100/80 backdrop-blur-xl p-1.5 sm:p-2 rounded-[6px] border border-black/[0.05] flex gap-1 sm:gap-2 w-full max-w-sm mx-auto shadow-inner">
                        {[
                            { id: 'Sports', icon: Trophy },
                            { id: 'Casino', icon: Gamepad2 }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-3.5 sm:py-4.5 rounded-[6px] flex items-center justify-center gap-2 text-[10px] sm:text-[12px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-[#b91c1c] text-white shadow-xl shadow-red-900/20 !px-0'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.id}
                            </button>
                        ))}
                    </div>

                    {/* NEW SECTION FOR 3 OVER BONUS - MOVED GLOBALLY */}
                    <div className="w-full max-w-4xl mx-auto px-1 mb-6">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full bg-gradient-to-br from-[#b91c1c] via-[#dc2626] to-[#f97316] rounded-[6px] p-5 text-white relative overflow-hidden group border border-white/20 shadow-2xl"
                        >
                            {/* Animated Background Orbs */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-[6px] blur-3xl animate-pulse" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-500/20 rounded-[6px] blur-2xl animate-bounce duration-[3000ms]" />
                            
                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="inline-block px-3 py-1 bg-white/20 rounded-[6px] backdrop-blur-md border border-white/30 text-[8px] font-black uppercase tracking-[2px] text-white shadow-sm">
                                        ⚡ Limited Offer
                                    </div>
                                    <Trophy size={32} className="text-white drop-shadow-lg opacity-80" />
                                </div>
                                
                                <div className="space-y-1">
                                    <h3 className="text-2xl sm:text-3xl font-black italic tracking-tighter drop-shadow-md uppercase leading-none">
                                        6 Bonus Extended <br />
                                        <span className="text-[#fde047] drop-shadow-[0_2px_10px_rgba(253,224,71,0.5)]">TO 3 OVERS!</span> 🏏
                                    </h3>
                                    <div className="h-1 w-12 bg-[#fde047] rounded-[6px]" />
                                </div>

                                <div className="bg-black/10 backdrop-blur-sm rounded-[6px] p-3 border border-white/10">
                                    <p className="text-[11px] font-bold text-white/90 leading-tight">
                                        The legendary Six Bonus is now alive for the <span className="text-yellow-300">First 3 Overs</span> of every match. 
                                        Don't just watch, win bigger today!
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {activeTab === 'Sports' && (
                        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto px-2">
                            {/* Status Filters */}
                            <div className="flex flex-wrap justify-center gap-3 sm:gap-5">
                                {['All', 'Live', 'Upcoming', 'Six Bonus'].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-5 sm:px-8 py-3.5 sm:py-4 rounded-[6px] text-[10px] sm:text-[11px] font-black uppercase tracking-widest sm:tracking-[3px] transition-all duration-300 flex items-center gap-2.5 ${filter === f
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

                            {/* Date Calendar Strip */}
                            <div className="relative">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-2 flex items-center gap-2"><Calendar size={10}/> Browse by Date</p>
                                <div ref={calendarRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                    {/* All Dates button */}
                                    <button
                                        onClick={() => setSelectedDate(null)}
                                        className={`shrink-0 snap-start flex flex-col items-center justify-center w-14 h-16 rounded-[6px] border text-center transition-all ${
                                            !selectedDate
                                                ? 'bg-[#b91c1c] border-[#b91c1c] text-white shadow-lg shadow-red-500/20'
                                                : 'bg-white/70 border-slate-200 text-slate-500 hover:bg-white'
                                        }`}
                                    >
                                        <span className="text-[8px] font-black uppercase tracking-widest">All</span>
                                        <span className="text-lg font-black leading-none">★</span>
                                    </button>
                                    {dateStrip.map((d, i) => {
                                        const isSelected = selectedDate && toDateStr(d) === toDateStr(selectedDate);
                                        const hasMatch = matches.some(m => toDateStr(m.matchTime) === toDateStr(d));
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedDate(d)}
                                                className={`shrink-0 snap-start flex flex-col items-center justify-center w-14 h-16 rounded-[6px] border text-center transition-all relative ${
                                                    isSelected
                                                        ? 'bg-[#b91c1c] border-[#b91c1c] text-white shadow-lg shadow-red-500/20 scale-105'
                                                        : 'bg-white/70 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'
                                                }`}
                                            >
                                                <span className="text-[8px] font-black uppercase tracking-widest">{d.toLocaleDateString('en',{weekday:'short'})}</span>
                                                <span className="text-xl font-black leading-tight">{d.getDate()}</span>
                                                <span className="text-[7px] font-black uppercase">{d.toLocaleDateString('en',{month:'short'})}</span>
                                                {hasMatch && !isSelected && (
                                                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
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
                            <div className="grid grid-cols-1 gap-8">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-80 rounded-[6px] bg-white border border-black/[0.05] animate-pulse shadow-sm" />
                                ))}
                            </div>
                        ) : (
                            <>
                                {filteredMatches.length === 0 ? (
                                    <div className="bg-slate-50 py-32 text-center flex flex-col items-center border-dashed border-slate-200 border-2 rounded-[6px]">
                                        <Ghost size={64} className="text-slate-300 mb-6" />
                                        <h3 className="text-2xl font-black italic text-slate-900 uppercase tracking-tight">Arena is Empty</h3>
                                        <p className="text-slate-500 font-medium text-sm">No {filter.toLowerCase()} matches are active right now.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6 sm:gap-8">
                                        {displayedMatches.map(match => (
                                            <MatchCard
                                                key={match.id}
                                                match={match}
                                                onBet={(m) => setSelectedMatch(m)}
                                            />
                                        ))}
                                        {/* Show More via Calendar hint */}
                                        {hiddenCount > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white border-2 border-dashed border-slate-200 rounded-[6px] p-8 text-center flex flex-col items-center gap-3"
                                            >
                                                <Calendar size={32} className="text-slate-300" />
                                                <p className="text-slate-800 font-black italic uppercase text-lg tracking-tight">{hiddenCount} More Matches</p>
                                                <p className="text-slate-500 text-xs font-medium">Select a date from the calendar above to view upcoming matches</p>
                                            </motion.div>
                                        )}
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
                                        <button className="p-1.5 sm:p-2 bg-[#1a2c38] rounded-[6px] text-zinc-500 hover:text-white transition-colors"><Search size={14} /></button>
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
                            <div className="relative group overflow-hidden bg-gradient-to-r from-indigo-900/20 to-black border border-indigo-500/10 p-10 rounded-[6px] flex flex-col items-center text-center space-y-6">
                                <div className="p-3 bg-indigo-500/10 rounded-[6px] text-indigo-400 border border-indigo-500/20">
                                    <Flame size={24} className="animate-bounce" />
                                </div>
                                <h4 className="text-2xl lg:text-4xl font-black italic uppercase tracking-tighter text-white">VIP LOUNGE UNLOCKED</h4>
                                <p className="text-zinc-500 max-w-xl font-medium text-sm leading-relaxed">Join high-stakes tables and win exclusive bonuses. The ultimate experience awaits.</p>
                                <button className="px-8 py-4 bg-white text-black rounded-[6px] font-black uppercase italic tracking-widest text-xs hover:bg-indigo-500 hover:text-white transition-all shadow-xl active:scale-95">
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
