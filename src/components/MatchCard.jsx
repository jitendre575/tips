import { motion } from 'framer-motion';
import { TrendingUp, Zap, Circle } from 'lucide-react';

const MatchCard = ({ match, onBet }) => {
    const isLive = match.status === 'Live';
    const isFinished = match.status === 'Finished';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative bg-[#121212] border border-white/[0.05] rounded-[32px] p-6 lg:p-8 overflow-hidden transition-all duration-300 hover:border-white/10"
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[2px]">
                    {match.tournament || 'T20 INTERNATIONAL'} • {match.id.slice(0, 8)}
                </span>
                {isLive && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full uppercase italic font-black text-[10px] text-red-500 animate-pulse">
                        <Circle size={8} className="fill-current" />
                        Live
                    </div>
                )}
            </div>

            {/* Teams & Score */}
            <div className="grid grid-cols-3 items-center gap-4 mb-10 text-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-black shadow-inner">
                        {match.teamA[0]}
                    </div>
                    <span className="font-black text-lg tracking-tight uppercase">{match.teamA}</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-zinc-600 text-[10px] font-black italic mb-2">VS</span>
                    {isLive ? (
                        <div className="flex flex-col items-center">
                            <span className="text-emerald-400 font-black text-xl tracking-tighter animate-pulse">
                                {match.currentScore || '185/4 (18.4)'}
                            </span>
                        </div>
                    ) : (
                        <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                            {isFinished ? 'Finished' : 'Upcoming'}
                        </span>
                    )}
                </div>

                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-2xl font-black shadow-inner">
                        {match.teamB[0]}
                    </div>
                    <span className="font-black text-lg tracking-tight uppercase">{match.teamB}</span>
                </div>
            </div>

            {/* Betting Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                    onClick={() => onBet({ ...match, selectedTeam: 'teamA' })}
                    disabled={isFinished}
                    className="flex flex-col items-center gap-0.5 p-4 rounded-2xl bg-zinc-800/50 border border-white/[0.05] hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                >
                    <span className="text-[10px] font-black text-zinc-500 uppercase">{match.teamA} WINS</span>
                    <span className="text-xl font-black text-yellow-500">x{match.oddsTeamA.toFixed(2)}</span>
                </button>
                <button
                    onClick={() => onBet({ ...match, selectedTeam: 'teamB' })}
                    disabled={isFinished}
                    className="flex flex-col items-center gap-0.5 p-4 rounded-2xl bg-zinc-800/50 border border-white/[0.05] hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
                >
                    <span className="text-[10px] font-black text-zinc-500 uppercase">{match.teamB} WINS</span>
                    <span className="text-xl font-black text-yellow-500">x{match.oddsTeamB.toFixed(2)}</span>
                </button>
            </div>

            {/* Special Condition */}
            <div className="relative group/special mt-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-lg transition-all group-hover/special:blur-xl opacity-50" />
                <button
                    onClick={() => onBet({ ...match, selectedTeam: 'special' })}
                    disabled={isFinished}
                    className="relative w-full flex justify-between items-center p-4 rounded-2xl bg-[#1e1432]/60 border border-purple-500/20 hover:border-purple-500/40 transition-all active:scale-[0.98]"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-lg">
                            <Zap size={14} className="fill-current text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">SPECIAL</p>
                            <p className="text-xs font-bold text-zinc-100">Six in First 4 Overs?</p>
                        </div>
                    </div>
                    <span className="text-lg font-black text-yellow-500">x2.00</span>
                </button>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/[0.03] text-center">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                    Match starts: {new Date(match.matchTime).toLocaleString()}
                </span>
            </div>
        </motion.div>
    );
};

export default MatchCard;

