import fs from 'node:fs';
import path from 'node:path';
import { paths, ensureDir } from '../utils/paths';

export class Logger {
  private static stream: fs.WriteStream | null = null;

  static async init() {
    await ensureDir(paths.logs());
    const file = path.join(paths.logs(), `launcher-${new Date().toISOString().slice(0, 10)}.log`);
    this.stream = fs.createWriteStream(file, { flags: 'a' });
  }

  static info(msg: string, ...meta: unknown[]) {
    this.write('INFO', msg, meta);
  }

  static warn(msg: string, ...meta: unknown[]) {
    this.write('WARN', msg, meta);
  }

  static error(msg: string, err?: unknown) {
    this.write('ERROR', msg, [err instanceof Error ? err.stack : err]);
  }

  static write(level: string, msg: string, meta: unknown[] = []) {
    const line = `[${new Date().toISOString()}] [${level}] ${msg} ${meta.map((m) => {
      try { return JSON.stringify(m); } catch { return String(m); }
    }).join(' ')}\n`;
    
    this.stream?.write(line);
    if (process.env.NODE_ENV !== 'production') console.log(line.trim());
  }
}