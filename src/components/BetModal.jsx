import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertCircle, Zap, TrendingUp, ChevronRight } from 'lucide-react';
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
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 100 }}
                className="w-full max-w-lg rounded-[6px] sm:rounded-[6px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-t border-white/10 max-h-[90vh] flex flex-col relative bg-[#111827]"
            >
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-[6px] blur-[80px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/20 rounded-[6px] blur-[80px] -ml-32 -mb-32 pointer-events-none" />
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />

                <div className="overflow-y-auto flex-1 scrollbar-hide relative z-10">
                    <div className="p-6 border-b border-white/[0.08] flex justify-between items-center bg-white/[0.02] backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="p-3 mb-1 bg-gradient-to-br from-accent to-blue-600 rounded-[6px] text-white shadow-lg shadow-accent/20 border border-white/10">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white drop-shadow-md">
                                    Place <span className="text-accent underline decoration-accent/30 decoration-4">Market</span>
                                </h2>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{match.teamA} VS {match.teamB}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[6px] transition-all text-slate-400 hover:text-white active:scale-95 shadow-lg">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 backdrop-blur-sm">
                        
                        {/* Team Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                { id: 'teamA', name: match.teamA, odds: match.oddsTeamA, color: 'from-indigo-500/10 to-blue-500/10', border: 'hover:border-blue-500/50', activeColor: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/25' },
                                { id: 'teamB', name: match.teamB, odds: match.oddsTeamB, color: 'from-rose-500/10 to-red-500/10', border: 'hover:border-red-500/50', activeColor: 'from-red-600 to-rose-600', shadow: 'shadow-red-500/25' }
                            ].map((team) => (
                                <button
                                    key={team.id}
                                    onClick={() => setBetTeam(team.id)}
                                    className={`p-5 sm:p-6 rounded-[6px] border-2 transition-all duration-300 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 relative overflow-hidden group/btn 
                                        ${betTeam === team.id
                                            ? `border-transparent bg-gradient-to-br ${team.activeColor} shadow-xl ${team.shadow} scale-[1.02]`
                                            : `border-white/10 bg-gradient-to-br ${team.color} ${team.border}`
                                        }`}
                                >
                                    <div className="flex flex-col items-start sm:items-center min-w-0 z-10">
                                        <span className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[3px] mb-1 ${betTeam === team.id ? 'text-white/80' : 'text-slate-400'}`}>
                                            Predict Winner
                                        </span>
                                        <span className={`text-xl sm:text-3xl font-black italic tracking-tighter truncate max-w-full drop-shadow-lg ${betTeam === team.id ? 'text-white' : 'text-slate-200'}`}>
                                            {team.name}
                                        </span>
                                    </div>
                                    <div className={`px-4 py-2 rounded-[6px] shrink-0 border ${betTeam === team.id ? 'bg-black/20 border-black/10' : 'bg-white/5 border-white/10 group-hover/btn:bg-white/10'}`}>
                                        <span className={`font-black text-sm sm:text-xl italic leading-none ${betTeam === team.id ? 'text-white' : 'text-slate-300'}`}>
                                            {team.odds}
                                        </span>
                                    </div>
                                    
                                    {/* Active Glow */}
                                    {betTeam === team.id && (
                                        <div className="absolute inset-0 bg-white/20 blur-xl opacity-50 mix-blend-overlay pointer-events-none" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Amount Input */}
                        <div className="bg-white/[0.03] border border-white/[0.08] p-5 sm:p-6 rounded-[6px] shadow-inner space-y-5 relative overflow-hidden group">
                            <div className="flex justify-between items-end px-1 relative z-10">
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[2px] leading-none mb-1 block">Wager Amount</label>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400/80">
                                        <TrendingUp size={12} /> Minimum 100
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-[6px] border border-white/10 shadow-xl backdrop-blur-md">
                                    <Wallet size={14} className="text-yellow-500" />
                                    <span className="text-[11px] font-black text-white italic tracking-[1px]">BAL: {(userData.balance || 0).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                        <span className="text-3xl font-black text-slate-500 italic">₹</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border-2 border-white/10 rounded-[6px] py-5 pl-14 pr-6 text-3xl font-black italic tracking-tighter text-white focus:border-accent focus:bg-white/5 focus:ring-4 focus:ring-accent/20 outline-none transition-all shadow-inner"
                                        placeholder="0"
                                    />
                                </div>

                                <div className="flex gap-2 sm:gap-3">
                                    {[100, 500, 1000, 5000].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setAmount(Number(amount || 0) + val)}
                                            className="flex-1 py-3 sm:py-3.5 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 hover:border-white/20 rounded-[6px] text-[10px] sm:text-[11px] font-black tracking-widest uppercase text-slate-300 hover:text-white transition-all shadow-sm"
                                        >
                                            +{val}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Payout Summary */}
                        <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[6px] p-6 border border-white/10 relative overflow-hidden shadow-2xl">
                            {/* Glow behind summary */}
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 blur-[60px] rounded-[6px] pointer-events-none" />
                            
                            <div className="relative z-10 flex justify-between items-end mb-6">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-[3px] leading-none mb-2 block">Potential Return</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl sm:text-5xl font-black italic text-emerald-400 tracking-tighter leading-none drop-shadow-md">
                                            ₹ {potentialReturn}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right bg-white/5 px-4 py-2 rounded-[6px] border border-white/10 backdrop-blur-md">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-[2px] leading-none mb-1 block">Multiplier</span>
                                    <div className="text-xl font-black italic text-white leading-none text-center">x{(betTeam === 'teamA' ? match.oddsTeamA : match.oddsTeamB)}</div>
                                </div>
                            </div>

                            {match.sixInPowerplay && (
                                <div className="flex items-start gap-3 sm:gap-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-5 rounded-[6px] border border-amber-500/20 shadow-inner mt-2">
                                    <div className="bg-amber-500 p-2 rounded-[6px] text-black shrink-0 shadow-lg shadow-amber-500/30 animate-pulse">
                                        <Zap size={20} className="fill-current" />
                                    </div>
                                    <div className="space-y-1 mt-0.5">
                                        <div className="text-[11px] uppercase tracking-widest font-black text-amber-500 flex items-center gap-2">
                                            <span>Active Offer</span>
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-[6px] animate-pulse blur-[1px]"></span>
                                        </div>
                                        <p className="text-[12px] sm:text-sm text-slate-300 font-bold leading-relaxed">
                                            First 3 Overs 6 hit = <span className="text-white bg-amber-500/20 px-2 py-0.5 rounded-[6px] italic">DOUBLE (2X)</span> Winnings
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit CTA */}
                        <div className="pt-2">
                            <button
                                disabled={loading || amount > (userData.balance || 0) || amount < 100}
                                onClick={handlePlaceBet}
                                className="w-full bg-gradient-to-r from-accent via-blue-600 to-indigo-600 hover:from-accent-hover hover:via-blue-700 hover:to-indigo-700 text-white py-6 sm:py-7 rounded-[6px] font-black italic uppercase tracking-[4px] text-xl sm:text-2xl shadow-2xl shadow-accent/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 relative overflow-hidden group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                {/* Button glare effect */}
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-[6px] pointer-events-none" />
                                
                                {loading ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-[6px] animate-spin" />
                                        <span>Processing</span>
                                    </div>
                                ) : (
                                    <>
                                        Confirm Stake 
                                        <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform drop-shadow-md" />
                                    </>
                                )}
                            </button>
                            
                            {/* Validation Messages */}
                            {amount > (userData.balance || 0) ? (
                                <p className="text-center mt-4 text-[11px] font-black text-rose-500 uppercase tracking-[2px] animate-pulse flex items-center justify-center gap-2 bg-rose-500/10 py-2 rounded-[6px] border border-rose-500/20">
                                    <AlertCircle size={14} /> Insufficient Balance. Please Recharge.
                                </p>
                            ) : amount > 0 && amount < 100 ? (
                                <p className="text-center mt-4 text-[11px] font-black text-amber-500 uppercase tracking-[2px] flex items-center justify-center gap-2 bg-amber-500/10 py-2 rounded-[6px] border border-amber-500/20">
                                    Minimum Wager is 100 Coins
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default BetModal;
