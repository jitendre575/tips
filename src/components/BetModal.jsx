import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';

const BetModal = ({ match, onClose }) => {
    const { user, userData } = useAuth();
    const [betTeam, setBetTeam] = useState('teamA');
    const [amount, setAmount] = useState(100);
    const [loading, setLoading] = useState(false);

    const handlePlaceBet = async () => {
        if (amount > userData.balance) {
            toast.error('Insufficient balance!');
            return;
        }

        if (amount <= 0) {
            toast.error('Invalid amount!');
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
                sixRewardTriggered: false,
                timestamp: new Date().toISOString()
            };

            // Add bet record
            await addDoc(collection(db, 'bets'), betData);

            // Deduct balance
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                balance: increment(-amount)
            });

            toast.success('Bet placed successfully!');
            onClose();
        } catch (error) {
            toast.error('Failed to place bet: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass border-slate-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                    <div>
                        <h2 className="text-xl font-bold">Place Your Bet</h2>
                        <p className="text-sm text-slate-400">{match.teamA} vs {match.teamB}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Team Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setBetTeam('teamA')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${betTeam === 'teamA'
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                                }`}
                        >
                            <span className="text-xs uppercase font-bold text-slate-500">Back {match.teamA}</span>
                            <span className="text-2xl font-bold">{match.oddsTeamA}</span>
                        </button>
                        <button
                            onClick={() => setBetTeam('teamB')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${betTeam === 'teamB'
                                ? 'border-indigo-500 bg-indigo-500/10'
                                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                                }`}
                        >
                            <span className="text-xs uppercase font-bold text-slate-500">Back {match.teamB}</span>
                            <span className="text-2xl font-bold">{match.oddsTeamB}</span>
                        </button>
                    </div>

                    {/* Amount Selection */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-medium">Wager Amount</span>
                            <span className="flex items-center gap-1 text-slate-400">
                                <Wallet size={14} />
                                Balance: {userData.balance}
                            </span>
                        </div>

                        <div className="relative">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-4 px-6 text-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                {[100, 500, 1000].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        +{val}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Potential Return */}
                    <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Potential Return</span>
                            <span className="text-xl font-bold text-green-400">
                                {(amount * (betTeam === 'teamA' ? match.oddsTeamA : match.oddsTeamB)).toFixed(0)}
                            </span>
                        </div>
                        <div className="flex items-start gap-2 text-[10px] text-slate-400">
                            <AlertCircle size={12} className="mt-0.5 text-blue-400" />
                            <p>If a six is hit in the first 4 overs, your reward might be doubled (Bonus Logic).</p>
                        </div>
                    </div>

                    <button
                        disabled={loading || amount > userData.balance}
                        onClick={handlePlaceBet}
                        className="w-full btn-primary py-4 text-lg shadow-blue-500/10 disabled:grayscale"
                    >
                        {loading ? 'Processing...' : `Confirm Bet on ${betTeam === 'teamA' ? match.teamA : match.teamB}`}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default BetModal;
