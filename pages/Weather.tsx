
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Sun, Wind, Zap, Activity, Wifi, WifiOff, Terminal, Loader2, Sparkles, MapPin, Cloud, Eye, Share2
} from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { usePremium } from '../context/PremiumContext';
import { useNotifications } from '../context/NotificationContext';
import { fetchSpaceWeather, fetchLocalWeather } from '../services/nasaApi';
import { Type } from "@google/genai";
import { generateContentWithRetry } from '../services/gemini';

const formatNasaMessage = (rawBody: string) => {
  if (!rawBody) return { title: "Telemetry Update", body: "No data available." };
  let cleaned = rawBody.replace(/<\/?[^>]+(>|$)/g, "").replace(/[#*_]{2,}/g, "").trim();
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let title = "Cosmic Intelligence";
  let bodyContent = cleaned;
  if (lines.length > 0) {
    let firstLine = lines[0];
    ["CCMC DONKI", "Notification", "NASA"].forEach(p => firstLine = firstLine.replace(new RegExp(p, 'gi'), ''));
    title = firstLine.replace(/[\(\):,]/g, '').trim();
    if (title.length < 5) title = "Space Weather Bulletin";
    bodyContent = lines.slice(1).join(' ').trim();
  }
  return { title: title.length > 60 ? title.substring(0, 60) + '...' : title, body: bodyContent };
};

const Weather: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const { showToast } = useNotifications();
  const [nasaData, setNasaData] = useState<any[]>([]);
  const [localSky, setLocalSky] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchSpaceWeather().then(setNasaData).finally(() => setLoading(false));
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const data = await fetchLocalWeather(position.coords.latitude, position.coords.longitude);
          setLocalSky(data.current);
        } catch (err) {}
      });
    }
  }, []);

  const handleShareReport = async (e: React.MouseEvent, note: any) => {
    e.stopPropagation();
    const formatted = formatNasaMessage(note.messageBody);
    const text = `Space Weather Alert: ${formatted.title}. Intensity tracking live on SpaceScope.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'NASA Alert', text, url: window.location.origin + window.location.pathname });
        showToast("Signal Broadcasted", "success");
      } else {
        await navigator.clipboard.writeText(text);
        showToast("Alert Data Copied", "info");
      }
    } catch {}
  };

  const runAIAnalysis = async () => {
    if (!isPremium) {
      navigate('/premium-alerts');
      return;
    }
    setIsAnalyzing(true);
    try {
      const recentFeed = nasaData.slice(0, 3).map(n => n.messageBody).join(' ');
      await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: `Analyze this live NASA Mission Control Feed: ${recentFeed}.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hazardLevel: { type: Type.STRING },
              summary: { type: Type.STRING },
              impacts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { system: { type: Type.STRING }, severity: { type: Type.STRING }, advice: { type: Type.STRING } }, required: ["system", "severity", "advice"] } },
              auroraPrediction: { type: Type.STRING },
              technicalTelemetry: { type: Type.STRING }
            },
            required: ["hazardLevel", "summary", "impacts", "auroraPrediction", "technicalTelemetry"]
          }
        }
      });
      showToast("Global Threat Synthesis Complete", "success");
    } catch (error: any) {
      const isQuota = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
      showToast(isQuota ? "Satellite Signal Congested. Please wait." : "Connection failed.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const solarData = [{ time: '00:00', flux: 145 }, { time: '08:00', flux: 180 }, { time: '16:00', flux: 210 }, { time: '23:59', flux: 188 }];

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 max-w-7xl mx-auto relative z-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Solar Wind", value: "428", unit: "km/s", color: "cyan", icon: <Wind size={16} /> },
              { label: "Density", value: "5.2", unit: "p/cm³", color: "purple", icon: <Zap size={16} /> },
              { label: "Solar Flux", value: "188", unit: "sfu", color: "orange", icon: <Sun size={16} /> },
              { label: "KP Index", value: "6.2", unit: "Storm", color: "red", icon: <Activity size={16} /> }
            ].map((stat, i) => (
              <div key={i} className="glass-card p-4 rounded-2xl border-white/5 flex flex-col items-center text-center">
                <div className={`p-2 bg-${stat.color}-500/10 rounded-lg text-${stat.color}-400 mb-2`}>{stat.icon}</div>
                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
                <p className={`text-xl font-orbitron font-bold text-${stat.color}-400`}>{stat.value}</p>
              </div>
            ))}
          </div>
          <section className="glass-card p-6 md:p-8 rounded-[2rem] border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-transparent flex flex-col md:flex-row gap-6 md:gap-8 items-center text-white">
             <div className="shrink-0"><div className="w-16 h-16 bg-cyan-500/10 rounded-[1.5rem] flex items-center justify-center text-cyan-400"><MapPin size={24} /></div></div>
             <div className="flex-1">
               <h3 className="text-lg font-orbitron font-bold text-white mb-3 tracking-wide">Atmospheric Observer</h3>
               <div className="flex flex-wrap gap-6">
                 <div className="flex items-center gap-3"><div className="p-2 bg-white/5 rounded-lg text-cyan-400"><Cloud size={14} /></div><div><p className="text-[8px] text-gray-500 uppercase font-bold">Cloud Cover</p><p className="text-sm font-bold text-white">{localSky ? `${localSky.cloud_cover}%` : 'Scanning...'}</p></div></div>
                 <div className="flex items-center gap-3"><div className="p-2 bg-white/5 rounded-lg text-purple-400"><Eye size={14} /></div><div><p className="text-[8px] text-gray-500 uppercase font-bold">Visibility</p><p className="text-sm font-bold text-white">{localSky ? `${(localSky.visibility / 1000).toFixed(1)}km` : 'Scanning...'}</p></div></div>
               </div>
             </div>
          </section>
          <div className="glass-card p-6 md:p-8 rounded-[2rem] border-white/5">
             <div className="flex justify-between items-center mb-8"><h2 className="text-xl font-orbitron font-bold text-white uppercase tracking-wider">Solar Dynamics</h2></div>
             <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={solarData}>
                  <Tooltip contentStyle={{ backgroundColor: '#090A0F', border: '1px solid #ffffff10', borderRadius: '16px', fontSize: '10px', color: '#fff' }} itemStyle={{color: '#00E8FF'}} />
                  <Area type="monotone" dataKey="flux" stroke="#00E8FF" strokeWidth={2} fillOpacity={0.1} fill="#00E8FF" />
                </AreaChart>
              </ResponsiveContainer>
             </div>
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="glass-card p-6 md:p-8 rounded-[2.5rem] border-orange-500/20 bg-gradient-to-b from-orange-950/10 to-transparent flex flex-col h-[700px] text-white">
             <div className="flex items-center justify-between mb-8">
                <div><h3 className="text-lg font-orbitron font-bold text-white uppercase tracking-wider">Mission Control</h3><p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">NASA Global Uplink</p></div>
                <div className="p-3 bg-orange-500/10 rounded-2xl"><Terminal className="text-orange-400" size={20} /></div>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
                {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-[2rem] animate-pulse" />) : nasaData.map((note, i) => {
                    const formatted = formatNasaMessage(note.messageBody);
                    return (
                      <div key={note.messageID || i} className="p-6 bg-white/5 border border-white/5 rounded-[2rem] hover:border-orange-500/30 transition-all group relative">
                         <div className="flex justify-between items-center mb-4"><span className="px-2 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-widest bg-orange-500/20 text-orange-400">Bulletin</span><button onClick={(e) => handleShareReport(e, note)} className="p-2 text-white/20 hover:text-cyan-400 transition-colors"><Share2 size={14} /></button></div>
                         <h4 className="text-xs font-orbitron font-bold text-white mb-3 leading-tight uppercase tracking-wide">{formatted.title}</h4>
                         <p className="text-[11px] text-gray-400 leading-relaxed font-light line-clamp-3">{formatted.body}</p>
                      </div>
                    );
                })}
             </div>
             <div className="mt-8 pt-6 border-t border-white/10">
                <button onClick={runAIAnalysis} disabled={isAnalyzing} className="w-full py-4 bg-gradient-to-r from-orange-600 to-purple-600 text-white text-[11px] font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl">
                  {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  SYNTHESIZE THREAT LEVEL
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Weather;
