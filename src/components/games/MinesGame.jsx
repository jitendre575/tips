import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Gem, Coins, RotateCcw, Play, Wallet, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const MinesGame = ({ onBet, onWin, onLoss }) => {
    const [betAmount, setBetAmount] = useState(100);
    const [mineCount, setMineCount] = useState(3);
    const [gameState, setGameState] = useState('idle'); // idle, playing, over
    const [grid, setGrid] = useState(Array(25).fill(null));
    const [mines, setMines] = useState([]);
    const [revealed, setRevealed] = useState([]);
    const [payout, setPayout] = useState(0);
    const [houseEdge] = useState(0.01); // 1%

    // Calculate multiplier based on revealed tiles and mines
    const calculateMultiplier = (revealedCount) => {
        if (revealedCount === 0) return 0;

        let probability = 1.0;
        for (let i = 0; i < revealedCount; i++) {
            probability *= (25 - mineCount - i) / (25 - i);
        }

        const multiplier = (1 / probability) * (1 - houseEdge);
        return multiplier.toFixed(2);
    };

    const startGame = async () => {
        if (gameState === 'playing') return;

        const success = await onBet(betAmount);
        if (!success) return;

        // Generate random mine positions
        const minePositions = [];
        while (minePositions.length < mineCount) {
            const pos = Math.floor(Math.random() * 25);
            if (!minePositions.includes(pos)) {
                minePositions.push(pos);
            }
        }

        setMines(minePositions);
        setGrid(Array(25).fill(null));
        setRevealed([]);
        setGameState('playing');
        setPayout(0);
        toast.success('Game Started! Good Luck.', { icon: '🚀' });
    };

    const revealTile = (index) => {
        if (gameState !== 'playing' || revealed.includes(index)) return;

        const newRevealed = [...revealed, index];
        setRevealed(newRevealed);

        if (mines.includes(index)) {
            // HIT A BOMB!
            setGameState('over');
            setPayout(0);
            onLoss(betAmount);
            toast.error('KABOOM! You hit a mine.', { icon: '💥' });
        } else {
            // HIT A GEM!
            const multiplier = calculateMultiplier(newRevealed.length);
            setPayout((betAmount * multiplier).toFixed(2));

            // Audio effect or micro-animation would go here
            if (newRevealed.length === 25 - mineCount) {
                // Perfect game!
                cashOut(newRevealed);
            }
        }
    };

    const cashOut = async (finalRevealed = revealed) => {
        if (gameState !== 'playing' || finalRevealed.length === 0) return;

        const multiplier = calculateMultiplier(finalRevealed.length);
        const winAmount = Math.floor(betAmount * multiplier);

        setGameState('over');
        await onWin(winAmount);
        toast.success(`Cashed out at ${multiplier}x!`);
    };

    const nextMultiplier = calculateMultiplier(revealed.length + 1);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 bg-zinc-950/50 border border-white/5 rounded-[40px] p-8 space-y-8 order-2 lg:order-1 shadow-2xl">
                {/* Bet Amount Control */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] italic leading-none">Wager Amount</label>
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest italic">₹100 - ₹50,000</span>
                    </div>
                    <div className="relative group">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-700">₹</span>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            disabled={gameState === 'playing'}
                            className="w-full bg-primary border border-white/5 rounded-[24px] py-6 pl-14 pr-8 text-2xl font-black italic tracking-tighter text-white focus:border-accent/50 transition-all outline-none disabled:opacity-50"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <button
                                onClick={() => setBetAmount(prev => Math.floor(prev / 2))}
                                disabled={gameState === 'playing'}
                                className="px-3 py-2 bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase"
                            >
                                1/2
                            </button>
                            <button
                                onClick={() => setBetAmount(prev => prev * 2)}
                                disabled={gameState === 'playing'}
                                className="px-3 py-2 bg-zinc-900 border border-white/5 rounded-xl text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase"
                            >
                                2x
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mines Count Control */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] italic leading-none">Mines Count</label>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">{mineCount} Bombs</span>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-primary border border-white/5 rounded-[24px]">
                        {[1, 3, 5, 24].map(num => (
                            <button
                                key={num}
                                onClick={() => setMineCount(num)}
                                disabled={gameState === 'playing'}
                                className={`flex-1 py-4 rounded-2xl font-black italic transition-all ${mineCount === num ? 'bg-accent text-white shadow-xl shadow-accent/20' : 'text-zinc-500 hover:text-white hover:bg-white/5 disabled:opacity-50'}`}
                            >
                                {num}
                            </button>
                        ))}
                    </div>
                    <input
                        type="range" min="1" max="24" step="1"
                        value={mineCount}
                        onChange={(e) => setMineCount(parseInt(e.target.value))}
                        disabled={gameState === 'playing'}
                        className="w-full accent-accent bg-zinc-900 h-2 rounded-full cursor-pointer appearance-none mt-4"
                    />
                </div>

                {/* Main Action Button */}
                {gameState === 'playing' ? (
                    <div className="space-y-4 pt-4">
                        <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5 border-dashed text-center">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[4px] block mb-2 leading-none">Current Returns</span>
                            <div className="text-4xl font-black italic text-emerald-500 drop-shadow-[0_10px_20px_rgba(16,185,129,0.3)]">₹{payout}</div>
                            <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[2px]">{calculateMultiplier(revealed.length)}x Multiplier</span>
                        </div>
                        <button
                            onClick={() => cashOut()}
                            className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[28px] font-black uppercase italic tracking-[4px] text-xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <Wallet size={24} /> Cashout
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={startGame}
                        className="w-full py-6 bg-accent hover:bg-accent-hover text-white rounded-[28px] font-black uppercase italic tracking-[4px] text-xl shadow-2xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Play size={24} className="fill-current" /> Bet
                    </button>
                )}

                {/* Stats / Info */}
                <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Game Type</span>
                        <div className="flex items-center gap-2 text-white font-black italic uppercase text-xs">
                            <ShieldAlert size={14} className="text-accent" /> Randomized
                        </div>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Next Value</span>
                        <div className="text-emerald-500 font-black italic uppercase text-xs">
                            {gameState === 'playing' ? `${nextMultiplier}x` : '0x'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Grid */}
            <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] p-4 sm:p-12 order-1 lg:order-2 shadow-inner aspect-square flex items-center justify-center">
                <div className="grid grid-cols-5 gap-2 sm:gap-4 w-full max-w-2xl h-full max-h-[600px]">
                    {grid.map((tile, i) => {
                        const isRevealed = revealed.includes(i);
                        const isMine = mines.includes(i);
                        const isOver = gameState === 'over';

                        return (
                            <motion.button
                                key={i}
                                initial={false}
                                whileHover={!isRevealed && !isOver ? { y: -5, scale: 1.05 } : {}}
                                whileTap={!isRevealed && !isOver ? { scale: 0.95 } : {}}
                                onClick={() => revealTile(i)}
                                className={`relative rounded-xl sm:rounded-2xl transition-all duration-300 aspect-square flex items-center justify-center overflow-hidden
                                    ${isRevealed
                                        ? isMine ? 'bg-red-500/90 shadow-[0_0_40px_rgba(239,68,68,0.5)]' : 'bg-[#1a2c38] shadow-inner border border-white/5'
                                        : isOver && isMine ? 'bg-red-500/30' : 'bg-[#213743] hover:bg-[#2f4553] shadow-lg border-b-4 border-black/20'
                                    }
                                `}
                            >
                                <AnimatePresence mode="wait">
                                    {(isRevealed || (isOver && isMine)) && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ type: 'spring', damping: 12 }}
                                            className="text-white"
                                        >
                                            {isMine ? (
                                                <Bomb size={32} className={`${isRevealed ? 'text-white' : 'text-red-500/50'}`} />
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <Gem size={32} className="text-accent drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Shine Effect */}
                                {!isRevealed && !isOver && (
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 rounded-t-xl sm:rounded-t-2xl pointer-events-none" />
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MinesGame;
