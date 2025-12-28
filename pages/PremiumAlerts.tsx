
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Map, Zap, Layers, Lock, ShieldCheck, CreditCard, Loader2, CheckCircle2, X } from 'lucide-react';
import { usePremium } from '../context/PremiumContext';

const PremiumAlerts: React.FC = () => {
  const { isPremium, setPremium } = usePremium();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  const handleSubscribe = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setPremium(true);
      setJustSubscribed(true);
    }, 2000);
  };

  const closeCheckout = () => {
    setShowCheckout(false);
    setJustSubscribed(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-block p-2 rounded-full bg-purple-500/20 text-purple-400 mb-6 border border-purple-500/30">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-4xl font-orbitron font-bold mb-4">Pro Astronomy Alerts 🔥</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          {isPremium 
            ? "Welcome, Pro Astronomer! All features are now active for your account." 
            : "Take your observations to the next level with precision data and real-time triggers."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {[
          { icon: <Bell className="text-cyan-400" />, title: "Custom Reminders", desc: "Set persistent notifications for specific constellations or planet transits." },
          { icon: <Map className="text-purple-400" />, title: "Light Pollution Overlay", desc: "Integrated Bortle-scale maps to find the darkest skies near you." },
          { icon: <Zap className="text-orange-400" />, title: "Solar Storm Triggers", desc: "Push alerts directly to your device when KP index hits your threshold." },
          { icon: <Layers className="text-pink-400" />, title: "Cloud Coverage Forecast", desc: "Hyper-local weather sync for the next 48 hours." }
        ].map((feat, i) => (
          <div key={i} className="glass-card p-8 rounded-2xl border-white/5 relative group overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               {isPremium ? <CheckCircle2 className="text-green-500" size={48} /> : <Lock size={48} />}
             </div>
             <div className="mb-6 p-4 bg-white/5 rounded-xl w-fit">{feat.icon}</div>
             <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
             <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>

      {!isPremium && (
        <div className="glass-card p-12 rounded-[3rem] text-center border-cyan-500/20 bg-gradient-to-br from-cyan-900/10 to-transparent">
          <h2 className="text-3xl font-orbitron font-bold mb-8">Ready to see more?</h2>
          <div className="flex flex-col items-center gap-6">
            <div className="text-5xl font-bold">₹49<span className="text-xl font-normal text-gray-500">/mo</span></div>
            <p className="text-sm text-gray-500">No commitment, cancel anytime.</p>
            <button 
              onClick={() => setShowCheckout(true)}
              className="px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-cyan-900/40 relative overflow-hidden group"
            >
              <span className="relative z-10">Subscribe Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </button>
          </div>
        </div>
      )}

      {isPremium && (
        <div className="p-8 text-center bg-green-500/10 border border-green-500/30 rounded-3xl">
          <h2 className="text-2xl font-bold text-green-400 mb-2">Subscription Active</h2>
          <p className="text-gray-400">You are currently on the Pro Monthly plan. Enjoy the cosmos!</p>
          <button 
            onClick={() => setPremium(false)}
            className="mt-6 text-xs text-gray-500 underline hover:text-white transition-colors"
          >
            Cancel Subscription (Demo Mode)
          </button>
        </div>
      )}

      {/* Mock Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCheckout}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-card rounded-3xl overflow-hidden z-10 border-white/10 shadow-2xl"
            >
              <button 
                onClick={closeCheckout}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              {!justSubscribed ? (
                <div className="p-8 pt-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Pro Checkout</h3>
                      <p className="text-xs text-gray-400 uppercase tracking-widest">SpaceScope Pro Monthly</p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-400">Monthly Plan</span>
                        <span className="text-sm font-bold">₹49.00</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Taxes & Fees</span>
                        <span>Included</span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-white/10 flex justify-between font-bold text-lg">
                        <span>Total Due</span>
                        <span className="text-cyan-400">₹49.00</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSubscribe}
                    disabled={isProcessing}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Verifying Link...
                      </>
                    ) : (
                      'Confirm Payment'
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30"
                  >
                    <CheckCircle2 size={40} />
                  </motion.div>
                  <h3 className="text-2xl font-orbitron font-bold mb-2 text-white">Welcome Pro!</h3>
                  <p className="text-gray-400 text-sm mb-8">
                    Your deep-space connection is active. You now have full access to alerts, maps, and premium data.
                  </p>
                  <button
                    onClick={closeCheckout}
                    className="w-full py-3 bg-white/10 border border-white/10 hover:bg-white/20 rounded-xl font-bold transition-all"
                  >
                    Start Exploring
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumAlerts;
