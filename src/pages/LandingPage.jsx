import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Mail, Lock, UserPlus, LogIn, Flame, X, Home, Wallet, User, MessageCircle, Share2, Activity, Play, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import MatchCard from '../components/MatchCard';

const LandingPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showAuth, setShowAuth] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState([]);
    const { user, userData, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, 'matches'), orderBy('matchTime', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    // Check if user is logged in and redirect accordingly
    useEffect(() => {
        if (user && userData && !authLoading) {
            if (userData.isAdmin) {
                navigate('/jrt');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, userData, authLoading, navigate]);

    if (authLoading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#050505]">
            <div className="w-12 h-12 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
        </div>
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success('Welcome back to the arena!');
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                toast.success('Profile initialized! Ready to play?');
            }
            // Redirection is handled by the useEffect above
        } catch (error) {
            console.error("Auth Error:", error);
            toast.error(error.code === 'auth/user-not-found' ? 'Account not found' : error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] selection:bg-red-500/30 overflow-x-hidden">
            {/* Mesh Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[120px] rounded-full animate-float" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Navbar */}
            <nav className="sticky top-0 z-[100] bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 lg:px-10 py-5">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="cricwin-logo">
                        <span className="text-white">CRIC</span>
                        <span className="logo-red underline underline-offset-8 decoration-2 decoration-red-500/30">WIN</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-10">
                        <Link to="/" className="text-sm font-black italic uppercase tracking-widest text-white flex items-center gap-2 group">
                            <Home size={16} className="text-red-500 group-hover:scale-125 transition-transform" />
                            <span>Home</span>
                        </Link>
                        <button onClick={() => setShowAuth(true)} className="text-sm font-black italic uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                            <Trophy size={16} />
                            <span>Standings</span>
                        </button>
                        <button onClick={() => setShowAuth(true)} className="text-sm font-black italic uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                            <Zap size={16} />
                            <span>Markets</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => { setIsLogin(true); setShowAuth(true); }}
                            className="hidden sm:block text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setShowAuth(true); }}
                            className="btn-red px-6 py-2.5 !rounded-xl text-xs"
                        >
                            Join Now
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
                {/* Hero Section */}
                <div className="text-center mb-20 lg:mb-32">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[10px] font-black uppercase tracking-[3px] mb-8 italic"
                    >
                        <Activity size={12} className="animate-pulse" />
                        The Number #1 Cricket Prediction Hub
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl lg:text-9xl font-black italic tracking-tighter mb-8 leading-[0.9] lg:leading-[0.8]"
                    >
                        PREDICT. WIN. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-500 to-amber-500">DOMINATE.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-500 font-medium text-lg lg:text-xl max-w-2xl mx-auto mb-12"
                    >
                        Experience the most advanced cricket prediction platform. Real-time markets, instant payouts, and the ultimate hall of fame.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                    >
                        <button
                            onClick={() => setShowAuth(true)}
                            className="btn-red w-full sm:w-auto px-10 py-5 text-base"
                        >
                            Start Predicting <ChevronRight size={20} />
                        </button>
                        <button className="flex items-center gap-3 text-zinc-400 hover:text-white font-bold transition-all group">
                            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white/5 transition-all">
                                <Play size={20} className="fill-current" />
                            </div>
                            <span>Watch Demo</span>
                        </button>
                    </motion.div>
                </div>

                {/* Match Grid Section */}
                <div className="mb-32">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-12 bg-red-500 rounded-full" />
                            <div>
                                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Active <span className="logo-red">Markets</span></h2>
                                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mt-1">Live from global tournaments</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAuth(true)} className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors">
                            View All Markets <ChevronRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {matches.length > 0 ? (
                            matches.slice(0, 4).map(match => (
                                <MatchCard key={match.id} match={match} onBet={() => setShowAuth(true)} />
                            ))
                        ) : (
                            <div className="lg:col-span-2 text-center py-32 bg-zinc-950/50 rounded-[40px] border border-white/[0.03] border-dashed">
                                <Activity className="mx-auto text-zinc-900 mb-6" size={64} />
                                <h3 className="text-2xl font-black italic text-zinc-800 uppercase tracking-tighter leading-none mb-2">Arena is Empty</h3>
                                <p className="text-zinc-700 font-medium">No live markets currently available. Check back soon for IPL 2024.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: Wallet, title: "Instant Payouts", desc: "Withdraw your winnings instantly via UPI or Bank Transfer." },
                        { icon: Trophy, title: "Hall of Fame", desc: "Climb the leaderboard and win exclusive monthly badges." },
                        { icon: Activity, title: "Advanced Stats", desc: "Detailed match analysis and history to help you win." }
                    ].map((item, i) => (
                        <div key={i} className="glass-card p-10 group hover:bg-white/[0.02] border-white/5">
                            <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-red-500 mb-8 border border-white/5 group-hover:scale-110 group-hover:bg-red-500/10 transition-all">
                                <item.icon size={28} />
                            </div>
                            <h4 className="text-xl font-black italic tracking-tighter uppercase mb-3">{item.title}</h4>
                            <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            {/* Auth Modal */}
            <AnimatePresence>
                {showAuth && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAuth(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#050505] border border-white/[0.08] rounded-[40px] p-10 lg:p-12 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />

                            <button
                                onClick={() => setShowAuth(false)}
                                className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-10 text-center">
                                <h2 className="text-4xl font-black italic tracking-tighter mb-3 uppercase leading-none">
                                    {isLogin ? (
                                        <>Welcome <span className="logo-red">Back</span></>
                                    ) : (
                                        <>Join the <span className="logo-red">Game</span></>
                                    )}
                                </h2>
                                <p className="text-zinc-500 text-sm font-medium">
                                    {isLogin ? 'Login to continue your winning streak.' : 'Create an account and start predicting.'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="label-sm">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                        <input
                                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-zinc-900/50 border border-white/[0.05] rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-red-500/50 transition-all font-medium text-white"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="label-sm">Security Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                        <input
                                            type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-zinc-900/50 border border-white/[0.05] rounded-2xl py-5 pl-14 pr-6 outline-none focus:border-red-500/50 transition-all font-medium text-white"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full btn-red py-5 mt-4 group relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                                                {isLogin ? 'Enter Arena' : 'Initialize Account'}
                                            </>
                                        )}
                                    </span>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </button>
                            </form>

                            <div className="mt-10 text-center">
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-xs font-black uppercase tracking-[2px] text-zinc-600 hover:text-red-500 transition-colors"
                                >
                                    {isLogin ? "New Player? Register Here" : "Existing Member? Login Here"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Footer */}
            <footer className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-12 border-t border-white/[0.05] text-center lg:text-left">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                    <div>
                        <div className="cricwin-logo mb-2 justify-center lg:justify-start">
                            <span className="text-white">CRIC</span>
                            <span className="logo-red">WIN</span>
                        </div>
                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">© 2024 CRICWIN GAMING LTD. ALL RIGHTS RESERVED.</p>
                    </div>
                    <div className="flex gap-10">
                        {['Privacy', 'Terms', 'Support', 'Contact'].map(item => (
                            <button key={item} className="text-xs font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;

