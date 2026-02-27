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
                sixRewardApplied: false,
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

    const potentialReturn = (amount * (betTeam === 'teamA' ? match.oddsTeamA : match.oddsTeamB)).toFixed(0);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="glass w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
            >
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

                <div className="p-8 space-y-8">
                    {/* Team Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setBetTeam('teamA')}
                            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${betTeam === 'teamA'
                                ? 'border-red-500 bg-red-500/10'
                                : 'border-white/[0.05] bg-zinc-900/50 hover:border-white/10'
                                }`}
                        >
                            <span className={`text-[10px] font-black uppercase tracking-widest ${betTeam === 'teamA' ? 'text-red-500' : 'text-zinc-500'}`}>Back India</span>
                            <span className="text-3xl font-black italic tracking-tighter">{match.oddsTeamA}</span>
                        </button>
                        <button
                            onClick={() => setBetTeam('teamB')}
                            className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${betTeam === 'teamB'
                                ? 'border-red-500 bg-red-500/10'
                                : 'border-white/[0.05] bg-zinc-900/50 hover:border-white/10'
                                }`}
                        >
                            <span className={`text-[10px] font-black uppercase tracking-widest ${betTeam === 'teamB' ? 'text-red-500' : 'text-zinc-500'}`}>Back Australia</span>
                            <span className="text-3xl font-black italic tracking-tighter">{match.oddsTeamB}</span>
                        </button>
                    </div>

                    {/* Amount Input */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="label-sm !mb-0">Wager Amount</label>
                            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase">
                                <Wallet size={12} className="text-yellow-500" />
                                <span>PISSA {userData.balance?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-zinc-950/50 border border-white/[0.05] rounded-2xl py-5 px-6 text-3xl font-black italic tracking-tighter focus:border-red-500/50 outline-none transition-all group-hover:border-white/10"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1">
                                {[100, 500, 1000].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(Number(amount) + val)}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-red-500 hover:text-white rounded-lg text-[10px] font-black tracking-widest uppercase transition-all"
                                    >
                                        +{val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Payout Summary */}
                    <div className="bg-zinc-950/80 rounded-2xl p-5 border border-white/[0.05] relative overflow-hidden group">
                        <div className="relative z-10 flex justify-between items-center mb-4">
                            <div>
                                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px]">Potential Return</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-3xl font-black italic text-emerald-400 tracking-tighter">
                                        {potentialReturn}
                                    </span>
                                    <span className="text-[10px] font-black text-emerald-400/50 uppercase">Coins</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-[2px]">Multiplier</span>
                                <div className="text-lg font-black italic text-zinc-300 mt-1">x{(betTeam === 'teamA' ? match.oddsTeamA : match.oddsTeamB)}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                            <Zap size={14} className="text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                                <span className="text-amber-500 font-bold uppercase">Boost Condition:</span> If a six is hit in the first 4 overs of the match, your winning amount will be <span className="text-white font-bold">DOUBLED (2X)</span> automatically.
                            </p>
                        </div>

                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-500/10 transition-all duration-700" />
                    </div>

                    <button
                        disabled={loading || amount > userData.balance || amount < 100}
                        onClick={handlePlaceBet}
                        className="w-full btn-red py-5 text-lg disabled:opacity-50 disabled:grayscale transition-all"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Confirm Prediction <TrendingUp size={20} /></>
                        )}
                    </button>

                    {amount > userData.balance && (
                        <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                            Insufficient balance in wallet
                        </p>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default BetModal;
