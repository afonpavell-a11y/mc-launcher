import fs from 'node:fs/promises';
import { safeStorage } from 'electron';
import { paths, ensureDir } from '../utils/paths';
import type { Profile, Settings } from '../../shared/types';

export interface Instance {
  id: string;
  mcVersion: string;
  loader: 'vanilla' | 'fabric' | 'forge' | 'quilt' | 'neoforge';
  loaderVersion?: string;
  createdAt: number;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  ramMinMb: 1024,
  ramMaxMb: 4096,
  closeLauncherOnGameStart: false,
  showSnapshots: false,
};

export class Storage {
  static async loadSettings(): Promise<Settings> {
    try {
      const raw = await fs.readFile(paths.settings(), 'utf8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch { return DEFAULT_SETTINGS; }
  }

  static async saveSettings(s: Settings) {
    await ensureDir(paths.root());
    await fs.writeFile(paths.settings(), JSON.stringify(s, null, 2));
  }

  static async loadProfiles(): Promise<Profile[]> {
    try {
      const raw = await fs.readFile(paths.profiles(), 'utf8');
      const data = JSON.parse(raw) as { encrypted: boolean; payload: string };
      if (data.encrypted && safeStorage.isEncryptionAvailable()) {
        const dec = safeStorage.decryptString(Buffer.from(data.payload, 'base64'));
        return JSON.parse(dec);
      }
      return JSON.parse(data.payload);
    } catch { return []; }
  }

  static async saveProfiles(profiles: Profile[]) {
    await ensureDir(paths.root());
    const json = JSON.stringify(profiles);
    const encrypted = safeStorage.isEncryptionAvailable();
    const payload = encrypted ? safeStorage.encryptString(json).toString('base64') : json;
    await fs.writeFile(paths.profiles(), JSON.stringify({ encrypted, payload }));
  }

  static async loadInstances(): Promise<Instance[]> {
    try {
      const raw = await fs.readFile(paths.instancesFile(), 'utf8');
      return JSON.parse(raw);
    } catch { return []; }
  }

  static async saveInstances(instances: Instance[]) {
    await ensureDir(paths.root());
    await fs.writeFile(paths.instancesFile(), JSON.stringify(instances, null, 2));
  }
}