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
            if (d.exists()) setCasinoSettings(d.data());
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
        <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in duration-500 pb-10 pt-2 px-2 sm:px-4">
            {/* Game Header - REMOVED FOR ALL GAMES */}

            {/* Game Layout Wrapper */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
                {/* Main Game Interface */}
                <div className="lg:col-span-12 relative">
                    {/* Floating Sound Toggle */}
                    <div className="absolute top-4 right-4 z-50">
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white transition-all active:scale-90"
                        >
                            {isMuted ? <VolumeX size={20} className="text-red-500" /> : <Volume2 size={20} className="text-emerald-500" />}
                        </button>
                    </div>
                    {renderGame()}
                </div>
            </div>

            {/* Game Footer Info */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[32px] flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-4">
                        <Zap size={24} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Provably Fair</h4>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">All game results are generated using cryptographically secure random number generators.</p>
                </div>
                <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[32px] flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
                        <Trophy size={24} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">High RTP</h4>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">Our originals offer a 99% return-to-player rate, giving you the best odds in the arena.</p>
                </div>
                <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[32px] flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4">
                        <History size={24} />
                    </div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-2">Instant Payout</h4>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">Winnings are credited to your virtual wallet immediately after a successful round.</p>
                </div>
            </div>
        </div>
    );
};

export default CasinoGame;
