
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, X, Send, Loader2, 
  Bot, Zap
} from 'lucide-react';
import { generateContentWithRetry } from '../services/gemini';
import { useNotifications } from '../context/NotificationContext';

const SYSTEM_INSTRUCTION = `You are the 'SpaceScope AI Navigator', a high-tech, helpful cosmic guide for the SpaceScope platform.
Your persona is a mix of a mission controller and a friendly astrophysicist.
Keep responses concise, scientific yet accessible, and always stay in character.
You know about:
1. Real-time Near Earth Objects (Asteroids)
2. Space Weather (Solar flares, Kp-index)
3. NASA Missions (Apollo, Voyager, Chandrayaan, Artemis)
4. General Astronomy (Black holes, Exoplanets)
If users ask about pricing, mention SpaceScope Pro is ₹49/mo.`;

interface Message {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

const CosmicChatbot: React.FC = () => {
  const { showToast } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Telemetry link established. I am your AI Navigator. How can I assist your exploration today?', timestamp: new Date() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, timestamp: new Date() }]);
    setIsTyping(true);

    try {
      const response = await generateContentWithRetry({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const botText = response.text || "I've encountered a solar flare in my logic circuits. Could you repeat that?";
      setMessages(prev => [...prev, { role: 'model', text: botText, timestamp: new Date() }]);
    } catch (error: any) {
      console.error("Chat Error:", error);
      const isQuota = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED");
      const errorMessage = isQuota ? "Signal Overload: Satellite processor is cooling down. Please wait 15 seconds." : "Signal lost. Please check your data uplink and try again.";
      setMessages(prev => [...prev, { role: 'model', text: errorMessage, timestamp: new Date() }]);
      if (isQuota) showToast("AI Processor Throttled", "info");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[90vw] sm:w-[400px] h-[500px] glass-card rounded-3xl border-white/20 shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl"
          >
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-900/20 to-purple-900/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-xl text-cyan-400">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-orbitron font-bold text-white tracking-wider">AI NAVIGATOR</h3>
                  <p className="text-[8px] text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Zap size={8} className="animate-pulse" /> Signal: Optimal
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'}`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none">
                    <Loader2 className="animate-spin text-cyan-400" size={16} />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/20">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the cosmos..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                />
                <button type="submit" disabled={!input.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:text-cyan-300 disabled:opacity-30 transition-all">
                  <Send size={16} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${isOpen ? 'bg-red-500 shadow-red-900/40 rotate-90' : 'bg-cyan-600 shadow-cyan-900/40'}`}
      >
        {isOpen ? <X size={24} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
      </motion.button>
    </div>
  );
};

export default CosmicChatbot;
