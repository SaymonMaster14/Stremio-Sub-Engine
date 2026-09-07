import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(p));
    else if (entry.name.endsWith('.mjs') && entry.name !== 'index.mjs') out.push(p);
  }
  return out;
}
for (const file of await walk(path.resolve('src'))) await import(pathToFileURL(file));
console.log('Imported all source modules successfully.');
