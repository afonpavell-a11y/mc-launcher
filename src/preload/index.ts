import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('launcher', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (s: any) => ipcRenderer.invoke('settings:save', s),
  getProfiles: () => ipcRenderer.invoke('profiles:get'),
  saveProfiles: (p: any) => ipcRenderer.invoke('profiles:save', p),
  createOffline: (name: string) => ipcRenderer.invoke('auth:offline', name),

  getManifest: () => ipcRenderer.invoke('versions:manifest'),
  getInstalledVersions: () => ipcRenderer.invoke('versions:installed'), 
  getVersionJson: (id: string) => ipcRenderer.invoke('versions:get-json', id),
  deleteVersion: (id: string) => ipcRenderer.invoke('versions:delete', id),
  downloadVersion: (v: any) => ipcRenderer.invoke('versions:download', v),

  getFabricLoaders: (mc: string) => ipcRenderer.invoke('loaders:fabric:versions', mc),
  installFabric: (mc: string, loader: string) => ipcRenderer.invoke('loaders:fabric:install', mc, loader),
  getForgeVersions: (mc: string) => ipcRenderer.invoke('loaders:forge:versions', mc),
  installForge: (mc: string, version: string) => ipcRenderer.invoke('loaders:forge:install', mc, version),
  
  launchGame: (data: any) => ipcRenderer.invoke('game:launch', data),
  getGameDir: (id: string) => ipcRenderer.invoke('game:get-dir', id),

  openFolder: (p: string) => ipcRenderer.invoke('shell:open-folder', p),
  listFiles: (dir: string, exts?: string[]) => ipcRenderer.invoke('fs:list-files', dir, exts),
  toggleMod: (p: string) => ipcRenderer.invoke('fs:toggle-mod', p),
  listWorlds: (id: string) => ipcRenderer.invoke('fs:list-worlds', id),
  readLog: (id: string) => ipcRenderer.invoke('fs:read-log', id),

  searchMods: (q: string, opts: any) => ipcRenderer.invoke('modrinth:search', q, opts),
  getPopularMods: (type: string, offset: number) => ipcRenderer.invoke('modrinth:popular', type, offset),
  getModVersions: (id: string, l?: string, v?: string) => ipcRenderer.invoke('modrinth:versions', id, l, v),
  downloadMod: (projectId: string, instanceId: string, gameVersion: string, loader: string) => 
    ipcRenderer.invoke('modrinth:download', projectId, instanceId, gameVersion, loader),

  // Музыка
  getMusicTracks: () => ipcRenderer.invoke('music:list'),
  openMusicFolder: () => ipcRenderer.invoke('music:open-folder'),

  onLaunchProgress: (cb: (data: any) => void) => {
    const listener = (_: any, data: any) => cb(data);
    ipcRenderer.on('launch:progress', listener);
    return () => ipcRenderer.removeListener('launch:progress', listener);
  },
  onLaunchLog: (cb: (data: any) => void) => {
    const listener = (_: any, data: any) => cb(data);
    ipcRenderer.on('launch:log', listener);
    return () => ipcRenderer.removeListener('launch:log', listener);
  },
  onUpdateAvailable: (cb: (version: string) => void) => {
    const listener = (_: any, version: string) => cb(version);
    ipcRenderer.on('update-available', listener);
    return () => ipcRenderer.removeListener('update-available', listener);
  },
  downloadUpdate: () => ipcRenderer.send('start-update-download'),
});