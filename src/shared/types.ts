export type AuthType = 'microsoft' | 'offline';

export interface Profile {
  id: string;
  name: string;
  type: AuthType;
  uuid: string;
  accessToken?: string;
  refreshToken?: string;
  skinUrl?: string;
  localSkin?: string;
  capeUrl?: string;
  status: 'online' | 'playing' | 'dnd' | 'offline';
  createdAt: number;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  themeColor?: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'pink';
  language?: 'ru' | 'en' | 'uk';
  ramMinMb: number;
  ramMaxMb: number;
  javaPath?: string;
  gameDir?: string;
  closeLauncherOnGameStart: boolean;
  showSnapshots: boolean;
  backgroundImage?: string;
  backgroundOpacity?: number;
  accentColor?: string;
  enableSounds?: boolean;
  particlesType?: 'none' | 'stars' | 'snow' | 'sakura' | 'rain' | 'sparks';
  particlesCount?: number;
  particlesSpeed?: number;
  uiGlow?: number;
  uiBlur?: number;
  uiScale?: number;
  uiRadius?: number;
  panelOpacity?: number;
}

export interface VersionSummary {
  id: string;
  type: 'release' | 'snapshot' | 'old_beta' | 'old_alpha';
  url: string;
  releaseTime: string;
}

export interface LaunchProgress {
  stage: 'preparing' | 'downloading' | 'extracting' | 'launching' | 'running' | 'exited';
  current: number;
  total: number;
  message: string;
}

export interface ModrinthHit {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string | null;
  versions: string[];
  loaders: string[];
  project_type: string;
  downloads: number;
}

export interface LogLine {
  type: 'stdout' | 'stderr' | 'info';
  line: string;
  ts: number;
}

export interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
}