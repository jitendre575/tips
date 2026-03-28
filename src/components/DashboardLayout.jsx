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
        navigate('/add-balance');
    };

    return (
        <div className="min-h-screen bg-[#0f212e] md:py-8 flex justify-center overflow-x-hidden">
            <div className="w-full max-w-[480px] bg-[#f5f5f9] min-h-screen flex flex-col relative shadow-2xl md:rounded-[6px] md:border-[8px] md:border-black overflow-hidden">
                {/* Sidebar */}
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

                <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
                    {/* Header */}
                    <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-3xl border-b border-black/[0.05] h-16 px-4 flex items-center shrink-0 shadow-sm">
                        {/* Left: Mobile Menu Toggle */}
                        <div className="flex-1 flex justify-start items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsSidebarOpen(prev => !prev);
                                }}
                                className="p-2.5 bg-slate-50 border border-black/[0.05] rounded-[6px] text-slate-600 hover:text-accent transition-all active:scale-95 shadow-sm relative z-[110]"
                            >
                                <Menu size={20} />
                            </button>
                        </div>

                    {/* Center: User Profile */}
                    <div className="flex-[2] flex justify-center items-center">
                        <div className="flex flex-col items-center">
                            <h2 className="text-[8px] font-black text-slate-600 uppercase tracking-[3px] mb-1">Global Player</h2>
                            <span className="text-xs font-black italic tracking-tight uppercase text-accent truncate max-w-[150px]">
                                {userData?.name || userData?.email?.split('@')[0]}
                            </span>
                        </div>
                    </div>

                    {/* Right: Balance & Plus */}
                    <div className="flex-1 flex justify-end items-center gap-2">
                        <div className="bg-slate-50 px-3 py-1.5 rounded-[6px] border border-black/[0.05] flex items-center gap-2 shadow-inner hover:border-accent/30 transition-all group">
                            <div className="bg-amber-100 p-1.5 rounded-[6px]">
                                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[6px] font-black text-slate-600 uppercase leading-none mb-1 tracking-widest">Balance</span>
                                <span className="font-black text-slate-900 tracking-tighter leading-none text-sm">
                                    ₹{(userData?.balance || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleRecharge}
                            className="w-10 h-10 flex items-center justify-center bg-accent text-white rounded-[6px] border border-accent/10 transition-all active:scale-90 shadow-lg shadow-accent/20 group"
                        >
                            <PlusCircle size={20} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className={`flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative ${
                    window.location.pathname.startsWith('/casino/') || window.location.pathname === '/payment'
                        ? 'p-0' 
                        : 'p-4 pb-32'
                } bg-[#f5f5f9]`}>
                    <div className="w-full">
                        {children}
                    </div>
                </main>
                <SupportChat />
            </div>
            <RechargeModal isOpen={isRechargeOpen} onClose={() => setIsRechargeOpen(false)} />
            </div>
        </div>
    );
};

export default DashboardLayout;
