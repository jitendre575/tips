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
        <div className="min-h-screen bg-[#f5f5f9] flex lg:grid lg:grid-cols-[280px_1fr]">
            {/* Sidebar - Permanent on Desktop, Mobile Drawer on Small Screens */}
            <div className="lg:block hidden h-screen sticky top-0 border-r border-black/[0.05] bg-white">
                <Sidebar isOpen={true} onClose={() => { }} />
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            </div>

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header */}
                <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-3xl border-b border-black/[0.05] h-16 sm:h-24 px-4 sm:px-10 flex items-center shrink-0 shadow-sm">
                    {/* Left: Mobile Menu Toggle / Desktop Label */}
                    <div className="flex-1 flex justify-start items-center">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden p-2.5 bg-slate-50 border border-black/[0.05] rounded-2xl text-slate-600 hover:text-accent transition-all active:scale-95 shadow-sm"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="hidden lg:flex flex-col">
                            <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-[3px] mb-1">The Winning Club</h2>
                            <span className="text-xl font-black italic tracking-tighter uppercase text-slate-900">The Arena</span>
                        </div>
                    </div>

                    {/* Center: User Profile */}
                    <div className="flex-1 lg:flex-[2] flex justify-center items-center">
                        <div className="flex flex-col items-center">
                            <h2 className="text-[8px] lg:text-[10px] font-black text-slate-600 uppercase tracking-[3px] mb-1">Global Player</h2>
                            <span className="text-xs lg:text-xl font-black italic tracking-tight uppercase text-accent truncate max-w-[150px] lg:max-w-none">
                                {userData?.name || userData?.email?.split('@')[0]}
                            </span>
                        </div>
                    </div>

                    {/* Right: Balance & Plus */}
                    <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4">
                        <div className="bg-slate-50 px-4 lg:px-6 py-2 lg:py-4 rounded-[1.5rem] border border-black/[0.05] flex items-center gap-3 lg:gap-5 shadow-inner hover:border-accent/30 transition-all group">
                            <div className="bg-amber-100 p-1.5 lg:p-2.5 rounded-xl">
                                <Wallet className="w-3.5 h-3.5 lg:w-5 lg:h-5 text-amber-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[6px] lg:text-[9px] font-black text-slate-600 uppercase leading-none mb-1 tracking-widest">Balance</span>
                                <span className="font-black text-slate-900 tracking-tighter leading-none text-sm lg:text-2xl">
                                    ₹{(userData?.balance || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>


                        <button
                            onClick={handleRecharge}
                            className="w-10 h-10 lg:w-16 lg:h-16 flex items-center justify-center bg-accent text-white rounded-2xl border border-accent/10 transition-all active:scale-90 shadow-lg shadow-accent/20 group"
                        >
                            <PlusCircle size={20} className="lg:w-8 lg:h-8 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth ${
                    window.location.pathname.startsWith('/casino/') 
                        ? 'p-0 bg-[#0f212e]' 
                        : 'p-6 lg:p-12 pb-24 lg:pb-12 bg-[#f5f5f9]'
                }`}>
                    <div className={`w-full ${window.location.pathname.startsWith('/casino/') ? '' : 'max-w-7xl mx-auto'}`}>
                        {children}
                    </div>
                </main>
            </div>
            <SupportChat />
            <RechargeModal isOpen={isRechargeOpen} onClose={() => setIsRechargeOpen(false)} />
        </div>
    );
};

export default DashboardLayout;
