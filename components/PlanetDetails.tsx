
import React from 'react';
import { Planet } from '../types';

interface PlanetDetailsProps {
  planet: Planet;
  onDelete: () => void;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Planet>) => void;
  isFocused: boolean;
  toggleFocus: () => void;
}

const PlanetDetails: React.FC<PlanetDetailsProps> = ({ planet, onDelete, onClose, onUpdate, isFocused, toggleFocus }) => {
  return (
    <div className="p-6 h-full flex flex-col gap-6 animate-slide-in">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-black text-white">{planet.name}</h2>
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">{planet.type}</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-1"><i className="fa-solid fa-xmark text-lg"></i></button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Color Picker */}
        <div className="p-3 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-bold uppercase">外观色泽</span>
          <input type="color" value={planet.color} onChange={(e) => onUpdate(planet.id, { color: e.target.value })} className="bg-transparent border-none w-8 h-8 cursor-pointer rounded overflow-hidden" />
        </div>

        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
          <div className="flex justify-between text-[10px] text-white/40 font-bold mb-2">
             <span>质量 (千吨)</span>
             <span className="text-blue-300">{Math.round(planet.mass)}</span>
          </div>
          <input type="range" min="10" max="50000" step="10" value={planet.mass} onChange={(e) => onUpdate(planet.id, { mass: parseFloat(e.target.value) })} className="w-full accent-blue-500" />
        </div>

        <div className="p-3 bg-white/5 rounded-lg border border-white/5">
          <div className="flex justify-between text-[10px] text-white/40 font-bold mb-2">
             <span>半径 (兆米)</span>
             <span className="text-green-300">{planet.radius.toFixed(1)}</span>
          </div>
          <input type="range" min="2" max="150" step="1" value={planet.radius} onChange={(e) => onUpdate(planet.id, { radius: parseFloat(e.target.value) })} className="w-full accent-green-500" />
        </div>

        <div className="flex gap-2">
          <button onClick={toggleFocus} className={`flex-1 p-3 rounded-xl text-[10px] font-bold border transition-all ${isFocused ? 'bg-yellow-400/20 text-yellow-400 border-yellow-500/30 shadow-lg shadow-yellow-500/10':'bg-white/5 text-white/50 border-white/10 hover:border-white/20'}`}>
            <i className={`fa-solid ${isFocused ? 'fa-video':'fa-video-slash'} mr-2`}></i>
            {isFocused ? '镜头锁定中':'追踪天体'}
          </button>
          <button onClick={() => onUpdate(planet.id, { isFixed: !planet.isFixed })} className={`flex-1 p-3 rounded-xl text-[10px] font-bold border transition-all ${planet.isFixed ? 'bg-purple-400/20 text-purple-400 border-purple-500/30 shadow-lg shadow-purple-500/10':'bg-white/5 text-white/50 border-white/10 hover:border-white/20'}`}>
            <i className="fa-solid fa-anchor mr-2"></i>
            {planet.isFixed ? '锚定位置':'物理悬浮'}
          </button>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-2">
        <button onClick={onDelete} className="group w-full bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
           <i className="fa-solid fa-burst mr-2 group-hover:animate-pulse"></i>
           引发超新星爆发 (删除)
        </button>
      </div>
    </div>
  );
};

export default PlanetDetails;
