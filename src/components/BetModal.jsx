import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

const BetModal = ({ match, onClose }) => {
    const { user, userData } = useAuth();
    const [betTeam, setBetTeam] = useState('teamA');
    const [amount, setAmount] = useState(500);
    const [loading, setLoading] = useState(false);

    const handlePlaceBet = async () => {
        if (amount > userData.balance) {
            toast.error('Insufficient balance!');
            return;
        }

        if (amount < 100) {
            toast.error('Minimum bet is 100 Coins');
            return;
        }

        setLoading(true);
        try {
            const betData = {
                userId: user.uid,
                userEmail: user.email,
                matchId: match.id,
                teamA: match.teamA,
                teamB: match.teamB,
                selectedTeam: betTeam === 'teamA' ? match.teamA : match.teamB,
                odds: betTeam === 'teamA' ? match.oddsTeamA : match.oddsTeamB,
                amount: Number(amount),
                status: 'pending',
                sixRewardAppliedAtBet: match.sixInPowerplay || false,
                timestamp: serverTimestamp()
            };

            // Add bet record
            await addDoc(collection(db, 'bets'), betData);

            // Update user balance and total bets count
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                balance: increment(-amount),
                totalBets: increment(1)
            });

            toast.success('Bet placed successfully!');
            onClose();
        } catch (error) {
            toast.error('Failed to place bet');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const multiplier = match.sixInPowerplay ? 2 : 1;
    const potentialReturn = (amount * (betTeam === 'teamA' ? match.oddsTeamA : match.oddsTeamB) * multiplier).toFixed(0);

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 100 }}
                className="glass w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl border-t sm:border border-white/10 max-h-[90vh] flex flex-col"
            >
                <div className="overflow-y-auto flex-1 scrollbar-hide">
                    <div className="p-6 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-xl text-red-500">
                                <TrendingUp size={20} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic tracking-tighter uppercase">Place <span className="logo-red">Market</span></h2>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{match.teamA} VS {match.teamB}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                        {/* Team Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <button
                                onClick={() => setBetTeam('teamA')}
                                className={`p-4 sm:p-6 rounded-[24px] border-2 transition-all flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 sm:gap-2 relative overflow-hidden group/btn ${betTeam === 'teamA'
                                    ? 'border-red-600 bg-red-600/10 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                                    : 'border-white/[0.05] bg-zinc-900/50 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex flex-col items-start sm:items-center min-w-0">
                                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[2px] ${betTeam === 'teamA' ? 'text-red-500' : 'text-zinc-500'}`}>Back {match.teamA}</span>
                                    <span className="text-xl sm:text-4xl font-black italic tracking-tighter text-white truncate max-w-full">{match.teamA}</span>
                                </div>
                                <div className="bg-yellow-500 px-3 py-1 rounded-lg shrink-0">
                                    <span className="text-black font-black text-xs sm:text-lg italic leading-none">{match.oddsTeamA}</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setBetTeam('teamB')}
                                className={`p-4 sm:p-6 rounded-[24px] border-2 transition-all flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 sm:gap-2 relative overflow-hidden group/btn ${betTeam === 'teamB'
                                    ? 'border-red-600 bg-red-600/10 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                                    : 'border-white/[0.05] bg-zinc-900/50 hover:border-white/20'
                                    }`}
                            >
                                <div className="flex flex-col items-start sm:items-center min-w-0">
                                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[2px] ${betTeam === 'teamB' ? 'text-red-500' : 'text-zinc-500'}`}>Back {match.teamB}</span>
                                    <span className="text-xl sm:text-4xl font-black italic tracking-tighter text-white truncate max-w-full">{match.teamB}</span>
                                </div>
                                <div className="bg-yellow-500 px-3 py-1 rounded-lg shrink-0">
                                    <span className="text-black font-black text-xs sm:text-lg italic leading-none">{match.oddsTeamB}</span>
                                </div>
                            </button>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Wager Amount</label>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-white/5 shadow-xl">
                                    <Wallet size={12} className="text-yellow-500" />
                                    <span className="text-[10px] font-black text-white italic tracking-tighter">COINS {userData.balance?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="relative group">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-700">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-[#121212] border border-white/5 rounded-[24px] py-6 pl-12 pr-6 text-4xl font-black italic tracking-tighter text-white focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 outline-none transition-all"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    {[100, 500, 1000, 5000].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(Number(amount) + val)}
                                            className="flex-1 py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-white/20 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all active:scale-95"
                                        >
                                            +{val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Payout Summary */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[32px] p-6 border border-white/5 relative overflow-hidden">
                            <div className="relative z-10 flex justify-between items-end mb-6">
                                <div>
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[3px] leading-none">Potential return</span>
                                    <div className="flex items-baseline gap-2 mt-2">
                                        <span className="text-4xl sm:text-5xl font-black italic text-emerald-500 tracking-tighter leading-none">
                                            {potentialReturn}
                                        </span>
                                        <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">Coins</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[3px] leading-none">Multiplier</span>
                                    <div className="text-2xl font-black italic text-white mt-2 leading-none">x{(betTeam === 'teamA' ? match.oddsTeamA : match.oddsTeamB)}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
                                <Zap size={18} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                <div className="space-y-1">
                                    <p className="text-[11px] text-zinc-400 font-bold leading-relaxed uppercase tracking-tight">
                                        <span className="text-yellow-500 font-black">BOOST CONDITION:</span> If a six is hit in the first 4 overs, winnings are <span className="text-white">DOUBLED (2X)</span>.
                                    </p>
                                    {match.sixInPowerplay && (
                                        <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded uppercase tracking-widest animate-bounce">
                                            Condition Met: 2X Active
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            disabled={loading || amount > userData.balance || amount < 100}
                            onClick={handlePlaceBet}
                            className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-[28px] font-black italic uppercase tracking-[4px] text-2xl shadow-2xl shadow-red-600/40 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:grayscale disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>Confirm <TrendingUp size={24} className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>

                        {amount > userData.balance && (
                            <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                                Insufficient balance in wallet
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BetModal;
