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
        { label: 'Total Bets', value: userData?.totalBets || 0, icon: TrendingUp, color: 'text-blue-500' },
        { label: 'Current Balance', value: userData?.balance?.toLocaleString() || 0, icon: Wallet, color: 'text-yellow-500' },
        { label: 'Level', value: userData?.isAdmin ? 'Elite Admin' : 'Pro Player', icon: Award, color: 'text-purple-500' },
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
        <div className="max-w-5xl mx-auto space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                        Your <span className="logo-red">Profile</span>
                    </h1>
                    <p className="text-zinc-500 font-medium mt-3">Manage your personal information and account settings</p>
                </div>

                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-white text-zinc-400 hover:text-black rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-xl active:scale-95 group"
                    >
                        <Edit3 size={18} className="group-hover:rotate-12 transition-transform" />
                        <span>Edit Profile</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="p-3 bg-zinc-900 text-zinc-500 hover:text-white rounded-2xl border border-white/5 transition-all"
                        >
                            <X size={20} />
                        </button>
                        <button
                            onClick={handleUpdate}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                            <Save size={18} />
                            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="group relative bg-[#0a0a0a] border border-white/[0.05] rounded-[40px] p-10 flex flex-col items-center text-center transition-all duration-500 hover:border-red-500/20">
                        <div className="absolute inset-0 bg-gradient-to-b from-red-500/[0.02] to-transparent pointer-events-none" />

                        <div className="w-32 h-32 rounded-[40px] bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 mb-8 relative group-hover:scale-105 transition-transform duration-500">
                            <User size={64} className="group-hover:text-red-500 transition-colors" />
                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-2xl border-4 border-[#0a0a0a] flex items-center justify-center text-white shadow-lg">
                                <CheckCircle2 size={16} />
                            </div>
                        </div>

                        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-1">
                            {userData?.name || userData?.email?.split('@')[0]}
                        </h2>
                        <p className="text-zinc-500 text-xs font-black uppercase tracking-[3px] mb-8">{userData?.isAdmin ? 'Global Administrator' : 'Match Predictor'}</p>

                        <div className="w-full pt-8 border-t border-white/[0.05] space-y-5">
                            <div className="flex items-center gap-4 text-zinc-400 group/item">
                                <div className="p-2 bg-zinc-900 rounded-lg group-hover/item:text-red-500 transition-colors">
                                    <Mail size={16} />
                                </div>
                                <span className="text-sm font-medium truncate">{userData?.email}</span>
                            </div>
                            <div className="flex items-center gap-4 text-zinc-400 group/item">
                                <div className="p-2 bg-zinc-900 rounded-lg group-hover/item:text-red-500 transition-colors">
                                    <Phone size={16} />
                                </div>
                                <span className="text-sm font-medium">{userData?.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-zinc-400 group/item">
                                <div className="p-2 bg-zinc-900 rounded-lg group-hover/item:text-red-500 transition-colors">
                                    <Calendar size={16} />
                                </div>
                                <span className="text-sm font-medium">Joined {new Date(userData?.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="grid sm:grid-cols-3 gap-6">
                        {stats.map((stat, i) => (
                            <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-[32px] p-8 flex flex-col items-center justify-center text-center transition-all hover:bg-zinc-900 group">
                                <stat.icon size={28} className={`${stat.color} mb-4 group-hover:scale-110 transition-transform`} />
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-2">{stat.label}</span>
                                <span className="text-3xl font-black italic tracking-tighter leading-none">{stat.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/[0.05] rounded-[40px] p-10 space-y-10">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Account <span className="logo-red">Details</span></h3>
                            <p className="text-zinc-500 text-sm mt-1">Update your basic information</p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Display Name</label>
                                <div className="relative group">
                                    <User className={`absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 ${isEditing ? 'group-focus-within:text-red-500' : ''}`} size={18} />
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        placeholder="Enter your name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-2">Phone Number</label>
                                <div className="relative group">
                                    <Phone className={`absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600 ${isEditing ? 'group-focus-within:text-red-500' : ''}`} size={18} />
                                    <input
                                        type="text"
                                        disabled={!isEditing}
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-white focus:outline-none focus:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        placeholder="e.g. +91 9876543210"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-white/[0.05]">
                            <div className="flex items-center justify-between p-6 bg-red-500/5 border border-red-500/10 rounded-3xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                                        <Shield size={24} />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm uppercase italic tracking-tight text-white leading-none mb-1">Account Security</p>
                                        <p className="text-zinc-500 text-xs">Your personal data is encrypted and secure.</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="px-4 py-1.5 bg-zinc-900 rounded-full text-[10px] font-black text-zinc-500 uppercase tracking-widest border border-white/5">Verified</div>
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

