import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, increment, writeBatch } from 'firebase/firestore';
import { Plus, Trophy, Trash2, Zap, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

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
        winner: null
    });

    useEffect(() => {
        const q = query(collection(db, 'matches'));
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
                createdAt: new Date().toISOString()
            });
            toast.success('Match added!');
            setNewMatch({
                teamA: '',
                teamB: '',
                oddsTeamA: 1.8,
                oddsTeamB: 2.1,
                matchTime: '',
                status: 'Upcoming',
                sixInPowerplay: false,
                winner: null
            });
        } catch (error) {
            toast.error('Error adding match');
        }
    };

    const updateMatchStatus = async (id, status) => {
        await updateDoc(doc(db, 'matches', id), { status });
        toast.success('Status updated');
    };

    const toggleSixTrigger = async (id, current) => {
        await updateDoc(doc(db, 'matches', id), { sixInPowerplay: !current });
        toast.success('Six condition updated');
    };

    const declareWinner = async (match, winnerName) => {
        const batch = writeBatch(db);

        // 1. Update Match
        const matchRef = doc(db, 'matches', match.id);
        batch.update(matchRef, {
            status: 'Finished',
            winner: winnerName
        });

        // 2. Fetch all bets for this match
        const betsQuery = query(collection(db, 'bets'), where('matchId', '==', match.id), where('status', '==', 'pending'));
        const betsSnapshot = await getDocs(betsQuery);

        let processedCount = 0;

        betsSnapshot.forEach((betDoc) => {
            const bet = betDoc.data();
            const betRef = doc(db, 'bets', betDoc.id);
            const userRef = doc(db, 'users', bet.userId);

            if (bet.selectedTeam === winnerName) {
                // WINNER
                let multiplier = match.sixInPowerplay ? 2 : 1;
                const reward = bet.amount * bet.odds * multiplier;

                batch.update(userRef, {
                    balance: increment(reward)
                });
                batch.update(betRef, {
                    status: 'won',
                    payout: reward,
                    sixRewardApplied: match.sixInPowerplay
                });
            } else {
                // LOSER
                batch.update(betRef, { status: 'lost', payout: 0 });
            }
            processedCount++;
        });

        await batch.commit();
        toast.success(`Winner declared! Processed ${processedCount} bets.`);
    };

    const deleteMatch = async (id) => {
        if (window.confirm('Are you sure?')) {
            await deleteDoc(doc(db, 'matches', id));
            toast.success('Match deleted');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
            <div className="flex items-center gap-4">
                <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/20">
                    <Trophy className="text-white" size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-black">Admin Management</h1>
                    <p className="text-slate-400">Control match lifecycle and settle user bets</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Add Match Form */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Plus size={20} className="text-blue-500" />
                            New Match
                        </h2>
                        <form onSubmit={handleAddMatch} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Team A</label>
                                <input
                                    type="text" required
                                    value={newMatch.teamA}
                                    onChange={e => setNewMatch({ ...newMatch, teamA: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. India"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Team B</label>
                                <input
                                    type="text" required
                                    value={newMatch.teamB}
                                    onChange={e => setNewMatch({ ...newMatch, teamB: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g. Australia"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Odds A</label>
                                    <input
                                        type="number" step="0.1" required
                                        value={newMatch.oddsTeamA}
                                        onChange={e => setNewMatch({ ...newMatch, oddsTeamA: Number(e.target.value) })}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Odds B</label>
                                    <input
                                        type="number" step="0.1" required
                                        value={newMatch.oddsTeamB}
                                        onChange={e => setNewMatch({ ...newMatch, oddsTeamB: Number(e.target.value) })}
                                        className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Match Time</label>
                                <input
                                    type="datetime-local" required
                                    value={newMatch.matchTime}
                                    onChange={e => setNewMatch({ ...newMatch, matchTime: e.target.value })}
                                    className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-3 mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <button type="submit" className="w-full btn-primary py-4 font-bold">Create Match</button>
                        </form>
                    </div>
                </div>

                {/* Matches List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Existing Markets</h2>
                        <span className="text-slate-500 text-sm font-medium">{matches.length} matches tracked</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {matches.map(match => (
                            <div key={match.id} className="glass border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${match.status === 'Live' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
                                            }`}>
                                            {match.status}
                                        </span>
                                        <span className="text-xs text-slate-500 font-medium">#{match.id.slice(0, 6)}</span>
                                    </div>
                                    <h3 className="text-lg font-bold">{match.teamA} vs {match.teamB}</h3>
                                    <p className="text-sm text-slate-400">{new Date(match.matchTime).toLocaleString()}</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => updateMatchStatus(match.id, 'Live')}
                                        className="p-2 hover:bg-slate-800 rounded-lg text-red-500 border border-slate-800" title="Set Live"
                                    >
                                        <Clock size={20} />
                                    </button>

                                    <button
                                        onClick={() => toggleSixTrigger(match.id, match.sixInPowerplay)}
                                        className={`p-2 rounded-lg border transition-all ${match.sixInPowerplay
                                                ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                                                : 'border-slate-800 text-slate-500'
                                            }`}
                                        title="Toggle Six Condition (2x logic)"
                                    >
                                        <Zap size={20} className={match.sixInPowerplay ? 'fill-current' : ''} />
                                    </button>

                                    <div className="h-10 w-px bg-slate-800 mx-2 hidden md:block" />

                                    {match.status !== 'Finished' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => declareWinner(match, match.teamA)}
                                                className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-xl border border-green-500/20 font-bold transition-all"
                                            >
                                                {match.teamA} Wins
                                            </button>
                                            <button
                                                onClick={() => declareWinner(match, match.teamB)}
                                                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl border border-blue-500/20 font-bold transition-all"
                                            >
                                                {match.teamB} Wins
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => deleteMatch(match.id)}
                                        className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all ml-4"
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
