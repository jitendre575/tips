import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Zap, ArrowRight, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const JrtGatekeeper = ({ onAuthorized }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleAccess = (e) => {
        e.preventDefault();
        setLoading(true);

        // Required Password: JAAT
        if (password === 'JAAT') {
            sessionStorage.setItem('jrt_access', 'true');
            toast.success('ACCESS GRANTED. WELCOME MASTER.', {
                icon: '🔑',
                style: {
                    background: '#050505',
                    color: '#fff',
                    border: '1px solid #ff3333',
                    fontFamily: 'Outfit, sans-serif',
                    fontWeight: '900',
                    textTransform: 'uppercase'
                }
            });

            if (onAuthorized) {
                onAuthorized();
            } else {
                setTimeout(() => {
                    navigate('/jrt/dashboard');
                }, 800);
            }
        } else {
            toast.error('INVALID MASTER KEY', {
                style: {
                    background: '#121212',
                    color: '#ff3333',
                    border: '1px solid #ff3333',
                }
            });
            setPassword('');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-red-600/10 blur-[150px] rounded-full animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-red-600/5 blur-[120px] rounded-full" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="w-24 h-24 bg-red-600/10 border border-red-600/20 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                        <Lock className="text-red-500 animate-pulse" size={40} />
                    </div>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">
                        System <span className="logo-red">Override</span>
                    </h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[4px]">Enter Master Key to Continue</p>
                </div>

                <form onSubmit={handleAccess} className="space-y-6">
                    <div className="relative group">
                        <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-red-500 transition-colors" size={24} />
                        <input
                            type="password"
                            placeholder="MASTER KEY"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                            className="w-full bg-zinc-950 border border-white/5 rounded-[24px] py-8 pl-16 pr-6 text-center text-3xl font-black tracking-[10px] text-red-500 outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/5 transition-all placeholder:text-zinc-900 placeholder:tracking-widest placeholder:text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-500 text-white py-6 rounded-[24px] font-black uppercase italic tracking-[4px] transition-all flex items-center justify-center gap-4 group active:scale-95 shadow-2xl shadow-red-600/20"
                    >
                        {loading ? 'Decrypting...' : (
                            <>
                                Initialize Session <Zap size={20} className="group-hover:scale-125 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-4 p-4 bg-zinc-900/50 rounded-2xl border border-white/5 opacity-50">
                        <ShieldAlert className="text-zinc-600 shrink-0" size={18} />
                        <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-widest text-center mx-auto">
                            Unauthorized attempts are logged and monitored.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JrtGatekeeper;
