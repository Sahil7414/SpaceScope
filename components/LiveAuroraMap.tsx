
import React from 'react';
import { motion } from 'framer-motion';

const LiveAuroraMap: React.FC = () => {
  return (
    <div className="relative w-full h-48 bg-[#050014] rounded-xl border border-cyan-500/20 overflow-hidden group">
      {/* Radar Circles */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <div className="w-24 h-24 border border-cyan-500/50 rounded-full" />
        <div className="absolute w-40 h-40 border border-cyan-500/30 rounded-full" />
        <div className="absolute w-64 h-64 border border-cyan-500/10 rounded-full" />
        {/* Crosshair */}
        <div className="absolute h-full w-[1px] bg-cyan-500/20" />
        <div className="absolute w-full h-[1px] bg-cyan-500/20" />
      </div>

      {/* Aurora Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          rotate: [0, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-20%] left-[-10%] w-[120%] h-[120%] pointer-events-none"
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            <radialGradient id="auroraGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00FFCC" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#9A4DFF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <motion.circle
            cx="100"
            cy="100"
            r="60"
            fill="url(#auroraGradient)"
            animate={{
              cx: [100, 110, 90, 100],
              cy: [100, 90, 110, 100],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </svg>
      </motion.div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />

      {/* Map Labels */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Live Transmission</span>
        </div>
        <span className="text-[8px] text-cyan-400 font-mono">LAT: 64.1265° N | LON: 21.8174° W</span>
      </div>

      <div className="absolute bottom-3 right-3 text-right z-10">
        <span className="text-[10px] text-white/40 block font-mono">PROBABILITY</span>
        <span className="text-xl font-orbitron font-bold text-cyan-400">84%</span>
      </div>

      {/* Scanning Line */}
      <motion.div
        animate={{ translateY: ['0%', '200%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent"
      />
    </div>
  );
};

export default LiveAuroraMap;
