import fs from 'node:fs/promises';
import path from 'node:path';
import { http } from '../utils/retry';
import { paths, ensureDir } from '../utils/paths';
import { sha1File, verifySha1 } from '../utils/hash';
import { Logger } from './Logger';
import { Storage } from './Storage';
import type { VersionSummary } from '../../shared/types';

const MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

export interface VersionJson {
  id: string;
  type: string;
  mainClass: string;
  assets: string;
  assetIndex: { id: string; url: string; sha1: string; size: number };
  downloads: { client: { url: string; sha1: string; size: number } };
  libraries: Library[];
  arguments?: { game: ArgEntry[]; jvm: ArgEntry[] };
  minecraftArguments?: string;
  javaVersion?: { majorVersion: number };
  inheritsFrom?: string;
}

export interface Library {
  name: string;
  downloads?: { 
    artifact?: { path: string; url: string; sha1: string; size: number };
    classifiers?: Record<string, { path: string; url: string; sha1: string; size: number }>;
  };
  natives?: Record<string, string>;
  rules?: { action: string; os?: { name: string } }[];
  extract?: { exclude: string[] };
  url?: string;
}

type ArgEntry = string | { rules?: { action: string; os?: { name: string } }[]; value: string | string[] };

async function asyncPool<T, R>(poolLimit: number, array: T[], iteratorFn: (item: T) => Promise<R>): Promise<R[]> {
  const ret: Promise<R>[] = [];
  const executing: Promise<any>[] = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);
    if (poolLimit <= array.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

export class VersionManager {
  static async fetchManifest(): Promise<{ latest: Record<string, string>; versions: VersionSummary[] }> {
    const { data } = await http.get(MANIFEST_URL);
    return data;
  }

  static async fetchVersionJson(url: string): Promise<VersionJson> {
    const { data } = await http.get(url);
    return data;
  }

  static async downloadClientJson(v: VersionSummary): Promise<VersionJson> {
    await ensureDir(paths.versionDir(v.id));
    const json = await this.fetchVersionJson(v.url);
    await fs.writeFile(paths.versionJson(v.id), JSON.stringify(json, null, 2));
    return json;
  }

  // === ИСПРАВЛЕННЫЙ МЕТОД (добавлено восстановление JSON, если его нет) ===
  static async resolveVersion(id: string): Promise<VersionJson> {
    const jsonPath = paths.instanceJson(id);
    const globalPath = paths.versionJson(id);

    let raw = '';
    try {
      // 1. Пробуем прочитать из папки инстанса
      raw = await fs.readFile(jsonPath, 'utf8');
    } catch {
      try {
        // 2. Если нет — берем из общей папки версий и копируем в инстанс
        raw = await fs.readFile(globalPath, 'utf8');
        await ensureDir(paths.instanceDir(id));
        await fs.writeFile(jsonPath, raw);
      } catch {
        // 3. Если нет и там — пробуем скачать из манифеста (для ванильных версий)
        try {
          const manifest = await this.fetchManifest();
          const v = manifest.versions.find((x: any) => x.id === id);
          if (!v) throw new Error('Не найдено в манифесте');
          const json = await this.fetchVersionJson(v.url);
          const jsonStr = JSON.stringify(json, null, 2);
          await ensureDir(paths.instanceDir(id));
          await fs.writeFile(jsonPath, jsonStr);
          raw = jsonStr;
        } catch (e) {
          throw new Error(`JSON не найден для ${id}. Переустановите инстанс.`);
        }
      }
    }

    const version: VersionJson = JSON.parse(raw);

    if (version.inheritsFrom) {
      const parentPath = paths.versionJson(version.inheritsFrom);
      const parentRaw = await fs.readFile(parentPath, 'utf8');
      const parent: VersionJson = JSON.parse(parentRaw);
      
      const filterArgs = (args: ArgEntry[]) => args.filter((a: any) => {
        if (typeof a === 'string') return true;
        if (!a.rules) return true;
        let allowed = false;
        for (const rule of a.rules) {
          const osMatch = !rule.os || rule.os.name === this.currentOS();
          if (osMatch) allowed = rule.action === 'allow';
        }
        return allowed;
      });

      const parentJvm = filterArgs(parent.arguments?.jvm || []);
      const parentGame = filterArgs(parent.arguments?.game || []);
      const childJvm = filterArgs(version.arguments?.jvm || []);
      const childGame = filterArgs(version.arguments?.game || []);

      const libs = [...(parent.libraries || []), ...(version.libraries || [])];
      
      return {
        ...parent,
        ...version,
        libraries: libs,
        arguments: { jvm: [...parentJvm, ...childJvm], game: [...parentGame, ...childGame] },
      };
    }
    return version;
  }
  // =====================================================================

  static async ensureClientJar(v: VersionJson, onProgress?: (p: number) => void) {
    const dest = paths.clientJar(v.id);
    if (await verifySha1(dest, v.downloads.client.sha1)) return;
    await ensureDir(path.dirname(dest));
    await this.downloadFile(v.downloads.client.url, dest, v.downloads.client.sha1, onProgress);
  }

  static async ensureLibraries(v: VersionJson, onProgress?: (cur: number, total: number) => void) {
    const valid = v.libraries.filter((l) => this.isLibraryAllowed(l));
    let done = 0;
    await asyncPool(16, valid, async (lib) => {
      const artifact = lib.downloads?.artifact;
      if (artifact) {
        const dest = path.join(paths.libraries(), artifact.path);
        let exists = true;
        try { await fs.access(dest); } catch { exists = false; }
        if (!exists) {
          await ensureDir(path.dirname(dest));
          const urls = [artifact.url, artifact.url.replace('libraries.minecraft.net', 'maven.fabricmc.net'), artifact.url.replace('libraries.minecraft.net', 'repo1.maven.org/maven2')];
          for (const url of urls) {
            try { await this.downloadFile(url, dest, artifact.sha1); break; } catch {}
          }
        }
      }
      if (lib.natives) {
        const os = this.currentOS();
        if (lib.natives[os]) {
          const cls = lib.natives[os].replace('${arch}', process.arch === 'x64' ? '64' : '32');
          const nat = lib.downloads?.classifiers?.[cls];
          if (nat) {
            const dest = path.join(paths.libraries(), nat.path);
            try { await fs.access(dest); } catch {
              await ensureDir(path.dirname(dest));
              try { await this.downloadFile(nat.url, dest, nat.sha1); } catch {}
            }
          }
        }
      }
      if (!artifact && !lib.natives && lib.name) {
        const parts = lib.name.split(':');
        if (parts.length >= 3) {
          const pStr = parts[0].replace(/\./g, '/') + '/' + parts[1] + '/' + parts[2] + '/' + parts[1] + '-' + parts[2] + '.jar';
          const dest = path.join(paths.libraries(), pStr);
          try { await fs.access(dest); } catch {
            await ensureDir(path.dirname(dest));
            try { await this.downloadFile(`https://libraries.minecraft.net/${pStr}`, dest, ''); } catch {
              try { await this.downloadFile(`https://maven.fabricmc.net/${pStr}`, dest, ''); } catch {}
            }
          }
        }
      }
      onProgress?.(++done, valid.length);
    });
  }

  static async ensureAssets(v: VersionJson, onProgress?: (cur: number, total: number) => void) {
    const idxPath = path.join(paths.assets(), 'indexes', `${v.assetIndex.id}.json`);
    if (!(await verifySha1(idxPath, v.assetIndex.sha1))) {
      await ensureDir(path.dirname(idxPath));
      await this.downloadFile(v.assetIndex.url, idxPath, v.assetIndex.sha1);
    }
    const index = JSON.parse(await fs.readFile(idxPath, 'utf8')) as { objects: Record<string, { hash: string; size: number }> };
    const entries = Object.values(index.objects);
    let done = 0;
    await asyncPool(32, entries, async (obj) => {
      const sub = obj.hash.slice(0, 2);
      const dest = path.join(paths.assets(), 'objects', sub, obj.hash);
      let need = true;
      try { const stat = await fs.stat(dest); if (stat.size === obj.size) need = false; } catch {}
      if (need) {
        await ensureDir(path.dirname(dest));
        try { await this.downloadFile(`https://resources.download.minecraft.net/${sub}/${obj.hash}`, dest, obj.hash); } catch {
          try { await fs.writeFile(dest, Buffer.alloc(obj.size || 0)); } catch {}
        }
      }
      onProgress?.(++done, entries.length);
    });
  }

  static async downloadFile(url: string, dest: string, sha1: string, onProgress?: (p: number) => void) {
    const res = await http.get(url, { responseType: 'stream' });
    const total = Number(res.headers['content-length'] ?? 0);
    let received = 0;
    const tmp = `${dest}.${Date.now()}.part`;
    const w = (await import('node:fs')).createWriteStream(tmp);
    await new Promise<void>((resolve, reject) => {
      res.data.on('data', (c: Buffer) => { received += c.length; if (total && onProgress) onProgress(received / total); });
      res.data.pipe(w);
      w.on('finish', resolve);
      w.on('error', reject);
      res.data.on('error', reject);
    });
    if (sha1) {
      const actual = await sha1File(tmp);
      if (actual !== sha1) { await fs.unlink(tmp).catch(()=>{}); throw new Error('SHA1 mismatch'); }
    }
    await fs.rename(tmp, dest).catch(async () => { await fs.unlink(tmp).catch(()=>{}); });
  }

  static isLibraryAllowed(lib: Library): boolean {
    if (!lib.rules) return true;
    let allowed = false;
    for (const rule of lib.rules) {
      const osMatch = !rule.os || rule.os.name === this.currentOS();
      if (osMatch) allowed = rule.action === 'allow';
    }
    return allowed;
  }

  static currentOS(): 'windows' | 'osx' | 'linux' {
    const p = process.platform;
    if (p === 'win32') return 'windows';
    if (p === 'darwin') return 'osx';
    return 'linux';
  }

  static async getFabricLoaders(mcVersion: string): Promise<any[]> {
    try { const { data } = await http.get(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}`); return data; } catch { return []; }
  }
  static async getQuiltLoaders(): Promise<any[]> {
    try { const { data } = await http.get('https://meta.quiltmc.org/v3/versions/loader'); return data; } catch { return []; }
  }
  static async getForgeVersions(mcVersion: string): Promise<string[]> {
    try {
      const { data } = await http.get('https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml');
      return (data.match(/<version>(.*?)<\/version>/g) || []).map((v: string) => v.replace(/<\/?version>/g, '')).filter((v: string) => v.includes(mcVersion + '-')).sort().reverse();
    } catch { return []; }
  }
  static async getNeoForgeVersions(mcVersion: string): Promise<string[]> {
    try {
      const { data } = await http.get('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml');
      return (data.match(/<version>(.*?)<\/version>/g) || []).map((v: string) => v.replace(/<\/?version>/g, '')).filter((v: string) => v.includes(mcVersion)).sort().reverse();
    } catch { return []; }
  }

  static async installFabric(
    mcVersion: string, 
    loaderVersion: string,
    onProgress?: (msg: string, cur?: number, total?: number) => void
  ): Promise<void> {
    try {
      const id = `fabric-loader-${loaderVersion}-${mcVersion}`;
      const instanceDir = paths.instanceDir(id);
      
      await ensureDir(instanceDir);
      await ensureDir(paths.instanceMods(id));

      onProgress?.('Загрузка ванильной версии...', 0, 100);
      const manifest = await this.fetchManifest();
      const vanilla = manifest.versions.find((v: any) => v.id === mcVersion);
      if (!vanilla) throw new Error(`Vanilla ${mcVersion} not found`);

      onProgress?.('Загрузка клиента...', 5, 100);
      const vanillaJson = await this.downloadClientJson(vanilla);

      onProgress?.('Проверка клиента...', 15, 100);
      await this.ensureClientJar(vanillaJson);

      onProgress?.('Загрузка библиотек...', 30, 100);
      await this.ensureLibraries(vanillaJson);

      onProgress?.('Загрузка ассетов...', 50, 100);
      await this.ensureAssets(vanillaJson);

      onProgress?.('Загрузка профиля Fabric...', 80, 100);
      const profile = (await http.get(`https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${loaderVersion}/profile/json`)).data;
      await fs.writeFile(paths.instanceJson(id), JSON.stringify(profile, null, 2));

      onProgress?.('Загрузка лоадера...', 90, 100);
      await this.downloadFile(`https://maven.fabricmc.net/net/fabricmc/fabric-loader/${loaderVersion}/fabric-loader-${loaderVersion}.jar`, paths.instanceJar(id), '');
      await this.ensureLibraries(profile);

      const instances = await Storage.loadInstances();
      if (!instances.find(i => i.id === id)) {
        instances.push({ id, mcVersion, loader: 'fabric', loaderVersion, createdAt: Date.now() });
        await Storage.saveInstances(instances);
      }
      onProgress?.('Готово!', 100, 100);
    } catch (e: any) {
      throw e;
    }
  }

  static async installQuilt(mcVersion: string, loaderVersion: string, onProgress?: (msg: string, cur?: number, total?: number) => void): Promise<void> {
    const id = `quilt-loader-${loaderVersion}-${mcVersion}`;
    await ensureDir(paths.instanceMods(id));
    onProgress?.('Vanilla...', 0, 100);
    const manifest = await this.fetchManifest();
    const vanilla = manifest.versions.find((v: any) => v.id === mcVersion);
    if (vanilla) {
      const vanillaJson = await this.downloadClientJson(vanilla);
      await this.ensureClientJar(vanillaJson);
      onProgress?.('Библиотеки...', 20, 100);
      await this.ensureLibraries(vanillaJson);
      onProgress?.('Ассеты...', 40, 100);
      await this.ensureAssets(vanillaJson);
    }
    onProgress?.('Профиль Quilt...', 70, 100);
    const profile = (await http.get(`https://meta.quiltmc.org/v3/versions/loader/${mcVersion}/${loaderVersion}/profile/json`)).data;
    await fs.writeFile(paths.instanceJson(id), JSON.stringify(profile, null, 2));
    onProgress?.('Лоадер...', 90, 100);
    await this.downloadFile(`https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-loader/${loaderVersion}/quilt-loader-${loaderVersion}.jar`, paths.instanceJar(id), '').catch(()=>{});
    await this.ensureLibraries(profile);
    const instances = await Storage.loadInstances();
    if (!instances.find(i => i.id === id)) {
      instances.push({ id, mcVersion, loader: 'quilt', loaderVersion, createdAt: Date.now() });
      await Storage.saveInstances(instances);
    }
    onProgress?.('Готово!', 100, 100);
  }

  static async installForge(mcVersion: string, forgeVersion: string, onProgress?: (msg: string, cur?: number, total?: number) => void): Promise<void> {
    const id = `forge-${forgeVersion}`;
    await ensureDir(paths.instanceMods(id));
    onProgress?.('Скачивание инсталлятора...', 0, 100);
    const installer = `https://maven.minecraftforge.net/net/minecraftforge/forge/${forgeVersion}/forge-${forgeVersion}-installer.jar`;
    const installerPath = path.join(paths.instanceDir(id), 'installer.jar');
    await this.downloadFile(installer, installerPath, '');
    onProgress?.('Извлечение...', 50, 100);
    const unzipper = await import('unzipper');
    const zip = await unzipper.Open.file(installerPath);
    const versionEntry = zip.files.find((f: any) => f.path === 'version.json');
    if (versionEntry) await fs.writeFile(paths.instanceJson(id), (await versionEntry.buffer()).toString());
    const json = JSON.parse(await fs.readFile(paths.instanceJson(id), 'utf8'));
    onProgress?.('Библиотеки...', 80, 100);
    await this.ensureLibraries(json);
    const instances = await Storage.loadInstances();
    if (!instances.find(i => i.id === id)) {
      instances.push({ id, mcVersion, loader: 'forge', loaderVersion: forgeVersion, createdAt: Date.now() });
      await Storage.saveInstances(instances);
    }
    onProgress?.('Готово!', 100, 100);
  }

  static async installNeoForge(mcVersion: string, neoVersion: string, onProgress?: (msg: string, cur?: number, total?: number) => void): Promise<void> {
    const id = `neoforge-${neoVersion}`;
    await ensureDir(paths.instanceMods(id));
    onProgress?.('Скачивание инсталлятора...', 0, 100);
    const installer = `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoVersion}/neoforge-${neoVersion}-installer.jar`;
    const installerPath = path.join(paths.instanceDir(id), 'installer.jar');
    await this.downloadFile(installer, installerPath, '');
    onProgress?.('Извлечение...', 50, 100);
    const unzipper = await import('unzipper');
    const zip = await unzipper.open.file(installerPath);
    const versionEntry = zip.files.find((f: any) => f.path === 'version.json');
    if (versionEntry) await fs.writeFile(paths.instanceJson(id), (await versionEntry.buffer()).toString());
    const json = JSON.parse(await fs.readFile(paths.instanceJson(id), 'utf8'));
    onProgress?.('Библиотеки...', 80, 100);
    await this.ensureLibraries(json);
    const instances = await Storage.loadInstances();
    if (!instances.find(i => i.id === id)) {
      instances.push({ id, mcVersion, loader: 'neoforge', loaderVersion: neoVersion, createdAt: Date.now() });
      await Storage.saveInstances(instances);
    }
    onProgress?.('Готово!', 100, 100);
  }
}