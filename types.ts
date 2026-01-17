
export interface Vector2 {
  x: number;
  y: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  type?: 'glow' | 'spark';
}

export interface Wall {
  id: string;
  start: Vector2;
  end: Vector2;
}

export interface Planet {
  id: string;
  name: string;
  mass: number;
  radius: number;
  position: Vector2;
  velocity: Vector2;
  color: string;
  isFixed: boolean;
  trail: Vector2[];
  type: PlanetType;
}

export enum PlanetType {
  STAR = '恒星',
  TERRESTRIAL = '类地行星',
  GAS_GIANT = '气态巨行星',
  BLACK_HOLE = '黑洞',
  DWARF = '矮行星'
}

export enum CollisionMode {
  MERGE = '融合',
  BOUNCE = '弹性碰撞'
}

export type ViewMode = 'menu' | 'observation' | 'physics' | 'metaverse' | 'tank-battle' | 'sokoban' | 'ascension';

export interface Project {
  id: string;
  name: string;
  mode: ViewMode;
  timestamp: number;
  planets: Planet[];
  walls: Wall[];
  config: {
    gravityConstant: number;
    timeScale: number;
    friction: number;
    verticalGravity: number;
  };
}

export interface SimulationState {
  planets: Planet[];
  walls: Wall[];
  timeScale: number;
  showTrails: boolean;
  showLabels: boolean;
  isPaused: boolean;
  viewOffset: Vector2;
  zoom: number;
  cameraTargetId: string | null;
  gravityConstant: number;
  collisionMode: CollisionMode;
  nebulaIntensity: number;
  viewMode: ViewMode;
  friction: number;
  verticalGravity: number;
  isDirty: boolean;
  activeProjectId: string | null;
  stellarBuffer: { planets: Planet[] };
  physicsBuffer: { planets: Planet[], walls: Wall[] };
}

export interface CosmicEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'collision' | 'explosion' | 'creation' | 'physics';
}
