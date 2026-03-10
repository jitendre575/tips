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
        if (!file) {
            toast.error('Please upload a screenshot of your payment');
            return;
        }

        setLoading(true);
        setUploadProgress(10);
        setStatusText('Securing Connection...');

        let watchdogTimer;

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

            const docRef = await addDoc(collection(db, 'rechargeRequests'), requestPayload);
            const requestId = docRef.id;

            // STEP 1.5: Immediate Admin Notification (Alert before photo finishes)
            await addDoc(collection(db, 'notifications'), {
                userId: 'admin_global',
                type: 'new_recharge',
                message: `New ₹${amount} deposit (${utr}) from ${userData?.name || 'Member'}`,
                createdAt: serverTimestamp(),
                read: false
            }).catch(() => null);

            setUploadProgress(30);
            setStatusText('Syncing UTR ID...');

            // STEP 2: Precise Upload
            let uploadFinished = false;

            watchdogTimer = setTimeout(() => {
                if (!uploadFinished) {
                    setSubmitted(true);
                    toast.success('UTR LOGGED! Photo still sending in background.', { duration: 6000 });
                }
            }, 35000); // 35 seconds for slow uploads

            setStatusText('Uploading Proof...');
            // Path structure: recharges/UID/TIMESTAMP_FILENAME
            const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storagePath = `recharges/${user?.uid || 'guest'}/${fileName}`;
            const storageRef = ref(storage, storagePath);

            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(progress));
                },
                (error) => {
                    console.error("Storage Error:", error);
                    clearTimeout(watchdogTimer);
                    setSubmitted(true);
                    toast.error(`Photo Error: ${error.code || 'Upload failed'}. UTR still logged!`);
                },
                async () => {
                    uploadFinished = true;
                    clearTimeout(watchdogTimer);

                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        // STEP 3: Update Firestore
                        await updateDoc(doc(db, 'rechargeRequests', requestId), {
                            screenshot: downloadURL
                        });

                        setUploadProgress(100);
                        setSubmitted(true);
                        toast.success('DEPOSIT VERIFIED & LOGGED!');
                        setTimeout(() => navigate('/history'), 2000);
                    } catch (err) {
                        setSubmitted(true);
                        toast.error("URL generation failed, but UTR is safe.");
                    }
                }
            );

        } catch (error) {
            console.error('Submission crash:', error);
            clearTimeout(watchdogTimer);

            // Explicit error reporting for Firestore write failures
            const errorMsg = error.code === 'permission-denied'
                ? "ACCESS FORBIDDEN: Check Firebase Rules"
                : (error.message || "Connection failed");

            if (statusText !== 'Securing Connection...') {
                setSubmitted(true);
                toast.error(`UTR LOG ERROR: ${errorMsg}. Photo failed too.`);
            } else {
                toast.error(`CRITICAL ERROR: ${errorMsg}`);
                setLoading(false);
            }
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary p-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-accent/5 blur-[120px] rounded-full translate-y-1/2 scale-150" />
                <div className="max-w-md w-full relative animate-in zoom-in-95 duration-500">
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500" />

                        <div className="relative mx-auto">
                            <div className="w-32 h-32 bg-emerald-500/10 rounded-[40px] flex items-center justify-center mx-auto border border-emerald-500/20 shadow-2xl animate-bounce">
                                <CheckCircle2 className="text-emerald-500 w-16 h-16" />
                            </div>
                            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full -z-10" />
                        </div>

                        <div className="space-y-6 text-center">
                            <div className="space-y-2">
                                <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter uppercase leading-none">
                                    <span className="text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">Request</span> <br />
                                    <span className="logo-accent text-emerald-500">Logged</span>
                                </h1>
                                <div className="h-1 w-12 bg-emerald-500/50 mx-auto rounded-full" />
                            </div>
                            <p className="text-zinc-400 font-bold uppercase text-[11px] tracking-widest leading-relaxed px-4">
                                Your payment is being verified by our <span className="text-emerald-400">elite security team</span>. Balance will update within 5-10 minutes.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-6 bg-white text-black rounded-[24px] font-black uppercase italic tracking-widest transition-all hover:bg-emerald-500 hover:text-white active:scale-95 shadow-xl shadow-white/5"
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
        <div className="min-h-screen bg-primary p-4 lg:p-6 pb-20 mt-[-20px]">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-zinc-900 rounded-[16px] border border-white/5 text-zinc-400 hover:text-white transition-all shadow-2xl active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="text-accent" size={14} />
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Secure Checkout</span>
                        </div>
                        <h1 className="text-2xl lg:text-3xl font-[1000] text-white italic tracking-[-0.05em] uppercase leading-none">
                            COMPLETE <span className="text-[#3b82f6]">PAYMENT</span>
                        </h1>
                        <p className="text-zinc-500 text-[13px] font-medium mt-1">Send ₹{amount.toLocaleString()} to our verified wallet.</p>
                    </div>
                </div>

                {/* QR Section */}
                <div className="group relative bg-surface rounded-[32px] border border-white/5 p-6 lg:p-8 overflow-hidden hover:border-accent/20 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                        <QrCode size={200} />
                    </div>

                    <div className="flex flex-col lg:flex-row items-center gap-6 relative">
                        <div className="space-y-8 flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 h-fit">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Fast Verification Active</span>
                            </div>
                            <h2 className="text-5xl font-black italic tracking-tighter text-white leading-none">₹{amount.toLocaleString()}</h2>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[2px]">Total Payable Amount</p>
                        </div>

                        <div className="flex flex-wrap justify-center lg:justify-start gap-5 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/PhonePe_Logo.svg/200px-PhonePe_Logo.svg.png" alt="PhonePe" className="h-8 object-contain" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/200px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" className="h-6 object-contain" />
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo.png/200px-UPI-Logo.png" alt="UPI" className="h-6 object-contain" />
                        </div>

                        <div className="relative">
                            <div className="w-56 h-56 bg-white p-4 rounded-[32px] shadow-[0_0_60px_rgba(0,0,0,0.5)] transform transition-transform group-hover:scale-105 duration-500">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=aryan.genral@upi&pn=ARYAN%20GENERAL%20STORE&am=${amount}&cu=INR`}
                                    alt="Payment QR"
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Merchant: Aryan General Store</p>
                                </div>
                            </div>
                            <div className="absolute -inset-4 bg-accent/10 blur-3xl -z-10 group-hover:bg-accent/20 transition-all duration-500" />
                        </div>
                    </div>
                </div>

                {/* UTR Input Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Transaction Details</label>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#3b82f6]">12 Digit UTR / Ref ID</span>
                    </div>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="Enter 12-digit UTR Number"
                            value={utr}
                            onChange={(e) => setUtr(e.target.value)}
                            className="w-full bg-zinc-950 border border-white/5 rounded-[24px] py-6 px-8 text-xl font-black text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-zinc-800 uppercase tracking-widest"
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-blue-500/10 rounded-lg text-blue-500 pointer-events-none group-focus-within:scale-110 transition-transform">
                            <ShieldCheck size={20} />
                        </div>
                    </div>
                </div>

                {/* Upload Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Verification Proof</label>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Mandatory</span>
                    </div>

                    <div className={`relative min-h-[220px] bg-zinc-900/30 border-2 border-dashed rounded-[32px] p-6 sm:p-8 flex flex-col items-center justify-center gap-4 transition-all duration-500 ${preview ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/5 hover:border-red-500/20 hover:bg-zinc-900/50'}`}>
                        {preview ? (
                            <div className="relative group w-full max-w-sm aspect-[4/3] rounded-[32px] overflow-hidden shadow-2xl border border-white/10">
                                <img src={preview} alt="Screenshot Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm">
                                    <button
                                        onClick={() => { setFile(null); setPreview(null); }}
                                        className="px-6 py-3 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-400 transition-colors shadow-2xl shadow-red-500/20"
                                    >
                                        Remove & Retake
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center group/upload">
                                <div className="w-20 h-20 bg-zinc-950 rounded-[30px] flex items-center justify-center text-zinc-700 mb-6 mx-auto group-hover/upload:scale-110 group-hover/upload:text-accent transition-all duration-500 border border-white/5 shadow-2xl">
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
                <div className="grid sm:grid-cols-2 gap-3">
                    <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-[24px] flex gap-3">
                        <div className="p-2.5 bg-accent/10 rounded-xl text-accent h-fit shadow-xl shadow-accent/5">
                            <Info size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-white uppercase tracking-widest">Steps to Pay</p>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">Scan QR → Pay amount → Take screenshot → Upload.</p>
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-[24px] flex gap-3">
                        <div className="p-2.5 bg-accent/10 rounded-xl text-accent h-fit shadow-xl shadow-accent/5">
                            <Smartphone size={16} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-white uppercase tracking-widest">Phone Match</p>
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">Ensure number {userData?.phone || ''} matches payment app.</p>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleSubmit}
                    disabled={!file || loading}
                    className="group relative w-full overflow-hidden p-6 bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:grayscale text-white rounded-[24px] font-black uppercase italic tracking-[3px] transition-all shadow-2xl shadow-accent/20 active:scale-95"
                >
                    {loading && (
                        <div
                            className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-700 ease-out"
                            style={{ width: `${uploadProgress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                        </div>
                    )}
                    <div className="relative z-10 flex items-center justify-center gap-4">
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                <span>{statusText || 'Processing...'}</span>
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

