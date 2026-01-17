
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
          <div className="absolute top-16 right-0 w-64 flex flex-col gap-2 animate-slide-in-right origin-top-right">
             <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-right mb-2 px-2">Extended Modules</div>
             
             {/* Stellar Simulation */}
             <button 
                onClick={() => onSelectMode('observation')}
                className="group flex items-center gap-4 bg-[#0a0a0a]/90 hover:bg-[#111] border border-white/10 p-4 rounded-xl backdrop-blur-xl transition-all hover:border-blue-500/40 hover:translate-x-[-5px]"
             >
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-sun"></i>
                </div>
                <div className="flex flex-col items-start">
                   <span className="text-xs font-bold text-gray-200 group-hover:text-blue-200">星球模拟引擎</span>
                   <span className="text-[8px] text-gray-600 font-mono">STELLAR_CORE</span>
                </div>
             </button>

             {/* Metaverse HUB */}
             <button 
                onClick={() => onSelectMode('metaverse')}
                className="group flex items-center gap-4 bg-[#0a0a0a]/90 hover:bg-[#111] border border-white/10 p-4 rounded-xl backdrop-blur-xl transition-all hover:border-purple-500/40 hover:translate-x-[-5px]"
             >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-globe"></i>
                </div>
                <div className="flex flex-col items-start">
                   <span className="text-xs font-bold text-gray-200 group-hover:text-purple-200">元世界 HUB</span>
                   <span className="text-[8px] text-gray-600 font-mono">DIMENSION_LINK</span>
                </div>
             </button>

             {/* Ascension Room */}
             <button 
                onClick={() => onSelectMode('ascension')}
                className="group flex items-center gap-4 bg-[#0a0a0a]/90 hover:bg-[#111] border border-white/10 p-4 rounded-xl backdrop-blur-xl transition-all hover:border-amber-500/40 hover:translate-x-[-5px]"
             >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                   <i className="fa-solid fa-star"></i>
                </div>
                <div className="flex flex-col items-start">
                   <span className="text-xs font-bold text-gray-200 group-hover:text-amber-200">升星室</span>
                   <span className="text-[8px] text-gray-600 font-mono">UPGRADE_ALTAR</span>
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
            
            {/* New Game Hero Section */}
            <button 
                onClick={() => onSelectMode('tank-battle')}
                className="group relative w-full h-48 bg-gradient-to-r from-amber-900/40 to-black border border-amber-600/30 rounded-2xl flex items-center justify-between px-8 md:px-12 hover:border-amber-500 hover:shadow-[0_0_60px_rgba(245,158,11,0.15)] transition-all overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <i className="fa-solid fa-gamepad fa-10x -rotate-12 text-amber-500"></i>
                </div>
                
                <div className="flex flex-col items-start z-10 text-left">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-lg shadow-amber-500/20">Featured</span>
                        <h2 className="text-4xl md:text-5xl font-black italic text-white group-hover:text-amber-400 transition-colors uppercase tracking-tighter drop-shadow-lg">坦克大战</h2>
                    </div>
                    <p className="text-sm text-gray-400 font-mono group-hover:text-gray-300 max-w-md leading-relaxed">
                       PROJECT_TITAN // 启动量子装甲战术模拟。体验 Roguelike 升级系统与高强度弹幕对决。
                    </p>
                </div>

                <div className="flex items-center gap-6 z-10">
                    <div className="w-16 h-16 bg-amber-500 text-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(245,158,11,0.6)]">
                        <i className="fa-solid fa-play text-2xl"></i>
                    </div>
                </div>
            </button>

            {/* Physics Lab - Main List Item */}
            <button 
                onClick={() => onSelectMode('physics')}
                className="group relative w-full h-24 bg-[#0a0a0a] border border-white/5 rounded-2xl flex items-center justify-between px-8 hover:border-white/20 transition-all shadow-xl overflow-hidden hover:bg-[#111]"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <i className="fa-solid fa-atom fa-6x -rotate-12"></i>
                </div>

                <div className="flex items-center gap-6 z-10">
                    <div className="w-12 h-12 bg-gray-500/10 rounded-xl flex items-center justify-center border border-gray-500/20 group-hover:bg-gray-500/20 transition-colors">
                        <i className="fa-solid fa-microchip text-xl text-gray-400 group-hover:text-gray-200"></i>
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-300 group-hover:text-white transition-colors">物理实验室</h3>
                        <p className="text-xs text-gray-600 font-mono">PHYS_LAB // Experimental Sandbox Environment</p>
                    </div>
                </div>
                <div className="text-gray-800 group-hover:text-gray-500 transition-colors z-10">
                    <i className="fa-solid fa-chevron-right text-xl"></i>
                </div>
            </button>

        </div>
      </div>
      
      {/* Bottom Footer Decoration */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center opacity-20 px-8">
        <div className="flex items-center gap-8 text-[9px] font-mono tracking-widest uppercase">
          <div className="flex gap-2"><span>STABILITY</span> <span className="text-green-500">OPTIMAL</span></div>
          <div className="flex gap-2"><span>PHYS_KERNEL</span> <span className="text-blue-500">ACTIVE</span></div>
          <div className="flex gap-2"><span>GEN_AI_BRIDGE</span> <span className="text-purple-500">READY</span></div>
        </div>
      </div>
    </div>
  );
};

export default MainMenuView;
