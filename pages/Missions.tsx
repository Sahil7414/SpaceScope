
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  Rocket, History, Zap, ChevronRight, Loader2, Sparkles, Terminal, 
  X, Bell, Share2, Award, Cpu, Database
} from 'lucide-react';
import { missionsData } from '../data/missions';
import { SpaceMission } from '../types';
import { Type } from "@google/genai";
import { generateContentWithRetry } from '../services/gemini';
import { useNotifications } from '../context/NotificationContext';
import { usePremium } from '../context/PremiumContext';
import { useNavigate } from 'react-router-dom';

interface MissionAnalysis {
  title: string;
  scientificBreakthroughs: string[];
  technicalChallenges: { title: string; description: string }[];
  legacyImpact: string;
  telemetrySim: { sensor: string; value: string }[];
}

const Missions: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const { showToast } = useNotifications();
  const [selectedMission, setSelectedMission] = useState<SpaceMission | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MissionAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({
    container: scrollContainerRef
  });

  const scaleX = useSpring(scrollXProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const handleShare = async (e: React.MouseEvent, mission: SpaceMission) => {
    e.stopPropagation();
    const shareText = `🚀 Explore the legacy of the ${mission.mission_name} mission on SpaceScope! Uplink:`;
    const shareUrl = window.location.origin + window.location.pathname;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'SpaceScope Mission', text: shareText, url: shareUrl });
        showToast("Mission Broadcasted!", "success");
      } else {
        throw new Error();
      }
    } catch {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      showToast("Mission Link Copied", "info");
    }
  };

  const handleNotify = (e: React.MouseEvent, mission: SpaceMission) => {
    e.stopPropagation();
    if (!isPremium) {
      navigate('/premium-alerts');
      return;
    }
    showToast(`Anniversary reminder set for ${mission.mission_name}`, "success");
  };

  const analyzeMission = async (mission: SpaceMission) => {
    setIsAnalyzing(true);
    setShowAnalysis(true);
    setAnalysisResult(null);
    setAnalysisError(null);

    try {
      const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: `Perform a deep technical and scientific analysis of the space mission: ${mission.mission_name} (${mission.year}). Provide historical context, key breakthroughs, and engineering hurdles.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              scientificBreakthroughs: { type: Type.ARRAY, items: { type: Type.STRING } },
              technicalChallenges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["title", "description"]
                }
              },
              legacyImpact: { type: Type.STRING },
              telemetrySim: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sensor: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["sensor", "value"]
                }
              }
            },
            required: ["title", "scientificBreakthroughs", "technicalChallenges", "legacyImpact", "telemetrySim"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      setAnalysisResult(result);
    } catch (error: any) {
      const isQuota = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
      setAnalysisError(isQuota ? "Satellite Signal Congested. Please retry in 1 minute." : "TRANSMISSION ERROR: Failed to reconstruct mission telemetry.");
      showToast(isQuota ? "Uplink Throttled" : "Telemetry Error", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const closeAnalysis = () => {
    setShowAnalysis(false);
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col bg-[#02000c] overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 mb-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row items-end justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                <History size={20} />
              </div>
              <span className="text-xs font-bold text-cyan-500 uppercase tracking-[0.4em]">Chronological Archive</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-orbitron font-bold text-white tracking-tighter leading-none mb-4">
              Missions <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Timeline</span>
            </h1>
            <p className="text-gray-400 text-lg md:text-xl font-light max-w-2xl leading-relaxed">
              Decades of exploration, from the first steps on the Moon to the search for life on the Red Planet.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="relative flex-1 flex items-center mb-12">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5 transform -translate-y-1/2" />
        <motion.div style={{ scaleX }} className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 shadow-[0_0_20px_rgba(0,232,255,0.5)] origin-left transform -translate-y-1/2 z-0" />

        <div ref={scrollContainerRef} className="flex overflow-x-auto overflow-y-hidden no-scrollbar px-[10vw] gap-24 items-center h-[550px] relative z-10">
          {missionsData.map((mission, idx) => (
            <motion.div key={mission.id} className="relative shrink-0 w-80 lg:w-96 group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                 <motion.div whileHover={{ scale: 1.4 }} className="w-5 h-5 bg-white rounded-full border-4 border-[#02000c] shadow-[0_0_15px_white] z-20 transition-all cursor-help" />
                 <div className={`absolute ${idx % 2 === 0 ? 'top-8' : 'bottom-8'} font-orbitron font-bold text-xl text-white/20 group-hover:text-cyan-400 transition-colors`}>{mission.year}</div>
              </div>

              <div className={`${idx % 2 === 0 ? 'mt-72' : 'mb-72'}`}>
                <motion.div
                  whileHover={{ y: idx % 2 === 0 ? -15 : 15, scale: 1.02 }}
                  onClick={() => setSelectedMission(mission as SpaceMission)}
                  className="glass-card rounded-[2.5rem] border-white/5 hover:border-cyan-500/30 overflow-hidden cursor-pointer shadow-2xl transition-all p-6 group/card"
                >
                  <div className="relative h-48 rounded-2xl overflow-hidden mb-6">
                    <img src={mission.photo} alt={mission.mission_name} className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>
                  <h3 className="text-2xl font-orbitron font-bold text-white mb-2 group-hover/card:text-cyan-400 transition-colors truncate">{mission.mission_name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{mission.year} A.D.</span>
                    <div className="flex items-center gap-1 text-cyan-400 text-[10px] font-bold uppercase tracking-widest group-hover/card:gap-3 transition-all">Details <ChevronRight size={14} /></div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
          <div className="shrink-0 w-80" />
        </div>
      </div>

      <AnimatePresence>
        {selectedMission && !showAnalysis && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedMission(null)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-2xl glass-card rounded-[3rem] overflow-hidden z-10 border-white/20 shadow-2xl bg-[#02000c]"
            >
              <div className="absolute top-8 right-8 flex gap-3 z-30">
                <button onClick={(e) => handleNotify(e, selectedMission)} className="p-3 bg-black/50 text-white rounded-full hover:bg-cyan-600 transition-all border border-white/10 shadow-lg"><Bell size={20} /></button>
                <button onClick={(e) => handleShare(e, selectedMission)} className="p-3 bg-black/50 text-white rounded-full hover:bg-purple-600 transition-all border border-white/10 shadow-lg"><Share2 size={20} /></button>
                <button onClick={() => setSelectedMission(null)} className="p-3 bg-black/50 text-white rounded-full hover:bg-white/20 transition-all border border-white/10"><X size={20} /></button>
              </div>
              
              <div className="h-80 w-full relative">
                <img src={selectedMission.photo} alt={selectedMission.mission_name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#02000c] via-transparent to-transparent" />
                <div className="absolute bottom-10 left-10">
                  <h2 className="text-5xl font-orbitron font-bold text-white neon-text">{selectedMission.mission_name}</h2>
                </div>
              </div>

              <div className="p-12 pt-8">
                <div className="space-y-10">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.4em] mb-4 text-white">Core Objective</h4>
                    <p className="text-gray-300 leading-relaxed text-2xl font-light">{selectedMission.objective}</p>
                  </div>
                  <button onClick={() => analyzeMission(selectedMission)} className="w-full py-6 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 rounded-[2rem] font-bold text-white text-lg transition-all shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-4 group">Initiate Scientific Analysis <Sparkles size={20} /></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnalysis && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-6xl glass-card rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] border-cyan-500/30">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-cyan-950/20">
                   <div className="flex items-center gap-3">
                     <Terminal className="text-cyan-400" size={24} />
                     <h2 className="text-2xl font-orbitron font-bold text-white uppercase tracking-tight">Mission Intelligence Report</h2>
                   </div>
                   <button onClick={closeAnalysis} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
                </div>
                <div className="p-8 overflow-y-auto no-scrollbar flex-1 bg-[#010008]">
                   {isAnalyzing ? (
                     <div className="flex flex-col items-center justify-center py-24 gap-6 text-white">
                        <Loader2 className="animate-spin text-cyan-400" size={48} />
                        <p className="text-cyan-400 font-bold uppercase tracking-widest animate-pulse">Reconstructing Historical Telemetry...</p>
                     </div>
                   ) : analysisError ? (
                     <div className="text-center py-20 text-white">
                        <Database className="mx-auto text-red-500 mb-4" size={48} />
                        <h3 className="text-2xl font-bold mb-2">Satellite Link Unstable</h3>
                        <p className="text-gray-400">{analysisError}</p>
                        <button onClick={() => analyzeMission(selectedMission!)} className="mt-8 px-6 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all font-bold text-sm">Retry Uplink</button>
                     </div>
                   ) : analysisResult && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div className="lg:col-span-2 space-y-10">
                          <div>
                            <h3 className="text-3xl font-orbitron font-bold text-white mb-4 leading-tight">{analysisResult.title}</h3>
                            <p className="text-gray-400 text-lg leading-relaxed italic border-l-4 border-cyan-500/50 pl-6 bg-white/5 py-4 rounded-r-2xl">"{analysisResult.legacyImpact}"</p>
                          </div>
                          
                          <div className="space-y-6">
                            <h4 className="text-sm font-bold uppercase text-white/40 tracking-[0.3em] flex items-center gap-2">
                              <Award size={16} /> Key Breakthroughs
                            </h4>
                            <div className="grid grid-cols-1 gap-4">
                              {analysisResult.scientificBreakthroughs.map((b, i) => (
                                <div key={i} className="p-5 glass-card rounded-2xl border-white/5 flex gap-4 items-start text-white">
                                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">0{i+1}</div>
                                  <p className="text-sm text-gray-300 leading-relaxed">{b}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8">
                           <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
                              <h4 className="text-xs font-bold uppercase text-gray-500 tracking-widest mb-6 flex items-center gap-2"><Cpu size={16} /> Technical Hurdles</h4>
                              <div className="space-y-6">
                                {analysisResult.technicalChallenges.map((c, i) => (
                                  <div key={i}>
                                    <p className="text-xs font-bold text-white mb-2 uppercase">{c.title}</p>
                                    <p className="text-[11px] text-gray-500 leading-relaxed">{c.description}</p>
                                  </div>
                                ))}
                              </div>
                           </div>
                           
                           <div className="p-6 bg-cyan-950/10 rounded-[2rem] border border-cyan-500/20">
                              <h4 className="text-xs font-bold uppercase text-cyan-400 tracking-widest mb-6 flex items-center gap-2 text-white"><Zap size={16} /> Live Simulation</h4>
                              <div className="space-y-4">
                                {analysisResult.telemetrySim.map((s, i) => (
                                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                                    <span className="text-[10px] text-gray-500 uppercase font-mono">{s.sensor}</span>
                                    <span className="text-xs font-bold font-mono text-cyan-400">{s.value}</span>
                                  </div>
                                ))}
                              </div>
                           </div>
                        </div>
                      </div>
                   )}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Missions;
