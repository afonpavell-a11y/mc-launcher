import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';

export const getRoot = () => app.getPath('userData');

export const paths = {
  root: () => getRoot(),
  settings: () => path.join(getRoot(), 'settings.json'),
  profiles: () => path.join(getRoot(), 'profiles.json'),
  
  // --- БАЗОВЫЕ ПАПКИ ---
  game: () => path.join(getRoot(), 'game'), // <--- ИМЕННО ЭТОГО НЕ ХВАТАЛО
  versions: () => path.join(getRoot(), 'game', 'versions'),
  libraries: () => path.join(getRoot(), 'game', 'libraries'),
  assets: () => path.join(getRoot(), 'game', 'assets'),
  java: () => path.join(getRoot(), 'java'),
  logs: () => path.join(getRoot(), 'logs'),
  
  // --- ПУТИ ДЛЯ КОНКРЕТНОЙ ВЕРСИИ ---
  versionDir: (vid: string) => path.join(paths.versions(), vid),
  clientJar: (vid: string) => path.join(paths.versionDir(vid), `${vid}.jar`),
  versionJson: (vid: string) => path.join(paths.versionDir(vid), `${vid}.json`),
  natives: (vid: string) => path.join(getRoot(), 'game', 'versions', vid, 'natives'),

  // --- ПУТИ ДЛЯ ИНСТАНСОВ (СБОРОК) ---
  instances: () => path.join(getRoot(), 'instances'),
  instanceDir: (vid: string) => path.join(getRoot(), 'instances', vid),
  instanceJar: (vid: string) => path.join(paths.instanceDir(vid), `${vid}.jar`),
  instanceJson: (vid: string) => path.join(paths.instanceDir(vid), `${vid}.json`),
  instanceNatives: (vid: string) => path.join(paths.instanceDir(vid), 'natives'),
  instanceMods: (vid: string) => path.join(paths.instanceDir(vid), 'mods'),
};

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}