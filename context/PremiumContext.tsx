
import React, { createContext, useContext, useState, useEffect } from 'react';

interface PremiumContextType {
  isPremium: boolean;
  setPremium: (status: boolean) => void;
  earnedCertificates: string[];
  addCertificate: (id: string) => void;
  completedModules: Record<string, string[]>; // courseId -> array of completed module IDs
  markModuleComplete: (courseId: string, moduleId: string) => void;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState<boolean>(() => {
    const saved = localStorage.getItem('spacescope_premium');
    return saved === 'true';
  });

  const [earnedCertificates, setEarnedCertificates] = useState<string[]>(() => {
    const saved = localStorage.getItem('spacescope_certs');
    return saved ? JSON.parse(saved) : [];
  });

  const [completedModules, setCompletedModules] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('spacescope_module_progress');
    return saved ? JSON.parse(saved) : {};
  });

  const setPremium = (status: boolean) => {
    setIsPremium(status);
    localStorage.setItem('spacescope_premium', String(status));
  };

  const addCertificate = (id: string) => {
    setEarnedCertificates(prev => {
      const next = [...new Set([...prev, id])];
      localStorage.setItem('spacescope_certs', JSON.stringify(next));
      return next;
    });
  };

  const markModuleComplete = (courseId: string, moduleId: string) => {
    setCompletedModules(prev => {
      const courseProgress = prev[courseId] || [];
      if (courseProgress.includes(moduleId)) return prev;
      
      const next = {
        ...prev,
        [courseId]: [...courseProgress, moduleId]
      };
      localStorage.setItem('spacescope_module_progress', JSON.stringify(next));
      return next;
    });
  };

  return (
    <PremiumContext.Provider value={{ 
      isPremium, 
      setPremium, 
      earnedCertificates, 
      addCertificate, 
      completedModules, 
      markModuleComplete 
    }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) throw new Error('usePremium must be used within a PremiumProvider');
  return context;
};
