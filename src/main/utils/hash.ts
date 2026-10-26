import crypto from 'node:crypto';
import fs from 'node:fs';

export function sha1File(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha1');
    const s = fs.createReadStream(file);
    s.on('data', (d) => h.update(d));
    s.on('error', reject);
    s.on('end', () => resolve(h.digest('hex')));
  });
}

export async function fileExists(p: string) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function verifySha1(file: string, expected: string) {
  if (!(await fileExists(file))) return false;
  const actual = await sha1File(file);
  return actual === expected;
}

export function uuidV3FromName(name: string, namespace = 'OfflinePlayer') {
  const ns = crypto.createHash('md5').update(namespace).digest();
  const buf = crypto.createHash('md5').update(Buffer.concat([ns, Buffer.from(name, 'utf8')])).digest();
  buf[6] = (buf[6] & 0x0f) | 0x30;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const hex = buf.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}