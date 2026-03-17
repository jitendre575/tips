import { motion } from 'framer-motion';
import { Calendar, Clock, Zap, ChevronRight, Activity } from 'lucide-react';

const MatchCard = ({ match, onBet }) => {
    const isLive = match.status === 'Live';
    const isFinished = match.status === 'Finished';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`relative overflow-hidden rounded-[10px] bg-white border transition-all duration-300 flex flex-col group
                ${isLive ? 'border-red-200 hover:border-red-300 hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] shadow-lg' : 'border-slate-200 hover:border-slate-300 hover:shadow-xl shadow-md'}`}
        >
            {/* Top Bar */}
            <div className={`flex justify-between items-center p-3 sm:p-4 border-b ${isLive ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 sm:gap-3">
                    {isLive ? (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black tracking-widest text-red-600 bg-red-100 px-2.5 py-1 rounded-[10px] uppercase border border-red-200 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> LIVE NOW
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black tracking-widest text-slate-500 bg-white px-2.5 py-1 rounded-[10px] uppercase border border-slate-200 shadow-sm">
                            <Clock size={12} /> UPCOMING
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} className={isLive ? 'text-red-400' : 'text-slate-400'} /> 
                        {new Date(match.matchTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                    </div>
                </div>
            </div>

            {/* Teams horizontally */}
            <div className="p-4 sm:p-6 flex items-stretch justify-between relative bg-white">
                {/* Team A */}
                <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-50 to-blue-50 text-blue-600 font-black text-xl sm:text-2xl flex items-center justify-center rounded-[10px] border border-blue-100 shadow-sm transform transition-transform group-hover:scale-105">
                        {match.teamA.substring(0,3).toUpperCase()}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-800 text-center uppercase tracking-tight line-clamp-1">{match.teamA}</span>
                    <div className="bg-emerald-50 text-emerald-700 font-black text-xs sm:text-sm px-3 py-1.5 rounded-[10px] border border-emerald-200 w-full text-center shadow-sm">
                        {match.oddsTeamA}
                    </div>
                </div>

                {/* VS */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center px-2 sm:px-4 auto-mx relative z-10">
                    <span className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center text-[10px] sm:text-xs font-black italic shadow-inner border border-slate-100">VS</span>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-full sm:h-[120%] bg-slate-100 -z-10 hidden sm:block"></div>
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center gap-2 sm:gap-3 flex-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-rose-50 to-red-50 text-red-600 font-black text-xl sm:text-2xl flex items-center justify-center rounded-[10px] border border-red-100 shadow-sm transform transition-transform group-hover:scale-105">
                        {match.teamB.substring(0,3).toUpperCase()}
                    </div>
                    <span className="text-xs sm:text-sm font-black text-slate-800 text-center uppercase tracking-tight line-clamp-1">{match.teamB}</span>
                    <div className="bg-emerald-50 text-emerald-700 font-black text-xs sm:text-sm px-3 py-1.5 rounded-[10px] border border-emerald-200 w-full text-center shadow-sm">
                        {match.oddsTeamB}
                    </div>
                </div>
            </div>

            {/* Action Area */}
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <button 
                    onClick={() => onBet(match)} 
                    disabled={isFinished} 
                    className={`w-full py-3.5 sm:py-4 rounded-[10px] text-xs sm:text-sm font-black uppercase tracking-[3px] text-white transition-all shadow-md flex justify-center items-center gap-2 group/btn relative overflow-hidden
                        ${isLive ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-red-500/25 border border-red-500' : 'bg-[#0f212e] hover:bg-black shadow-slate-900/20'} 
                        ${isFinished ? 'opacity-50 grayscale cursor-not-allowed' : 'active:scale-[0.98]'}`}
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {isFinished ? 'Match Closed' : 'Predict Match'}
                        {!isFinished && <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />}
                    </span>
                    {/* Button Glint */}
                    {!isFinished && <div className="absolute top-0 -left-[100%] w-full h-full skew-x-[30deg] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:translate-x-[200%] transition-transform duration-1000"></div>}
                </button>
            </div>

            {/* Slider Marquee for Bonus */}
            {match.sixInPowerplay && (
                <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white overflow-hidden py-2 sm:py-2.5 relative flex items-center shadow-inner">
                    <motion.div 
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="flex whitespace-nowrap items-center gap-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[2px]"
                    >
                        {Array.from({ length: 4 }).map((_, i) => (
                            <span key={i} className="flex items-center gap-2 border-r border-white/20 pr-8">
                                <Zap size={14} className="fill-current animate-pulse text-yellow-200" /> SUPER MEGA OFFER: FIRST 3 OVERS SIX = 2X WINNINGS!
                            </span>
                        ))}
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default MatchCard;
