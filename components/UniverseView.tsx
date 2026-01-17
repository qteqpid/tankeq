
import React, { useRef, useEffect, useState } from 'react';
import { SimulationState, Vector2, Planet, PlanetType, Particle } from '../types';

interface UniverseViewProps {
  state: SimulationState;
  setState: React.Dispatch<React.SetStateAction<SimulationState>>;
  particles: Particle[];
  onSelectPlanet: (id: string | null) => void;
  selectedPlanetId: string | null;
  onPlanetUpdate: (id: string, updates: Partial<Planet>) => void;
  setDraggingPlanetId: (id: string | null) => void;
}

const UniverseView: React.FC<UniverseViewProps> = ({ 
  state, setState, particles, onSelectPlanet, selectedPlanetId, onPlanetUpdate, setDraggingPlanetId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState<Vector2>({ x: 0, y: 0 });
  const [draggedPlanet, setDraggedPlanet] = useState<string | null>(null);
  const lastMouseWorldPos = useRef<Vector2>({ x: 0, y: 0 });
  const mouseVelocity = useRef<Vector2>({ x: 0, y: 0 });

  const worldToCanvas = (pos: Vector2, center: { x: number, y: number }): Vector2 => ({
    x: center.x + (pos.x + state.viewOffset.x) * state.zoom,
    y: center.y + (pos.y + state.viewOffset.y) * state.zoom
  });

  const canvasToWorld = (pos: Vector2, center: { x: number, y: number }): Vector2 => ({
    x: (pos.x - center.x) / state.zoom - state.viewOffset.x,
    y: (pos.y - center.y) / state.zoom - state.viewOffset.y
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width; canvas.height = rect.height;
      }
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Nebula Effect
      if (state.nebulaIntensity > 0) {
        const nebulaGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(canvas.width, canvas.height));
        nebulaGrad.addColorStop(0, `rgba(15, 15, 35, ${state.nebulaIntensity * 0.5})`);
        nebulaGrad.addColorStop(1, '#050505');
        ctx.fillStyle = nebulaGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Stars
      ctx.fillStyle = 'white';
      for (let i = 0; i < 150; i++) {
        const x = (i * 153.2 + time * 0.01) % canvas.width;
        const y = (i * 137.5 + time * 0.005) % canvas.height;
        ctx.globalAlpha = 0.05 + (i % 5) * 0.05;
        ctx.beginPath(); ctx.arc(x, y, 0.8, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Particles
      particles.forEach(p => {
        const pos = worldToCanvas({ x: p.x, y: p.y }, { x: centerX, y: centerY });
        ctx.globalAlpha = p.life;
        ctx.strokeStyle = p.color;
        ctx.fillStyle = p.color;
        if (p.type === 'spark') {
          ctx.lineWidth = 2 * state.zoom;
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x - p.vx * 3 * state.zoom, pos.y - p.vy * 3 * state.zoom);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3 * state.zoom * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;

      // Trails
      if (state.showTrails) {
        state.planets.forEach(p => {
          if (p.trail.length < 2) return;
          ctx.beginPath();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1 * state.zoom;
          ctx.globalAlpha = 0.2;
          const start = worldToCanvas(p.trail[0], { x: centerX, y: centerY });
          ctx.moveTo(start.x, start.y);
          for (let i = 1; i < p.trail.length; i++) {
            const point = worldToCanvas(p.trail[i], { x: centerX, y: centerY });
            ctx.lineTo(point.x, point.y);
          }
          ctx.stroke();
        });
      }
      ctx.globalAlpha = 1.0;

      // Planets
      state.planets.forEach(p => {
        const pos = worldToCanvas(p.position, { x: centerX, y: centerY });
        const radius = Math.max(1, p.radius * state.zoom);
        const isSelected = p.id === selectedPlanetId;

        ctx.save();
        if (p.type === PlanetType.STAR) {
          const g = ctx.createRadialGradient(pos.x, pos.y, radius, pos.x, pos.y, radius * 3);
          g.addColorStop(0, p.color + '44');
          g.addColorStop(1, 'transparent');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(pos.x, pos.y, radius * 3, 0, Math.PI * 2); ctx.fill();
        }

        const bodyGrad = ctx.createRadialGradient(pos.x - radius/3, pos.y - radius/3, 0, pos.x, pos.y, radius);
        bodyGrad.addColorStop(0, p.color);
        bodyGrad.addColorStop(1, '#000');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        if (isSelected) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath(); ctx.arc(pos.x, pos.y, radius + 12, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render(0);
    return () => cancelAnimationFrame(animationFrameId);
  }, [state, selectedPlanetId, particles]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const worldPos = canvasToWorld({ x, y }, { x: canvasRef.current!.width/2, y: canvasRef.current!.height/2 });
    
    const hit = state.planets.find(p => Math.hypot(p.position.x - worldPos.x, p.position.y - worldPos.y) < p.radius + 15 / state.zoom);
    if (hit) {
      setDraggedPlanet(hit.id); setDraggingPlanetId(hit.id); onSelectPlanet(hit.id);
    } else {
      setIsDraggingCanvas(true); setDragStart({ x: e.clientX, y: e.clientY });
      if (!state.cameraTargetId) onSelectPlanet(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = canvasToWorld({ x: e.clientX - canvasRef.current!.getBoundingClientRect().left, y: e.clientY - canvasRef.current!.getBoundingClientRect().top }, { x: canvasRef.current!.width/2, y: canvasRef.current!.height/2 });
    if (draggedPlanet) {
      const dx = worldPos.x - lastMouseWorldPos.current.x; const dy = worldPos.y - lastMouseWorldPos.current.y;
      mouseVelocity.current = { x: dx * 10, y: dy * 10 };
      const p = state.planets.find(p => p.id === draggedPlanet);
      if (p) onPlanetUpdate(draggedPlanet, { position: { x: p.position.x + dx, y: p.position.y + dy }, velocity: { x: 0, y: 0 } });
    } else if (isDraggingCanvas && !state.cameraTargetId) {
      setState(prev => ({ ...prev, viewOffset: { x: prev.viewOffset.x + (e.clientX - dragStart.x)/state.zoom, y: prev.viewOffset.y + (e.clientY - dragStart.y)/state.zoom } }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
    lastMouseWorldPos.current = worldPos;
  };

  return (
    <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => { if (draggedPlanet) onPlanetUpdate(draggedPlanet, { velocity: mouseVelocity.current }); setDraggedPlanet(null); setDraggingPlanetId(null); setIsDraggingCanvas(false); }} onWheel={(e) => setState(prev => ({ ...prev, zoom: Math.max(0.01, Math.min(10, prev.zoom * (e.deltaY > 0 ? 0.9 : 1.1))) }))} className="w-full h-full cursor-crosshair" />
  );
};

export default UniverseView;
