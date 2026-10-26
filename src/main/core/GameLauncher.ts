import { spawn, ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import { BrowserWindow } from 'electron';
import { VersionJson } from './VersionManager';
import { paths, ensureDir } from '../utils/paths';
import { JavaManager } from './JavaManager';
import { Logger } from './Logger';
import type { Profile, Settings } from '../../shared/types';

export class GameLauncher {
  private proc: ChildProcess | null = null;

  constructor(private win: BrowserWindow) {}

  async launch(profile: Profile, version: VersionJson, settings: Settings) {
    if (!profile || !profile.id) throw new Error('Профиль не выбран');
    if (this.proc) throw new Error('Игра уже запущена');

    const id = version.id;
    const instanceDir = paths.instanceDir(id);
    const gameDir = instanceDir;
    const nativesDir = paths.instanceNatives(id);
    await ensureDir(gameDir);
    await ensureDir(nativesDir);

    const mcVer = version.inheritsFrom || id.split('-').pop() || '1.21';
    let javaMajor = 8;
    if (mcVer.startsWith('1.21') || mcVer.startsWith('1.20.5') || mcVer.startsWith('1.20.6')) javaMajor = 21;
    else if (mcVer.startsWith('1.18') || mcVer.startsWith('1.19') || mcVer.startsWith('1.20')) javaMajor = 17;
    else if (mcVer.startsWith('1.17')) javaMajor = 16;

    this.sendProgress('preparing', 0, 100, `Подготовка Java ${javaMajor}...`);
    const java = settings.javaPath ?? (await JavaManager.ensure(javaMajor));

    this.sendProgress('preparing', 50, 100, 'Распаковка нативов...');
    await this.extractNatives(version, nativesDir);

    const sep = process.platform === 'win32' ? ';' : ':';
    const libs: string[] = [];
    for (const l of version.libraries) {
      if (l.natives) continue;
      if (l.name && l.name.startsWith('net.fabricmc:fabric-loader')) continue;
      if (l.downloads?.artifact) { libs.push(path.join(paths.libraries(), l.downloads.artifact.path)); continue; }
      if (l.name) {
        const parts = l.name.split(':');
        if (parts.length >= 3) {
          const p = parts[0].replace(/\./g, '/') + '/' + parts[1] + '/' + parts[2] + '/' + parts[1] + '-' + parts[2] + '.jar';
          libs.push(path.join(paths.libraries(), p));
        }
      }
    }
    libs.push(paths.clientJar(version.inheritsFrom || version.id));
    libs.push(paths.instanceJar(id));
    const classpath = libs.join(sep);

    const vars: Record<string, string> = {
      auth_player_name: profile.name,
      version_name: id,
      game_directory: gameDir,
      assets_root: paths.assets(),
      assets_index_name: version.assetIndex.id,
      auth_uuid: profile.uuid.replace(/-/g, ''),
      auth_access_token: profile.accessToken ?? '0',
      user_type: profile.type === 'microsoft' ? 'msa' : 'legacy',
      version_type: version.type,
      natives_directory: nativesDir,
      classpath: classpath,
    };

    const resolveArgs = (args: any[]) => {
      const out: string[] = [];
      const apply = (s: string) => s.replace(/\$\{(\w+)\}/g, (_, k) => vars[k] ?? '');
      for (const a of args) {
        if (typeof a === 'string') { out.push(apply(a)); continue; }
        if (a.value) {
          const v = Array.isArray(a.value) ? a.value : [a.value];
          for (const x of v) out.push(apply(x));
        }
      }
      return out;
    };

    const jvmArgs = resolveArgs(version.arguments?.jvm || [])
      .filter(a => !a.startsWith('-Xmx') && !a.startsWith('-Xms') && !a.startsWith('-XstartOnFirstThread') && a.trim() !== '')
      .map(a => a.replace(/= /g, '='));

    let gameArgs: string[] = [];
    if (version.arguments?.game) {
      gameArgs = resolveArgs(version.arguments.game);
    } else if (version.minecraftArguments) {
      gameArgs = version.minecraftArguments.split(' ').map(a => 
        a.replace(/\$\{(\w+)\}/g, (_, k) => vars[k] ?? '')
      );
    }

    gameArgs = gameArgs.filter(arg => {
      if (!arg || arg.trim() === '') return false;
      const problematicFlags = [
        '--quickPlayRealms', '--quickPlayPath', '--quickPlaySingleplayer', '--quickPlayMultiplayer',
        '--clientId', '--xuid', '--width', '--height', '--demo',
      ];
      if (problematicFlags.includes(arg)) return false;
      return true;
    });

    const memoryArgs = [`-Xms${settings.ramMinMb}M`, `-Xmx${settings.ramMaxMb}M`];
    const fullArgs = [...memoryArgs, ...jvmArgs, version.mainClass, ...gameArgs];
    
    Logger.info('Launching:', java, fullArgs.join(' '));
    this.sendProgress('launching', 100, 100, 'Запуск Minecraft...');

    this.proc = spawn(java, fullArgs, { cwd: gameDir, env: { ...process.env } });

    let isRunningSent = false;
    const markAsRunning = () => {
      if (!isRunningSent) {
        isRunningSent = true;
        this.sendProgress('running', 1, 1, 'Игра запущена');
        clearTimeout(runningTimer);
      }
    };

    // Страховка: если логи не пришли за 8 секунд, но процесс жив — считаем, что запустилось
    const runningTimer = setTimeout(() => {
      if (this.proc) markAsRunning();
    }, 8000);

    this.proc.stdout?.on('data', (d) => {
      const line = d.toString();
      console.log('[MC]:', line.trim());
      this.win.webContents.send('launch:log', { type: 'stdout', line, ts: Date.now() });
      markAsRunning(); // Как только пошел лог — игра запустилась
    });

    this.proc.stderr?.on('data', (d) => {
      const line = d.toString();
      console.error('[MC ERROR]:', line.trim());
      this.win.webContents.send('launch:log', { type: 'stderr', line, ts: Date.now() });
      markAsRunning(); // Java часто пишет варнинги в stderr при старте
    });

    this.proc.on('exit', (code) => {
      clearTimeout(runningTimer);
      this.sendProgress('exited', 0, 0, `Игра закрыта (${code})`);
      this.proc = null;
    });

    this.proc.on('error', (err) => {
      clearTimeout(runningTimer);
      this.sendProgress('exited', 0, 0, `Ошибка: ${err.message}`);
      this.proc = null;
    });
  }

  private sendProgress(stage: any, current: number, total: number, message: string) {
    this.win.webContents.send('launch:progress', { stage, current, total, message });
  }

  private async extractNatives(v: VersionJson, dest: string) {
    const os = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux';
    const unzipper = await import('unzipper');
    for (const lib of v.libraries) {
      if (!lib.natives || !lib.natives[os]) continue;
      const cls = lib.natives[os].replace('${arch}', process.arch === 'x64' ? '64' : '32');
      const artifact = lib.downloads?.classifiers?.[cls];
      if (!artifact) continue;
      const jarPath = path.join(paths.libraries(), artifact.path);
      try {
        await unzipper.Open.file(jarPath).then((d: any) => d.extract({ path: dest, concurrency: 5 }));
      } catch {}
    }
  }
}