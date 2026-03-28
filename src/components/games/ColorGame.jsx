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
        <div className="flex flex-col bg-[#0f212e] min-h-[500px] w-full overflow-y-auto font-['Inter']">
            {/* Top Control Panel */}
            <div className="bg-[#213743] p-4 space-y-4 shrink-0 border-b border-[#0f212e]">
                {/* Color Pills - 3 columns good for 480px */}
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(colors).map(([id, data]) => (
                        <button
                            key={id}
                            onClick={() => setSelection({ type: 'color', value: id })}
                            className={`py-3 rounded-[6px] font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all active:translate-y-0.5 border-b-4 ${
                                selection.type === 'color' && selection.value === id 
                                    ? 'border-white scale-100 opacity-100' 
                                    : 'border-black/20 opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: data.code }}
                        >
                            {data.label}
                        </button>
                    ))}
                </div>

                {/* Number Grid - 5 columns good for 480px */}
                <div className="bg-[#0f212e] rounded-[6px] p-3">
                    <div className="grid grid-cols-5 gap-2">
                        {numbers.map(n => (
                            <button
                                key={n.val}
                                onClick={() => setSelection({ type: 'number', value: n.val })}
                                className={`relative aspect-square rounded-[6px] flex items-center justify-center font-black text-lg transition-all active:scale-95 group overflow-hidden border-2 ${
                                    selection.type === 'number' && selection.value === n.val 
                                        ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)] z-10' 
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                            >
                                <div className="absolute inset-0 flex">
                                    {n.colors.map((c, i) => (
                                        <div key={i} className="flex-1 opacity-20" style={{ backgroundColor: colors[c].code }} />
                                    ))}
                                </div>
                                <span className="z-10 group-hover:scale-110 transition-transform" style={{ color: colors[n.colors[0]].code }}>{n.val}</span>
                                <div className="absolute inset-0 border-4 rounded-[6px] opacity-40" style={{ borderColor: colors[n.colors[0]].code }} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Multipliers - Sized for mobile */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                    {[1, 5, 10, 20, 50, 100].map(x => (
                        <button
                            key={x}
                            onClick={() => setMultiplier(x)}
                            className={`px-3 py-2 rounded-[6px] font-bold text-[10px] transition-all border-b-2 ${
                                multiplier === x 
                                    ? 'bg-[#2f4553] text-white border-white scale-105' 
                                    : 'bg-[#0f212e] text-[#b1bad3] border-transparent hover:bg-[#2f4553]/50'
                            }`}
                        >
                            X{x}
                        </button>
                    ))}
                </div>

                {/* Big / Small */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setSelection({ type: 'size', value: 'Big' })}
                        className={`py-3 rounded-[6px] font-black italic text-lg uppercase transition-all border-b-4 ${
                            selection.type === 'size' && selection.value === 'Big' 
                                ? 'bg-orange-500 text-white border-white' 
                                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        }`}
                    >
                        Big
                    </button>
                    <button
                        onClick={() => setSelection({ type: 'size', value: 'Small' })}
                        className={`py-3 rounded-[6px] font-black italic text-lg uppercase transition-all border-b-4 ${
                            selection.type === 'size' && selection.value === 'Small' 
                                ? 'bg-blue-500 text-white border-white' 
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}
                    >
                        Small
                    </button>
                </div>

                {/* Place Bet Button */}
                <button
                    onClick={startGame}
                    disabled={isSpinning}
                    className="w-full py-4 bg-[#00e701] hover:bg-[#1fff20] text-[#05200a] rounded-[6px] font-black uppercase text-base shadow-[0_4px_0_rgb(0,180,1)] active:translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {isSpinning ? <div className="w-6 h-6 border-3 border-[#05200a]/30 border-t-[#05200a] rounded-[6px] animate-spin" /> : <>Bet ₹{totalBet}</>}
                </button>
            </div>

            {/* History Section */}
            <div className="flex-1 bg-[#0f212e]">
                <div className="flex p-2 gap-2 bg-[#213743]/50 sticky top-0 z-20">
                    {['Game history', 'Chart'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-[6px] transition-all ${
                                activeTab === tab 
                                    ? 'bg-[#2f4553] text-white shadow-md' 
                                    : 'text-[#b1bad3] hover:text-white'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === 'Game history' ? (
                    <div className="w-full">
                        <table className="w-full text-center border-collapse">
                            <thead className="bg-[#2f4553] text-[#b1bad3] text-[9px] font-bold uppercase tracking-wider sticky top-[44px] z-10">
                                <tr>
                                    <th className="py-3 px-2">Period</th>
                                    <th className="py-3 px-2">Num</th>
                                    <th className="py-3 px-2">B/S</th>
                                    <th className="py-3 px-2">Color</th>
                                </tr>
                            </thead>
                            <tbody className="text-[11px] text-[#b1bad3]">
                                {gameHistory.map((row, i) => (
                                    <tr key={i} className="border-b border-[#213743]/50 hover:bg-[#213743]/30 transition-colors">
                                        <td className="py-3 px-2 font-mono text-[10px] text-white/50">{row.period.slice(-8)}</td>
                                        <td className="py-3 px-2 text-base font-black" style={{ color: colors[row.color[0]]?.code }}>{row.number}</td>
                                        <td className={`py-3 px-2 font-bold ${row.size === 'Big' ? 'text-orange-400' : 'text-blue-400'}`}>{row.size[0]}</td>
                                        <td className="py-3 px-2">
                                            <div className="flex justify-center gap-1">
                                                {row.color.map(c => (
                                                    <div key={c} className="w-2.5 h-2.5 rounded-[6px] shadow-sm" style={{ backgroundColor: colors[c]?.code }} />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center text-[#557086] text-xs font-bold uppercase tracking-[2px]">
                        Dynamic Chart Coming Soon
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColorGame;
