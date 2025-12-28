
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, CloudLightning, Rocket, ChevronRight, Telescope, Image as ImageIcon, Wifi, WifiOff } from 'lucide-react';
import { fetchAPOD } from '../services/nasaApi';

const FALLBACK_APOD = {
  title: "Pillars of Creation (Historical Archive)",
  url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1200",
  explanation: "Real-time NASA link is currently throttled due to public API limits. Displaying historical high-definition archive imagery.",
  date: "ARCHIVE_SIGNAL",
  copyright: "Hubble Space Telescope"
};

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [apod, setApod] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPOD().then(data => {
      if (data) {
        setApod(data);
        setIsLive(true);
      } else {
        setApod(FALLBACK_APOD);
        setIsLive(false);
      }
    }).finally(() => setLoading(false));
  }, []);

  const features = [
    { 
      title: "Celestial Events", 
      icon: <Calendar className="text-cyan-400" />, 
      path: "/events", 
      desc: "Track meteor showers, eclipses, and more." 
    },
    { 
      title: "Space Weather", 
      icon: <CloudLightning className="text-purple-400" />, 
      path: "/weather", 
      desc: "Real-time solar activity and Aurora alerts." 
    },
    { 
      title: "Missions", 
      icon: <Rocket className="text-pink-400" />, 
      path: "/missions", 
      desc: "Humanity's journey through the stars." 
    }
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20 px-4">
        {apod && (
          <div className="absolute inset-0 z-0">
            <img 
              src={apod.url} 
              className="w-full h-full object-cover opacity-30 blur-sm" 
              alt="NASA Background"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#030014] via-[#030014]/60 to-[#030014]" />
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-center z-10 w-full max-w-5xl mx-auto"
        >
          <div className={`inline-flex items-center gap-2 p-2 px-4 mb-6 rounded-full border text-[10px] md:text-xs font-bold tracking-widest uppercase ${isLive ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {isLive ? <Wifi size={14} className="animate-pulse" /> : <WifiOff size={14} />}
            {isLive ? 'Direct NASA Data Uplink Active' : 'Limited Signal: Loading Archive'}
          </div>
          <h1 className="font-orbitron text-4xl md:text-6xl lg:text-8xl font-bold mb-6 neon-text tracking-tighter leading-tight">
            SPACESCOPE
          </h1>
          <p className="text-gray-300 text-base md:text-xl lg:text-2xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Explore • Learn • Experience the Universe with actual real-time NASA telemetry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button 
              onClick={() => navigate('/events')}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-cyan-900/40"
            >
              Start Exploring <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => navigate('/learn')}
              className="px-8 py-4 bg-transparent border border-white/20 hover:border-white/40 text-white font-bold rounded-xl transition-all"
            >
              Learning Hub
            </button>
          </div>

          {/* APOD Spotlight */}
          {apod && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-card p-4 md:p-6 rounded-[2rem] border-white/10 max-w-2xl mx-auto text-left flex flex-col md:flex-row gap-6 items-center"
            >
              <div className="w-full md:w-48 h-48 rounded-2xl overflow-hidden shrink-0 shadow-2xl">
                <img src={apod.url} className="w-full h-full object-cover" alt={apod.title} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                  <ImageIcon size={14} /> {isLive ? 'NASA Feature' : 'Archive Highlight'}
                </div>
                <h3 className="text-base md:text-lg font-orbitron font-bold mb-2 text-white">{apod.title}</h3>
                <p className="text-gray-400 text-[11px] md:text-xs line-clamp-3 mb-4 leading-relaxed">{apod.explanation}</p>
                <div className="text-[9px] md:text-[10px] text-white/30 uppercase font-bold">&copy; {apod.copyright || 'NASA Public Domain'} • {apod.date}</div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-24 w-full relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((f, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05, translateY: -10 }}
              onClick={() => navigate(f.path)}
              className="glass-card p-6 md:p-8 rounded-2xl cursor-pointer group hover:border-cyan-500/50 transition-all"
            >
              <div className="mb-6 p-4 bg-white/5 w-fit rounded-xl group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-xl font-orbitron font-bold mb-3 group-hover:text-cyan-400 transition-colors">
                {f.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {f.desc}
              </p>
              <div className="mt-6 flex items-center text-[10px] text-white/40 uppercase tracking-widest font-bold group-hover:text-white transition-colors">
                Explore Now <ChevronRight size={14} className="ml-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Landing;
