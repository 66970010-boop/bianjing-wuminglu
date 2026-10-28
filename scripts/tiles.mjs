import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { promisify } from 'node:util';
import { people } from '../src/world.ts';

const run = promisify(execFile);
const [src] = process.argv.slice(2);
if (!src) throw new Error('usage: npm run tiles -- <Alongtheriver_QingMing.jpg>');

const W = 38414;
const H = 1800;
const jobs = [];
const cwebp = (args, out) => jobs.push(() => run('cwebp', ['-quiet', '-mt', ...args, src, '-o', out]));

await Promise.all(['h', 'f', 'people'].map((d) => mkdir(`public/${d === 'people' ? 'people' : `tiles/${d}`}`, { recursive: true })));

cwebp(['-q', '72', '-resize', '4800', '225'], 'public/tiles/ov.webp');

for (let i = 0; i * 2048 < W; i++) {
  const w = Math.min(2048, W - i * 2048);
  cwebp(['-q', '68', '-crop', String(i * 2048), '0', String(w), String(H), '-resize', String(w / 2), String(H / 2)], `public/tiles/h/${i}.webp`);
}
for (let i = 0; i * 1024 < W; i++) {
  const w = Math.min(1024, W - i * 1024);
  cwebp(['-q', '66', '-crop', String(i * 1024), '0', String(w), String(H)], `public/tiles/f/${i}.webp`);
}
for (const p of people.filter((q) => q.crop[2])) {
  const [w, h] = p.crop.slice(2);
  const x = Math.max(0, Math.min(W - w, p.crop[0]));
  const y = Math.max(0, Math.min(H - h, p.crop[1]));
  cwebp(['-q', '85', '-crop', String(x), String(y), String(w), String(h), '-resize', '240', '240'], `public/people/${p.id}.webp`);
}

let next = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (next < jobs.length) await jobs[next++]();
  }),
);
console.log(`${jobs.length} images written`);
