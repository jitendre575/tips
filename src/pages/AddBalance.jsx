import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, ChevronRight, Zap, Coins, AlertTriangle, PlusCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AddBalance = () => {
    const navigate = useNavigate();
    const [amount, setAmount] = useState('');
    const [selectedQuickAmount, setSelectedQuickAmount] = useState(null);
    const [showUSDTDetails, setShowUSDTDetails] = useState(false);
    const [usdtHash, setUsdtHash] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currency, setCurrency] = useState(null); // null means hasn't selected method yet
    const [showAmountInput, setShowAmountInput] = useState(false); // New state to control flow

    const quickAmounts = [500, 1000, 2000, 5000, 10000, 20000];

    const handleQuickAmountClick = (val) => {
        setSelectedQuickAmount(val);
        setAmount(val.toString());
    };

    const selectINR = () => {
        setCurrency('INR');
        setShowAmountInput(true);
    };

    const selectCrypto = () => {
        setCurrency('USDT');
        setShowAmountInput(true);
        setShowUSDTDetails(true);
    };

    const handleContinue = () => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (currency === 'INR') {
            navigate('/payment', { state: { amount: parseFloat(amount) } });
        } else {
            // For crypto, we show the USDT details on the same page
            setShowUSDTDetails(true);
        }
    };

    const { user, userData } = useAuth();

    const submitUSDT = async () => {
        if (!usdtHash || usdtHash.length < 10) {
            toast.error('Please enter a valid Transaction Hash');
            return;
        }

        if (!user) {
            toast.error('Please login to continue');
            return;
        }

        setIsSubmitting(true);
        try {
            const { db } = await import('../firebase');
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

            await addDoc(collection(db, 'rechargeRequests'), {
                userId: user.uid,
                userName: userData?.name || user.email.split('@')[0],
                amount: parseFloat(amount),
                currency: 'USDT',
                hash: usdtHash.trim(),
                status: 'Pending',
                createdAt: serverTimestamp()
            });

            toast.success('USDT DEPOSIT RECORDED!');
            navigate('/history');
        } catch (error) {
            toast.error('Submission failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] p-3 sm:p-6 bg-primary animate-in fade-in duration-500">
            <div className="max-w-xl mx-auto space-y-4 sm:space-y-8">
                {/* Header */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-[10px] border border-black/5 text-slate-500 hover:text-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none mb-1">Add <span className="logo-accent">Balance</span></h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-tight">Select or enter the amount you want to add</p>
                    </div>
                </div>

                {!showAmountInput ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <button
                                onClick={selectINR}
                                className="group relative p-8 bg-white hover:bg-slate-50 border border-black/10 hover:border-blue-500/30 rounded-[10px] transition-all active:scale-[0.98] text-left overflow-hidden shadow-sm"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                                    <Wallet size={120} className="text-blue-500" />
                                </div>
                                <div className="relative space-y-4">
                                    <div className="w-16 h-16 bg-blue-50 rounded-[10px] flex items-center justify-center text-blue-500 border border-blue-500/20">
                                        <Wallet size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-[1000] italic uppercase tracking-tighter text-slate-900 leading-none mb-2">INR Payment</h3>
                                        <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest leading-relaxed">UPI, PhonePe, Paytm, GooglePay</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={selectCrypto}
                                className="group relative p-8 bg-white hover:bg-slate-50 border border-black/10 hover:border-amber-500/30 rounded-[10px] transition-all active:scale-[0.98] text-left overflow-hidden shadow-sm"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity">
                                    <Coins size={120} className="text-amber-500" />
                                </div>
                                <div className="relative space-y-4">
                                    <div className="w-16 h-16 bg-amber-50 rounded-[10px] flex items-center justify-center text-amber-500 border border-amber-500/20">
                                        <Coins size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-[1000] italic uppercase tracking-tighter text-slate-900 leading-none mb-2">USDT Pay</h3>
                                        <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest leading-relaxed">Fast Global Crypto Transfer (TRC-20)</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : !showUSDTDetails ? (
                    <>
                        {/* Amount Input */}
                        <div className="bg-white border border-black/5 rounded-[10px] p-5 sm:p-8 relative overflow-hidden group shadow-sm">
                            <div className="absolute top-0 right-0 p-5 sm:p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                {currency === 'INR' ? <Wallet size={160} className="text-blue-500" /> : <Coins size={160} className="text-amber-500" />}
                            </div>

                            <div className="relative space-y-6 sm:space-y-8">
                                <div className="flex justify-between items-center mb-[-10px]">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Enter Amount ({currency})</label>
                                    <button onClick={() => setShowAmountInput(false)} className="text-[10px] font-black text-slate-400 hover:text-accent uppercase tracking-widest">Change Method</button>
                                </div>
                                <div className="relative">
                                    <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-400 transition-colors ${currency === 'INR' ? 'group-focus-within:text-blue-500' : 'group-focus-within:text-amber-500'}`}>{currency === 'USDT' ? '₮' : '₹'}</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => {
                                            setAmount(e.target.value);
                                            setSelectedQuickAmount(null);
                                        }}
                                        placeholder="0.00"
                                        className={`w-full bg-slate-50 border border-black/5 rounded-[10px] py-4 sm:py-6 pl-14 pr-6 text-3xl sm:text-4xl font-[1000] text-slate-900 focus:outline-none transition-all placeholder:text-slate-300 tracking-tight ${currency === 'INR' ? 'focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10' : 'focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10'}`}
                                    />
                                    <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent opacity-0 group-focus-within:opacity-100 transition-opacity ${currency === 'INR' ? 'via-blue-500/20' : 'via-amber-500/20'}`} />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                                    {quickAmounts.map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => handleQuickAmountClick(val)}
                                            className={`relative group/btn py-3 px-2 sm:py-5 sm:px-4 rounded-[10px] sm:rounded-[10px] border transition-all duration-300 text-xs sm:text-sm font-black italic tracking-tight overflow-hidden ${selectedQuickAmount === val
                                                ? (currency === 'INR' ? 'bg-blue-600 border-blue-600' : 'bg-amber-500 border-amber-500') + ' text-white shadow-xl -translate-y-1'
                                                : 'bg-slate-50 border-black/5 text-slate-600 hover:border-black/10 hover:bg-slate-100 hover:-translate-y-1'
                                                }`}
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity ${selectedQuickAmount === val ? 'opacity-100' : ''}`} />
                                            <span className="relative z-10">{currency === 'USDT' ? '₮' : '₹'}{val.toLocaleString()}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Info Card */}
                        <div className={`flex items-start gap-5 p-5 border rounded-[10px] ${currency === 'INR' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                            <div className={`p-3 rounded-[10px] shadow-lg ${currency === 'INR' ? 'bg-blue-500/20 text-blue-500 shadow-blue-500/10' : 'bg-emerald-500/20 text-emerald-500 shadow-emerald-500/10'}`}>
                                <Zap size={20} />
                            </div>
                            <div className="space-y-1">
                                <p className={`text-sm font-black uppercase tracking-wide ${currency === 'INR' ? 'text-blue-400' : 'text-emerald-400'}`}>Instant Processing</p>
                                <p className={`text-xs leading-relaxed font-medium ${currency === 'INR' ? 'text-blue-500/60' : 'text-emerald-500/60'}`}>
                                    Your balance will be updated instantly after admin verification of your payment.
                                </p>
                            </div>
                        </div>

                        {/* Continue Button */}
                        <button
                            onClick={handleContinue}
                            disabled={!amount || parseFloat(amount) <= 0}
                            className={`w-full flex items-center justify-between p-4 sm:p-5 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[10px] font-black uppercase tracking-widest transition-all group shadow-xl active:scale-[0.98] ${currency === 'INR' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' : 'bg-accent hover:bg-accent-hover shadow-accent/20'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/10 rounded-[10px]">
                                    <PlusCircle className="w-5 h-5" />
                                </div>
                                <span className="text-base sm:text-lg italic tracking-tight">Proceed to {currency === 'INR' ? 'Pay' : 'Submit'}</span>
                            </div>
                            <div className="p-1.5 bg-white/20 rounded-[10px] group-hover:translate-x-1 transition-transform">
                                <ChevronRight className="w-5 h-5" />
                            </div>
                        </button>
                    </>
                ) : (
                    <div className="bg-white border border-black/5 rounded-[10px] p-8 space-y-8 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden relative">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />
                        
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 rounded-[10px] flex items-center justify-center text-amber-500 font-bold border border-amber-500/20 text-xl">₮</div>
                                <div>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">USDT <span className="logo-accent text-amber-500">DEPOSIT</span></h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                                        {amount ? `Send ₮${parseFloat(amount).toLocaleString()} TRC-20` : 'Send USDT TRC-20'}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    setShowUSDTDetails(false);
                                    setShowAmountInput(false);
                                }} 
                                className="p-3 bg-slate-100 rounded-[10px] text-slate-500 hover:text-slate-900 transition-all"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-5 bg-slate-900 rounded-[10px] border border-white/10 space-y-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Admin USDT Wallet</p>
                                    <div className="flex items-center gap-3">
                                        <code className="flex-1 bg-black/40 p-3 rounded-[10px] text-amber-500 font-mono text-xs break-all border border-white/5 uppercase">
                                            TH6T9x8qZp9W1V7rX6y5Q2mN8K3L4vA1B2
                                        </code>
                                        <button 
                                            onClick={() => {
                                                navigator.clipboard.writeText('TH6T9x8qZp9W1V7rX6y5Q2mN8K3L4vA1B2');
                                                toast.success('Wallet Address Copied');
                                            }}
                                            className="p-3 px-4 bg-amber-500 text-white rounded-[10px] hover:bg-amber-600 transition-all font-black text-xs uppercase"
                                        >
                                            COPY
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-amber-500/80">
                                    <AlertTriangle size={14} />
                                    <p className="text-[9px] font-black uppercase tracking-widest">SEND ONLY USDT TRC-20 TO THIS ADDRESS</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Transaction Hash (TXID)</label>
                                <input
                                    type="text"
                                    value={usdtHash}
                                    onChange={(e) => setUsdtHash(e.target.value)}
                                    placeholder="Enter your TXID hash here..."
                                    className="w-full bg-slate-50 border border-black/5 rounded-[10px] py-4 px-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500/30 transition-all"
                                />
                                <p className="text-[9px] text-slate-400 font-medium ml-1">Verify your transaction on TronScan before submitting.</p>
                            </div>

                            <button
                                onClick={submitUSDT}
                                disabled={!usdtHash || isSubmitting}
                                className="w-full py-5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-[10px] font-black uppercase italic tracking-widest transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center justify-center gap-3"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                <span>{isSubmitting ? 'Verifying...' : 'Submit Deposit'}</span>
                            </button>

                            <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                Funds will be credited after <span className="text-amber-600">3 Network Confirmations</span>.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddBalance;
