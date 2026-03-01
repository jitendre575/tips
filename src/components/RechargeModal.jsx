import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Coins, AlertTriangle, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RechargeModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('1000');
    const [showCryptoRestriction, setShowCryptoRestriction] = useState(false);

    if (!isOpen) return null;

    const selectINR = () => {
        onClose();
        navigate('/payment', { state: { amount: parseFloat(amount) || 1000 } });
    };

    const selectCrypto = () => {
        setShowCryptoRestriction(true);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="relative w-full max-w-md bg-[#121212] border-t sm:border border-white/10 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl"
            >
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                                SELECT <span className="text-red-600">METHOD</span>
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-none">Amount:</span>
                                <div className="flex items-center bg-white/[0.03] px-3 py-1 rounded-full border border-white/5">
                                    <span className="text-white font-black italic text-xs tracking-tighter">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="bg-transparent border-none outline-none text-white font-black italic text-xs tracking-tighter w-16 ml-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white/[0.05] rounded-full text-zinc-500 hover:text-white transition-all active:scale-90"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={selectINR}
                            className="w-full group p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-[24px] flex items-center gap-4 transition-all active:scale-[0.98]"
                        >
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                                <Wallet size={28} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="font-black text-lg italic uppercase tracking-tight text-white leading-none mb-1">INR Payment</p>
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest truncate">PhonePe, Paytm, GooglePay (UPI)</p>
                            </div>
                        </button>

                        <button
                            onClick={selectCrypto}
                            className="w-full group p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-[24px] flex items-center gap-4 transition-all active:scale-[0.98]"
                        >
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                                <Coins size={28} />
                            </div>
                            <div className="text-left min-w-0">
                                <p className="font-black text-lg italic uppercase tracking-tight text-white leading-none mb-1">Crypto Pay</p>
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest truncate">USDT, BTC, ETH, TRX</p>
                            </div>
                        </button>
                    </div>

                    <p className="text-center text-[9px] font-black text-zinc-600 uppercase tracking-widest pb-2">
                        Trusted Payment Gateway v3.0
                    </p>
                </div>

                <AnimatePresence>
                    {showCryptoRestriction && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-10 bg-black/95 flex items-center justify-center p-6 text-center"
                        >
                            <div className="space-y-6">
                                <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
                                    <AlertTriangle size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white">CRYPTO <span className="text-red-600">BANNED</span></h4>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-tight px-4 leading-relaxed">
                                        Cryptocurrency for gaming is restricted in India. Your transaction will be declined.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={selectINR}
                                        className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Wallet size={18} /> Switch to INR
                                    </button>
                                    <button
                                        onClick={() => setShowCryptoRestriction(false)}
                                        className="text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default RechargeModal;
