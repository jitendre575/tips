import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Zap, Shield, Volume2, Headphones, Trophy, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CrashGame = () => {
    const { user, userData } = useAuth();
    const navigate = useNavigate();
    const [gameState, setGameState] = useState(null);
    const [currentMultiplier, setCurrentMultiplier] = useState(1.00);
    const [betAmount, setBetAmount] = useState(10);
    const [targetMultiplier, setTargetMultiplier] = useState(2.00);
    const [hasPlacedBet, setHasPlacedBet] = useState(false);
    const [isCashedOut, setIsCashedOut] = useState(false);
    const [winAmount, setWinAmount] = useState(0);
    const [tab, setTab] = useState('MANUAL');
    
    const gameId = "global_crash";
    const gameRef = doc(db, 'games', gameId);

    // Main Snapshot Listener
    useEffect(() => {
        const unsubscribe = onSnapshot(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                setGameState(snapshot.data());
            } else {
                setDoc(gameRef, { multiplier: 1.00, status: 'waiting', startTime: Date.now(), crashPoint: 2.00, history: [] });
            }
        });
        return () => unsubscribe();
    }, []);

    // Animation Loop for Smooth Multiplier
    useEffect(() => {
        if (!gameState || gameState.status !== 'running') return;
        const interval = setInterval(() => {
            const elapsed = Date.now() - gameState.startTime;
            const multiplier = Math.pow(1.07, elapsed / 1000);
            if (multiplier >= gameState.crashPoint) {
                setCurrentMultiplier(gameState.crashPoint);
                clearInterval(interval);
            } else {
                setCurrentMultiplier(multiplier);
            }
        }, 33);
        return () => clearInterval(interval);
    }, [gameState]);

    // Continuous Loop Controller (The Auto-Host Logic)
    useEffect(() => {
        if (!gameState) return;
        const checkCycle = async () => {
            const now = Date.now();
            
            // 1. If Waiting -> Start Round (Reduced wait to 6s for faster pace)
            if (gameState.status === 'waiting' && (now - gameState.startTime) >= 6000) {
                // Generate Dynamic Crash Point
                const r = Math.random();
                const crashPoint = r < 0.1 ? (1.00 + Math.random() * 0.1) : (1 + Math.pow(Math.random() * 3, 2.8));
                const finalCrashPoint = parseFloat(Number(crashPoint).toFixed(2));
                
                await updateDoc(gameRef, { 
                    status: 'running', 
                    startTime: now, 
                    crashPoint: finalCrashPoint
                });
            }

            // 2. If Running -> Crash check
            if (gameState.status === 'running') {
                const elapsed = now - gameState.startTime;
                const currentMult = Math.pow(1.07, elapsed / 1000);
                
                if (currentMult >= gameState.crashPoint) {
                    await updateDoc(gameRef, { 
                        status: 'crashed', 
                        startTime: now, 
                        history: [...(gameState.history || []).slice(-15), gameState.crashPoint] 
                    });
                    
                    // Trigger return to waiting after 3s
                    setTimeout(() => {
                        updateDoc(gameRef, { status: 'waiting', startTime: Date.now() });
                    }, 3000);
                }
            }
        };

        const timer = setInterval(checkCycle, 1000);
        return () => clearInterval(timer);
    }, [gameState]);

    // Handle Auto-Cashout during run
    useEffect(() => {
        if (hasPlacedBet && !isCashedOut && gameState?.status === 'running' && currentMultiplier >= targetMultiplier) {
            handleCashOut();
        }
    }, [currentMultiplier, hasPlacedBet, isCashedOut, gameState, targetMultiplier]);

    const handlePlaceBet = async () => {
        if (!userData || userData.balance < betAmount) return toast.error("Low Balance");
        if (gameState.status !== 'waiting') return toast.error("Wait for next round");
        const { increment } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.uid), { balance: increment(-betAmount) });
        setHasPlacedBet(true);
        setIsCashedOut(false);
        toast.success("Bet Placed!");
    };

    const handleCashOut = async () => {
        if (!hasPlacedBet || isCashedOut || gameState.status !== 'running') return;
        const reward = Math.floor(betAmount * currentMultiplier);
        setIsCashedOut(true);
        const { increment } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.uid), { balance: increment(reward) });
        setWinAmount(reward);
        toast.success(`Win: ₹${reward}!`);
        setHasPlacedBet(false);
    };

    if (!gameState) return <div className="min-h-screen bg-[#0d1b26] flex items-center justify-center text-white">Connecting...</div>;

    return (
        <div className="w-full flex flex-col font-['Outfit'] text-white pb-32 max-w-lg mx-auto">
            {/* Round History Band */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-3 px-1">
                {gameState.history && [...gameState.history].reverse().map((h, i) => (
                    <div key={i} className={`px-3 py-1.5 rounded-full text-[9px] font-black italic shrink-0 border border-white/5 ${h > 1.8 ? 'bg-[#00e701] text-black shadow-[0_0_10px_rgba(0,231,1,0.2)]' : 'bg-[#2f4553] text-[#b1bad3]'}`}>
                        {h.toFixed(2)}x
                    </div>
                ))}
            </div>

            {/* Arena Visuals */}
            <div className="relative aspect-[16/11] bg-[#0a1219] overflow-hidden border border-white/5 rounded-[4px] shadow-2xl">
                <div className="absolute top-4 right-4 z-40 opacity-50"><Volume2 size={16} /></div>
                
                <div className="absolute inset-0 flex">
                    <div className="w-12 h-full flex flex-col-reverse justify-between py-10 px-2 border-r border-white/5 opacity-10 text-[8px] font-bold text-zinc-500">
                         {['1.0', '1.2', '1.4', '1.6', '1.8', '2.0'].map(v => <span key={v}>{v}</span>)}
                    </div>
                    <div className="flex-1 relative">
                        <div className="absolute bottom-0 inset-x-0 h-10 flex justify-between items-center px-10 opacity-10 text-[8px] font-bold text-zinc-500">
                            {['2s', '4s', '6s', '8s', '10s'].map(v => <span key={v}>{v}</span>)}
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                {gameState.status === 'waiting' ? (
                                    <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                                        <h3 className="text-2xl font-black italic text-zinc-600 tracking-[8px] uppercase">Place A Bet</h3>
                                        <div className="mt-4 text-[10px] font-black text-zinc-500 uppercase">Starts in {Math.max(0, (6 - (Date.now() - gameState.startTime)/1000)).toFixed(0)}s</div>
                                    </motion.div>
                                ) : gameState.status === 'running' ? (
                                    <motion.div key="run" initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-8xl font-[1000] italic text-white drop-shadow-2xl">
                                        {currentMultiplier.toFixed(2)}x
                                    </motion.div>
                                ) : (
                                    <motion.div key="crash" initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-center">
                                        <span className="text-8xl font-[1000] italic text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.4)]">{gameState.crashPoint.toFixed(2)}x</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {gameState.status === 'running' && (
                            <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d={`M 0,100 Q 20,95 ${Math.min(90, (currentMultiplier-1)*20)},${Math.max(15, 100-(currentMultiplier-1)*20)}`} fill="none" stroke="#00e701" strokeWidth="2.5" />
                                <circle cx={`${Math.min(90, (currentMultiplier-1)*20)}`} cy={`${Math.max(15, 100-(currentMultiplier-1)*20)}`} r="1.5" fill="white" className="drop-shadow-[0_0_10px_#fff]" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            {/* Betting Controls */}
            <div className="bg-[#1a2c38] p-6 space-y-6 rounded-b-[4px]">
                <div className="bg-[#0a1219] p-1 rounded-[4px] flex">
                    {['MANUAL', 'AUTO'].map(m => (
                        <button key={m} onClick={() => setTab(m)} className={`flex-1 py-3 text-[10px] font-black tracking-widest rounded-[2px] ${tab === m ? 'bg-[#2f4553] text-white' : 'text-zinc-500'}`}>{m}</button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Bet Amount</label>
                        <div className="flex bg-[#0d161d] border border-[#2f4553] rounded-[4px] h-12">
                            <input type="number" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value)||0)} className="flex-1 bg-transparent px-4 font-black italic text-white focus:outline-none" />
                            <button onClick={() => setBetAmount(Math.max(1, Math.floor(betAmount/2)))} className="px-3 border-l border-[#2f4553] text-[9px] font-black text-zinc-400 font-['Inter']">½</button>
                            <button onClick={() => setBetAmount(betAmount*2)} className="px-3 border-l border-[#2f4553] text-[9px] font-black text-zinc-400 font-['Inter']">2×</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-zinc-500 ml-1">Cashout At</label>
                        <div className="flex bg-[#0d161d] border border-[#2f4553] rounded-[4px] h-12">
                            <input type="number" step="0.1" value={targetMultiplier} onChange={e => setTargetMultiplier(parseFloat(e.target.value)||1.01)} className="flex-1 bg-transparent px-4 font-black italic text-white focus:outline-none" />
                            <button onClick={() => setTargetMultiplier(v => Math.max(1.01, v - 0.1))} className="w-10 border-l border-[#2f4553] flex items-center justify-center text-zinc-400"><ChevronDown size={16} /></button>
                            <button onClick={() => setTargetMultiplier(v => v + 0.1)} className="w-10 border-l border-[#2f4553] flex items-center justify-center text-zinc-400"><ChevronUp size={16} /></button>
                        </div>
                    </div>
                </div>

                {gameState.status === 'waiting' && !hasPlacedBet ? (
                    <button onClick={handlePlaceBet} className="w-full py-5 bg-[#00e701] text-black font-black uppercase italic tracking-[8px] text-lg rounded-[4px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Bet</button>
                ) : hasPlacedBet && !isCashedOut && gameState.status === 'running' ? (
                    <button onClick={handleCashOut} className="w-full py-5 bg-orange-500 text-white font-black uppercase italic text-lg rounded-[4px] shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                        <div className="text-[9px] mb-[-2px] tracking-[2px] opacity-80 uppercase">Take Profit</div>
                        ₹{(betAmount * currentMultiplier).toFixed(2)}
                    </button>
                ) : (
                    <button className="w-full py-5 bg-[#2f4553] text-[#b1bad3] font-black uppercase italic tracking-[4px] text-lg rounded-[4px] opacity-50 cursor-not-allowed">
                        {isCashedOut ? `Won ₹${winAmount}` : (hasPlacedBet ? 'Bet Placed' : 'Waiting...')}
                    </button>
                )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-3 gap-3 mt-6">
                {[{i:Shield,t:'Fair',c:'text-[#00e701]'},{i:Zap,t:'Payout',c:'text-amber-500'},{i:Headphones,t:'Support',c:'text-blue-500'}].map((x,i)=>(
                    <div key={i} className="bg-[#1a2c38] p-4 rounded-[4px] flex flex-col items-center border border-white/5">
                        <x.i size={20} className={`${x.c} mb-3`} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#b1bad3]">{x.t}</span>
                    </div>
                ))}
            </div>

            {/* VIP Rewards Banner */}
            <div className="mt-4 bg-[#1a2c38] p-5 rounded-[4px] border border-white/5 flex items-center justify-between shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-tr from-orange-400 to-red-600 rounded-[8px] flex items-center justify-center text-white"><Trophy size={24} /></div>
                    <div className="space-y-0.5">
                        <h4 className="text-[10px] font-black italic uppercase tracking-tight text-white">VIP Rewards Program</h4>
                        <p className="text-[8px] text-zinc-500 font-medium">Earn points with every bet placed!</p>
                    </div>
                </div>
                <button className="px-5 py-2.5 bg-[#00e701] text-black text-[9px] font-black uppercase tracking-widest rounded-full">Explore</button>
            </div>

            {/* Lobby Link */}
            <button onClick={() => navigate('/dashboard')} className="w-full py-8 text-zinc-600 text-[10px] font-black uppercase tracking-[4px] flex items-center justify-center gap-2">
                <RotateCcw size={12} /> Back to Game Lobby
            </button>
        </div>
    );
};

export default CrashGame;
