
import React, { useRef, useEffect, useState } from 'react';

interface SokobanViewProps {
  onBack: () => void;
}

const TILE_SIZE = 50;
const MAP_WIDTH = 19;
const MAP_HEIGHT = 13;
const GAME_DURATION = 60; // Seconds

type CellType = ' ' | '#' | '$' | '1' | '2'; // 1: Player Base, 2: Enemy Base
interface Entity { x: number; y: number; id: string; }

const SokobanView: React.FC<SokobanViewProps> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const [grid, setGrid] = useState<CellType[][]>([]);
  const [player, setPlayer] = useState<Entity>({ x: 1, y: 6, id: 'player' });
  const [enemy, setEnemy] = useState<Entity>({ x: 17, y: 6, id: 'enemy' });
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [scores, setScores] = useState({ player: 0, enemy: 0 });
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [particles, setParticles] = useState<{x:number, y:number, vx:number, vy:number, life:number, color:string}[]>([]);

  // Refs for loop access
  const gridRef = useRef<CellType[][]>([]);
  const playerRef = useRef<Entity>({ x: 1, y: 6, id: 'player' });
  const enemyRef = useRef<Entity>({ x: 17, y: 6, id: 'enemy' });
  const gameStateRef = useRef<'playing' | 'finished'>('playing');

  // --- Initialization ---
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    // Generate Map
    const newGrid: CellType[][] = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(' '));
    
    // Walls
    for(let y=0; y<MAP_HEIGHT; y++) {
        for(let x=0; x<MAP_WIDTH; x++) {
            if (y === 0 || y === MAP_HEIGHT-1 || x === 0 || x === MAP_WIDTH-1) newGrid[y][x] = '#';
            // Random obstacles
            else if (x > 3 && x < MAP_WIDTH-4 && Math.random() > 0.85) newGrid[y][x] = '#';
        }
    }

    // Bases
    for(let y=1; y<MAP_HEIGHT-1; y++) {
        newGrid[y][1] = '1'; // Player Base (Left)
        newGrid[y][MAP_WIDTH-2] = '2'; // Enemy Base (Right)
    }

    // Boxes (Spawn 8 initially)
    let boxesPlaced = 0;
    while(boxesPlaced < 8) {
        const bx = Math.floor(Math.random() * (MAP_WIDTH - 6)) + 3;
        const by = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
        if (newGrid[by][bx] === ' ') {
            newGrid[by][bx] = '$';
            boxesPlaced++;
        }
    }

    gridRef.current = newGrid;
    setGrid([...newGrid]);
    
    playerRef.current = { x: 2, y: Math.floor(MAP_HEIGHT/2), id: 'player' };
    setPlayer(playerRef.current);
    
    enemyRef.current = { x: MAP_WIDTH-3, y: Math.floor(MAP_HEIGHT/2), id: 'enemy' };
    setEnemy(enemyRef.current);

    setScores({ player: 0, enemy: 0 });
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
    gameStateRef.current = 'playing';
    setParticles([]);
  };

  const spawnParticleEffect = (x: number, y: number, color: string, count: number = 10) => {
      const parts = [];
      for(let i=0; i<count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 4 + 2;
          parts.push({
              x: x * TILE_SIZE + TILE_SIZE/2, 
              y: y * TILE_SIZE + TILE_SIZE/2,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 1.0,
              color
          });
      }
      setParticles(prev => [...prev, ...parts]);
  };

  // --- Logic ---
  const spawnBox = () => {
      let spawned = false;
      let attempts = 0;
      while(!spawned && attempts < 50) {
          const bx = Math.floor(Math.random() * (MAP_WIDTH - 6)) + 3;
          const by = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
          // Don't spawn on walls, players, or existing boxes
          if (gridRef.current[by][bx] === ' ' && 
              !(playerRef.current.x === bx && playerRef.current.y === by) &&
              !(enemyRef.current.x === bx && enemyRef.current.y === by)) {
              gridRef.current[by][bx] = '$';
              spawnParticleEffect(bx, by, '#fbbf24', 5); // Spawn effect
              spawned = true;
          }
          attempts++;
      }
      setGrid([...gridRef.current]);
  };

  const attemptMove = (entity: 'player' | 'enemy', dx: number, dy: number) => {
      if (gameStateRef.current !== 'playing') return;

      const actor = entity === 'player' ? playerRef.current : enemyRef.current;
      const other = entity === 'player' ? enemyRef.current : playerRef.current;
      
      const newX = actor.x + dx;
      const newY = actor.y + dy;
      
      // Boundary & Wall check
      if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return;
      const cell = gridRef.current[newY][newX];
      if (cell === '#') return;

      // Entity Collision check
      if (newX === other.x && newY === other.y) return;

      // Box Interaction
      if (cell === '$') {
          const boxNextX = newX + dx;
          const boxNextY = newY + dy;
          const boxNextCell = gridRef.current[boxNextY]?.[boxNextX];

          // Can we push the box?
          // Cannot push into: Wall, Another Box, Other Player
          if (!boxNextCell || boxNextCell === '#' || boxNextCell === '$' || 
             (boxNextX === other.x && boxNextY === other.y)) {
              return;
          }

          // Push Successful
          gridRef.current[newY][newX] = ' '; // Clear old box position
          
          // Check if scored
          if (boxNextCell === '1') {
              // Player Scored (Green Base)
              setScores(s => ({ ...s, player: s.player + 1 }));
              spawnParticleEffect(boxNextX, boxNextY, '#22c55e', 20);
              spawnBox();
          } else if (boxNextCell === '2') {
              // Enemy Scored (Red Base)
              setScores(s => ({ ...s, enemy: s.enemy + 1 }));
              spawnParticleEffect(boxNextX, boxNextY, '#ef4444', 20);
              spawnBox();
          } else {
              // Just moved
              gridRef.current[boxNextY][boxNextX] = '$';
          }
          setGrid([...gridRef.current]);
      }

      // Move Actor
      if (entity === 'player') {
          playerRef.current = { ...actor, x: newX, y: newY };
          setPlayer(playerRef.current);
      } else {
          enemyRef.current = { ...actor, x: newX, y: newY };
          setEnemy(enemyRef.current);
      }
  };

  // --- DUMB AI Logic ---
  useEffect(() => {
    const aiInterval = setInterval(() => {
        if (gameStateRef.current !== 'playing') return;
        const grid = gridRef.current;
        const ai = enemyRef.current;

        // 30% Chance to do a completely random move (Dumb)
        if (Math.random() < 0.3) {
            const moves = [[0,1], [0,-1], [1,0], [-1,0]];
            const m = moves[Math.floor(Math.random()*moves.length)];
            attemptMove('enemy', m[0], m[1]);
            return;
        }

        // 1. Identify Boxes
        const boxes: {x: number, y: number}[] = [];
        for(let y=0; y<MAP_HEIGHT; y++) {
            for(let x=0; x<MAP_WIDTH; x++) {
                if (grid[y][x] === '$') boxes.push({x, y});
            }
        }

        if (boxes.length === 0) return;

        // Dumb Logic: Pick a random box and try to walk to its LEFT side (to push Right)
        // No pathfinding, just simple coordinate reduction
        const targetBox = boxes[Math.floor(Math.random() * boxes.length)];
        const targetX = targetBox.x - 1;
        const targetY = targetBox.y;

        let dx = 0;
        let dy = 0;

        if (ai.x === targetX && ai.y === targetY) {
            // We are at the pushing spot! Push Right!
            dx = 1; 
        } else {
            // Just try to move closer on one axis
            if (ai.x < targetX) dx = 1;
            else if (ai.x > targetX) dx = -1;
            
            // If x is aligned or blocked, try Y
            if (dx === 0 || grid[ai.y][ai.x + dx] === '#' || grid[ai.y][ai.x + dx] === '$') {
                dx = 0;
                if (ai.y < targetY) dy = 1;
                else if (ai.y > targetY) dy = -1;
            }
        }

        // If the calculated dumb move is valid, do it. If blocked, do a random move.
        const nextCell = grid[ai.y + dy]?.[ai.x + dx];
        if (nextCell !== '#' && nextCell !== '$') {
             attemptMove('enemy', dx, dy);
        } else if (dx === 1 && nextCell === '$') {
             // Try to push
             attemptMove('enemy', dx, dy);
        } else {
             // Blocked / Confused -> Panic move
             const moves = [[0,1], [0,-1], [1,0], [-1,0]];
             const m = moves[Math.floor(Math.random()*moves.length)];
             attemptMove('enemy', m[0], m[1]);
        }

    }, 600); // Very slow reaction time (0.6s)

    return () => clearInterval(aiInterval);
  }, []);

  // --- Game Loop & Timer ---
  useEffect(() => {
      const timer = setInterval(() => {
          if (gameStateRef.current === 'playing') {
              setTimeLeft(t => {
                  if (t <= 1) {
                      setGameState('finished');
                      gameStateRef.current = 'finished';
                      return 0;
                  }
                  return t - 1;
              });
          }
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  // --- Input ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'ArrowUp' || e.key === 'w') attemptMove('player', 0, -1);
          if (e.key === 'ArrowDown' || e.key === 's') attemptMove('player', 0, 1);
          if (e.key === 'ArrowLeft' || e.key === 'a') attemptMove('player', -1, 0);
          if (e.key === 'ArrowRight' || e.key === 'd') attemptMove('player', 1, 0);
          if (e.key === 'r') initGame();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Render Loop ---
  useEffect(() => {
      const ctx = canvasRef.current?.getContext('2d');
      let animationId: number;

      const render = () => {
          if (!ctx || !canvasRef.current) return;
          const w = canvasRef.current.width = canvasRef.current.clientWidth;
          const h = canvasRef.current.height = canvasRef.current.clientHeight;

          // Background
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, 0, w, h);
          
          // Center Grid
          const boardW = MAP_WIDTH * TILE_SIZE;
          const boardH = MAP_HEIGHT * TILE_SIZE;
          const offX = (w - boardW) / 2;
          const offY = (h - boardH) / 2;

          // Zones Background
          ctx.fillStyle = 'rgba(34, 197, 94, 0.1)'; // Player Zone
          ctx.fillRect(offX + TILE_SIZE, offY + TILE_SIZE, TILE_SIZE, boardH - 2*TILE_SIZE);
          
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)'; // Enemy Zone
          ctx.fillRect(offX + (MAP_WIDTH-2)*TILE_SIZE, offY + TILE_SIZE, TILE_SIZE, boardH - 2*TILE_SIZE);

          // Draw Grid
          grid.forEach((row, y) => {
              row.forEach((cell, x) => {
                  const drawX = offX + x * TILE_SIZE;
                  const drawY = offY + y * TILE_SIZE;

                  // Floor Lines
                  ctx.strokeStyle = '#222';
                  ctx.lineWidth = 1;
                  ctx.strokeRect(drawX, drawY, TILE_SIZE, TILE_SIZE);

                  if (cell === '#') {
                      ctx.fillStyle = '#334155';
                      ctx.fillRect(drawX + 2, drawY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                      ctx.fillStyle = '#1e293b';
                      ctx.fillRect(drawX + 8, drawY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                  } else if (cell === '$') {
                      // Box
                      ctx.fillStyle = '#d97706';
                      ctx.fillRect(drawX + 6, drawY + 6, TILE_SIZE - 12, TILE_SIZE - 12);
                      ctx.fillStyle = '#fbbf24'; // Highlight
                      ctx.fillRect(drawX + 10, drawY + 10, TILE_SIZE - 20, TILE_SIZE - 20);
                      // Tech markings
                      ctx.fillStyle = '#78350f';
                      ctx.fillRect(drawX + 15, drawY + 22, 20, 6);
                  } else if (cell === '1') {
                      // Player Goal Marker
                      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
                      ctx.strokeRect(drawX + 10, drawY + 10, TILE_SIZE - 20, TILE_SIZE - 20); ctx.setLineDash([]);
                  } else if (cell === '2') {
                      // Enemy Goal Marker
                      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
                      ctx.strokeRect(drawX + 10, drawY + 10, TILE_SIZE - 20, TILE_SIZE - 20); ctx.setLineDash([]);
                  }
              });
          });

          // Draw Entities
          const drawTank = (entity: Entity, color: string, isEnemy: boolean) => {
              const cx = offX + entity.x * TILE_SIZE + TILE_SIZE/2;
              const cy = offY + entity.y * TILE_SIZE + TILE_SIZE/2;
              
              ctx.shadowBlur = 15; ctx.shadowColor = color;
              ctx.fillStyle = color;
              ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI*2); ctx.fill();
              
              ctx.fillStyle = '#000';
              // Tracks
              ctx.fillRect(cx - 20, cy - 16, 8, 32);
              ctx.fillRect(cx + 12, cy - 16, 8, 32);
              
              // Turret direction (simple logic based on position for visual)
              ctx.fillStyle = isEnemy ? '#7f1d1d' : '#14532d';
              ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI*2); ctx.fill();
              
              // ID
              ctx.fillStyle = '#fff';
              ctx.font = '10px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(isEnemy ? 'AI' : 'P1', cx, cy + 3);
              ctx.shadowBlur = 0;
          };

          drawTank(player, '#22c55e', false);
          drawTank(enemy, '#ef4444', true);

          // Particles
          setParticles(prev => prev.map(p => {
              p.x += p.vx; p.y += p.vy; p.life -= 0.03;
              return p;
          }).filter(p => p.life > 0));

          particles.forEach(p => {
             ctx.globalAlpha = p.life;
             ctx.fillStyle = p.color;
             ctx.beginPath(); ctx.arc(p.x + offX, p.y + offY, 3, 0, Math.PI*2); ctx.fill();
          });
          ctx.globalAlpha = 1;

          animationId = requestAnimationFrame(render);
      };
      render();
      return () => cancelAnimationFrame(animationId);
  }, [grid, player, enemy, particles]);

  return (
    <div className="w-full h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative font-mono select-none">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        
        {/* Header HUD */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                   <i className="fa-solid fa-boxes-stacked text-amber-500"></i> LOGISTICS_WAR
                </h1>
                <div className="bg-white/5 px-4 py-2 rounded border border-white/10 flex items-center gap-4">
                     <span className="text-[10px] text-gray-400 uppercase tracking-widest">TIME REMAINING</span>
                     <span className={`text-2xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</span>
                </div>
            </div>

            <div className="flex gap-10 bg-black/50 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                 <div className="flex flex-col items-center w-24 border-r border-white/10">
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">YOU</span>
                    <span className="text-4xl font-black text-white">{scores.player}</span>
                 </div>
                 <div className="flex flex-col items-center w-24">
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">ENEMY</span>
                    <span className="text-4xl font-black text-white">{scores.enemy}</span>
                 </div>
            </div>

            <div className="flex gap-2">
                 <button onClick={() => initGame()} className="bg-white/5 hover:bg-white/10 text-white w-12 h-12 rounded-full border border-white/10 transition-all flex items-center justify-center">
                    <i className="fa-solid fa-rotate-right"></i>
                 </button>
                 <button onClick={onBack} className="bg-red-900/20 hover:bg-red-900/40 text-red-500 w-12 h-12 rounded-full border border-red-500/20 font-bold transition-all flex items-center justify-center">
                    <i className="fa-solid fa-xmark"></i>
                 </button>
            </div>
        </div>

        {/* Win/Loss Modal */}
        {gameState === 'finished' && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center animate-fade-in">
                <div className="bg-[#111] border border-white/10 p-12 rounded-3xl text-center shadow-[0_0_80px_rgba(0,0,0,1)] relative overflow-hidden">
                    <div className={`absolute top-0 left-0 right-0 h-2 ${scores.player > scores.enemy ? 'bg-green-500' : scores.player < scores.enemy ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                    
                    <h2 className="text-6xl font-black text-white italic mb-4 uppercase tracking-tighter">
                        {scores.player > scores.enemy ? 'VICTORY' : scores.player < scores.enemy ? 'DEFEAT' : 'DRAW'}
                    </h2>
                    
                    <div className="flex justify-center gap-12 my-8">
                        <div className="text-center">
                            <div className="text-xs text-green-500 uppercase tracking-widest mb-1">Your Score</div>
                            <div className="text-5xl font-mono font-bold text-white">{scores.player}</div>
                        </div>
                        <div className="text-center">
                             <div className="text-xs text-red-500 uppercase tracking-widest mb-1">Enemy Score</div>
                             <div className="text-5xl font-mono font-bold text-white">{scores.enemy}</div>
                        </div>
                    </div>

                    <button onClick={initGame} className="mt-4 px-10 py-4 bg-white text-black font-black uppercase tracking-widest hover:scale-105 transition-all rounded-full shadow-lg">
                        Play Again
                    </button>
                </div>
            </div>
        )}
        
        <div className="absolute bottom-8 text-[10px] text-gray-600 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/5">
            Objective: Push <span className="text-amber-500 font-bold">$</span> boxes into the <span className="text-green-500 font-bold">GREEN ZONE</span>
        </div>
    </div>
  );
};

export default SokobanView;
