export type AuthType = 'microsoft' | 'offline';

export interface Profile {
  id: string;
  name: string;
  type: AuthType;
  uuid: string;
  accessToken?: string;
  refreshToken?: string;
  skinUrl?: string;
  capeUrl?: string;
  status: 'online' | 'playing' | 'dnd' | 'offline';
  isAdmin?: boolean;
  prefix?: string;
  createdAt: number;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  ramMinMb: number;
  ramMaxMb: number;
  javaPath?: string;
  gameDir?: string;
  closeLauncherOnGameStart: boolean;
  showSnapshots: boolean;
  backgroundImage?: string;
  backgroundOpacity?: number;
  accentColor?: string;
  uiScale?: number;
  uiBlur?: number;
  uiRadius?: number;
  panelOpacity?: number;
  uiGlow?: number;
  showStars?: boolean;
  starCount?: number;
  language?: 'ru' | 'en';
  enableSounds?: boolean;
  enableMusic: boolean;
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

export interface ChatMessage {
  id: string;
  authorName: string;
  authorPrefix: string;
  text: string;
  timestamp: number;
}

export interface Result<T> {
  ok: boolean;
  data?: T;
  error?: string;
}