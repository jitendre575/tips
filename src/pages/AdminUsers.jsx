import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, getDocs, where } from 'firebase/firestore';
import { User, Mail, Wallet, TrendingUp, CreditCard, Edit2, Check, X, Search, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ balance: 0, isAdmin: false });
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleEdit = (user) => {
        setEditingUser(user.id);
        setEditForm({ balance: user.balance, isAdmin: user.isAdmin || false });
    };

    const handleUpdate = async (userId) => {
        try {
            await updateDoc(doc(db, 'users', userId), {
                balance: Number(editForm.balance),
                isAdmin: editForm.isAdmin
            });
            toast.success('User updated successfully');
            setEditingUser(null);
        } catch (error) {
            toast.error('Failed to update user');
        }
    };

    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase">User <span className="logo-red">Management</span></h1>
                    <p className="text-zinc-500 font-medium">Monitor and manage all registered accounts</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input
                        type="text"
                        placeholder="Search by email or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/[0.05] rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-red-500/50 transition-all text-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 glass-card animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="glass-card relative overflow-hidden group">
                            {user.isAdmin && (
                                <div className="absolute top-0 right-0 bg-red-500/10 text-red-500 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest border-l border-b border-red-500/20">
                                    Admin
                                </div>
                            )}

                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-red-500/10 group-hover:text-red-500 transition-colors">
                                    <User size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg truncate pr-16">{user.email?.split('@')[0]}</h3>
                                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                                        <Mail size={12} />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-zinc-950/50 rounded-2xl p-3 border border-white/[0.02]">
                                    <span className="label-sm !mb-1 !p-0">Balance</span>
                                    {editingUser === user.id ? (
                                        <input
                                            type="number"
                                            value={editForm.balance}
                                            onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
                                            className="w-full bg-transparent border-b border-white/20 outline-none font-black text-yellow-500"
                                        />
                                    ) : (
                                        <span className="text-xl font-black text-yellow-500 tracking-tighter">
                                            {user.balance?.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <div className="bg-zinc-950/50 rounded-2xl p-3 border border-white/[0.02]">
                                    <span className="label-sm !mb-1 !p-0">Role</span>
                                    {editingUser === user.id ? (
                                        <select
                                            value={editForm.isAdmin}
                                            onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.value === 'true' })}
                                            className="w-full bg-transparent border-b border-white/20 outline-none font-black text-zinc-300 text-sm appearance-none"
                                        >
                                            <option value="false" className="bg-zinc-900">User</option>
                                            <option value="true" className="bg-zinc-900">Admin</option>
                                        </select>
                                    ) : (
                                        <span className="text-sm font-black text-zinc-300 uppercase italic">
                                            {user.isAdmin ? 'Admin' : 'Regular'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/[0.05]">
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <TrendingUp size={14} />
                                        <span>Total Bets</span>
                                    </div>
                                    <span className="font-bold">{user.totalBets || 0}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-zinc-500">
                                        <CreditCard size={14} />
                                        <span>Active Requests</span>
                                    </div>
                                    <span className={`font-bold ${user.activeWithdrawals > 0 ? 'text-red-500' : ''}`}>
                                        {user.activeWithdrawals || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono mt-2">
                                    <span>ID: {user.id.slice(0, 12)}...</span>
                                    <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-2">
                                {editingUser === user.id ? (
                                    <>
                                        <button
                                            onClick={() => handleUpdate(user.id)}
                                            className="flex-1 bg-emerald-500 rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-bold active:scale-95"
                                        >
                                            <Check size={16} /> Save
                                        </button>
                                        <button
                                            onClick={() => setEditingUser(null)}
                                            className="w-12 bg-zinc-800 rounded-xl py-2 flex items-center justify-center text-zinc-400 active:scale-95"
                                        >
                                            <X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="w-full bg-white/[0.05] hover:bg-white/[0.1] rounded-xl py-2 flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95"
                                    >
                                        <Edit2 size={16} /> Edit User
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
