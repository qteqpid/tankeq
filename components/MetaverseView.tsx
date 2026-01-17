
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Planet } from '../types';

interface MetaverseViewProps {
  onBack: () => void;
  planets: Planet[];
}

type MetaverseSubMode = 'space' | 'surface';
type WeatherMode = 'NONE' | 'RAIN' | 'SNOW' | 'ASH' | 'ACID';

interface PlanetMetadata {
  id: string;
  color: number;
  size: number;
  name: string;
  hasRing: boolean;
  atmosphereDensity: number;
  rotSpeed: number;
  roughness: number;
  cloudDensity: number;
  liquidLevel: number;
  emissiveIntensity: number;
  gravity: number;
  terrainScale: number;
  skyTint: number;
  bioTint: number;
  daySpeed: number;
  // --- 新增极致参数 ---
  geothermal: number;      // 地壳热能 (0-1)
  magneticField: number;   // 磁场极光强度 (0-1)
  weather: WeatherMode;    // 气象模式
  hasSatellites: boolean;  // 是否有卫星
  refraction: number;      // 大气折射
  isMain?: boolean;
}

// --- Deterministic Noise for Infinite Consistency ---
const p = new Uint8Array(512);
const permutation = new Uint8Array(256).map(() => Math.floor(Math.random() * 256));
for (let i = 0; i < 256; i++) p[i] = p[i + 256] = permutation[i];
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const grad = (hash: number, x: number, y: number) => {
  const h = hash & 15;
  return ((h < 8 ? x : y) * ((h & 1) === 0 ? 1 : -1)) + ((h < 4 ? y : (h === 12 || h === 14 ? x : 0)) * ((h & 2) === 0 ? 1 : -1));
};
const noise2D = (x: number, y: number) => {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
  return lerp(lerp(grad(aa, x, y), grad(ba, x - 1, y), u), lerp(grad(ab, x, y - 1), grad(bb, x - 1, y - 1), u), v);
};

const getTerrainHeight = (x: number, z: number, roughness: number = 1.0, scale: number = 1.0) => {
  const s = 0.003 * scale;
  let h = noise2D(x * s, z * s) * 80 * roughness;
  h += noise2D(x * s * 5, z * s * 5) * 20 * roughness;
  h += noise2D(x * 0.06, z * 0.06) * 6;
  return h;
};

