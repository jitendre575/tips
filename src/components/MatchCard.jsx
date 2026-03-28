import { motion } from 'framer-motion';
import { Calendar, Clock, Zap, ChevronRight, Activity, Trophy } from 'lucide-react';

const MatchCard = ({ match, onBet }) => {
    const isLive = match.status === 'Live';
    const isFinished = match.status === 'Finished';

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6 }}
            className={`relative overflow-hidden rounded-[6px] bg-white border transition-all duration-500 flex flex-col group
                ${isLive 
                    ? 'border-red-500/20 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.1)]' 
                    : 'border-slate-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)]'}`}
        >
            {/* Top Bar - Header logic */}
            <div className={`flex justify-between items-center p-4 sm:p-5 border-b relative overflow-hidden ${isLive ? 'bg-red-500/[0.02] border-red-100/50' : 'bg-slate-50 border-slate-100'}`}>
                {isLive && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.02, 0.05, 0.02] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 bg-red-500"
                    />
                )}
                
                <div className="flex items-center gap-3 relative z-10">
                    {isLive ? (
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-black tracking-[4px] text-red-600 bg-white border border-red-100 px-4 py-1.5 rounded-[6px] uppercase shadow-sm">
                            <span className="w-2 h-2 bg-red-500 rounded-[6px] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" /> LIVE
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] font-black tracking-[4px] text-slate-400 bg-white px-4 py-1.5 rounded-[6px] uppercase border border-slate-100 shadow-sm">
                            <Clock size={12} className="text-slate-400" /> UPCOMING
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-3 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest relative z-10 bg-white px-3 py-1.5 rounded-[6px] border border-slate-100 shadow-sm">
                    <Calendar size={12} className={isLive ? 'text-red-400' : 'text-slate-400'} /> 
                    {new Date(match.matchTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                </div>
            </div>

            {/* Match Core Area */}
            <div className="p-6 sm:p-10 flex items-center justify-between relative bg-white gap-4">
                {/* Team Left */}
                <div className="flex flex-col items-center gap-4 flex-1">
                    <div className="relative group/team">
                        <div className="absolute inset-x-[-8px] inset-y-[-8px] bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[6px] blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white border-[6px] border-slate-50 flex items-center justify-center rounded-[6px] shadow-2xl relative z-10 transform transition-transform group-hover:scale-105 duration-500">
                             <div className="w-full h-full rounded-[6px] bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center text-indigo-600 text-2xl sm:text-3xl font-black italic tracking-tighter overflow-hidden">
                                {match.teamALogo ? (
                                    <img src={match.teamALogo} className="w-full h-full object-cover" alt={match.teamA} />
                                ) : (
                                    match.teamA.substring(0,2).toUpperCase()
                                )}
                             </div>
                        </div>
                    </div>
                    <div className="space-y-4 text-center w-full">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1 h-5">{match.teamA}</h4>
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-emerald-50 text-emerald-600 font-extrabold text-xs sm:text-sm px-4 py-3 rounded-[6px] border border-emerald-100 w-full shadow-sm flex flex-col items-center gap-0.5"
                        >
                            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Rate</span>
                            <span className="text-lg tabular-nums italic font-black">{match.oddsTeamA.toFixed(2)}</span>
                        </motion.div>
                    </div>
                </div>

                {/* VS - Centerpiece */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center px-2 relative h-40">
                    <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-slate-100 to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-12 h-12 rounded-[6px] bg-slate-900 text-white flex items-center justify-center text-xs font-black italic shadow-2xl border-4 border-white rotate-45 transform hover:rotate-[225deg] transition-transform duration-700">
                            <span className="-rotate-45">VS</span>
                        </div>
                    </div>
                </div>

                {/* Team Right */}
                <div className="flex flex-col items-center gap-4 flex-1">
                    <div className="relative group/team">
                        <div className="absolute inset-x-[-8px] inset-y-[-8px] bg-gradient-to-br from-red-500 to-rose-600 rounded-[6px] blur-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white border-[6px] border-slate-50 flex items-center justify-center rounded-[6px] shadow-2xl relative z-10 transform transition-transform group-hover:scale-105 duration-500">
                             <div className="w-full h-full rounded-[6px] bg-gradient-to-br from-rose-50 to-red-100 flex items-center justify-center text-red-600 text-2xl sm:text-3xl font-black italic tracking-tighter overflow-hidden">
                                {match.teamBLogo ? (
                                    <img src={match.teamBLogo} className="w-full h-full object-cover" alt={match.teamB} />
                                ) : (
                                    match.teamB.substring(0,2).toUpperCase()
                                )}
                             </div>
                        </div>
                    </div>
                    <div className="space-y-4 text-center w-full">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1 h-5">{match.teamB}</h4>
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            className="bg-emerald-50 text-emerald-600 font-extrabold text-xs sm:text-sm px-4 py-3 rounded-[6px] border border-emerald-100 w-full shadow-sm flex flex-col items-center gap-0.5"
                        >
                            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Rate</span>
                            <span className="text-lg tabular-nums italic font-black">{match.oddsTeamB.toFixed(2)}</span>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Action Section */}
            <div className="px-6 pb-8">
                <button 
                    onClick={() => onBet(match)} 
                    disabled={isFinished} 
                    className={`w-full py-6 rounded-[6px] text-sm font-black uppercase tracking-[5px] text-white transition-all shadow-xl flex justify-center items-center gap-3 group/btn relative overflow-hidden active:scale-95 italic
                        ${isLive 
                            ? 'bg-gradient-to-r from-[#b91c1c] to-red-500 shadow-red-900/20 border-b-4 border-red-800' 
                            : 'bg-slate-900 hover:bg-black shadow-slate-900/20 border-b-4 border-slate-950'} 
                        ${isFinished ? 'opacity-50 grayscale cursor-not-allowed border-none' : ''}`}
                >
                    <span className="relative z-10">
                        {isFinished ? 'STADIUM CLOSED' : 'PREDICT MATCH'}
                    </span>
                    {!isFinished && <ChevronRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform" />}
                    
                    {/* Animated Glint Swish */}
                    {!isFinished && (
                        <motion.div 
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                            className="absolute inset-0 w-full h-full skew-x-[-30deg] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
                        />
                    )}
                </button>
            </div>

            {/* Dynamic Offer Marquee */}
            {match.sixInPowerplay && (
                <div className="w-full bg-[#0a0a0a] border-t border-white/5 py-3 relative flex items-center gap-4 group-hover:bg-[#111] transition-colors">
                    <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
                    <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />
                    
                    <motion.div 
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                        className="flex whitespace-nowrap items-center gap-12 text-[9px] font-black uppercase tracking-[3px] text-yellow-500"
                    >
                        {Array.from({ length: 6 }).map((_, i) => (
                            <span key={i} className="flex items-center gap-3">
                                <Zap size={12} className="fill-current text-[#fde047] animate-pulse" />
                                <span className="text-white opacity-80">Mega Multiplier Active:</span> 
                                <span className="text-yellow-400">First 3 Overs Bonus!</span>
                                <div className="w-1.5 h-1.5 bg-yellow-500/20 rounded-[6px]" />
                            </span>
                        ))}
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default MatchCard;
