
import React, { useRef, useEffect, useState } from 'react';

interface TankBattleViewProps {
  onBack: () => void;
  onSokoban: () => void;
}

type EnemyType = 'RAIDER' | 'INTERCEPTOR' | 'GOLIATH' | 'WRAITH' | 'NEUTRAL_DRONE' | 'GUARDIAN' | 'ALLY_TANK' | 'MYTHIC_BOSS' | 'SPIDER' | 'TURRET';
type Alignment = 'enemy' | 'neutral' | 'friendly';
type WeaponType = 'BLASTER' | 'SHOTGUN' | 'SNIPER' | 'PLASMA' | 'FLAMETHROWER' | 'MINIGUN' | 'LASER' | 'MISSILE';
type BoxType = 'STANDARD' | 'WOODEN' | 'DIAMOND' | 'GOLDEN'; 

// --- NEW: EQUIPMENT SYSTEM ---
type ItemRank = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'POWERFUL' | 'MYTHIC' | 'SUPER';
type ItemType = 'POISON_CORE' | 'SHIELD_GEN' | 'SPEED_DRIVE' | 'FIRE_CHIP' | 'SUPER_WEAPON' | 'REGEN_CORE';

interface GameItem {
    id: string;
    uid: string; // Unique ID for inventory logic
    count?: number; // Stacking count
    name: string;
    type: ItemType;
    rank: ItemRank;
    description: string;
    price: number;
    // Stats
    poisonLevel?: number; // Damage per tick
    shieldMax?: number;   // Extra Shield HP
    fireRateMod?: number; // 0.1 = 10% faster
    speedMod?: number;
    // New Super Stats
    damageMod?: number;   // Multiplier e.g. 0.5 = +50%
    regenMod?: number;    // HP per tick
    bulletSizeMod?: number; // Multiplier
}

const RANK_COLORS: Record<ItemRank, string> = {
    COMMON: '#94a3b8',    // Gray
    UNCOMMON: '#22c55e',  // Green
    RARE: '#3b82f6',      // Blue
    EPIC: '#a855f7',      // Purple
    POWERFUL: '#f97316',  // Orange
    MYTHIC: '#ef4444',    // Red
    SUPER: '#ec4899'      // Pink/Rainbow
};

const SHOP_ITEMS: GameItem[] = [
    { id: 'poison_1', uid: '', name: '1级毒合晶', type: 'POISON_CORE', rank: 'COMMON', description: '子弹附带微量腐蚀毒素', price: 200, poisonLevel: 2 },
    { id: 'poison_2', uid: '', name: '剧毒液压', type: 'POISON_CORE', rank: 'RARE', description: '高浓度酸液注入', price: 1500, poisonLevel: 8 },
    { id: 'shield_1', uid: '', name: '小保护罩', type: 'SHIELD_GEN', rank: 'COMMON', description: '提供基础能量护盾', price: 300, shieldMax: 150 },
    { id: 'shield_3', uid: '', name: '泰坦力场', type: 'SHIELD_GEN', rank: 'EPIC', description: '战列舰级偏导护盾', price: 4000, shieldMax: 800 },
    { id: 'fire_1', uid: '', name: '超频模块', type: 'FIRE_CHIP', rank: 'COMMON', description: '略微提升武器射速', price: 250, fireRateMod: 0.1 },
    { id: 'fire_4', uid: '', name: '神之扳机', type: 'FIRE_CHIP', rank: 'MYTHIC', description: '武器冷却系统突破极限', price: 12000, fireRateMod: 0.5 },
    { id: 'speed_5', uid: '', name: '光速引擎', type: 'SPEED_DRIVE', rank: 'SUPER', description: '超越物理法则的机动性', price: 50000, speedMod: 0.8 },
    // Super Items
    { id: 'super_shield', uid: '', name: '无敌保护罩', type: 'SHIELD_GEN', rank: 'SUPER', description: '提供近乎无敌的护盾容量', price: 100000, shieldMax: 10000 },
    { id: 'super_laser', uid: '', name: '巨型激光', type: 'SUPER_WEAPON', rank: 'SUPER', description: '大幅增加子弹体积与伤害', price: 150000, damageMod: 2.0, bulletSizeMod: 3.0 },
    { id: 'super_regen', uid: '', name: '无敌回血', type: 'REGEN_CORE', rank: 'SUPER', description: '纳米机器极速修复装甲', price: 120000, regenMod: 50 },
    { id: 'super_attack', uid: '', name: '加强攻击', type: 'FIRE_CHIP', rank: 'SUPER', description: '毁灭性的火力提升', price: 80000, damageMod: 3.0 },
];

// -----------------------------

interface WeaponStats {
  name: string;
  damage: number;
  speed: number;
  cooldown: number;
  color: string;
  count: number; 
  spread: number; 
  isExplosive?: boolean;
  range?: number;
  isHoming?: boolean;
  growRate?: number; // Projectile grows over time (Flamethrower)
  piercing?: boolean;
}

const WEAPONS: Record<WeaponType, WeaponStats> = {
  BLASTER:      { name: 'PULSE RIFLE', damage: 8, speed: 20, cooldown: 160, color: '#00f2ff', count: 1, spread: 0 },
  SHOTGUN:      { name: 'SHREDDER', damage: 6, speed: 18, cooldown: 800, color: '#f59e0b', count: 6, spread: 0.35, range: 450 },
  SNIPER:       { name: 'RAILGUN', damage: 80, speed: 50, cooldown: 1200, color: '#a855f7', count: 1, spread: 0 },
  PLASMA:       { name: 'PLASMA LAUNCHER', damage: 25, speed: 14, cooldown: 500, color: '#10b981', count: 1, spread: 0, isExplosive: true },
  FLAMETHROWER: { name: 'DRAGON BREATH', damage: 2.5, speed: 10, cooldown: 30, color: '#f97316', count: 1, spread: 0.25, range: 400, growRate: 1.2, piercing: true },
  MINIGUN:      { name: 'CHAIN GUN', damage: 5, speed: 24, cooldown: 50, color: '#fcd34d', count: 1, spread: 0.15 },
  LASER:        { name: 'ION BEAM', damage: 6, speed: 30, cooldown: 40, color: '#8b5cf6', count: 1, spread: 0 },
  MISSILE:      { name: 'SWARM MISSILE', damage: 18, speed: 10, cooldown: 700, color: '#f43f5e', count: 3, spread: 0.4, isHoming: true, range: 1100, isExplosive: true }
};

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface TankBuffs {
  overdriveUntil: number; // Double Damage
  blitzUntil: number;     // Speed + Fire Rate
  invincibleUntil: number; // Invincibility
  slowUntil?: number; // Debuff for enemies
}

interface PlayerStats {
    lvl: number;
    xp: number;
    maxXp: number;
    upgradePoints: number;
    // Stat Levels (0-10 etc)
    statLevels: {
        damage: number;
        health: number;
        speed: number;
        haste: number; // Fire Rate
        regen: number; // Health Regen
        armor: number; // Damage Reduction
    }
}

interface Tank extends GameObject {
  id: string;
  type: 'player' | 'npc';
  alignment: Alignment;
  enemyType: EnemyType;
  hp: number;
  maxHp: number;
  // New Shield System
  shield: number;
  maxShield: number;
  lastShieldHit: number; // For regen delay
  
  speed: number;
  baseSpeed: number; 
  lastShot: number;
  color: string;
  scoreValue: number;
  isAggressive?: boolean;
  buffs: TankBuffs;
  currentArenaIndex?: number;
  // Weapon System
  currentWeapon: WeaponType;
  unlockedWeapons: WeaponType[];
  // RPG System (Player only usually, but structure helps)
  rpgStats?: PlayerStats;
  // Inventory System
  coins: number;
  inventory: GameItem[];
  equipment: GameItem[]; // Active items
  
  // Debuffs
  poisonStacks: number;
  lastPoisonTick: number;
}

interface Bullet extends GameObject {
  id: string;
  ownerId: string;
  ownerAlignment: Alignment;
  speed: number;
  damage: number;
  color: string;
  isSuper?: boolean;
  maxDist?: number;
  startPos: {x: number, y: number};
  isExplosive?: boolean;
  isHoming?: boolean;
  growRate?: number;
  piercing?: boolean;
  pierceCount?: number; 
  hitList?: string[];
  seed?: number; 
  // Modifiers
  poisonLevel?: number;
}

interface Obstacle extends GameObject {
  type: 'hard' | 'soft';
}

interface LootBox extends GameObject {
  id: string;
  spawnTime: number;
  type: BoxType;
}

interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  type: 'smoke' | 'spark' | 'ring' | 'debris' | 'coin';
  size: number;
  rotation?: number;
  rotSpeed?: number;
}

// --- NEW MAP CONFIGURATION ---
const OUTER_COUNT = 8;
const ORBIT_RADIUS = 4000;
const ARENA_RADIUS = 1100;
const BRIDGE_WIDTH = 280;
const PLAYER_BASE_HP = 800; // Base, scales with upgrades
const SAVE_KEY = 'tank_battle_save_v9_stack'; 
const GRID_SIZE = 120;
const MATCH_DURATION = 180 * 1000; // 3 minutes

// Outer Ring + Center Hub
const ARENAS = [
    ...Array.from({ length: OUTER_COUNT }).map((_, i) => {
        const angle = (i / OUTER_COUNT) * Math.PI * 2;
        let difficulty = 1;
        if (i === 0) difficulty = 0;
        else if (i <= 2) difficulty = 1;
        else if (i <= 4) difficulty = 2;
        else if (i <= 6) difficulty = 3;
        else difficulty = 4;

        return {
            id: i,
            x: Math.cos(angle) * ORBIT_RADIUS,
            y: Math.sin(angle) * ORBIT_RADIUS,
            color: i === 0 ? '#064e3b' : difficulty >= 3 ? '#450a0a' : '#1e293b', 
            gridColor: i === 0 ? '#059669' : difficulty >= 3 ? '#7f1d1d' : '#334155',
            name: i === 0 ? 'BASE_CAMP' : `SECTOR_0${i} [LVL ${difficulty}]`, 
            difficulty: difficulty
        };
    }),
    {
        id: OUTER_COUNT, // 8
        x: 0,
        y: 0,
        color: '#312e81', // Deep Indigo for Boss Arena
        gridColor: '#6366f1',
        name: 'CORE_ARENA [PvP]',
        difficulty: 5
    }
];

// Define connections
const BRIDGES: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0],
    [0, 8], [2, 8], [4, 8], [6, 8] 
];

