import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { http } from '../utils/retry';
import { paths, ensureDir } from '../utils/paths';
import { Logger } from './Logger';

const execAsync = promisify(exec);

export class JavaManager {
  // Ищет установленный java.exe для нужной версии
  static async findInstalled(major: number): Promise<string | null> {
    const dir = path.join(paths.java(), `jre-${major}`);
    try {
      const entries = await fs.readdir(dir);
      const home = entries.find((e) => e.includes('jdk') || e.includes('jre'));
      if (!home) return null;
      const bin = process.platform === 'win32' ? 'java.exe' : 'java';
      const javaPath = path.join(dir, home, 'bin', bin);
      await fs.access(javaPath); // Проверяем, что файл существует
      return javaPath;
    } catch {
      return null;
    }
  }

  // Скачивает и распаковывает JRE, если её нет
  static async ensure(major: number): Promise<string> {
    const existing = await this.findInstalled(major);
    if (existing) {
      Logger.info(`Java ${major} found: ${existing}`);
      return existing;
    }

    const os = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'mac' : 'linux';
    const arch = process.arch === 'arm64' ? 'aarch64' : 'x64';
    const api = `https://api.adoptium.net/v3/assets/latest/${major}/hotspot?os=${os}&architecture=${arch}&image_type=jre`;
    
    Logger.info(`[Java] Fetching JRE ${major} info...`);
    const { data } = await http.get(api);
    const pkg = data?.[0]?.binary?.package;
    if (!pkg) throw new Error(`Adoptium JRE ${major} not found`);

    const dir = path.join(paths.java(), `jre-${major}`);
    await ensureDir(dir);
    const archive = path.join(dir, pkg.name);
    
    Logger.info(`[Java] Downloading JRE ${major} from ${pkg.link}`);
    await this.download(pkg.link, archive);
    Logger.info(`[Java] Downloaded ${pkg.name}`);

    // Распаковка
    Logger.info(`[Java] Extracting JRE ${major}...`);
    await this.extract(archive, dir);
    Logger.info(`[Java] Extracted`);

    // Удаляем архив после распаковки
    await fs.unlink(archive).catch(() => {});

    // Проверяем, что java.exe на месте
    const result = await this.findInstalled(major);
    if (!result) {
      // Если после распаковки не нашли — показываем, что внутри
      const entries = await fs.readdir(dir).catch(() => []);
      throw new Error(`Java ${major} not found after extraction. Contents of ${dir}: ${entries.join(', ')}`);
    }
    
    Logger.info(`[Java] Java ${major} installed: ${result}`);
    return result;
  }

  private static async download(url: string, dest: string) {
    const res = await http.get(url, { responseType: 'stream' });
    const w = (await import('node:fs')).createWriteStream(dest);
    await new Promise<void>((resolve, reject) => {
      res.data.pipe(w);
      w.on('finish', resolve);
      w.on('error', reject);
    });
  }

  private static async extract(archive: string, dir: string) {
    if (process.platform === 'win32') {
      // Распаковка ZIP через PowerShell
      const cmd = `powershell -command "Expand-Archive -Path '${archive}' -DestinationPath '${dir}' -Force"`;
      Logger.info(`[Java] Running: ${cmd}`);
      await execAsync(cmd);
    } else {
      // Распаковка TAR.GZ
      await execAsync(`tar -xzf "${archive}" -C "${dir}"`);
    }
  }
}