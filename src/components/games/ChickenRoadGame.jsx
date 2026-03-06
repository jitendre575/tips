import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bird, Truck, Play, Wallet, TrendingUp, Minus, Plus, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

const ChickenRoadGame = ({ onBet, onWin, onLoss, isMuted, settings }) => {
    const [betAmount, setBetAmount] = useState(10);
    const [difficulty, setDifficulty] = useState('Easy'); // Easy, Medium, Hard, Hardcore
    const [gameState, setGameState] = useState('idle'); // idle, playing, over
    const [currentLane, setCurrentLane] = useState(-1); // -1 is sidewalk
    const [multiplier, setMultiplier] = useState(1.00);
    const [isCashedOut, setIsCashedOut] = useState(false);
    const [obstacles, setObstacles] = useState([]); // Positions of cars in each lane

    const houseEdge = (settings?.houseEdge || 1) / 100;

    const sounds = {
        move: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
        crash: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
        win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'
    };

    const playSound = (type) => {
        if (isMuted) return;
        const audio = new Audio(sounds[type]);
        audio.volume = 0.4;
        audio.play().catch(() => { });
    };

    const difficultySettings = {
        'Easy': { lanes: 5, risk: 0.2, multiStep: 1.12 * (1 - houseEdge) },
        'Medium': { lanes: 8, risk: 0.4, multiStep: 1.25 * (1 - houseEdge) },
        'Hard': { lanes: 10, risk: 0.6, multiStep: 1.50 * (1 - houseEdge) },
        'Hardcore': { lanes: 12, risk: 0.8, multiStep: 2.00 * (1 - houseEdge) }
    };

    const currentSettings = difficultySettings[difficulty];

    const startGame = async () => {
        if (gameState === 'playing') return;

        const success = await onBet(betAmount);
        if (!success) return;

        playSound('move');
        // Generate obstacles (cars) for each lane
        const newObstacles = Array.from({ length: currentSettings.lanes }, () => Math.random() < currentSettings.risk);
        setObstacles(newObstacles);

        setGameState('playing');
        setCurrentLane(-1);
        setMultiplier(1.00);
        setIsCashedOut(false);
    };

    const moveToNextLane = () => {
        if (gameState !== 'playing' || isCashedOut) return;

        const nextLane = currentLane + 1;

        // Check if next lane is a crash
        if (obstacles[nextLane]) {
            setGameState('over');
            playSound('crash');
            onLoss(betAmount);
            toast.error('KABOOM! The chicken was hit!', { icon: '🚚' });
        } else {
            setCurrentLane(nextLane);
            playSound('move');
            const newMultiplier = Math.pow(currentSettings.multiStep, nextLane + 1);
            setMultiplier(newMultiplier);

            if (nextLane === currentSettings.lanes - 1) {
                // Reached the other side!
                handleCashOut(newMultiplier);
            }
        }
    };

    const handleCashOut = async (finalMulti = multiplier) => {
        if (gameState !== 'playing' || isCashedOut) return;

        setIsCashedOut(true);
        const winAmount = Math.floor(betAmount * finalMulti);
        await onWin(winAmount);
        playSound('win');
        setGameState('over');

        toast.success(`Cashed out at ${finalMulti.toFixed(2)}x!`, { icon: '💰' });
    };

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {/* Game Canvas */}
            <div className="relative bg-[#2a2a2a] rounded-[32px] overflow-hidden border-4 border-[#333] shadow-2xl aspect-[21/9] sm:aspect-[24/10]">
                {/* Sidewalks */}
                <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-[#555] border-r-4 border-dashed border-white/20 z-10 flex flex-col items-center justify-center">
                    <div className="text-[10px] font-black text-white/20 uppercase vertical-text tracking-widest">Sidewalk</div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-[#555] border-l-4 border-dashed border-white/20 z-10 flex flex-col items-center justify-center">
                    <div className="text-[10px] font-black text-white/20 uppercase vertical-text tracking-widest">Safe Zone</div>
                </div>

                {/* Road Lanes */}
                <div className="absolute inset-x-12 sm:inset-x-16 inset-y-0 flex">
                    {Array.from({ length: currentSettings.lanes }).map((_, i) => (
                        <div key={i} className={`flex-1 border-r border-white/10 relative ${i === currentLane ? 'bg-white/5' : ''}`}>
                            {/* Lane Marker */}
                            <div className="absolute top-0 bottom-0 right-0 w-px bg-white/20 border-dashed border-r-4 opacity-50" />

                            {/* Multiplier Indicator */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-zinc-800/80 border-2 border-white/10 flex items-center justify-center text-[10px] sm:text-xs font-black text-zinc-500 shadow-inner">
                                    {Math.pow(currentSettings.multiStep, i + 1).toFixed(2)}x
                                </div>
                            </div>

                            {/* Obstacle (Hidden unless game over or hit) */}
                            {gameState === 'over' && obstacles[i] && (
                                <motion.div
                                    initial={{ y: -100, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400"
                                >
                                    <Truck size={32} className="sm:size-48" />
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>

                {/* The Chicken */}
                <motion.div
                    className="absolute z-20"
                    animate={{
                        left: currentLane === -1 ? '4%' : `calc(50px + ${(currentLane / currentSettings.lanes) * 85 + (1 / currentSettings.lanes) * 42}%)`,
                        top: '40%'
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-yellow-400/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Bird
                            size={32}
                            className={`sm:size-48 text-white drop-shadow-lg transition-transform ${gameState === 'over' && !isCashedOut && currentLane === -1 ? 'rotate-90 text-red-500' : ''}`}
                        />
                        {/* Crown if Cashed Out */}
                        {isCashedOut && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-6 -right-2 text-yellow-400"
                            >
                                <Trophy size={16} />
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Overlays */}
                <AnimatePresence>
                    {gameState === 'idle' && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-white/10 rounded-[28px] m-4"
                        >
                            <div className="text-center">
                                <h3 className="text-white text-3xl font-black uppercase italic tracking-tighter mb-4">Chicken 2 Road</h3>
                                <button
                                    onClick={startGame}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-3 rounded-full font-black uppercase tracking-widest text-sm transition-all active:scale-95"
                                >
                                    Start Cross
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="bg-[#1a1a1a] rounded-[24px] p-6 sm:p-8 border border-white/5 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Bet Amount */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-[3px]">
                            <span>Wager Amount</span>
                            <span>{betAmount}.00 INR</span>
                        </div>
                        <div className="flex bg-black/40 border-2 border-white/5 rounded-2xl p-2 h-16 items-center">
                            <button onClick={() => setBetAmount(Math.max(1, betAmount - 10))} className="w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-white"><Minus /></button>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                                className="flex-1 bg-transparent text-center text-xl font-black italic text-white outline-none"
                            />
                            <button onClick={() => setBetAmount(betAmount + 10)} className="w-12 h-12 flex items-center justify-center text-zinc-500 hover:text-white"><Plus /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setBetAmount(p => Math.floor(p * 0.5))} className="py-2 bg-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors">x0.5</button>
                            <button onClick={() => setBetAmount(p => p * 2)} className="py-2 bg-white/5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white transition-colors">x2.0</button>
                        </div>
                    </div>

                    {/* Difficulty */}
                    <div className="space-y-4">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px]">Set Difficulty</div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/40 p-1.5 rounded-2xl h-16 border-2 border-white/5">
                            {Object.keys(difficultySettings).map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    disabled={gameState === 'playing'}
                                    className={`rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${difficulty === d ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-white disabled:opacity-30'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Action Bar */}
                <div className="flex gap-4">
                    {gameState === 'playing' ? (
                        <>
                            <button
                                onClick={moveToNextLane}
                                className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Play size={24} fill="currentColor" /> Move Next
                            </button>
                            <button
                                onClick={() => handleCashOut()}
                                className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black uppercase text-lg shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center leading-none"
                            >
                                <span className="text-[10px] uppercase mb-1">Cash Out</span>
                                <span>₹{(betAmount * multiplier).toFixed(2)}</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={startGame}
                            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black uppercase text-lg shadow-lg active:scale-95 transition-all"
                        >
                            Play
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChickenRoadGame;
