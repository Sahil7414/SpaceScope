
import React from 'react';
import { Github, Twitter, Instagram, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 py-12 px-4 border-t border-white/10 bg-[#030014]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <h2 className="font-orbitron text-2xl font-bold mb-4 neon-text">SpaceScope</h2>
          <p className="text-gray-400 text-sm max-w-sm">
            Our mission is to bring the cosmos closer to everyone. Track missions, 
            learn about celestial mechanics, and stay updated with space weather in real-time.
          </p>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Quick Links</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            <li><a href="#" className="hover:text-cyan-400">Solar Activity</a></li>
            <li><a href="#" className="hover:text-cyan-400">Launch Schedules</a></li>
            <li><a href="#" className="hover:text-cyan-400">Astro-Photography</a></li>
            <li><a href="#" className="hover:text-cyan-400">Privacy Policy</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Connect</h3>
          <div className="flex gap-4">
            <Twitter size={20} className="text-gray-400 hover:text-cyan-400 cursor-pointer" />
            <Github size={20} className="text-gray-400 hover:text-white cursor-pointer" />
            <Instagram size={20} className="text-gray-400 hover:text-pink-400 cursor-pointer" />
            <Mail size={20} className="text-gray-400 hover:text-purple-400 cursor-pointer" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 text-center text-gray-500 text-xs">
        &copy; 2024 SpaceScope Ventures. Built with cosmic passion.
      </div>
    </footer>
  );
};

export default Footer;
