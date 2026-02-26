import { motion } from 'framer-motion';
import { Calendar, Clock, Trophy, Zap, ChevronRight } from 'lucide-react';

const MatchCard = ({ match, onBet }) => {
    const isLive = match.status === 'Live';
    const isFinished = match.status === 'Finished';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="glass-card relative overflow-hidden group border-white/[0.05]"
        >
            {/* Live Indicator */}
            {isLive && (
                <div className="absolute top-0 right-0 bg-red-500 text-white px-5 py-2 rounded-bl-3xl flex items-center gap-2 z-10 shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[2px] italic">Live Now</span>
                </div>
            )}

            <div className="flex flex-row items-center justify-between gap-2 sm:gap-6 md:gap-10">
                {/* Team A */}
                <div className="flex-1 flex flex-col items-center sm:items-end text-center sm:text-right min-w-0">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl sm:rounded-[32px] border border-white/[0.05] flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-500 shadow-xl overflow-hidden shrink-0">
                        <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${match.teamA}&backgroundColor=f87171`}
                            alt={match.teamA}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h3 className="text-sm sm:text-2xl font-black italic tracking-tighter uppercase mb-1 truncate w-full">{match.teamA}</h3>
                    <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/[0.03] rounded-md sm:rounded-lg border border-white/5 text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                        <span className="hidden xs:inline">Odds: </span><span className="text-white italic">{match.oddsTeamA}</span>
                    </div>
                </div>

                {/* VS Divider */}
                <div className="flex flex-col items-center gap-2 sm:gap-4 z-10 py-2 sm:py-0 shrink-0">
                    <div className="flex flex-col items-center">
                        <span className="text-[7px] sm:text-[10px] font-black text-zinc-600 uppercase tracking-[2px] sm:tracking-[4px] mb-1 sm:mb-2 leading-none">Prediction</span>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-red-500 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] border-2 sm:border-4 border-[#121212] group-hover:rotate-[360deg] transition-all duration-700 relative">
                            <span className="text-xs sm:text-lg font-black italic leading-none">VS</span>
                            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping -z-10" />
                        </div>
                    </div>

                    {match.sixInPowerplay && (
                        <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full border border-amber-500/20 text-[6px] sm:text-[8px] font-black uppercase tracking-widest animate-pulse whitespace-nowrap">
                            <Zap size={8} className="fill-current sm:hidden" />
                            <Zap size={10} className="fill-current hidden sm:block" />
                            <span className="hidden xs:inline">2X Markets </span><span>Open</span>
                        </div>
                    )}
                </div>

                {/* Team B */}
                <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
                    <div className="w-12 h-12 sm:w-20 sm:h-20 bg-zinc-900 rounded-2xl sm:rounded-[32px] border border-white/[0.05] flex items-center justify-center mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-500 shadow-xl overflow-hidden shrink-0">
                        <img
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${match.teamB}&backgroundColor=60a5fa`}
                            alt={match.teamB}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h3 className="text-sm sm:text-2xl font-black italic tracking-tighter uppercase mb-1 truncate w-full">{match.teamB}</h3>
                    <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/[0.03] rounded-md sm:rounded-lg border border-white/5 text-[8px] sm:text-[10px] font-black text-zinc-500 uppercase tracking-widest whitespace-nowrap">
                        <span className="hidden xs:inline">Odds: </span><span className="text-white italic">{match.oddsTeamB}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Info Bar */}
            <div className="mt-10 pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-zinc-900 rounded-xl">
                            <Calendar size={14} className="text-zinc-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Date</span>
                            <span className="text-xs font-bold text-zinc-400">{new Date(match.matchTime).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-zinc-900 rounded-xl">
                            <Clock size={14} className="text-zinc-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Time</span>
                            <span className="text-xs font-bold text-zinc-400">{new Date(match.matchTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onBet(match)}
                    disabled={isFinished}
                    className="w-full sm:w-auto btn-red group/btn overflow-hidden relative shadow-red-500/10 disabled:grayscale"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {isFinished ? 'Market Closed' : 'Predict & Win'} <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                </button>
            </div>
        </motion.div>
    );
};

export default MatchCard;
