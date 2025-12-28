
import React from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import StarBackground from './components/StarBackground';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import Events from './pages/Events';
import Weather from './pages/Weather';
import Missions from './pages/Missions';
import Learn from './pages/Learn';
import PremiumAlerts from './pages/PremiumAlerts';
import PremiumLearning from './pages/PremiumLearning';
import Marketplace from './pages/Marketplace';
import CosmicChatbot from './components/CosmicChatbot';
import { PremiumProvider } from './context/PremiumContext';
import { NotificationProvider } from './context/NotificationContext';

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Landing /></PageWrapper>} />
        <Route path="/events" element={<PageWrapper><Events /></PageWrapper>} />
        <Route path="/weather" element={<PageWrapper><Weather /></PageWrapper>} />
        <Route path="/missions" element={<PageWrapper><Missions /></PageWrapper>} />
        <Route path="/learn" element={<PageWrapper><Learn /></PageWrapper>} />
        <Route path="/premium-alerts" element={<PageWrapper><PremiumAlerts /></PageWrapper>} />
        <Route path="/premium-learning" element={<PageWrapper><PremiumLearning /></PageWrapper>} />
        <Route path="/marketplace" element={<PageWrapper><Marketplace /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <PremiumProvider>
      <NotificationProvider>
        <Router>
          <div className="min-h-screen relative flex flex-col overflow-x-hidden">
            <StarBackground />
            <Navbar />
            <main className="flex-grow">
              <AnimatedRoutes />
            </main>
            <CosmicChatbot />
            <Footer />
          </div>
        </Router>
      </NotificationProvider>
    </PremiumProvider>
  );
};

export default App;
