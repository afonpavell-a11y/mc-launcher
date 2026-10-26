import fs from 'node:fs/promises';
import path from 'node:path';
import { http } from '../utils/retry';
import { ensureDir } from '../utils/paths';
import { Logger } from './Logger';

const BASE = 'https://api.modrinth.com/v2';
const HEADERS = { 'User-Agent': 'mc-launcher/1.0.0 (contact@example.com)' };

export class ModrinthService {
  static async search(query: string, opts: { type?: string; offset?: number }) {
    try {
      const facets: string[][] = [];
      if (opts.type) facets.push([`project_type:${opts.type}`]);
      const params: any = { query, limit: 20, offset: opts.offset || 0 };
      // Отправляем facets только если они есть — иначе API может вернуть 400
      if (facets.length > 0) params.facets = JSON.stringify(facets);
      
      const { data } = await http.get(`${BASE}/search`, { headers: HEADERS, params });
      return { hits: data.hits || [], total: data.total_hits || 0 };
    } catch (e: any) {
      Logger.error('Search failed', e.message);
      return { hits: [], total: 0 };
    }
  }

  static async getPopular(type: string, offset = 0, limit = 20) {
    try {
      const facets = [[`project_type:${type}`]];
      const { data } = await http.get(`${BASE}/search`, {
        headers: HEADERS,
        params: { limit, offset, index: 'downloads', facets: JSON.stringify(facets) },
      });
      return { hits: data.hits || [], total: data.total_hits || 0 };
    } catch (e: any) {
      Logger.error('GetPopular failed', e.message);
      return { hits: [], total: 0 };
    }
  }

  static async getVersions(projectId: string, loader?: string, gameVersion?: string) {
    try {
      const params: Record<string, string> = {};
      if (loader) params.loaders = JSON.stringify([loader]);
      if (gameVersion) params.game_versions = JSON.stringify([gameVersion]);
      const { data } = await http.get(`${BASE}/project/${projectId}/version`, { headers: HEADERS, params });
      return data || [];
    } catch (e: any) {
      Logger.error(`Failed to fetch versions for ${projectId}`, e.message);
      return [];
    }
  }

  // Рекурсивное скачивание зависимостей
  static async downloadModWithDeps(
    projectId: string, 
    modsDir: string, 
    gameVersion?: string, 
    loader?: string,
    installed: Set<string> = new Set()
  ): Promise<{ ok: boolean; error?: string; downloaded: string[] }> {
    const downloaded: string[] = [];
    try {
      if (installed.has(projectId)) return { ok: true, downloaded };
      
      const versions = await this.getVersions(projectId, loader, gameVersion);
      if (versions.length === 0) throw new Error(`Нет версий для ${projectId}`);
      
      const version = versions[0];
      
      // Скачиваем зависимости
      for (const dep of version.dependencies) {
        if (dep.dependency_type === 'required') {
          const res = await this.downloadModWithDeps(dep.project_id, modsDir, gameVersion, loader, installed);
          downloaded.push(...res.downloaded);
        }
      }

      // Скачиваем сам мод
      const file = version.files.find((f: any) => f.primary) || version.files[0];
      if (!file) throw new Error('Файл не найден');

      const dest = path.join(modsDir, file.filename);
      try { await fs.access(dest); return { ok: true, downloaded }; } catch {}

      await ensureDir(modsDir);
      const res = await http.get(file.url, { responseType: 'stream' });
      const w = (await import('node:fs')).createWriteStream(dest);
      await new Promise<void>((resolve, reject) => {
        res.data.pipe(w);
        w.on('finish', resolve);
        w.on('error', reject);
      });
      
      installed.add(projectId);
      downloaded.push(file.filename);
      Logger.info(`[Modrinth] Downloaded ${file.filename}`);
      return { ok: true, downloaded };
    } catch (e: any) {
      Logger.error(`[Modrinth] Failed ${projectId}`, e.message);
      return { ok: false, error: e.message, downloaded };
    }
  }
}