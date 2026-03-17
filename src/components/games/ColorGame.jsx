import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Play, RotateCcw, Zap, Coins, Trophy, Landmark, ChevronRight, History, BarChart3, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const ColorGame = ({ onBet, onWin, onLoss, isMuted, settings }) => {
    const [betAmount, setBetAmount] = useState(10);
    const [multiplier, setMultiplier] = useState(1);
    const [selection, setSelection] = useState({ type: null, value: null }); // type: 'color', 'number', 'size'
    const [isSpinning, setIsSpinning] = useState(false);
    const [activeTab, setActiveTab] = useState('History');

    const sounds = {
        tick: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        win: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
        loss: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'
    };

    const playSound = (type) => {
        if (isMuted) return;
        const audio = new Audio(sounds[type]);
        audio.volume = 0.4;
        audio.play().catch(() => { });
    };

    const houseEdge = (settings?.houseEdge || 1) / 100;
    const [gameHistory, setGameHistory] = useState([
        { period: '20260306100052329', number: 3, size: 'Small', color: ['green'] },
        { period: '20260306100052328', number: 3, size: 'Small', color: ['green'] },
        { period: '20260306100052327', number: 1, size: 'Small', color: ['green'] },
        { period: '20260306100052326', number: 0, size: 'Small', color: ['red', 'violet'] },
        { period: '20260306100052325', number: 4, size: 'Small', color: ['red'] },
        { period: '20260306100052324', number: 5, size: 'Big', color: ['green', 'violet'] },
    ]);

    const colors = {
        green: { code: '#10b981', label: 'Green', multiplier: 2 },
        violet: { code: '#a855f7', label: 'Violet', multiplier: 4.5 },
        red: { code: '#ef4444', label: 'Red', multiplier: 2 }
    };

    const numbers = [
        { val: 0, colors: ['red', 'violet'] },
        { val: 1, colors: ['green'] },
        { val: 2, colors: ['red'] },
        { val: 3, colors: ['green'] },
        { val: 4, colors: ['red'] },
        { val: 5, colors: ['green', 'violet'] },
        { val: 6, colors: ['red'] },
        { val: 7, colors: ['green'] },
        { val: 8, colors: ['red'] },
        { val: 9, colors: ['green'] },
    ];

    const totalBet = betAmount * multiplier;

    const startGame = async () => {
        if (!selection.type) {
            toast.error('Please select Color, Number or Size!');
            return;
        }

        const success = await onBet(totalBet);
        if (!success) return;

        setIsSpinning(true);
        playSound('tick');

        setTimeout(async () => {
            const winNum = Math.floor(Math.random() * 10);
            const winSize = winNum >= 5 ? 'Big' : 'Small';
            const winColors = numbers.find(n => n.val === winNum).colors;

            const periodId = `20260306${Date.now().toString().slice(-8)}`;
            const newResult = { period: periodId, number: winNum, size: winSize, color: winColors };

            setGameHistory(prev => [newResult, ...prev].slice(0, 10));
            setIsSpinning(false);

            let totalWin = 0;
            // logic for win
            if (selection.type === 'color' && winColors.includes(selection.value)) {
                totalWin = totalBet * colors[selection.value].multiplier;
            } else if (selection.type === 'number' && selection.value === winNum) {
                totalWin = totalBet * 9;
            } else if (selection.type === 'size' && selection.value === winSize) {
                totalWin = totalBet * 2;
            }

            if (totalWin > 0) {
                const finalWin = Math.floor(totalWin * (1 - houseEdge));
                await onWin(finalWin);
                playSound('win');
                toast.success(`YOU WON ₹${finalWin}!`, { icon: '💰' });
            } else {
                onLoss(totalBet);
                playSound('loss');
                toast.error(`Better luck next time! (Result: ${winNum})`);
            }
        }, 2000);
    };

    return (
        <div className="max-w-xl mx-auto space-y-4 font-['Inter']">
            {/* Top Control Panel */}
            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden p-6 space-y-6">
                {/* Color Pills */}
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(colors).map(([id, data]) => (
                        <button
                            key={id}
                            onClick={() => setSelection({ type: 'color', value: id })}
                            className={`py-3 rounded-full font-bold text-white shadow-sm transition-all active:scale-95 border-2 ${selection.type === 'color' && selection.value === id ? 'border-zinc-800 scale-105' : 'border-transparent'}`}
                            style={{ backgroundColor: data.code }}
                        >
                            {data.label}
                        </button>
                    ))}
                </div>

                {/* Number Grid */}
                <div className="bg-zinc-50 rounded-[10px] p-4">
                    <div className="grid grid-cols-5 gap-3">
                        {numbers.map(n => (
                            <button
                                key={n.val}
                                onClick={() => setSelection({ type: 'number', value: n.val })}
                                className={`relative aspect-square rounded-full flex items-center justify-center font-black text-xl shadow-sm transition-all active:scale-95 group overflow-hidden border-2 ${selection.type === 'number' && selection.value === n.val ? 'border-zinc-800 scale-110' : 'border-transparent'}`}
                            >
                                <div className="absolute inset-0 flex">
                                    {n.colors.map((c, i) => (
                                        <div key={i} className="flex-1 opacity-20" style={{ backgroundColor: colors[c].code }} />
                                    ))}
                                </div>
                                <span className="z-10 group-hover:scale-110 transition-transform" style={{ color: colors[n.colors[0]].code }}>{n.val}</span>
                                {/* Background ring effect */}
                                <div className="absolute inset-0 border-4 rounded-full opacity-40" style={{ borderColor: colors[n.colors[0]].code }} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Multipliers */}
                <div className="flex flex-wrap gap-2 justify-center">
                    <button className="px-3 py-1.5 border border-red-500 text-red-500 rounded-[10px] text-xs font-bold">Random</button>
                    {[1, 5, 10, 20, 50, 100].map(x => (
                        <button
                            key={x}
                            onClick={() => setMultiplier(x)}
                            className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${multiplier === x ? 'bg-emerald-500 text-white shadow-md' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                        >
                            X{x}
                        </button>
                    ))}
                </div>

                {/* Big / Small */}
                <div className="grid grid-cols-2 gap-px rounded-[10px] overflow-hidden shadow-sm border border-zinc-100">
                    <button
                        onClick={() => setSelection({ type: 'size', value: 'Big' })}
                        className={`py-4 font-black italic text-xl transition-all ${selection.type === 'size' && selection.value === 'Big' ? 'bg-orange-400 text-white' : 'bg-[#fff5e6] text-orange-400'}`}
                    >
                        Big
                    </button>
                    <button
                        onClick={() => setSelection({ type: 'size', value: 'Small' })}
                        className={`py-4 font-black italic text-xl transition-all ${selection.type === 'size' && selection.value === 'Small' ? 'bg-blue-400 text-white' : 'bg-[#e6f0ff] text-blue-400'}`}
                    >
                        Small
                    </button>
                </div>

                {/* Place Bet Button */}
                <button
                    onClick={startGame}
                    disabled={isSpinning}
                    className="w-full py-4 bg-[#ff4d4d] hover:bg-[#ff3333] text-white rounded-[10px] font-black uppercase text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isSpinning ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <>Bet ₹{totalBet}</>}
                </button>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-[10px] shadow-sm overflow-hidden">
                <div className="flex p-2 gap-1 border-b border-zinc-50">
                    {['Game history', 'Chart', 'Follow Strategy'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-xs font-bold rounded-[10px] transition-all ${activeTab === tab ? 'bg-[#ff4d4d] text-white shadow-md' : 'text-zinc-400 hover:text-zinc-600'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'Game history' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-center">
                            <thead className="bg-[#ff4d4d] text-white text-[10px] font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="py-3 px-4">Period</th>
                                    <th className="py-3 px-4">Number</th>
                                    <th className="py-3 px-4">Big Small</th>
                                    <th className="py-3 px-4">Color</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs text-zinc-600">
                                {gameHistory.map((row, i) => (
                                    <tr key={i} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                                        <td className="py-3 px-4 font-medium font-mono">{row.period}</td>
                                        <td className="py-3 px-4 text-lg font-black" style={{ color: colors[row.color[0]].code }}>{row.number}</td>
                                        <td className="py-3 px-4 font-bold">{row.size}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex justify-center gap-1">
                                                {row.color.map(c => (
                                                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[c].code }} />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColorGame;
