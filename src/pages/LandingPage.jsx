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
    Gift, Crown, MousePointer2, Star, TrendingUp, Presentation, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import MatchCard from '../components/MatchCard';

const LandingPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showAuth, setShowAuth] = useState(false);
    const [email, setEmail] = useState('');
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

    useEffect(() => {
        if (user && userData && !authLoading) {
            if (userData.isAdmin) navigate('/jrt');
            else navigate('/dashboard');
        }
    }, [user, userData, authLoading, navigate]);

    if (authLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f5f5f9]">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin"></div>
        </div>
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success('Welcome to the Gaming Arena!');
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                toast.success('Welcome to the 91 Winning Club!');
            }
        } catch (error) {
            toast.error(error.message);
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
        <div className="min-h-screen bg-[#f5f5f9] pb-32">
            {/* Real App Header */}
            <div className="sticky top-0 z-[100] bg-[#d11b1b] px-4 py-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner">
                        <span className="text-[#d11b1b] font-black text-xl italic tracking-tighter">91</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white font-black italic text-xl leading-none uppercase tracking-tighter">91 CLUB</h1>
                        <span className="text-white/60 text-[8px] font-bold tracking-[0.2em] uppercase">Professional Gaming</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="text-white/80 hover:text-white"><Bell size={20} /></button>
                    <button className="text-white/80 hover:text-white"><Download size={20} /></button>
                    <button className="text-white/80 hover:text-white" onClick={() => setShowAuth(true)}><MessageCircle size={20} /></button>
                </div>
            </div>

            {/* Scrolling Notice */}
            <div className="bg-slate-50 border-b border-black/5 px-4 py-2 flex items-center gap-3 overflow-hidden">
                <Bell size={14} className="text-slate-400 shrink-0" />
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 whitespace-nowrap animate-notice flex gap-10">
                    <span>Welcome to the Elite 91 Winning Club. Predict and win big in real-time.</span>
                    <span>All players registered on this platform must bind bank data for instant withdrawals.</span>
                </div>
            </div>

            <main className="max-w-xl mx-auto">
                {/* Hero Promotion Banner */}
                <div className="p-4">
                    <div className="relative aspect-[16/9] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                        <img
                            src="/casino_banner_promo_1772871782573.png"
                            alt="Mega Spin Event"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30 text-white text-[10px] font-black uppercase tracking-widest">
                            Live event
                        </div>
                    </div>
                </div>

                {/* User Balance & Actions */}
                <div className="px-4 mb-8">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-black/5 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-amber-100 text-amber-600 rounded-full p-1"><Wallet size={12} /></span>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Wallet balance</span>
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-2">
                                <span className="text-slate-400 font-medium">₹</span>0.00
                                <button className="text-slate-300 hover:text-accent"><TrendingUp size={16} /></button>
                            </h2>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAuth(true)} className="btn-withdraw px-6 py-4 rounded-2xl flex flex-col items-center group">
                                <TrendingUp className="group-hover:translate-y-[-2px] transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-wider mt-1">Withdraw</span>
                            </button>
                            <button onClick={() => setShowAuth(true)} className="btn-deposit px-6 py-4 rounded-2xl flex flex-col items-center group">
                                <Zap className="group-hover:scale-110 transition-transform" />
                                <span className="text-[9px] font-black uppercase tracking-wider mt-1">Deposit</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Shortcuts */}
                <div className="grid grid-cols-2 gap-4 px-4 mb-10">
                    <div onClick={() => setShowAuth(true)} className="bg-gradient-to-br from-orange-400 to-red-500 rounded-[2.5rem] p-6 flex items-center justify-between group cursor-pointer shadow-lg active:scale-95 transition-all">
                        <div className="space-y-1">
                            <h3 className="text-white font-black italic text-lg leading-tight uppercase tracking-tighter">Wheel of<br />fortune</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white text-3xl group-hover:rotate-[360deg] transition-transform duration-1000">🎡</div>
                    </div>
                    <div onClick={() => setShowAuth(true)} className="bg-gradient-to-br from-purple-400 to-indigo-600 rounded-[2.5rem] p-6 flex items-center justify-between group cursor-pointer shadow-lg active:scale-95 transition-all">
                        <div className="space-y-1">
                            <h3 className="text-white font-black italic text-lg leading-tight uppercase tracking-tighter">VIP<br />Privileges</h3>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                            <Crown size={30} fill="currentColor" />
                        </div>
                    </div>
                </div>

                {/* Game Category Lobby */}
                <div className="px-4 mb-6">
                    <div className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                className={`flex flex-col items-center gap-1.5 min-w-[60px] relative transition-all ${activeCategory === cat.name ? 'text-accent scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <cat.icon size={20} />
                                <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">{cat.name}</span>
                                {activeCategory === cat.name && (
                                    <motion.div layoutId="cat-active" className="absolute -bottom-1 w-6 h-1 bg-accent rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Game Grid */}
                <div className="px-4 mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <Star size={18} className="text-amber-500 fill-amber-500" />
                        <h2 className="text-xl font-black italic tracking-tighter uppercase text-slate-800">Hot <span className="text-accent">Games</span></h2>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { name: 'Mines', img: '/mines_game_thumb_1772871801435.png', players: '2.6k' },
                            { name: 'Rocket', img: '/crash_game_thumb_1772871825572.png', players: '5.1k' },
                            { name: 'Slots', img: '/slots_game_thumb_1772871869952.png', players: '3.4k' },
                        ].map((game, i) => (
                            <div key={i} onClick={() => setShowAuth(true)} className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all">
                                <img src={game.img} alt={game.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent p-3 flex flex-col justify-end">
                                    <h4 className="text-sm font-black italic uppercase text-white tracking-tighter">{game.name}</h4>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[8px] font-bold text-slate-300 tracking-widest">{game.players} playing</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sports Predictions */}
                <div className="px-4 mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <Trophy size={18} className="text-accent" />
                        <h2 className="text-xl font-black italic tracking-tighter uppercase text-slate-800">Elite <span className="text-accent">Matches</span></h2>
                    </div>
                    <div className="space-y-6">
                        {matches.length > 0 ? (
                            matches.slice(0, 3).map(match => (
                                <MatchCard key={match.id} match={match} onBet={() => setShowAuth(true)} />
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                                <Trophy size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Arena is currently inactive</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Sticky Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-black/5 px-6 py-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
                <div className="max-w-xl mx-auto flex items-center justify-between">
                    {[
                        { name: 'Home', icon: Home },
                        { name: 'Activity', icon: Activity },
                        { name: 'Promotion', icon: Gift },
                        { name: 'Account', icon: User },
                    ].map((nav) => (
                        <button key={nav.name} onClick={() => setShowAuth(true)} className="flex flex-col items-center gap-1 group">
                            <div className="p-2 rounded-2xl group-hover:bg-accent/5 group-hover:text-accent transition-all">
                                <nav.icon size={22} className="text-slate-400 group-hover:text-accent" />
                            </div>
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest group-hover:text-accent">{nav.name}</span>
                        </button>
                    ))}
                    {/* Floating Center button */}
                    <button onClick={() => setShowAuth(true)} className="absolute left-1/2 -translate-x-1/2 -top-10 w-20 h-20 bg-accent rounded-full border-[8px] border-[#f5f5f9] flex items-center justify-center text-white shadow-xl shadow-accent/40 active:scale-90 transition-all">
                        <div className="flex flex-col items-center">
                            <span className="text-[8px] font-bold uppercase tracking-widest mb-1">Get</span>
                            <span className="text-lg font-black italic tracking-tighter leading-none">₹500</span>
                        </div>
                    </button>
                    <div className="w-20" /> {/* Spacer for floating button */}
                    {/* Shift right items */}
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
                            className="relative w-full max-w-md bg-white rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-12 shadow-2xl overflow-hidden"
                        >
                            <div className="flex justify-center mb-6 sm:hidden">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                            </div>

                            <button
                                onClick={() => setShowAuth(false)}
                                className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors hidden sm:block"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-10 text-center">
                                <div className="w-16 h-16 bg-accent/10 rounded-3xl flex items-center justify-center text-accent mx-auto mb-6">
                                    {isLogin ? <LogIn size={32} /> : <UserPlus size={32} />}
                                </div>
                                <h2 className="text-3xl font-black italic tracking-tighter mb-2 uppercase text-slate-900">
                                    {isLogin ? 'Login to Win' : 'Create Account'}
                                </h2>
                                <p className="text-slate-400 text-sm font-bold tracking-tight">
                                    91 Winning Club: The most trusted platform.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="label-sm">Mobile or Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 pl-16 pr-6 outline-none focus:border-accent/30 transition-all font-bold text-slate-900"
                                            placeholder="Enter your details"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="label-sm">Security Code</label>
                                    <div className="relative">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input
                                            type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-5 pl-16 pr-6 outline-none focus:border-accent/30 transition-all font-bold text-slate-900"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full btn-accent py-5 group relative overflow-hidden !rounded-2xl"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3 font-black text-lg">
                                        {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : (isLogin ? 'Login Now' : 'Join the Club')}
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
    );
};

export default LandingPage;

