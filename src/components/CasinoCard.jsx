import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

const CasinoCard = ({ game, onPlay }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="group cursor-pointer"
            onClick={() => onPlay(game)}
        >
            {/* Image/Art Container */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-[#1a2c38] transition-transform duration-300 group-hover:-translate-y-2 shadow-xl">
                <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />

                {/* Title Overlay (Matches Stake style) */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f212e]/90 via-transparent to-transparent flex flex-col justify-end p-2 sm:p-4">
                    <h3 className="text-xs sm:text-lg lg:text-xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg leading-tight truncate">
                        {game.name}
                    </h3>
                    <p className="text-[7px] sm:text-[9px] font-black text-white/40 uppercase tracking-widest mt-0.5">
                        {game.provider || 'ORIGINALS'}
                    </p>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                    <div className="w-14 h-14 bg-accent rounded-full flex items-center justify-center text-white shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play size={28} className="fill-current ml-1" />
                    </div>
                </div>
            </div>

            {/* Live Indicator Below Card */}
            <div className="mt-3 flex items-center gap-2 px-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">
                    <span className="text-zinc-300">{game.activePlayers}</span> playing
                </span>
            </div>
        </motion.div>
    );
};

export default CasinoCard;
