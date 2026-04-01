import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, where, increment, writeBatch, serverTimestamp, orderBy } from 'firebase/firestore';
import { Plus, Trophy, Trash2, Zap, Clock, Calendar, TrendingUp, ShieldCheck, Sword, Target, Activity, AlertCircle, CheckCircle2, XCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const AdminPanel = () => {
    const { userData } = useAuth();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMatch, setNewMatch] = useState({
        teamA: '',
        teamB: '',
        teamALogo: '',
        teamBLogo: '',
        oddsTeamA: 1.8,
        oddsTeamB: 2.1,
        matchTime: '',
        status: 'Upcoming',
        sixInPowerplay: false,
    });

    useEffect(() => {
        if (!userData?.isAdmin) return;
        const q = query(collection(db, 'matches'), orderBy('matchTime', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allMatches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filter matches that are more than 5 hours old locally
            const currentTime = new Date().getTime();
            const fiveHoursInMs = 5 * 60 * 60 * 1000;
            
            const validMatches = allMatches.filter(match => {
                const matchTimeMs = new Date(match.matchTime).getTime();
                return (currentTime - matchTimeMs) < fiveHoursInMs;
            });

            setMatches(validMatches);
            setLoading(false);

            // Cleanup: Automatically delete expired matches from Firestore
            allMatches.forEach(async (match) => {
                const matchTimeMs = new Date(match.matchTime).getTime();
                if ((currentTime - matchTimeMs) >= fiveHoursInMs) {
                    try {
                        await deleteDoc(doc(db, 'matches', match.id));
                    } catch (e) { console.error("Auto-delete failed", e); }
                }
            });
        }, (error) => {
            console.error("Snapshot error:", error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userData?.isAdmin]);

    const handleFileUpload = async (file, type, matchId = null) => {
        if (!file) return;
        const loading = toast.loading(`Uploading logo...`);
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const fileRef = ref(storage, `logos/${fileName}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            
            if (matchId) {
                // Update existing match
                await updateDoc(doc(db, 'matches', matchId), { [type]: url });
                toast.success('Logo updated successfully!', { id: loading });
            } else {
                // Update new match state
                setNewMatch(prev => ({ ...prev, [type]: url }));
                toast.success('Logo ready for market initialization', { id: loading });
            }
        } catch (error) {
            console.error(error);
            toast.error('Upload failed: ' + error.message, { id: loading });
        }
    };

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
                teamALogo: '',
                teamBLogo: '',
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
        const settleToast = toast.loading('Settling bets and declaring winner...');
        try {
            const batch = writeBatch(db);
            const matchRef = doc(db, 'matches', match.id);

            // Fetch all bets for this match
            const betsQuery = query(collection(db, 'bets'), where('matchId', '==', match.id));
            const betsSnapshot = await getDocs(betsQuery);

            let winnersCount = 0;
            betsSnapshot.forEach((betDoc) => {
                const bet = betDoc.data();
                if (bet.status !== 'pending') return;

                const betRef = doc(db, 'bets', betDoc.id);
                const userRef = doc(db, 'users', bet.userId);

                if (bet.selectedTeam === winnerName) {
                    const multiplier = match.sixInPowerplay ? 2 : 1;
                    const reward = bet.amount * bet.odds * multiplier;
                    const balanceField = bet.currency === 'USDT' ? 'usdtBalance' : 'inrBalance';
                    batch.update(userRef, {
                        [balanceField]: increment(reward),
                        balance: increment(reward), // Legacy sync
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
            // Delete the match after settlement so it disappears immediately
            await deleteDoc(matchRef);
            toast.success(`${match.teamA} vs ${match.teamB} settled and removed.`, { id: settleToast });
        } catch (error) {
            console.error('Declaration error:', error);
            toast.error('Failed to settle bets', { id: settleToast });
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-accent/10 rounded-[6px] border border-accent/20 flex items-center justify-center text-accent shadow-2xl">
                        <ShieldCheck size={40} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Activity className="text-accent" size={14} />
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Global Operations</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Market <span className="logo-accent">Control</span>
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium mt-2">Manage live trading markets and settle winning brackets.</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-[6px] border border-white/5">
                    <button
                        onClick={async () => {
                            const loading = toast.loading('Seeding IPL Schedule...');
                            try {
                                const iplMatches = [
                                    { teamA: 'Sunrisers Hyderabad', teamB: 'Royal Challengers Bengaluru', matchTime: '2026-03-28T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                                    { teamA: 'Kolkata Knight Riders', teamB: 'Mumbai Indians', matchTime: '2026-03-29T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                                    { teamA: 'Chennai Super Kings', teamB: 'Rajasthan Royals', matchTime: '2026-03-30T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                                    { teamA: 'Gujarat Titans', teamB: 'Punjab Kings', matchTime: '2026-03-31T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                                    { teamA: 'Delhi Capitals', teamB: 'Lucknow Super Giants', matchTime: '2026-04-01T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                                    { teamA: 'Sunrisers Hyderabad', teamB: 'Kolkata Knight Riders', matchTime: '2026-04-02T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                                    { teamA: 'Punjab Kings', teamB: 'Chennai Super Kings', matchTime: '2026-04-03T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                                    { teamA: 'Mumbai Indians', teamB: 'Delhi Capitals', matchTime: '2026-04-04T15:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                                    { teamA: 'Rajasthan Royals', teamB: 'Gujarat Titans', matchTime: '2026-04-04T19:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true },
                                    { teamA: 'Lucknow Super Giants', teamB: 'Sunrisers Hyderabad', matchTime: '2026-04-05T15:30', oddsTeamA: 1.9, oddsTeamB: 1.9, status: 'Upcoming', sixInPowerplay: true }
                                ];

                                const batch = iplMatches.map(m => addDoc(collection(db, 'matches'), { ...m, createdAt: serverTimestamp() }));
                                await Promise.all(batch);
                                toast.success('IPL Schedule Seeded Successfully!', { id: loading });
                            } catch (e) {
                                toast.error('Seeding failed: ' + e.message, { id: loading });
                            }
                        }}
                        className="px-6 py-3 bg-accent/20 hover:bg-accent/30 text-accent rounded-[6px] border border-accent/20 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Zap size={14} className="fill-current" /> Seed Schedule
                    </button>
                    <div className="px-6 py-3 bg-zinc-900 rounded-[6px] flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Live Markets</span>
                        <span className="text-xl font-black text-accent italic">{matches.filter(m => m.status === 'Live').length}</span>
                    </div>
                    <div className="px-6 py-3 bg-zinc-900 rounded-[6px] flex flex-col items-center">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Upcoming</span>
                        <span className="text-xl font-black text-white italic">{matches.filter(m => m.status === 'Upcoming').length}</span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Creation Form */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-slate-900 border border-white/[0.05] rounded-[6px] p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                            <Plus size={120} />
                        </div>

                        <div className="relative space-y-10">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Initialize <span className="logo-accent">Market</span></h3>
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
                                            className="w-full bg-zinc-900/50 border border-white/5 rounded-[6px] py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-accent/30 transition-all"
                                            placeholder="INDIA"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Team B (Away)</label>
                                        <input
                                            type="text" required
                                            value={newMatch.teamB}
                                            onChange={e => setNewMatch({ ...newMatch, teamB: e.target.value })}
                                            className="w-full bg-zinc-900/50 border border-white/5 rounded-[6px] py-4 px-6 text-sm font-bold text-white focus:outline-none focus:border-accent/30 transition-all"
                                            placeholder="AUSTRALIA"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Team A Logo</label>
                                        <div className="flex items-center gap-3">
                                            <label className="flex-1 flex items-center justify-center gap-3 bg-zinc-900/50 border border-white/5 hover:border-accent/30 rounded-[6px] py-4 px-6 cursor-pointer transition-all group overflow-hidden relative">
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e.target.files[0], 'teamALogo')}
                                                    className="hidden" 
                                                />
                                                {newMatch.teamALogo ? (
                                                    <img src={newMatch.teamALogo} className="w-6 h-6 object-contain" alt="A" />
                                                ) : (
                                                    <Upload size={16} className="text-zinc-600 group-hover:text-accent transition-colors" />
                                                )}
                                                <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white transition-colors truncate">
                                                    {newMatch.teamALogo ? 'Change Logo' : 'Upload Team A'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Team B Logo</label>
                                        <div className="flex items-center gap-3">
                                            <label className="flex-1 flex items-center justify-center gap-3 bg-zinc-900/50 border border-white/5 hover:border-accent/30 rounded-[6px] py-4 px-6 cursor-pointer transition-all group overflow-hidden relative">
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e.target.files[0], 'teamBLogo')}
                                                    className="hidden" 
                                                />
                                                {newMatch.teamBLogo ? (
                                                    <img src={newMatch.teamBLogo} className="w-6 h-6 object-contain" alt="B" />
                                                ) : (
                                                    <Upload size={16} className="text-zinc-600 group-hover:text-accent transition-colors" />
                                                )}
                                                <span className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white transition-colors truncate">
                                                    {newMatch.teamBLogo ? 'Change Logo' : 'Upload Team B'}
                                                </span>
                                            </label>
                                        </div>
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
                                                className="w-full bg-zinc-900/50 border border-white/5 rounded-[6px] py-4 pl-14 pr-6 text-sm font-black text-white focus:outline-none focus:border-accent/30 transition-all"
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
                                                className="w-full bg-zinc-900/50 border border-white/5 rounded-[6px] py-4 pl-14 pr-6 text-sm font-black text-white focus:outline-none focus:border-accent/30 transition-all"
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
                                            className="w-full bg-zinc-900/50 border border-white/5 rounded-[6px] py-4 pl-14 pr-6 text-sm font-bold text-white focus:outline-none focus:border-accent/30 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-[6px] flex items-center justify-between group/bonus hover:bg-zinc-900 transition-all">
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
                                        <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-[6px] peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-[6px] after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-5 bg-accent hover:bg-accent-hover text-white rounded-[6px] font-black uppercase italic tracking-[4px] transition-all shadow-2xl shadow-accent/20 active:scale-95"
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
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Active <span className="logo-accent">Markets</span></h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest bg-zinc-900 px-4 py-1.5 rounded-[6px] border border-white/5">
                                {matches.length} Total
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {loading ? (
                            [1, 2, 3].map(n => (
                                <div key={n} className="h-40 bg-zinc-900/50 rounded-[6px] animate-pulse border border-white/5" />
                            ))
                        ) : matches.length === 0 ? (
                            <div className="bg-zinc-900/20 border-2 border-dashed border-white/5 rounded-[6px] p-24 text-center">
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
                                        className="bg-slate-900 border border-white/5 rounded-[6px] p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10 hover:border-white/10 transition-all shadow-2xl overflow-hidden relative"
                                    >
                                        <div className="flex items-center gap-8 flex-1">
                                            <div className="relative">
                                                <div className={`w-20 h-20 rounded-[6px] flex flex-col items-center justify-center shrink-0 border transition-all duration-500 ${match.status === 'Live' ? 'bg-accent/10 text-accent border-accent/30 animate-pulse' :
                                                    match.status === 'Finished' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                                                        'bg-zinc-900 text-zinc-600 border-white/5'
                                                    }`}>
                                                    <Trophy size={24} />
                                                    <span className="text-[8px] font-black uppercase mt-1.5 tracking-widest">{match.status}</span>
                                                </div>
                                                {match.status === 'Live' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent border-4 border-surface rounded-[6px]" />}
                                            </div>

                                            <div className="space-y-3">
                                                <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
                                                    {match.teamA} <span className="text-zinc-700 text-xl mx-2 lowercase not-italic">vs</span> {match.teamB}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-4">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[8px] font-black text-zinc-600 uppercase">A-Logo</span>
                                                        <label className="bg-black/40 border border-white/5 rounded-[6px] px-3 py-1 text-[9px] text-zinc-400 hover:text-white hover:border-accent/30 transition-all cursor-pointer flex items-center gap-2">
                                                            <input 
                                                                type="file" 
                                                                accept="image/*"
                                                                onChange={(e) => handleFileUpload(e.target.files[0], 'teamALogo', match.id)}
                                                                className="hidden" 
                                                            />
                                                            <Upload size={10} />
                                                            <span>UPLOAD</span>
                                                            {match.teamALogo && <CheckCircle2 size={10} className="text-emerald-500" />}
                                                        </label>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[8px] font-black text-zinc-600 uppercase">B-Logo</span>
                                                        <label className="bg-black/40 border border-white/5 rounded-[6px] px-3 py-1 text-[9px] text-zinc-400 hover:text-white hover:border-accent/30 transition-all cursor-pointer flex items-center gap-2">
                                                            <input 
                                                                type="file" 
                                                                accept="image/*"
                                                                onChange={(e) => handleFileUpload(e.target.files[0], 'teamBLogo', match.id)}
                                                                className="hidden" 
                                                            />
                                                            <Upload size={10} />
                                                            <span>UPLOAD</span>
                                                            {match.teamBLogo && <CheckCircle2 size={10} className="text-emerald-500" />}
                                                        </label>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-[6px] border border-white/5">
                                                        <Calendar size={12} className="text-accent" />
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                            {new Date(match.matchTime).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-[6px] border border-white/5">
                                                        <Clock size={12} className="text-accent" />
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                            {new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 bg-emerald-500/5 px-4 py-1.5 rounded-[6px] border border-emerald-500/10">
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
                                                    className="px-8 py-4 bg-white/5 hover:bg-accent text-zinc-400 hover:text-white rounded-[6px] text-[10px] font-black uppercase tracking-[2px] transition-all active:scale-95 whitespace-nowrap"
                                                >
                                                    Go Live
                                                </button>
                                            )}

                                            {match.status === 'Live' && (
                                                <div className="flex flex-col sm:flex-row gap-3">
                                                    <button
                                                        onClick={() => declareWinner(match, match.teamA)}
                                                        className="px-6 py-4 bg-zinc-900 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-500 hover:text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        {match.teamA} Won
                                                    </button>
                                                    <button
                                                        onClick={() => declareWinner(match, match.teamB)}
                                                        className="px-6 py-4 bg-zinc-900 hover:bg-emerald-500 border border-emerald-500/20 text-emerald-500 hover:text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        {match.teamB} Won
                                                    </button>
                                                </div>
                                            )}

                                            {match.status === 'Finished' && (
                                                <div className="flex flex-col items-center bg-emerald-500/5 px-6 py-3 rounded-[6px] border border-emerald-500/10 min-w-[140px]">
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
                                                    className={`p-4 rounded-[6px] transition-all border ${match.sixInPowerplay
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
                                                    className="p-4 hover:bg-accent/10 rounded-[6px] text-zinc-700 hover:text-accent transition-all"
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

