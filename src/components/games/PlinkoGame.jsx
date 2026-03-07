import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, TrendingUp, Info, Wallet, ShieldCheck, Sparkles, Coins } from 'lucide-react';
import toast from 'react-hot-toast';

const PlinkoGame = ({ onBet, onWin, onLoss, isMuted, settings }) => {
    const [betAmount, setBetAmount] = useState(100);
    const [rows, setRows] = useState(8);
    const [risk, setRisk] = useState('Medium');
    const [isDropping, setIsDropping] = useState(false);
    const [balls, setBalls] = useState([]);
    const canvasRef = useRef(null);

    const multipliers = {
        Low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
        Medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
        High: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
    };

    const dropBall = async () => {
        if (isDropping) return;

        const success = await onBet(betAmount);
        if (!success) return;

        setIsDropping(true);
        const path = [];
        let currentPos = Math.floor(rows / 2);

        for (let i = 0; i < rows; i++) {
            const direction = Math.random() > 0.5 ? 1 : -1;
            path.push(direction);
        }

        const ballId = Date.now();
        setBalls(prev => [...prev, { id: ballId, path, progress: 0 }]);

        // Final Slot calculation
        let finalIndex = rows / 2;
        path.forEach(dir => finalIndex += dir * 0.5);
        const multiplier = multipliers[risk][Math.round(finalIndex)];

        setTimeout(async () => {
            const winAmount = Math.floor(betAmount * multiplier);
            if (winAmount > betAmount) {
                await onWin(winAmount);
            } else if (winAmount < betAmount) {
                onLoss(betAmount - winAmount);
            }
            setIsDropping(false);
            setBalls(prev => prev.filter(b => b.id !== ballId));
        }, rows * 400);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 bg-zinc-950/50 border border-white/5 rounded-[40px] p-8 space-y-8 order-2 lg:order-1 shadow-2xl">
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] italic">Bet Amount</label>
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest italic">Min ₹100</span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-700">₹</span>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-primary border border-white/5 rounded-[22px] py-6 pl-14 pr-8 text-2xl font-black italic tracking-tighter text-zinc-900 focus:border-accent/50 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-white/5 space-y-1">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Risk Level</span>
                        <select
                            value={risk}
                            onChange={(e) => setRisk(e.target.value)}
                            className="w-full bg-transparent text-white font-black italic outline-none"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <div className="bg-zinc-900/50 p-6 rounded-[24px] border border-white/5 space-y-1">
                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Rows</span>
                        <select
                            value={rows}
                            onChange={(e) => setRows(Number(e.target.value))}
                            className="w-full bg-transparent text-white font-black italic outline-none"
                        >
                            <option value={8}>8 Rows</option>
                            <option value={10}>10 Rows</option>
                            <option value={12}>12 Rows</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={dropBall}
                    disabled={isDropping}
                    className="w-full py-6 bg-accent hover:bg-accent-hover text-white rounded-[28px] font-black uppercase italic tracking-[4px] text-xl shadow-2xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    {isDropping ? (
                        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>Drop Ball <Sparkles size={24} /></>
                    )}
                </button>
            </div>

            {/* Plinko Board */}
            <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[40px] p-8 lg:p-12 order-1 lg:order-2 shadow-inner min-h-[600px] flex flex-col items-center justify-between">
                <div className="relative w-full max-w-[500px] aspect-square flex flex-col gap-4">
                    {/* Rows of Pegs */}
                    {Array.from({ length: rows + 1 }).map((_, rIndex) => (
                        <div key={rIndex} className="flex justify-center gap-8 lg:gap-12">
                            {Array.from({ length: rIndex + 3 }).map((_, pIndex) => (
                                <div key={pIndex} className="w-2 h-2 bg-zinc-800 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
                            ))}
                        </div>
                    ))}

                    {/* Multiplier Labels at bottom */}
                    <div className="flex justify-center gap-2 mt-8">
                        {multipliers[risk].map((m, i) => (
                            <div key={i} className={`flex-1 py-3 rounded-lg text-[10px] font-black italic text-center border border-white/5 ${m > 1 ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/20' : 'bg-zinc-900 text-zinc-600'}`}>
                                {m}x
                            </div>
                        ))}
                    </div>

                    {/* Falling Ball Visualizer */}
                    <AnimatePresence>
                        {balls.map((ball) => (
                            <motion.div
                                key={ball.id}
                                initial={{ top: 0, left: '50%' }}
                                animate={{
                                    top: '90%',
                                    // Complex path animation would go here
                                }}
                                className="absolute w-4 h-4 bg-pink-500 rounded-full shadow-[0_0_20px_rgba(236,72,153,1)] z-10"
                            />
                        ))}
                    </AnimatePresence>
                </div>

                <div className="text-zinc-800 text-6xl font-black italic tracking-tighter select-none opacity-20">
                    PLINKO
                </div>
            </div>
        </div>
    );
};

export default PlinkoGame;