const MetaverseView: React.FC<MetaverseViewProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const keys = useRef<{ [key: string]: boolean }>({});
  const [speed, setSpeed] = useState(0.5);
  const [subMode, setSubMode] = useState<MetaverseSubMode>('space');
  const [activeTab, setActiveTab] = useState<'core' | 'terrain' | 'evo'>('core');

  const [isCreating, setIsCreating] = useState(false);
  const [planetForm, setPlanetForm] = useState({
    name: 'NOVA-' + Math.floor(Math.random() * 9999),
    color: '#00f2ff',
    size: 70,
    hasRing: true,
    rotSpeed: 0.005,
    atmosphereDensity: 0.3,
    roughness: 1.5,
    cloudDensity: 0.5,
    liquidLevel: 0,
    emissiveIntensity: 0.6,
    gravity: 9.8,
    terrainScale: 1.2,
    skyTint: '#0a0a20',
    bioTint: '#22c55e',
    daySpeed: 0.002,
    // 新增
    geothermal: 0.2,
    magneticField: 0.4,
    weather: 'NONE' as WeatherMode,
    hasSatellites: true,
    refraction: 1.0
  });

  const subModeRef = useRef<MetaverseSubMode>('space');
  const targetPlanetRef = useRef<PlanetMetadata | null>(null);
  const [targetPlanet, setTargetPlanet] = useState<PlanetMetadata | null>(null);
  
  const playerPosition = useRef(new THREE.Vector3(0, 100, 300));
  const playerRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const groupSpaceRef = useRef<THREE.Group | null>(null);
  const lastSpacePos = useRef(new THREE.Vector3(0, 150, 400));
  const lastSpaceRot = useRef(new THREE.Euler(0, 0, 0));
  
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const lastTerrainSnap = useRef(new THREE.Vector2(Infinity, Infinity));

  const synthesizePlanet = () => {
    if (!groupSpaceRef.current) return;
    const meta: PlanetMetadata = {
      id: planetForm.name + '-' + Math.random().toString(36).substr(2, 4),
      color: parseInt(planetForm.color.replace('#', '0x')),
      size: planetForm.size,
      name: planetForm.name,
      hasRing: planetForm.hasRing,
      atmosphereDensity: planetForm.atmosphereDensity,
      rotSpeed: planetForm.rotSpeed,
      roughness: planetForm.roughness,
      cloudDensity: planetForm.cloudDensity,
      liquidLevel: planetForm.liquidLevel,
      emissiveIntensity: planetForm.emissiveIntensity,
      gravity: planetForm.gravity,
      terrainScale: planetForm.terrainScale,
      skyTint: parseInt(planetForm.skyTint.replace('#', '0x')),
      bioTint: parseInt(planetForm.bioTint.replace('#', '0x')),
      daySpeed: planetForm.daySpeed,
      geothermal: planetForm.geothermal,
      magneticField: planetForm.magneticField,
      weather: planetForm.weather,
      hasSatellites: planetForm.hasSatellites,
      refraction: planetForm.refraction
    };
    
    const group = new THREE.Group();
    // Core Mesh with Geothermal emission
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(meta.size, 3), 
      new THREE.MeshStandardMaterial({ 
        color: meta.color, 
        emissive: meta.color, 
        emissiveIntensity: meta.emissiveIntensity + meta.geothermal 
      })
    );
    group.add(core);

    // Aurora Effect (Magnetic Field)
    if (meta.magneticField > 0) {
      const aurora = new THREE.Mesh(
        new THREE.CylinderGeometry(meta.size * 1.15, meta.size * 1.15, meta.size * 0.4, 32, 1, true),
        new THREE.MeshBasicMaterial({ 
          color: meta.color, 
          transparent: true, 
          opacity: meta.magneticField * 0.3, 
          wireframe: true,
          blending: THREE.AdditiveBlending 
        })
      );
      aurora.position.y = meta.size * 0.8;
      group.add(aurora);
      const auroraBottom = aurora.clone();
      auroraBottom.position.y = -meta.size * 0.8;
      group.add(auroraBottom);
    }

    if (meta.cloudDensity > 0) {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(meta.size * 1.08, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: meta.cloudDensity, blending: THREE.AdditiveBlending, wireframe: true })
      );
      clouds.userData.isCloud = true;
      group.add(clouds);
    }

    if (meta.hasRing) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(meta.size * 2, 0.3, 2, 64), new THREE.MeshBasicMaterial({ color: meta.color, transparent: true, opacity: 0.15 }));
      ring.rotation.x = Math.PI / 2; group.add(ring);
    }

    // Satellites
    if (meta.hasSatellites) {
      for (let i = 0; i < 2; i++) {
        const sat = new THREE.Mesh(new THREE.SphereGeometry(meta.size * 0.15, 8, 8), new THREE.MeshStandardMaterial({ color: 0x888888 }));
        const dist = meta.size * (2.5 + i * 1.5);
        sat.position.set(dist, 0, 0);
        const satPivot = new THREE.Group();
        satPivot.rotation.y = Math.random() * Math.PI * 2;
        satPivot.rotation.z = Math.random() * 0.5;
        satPivot.add(sat);
        satPivot.userData = { isSat: true, orbitSpeed: 0.005 / (i + 1) };
        group.add(satPivot);
      }
    }

    const angle = Math.random() * Math.PI * 2;
    const dist = 1200 + Math.random() * 1500;
    group.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 600, Math.sin(angle) * dist);
    group.userData = { metadata: meta, rotSpeed: meta.rotSpeed };
    
    groupSpaceRef.current.add(group);
    setIsCreating(false);
    containerRef.current?.requestPointerLock();
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 400000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const groupSpace = new THREE.Group(); groupSpaceRef.current = groupSpace;
    const groupSurface = new THREE.Group();
    scene.add(groupSpace, groupSurface);

    // --- Space Mode ---
    scene.background = new THREE.Color(0x010102);
    groupSpace.add(new THREE.AmbientLight(0xffffff, 0.05));
    const spaceSun = new THREE.PointLight(0xffffff, 12, 30000); spaceSun.position.set(6000, 3000, 6000);
    groupSpace.add(spaceSun);

    const primeMeta: PlanetMetadata = { 
      id: 'ORIGIN', color: 0x00f2ff, size: 180, name: '始源母星', hasRing: true, 
      atmosphereDensity: 0.25, rotSpeed: 0.0003, roughness: 1.2, cloudDensity: 0.4, 
      liquidLevel: 0, emissiveIntensity: 0.4, gravity: 9.8, terrainScale: 1.0, skyTint: 0x020510, bioTint: 0x00ff88, daySpeed: 0.001,
      geothermal: 0.1, magneticField: 0.3, weather: 'NONE', hasSatellites: true, refraction: 1.0
    };
    const primeGroup = new THREE.Group(); primeGroup.userData = { metadata: primeMeta };
    primeGroup.add(new THREE.Mesh(new THREE.IcosahedronGeometry(180, 4), new THREE.MeshStandardMaterial({ color: 0x010508, emissive: 0x003366 })));
    groupSpace.add(primeGroup);

    // --- Surface Mode ---
    const terrainSize = 8000; const terrainRes = 120; const cellSize = terrainSize / terrainRes;
    const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainRes, terrainRes);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.8 });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMeshRef.current = terrainMesh;
    groupSurface.add(terrainMesh);

    const water = new THREE.Mesh(new THREE.PlaneGeometry(terrainSize * 5, terrainSize * 5), new THREE.MeshPhongMaterial({ transparent: true, opacity: 0.75, shininess: 150 }));
    water.rotation.x = -Math.PI / 2; waterMeshRef.current = water;
    groupSurface.add(water);

    const surfSun = new THREE.DirectionalLight(0xffffff, 2.0); surfSun.position.set(1000, 2000, 1000);
    groupSurface.add(surfSun, new THREE.AmbientLight(0xffffff, 0.3));

    const updateTerrainGeometry = (worldX: number, worldZ: number, meta: PlanetMetadata) => {
      const snapX = Math.floor(worldX / cellSize) * cellSize;
      const snapZ = Math.floor(worldZ / cellSize) * cellSize;
      if (snapX === lastTerrainSnap.current.x && snapZ === lastTerrainSnap.current.y) return;
      lastTerrainSnap.current.set(snapX, snapZ);
      terrainMesh.position.set(snapX, 0, snapZ);

      const posAttr = terrainGeo.attributes.position;
      const colorAttr = new Float32Array(posAttr.count * 3);
      const themeColor = new THREE.Color(meta.color);
      const bioColor = new THREE.Color(meta.bioTint);
      const skyColor = new THREE.Color(meta.skyTint);
      const isHot = meta.geothermal > 0.5;

      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i) + snapX;
        const vz = posAttr.getZ(i) + snapZ;
        const h = getTerrainHeight(vx, vz, meta.roughness, meta.terrainScale);
        posAttr.setY(i, h);

        const c = new THREE.Color();
        if (h < meta.liquidLevel) {
          if (isHot) c.setHSL(0, 1, 0.4); // Lava
          else c.copy(themeColor).lerp(new THREE.Color(0x000000), 0.7);
        } else if (h < meta.liquidLevel + 12) {
          c.copy(themeColor).lerp(bioColor, 0.4);
        } else if (h < 80) {
          c.copy(bioColor).lerp(new THREE.Color(0x000000), 0.5);
        } else {
          c.setHSL(0, 0, 0.9); // Snow or Rock
        }
        
        // Geothermal glow
        if (meta.geothermal > 0.3 && Math.random() > 0.995) {
          c.setHSL(0.05, 1, 0.8);
        }

        colorAttr[i * 3] = c.r; colorAttr[i * 3 + 1] = c.g; colorAttr[i * 3 + 2] = c.b;
      }
      
      terrainGeo.setAttribute('color', new THREE.BufferAttribute(colorAttr, 3));
      posAttr.needsUpdate = true;
      terrainGeo.computeVertexNormals();
      
      water.position.y = meta.liquidLevel;
      if (isHot) {
        water.material.color.set(0xff4400); water.material.emissive.set(0xaa2200); water.material.emissiveIntensity = 1.0;
      } else {
        water.material.color.copy(themeColor).multiplyScalar(0.15); water.material.emissive.set(0x000000);
      }
      
      scene.background = skyColor;
      scene.fog = new THREE.FogExp2(skyColor, 0.0004 * meta.atmosphereDensity * 10 / meta.refraction);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current[key] = true;
      if (key === 'e' && subModeRef.current === 'space' && targetPlanetRef.current) {
        lastSpacePos.current.copy(camera.position); lastSpaceRot.current.copy(camera.rotation);
        subModeRef.current = 'surface'; setSubMode('surface');
        playerPosition.current.set(0, 250, 0); lastTerrainSnap.current.set(Infinity, Infinity);
        updateTerrainGeometry(0, 0, targetPlanetRef.current);
      }
      if (key === 'q' && subModeRef.current === 'surface') {
        subModeRef.current = 'space'; setSubMode('space');
        camera.position.copy(lastSpacePos.current); camera.rotation.copy(lastSpaceRot.current);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', (e) => keys.current[e.key.toLowerCase()] = false);
    window.addEventListener('mousemove', (e) => {
      if (!document.pointerLockElement) return;
      if (subModeRef.current === 'space') {
        camera.rotation.y -= e.movementX * 0.001; camera.rotation.x -= e.movementY * 0.001;
      } else {
        playerRotation.current.y -= e.movementX * 0.0012; playerRotation.current.x -= e.movementY * 0.0012;
        playerRotation.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, playerRotation.current.x));
      }
    });

    const animate = () => {
      requestAnimationFrame(animate);
      const isSpace = subModeRef.current === 'space';
      groupSpace.visible = isSpace; groupSurface.visible = !isSpace;

      if (isSpace) {
        scene.fog = null; scene.background = new THREE.Color(0x010102);
        let closest: PlanetMetadata | null = null; let minDist = Infinity;
        groupSpace.children.forEach(child => {
          if (child instanceof THREE.Group && child.userData.metadata) {
            const meta = child.userData.metadata as PlanetMetadata;
            const d = camera.position.distanceTo(child.position);
            if (d < meta.size * 5.0 && d < minDist) { minDist = d; closest = meta; }
            child.rotation.y += meta.rotSpeed;
            child.children.forEach(c => {
                if(c.userData.isSat) c.rotation.y += c.userData.orbitSpeed;
            });
          }
        });
        targetPlanetRef.current = closest; setTargetPlanet(closest);
        if (document.pointerLockElement) {
          const moveDir = new THREE.Vector3((keys.current['d']?1:0)-(keys.current['a']?1:0), (keys.current[' ']?1:0)-(keys.current['shift']?1:0), (keys.current['s']?1:0)-(keys.current['w']?1:0));
          camera.position.add(moveDir.applyEuler(camera.rotation).multiplyScalar(speed * 20));
        }
      } else if (document.pointerLockElement) {
        const curMeta = targetPlanetRef.current || primeMeta;
        const move = new THREE.Vector3((keys.current['d']?1:0)-(keys.current['a']?1:0), 0, (keys.current['s']?1:0)-(keys.current['w']?1:0)).normalize().multiplyScalar(2.0).applyAxisAngle(new THREE.Vector3(0,1,0), playerRotation.current.y);
        playerPosition.current.add(move);
        
        const h = getTerrainHeight(playerPosition.current.x, playerPosition.current.z, curMeta.roughness, curMeta.terrainScale);
        const targetY = Math.max(h, curMeta.liquidLevel) + 2.8;
        const lerpFactor = THREE.MathUtils.clamp(curMeta.gravity / 15, 0.01, 0.3);
        playerPosition.current.y = THREE.MathUtils.lerp(playerPosition.current.y, targetY, lerpFactor);
        
        camera.position.copy(playerPosition.current).add(new THREE.Vector3(0, 2, 0));
        camera.rotation.set(playerRotation.current.x, playerRotation.current.y, 0, 'YXZ');
        updateTerrainGeometry(playerPosition.current.x, playerPosition.current.z, curMeta);
        
        const time = Date.now() * curMeta.daySpeed;
        surfSun.position.set(Math.cos(time) * 3000, Math.sin(time) * 3000, 1500);
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => { renderer.dispose(); window.removeEventListener('keydown', handleKeyDown); };
  }, [speed]);

  const habitability = Math.max(0, 100 - (planetForm.gravity - 9.8)**2 * 2 - (planetForm.geothermal * 100) - (planetForm.atmosphereDensity > 0.6 ? 20 : 0));

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden font-sans cursor-crosshair" ref={containerRef} onClick={() => !isCreating && containerRef.current?.requestPointerLock()}>
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none p-12 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <div className="bg-black/90 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl border-l-[6px] border-l-cyan-500 min-w-[340px]">
             <div className="flex items-center gap-5 text-cyan-400">
                <i className={`fa-solid ${subMode === 'space' ? 'fa-satellite' : 'fa-person-hiking'} animate-pulse text-2xl`}></i>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black tracking-[0.4em] uppercase">{subMode === 'space' ? 'SYSTEM SCAN' : 'EXO_SCANNER'}</span>
                  <div className="flex gap-2 items-center mt-1">
                     <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></div>
                     <span className="text-[9px] text-cyan-800 font-bold uppercase tracking-widest italic">Signal: Synchronized</span>
                  </div>
                </div>
             </div>
             <div className="mt-6 grid grid-cols-2 gap-4 text-[12px] text-gray-400 font-mono border-t border-white/5 pt-4">
                <div className="flex flex-col"><span className="opacity-40 text-[9px]">HABITABILITY</span> <span className={`${habitability > 60 ? 'text-green-500' : 'text-red-500'}`}>{habitability.toFixed(0)}%</span></div>
                <div className="flex flex-col"><span className="opacity-40 text-[9px]">GRAV_CORE</span> <span className="text-cyan-500">{targetPlanet?.gravity || 9.8}G</span></div>
             </div>
          </div>

          <div className="flex flex-col items-end gap-6 pointer-events-auto">
             {subMode === 'space' && !isCreating && (
                <button onClick={(e) => { e.stopPropagation(); setIsCreating(true); document.exitPointerLock(); }} className="group relative flex items-center gap-6 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-10 py-6 rounded-[3rem] backdrop-blur-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_60px_rgba(6,182,212,0.25)]">
                   <div className="w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center text-black group-hover:rotate-180 transition-transform duration-700 shadow-[0_0_20px_rgba(6,182,212,0.6)]"><i className="fa-solid fa-atom text-xl"></i></div>
                   <div className="flex flex-col items-start"><span className="text-cyan-200 font-black uppercase tracking-[0.4em] text-sm">初始化星体协议</span><span className="text-[9px] text-cyan-700 font-bold uppercase tracking-widest">ADVANCED_GENESIS_v4</span></div>
                </button>
             )}
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center">
          {subMode === 'space' && targetPlanet && !isCreating && (
            <div className="bg-black/70 border border-cyan-400/30 backdrop-blur-3xl px-20 py-14 rounded-[5rem] animate-pulse flex flex-col items-center gap-10 shadow-[0_0_150px_rgba(6,182,212,0.4)] relative">
               <div className="absolute -top-6 bg-cyan-600 text-black px-8 py-2 rounded-full text-[11px] font-black tracking-widest uppercase skew-x-[-12deg]">Identification: {targetPlanet.id}</div>
               <span className="text-cyan-300 font-black text-5xl tracking-tighter uppercase italic drop-shadow-[0_0_30px_rgba(34,211,238,0.8)]">
                  {targetPlanet.name}
               </span>
               <div className="flex gap-14 opacity-80 border-y border-white/5 py-6">
                  <div className="flex flex-col items-center"><span className="text-[9px] font-black text-gray-500 tracking-widest">GEOTHERMAL</span><span className="text-sm font-mono">{Math.round(targetPlanet.geothermal*100)}%</span></div>
                  <div className="flex flex-col items-center"><span className="text-[9px] font-black text-gray-500 tracking-widest">MAG_FIELD</span><span className="text-sm font-mono">{Math.round(targetPlanet.magneticField*100)}%</span></div>
                  <div className="flex flex-col items-center"><span className="text-[9px] font-black text-gray-500 tracking-widest">WEATHER</span><span className="text-sm font-mono">{targetPlanet.weather}</span></div>
               </div>
               <div className="flex items-center gap-6 group">
                  <div className="w-12 h-0.5 bg-cyan-500/20 group-hover:w-20 transition-all duration-700"></div>
                  <span className="text-white font-black uppercase tracking-[0.6em] text-sm">
                    按下 <span className="text-cyan-400 text-2xl font-black bg-white/5 px-4 py-2 rounded-xl">[E]</span> 进入着陆程序
                  </span>
                  <div className="w-12 h-0.5 bg-cyan-500/20 group-hover:w-20 transition-all duration-700"></div>
               </div>
            </div>
          )}
        </div>

        <div className="w-full flex justify-between items-end">
           <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 text-[12px] text-cyan-600 font-black uppercase tracking-[0.4em]"><i className="fa-solid fa-wave-square animate-pulse"></i> SIM_STABILITY_LOCK</div>
              <div className="w-[500px] h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5"><div className="h-full bg-gradient-to-r from-cyan-950 via-cyan-500 to-cyan-950 w-full animate-[shimmer_2s_infinite] rounded-full"></div></div>
           </div>
           {subMode === 'surface' && (
              <div className="bg-black/95 backdrop-blur-3xl px-16 py-8 rounded-[3rem] border border-cyan-500/30 pointer-events-auto cursor-pointer hover:bg-black hover:border-cyan-400 transition-all shadow-[0_-20px_100px_rgba(6,182,212,0.2)]">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-[16px] text-white font-black uppercase tracking-[0.6em] flex items-center gap-6 animate-pulse">
                       <i className="fa-solid fa-angles-up text-cyan-500"></i> [Q] 退出引力井
                    </span>
                    <span className="text-[9px] text-cyan-900 font-black uppercase tracking-widest">Ignite Ascent Engines</span>
                </div>
              </div>
           )}
           <div className="text-[11px] text-white/10 uppercase tracking-[2em] font-black italic">PROMETHEUS_v4.5</div>
        </div>
      </div>

      {/* Extreme Synthesis Protocol Modal */}
      {isCreating && (
        <div className="absolute inset-0 z-50 bg-black/98 backdrop-blur-3xl flex items-center justify-center p-12 animate-fade-in pointer-events-auto">
          <div className="bg-[#030303] border border-white/10 w-full max-w-[90vw] rounded-[6rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,1)] flex flex-col md:flex-row h-[85vh] border-t-2 border-t-cyan-500/40">
            
            {/* Left Hologram Area */}
            <div className="w-full md:w-1/3 bg-black flex flex-col items-center justify-center border-r border-white/5 relative p-20">
               <div className="absolute top-14 left-14 flex items-center gap-3">
                  <div className="w-4 h-4 border border-cyan-500/50 animate-spin"></div>
                  <span className="text-[10px] text-cyan-900 font-black uppercase tracking-widest">Live Projection</span>
               </div>
               
               <div className="w-80 h-80 rounded-full border border-white/5 flex items-center justify-center relative bg-[radial-gradient(circle_at_30%_30%,_#ffffff05_0%,_transparent_70%)]">
                  <div className="w-56 h-56 rounded-full transition-all duration-1000 relative shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden" 
                    style={{ 
                        backgroundColor: planetForm.color, 
                        boxShadow: `0 0 ${planetForm.emissiveIntensity * 150}px ${planetForm.color}33, inset -20px -20px 60px rgba(0,0,0,0.8)` 
                    }}>
                    <div className="absolute inset-0 rounded-full border-[15px] border-white/10 scale-110 blur-sm" style={{ opacity: planetForm.cloudDensity }}></div>
                    {planetForm.geothermal > 0.4 && <div className="absolute inset-0 bg-orange-600/20 mix-blend-overlay animate-pulse"></div>}
                  </div>
                  {planetForm.hasRing && <div className="absolute w-[150%] h-1.5 bg-white/10 rotate-[15deg] backdrop-blur-xl border-y border-white/5"></div>}
               </div>

               <div className="mt-20 text-center w-full">
                  <div className="flex items-center justify-center gap-4 mb-4">
                     <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent to-cyan-900"></div>
                     <h3 className="text-5xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap">{planetForm.name || 'NEW_WORLD'}</h3>
                     <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent to-cyan-900"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-8 text-[11px] text-cyan-800 font-black uppercase tracking-widest mt-10">
                    <div className="flex flex-col gap-1"><span>HABITABILITY</span><span className={`text-lg font-mono ${habitability > 60 ? 'text-green-500' : 'text-red-500'}`}>{habitability.toFixed(0)}%</span></div>
                    <div className="flex flex-col gap-1"><span>THREAT_LEVEL</span><span className="text-lg font-mono text-white">{Math.round((100-habitability)/10)}</span></div>
                  </div>
               </div>
            </div>

            {/* Right Control Panels */}
            <div className="w-full md:w-2/3 p-20 flex flex-col bg-black/40">
               <div className="flex gap-14 mb-14 border-b border-white/10 pb-10">
                  {[
                    {id: 'core', label: '核心结构', icon: 'fa-microchip'},
                    {id: 'terrain', label: '地壳演化', icon: 'fa-mountain-sun'},
                    {id: 'evo', label: '环境动力学', icon: 'fa-bolt-lightning'}
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} 
                      className={`flex items-center gap-4 text-xs font-black uppercase tracking-[0.5em] transition-all relative pb-4 group ${activeTab === tab.id ? 'text-cyan-400' : 'text-gray-700 hover:text-gray-500'}`}>
                      <i className={`fa-solid ${tab.icon} ${activeTab === tab.id ? 'animate-pulse' : ''}`}></i>
                      {tab.label}
                      {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>}
                    </button>
                  ))}
               </div>

               <div className="flex-grow overflow-y-auto pr-10 space-y-16 scrollbar-hide">
                  {activeTab === 'core' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12 animate-fade-in">
                       <div className="space-y-4">
                          <label className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">天体序列代号</label>
                          <input type="text" value={planetForm.name} onChange={(e) => setPlanetForm(p => ({...p, name: e.target.value.toUpperCase()}))} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white font-mono outline-none focus:border-cyan-500/50 shadow-inner" />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">核心波长采样</label>
                          <div className="flex gap-4">
                             <input type="color" value={planetForm.color} onChange={(e) => setPlanetForm(p => ({...p, color: e.target.value}))} className="flex-grow h-20 bg-transparent border-none cursor-pointer rounded-3xl overflow-hidden" />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]"><span>物理半径 (KM)</span><span className="text-cyan-500 font-mono">{planetForm.size}</span></div>
                          <input type="range" min="40" max="400" value={planetForm.size} onChange={(e) => setPlanetForm(p => ({...p, size: parseInt(e.target.value)}))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500" />
                       </div>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]"><span>引力常量 (G)</span><span className="text-cyan-500 font-mono">{planetForm.gravity}</span></div>
                          <input type="range" min="1.0" max="50.0" step="0.1" value={planetForm.gravity} onChange={(e) => setPlanetForm(p => ({...p, gravity: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500" />
                       </div>
                       <div className="col-span-full grid grid-cols-2 gap-10 bg-white/5 p-10 rounded-[3rem] border border-white/5 mt-4">
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">构建星环系统</span>
                             <button onClick={() => setPlanetForm(p => ({...p, hasRing: !p.hasRing}))} className={`w-16 h-8 rounded-full transition-all relative ${planetForm.hasRing ? 'bg-cyan-600 shadow-[0_0_20px_rgba(8,145,178,0.5)]' : 'bg-gray-900'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${planetForm.hasRing ? 'left-9' : 'left-1'}`}></div></button>
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">同步天然卫星</span>
                             <button onClick={() => setPlanetForm(p => ({...p, hasSatellites: !p.hasSatellites}))} className={`w-16 h-8 rounded-full transition-all relative ${planetForm.hasSatellites ? 'bg-cyan-600 shadow-[0_0_20px_rgba(8,145,178,0.5)]' : 'bg-gray-900'}`}><div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${planetForm.hasSatellites ? 'left-9' : 'left-1'}`}></div></button>
                          </div>
                       </div>
                    </div>
                  )}

                  {activeTab === 'terrain' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12 animate-fade-in">
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]"><span>地貌复杂度</span><span className="text-cyan-500 font-mono">{planetForm.roughness.toFixed(1)}</span></div>
                          <input type="range" min="0.1" max="5.0" step="0.1" value={planetForm.roughness} onChange={(e) => setPlanetForm(p => ({...p, roughness: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500" />
                       </div>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]"><span>地壳板块尺度</span><span className="text-cyan-500 font-mono">{planetForm.terrainScale.toFixed(1)}</span></div>
                          <input type="range" min="0.5" max="6.0" step="0.1" value={planetForm.terrainScale} onChange={(e) => setPlanetForm(p => ({...p, terrainScale: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500" />
                       </div>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]"><span>液态/熔岩位面 (M)</span><span className="text-cyan-500 font-mono">{planetForm.liquidLevel}</span></div>
                          <input type="range" min="-100" max="100" value={planetForm.liquidLevel} onChange={(e) => setPlanetForm(p => ({...p, liquidLevel: parseInt(e.target.value)}))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500" />
                       </div>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]"><span>地壳热能流动</span><span className="text-orange-500 font-mono">{Math.round(planetForm.geothermal*100)}%</span></div>
                          <input type="range" min="0" max="1.0" step="0.01" value={planetForm.geothermal} onChange={(e) => setPlanetForm(p => ({...p, geothermal: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-orange-600" />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">生物/矿物分布基色</label>
                          <input type="color" value={planetForm.bioTint} onChange={(e) => setPlanetForm(p => ({...p, bioTint: e.target.value}))} className="w-full h-16 bg-transparent border-none cursor-pointer" />
                       </div>
                    </div>
                  )}

                  {activeTab === 'evo' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12 animate-fade-in">
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]"><span>大气透射率</span><span className="text-cyan-500 font-mono">{Math.round(planetForm.atmosphereDensity*100)}%</span></div>
                          <input type="range" min="0" max="1.0" step="0.01" value={planetForm.atmosphereDensity} onChange={(e) => setPlanetForm(p => ({...p, atmosphereDensity: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500" />
                       </div>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]"><span>极光磁场强度</span><span className="text-cyan-500 font-mono">{Math.round(planetForm.magneticField*100)}%</span></div>
                          <input type="range" min="0" max="1.0" step="0.01" value={planetForm.magneticField} onChange={(e) => setPlanetForm(p => ({...p, magneticField: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500" />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">大气折射背景色</label>
                          <input type="color" value={planetForm.skyTint} onChange={(e) => setPlanetForm(p => ({...p, skyTint: e.target.value}))} className="w-full h-16 bg-transparent border-none cursor-pointer" />
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em]">气象协议 (WEATHER)</label>
                          <select value={planetForm.weather} onChange={(e) => setPlanetForm(p => ({...p, weather: e.target.value as WeatherMode}))} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white text-xs outline-none">
                             <option value="NONE">无降水 (STABLE)</option>
                             <option value="RAIN">水气降雨 (LIQUID_RAIN)</option>
                             <option value="SNOW">冰晶落雪 (FROZEN_SNOW)</option>
                             <option value="ACID">强酸沉降 (ACID_VOID)</option>
                             <option value="ASH">火山灰烬 (BURNING_ASH)</option>
                          </select>
                       </div>
                       <div className="space-y-4">
                          <div className="flex justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]"><span>昼夜流转角速度</span><span className="text-cyan-500 font-mono">{planetForm.daySpeed.toFixed(4)}</span></div>
                          <input type="range" min="0.0001" max="0.02" step="0.0001" value={planetForm.daySpeed} onChange={(e) => setPlanetForm(p => ({...p, daySpeed: parseFloat(e.target.value)}))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500" />
                       </div>
                    </div>
                  )}
               </div>

               <div className="pt-16 flex gap-10">
                  <button onClick={() => setIsCreating(false)} className="flex-1 py-10 bg-white/5 hover:bg-white/10 text-gray-500 font-black uppercase tracking-[0.4em] rounded-[3rem] transition-all border border-white/5">中止合成</button>
                  <button onClick={synthesizePlanet} className="flex-[2] py-10 bg-gradient-to-r from-cyan-900 to-cyan-500 hover:scale-[1.03] text-white font-black uppercase tracking-[1em] rounded-[3rem] shadow-[0_40px_100px_rgba(6,182,212,0.3)] transition-all transform active:scale-95 italic text-2xl border-b-8 border-cyan-800">执行终极合成协议 (INIT)</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Reticle UI */}
      {!isCreating && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 pointer-events-none opacity-20"><div className="absolute inset-0 border-[1px] border-cyan-500 rounded-full animate-ping"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_40px_#22d3ee]"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-[1px] bg-cyan-500/30"></div><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1px] h-12 bg-cyan-500/30"></div></div>}
    </div>
  );
};

export default MetaverseView;
