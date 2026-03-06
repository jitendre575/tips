import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, Wallet, Zap, Coins, Star, Heart, Flame, Diamond } from 'lucide-react';
import toast from 'react-hot-toast';

const SlotGame = ({ gameId, onBet, onWin, onLoss }) => {
    const [betAmount, setBetAmount] = useState(100);
    const [isSpinning, setIsSpinning] = useState(false);
    const [reels, setReels] = useState([
        ['💎', '⭐', '❤️'],
        ['🔥', '💎', '⭐'],
        ['⭐', '❤️', '🔥']
    ]);
    const [lastWin, setLastWin] = useState(0);

    const symbols = ['💎', '⭐', '❤️', '🔥', '🍊', '🍇', '🍒', '🔔'];
    const multipliers = {
        '💎': 50,
        '⭐': 20,
        '❤️': 10,
        '🔥': 5,
        '🍊': 3,
        '🍇': 2,
        '🍒': 1.5,
        '🔔': 1.2
    };

    const spin = async () => {
        if (isSpinning) return;

        const success = await onBet(betAmount);
        if (!success) return;

        setIsSpinning(true);
        setLastWin(0);

        // Spin effect
        const spinInterval = setInterval(() => {
            setReels(prev => prev.map(() =>
                Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)])
            ));
        }, 100);

        setTimeout(async () => {
            clearInterval(spinInterval);

            // Final result
            const finalReels = Array(3).fill(null).map(() =>
                Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)])
            );
            setReels(finalReels);
            setIsSpinning(false);

            // Check for wins (Horizontal, Vertical, Diagonals)
            let totalMultiplier = 0;

            // Rows
            for (let i = 0; i < 3; i++) {
                if (finalReels[i][0] === finalReels[i][1] && finalReels[i][1] === finalReels[i][2]) {
                    totalMultiplier += multipliers[finalReels[i][0]];
                }
            }
            // Cols
            for (let i = 0; i < 3; i++) {
                if (finalReels[0][i] === finalReels[1][i] && finalReels[1][i] === finalReels[2][i]) {
                    totalMultiplier += multipliers[finalReels[0][i]];
                }
            }
            // Diagonals
            if (finalReels[0][0] === finalReels[1][1] && finalReels[1][1] === finalReels[2][2]) {
                totalMultiplier += multipliers[finalReels[0][0]];
            }
            if (finalReels[0][2] === finalReels[1][1] && finalReels[1][1] === finalReels[2][0]) {
                totalMultiplier += multipliers[finalReels[0][2]];
            }

            if (totalMultiplier > 0) {
                const winAmount = Math.floor(betAmount * totalMultiplier);
                setLastWin(winAmount);
                await onWin(winAmount);
            } else {
                onLoss(betAmount);
            }
        }, 1500);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 bg-zinc-950/50 border border-white/5 rounded-[40px] p-8 space-y-8 order-2 lg:order-1">
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] italic">Wager Amount</label>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-700">₹</span>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-primary border border-white/5 rounded-[24px] py-6 pl-14 pr-8 text-2xl font-black text-white outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-white/5 text-center">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[4px] block mb-2">Last Win</span>
                        <div className="text-3xl font-black italic text-yellow-500">₹{lastWin}</div>
                    </div>

                    <button
                        onClick={spin}
                        disabled={isSpinning}
                        className="w-full py-6 bg-accent hover:bg-accent-hover text-white rounded-[28px] font-black uppercase italic tracking-[4px] text-xl shadow-2xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isSpinning ? <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <>Spin Reels <RotateCcw size={24} /></>}
                    </button>
                </div>
            </div>

            <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] p-4 sm:p-12 order-1 lg:order-2 shadow-inner">
                <div className="grid grid-cols-3 gap-2 sm:gap-6 bg-zinc-900/50 p-4 sm:p-8 rounded-[32px] border border-white/5">
                    {reels.map((col, i) => (
                        <div key={i} className="space-y-2 sm:space-y-6">
                            {col.map((symbol, j) => (
                                <motion.div
                                    key={`${i}-${j}`}
                                    animate={isSpinning ? { y: [0, 10, 0] } : {}}
                                    transition={{ repeat: Infinity, duration: 0.1 }}
                                    className="aspect-square bg-[#1a2c38] rounded-2xl sm:rounded-[32px] flex items-center justify-center text-3xl sm:text-6xl shadow-xl border border-white/5"
                                >
                                    {symbol}
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SlotGame;
