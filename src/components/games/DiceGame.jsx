import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, TrendingUp, Info, Wallet, ShieldCheck, Dice5 } from 'lucide-react';
import toast from 'react-hot-toast';

const DiceGame = ({ onBet, onWin, onLoss }) => {
    const [betAmount, setBetAmount] = useState(100);
    const [targetValue, setTargetValue] = useState(50);
    const [isOver, setIsOver] = useState(true);
    const [lastRoll, setLastRoll] = useState(null);
    const [isRolling, setIsRolling] = useState(false);
    const [houseEdge] = useState(0.01); // 1%

    const winProbability = isOver ? (100 - targetValue) : targetValue;
    const multiplier = winProbability > 0 ? (99 / winProbability).toFixed(4) : 0;

    const rollDice = async () => {
        if (isRolling) return;

        const success = await onBet(betAmount);
        if (!success) return;

        setIsRolling(true);
        setLastRoll(null);

        // Simulated rolling duration
        setTimeout(async () => {
            const result = (Math.random() * 100).toFixed(2);
            setLastRoll(parseFloat(result));
            setIsRolling(false);

            const isWin = isOver ? (result > targetValue) : (result < targetValue);

            if (isWin) {
                const winAmount = Math.floor(betAmount * multiplier);
                await onWin(winAmount);
            } else {
                onLoss(betAmount);
                toast.error(`Rolled ${result}. Better luck next time!`, {
                    style: { background: '#121212', color: '#fff', border: '1px solid #333' }
                });
            }
        }, 800);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 bg-zinc-950/50 border border-white/5 rounded-[40px] p-8 space-y-8 order-2 lg:order-1 shadow-2xl">
                {/* Bet Amount Control */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] italic leading-none">Bet Amount</label>
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest italic leading-none">Min ₹100</span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-700">₹</span>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-primary border border-white/5 rounded-[24px] py-6 pl-14 pr-8 text-2xl font-black italic tracking-tighter text-white focus:border-accent/50 transition-all outline-none"
                        />
                    </div>
                </div>

                {/* Multiplier & Profit Info */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-white/5 space-y-1">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Multiplier</span>
                        <div className="text-xl font-black italic text-white">{multiplier}x</div>
                    </div>
                    <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-white/5 space-y-1">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Win Chance</span>
                        <div className="text-xl font-black italic text-emerald-500">{winProbability.toFixed(2)}%</div>
                    </div>
                </div>

                {/* Roll Actions */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-1.5 bg-primary border border-white/5 rounded-[24px]">
                        <button
                            onClick={() => setIsOver(false)}
                            className={`py-4 rounded-2xl font-black italic uppercase text-xs tracking-widest transition-all ${!isOver ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-600 hover:text-white'}`}
                        >
                            Roll Under
                        </button>
                        <button
                            onClick={() => setIsOver(true)}
                            className={`py-4 rounded-2xl font-black italic uppercase text-xs tracking-widest transition-all ${isOver ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/20' : 'text-zinc-600 hover:text-white'}`}
                        >
                            Roll Over
                        </button>
                    </div>
                    <button
                        onClick={rollDice}
                        disabled={isRolling}
                        className="w-full py-6 bg-accent hover:bg-accent-hover text-white rounded-[28px] font-black uppercase italic tracking-[4px] text-xl shadow-2xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isRolling ? (
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Roll Dice <Dice5 size={24} /></>
                        )}
                    </button>
                </div>
            </div>

            {/* Dice Visualizer */}
            <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 sm:p-16 order-1 lg:order-2 shadow-inner min-h-[400px] flex flex-col justify-center gap-16">
                {/* Roll Slider Visual */}
                <div className="relative">
                    {/* Background Bar */}
                    <div className="w-full h-4 bg-zinc-900 rounded-full relative overflow-hidden">
                        <div
                            className={`absolute h-full transition-all duration-500 ${isOver ? 'bg-red-500/20 left-0' : 'bg-emerald-500/20 right-0'}`}
                            style={{ width: isOver ? `${targetValue}%` : `${100 - targetValue}%` }}
                        />
                        <div
                            className={`absolute h-full transition-all duration-500 ${isOver ? 'bg-emerald-500/20 right-0' : 'bg-red-500/20 left-0'}`}
                            style={{ width: isOver ? `${100 - targetValue}%` : `${targetValue}%` }}
                        />
                    </div>

                    {/* Target Pointer */}
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0}
                        animate={{ left: `${targetValue}%` }}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                    >
                        <div className="w-8 h-12 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center justify-center cursor-ew-resize">
                            <div className="w-1 h-6 bg-zinc-200 rounded-full" />
                        </div>
                    </motion.div>

                    {/* Last Roll Indicator */}
                    <AnimatePresence>
                        {lastRoll !== null && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.5 }}
                                animate={{ opacity: 1, y: -60, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.5 }}
                                style={{ left: `${lastRoll}%` }}
                                className="absolute -translate-x-1/2"
                            >
                                <div className={`px-4 py-2 rounded-xl font-black italic shadow-2xl border-2 ${isOver ? (lastRoll > targetValue ? 'bg-emerald-500 border-emerald-400' : 'bg-red-500 border-red-400')
                                        : (lastRoll < targetValue ? 'bg-emerald-500 border-emerald-400' : 'bg-red-500 border-red-400')
                                    } text-white`}>
                                    {lastRoll}
                                </div>
                                <div className={`w-3 h-3 rotate-45 mx-auto -mt-1.5 ${isOver ? (lastRoll > targetValue ? 'bg-emerald-500' : 'bg-red-500')
                                        : (lastRoll < targetValue ? 'bg-emerald-500' : 'bg-red-500')
                                    }`} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Slider Input (Hidden but Functional) */}
                    <input
                        type="range" min="2" max="98" step="1"
                        value={targetValue}
                        onChange={(e) => setTargetValue(parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />

                    {/* Scale Labels */}
                    <div className="flex justify-between mt-6 text-[10px] font-black text-zinc-600 uppercase tracking-[3px]">
                        <span>0</span>
                        <span>25</span>
                        <span>50</span>
                        <span>75</span>
                        <span>100</span>
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex flex-col items-center">
                    <div className="text-zinc-800 text-9xl font-black italic tracking-tighter select-none opacity-20">
                        {isRolling ? '??' : (lastRoll || '50')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiceGame;
