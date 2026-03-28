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
            <div className="relative aspect-[3/4] rounded-[6px] overflow-hidden bg-white ring-1 ring-black/[0.05] transition-transform duration-300 group-hover:-translate-y-2 shadow-sm group-hover:shadow-2xl">
                <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 opacity-95 group-hover:opacity-100"
                />

                {/* Title Overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 sm:p-4 h-1/2">
                    <h3 className="text-xs sm:text-lg lg:text-xl font-black uppercase italic tracking-tighter text-white drop-shadow-lg leading-tight truncate">
                        {game.name}
                    </h3>
                    <p className="text-[7px] sm:text-[9px] font-black text-white/50 uppercase tracking-widest mt-0.5">
                        {game.provider || 'ORIGINALS'}
                    </p>
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-accent/40 backdrop-blur-[2px]">
                    <div className="w-14 h-14 bg-white rounded-[6px] flex items-center justify-center text-accent shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-300">
                        <Play size={28} className="fill-current ml-1" />
                    </div>
                </div>
            </div>

            {/* Live Indicator Below Card */}
            <div className="mt-3 flex items-center gap-2 px-1">
                <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-100">
                    <div className="w-1 h-1 bg-emerald-500 rounded-[6px] animate-pulse" />
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-tight">{game.activePlayers} Live</span>
                </div>
            </div>
        </motion.div>
    );
};

export default CasinoCard;
