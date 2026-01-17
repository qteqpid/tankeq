
import React, { useState } from 'react';
import { ViewMode } from '../types';

interface MainMenuViewProps {
  onSelectMode: (mode: ViewMode) => void;
}

const MainMenuView: React.FC<MainMenuViewProps> = ({ onSelectMode }) => {
  const [showExtraMenu, setShowExtraMenu] = useState(false);

  return (
    <div className="w-full h-screen bg-[#050505] flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a1a2e_0%,_transparent_70%)] opacity-40"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '60px 60px' }}></div>
      
      {/* Top Right Extra Menu */}
      <div className="absolute top-8 right-8 z-50 flex flex-col items-end">
        <button 
          onClick={() => setShowExtraMenu(!showExtraMenu)}
          className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 group hover:scale-110 ${showExtraMenu ? 'bg-white/20 text-white rotate-90' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
        >
          <i className={`fa-solid ${showExtraMenu ? 'fa-xmark' : 'fa-bars'} text-lg`}></i>
        </button>

        {showExtraMenu && (
          <div className="absolute top-16 right-0 w-72 flex flex-col gap-2 animate-slide-in-right origin-top-right bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-right mb-2 px-2 py-1 border-b border-white/5">Extended Modules</div>
             
             {/* Stellar Simulation */}
             <button 
                onClick={() => onSelectMode('observation')}
                className="group flex items-center gap-4 hover:bg-white/10 p-3 rounded-xl transition-all"
             >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform border border-blue-500/20">
                   <i className="fa-solid fa-sun"></i>
                </div>
                <div className="flex flex-col items-start text-left">
                   <span className="text-sm font-bold text-gray-200 group-hover:text-blue-200">星球模拟引擎</span>
                   <span className="text-[9px] text-gray-600 font-mono">STELLAR_CORE</span>
                </div>
             </button>

             {/* Metaverse HUB */}
             <button 
                onClick={() => onSelectMode('metaverse')}
                className="group flex items-center gap-4 hover:bg-white/10 p-3 rounded-xl transition-all"
             >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform border border-purple-500/20">
                   <i className="fa-solid fa-globe"></i>
                </div>
                <div className="flex flex-col items-start text-left">
                   <span className="text-sm font-bold text-gray-200 group-hover:text-purple-200">元世界 HUB</span>
                   <span className="text-[9px] text-gray-600 font-mono">DIMENSION_LINK</span>
                </div>
             </button>

             {/* Ascension Room */}
             <button 
                onClick={() => onSelectMode('ascension')}
                className="group flex items-center gap-4 hover:bg-white/10 p-3 rounded-xl transition-all"
             >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform border border-amber-500/20">
                   <i className="fa-solid fa-star"></i>
                </div>
                <div className="flex flex-col items-start text-left">
                   <span className="text-sm font-bold text-gray-200 group-hover:text-amber-200">升星室</span>
                   <span className="text-[9px] text-gray-600 font-mono">UPGRADE_ALTAR</span>
                </div>
             </button>
          </div>
        )}
      </div>

      <div className="z-10 text-center flex flex-col items-center w-full max-w-6xl px-6 h-full justify-center py-12">
        
        <div className="mb-2 px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-[0.4em] text-gray-500 uppercase">
          Universal Simulation Laboratory
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-4 bg-gradient-to-b from-white via-gray-400 to-gray-700 bg-clip-text text-transparent">
          COSMOS ENGINE
        </h1>
        
        <p className="text-sm md:text-base text-gray-500 max-w-2xl mb-12 font-medium tracking-wide leading-relaxed">
          探索星际演化的奥秘，在高度精确的物理场中构建您的宇宙秩序。
          <br/>
          <span className="text-[10px] opacity-40 uppercase tracking-widest">Multi-Engine Celestial Mechanics Suite</span>
        </p>

        <div className="flex flex-col gap-6 w-full max-w-3xl animate-fade-in-up">
            
            {/* Tank Battle Hero Section */}
            <button 
                onClick={() => onSelectMode('tank-battle')}
                className="group relative w-full h-64 bg-gradient-to-br from-[#1a1a1a] to-black border border-amber-500/30 rounded-3xl flex items-center justify-between px-12 hover:border-amber-500 hover:shadow-[0_0_80px_rgba(245,158,11,0.2)] transition-all overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -right-20 -top-20 text-amber-900/20 group-hover:text-amber-900/30 transition-colors duration-500 transform rotate-12">
                    <i className="fa-solid fa-gamepad text-[300px]"></i>
                </div>
                
                <div className="flex flex-col items-start z-10 text-left space-y-4">
                    <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-full">
                        <i className="fa-solid fa-fire text-amber-500 text-xs"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Featured Simulation</span>
                    </div>
                    <div>
                        <h2 className="text-6xl font-black italic text-white group-hover:text-amber-400 transition-colors uppercase tracking-tighter drop-shadow-lg">坦克大战</h2>
                        <span className="text-2xl font-thin text-gray-500 tracking-widest uppercase ml-1">Project Titan</span>
                    </div>
                    <p className="text-sm text-gray-400 font-mono group-hover:text-gray-300 max-w-md leading-relaxed border-l-2 border-white/10 pl-4">
                       启动量子装甲战术模拟。体验 Roguelike 升级系统与高强度弹幕对决。
                    </p>
                </div>

                <div className="flex items-center justify-center z-10 group-hover:translate-x-2 transition-transform">
                    <div className="w-20 h-20 bg-amber-500 text-black rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.6)] group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-play text-3xl ml-1"></i>
                    </div>
                </div>
            </button>

            {/* Physics Lab Banner */}
            <button 
                onClick={() => onSelectMode('physics')}
                className="group relative w-full h-24 bg-[#0a0a0a] border border-white/10 rounded-2xl flex items-center justify-between px-8 hover:border-cyan-500/50 hover:bg-[#0f0f0f] transition-all overflow-hidden"
            >
                <div className="flex items-center gap-6 z-10">
                    <div className="w-12 h-12 bg-gray-800/50 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-all">
                        <i className="fa-solid fa-flask text-xl"></i>
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-300 group-hover:text-white transition-colors">物理实验室</h3>
                        <p className="text-xs text-gray-600 font-mono group-hover:text-cyan-500/70">PHYS_LAB // Experimental Sandbox Environment</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 opacity-30 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Enter Lab</span>
                    <i className="fa-solid fa-arrow-right text-cyan-500"></i>
                </div>
            </button>

        </div>
      </div>
      
      {/* Bottom Footer Decoration */}
      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center justify-center opacity-40 gap-2">
        <div className="flex items-center gap-8 text-[9px] font-mono tracking-widest uppercase">
          <div className="flex gap-2"><span>STABILITY</span> <span className="text-green-500">OPTIMAL</span></div>
          <div className="flex gap-2"><span>PHYS_KERNEL</span> <span className="text-blue-500">ACTIVE</span></div>
          <div className="flex gap-2"><span>GEN_AI_BRIDGE</span> <span className="text-purple-500">READY</span></div>
        </div>
        <div className="text-[10px] font-black text-gray-500 tracking-widest uppercase hover:text-white transition-colors cursor-default">
            made by @zgy
        </div>
      </div>
    </div>
  );
};

export default MainMenuView;
