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
            className="bg-white border border-black/[0.05] rounded-[2.5rem] p-4 sm:p-8 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500"
        >
            {match.sixInPowerplay && (
                <div className="absolute top-0 right-0 bg-accent text-white px-4 sm:px-8 py-1 sm:py-2 rounded-bl-[20px] sm:rounded-bl-[32px] text-[8px] sm:text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-1 sm:gap-2 z-10 animate-pulse">
                    <Zap size={10} className="sm:w-4 sm:h-4 fill-current text-white" />
                    2X BONUS
                </div>
            )}
            <div className="flex items-center justify-between mb-4 sm:mb-8 gap-2 px-1">
                {/* Team A */}
                <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                    <h2 className="text-sm sm:text-2xl font-black italic text-slate-900 tracking-tighter uppercase leading-none w-full text-center break-words">
                        {match.teamA}
                    </h2>
                    <div className="bg-amber-100 border border-amber-500/20 px-3 sm:px-5 py-1.5 rounded-lg sm:rounded-xl">
                        <span className="text-amber-700 font-bold text-[10px] sm:text-lg italic leading-none">{match.oddsTeamA}</span>
                    </div>
                </div>

                {/* VS Center */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 px-1 sm:px-2 shrink-0">
                    <span className="text-[6px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest">Prediction</span>
                    <div className="w-8 h-8 sm:w-14 sm:h-14 rounded-full bg-slate-50 border-2 border-slate-100 flex items-center justify-center shadow-md">
                        <span className="text-accent font-black italic text-[10px] sm:text-lg">VS</span>
                    </div>
                </div>

                {/* Team B */}
                <div className="flex-1 flex flex-col items-center gap-1 sm:gap-2 min-w-0">
                    <h2 className="text-sm sm:text-2xl font-black italic text-slate-900 tracking-tighter uppercase leading-none w-full text-center break-words">
                        {match.teamB}
                    </h2>
                    <div className="bg-amber-100 border border-amber-500/20 px-3 sm:px-5 py-1.5 rounded-lg sm:rounded-xl">
                        <span className="text-amber-700 font-bold text-[10px] sm:text-lg italic leading-none">{match.oddsTeamB}</span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-100 w-full mb-4 sm:mb-8" />

            {/* Match Info Buttons */}
            <div className="flex items-center justify-center gap-4 sm:gap-10 mb-5 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-slate-50 rounded-lg sm:rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                        <Calendar size={14} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 sm:mb-1">Date</span>
                        <span className="text-[10px] sm:text-sm font-black text-slate-700">{new Date(match.matchTime).toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 bg-slate-50 rounded-lg sm:rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                        <Clock size={14} className="sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[7px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5 sm:mb-1">Time</span>
                        <span className="text-[10px] sm:text-sm font-black text-slate-700">{new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={() => onBet(match)}
                disabled={isFinished}
                className="w-full btn-accent py-3.5 sm:py-6 !rounded-[1.5rem] text-lg sm:text-2xl shadow-xl shadow-accent/20 active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-4 group/btn disabled:grayscale whitespace-nowrap"
            >
                {isFinished ? 'Market Closed' : 'Predict & Win'}
                {!isFinished && <ChevronRight size={20} className="sm:w-7 sm:h-7 group-hover/btn:translate-x-2 transition-transform" />}
            </button>
        </motion.div>
    );
};

export default MatchCard;
