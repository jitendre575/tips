import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle2, Loader2, AlertCircle, ShieldCheck, IndianRupee, QrCode, Smartphone, Info } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Payment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const amount = location.state?.amount || 0;

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [utr, setUtr] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [statusText, setStatusText] = useState('');
    const [submitted, setSubmitted] = useState(false);

    if (amount <= 0) {
        navigate('/add-balance');
        return null;
    }

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast.error('File size too large (Max 5MB)');
                return;
            }
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async () => {
        if (!utr || utr.length < 6) {
            toast.error('Please enter a valid Transaction/UTR ID');
            return;
        }

        setLoading(true);
        setStatusText('Securing Connection...');

        try {
            // STEP 1: Immediate Metalogging
            const requestPayload = {
                userId: user?.uid || 'unknown_id',
                userName: userData?.name || (user?.email ? user.email.split('@')[0] : 'Member'),
                userPhone: userData?.phone || user?.phoneNumber || 'N/A',
                amount: Number(amount),
                utr: utr.trim(),
                screenshot: null,
                status: 'Pending',
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'rechargeRequests'), requestPayload);

            // STEP 1.5: Immediate Admin Notification
            await addDoc(collection(db, 'notifications'), {
                userId: 'admin_global',
                type: 'new_recharge',
                message: `New ₹${amount} deposit (${utr}) from ${userData?.name || 'Member'}`,
                createdAt: serverTimestamp(),
                read: false
            }).catch(() => null);

            setSubmitted(true);
            toast.success('DEPOSIT VERIFIED & LOGGED!');
            setTimeout(() => navigate('/history'), 2000);

        } catch (error) {
            console.error('Submission crash:', error);
            
            const errorMsg = error.code === 'permission-denied'
                ? "ACCESS FORBIDDEN: Check Firebase Rules"
                : (error.message || "Connection failed");

            toast.error(`CRITICAL ERROR: ${errorMsg}`);
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary p-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-accent/5 blur-[120px] rounded-[6px] translate-y-1/2 scale-150" />
                <div className="max-w-md w-full relative animate-in zoom-in-95 duration-500">
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[6px] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />

                        <div className="relative mx-auto">
                            <div className="w-32 h-32 bg-emerald-500/10 rounded-[6px] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-2xl animate-bounce">
                                <CheckCircle2 className="text-emerald-500 w-16 h-16" />
                            </div>
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-[6px] -z-10" />
                        </div>

                        <div className="space-y-6 text-center">
                            <div className="space-y-2">
                                <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
                                    <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">Request</span> <br />
                                    <span className="logo-accent text-emerald-500">Logged</span>
                                </h1>
                                <div className="h-1 w-12 bg-emerald-500/50 mx-auto rounded-[6px]" />
                            </div>
                            <p className="text-zinc-400 font-bold uppercase text-[11px] tracking-widest leading-relaxed px-4">
                                Your payment is being verified by our <span className="text-emerald-400">elite security team</span>. Balance will update within 5-10 minutes.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-6 bg-white text-black rounded-[6px] font-black uppercase italic tracking-widest transition-all hover:bg-emerald-500 hover:text-white active:scale-95 shadow-xl shadow-white/5"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[4px] text-zinc-600 animate-pulse">Redirecting to history in 5s...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f9] flex items-center justify-center p-0 font-['Outfit',sans-serif]">
            <div className="w-full space-y-6 animate-in zoom-in-95 duration-700">
                {/* Main Scanning Pad - The Only Active Area */}
                <div className="bg-slate-900 rounded-[6px] p-8 sm:p-10 text-center space-y-8 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.5)] relative overflow-hidden group">
                    {/* Animated Scan Line */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-blue-500/50 blur-sm animate-[scan_3s_infinite]" />
                    
                    <div className="relative mx-auto w-fit">
                        <div className="bg-white p-4 rounded-[6px] shadow-2xl relative z-10">
                            <img
                                src="/qr_inr.png"
                                alt="Payment QR"
                                className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                            />
                        </div>
                        {/* Glow under QR */}
                        <div className="absolute inset-x-[-20px] inset-y-[-20px] bg-blue-500/20 blur-[60px] rounded-[6px] -z-10 group-hover:bg-blue-50/40 transition-all duration-700" />
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3 text-left">
                            <div className="flex justify-between items-center px-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">UTR / Transaction ID</label>
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 italic">₹{amount}</span>
                            </div>
                            <input
                                type="text"
                                placeholder="ENTER 12-DIGIT UTR"
                                value={utr}
                                onChange={(e) => setUtr(e.target.value)}
                                className="w-full bg-slate-800 border border-white/10 rounded-[6px] py-5 px-8 text-xl font-black text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-700 uppercase tracking-[0.2em]"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!utr || utr.length < 6 || loading}
                            className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:grayscale text-white rounded-[6px] font-black uppercase italic tracking-[5px] transition-all shadow-xl shadow-blue-900/40 active:scale-[0.98] text-sm flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    <span>Submit Deposit</span>
                                    <CheckCircle2 size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan {
                    0%, 100% { top: 5%; opacity: 0.1; }
                    50% { top: 95%; opacity: 1; }
                }
            `}} />
        </div>
    );
};

export default Payment;
