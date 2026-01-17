
import React, { useState, useEffect, useRef } from 'react';
import { SimulationState, Planet } from '../types';

interface AscensionRoomViewProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onBack: () => void;
}

interface StatUpgrade {
  id: string;
  label: string;
  icon: string;
  cost: number;
  effect: (p: Planet) => Partial<Planet>;
  color: string;
}

const UPGRADES: StatUpgrade[] = [
  { 
    id: 'mass_inject', 
    label: '物质注入', 
    icon: 'fa-weight-hanging', 
    cost: 100, 
    effect: (p) => ({ mass: p.mass * 1.2 }),
    color: '#3b82f6'
  },
  { 
    id: 'radius_expand', 
    label: '地壳膨胀', 
    icon: 'fa-arrows-to-circle', 
    cost: 150, 
    effect: (p) => ({ radius: p.radius * 1.1 }),
    color: '#22c55e'
  },
  { 
    id: 'core_stabilize', 
    label: '核心稳定', 
    icon: 'fa-atom', 
    cost: 200, 
    effect: (p) => ({ color: adjustColor(p.color, 20) }), // Make brighter
    color: '#f59e0b'
  },
  {
    id: 'velocity_boost',
    label: '引力弹弓',
    icon: 'fa-gauge-high',
    cost: 300,
    effect: (p) => ({ velocity: { x: p.velocity.x * 1.1, y: p.velocity.y * 1.1 } }),
    color: '#a855f7'
  }
];

// Helper to lighten color string slightly
const adjustColor = (hex: string, amount: number) => {
    return hex; // Simplified for now, just returns same color
};

