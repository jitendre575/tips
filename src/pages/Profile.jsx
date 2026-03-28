import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Shield, Calendar, Wallet, TrendingUp, Award, Phone, Edit3, Save, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user, userData } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: userData?.name || '',
        phone: userData?.phone || ''
    });
    const [loading, setLoading] = useState(false);

    const stats = [
        { label: 'Total Bets', value: userData?.totalBets || 0, icon: TrendingUp, color: 'text-accent' },
        { label: 'Current Balance', value: userData?.balance?.toLocaleString() || 0, icon: Wallet, color: 'text-yellow-500' },
        { label: 'Level', value: userData?.isAdmin ? 'Elite Admin' : 'Pro Player', icon: Award, color: 'text-emerald-500' },
    ];

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                name: formData.name,
                phone: formData.phone
            });
            toast.success('Profile updated successfully!');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-32">
            <div className="flex flex-col gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase leading-none">
                        Your <span className="logo-accent">Profile</span>
                    </h1>
                    <p className="text-zinc-500 font-medium mt-2 text-xs">Manage your personal information and account settings</p>
                </div>

                <div className="flex justify-center sm:justify-start">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-[6px] text-[10px] font-black uppercase italic tracking-widest transition-all shadow-xl active:scale-95 group"
                        >
                            <Edit3 size={16} className="group-hover:rotate-12 transition-transform" />
                            <span>Edit Profile</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-[6px] border border-white/5 transition-all"
                            >
                                <X size={18} />
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-[6px] text-[10px] font-black uppercase italic tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                            >
                                <Save size={16} />
                                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* Profile Card */}
                <div className="w-full">
                    <div className="group relative bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.05] rounded-[6px] p-6 sm:p-10 flex flex-col items-center text-center transition-all duration-500 hover:border-accent/20 overflow-hidden shadow-2xl shadow-black/50">
                        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.05] to-transparent pointer-events-none" />
                        
                        <div className="w-24 h-24 rounded-[6px] bg-zinc-900 border-2 border-white/5 flex items-center justify-center text-zinc-500 mb-6 relative group-hover:scale-105 transition-all duration-500">
                            <User size={48} className="group-hover:text-accent transition-colors relative z-10" />
                            <div className="absolute -bottom-2 -right-2 bg-accent w-7 h-7 rounded-[6px] border-4 border-[#0a0a0a] flex items-center justify-center text-white shadow-lg z-20">
                                <CheckCircle2 size={14} />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-1 text-white">
                            {userData?.name || userData?.email?.split('@')[0]}
                        </h2>
                        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[3px] mb-6">{userData?.isAdmin ? 'Global Administrator' : 'Match Predictor'}</p>

                        <div className="w-full pt-6 border-t border-white/[0.05] space-y-4">
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Mail size={14} className="shrink-0" />
                                <span className="text-xs font-medium truncate">{userData?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Phone size={14} className="shrink-0" />
                                <span className="text-xs font-medium">{userData?.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Calendar size={14} className="shrink-0" />
                                <span className="text-xs font-medium">Joined {new Date(userData?.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Details & Stats */}
                <div className="w-full space-y-8">
                    {/* Stats Grid - Stacked for 480px */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-[6px] p-6 flex flex-col items-center justify-center text-center shadow-lg">
                                <stat.icon size={20} className={`${stat.color} mb-3`} />
                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{stat.label}</span>
                                <span className="text-xl font-black italic tracking-tighter text-white truncate max-w-full">{stat.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.05] rounded-[6px] p-6 sm:p-10 space-y-8 shadow-2xl shadow-black/50">
                        <div>
                            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Account <span className="logo-accent">Details</span></h3>
                            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mt-1">Update your identity</p>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-[6px] py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-accent/30 disabled:opacity-50 transition-all"
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-zinc-900 border border-white/5 rounded-[6px] py-4 pl-12 pr-4 text-xs font-bold text-white focus:outline-none focus:border-accent/30 disabled:opacity-50 transition-all"
                                        placeholder="e.g. +91 9876543210"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/[0.05]">
                            <div className="flex items-center justify-between p-4 bg-accent/5 border border-accent/10 rounded-[6px] relative overflow-hidden">
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="p-2 bg-accent/10 rounded-[6px] text-accent border border-accent/20">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="font-black text-xs uppercase italic tracking-tight text-white leading-none mb-1">Security</p>
                                        <p className="text-zinc-600 text-[8px] font-bold uppercase tracking-tight">Active Session</p>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <div className="px-3 py-1 bg-zinc-950 border border-emerald-500/20 text-[8px] font-black text-emerald-500 uppercase tracking-widest rounded-[6px] flex items-center gap-1.5">
                                        <div className="w-1 h-1 bg-emerald-500 rounded-[6px] animate-pulse" />
                                        Verified
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

