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
        <div className="flex flex-col bg-[#0f212e] min-h-[600px] w-full items-center">
            {/* Game Canvas - Fixed width 440px to fit 480px container comfortably */}
            <div className="relative w-[340px] xs:w-[400px] aspect-[4/6] bg-[#2a2a2a] rounded-[6px] overflow-hidden border-4 border-[#333] shadow-2xl mt-4 shrink-0">
                {/* Sidewalks (Top & Bottom for vertical road) */}
                <div className="absolute top-0 left-0 right-0 h-10 bg-[#555] border-b-2 border-dashed border-white/20 z-10 flex items-center justify-center">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Finish Line</div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#555] border-t-2 border-dashed border-white/20 z-10 flex items-center justify-center">
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-[4px]">Start Zone</div>
                </div>

                {/* Road Lanes (Vertical stack) */}
                <div className="absolute inset-x-0 bottom-10 top-10 flex flex-col-reverse">
                    {Array.from({ length: currentSettings.lanes }).map((_, i) => (
                        <div key={i} className={`flex-1 border-b border-white/10 relative ${i === currentLane ? 'bg-white/5' : ''}`}>
                            {/* Multiplier Indicator - on the right */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[6px] bg-black/40 border border-white/10 flex items-center justify-center text-[8px] font-black text-[#b1bad3]">
                                {Math.pow(currentSettings.multiStep, i + 1).toFixed(2)}x
                            </div>

                            {/* Obstacle */}
                            {gameState === 'over' && obstacles[i] && (
                                <motion.div
                                    initial={{ x: -100, opacity: 0 }}
                                    animate={{ x: 100, opacity: 1 }}
                                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                    className="absolute inset-y-0 left-0 flex items-center text-blue-400"
                                >
                                    <Truck size={32} />
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>

                {/* The Chicken */}
                <motion.div
                    className="absolute z-20 left-1/2 -translate-x-1/2"
                    animate={{
                        bottom: currentLane === -1 ? '4%' : `calc(45px + ${(currentLane / currentSettings.lanes) * 85 + (1 / currentSettings.lanes) * 42}%)`
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-yellow-400/20 blur-xl rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Bird
                            size={40}
                            className={`text-white drop-shadow-lg transition-transform ${gameState === 'over' && !isCashedOut && currentLane === i ? 'rotate-90 text-red-500' : ''}`}
                        />
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
                            className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center m-4 rounded-[6px] border border-white/10"
                        >
                            <div className="text-center px-4">
                                <h3 className="text-white text-2xl font-black uppercase italic tracking-tighter mb-4">Chicken 2 Road</h3>
                                <p className="text-[#b1bad3] text-[10px] uppercase tracking-[2px] mb-6">Cross the road to win!</p>
                                <button
                                    onClick={startGame}
                                    className="w-full bg-[#00e701] hover:bg-[#1fff20] text-[#05200a] py-4 rounded-[6px] font-black uppercase tracking-widest text-sm shadow-[0_4px_0_rgb(0,180,1)] active:translate-y-0.5 transition-all"
                                >
                                    Start Game
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="w-full bg-[#213743] p-4 space-y-4 shrink-0 border-t border-[#0f212e] mt-4">
                {/* Bet Amount */}
                <div className="space-y-1.5">
                    <div className="flex justify-between text-[#b1bad3] text-[10px] font-black uppercase tracking-[2px] px-1">
                        <span>Bet Amount</span>
                        <span>₹{betAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex bg-[#0f212e] border-2 border-[#2f4553] rounded-[6px] h-[42px] overflow-hidden hover:border-[#557086] transition-all">
                        <button onClick={() => setBetAmount(Math.max(1, betAmount - 10))} className="px-3 text-zinc-500 hover:text-white transition-colors"><Minus size={16}/></button>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(parseInt(e.target.value) || 0)}
                            className="flex-1 bg-transparent text-center text-sm font-black text-white outline-none"
                        />
                        <button onClick={() => setBetAmount(betAmount + 10)} className="px-3 text-zinc-500 hover:text-white transition-colors"><Plus size={16}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setBetAmount(p => Math.floor(p * 0.5))} className="py-2 bg-[#2f4553] rounded-[6px] font-bold text-[10px] text-[#b1bad3] hover:text-white transition-colors uppercase">½ Bet</button>
                        <button onClick={() => setBetAmount(p => p * 2)} className="py-2 bg-[#2f4553] rounded-[6px] font-bold text-[10px] text-[#b1bad3] hover:text-white transition-colors uppercase">2× Bet</button>
                    </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                    <div className="text-[#b1bad3] text-[10px] font-black uppercase tracking-[2px] px-1">Difficulty</div>
                    <div className="grid grid-cols-4 gap-1 p-1 bg-[#0f212e] rounded-[6px] border border-[#2f4553]">
                        {Object.keys(difficultySettings).map(d => (
                            <button
                                key={d}
                                onClick={() => setDifficulty(d)}
                                disabled={gameState === 'playing'}
                                className={`py-2 rounded-[6px] text-[8px] font-black uppercase tracking-wider transition-all ${
                                    difficulty === d 
                                        ? 'bg-[#2f4553] text-white shadow-md' 
                                        : 'text-[#b1bad3] hover:text-white disabled:opacity-30'
                                }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Action Bar */}
                <div className="flex gap-2">
                    {gameState === 'playing' ? (
                        <>
                            <button
                                onClick={moveToNextLane}
                                className="flex-[2] py-4 bg-white text-black rounded-[6px] font-black uppercase text-sm shadow-lg active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                <Play size={18} fill="currentColor" /> Move
                            </button>
                            <button
                                onClick={() => handleCashOut()}
                                className="flex-[3] py-4 bg-[#00e701] hover:bg-[#1fff20] text-[#05200a] rounded-[6px] font-black uppercase text-sm shadow-[0_4px_0_rgb(0,180,1)] active:translate-y-0.5 transition-all flex flex-col items-center justify-center leading-none"
                            >
                                <span className="text-[8px] uppercase mb-1 opacity-70">Cash Out</span>
                                <span>₹{(betAmount * multiplier).toFixed(0)}</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={startGame}
                            className="w-full py-5 bg-[#00e701] hover:bg-[#1fff20] text-[#05200a] rounded-[6px] font-black uppercase text-base shadow-[0_4px_0_rgb(0,180,1)] active:translate-y-0.5 transition-all"
                        >
                            Play (Next Round)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChickenRoadGame;
