import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

async function atomicWrite(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, data);
  await fs.rename(temp, file);
}

export class DiskCache {
  constructor(root, ttlSeconds = 86400) {
    this.root = root;
    this.ttlMs = ttlSeconds * 1000;
  }
  key(value) {
    return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
  }
  file(namespace, key, ext = 'json') {
    return path.join(this.root, namespace, `${key}.${ext}`);
  }
  async getJson(namespace, key) {
    try {
      const file = this.file(namespace, key);
      const stat = await fs.stat(file);
      if (Date.now() - stat.mtimeMs > this.ttlMs) return null;
      return JSON.parse(await fs.readFile(file, 'utf8'));
    } catch { return null; }
  }
  async setJson(namespace, key, value) {
    await atomicWrite(this.file(namespace, key), JSON.stringify(value));
  }
  async getText(namespace, key, ext = 'srt') {
    try {
      const file = this.file(namespace, key, ext);
      const stat = await fs.stat(file);
      if (Date.now() - stat.mtimeMs > this.ttlMs) return null;
      return await fs.readFile(file, 'utf8');
    } catch { return null; }
  }
  async setText(namespace, key, value, ext = 'srt') {
    await atomicWrite(this.file(namespace, key, ext), value);
  }
}

export class JobStore {
  constructor(root, ttlSeconds = 21600) {
    this.root = path.join(root, 'jobs');
    this.ttlMs = ttlSeconds * 1000;
  }
  async create(job) {
    const id = randomUUID();
    await atomicWrite(path.join(this.root, `${id}.json`), JSON.stringify({ ...job, createdAt: Date.now() }));
    return id;
  }
  async get(id) {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    try {
      const file = path.join(this.root, `${id}.json`);
      const raw = JSON.parse(await fs.readFile(file, 'utf8'));
      if (Date.now() - raw.createdAt > this.ttlMs) return null;
      return raw;
    } catch { return null; }
  }
}
