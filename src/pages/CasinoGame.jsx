import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Wallet, Info, Zap, Trophy, TrendingUp, History, Gamepad2, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Individual Game Components
import MinesGame from '../components/games/MinesGame';
import DiceGame from '../components/games/DiceGame';
import SlotGame from '../components/games/SlotGame';
import CrashGame from '../components/games/CrashGame';
import ColorGame from '../components/games/ColorGame';
import ChickenRoadGame from '../components/games/ChickenRoadGame';
import PlinkoGame from '../components/games/PlinkoGame';

const CasinoGame = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const { userData, user } = useAuth();
    const [betAmount, setBetAmount] = useState(100);
    const [isGameActive, setIsGameActive] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [casinoSettings, setCasinoSettings] = useState({
        houseEdge: 1,
        activeGames: ['mines', 'dice', 'crash', 'color', 'chicken', 'plinko']
    });

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'casino'), d => {
            if (d.exists()) {
                const data = d.data();
                // Ensure plinko is always in activeGames
                if (data.activeGames && !data.activeGames.includes('plinko')) {
                    data.activeGames = [...data.activeGames, 'plinko'];
                }
                setCasinoSettings(data);
            }
        });
        return () => unsub();
    }, []);

    // Game data mapping
    const games = {
        mines: { name: 'Mines', provider: 'ORIGINALS', color: 'bg-emerald-500' },
        dice: { name: 'Dice', provider: 'ORIGINALS', color: 'bg-indigo-500' },
        plinko: { name: 'Plinko', provider: 'ORIGINALS', color: 'bg-pink-500' },
        crash: { name: 'Crash', provider: 'ORIGINALS', color: 'bg-orange-500' },
        limbo: { name: 'Limbo', provider: 'ORIGINALS', color: 'bg-cyan-500' },
        hilo: { name: 'Hilo', provider: 'ORIGINALS', color: 'bg-purple-500' },
        bonanza: { name: 'Sweet Bonanza', provider: 'PRAGMATIC', color: 'bg-pink-400' },
        olympus: { name: 'Gates of Olympus', provider: 'PRAGMATIC', color: 'bg-blue-400' },
        fisherman: { name: 'Le Fisherman', provider: 'HACKSAW', color: 'bg-emerald-400' },
        color: { name: 'Color Prediction', provider: 'ORIGINALS', color: 'bg-yellow-500' },
        chicken: { name: 'Chicken 2 Road', provider: 'ORIGINALS', color: 'bg-emerald-500' },
    };

    const currentGame = games[gameId] || { name: 'Unknown Game', provider: 'ORIGINALS', color: 'bg-zinc-500' };

    const handleBet = async (amount) => {
        if (amount > userData.balance) {
            toast.error('Insufficient balance!');
            return false;
        }

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                balance: increment(-amount)
            });
            return true;
        } catch (error) {
            console.error('Bet failed:', error);
            toast.error('Connection error!');
            return false;
        }
    };

    const handleWin = async (payout) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                balance: increment(payout)
            });

            // Record in history
            await addDoc(collection(db, 'history'), {
                userId: user.uid,
                type: 'casino_win',
                amount: payout,
                game: currentGame.name,
                status: 'success',
                createdAt: serverTimestamp()
            });

            toast.success(`YOU WON ₹${payout}!`, {
                icon: '🎰',
                style: {
                    background: '#10b981',
                    color: '#fff',
                    fontWeight: 'bold'
                }
            });
        } catch (error) {
            console.error('Win update failed:', error);
        }
    };

    const handleLoss = async (amount) => {
        try {
            // Record in history
            await addDoc(collection(db, 'history'), {
                userId: user.uid,
                type: 'casino_loss',
                amount: amount,
                game: currentGame.name,
                status: 'loss',
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Loss record failed:', error);
        }
    };

    const renderGame = () => {
        if (!casinoSettings.activeGames.includes(gameId)) {
            return (
                <div className="flex flex-col items-center justify-center h-[500px] bg-zinc-900 shadow-2xl rounded-[40px] border border-red-500/20 text-center p-10">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6 animate-pulse">
                        <ShieldAlert size={40} />
                    </div>
                    <h2 className="text-3xl font-[1000] italic uppercase tracking-tighter text-white mb-2">MAINTENANCE <span className="text-red-500">MODE</span></h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs max-w-sm">This game is temporarily undergoing algorithm optimization. Check back soon!</p>
                    <button onClick={() => navigate('/dashboard')} className="mt-10 px-10 py-4 bg-zinc-800 hover:bg-white text-zinc-400 hover:text-black rounded-2xl font-black uppercase text-[10px] tracking-[4px] transition-all">LOBBY RECALL</button>
                </div>
            );
        }

        switch (gameId) {
            case 'mines':
                return <MinesGame onBet={handleBet} onWin={handleWin} onLoss={handleLoss} isMuted={isMuted} settings={casinoSettings} />;
            case 'dice':
                return <DiceGame onBet={handleBet} onWin={handleWin} onLoss={handleLoss} isMuted={isMuted} settings={casinoSettings} />;
            case 'plinko':
                return <PlinkoGame onBet={handleBet} onWin={handleWin} onLoss={handleLoss} isMuted={isMuted} settings={casinoSettings} />;
            case 'bonanza':
            case 'olympus':
            case 'fisherman':
                return <SlotGame gameId={gameId} onBet={handleBet} onWin={handleWin} onLoss={handleLoss} isMuted={isMuted} />;
            case 'crash':
                return <CrashGame onBet={handleBet} onWin={handleWin} onLoss={handleLoss} isMuted={isMuted} settings={casinoSettings} />;
            case 'color':
                return <ColorGame onBet={handleBet} onWin={handleWin} onLoss={handleLoss} isMuted={isMuted} settings={casinoSettings} />;
            case 'chicken':
                return <ChickenRoadGame onBet={handleBet} onWin={handleWin} onLoss={handleLoss} isMuted={isMuted} settings={casinoSettings} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-[500px] bg-zinc-900/50 rounded-[40px] border border-white/5 border-dashed">
                        <Gamepad2 size={64} className="text-zinc-800 mb-6" />
                        <h2 className="text-2xl font-black italic uppercase text-zinc-700">{currentGame.name} Coming Soon</h2>
                        <p className="text-zinc-600 font-medium mt-2">We are fine-tuning the algorithms for maximum fairness.</p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mt-8 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-xs transition-all"
                        >
                            Back to Lobby
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="animate-in fade-in duration-500" style={{ background: '#0f212e', minHeight: '100vh' }}>
            {/* Game Layout - No padding, full bleed */}
            <div className="relative">
                {/* Floating Sound Toggle */}
                <div className="absolute top-3 right-3 z-50">
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2.5 bg-[#2f4553]/80 hover:bg-[#2f4553] backdrop-blur-md rounded-xl border border-white/10 text-white transition-all active:scale-90"
                    >
                        {isMuted ? <VolumeX size={18} className="text-red-400" /> : <Volume2 size={18} className="text-emerald-400" />}
                    </button>
                </div>
                {renderGame()}
            </div>

            {/* ====== BOTTOM ENGAGEMENT SECTION ====== */}
            <div className="px-4 sm:px-6 pb-8 pt-6 space-y-4" style={{ background: '#0f212e' }}>
                {/* Info Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="bg-[#213743] rounded-lg p-3 sm:p-4 text-center border border-[#2f4553]/30">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg bg-[#00e701]/10 flex items-center justify-center mb-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#00e701]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                        </div>
                        <p className="text-[9px] sm:text-[11px] font-bold text-white/90 mb-0.5">Provably Fair</p>
                        <p className="text-[8px] sm:text-[10px] text-[#557086] leading-tight">Verified random outcomes</p>
                    </div>
                    <div className="bg-[#213743] rounded-lg p-3 sm:p-4 text-center border border-[#2f4553]/30">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg bg-[#f59e0b]/10 flex items-center justify-center mb-2">
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#f59e0b]" />
                        </div>
                        <p className="text-[9px] sm:text-[11px] font-bold text-white/90 mb-0.5">Instant Payouts</p>
                        <p className="text-[8px] sm:text-[10px] text-[#557086] leading-tight">Winnings credited instantly</p>
                    </div>
                    <div className="bg-[#213743] rounded-lg p-3 sm:p-4 text-center border border-[#2f4553]/30">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg bg-[#3b82f6]/10 flex items-center justify-center mb-2">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#3b82f6]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        </div>
                        <p className="text-[9px] sm:text-[11px] font-bold text-white/90 mb-0.5">24/7 Support</p>
                        <p className="text-[8px] sm:text-[10px] text-[#557086] leading-tight">Always here to help</p>
                    </div>
                </div>

                {/* VIP Banner */}
                <div className="relative overflow-hidden rounded-xl p-5 sm:p-6 border border-[#2f4553]/30" style={{ background: 'linear-gradient(135deg, #1a3a4a 0%, #213743 50%, #1a2c38 100%)' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#00e701]/5 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#3b82f6]/5 blur-3xl" />
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#f59e0b] to-[#ef4444] flex items-center justify-center text-white text-xl shrink-0">
                            🏆
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm sm:text-base font-black text-white mb-0.5">VIP Rewards Program</h4>
                            <p className="text-[10px] sm:text-xs text-[#7f8fa3]">Play more to unlock exclusive bonuses, cashback offers and VIP perks!</p>
                        </div>
                        <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-[#00e701] hover:bg-[#1fff20] text-[#05200a] rounded-lg text-[10px] sm:text-xs font-black transition-all active:scale-95 shrink-0">
                            Explore
                        </button>
                    </div>
                </div>

                {/* Back to Lobby */}
                <button
                    onClick={() => navigate('/dashboard?view=Casino')}
                    className="w-full py-3 bg-[#213743] hover:bg-[#2f4553] text-[#b1bad3] rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-[#2f4553]/30"
                >
                    <ArrowLeft size={14} />
                    Back to Game Lobby
                </button>
            </div>
        </div>
    );
};

export default CasinoGame;
