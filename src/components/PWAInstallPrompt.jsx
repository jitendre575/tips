import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Hide prompt if already installed
        window.addEventListener('appinstalled', () => {
            setIsVisible(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        setIsVisible(false);
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 150, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 150, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="fixed bottom-20 left-4 right-4 z-50 pointer-events-none"
                >
                    <div className="max-w-md mx-auto bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 pointer-events-auto">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-accent rounded-[6px] flex items-center justify-center p-2 text-white">
                                    <Download size={20} />
                                </div>
                                <div>
                                    <h4 className="text-white font-black uppercase italic tracking-tighter leading-none text-lg">Install CricBet App</h4>
                                    <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mt-1">Faster • Secure • Offline Ready</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-2 bg-white/5 rounded-[6px] text-slate-400 hover:text-white transition-all shadow-xl active:scale-95"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <button
                            onClick={handleInstallClick}
                            className="w-full py-3 bg-gradient-to-r from-accent to-emerald-500 hover:opacity-90 active:scale-[0.98] text-white rounded-[6px] text-xs font-black uppercase tracking-[3px] shadow-lg shadow-accent/20 transition-all flex justify-center items-center"
                        >
                            Add To Home Screen
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
