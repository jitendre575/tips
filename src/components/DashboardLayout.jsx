import { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, Wallet, PlusCircle, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, userData } = useAuth();

    const handleRecharge = async () => {
        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                balance: increment(5000)
            });
            toast.success('Demo: 5,000 Coins added!');
        } catch (error) {
            toast.error('Recharge failed');
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-[100] bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.05] h-20 flex items-center px-6 lg:px-10 justify-between">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="lg:hidden p-2 text-zinc-400 hover:text-white"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="hidden lg:flex flex-col">
                        <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Welcome back,</h2>
                        <span className="text-xl font-black italic tracking-tight">{userData?.email?.split('@')[0]}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-zinc-500 hover:text-white transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]"></span>
                        </button>

                        <div className="h-8 w-px bg-white/[0.05] mx-2 hidden sm:block"></div>

                        <div className="flex items-center gap-3">
                            <div className="bg-zinc-900 px-4 py-2.5 rounded-2xl border border-white/[0.05] flex items-center gap-3 group hover:border-yellow-500/30 transition-all">
                                <div className="bg-yellow-500/10 p-1.5 rounded-lg group-hover:bg-yellow-500/20 transition-all">
                                    <Wallet className="w-4 h-4 text-yellow-500" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase leading-none mb-1">Balance</span>
                                    <span className="font-black text-white tracking-tight leading-none">
                                        {userData?.balance?.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleRecharge}
                                className="sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-2xl border border-emerald-500/20 text-xs font-black uppercase tracking-widest transition-all"
                            >
                                <PlusCircle size={16} />
                                <span className="hidden sm:inline">Add Coins</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden p-6 lg:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
