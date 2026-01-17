
import React from 'react';
import { SimulationState, CollisionMode } from '../types';

interface PhysicsConsoleProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onClose: () => void;
}

const PhysicsConsole: React.FC<PhysicsConsoleProps> = ({ state, setState, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#121212] w-full max-w-2xl rounded-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/5 bg-[#181818]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-[#222] flex items-center justify-center border border-white/5">
              <i className="fa-solid fa-screwdriver-wrench text-gray-500"></i>
            </div>
            <div>
              <h2 className="text-sm font-black tracking-widest text-gray-200 uppercase">核心物理引擎参数设定</h2>
              <p className="text-[9px] text-gray-600 font-mono">DEBUG MODE: PHYS_CORE_v2.5</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-white/5 flex items-center justify-center text-gray-600 hover:text-white transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Gravity Constant */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">引力常数 (G)</h4>
              <span className="text-sm font-mono text-gray-300">{state.gravityConstant.toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0.01" max="2.0" step="0.01" 
              value={state.gravityConstant}
              onChange={(e) => setState(prev => ({ ...prev, gravityConstant: parseFloat(e.target.value) }))}
              className="w-full accent-gray-500 h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Collision Mode */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">碰撞逻辑模式</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(CollisionMode).map(mode => (
                <button
                  key={mode}
                  onClick={() => setState(prev => ({ ...prev, collisionMode: mode }))}
                  className={`p-2 rounded text-[10px] font-bold border transition-all ${state.collisionMode === mode ? 'bg-white/10 border-white/20 text-white' : 'bg-black/20 border-white/5 text-gray-600 hover:text-gray-400'}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Time Scale */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">物理步进速率</h4>
              <span className="text-sm font-mono text-gray-300">{state.timeScale.toFixed(1)}x</span>
            </div>
            <input 
              type="range" min="-5" max="5" step="0.1" 
              value={state.timeScale}
              onChange={(e) => setState(prev => ({ ...prev, timeScale: parseFloat(e.target.value) }))}
              className="w-full accent-gray-500 h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Nebula Intensity */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">星云渲染密度</h4>
              <span className="text-sm font-mono text-gray-300">{Math.round(state.nebulaIntensity * 100)}%</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.01" 
              value={state.nebulaIntensity}
              onChange={(e) => setState(prev => ({ ...prev, nebulaIntensity: parseFloat(e.target.value) }))}
              className="w-full accent-gray-500 h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Toggles */}
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
             <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <span className="text-[10px] text-gray-500 font-bold">轨道路径显示</span>
                <input 
                  type="checkbox" checked={state.showTrails} 
                  onChange={(e) => setState(prev => ({ ...prev, showTrails: e.target.checked }))}
                  className="w-4 h-4 accent-gray-500"
                />
             </div>
             <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                <span className="text-[10px] text-gray-500 font-bold">天体信息标注</span>
                <input 
                  type="checkbox" checked={state.showLabels} 
                  onChange={(e) => setState(prev => ({ ...prev, showLabels: e.target.checked }))}
                  className="w-4 h-4 accent-gray-500"
                />
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#0a0a0a] border-t border-white/5 flex justify-end gap-3">
          <button 
            onClick={() => {
              setState(prev => ({ ...prev, gravityConstant: 0.5, timeScale: 1, collisionMode: CollisionMode.MERGE, nebulaIntensity: 0.5 }));
            }}
            className="px-4 py-2 text-[10px] font-bold text-gray-600 hover:text-gray-300 transition-colors uppercase tracking-widest"
          >
            重置至初始状态
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            关闭控制台
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhysicsConsole;
