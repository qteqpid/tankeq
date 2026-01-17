
import React from 'react';
import { ViewMode } from '../types';

interface MainMenuViewProps {
  onSelectMode: (mode: ViewMode) => void;
}

const MainMenuView: React.FC<MainMenuViewProps> = ({ onSelectMode }) => {
  return (
    <div className="w-full h-screen bg-[#050505] flex flex-col items-center justify-center text-white relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#1a1a2e_0%,_transparent_70%)] opacity-40"></div>
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '60px 60px' }}></div>
      
      <div className="z-10 text-center flex flex-col items-center w-full max-w-6xl px-6 h-full justify-center py-12">
        
        <div className="mb-2 px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold tracking-[0.4em] text-gray-500 uppercase">
          Universal Simulation Laboratory
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter mb-4 bg-gradient-to-b from-white via-gray-400 to-gray-700 bg-clip-text text-transparent">
          COSMOS ENGINE
        </h1>
        
        <p className="text-sm md:text-base text-gray-500 max-w-2xl mb-10 font-medium tracking-wide leading-relaxed">
          探索星际演化的奥秘，在高度精确的物理场中构建您的宇宙秩序。
          <br/>
          <span className="text-[10px] opacity-40 uppercase tracking-widest">Multi-Engine Celestial Mechanics Suite</span>
        </p>

        <div className="flex flex-col gap-6 w-full animate-fade-in-up">
            
            {/* New Game Hero Section */}
            <button 
                onClick={() => onSelectMode('tank-battle')}
                className="group relative w-full h-40 bg-gradient-to-r from-amber-900/40 to-black border border-amber-600/30 rounded-2xl flex items-center justify-between px-8 md:px-12 hover:border-amber-500 hover:shadow-[0_0_50px_rgba(245,158,11,0.2)] transition-all overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                    <i className="fa-solid fa-gamepad fa-8x -rotate-12 text-amber-500"></i>
                </div>
                
                <div className="flex flex-col items-start z-10 text-left">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Featured</span>
                        <h2 className="text-3xl md:text-4xl font-black italic text-white group-hover:text-amber-400 transition-colors uppercase tracking-tighter">坦克大战</h2>
                    </div>
                    <p className="text-xs text-gray-400 font-mono group-hover:text-gray-300">PROJECT_TITAN // 启动量子装甲战术模拟</p>
                </div>

                <div className="flex items-center gap-4 z-10">
                    <span className="hidden md:block text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] group-hover:mr-4 transition-all">Start Operation</span>
                    <div className="w-12 h-12 bg-amber-500 text-black rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                        <i className="fa-solid fa-play"></i>
                    </div>
                </div>
            </button>

            {/* Tools Grid - Updated to 2x2 for Ascension Room */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
                {/* Mode 1: Stellar Simulation */}
                <button 
                    onClick={() => onSelectMode('observation')}
                    className="group relative flex flex-col items-start p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl text-left hover:border-white/20 transition-all shadow-xl overflow-hidden hover:bg-[#111]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                    <i className="fa-solid fa-sun fa-5x rotate-12"></i>
                    </div>
                    
                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 border border-blue-500/20">
                    <i className="fa-solid fa-rocket text-blue-400 group-hover:text-blue-300 transition-colors"></i>
                    </div>
                    
                    <h3 className="text-sm font-bold mb-2 group-hover:text-blue-200 transition-colors">星球模拟引擎</h3>
                    <p className="text-[10px] text-gray-600 leading-relaxed mb-4 line-clamp-2">
                    构建星系与超新星模拟。
                    </p>
                </button>

                {/* Mode 2: Metaverse (HUB) */}
                <button 
                    onClick={() => onSelectMode('metaverse')}
                    className="group relative flex flex-col items-start p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl text-left hover:border-purple-500/30 transition-all shadow-xl overflow-hidden hover:bg-[#111]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity text-purple-500">
                    <i className="fa-solid fa-infinity fa-5x"></i>
                    </div>
                    
                    <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 border border-purple-500/20">
                    <i className="fa-solid fa-globe text-purple-400 group-hover:text-purple-300 transition-colors"></i>
                    </div>
                    
                    <h3 className="text-sm font-bold mb-2 group-hover:text-purple-200 transition-colors">元世界 HUB</h3>
                    <p className="text-[10px] text-gray-600 leading-relaxed mb-4 line-clamp-2">
                    进入跨维度的宇宙核心。
                    </p>
                </button>

                {/* Mode 3: Physics Lab */}
                <button 
                    onClick={() => onSelectMode('physics')}
                    className="group relative flex flex-col items-start p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl text-left hover:border-white/20 transition-all shadow-xl overflow-hidden hover:bg-[#111]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                    <i className="fa-solid fa-atom fa-5x -rotate-12"></i>
                    </div>
                    
                    <div className="w-10 h-10 bg-gray-500/10 rounded-lg flex items-center justify-center mb-4 border border-gray-500/20">
                    <i className="fa-solid fa-microchip text-gray-400 group-hover:text-gray-300 transition-colors"></i>
                    </div>
                    
                    <h3 className="text-sm font-bold mb-2 group-hover:text-gray-200 transition-colors">物理实验室</h3>
                    <p className="text-[10px] text-gray-600 leading-relaxed mb-4 line-clamp-2">
                    精密参数控制界面。
                    </p>
                </button>

                {/* Mode 4: Ascension Room (NEW) */}
                <button 
                    onClick={() => onSelectMode('ascension')}
                    className="group relative flex flex-col items-start p-6 bg-[#0a0a0a] border border-amber-900/30 rounded-2xl text-left hover:border-amber-500/50 transition-all shadow-xl overflow-hidden hover:bg-[#111]"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                    <i className="fa-solid fa-star fa-5x rotate-45 text-amber-600"></i>
                    </div>
                    
                    <div className="w-10 h-10 bg-amber-900/20 rounded-lg flex items-center justify-center mb-4 border border-amber-500/20">
                    <i className="fa-solid fa-turn-up text-amber-500 group-hover:text-amber-400 transition-colors"></i>
                    </div>
                    
                    <h3 className="text-sm font-bold mb-2 group-hover:text-amber-200 transition-colors text-amber-500">升星室</h3>
                    <p className="text-[10px] text-gray-600 leading-relaxed mb-4 line-clamp-2">
                    消耗星尘强化您的天体。
                    </p>
                </button>

            </div>
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
