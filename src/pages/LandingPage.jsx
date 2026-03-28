import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy, Mail, Lock, UserPlus, LogIn, X, Home, Wallet, User, MessageCircle,
    Zap, Download, Bell, ChevronLeft, ChevronRight, Gamepad2, LayoutGrid,
    Gift, Crown, MousePointer2, Star, TrendingUp, Presentation, Activity,
    Rocket, Search, Flame, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import MatchCard from '../components/MatchCard';

const LandingPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showAuth, setShowAuth] = useState(false);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState([]);
    const [activeCategory, setActiveCategory] = useState('Lobby');
    const { user, userData, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, 'matches'), orderBy('matchTime', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const cleanError = (error) => {
        const code = error.code || '';
        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
            return "Invalid Mobile/Email or Password. Please check and try again.";
        }
        if (code === 'auth/email-already-in-use') {
            return "This Mobile Number or Email is already registered!";
        }
        if (code === 'auth/network-request-failed') {
            return "Network Error. Please check your internet connection.";
        }
        if (code === 'auth/too-many-requests') {
            return "System busy. Please wait a few moments and try again.";
        }
        // Generic cleanup for other errors
        return error.message.replace(/Firebase:|auth\/|\(|\)|Error/g, '').replace(/-/g, ' ').trim();
    };

    useEffect(() => {
        if (user && userData && !authLoading) {
            navigate('/dashboard');
        }
    }, [user, userData, authLoading, navigate]);

    if (authLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f9]">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-[6px] animate-spin"></div>
        </div>
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success('Access Granted! Entering Arena...');
                navigate('/dashboard');
            } else {
                if (!phone || phone.length < 10) {
                    toast.error("Please enter a valid 10-digit mobile number");
                    setLoading(false);
                    return;
                }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save phone to Firestore for the new user
                const { doc, setDoc } = await import('firebase/firestore');
                await setDoc(doc(db, 'users', user.uid), {
                    email: email,
                    phone: phone,
                    balance: 0,
                    totalDeposit: 0,
                    totalWithdraw: 0,
                    totalBets: 0,
                    isAdmin: false,
                    createdAt: new Date().toISOString()
                }, { merge: true });

                toast.success('Account Created! Welcome to CRICWIN.');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            toast.error(cleanError(error), {
                id: 'auth-err',
                style: {
                    background: '#121212',
                    color: '#fff',
                    border: '1px solid #ff4b4b'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { name: 'Lobby', icon: Home },
        { name: 'Mini Game', icon: Gamepad2 },
        { name: 'Slots', icon: LayoutGrid },
        { name: 'Card', icon: Presentation },
        { name: 'Fishing', icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-[#0f212e] md:py-8 flex justify-center">
            <div className="w-full max-w-[480px] bg-[#f8f9fc] min-h-screen relative shadow-2xl overflow-x-hidden md:rounded-[6px] md:border-[8px] md:border-black pb-32">
                {/* Premium Header */}
                <div className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between border-b border-black/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[6px] bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
                            <Trophy className="text-white" size={20} />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 font-black italic text-xl leading-none uppercase tracking-tighter">CRIC<span className="text-accent">WIN</span></h1>
                            <span className="text-slate-400 text-[7px] font-black tracking-[0.3em] uppercase mt-1">Global Pro Gaming</span>
                        </div>
                    </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAuth(true)}
                        className="px-6 py-3 bg-slate-900 text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95"
                    >
                        Login
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setShowAuth(true); }}
                        className="px-6 py-3 bg-accent text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 active:scale-95"
                    >
                        Join
                    </button>
                </div>
            </div>

            {/* Scrolling Notice */}
            <div className="bg-white border-b border-black/[0.02] px-4 py-2 flex items-center gap-3 overflow-hidden shadow-sm">
                <div className="flex items-center gap-1.5 text-accent font-black text-[9px] uppercase tracking-widest shrink-0 border-r border-black/[0.05] pr-3">
                    <Sparkles size={12} />
                    Alert
                </div>
                <div className="text-[9px] font-bold text-slate-500 whitespace-nowrap animate-notice flex gap-10">
                    <span>Welcome to CRICWIN Pro Arena. High-stakes predictions and instant withdrawals active.</span>
                    <span>New users get 500 bonus coins on first deposit. Verified platform protection enabled.</span>
                </div>
            </div>

            <main className="w-full">
                <div className="p-4">
                    <div className="relative aspect-[21/9] rounded-[6px] overflow-hidden shadow-2xl ring-1 ring-black/[0.05]">
                        <img
                            src="/casino_banner_promo_1772871782573.png"
                            alt="Mega Event"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                        <div className="absolute bottom-6 left-8">
                            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-[6px] border border-white/20 text-white text-[9px] font-black uppercase tracking-widest mb-2 inline-block">
                                Hot Event
                            </div>
                            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">MEGA WIN ARENA</h2>
                        </div>
                    </div>
                </div>

                {/* Promotional Banner for 3 Over Bonus */}
                <div className="px-4 mb-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="w-full bg-gradient-to-br from-[#b91c1c] via-[#dc2626] to-[#f97316] rounded-[6px] p-6 text-white relative overflow-hidden group border border-white/20 shadow-xl"
                    >
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 opacity-10 blur-sm group-hover:rotate-12 transition-transform duration-700">
                            <Zap size={180} />
                        </div>
                        
                        <div className="relative z-10 flex items-center gap-5">
                            <div className="bg-white/20 p-4 rounded-[6px] backdrop-blur-md border border-white/30 hidden sm:block">
                                <Trophy size={32} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="inline-block px-3 py-1 bg-white/20 rounded-[6px] backdrop-blur-sm border border-white/30 text-[8px] font-black uppercase tracking-[3px] text-white mb-2">
                                    Flash Offer
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase leading-none mb-2">
                                    6 Bonus now for <span className="text-[#fde047]">3 Overs!</span> 🏏
                                </h3>
                                <p className="text-[10px] sm:text-xs font-medium text-white/90 leading-relaxed max-w-sm">
                                    Winning just got easier! The Six Bonus is now extended to the <span className="font-bold underline">First 3 Overs</span> of every match.
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowAuth(true)}
                                className="px-4 py-3 bg-white text-[#b91c1c] rounded-[6px] text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform shrink-0"
                            >
                                Win Now
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Game Category Navigation */}
                <div className="px-6 mb-8 overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-3 p-1.5 bg-white rounded-[6px] border border-black/[0.05] shadow-sm w-fit mx-auto">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-[6px] transition-all whitespace-nowrap ${activeCategory === cat.name ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <cat.icon size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* VIP Call to Action */}
                <div className="px-6 mb-12">
                    <div onClick={() => setShowAuth(true)} className="bg-slate-900 rounded-[6px] p-8 flex items-center justify-between group cursor-pointer shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Crown size={120} className="text-white rotate-12" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 text-emerald-400 mb-2 font-black text-[9px] uppercase tracking-[0.3em]">
                                <Sparkles size={14} />
                                New Promotion
                            </div>
                            <h3 className="text-white font-black italic text-2xl uppercase tracking-tighter leading-none mb-1">VIP ARENA <span className="text-accent underline">ACTIVE</span></h3>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Get 200% Bonus on first join</p>
                        </div>
                        <div className="w-16 h-16 bg-white/10 rounded-[6px] flex items-center justify-center text-white group-hover:scale-110 transition-transform relative z-10 border border-white/10">
                            <ChevronRight size={32} />
                        </div>
                    </div>
                </div>

                <div className="px-6 mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-accent/10 rounded-[6px] text-accent">
                                <Flame size={18} />
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Trending <span className="text-accent underline decoration-accent/10">Games</span></h2>
                        </div>
                        <button className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-accent transition-colors">View All Grid</button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { name: 'Crash Predictor', img: '/crash_game_thumb_1772871825572.png', players: '5.1k', hot: true, icon: Rocket },
                            { name: 'Crystal Mines', img: '/mines_game_thumb_1772871801435.png', players: '2.6k', hot: false, icon: Sparkles },
                            { name: 'Neon Slots', img: '/slots_game_thumb_1772871869952.png', players: '3.4k', hot: true, icon: Star },
                            { name: 'Lucky Dice', img: '/dice_game_thumb_1772872939570.png', players: '1.2k', hot: false, icon: Gift },
                        ].map((game, i) => (
                            <div key={i} onClick={() => setShowAuth(true)} className="group relative aspect-[4/5] rounded-[6px] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                                <img src={game.img} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-[6px] text-white">
                                            <game.icon size={12} />
                                        </div>
                                        {game.hot && (
                                            <span className="px-2 py-0.5 bg-accent text-white text-[7px] font-black uppercase tracking-widest rounded-[6px]">HOT</span>
                                        )}
                                    </div>
                                    <h4 className="text-lg font-black italic uppercase text-white tracking-tighter leading-none mb-1">{game.name}</h4>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-[6px] bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-bold text-slate-300 tracking-widest uppercase">{game.players} Online</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-6 mb-12">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-100 rounded-[6px] text-slate-600">
                                <Trophy size={18} />
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">Elite <span className="text-accent underline decoration-accent/10">Sports</span></h2>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {matches.length > 0 ? (
                            matches.slice(0, 3).map(match => (
                                <MatchCard key={match.id} match={match} onBet={() => setShowAuth(true)} />
                            ))
                        ) : (
                            <div className="text-center py-24 bg-white rounded-[6px] border-2 border-dashed border-black/[0.03]">
                                <Trophy size={48} className="mx-auto text-slate-100 mb-4" />
                                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Arena Standby</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Quote */}
                <div className="px-6 text-center opacity-40 mb-12">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 italic">CRICWIN • THE ULTIMATE ARENA • EST 2026</p>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-[480px] z-[200] bg-white/95 backdrop-blur-2xl border-t border-black/[0.05] px-6 py-4 rounded-t-[30px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] pb-safe">
                <div className="w-full flex items-center justify-between relative">
                    {[
                        { name: 'Arena', icon: Home },
                        { name: 'Live', icon: Activity },
                        { name: 'Bonus', icon: Gift },
                        { name: 'Me', icon: User },
                    ].map((nav, index) => (
                        <div key={nav.name} className="flex items-center">
                            {index === 2 && <div className="w-20 sm:w-24" />}
                            <button onClick={() => setShowAuth(true)} className="flex flex-col items-center gap-2 group">
                                <div className="p-3 rounded-[6px] group-hover:bg-accent/10 group-hover:text-accent transition-all">
                                    <nav.icon size={22} className="text-slate-400 group-hover:text-accent group-hover:scale-110 transition-transform" />
                                </div>
                                <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest group-hover:text-accent">{nav.name}</span>
                            </button>
                        </div>
                    ))}
                    {/* Floating Center button - High Impact */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-16">
                        <button onClick={() => setShowAuth(true)} className="w-[84px] h-[84px] bg-accent rounded-[6px] border-[10px] border-white flex items-center justify-center text-white shadow-2xl shadow-accent/40 hover:scale-110 active:scale-90 transition-all group">
                            <div className="flex flex-col items-center group-hover:rotate-12 transition-transform">
                                <span className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">PLACE</span>
                                <span className="text-xl font-black italic tracking-tighter leading-none">BET</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Auth Modal (Professional App Style) */}
            <AnimatePresence>
                {showAuth && (
                    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAuth(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md bg-white rounded-[6px] sm:rounded-[6px] p-8 sm:p-12 shadow-2xl overflow-hidden"
                        >
                            <div className="flex justify-center mb-6 sm:hidden">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-[6px]" />
                            </div>

                            <button
                                onClick={() => setShowAuth(false)}
                                className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors hidden sm:block"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-12 text-center">
                                <div className="w-20 h-20 bg-accent/5 rounded-[6px] flex items-center justify-center text-accent mx-auto mb-6 border border-accent/10">
                                    {isLogin ? <LogIn size={36} /> : <UserPlus size={36} />}
                                </div>
                                <h2 className="text-4xl font-black italic tracking-tighter mb-3 uppercase text-slate-900 leading-none">
                                    {isLogin ? 'WELCOME BACK' : 'START WINNING'}
                                </h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    CRICWIN Pro: Authentication Required
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="label-sm">Mobile or Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="text" required value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[6px] py-5 pl-16 pr-6 outline-none focus:border-accent/30 transition-all font-bold text-slate-900"
                                            placeholder="Mobile or Email"
                                        />
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div className="space-y-2 animate-in slide-in-from-left duration-500">
                                        <label className="label-sm">Mobile Number</label>
                                        <div className="relative">
                                            <TrendingUp className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input
                                                type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-[6px] py-5 pl-16 pr-6 outline-none focus:border-accent/30 transition-all font-bold text-slate-900"
                                                placeholder="10-digit number"
                                                maxLength={10}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="label-sm">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[6px] py-5 pl-16 pr-6 outline-none focus:border-accent/30 transition-all font-bold text-slate-900"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full btn-accent py-5 group relative overflow-hidden !rounded-[6px]"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3 font-black text-lg">
                                        {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-[6px] animate-spin" /> : (isLogin ? 'Login Now' : 'Join the Club')}
                                    </span>
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-xs font-black uppercase tracking-[2px] text-slate-400 hover:text-accent transition-colors"
                                >
                                    {isLogin ? "No account? Register Here" : "Already a member? Login here"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes notice {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-200%); }
                }
                .animate-notice {
                    animation: notice 40s linear infinite;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
            </div>
        </div>
    );
};

export default LandingPage;

