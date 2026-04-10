import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Wallet, PlusCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import SupportChat from './SupportChat';
import RechargeModal from './RechargeModal';

const DashboardLayout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isRechargeOpen, setIsRechargeOpen] = useState(false);
    const [isBalanceOpen, setIsBalanceOpen] = useState(false);
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
                    <div className="flex-1 flex justify-end items-center gap-2 relative">
                        <div 
                            className="bg-slate-50 px-3 py-1.5 rounded-[6px] border border-black/[0.05] flex items-center gap-2 shadow-inner hover:border-accent/30 transition-all group cursor-pointer"
                            onClick={() => setIsBalanceOpen(!isBalanceOpen)}
                        >
                            <div className="bg-amber-100 p-1.5 rounded-[6px]">
                                <Wallet className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[6px] font-black text-slate-600 uppercase leading-none mb-1 tracking-widest">Balance</span>
                                <span className="font-black text-slate-900 tracking-tighter leading-none text-sm flex items-center gap-1">
                                    <span className="text-[10px] text-slate-400">∑</span>
                                    {((userData?.balance || userData?.inrBalance || 0) + (userData?.usdtBalance || 0)).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {/* Balance Breakdown Dropdown */}
                        <AnimatePresence>
                            {isBalanceOpen && (
                                <>
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[140]"
                                        onClick={() => setIsBalanceOpen(false)}
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-14 right-12 w-48 bg-white border border-black/[0.05] rounded-[6px] shadow-2xl p-4 z-[150] space-y-4"
                                    >
                                        <div className="flex justify-between items-center group/item hover:bg-slate-50 p-2 rounded-[6px] transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-emerald-100 rounded-[6px] flex items-center justify-center text-emerald-600 text-xs font-black">₹</div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase">INR Wallet</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-900">{(userData?.balance || userData?.inrBalance || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center group/item hover:bg-slate-50 p-2 rounded-[6px] transition-colors">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-blue-100 rounded-[6px] flex items-center justify-center text-blue-600 text-xs font-black">₮</div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase">USDT Pay</span>
                                            </div>
                                            <span className="text-xs font-black text-slate-900">{(userData?.usdtBalance || 0).toLocaleString()}</span>
                                        </div>
                                        <div className="pt-2 border-t border-black/5">
                                            <button 
                                                onClick={() => { setIsBalanceOpen(false); handleRecharge(); }}
                                                className="w-full py-2 bg-accent text-white rounded-[6px] text-[8px] font-black uppercase tracking-[2px] shadow-lg shadow-accent/20 active:scale-95 transition-all"
                                            >
                                                Add Funds +
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

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
