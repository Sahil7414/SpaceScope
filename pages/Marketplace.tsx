
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Star, Package, CreditCard, ShoppingCart, 
  ChevronRight, X, Plus, Minus, Trash2, Sparkles, 
  Search, Filter, Tag, Info, CheckCircle2, ShieldCheck,
  Zap, ArrowRight, Loader2, MessageSquare
} from 'lucide-react';
import { usePremium } from '../context/PremiumContext';
import { GoogleGenAI, Type } from "@google/genai";

interface Product {
  id: string;
  name: string;
  category: 'Samples' | 'Gear' | 'Art' | 'Books';
  price: number;
  description: string;
  img: string;
  isRare?: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

const PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    name: "Lunar Regolith Fragment", 
    category: 'Samples', 
    price: 12500, 
    description: "0.5g of authentic lunar soil collected during the Apollo era. Certified by the Global Meteorite Collective.", 
    img: "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?auto=format&fit=crop&q=80&w=400", 
    isRare: true 
  },
  { 
    id: 'p2', 
    name: "Pro 70mm Refractor Telescope", 
    category: 'Gear', 
    price: 24999, 
    description: "Perfect for planetary observation with high-contrast optics and stable alt-azimuth mount.", 
    img: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=400" 
  },
  { 
    id: 'p3', 
    name: "Andromeda Giclée Print", 
    category: 'Art', 
    price: 1200, 
    description: "High-resolution wide-field capture of M31. 24x36 inch archival paper.", 
    img: "https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&q=80&w=400" 
  },
  { 
    id: 'p4', 
    name: "Mars Explorer Field Guide", 
    category: 'Books', 
    price: 899, 
    description: "Comprehensive geological map and history of Martian exploration.", 
    img: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&q=80&w=400" 
  },
  { 
    id: 'p5', 
    name: "Campo del Cielo Meteorite", 
    category: 'Samples', 
    price: 4500, 
    description: "Iron meteorite from Argentina. 15-20g specimen with distinct regmaglypts.", 
    img: "https://images.unsplash.com/photo-1614313913007-2b4ae8ce32d6?auto=format&fit=crop&q=80&w=400", 
    isRare: true 
  },
  { 
    id: 'p6', 
    name: "Astronomy Binoculars 10x50", 
    category: 'Gear', 
    price: 5600, 
    description: "Large aperture binoculars for scanning the Milky Way. Nitrogen purged and waterproof.", 
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400" 
  },
  { 
    id: 'p7', 
    name: "Deep Space Nebula Poster Set", 
    category: 'Art', 
    price: 2200, 
    description: "Set of 3 high-quality prints featuring Orion, Lagoon, and Eagle nebulae.", 
    img: "https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&q=80&w=400" 
  },
  { 
    id: 'p8', 
    name: "Quantum Physics: Space Edition", 
    category: 'Books', 
    price: 1500, 
    description: "Understanding the bridge between the very small and the very large in the cosmic landscape.", 
    img: "https://images.unsplash.com/photo-1532012197367-263e98c5bb51?auto=format&fit=crop&q=80&w=400" 
  }
];

