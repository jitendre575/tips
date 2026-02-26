import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, increment, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Plus, Trophy, Trash2, Zap, Clock, Calendar, TrendingUp, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const AdminPanel = () => {
    const [matches, setMatches] = useState([]);
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
            toast.success('New market created!');
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
        await updateDoc(doc(db, 'matches', id), { status });
        toast.success(`Match is now ${status}`);
    };

    const declareWinner = async (match, winnerName) => {
        const batch = writeBatch(db);
        const matchRef = doc(db, 'matches', match.id);

        batch.update(matchRef, {
            status: 'Finished',
            winner: winnerName
        });

        const betsQuery = query(collection(db, 'bets'), where('matchId', '==', match.id), where('status', '==', 'pending'));
        const betsSnapshot = await getDocs(betsQuery);

        betsSnapshot.forEach((betDoc) => {
            const bet = betDoc.data();
            const betRef = doc(db, 'bets', betDoc.id);
            const userRef = doc(db, 'users', bet.userId);

            if (bet.selectedTeam === winnerName) {
                const multiplier = match.sixInPowerplay ? 2 : 1;
                const reward = bet.amount * bet.odds * multiplier;
                batch.update(userRef, { balance: increment(reward) });
                batch.update(betRef, { status: 'won', payout: reward, sixRewardApplied: match.sixInPowerplay });
            } else {
                batch.update(betRef, { status: 'lost', payout: 0 });
            }
        });

        await batch.commit();
        toast.success(`Winner declared! Bets settled.`);
    };

    return (
        <div className="space-y-10">
            <div className="flex items-center gap-4">
                <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/20 text-red-500">
                    <ShieldCheck size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">Market <span className="logo-red">Management</span></h1>
                    <p className="text-zinc-500 font-medium">Create and manage betting markets for live matches</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Form */}
                <div className="lg:col-span-1">
                    <div className="glass-card p-8">
                        <h2 className="text-xl font-bold uppercase italic tracking-tighter mb-8 flex items-center gap-2">
                            <Plus size={20} className="text-red-500" /> Create New Market
                        </h2>
                        <form onSubmit={handleAddMatch} className="space-y-6">
                            <div className="space-y-2">
                                <label className="label-sm">Team A (Host)</label>
                                <input
                                    type="text" required
                                    value={newMatch.teamA}
                                    onChange={e => setNewMatch({ ...newMatch, teamA: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g. India"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="label-sm">Team B (Visitor)</label>
                                <input
                                    type="text" required
                                    value={newMatch.teamB}
                                    onChange={e => setNewMatch({ ...newMatch, teamB: e.target.value })}
                                    className="input-field"
                                    placeholder="e.g. Australia"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="label-sm">Odds Team A</label>
                                    <input
                                        type="number" step="0.1" required
                                        value={newMatch.oddsTeamA}
                                        onChange={e => setNewMatch({ ...newMatch, oddsTeamA: Number(e.target.value) })}
                                        className="input-field"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="label-sm">Odds Team B</label>
                                    <input
                                        type="number" step="0.1" required
                                        value={newMatch.oddsTeamB}
                                        onChange={e => setNewMatch({ ...newMatch, oddsTeamB: Number(e.target.value) })}
                                        className="input-field"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="label-sm">Match Start Time</label>
                                <input
                                    type="datetime-local" required
                                    value={newMatch.matchTime}
                                    onChange={e => setNewMatch({ ...newMatch, matchTime: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-2xl border border-white/5">
                                <input
                                    type="checkbox"
                                    id="sixBonus"
                                    checked={newMatch.sixInPowerplay}
                                    onChange={e => setNewMatch({ ...newMatch, sixInPowerplay: e.target.checked })}
                                    className="w-5 h-5 accent-red-500"
                                />
                                <label htmlFor="sixBonus" className="text-xs font-bold text-zinc-400 select-none">
                                    Enable 2X Bonus logic (Six in 4 overs)
                                </label>
                            </div>

                            <button type="submit" className="w-full btn-red py-4">Initialize Market</button>
                        </form>
                    </div>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold uppercase italic tracking-tighter">Active <span className="logo-red">Markets</span></h2>
                        <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">{matches.length} Total</span>
                    </div>

                    <div className="space-y-4">
                        {matches.map(match => (
                            <div key={match.id} className="glass-card flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.02]">
                                <div className="flex items-center gap-6 flex-1">
                                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 ${match.status === 'Live' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-zinc-900 text-zinc-500'
                                        }`}>
                                        <Trophy size={20} />
                                        <span className="text-[8px] font-black uppercase mt-1 tracking-widest">{match.status}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase mb-1">
                                            {match.teamA} <span className="text-zinc-600 font-medium tracking-normal lowercase not-italic">vs</span> {match.teamB}
                                        </h3>
                                        <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-bold uppercase">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} /> {new Date(match.matchTime).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1 border-l border-white/5 pl-3">
                                                <Clock size={12} /> {new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {match.sixInPowerplay && (
                                                <div className="flex items-center gap-1 border-l border-white/5 pl-3 text-amber-500">
                                                    <Zap size={12} className="fill-current" /> 2X ACTIVE
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 border-l border-white/[0.05] pl-6 h-12">
                                    {match.status !== 'Finished' ? (
                                        <>
                                            {match.status === 'Upcoming' && (
                                                <button
                                                    onClick={() => updateMatchStatus(match.id, 'Live')}
                                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Set Live
                                                </button>
                                            )}
                                            {match.status === 'Live' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => declareWinner(match, match.teamA)}
                                                        className="px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        {match.teamA} Won
                                                    </button>
                                                    <button
                                                        onClick={() => declareWinner(match, match.teamB)}
                                                        className="px-4 py-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                                    >
                                                        {match.teamB} Won
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-black text-zinc-600 uppercase">Winner</span>
                                            <span className="text-sm font-black italic text-emerald-400 uppercase">{match.winner}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Delete this market?')) {
                                                await deleteDoc(doc(db, 'matches', match.id));
                                                toast.success('Market deleted');
                                            }
                                        }}
                                        className="p-3 hover:bg-white/5 rounded-xl text-zinc-600 hover:text-red-500 transition-all ml-2"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
