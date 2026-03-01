import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, ChevronRight, Zap, Coins, Calculator, AlertTriangle, X, PlusCircle } from 'lucide-react';

const AddBalance = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [selectedQuickAmount, setSelectedQuickAmount] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCryptoList, setShowCryptoList] = useState(false);
    const [showCryptoRestriction, setShowCryptoRestriction] = useState(false);
    const [selectedCrypto, setSelectedCrypto] = useState(null);

    const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

    const cryptoCurrencies = [
        { id: 'usdt', name: 'USDT', symbol: 'Tether', icon: '₮' },
        { id: 'btc', name: 'BTC', symbol: 'Bitcoin', icon: '₿' },
        { id: 'eth', name: 'ETH', symbol: 'Ethereum', icon: 'Ξ' },
        { id: 'trx', name: 'TRX', symbol: 'TRON', icon: 'TRX' },
        { id: 'sol', name: 'SOL', symbol: 'Solana', icon: 'S' },
        { id: 'doge', name: 'DOGE', symbol: 'Dogecoin', icon: 'Ð' },
        { id: 'matic', name: 'MATIC', symbol: 'Polygon', icon: 'M' },
        { id: 'ltc', name: 'LTC', symbol: 'Litecoin', icon: 'Ł' },
        { id: 'xrp', name: 'XRP', symbol: 'Ripple', icon: 'X' },
        { id: 'bnb', name: 'BNB', symbol: 'Binance', icon: 'B' },
        { id: 'shib', name: 'SHIB', symbol: 'Shiba Inu', icon: 'SH' },
        { id: 'ada', name: 'ADA', symbol: 'Cardano', icon: 'A' },
    ];

    const handleQuickAmountClick = (val) => {
        setSelectedQuickAmount(val);
        setAmount(val.toString());
    };

    const handleContinue = () => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            return;
        }
        setShowPaymentModal(true);
    };

    const selectINR = () => {
        setShowPaymentModal(false);
        navigate('/payment', { state: { amount: parseFloat(amount) } });
    };

    const selectCrypto = () => {
        setShowPaymentModal(false);
        setShowCryptoList(true);
    };

    const handleCryptoSelection = (crypto) => {
        setSelectedCrypto(crypto);
        setShowCryptoList(false);
        setShowCryptoRestriction(true);
    };

    return (
        <div className="min-h-[calc(100vh-80px)] p-6 bg-[#050505] animate-in fade-in duration-500">
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-zinc-900 rounded-2xl border border-white/5 text-zinc-400 hover:text-white transition-all shadow-xl active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Add <span className="logo-red">Balance</span></h1>
                        <p className="text-sm text-zinc-500 font-medium">Select or enter the amount you want to add</p>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="bg-zinc-900 border border-white/5 rounded-[32px] p-8 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <Wallet size={160} className="text-red-500" />
                    </div>

                    <div className="relative space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Enter Amount</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-zinc-700">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        setSelectedQuickAmount(null);
                                    }}
                                    placeholder="0.00"
                                    className="w-full bg-zinc-950 border border-white/5 rounded-[24px] py-8 pl-14 pr-8 text-4xl font-black text-white focus:outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-zinc-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {quickAmounts.map((val) => (
                                <button
                                    key={val}
                                    onClick={() => handleQuickAmountClick(val)}
                                    className={`py-4 px-4 rounded-2xl border transition-all text-sm font-black italic tracking-tight ${selectedQuickAmount === val
                                        ? 'bg-red-500 border-red-500 text-white shadow-xl shadow-red-500/20 -translate-y-1'
                                        : 'bg-zinc-900/50 border-white/10 text-zinc-400 hover:border-white/20 hover:bg-zinc-800'
                                        }`}
                                >
                                    ₹{val.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="flex items-start gap-5 p-5 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-[24px]">
                    <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-500 shadow-lg shadow-emerald-500/10">
                        <Zap size={20} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-emerald-400 uppercase tracking-wide">Instant Processing</p>
                        <p className="text-xs text-emerald-500/60 leading-relaxed font-medium">
                            Your balance will be updated instantly after admin verification of your payment screenshot.
                        </p>
                    </div>
                </div>

                {/* Continue Button */}
                <button
                    onClick={handleContinue}
                    disabled={!amount || parseFloat(amount) <= 0}
                    className="w-full flex items-center justify-between p-6 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[24px] font-black uppercase tracking-widest transition-all group shadow-xl shadow-red-500/20 active:scale-[0.98]"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                        <span className="text-lg italic">Proceed to Pay</span>
                    </div>
                    <div className="p-2 bg-white/20 rounded-xl group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={24} />
                    </div>
                </button>
            </div>

            {/* Payment Method Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowPaymentModal(false)} />

                    <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Select <span className="logo-red">Method</span></h3>
                                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Amount: ₹{parseFloat(amount).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={selectINR}
                                    className="w-full group p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 rounded-[24px] flex items-center gap-4 transition-all active:scale-[0.98]"
                                >
                                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                                        <Wallet size={28} />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="font-black text-lg italic uppercase tracking-tight text-white mb-1">INR Payment</p>
                                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest truncate">PhonePe, Paytm, GooglePay (UPI)</p>
                                    </div>
                                </button>

                                <button
                                    onClick={selectCrypto}
                                    className="w-full group p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 rounded-[24px] flex items-center gap-4 transition-all active:scale-[0.98]"
                                >
                                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                                        <Coins size={28} />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="font-black text-lg italic uppercase tracking-tight text-white mb-1">Crypto Pay</p>
                                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest truncate">USDT, BTC, ETH, TRX</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Crypto Currency List Modal */}
            {showCryptoList && (
                <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowCryptoList(false)} />

                    <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Select <span className="logo-red">Coin</span></h3>
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Available Crypto Options</p>
                            </div>
                            <button onClick={() => setShowCryptoList(false)} className="p-3 bg-zinc-800 rounded-full text-zinc-500 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 scrollbar-hide">
                            {cryptoCurrencies.map((crypto) => (
                                <button
                                    key={crypto.id}
                                    onClick={() => handleCryptoSelection(crypto)}
                                    className="p-5 bg-white/[0.02] border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 rounded-3xl flex flex-col items-center gap-3 transition-all group active:scale-95"
                                >
                                    <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-red-500 font-black text-xl border border-white/5 group-hover:bg-red-500 group-hover:text-white transition-all">
                                        {crypto.icon}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-sm uppercase italic tracking-tighter text-white">{crypto.name}</p>
                                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{crypto.symbol}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="p-6 bg-zinc-950/50 border-t border-white/5 text-center">
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Global Crypto Protocol V2.1</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Crypto Restriction Popup */}
            {showCryptoRestriction && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowCryptoRestriction(false)} />

                    <div className="relative w-full max-w-sm bg-zinc-950 border border-red-500/30 rounded-[40px] p-10 text-center space-y-8 shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-200">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full animate-pulse" />
                            <div className="relative w-full h-full bg-zinc-900 border border-red-500/30 rounded-[30px] flex items-center justify-center text-red-500 transform rotate-12">
                                <AlertTriangle size={48} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                                {selectedCrypto?.name} <span className="logo-red">BANNED</span>
                            </h3>
                            <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-red-500/10 border border-red-500/20 rounded-full w-fit mx-auto">
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-[3px]">REGULATORY ALERT</span>
                            </div>
                            <p className="text-zinc-400 text-sm leading-relaxed font-bold uppercase tracking-tight">
                                Cryptocurrency transactions for gaming are <span className="text-white">statically banned in India</span> by government authorities.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                onClick={() => {
                                    setShowCryptoRestriction(false);
                                    selectINR();
                                }}
                                className="w-full py-6 bg-red-600 hover:bg-red-500 text-white rounded-[24px] font-black uppercase italic tracking-[4px] shadow-2xl shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Wallet size={20} /> Switch to INR
                            </button>

                            <button
                                onClick={() => setShowCryptoRestriction(false)}
                                className="w-full py-4 text-zinc-600 hover:text-white text-[10px] font-black uppercase tracking-[5px] transition-colors"
                            >
                                Dismiss Warning
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AddBalance;

