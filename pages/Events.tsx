
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, Calendar, MapPin, Info, Bell, X, Lock, 
  ChevronRight, CheckCircle2, Share2, Copy, 
  Radar, Loader2, Target, AlertCircle, Wifi, WifiOff, Terminal,
  ChevronLeft, ArrowRight, Zap, BellRing, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { eventsData } from '../data/events';
import { CelestialEvent } from '../types';
import { usePremium } from '../context/PremiumContext';
import { useNotifications } from '../context/NotificationContext';
import { fetchNearEarthObjects } from '../services/nasaApi';

const NEO_IMAGE = "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?auto=format&fit=crop&q=80&w=1200";

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const { showToast } = useNotifications();
  const [filter, setFilter] = useState<'Upcoming' | 'Past' | 'Ongoing' | 'All'>('Upcoming');
  const [selectedEvent, setSelectedEvent] = useState<CelestialEvent | any | null>(null);
  const [neos, setNeos] = useState<any[] | null>(null);
  const [loadingNeos, setLoadingNeos] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [activeReminders, setActiveReminders] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLoadingNeos(true);
    fetchNearEarthObjects()
      .then(data => {
        if (data && data.length > 0) {
          setNeos(data);
          setIsLive(true);
        } else {
          setNeos(null);
          setIsLive(false);
        }
      })
      .catch(() => {
        setNeos(null);
        setIsLive(false);
      })
      .finally(() => setLoadingNeos(false));
  };

  const handleShare = async (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    const eventName = event.name || "Space Object";
    const eventDate = event.date || (event.close_approach_data ? event.close_approach_data[0].close_approach_date : "Upcoming");
    const shareText = `🚀 SpaceScope Discovery: ${eventName} approaching on ${eventDate}. Check it out on SpaceScope!`;
    const shareUrl = window.location.origin + window.location.pathname;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'SpaceScope Discovery',
          text: shareText,
          url: shareUrl,
        });
        showToast("Discovery Broadcasted!", "success");
      } else {
        throw new Error('Native share unavailable');
      }
    } catch (err) {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        showToast("Link Copied to Clipboard", "success");
      } catch (clipErr) {
        showToast("Uplink failed. Please copy URL manually.", "error");
      }
    }
  };

  const handleNotify = (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    if (!isPremium) {
      navigate('/premium-alerts');
      return;
    }
    
    const id = event.id || event.neo_reference_id;
    setActiveReminders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast(`Alert disabled for ${event.name || 'object'}`, "info");
      } else {
        next.add(id);
        showToast(`Uplink secured. Reminder active for ${event.name || 'object'}`, "success");
      }
      return next;
    });
  };

  const filteredEvents = filter === 'All' 
    ? eventsData 
    : eventsData.filter(e => e.status === filter);

  const isReminderActive = (id: string) => activeReminders.has(id);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-2 tracking-tight neon-text uppercase text-white">Celestial Events</h1>
          <p className="text-gray-400 font-light italic">Actual real-time phenomena from NASA Orbital Databases.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white/5 p-1 rounded-xl flex border border-white/10 backdrop-blur-md shadow-inner">
            {['Upcoming', 'Past', 'All'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-5 py-2 rounded-lg text-xs transition-all font-bold uppercase tracking-widest ${
                  filter === f ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NASA Live Asteroid Feed */}
      <section className="mb-16 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
               <Radar size={20} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-orbitron font-bold text-white uppercase tracking-wider">Asteroid Tracking Feed</h2>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-[0.2em]">Live Orbital Telemetry Deck</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={refreshData}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-widest text-gray-400 transition-all flex items-center gap-2 group"
            >
              <Terminal size={12} className="group-hover:text-cyan-400" /> Refresh Uplink
            </button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${isLive ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {isLive ? <Wifi size={12} className="animate-pulse" /> : <WifiOff size={12} />}
              {isLive ? 'Active Uplink' : 'Signal Throttled'}
            </div>
          </div>
        </div>
        
        {loadingNeos ? (
          <div className="flex gap-6 overflow-hidden py-4">
            {Array(4).fill(0).map((_, i) => <div key={i} className="min-w-[280px] h-48 glass-card rounded-2xl animate-pulse" />)}
          </div>
        ) : neos && neos.length > 0 ? (
          <div className="relative group/deck">
            <div 
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto py-4 no-scrollbar scroll-smooth snap-x"
            >
              {neos.map((neo: any) => {
                const isReminded = isReminderActive(neo.id || neo.neo_reference_id);
                return (
                  <motion.div 
                    key={neo.id || neo.neo_reference_id}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => setSelectedEvent(neo)}
                    className="min-w-[280px] md:min-w-[320px] glass-card p-6 rounded-[2rem] border-white/5 cursor-pointer hover:border-cyan-500/30 transition-all relative overflow-hidden snap-start group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {neo.is_potentially_hazardous_asteroid && (
                      <div className="absolute top-0 right-0 p-1 bg-red-600 text-[8px] font-bold text-white uppercase px-3 rounded-bl-xl shadow-lg z-10 animate-pulse">
                        Hazard Warning
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className={`p-3 rounded-xl ${neo.is_potentially_hazardous_asteroid ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'} border border-white/5 shadow-inner`}>
                        <Target size={20} />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => handleNotify(e, neo)}
                          className={`p-2 rounded-lg transition-all border border-white/5 ${isReminded ? 'bg-green-600 text-white shadow-lg shadow-green-900/40' : 'bg-white/5 text-gray-500 hover:text-cyan-400'}`}
                        >
                          {isReminded ? <Check size={14} /> : <Bell size={14} />}
                        </button>
                        <button 
                          onClick={(e) => handleShare(e, neo)}
                          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-purple-400 transition-all border border-white/5"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-orbitron font-bold text-white text-lg mb-4 truncate relative z-10 uppercase tracking-tight">{neo.name}</h3>
                    
                    <div className="space-y-2 mb-6 relative z-10">
                      <div className="flex justify-between text-[9px] uppercase tracking-widest">
                         <span className="text-gray-500">Miss Distance</span>
                         <span className="text-cyan-400 font-bold">{Math.round(neo.close_approach_data[0].miss_distance.kilometers).toLocaleString()} KM</span>
                      </div>
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          className={`h-full ${neo.is_potentially_hazardous_asteroid ? 'bg-red-500' : 'bg-cyan-500'}`}
                         />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-white/30 group-hover:text-cyan-400 transition-colors relative z-10">
                      <span className="flex items-center gap-2">Full Telemetry <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" /></span>
                      <Zap size={12} className="opacity-20 group-hover:opacity-100" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-12 glass-card rounded-[3rem] text-center border-red-500/20 bg-red-900/5">
             <WifiOff className="mx-auto text-red-500 mb-6" size={48} />
             <h3 className="text-2xl font-orbitron font-bold text-white mb-3 tracking-widest uppercase">Telemetry Lost</h3>
             <button onClick={refreshData} className="mt-8 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all rounded-xl">Reconnect Signal</button>
          </div>
        )}
      </section>

      {/* Historical Section Header */}
      <div className="mb-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="text-purple-400" size={24} />
          <h2 className="text-2xl font-orbitron font-bold text-white uppercase tracking-wider">Scheduled Phenomena</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredEvents.map((event) => {
          const isReminded = isReminderActive(event.id);
          return (
            <motion.div
              layoutId={event.id}
              key={event.id}
              whileHover={{ y: -10 }}
              className="glass-card rounded-[2.5rem] overflow-hidden group border-white/5 hover:border-purple-500/30 transition-all cursor-pointer bg-white/5 shadow-xl relative"
              onClick={() => setSelectedEvent(event)}
            >
              <div className="h-56 overflow-hidden relative">
                <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute top-6 left-6 bg-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-2xl border border-white/10">
                  {event.type}
                </div>
                
                {/* Overlay UI */}
                <div className="absolute top-6 right-6 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={(e) => handleNotify(e, event)}
                    className={`p-3 backdrop-blur-md rounded-full text-white shadow-lg border border-white/10 transition-all ${isReminded ? 'bg-green-600' : 'bg-black/60 hover:bg-cyan-600'}`}
                  >
                    {isReminded ? <Check size={16} /> : <Bell size={16} />}
                  </button>
                  <button 
                    onClick={(e) => handleShare(e, event)}
                    className="p-3 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-purple-600 transition-all shadow-lg border border-white/10"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-4 uppercase tracking-[0.2em]">
                  <Calendar size={14} /> {event.date}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-cyan-400 transition-colors leading-tight">{event.name}</h3>
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                  <MapPin size={16} /> {event.location}
                </div>
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/5">
                  <span className="text-cyan-400 text-xs font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
                    Scientific Briefing <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEvent(null)} className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div 
              layoutId={selectedEvent.id || selectedEvent.neo_reference_id} 
              className="relative w-full max-w-2xl glass-card rounded-[3rem] overflow-hidden z-10 border-white/20 shadow-2xl bg-[#030014]"
            >
              <div className="absolute top-8 right-8 flex gap-3 z-30">
                <button 
                  onClick={(e) => handleShare(e, selectedEvent)}
                  className="p-3 bg-black/50 text-white rounded-full hover:bg-purple-600 transition-all border border-white/10 shadow-xl"
                >
                  <Share2 size={20} />
                </button>
                <button 
                  onClick={() => setSelectedEvent(null)}
                  className="p-3 bg-black/50 text-white rounded-full hover:bg-white/20 transition-all border border-white/10"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-10 pb-12">
                 <div className="mb-8">
                    <div className="flex items-center gap-4 mb-3">
                       <span className="px-3 py-1 bg-cyan-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg">
                          {selectedEvent.neo_reference_id ? 'ORBITAL BODY' : selectedEvent.type}
                       </span>
                    </div>
                    <h2 className="text-4xl font-orbitron font-bold text-white neon-text uppercase leading-tight">{selectedEvent.name}</h2>
                 </div>

                 <div className="w-full h-64 rounded-3xl overflow-hidden mb-8 border border-white/10 shadow-2xl relative group">
                    <img src={selectedEvent.neo_reference_id ? NEO_IMAGE : selectedEvent.image} alt={selectedEvent.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                 </div>

                 <div className="space-y-8">
                    <p className="text-gray-300 leading-relaxed text-lg font-light italic">"{selectedEvent.description || "Live telemetry confirmed from NASA Deep Space Network sensors. Tracking trajectory for optimal visibility windows."}"</p>
                    
                    {/* The Green Button Logic - Fully Functional and Highly Visible */}
                    <button 
                      onClick={(e) => handleNotify(e, selectedEvent)}
                      className={`w-full py-5 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all border shadow-lg ${
                        isReminderActive(selectedEvent.id || selectedEvent.neo_reference_id) 
                        ? 'bg-green-600 border-green-400 text-white shadow-[0_0_30px_rgba(22,163,74,0.4)]' 
                        : 'bg-cyan-600/20 hover:bg-cyan-600 text-cyan-400 hover:text-white border-cyan-500/30'
                      }`}
                    >
                      {isReminderActive(selectedEvent.id || selectedEvent.neo_reference_id) ? (
                        <>
                          <CheckCircle2 size={22} className="animate-pulse" /> Reminder Active
                        </>
                      ) : (
                        <>
                          <BellRing size={22} /> Enable Arrival Reminders
                        </>
                      )}
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Events;
