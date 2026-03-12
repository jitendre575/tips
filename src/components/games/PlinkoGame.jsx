import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const PlinkoGame = ({ onBet, onWin, onLoss, isMuted, settings }) => {
    const [betAmount, setBetAmount] = useState(10);
    const [rows, setRows] = useState(8);
    const [risk, setRisk] = useState('Medium');
    const [isDropping, setIsDropping] = useState(false);
    const [activeBalls, setActiveBalls] = useState([]);
    const [lastWin, setLastWin] = useState(null);
    const [mode, setMode] = useState('manual'); // manual or auto

    const multiplierSets = {
        Low: {
            8: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
            12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
            16: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16],
        },
        Medium: {
            8: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
            12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
            16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
        },
        High: {
            8: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
            12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
            16: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
        }
    };

    const currentMultipliers = multiplierSets[risk]?.[rows] || multiplierSets.Medium[8];

    const sounds = {
        pin: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
        win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
        drop: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
    };

    const playSound = (type) => {
        if (isMuted) return;
        try {
            const a = new Audio(sounds[type]);
            a.volume = 0.2;
            a.play().catch(() => {});
        } catch (e) {}
    };

    const dropBall = async () => {
        if (isDropping) return;
        const success = await onBet(betAmount);
        if (!success) return;

        setIsDropping(true);
        playSound('drop');

        // Generate path
        const path = [];
        for (let i = 0; i < rows; i++) {
            path.push(Math.random() > 0.5 ? 1 : -1);
        }

        // Calculate which slot it falls into
        let pos = 0;
        path.forEach(dir => { pos += dir; });
        // Map pos to multiplier index
        const slotIndex = Math.round((pos + rows) / 2);
        const clampedIndex = Math.max(0, Math.min(currentMultipliers.length - 1, slotIndex));
        const multiplier = currentMultipliers[clampedIndex];

        const ballId = Date.now() + Math.random();
        const ballData = { id: ballId, path, landIndex: clampedIndex, step: 0 };
        setActiveBalls(prev => [...prev, ballData]);

        // Animate ball step by step
        let step = 0;
        const interval = setInterval(() => {
            step++;
            setActiveBalls(prev => prev.map(b =>
                b.id === ballId ? { ...b, step } : b
            ));
            if (step >= rows) {
                clearInterval(interval);
                // Process result
                setTimeout(async () => {
                    const winAmount = Math.floor(betAmount * multiplier);
                    setLastWin({ multiplier, amount: winAmount, slotIndex: clampedIndex });

                    if (multiplier >= 1) {
                        await onWin(winAmount);
                        if (multiplier > 2) {
                            toast.success(`Won ${multiplier}x! +₹${winAmount}`, { icon: '🎯' });
                            playSound('win');
                        }
                    } else {
                        onLoss(betAmount - winAmount);
                        await onWin(winAmount); // Return partial
                    }

                    setActiveBalls(prev => prev.filter(b => b.id !== ballId));
                    setIsDropping(false);
                }, 500);
            }
        }, 200);
    };

    // Calculate ball position based on step and path
    const getBallPosition = (ball) => {
        const pegSpacing = 100 / (rows + 2);
        let x = 50; // Start center
        for (let i = 0; i < ball.step && i < ball.path.length; i++) {
            x += ball.path[i] * (pegSpacing / 2);
        }
        const y = (ball.step / rows) * 85 + 5;
        return { x, y };
    };

    const getMultiplierColor = (m) => {
        if (m >= 100) return { bg: '#16a34a', text: '#fff' };
        if (m >= 10) return { bg: '#22c55e', text: '#fff' };
        if (m >= 5) return { bg: '#84cc16', text: '#000' };
        if (m >= 3) return { bg: '#a3e635', text: '#000' };
        if (m >= 1.5) return { bg: '#d9f99d', text: '#000' };
        if (m >= 1) return { bg: '#fef08a', text: '#000' };
        if (m >= 0.5) return { bg: '#fde047', text: '#000' };
        return { bg: '#facc15', text: '#000' };
    };

    return (
        <div className="flex flex-col lg:flex-row bg-[#0f212e] overflow-hidden min-h-[550px]">
            {/* ===== LEFT SIDEBAR CONTROLS ===== */}
            <div className="w-full lg:w-[280px] bg-[#213743] p-4 flex flex-col gap-4 z-10 border-r border-[#0f212e] order-2 lg:order-1">
                {/* Manual / Auto Toggle */}
                <div className="bg-[#0f212e] p-1 rounded-full flex">
                    <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${mode === 'manual' ? 'bg-[#2f4553] text-white shadow-md' : 'text-[#b1bad3] hover:text-white'}`}
                    >Manual</button>
                    <button
                        onClick={() => setMode('auto')}
                        className={`flex-1 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${mode === 'auto' ? 'bg-[#2f4553] text-white shadow-md' : 'text-[#b1bad3] hover:text-white'}`}
                    >Auto</button>
                </div>

                {/* Bet Amount */}
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[#b1bad3] text-[11px] font-bold uppercase tracking-wider px-1">
                        <span>Bet Amount</span>
                        <span>₹{betAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex bg-[#0f212e] border-2 border-[#2f4553] rounded h-[42px] overflow-hidden hover:border-[#557086] transition-all">
                        <input
                            type="number"
                            value={betAmount === 0 ? '' : betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            disabled={isDropping}
                            placeholder="0.00"
                            className="flex-1 bg-transparent px-3 text-white font-bold outline-none text-sm placeholder:text-[#557086]"
                        />
                        <div className="flex items-center px-1">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[9px] font-black text-black">₹</div>
                        </div>
                        <div className="flex bg-[#2f4553]">
                            <button onClick={() => setBetAmount(prev => Math.max(1, Math.floor(prev / 2)))} disabled={isDropping} className="px-3 text-white font-bold hover:bg-[#3b5568] transition-colors border-r border-[#0f212e] text-xs">½</button>
                            <button onClick={() => setBetAmount(prev => prev * 2)} disabled={isDropping} className="px-3 text-white font-bold hover:bg-[#3b5568] transition-colors text-xs">2×</button>
                        </div>
                    </div>
                </div>

                {/* Risk Level */}
                <div className="space-y-1.5">
                    <div className="text-[#b1bad3] text-[11px] font-bold uppercase tracking-wider px-1">Difficulty</div>
                    <div className="relative">
                        <select
                            value={risk}
                            onChange={(e) => setRisk(e.target.value)}
                            disabled={isDropping}
                            className="w-full bg-[#0f212e] border-2 border-[#2f4553] rounded py-2.5 px-3 text-white font-bold outline-none appearance-none hover:border-[#557086] transition-all text-sm cursor-pointer pr-10"
                        >
                            <option value="Low" className="bg-[#0f212e]">Low</option>
                            <option value="Medium" className="bg-[#0f212e]">Medium</option>
                            <option value="High" className="bg-[#0f212e]">High</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] pointer-events-none" />
                    </div>
                </div>

                {/* Rows */}
                <div className="space-y-1.5">
                    <div className="text-[#b1bad3] text-[11px] font-bold uppercase tracking-wider px-1">Rows</div>
                    <div className="relative">
                        <select
                            value={rows}
                            onChange={(e) => setRows(Number(e.target.value))}
                            disabled={isDropping}
                            className="w-full bg-[#0f212e] border-2 border-[#2f4553] rounded py-2.5 px-3 text-white font-bold outline-none appearance-none hover:border-[#557086] transition-all text-sm cursor-pointer pr-10"
                        >
                            <option value={8} className="bg-[#0f212e]">8</option>
                            <option value={12} className="bg-[#0f212e]">12</option>
                            <option value={16} className="bg-[#0f212e]">16</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] pointer-events-none" />
                    </div>
                </div>

                {/* Drop Button */}
                <div className="mt-auto">
                    <button
                        onClick={dropBall}
                        disabled={isDropping}
                        className="w-full py-3.5 bg-[#00e701] hover:bg-[#1fff1f] text-[#05200a] rounded font-black text-sm shadow-[0_4px_0_rgb(0,180,1)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDropping ? 'Dropping...' : 'Bet'}
                    </button>
                </div>
            </div>

            {/* ===== PLINKO BOARD ===== */}
            <div className="flex-1 bg-[#0f212e] p-3 sm:p-6 flex flex-col items-center justify-center relative overflow-hidden order-1 lg:order-2 min-h-[450px]">
                {/* Plinko board area */}
                <div className="relative w-full max-w-[550px]" style={{ aspectRatio: '1.2/1' }}>
                    {/* Rows of pegs */}
                    {Array.from({ length: rows }).map((_, rowIndex) => {
                        const pegsInRow = rowIndex + 3;
                        return (
                            <div
                                key={rowIndex}
                                className="flex justify-center items-center"
                                style={{
                                    position: 'absolute',
                                    top: `${((rowIndex + 1) / (rows + 1)) * 85}%`,
                                    left: 0,
                                    right: 0,
                                }}
                            >
                                <div className="flex items-center" style={{ gap: `${Math.max(8, 40 - rows * 1.5)}px` }}>
                                    {Array.from({ length: pegsInRow }).map((_, pegIndex) => (
                                        <div
                                            key={pegIndex}
                                            className="w-[6px] h-[6px] sm:w-2 sm:h-2 rounded-full bg-[#2f4553] shadow-[0_0_4px_rgba(47,69,83,0.5)]"
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Falling Balls */}
                    <AnimatePresence>
                        {activeBalls.map(ball => {
                            const pos = getBallPosition(ball);
                            return (
                                <motion.div
                                    key={ball.id}
                                    className="absolute z-20"
                                    initial={{ left: '50%', top: '0%' }}
                                    animate={{
                                        left: `${pos.x}%`,
                                        top: `${pos.y}%`,
                                    }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.5 }}
                                    style={{ transform: 'translate(-50%, -50%)' }}
                                >
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#ff6b35] shadow-[0_0_12px_rgba(255,107,53,0.7),0_0_25px_rgba(255,107,53,0.3)]" />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Multiplier slots at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center" style={{ gap: '2px' }}>
                        {currentMultipliers.map((m, i) => {
                            const colors = getMultiplierColor(m);
                            const isHit = lastWin?.slotIndex === i;
                            return (
                                <motion.div
                                    key={i}
                                    animate={isHit ? { scale: [1, 1.2, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                    className="rounded-sm text-center font-black leading-none transition-all relative overflow-hidden"
                                    style={{
                                        background: colors.bg,
                                        color: colors.text,
                                        fontSize: currentMultipliers.length > 13 ? '7px' : '9px',
                                        padding: currentMultipliers.length > 13 ? '6px 2px' : '8px 4px',
                                        flex: '1 1 0',
                                        minWidth: 0,
                                        boxShadow: isHit ? `0 0 15px ${colors.bg}` : 'none'
                                    }}
                                >
                                    {m >= 100 ? m : m}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Win popup */}
                <AnimatePresence>
                    {lastWin && lastWin.multiplier > 2 && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute z-30 bg-[#0f212e]/90 backdrop-blur-md border-2 border-[#00e701]/40 rounded-2xl px-8 py-5 text-center shadow-[0_0_50px_rgba(0,231,1,0.2)]"
                        >
                            <p className="text-[#00e701] text-3xl font-black">{lastWin.multiplier}x</p>
                            <p className="text-white/60 text-xs font-bold mt-1">+₹{lastWin.amount}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PlinkoGame;
