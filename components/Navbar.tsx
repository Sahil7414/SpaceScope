
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Rocket, ShoppingBag, Bell, GraduationCap } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#030014]/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Rocket className="text-cyan-400 group-hover:rotate-45 transition-transform" />
          <span className="font-orbitron text-2xl font-bold tracking-wider neon-text">
            Space<span className="text-purple-500">Scope</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em]">
          <Link to="/events" className={`${isActive('/events') ? 'text-cyan-400' : 'text-gray-400'} hover:text-white transition-colors`}>Events</Link>
          <Link to="/weather" className={`${isActive('/weather') ? 'text-cyan-400' : 'text-gray-400'} hover:text-white transition-colors`}>Weather</Link>
          <Link to="/missions" className={`${isActive('/missions') ? 'text-cyan-400' : 'text-gray-400'} hover:text-white transition-colors`}>Missions</Link>
          <Link to="/learn" className={`${isActive('/learn') ? 'text-cyan-400' : 'text-gray-400'} hover:text-white transition-colors`}>Learning</Link>
          
          <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
          
          <Link to="/premium-alerts" className={`${isActive('/premium-alerts') ? 'text-purple-400' : 'text-purple-500/60'} hover:text-purple-300 transition-colors flex items-center gap-1`}>
            <Bell size={14} /> Alerts
          </Link>
          <Link to="/premium-learning" className={`${isActive('/premium-learning') ? 'text-purple-400' : 'text-purple-500/60'} hover:text-purple-300 transition-colors flex items-center gap-1`}>
            <GraduationCap size={14} /> Certificates
          </Link>
          <Link to="/marketplace" className="p-2 bg-purple-600/20 rounded-full border border-purple-500/30 hover:bg-purple-600/40 transition-all text-purple-300">
            <ShoppingBag size={18} />
          </Link>
        </div>

        {/* Mobile basic menu toggle placeholder */}
        <button className="md:hidden text-white p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
