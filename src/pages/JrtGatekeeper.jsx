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
                    border: '1px solid rgb(var(--accent))',
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
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-['Outfit']">
            {/* Unique Digital Background Animation */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-20">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent animate-pulse" />
                <div className="grid grid-cols-12 gap-1 h-full w-full opacity-10">
                    {[...Array(144)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            {[...Array(20)].map((_, j) => (
                                <span key={j} className={`text-[8px] font-black text-accent/40 animate-pulse`} style={{ animationDelay: `${(i * j) % 3000}ms` }}>
                                    {(i + j) % 2 === 0 ? '0' : '1'}
                                </span>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Glowing Orbs */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-accent/20 blur-[150px] rounded-[6px] animate-pulse" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-[6px]" />

            {/* Main Content Card */}
            <div className="w-full max-w-[460px] relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                <div className="bg-white/[0.98] rounded-[6px] border border-white/20 p-10 sm:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.4)] backdrop-blur-3xl relative overflow-hidden group/card hover:translate-y-[-5px] transition-all duration-700">
                    {/* Dynamic Scanning Line */}
                    <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-accent to-transparent top-0 animate-[scan_3s_ease-in-out_infinite]" />
                    
                    {/* Top Accent Bar */}
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-accent/10">
                        <div className="h-full bg-accent w-full animate-shimmer" />
                    </div>

                    <div className="text-center mb-14 relative">
                        <div className="w-28 h-28 bg-slate-950 rounded-[6px] flex items-center justify-center mx-auto mb-10 shadow-[0_20px_40px_rgba(0,0,0,0.2)] relative group/icon">
                            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-[6px] scale-0 group-hover/card:scale-100 transition-transform duration-1000" />
                            <ShieldCheck className="text-accent relative z-10 group-hover/icon:rotate-[360deg] transition-transform duration-1000" size={48} strokeWidth={1} />
                        </div>
                        
                        <div className="space-y-2">
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase flex flex-col leading-none">
                                <span className="text-accent text-[10px] not-italic font-black tracking-[0.6em] mb-4 opacity-70 animate-pulse">LEVEL 4 CLEARANCE</span>
                                <span className="text-slate-900 group-hover/card:tracking-[1px] transition-all duration-700">ACCESS</span>
                                <span className="text-slate-900/40 relative">
                                    GATEWAY
                                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-6 bg-accent rounded-[6px] flex items-center justify-center animate-bounce shadow-lg shadow-accent/20">
                                        <Lock size={10} className="text-white" />
                                    </div>
                                </span>
                            </h1>
                        </div>
                    </div>

                    <form onSubmit={handleAccess} className="space-y-12">
                        <div className="space-y-5">
                            <div className="flex items-center justify-between px-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="w-1 h-1 bg-accent rounded-[6px] animate-ping" />
                                    Identity Verification
                                </label>
                                <span className="text-[9px] font-black text-accent/30 uppercase tracking-widest">Digital-Auth v4.0</span>
                            </div>
                            <div className="relative group/input">
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-[6px] py-8 text-center text-4xl font-black tracking-[15px] text-accent focus:outline-none focus:border-accent/40 focus:bg-white focus:ring-[20px] focus:ring-accent/5 transition-all duration-700 placeholder:text-slate-200 placeholder:tracking-widest"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-950 hover:bg-accent text-white py-8 rounded-[6px] font-black uppercase italic tracking-[0.2em] transition-all duration-700 flex items-center justify-center gap-5 group active:scale-[0.95] shadow-[0_30px_60px_rgba(0,0,0,0.2)] relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-4 text-lg">
                                {loading ? 'BYPASSING FIREWALL...' : 'INITIALIZE SYSTEM'}
                                {!loading && <Zap size={22} className="group-hover:scale-125 transition-transform duration-500" />}
                            </span>
                            {/* High-Speed Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
                        </button>

                        <div className="flex justify-center gap-8 pt-4">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Uplink</span>
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">SECURE</span>
                            </div>
                            <div className="w-[1px] h-6 bg-slate-100" />
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Protocol</span>
                                <span className="text-[9px] font-black text-accent uppercase tracking-tighter">RSA-4096</span>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scan {
                    0%, 100% { transform: translateY(0); opacity: 0; }
                    50% { transform: translateY(600px); opacity: 0.5; }
                }
            `}} />
        </div>
    );
};

export default JrtGatekeeper;
