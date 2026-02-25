import { useState, useEffect } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Mail, Lock, UserPlus, LogIn, Flame, X, Home, Wallet, User, MessageCircle, Share2, Feather } from 'lucide-react';
import toast from 'react-hot-toast';
import MatchCard from '../components/MatchCard';

const LandingPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showAuth, setShowAuth] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const q = query(collection(db, 'matches'), orderBy('matchTime', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    if (user) return <Navigate to="/dashboard" />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                toast.success('Welcome back!');
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
                toast.success('Account created successfully!');
            }
            navigate('/dashboard');
        } catch (error) {
            console.error("Auth Error:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] selection:bg-red-500/30">
            {/* Navbar */}
            <nav className="sticky top-0 z-[100] bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="cricwin-logo">
                        <span className="text-white">CRIC</span>
                        <span className="logo-red">WIN</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/" className="nav-link text-white">
                            <Home size={18} className="text-red-500" />
                            <span>Home</span>
                        </Link>
                        <button onClick={() => setShowAuth(true)} className="nav-link">
                            <Trophy size={18} />
                            <span>My Bets</span>
                        </button>
                        <button onClick={() => setShowAuth(true)} className="nav-link">
                            <Wallet size={18} />
                            <span>Wallet</span>
                        </button>
                        <button onClick={() => setShowAuth(true)} className="nav-link">
                            <User size={18} />
                            <span>Profile</span>
                        </button>
                    </div>

                    <button
                        onClick={() => { setIsLogin(true); setShowAuth(true); }}
                        className="btn-red"
                    >
                        Login
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-12 lg:py-20 bg-grid">
                {/* Hero Section */}
                <div className="text-center mb-16 lg:mb-24">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl lg:text-7xl font-black italic tracking-tighter mb-4"
                    >
                        LATEST <span className="logo-red">MATCHES</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-zinc-500 font-medium lg:text-lg"
                    >
                        Bet on your favorite teams and win big.
                    </motion.p>
                </div>

                {/* Match Grid */}
                <div className="max-w-4xl mx-auto grid grid-cols-1 gap-8">
                    {matches.length > 0 ? (
                        matches.map(match => (
                            <MatchCard key={match.id} match={match} onBet={() => setShowAuth(true)} />
                        ))
                    ) : (
                        <div className="text-center py-20 bg-zinc-900/50 rounded-[32px] border border-white/[0.05]">
                            <Flame className="mx-auto text-zinc-700 mb-4 animate-pulse" size={48} />
                            <h3 className="text-xl font-bold text-zinc-500">No active matches found</h3>
                        </div>
                    )}
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
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-[32px] p-8 lg:p-10 shadow-2xl"
                        >
                            <button
                                onClick={() => setShowAuth(false)}
                                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-8">
                                <h2 className="text-3xl font-black italic tracking-tight mb-2 uppercase">
                                    {isLogin ? 'Welcome Back' : 'Join the Game'}
                                </h2>
                                <p className="text-zinc-500 text-sm font-medium">
                                    {isLogin ? 'Manage your bets and track winnings.' : 'Create an account to start winning.'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                        <input
                                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-500/50 transition-all font-medium"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-1">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                                        <input
                                            type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                            className="w-full bg-zinc-900 border border-white/[0.05] rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-red-500/50 transition-all font-medium"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full btn-red py-4 mt-4 uppercase font-black italic tracking-widest flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                                            {isLogin ? 'Sign In' : 'Create Account'}
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-sm font-bold text-zinc-500 hover:text-red-500 transition-colors"
                                >
                                    {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Floating Actions */}
            <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
                <div className="bg-[#121212]/80 backdrop-blur-xl border border-white/[0.05] rounded-full p-3 flex items-center gap-4 shadow-2xl">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-emerald-400 hover:bg-emerald-400/10 transition-colors">
                        <MessageCircle size={20} />
                    </button>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-blue-400 hover:bg-blue-400/10 transition-colors">
                        <Share2 size={20} />
                    </button>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-purple-400 hover:bg-purple-400/10 transition-colors">
                        <Feather size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;

