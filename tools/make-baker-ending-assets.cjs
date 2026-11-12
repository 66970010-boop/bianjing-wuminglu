/* Generator for the baker-ending backdrop and half-body portrait.
   Run: node tools/make-baker-ending-assets.cjs  (then convert PNG to WebP with ffmpeg)
   The backdrop is a procedural cinnabar-to-ochre silk gradient with faint cloud bands. */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const W = 1920, H = 1080;

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function mix(a, b, t) { return a + (b - a) * t; }
function ease(t) { return t * t * (3 - 2 * t); }

// deterministic pseudo random
let seed = 20261113;
function rand() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

// very light value noise for silk mottling
function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263 + seed) >>> 0;
  h = (h ^ (h >>> 13)) * 1274126177 >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function smoothNoise(x, y, scale) {
  const gx = x / scale, gy = y / scale;
  const x0 = Math.floor(gx), y0 = Math.floor(gy);
  const fx = ease(gx - x0), fy = ease(gy - y0);
  const a = hash2(x0, y0), b = hash2(x0 + 1, y0), c = hash2(x0, y0 + 1), d = hash2(x0 + 1, y0 + 1);
  return mix(mix(a, b, fx), mix(c, d, fx), fy);
}

// faint auspicious-cloud rings; low contrast, mostly lower-left and upper-left
const clouds = [
  { x: 210, y: 250, sx: 290, sy: 120, a: -0.28, w: 0.55 },
  { x: 640, y: 175, sx: 220, sy: 90, a: 0.15, w: 0.40 },
  { x: 160, y: 610, sx: 240, sy: 100, a: -0.12, w: 0.42 },
  { x: 470, y: 520, sx: 180, sy: 70, a: 0.24, w: 0.32 },
  { x: 120, y: 980, sx: 300, sy: 120, a: -0.2, w: 0.5 },
  { x: 760, y: 880, sx: 260, sy: 105, a: 0.12, w: 0.36 },
  { x: 1200, y: 180, sx: 230, sy: 95, a: -0.1, w: 0.26 },
  { x: 1050, y: 1040, sx: 320, sy: 130, a: 0.18, w: 0.34 },
];
function cloudField(x, y) {
  let f = 0;
  for (const c of clouds) {
    const dx0 = x - c.x, dy0 = y - c.y;
    const dx = dx0 * Math.cos(c.a) - dy0 * Math.sin(c.a);
    const dy = dx0 * Math.sin(c.a) + dy0 * Math.cos(c.a);
    const d = Math.sqrt((dx / c.sx) ** 2 + (dy / c.sy) ** 2);
    if (d > 2.6) continue;
    f += c.w * Math.exp(-(((d - 1) / 0.22) ** 2));
    f += c.w * 0.35 * Math.exp(-(((d - 0.52) / 0.26) ** 2));
  }
  return Math.min(1, f);
}

const buf = Buffer.alloc(W * H * 3);
const top = [142, 63, 35];      // #8E3F23
const mid = [154, 81, 54];      // #9A5136
const bottom = [185, 143, 111]; // #B98F6F

for (let y = 0; y < H; y++) {
  const t = y / (H - 1);
  // smooth S-curve gradient: most change in the lower half, like the reference
  const tt = ease(clamp(t * 1.02, 0, 1));
  let base;
  if (tt < 0.58) {
    const k = ease(tt / 0.58);
    base = [mix(top[0], mid[0], k), mix(top[1], mid[1], k), mix(top[2], mid[2], k)];
  } else {
    const k = ease((tt - 0.58) / 0.42);
    base = [mix(mid[0], bottom[0], k), mix(mid[1], bottom[1], k), mix(mid[2], bottom[2], k)];
  }
  for (let x = 0; x < W; x++) {
    let r = base[0], g = base[1], b = base[2];

    // soft cloud bands: slightly deeper red-brown + a warm highlight offset
    const cf = cloudField(x, y);
    if (cf > 0.002) {
      const dark = cf * 0.085;
      r *= (1 - dark); g *= (1 - dark * 0.9); b *= (1 - dark * 0.8);
      const hi = Math.max(0, cf - 0.3) * 0.075;
      r += 24 * hi; g += 18 * hi; b += 13 * hi;
    }

    // silk mottling, two octaves, extremely low amplitude
    const n1 = smoothNoise(x, y, 190) - 0.5;
    const n2 = smoothNoise(x, y, 47) - 0.5;
    const m = n1 * 5.5 + n2 * 2.2;
    r += m; g += m * 0.9; b += m * 0.8;

    // silk weave: fine cross lines + tiny grain
    const weave = ((x % 3 === 0) ? 0.9 : 0) + ((y % 4 === 0) ? 0.7 : 0);
    r += weave; g += weave; b += weave;
    const grain = (rand() - 0.5) * 2.6;
    r += grain; g += grain; b += grain;

    // subtle warm vignette at the extreme lower corners
    const vx = Math.abs(x / W - 0.5) * 2, vy = t;
    const vig = vx * vx * vy * vy * 0.028;
    r *= (1 - vig); g *= (1 - vig * 0.9); b *= (1 - vig * 0.85);

    const i = (y * W + x) * 3;
    buf[i] = clamp(Math.round(r), 0, 255);
    buf[i + 1] = clamp(Math.round(g), 0, 255);
    buf[i + 2] = clamp(Math.round(b), 0, 255);
  }
}

// PNG encoder (RGB, no alpha)
function crc32(bufIn) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < bufIn.length; n++) {
    c = (crc ^ bufIn[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  buf.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
const outDir = path.join(__dirname, '..', 'assets');
fs.writeFileSync(path.join(outDir, 'baker-ending-bg.png'), png);
console.log('wrote baker-ending-bg.png', png.length);