const AscensionRoomView: React.FC<AscensionRoomViewProps> = ({ state, setState, onBack }) => {
  const [selectedPlanetId, setSelectedPlanetId] = useState<string | null>(null);
  const [stardust, setStardust] = useState(1000); // Currency
  const [feedback, setFeedback] = useState<{msg: string, color: string} | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedPlanet = state.planets.find(p => p.id === selectedPlanetId);

  // FX Loop for the "Altar"
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let time = 0;

    const render = () => {
        time++;
        const w = canvas.width = canvas.clientWidth;
        const h = canvas.height = canvas.clientHeight;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // Draw Altar Base
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 150, 200, 60, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Draw Magic Circle Rings
        for(let i=1; i<=3; i++) {
            const rot = (i % 2 === 0 ? 1 : -1) * time * 0.005 * i;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(rot);
            ctx.strokeStyle = `rgba(0, 242, 255, ${0.1 * i})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([20, 10]);
            ctx.beginPath();
            ctx.arc(0, 0, 120 + i * 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (selectedPlanet) {
            // Floating Animation
            const floatY = Math.sin(time * 0.05) * 10;
            
            // Glow
            const glow = ctx.createRadialGradient(cx, cy + floatY, selectedPlanet.radius, cx, cy + floatY, selectedPlanet.radius * 4);
            glow.addColorStop(0, selectedPlanet.color);
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.globalAlpha = 0.3;
            ctx.beginPath(); ctx.arc(cx, cy + floatY, selectedPlanet.radius * 4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;

            // Planet Body
            ctx.fillStyle = selectedPlanet.color;
            ctx.shadowColor = selectedPlanet.color;
            ctx.shadowBlur = 30;
            ctx.beginPath(); ctx.arc(cx, cy + floatY, selectedPlanet.radius * 2, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;

            // Rings (Visual only)
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(cx, cy + floatY, selectedPlanet.radius * 3.5, selectedPlanet.radius * 0.5, -0.2, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Empty State Placeholder
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            ctx.font = '12px monospace';
            ctx.fillText("WAITING FOR LINK...", cx, cy + 40);
        }

        frameId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(frameId);
  }, [selectedPlanet]);

  const handleUpgrade = (upgrade: StatUpgrade) => {
      if (!selectedPlanet) return;
      if (stardust < upgrade.cost) {
          setFeedback({ msg: '星尘不足 (INSUFFICIENT STARDUST)', color: 'text-red-500' });
          setTimeout(() => setFeedback(null), 2000);
          return;
      }

      // Consume cost
      setStardust(prev => prev - upgrade.cost);

      // Apply Upgrade
      const updates = upgrade.effect(selectedPlanet);
      setState(prev => ({
          ...prev,
          planets: prev.planets.map(p => p.id === selectedPlanet.id ? { ...p, ...updates } : p),
          isDirty: true
      }));

      // Feedback
      setFeedback({ msg: `${upgrade.label} SUCCESSFUL`, color: 'text-green-500' });
      setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <div className="w-full h-screen bg-[#050505] flex relative overflow-hidden font-sans text-white animate-fade-in">
        {/* Background Ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-20 border-b border-white/5 bg-black/50 backdrop-blur-md flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-900/20 border border-amber-600/30 rounded flex items-center justify-center text-amber-500">
                    <i className="fa-solid fa-star-of-david text-xl animate-pulse"></i>
                </div>
                <div>
                    <h1 className="text-xl font-black uppercase tracking-widest italic text-amber-500">Star Ascension Room</h1>
                    <p className="text-[10px] text-gray-500 font-mono">CELESTIAL_UPGRADE_PROTOCOL // v9.0</p>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Available Stardust</span>
                    <span className="text-2xl font-mono text-cyan-400 font-bold flex items-center gap-2">
                        <i className="fa-solid fa-sparkles text-sm"></i> {stardust}
                    </span>
                </div>
                <button onClick={onBack} className="w-12 h-12 rounded-full border border-white/10 hover:bg-white/5 flex items-center justify-center transition-all">
                    <i className="fa-solid fa-xmark text-gray-400"></i>
                </button>
            </div>
        </div>

        {/* Left Panel: Planet List */}
        <div className="w-80 h-full pt-24 pb-8 pl-8 flex flex-col z-10">
            <div className="flex-grow bg-[#0f0f0f] border border-white/5 rounded-2xl p-4 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
                <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">Detected Celestial Bodies</h3>
                {state.planets.length === 0 ? (
                    <div className="text-center py-10 opacity-30">
                        <i className="fa-solid fa-ban text-2xl mb-2"></i>
                        <p className="text-xs">No Planets Found</p>
                    </div>
                ) : (
                    state.planets.map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setSelectedPlanetId(p.id)}
                            className={`flex items-center gap-4 p-3 rounded-xl border transition-all text-left group ${selectedPlanetId === p.id ? 'bg-amber-900/10 border-amber-600/50' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                        >
                            <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: p.color }}></div>
                            <div className="flex-grow">
                                <div className={`text-sm font-bold ${selectedPlanetId === p.id ? 'text-amber-500' : 'text-gray-300 group-hover:text-white'}`}>{p.name}</div>
                                <div className="text-[9px] text-gray-600 uppercase">{p.type}</div>
                            </div>
                            {selectedPlanetId === p.id && <i className="fa-solid fa-chevron-right text-amber-500 text-xs"></i>}
                        </button>
                    ))
                )}
            </div>
        </div>

        {/* Center: Visualization */}
        <div className="flex-grow h-full relative">
            <canvas ref={canvasRef} className="w-full h-full" />
            
            {/* Feedback Toast */}
            {feedback && (
                <div className={`absolute top-32 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-white/10 px-8 py-4 rounded-full font-black uppercase tracking-widest ${feedback.color} animate-bounce`}>
                    {feedback.msg}
                </div>
            )}
        </div>

        {/* Right Panel: Controls */}
        <div className="w-96 h-full pt-24 pb-8 pr-8 flex flex-col z-10">
            <div className="flex-grow bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 flex flex-col relative overflow-hidden">
                {!selectedPlanet ? (
                     <div className="flex-grow flex flex-col items-center justify-center opacity-30">
                        <i className="fa-solid fa-arrow-left text-4xl mb-4 animate-pulse"></i>
                        <p className="text-xs font-black uppercase tracking-widest">Select a Planet to Begin Ascension</p>
                     </div>
                ) : (
                    <>
                        <div className="mb-6 border-b border-white/5 pb-4">
                            <h2 className="text-2xl font-black italic text-white uppercase">{selectedPlanet.name}</h2>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <span className="text-[9px] text-gray-500 block uppercase">Mass Class</span>
                                    <span className="text-lg font-mono text-cyan-500">{Math.round(selectedPlanet.mass)}</span>
                                </div>
                                <div>
                                    <span className="text-[9px] text-gray-500 block uppercase">Radius</span>
                                    <span className="text-lg font-mono text-green-500">{selectedPlanet.radius.toFixed(1)} km</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow flex flex-col gap-3">
                            <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Ascension Paths</h3>
                            {UPGRADES.map(u => (
                                <button 
                                    key={u.id}
                                    onClick={() => handleUpgrade(u)}
                                    className="group relative bg-[#151515] hover:bg-[#222] border border-white/5 hover:border-white/20 p-4 rounded-xl flex items-center justify-between transition-all active:scale-95"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-black/40 border border-white/5" style={{ color: u.color }}>
                                            <i className={`fa-solid ${u.icon}`}></i>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-sm font-bold text-gray-200 group-hover:text-white">{u.label}</div>
                                            <div className="text-[9px] text-gray-600">Cost: {u.cost} SD</div>
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-plus text-gray-700 group-hover:text-white transition-colors"></i>
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5 text-center">
                            <p className="text-[9px] text-gray-600 italic">
                                "Through sacrifice, matter transcends form."
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default AscensionRoomView;
