import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Coins, AlertTriangle, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RechargeModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [showCryptoList, setShowCryptoList] = useState(false);
    const [showCryptoRestriction, setShowCryptoRestriction] = useState(false);

    if (!isOpen) return null;

    const selectINR = () => {
        onClose();
        navigate('/add-balance');
    };

    const selectCrypto = () => {
        setShowCryptoList(true);
    };

    const selectCryptoCoin = (coin) => {
        onClose();
        navigate('/add-balance');
    };

    const cryptoCoins = [
        { name: 'USDT', full: 'Tether (TRC-20)', icon: '₮' }
    ];

    return (
        <div className="absolute inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
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
                className="relative w-full max-w-md bg-white border-t sm:border border-black/5 rounded-[6px] sm:rounded-[6px] overflow-hidden shadow-2xl"
            >
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
                                {showCryptoList ? 'SELECT COIN' : 'SELECT METHOD'}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-slate-50 rounded-[6px] text-slate-500 hover:text-slate-900 transition-all active:scale-90"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {!showCryptoList ? (
                        <div className="space-y-3">
                            <button
                                onClick={selectINR}
                                className="w-full group p-4 bg-slate-50 hover:bg-slate-100 border border-black/10 hover:border-black/20 rounded-[6px] flex items-center gap-4 transition-all active:scale-[0.98]"
                            >
                                <div className="w-14 h-14 bg-blue-50 rounded-[6px] flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20">
                                    <Wallet size={28} />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="font-black text-lg italic uppercase tracking-tight text-slate-900 leading-none mb-1">INR Payment</p>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest truncate">PhonePe, Paytm, GooglePay (UPI)</p>
                                </div>
                            </button>

                            <button
                                onClick={selectCrypto}
                                className="w-full group p-4 bg-slate-50 hover:bg-slate-100 border border-black/10 hover:border-black/20 rounded-[6px] flex items-center gap-4 transition-all active:scale-[0.98]"
                            >
                                <div className="w-14 h-14 bg-amber-50 rounded-[6px] flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20">
                                    <Coins size={28} />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="font-black text-lg italic uppercase tracking-tight text-slate-900 leading-none mb-1">USDT Pay</p>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest truncate">Global Tether Transfer (TRC-20)</p>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {cryptoCoins.map((coin) => (
                                <button
                                    key={coin.name}
                                    onClick={() => selectCryptoCoin(coin)}
                                    className="flex flex-col items-center p-3 rounded-[6px] bg-slate-50 border border-black/5 hover:bg-slate-100 hover:border-black/10 transition-all group"
                                >
                                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{coin.icon}</span>
                                    <span className="text-[10px] font-black text-slate-900">{coin.name}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-center">
                        {showCryptoList ? (
                            <button
                                onClick={() => setShowCryptoList(false)}
                                className="text-slate-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors py-2"
                            >
                                ← Back to Methods
                            </button>
                        ) : (
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest pb-2">
                                Trusted Payment Gateway v3.0
                            </p>
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {showCryptoRestriction && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute inset-0 z-10 bg-white/95 backdrop-blur-md flex items-center justify-center p-6 text-center rounded-[6px]"
                        >
                            <div className="space-y-6 w-full max-w-[280px]">
                                <div className="w-20 h-20 bg-red-50 border border-red-500/20 rounded-[6px] flex items-center justify-center mx-auto text-red-500 animate-pulse">
                                    <AlertTriangle size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">USDT PAY <br /><span className="text-red-500">BANNED IN INDIA</span></h4>
                                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-tight leading-relaxed">
                                        Offshore USDT transactions for gaming are restricted for Indian residents under FEMA regulations.
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={selectINR}
                                        className="w-full py-4 bg-accent text-white rounded-[6px] font-black uppercase italic tracking-widest shadow-lg shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Wallet size={18} /> Switch to INR
                                    </button>
                                    <button
                                        onClick={() => setShowCryptoRestriction(false)}
                                        className="text-slate-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors"
                                    >
                                        Try Other Coin
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
