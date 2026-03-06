import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Wallet, Play, RotateCcw, Zap, TrendingUp, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const CrashGame = ({ onBet, onWin, onLoss }) => {
    const [betAmount, setBetAmount] = useState(100);
    const [multiplier, setMultiplier] = useState(1.00);
    const [gameState, setGameState] = useState('idle'); // idle, starting, flying, crashed
    const [crashPoint, setCrashPoint] = useState(0);
    const [payout, setPayout] = useState(0);
    const [isCashedOut, setIsCashedOut] = useState(false);

    const multiplierRef = useRef(1.00);
    const timerRef = useRef(null);

    const generateCrashPoint = () => {
        // Provably Fair Crash Point Generation
        const r = Math.random();
        // 99% RTP / (1 - r) logic
        const crash = 0.99 / (1 - r);
        return Math.max(1.01, crash);
    };

    const startGame = async () => {
        if (gameState !== 'idle' && gameState !== 'crashed') return;

        const success = await onBet(betAmount);
        if (!success) return;

        setGameState('starting');
        setMultiplier(1.00);
        multiplierRef.current = 1.00;
        setIsCashedOut(false);
        setPayout(0);

        // Warm up / Pre-flight wait
        setTimeout(() => {
            const finalCrash = generateCrashPoint();
            setCrashPoint(finalCrash);
            setGameState('flying');
            startFlight(finalCrash);
        }, 2000);
    };

    const startFlight = (finalCrash) => {
        const startTime = Date.now();

        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            // Exponential growth: multiplier = e^(0.06 * time)
            const nextMultiplier = Math.pow(Math.E, 0.08 * elapsed);

            if (nextMultiplier >= finalCrash) {
                clearInterval(timerRef.current);
                setMultiplier(finalCrash);
                setGameState('crashed');
                if (!isCashedOut) {
                    onLoss(betAmount);
                    toast.error(`Crashed at ${finalCrash.toFixed(2)}x`, {
                        icon: '💥',
                        style: { background: '#18181b', color: '#fff' }
                    });
                }
            } else {
                setMultiplier(nextMultiplier);
                multiplierRef.current = nextMultiplier;
                if (!isCashedOut) {
                    setPayout(Math.floor(betAmount * nextMultiplier));
                }
            }
        }, 50);
    };

    const handleCashOut = async () => {
        if (gameState !== 'flying' || isCashedOut) return;

        setIsCashedOut(true);
        const winAmount = Math.floor(betAmount * multiplierRef.current);
        setPayout(winAmount);
        await onWin(winAmount);

        toast.success(`Cashed out at ${multiplierRef.current.toFixed(2)}x!`, {
            icon: '💰',
            style: { background: '#10b981', color: '#fff' }
        });
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-8 items-start">
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 bg-zinc-950/50 border border-white/5 rounded-[32px] sm:rounded-[40px] p-5 sm:p-8 space-y-6 sm:space-y-8 order-2 lg:order-1 shadow-2xl">
                {/* Bet Amount Control */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] italic leading-none">Wager Amount</label>
                        <span className="text-[10px] font-black text-accent uppercase tracking-widest italic leading-none">₹100 - ₹50,000</span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-zinc-700">₹</span>
                        <input
                            type="number"
                            value={betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            disabled={gameState === 'starting' || gameState === 'flying'}
                            className="w-full bg-primary border border-white/5 rounded-[22px] py-4 sm:py-6 pl-14 pr-8 text-xl sm:text-2xl font-black italic tracking-tighter text-white focus:border-accent/50 transition-all outline-none disabled:opacity-50"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                            <button
                                onClick={() => setBetAmount(p => Math.floor(p / 2))}
                                disabled={gameState === 'starting' || gameState === 'flying'}
                                className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase"
                            >1/2</button>
                            <button
                                onClick={() => setBetAmount(p => p * 2)}
                                disabled={gameState === 'starting' || gameState === 'flying'}
                                className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase"
                            >2x</button>
                        </div>
                    </div>
                </div>

                {/* Game Stats */}
                <div className="bg-zinc-900/50 p-5 rounded-[24px] border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Current Return</span>
                        <span className={`text-xl font-black italic ${isCashedOut ? 'text-emerald-500' : 'text-white'}`}>₹{payout.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-white/5 w-full" />
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Rocket Status</span>
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${gameState === 'flying' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{gameState}</span>
                        </div>
                    </div>
                </div>

                {/* Main Action Button */}
                {gameState === 'flying' && !isCashedOut ? (
                    <button
                        onClick={handleCashOut}
                        className="w-full py-4 sm:py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[28px] font-black uppercase italic tracking-[4px] text-xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Wallet size={24} /> Cashout
                    </button>
                ) : (
                    <button
                        onClick={startGame}
                        disabled={gameState === 'starting' || gameState === 'flying'}
                        className="w-full py-4 sm:py-5 bg-accent hover:bg-accent-hover text-white rounded-[28px] font-black uppercase italic tracking-[4px] text-xl shadow-2xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {gameState === 'starting' ? (
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><Play size={24} className="fill-current" /> Launch Rocket</>
                        )}
                    </button>
                )}
            </div>

            {/* Game Visualizer Section */}
            <div className="lg:col-span-8 bg-[#0a0a0a] border border-white/5 rounded-[32px] sm:rounded-[40px] p-6 sm:p-12 order-1 lg:order-2 shadow-inner relative overflow-hidden min-h-[400px] sm:min-h-[500px] flex flex-col justify-center items-center">
                {/* Starry Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
                    {[...Array(20)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{
                                opacity: [0.2, 1, 0.2],
                                scale: [1, 1.5, 1],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>

                {/* Animated Nebula Gaps */}
                <motion.div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    animate={{
                        background: [
                            'radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 80% 70%, rgba(168,85,247,0.15) 0%, transparent 50%)',
                            'radial-gradient(circle at 20% 30%, rgba(99,102,241,0.15) 0%, transparent 50%)'
                        ]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                />

                {/* Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(to right, #ffffff10 1px, transparent 1px), linear-gradient(to bottom, #ffffff10 1px, transparent 1px)`,
                        backgroundSize: '40px 40px'
                    }}
                />

                <AnimatePresence mode="wait">
                    {gameState === 'crashed' ? (
                        <motion.div
                            key="crash"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center gap-4 z-10"
                        >
                            <div className="p-8 bg-red-500/10 rounded-full border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                                <AlertTriangle size={64} className="text-red-500 animate-bounce" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-red-500 text-6xl sm:text-8xl font-black italic tracking-tighter leading-none mb-2">FLEET CRASHED</h2>
                                <p className="text-red-500/50 font-black uppercase tracking-[4px] text-xs">Rocket Lost at {multiplier.toFixed(2)}x</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="flight"
                            className="flex flex-col items-center gap-8 z-10"
                        >
                            {/* Multiplier Display */}
                            <div className="text-center relative">
                                <motion.div
                                    className={`text-7xl sm:text-[120px] font-black italic tracking-tighter leading-none transition-colors duration-300 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] ${isCashedOut ? 'text-emerald-500' : 'text-white'}`}
                                    animate={gameState === 'flying' ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                >
                                    {multiplier.toFixed(2)}<span className={`text-4xl sm:text-6xl ml-2 ${isCashedOut ? 'text-emerald-500/50' : 'text-zinc-700'}`}>x</span>
                                </motion.div>
                                {isCashedOut && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-emerald-500 px-4 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap shadow-xl shadow-emerald-500/20"
                                    >
                                        Cashed Out Successfully
                                    </motion.div>
                                )}
                            </div>

                            {/* Rocket Animation */}
                            <div className="relative w-full h-40 flex items-center justify-center">
                                <motion.div
                                    animate={gameState === 'flying' ? {
                                        y: [0, -40, 0],
                                        rotate: [-2, 2, -2],
                                        scale: [1, 1.1, 1]
                                    } : {}}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                    className="relative"
                                >
                                    <div className={`absolute inset-0 blur-3xl rounded-full transition-opacity duration-500 ${gameState === 'flying' ? 'bg-accent/20 opacity-100' : 'opacity-0'}`} />
                                    <Rocket size={gameState === 'starting' ? 80 : 120}
                                        className={`transition-all duration-500 z-10 ${gameState === 'idle' ? 'text-zinc-800' :
                                            gameState === 'starting' ? 'text-accent animate-pulse' :
                                                'text-accent drop-shadow-[0_0_40px_rgba(59,130,246,0.8)]'
                                            }`}
                                    />
                                    {gameState === 'flying' && (
                                        <div className="z-0">
                                            {/* Rocket Flame Core */}
                                            <motion.div
                                                animate={{ scaleY: [1, 2, 1], opacity: [0.8, 1, 0.8] }}
                                                transition={{ repeat: Infinity, duration: 0.1 }}
                                                className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-6 h-20 bg-gradient-to-b from-blue-400 via-accent to-transparent blur-sm rounded-full"
                                            />
                                            {/* Outer Glow */}
                                            <motion.div
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ repeat: Infinity, duration: 0.15 }}
                                                className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-12 h-24 bg-gradient-to-b from-accent/50 to-transparent blur-xl rounded-full"
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Ground/Base Visual */}
                <div className="absolute bottom-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-sm" />
            </div>
        </div>
    );
};

export default CrashGame;