const TankBattleView: React.FC<TankBattleViewProps> = ({ onBack, onSokoban }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentArena, setCurrentArena] = useState(0);
  const currentArenaRef = useRef(0); 
  const [cheatCode, setCheatCode] = useState('');
  
  // UI State syncing
  const [playerUI, setPlayerUI] = useState({
      hp: PLAYER_BASE_HP,
      maxHp: PLAYER_BASE_HP,
      shield: 0,
      maxShield: 0,
      xp: 0,
      maxXp: 1000,
      level: 1,
      upgradePoints: 0,
      coins: 0
  });
  
  const [activeWeapon, setActiveWeapon] = useState<WeaponType>('BLASTER');
  const [unlockedWeapons, setUnlockedWeapons] = useState<WeaponType[]>(['BLASTER']);
  
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [canEnterAscension, setCanEnterAscension] = useState(false);
  const canEnterAscensionRef = useRef(false);

  // Arena Match UI State
  const [arenaMatchUI, setArenaMatchUI] = useState({
      friendlyScore: 0,
      enemyScore: 0,
      timeLeft: MATCH_DURATION,
      result: 'NONE' as 'NONE' | 'VICTORY' | 'DEFEAT'
  });

  const keys = useRef<{ [key: string]: boolean }>({});
  const mousePos = useRef({ x: 0, y: 0 });
  const lastMythicSpawn = useRef(Date.now()); // Timer for Mythic spawn

  const state = useRef({
    player: {
      id: 'player',
      x: ARENAS[0].x, y: ARENAS[0].y, 
      width: 44, height: 44,
      rotation: 0,
      type: 'player' as const,
      alignment: 'friendly' as Alignment,
      enemyType: 'RAIDER',
      hp: PLAYER_BASE_HP, maxHp: PLAYER_BASE_HP, 
      shield: 0, maxShield: 0, lastShieldHit: 0,
      speed: 5.5, baseSpeed: 5.5, lastShot: 0,
      color: '#00f2ff', 
      scoreValue: 0,
      buffs: { overdriveUntil: 0, blitzUntil: 0, invincibleUntil: 0 },
      currentWeapon: 'BLASTER',
      unlockedWeapons: ['BLASTER'],
      currentArenaIndex: 0,
      rpgStats: {
          lvl: 1, xp: 0, maxXp: 1000, upgradePoints: 0,
          statLevels: { damage: 0, health: 0, speed: 0, haste: 0, regen: 0, armor: 0 }
      },
      coins: 0,
      inventory: [],
      equipment: [],
      poisonStacks: 0,
      lastPoisonTick: 0
    } as Tank,
    arenaMatch: {
        friendlyScore: 0,
        enemyScore: 0,
        timeLeft: MATCH_DURATION,
        lastTick: Date.now(), // Initialize with current time
        isOver: false
    },
    globalEffect: {
        slowEnemiesUntil: 0
    },
    npcs: [] as Tank[],
    bullets: [] as Bullet[],
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    lootBoxes: [] as LootBox[],
    floatingTexts: [] as FloatingText[],
    shake: 0,
    viewport: { w: 800, h: 600 }
  });

  // --- Physics Helpers ---
  const isRectCollision = (obj1: GameObject, obj2: GameObject) => {
    return (
        Math.abs(obj1.x - obj2.x) < (obj1.width + obj2.width) / 2 &&
        Math.abs(obj1.y - obj2.y) < (obj1.height + obj2.height) / 2
    );
  };

  const checkCollision = (obj: GameObject) => {
      for (const obs of state.current.obstacles) {
          if (isRectCollision(obj, obs)) return true;
      }
      return false;
  };

  const createExplosion = (x: number, y: number, color: string, count: number, type: 'spark' | 'ring' | 'smoke' | 'debris' | 'coin' = 'spark') => {
      if (type === 'ring') {
         state.current.particles.push({ x, y, vx: 0, vy: 0, life: 1, color, type: 'ring', size: 10 });
      }
      for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = Math.random() * 4 + 2;
          state.current.particles.push({ 
              x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, 
              life: 1.0, color, type: type === 'ring' ? 'spark' : type as any, size: Math.random() * 3 + 2 
          });
      }
  };

  // --- Inventory Helpers (Stacking Logic) ---
  const addItemToInventory = (item: GameItem) => {
      const p = state.current.player;
      // Check for existing stack
      const existingItem = p.inventory.find(i => i.id === item.id);
      
      if (existingItem) {
          existingItem.count = (existingItem.count || 1) + 1;
          createFloatingText(p.x, p.y - 80, `获得: ${item.name} x${existingItem.count}`, RANK_COLORS[item.rank]);
      } else {
          p.inventory.push({ ...item, uid: Math.random().toString(36), count: 1 });
          createFloatingText(p.x, p.y - 80, `获得新装备: ${item.name}`, RANK_COLORS[item.rank]);
      }
  };

  const handleCheatCode = () => {
      if (cheatCode === 'haoshuai') {
          const p = state.current.player;
          p.coins = 999999999;
          setPlayerUI(prev => ({ ...prev, coins: p.coins }));
          createFloatingText(p.x, p.y - 80, "CHEAT ACTIVATED: INFINITE WEALTH", "#ffd700");
          createExplosion(p.x, p.y, '#ffd700', 50, 'coin');
          setCheatCode('');
      }
  };

  // --- Upgrade Logic ---
  const calculateStats = (p: Tank) => {
      // 1. Base RPG Stats
      if (!p.rpgStats) return;
      const stats = p.rpgStats.statLevels;
      
      let finalMaxHp = PLAYER_BASE_HP * (1 + stats.health * 0.15);
      let finalSpeed = 5.5 * (1 + stats.speed * 0.05);
      let finalMaxShield = 0;

      // 2. Equipment Stats
      p.equipment.forEach(item => {
          if (item.shieldMax) finalMaxShield += item.shieldMax;
          if (item.speedMod) finalSpeed *= (1 + item.speedMod);
      });

      p.maxHp = finalMaxHp;
      p.baseSpeed = finalSpeed;
      p.maxShield = finalMaxShield;
      if (p.shield > p.maxShield) p.shield = p.maxShield;
  };

  const performUpgrade = (stat: 'damage' | 'health' | 'speed' | 'haste' | 'regen' | 'armor') => {
      const p = state.current.player;
      if (p.rpgStats && p.rpgStats.upgradePoints > 0) {
          p.rpgStats.upgradePoints--;
          p.rpgStats.statLevels[stat]++;
          calculateStats(p);
          
          // Heal slightly on health upgrade
          if (stat === 'health') {
              p.hp += 200;
              if (p.hp > p.maxHp) p.hp = p.maxHp;
          }
          
          // Sync UI
          setPlayerUI(prev => ({ ...prev, hp: p.hp, maxHp: p.maxHp, shield: p.shield, maxShield: p.maxShield, upgradePoints: p.rpgStats!.upgradePoints }));
          
          const labelMap: any = {
              damage: '武器系统', health: '纳米装甲', speed: '引擎核心',
              haste: '循环供弹', regen: '生化再生', armor: '泰坦镀层'
          };
          createFloatingText(p.x, p.y - 60, `升级完成: ${labelMap[stat]}`, '#00f2ff');
      }
  };

  // --- Save / Load System ---

  const saveProgress = () => {
    const p = state.current.player;
    const isDead = gameOver || p.hp <= 0;

    const saveData = {
        player: isDead ? { ...p, hp: p.maxHp, x: ARENAS[0].x, y: ARENAS[0].y } : p,
        npcs: isDead ? [] : state.current.npcs,
        bullets: isDead ? [] : state.current.bullets,
        obstacles: state.current.obstacles,
        particles: state.current.particles,
        lootBoxes: isDead ? [] : state.current.lootBoxes,
        score: score, 
        arenaMatch: isDead ? {
            friendlyScore: 0,
            enemyScore: 0,
            timeLeft: MATCH_DURATION,
            lastTick: Date.now(),
            isOver: false
        } : state.current.arenaMatch
    };
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    } catch (e) {
        console.error("Failed to save game", e);
    }
  };

  const loadProgress = (): boolean => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
        const data = JSON.parse(raw);
        const defaultRpg = { lvl: 1, xp: 0, maxXp: 1000, upgradePoints: 0, statLevels: { damage: 0, health: 0, speed: 0, haste: 0, regen: 0, armor: 0 } };
        
        const loadedPlayer = { 
            ...data.player, 
            buffs: data.player.buffs || { overdriveUntil: 0, blitzUntil: 0, invincibleUntil: 0 }, 
            baseSpeed: 5.5, 
            currentWeapon: data.player.currentWeapon || 'BLASTER',
            unlockedWeapons: data.player.unlockedWeapons || ['BLASTER'],
            rpgStats: { ...defaultRpg, ...data.player.rpgStats },
            inventory: data.player.inventory || [],
            equipment: data.player.equipment || [],
            coins: data.player.coins || 0,
            shield: data.player.shield || 0,
            maxShield: data.player.maxShield || 0,
            lastShieldHit: 0,
            poisonStacks: 0
        };
        
        // Fix potential missing counts in old saves
        loadedPlayer.inventory.forEach((i: any) => { if(!i.count) i.count = 1; });

        calculateStats(loadedPlayer);
        if (!loadedPlayer.hp || loadedPlayer.hp <= 0) loadedPlayer.hp = loadedPlayer.maxHp;

        state.current.player = loadedPlayer;
        state.current.npcs = data.npcs.map((n: any) => ({...n, buffs: { overdriveUntil: 0, blitzUntil: 0, invincibleUntil: 0 }, baseSpeed: n.speed, shield: 0, maxShield: 0, poisonStacks: 0}));
        state.current.bullets = data.bullets || [];
        state.current.obstacles = data.obstacles || [];
        state.current.particles = data.particles || [];
        state.current.lootBoxes = data.lootBoxes || [];
        
        if (data.arenaMatch) {
            state.current.arenaMatch = { ...data.arenaMatch, lastTick: Date.now() };
        }

        setScore(data.score || 0);
        setPlayerUI({
            hp: loadedPlayer.hp,
            maxHp: loadedPlayer.maxHp,
            shield: loadedPlayer.shield,
            maxShield: loadedPlayer.maxShield,
            xp: loadedPlayer.rpgStats.xp,
            maxXp: loadedPlayer.rpgStats.maxXp,
            level: loadedPlayer.rpgStats.lvl,
            upgradePoints: loadedPlayer.rpgStats.upgradePoints,
            coins: loadedPlayer.coins
        });
        setActiveWeapon(loadedPlayer.currentWeapon);
        setUnlockedWeapons(loadedPlayer.unlockedWeapons);
        return true;
    } catch (e) {
        console.error("Failed to load save", e);
        return false;
    }
  };

  const handleExit = () => {
      saveProgress();
      onBack();
  };

  const handleSokoban = () => {
      saveProgress();
      onSokoban();
  };

  const getRandomPositionInArena = (arenaIndex: number) => {
    const arena = ARENAS[arenaIndex];
    const r = Math.random() * (ARENA_RADIUS - 150);
    const theta = Math.random() * Math.PI * 2;
    return { 
        x: arena.x + r * Math.cos(theta), 
        y: arena.y + r * Math.sin(theta) 
    };
  };

  const initLevel = (clearSave = false) => {
    if (clearSave) {
        localStorage.removeItem(SAVE_KEY);
    }

    state.current.npcs = [];
    state.current.bullets = [];
    state.current.obstacles = [];
    state.current.particles = [];
    state.current.lootBoxes = [];
    state.current.floatingTexts = [];
    lastMythicSpawn.current = Date.now(); 
    state.current.arenaMatch = {
        friendlyScore: 0,
        enemyScore: 0,
        timeLeft: MATCH_DURATION,
        lastTick: Date.now(),
        isOver: false
    };
    
    state.current.player.x = ARENAS[0].x;
    state.current.player.y = ARENAS[0].y;
    state.current.player.buffs = { overdriveUntil: 0, blitzUntil: 0, invincibleUntil: 0 };
    
    if (clearSave) {
        state.current.player.currentWeapon = 'BLASTER';
        state.current.player.unlockedWeapons = ['BLASTER'];
        state.current.player.rpgStats = {
            lvl: 1, xp: 0, maxXp: 1000, upgradePoints: 0,
            statLevels: { damage: 0, health: 0, speed: 0, haste: 0, regen: 0, armor: 0 }
        };
        state.current.player.inventory = [];
        state.current.player.equipment = [];
        state.current.player.coins = 0;
    }
    
    calculateStats(state.current.player);
    state.current.player.hp = state.current.player.maxHp;
    state.current.player.shield = state.current.player.maxShield;
    
    setPlayerUI({
        hp: state.current.player.hp,
        maxHp: state.current.player.maxHp,
        shield: state.current.player.shield,
        maxShield: state.current.player.maxShield,
        xp: state.current.player.rpgStats!.xp,
        maxXp: state.current.player.rpgStats!.maxXp,
        level: state.current.player.rpgStats!.lvl,
        upgradePoints: state.current.player.rpgStats!.upgradePoints,
        coins: state.current.player.coins
    });

    setGameOver(false);
    setScore(0);
    setActiveWeapon(state.current.player.currentWeapon);
    setUnlockedWeapons(state.current.player.unlockedWeapons);

    ARENAS.forEach(arena => {
        if (arena.id === 0) {
            const size = 600;
            const wallThick = 40;
            state.current.obstacles.push({ x: arena.x, y: arena.y - size/2, width: size, height: wallThick, rotation: 0, type: 'hard' }); 
            state.current.obstacles.push({ x: arena.x - 200, y: arena.y + size/2, width: size/2 - 50, height: wallThick, rotation: 0, type: 'hard' }); 
            state.current.obstacles.push({ x: arena.x + 200, y: arena.y + size/2, width: size/2 - 50, height: wallThick, rotation: 0, type: 'hard' }); 
            state.current.obstacles.push({ x: arena.x - size/2, y: arena.y, width: wallThick, height: size, rotation: 0, type: 'hard' }); 
            state.current.obstacles.push({ x: arena.x + size/2, y: arena.y, width: wallThick, height: size, rotation: 0, type: 'hard' }); 
            state.current.obstacles.push({ x: arena.x - 180, y: arena.y - 180, width: 100, height: 100, rotation: 0, type: 'soft' }); 
            state.current.obstacles.push({ x: arena.x + 180, y: arena.y - 180, width: 100, height: 100, rotation: 0, type: 'soft' });
            return;
        }

        const isCore = arena.id === OUTER_COUNT;
        
        if (isCore) {
            const gapSize = 300;
            const wallThickness = 80;
            for (let y = -ARENA_RADIUS + 100; y < ARENA_RADIUS - 100; y += 80) {
                if (Math.abs(y) < gapSize / 2) continue; 
                state.current.obstacles.push({
                    x: arena.x, 
                    y: arena.y + y,
                    width: wallThickness,
                    height: 80,
                    rotation: 0,
                    type: 'hard'
                });
            }
            state.current.obstacles.push({ x: arena.x - 400, y: arena.y - 400, width: 100, height: 100, rotation: 0, type: 'soft' });
            state.current.obstacles.push({ x: arena.x - 400, y: arena.y + 400, width: 100, height: 100, rotation: 0, type: 'soft' });
            state.current.obstacles.push({ x: arena.x + 400, y: arena.y - 400, width: 100, height: 100, rotation: 0, type: 'soft' });
            state.current.obstacles.push({ x: arena.x + 400, y: arena.y + 400, width: 100, height: 100, rotation: 0, type: 'soft' });

        } else {
            const count = 12 + (arena.id % 3) * 5; 
            for (let i = 0; i < count; i++) {
              const pos = getRandomPositionInArena(arena.id);
              if (Math.hypot(pos.x - arena.x, pos.y - arena.y) < 300) continue;
              state.current.obstacles.push({
                x: pos.x, y: pos.y,
                width: Math.random() > 0.8 ? GRID_SIZE : GRID_SIZE * 0.8,
                height: Math.random() > 0.8 ? GRID_SIZE : GRID_SIZE * 0.8,
                rotation: 0,
                type: Math.random() > 0.4 ? 'soft' : 'hard'
              });
            }
        }
    });

    ARENAS.forEach((arena) => {
        if (arena.id === 0) return;
        if (arena.id === OUTER_COUNT) {
            spawnArenaTeams(arena.id);
        } else {
            const count = 3 + arena.difficulty;
            spawnNPCsForArena(arena.id, count);
        }
    });
  };

  const spawnArenaTeams = (arenaId: number) => {
      for(let i=0; i<6; i++) {
          const y = (Math.random() - 0.5) * 1200;
          const x = -600 - Math.random() * 400;
          spawnSpecificNPC('friendly', arenaId, x, y, 'ALLY_TANK');
      }
      for(let i=0; i<8; i++) {
          const y = (Math.random() - 0.5) * 1200;
          const x = 600 + Math.random() * 400;
          spawnSpecificNPC('enemy', arenaId, x, y, 'INTERCEPTOR');
      }
      spawnSpecificNPC('enemy', arenaId, 900, 0, 'GOLIATH');
  };

  const spawnNPCsForArena = (arenaId: number, count: number) => {
      for(let i=0; i<count; i++) spawnNPC('enemy', arenaId);
  };

  const spawnSpecificNPC = (alignment: Alignment, arenaId: number, offsetX: number, offsetY: number, type: EnemyType) => {
      const arena = ARENAS[arenaId];
      const weps: WeaponType[] = ['BLASTER', 'SHOTGUN', 'MINIGUN', 'MISSILE', 'PLASMA', 'LASER'];
      let weapon = weps[Math.floor(Math.random() * weps.length)];
      
      let config = { hp: 150, speed: 3.5, size: 40, color: '#fff', score: 100, damage: 10 };
      if (alignment === 'friendly') {
          config = { hp: 400, speed: 4.0, size: 44, color: '#22c55e', score: 0, damage: 15 };
      } else {
          switch(type) {
              case 'GOLIATH': config = { hp: 3500, speed: 1.8, size: 110, color: '#d946ef', score: 10000, damage: 40 }; break;
              case 'INTERCEPTOR': config = { hp: 180, speed: 6.0, size: 38, color: '#f43f5e', score: 500, damage: 12 }; break;
              case 'SPIDER': config = { hp: 80, speed: 6.5, size: 30, color: '#a3e635', score: 300, damage: 15 }; break;
              case 'TURRET': 
                  config = { hp: 600, speed: 0, size: 50, color: '#6366f1', score: 800, damage: 30 }; 
                  weapon = Math.random() > 0.5 ? 'SNIPER' : 'MISSILE';
                  break;
              default: config = { hp: 150, speed: 4.5, size: 40, color: '#ef4444', score: 300, damage: 10 };
          }
      }

      state.current.npcs.push({
        id: 'npc-' + Math.random(),
        enemyType: type, alignment,
        x: arena.x + offsetX, y: arena.y + offsetY,
        width: config.size, height: config.size,
        rotation: alignment === 'friendly' ? 0 : Math.PI,
        type: 'npc', hp: config.hp, maxHp: config.hp,
        shield: 0, maxShield: 0, lastShieldHit: 0,
        speed: config.speed, baseSpeed: config.speed, lastShot: 0,
        color: config.color, scoreValue: config.score, isAggressive: true,
        buffs: { overdriveUntil: 0, blitzUntil: 0, invincibleUntil: 0 },
        currentArenaIndex: arenaId,
        currentWeapon: weapon,
        unlockedWeapons: [weapon],
        inventory: [], equipment: [], coins: 0, poisonStacks: 0, lastPoisonTick: 0
      });
  };

  const spawnMythicBoss = () => {
      const validArenas = ARENAS.filter(a => a.id !== 0);
      const arena = validArenas[Math.floor(Math.random() * validArenas.length)];
      
      const pos = getRandomPositionInArena(arena.id);
      const size = 280;
      
      state.current.npcs.push({
          id: 'MYTHIC-' + Math.random(),
          enemyType: 'MYTHIC_BOSS',
          alignment: 'enemy',
          x: pos.x, y: pos.y,
          width: size, height: size,
          rotation: Math.random() * Math.PI * 2,
          type: 'npc',
          hp: 50000, maxHp: 50000,
          shield: 5000, maxShield: 5000, lastShieldHit: 0,
          speed: 1.5, baseSpeed: 1.5, 
          lastShot: 0,
          color: '#ffd700', 
          scoreValue: 50000,
          isAggressive: true,
          buffs: { overdriveUntil: 0, blitzUntil: 0, invincibleUntil: 0 },
          currentArenaIndex: arena.id,
          currentWeapon: 'BLASTER', 
          unlockedWeapons: ['BLASTER'],
          inventory: [], equipment: [], coins: 0, poisonStacks: 0, lastPoisonTick: 0
      });
      
      createFloatingText(pos.x, pos.y - 200, "WARNING: MYTHIC CLASS DETECTED", "#ffd700");
      createExplosion(pos.x, pos.y, '#ffd700', 50, 'ring');
  };

  const spawnNPC = (alignment: Alignment, arenaId: number) => {
    const diff = ARENAS[arenaId].difficulty;
    let possibleTypes: EnemyType[] = ['RAIDER', 'NEUTRAL_DRONE'];
    
    if (diff === 1) possibleTypes = ['RAIDER', 'SPIDER'];
    if (diff === 2) possibleTypes = ['RAIDER', 'INTERCEPTOR', 'SPIDER'];
    if (diff === 3) possibleTypes = ['INTERCEPTOR', 'GUARDIAN', 'TURRET'];
    if (diff === 4) possibleTypes = ['GUARDIAN', 'WRAITH', 'TURRET'];
    if (diff === 5) possibleTypes = ['GOLIATH', 'WRAITH', 'SPIDER', 'TURRET'];

    let eType = possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    let config = { hp: 60, speed: 3.0, size: 40, color: '#ef4444', score: 200, damage: 8 }; 
    let weapon: WeaponType = 'BLASTER';

    if (alignment === 'friendly') {
      eType = 'GUARDIAN';
      config = { hp: 300, speed: 4.5, size: 40, color: '#f59e0b', score: 0, damage: 12 }; 
    } else if (alignment === 'neutral') {
      eType = 'NEUTRAL_DRONE';
      config = { hp: 80, speed: 1.5, size: 30, color: '#94a3b8', score: 50, damage: 4 }; 
    } else {
      switch(eType) {
        case 'RAIDER': config = { hp: 60 + diff*15, speed: 3.5, size: 40, color: '#ef4444', score: 200, damage: 8 + diff*2 }; break;
        case 'NEUTRAL_DRONE': config = { hp: 50, speed: 1.5, size: 30, color: '#94a3b8', score: 50, damage: 4 }; break;
        case 'INTERCEPTOR': config = { hp: 120 + diff*20, speed: 6.0, size: 34, color: '#f43f5e', score: 400, damage: 10 + diff*2 }; break;
        case 'GUARDIAN': config = { hp: 300 + diff*40, speed: 2.2, size: 55, color: '#f97316', score: 600, damage: 15 + diff*3 }; break;
        case 'GOLIATH': config = { hp: 3500, speed: 1.5, size: 110, color: '#d946ef', score: 10000, damage: 45 }; break;
        case 'WRAITH': config = { hp: 180 + diff*20, speed: 4.0, size: 42, color: '#10b981', score: 800, damage: 18 + diff*2 }; break;
        case 'SPIDER': config = { hp: 60 + diff*10, speed: 6.5, size: 28, color: '#a3e635', score: 250, damage: 15 }; break;
        case 'TURRET': 
             config = { hp: 500 + diff*50, speed: 0, size: 48, color: '#6366f1', score: 700, damage: 25 }; 
             weapon = Math.random() > 0.5 ? 'SNIPER' : 'MISSILE';
             break;
      }
    }

    let spawnX = 0, spawnY = 0;
    let attempts = 0;
    while(attempts < 10) {
      const pos = getRandomPositionInArena(arenaId);
      spawnX = pos.x;
      spawnY = pos.y;
      
      const distToPlayer = Math.hypot(spawnX - state.current.player.x, spawnY - state.current.player.y);
      if (distToPlayer < 600) {
        attempts++;
        continue;
      }
      
      const tempObj = { x: spawnX, y: spawnY, width: config.size, height: config.size, rotation: 0 };
      if (!checkCollision(tempObj)) break;
      attempts++;
    }

    state.current.npcs.push({
      id: 'npc-' + Math.random(),
      enemyType: eType, alignment,
      x: spawnX, y: spawnY,
      width: config.size, height: config.size,
      rotation: Math.random() * Math.PI * 2,
      type: 'npc', hp: config.hp, maxHp: config.hp,
      shield: 0, maxShield: 0, lastShieldHit: 0,
      speed: config.speed, baseSpeed: config.speed, lastShot: 0,
      color: config.color, scoreValue: config.score, isAggressive: false,
      buffs: { overdriveUntil: 0, blitzUntil: 0, invincibleUntil: 0 },
      currentArenaIndex: arenaId,
      currentWeapon: weapon,
      unlockedWeapons: [weapon],
      inventory: [], equipment: [], coins: 0, poisonStacks: 0, lastPoisonTick: 0
    });
  };

  const spawnLootBox = (x: number, y: number) => {
      if (Math.random() > 0.4) return;
      
      const rand = Math.random();
      let type: BoxType = 'WOODEN';
      
      if (rand > 0.95) type = 'DIAMOND';
      else if (rand > 0.85) type = 'GOLDEN';
      else if (rand > 0.70) type = 'STANDARD';
      else type = 'WOODEN';

      state.current.lootBoxes.push({
          id: 'loot-' + Math.random(),
          x, y, width: 30, height: 30, rotation: 0,
          spawnTime: Date.now(),
          type
      });
  };

  const createFloatingText = (x: number, y: number, text: string, color: string) => {
      state.current.floatingTexts.push({
          id: Math.random().toString(),
          x, y, text, color,
          life: 1.0,
          vy: -2 
      });
  };

  const createHitEffect = (x: number, y: number, color: string) => {
     for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 3 + 2;
        state.current.particles.push({ 
            x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, 
            life: 1, color: '#fff', type: 'spark', size: Math.random() * 2 + 1 
        });
     }
  };

  const createDeathEffect = (x: number, y: number, color: string, size: number) => {
    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 8 + 2;
      state.current.particles.push({ 
        x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, 
        life: 1.5 + Math.random(), color: color, type: 'debris', 
        size: Math.random() * (size / 4) + 4,
        rotation: Math.random() * Math.PI, rotSpeed: (Math.random() - 0.5) * 0.5
      });
    }
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 12 + 1;
        state.current.particles.push({ 
            x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, 
            life: 0.8 + Math.random() * 0.5, color: '#fbbf24', type: 'spark', 
            size: Math.random() * 4 + 2 
        });
    }
    state.current.particles.push({ x, y, vx: 0, vy: 0, life: 1, color: '#fff', type: 'ring', size: 10 });
    for(let i=0; i<8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 2;
        state.current.particles.push({ 
            x, y, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd, 
            life: 2.0, color: '#333', type: 'smoke', size: Math.random() * 10 + 10 
        });
    }
    state.current.shake = Math.min(25, state.current.shake + 10);
  };

  useEffect(() => {
    const loaded = loadProgress();
    if (!loaded) { 
        initLevel(false); 
    } else {
        const am = state.current.arenaMatch;
        setArenaMatchUI({
            friendlyScore: am.friendlyScore,
            enemyScore: am.enemyScore,
            timeLeft: am.timeLeft,
            result: am.isOver ? (am.friendlyScore > am.enemyScore ? 'VICTORY' : 'DEFEAT') : 'NONE'
        });
    }
    
    state.current.arenaMatch.lastTick = Date.now();

    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        state.current.viewport.w = containerRef.current.clientWidth;
        state.current.viewport.h = containerRef.current.clientHeight;
        canvasRef.current.width = state.current.viewport.w;
        canvasRef.current.height = state.current.viewport.h;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    const handleKeyDown = (e: KeyboardEvent) => {
        keys.current[e.code] = true;
        if (e.code === 'KeyQ') {
            const p = state.current.player;
            const currentIndex = p.unlockedWeapons.indexOf(p.currentWeapon);
            const nextIndex = (currentIndex + 1) % p.unlockedWeapons.length;
            p.currentWeapon = p.unlockedWeapons[nextIndex];
            setActiveWeapon(p.currentWeapon);
            createFloatingText(p.x, p.y - 50, `WEAPON: ${WEAPONS[p.currentWeapon].name}`, '#fff');
        }
        if (e.code === 'KeyC') {
            setShowUpgradePanel(prev => !prev);
            setShowBag(false);
        }
        if (e.code === 'KeyB') {
            setShowBag(prev => !prev);
            setShowUpgradePanel(false);
        }
        if (e.code === 'KeyF' && canEnterAscensionRef.current) {
            setShowUpgradePanel(true);
        }
        if (/Digit[1-9]/.test(e.code)) {
            const idx = parseInt(e.code.replace('Digit', '')) - 1;
            const p = state.current.player;
            if (idx < p.unlockedWeapons.length) {
                p.currentWeapon = p.unlockedWeapons[idx];
                setActiveWeapon(p.currentWeapon);
                createFloatingText(p.x, p.y - 50, `WEAPON: ${WEAPONS[p.currentWeapon].name}`, '#fff');
            }
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => keys.current[e.code] = false;
    const handleMouseMove = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    const handleMouseDown = () => keys.current['MouseDown'] = true;
    const handleMouseUp = () => keys.current['MouseDown'] = false;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const ctx = canvasRef.current?.getContext('2d');
    let animationId: number;

    const enforceMapBoundaries = (obj: any) => {
        let nearestArena = ARENAS[0];
        let minDist = Infinity;
        
        for (const arena of ARENAS) {
            const d = Math.hypot(obj.x - arena.x, obj.y - arena.y);
            if (d < minDist) {
                minDist = d;
                nearestArena = arena;
            }
        }

        if (minDist <= ARENA_RADIUS - obj.width/2) {
            return { inside: true, arenaId: nearestArena.id };
        }

        for (const [id1, id2] of BRIDGES) {
            const a1 = ARENAS[id1];
            const a2 = ARENAS[id2];
            
            if (Math.hypot(obj.x - a1.x, obj.y - a1.y) > ORBIT_RADIUS * 2.5 && 
                Math.hypot(obj.x - a2.x, obj.y - a2.y) > ORBIT_RADIUS * 2.5) continue;

            const dx = a2.x - a1.x;
            const dy = a2.y - a1.y;
            const len = Math.hypot(dx, dy);
            const u = ((obj.x - a1.x) * dx + (obj.y - a1.y) * dy) / (len * len);
            
            if (u >= 0 && u <= 1) {
                const px = a1.x + u * dx;
                const py = a1.y + u * dy;
                const distToLine = Math.hypot(obj.x - px, obj.y - py);
                if (distToLine < BRIDGE_WIDTH / 2 - obj.width/2) {
                    return { inside: true, arenaId: -1 }; 
                }
            }
        }

        const angle = Math.atan2(obj.y - nearestArena.y, obj.x - nearestArena.x);
        obj.x = nearestArena.x + Math.cos(angle) * (ARENA_RADIUS - obj.width/2);
        obj.y = nearestArena.y + Math.sin(angle) * (ARENA_RADIUS - obj.width/2);
        
        return { inside: false, arenaId: nearestArena.id };
    };

    const update = () => {
      if (gameOver) return;
      const p = state.current.player;
      const now = Date.now();
      const { w, h } = state.current.viewport;

      const boundaryCheck = enforceMapBoundaries(p);
      
      if (boundaryCheck.arenaId !== -1) {
          currentArenaRef.current = boundaryCheck.arenaId;
      }
      
      if (boundaryCheck.arenaId !== -1 && boundaryCheck.arenaId !== currentArena) {
          setCurrentArena(boundaryCheck.arenaId);
      }

      const ascX = ARENAS[0].x + 300;
      const ascY = ARENAS[0].y;
      const distAsc = Math.hypot(p.x - ascX, p.y - ascY);
      const inAsc = distAsc < 100;

      if (inAsc !== canEnterAscensionRef.current) {
          canEnterAscensionRef.current = inAsc;
          setCanEnterAscension(inAsc);
      }

      if (now - lastMythicSpawn.current > 300000) { 
          spawnMythicBoss();
          lastMythicSpawn.current = now;
      }

      const am = state.current.arenaMatch;
      const inArena = currentArenaRef.current === OUTER_COUNT;
      
      if (inArena && !am.isOver) {
          am.timeLeft -= (now - am.lastTick);
          if (am.timeLeft <= 0) {
              am.timeLeft = 0;
              am.isOver = true;
              let result: 'VICTORY' | 'DEFEAT' | 'NONE' = 'NONE';
              if (am.friendlyScore > am.enemyScore) result = 'VICTORY';
              else if (am.enemyScore > am.friendlyScore) result = 'DEFEAT';
              setArenaMatchUI(prev => ({ ...prev, result }));
          }
      }
      am.lastTick = now;
      
      if (Math.abs(am.timeLeft - arenaMatchUI.timeLeft) > 900 || am.friendlyScore !== arenaMatchUI.friendlyScore || am.enemyScore !== arenaMatchUI.enemyScore) {
          setArenaMatchUI(prev => ({
              ...prev,
              timeLeft: am.timeLeft,
              friendlyScore: am.friendlyScore,
              enemyScore: am.enemyScore
          }));
      }

      let currentSpeed = p.baseSpeed;
      let damageMultiplier = 1;
      let weapon = WEAPONS[p.currentWeapon];
      let fireRateDelay = weapon.cooldown;

      if (p.rpgStats) {
          damageMultiplier *= (1 + p.rpgStats.statLevels.damage * 0.1); 
          fireRateDelay *= (1 - p.rpgStats.statLevels.haste * 0.05); 
      }

      let extraRegen = 0;
      let bulletSizeMult = 1;

      p.equipment.forEach(item => {
          if (item.fireRateMod) fireRateDelay *= (1 - item.fireRateMod);
          if (item.damageMod) damageMultiplier *= item.damageMod; 
          if (item.regenMod) extraRegen += item.regenMod;
          if (item.bulletSizeMod) bulletSizeMult *= item.bulletSizeMod;
      });

      if (p.maxShield > 0 && p.shield < p.maxShield && now - p.lastShieldHit > 5000) {
          p.shield = Math.min(p.maxShield, p.shield + 2 + extraRegen * 0.1); 
      }

      if (p.hp < p.maxHp) {
          const rpgRegen = p.rpgStats ? p.rpgStats.statLevels.regen * 0.2 : 0;
          const totalRegen = rpgRegen + extraRegen;
          if (totalRegen > 0) p.hp = Math.min(p.maxHp, p.hp + totalRegen);
      }

      if (now < p.buffs.overdriveUntil) damageMultiplier *= 2;
      if (now < p.buffs.blitzUntil) {
          currentSpeed *= 1.5;
          fireRateDelay *= 0.6;
      }
      p.speed = currentSpeed;

      const dx = mousePos.current.x - w / 2;
      const dy = mousePos.current.y - h / 2;
      p.rotation = Math.atan2(dy, dx);

      const isMoving = keys.current['KeyW'] || keys.current['ArrowUp'] || keys.current['MouseDown'];
      if (isMoving) {
        const prevX = p.x; const prevY = p.y;
        p.x += Math.cos(p.rotation) * p.speed;
        p.y += Math.sin(p.rotation) * p.speed;
        
        if (checkCollision(p)) { p.x = prevX; p.y = prevY; }
        enforceMapBoundaries(p);
      }

      if ((keys.current['Space'] || keys.current['KeyJ']) && Date.now() - p.lastShot > fireRateDelay) {
        const count = weapon.count;
        const spread = weapon.spread;
        
        let totalPoison = 0;
        p.equipment.forEach(item => {
            if (item.poisonLevel) totalPoison += item.poisonLevel;
        });

        for (let i = 0; i < count; i++) {
            const angleOffset = spread > 0 ? (i - (count - 1) / 2) * spread : 0;
            const finalAngle = p.rotation + angleOffset + (Math.random() - 0.5) * 0.05; 

            state.current.bullets.push({
              id: 'b-' + Math.random(), 
              x: p.x + Math.cos(p.rotation) * 20, 
              y: p.y + Math.sin(p.rotation) * 20, 
              width: 8 * bulletSizeMult, height: 8 * bulletSizeMult,
              rotation: finalAngle, 
              ownerId: 'player', 
              ownerAlignment: 'friendly', 
              speed: weapon.speed, 
              damage: weapon.damage * damageMultiplier, 
              color: damageMultiplier > 1 ? '#ef4444' : weapon.color, 
              isSuper: damageMultiplier > 1,
              maxDist: weapon.range ? weapon.range : 1200,
              startPos: { x: p.x, y: p.y },
              isExplosive: weapon.isExplosive,
              isHoming: weapon.isHoming,
              growRate: weapon.growRate,
              piercing: weapon.piercing,
              hitList: [],
              seed: Math.random(),
              poisonLevel: totalPoison
            });
        }
        p.lastShot = Date.now();
        p.x -= Math.cos(p.rotation) * 2;
        p.y -= Math.sin(p.rotation) * 2;
      }

      for (let i = state.current.lootBoxes.length - 1; i >= 0; i--) {
          const box = state.current.lootBoxes[i];
          if (isRectCollision(p, box)) {
              const buffDuration = 300000; 
              
              if (box.type === 'WOODEN') {
                   p.hp = Math.min(p.maxHp, p.hp + 100);
                   setPlayerUI(prev => ({ ...prev, hp: p.hp }));
                   setScore(s => s + 500);
                   createFloatingText(p.x, p.y - 40, "SUPPLIES FOUND", "#d97706");
                   createExplosion(p.x, p.y, '#d97706', 12, 'debris');
              } else if (box.type === 'DIAMOND') {
                   p.hp = p.maxHp;
                   p.shield = Math.max(p.shield, p.maxHp * 0.5); 
                   setPlayerUI(prev => ({ ...prev, hp: p.hp, shield: p.shield }));
                   
                   state.current.globalEffect.slowEnemiesUntil = now + 15000; 
                   
                   p.buffs.invincibleUntil = now + buffDuration;
                   p.buffs.overdriveUntil = now + buffDuration;
                   p.buffs.blitzUntil = now + buffDuration;
                   
                   const allWeapons = Object.keys(WEAPONS) as WeaponType[];
                   const missing = allWeapons.filter(w => !p.unlockedWeapons.includes(w));
                   if (missing.length > 0) {
                       const w = missing[Math.floor(Math.random() * missing.length)];
                       p.unlockedWeapons.push(w);
                       setUnlockedWeapons([...p.unlockedWeapons]);
                       createFloatingText(p.x, p.y - 80, `LEGENDARY FIND: ${WEAPONS[w].name}`, '#00f2ff');
                   }
                   
                   createFloatingText(p.x, p.y - 120, "DIVINE HEALING & TIME FREEZE!", "#00f2ff");
                   createExplosion(p.x, p.y, '#00f2ff', 40, 'ring');
              } else if (box.type === 'GOLDEN') {
                   spawnSpecificNPC('friendly', currentArenaRef.current, 100, 100, 'ALLY_TANK');
                   createFloatingText(p.x, p.y - 60, "AI BACKUP ARRIVED!", "#fcd34d");
                   createExplosion(p.x, p.y, '#fcd34d', 20, 'ring');
              } else {
                  const rand = Math.random();
                  const allWeapons = Object.keys(WEAPONS) as WeaponType[];
                  const missingWeapons = allWeapons.filter(w => !p.unlockedWeapons.includes(w));
                  
                  if (missingWeapons.length > 0 && rand < 0.20) {
                      const newWep = missingWeapons[Math.floor(Math.random() * missingWeapons.length)];
                      p.unlockedWeapons.push(newWep);
                      setUnlockedWeapons([...p.unlockedWeapons]);
                      p.currentWeapon = newWep;
                      setActiveWeapon(newWep);
                      createFloatingText(p.x, p.y - 60, `UNLOCKED: ${WEAPONS[newWep].name}!`, WEAPONS[newWep].color);
                      createExplosion(p.x, p.y, WEAPONS[newWep].color, 20, 'ring');
                  } else {
                      if (rand < 0.33) {
                          p.hp = Math.min(p.maxHp, p.hp + 200);
                          setPlayerUI(prev => ({ ...prev, hp: p.hp }));
                          createFloatingText(p.x, p.y - 40, "NANO REPAIR +200", "#22c55e");
                          createExplosion(p.x, p.y, '#22c55e', 10, 'ring');
                      } else if (rand < 0.66) {
                          p.buffs.overdriveUntil = now + buffDuration;
                          createFloatingText(p.x, p.y - 40, "OVERDRIVE ACTIVATED", "#ef4444");
                          createExplosion(p.x, p.y, '#ef4444', 10, 'ring');
                      } else {
                          p.buffs.blitzUntil = now + buffDuration;
                          createFloatingText(p.x, p.y - 40, "BLITZ SYSTEM ONLINE", "#eab308");
                          createExplosion(p.x, p.y, '#eab308', 10, 'ring');
                      }
                  }
              }
              state.current.lootBoxes.splice(i, 1);
          }
      }

      const bulletsToKill = new Set<string>();
      state.current.bullets = state.current.bullets.filter(b => {
        if (bulletsToKill.has(b.id)) return false;

        if (b.isHoming) {
           let nearestTarget = null;
           let minDist = 400; 
           
           if (b.ownerAlignment === 'friendly') {
               for(const npc of state.current.npcs) {
                   if (npc.alignment === 'enemy') {
                       const d = Math.hypot(npc.x - b.x, npc.y - b.y);
                       if (d < minDist) { minDist = d; nearestTarget = npc; }
                   }
               }
           }
           
           if (nearestTarget) {
               const targetAngle = Math.atan2(nearestTarget.y - b.y, nearestTarget.x - b.x);
               let diff = targetAngle - b.rotation;
               while (diff < -Math.PI) diff += Math.PI*2;
               while (diff > Math.PI) diff -= Math.PI*2;
               b.rotation += diff * 0.1; 
           }
        }

        if (b.growRate) {
            b.width += b.growRate;
            b.height += b.growRate;
            b.speed *= 0.95; 
        }

        b.x += Math.cos(b.rotation) * b.speed;
        b.y += Math.sin(b.rotation) * b.speed;
        
        for (const otherB of state.current.bullets) {
          if (b.id !== otherB.id && b.ownerAlignment !== otherB.ownerAlignment) {
            if (Math.hypot(b.x - otherB.x, b.y - otherB.y) < (b.width + otherB.width)/2) {
              if (!b.piercing && (b.pierceCount === undefined || b.pierceCount <= 0)) {
                  bulletsToKill.add(otherB.id);
                  createHitEffect(b.x, b.y, '#fff');
                  return false; 
              }
            }
          }
        }
        
        const distTraveled = Math.hypot(b.x - b.startPos.x, b.y - b.startPos.y);
        if (b.maxDist && distTraveled > b.maxDist) {
            if (!b.growRate) createHitEffect(b.x, b.y, b.color); 
            return false;
        }

        const d = Math.hypot(b.x, b.y);
        if (d > 12000) return false;

        for (const obs of state.current.obstacles) {
            if (isRectCollision(b, obs)) {
                createHitEffect(b.x, b.y, '#9ca3af');
                if (b.isExplosive) {
                    createExplosion(b.x, b.y, b.color, 15, 'smoke');
                    state.current.npcs.forEach(npc => {
                        if (npc.alignment !== b.ownerAlignment && Math.hypot(npc.x - b.x, npc.y - b.y) < 80) {
                            npc.hp -= b.damage * 0.5;
                        }
                    });
                }
                
                if (b.pierceCount && b.pierceCount > 0) {
                    b.pierceCount--;
                    return true; 
                }
                return false;
            }
        }

        for (let i = 0; i < state.current.npcs.length; i++) {
          const npc = state.current.npcs[i];
          if (b.ownerAlignment !== npc.alignment && isRectCollision(b, npc)) {
            if (b.piercing && b.hitList?.includes(npc.id)) continue;
            
            if (npc.alignment === 'neutral') npc.isAggressive = true;
            npc.hp -= b.damage;
            
            if (b.poisonLevel && b.poisonLevel > 0) {
                npc.poisonStacks += b.poisonLevel;
            }
            
            if (b.isExplosive) {
                createExplosion(b.x, b.y, b.color, 15, 'smoke');
                state.current.npcs.forEach(otherNpc => {
                    if (otherNpc.id !== npc.id && otherNpc.alignment !== b.ownerAlignment && Math.hypot(otherNpc.x - b.x, otherNpc.y - b.y) < 80) {
                        otherNpc.hp -= b.damage * 0.6;
                        createFloatingText(otherNpc.x, otherNpc.y, `${Math.round(b.damage*0.6)}`, b.color);
                    }
                });
            } else if (b.growRate) {
                if (Math.random() > 0.7) {
                    state.current.particles.push({ 
                        x: npc.x + (Math.random()-0.5)*20, y: npc.y + (Math.random()-0.5)*20, 
                        vx: 0, vy: -1, life: 0.5, color: '#f97316', type: 'smoke', size: 5 
                    });
                }
            } else {
                createHitEffect(b.x, b.y, npc.color);
            }

            if (npc.hp <= 0) {
              if (npc.alignment === 'enemy') {
                  const val = npc.scoreValue;
                  setScore(s => s + val);
                  
                  const coinDrop = Math.floor(val * 0.1) + Math.floor(Math.random() * 40 + 10);
                  p.coins += coinDrop;
                  createFloatingText(npc.x, npc.y - 40, `+${coinDrop} Z-COIN`, '#fcd34d');
                  for(let c=0; c<5; c++) {
                      state.current.particles.push({
                          x: npc.x, y: npc.y,
                          vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5,
                          life: 1.0, color: '#fcd34d', type: 'coin', size: 4
                      });
                  }

                  if (Math.random() < 0.2) { 
                      const randomItem = SHOP_ITEMS[Math.floor(Math.random() * SHOP_ITEMS.length)];
                      addItemToInventory(randomItem);
                  }
                  
                  if (p.rpgStats) {
                      p.rpgStats.xp += val * 0.8; 
                      if (p.rpgStats.xp >= p.rpgStats.maxXp) {
                          p.rpgStats.xp -= p.rpgStats.maxXp;
                          p.rpgStats.lvl++;
                          p.rpgStats.upgradePoints++;
                          p.rpgStats.maxXp = Math.floor(p.rpgStats.maxXp * 1.2);
                          p.hp = p.maxHp;
                          
                          createFloatingText(p.x, p.y - 80, "LEVEL UP!", "#fcd34d");
                          createExplosion(p.x, p.y, '#fcd34d', 30, 'ring');
                      } else {
                          createFloatingText(p.x, p.y - 20, `+${Math.round(val*0.8)} XP`, "#9ca3af");
                      }
                  }
              }
              createDeathEffect(npc.x, npc.y, npc.color, npc.width);
              spawnLootBox(npc.x, npc.y); 
              
              const arenaId = npc.currentArenaIndex ?? 0;
              state.current.npcs.splice(i, 1);
              
              if (arenaId === OUTER_COUNT && !am.isOver) {
                  if (npc.alignment === 'enemy') am.friendlyScore += 1;
                  else if (npc.alignment === 'friendly') am.enemyScore += 1;
              }

              if (arenaId === OUTER_COUNT) {
                  setTimeout(() => {
                      if (npc.enemyType === 'GOLIATH') spawnSpecificNPC('enemy', arenaId, 900, 0, 'GOLIATH');
                      else spawnSpecificNPC(npc.alignment, arenaId, npc.alignment === 'friendly' ? -800 : 800, (Math.random()-0.5)*1000, npc.enemyType);
                  }, 5000);
              } else if (npc.enemyType !== 'MYTHIC_BOSS') {
                  setTimeout(() => spawnNPC(npc.alignment, arenaId), 3000);
              }
            }

            if (b.piercing) {
                b.hitList?.push(npc.id);
                return true; 
            }
            if (b.pierceCount && b.pierceCount > 0) {
                b.pierceCount--;
                if (!b.hitList) b.hitList = [];
                b.hitList.push(npc.id); 
                return true;
            }

            return false;
          }
        }

        if (b.ownerAlignment !== 'friendly' && isRectCollision(b, p)) {
          if (now < p.buffs.invincibleUntil) {
             createHitEffect(b.x, b.y, '#00f2ff'); 
             return false;
          }

          let damage = b.damage;
          if (p.rpgStats) {
              damage *= (1 - p.rpgStats.statLevels.armor * 0.05); 
          }

          if (p.shield > 0) {
              p.lastShieldHit = now;
              if (p.shield >= damage) {
                  p.shield -= damage;
                  damage = 0;
                  createHitEffect(b.x, b.y, '#60a5fa');
              } else {
                  damage -= p.shield;
                  p.shield = 0;
              }
          }

          if (damage > 0) {
              p.hp -= damage;
              setPlayerUI(prev => ({ ...prev, hp: p.hp, shield: p.shield }));
              createHitEffect(b.x, b.y, '#f43f5e');
              if (p.hp <= 0) {
                  setGameOver(true);
                  createDeathEffect(p.x, p.y, '#f43f5e', p.width);
              }
          } else {
              setPlayerUI(prev => ({ ...prev, shield: p.shield })); 
          }
          
          if (b.pierceCount && b.pierceCount > 0) {
              b.pierceCount--;
              return true;
          }
          return false;
        }
        return true;
      });

      state.current.npcs.forEach(n => {
        if (n.poisonStacks > 0 && now - n.lastPoisonTick > 500) {
            n.hp -= n.poisonStacks;
            n.lastPoisonTick = now;
            createFloatingText(n.x, n.y - 20, `-${n.poisonStacks}`, '#22c55e'); 
        }

        const isSlowed = now < state.current.globalEffect.slowEnemiesUntil && n.alignment === 'enemy';
        const effectiveSpeed = isSlowed ? n.speed * 0.3 : n.speed;

        const npcInArena = n.currentArenaIndex === OUTER_COUNT;
        const playerInArena = currentArenaRef.current === OUTER_COUNT;
        
        if (npcInArena && !playerInArena) return; 

        const distToPlayer = Math.hypot(p.x - n.x, p.y - n.y);
        let target: any = null;
        
        if (n.alignment === 'enemy') {
            const nearestAlly = state.current.npcs.find(other => {
                if (n.currentArenaIndex === OUTER_COUNT && other.currentArenaIndex !== OUTER_COUNT) return false;
                if (n.currentArenaIndex !== OUTER_COUNT && other.currentArenaIndex === OUTER_COUNT) return false;
                
                return other.alignment === 'friendly' && Math.hypot(other.x - n.x, other.y - n.y) < 500
            });
            if (nearestAlly) target = nearestAlly; 
            else {
                if (npcInArena === playerInArena) target = p;
            }
        }
        else if (n.alignment === 'friendly') {
          let closest = null;
          let minD = 1200; 
          for(const other of state.current.npcs) {
            if (n.currentArenaIndex === OUTER_COUNT && other.currentArenaIndex !== OUTER_COUNT) continue;
            if (n.currentArenaIndex !== OUTER_COUNT && other.currentArenaIndex === OUTER_COUNT) continue;

            if (other.alignment === 'enemy') {
              const d = Math.hypot(other.x - n.x, other.y - n.y);
              if (d < minD) { minD = d; closest = other; }
            }
          }
          
          if (closest) target = closest;
          else if (distToPlayer > 180) {
              if (npcInArena === playerInArena) {
                  n.rotation = Math.atan2(p.y - n.y, p.x - n.x);
                  const px = n.x; const py = n.y;
                  n.x += Math.cos(n.rotation) * effectiveSpeed;
                  n.y += Math.sin(n.rotation) * effectiveSpeed;
                  if (checkCollision(n)) { n.x = px; n.y = py; n.rotation += Math.PI/2; }
                  enforceMapBoundaries(n);
              }
          }
        } else if (n.alignment === 'neutral' && !n.isAggressive) {
          n.rotation += (Math.random() - 0.5) * 0.05;
          const px = n.x; const py = n.y;
          n.x += Math.cos(n.rotation) * effectiveSpeed;
          n.y += Math.sin(n.rotation) * effectiveSpeed;
          if (checkCollision(n)) { n.x = px; n.y = py; n.rotation += Math.PI; }
          enforceMapBoundaries(n);
        }

        if (target) {
          const tDist = Math.hypot(target.x - n.x, target.y - n.y);
          n.rotation = Math.atan2(target.y - n.y, target.x - n.x);
          
          const willBeInCore = enforceMapBoundaries({x: n.x + Math.cos(n.rotation)*effectiveSpeed, y: n.y + Math.sin(n.rotation)*effectiveSpeed, width: n.width, height: n.height}).arenaId === OUTER_COUNT;
          const currentlyInOuter = (n.currentArenaIndex !== undefined && n.currentArenaIndex < OUTER_COUNT);
          const currentlyInCore = (n.currentArenaIndex === OUTER_COUNT);
          
          const blockedEntry = currentlyInOuter && willBeInCore;
          const blockedExit = currentlyInCore && !willBeInCore;

          if (tDist > 250 && tDist < 3000 && !blockedEntry && !blockedExit) {
            const px = n.x; const py = n.y;
            n.x += Math.cos(n.rotation) * effectiveSpeed;
            n.y += Math.sin(n.rotation) * effectiveSpeed;
            if (checkCollision(n)) { n.x = px; n.y = py; n.rotation += Math.PI/2; }
            enforceMapBoundaries(n);
          }
          
          const npcWep = WEAPONS[n.currentWeapon];
          const cooldownMult = n.enemyType === 'MYTHIC_BOSS' ? 10.0 : (n.alignment === 'enemy' ? 10.5 : 1.0);

          if (tDist < (npcWep.range || 900) && Date.now() - n.lastShot > npcWep.cooldown * cooldownMult) {
            const count = npcWep.count;
            const spread = npcWep.spread;
            
            const isMythic = n.enemyType === 'MYTHIC_BOSS';
            const bulletSpeed = isMythic ? npcWep.speed * 0.1 : npcWep.speed;
            const bulletSize = isMythic ? 56 : 8; 
            const bulletDamage = isMythic ? 70 : npcWep.damage; 
            const bulletColor = isMythic ? '#ffd700' : (n.alignment === 'friendly' ? '#22c55e' : (n.enemyType === 'GOLIATH' ? '#d946ef' : '#f43f5e'));
            
            for (let i = 0; i < count; i++) {
                const angleOffset = spread > 0 ? (i - (count - 1) / 2) * spread : 0;
                state.current.bullets.push({
                  id: 'b-' + Math.random(), 
                  x: n.x + Math.cos(n.rotation) * 20, 
                  y: n.y + Math.sin(n.rotation) * 20, 
                  width: bulletSize, height: bulletSize,
                  rotation: n.rotation + angleOffset, 
                  ownerId: n.id, 
                  ownerAlignment: n.alignment, 
                  speed: bulletSpeed, 
                  damage: bulletDamage,
                  color: bulletColor,
                  startPos: { x: n.x, y: n.y },
                  isExplosive: npcWep.isExplosive,
                  isHoming: npcWep.isHoming,
                  growRate: npcWep.growRate,
                  pierceCount: isMythic ? 3 : 0 
                });
            }
            n.lastShot = Date.now();
          }
        }
      });

      state.current.particles.forEach(part => { 
        part.x += part.vx; 
        part.y += part.vy; 
        part.life -= part.type === 'debris' ? 0.02 : 0.04; 
        if (part.type === 'debris') {
            part.rotation = (part.rotation || 0) + (part.rotSpeed || 0);
            part.vx *= 0.95; 
            part.vy *= 0.95;
        }
      });
      state.current.particles = state.current.particles.filter(p => p.life > 0);

      state.current.floatingTexts.forEach(ft => {
          ft.y += ft.vy;
          ft.life -= 0.02;
      });
      state.current.floatingTexts = state.current.floatingTexts.filter(ft => ft.life > 0);

      if (state.current.shake > 0) state.current.shake *= 0.9;
      
      if (Math.random() > 0.8 && p.rpgStats) {
          setPlayerUI(prev => ({
              ...prev,
              hp: p.hp,
              maxHp: p.maxHp,
              shield: p.shield,
              maxShield: p.maxShield,
              xp: p.rpgStats!.xp,
              maxXp: p.rpgStats!.maxXp,
              level: p.rpgStats!.lvl,
              upgradePoints: p.rpgStats!.upgradePoints,
              coins: p.coins
          }));
      }
    };

    const drawMinimap = () => {
        const ctxM = minimapRef.current?.getContext('2d');
        if (!ctxM) return;
        const width = minimapRef.current!.width;
        const height = minimapRef.current!.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const mapScale = (width / 2) / (ORBIT_RADIUS + ARENA_RADIUS + 500);

        ctxM.clearRect(0, 0, width, height);

        ctxM.lineWidth = BRIDGE_WIDTH * mapScale;
        ctxM.lineCap = 'round';
        ctxM.strokeStyle = '#334155';
        ctxM.beginPath();
        BRIDGES.forEach(([id1, id2]) => {
            const a1 = ARENAS[id1];
            const a2 = ARENAS[id2];
            const sX = centerX + a1.x * mapScale;
            const sY = centerY + a1.y * mapScale;
            const eX = centerX + a2.x * mapScale;
            const eY = centerY + a2.y * mapScale;
            ctxM.moveTo(sX, sY);
            ctxM.lineTo(eX, eY);
        });
        ctxM.stroke();

        ARENAS.forEach(arena => {
             const x = centerX + arena.x * mapScale;
             const y = centerY + arena.y * mapScale;
             
             ctxM.fillStyle = arena.color;
             ctxM.beginPath(); ctxM.arc(x, y, ARENA_RADIUS * mapScale, 0, Math.PI * 2); ctxM.fill();
             
             ctxM.strokeStyle = arena.id === currentArena ? '#00f2ff' : 'rgba(255,255,255,0.2)';
             ctxM.lineWidth = 1;
             ctxM.beginPath(); ctxM.arc(x, y, ARENA_RADIUS * mapScale, 0, Math.PI * 2); ctxM.stroke();
        });

        const p = state.current.player;
        const px = centerX + p.x * mapScale;
        const py = centerY + p.y * mapScale;
        
        ctxM.fillStyle = '#00f2ff';
        ctxM.shadowColor = '#00f2ff'; ctxM.shadowBlur = 5;
        ctxM.beginPath(); ctxM.arc(px, py, 3, 0, Math.PI*2); ctxM.fill();
        ctxM.shadowBlur = 0;

        state.current.npcs.forEach(npc => {
             const x = centerX + npc.x * mapScale;
             const y = centerY + npc.y * mapScale;
             
             if (npc.enemyType === 'MYTHIC_BOSS') {
                 ctxM.fillStyle = '#ffd700';
                 ctxM.shadowColor = '#ffd700'; ctxM.shadowBlur = 10;
                 ctxM.beginPath(); ctxM.arc(x, y, 6, 0, Math.PI*2); ctxM.fill();
                 ctxM.shadowBlur = 0;
             } else {
                 ctxM.fillStyle = npc.alignment === 'enemy' ? '#ef4444' : npc.alignment === 'friendly' ? '#22c55e' : '#94a3b8';
                 ctxM.beginPath(); ctxM.arc(x, y, 1.5, 0, Math.PI*2); ctxM.fill();
             }
        });
    };

    const draw = () => {
      if (!ctx) return;
      const { w, h } = state.current.viewport;
      const p = state.current.player;
      const now = Date.now();

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      
      const shakeX = (Math.random() - 0.5) * state.current.shake;
      const shakeY = (Math.random() - 0.5) * state.current.shake;
      const camX = w / 2 - p.x + shakeX;
      const camY = h / 2 - p.y + shakeY;
      
      ctx.translate(camX, camY);

      const viewL = p.x - w/2 - 200;
      const viewT = p.y - h/2 - 200;
      const viewR = p.x + w/2 + 200;
      const viewB = p.y + h/2 + 200;

      ctx.lineWidth = BRIDGE_WIDTH;
      ctx.lineCap = 'butt';
      
      BRIDGES.forEach(([id1, id2]) => {
          const a1 = ARENAS[id1];
          const a2 = ARENAS[id2];
          
          const midX = (a1.x + a2.x)/2;
          if (midX < viewL && a1.x < viewL && a2.x < viewL) return; 

          ctx.strokeStyle = '#2d3748';
          ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke();
          
          ctx.strokeStyle = '#4a5568'; ctx.lineWidth = BRIDGE_WIDTH;
          ctx.setLineDash([20, 100]);
          ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke();
          ctx.setLineDash([]);
          
          const angle = Math.atan2(a2.y - a1.y, a2.x - a1.x);
          const nx = -Math.sin(angle) * (BRIDGE_WIDTH/2);
          const ny = Math.cos(angle) * (BRIDGE_WIDTH/2);
          
          ctx.strokeStyle = '#64748b'; ctx.lineWidth = 6;
          ctx.beginPath(); 
          ctx.moveTo(a1.x + nx, a1.y + ny); ctx.lineTo(a2.x + nx, a2.y + ny);
          ctx.moveTo(a1.x - nx, a1.y - ny); ctx.lineTo(a2.x - nx, a2.y - ny);
          ctx.stroke();
      });

      ARENAS.forEach(arena => {
          if (arena.x + ARENA_RADIUS < viewL || arena.x - ARENA_RADIUS > viewR || 
              arena.y + ARENA_RADIUS < viewT || arena.y - ARENA_RADIUS > viewB) return;

          const g = ctx.createRadialGradient(arena.x, arena.y, 0, arena.x, arena.y, ARENA_RADIUS);
          g.addColorStop(0, arena.color);
          g.addColorStop(0.8, arena.color);
          g.addColorStop(1, '#0f172a');
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(arena.x, arena.y, ARENA_RADIUS, 0, Math.PI*2); ctx.fill();

          ctx.strokeStyle = arena.gridColor; ctx.lineWidth = 2;
          ctx.beginPath();
          const step = GRID_SIZE;
          const r = ARENA_RADIUS;
          const startX = Math.floor((arena.x - r) / step) * step;
          const endX = Math.floor((arena.x + r) / step) * step;
          const startY = Math.floor((arena.y - r) / step) * step;
          const endY = Math.floor((arena.y + r) / step) * step;

          ctx.save();
          ctx.beginPath(); ctx.arc(arena.x, arena.y, r, 0, Math.PI*2); ctx.clip();
          
          for(let x=startX; x<=endX; x+=step) {
              ctx.moveTo(x, arena.y - r); ctx.lineTo(x, arena.y + r);
          }
          for(let y=startY; y<=endY; y+=step) {
              ctx.moveTo(arena.x - r, y); ctx.lineTo(arena.x + r, y);
          }
          ctx.stroke();
          ctx.restore();

          ctx.strokeStyle = arena.id === currentArena ? '#00f2ff' : '#475569';
          ctx.lineWidth = 10;
          ctx.shadowColor = arena.id === currentArena ? '#00f2ff' : 'transparent';
          ctx.shadowBlur = arena.id === currentArena ? 20 : 0;
          ctx.beginPath(); ctx.arc(arena.x, arena.y, ARENA_RADIUS, 0, Math.PI*2); ctx.stroke();
          ctx.shadowBlur = 0;

          ctx.fillStyle = 'rgba(255,255,255,0.1)';
          ctx.font = '900 100px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(arena.name.split(' ')[0], arena.x, arena.y);
      });

      const ascX = ARENAS[0].x + 300;
      const ascY = ARENAS[0].y;
      if (ascX > viewL && ascX < viewR && ascY > viewT && ascY < viewB) {
          ctx.save();
          ctx.translate(ascX, ascY);
          
          ctx.rotate(now * 0.001);
          ctx.strokeStyle = '#eab308'; 
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 10]);
          ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI*2); ctx.stroke();
          
          ctx.rotate(-now * 0.002);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4;
          ctx.setLineDash([]);
          ctx.beginPath();
          for(let i=0; i<6; i++) {
              const ang = i * Math.PI/3;
              ctx.lineTo(Math.cos(ang)*60, Math.sin(ang)*60);
          }
          ctx.closePath();
          ctx.stroke();

          ctx.fillStyle = `rgba(245, 158, 11, ${0.2 + Math.sin(now*0.005)*0.1})`;
          ctx.fill();
          
          ctx.fillStyle = '#fff';
          ctx.font = '900 24px "Font Awesome 6 Free"';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('\uf005', 0, 0); 

          ctx.restore();

          ctx.fillStyle = '#eab308';
          ctx.font = 'bold 12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("ASCENSION ROOM", ascX, ascY - 90);
      }

      state.current.lootBoxes.forEach(box => {
          if (box.x < viewL || box.x > viewR || box.y < viewT || box.y > viewB) return;
          ctx.save(); ctx.translate(box.x, box.y);
          ctx.rotate(Date.now() * 0.002);
          
          const s = box.width;
          if (box.type === 'DIAMOND') {
              ctx.shadowBlur = 30; ctx.shadowColor = '#00f2ff';
              ctx.fillStyle = '#00f2ff';
              ctx.beginPath();
              ctx.moveTo(0, -s/1.5); ctx.lineTo(s/1.5, 0); ctx.lineTo(0, s/1.5); ctx.lineTo(-s/1.5, 0);
              ctx.fill();
              ctx.fillStyle = '#fff';
              ctx.beginPath(); ctx.arc(0, 0, s/4, 0, Math.PI*2); ctx.fill();
          } else if (box.type === 'GOLDEN') {
              ctx.shadowBlur = 30; ctx.shadowColor = '#fcd34d';
              ctx.fillStyle = '#fcd34d';
              ctx.beginPath();
              for(let i=0; i<5; i++) {
                  ctx.lineTo(Math.cos((18+i*72)/180*Math.PI)*s, -Math.sin((18+i*72)/180*Math.PI)*s);
                  ctx.lineTo(Math.cos((54+i*72)/180*Math.PI)*s/2, -Math.sin((54+i*72)/180*Math.PI)*s/2);
              }
              ctx.fill();
              ctx.fillStyle = '#fff';
              ctx.beginPath(); ctx.arc(0, 0, s/4, 0, Math.PI*2); ctx.fill();
          } else if (box.type === 'WOODEN') {
              ctx.shadowBlur = 0;
              ctx.fillStyle = '#78350f'; 
              ctx.fillRect(-s/2, -s/2, s, s);
              ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3; 
              ctx.strokeRect(-s/2, -s/2, s, s);
              ctx.beginPath(); ctx.moveTo(-s/2, -s/2); ctx.lineTo(s/2, s/2); ctx.stroke();
              ctx.beginPath(); ctx.moveTo(s/2, -s/2); ctx.lineTo(-s/2, s/2); ctx.stroke();
          } else {
              ctx.shadowBlur = 20; ctx.shadowColor = '#ffd700';
              ctx.fillStyle = '#fbbf24'; 
              ctx.fillRect(-s/2, -s/2, s, s);
              ctx.strokeStyle = '#fffbeb'; ctx.lineWidth = 2; ctx.strokeRect(-s/2, -s/2, s, s);
              ctx.rotate(-Date.now() * 0.004);
              ctx.fillStyle = '#fff'; ctx.fillRect(-s/4, -s/4, s/2, s/2);
          }
          
          ctx.restore();
      });

      state.current.obstacles.forEach(obs => {
        if (obs.x < viewL - 100 || obs.x > viewR + 100 || obs.y < viewT - 100 || obs.y > viewB + 100) return;
        ctx.shadowBlur = 0;
        const drawX = obs.x - obs.width / 2;
        const drawY = obs.y - obs.height / 2;
        
        if (obs.type === 'hard') {
            ctx.fillStyle = '#334155'; ctx.fillRect(drawX, drawY, obs.width, obs.height);
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3; ctx.strokeRect(drawX, drawY, obs.width, obs.height);
            ctx.fillStyle = '#1e293b'; ctx.fillRect(drawX + 10, drawY + 10, obs.width - 20, obs.height - 20);
            const blink = Math.sin(Date.now() * 0.005) > 0;
            ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
            ctx.shadowColor = blink ? '#ef4444' : 'transparent'; ctx.shadowBlur = blink ? 15 : 0;
            ctx.beginPath(); ctx.arc(drawX + 10, drawY + 10, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(drawX + obs.width - 10, drawY + 10, 4, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = '#3f6212'; ctx.fillRect(drawX, drawY, obs.width, obs.height);
            ctx.fillStyle = '#1a2e05'; const s = 10;
            ctx.fillRect(drawX, drawY, s, s); ctx.fillRect(drawX+obs.width-s, drawY, s, s);
            ctx.fillRect(drawX, drawY+obs.height-s, s, s); ctx.fillRect(drawX+obs.width-s, drawY+obs.height-s, s, s);
            ctx.strokeStyle = '#65a30d'; ctx.lineWidth = 4;
            ctx.strokeRect(drawX + 5, drawY + 5, obs.width - 10, obs.height - 10);
            ctx.beginPath(); ctx.moveTo(drawX + 5, drawY + 5); ctx.lineTo(drawX + obs.width - 5, drawY + obs.height - 5);
            ctx.moveTo(drawX + obs.width - 5, drawY + 5); ctx.lineTo(drawX + 5, drawY + obs.height - 5);
            ctx.stroke();
        }
      });

      const drawTank = (t: Tank) => {
        if (t.x < viewL - t.width && t.x > viewR + t.width && t.y < viewT - t.height && t.y > viewB + t.height) return;
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rotation);

        if (t.id === 'player') {
             if (now < t.buffs.invincibleUntil) {
                 ctx.beginPath(); ctx.arc(0, 0, t.width * 1.2, 0, Math.PI*2);
                 ctx.strokeStyle = `rgba(0, 242, 255, ${0.4 + Math.sin(now * 0.01) * 0.2})`;
                 ctx.lineWidth = 4; ctx.stroke();
                 ctx.fillStyle = `rgba(0, 242, 255, 0.1)`; ctx.fill();
             }

             if (now < t.buffs.overdriveUntil) {
                 ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 20; ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
                 ctx.beginPath(); ctx.arc(0, 0, t.width * 0.8, 0, Math.PI*2); ctx.stroke();
             }
             if (now < t.buffs.blitzUntil) {
                 ctx.shadowColor = '#eab308'; ctx.shadowBlur = 20; ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2;
                 ctx.beginPath(); ctx.arc(0, 0, t.width * 0.9, 0, Math.PI*2); ctx.stroke();
             }

             if (t.shield > 0) {
                 ctx.beginPath(); ctx.arc(0, 0, t.width * 0.7, 0, Math.PI*2);
                 const opacity = 0.3 + (t.shield / (t.maxShield || 1)) * 0.5;
                 ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
                 ctx.lineWidth = 3;
                 ctx.stroke();
             }
        } else {
             if (t.enemyType === 'MYTHIC_BOSS') {
                 ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 40;
                 ctx.beginPath(); ctx.arc(0, 0, t.width * 0.6, 0, Math.PI*2);
                 ctx.fillStyle = 'rgba(255, 215, 0, 0.1)'; ctx.fill();
             } else {
                 ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10;
             }
             
             if (t.poisonStacks > 0) {
                 ctx.fillStyle = '#22c55e';
                 ctx.globalAlpha = 0.5;
                 ctx.beginPath(); ctx.arc(0, 0, t.width * 0.6, 0, Math.PI*2); ctx.fill();
                 ctx.globalAlpha = 1;
             }
        }

        if (t.enemyType === 'SPIDER') {
            // Draw Legs
            ctx.fillStyle = '#0f172a';
            ctx.beginPath(); ctx.arc(0, 0, t.width/2, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = t.color;
            ctx.beginPath(); ctx.arc(0, 0, t.width/2 - 4, 0, Math.PI*2); ctx.fill();
            
            ctx.strokeStyle = '#555'; ctx.lineWidth = 2;
            for(let i=0; i<8; i++) {
                const angle = (i/8) * Math.PI * 2 + now * 0.01;
                const legLen = t.width/2 + 8 + Math.sin(now * 0.02 + i) * 4;
                ctx.beginPath(); ctx.moveTo(0,0); 
                ctx.lineTo(Math.cos(angle)*legLen, Math.sin(angle)*legLen);
                ctx.stroke();
            }
        } else if (t.enemyType === 'TURRET') {
            // Static Base (undo rotation)
            ctx.rotate(-t.rotation);
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-t.width/2, -t.height/2, t.width, t.height);
            ctx.strokeStyle = t.color; ctx.lineWidth = 2;
            ctx.strokeRect(-t.width/2, -t.height/2, t.width, t.height);
            
            // Re-rotate for Head
            ctx.rotate(t.rotation);
            ctx.fillStyle = '#0f172a';
            ctx.beginPath(); ctx.arc(0, 0, t.width * 0.4, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = t.color;
            ctx.fillRect(0, -6, t.width * 0.6, 12);
        } else {
            // Standard Tank Rendering
            ctx.fillStyle = '#0f172a'; const trackW = t.width * 0.25; 
            ctx.fillRect(-t.width/2 - 2, -t.height/2 + 2, trackW, t.height - 4); 
            ctx.fillRect(t.width/2 - trackW + 2, -t.height/2 + 2, trackW, t.height - 4);
            ctx.fillStyle = '#334155';
            
            const trackDetailStep = t.height / 6;
            for(let i = -t.height/2 + 6; i < t.height/2 - 4; i+=trackDetailStep) {
                ctx.fillRect(-t.width/2 - 2, i, trackW, 2); ctx.fillRect(t.width/2 - trackW + 2, i, trackW, 2);
            }

            ctx.shadowBlur = 0; ctx.fillStyle = t.color; ctx.filter = 'brightness(0.9)';
            ctx.fillRect(-t.width/2 + (trackW/2), -t.height/2, t.width - trackW, t.height); ctx.filter = 'none';
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
            ctx.strokeRect(-t.width/2 + (trackW/2), -t.height/2, t.width - trackW, t.height);

            ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(0, 0, t.width * 0.35, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = t.color; ctx.beginPath(); ctx.arc(0, 0, t.width * 0.2, 0, Math.PI*2); ctx.fill();
        }

        // Weapon Rendering (Common for non-spider/turret or overlaid)
        if (t.enemyType !== 'SPIDER' && t.enemyType !== 'TURRET') {
            ctx.fillStyle = '#0f172a'; 
            if (t.enemyType === 'MYTHIC_BOSS') {
                ctx.fillRect(0, -t.width*0.15, t.width * 0.8, t.width*0.3); 
            }
            else if (t.id === 'player' && t.currentWeapon === 'SHOTGUN') {
                ctx.fillRect(0, -6, t.width * 0.6, 12); 
            } else if (t.id === 'player' && t.currentWeapon === 'SNIPER') {
                ctx.fillRect(0, -3, t.width * 0.9, 6); 
            } else if (t.id === 'player' && t.currentWeapon === 'FLAMETHROWER') {
                ctx.fillStyle = '#7c2d12'; 
                ctx.fillRect(0, -6, t.width * 0.6, 12);
                
                ctx.fillStyle = '#ea580c';
                ctx.fillRect(t.width * 0.1, -10, t.width * 0.4, 4);
                
                ctx.fillStyle = '#1a1a1a'; 
                ctx.fillRect(t.width * 0.6, -7, 6, 14);
                
                if (Math.random() > 0.5) {
                    ctx.fillStyle = '#3b82f6'; 
                    ctx.beginPath(); ctx.arc(t.width * 0.6 + 8, 0, 2, 0, Math.PI*2); ctx.fill();
                }
            } else if (t.id === 'player' && t.currentWeapon === 'MINIGUN') {
                ctx.fillStyle = '#334155';
                ctx.fillRect(0, -5, t.width * 0.7, 10);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(t.width * 0.7, -4, 8, 2);
                ctx.fillRect(t.width * 0.7, 2, 8, 2);
                ctx.fillRect(t.width * 0.7, -1, 10, 2);
            } else if (t.id === 'player' && t.currentWeapon === 'MISSILE') {
                ctx.fillStyle = '#334155';
                ctx.fillRect(0, -8, t.width * 0.4, 16);
                ctx.fillStyle = '#f43f5e'; 
                ctx.fillRect(t.width * 0.2, -10, 8, 6);
                ctx.fillRect(t.width * 0.2, 4, 8, 6);
            } else if (t.id === 'player' && t.currentWeapon === 'LASER') {
                ctx.fillStyle = '#1e1b4b'; 
                ctx.fillRect(0, -4, t.width * 0.8, 8);
                ctx.fillStyle = '#8b5cf6'; 
                ctx.fillRect(t.width * 0.2, -1, t.width * 0.6, 2);
            } else {
                ctx.fillRect(0, -4, t.width * 0.7, 8); 
            }

            if (t.currentWeapon !== 'FLAMETHROWER' && t.enemyType !== 'MYTHIC_BOSS') {
                ctx.fillStyle = '#334155'; ctx.fillRect(t.width * 0.7, -5, 6, 10);
            }
        }
        
        ctx.restore();
      };

      state.current.npcs.forEach(drawTank);
      drawTank(p);

      state.current.bullets.forEach(b => {
        if (b.x < viewL - 50 || b.x > viewR + 50 || b.y < viewT - 50 || b.y > viewB + 50) return;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rotation);
        
        if (b.growRate) {
             const lifeRatio = b.width / 60; 
             const alpha = Math.max(0, 1 - lifeRatio); 
             ctx.globalAlpha = alpha;
             
             const g = ctx.createRadialGradient(0, 0, 0, 0, 0, b.width/2);
             g.addColorStop(0, 'rgba(255, 255, 200, 1)'); 
             g.addColorStop(0.4, 'rgba(255, 160, 0, 0.8)'); 
             g.addColorStop(1, 'rgba(255, 69, 0, 0)'); 

             ctx.fillStyle = g;
             
             ctx.beginPath();
             const radius = b.width / 2;
             const seed = b.seed || Math.random();
             const wobble = Math.sin(now * 0.02 + seed * 10) * 0.2;
             
             ctx.ellipse(0, 0, radius * (1 + wobble), radius * (1 - wobble), now * 0.01, 0, Math.PI*2);
             ctx.fill();
             
             ctx.globalAlpha = 1;
        } else if (b.isHoming) {
             ctx.fillStyle = '#333';
             ctx.fillRect(-6, -3, 12, 6);
             ctx.fillStyle = b.color;
             ctx.beginPath(); ctx.arc(6, 0, 3, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle = '#fbbf24'; 
             ctx.beginPath(); ctx.arc(-6, 0, 2 + Math.random()*2, 0, Math.PI*2); ctx.fill();
        } else if (b.color === '#8b5cf6') { 
             ctx.fillStyle = '#fff';
             ctx.shadowColor = b.color; ctx.shadowBlur = 15;
             ctx.fillRect(-15, -1.5, 30, 3);
             ctx.shadowBlur = 0;
        } else if (b.isExplosive) {
             ctx.fillStyle = b.color;
             ctx.shadowBlur = 10; ctx.shadowColor = b.color;
             ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
             ctx.shadowBlur = 0;
        } else {
             ctx.fillStyle = b.color; ctx.shadowBlur = b.isSuper ? 20 : 10; ctx.shadowColor = b.color;
             ctx.beginPath(); ctx.rect(-b.width/2, -b.height/4, b.width, b.height/2); ctx.fill();
             ctx.shadowBlur = 0;
        }
        
        ctx.restore();
      });

      state.current.particles.forEach(part => { 
        if (part.x < viewL - 50 || part.x > viewR + 50 || part.y < viewT - 50 || part.y > viewB + 50) return;
        ctx.globalAlpha = part.life;
        if (part.type === 'debris') {
            ctx.save(); ctx.translate(part.x, part.y); ctx.rotate(part.rotation || 0);
            ctx.fillStyle = part.color; ctx.fillRect(-part.size/2, -part.size/2, part.size, part.size);
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(-part.size/2, -part.size/2, part.size, 2);
            ctx.restore();
        } else if (part.type === 'ring') {
            ctx.beginPath(); ctx.arc(part.x, part.y, (1-part.life) * 80, 0, Math.PI*2); 
            ctx.strokeStyle = `rgba(255,255,255,${part.life})`; ctx.lineWidth = 4 * part.life; ctx.stroke();
        } else if (part.type === 'smoke') {
            const g = ctx.createRadialGradient(part.x, part.y, 0, part.x, part.y, part.size);
            g.addColorStop(0, `rgba(100, 100, 100, ${part.life})`);
            g.addColorStop(1, `rgba(50, 50, 50, 0)`);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(part.x, part.y, part.size, 0, Math.PI*2); ctx.fill();
        } else if (part.type === 'coin') {
            ctx.fillStyle = '#fcd34d'; ctx.shadowBlur = 10; ctx.shadowColor = '#fbbf24';
            ctx.beginPath(); ctx.arc(part.x, part.y, part.size, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = part.color; ctx.shadowBlur = 10; ctx.shadowColor = part.color;
            ctx.beginPath(); ctx.arc(part.x, part.y, part.size, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        }
      });
      ctx.globalAlpha = 1;

      state.current.floatingTexts.forEach(ft => {
          ctx.save(); ctx.fillStyle = ft.color; ctx.font = `900 16px monospace`;
          ctx.shadowColor = 'black'; ctx.shadowBlur = 4; ctx.globalAlpha = ft.life;
          ctx.textAlign = 'center'; ctx.fillText(ft.text, ft.x, ft.y); ctx.restore();
      });

      ctx.restore();

      const nearbyBoss = state.current.npcs.find(n => n.enemyType === 'MYTHIC_BOSS' && Math.hypot(n.x - p.x, n.y - p.y) < 1500);
      if (nearbyBoss) {
          const barW = Math.min(600, w * 0.6);
          const barH = 24;
          const barX = (w - barW) / 2;
          const barY = 120;

          ctx.save();
          ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 20;
          
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.beginPath(); 
          if (ctx.roundRect) ctx.roundRect(barX, barY, barW, barH, 6);
          else ctx.rect(barX, barY, barW, barH);
          ctx.fill();
          
          ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2; ctx.stroke();
          ctx.shadowBlur = 0;

          const pct = Math.max(0, nearbyBoss.hp / nearbyBoss.maxHp);
          if (pct > 0) {
             const g = ctx.createLinearGradient(barX, 0, barX + barW, 0);
             g.addColorStop(0, '#fcd34d'); g.addColorStop(0.5, '#d97706'); g.addColorStop(1, '#fcd34d');
             ctx.fillStyle = g;
             ctx.beginPath(); 
             if (ctx.roundRect) ctx.roundRect(barX + 2, barY + 2, (barW - 4) * pct, barH - 4, 4);
             else ctx.fillRect(barX + 2, barY + 2, (barW - 4) * pct, barH - 4);
             ctx.fill();
          }

          ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.font = '900 16px monospace'; 
          ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
          ctx.fillText("⚠ MYTHIC CLASS ENTITY DETECTED ⚠", w/2, barY - 5);
          
          ctx.font = 'bold 12px monospace'; ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.ceil(nearbyBoss.hp).toLocaleString()} / ${nearbyBoss.maxHp.toLocaleString()}`, w/2, barY + barH/2);
          
          ctx.restore();
      }
    };

    const render = () => {
        update();
        draw();
        drawMinimap();
        animationId = requestAnimationFrame(render);
    };
    render();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameOver]);

  // JSX Return
  return (
    <div className="w-full h-screen bg-[#0f172a] flex items-center justify-center relative overflow-hidden" ref={containerRef}>
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* Ascension Room Prompt */}
      {canEnterAscension && !showUpgradePanel && !showBag && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-32 z-40 animate-bounce">
              <div className="bg-amber-500/90 text-black px-6 py-3 rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.6)] flex items-center gap-3">
                  <span className="bg-black text-amber-500 w-8 h-8 rounded-full flex items-center justify-center text-lg">[F]</span>
                  <span>Enter Star Ascension Room</span>
              </div>
          </div>
      )}

      {/* Arena Scoreboard UI */}
      {currentArena === OUTER_COUNT && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-slide-down">
          <div className="bg-[#0f172a]/90 border border-cyan-500/30 backdrop-blur-md rounded-b-xl px-8 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">FRIENDLY</span>
              <span className="text-3xl font-black text-white">{arenaMatchUI.friendlyScore}</span>
            </div>
            
            <div className="flex flex-col items-center w-24">
               <div className="text-xl font-mono text-cyan-300 font-bold">
                 {Math.floor(arenaMatchUI.timeLeft / 60000)}:{(Math.floor(arenaMatchUI.timeLeft / 1000) % 60).toString().padStart(2, '0')}
               </div>
               <span className="text-[8px] text-gray-500 uppercase tracking-widest">MATCH TIMER</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-[10px] text-red-500 font-black uppercase tracking-widest">ENEMY</span>
              <span className="text-3xl font-black text-white">{arenaMatchUI.enemyScore}</span>
            </div>
          </div>
          {arenaMatchUI.result !== 'NONE' && (
             <div className="mt-4 bg-black/80 px-8 py-2 rounded-full border border-white/10 animate-pulse">
                <span className={`text-2xl font-black italic uppercase tracking-widest ${arenaMatchUI.result === 'VICTORY' ? 'text-green-500' : 'text-red-500'}`}>
                    {arenaMatchUI.result === 'VICTORY' ? 'SECTOR SECURED' : 'SECTOR LOST'}
                </span>
             </div>
          )}
        </div>
      )}

      {/* Top HUD - XP, Level, HP, Shield, Coins */}
      <div className="absolute top-6 inset-x-8 flex justify-between items-start pointer-events-none z-20">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
              <button onClick={handleExit} className="pointer-events-auto bg-slate-900 hover:bg-slate-800 border-l-4 border-amber-500 text-white px-8 py-3 shadow-2xl transition-all text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <i className="fa-solid fa-person-through-window"></i> EVACUATE
              </button>
              <button onClick={handleSokoban} className="pointer-events-auto bg-cyan-900/80 hover:bg-cyan-800 border-l-4 border-cyan-500 text-white px-6 py-3 shadow-2xl transition-all text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <i className="fa-solid fa-cube"></i> LOGISTICS
              </button>
              <button onClick={() => { setShowUpgradePanel(!showUpgradePanel); setShowBag(false); }} className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white px-6 py-3 shadow-2xl transition-all text-xs font-black uppercase tracking-widest flex items-center gap-3 relative">
                <i className="fa-solid fa-screwdriver-wrench"></i> 面板 [C]
                {playerUI.upgradePoints > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>}
              </button>
              <button onClick={() => { setShowBag(!showBag); setShowUpgradePanel(false); }} className="pointer-events-auto bg-indigo-900/80 hover:bg-indigo-800 border border-indigo-500 text-white px-6 py-3 shadow-2xl transition-all text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <i className="fa-solid fa-bag-shopping"></i> 商店/背包 [B]
              </button>
          </div>
          
          <div className="bg-slate-900/90 border border-slate-700 p-5 shadow-2xl min-w-[300px]">
             {/* Shield Bar (if any) */}
             {playerUI.maxShield > 0 && (
                 <div className="flex justify-between items-end mb-1">
                    <div className="w-full h-1.5 bg-slate-800 border border-blue-900 p-px mb-2">
                        <div className="h-full bg-blue-500 transition-all duration-200" style={{ width: `${Math.min(100, (playerUI.shield / playerUI.maxShield) * 100)}%` }}></div>
                    </div>
                 </div>
             )}
             
             <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <i className="fa-solid fa-microchip"></i> ARMOR_INTEGRITY
                </span>
                <div className={`text-2xl font-mono font-bold ${playerUI.hp < 200 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{Math.round(playerUI.hp)}/{Math.round(playerUI.maxHp)}</div>
             </div>
             <div className="w-full h-3 bg-slate-800 border border-slate-700 p-0.5">
                <div 
                  className={`h-full transition-all duration-300 ${playerUI.hp < 300 ? 'bg-red-500' : 'bg-cyan-500'}`}
                  style={{ width: `${Math.min(100, (playerUI.hp / playerUI.maxHp) * 100)}%` }}
                ></div>
             </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700 p-3 shadow-2xl flex items-center gap-4">
               <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">ACTIVE_SECTOR</span>
                    <span className={`text-sm font-black uppercase text-cyan-400`}>
                        {ARENAS[currentArena]?.name.split('[')[0] || 'TRANSIT'}
                    </span>
               </div>
               <div className={`w-2 h-2 rounded-full animate-pulse bg-cyan-500`}></div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
            <div className="bg-slate-900/90 p-6 border-r-4 border-cyan-500 text-right shadow-2xl min-w-[200px]">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Lv {playerUI.level}</span>
                    <span className="text-[10px] font-mono text-gray-400">{Math.floor(playerUI.xp)} / {playerUI.maxXp} XP</span>
                </div>
                <div className="w-full h-2 bg-slate-800 mb-4 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 transition-all duration-500" style={{ width: `${(playerUI.xp / playerUI.maxXp) * 100}%` }}></div>
                </div>

                <div className="flex justify-between items-center bg-black/40 p-2 rounded mb-2">
                    <span className="text-[10px] font-black text-yellow-500">Z-COINS</span>
                    <span className="text-xl font-mono text-yellow-400 font-bold">{playerUI.coins}</span>
                </div>

                <div className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1 flex items-center justify-end gap-2">
                    SCORE_METRIC
                </div>
                <div className="text-4xl font-black text-white font-mono leading-none tracking-tighter">
                    {score.toString().padStart(6, '0')}
                </div>
            </div>
            
            <div className="flex gap-2">
                {Date.now() < state.current.player.buffs.invincibleUntil && (
                    <div className="bg-cyan-900/80 border border-cyan-500 p-2 rounded text-cyan-400 text-[10px] font-black uppercase animate-pulse">INVINCIBLE</div>
                )}
                {Date.now() < state.current.player.buffs.overdriveUntil && (
                    <div className="bg-red-900/80 border border-red-500 p-2 rounded text-red-500 text-[10px] font-black uppercase animate-pulse">OVERDRIVE</div>
                )}
                {Date.now() < state.current.player.buffs.blitzUntil && (
                    <div className="bg-yellow-900/80 border border-yellow-500 p-2 rounded text-yellow-500 text-[10px] font-black uppercase animate-pulse">BLITZ</div>
                )}
            </div>
        </div>
      </div>
      
      {/* Upgrade Panel */}
      {showUpgradePanel && (
          <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={() => setShowUpgradePanel(false)}>
              <div className="bg-[#0f172a] border border-cyan-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] w-[500px]" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-4">
                          <i className={`fa-solid ${canEnterAscension ? 'fa-star text-amber-500' : 'fa-screwdriver-wrench text-cyan-400'} text-2xl`}></i>
                          <div>
                              <h2 className={`text-2xl font-black uppercase italic tracking-tighter ${canEnterAscension ? 'text-amber-500' : 'text-white'}`}>{canEnterAscension ? 'Star Ascension Console' : '战车改装终端'}</h2>
                              <p className="text-[10px] text-gray-400 font-mono">可用升级点数: <span className="text-cyan-400 text-lg font-bold">{playerUI.upgradePoints}</span></p>
                          </div>
                      </div>
                      <button onClick={() => setShowUpgradePanel(false)} className="text-gray-500 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                      {[
                          { id: 'damage', label: '武器系统', icon: 'fa-crosshairs', desc: '伤害 +10%' },
                          { id: 'health', label: '纳米装甲', icon: 'fa-shield-halved', desc: '生命上限 +15% / 修复' },
                          { id: 'speed', label: '引擎核心', icon: 'fa-gauge-high', desc: '机动性 +5%' },
                          { id: 'haste', label: '循环供弹', icon: 'fa-bolt', desc: '冷却时间 -5%' },
                          { id: 'regen', label: '生化再生', icon: 'fa-heart-pulse', desc: '生命自然恢复' },
                          { id: 'armor', label: '泰坦镀层', icon: 'fa-shield-cat', desc: '受到伤害 -5%' },
                      ].map(opt => {
                          const level = state.current.player.rpgStats?.statLevels[opt.id as keyof PlayerStats['statLevels']] || 0;
                          const canUpgrade = playerUI.upgradePoints > 0;
                          return (
                              <div key={opt.id} className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                                  <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-cyan-900/20 rounded flex items-center justify-center text-cyan-400">
                                          <i className={`fa-solid ${opt.icon}`}></i>
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <span className="text-sm font-bold text-white uppercase">{opt.label}</span>
                                              <span className="text-[10px] bg-slate-700 px-1.5 rounded text-white font-mono">Lv {level}</span>
                                          </div>
                                          <span className="text-[10px] text-gray-500">{opt.desc}</span>
                                      </div>
                                  </div>
                                  <button 
                                    disabled={!canUpgrade}
                                    onClick={() => performUpgrade(opt.id as any)}
                                    className={`w-10 h-10 rounded flex items-center justify-center border transition-all ${canUpgrade ? 'bg-cyan-600 border-cyan-400 text-white hover:bg-cyan-500' : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'}`}
                                  >
                                      <i className="fa-solid fa-plus"></i>
                                  </button>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* Bag / Shop Modal */}
      {showBag && (
          <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in" onClick={() => setShowBag(false)}>
              <div className="w-[900px] h-[600px] bg-[#0f172a] border border-indigo-500/50 rounded-2xl shadow-[0_0_80px_rgba(79,70,229,0.2)] flex overflow-hidden" onClick={e => e.stopPropagation()}>
                  
                  {/* Left: Shop */}
                  <div className="w-1/2 p-6 border-r border-white/5 bg-[#1e1b4b]/30 flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-black text-indigo-400 italic uppercase tracking-wider">Black Market</h2>
                          <div className="bg-black/40 px-3 py-1 rounded border border-yellow-500/30 text-yellow-400 font-mono text-sm">
                              {playerUI.coins} Z-COINS
                          </div>
                      </div>
                      
                      <div className="flex-grow overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                          {SHOP_ITEMS.map(item => (
                              <div key={item.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 hover:border-indigo-500/50 transition-all">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded flex items-center justify-center border" style={{ backgroundColor: `${RANK_COLORS[item.rank]}22`, borderColor: RANK_COLORS[item.rank] }}>
                                          <i className="fa-solid fa-box text-sm" style={{ color: RANK_COLORS[item.rank] }}></i>
                                      </div>
                                      <div>
                                          <div className="text-xs font-bold text-white">{item.name}</div>
                                          <div className="text-[9px] text-gray-400 max-w-[150px]">{item.description}</div>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                        if (state.current.player.coins >= item.price) {
                                            state.current.player.coins -= item.price;
                                            addItemToInventory(item);
                                            setPlayerUI(p => ({...p, coins: state.current.player.coins})); // Force update
                                        } else {
                                            createFloatingText(state.current.player.x, state.current.player.y - 50, "FUNDS INSUFFICIENT", "#ef4444");
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded uppercase tracking-wider"
                                  >
                                      {item.price}
                                  </button>
                              </div>
                          ))}
                      </div>

                      {/* Cheat Code Input */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                          <div className="flex gap-2">
                              <input 
                                  type="text" 
                                  value={cheatCode}
                                  onChange={(e) => setCheatCode(e.target.value)}
                                  placeholder="Activation Code..."
                                  className="flex-grow bg-black/40 border border-indigo-500/30 rounded px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                              />
                              <button onClick={handleCheatCode} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider">
                                  ACTIVATE
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Right: Inventory & Equipment */}
                  <div className="w-1/2 p-6 bg-[#0f172a] flex flex-col">
                      <div className="mb-6">
                          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Active Modules (Equipped)</h2>
                          <div className="flex gap-2 min-h-[60px] p-2 bg-black/40 rounded-xl border border-white/5">
                              {state.current.player.equipment.map((item, idx) => (
                                  <button 
                                    key={idx} // Equipment instances are unique slots, index is safe here
                                    onClick={() => {
                                        const p = state.current.player;
                                        // Remove from equipment
                                        p.equipment.splice(idx, 1);
                                        
                                        // Add back to inventory (stack logic)
                                        const existing = p.inventory.find(i => i.id === item.id);
                                        if (existing) {
                                            existing.count = (existing.count || 1) + 1;
                                        } else {
                                            p.inventory.push({...item, count: 1, uid: Math.random().toString(36)});
                                        }
                                        
                                        setPlayerUI(u => ({...u})); // Refresh
                                    }}
                                    className="w-12 h-12 rounded border flex items-center justify-center relative group"
                                    style={{ borderColor: RANK_COLORS[item.rank], backgroundColor: `${RANK_COLORS[item.rank]}11` }}
                                  >
                                      <i className="fa-solid fa-microchip" style={{ color: RANK_COLORS[item.rank] }}></i>
                                      <div className="absolute bottom-full mb-2 bg-black text-white text-[9px] p-2 rounded whitespace-nowrap hidden group-hover:block z-50 pointer-events-none">
                                          {item.name} - Unequip
                                      </div>
                                  </button>
                              ))}
                              {state.current.player.equipment.length === 0 && <span className="text-[10px] text-gray-600 self-center mx-auto">No Active Modules</span>}
                          </div>
                      </div>

                      <div className="flex-grow flex flex-col">
                          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Storage (Inventory)</h2>
                          <div className="grid grid-cols-5 gap-2 content-start flex-grow overflow-y-auto scrollbar-hide">
                              {state.current.player.inventory.map((item, idx) => (
                                  <button 
                                    key={item.id} // Use ID for stable keys with stacking
                                    onClick={() => {
                                        const p = state.current.player;
                                        if (p.equipment.length < 4) { // Limit slots
                                            // Decrease stack count
                                            item.count = (item.count || 1) - 1;
                                            if (item.count <= 0) {
                                                p.inventory.splice(idx, 1);
                                            }
                                            
                                            // Add single instance to equipment
                                            p.equipment.push({...item, count: 1}); 
                                            setPlayerUI(u => ({...u})); // Refresh
                                        } else {
                                            alert("Equipment slots full!");
                                        }
                                    }}
                                    className="aspect-square rounded border flex flex-col items-center justify-center relative group hover:bg-white/5 transition-all"
                                    style={{ borderColor: RANK_COLORS[item.rank], backgroundColor: `${RANK_COLORS[item.rank]}05` }}
                                  >
                                      <i className="fa-solid fa-cube mb-1" style={{ color: RANK_COLORS[item.rank] }}></i>
                                      {(item.count || 1) > 1 && (
                                          <div className="absolute top-0.5 right-1 text-[9px] font-bold text-white bg-black/60 px-1 rounded">x{item.count}</div>
                                      )}
                                      <div className="absolute bottom-full mb-2 bg-black border border-white/20 text-white text-[9px] p-2 rounded w-32 hidden group-hover:block z-50 pointer-events-none text-left">
                                          <div className="font-bold mb-1" style={{color: RANK_COLORS[item.rank]}}>{item.name}</div>
                                          <div className="text-gray-400">{item.description}</div>
                                          <div className="text-gray-500 mt-1 italic">{item.rank}</div>
                                      </div>
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
                  
                  <button onClick={() => setShowBag(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                      <i className="fa-solid fa-xmark text-xl"></i>
                  </button>
              </div>
          </div>
      )}

      {/* Weapon Selector UI - Updated for Click Interaction */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-4">
          {unlockedWeapons.map((w, index) => {
              const weapon = WEAPONS[w];
              const isActive = activeWeapon === w;
              let icon = 'fa-gun';
              if (w === 'SHOTGUN') icon = 'fa-burst';
              if (w === 'SNIPER') icon = 'fa-crosshairs';
              if (w === 'PLASMA') icon = 'fa-meteor';
              if (w === 'FLAMETHROWER') icon = 'fa-fire';
              if (w === 'MINIGUN') icon = 'fa-dharmachakra';
              if (w === 'LASER') icon = 'fa-wave-square';
              if (w === 'MISSILE') icon = 'fa-rocket';

              return (
                <button 
                    key={w} 
                    onClick={() => {
                        const p = state.current.player;
                        p.currentWeapon = w;
                        setActiveWeapon(w);
                        createFloatingText(p.x, p.y - 50, `WEAPON: ${WEAPONS[w].name}`, '#fff');
                    }}
                    className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all cursor-pointer hover:scale-105 active:scale-95 ${isActive ? 'bg-slate-800 border-cyan-500 scale-110 shadow-lg shadow-cyan-500/20' : 'bg-slate-900/80 border-slate-700 opacity-60 hover:opacity-100'}`}
                >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: `${weapon.color}22` }}>
                        <i className={`fa-solid ${icon} text-lg`} style={{ color: weapon.color }}></i>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white">{weapon.name}</span>
                    {isActive && <div className="absolute -top-3 -right-3 w-6 h-6 bg-cyan-500 text-black rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">Q</div>}
                    <div className="absolute top-1 left-1 text-[8px] text-gray-500 font-mono">{index + 1}</div>
                </button>
              );
          })}
      </div>

      <div className="absolute bottom-8 right-8 z-20 pointer-events-none">
          <div className="relative w-[200px] h-[200px] rounded-full overflow-hidden border-2 border-slate-700 bg-slate-900/80 backdrop-blur shadow-[0_0_30px_rgba(0,0,0,0.5)]">
               <canvas ref={minimapRef} width="200" height="200" className="w-full h-full opacity-90" />
               <div className="absolute inset-0 border border-white/10 rounded-full"></div>
               <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10"></div>
               <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/10"></div>
               <span className="absolute bottom-2 right-4 text-[8px] font-black text-cyan-600 uppercase tracking-widest">TACTICAL_MAP</span>
          </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-10 text-center animate-fade-in backdrop-blur-sm">
          <div className="text-amber-500 text-[16px] font-black uppercase tracking-[1.5em] mb-6 border-b border-amber-500/30 pb-4">CRITICAL FAILURE</div>
          <h2 className="text-9xl font-black italic text-white mb-10 tracking-tighter uppercase opacity-90">
            WRECKED
          </h2>
          <button onClick={() => initLevel(false)} className="px-16 py-6 bg-amber-500 text-black font-black uppercase tracking-[0.2em] hover:bg-amber-400 hover:scale-105 transition-all text-xl shadow-[0_0_50px_rgba(245,158,11,0.5)]">
            SYSTEM REBOOT
          </button>
        </div>
      )}
    </div>
  );
};

export default TankBattleView;
