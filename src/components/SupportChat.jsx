import React, { useState, useEffect, useRef } from 'react';
import { db, storage } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { MessageCircle, X, Send, Image as ImageIcon, Phone, MoreVertical, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SupportChat = () => {
    const { user, userData } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [uploading, setUploading] = useState(false);
    const scrollRef = useRef();

    useEffect(() => {
        if (!user || !isOpen) return;

        const chatId = user.uid;
        const q = query(
            collection(db, 'support_chats', chatId, 'messages'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);

            // Scroll to bottom
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        // Initialize chat metadata
        setDoc(doc(db, 'support_chats', chatId), {
            userId: user.uid,
            userName: userData?.name || user.email.split('@')[0],
            userPhoto: userData?.photoURL || '',
            lastMessage: 'Chat opened',
            updatedAt: serverTimestamp(),
            unreadAdmin: messages.length > 0 ? false : true
        }, { merge: true });

        return () => unsubscribe();
    }, [user, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !uploading) return;

        const chatId = user.uid;
        const text = newMessage;
        setNewMessage('');

        await addDoc(collection(db, 'support_chats', chatId, 'messages'), {
            senderId: user.uid,
            text,
            type: 'text',
            createdAt: serverTimestamp()
        });

        await setDoc(doc(db, 'support_chats', chatId), {
            lastMessage: text,
            updatedAt: serverTimestamp(),
            unreadAdmin: true
        }, { merge: true });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const chatId = user.uid;
            const storageRef = ref(storage, `support/${chatId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(snapshot.ref);

            await addDoc(collection(db, 'support_chats', chatId, 'messages'), {
                senderId: user.uid,
                imageUrl: downloadURL,
                type: 'image',
                createdAt: serverTimestamp()
            });

            await setDoc(doc(db, 'support_chats', chatId), {
                lastMessage: '📷 Image',
                updatedAt: serverTimestamp(),
                unreadAdmin: true
            }, { merge: true });

        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-[90vw] sm:w-[380px] h-[500px] bg-[#121212] rounded-3xl shadow-2xl border border-white/5 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="bg-[#1a1a1a] p-4 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-black">
                                    C
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#1a1a1a] rounded-full"></div>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-white">CricWin Support</h3>
                                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online Now</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href="tel:+911234567890" className="p-2 text-zinc-400 hover:text-white transition-colors">
                                <Phone size={18} />
                            </a>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                                <MessageCircle size={48} className="text-zinc-700" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-white">How can we help?</p>
                                    <p className="text-xs text-zinc-500">Send us a message and we'll reply soon.</p>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 space-y-1 relative group ${msg.senderId === user.uid
                                        ? 'bg-red-600 text-white rounded-tr-none'
                                        : 'bg-zinc-800 text-zinc-200 rounded-tl-none'
                                        }`}>
                                        {msg.type === 'image' ? (
                                            <img src={msg.imageUrl} alt="chat" className="rounded-lg w-full max-h-60 object-cover mb-1" />
                                        ) : (
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                        )}
                                        <div className="flex items-center justify-end gap-1 mt-1 opacity-50">
                                            <span className="text-[9px] font-medium">
                                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                            {msg.senderId === user.uid && <CheckCheck size={10} />}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={scrollRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-[#1a1a1a] border-t border-white/5 flex items-center gap-3">
                        <label className="cursor-pointer text-zinc-500 hover:text-white transition-colors">
                            {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() && !uploading}
                            className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95 ${isOpen ? 'bg-zinc-800 text-white rotate-90' : 'bg-red-600 text-white'
                    }`}
            >
                {isOpen ? <X size={24} /> : (
                    <div className="relative">
                        <MessageCircle size={32} />
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#121212] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
                    </div>
                )}
            </button>
        </div>
    );
};

export default SupportChat;
