
import React, { useRef, useEffect, useState } from 'react';
import { SimulationState, CollisionMode, Vector2, PlanetType, Planet, Wall, ViewMode } from '../types';

interface PhysicsEngineViewProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  onClose: () => void;
  onChangeMode: (mode: ViewMode) => void;
  onAddPlanet: (planet: Planet) => void;
  onSave: (name: string) => void;
  onOpenProjects: () => void;
}

interface BallTemplate {
  id: string;
  name: string;
  color: string;
  mass: number;
  radius: number;
}

const LAB_BOUNDARY = 800;

const PhysicsEngineView: React.FC<PhysicsEngineViewProps> = ({ state, setState, onClose, onChangeMode, onAddPlanet, onSave, onOpenProjects }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'spawn' | 'wall' | 'eraser'>('spawn');
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [wallStart, setWallStart] = useState<Vector2 | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<Vector2 | null>(null);

  const [spawnConfig, setSpawnConfig] = useState({
    name: '实验球-A',
    color: '#00ffcc', 
    mass: 100,
    radius: 12
  });

  const [savedTemplates, setSavedTemplates] = useState<BallTemplate[]>([
    { id: 't1', name: '重核球', color: '#ff4444', mass: 1000, radius: 20 },
    { id: 't2', name: '轻盈球', color: '#44ff44', mass: 10, radius: 8 }
  ]);

  const worldToCanvas = (pos: Vector2, center: { x: number, y: number }): Vector2 => ({
    x: center.x + (pos.x + state.viewOffset.x) * state.zoom,
    y: center.y + (pos.y + state.viewOffset.y) * state.zoom
  });

  const canvasToWorld = (pos: Vector2, center: { x: number, y: number }): Vector2 => ({
    x: (pos.x - center.x) / state.zoom - state.viewOffset.x,
    y: (pos.y - center.y) / state.zoom - state.viewOffset.y
  });

  const handleErase = (worldPos: Vector2) => {
    const eraseRadius = 25 / state.zoom;
    setState(prev => {
      const newPlanets = prev.planets.filter(p => 
        Math.hypot(p.position.x - worldPos.x, p.position.y - worldPos.y) > p.radius + eraseRadius
      );
      
      const newWalls = prev.walls.filter(w => {
        const dx = w.end.x - w.start.x;
        const dy = w.end.y - w.start.y;
        const l2 = dx * dx + dy * dy;
        if (l2 === 0) return Math.hypot(w.start.x - worldPos.x, w.start.y - worldPos.y) > eraseRadius;
        let t = ((worldPos.x - w.start.x) * dx + (worldPos.y - w.start.y) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const closestX = w.start.x + t * dx;
        const closestY = w.start.y + t * dy;
        return Math.hypot(closestX - worldPos.x, closestY - worldPos.y) > eraseRadius;
      });

      if (newPlanets.length !== prev.planets.length || newWalls.length !== prev.walls.length) {
        return { ...prev, planets: newPlanets, walls: newWalls, isDirty: true };
      }
      return prev;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width; canvas.height = rect.height;
      }
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const time = Date.now();

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 网格
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      const step = 50 * state.zoom;
      const offsetX = (state.viewOffset.x * state.zoom) % step;
      const offsetY = (state.viewOffset.y * state.zoom) % step;

      ctx.beginPath();
      for (let x = offsetX; x < canvas.width; x += step) {
        ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
      }
      for (let y = offsetY; y < canvas.height; y += step) {
        ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      const limit = LAB_BOUNDARY / 2;
      const wallTL = worldToCanvas({ x: -limit, y: -limit }, { x: centerX, y: centerY });
      const wallBR = worldToCanvas({ x: limit, y: limit }, { x: centerX, y: centerY });
      
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.strokeRect(wallTL.x, wallTL.y, wallBR.x - wallTL.x, wallBR.y - wallTL.y);

      // 绘制物理屏障
      state.walls.forEach(w => {
        const s = worldToCanvas(w.start, { x: centerX, y: centerY });
        const e = worldToCanvas(w.end, { x: centerX, y: centerY });
        
        ctx.shadowBlur = 12 * state.zoom;
        ctx.shadowColor = 'rgba(0, 242, 255, 0.6)';
        ctx.strokeStyle = '#00f2ff';
        ctx.lineWidth = 2 * state.zoom;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8 * state.zoom;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();

        ctx.fillStyle = '#00f2ff';
        const tipSize = 3 * state.zoom;
        [s, e].forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-tipSize/2, -tipSize/2, tipSize, tipSize);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(-tipSize/2, -tipSize/2, tipSize, tipSize);
            ctx.restore();
        });
      });

      // 绘制预览线
      if (isDrawingWall && wallStart && currentMousePos) {
        const s = worldToCanvas(wallStart, { x: centerX, y: centerY });
        const pulse = 0.5 + Math.sin(time / 200) * 0.3;
        
        ctx.save();
        ctx.strokeStyle = `rgba(0, 242, 255, ${pulse})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(currentMousePos.x, currentMousePos.y); ctx.stroke();
        ctx.fillStyle = '#00f2ff';
        ctx.beginPath(); ctx.arc(currentMousePos.x, currentMousePos.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // 橡皮擦预览
      if (tool === 'eraser' && currentMousePos) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.arc(currentMousePos.x, currentMousePos.y, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 绘制球体
      state.planets.forEach(p => {
        const screenX = centerX + (p.position.x + state.viewOffset.x) * state.zoom;
        const screenY = centerY + (p.position.y + state.viewOffset.y) * state.zoom;
        const radius = Math.max(1, p.radius * state.zoom);

        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1.0;
        ctx.beginPath(); ctx.arc(screenX, screenY, radius, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5 * state.zoom;
        ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(screenX, screenY, radius, 0, Math.PI * 2); ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.arc(screenX - radius * 0.3, screenY - radius * 0.3, radius * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [state, isDrawingWall, wallStart, currentMousePos, tool]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const worldPos = canvasToWorld({ x, y }, { x: canvas.width / 2, y: canvas.height / 2 });

    if (tool === 'spawn') {
      const limit = LAB_BOUNDARY / 2;
      if (Math.abs(worldPos.x) > limit || Math.abs(worldPos.y) > limit) return;
      onAddPlanet({
        id: Math.random().toString(36).substr(2, 9),
        name: spawnConfig.name || `球-${Math.floor(Math.random() * 999)}`,
        mass: spawnConfig.mass,
        radius: spawnConfig.radius,
        position: worldPos,
        velocity: { x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 4 },
        color: spawnConfig.color,
        isFixed: false,
        trail: [],
        type: PlanetType.TERRESTRIAL
      });
    } else if (tool === 'wall') {
      setIsDrawingWall(true);
      setWallStart(worldPos);
    } else if (tool === 'eraser') {
      setIsErasing(true);
      handleErase(worldPos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentMousePos({ x, y });
    
    if (tool === 'eraser' && isErasing) {
      const worldPos = canvasToWorld({ x, y }, { x: canvasRef.current.width / 2, y: canvasRef.current.height / 2 });
      handleErase(worldPos);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (tool === 'wall' && isDrawingWall && wallStart) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const worldPos = canvasToWorld({ x, y }, { x: canvasRef.current!.width / 2, y: canvasRef.current!.height / 2 });
      setState(prev => ({ ...prev, walls: [...prev.walls, { id: Math.random().toString(36).substr(2, 9), start: wallStart, end: worldPos }], isDirty: true }));
    }
    setIsDrawingWall(false); 
    setIsErasing(false);
    setWallStart(null);
  };

  const saveTemplate = () => {
    setSavedTemplates(prev => [{ id: Math.random().toString(36).substr(2, 9), name: spawnConfig.name, color: spawnConfig.color, mass: spawnConfig.mass, radius: spawnConfig.radius }, ...prev]);
  };

  return (
    <div className="w-full h-screen bg-[#0a0a0a] relative overflow-hidden font-mono text-[#888] animate-fade-in">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`absolute inset-0 w-full h-full ${tool === 'wall' ? 'cursor-pencil' : tool === 'eraser' ? 'cursor-none' : 'cursor-crosshair'}`} 
      />

      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-8 pointer-events-none">
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-widest text-[#eee]">PHYS_ENGINE_LAB</span>
          <span className="text-[9px] text-[#444] uppercase tracking-tighter italic">
            {tool === 'spawn' ? `准备投放: ${spawnConfig.name}` : tool === 'wall' ? '划线模式：建立物理碰撞屏障' : '清理模式：移除实验对象'}
          </span>
        </div>
        <div className="flex gap-3 pointer-events-auto">
          <div className="flex bg-[#111] border border-white/5 rounded overflow-hidden mr-4">
            <button 
              onClick={() => {
                const name = window.prompt('请输入物理实验室项目名称:');
                if (name) onSave(name);
              }}
              className="px-4 py-2 border-r border-white/5 text-[10px] font-bold text-cyan-500/80 hover:bg-cyan-500/10 transition-all"
            >
              保存实验
            </button>
            <button 
              onClick={onOpenProjects}
              className="px-4 py-2 text-[10px] font-bold text-gray-400 hover:bg-white/5 transition-all"
            >
              我的实验室
            </button>
          </div>
          <button 
            onClick={() => onChangeMode('observation')}
            className="px-4 py-2 bg-[#111] border border-white/5 rounded text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-all"
          >
            切回观测模式
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-red-900/10 border border-red-500/20 rounded text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-900/20 transition-all"
          >
            回主菜单
          </button>
        </div>
      </div>

      <div className="absolute top-24 left-8 w-72 flex flex-col gap-4 pointer-events-auto overflow-y-auto max-h-[80vh] scrollbar-hide">
        <div className="bg-[#111]/90 backdrop-blur-md border border-white/5 rounded-lg p-2 grid grid-cols-3 gap-2 shadow-2xl">
          <button 
            onClick={() => setTool('spawn')}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded border transition-all ${tool === 'spawn' ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500' : 'bg-white/5 border-white/5 text-gray-600'}`}
          >
            <i className="fa-solid fa-circle text-xs"></i>
            <span className="text-[8px] font-bold uppercase">球体</span>
          </button>
          <button 
            onClick={() => setTool('wall')}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded border transition-all ${tool === 'wall' ? 'bg-white/10 border-white/40 text-white' : 'bg-white/5 border-white/5 text-gray-600'}`}
          >
            <i className="fa-solid fa-pen-nib text-xs"></i>
            <span className="text-[8px] font-bold uppercase">力场</span>
          </button>
          <button 
            onClick={() => setTool('eraser')}
            className={`flex flex-col items-center justify-center gap-1 p-2 rounded border transition-all ${tool === 'eraser' ? 'bg-red-500/20 border-red-500/50 text-red-500' : 'bg-white/5 border-white/5 text-gray-600'}`}
          >
            <i className="fa-solid fa-eraser text-xs"></i>
            <span className="text-[8px] font-bold uppercase">清除</span>
          </button>
        </div>

        <div className="bg-[#111]/90 backdrop-blur-md border border-white/5 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-3 bg-[#181818] border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">召唤配置</h3>
            <i className="fa-solid fa-gear text-[10px] text-gray-600"></i>
          </div>
          <div className="p-4 flex flex-col gap-4">
            <input type="text" value={spawnConfig.name} onChange={(e) => setSpawnConfig(prev => ({...prev, name: e.target.value}))} className="w-full bg-black/40 border border-white/5 rounded p-2 text-[10px] text-gray-300 outline-none" placeholder="球体名称..." />
            <div className="flex items-center gap-4 bg-black/40 p-3 rounded border border-white/5">
              <div className="w-12 h-12 rounded-full border border-white/20" style={{ backgroundColor: spawnConfig.color, width: spawnConfig.radius * 2, height: spawnConfig.radius * 2, maxWidth: '48px', maxHeight: '48px' }}></div>
              <div className="flex-grow grid grid-cols-2 gap-2">
                <input type="color" value={spawnConfig.color} onChange={(e) => setSpawnConfig(prev => ({...prev, color: e.target.value}))} className="w-full h-5 bg-transparent border-none cursor-pointer" />
                <input type="range" min="2" max="50" step="1" value={spawnConfig.radius} onChange={(e) => setSpawnConfig(prev => ({...prev, radius: parseInt(e.target.value)}))} className="w-full h-1 bg-[#222] appearance-none accent-gray-500 mt-2" />
              </div>
            </div>
            <button onClick={saveTemplate} className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-[9px] font-black text-cyan-400 uppercase tracking-widest">存入预设库</button>
          </div>
        </div>

        <div className="bg-[#111]/90 backdrop-blur-md border border-white/5 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-3 bg-[#181818] border-b border-white/5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">预设库</div>
          <div className="p-2 flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-hide">
            {savedTemplates.map(t => (
              <button key={t.id} onClick={() => { setSpawnConfig({ name: t.name, color: t.color, mass: t.mass, radius: t.radius }); setTool('spawn'); }} className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-all text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }}></div>
                  <span className="text-[10px] text-gray-400 group-hover:text-gray-200">{t.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#111]/90 backdrop-blur-md border border-white/5 rounded-lg shadow-2xl p-4 flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex justify-between text-[10px] font-bold text-gray-500"><span>垂直重力</span><span className="text-gray-300">{state.verticalGravity.toFixed(2)}</span></div>
            <input type="range" min="0" max="10.0" step="0.1" value={state.verticalGravity} onChange={(e) => setState(prev => ({ ...prev, verticalGravity: parseFloat(e.target.value), isDirty: true }))} className="w-full h-1 bg-[#222] appearance-none cursor-pointer accent-blue-500" />
          </div>
          <button onClick={() => setState(prev => ({ ...prev, planets: [], walls: [], verticalGravity: 1.0, isDirty: true }))} className="w-full py-2 bg-red-900/10 hover:bg-red-900/20 border border-red-500/10 text-[9px] font-bold text-red-500 uppercase">清空实验室</button>
        </div>
      </div>
      
      {state.isDirty && (
        <div className="absolute top-20 left-8 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">实验进度未保存</span>
        </div>
      )}

      <div className="absolute bottom-6 right-8 text-[9px] text-[#222] font-mono pointer-events-none text-right leading-loose">
        PHYS_CORE // v2.9_STABLE<br/>OBJ_LIMIT // UNRESTRICTED<br/>SAVED_TEMPLATES // {savedTemplates.length}
      </div>
    </div>
  );
};

export default PhysicsEngineView;
