
import React, { useState, useEffect, useRef, useCallback } from 'react';
import UniverseView from './components/UniverseView';
import ControlPanel from './components/ControlPanel';
import PlanetDetails from './components/PlanetDetails';
import PhysicsEngineView from './components/PhysicsEngineView';
import MainMenuView from './components/MainMenuView';
import ProjectsModal from './components/ProjectsModal';
import MetaverseView from './components/MetaverseView';
import TankBattleView from './components/TankBattleView';
import SokobanView from './components/SokobanView';
import AscensionRoomView from './components/AscensionRoomView';
import { Planet, SimulationState, Vector2, PlanetType, Particle, CosmicEvent, CollisionMode, Project, ViewMode, Wall } from './types';
import { analyzeSystem } from './services/geminiService';

const TRAIL_LENGTH = 100;
const LAB_BOUNDARY = 800; 

const App: React.FC = () => {
  const [state, setState] = useState<SimulationState>({
    planets: [],
    walls: [],
    timeScale: 1,
    showTrails: true,
    showLabels: true,
    isPaused: false,
    viewOffset: { x: 0, y: 0 },
    zoom: 1,
    cameraTargetId: null,
    gravityConstant: 0.5,
    collisionMode: CollisionMode.MERGE,
    nebulaIntensity: 0.5,
    viewMode: 'menu',
    friction: 0,
    verticalGravity: 0,
    isDirty: false,
    activeProjectId: null,
    stellarBuffer: { planets: [] },
    physicsBuffer: { planets: [], walls: [] }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('cosmos_projects_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [showProjects, setShowProjects] = useState(false);
  const [draggedPlanetId, setDraggedPlanetId] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [eventLog, setEventLog] = useState<CosmicEvent[]>([]);
  const [cosmicLore, setCosmicLore] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shake, setShake] = useState(0);
  
  const lastTimeRef = useRef<number>(0);
  // Fix: useRef<number>() requires 1 argument (initial value) to satisfy the strict 'number' type
  const requestRef = useRef<number>(0);

  useEffect(() => {
    localStorage.setItem('cosmos_projects_v2', JSON.stringify(projects));
  }, [projects]);

  const addEvent = (message: string, type: CosmicEvent['type']) => {
    const newEvent: CosmicEvent = { id: Math.random().toString(), timestamp: Date.now(), message, type };
    setEventLog(prev => [newEvent, ...prev].slice(0, 8));
  };

  const createParticles = (pos: Vector2, color: string, count: number = 20, type: 'glow' | 'spark' = 'glow') => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = type === 'spark' ? Math.random() * 8 + 4 : Math.random() * 3 + 1;
      newParticles.push({
        id: Math.random().toString(),
        x: pos.x, y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: type === 'spark' ? 0.4 : 1.5,
        color,
        type
      });
    }
    setParticles(prev => [...prev, ...newParticles].slice(-200));
  };

  const handleSaveProject = (customName?: string) => {
    let name = customName;
    if (!name && !state.activeProjectId) {
      name = window.prompt('请输入存档名称:');
      if (!name) return;
    }

    const currentProject = projects.find(p => p.id === state.activeProjectId);
    const projectId = state.activeProjectId || Math.random().toString(36).substr(2, 9);
    const projectName = name || currentProject?.name || `存档_${new Date().toLocaleTimeString()}`;

    const newProject: Project = {
      id: projectId,
      name: projectName,
      mode: state.viewMode,
      timestamp: Date.now(),
      planets: JSON.parse(JSON.stringify(state.planets)),
      walls: JSON.parse(JSON.stringify(state.walls)),
      config: {
        gravityConstant: state.gravityConstant,
        timeScale: state.timeScale,
        friction: state.friction,
        verticalGravity: state.verticalGravity
      }
    };

    setProjects(prev => [newProject, ...prev.filter(p => p.id !== projectId)]);
    setState(prev => ({ ...prev, isDirty: false, activeProjectId: projectId }));
    addEvent(`已存档: ${projectName}`, 'creation');
  };

  const handleLoadProject = (project: Project) => {
    if (state.isDirty && !window.confirm('当前有未保存的更改，载入新项目将丢失进度，确定吗？')) return;

    setState(prev => ({
      ...prev,
      viewMode: project.mode,
      planets: project.planets,
      walls: project.walls || [],
      gravityConstant: project.config.gravityConstant,
      timeScale: project.config.timeScale,
      friction: project.config.friction,
      verticalGravity: project.config.verticalGravity,
      activeProjectId: project.id,
      isDirty: false,
      isPaused: true,
      zoom: project.mode === 'physics' ? 0.8 : 1,
      viewOffset: { x: 0, y: 0 },
      collisionMode: project.mode === 'physics' ? CollisionMode.BOUNCE : CollisionMode.MERGE
    }));
    setShowProjects(false);
    addEvent(`载入项目: ${project.name}`, 'creation');
  };

  const changeMode = (newMode: ViewMode) => {
    if (state.viewMode === newMode) return;
    
    setState(prev => {
      const stellarBuffer = prev.viewMode === 'observation' ? { planets: prev.planets } : prev.stellarBuffer;
      const physicsBuffer = prev.viewMode === 'physics' ? { planets: prev.planets, walls: prev.walls } : prev.physicsBuffer;

      let planets: Planet[] = [];
      let walls: Wall[] = [];
      let zoom = prev.zoom;
      let collisionMode = prev.collisionMode;
      let activeProjectId = null;

      if (newMode === 'observation') {
        planets = stellarBuffer.planets.length > 0 ? stellarBuffer.planets : [
          { id: 'sun', name: '中心恒星', mass: 8000, radius: 40, position: { x: 0, y: 0 }, velocity: { x: 0, y: 0 }, color: '#fcd34d', isFixed: false, trail: [], type: PlanetType.STAR }
        ];
        collisionMode = CollisionMode.MERGE;
        zoom = 1;
      } else if (newMode === 'physics') {
        planets = physicsBuffer.planets;
        walls = physicsBuffer.walls;
        collisionMode = CollisionMode.BOUNCE;
        zoom = 0.8;
      } else if (newMode === 'metaverse') {
        planets = prev.planets; // Keep planets for metaverse
        walls = [];
        zoom = 1;
      } else if (newMode === 'tank-battle') {
        planets = [];
        walls = [];
      } else if (newMode === 'sokoban') {
        planets = [];
        walls = [];
      } else if (newMode === 'ascension') {
        // Use current planets for ascension or buffer if switching from menu
        planets = stellarBuffer.planets.length > 0 ? stellarBuffer.planets : prev.planets;
        walls = [];
      }

      return {
        ...prev,
        viewMode: newMode,
        planets,
        walls,
        zoom,
        collisionMode,
        activeProjectId,
        isDirty: false,
        viewOffset: { x: 0, y: 0 },
        cameraTargetId: null,
        stellarBuffer,
        physicsBuffer
      };
    });
    setEventLog([]);
    setCosmicLore('');
  };

  const updateSimulation = useCallback((dt: number) => {
    setParticles(prev => prev.map(p => ({ 
      ...p, 
      x: p.x + p.vx, 
      y: p.y + p.vy, 
      life: p.life - (p.type === 'spark' ? 0.05 : 0.02) 
    })).filter(p => p.life > 0));
    
    if (shake > 0) setShake(s => Math.max(0, s - 0.5));
    if (state.isPaused || state.viewMode === 'menu' || state.viewMode === 'metaverse' || state.viewMode === 'tank-battle' || state.viewMode === 'sokoban' || state.viewMode === 'ascension') return;

    setState(prev => {
      let planets = prev.planets.map(p => ({ ...p, trail: [...p.trail] }));
      const steps = Math.ceil(Math.abs(prev.timeScale) * 5); 
      const subDt = (dt / 1000) * prev.timeScale / (steps || 1);
      let significantChange = false;

      for (let s = 0; s < steps; s++) {
        for (let i = 0; i < planets.length; i++) {
          for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i]; const p2 = planets[j];
            const dx = p2.position.x - p1.position.x; const dy = p2.position.y - p1.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < p1.radius + p2.radius) {
              significantChange = true;
              if (prev.viewMode === 'observation') {
                const [winner, loser] = p1.mass >= p2.mass ? [p1, p2] : [p2, p1];
                createParticles(loser.position, loser.color, 30, 'glow');
                if (loser.mass > 500) setShake(Math.min(10, loser.mass / 100));
                
                const totalMass = winner.mass + loser.mass;
                winner.velocity.x = (winner.mass * winner.velocity.x + loser.mass * loser.velocity.x) / totalMass;
                winner.velocity.y = (winner.mass * winner.velocity.y + loser.mass * loser.velocity.y) / totalMass;
                winner.mass = totalMass;
                winner.radius = Math.pow(Math.pow(winner.radius, 3) + Math.pow(loser.radius, 3), 1/3);
                planets.splice(planets.indexOf(loser), 1);
                j--;
              } else {
                createParticles({x: (p1.position.x + p2.position.x)/2, y: (p1.position.y+p2.position.y)/2}, '#fff', 5, 'spark');
                const nx = dx / dist; const ny = dy / dist;
                const p = 2 * (p1.velocity.x * nx + p1.velocity.y * ny - p2.velocity.x * nx - p2.velocity.y * ny) / (p1.mass + p2.mass);
                p1.velocity.x -= p * p2.mass * nx; p1.velocity.y -= p * p2.mass * ny;
                p2.velocity.x += p * p1.mass * nx; p2.velocity.y += p * p1.mass * ny;
                const overlap = (p1.radius + p2.radius - dist) + 0.5;
                p1.position.x -= nx * overlap / 2; p1.position.y -= ny * overlap / 2;
                p2.position.x += nx * overlap / 2; p2.position.y += ny * overlap / 2;
              }
            }
          }
        }

        if (prev.viewMode === 'physics') {
          planets.forEach(p => {
            prev.walls.forEach(wall => {
              const dx = wall.end.x - wall.start.x; const dy = wall.end.y - wall.start.y;
              const l2 = dx * dx + dy * dy;
              if (l2 === 0) return;
              let t = ((p.position.x - wall.start.x) * dx + (p.position.y - wall.start.y) * dy) / l2;
              t = Math.max(0, Math.min(1, t));
              const closestX = wall.start.x + t * dx; const closestY = wall.start.y + t * dy;
              const distX = p.position.x - closestX; const distY = p.position.y - closestY;
              const distance = Math.sqrt(distX * distX + distY * distY);
              if (distance < p.radius) {
                significantChange = true;
                createParticles({x: closestX, y: closestY}, '#00ffcc', 4, 'spark');
                const nx = distX / distance; const ny = distY / distance;
                const dot = p.velocity.x * nx + p.velocity.y * ny;
                if (dot < 0) {
                  const bounce = 0.8;
                  p.velocity.x -= 2 * dot * nx * bounce; p.velocity.y -= 2 * dot * ny * bounce;
                }
                p.position.x += nx * (p.radius - distance); p.position.y += ny * (p.radius - distance);
              }
            });

            const limit = LAB_BOUNDARY / 2;
            if (p.position.x - p.radius < -limit) { p.position.x = -limit + p.radius; p.velocity.x *= -0.8; significantChange = true; }
            if (p.position.x + p.radius > limit) { p.position.x = limit - p.radius; p.velocity.x *= -0.8; significantChange = true; }
            if (p.position.y - p.radius < -limit) { p.position.y = -limit + p.radius; p.velocity.y *= -0.8; significantChange = true; }
            if (p.position.y + p.radius > limit) { p.position.y = limit - p.radius; p.velocity.y *= -0.8; significantChange = true; }
          });
        }

        const forces = planets.map(() => ({ x: 0, y: 0 }));
        for (let i = 0; i < planets.length; i++) {
          for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i]; const p2 = planets[j];
            const dx = p2.position.x - p1.position.x; const dy = p2.position.y - p1.position.y;
            const distSq = dx * dx + dy * dy; const dist = Math.sqrt(distSq);
            if (dist < p1.radius + p2.radius) continue;
            const forceMag = (prev.gravityConstant * p1.mass * p2.mass) / distSq;
            forces[i].x += (forceMag * dx) / dist; forces[i].y += (forceMag * dy) / dist;
            forces[j].x -= (forceMag * dx) / dist; forces[j].y -= (forceMag * dy) / dist;
          }
        }

        for (let i = 0; i < planets.length; i++) {
          const p = planets[i]; if (p.isFixed || p.id === draggedPlanetId) continue;
          p.velocity.x += (forces[i].x / p.mass) * subDt;
          p.velocity.y += (forces[i].y / p.mass) * subDt;
          if (prev.viewMode === 'physics') p.velocity.y += prev.verticalGravity * subDt * 10;
          p.position.x += p.velocity.x * subDt; p.position.y += p.velocity.y * subDt;
        }
      }

      if (prev.cameraTargetId) {
        const target = planets.find(p => p.id === prev.cameraTargetId);
        if (target) prev.viewOffset = { x: -target.position.x, y: -target.position.y };
      }

      if (prev.showTrails) {
        planets.forEach(p => {
          if (p.trail.length === 0 || Math.hypot(p.position.x - p.trail[p.trail.length - 1].x, p.position.y - p.trail[p.trail.length - 1].y) > 5) {
            p.trail.push({ x: p.position.x, y: p.position.y });
            if (p.trail.length > TRAIL_LENGTH) p.trail.shift();
          }
        });
      }

      return { ...prev, planets, isDirty: prev.isDirty || significantChange };
    });
  }, [state.isPaused, state.timeScale, draggedPlanetId, shake, state.viewMode]);

  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) updateSimulation(Math.min(time - lastTimeRef.current, 32));
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [updateSimulation]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [animate]);

  const handleUpdatePlanet = useCallback((id: string, updates: Partial<Planet>) => {
    setState(prev => ({ ...prev, planets: prev.planets.map(p => p.id === id ? { ...p, ...updates } : p), isDirty: true }));
  }, []);

  const [activePlanetId, setActivePlanetId] = useState<string | null>(null);
  const activePlanet = state.planets.find(p => p.id === activePlanetId);

  if (state.viewMode === 'menu') {
    return <MainMenuView onSelectMode={(mode) => changeMode(mode)} />;
  }

  if (state.viewMode === 'metaverse') {
    return <MetaverseView planets={state.planets} onBack={() => changeMode('menu')} />;
  }

  if (state.viewMode === 'tank-battle') {
    return <TankBattleView onBack={() => changeMode('menu')} onSokoban={() => changeMode('sokoban')} />;
  }

  if (state.viewMode === 'sokoban') {
      return <SokobanView onBack={() => changeMode('tank-battle')} />;
  }

  if (state.viewMode === 'ascension') {
      return (
        <AscensionRoomView 
          state={state} 
          setState={setState} 
          onBack={() => changeMode('menu')} 
        />
      );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505] flex flex-col md:flex-row text-white font-sans">
      {state.viewMode === 'physics' ? (
        <PhysicsEngineView 
          state={state} setState={setState} onClose={() => changeMode('menu')}
          onChangeMode={changeMode}
          onAddPlanet={(p) => setState(prev => ({ ...prev, planets: [...prev.planets, p], isDirty: true }))}
          onSave={handleSaveProject} onOpenProjects={() => setShowProjects(true)}
        />
      ) : (
        <>
          <div className="flex-grow h-full relative" style={{ transform: `translate(${(Math.random()-0.5)*shake}px, ${(Math.random()-0.5)*shake}px)` }}>
            <UniverseView 
              state={state} setState={setState} particles={particles}
              onSelectPlanet={setActivePlanetId} selectedPlanetId={activePlanetId}
              onPlanetUpdate={handleUpdatePlanet} setDraggingPlanetId={setDraggedPlanetId}
            />
            
            <div className="absolute top-6 left-6 flex flex-col gap-3 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto">
                 <button onClick={() => changeMode('menu')} className="bg-[#111] hover:bg-[#222] p-4 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all shadow-xl">
                   <i className="fa-solid fa-house text-sm"></i>
                 </button>
                 <div className="bg-[#111] p-4 rounded-xl border border-white/5 shadow-2xl flex items-center gap-3">
                   <h1 className="text-xl font-black tracking-tighter text-[#ccc] italic uppercase text-white/90">Stellar Engine</h1>
                   {state.isDirty && <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>}
                 </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 max-w-sm pointer-events-none flex flex-col gap-3">
              <button onClick={async () => { setIsAnalyzing(true); setCosmicLore(await analyzeSystem(state.planets)); setIsAnalyzing(false); }} disabled={isAnalyzing} className="pointer-events-auto w-full bg-[#111] hover:bg-[#1a1a1a] px-4 py-3 rounded-xl border border-white/5 flex items-center justify-center gap-2 transition-all shadow-xl">
                <i className={`fa-solid fa-atom ${isAnalyzing ? 'animate-spin' : ''} text-gray-500`}></i>
                <span className="font-bold text-xs tracking-wider text-gray-400 uppercase">{isAnalyzing ? '观测中...' : '星系演化报告'}</span>
              </button>
              {cosmicLore && <div className="pointer-events-auto bg-[#0a0a0a]/90 p-4 rounded-xl border border-white/5 shadow-2xl"><p className="text-xs text-gray-400 leading-relaxed italic">"{cosmicLore}"</p></div>}
            </div>
          </div>

          <div className="w-full md:w-80 h-1/3 md:h-full flex flex-col border-l border-white/5 bg-[#0a0a0a] shadow-2xl">
            <ControlPanel state={state} setState={setState} onAddPlanet={(p) => setState(prev => ({ ...prev, planets: [...prev.planets, p], isDirty: true }))} onSave={() => handleSaveProject()} />
            <div className="flex-grow overflow-y-auto border-t border-white/5 bg-black/40">
              {activePlanet ? (
                <PlanetDetails planet={activePlanet} onDelete={() => { setState(prev => ({ ...prev, planets: prev.planets.filter(p => p.id !== activePlanet.id), isDirty: true })); setActivePlanetId(null); }} onClose={() => setActivePlanetId(null)} onUpdate={handleUpdatePlanet} isFocused={state.cameraTargetId === activePlanet.id} toggleFocus={() => setState(prev => ({ ...prev, cameraTargetId: prev.cameraTargetId === activePlanet.id ? null : activePlanet.id }))} />
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-10"><i className="fa-solid fa-terminal fa-3x mb-4"></i><p className="text-xs font-bold uppercase tracking-widest">观测中...</p></div>
              )}
            </div>
          </div>
        </>
      )}

      {showProjects && <ProjectsModal projects={projects} onLoad={handleLoadProject} onDelete={(id) => setProjects(prev => prev.filter(p => p.id !== id))} onClose={() => setShowProjects(false)} />}
    </div>
  );
};

export default App;
