
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Award, GraduationCap, Star, Lock, ShieldCheck, CheckCircle, 
  Play, BookOpen, ChevronRight, X, Loader2, Zap, Terminal, Cpu, Database,
  ArrowRight, Globe, Sparkles, Download, Share2, ClipboardCheck, 
  CheckCircle2, XCircle, RefreshCw, AlertTriangle
} from 'lucide-react';
import { usePremium } from '../context/PremiumContext';
import { useNotifications } from '../context/NotificationContext';
import { Type } from "@google/genai";
import { generateContentWithRetry } from '../services/gemini';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface LessonContent {
  moduleTitle: string;
  briefing: string;
  technicalSpecs: { label: string; value: string }[];
  keyConcepts: string[];
  simulationData: string;
}

interface Question {
  question: string;
  options: string[];
  answer: number;
}

const PremiumLearning: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium, earnedCertificates, addCertificate, completedModules, markModuleComplete } = usePremium();
  const { showToast } = useNotifications();
  const certRef = useRef<HTMLDivElement>(null);
  
  const [activeCourse, setActiveCourse] = useState<any | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [lessonContent, setLessonContent] = useState<LessonContent | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const [isExamMode, setIsExamMode] = useState(false);
  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentExamQuestion, setCurrentExamQuestion] = useState(0);
  const [examScore, setExamScore] = useState(0);
  const [examFinished, setExamFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  const [showCertModal, setShowCertModal] = useState<any | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const certifications = [
    { 
      id: 'c1', 
      name: "Orbital Mechanics Specialist", 
      level: "Advanced", 
      icon: <Award className="text-yellow-400" />,
      modules: [
        { id: 'm1-1', title: "Gravitational Slingshots", context: "Using planetary mass for acceleration." },
        { id: 'm1-2', title: "L-Point Stability", context: "Lagrange point positioning for telescopes." }
      ]
    },
    { 
      id: 'c2', 
      name: "Solar Weather Analysis", 
      level: "Expert", 
      icon: <GraduationCap className="text-cyan-400" />,
      modules: [
        { id: 'm2-1', title: "Photosphere Dynamics", context: "Understanding sunspots and solar cycles." },
        { id: 'm2-2', title: "CME Impact Modeling", context: "Predicting geomagnetic storm severity." }
      ]
    },
    { 
      id: 'c3', 
      name: "Exoplanet Hunting", 
      level: "Mastery", 
      icon: <Star className="text-purple-400" />,
      modules: [
        { id: 'm3-1', title: "Transit Photometry", context: "Detecting dips in stellar luminosity." },
        { id: 'm3-2', title: "Direct Imaging Tech", context: "Starshades and high-contrast imaging." }
      ]
    }
  ];

  const startLesson = async (course: any, moduleIndex: number) => {
    const module = course.modules[moduleIndex];
    setActiveCourse(course);
    setActiveModuleIndex(moduleIndex);
    setIsGeneratingLesson(true);
    setLessonContent(null);
    setIsExamMode(false);
    setIsRateLimited(false);

    try {
      // Prompt optimized for token efficiency to help avoid 429s
      const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: `Create a professional space briefing for "${module.title}" (${course.name}). Subject: ${module.context}. Focus on technical depth. Output JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              moduleTitle: { type: Type.STRING },
              briefing: { type: Type.STRING },
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
              },
              keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
              simulationData: { type: Type.STRING }
            },
            required: ["moduleTitle", "briefing", "technicalSpecs", "keyConcepts", "simulationData"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      setLessonContent(data);
    } catch (error: any) {
      if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
        setIsRateLimited(true);
        showToast("Mission Control Quota Reached", "error");
      } else {
        showToast("Telemetry Link Failed", "error");
        closeTerminal();
      }
    } finally {
      setIsGeneratingLesson(false);
    }
  };

  const startCertificationExam = async (course: any) => {
    setIsExamMode(true);
    setIsGeneratingExam(true);
    setExamFinished(false);
    setCurrentExamQuestion(0);
    setExamScore(0);
    setHasAnswered(false);
    setSelectedAnswer(null);
    setIsRateLimited(false);

    try {
      const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: `Generate 5 expert MCQ questions for "${course.name}" exam. Coverage: ${course.modules.map((m: any) => m.title).join(', ')}. Format as JSON array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                answer: { type: Type.INTEGER }
              },
              required: ["question", "options", "answer"]
            }
          }
        }
      });
      setExamQuestions(JSON.parse(response.text || "[]"));
    } catch (error: any) {
      if (error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED")) {
        setIsRateLimited(true);
      } else {
        showToast("Exam Uplink Interrupted", "error");
        closeTerminal();
      }
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const handleCompleteModule = () => {
    if (activeCourse && activeModuleIndex !== null) {
      const moduleId = activeCourse.modules[activeModuleIndex].id;
      markModuleComplete(activeCourse.id, moduleId);
      
      const currentCompleted = completedModules[activeCourse.id] || [];
      const isActuallyNew = !currentCompleted.includes(moduleId);
      const totalCompletedCount = isActuallyNew ? currentCompleted.length + 1 : currentCompleted.length;
      
      if (totalCompletedCount === activeCourse.modules.length) {
        startCertificationExam(activeCourse);
      } else {
        closeTerminal();
        showToast("Module Decrypted & Completed", "success");
      }
    }
  };

  const handleExamAnswer = (idx: number) => {
    if (hasAnswered) return;
    setSelectedAnswer(idx);
    setHasAnswered(true);
    if (idx === examQuestions[currentExamQuestion].answer) {
      setExamScore(prev => prev + 1);
    }
  };

  const nextExamQuestion = () => {
    if (currentExamQuestion + 1 < examQuestions.length) {
      setCurrentExamQuestion(prev => prev + 1);
      setHasAnswered(false);
      setSelectedAnswer(null);
    } else {
      setExamFinished(true);
    }
  };

  const handleClaimCertificate = () => {
    if (activeCourse && examScore >= 4) {
      addCertificate(activeCourse.id);
      const courseToAward = activeCourse;
      closeTerminal();
      setTimeout(() => setShowCertModal(courseToAward), 500);
    } else {
      closeTerminal();
    }
  };

  const handleDownload = async () => {
    if (!certRef.current || !showCertModal) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#030014',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`SpaceScope_${showCertModal.name.replace(/\s+/g, '_')}_Certificate.pdf`);
      showToast("Certificate Downloaded", "success");
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const closeTerminal = () => {
    setActiveCourse(null);
    setActiveModuleIndex(null);
    setLessonContent(null);
    setIsExamMode(false);
    setExamFinished(false);
    setIsRateLimited(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-4 rounded-3xl bg-purple-500/10 text-purple-400 mb-6 border border-purple-500/20 shadow-2xl shadow-purple-900/20"
        >
          <GraduationCap size={48} />
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-4 neon-text text-white">Advanced Learning Hub</h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
          {isPremium 
            ? "Complete all modules in a domain and pass the final AI Exam to earn your certification." 
            : "Master deep-space concepts and earn industry-recognized digital certificates verified on the blockchain."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 items-stretch">
        {certifications.map((cert) => {
          const isEarned = earnedCertificates.includes(cert.id);
          const courseCompletedModules = completedModules[cert.id] || [];
          const progressPercent = (courseCompletedModules.length / cert.modules.length) * 100;
          
          return (
            <motion.div
              key={cert.id}
              whileHover={{ y: -10 }}
              className={`glass-card p-8 rounded-[2rem] border-white/5 relative group transition-all flex flex-col h-full ${!isPremium ? 'opacity-90' : 'hover:border-cyan-500/40'}`}
            >
              <div className={`absolute top-6 right-8 transition-colors ${isPremium ? 'text-cyan-400/40' : 'text-white/10 group-hover:text-purple-400/20'}`}>
                {isEarned ? <CheckCircle className="text-green-500" size={32} /> : isPremium ? <BookOpen size={28} /> : <Lock size={40} />}
              </div>
              <div className="mb-6 p-5 bg-white/5 rounded-2xl w-fit shadow-inner">
                {cert.icon}
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">{cert.name}</h3>
              <div className="flex items-center gap-3 mb-6 text-[10px] font-bold uppercase tracking-widest text-white/40">
                <span>{cert.level}</span>
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <span className={isPremium ? 'text-cyan-400' : 'text-purple-400'}>
                  {courseCompletedModules.length} / {cert.modules.length} Modules
                </span>
              </div>
              
              <div className="mb-8 flex-grow">
                {isEarned ? (
                  <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest">
                    <CheckCircle size={14} /> Certified Specialist
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-cyan-500"
                       />
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Complete all {cert.modules.length} modules to unlock the Certification Exam.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="mt-auto">
                {isPremium ? (
                  <div className="flex flex-col gap-3">
                    {isEarned ? (
                      <button 
                        onClick={() => setShowCertModal(cert)}
                        className="w-full py-3 bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/40 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={14} /> View Certificate
                      </button>
                    ) : (
                      cert.modules.map((m, idx) => {
                        const isDone = courseCompletedModules.includes(m.id);
                        return (
                          <button 
                            key={m.id}
                            onClick={() => startLesson(cert, idx)}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-between border ${isDone ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'}`}
                          >
                            <span className="truncate mr-2">{idx + 1}. {m.title}</span>
                            {isDone ? <CheckCircle size={12} /> : <Play size={12} />}
                          </button>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => navigate('/premium-alerts')}
                    className="w-full py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Lock size={14} /> Course Locked
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {(activeCourse || isExamMode) && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="w-full max-w-6xl glass-card rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh] border-cyan-500/30 shadow-[0_0_100px_rgba(0,232,255,0.1)]"
            >
              <div className="p-6 sm:p-8 border-b border-white/10 flex justify-between items-center bg-cyan-900/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/20 rounded-2xl text-cyan-400 shadow-inner">
                    {isExamMode ? <ClipboardCheck size={24} /> : <Terminal size={24} />}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-orbitron font-bold tracking-tight text-white">
                      {isExamMode ? "Certification Exam" : "Neural Briefing Terminal"}
                    </h2>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-500/60 font-bold">
                      {isExamMode ? "Verification Protocol v4.0" : "Classroom Uplink Active"}
                    </p>
                  </div>
                </div>
                <button onClick={closeTerminal} className="p-2 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full">
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 sm:p-10 overflow-y-auto no-scrollbar flex-1 bg-[#030014]/50">
                {isGeneratingLesson || isGeneratingExam ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-8 text-center">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="w-32 h-32 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full flex items-center justify-center"
                    >
                      <Zap className="text-cyan-400 animate-pulse" size={40} />
                    </motion.div>
                    <div className="space-y-3">
                      <p className="text-2xl font-orbitron font-bold text-white tracking-[0.2em] animate-pulse">
                        {isGeneratingExam ? "DE-ENCRYPTING EXAM" : "INITIALIZING NEURAL LINK"}
                      </p>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto uppercase tracking-widest font-bold">
                        Stabilizing Uplink with SpaceScope Core...
                      </p>
                    </div>
                  </div>
                ) : isRateLimited ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-white">
                    <div className="p-6 bg-red-500/10 rounded-full mb-8 text-red-500 border border-red-500/20">
                      <AlertTriangle size={64} />
                    </div>
                    <h2 className="text-4xl font-orbitron font-bold mb-4">Satellite Signal Congested</h2>
                    <p className="text-xl text-gray-400 max-w-lg mb-10 leading-relaxed">
                      Mission control is currently handling too many deep-space transmissions. Please allow the systems to cool down for 30 seconds before retrying the uplink.
                    </p>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => isExamMode ? startCertificationExam(activeCourse) : startLesson(activeCourse, activeModuleIndex!)}
                        className="px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-cyan-900/40"
                      >
                        Retry Transmission
                      </button>
                      <button onClick={closeTerminal} className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all">
                        Abort Mission
                      </button>
                    </div>
                  </div>
                ) : isExamMode ? (
                  !examFinished ? (
                    <div className="max-w-3xl mx-auto py-12">
                      <div className="mb-10 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-white/40">
                         <span>Question {currentExamQuestion + 1} / {examQuestions.length}</span>
                         <span className="text-cyan-400">Passing Score: 4/5</span>
                      </div>
                      <h3 className="text-3xl font-orbitron font-bold mb-10 leading-snug text-white">
                        {examQuestions[currentExamQuestion].question}
                      </h3>
                      <div className="space-y-4">
                        {examQuestions[currentExamQuestion].options.map((opt, idx) => {
                          let style = "glass-card border-white/10 hover:border-cyan-500/50 hover:bg-white/5";
                          if (hasAnswered) {
                            if (idx === examQuestions[currentExamQuestion].answer) style = "bg-green-500/20 border-green-500/50 text-green-400";
                            else if (idx === selectedAnswer) style = "bg-red-500/20 border-red-500/50 text-red-400";
                            else style = "opacity-40 border-white/5";
                          }
                          return (
                            <button
                              key={idx}
                              onClick={() => handleExamAnswer(idx)}
                              disabled={hasAnswered}
                              className={`w-full p-6 text-left rounded-2xl transition-all border text-lg ${style} flex justify-between items-center`}
                            >
                              <span className="text-white">{opt}</span>
                              {hasAnswered && idx === examQuestions[currentExamQuestion].answer && <CheckCircle2 size={20} className="text-green-400" />}
                            </button>
                          );
                        })}
                      </div>
                      {hasAnswered && (
                        <motion.button 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={nextExamQuestion}
                          className="w-full mt-10 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-cyan-900/40"
                        >
                          {currentExamQuestion + 1 === examQuestions.length ? "Finish Exam" : "Next Question"} <ArrowRight size={20} />
                        </motion.button>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto py-20 text-center">
                       <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-8 ${examScore >= 4 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                         {examScore >= 4 ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                       </div>
                       <h2 className="text-4xl font-orbitron font-bold mb-4 text-white">{examScore >= 4 ? "Exam Passed!" : "Exam Failed"}</h2>
                       <p className="text-xl text-gray-400 mb-10">Verification results: <span className="text-white font-bold">{examScore} / 5</span> accuracy.</p>
                       
                       {examScore >= 4 ? (
                         <button 
                           onClick={handleClaimCertificate}
                           className="w-full py-5 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-2xl shadow-orange-900/40"
                         >
                           Mint Domain Certificate <Award size={20} />
                         </button>
                       ) : (
                         <div className="flex gap-4">
                           <button onClick={() => startCertificationExam(activeCourse)} className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 text-white"><RefreshCw size={18} /> Retry Exam</button>
                           <button onClick={closeTerminal} className="flex-1 py-4 bg-transparent text-gray-400 hover:text-white font-bold">Close Terminal</button>
                         </div>
                       )}
                    </div>
                  )
                ) : lessonContent ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 pb-12">
                    <div className="relative p-10 rounded-[3rem] bg-gradient-to-br from-cyan-600/10 to-transparent border border-cyan-500/20">
                       <h3 className="text-4xl sm:text-5xl font-orbitron font-bold text-white mb-6 leading-tight">{lessonContent.moduleTitle}</h3>
                       <div className="flex flex-wrap gap-4">
                        {lessonContent.keyConcepts.map((concept, i) => (
                          <span key={i} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/60">{concept}</span>
                        ))}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                      <div className="lg:col-span-2 space-y-8">
                        <div className="glass-card p-10 rounded-[2.5rem] border-white/5 text-gray-300 text-lg leading-relaxed space-y-6">
                           {lessonContent.briefing.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
                        </div>
                        <div className="bg-black/80 rounded-3xl p-8 border border-white/10 font-mono text-sm overflow-hidden text-cyan-400/80 leading-relaxed overflow-x-auto whitespace-pre-wrap shadow-inner">
                           {lessonContent.simulationData}
                        </div>
                      </div>
                      <div className="space-y-8">
                        <div className="glass-card p-8 rounded-3xl border-white/5 bg-white/5">
                           <h4 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2"><Cpu size={18} /> Technical Specs</h4>
                           {lessonContent.technicalSpecs.map((spec, i) => (
                             <div key={i} className="border-b border-white/5 pb-4 last:border-0 last:pb-0 mb-4">
                               <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">{spec.label}</p>
                               <p className="text-sm font-bold text-white">{spec.value}</p>
                             </div>
                           ))}
                        </div>
                        <button onClick={handleCompleteModule} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold transition-all shadow-xl flex items-center justify-center gap-2 group">Complete Module <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCertModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-4xl flex flex-col items-center"
            >
              <div className="w-full flex justify-end mb-4">
                <button onClick={() => setShowCertModal(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all"><X size={24} /></button>
              </div>
              <div 
                ref={certRef}
                className="w-full aspect-[1.6/1] glass-card rounded-[2rem] p-12 border-4 border-double border-cyan-500/40 relative flex flex-col justify-between overflow-hidden shadow-[0_0_100px_rgba(0,232,255,0.15)] bg-[#030014]"
              >
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00E8FF 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <div className="flex justify-between items-start relative z-10">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 border border-cyan-500/30"><GraduationCap size={24} /></div>
                      <span className="font-orbitron font-bold text-lg tracking-[0.2em] text-white">SPACESCOPE <span className="text-cyan-500">ACADEMY</span></span>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] mb-1">Validation ID</p>
                      <p className="text-xs font-mono text-cyan-400">HASH-0X-{showCertModal.id.toUpperCase()}-CERT</p>
                   </div>
                </div>
                <div className="text-center relative z-10">
                   <h4 className="font-orbitron text-sm text-cyan-400 mb-4 uppercase tracking-[0.5em]">Certificate of Mastery</h4>
                   <h3 className="text-5xl font-orbitron font-bold text-white mb-6 tracking-tight uppercase">Specialist</h3>
                   <div className="w-32 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent mx-auto mb-6" />
                   <p className="text-lg text-gray-300 font-light max-w-xl mx-auto leading-relaxed">For successful validation in <br/><span className="text-white font-bold">{showCertModal.name}</span></p>
                </div>
                <div className="flex justify-between items-end relative z-10">
                   <div className="text-left"><p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Date Verified</p><p className="text-sm font-bold text-white">{new Date().toLocaleDateString()}</p></div>
                   <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center justify-center text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]"><Award size={32} /></div>
                </div>
              </div>
              <div className="flex gap-4 mt-12 w-full max-w-md">
                 <button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-900/40 disabled:opacity-50"
                 >
                   {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                   {isDownloading ? 'Generating...' : 'Export PDF'}
                 </button>
                 <button className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-2xl font-bold transition-all"><Share2 size={18} /></button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumLearning;
