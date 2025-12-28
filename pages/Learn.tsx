
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, GraduationCap, CheckCircle2, XCircle, 
  ChevronRight, RefreshCw, Search, Loader2, Globe, ExternalLink, Sparkles,
  Cpu, ListChecks, ArrowRight
} from 'lucide-react';
import { quizData as fallbackQuiz } from '../data/quiz';
import { Type } from "@google/genai";
import { generateContentWithRetry } from '../services/gemini';
import { useNotifications } from '../context/NotificationContext';

const topics = [
  { id: 't1', title: 'Black Holes', desc: 'Gravitational monsters of the universe.', color: 'from-purple-600/20 to-black', img: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1200' },
  { id: 't2', title: 'Space Weather', desc: 'Understanding the Sun-Earth connection.', color: 'from-orange-600/20 to-black', img: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&q=80&w=1200' },
  { id: 't3', title: 'Exoplanets', desc: 'Searching for Earth 2.0 beyond our solar system.', color: 'from-cyan-600/20 to-black', img: 'https://images.unsplash.com/photo-1614314107768-6018061b5b72?auto=format&fit=crop&q=80&w=1200' },
  { id: 't4', title: 'The ISS', desc: 'Humanity\'s outpost in low Earth orbit.', color: 'from-blue-600/20 to-black', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200' }
];

interface SearchResult {
  title: string;
  summary: string;
  keyTakeaways: string[];
  sections: { heading: string; body: string }[];
  technicalSpecs: { label: string; value: string }[];
  sources: { title: string; uri: string }[];
}

interface Question {
  question: string;
  options: string[];
  answer: number;
}

const Learn: React.FC = () => {
  const { showToast } = useNotifications();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const generateAIQuiz = async (topicTitle?: string) => {
    setIsGeneratingQuiz(true);
    setQuizStarted(true);
    setQuizFinished(false);
    setCurrentQuestion(0);
    setScore(0);
    setHasAnswered(false);
    setSelectedAnswer(null);

    try {
      const prompt = topicTitle 
        ? `Generate 5 challenging multiple-choice questions about ${topicTitle}. Ensure questions are different from common knowledge.`
        : `Generate 5 unique multiple-choice questions about general astronomy and space exploration. Each restart should provide new questions.`;

      const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                answer: { type: Type.INTEGER, description: "The 0-based index of the correct option" }
              },
              required: ["question", "options", "answer"]
            }
          }
        }
      });

      const generatedQuestions = JSON.parse(response.text || "[]");
      setQuestions(generatedQuestions.length > 0 ? generatedQuestions : fallbackQuiz);
    } catch (error: any) {
      console.error("Quiz generation failed:", error);
      showToast("Signal Congested. Loading localized quiz archive.", "info");
      setQuestions(fallbackQuiz);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);
    try {
      const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: `Research the following space topic and provide a structured learning module: ${searchQuery}`,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    heading: { type: Type.STRING },
                    body: { type: Type.STRING }
                  },
                  required: ["heading", "body"]
                }
              },
              technicalSpecs: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    value: { type: Type.STRING }
                  },
                  required: ["label", "value"]
                }
              }
            },
            required: ["title", "summary", "keyTakeaways", "sections"]
          }
        },
      });

      const data = JSON.parse(response.text || "{}");
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .filter((chunk: any) => chunk.web)
        .map((chunk: any) => ({
          title: chunk.web.title || "Source",
          uri: chunk.web.uri,
        }));

      setSearchResult({ ...data, sources });
    } catch (error: any) {
      console.error("Search failed:", error);
      showToast("Satellite Link Congested. Please try again later.", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnswerSelect = (optionIdx: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(optionIdx);
    setHasAnswered(true);
    if (optionIdx === questions[currentQuestion].answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(q => q + 1);
      setHasAnswered(false);
      setSelectedAnswer(null);
    } else {
      setQuizFinished(true);
    }
  };

  const backToHub = () => {
    setQuizStarted(false);
    setActiveTopic(null);
    setSearchResult(null);
    setShowSearch(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="w-full max-w-5xl glass-card rounded-[2.5rem] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl border-white/20">
              <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5 text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                    <Sparkles size={24} />
                  </div>
                  <h2 className="text-2xl font-orbitron font-bold">Astro-Intel Terminal</h2>
                </div>
                <button onClick={() => setShowSearch(false)} className="text-gray-400 hover:text-white transition-colors p-2">
                  <XCircle size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto no-scrollbar flex-1 bg-[#030014]/50">
                <form onSubmit={handleAISearch} className="relative mb-8">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask about anything in the cosmos..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-8 pr-16 text-white text-lg focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-gray-600 shadow-inner"
                  />
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all disabled:opacity-50 shadow-lg text-white"
                  >
                    {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                  </button>
                </form>

                {isSearching && (
                  <div className="flex flex-col items-center justify-center py-24 gap-6 text-white">
                    <div className="relative">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 border-b-2 border-cyan-500 rounded-full"
                      />
                      <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400 animate-pulse" size={32} />
                    </div>
                    <div className="text-center">
                      <p className="text-cyan-400 font-orbitron text-xl mb-2">Accessing Galactic Archive</p>
                      <p className="text-gray-500 text-sm">Parsing multi-spectral data from NASA and ESA...</p>
                    </div>
                  </div>
                )}

                {searchResult && !isSearching && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="space-y-10 pb-12"
                  >
                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-cyan-600/10 to-transparent border border-cyan-500/20 text-white">
                      <h3 className="text-4xl font-orbitron font-bold text-white mb-4">{searchResult.title}</h3>
                      <p className="text-gray-300 text-lg leading-relaxed">{searchResult.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-8">
                        {searchResult.sections.map((section, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="glass-card p-8 rounded-3xl border-white/5 text-white"
                          >
                            <h4 className="text-xl font-orbitron font-bold text-cyan-400 mb-6 flex items-center gap-3">
                              <span className="text-white/20 text-sm">0{idx + 1}</span>
                              {section.heading}
                            </h4>
                            <div className="text-gray-400 leading-relaxed space-y-4">
                              {section.body.split('\n').map((para, pIdx) => (
                                <p key={pIdx}>{para}</p>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>

                      <div className="space-y-8">
                        <div className="p-8 rounded-3xl bg-purple-600/5 border border-purple-500/20">
                          <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ListChecks size={18} /> Key Takeaways
                          </h4>
                          <ul className="space-y-4">
                            {searchResult.keyTakeaways.map((fact, idx) => (
                              <li key={idx} className="flex gap-3 text-sm text-gray-400 leading-snug">
                                <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
                                {fact}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {searchResult.technicalSpecs && searchResult.technicalSpecs.length > 0 && (
                          <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                              <Cpu size={18} /> Technical Specs
                            </h4>
                            <div className="space-y-4">
                              {searchResult.technicalSpecs.map((spec, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-3 text-white">
                                  <span className="text-xs text-gray-500 uppercase font-bold">{spec.label}</span>
                                  <span className="text-sm font-bold">{spec.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {quizStarted ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto py-12 text-white">
           {isGeneratingQuiz ? (
             <div className="glass-card p-20 rounded-3xl text-center">
                <Loader2 className="animate-spin mx-auto text-cyan-400 mb-6" size={48} />
                <h2 className="text-2xl font-orbitron font-bold text-white mb-2">Preparing Quiz</h2>
                <p className="text-gray-500">Generating unique AI challenges for you...</p>
             </div>
           ) : !quizFinished ? (
             <div className="glass-card p-10 rounded-3xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                 <motion.div 
                   className="h-full bg-cyan-500"
                   initial={{ width: 0 }}
                   animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                 />
               </div>
               <div className="mb-10 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-white/40">
                 <span>Question {currentQuestion + 1} of {questions.length}</span>
                 <span>Score: {score}</span>
               </div>
               <h2 className="text-2xl font-bold mb-10 leading-snug">
                 {questions[currentQuestion].question}
               </h2>
               <div className="space-y-4">
                 {questions[currentQuestion].options.map((opt, idx) => {
                   let buttonStyle = "glass-card border-white/5 hover:border-cyan-500/50 hover:bg-white/10";
                   if (hasAnswered) {
                     if (idx === questions[currentQuestion].answer) buttonStyle = "bg-green-500/20 border-green-500/50 text-green-400";
                     else if (idx === selectedAnswer) buttonStyle = "bg-red-500/20 border-red-500/50 text-red-400";
                     else buttonStyle = "opacity-40 border-white/5";
                   }
                   return (
                     <button
                       key={idx}
                       onClick={() => handleAnswerSelect(idx)}
                       disabled={hasAnswered}
                       className={`w-full p-6 text-left rounded-2xl transition-all group flex items-center justify-between border ${buttonStyle}`}
                     >
                       <span>{opt}</span>
                       {!hasAnswered && <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                       {hasAnswered && idx === questions[currentQuestion].answer && <CheckCircle2 size={18} />}
                       {hasAnswered && idx === selectedAnswer && idx !== questions[currentQuestion].answer && <XCircle size={18} />}
                     </button>
                   );
                 })}
               </div>
               {hasAnswered && (
                 <motion.button 
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                   onClick={nextQuestion}
                   className="w-full mt-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20"
                 >
                   {currentQuestion + 1 === questions.length ? "Finish Quiz" : "Next Question"} <ArrowRight size={18} />
                 </motion.button>
               )}
             </div>
           ) : (
             <div className="glass-card p-12 rounded-[3rem] text-center">
               <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 ${score > 3 ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                 {score > 3 ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
               </div>
               <h2 className="text-4xl font-orbitron font-bold mb-2">Quiz Complete!</h2>
               <p className="text-gray-400 mb-8">You scored <span className="text-white font-bold">{score} / {questions.length}</span></p>
               <div className="flex gap-4">
                 <button onClick={() => generateAIQuiz(activeTopic ? topics.find(t => t.id === activeTopic)?.title : undefined)} className="flex-1 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-white"><RefreshCw size={20} /> New AI Quiz</button>
                 <button onClick={backToHub} className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all text-white">Back to Hub</button>
               </div>
             </div>
           )}
        </motion.div>
      ) : activeTopic ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white">
           <button onClick={() => setActiveTopic(null)} className="mb-8 text-gray-500 hover:text-white flex items-center gap-2">
             &larr; Back to Hub
           </button>
           <div className="max-w-4xl mx-auto">
             <img src={topics.find(t => t.id === activeTopic)?.img} className="w-full h-96 object-cover rounded-3xl mb-12 shadow-2xl" />
             <h1 className="text-5xl font-orbitron font-bold mb-8">{topics.find(t => t.id === activeTopic)?.title}</h1>
             <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
               <p>
                 Deep dive into the fascinating world of {topics.find(t => t.id === activeTopic)?.title.toLowerCase()}. This domain represents one of the most critical areas of modern astrophysics.
               </p>
               <div className="bg-white/5 p-8 rounded-2xl border-l-4 border-cyan-500">
                 <h4 className="font-bold text-white mb-2">Did You Know?</h4>
                 <p className="text-sm italic">
                   {activeTopic === 't1' 
                     ? "Light cannot escape from a black hole because its gravity is so strong that the escape velocity is greater than the speed of light."
                     : activeTopic === 't2'
                     ? "Solar flares can release as much energy as a billion megaton bombs in just a few minutes."
                     : "Thousands of exoplanets have been discovered, some of which exist within the 'Goldilocks zone'."}
                 </p>
               </div>
             </div>
             <div className="mt-16 pt-8 border-t border-white/10 flex justify-between items-center">
               <button onClick={() => generateAIQuiz(topics.find(t => t.id === activeTopic)?.title)} className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition-all font-bold shadow-lg shadow-cyan-900/20">Take Topic Quiz</button>
               <button onClick={() => setActiveTopic(null)} className="text-cyan-400 font-bold hover:underline">Next Topic &rarr;</button>
             </div>
           </div>
        </motion.div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 text-white">
            <div>
              <h1 className="text-4xl font-orbitron font-bold mb-2">Learning Hub</h1>
              <p className="text-gray-400">Master the physics and history of the cosmos.</p>
            </div>
            <button onClick={() => setShowSearch(true)} className="px-6 py-3 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/10 group">
              <Search size={18} className="group-hover:rotate-12 transition-transform" /> AI Research Lab
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-white">
            {topics.map(topic => (
              <motion.div key={topic.id} whileHover={{ scale: 1.02 }} className="relative group h-80 rounded-3xl overflow-hidden border border-white/10 cursor-pointer" onClick={() => setActiveTopic(topic.id)}>
                <img src={topic.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" />
                <div className={`absolute inset-0 bg-gradient-to-t ${topic.color} via-black/20 to-transparent`} />
                <div className="absolute bottom-0 left-0 p-8">
                  <h3 className="text-3xl font-orbitron font-bold mb-2">{topic.title}</h3>
                  <p className="text-gray-300 max-w-xs">{topic.desc}</p>
                  <div className="mt-6 flex items-center gap-2 text-cyan-400 font-bold uppercase text-xs tracking-widest">Read Article <ChevronRight size={16} /></div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="glass-card p-12 rounded-[3rem] text-center border-purple-500/30 relative overflow-hidden text-white">
            <GraduationCap className="mx-auto text-purple-400 mb-6" size={64} />
            <h2 className="text-4xl font-orbitron font-bold mb-6">Test Your Knowledge</h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg">Take our weekly mini-quiz and earn Space Scope achievement badges.</p>
            <button onClick={() => generateAIQuiz()} className="px-12 py-4 bg-purple-600 hover:bg-purple-500 rounded-2xl font-bold transition-all shadow-xl shadow-purple-900/40 text-lg">Start AI Mini Quiz</button>
          </div>
        </>
      )}
    </div>
  );
};

export default Learn;
