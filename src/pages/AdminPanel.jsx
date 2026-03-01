import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, increment, writeBatch, serverTimestamp, orderBy } from 'firebase/firestore';
import { Plus, Trophy, Trash2, Zap, Clock, Calendar, TrendingUp, ShieldCheck, Sword, Target, Activity, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPanel = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMatch, setNewMatch] = useState({
        teamA: '',
        teamB: '',
        oddsTeamA: 1.8,
        oddsTeamB: 2.1,
        matchTime: '',
        status: 'Upcoming',
        sixInPowerplay: false,
    });

    useEffect(() => {
        const q = query(collection(db, 'matches'), orderBy('matchTime', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Snapshot error:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddMatch = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'matches'), {
                ...newMatch,
                createdAt: serverTimestamp()
            });
            toast.success('New market initialized!');
            setNewMatch({
                teamA: '',
                teamB: '',
                oddsTeamA: 1.8,
                oddsTeamB: 2.1,
                matchTime: '',
                status: 'Upcoming',
                sixInPowerplay: false,
            });
        } catch (error) {
            toast.error('Error adding match');
        }
    };

    const updateMatchStatus = async (id, status) => {
        try {
            await updateDoc(doc(db, 'matches', id), { status });
            toast.success(`Market is now ${status}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const toggleSixHook = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, 'matches', id), { sixInPowerplay: !currentStatus });
            toast.success(`2X Multiplier ${!currentStatus ? 'ENABLED' : 'DISABLED'}`);
        } catch (error) {
            toast.error('Failed to update bonus logic');
        }
    };

    const declareWinner = async (match, winnerName) => {
        const loadingToast = toast.loading('Settling bets and declaring winner...');
        try {
            const batch = writeBatch(db);
            const matchRef = doc(db, 'matches', match.id);

            batch.update(matchRef, {
                status: 'Finished',
                winner: winnerName,
                finishedAt: serverTimestamp()
            });

            const betsQuery = query(collection(db, 'bets'), where('matchId', '==', match.id), where('status', '==', 'pending'));
            const betsSnapshot = await getDocs(betsQuery);

            let winnersCount = 0;
            betsSnapshot.forEach((betDoc) => {
                const bet = betDoc.data();
                const betRef = doc(db, 'bets', betDoc.id);
                const userRef = doc(db, 'users', bet.userId);

                if (bet.selectedTeam === winnerName) {
                    const multiplier = match.sixInPowerplay ? 2 : 1;
                    const reward = bet.amount * bet.odds * multiplier;
                    batch.update(userRef, {
                        balance: increment(reward),
                        totalWon: increment(reward)
                    });
                    batch.update(betRef, {
                        status: 'won',
                        payout: reward,
                        sixRewardApplied: match.sixInPowerplay,
                        settledAt: serverTimestamp()
                    });
                    winnersCount++;
                } else {
                    batch.update(betRef, {
                        status: 'lost',
                        payout: 0,
                        settledAt: serverTimestamp()
                    });
                }
            });

            await batch.commit();
            toast.success(`Winner declared! ${winnersCount} bets settled.`, { id: loadingToast });
        } catch (error) {
            console.error('Declaration error:', error);
            toast.error('Failed to settle bets', { id: loadingToast });
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-red-500/10 rounded-[30px] border border-red-500/20 flex items-center justify-center text-red-500 shadow-2xl">
                        <ShieldCheck size={40} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="text-red-500" size={14} />
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Global Operations</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Market <span className="logo-red">Control</span>
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium mt-2">Manage live trading markets and settle winning brackets.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-[24px] border border-white/5">
                    <div className="px-6 py-3 bg-zinc-900 rounded-2xl flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Live Markets</span>
                        <span className="text-xl font-black text-red-500 italic">{matches.filter(m => m.status === 'Live').length}</span>
                    </div>
                    <div className="px-6 py-3 bg-zinc-900 rounded-2xl flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Upcoming</span>
                        <span className="text-xl font-black text-white italic">{matches.filter(m => m.status === 'Upcoming').length}</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Creation Form */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[40px] p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                            <Plus size={120} />
                        </div>

                        <div className="relative space-y-10">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Initialize <span className="logo-red">Market</span></h3>
                                <p className="text-zinc-500 text-xs mt-1">Configure teams and initial odds</p>
                            </div>

                            <form onSubmit={handleAddMatch} className="space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Team A (Host)</label>
                                        <input
                                            type="text" required
                                            value={newMatch.teamA}
                                            onChange={e => setNewMatch({ ...newMatch, teamA: e.target.value })}
                                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/30 transition-all"
                                            placeholder="INDIA"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Team B (Away)</label>
                                        <input
                                            type="text" required
                                            value={newMatch.teamB}
                                            onChange={e => setNewMatch({ ...newMatch, teamB: e.target.value })}
                                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/30 transition-all"
                                            placeholder="AUSTRALIA"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Team A Odds</label>
                                        <div className="relative">
                                            <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                            <input
                                                type="number" step="0.01" required
                                                value={newMatch.oddsTeamA}
                                                onChange={e => setNewMatch({ ...newMatch, oddsTeamA: Number(e.target.value) })}
                                                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-black text-white focus:outline-none focus:border-red-500/30 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Team B Odds</label>
                                        <div className="relative">
                                            <TrendingUp className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                            <input
                                                type="number" step="0.01" required
                                                value={newMatch.oddsTeamB}
                                                onChange={e => setNewMatch({ ...newMatch, oddsTeamB: Number(e.target.value) })}
                                                className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-black text-white focus:outline-none focus:border-red-500/30 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Match Commencement</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                        <input
                                            type="datetime-local" required
                                            value={newMatch.matchTime}
                                            onChange={e => setNewMatch({ ...newMatch, matchTime: e.target.value })}
                                            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/30 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-3xl flex items-center justify-between group/bonus hover:bg-zinc-900 transition-all">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <Zap size={12} className="text-amber-500 fill-amber-500" /> 2X Bonus Logic
                                        </p>
                                        <p className="text-[9px] text-zinc-500 font-bold max-w-[140px]">Double winnings if six hit in first 4 overs.</p>
                                    </div>
                                    <div className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newMatch.sixInPowerplay}
                                            onChange={e => setNewMatch({ ...newMatch, sixInPowerplay: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-[24px] font-black uppercase italic tracking-[4px] transition-all shadow-2xl shadow-red-600/20 active:scale-95"
                                >
                                    Initiate Market
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Markets List */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Active <span className="logo-red">Markets</span></h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-900 px-4 py-1.5 rounded-full border border-white/5">
                                {matches.length} Total
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {loading ? (
                            [1, 2, 3].map(n => (
                                <div key={n} className="h-40 bg-zinc-900/50 rounded-[40px] animate-pulse border border-white/5" />
                            ))
                        ) : matches.length === 0 ? (
                            <div className="bg-zinc-900/20 border-2 border-dashed border-white/5 rounded-[40px] p-24 text-center">
                                <Sword size={48} className="mx-auto text-zinc-800 mb-6" />
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">No Active Markets</h3>
                                <p className="text-zinc-500 text-sm font-medium mt-1">Start by initializing a new market from the left panel.</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {matches.map((match) => (
                                    <motion.div
                                        key={match.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 hover:border-white/10 transition-all shadow-2xl overflow-hidden relative"
                                    >
                                        <div className="flex items-center gap-8 flex-1">
                                            <div className="relative">
                                                <div className={`w-20 h-20 rounded-[30px] flex flex-col items-center justify-center shrink-0 border transition-all duration-500 ${match.status === 'Live' ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' :
                                                    match.status === 'Finished' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                                                        'bg-zinc-900 text-zinc-600 border-white/5'
                                                    }`}>
                                                    <Trophy size={24} />
                                                    <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">{match.status}</span>
                                                </div>
                                                {match.status === 'Live' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-4 border-[#0a0a0a] rounded-full" />}
                                            </div>

                                            <div className="space-y-3">
                                                <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
                                                    {match.teamA} <span className="text-zinc-700 text-xl mx-2 lowercase not-italic">vs</span> {match.teamB}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5">
                                                        <Calendar size={12} className="text-red-500" />
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                            {new Date(match.matchTime).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/5">
                                                        <Clock size={12} className="text-red-500" />
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                            {new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-emerald-500/5 px-4 py-1.5 rounded-xl border border-emerald-500/10">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[8px] font-black text-zinc-600 uppercase">Odds A</span>
                                                            <span className="text-xs font-black text-emerald-500">{match.oddsTeamA.toFixed(1)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 border-l border-emerald-500/20 pl-4">
                                                            <span className="text-[8px] font-black text-zinc-600 uppercase">Odds B</span>
                                                            <span className="text-xs font-black text-emerald-500">{match.oddsTeamB.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 lg:border-l border-white/[0.05] lg:pl-10">
                                            {match.status === 'Upcoming' && (
                                                <button
                                                    onClick={() => updateMatchStatus(match.id, 'Live')}
                                                    className="px-8 py-4 bg-white/5 hover:bg-red-600 text-zinc-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[2px] transition-all active:scale-95 whitespace-nowrap"
                                                >
                                                    Go Live
                                                </button>
                                            )}

                                            {match.status === 'Live' && (
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={() => declareWinner(match, match.teamA)}
                                                        className="px-6 py-4 bg-zinc-900 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        {match.teamA} Won
                                                    </button>
                                                    <button
                                                        onClick={() => declareWinner(match, match.teamB)}
                                                        className="px-6 py-4 bg-zinc-900 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        {match.teamB} Won
                                                    </button>
                                                </div>
                                            )}

                                            {match.status === 'Finished' && (
                                                <div className="flex flex-col items-center bg-emerald-500/5 px-6 py-3 rounded-2xl border border-emerald-500/10 min-w-[140px]">
                                                    <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Victor</span>
                                                    <span className="text-sm font-black italic text-emerald-500 uppercase flex items-center gap-2">
                                                        <Target size={14} />
                                                        {match.winner}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleSixHook(match.id, match.sixInPowerplay)}
                                                    className={`p-4 rounded-2xl transition-all border ${match.sixInPowerplay
                                                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                                        : 'hover:bg-zinc-800 border-white/5 text-zinc-700 hover:text-white'
                                                        }`}
                                                    title="Toggle 2X Six Rule"
                                                >
                                                    <Zap size={20} className={match.sixInPowerplay ? 'fill-amber-500' : ''} />
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm('IRREVERSIBLE: Delete this market permanently?')) {
                                                            await deleteDoc(doc(db, 'matches', match.id));
                                                            toast.success('Market extracted');
                                                        }
                                                    }}
                                                    className="p-4 hover:bg-red-500/10 rounded-2xl text-zinc-700 hover:text-red-500 transition-all"
                                                    title="Delete Market"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {match.sixInPowerplay && (
                                            <div className="absolute top-0 right-0 bg-amber-500 text-black px-6 py-1.5 rounded-bl-[24px] text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
                                                <Zap size={12} className="fill-current" />
                                                2X Payout
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;

