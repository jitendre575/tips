import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Play, AlertTriangle, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const CrashGame = ({ onBet, onWin, onLoss, isMuted, settings }) => {
    // Dual Bet State
    const [bets, setBets] = useState([
        { amount: 10, isAuto: false, active: false, cashedOut: false, payout: 0 },
        { amount: 10, isAuto: false, active: false, cashedOut: false, payout: 0 }
    ]);

    const [multiplier, setMultiplier] = useState(1.00);
    const [gameState, setGameState] = useState('idle'); // idle, starting, flying, crashed
    const [crashPoint, setCrashPoint] = useState(0);

    const multiplierRef = useRef(1.00);
    const timerRef = useRef(null);

    const sounds = {
        tick: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        crash: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
        win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'
    };

    const playSound = (type) => {
        if (isMuted) return;
        const audio = new Audio(sounds[type]);
        audio.volume = 0.3;
        audio.play().catch(() => { });
    };

    const generateCrashPoint = () => {
        // Check for Admin Rigging
        if (settings?.rigNextCrash && settings?.forceCrashPoint) {
            // One-time rig: Reset after use
            import('../../firebase').then(({ db }) => {
                import('firebase/firestore').then(({ doc, updateDoc }) => {
                    updateDoc(doc(db, 'settings', 'casino'), { rigNextCrash: false });
                });
            });
            return settings.forceCrashPoint;
        }

        const houseEdge = (settings?.houseEdge || 1) / 100;
        const r = Math.random();
        const crash = (1 - houseEdge) / (1 - r);
        return Math.max(1.01, crash);
    };

    const handleBetAmount = (index, delta) => {
        setBets(prev => prev.map((b, i) =>
            i === index ? { ...b, amount: Math.max(1, b.amount + delta) } : b
        ));
    };

    const placeBet = async (index) => {
        if (gameState === 'flying' || bets[index].active) return;

        const success = await onBet(bets[index].amount);
        if (!success) return;

        setBets(prev => prev.map((b, i) =>
            i === index ? { ...b, active: true, cashedOut: false, payout: 0 } : b
        ));

        if (gameState === 'idle' || gameState === 'crashed') {
            startGame();
        }
    };

    const startGame = () => {
        setGameState('starting');
        setMultiplier(1.00);
        multiplierRef.current = 1.00;

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
            const nextMultiplier = Math.pow(Math.E, 0.08 * elapsed);

            if (nextMultiplier >= finalCrash) {
                clearInterval(timerRef.current);
                setMultiplier(finalCrash);
                setGameState('crashed');
                playSound('crash');

                // Handle Losses
                setBets(prev => {
                    prev.forEach((b, i) => {
                        if (b.active && !b.cashedOut) {
                            onLoss(b.amount);
                        }
                    });
                    return prev.map(b => ({ ...b, active: false }));
                });

                toast.error(`Crashed at ${finalCrash.toFixed(2)}x`, { icon: '💥' });
            } else {
                setMultiplier(nextMultiplier);
                multiplierRef.current = nextMultiplier;
            }
        }, 50);
    };

    const handleCashOut = (index) => {
        if (gameState !== 'flying' || !bets[index].active || bets[index].cashedOut) return;

        const winAmount = Math.floor(bets[index].amount * multiplierRef.current);
        onWin(winAmount);
        playSound('win');

        setBets(prev => prev.map((b, i) =>
            i === index ? { ...b, cashedOut: true, payout: winAmount } : b
        ));

        toast.success(`Cashed out at ${multiplierRef.current.toFixed(2)}x!`, { icon: '💰' });
    };

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // Path calculation for the curve
    const getCurvePath = (m) => {
        const progress = Math.min((m - 1) / 5, 1); // Normalize 1x-6x to 0-1
        const x = progress * 80; // 80% width
        const y = Math.pow(progress, 2) * 60; // Quadratic curve
        return { x, y };
    };

    const curve = getCurvePath(multiplier);

    return (
        <div className="space-y-6">
            {/* Visualizer Area */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-black rounded-[24px] sm:rounded-[32px] overflow-hidden border border-white/5 shadow-2xl">
                {/* Radial Sunburst Background */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                    <div className="absolute inset-0 bg-[repeating-conic-gradient(from_0deg,transparent_0deg_10deg,rgba(255,255,255,0.05)_10deg_20deg)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.2),transparent_70%)]" />
                </div>

                {/* Flight Path SVG */}
                <svg className="absolute inset-0 w-full h-full p-8" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                        </linearGradient>
                    </defs>
                    <motion.path
                        d={`M 0 90 Q 40 90 ${curve.x} ${90 - curve.y}`}
                        stroke="#ef4444"
                        strokeWidth="1.5"
                        fill="none"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.1 }}
                    />
                    <path
                        d={`M 0 90 Q 40 90 ${curve.x} ${90 - curve.y} L ${curve.x} 90 L 0 90 Z`}
                        fill="url(#pathGradient)"
                    />
                </svg>

                {/* The Plane */}
                <motion.div
                    className="absolute z-20 pointer-events-none"
                    style={{
                        left: `calc(8% + ${curve.x}%)`,
                        bottom: `calc(10% + ${curve.y}%)`,
                        transform: 'translate(-50%, 50%)'
                    }}
                >
                    <motion.div
                        animate={gameState === 'flying' ? {
                            rotate: [-15, -20, -15],
                            y: [0, -5, 0]
                        } : {}}
                    >
                        {/* Red Plane SVG (Minimalist Aviator Style) */}
                        <svg width="60" height="30" viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 15L50 10L55 15L50 20L10 15Z" fill="#ef4444" />
                            <path d="M20 15L30 5L35 5L30 15H20Z" fill="#ef4444" />
                            <path d="M20 15L30 25L35 25L30 15H20Z" fill="#ef4444" />
                            <rect x="54" y="8" width="2" height="14" fill="#ef4444" />
                        </svg>
                    </motion.div>
                </motion.div>

                {/* Multiplier Display */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <AnimatePresence mode="wait">
                        {gameState === 'crashed' ? (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-center"
                            >
                                <h2 className="text-red-500 text-6xl sm:text-8xl font-black italic tracking-tighter uppercase mb-2">FLEET CRASHED</h2>
                                <p className="text-red-500/50 font-black uppercase tracking-[4px] text-xs font-['Inter']">Lost at {multiplier.toFixed(2)}x</p>
                            </motion.div>
                        ) : (
                            <div className="relative">
                                <motion.div
                                    className={`text-7xl sm:text-[120px] font-black tracking-tighter leading-none transition-colors duration-300 drop-shadow-[0_0_40px_rgba(255,255,255,0.2)] text-white`}
                                >
                                    {multiplier.toFixed(2)}x
                                </motion.div>
                                <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Betting Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bets.map((bet, i) => (
                    <div key={i} className="bg-[#111] border border-white/5 rounded-[24px] p-4 sm:p-6 space-y-4">
                        {/* Bet/Auto Tabs */}
                        <div className="flex bg-black/40 p-1 rounded-xl w-fit mx-auto">
                            <button className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${!bet.isAuto ? 'bg-[#222] text-white' : 'text-zinc-500'}`}>Bet</button>
                            <button className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${bet.isAuto ? 'bg-[#222] text-white' : 'text-zinc-500'}`}>Auto</button>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Amount Controls */}
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between bg-black/40 rounded-xl p-2 border border-white/5">
                                    <button onClick={() => handleBetAmount(i, -10)} className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"><Minus size={16} /></button>
                                    <span className="text-lg font-black italic">{bet.amount}.00</span>
                                    <button onClick={() => handleBetAmount(i, 10)} className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"><Plus size={16} /></button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {[100, 200, 500, 1000].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setBets(prev => prev.map((b, idx) => idx === i ? { ...b, amount: val } : b))}
                                            className="py-1 bg-black/40 border border-white/5 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-white"
                                        >{val}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Main Bet Button */}
                            {gameState === 'flying' && bet.active && !bet.cashedOut ? (
                                <button
                                    onClick={() => handleCashOut(i)}
                                    className="flex-1 py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all"
                                >
                                    <span className="text-xs font-black uppercase">Cash Out</span>
                                    <span className="text-xl font-black italic">₹{(bet.amount * multiplier).toFixed(2)}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => placeBet(i)}
                                    disabled={bet.active}
                                    className="flex-1 py-6 bg-[#28a745] hover:bg-[#218838] text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_0_30px_rgba(40,167,69,0.3)] transition-all disabled:opacity-50"
                                >
                                    <span className="text-xs font-black uppercase">Bet</span>
                                    <span className="text-xl font-black italic">{bet.amount}.00 INR</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CrashGame;
