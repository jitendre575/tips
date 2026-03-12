import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const CrashGame = ({ onBet, onWin, onLoss, isMuted, settings }) => {
    const [betAmount, setBetAmount] = useState(10);
    const [autoCashout, setAutoCashout] = useState(2.00);
    const [mode, setMode] = useState('manual');
    const [multiplier, setMultiplier] = useState(1.00);
    const [gameState, setGameState] = useState('idle'); // idle, starting, flying, crashed
    const [crashPoint, setCrashPoint] = useState(0);
    const [history, setHistory] = useState([]);
    const [betPlaced, setBetPlaced] = useState(false);
    const [cashedOut, setCashedOut] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [profitOnWin, setProfitOnWin] = useState(0);

    const multiplierRef = useRef(1.00);
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Trail points for graph
    const [trailPoints, setTrailPoints] = useState([]);

    const sounds = {
        crash: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
        win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
        bet: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
    };

    const playSound = (type) => {
        if (isMuted) return;
        const a = new Audio(sounds[type]);
        a.volume = 0.2;
        a.play().catch(() => {});
    };

    const generateCrashPoint = () => {
        if (settings?.rigNextCrash && settings?.forceCrashPoint) return settings.forceCrashPoint;
        if (settings?.rigCrashRange2_4x) return 2.00 + Math.random() * 2.00;
        const houseEdge = (settings?.houseEdge || 1) / 100;
        const r = Math.random();
        let crash = (1 - houseEdge) / (1 - r);
        crash = Math.max(1.01, crash);
        if (settings?.autoMaxCrashLimit && settings.autoMaxCrashLimit > 1.01 && crash > settings.autoMaxCrashLimit) {
            return settings.autoMaxCrashLimit;
        }
        return crash;
    };

    useEffect(() => {
        setProfitOnWin(Math.floor(betAmount * autoCashout) - betAmount);
    }, [betAmount, autoCashout]);

    const placeBet = async () => {
        if (betPlaced || gameState === 'flying') return;
        const success = await onBet(betAmount);
        if (!success) return;
        setBetPlaced(true);
        setCashedOut(false);
        playSound('bet');
        if (gameState === 'idle' || gameState === 'crashed') {
            startGame();
        }
    };

    const startGame = () => {
        setGameState('starting');
        setMultiplier(1.00);
        multiplierRef.current = 1.00;
        setTrailPoints([]);
        setElapsedTime(0);

        setTimeout(() => {
            const finalCrash = generateCrashPoint();
            setCrashPoint(finalCrash);
            setGameState('flying');
            startTimeRef.current = Date.now();
            startFlight(finalCrash);
        }, 2000);
    };

    const startFlight = (finalCrash) => {
        const startTime = Date.now();
        timerRef.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const nextMultiplier = Math.pow(Math.E, 0.08 * elapsed);
            setElapsedTime(elapsed);

            // Auto cashout check
            if (betPlaced && !cashedOut && autoCashout > 0 && nextMultiplier >= autoCashout) {
                handleCashOut();
            }

            if (nextMultiplier >= finalCrash) {
                clearInterval(timerRef.current);
                setMultiplier(finalCrash);
                multiplierRef.current = finalCrash;
                setGameState('crashed');
                playSound('crash');
                setHistory(prev => [{ val: finalCrash, time: Date.now() }, ...prev].slice(0, 15));

                if (betPlaced && !cashedOut) {
                    onLoss(betAmount);
                    toast.error(`Crashed at ${finalCrash.toFixed(2)}x`, { icon: '💥' });
                }
                setBetPlaced(false);
                setCashedOut(false);
            } else {
                setMultiplier(nextMultiplier);
                multiplierRef.current = nextMultiplier;
                // Build trail
                setTrailPoints(prev => [...prev, { time: elapsed, mult: nextMultiplier }]);
            }
        }, 50);
    };

    const handleCashOut = () => {
        if (gameState !== 'flying' || !betPlaced || cashedOut) return;
        const winAmount = Math.floor(betAmount * multiplierRef.current);
        onWin(winAmount);
        playSound('win');
        setCashedOut(true);
        toast.success(`Cashed out at ${multiplierRef.current.toFixed(2)}x! +₹${winAmount}`, { icon: '💰' });
    };

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // ---- Graph calculations ----
    const graphMaxTime = Math.max(elapsedTime, 10);
    const graphMaxMult = Math.max(multiplier, 2);

    // Y-axis labels
    const yLabels = [];
    const yStep = graphMaxMult <= 2 ? 0.2 : graphMaxMult <= 5 ? 0.6 : graphMaxMult <= 10 ? 1.0 : 2.0;
    for (let v = 1.0; v <= graphMaxMult + yStep; v += yStep) {
        yLabels.push(v);
    }

    // X-axis labels
    const xLabels = [];
    const xStep = graphMaxTime <= 10 ? 2 : graphMaxTime <= 30 ? 5 : 10;
    for (let t = xStep; t <= graphMaxTime; t += xStep) {
        xLabels.push(t);
    }

    // Convert trail to SVG path
    const toSvgX = (t) => 60 + ((t / graphMaxTime) * 440);
    const toSvgY = (m) => 280 - (((m - 1) / (graphMaxMult - 0.8)) * 240);

    const buildPath = () => {
        if (trailPoints.length < 2) return '';
        let d = `M ${toSvgX(0)} ${toSvgY(1)}`;
        trailPoints.forEach(p => {
            d += ` L ${toSvgX(p.time)} ${toSvgY(p.mult)}`;
        });
        return d;
    };

    const buildFillPath = () => {
        if (trailPoints.length < 2) return '';
        let d = `M ${toSvgX(0)} ${toSvgY(1)}`;
        trailPoints.forEach(p => {
            d += ` L ${toSvgX(p.time)} ${toSvgY(p.mult)}`;
        });
        const lastP = trailPoints[trailPoints.length - 1];
        d += ` L ${toSvgX(lastP.time)} 280 L ${toSvgX(0)} 280 Z`;
        return d;
    };

    const lastPoint = trailPoints.length > 0 ? trailPoints[trailPoints.length - 1] : null;

    return (
        <div className="flex flex-col lg:flex-row overflow-hidden" style={{ background: '#1a2c38' }}>
            {/* ====== LEFT SIDEBAR ====== */}
            <div className="w-full lg:w-[260px] xl:w-[280px] p-3 sm:p-4 flex flex-col gap-3 border-r border-[#0f212e] order-2 lg:order-1" style={{ background: '#213743' }}>
                {/* Manual / Auto */}
                <div className="bg-[#0f212e] p-1 rounded-full flex">
                    <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${mode === 'manual' ? 'bg-[#2f4553] text-white' : 'text-[#b1bad3]'}`}
                    >Manual</button>
                    <button
                        onClick={() => setMode('auto')}
                        className={`flex-1 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all ${mode === 'auto' ? 'bg-[#2f4553] text-white' : 'text-[#b1bad3]'}`}
                    >Auto</button>
                </div>

                {/* Bet Amount */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[#b1bad3] text-[11px] font-semibold px-0.5">
                        <span>Bet Amount</span>
                        <span>₹{(betAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex bg-[#0f212e] border-2 border-[#2f4553] rounded h-[40px] overflow-hidden hover:border-[#557086] transition-colors">
                        <input
                            type="number"
                            value={betAmount === 0 ? '' : betAmount}
                            onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            disabled={betPlaced}
                            className="flex-1 bg-transparent px-3 text-white font-bold outline-none text-sm"
                            placeholder="0.00"
                        />
                        <div className="flex items-center px-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm">₹</div>
                        </div>
                        <div className="flex bg-[#2f4553]">
                            <button onClick={() => setBetAmount(prev => Math.max(1, Math.floor(prev / 2)))} className="px-2.5 text-white font-bold hover:bg-[#3b5568] transition-colors border-r border-[#0f212e] text-xs">½</button>
                            <button onClick={() => setBetAmount(prev => prev * 2)} className="px-2.5 text-white font-bold hover:bg-[#3b5568] transition-colors text-xs">2×</button>
                        </div>
                    </div>
                </div>

                {/* Cashout At */}
                <div className="space-y-1">
                    <div className="text-[#b1bad3] text-[11px] font-semibold px-0.5">Cashout At</div>
                    <div className="flex bg-[#0f212e] border-2 border-[#2f4553] rounded h-[40px] overflow-hidden hover:border-[#557086] transition-colors">
                        <input
                            type="number"
                            step="0.01"
                            value={autoCashout}
                            onChange={(e) => setAutoCashout(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
                            className="flex-1 bg-transparent px-3 text-white font-bold outline-none text-sm"
                        />
                        <div className="flex bg-[#2f4553]">
                            <button onClick={() => setAutoCashout(prev => Math.max(1.01, prev - 0.1))} className="px-2 text-white hover:bg-[#3b5568] transition-colors border-r border-[#0f212e]">
                                <ChevronDown size={14} />
                            </button>
                            <button onClick={() => setAutoCashout(prev => prev + 0.1)} className="px-2 text-white hover:bg-[#3b5568] transition-colors">
                                <ChevronUp size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bet Button */}
                <button
                    onClick={gameState === 'flying' && betPlaced && !cashedOut ? handleCashOut : placeBet}
                    disabled={gameState === 'starting'}
                    className={`w-full py-3.5 rounded font-black text-sm transition-all active:translate-y-0.5 disabled:opacity-50 ${
                        gameState === 'flying' && betPlaced && !cashedOut
                            ? 'bg-[#f59e0b] text-black shadow-[0_4px_0_#b45309] hover:bg-[#fbbf24]'
                            : 'bg-[#00e701] text-[#05200a] shadow-[0_4px_0_rgb(0,180,1)] hover:bg-[#1fff20]'
                    }`}
                >
                    {gameState === 'starting'
                        ? 'Starting...'
                        : gameState === 'flying' && betPlaced && !cashedOut
                            ? <><span>Cash Out</span><br/><span className="text-base">₹{Math.floor(betAmount * multiplier).toLocaleString()}</span></>
                            : 'Bet (Next Round)'}
                </button>

                {/* Profit on Win */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[#b1bad3] text-[11px] font-semibold px-0.5">
                        <span>Profit on Win</span>
                        <span>₹{profitOnWin.toFixed(2)}</span>
                    </div>
                    <div className="flex bg-[#0f212e] border-2 border-[#2f4553] rounded h-[40px] overflow-hidden">
                        <input
                            type="text"
                            value={profitOnWin.toFixed(2)}
                            readOnly
                            className="flex-1 bg-transparent px-3 text-white/60 font-bold outline-none text-sm"
                        />
                        <div className="flex items-center px-1.5">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm">₹</div>
                        </div>
                    </div>
                </div>

                {/* Bottom Info */}
                <div className="mt-auto bg-[#0f212e] rounded p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#b1bad3]">
                        <span>👥</span>
                        <span className="font-bold">239</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#b1bad3]">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-[8px] font-black text-white">₹</div>
                        <span className="font-bold">24,831.58</span>
                        <ChevronDown size={12} />
                    </div>
                </div>
            </div>

            {/* ====== MAIN GRAPH AREA ====== */}
            <div className="flex-1 flex flex-col order-1 lg:order-2" style={{ background: '#0f212e', minHeight: '350px' }}>
                {/* History ribbon */}
                <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar">
                    {history.map((h, i) => (
                        <span key={i} className={`px-2.5 py-1 rounded-full text-[11px] font-black shrink-0 ${
                            h.val >= 2
                                ? 'bg-[#00e701] text-[#05200a]'
                                : 'bg-[#2f4553] text-[#b1bad3]'
                        }`}>
                            {h.val.toFixed(2)}×
                        </span>
                    ))}
                    {history.length > 0 && (
                        <button className="p-1.5 bg-[#2f4553] rounded-full text-[#b1bad3] hover:text-white transition-colors shrink-0 ml-auto">
                            <RefreshCw size={12} />
                        </button>
                    )}
                </div>

                {/* Graph */}
                <div className="flex-1 relative px-2 pb-2">
                    <svg className="w-full h-full" viewBox="0 0 520 310" preserveAspectRatio="xMidYMid meet">
                        {/* Y-axis labels */}
                        {yLabels.map((v, i) => {
                            const y = toSvgY(v);
                            if (y < 10 || y > 290) return null;
                            return (
                                <g key={`y-${i}`}>
                                    <line x1="55" y1={y} x2="500" y2={y} stroke="#2f4553" strokeWidth="0.5" strokeDasharray="3,3" />
                                    <text x="48" y={y + 4} fill="#557086" fontSize="10" fontWeight="700" textAnchor="end">
                                        {v.toFixed(1)}×
                                    </text>
                                </g>
                            );
                        })}

                        {/* X-axis labels */}
                        {xLabels.map((t, i) => {
                            const x = toSvgX(t);
                            if (x > 500) return null;
                            return (
                                <text key={`x-${i}`} x={x} y={298} fill="#557086" fontSize="10" fontWeight="700" textAnchor="middle">
                                    {t}s
                                </text>
                            );
                        })}

                        {/* Baseline */}
                        <line x1="60" y1="280" x2="500" y2="280" stroke="#2f4553" strokeWidth="1" />
                        <line x1="60" y1="30" x2="60" y2="280" stroke="#2f4553" strokeWidth="1" />

                        {/* Fill area under curve */}
                        {trailPoints.length >= 2 && (
                            <path
                                d={buildFillPath()}
                                fill={gameState === 'crashed' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.6)'}
                            />
                        )}

                        {/* Curve line */}
                        {trailPoints.length >= 2 && (
                            <path
                                d={buildPath()}
                                stroke={gameState === 'crashed' ? '#ef4444' : 'white'}
                                strokeWidth="3"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        )}

                        {/* Tip dot */}
                        {lastPoint && gameState === 'flying' && (
                            <circle
                                cx={toSvgX(lastPoint.time)}
                                cy={toSvgY(lastPoint.mult)}
                                r="5"
                                fill="white"
                                className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                            >
                                <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite" />
                            </circle>
                        )}

                        {/* Total time */}
                        {elapsedTime > 0 && (
                            <text x="495" y={298} fill="#557086" fontSize="9" fontWeight="700" textAnchor="end">
                                Total {elapsedTime.toFixed(0)}s
                            </text>
                        )}
                    </svg>

                    {/* Multiplier overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <AnimatePresence mode="wait">
                            {gameState === 'crashed' ? (
                                <motion.div
                                    key="crashed"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center"
                                >
                                    <div className="text-5xl sm:text-7xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                                        {multiplier.toFixed(2)}×
                                    </div>
                                    <p className="text-red-400/50 text-xs font-bold uppercase tracking-[3px] mt-1">Crashed</p>
                                </motion.div>
                            ) : gameState === 'starting' ? (
                                <motion.div
                                    key="starting"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                >
                                    <p className="text-white/50 text-xl font-black uppercase tracking-[6px]">Starting...</p>
                                </motion.div>
                            ) : gameState === 'flying' ? (
                                <motion.div
                                    key="flying"
                                    className="text-center"
                                >
                                    <div className="text-5xl sm:text-8xl font-black text-white tracking-tighter">
                                        {multiplier.toFixed(2)}
                                        <span className="text-3xl sm:text-5xl text-white/60">×</span>
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-[#557086] text-sm font-bold uppercase tracking-[4px]">Place a bet</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Network status */}
                    <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
                        <span className="text-[#557086] text-[9px] font-bold">Network Status</span>
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrashGame;
