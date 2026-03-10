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
        <div className="min-h-[calc(100vh-80px)] p-6 bg-primary animate-in fade-in duration-500">
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl border border-black/5 text-slate-500 hover:text-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Add <span className="logo-accent">Balance</span></h1>
                        <p className="text-sm text-slate-500 font-medium">Select or enter the amount you want to add</p>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="bg-white border border-black/5 rounded-[32px] p-8 relative overflow-hidden group shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <Wallet size={160} className="text-accent" />
                    </div>

                    <div className="relative space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Enter Amount</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-400 group-focus-within:text-accent transition-colors">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => {
                                        setAmount(e.target.value);
                                        setSelectedQuickAmount(null);
                                    }}
                                    placeholder="0.00"
                                    className="w-full bg-slate-50 border border-black/5 rounded-[28px] py-10 pl-16 pr-8 text-5xl font-[1000] text-slate-900 focus:outline-none focus:border-accent/50 focus:ring-4 focus:ring-accent/10 transition-all placeholder:text-slate-300 tracking-tight"
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-accent/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {quickAmounts.map((val) => (
                                <button
                                    key={val}
                                    onClick={() => handleQuickAmountClick(val)}
                                    className={`relative group/btn py-5 px-4 rounded-2xl border transition-all duration-300 text-sm font-black italic tracking-tight overflow-hidden ${selectedQuickAmount === val
                                        ? 'bg-accent border-accent text-white shadow-[0_0_30px_rgba(239,68,68,0.3)] -translate-y-1'
                                        : 'bg-slate-50 border-black/5 text-slate-600 hover:border-black/10 hover:bg-slate-100 hover:-translate-y-1'
                                        }`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity ${selectedQuickAmount === val ? 'opacity-100' : ''}`} />
                                    <span className="relative z-10">₹{val.toLocaleString()}</span>
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
                    className="w-full flex items-center justify-between p-6 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[24px] font-black uppercase tracking-widest transition-all group shadow-xl shadow-accent/20 active:scale-[0.98]"
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
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />

                    <div className="relative w-full max-w-md bg-white border border-black/5 rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
                        <div className="p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Select <span className="logo-accent">Method</span></h3>
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Amount: ₹{parseFloat(amount).toLocaleString()}</p>
                                </div>
                                <button onClick={() => setShowPaymentModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <button
                                    onClick={selectINR}
                                    className="w-full group relative p-6 bg-slate-50 hover:bg-slate-100 border border-black/5 hover:border-blue-500/30 rounded-[32px] flex items-center gap-5 transition-all active:scale-[0.98] overflow-hidden"
                                >
                                    <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-600 rounded-full scale-x-90 group-hover:scale-x-100 transition-transform" />
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                        <Wallet size={32} />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="font-black text-xl italic uppercase tracking-tighter text-slate-900 mb-1 group-hover:text-blue-500 transition-colors">INR Payment</p>
                                        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[2px] leading-tight">PhonePe, Paytm, GooglePay (UPI)</p>
                                    </div>
                                </button>

                                <button
                                    onClick={selectCrypto}
                                    className="w-full group relative p-6 bg-slate-50 hover:bg-slate-100 border border-black/5 hover:border-amber-500/30 rounded-[32px] flex items-center gap-5 transition-all active:scale-[0.98] overflow-hidden"
                                >
                                    <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-600 rounded-full scale-x-90 group-hover:scale-x-100 transition-transform" />
                                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform">
                                        <Coins size={32} />
                                    </div>
                                    <div className="text-left min-w-0">
                                        <p className="font-black text-xl italic uppercase tracking-tighter text-slate-900 mb-1 group-hover:text-amber-500 transition-colors">Crypto Pay</p>
                                        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[2px] leading-tight">USDT, BTC, ETH, TRX</p>
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
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCryptoList(false)} />

                    <div className="relative w-full max-w-md bg-white border border-black/5 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
                        <div className="p-8 border-b border-black/5 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Select <span className="logo-accent">Coin</span></h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Available Crypto Options</p>
                            </div>
                            <button onClick={() => setShowCryptoList(false)} className="p-3 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 scrollbar-hide">
                            {cryptoCurrencies.map((crypto) => (
                                <button
                                    key={crypto.id}
                                    onClick={() => handleCryptoSelection(crypto)}
                                    className="p-5 bg-slate-50 border border-black/5 hover:border-accent/30 hover:bg-accent/5 rounded-3xl flex flex-col items-center gap-3 transition-all group active:scale-95"
                                >
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-accent font-black text-xl border border-black/5 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                                        {crypto.icon}
                                    </div>
                                    <div className="text-center">
                                        <p className="font-black text-sm uppercase italic tracking-tighter text-slate-900">{crypto.name}</p>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{crypto.symbol}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-black/5 text-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Crypto Protocol V2.1</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Crypto Restriction Popup */}
            {showCryptoRestriction && (
                <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCryptoRestriction(false)} />

                    <div className="relative w-full max-w-sm bg-white border border-red-500/20 rounded-[40px] p-10 text-center space-y-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in-95 duration-200">
                        <div className="relative mx-auto w-24 h-24">
                            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                            <div className="relative w-full h-full bg-red-50 border border-red-500/20 rounded-[30px] flex items-center justify-center text-red-500 transform rotate-12">
                                <AlertTriangle size={48} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                                {selectedCrypto?.name} <span className="logo-accent">BANNED</span>
                            </h3>
                            <div className="flex items-center justify-center gap-2 py-1.5 px-3 bg-red-500/10 border border-red-500/20 rounded-full w-fit mx-auto">
                                <span className="text-[10px] font-black text-red-600 uppercase tracking-[3px]">REGULATORY ALERT</span>
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed font-bold uppercase tracking-tight">
                                Cryptocurrency transactions for gaming are <span className="text-red-500">statically banned in India</span> by government authorities.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                onClick={() => {
                                    setShowCryptoRestriction(false);
                                    selectINR();
                                }}
                                className="w-full py-6 bg-accent hover:bg-accent-hover text-white rounded-[24px] font-black uppercase italic tracking-[4px] shadow-xl shadow-accent/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                            >
                                <Wallet size={20} /> Switch to INR
                            </button>

                            <button
                                onClick={() => setShowCryptoRestriction(false)}
                                className="w-full py-4 text-slate-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-[5px] transition-colors"
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

