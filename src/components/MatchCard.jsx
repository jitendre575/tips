import { motion } from 'framer-motion';
import { Calendar, Clock, Trophy, Zap, ChevronRight } from 'lucide-react';

const MatchCard = ({ match, onBet }) => {
    const isLive = match.status === 'Live';
    const isFinished = match.status === 'Finished';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-[#0c0c0c] border border-white/5 rounded-[32px] sm:rounded-[40px] p-5 sm:p-8 relative overflow-hidden group"
        >
            {match.sixInPowerplay && (
                <div className="absolute top-0 right-0 bg-amber-500 text-black px-4 sm:px-8 py-1 sm:py-2 rounded-bl-[20px] sm:rounded-bl-[32px] text-[8px] sm:text-xs font-black uppercase tracking-widest shadow-2xl flex items-center gap-1 sm:gap-2 z-10">
                    <Zap size={10} className="sm:w-4 sm:h-4 fill-current" />
                    2X BONUS
                </div>
            )}
            <div className="flex items-center justify-between mb-6 sm:mb-10 gap-2">
                {/* Team A */}
                <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                    <h2 className="text-xl sm:text-4xl lg:text-5xl font-black italic text-white tracking-tighter uppercase leading-none truncate w-full text-center">
                        {match.teamA}
                    </h2>
                    <div className="bg-yellow-500 px-2 sm:px-4 py-1 rounded-lg sm:rounded-xl">
                        <span className="text-black font-black text-xs sm:text-xl italic leading-none">{match.oddsTeamA}</span>
                    </div>
                </div>

                {/* VS Center */}
                <div className="flex flex-col items-center gap-1 sm:gap-3 px-1 sm:px-4 shrink-0">
                    <span className="text-[8px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-[2px] sm:tracking-[4px]">Prediction</span>
                    <div className="w-10 h-10 sm:w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-zinc-900 border-2 sm:border-4 border-[#121212] flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <span className="text-white font-black italic text-xs sm:text-xl">VS</span>
                    </div>
                </div>

                {/* Team B */}
                <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                    <h2 className="text-xl sm:text-4xl lg:text-5xl font-black italic text-white tracking-tighter uppercase leading-none truncate w-full text-center">
                        {match.teamB}
                    </h2>
                    <div className="bg-yellow-500 px-2 sm:px-4 py-1 rounded-lg sm:rounded-xl">
                        <span className="text-black font-black text-xs sm:text-xl italic leading-none">{match.oddsTeamB}</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-white/[0.05] w-full mb-6 sm:mb-8" />

            {/* Match Info Buttons */}
            <div className="flex items-center justify-center gap-4 sm:gap-10 mb-6 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-zinc-900 rounded-lg sm:rounded-2xl flex items-center justify-center text-zinc-600">
                        <Calendar size={14} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-0.5 sm:mb-1">Date</span>
                        <span className="text-[10px] sm:text-sm font-black text-white">{new Date(match.matchTime).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-zinc-900 rounded-lg sm:rounded-2xl flex items-center justify-center text-zinc-600">
                        <Clock size={14} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-0.5 sm:mb-1">Time</span>
                        <span className="text-[10px] sm:text-sm font-black text-white">{new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            {/* Six Condition Info */}
            {match.sixInPowerplay && (
                <div className="flex items-center gap-3 bg-amber-500/5 p-3 rounded-2xl border border-amber-500/10 mb-6 sm:mb-8 mx-auto w-full max-w-sm">
                    <Zap size={14} className="text-amber-500 shrink-0 animate-pulse" />
                    <p className="text-[9px] sm:text-[11px] text-zinc-400 font-bold leading-relaxed uppercase tracking-tight text-center flex-1">
                        <span className="text-yellow-500 font-black">2X BOOST ACTIVE:</span> If a 6 is hit in the first 4 overs, your winning will be <span className="text-white">DOUBLED</span>
                    </p>
                </div>
            )}

            <button
                onClick={() => onBet(match)}
                disabled={isFinished}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-3 sm:py-6 rounded-2xl sm:rounded-[28px] font-black italic uppercase tracking-[2px] sm:tracking-[4px] text-lg sm:text-2xl shadow-2xl shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-4 group/btn disabled:grayscale whitespace-nowrap"
            >
                {isFinished ? 'Market Closed' : 'Predict & Win'}
                {!isFinished && <ChevronRight size={20} className="sm:w-7 sm:h-7 group-hover/btn:translate-x-2 transition-transform" />}
            </button>
        </motion.div>
    );
};

export default MatchCard;
