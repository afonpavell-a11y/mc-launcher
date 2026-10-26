import { ipcMain, BrowserWindow } from 'electron';
import { AuthService } from '../core/AuthService';
import { VersionManager } from '../core/VersionManager';
import { ModrinthService } from '../core/ModrinthService';
import { GameLauncher } from '../core/GameLauncher';
import { Storage } from '../core/Storage';
import { paths } from '../utils/paths';
import type { Result } from '../../shared/types';
import fs from 'node:fs/promises';
import path from 'node:path';

function wrap<T>(fn: () => Promise<T>): Promise<Result<T>> {
  return fn().then(data => ({ ok: true, data })).catch(e => ({ ok: false, error: e instanceof Error ? e.message : String(e) }));
}

export function registerIpc(win: BrowserWindow) {
  const launcher = new GameLauncher(win);

  // Настройки и профили
  ipcMain.handle('settings:get', () => wrap(() => Storage.loadSettings()));
  ipcMain.handle('settings:save', (_, s) => wrap(() => Storage.saveSettings(s)));
  ipcMain.handle('profiles:get', () => wrap(() => Storage.loadProfiles()));
  ipcMain.handle('profiles:save', (_, p) => wrap(() => Storage.saveProfiles(p)));
  ipcMain.handle('auth:offline', (_, name) => wrap(async () => AuthService.createOffline(name)));

  // Версии
  ipcMain.handle('versions:manifest', () => wrap(() => VersionManager.fetchManifest()));
  ipcMain.handle('versions:installed', () => wrap(async () => Storage.loadInstances()));
  
  // Исправленный вызов: теперь он восстанавливает JSON, если его нет
  ipcMain.handle('versions:get-json', (_, id) => wrap(() => VersionManager.resolveVersion(id)));
  
  ipcMain.handle('versions:delete', (_, id) => wrap(async () => {
    await fs.rm(paths.instanceDir(id), { recursive: true, force: true });
    const list = await Storage.loadInstances();
    await Storage.saveInstances(list.filter((i: any) => i.id !== id));
    return true;
  }));
  
  ipcMain.handle('versions:download', (_, v) => wrap(async () => {
    win.webContents.send('launch:progress', { stage: 'downloading', current: 0, total: 100, message: 'Скачивание JSON...' });
    
    // Скачиваем JSON
    const json = await VersionManager.downloadClientJson(v);
    
    // ВАЖНО: Копируем JSON в папку инстанса, чтобы он там был!
    const instanceDir = paths.instanceDir(v.id);
    await fs.mkdir(instanceDir, { recursive: true });
    await fs.writeFile(path.join(instanceDir, `${v.id}.json`), JSON.stringify(json, null, 2));
    
    await VersionManager.ensureClientJar(json, (p) => win.webContents.send('launch:progress', { stage: 'downloading', current: p * 100, total: 100, message: 'Клиент...' }));
    await VersionManager.ensureLibraries(json, (cur, total) => win.webContents.send('launch:progress', { stage: 'downloading', current: cur, total, message: 'Библиотеки...' }));
    await VersionManager.ensureAssets(json, (cur, total) => win.webContents.send('launch:progress', { stage: 'downloading', current: cur, total, message: 'Ассеты...' }));
    win.webContents.send('launch:progress', { stage: 'exited', current: 0, total: 0, message: 'Готово' });
    return json;
  }));

  // Загрузчики
  ipcMain.handle('loaders:fabric:versions', (_, mc) => wrap(() => VersionManager.getFabricLoaders(mc)));
  ipcMain.handle('loaders:quilt:versions', () => wrap(() => VersionManager.getQuiltLoaders()));
  ipcMain.handle('loaders:forge:versions', (_, mc) => wrap(() => VersionManager.getForgeVersions(mc)));
  ipcMain.handle('loaders:neoforge:versions', (_, mc) => wrap(() => VersionManager.getNeoForgeVersions(mc)));

  const installLoader = (fnName: string) => async (_: any, ...args: any[]) => {
    try {
      const progress = (msg: string, cur = 0, total = 100) => win.webContents.send('launch:progress', { stage: 'downloading', current: cur, total, message: msg });
      await (VersionManager as any)[fnName](...args, progress);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    } finally {
      win.webContents.send('launch:progress', { stage: 'exited', current: 0, total: 0, message: 'Готово' });
    }
  };
  ipcMain.handle('loaders:fabric:install', installLoader('installFabric'));
  ipcMain.handle('loaders:quilt:install', installLoader('installQuilt'));
  ipcMain.handle('loaders:forge:install', installLoader('installForge'));
  ipcMain.handle('loaders:neoforge:install', installLoader('installNeoForge'));

  // Запуск
  ipcMain.handle('game:launch', (_, { profile, version, settings }) => wrap(() => launcher.launch(profile, version, settings)));
  ipcMain.handle('game:get-dir', (_, id) => wrap(async () => paths.instanceDir(id)));

  // Файлы и папки
  ipcMain.handle('shell:open-folder', (_, p: string) => wrap(async () => {
    const { shell } = await import('electron');
    await shell.openPath(p);
    return true;
  }));

  ipcMain.handle('fs:list-files', (_, dir: string, exts?: string[]) => wrap(async () => {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      return await Promise.all(entries
        .filter(e => e.isFile() && (!exts || exts.some(x => e.name.endsWith(x))))
        .map(async e => {
          const stat = await fs.stat(path.join(dir, e.name));
          return { name: e.name, size: stat.size, enabled: !e.name.endsWith('.disabled') };
        }));
    } catch { return []; }
  }));

  ipcMain.handle('fs:toggle-mod', (_, p: string) => wrap(async () => {
    if (p.endsWith('.disabled')) {
      const np = p.replace('.disabled', '');
      await fs.rename(p, np);
      return { ok: true, enabled: true, newPath: np };
    } else {
      const np = `${p}.disabled`;
      await fs.rename(p, np);
      return { ok: true, enabled: false, newPath: np };
    }
  }));

  // Миры
  ipcMain.handle('fs:list-worlds', (_, instanceId: string) => wrap(async () => {
    const savesDir = path.join(paths.instanceDir(instanceId), 'saves');
    try {
      const entries = await fs.readdir(savesDir, { withFileTypes: true });
      return entries.filter(e => e.isDirectory()).map(e => e.name);
    } catch { return []; }
  }));

  // Журнал (latest.log)
  ipcMain.handle('fs:read-log', (_, instanceId: string) => wrap(async () => {
    const logPath = path.join(paths.instanceDir(instanceId), 'logs', 'latest.log');
    try {
      const content = await fs.readFile(logPath, 'utf8');
      return content.split('\n').slice(-100).join('\n');
    } catch { return 'Лог пуст или ещё не создан.'; }
  }));

  // Modrinth
  ipcMain.handle('modrinth:search', (_, q, opts) => wrap(() => ModrinthService.search(q, opts)));
  ipcMain.handle('modrinth:popular', (_, t, o) => wrap(() => ModrinthService.getPopular(t, o)));
  ipcMain.handle('modrinth:versions', (_, id, l, v) => wrap(() => ModrinthService.getVersions(id, l, v)));
  ipcMain.handle('modrinth:download', (_, projectId, instanceId, gameVersion, loader) => wrap(() => {
    const modsDir = paths.instanceMods(instanceId);
    return ModrinthService.downloadModWithDeps(projectId, modsDir, gameVersion, loader);
  }));

  // Окно
  ipcMain.on('window:minimize', () => win.minimize());
  ipcMain.on('window:maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
  ipcMain.on('window:close', () => win.close());
}