export interface WindowLauncher {
  getSettings: () => Promise<{ ok: boolean; data?: any; error?: string }>;
  saveSettings: (s: any) => Promise<{ ok: boolean; data?: any }>;
  getProfiles: () => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  saveProfiles: (p: any[]) => Promise<{ ok: boolean }>;
  createOffline: (name: string) => Promise<{ ok: boolean; data?: any; error?: string }>;
  getManifest: () => Promise<{ ok: boolean; data?: any; error?: string }>;
  getInstalledVersions: () => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  getVersionJson: (id: string) => Promise<{ ok: boolean; data?: any; error?: string }>;
  deleteVersion: (id: string) => Promise<{ ok: boolean; error?: string }>;
  downloadVersion: (v: any) => Promise<{ ok: boolean; data?: any; error?: string }>;
  getFabricLoaders: (mcVersion: string) => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  getQuiltLoaders: () => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  getForgeVersions: (mcVersion: string) => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  getNeoForgeVersions: (mcVersion: string) => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  installFabric: (mcVersion: string, loaderVersion: string) => Promise<{ ok: boolean; error?: string }>;
  installQuilt: (mcVersion: string, loaderVersion: string) => Promise<{ ok: boolean; error?: string }>;
  installForge: (mcVersion: string, forgeVersion: string) => Promise<{ ok: boolean; error?: string }>;
  installNeoForge: (mcVersion: string, neoVersion: string) => Promise<{ ok: boolean; error?: string }>;
  launchGame: (data: any) => Promise<{ ok: boolean; error?: string }>;
  getGameDir: (id: string) => Promise<{ ok: boolean; data?: string; error?: string }>;
  openFolder: (folderPath: string) => Promise<{ ok: boolean; data?: any; error?: string }>;
  listFiles: (folderPath: string, extensions?: string[]) => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  toggleMod: (filePath: string) => Promise<{ ok: boolean; data?: any; error?: string }>;
  listWorlds: (instanceId: string) => Promise<{ ok: boolean; data?: string[]; error?: string }>;
  readLog: (instanceId: string) => Promise<{ ok: boolean; data?: string; error?: string }>;
  searchMods: (q: string, opts: any) => Promise<{ ok: boolean; data?: { hits: any[]; total: number }; error?: string }>;
  getPopularMods: (type: string, offset: number) => Promise<{ ok: boolean; data?: { hits: any[]; total: number }; error?: string }>;
  getModVersions: (id: string, l?: string, v?: string) => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  downloadMod: (projectId: string, instanceId: string, gameVersion?: string, loader?: string) => Promise<{ ok: boolean; data?: any; error?: string }>;
  onLaunchProgress: (cb: (data: any) => void) => () => void;
  onLaunchLog: (cb: (data: any) => void) => () => void;
  minimize: () => void;
  maximize: () => void;
  close: () => void;
}

declare global {
  interface Window {
    launcher: WindowLauncher;
  }
}