const Marketplace: React.FC = () => {
  const navigate = useNavigate();
  const { isPremium } = usePremium();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('spacescope_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // AI Concierge state
  const [isAiConsulting, setIsAiConsulting] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('spacescope_cart', JSON.stringify(cart));
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = isPremium ? cartTotal * 0.15 : 0;
  const finalTotal = cartTotal - discountAmount;

  const consultAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;

    setIsAiConsulting(true);
    setAiAdvice(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the SpaceScope Cosmic Concierge. A user is asking: "${userQuery}". Based on our product list: ${JSON.stringify(PRODUCTS.map(p => ({name: p.name, price: p.price, desc: p.description})))}. Give a helpful, enthusiastic recommendation in 3 sentences max.`,
      });
      setAiAdvice(response.text);
    } catch (error) {
      setAiAdvice("Apologies explorer, the stellar link is weak. I recommend the Lunar Fragment for any serious collection!");
    } finally {
      setIsAiConsulting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header & Filter Bar */}
      <section className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-orbitron font-bold mb-2 neon-text">Cosmic Marketplace</h1>
          <p className="text-gray-400">Curated gear for the modern explorer.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search gear..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 pl-10 text-sm focus:outline-none focus:border-cyan-500/50 transition-all w-64"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400" size={16} />
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {['All', 'Samples', 'Gear', 'Art', 'Books'].map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCategory === cat ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-gray-500 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative p-3 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-600/30 transition-all flex items-center gap-2"
          >
            <ShoppingCart size={20} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
            <span className="text-xs font-bold hidden sm:block">Cart</span>
          </button>
        </div>
      </section>

      {/* Cosmic Concierge (AI Recommendations) */}
      <section className="glass-card p-8 rounded-[2rem] border-purple-500/20 bg-gradient-to-r from-purple-900/10 via-transparent to-transparent">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400">
            <MessageSquare size={24} />
          </div>
          <div>
            <h2 className="text-xl font-orbitron font-bold">Cosmic Concierge</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">AI-Powered Gear Discovery</p>
          </div>
        </div>

        <form onSubmit={consultAI} className="flex gap-4">
          <input 
            type="text" 
            placeholder="Ask: 'What's the best item for a beginner astronomer?'"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
          />
          <button 
            type="submit"
            disabled={isAiConsulting}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/40 disabled:opacity-50 flex items-center gap-2"
          >
            {isAiConsulting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            Consult
          </button>
        </form>

        <AnimatePresence>
          {aiAdvice && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-4 bg-white/5 border-l-2 border-purple-500 rounded-r-xl"
            >
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "{aiAdvice}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Product Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredProducts.map(product => (
          <motion.div 
            key={product.id}
            layoutId={product.id}
            whileHover={{ y: -10 }}
            className="glass-card rounded-[2rem] overflow-hidden border-white/5 group relative flex flex-col"
          >
            {product.isRare && (
              <div className="absolute top-4 left-4 z-10 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                <Star size={10} fill="currentColor" /> Rare Specimen
              </div>
            )}
            
            <div className="h-48 relative overflow-hidden bg-white/5">
              <img 
                src={product.img} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=400";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-transparent opacity-60" />
              <button 
                onClick={() => setSelectedProduct(product)}
                className="absolute bottom-4 right-4 p-3 bg-black/40 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-cyan-600"
              >
                <Info size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg group-hover:text-cyan-400 transition-colors">{product.name}</h3>
              </div>
              <p className="text-gray-500 text-xs mb-4 line-clamp-2 leading-relaxed">{product.description}</p>
              
              <div className="mt-auto flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-500 line-through decoration-red-500/30">
                    {isPremium ? `₹${(product.price * 1.15).toLocaleString()}` : ''}
                  </div>
                  <div className="text-xl font-orbitron font-bold text-cyan-400">
                    ₹{product.price.toLocaleString()}
                  </div>
                </div>
                <button 
                  onClick={() => addToCart(product)}
                  className="p-3 bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-600 hover:text-white transition-all shadow-lg"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Cart Side Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md h-full bg-[#050014] border-l border-white/10 shadow-2xl flex flex-col z-10"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="text-cyan-400" size={24} />
                  <h2 className="text-xl font-orbitron font-bold">Your Gear Bag</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20">
                    <ShoppingBag size={64} className="text-gray-800 mb-6" />
                    <h3 className="text-xl font-bold mb-2">Cart is empty</h3>
                    <p className="text-gray-500 text-sm">Fill your gear bag with authentic space artifacts.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 relative group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img src={item.img} className="w-full h-full object-cover" alt={item.name} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-cyan-400 font-bold mb-3">₹{(item.price * item.quantity).toLocaleString()}</p>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 bg-white/5 hover:bg-white/10 rounded-md"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 bg-white/5 hover:bg-white/10 rounded-md"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="absolute top-2 right-2 p-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-8 bg-white/5 border-t border-white/10 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-white font-bold">₹{cartTotal.toLocaleString()}</span>
                  </div>
                  {isPremium ? (
                    <div className="flex justify-between text-sm text-green-400 font-bold">
                      <span className="flex items-center gap-2"><ShieldCheck size={14} /> Pro Member Discount (15%)</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                       <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Save ₹{(cartTotal * 0.15).toLocaleString()} with Pro</p>
                       <button onClick={() => navigate('/premium-alerts')} className="text-[10px] font-bold underline text-white">Upgrade</button>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="font-bold text-lg">Total</span>
                    <span className="text-2xl font-orbitron font-bold text-cyan-400">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  disabled={cart.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-cyan-900/40 disabled:opacity-50 transition-all"
                >
                  Confirm Purchase <ArrowRight size={20} />
                </button>
                <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest">Secure SSL 256-bit Encrypted Uplink</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Quick View Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              layoutId={selectedProduct.id}
              className="relative w-full max-w-4xl glass-card rounded-[3rem] overflow-hidden flex flex-col md:flex-row z-10 border-white/20 shadow-2xl"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 p-2 bg-black/60 text-white rounded-full hover:bg-white/20 transition-all z-20"
              >
                <X size={24} />
              </button>

              <div className="md:w-1/2 h-80 md:h-auto overflow-hidden bg-white/5">
                <img 
                  src={selectedProduct.img} 
                  className="w-full h-full object-cover" 
                  alt={selectedProduct.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&q=80&w=1200";
                  }}
                />
              </div>

              <div className="md:w-1/2 p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                      {selectedProduct.category}
                    </span>
                    {selectedProduct.isRare && (
                      <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                        Collector Item
                      </span>
                    )}
                  </div>
                  <h2 className="text-4xl font-orbitron font-bold mb-6 text-white">{selectedProduct.name}</h2>
                  <p className="text-gray-400 text-lg leading-relaxed mb-8">{selectedProduct.description}</p>
                  
                  <div className="space-y-4 mb-8">
                     <div className="flex items-center gap-3 text-sm text-gray-400">
                        <Package size={18} className="text-cyan-400" />
                        <span>Ships from International Space Station Warehouse</span>
                     </div>
                     <div className="flex items-center gap-3 text-sm text-gray-400">
                        <CheckCircle2 size={18} className="text-green-500" />
                        <span>Lifetime Authenticity Guarantee</span>
                     </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-8">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Price</p>
                    <p className="text-3xl font-orbitron font-bold text-white">₹{selectedProduct.price.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="flex-1 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-3"
                  >
                    Add to Bag <ShoppingCart size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trust Badges */}
      <section className="mt-12 py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="flex gap-6 items-center">
          <div className="shrink-0 w-16 h-16 bg-cyan-600/10 rounded-2xl flex items-center justify-center text-cyan-400 shadow-inner">
            <Package size={32} />
          </div>
          <div>
            <h4 className="text-lg font-bold mb-1">Verified Authenticity</h4>
            <p className="text-sm text-gray-500">Every celestial fragment includes a physical COA and digital NFT token.</p>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="shrink-0 w-16 h-16 bg-purple-600/10 rounded-2xl flex items-center justify-center text-purple-400 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h4 className="text-lg font-bold mb-1">Secure Transaction</h4>
            <p className="text-sm text-gray-500">256-bit encrypted checkout with multi-node quantum verification.</p>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <div className="shrink-0 w-16 h-16 bg-orange-600/10 rounded-2xl flex items-center justify-center text-orange-400 shadow-inner">
            <Zap size={32} />
          </div>
          <div>
            <h4 className="text-lg font-bold mb-1">Next-Day Delivery</h4>
            <p className="text-sm text-gray-500">Priority orbital logistics ensures your gear arrives via hypersonic couriers.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Marketplace;
