import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Wallet, PlusCircle, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SupportChat from './SupportChat';
import RechargeModal from './RechargeModal';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    const { user, userData } = useAuth();
    const navigate = useNavigate();

    const handleRecharge = () => {
        setIsRechargeOpen(true);
    };

    return (
        <div className="min-h-screen bg-[#050505] flex">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="sticky top-0 z-[100] bg-[#050505]/95 backdrop-blur-2xl border-b border-white/[0.05] h-20 px-4 lg:px-10 flex items-center">
                    {/* Left: Menu */}
                    <div className="flex-1 flex justify-start items-center">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2.5 bg-white/[0.02] border border-white/5 rounded-2xl text-zinc-400 hover:text-white transition-all active:scale-95"
                        >
                            <Menu size={24} />
                        </button>
                    </div>

                    {/* Center: Bell on Mobile / Welcome on Desktop */}
                    <div className="flex-1 flex justify-center items-center">
                        <button className="lg:hidden p-3 text-zinc-500 hover:text-white transition-colors relative">
                            <Bell size={22} />
                            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]"></span>
                        </button>
                        <div className="hidden lg:flex flex-col items-center">
                            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[2px] leading-none mb-1">Welcome back,</h2>
                            <span className="text-lg font-black italic tracking-tight uppercase text-white">
                                {userData?.name || userData?.email?.split('@')[0]}
                            </span>
                        </div>
                    </div>

                    {/* Right: Balance & Plus */}
                    <div className="flex-1 flex justify-end items-center gap-2">
                        <div className="bg-[#121212] px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-[18px] border border-white/[0.05] flex items-center gap-2 sm:gap-3 shadow-2xl">
                            <div className="bg-yellow-500/10 p-1 rounded-md sm:rounded-lg">
                                <Wallet className="w-3.5 h-3.5 text-yellow-500" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[7px] sm:text-[8px] font-black text-zinc-600 uppercase leading-none mb-1 tracking-tighter">Balance</span>
                                <span className="font-black text-white tracking-widest leading-none text-xs sm:text-sm">
                                    {userData?.balance?.toLocaleString() || '0'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleRecharge}
                            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl sm:rounded-2xl border border-emerald-500/10 transition-all active:scale-90"
                        >
                            <PlusCircle size={20} />
                        </button>

                        <button className="hidden lg:flex p-3 text-zinc-500 hover:text-white transition-colors relative ml-2">
                            <Bell size={22} />
                            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#050505]"></span>
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-10">
                    {children}
                </main>
            </div>
            <SupportChat />
            <RechargeModal isOpen={isRechargeOpen} onClose={() => setIsRechargeOpen(false)} />
        </div>
    );
};

export default DashboardLayout;
