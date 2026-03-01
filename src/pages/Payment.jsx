import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle2, Loader2, AlertCircle, ShieldCheck, IndianRupee, QrCode, Smartphone, Info } from 'lucide-react';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Payment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const amount = location.state?.amount || 0;

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
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
        if (!file) {
            toast.error('Please upload a payment screenshot');
            return;
        }

        setLoading(true);
        try {
            // 1. Upload Screenshot to Firebase Storage
            const storageRef = ref(storage, `recharges/${user.uid}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // 2. Save Request to Firestore
            await addDoc(collection(db, 'rechargeRequests'), {
                userId: user.uid,
                userName: userData?.name || user.email.split('@')[0],
                userPhone: userData?.phone || 'N/A',
                amount: amount,
                screenshot: downloadURL,
                status: 'Pending',
                createdAt: serverTimestamp(),
            });

            // 3. Create Notification for Admin
            await addDoc(collection(db, 'notifications'), {
                userId: 'admin_global',
                type: 'new_recharge',
                message: `New recharge request from ${userData?.name || user.email} for ₹${amount}`,
                createdAt: serverTimestamp(),
                read: false
            });

            setSubmitted(true);
            toast.success('Payment submitted successfully!');

            setTimeout(() => {
                navigate('/history');
            }, 5000);

        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Failed to submit payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-red-500/5 blur-[120px] rounded-full translate-y-1/2 scale-150" />
                <div className="max-w-md w-full text-center space-y-10 relative animate-in zoom-in-95 duration-500">
                    <div className="relative mx-auto">
                        <div className="w-32 h-32 bg-emerald-500/10 rounded-[40px] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-2xl animate-bounce">
                            <CheckCircle2 className="text-emerald-500 w-16 h-16" />
                        </div>
                        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Request <span className="logo-red">Logged</span>
                        </h1>
                        <p className="text-zinc-500 font-medium">Your payment is being verified by our elite security team. Balance will update within 5-10 minutes.</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full py-5 bg-zinc-900 hover:bg-white text-zinc-400 hover:text-black rounded-[24px] font-black uppercase italic tracking-widest transition-all border border-white/5 active:scale-95"
                    >
                        Return to Dashboard
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-[4px] text-zinc-700">Redirecting to history in 5s...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] p-4 lg:p-10 pb-24">
            <div className="max-w-2xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-4 bg-zinc-900 rounded-[20px] border border-white/5 text-zinc-400 hover:text-white transition-all shadow-2xl active:scale-95"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="text-red-500" size={14} />
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Secure Checkout</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Complete <span className="logo-red">Payment</span>
                        </h1>
                        <p className="text-zinc-500 text-sm font-medium mt-2">Send ₹{amount.toLocaleString()} to our verified wallet.</p>
                    </div>
                </div>

                {/* QR Section */}
                <div className="group relative bg-[#0a0a0a] rounded-[40px] border border-white/5 p-8 lg:p-12 overflow-hidden hover:border-red-500/20 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <QrCode size={200} />
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-10 relative">
                        <div className="space-y-8 flex-1 text-center lg:text-left">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 h-fit">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Fast Verification Active</span>
                                </div>
                                <h2 className="text-6xl font-black italic tracking-tighter text-white leading-none">₹{amount.toLocaleString()}</h2>
                                <p className="text-zinc-500 text-xs font-black uppercase tracking-[3px]">Total Payable Amount</p>
                            </div>

                            <div className="flex flex-wrap justify-center lg:justify-start gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                <img src="https://logolook.net/wp-content/uploads/2023/11/PhonePe-Logo.png" alt="PhonePe" className="h-8" />
                                <img src="https://logolook.net/wp-content/uploads/2021/11/Paytm-Logo.png" alt="Paytm" className="h-6" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-6" />
                            </div>
                        </div>

                        <div className="relative">
                            <div className="w-64 h-64 bg-white p-6 rounded-[40px] shadow-[0_0_60px_rgba(0,0,0,0.5)] transform transition-transform group-hover:scale-105 duration-500">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=aryan.genral@upi&pn=ARYAN%20GENERAL%20STORE&am=${amount}&cu=INR`}
                                    alt="Payment QR"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Merchant: Aryan General Store</p>
                                </div>
                            </div>
                            <div className="absolute -inset-4 bg-red-500/10 blur-3xl -z-10 group-hover:bg-red-500/20 transition-all duration-500" />
                        </div>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Verification Proof</label>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Mandatory</span>
                    </div>

                    <div className={`relative min-h-[300px] bg-zinc-900/30 border-2 border-dashed rounded-[40px] p-10 flex flex-col items-center justify-center gap-6 transition-all duration-500 ${preview ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 hover:border-red-500/20 hover:bg-zinc-900/50'}`}>
                        {preview ? (
                            <div className="relative group w-full max-w-sm aspect-[4/3] rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
                                <img src={preview} alt="Screenshot Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm">
                                    <button
                                        onClick={() => { setFile(null); setPreview(null); }}
                                        className="px-6 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors shadow-2xl"
                                    >
                                        Remove & Retake
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center group/upload">
                                <div className="w-20 h-20 bg-zinc-900 rounded-[30px] flex items-center justify-center text-zinc-600 mb-6 mx-auto group-hover/upload:scale-110 group-hover/upload:text-red-500 transition-all duration-500 border border-white/5 shadow-2xl">
                                    <Upload size={32} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-white font-black italic uppercase tracking-tight text-xl">Upload Screenshot</p>
                                    <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">PNG, JPG, PDF (Max 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-[30px] flex gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 h-fit shadow-xl shadow-red-500/5">
                            <Info size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Steps to Pay</p>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">Scan QR → Pay exact amount → Take screenshot → Upload proof.</p>
                        </div>
                    </div>
                    <div className="p-6 bg-zinc-900/50 border border-white/5 rounded-[30px] flex gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 h-fit shadow-xl shadow-red-500/5">
                            <Smartphone size={18} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Phone Verification</p>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed">Ensure your phone number {userData?.phone || 'on profile'} matches payment app.</p>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!file || loading}
                    className="group relative w-full overflow-hidden p-6 bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:grayscale text-white rounded-[32px] font-black uppercase italic tracking-[4px] transition-all shadow-2xl shadow-red-600/20 active:scale-95"
                >
                    <div className="absolute inset-0 flex items-center justify-center bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    <div className="relative flex items-center justify-center gap-4">
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>Verifying...</span>
                            </>
                        ) : (
                            <>
                                <span>Submit for Verification</span>
                                <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />
                            </>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
};

export default Payment;

