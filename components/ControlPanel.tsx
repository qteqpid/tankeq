
import React, { useState } from 'react';
import { SimulationState, Planet, PlanetType } from '../types';

interface ControlPanelProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onAddPlanet: (planet: Planet) => void;
  onSave: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ state, setState, onAddPlanet, onSave }) => {
  const [newPlanetName, setNewPlanetName] = useState('');
  const [newPlanetType, setNewPlanetType] = useState<PlanetType>(PlanetType.TERRESTRIAL);

  const applyPreset = (type: 'BINARY' | 'SOLAR' | 'BLACK_HOLE') => {
    let planets: Planet[] = [];
    if (type === 'BINARY') {
      planets = [
        { id: 's1', name: '双星-甲', mass: 3000, radius: 25, position: { x: -100, y: 0 }, velocity: { x: 0, y: 1.5 }, color: '#f87171', isFixed: false, trail: [], type: PlanetType.STAR },
        { id: 's2', name: '双星-乙', mass: 3000, radius: 25, position: { x: 100, y: 0 }, velocity: { x: 0, y: -1.5 }, color: '#60a5fa', isFixed: false, trail: [], type: PlanetType.STAR },
      ];
    } else if (type === 'SOLAR') {
      planets = [
        { id: 'sun', name: '恒星-赫利俄斯', mass: 10000, radius: 40, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, color: '#fbbf24', isFixed: false, trail: [], type: PlanetType.STAR },
        { id: 'p1', name: '内轨行星', mass: 50, radius: 8, position: { x: 200, y: 0 }, velocity: { x: 0, y: -5 }, color: '#34d399', isFixed: false, trail: [], type: PlanetType.TERRESTRIAL },
        { id: 'p2', name: '气态巨行星', mass: 300, radius: 18, position: { x: 450, y: 0 }, velocity: { x: 0, y: -3.3 }, color: '#f472b6', isFixed: false, trail: [], type: PlanetType.GAS_GIANT },
      ];
    } else if (type === 'BLACK_HOLE') {
       planets = [
        { id: 'bh', name: '奇点-零号', mass: 30000, radius: 15, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, color: '#ffffff', isFixed: false, trail: [], type: PlanetType.BLACK_HOLE },
        { id: 'p1', name: '被捕获星体', mass: 100, radius: 10, position: { x: 300, y: 0 }, velocity: { x: 0, y: -8 }, color: '#666', isFixed: false, trail: [], type: PlanetType.TERRESTRIAL },
      ];
    }
    setState(prev => ({ ...prev, planets, viewOffset: { x: 0, y: 0 }, zoom: 1, cameraTargetId: null, isDirty: true }));
  };

  const addNewPlanet = () => {
    const config = { [PlanetType.STAR]: { m: 2000, r: 25, c: '#fbbf24' }, [PlanetType.TERRESTRIAL]: { m: 50, r: 8, c: '#34d399' }, [PlanetType.GAS_GIANT]: { m: 300, r: 18, c: '#f87171' }, [PlanetType.BLACK_HOLE]: { m: 10000, r: 10, c: '#ffffff' }, [PlanetType.DWARF]: { m: 10, r: 5, c: '#94a3b8' } }[newPlanetType];
    onAddPlanet({ id: Math.random().toString(36).substr(2, 9), name: newPlanetName || `${newPlanetType}-${Math.floor(Math.random()*100)}`, type: newPlanetType, mass: config.m, radius: config.r, color: config.c, position: { x: (Math.random()-0.5)*400, y: (Math.random()-0.5)*400 }, velocity: { x: (Math.random()-0.5)*4, y: (Math.random()-0.5)*4 }, isFixed: false, trail: [] });
    setNewPlanetName('');
  };

  return (
    <div className="p-6 flex flex-col gap-6 select-none bg-[#0a0a0a]">
      <div className="flex flex-col gap-2">
        <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">项目保存</h3>
        <button 
          onClick={onSave}
          className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border border-cyan-500/20 p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <i className="fa-solid fa-cloud-arrow-up"></i>
          保存当前星系
        </button>
      </div>

      <div>
        <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-3">预设场景</h3>
        <div className="grid grid-cols-3 gap-2">
          {['BINARY', 'SOLAR', 'BLACK_HOLE'].map(type => (
            <button key={type} onClick={() => applyPreset(type as any)} className="text-[9px] bg-[#1a1a1a] hover:bg-[#222] p-2 rounded border border-white/5 text-gray-500 uppercase transition-all">
              {type === 'BINARY' ? '双星' : type === 'SOLAR' ? '原行星' : '黑洞'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-3">观测控制</h3>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setState(p=>({...p, isPaused: !p.isPaused}))} className={`flex-1 p-2 rounded text-[10px] font-bold border transition-all ${state.isPaused ? 'bg-white/10 text-white border-white/20':'bg-transparent text-gray-600 border-white/5'}`}>{state.isPaused ? '继续模拟':'暂停物理'}</button>
          <button onClick={() => setState(p=>({...p, viewOffset: {x:0,y:0}, zoom: 1, cameraTargetId: null}))} className="p-2 bg-[#1a1a1a] rounded border border-white/5 text-gray-600 hover:text-white" title="重置视角"><i className="fa-solid fa-compress"></i></button>
        </div>
      </div>
      <div className="border-t border-white/5 pt-4">
        <h3 className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-3">部署新天体</h3>
        <input type="text" placeholder="天体编号..." value={newPlanetName} onChange={(e)=>setNewPlanetName(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded p-2 text-xs mb-3 text-gray-400 focus:border-white/20 outline-none transition-all" />
        <div className="grid grid-cols-2 gap-2 mb-3">
          {Object.values(PlanetType).map(t => <button key={t} onClick={()=>setNewPlanetType(t)} className={`p-2 rounded text-[9px] font-bold transition-all ${newPlanetType === t ? 'bg-white/10 text-white border border-white/10 shadow-lg':'bg-transparent text-gray-600 hover:text-gray-400'}`}>{t}</button>)}
        </div>
        <button onClick={addNewPlanet} className="w-full bg-[#1a1a1a] hover:bg-[#222] text-gray-400 hover:text-white p-2 rounded text-[10px] font-bold uppercase tracking-widest border border-white/5 active:scale-95 transition-all">确认并投放</button>
      </div>
    </div>
  );
};

export default ControlPanel;
