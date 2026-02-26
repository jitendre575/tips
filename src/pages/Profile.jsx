import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Wallet, TrendingUp, Award } from 'lucide-react';

const Profile = () => {
    const { user, userData } = useAuth();

    const stats = [
        { label: 'Total Bets', value: userData?.totalBets || 0, icon: TrendingUp, color: 'text-blue-500' },
        { label: 'Current Balance', value: userData?.balance?.toLocaleString() || 0, icon: Wallet, color: 'text-yellow-500' },
        { label: 'Level', value: 'Elite Player', icon: Award, color: 'text-purple-500' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <div>
                <h1 className="text-4xl font-black italic tracking-tighter uppercase">Player <span className="logo-red">Profile</span></h1>
                <p className="text-zinc-500 font-medium">Manage your personal information and account security</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="glass-card flex flex-col items-center text-center p-8">
                        <div className="w-24 h-24 rounded-[32px] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6 relative">
                            <User size={48} />
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 h-6 rounded-full border-4 border-[#121212]" />
                        </div>

                        <h2 className="text-2xl font-black italic tracking-tight mb-1">{userData?.email?.split('@')[0]}</h2>
                        <p className="text-zinc-500 text-sm font-medium mb-6 uppercase tracking-widest">{userData?.isAdmin ? 'Global Administrator' : 'Match Predictor'}</p>

                        <div className="w-full pt-6 border-t border-white/[0.05] space-y-4">
                            <div className="flex items-center gap-3 text-zinc-400 text-xs">
                                <Mail size={14} className="shrink-0" />
                                <span className="truncate">{userData?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400 text-xs">
                                <Calendar size={14} className="shrink-0" />
                                <span>Joined {new Date(userData?.createdAt).toLocaleDateString()}</span>
                            </div>
                            {userData?.isAdmin && (
                                <div className="flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest">
                                    <Shield size={14} className="shrink-0" />
                                    <span>Verified Admin</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats & Actions */}
                <div className="md:col-span-2 space-y-8">
                    <div className="grid sm:grid-cols-3 gap-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="glass-card p-6 flex flex-col items-center justify-center text-center group hover:scale-[1.02]">
                                <stat.icon size={24} className={`${stat.color} mb-3 group-hover:animate-float`} />
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</span>
                                <span className="text-2xl font-black italic tracking-tighter">{stat.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card space-y-6">
                        <h3 className="text-xl font-bold uppercase italic tracking-tighter">Security <span className="logo-red">Settings</span></h3>

                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm">Two-Factor Authentication</p>
                                    <p className="text-xs text-zinc-500">Currently disabled</p>
                                </div>
                                <button className="text-xs font-black uppercase text-red-500 tracking-widest hover:underline">Enable</button>
                            </div>

                            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-sm">Account Status</p>
                                    <p className="text-xs text-zinc-500 italic">Active & Verified</p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/[0.05]">
                            <button className="w-full btn-outline border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                                Request Account Deletion
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
