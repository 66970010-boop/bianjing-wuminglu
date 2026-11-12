/*
 * 汴京一日 · 原创交互音效生成器
 * 纯 Node.js，无第三方依赖；全部声音由正弦/噪声包络合成，可复现、无版权风险。
 * 运行：node tools/generate-sfx.cjs
 * 输出：assets/audio/sfx/*.wav 与 manifest.json
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const SR = 44100;
const OUT = path.join(__dirname, '..', 'assets', 'audio', 'sfx');
fs.mkdirSync(OUT, { recursive: true });

/* ---------- 基础工具 ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function make(dur) { return new Float32Array(Math.ceil(dur * SR)); }
function add(buf, startSec, arr, gain = 1) {
  const start = Math.max(0, Math.round(startSec * SR));
  for (let i = 0; i < arr.length && start + i < buf.length; i++) buf[start + i] += arr[i] * gain;
}
function noise(n, seed = 1) {
  const r = mulberry32(seed), out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = r() * 2 - 1;
  return out;
}
function env(t, attack, tau) { return (1 - Math.exp(-t / Math.max(1e-5, attack))) * Math.exp(-t / Math.max(1e-5, tau)); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

/* RBJ biquad，固定系数 */
function biquad(x, type, f0, Q, gainDb = 0) {
  const w0 = 2 * Math.PI * f0 / SR, alpha = Math.sin(w0) / (2 * Q), cw = Math.cos(w0);
  const A = Math.pow(10, gainDb / 40);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
  else if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
  else if (type === 'bp') { b0 = alpha; b1 = 0; b2 = -alpha; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
  else { b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A; }
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}
function sweepFilter(x, type, fStart, fEnd, Q) {
  // 简化的时变单极点滤波，用于扫频音色
  const out = new Float32Array(x.length);
  let lp = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / x.length, f = fStart + (fEnd - fStart) * t;
    const k = clamp(2 * Math.PI * f / SR, 0, 1);
    lp += k * (x[i] - lp);
    out[i] = type === 'hp' ? x[i] - lp : lp;
  }
  return out;
}

/* 木鱼/木块：短促、空心 */
function woodBlock(buf, at, freq, amp = 0.8) {
  const dur = 0.18, n = Math.ceil(dur * SR), part = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const e = Math.exp(-t / 0.045) * (1 - Math.exp(-t / 0.0015));
    part[i] = (Math.sin(2 * Math.PI * freq * t) + 0.42 * Math.sin(2 * Math.PI * freq * 2.41 * t) + 0.18 * Math.sin(2 * Math.PI * freq * 3.9 * t)) * e;
  }
  add(buf, at, part, amp);
  const click = new Float32Array(Math.ceil(0.012 * SR)), r = mulberry32(Math.round(freq));
  for (let i = 0; i < click.length; i++) click[i] = (r() * 2 - 1) * Math.exp(-i / SR / 0.002);
  add(buf, at, biquad(click, 'bp', 1800, 1.2), amp * 0.25);
}
/* 铃：非整数泛音列 + 缓慢衰减 */
function bell(buf, at, freq, amp, dur, partials = [1, 2.01, 2.76, 4.07, 5.43], decayScale = 1) {
  const n = Math.ceil(dur * SR), part = new Float32Array(n);
  const amps = [1, 0.42, 0.24, 0.12, 0.06];
  for (let i = 0; i < n; i++) {
    const t = i / SR; let v = 0;
    for (let p = 0; p < partials.length; p++) {
      const tau = dur * 0.32 / (1 + p * 0.55) * decayScale;
      v += Math.sin(2 * Math.PI * freq * partials[p] * t + p * 0.7) * amps[p] * Math.exp(-t / tau);
    }
    part[i] = v * (1 - Math.exp(-t / 0.004));
  }
  add(buf, at, part, amp);
}
function bubble(buf, at, freq, amp = 0.15, dur = 0.12) {
  const n = Math.ceil(dur * SR), part = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = freq * (1 - 0.4 * t / dur);
    part[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / (dur * 0.35)) * (1 - Math.exp(-t / 0.003));
  }
  add(buf, at, part, amp);
}

/* ---------- 各音效 ---------- */
function uiTap(soft) {
  const b = make(soft ? 0.1 : 0.14);
  woodBlock(b, 0, soft ? 620 : 880, soft ? 0.55 : 0.95);
  return b;
}
function pageTurn() {
  const dur = 0.55, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 11);
  const band = sweepFilter(src, 'lp', 900, 2400, 0.8);
  const hi = biquad(src, 'hp', 2200, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR, envl = Math.sin(Math.PI * Math.min(1, t / 0.42)) ** 1.6;
    b[i] = (band[i] * 0.9 + hi[i] * 0.25) * envl * (0.72 + 0.28 * Math.sin(2 * Math.PI * 13 * t));
  }
  woodBlock(b, 0.34, 240, 0.18);
  return b;
}
function paperRustle() {
  const dur = 0.42, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 23);
  const hp = biquad(src, 'hp', 1400, 0.8), bp = biquad(src, 'bp', 3200, 0.7);
  const r = mulberry32(7);
  for (let i = 0; i < n; i++) {
    const t = i / SR, envl = Math.sin(Math.PI * Math.min(1, t / 0.4)) ** 2;
    const crackle = r() > 0.996 ? (r() * 2 - 1) * 1.8 : 0;
    b[i] = (hp[i] * 0.6 + bp[i] * 0.3 + crackle) * envl * 0.7;
  }
  return b;
}
function paperUnfold() {
  const b = make(0.85);
  add(b, 0, paperRustle(), 0.8);
  add(b, 0.28, paperRustle(), 0.55);
  woodBlock(b, 0.6, 300, 0.12);
  return b;
}
function sealStamp() {
  const b = make(0.5), n = Math.ceil(0.5 * SR);
  const thud = new Float32Array(n), r = mulberry32(31);
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = 105 - 45 * Math.min(1, t / 0.16);
    thud[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.09) * (1 - Math.exp(-t / 0.002));
  }
  add(b, 0, thud, 0.9);
  const burst = new Float32Array(n);
  for (let i = 0; i < n; i++) burst[i] = (r() * 2 - 1) * Math.exp(-i / SR / 0.012);
  add(b, 0, biquad(burst, 'lp', 900, 0.8), 0.35);
  woodBlock(b, 0.018, 360, 0.22);
  return b;
}
function silkSlide(long = false) {
  const dur = long ? 1.3 : 0.75, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 41);
  const lp = biquad(src, 'lp', 1800, 0.6), bp = biquad(src, 'bp', 900, 0.5), air = biquad(src, 'hp', 3000, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR, p = t / dur;
    const envl = Math.sin(Math.PI * Math.min(1, p * 1.1)) ** 2;
    const flutter = 0.65 + 0.35 * Math.sin(2 * Math.PI * (long ? 4 : 7) * t);
    b[i] = (lp[i] * 0.75 + bp[i] * 0.35 + air[i] * 0.12) * envl * flutter * 0.6;
  }
  return b;
}
function brushStroke() {
  const dur = 0.5, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 53);
  const bp = biquad(src, 'bp', 1900, 0.55), hp = biquad(src, 'hp', 900, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR, envl = Math.sin(Math.PI * Math.min(1, t / 0.46)) ** 1.4;
    b[i] = (bp[i] * 0.6 + hp[i] * 0.2) * envl * 0.7;
  }
  return b;
}
function chimeGentle() {
  const b = make(1.5);
  bell(b, 0, 523.25, 0.32, 1.4, [1, 2.01, 2.76, 4.07], 1.1);
  bell(b, 0.03, 659.25, 0.18, 1.2, [1, 2.01, 2.76], 1.1);
  bell(b, 0.06, 783.99, 0.1, 1.0, [1, 2.01], 1.1);
  return b;
}
function chimeComplete() {
  const b = make(2.0);
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => bell(b, i * 0.105, f, 0.26 - i * 0.02, 1.6 - i * 0.1, [1, 2.01, 2.76, 4.07], 1.05));
  return b;
}
function gongSoft() {
  const b = make(2.6), n = Math.ceil(2.6 * SR), part = new Float32Array(n);
  const partials = [1, 1.43, 1.98, 2.84, 4.06], amps = [0.7, 0.35, 0.22, 0.12, 0.06];
  for (let i = 0; i < n; i++) {
    const t = i / SR; let v = 0;
    for (let p = 0; p < partials.length; p++) v += Math.sin(2 * Math.PI * 110 * partials[p] * t) * amps[p] * Math.exp(-t / (1.9 / (1 + p * 0.45)));
    part[i] = v * (1 - Math.exp(-t / 0.01));
  }
  add(b, 0, part, 0.55);
  const s = new Float32Array(n), r = mulberry32(61);
  for (let i = 0; i < n; i++) s[i] = (r() * 2 - 1) * Math.exp(-i / SR / 0.02);
  add(b, 0, biquad(s, 'lp', 700, 0.7), 0.18);
  return b;
}
function templeBell() {
  const b = make(3.4);
  const partials = [1, 2.02, 2.91, 4.08, 5.38, 6.86], amps = [0.8, 0.4, 0.26, 0.14, 0.08, 0.04];
  const n = Math.ceil(3.4 * SR), part = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR; let v = 0;
    for (let p = 0; p < partials.length; p++) v += Math.sin(2 * Math.PI * 196 * partials[p] * t + p) * amps[p] * Math.exp(-t / (2.6 / (1 + p * 0.5)));
    part[i] = v * (1 - Math.exp(-t / 0.006)) * (0.94 + 0.06 * Math.sin(2 * Math.PI * 2.1 * t));
  }
  add(b, 0, part, 0.55);
  return b;
}
function woodfish() {
  const b = make(0.35);
  woodBlock(b, 0, 520, 0.85);
  woodBlock(b, 0.06, 390, 0.25);
  return b;
}
function waterPour(seed = 71) {
  const dur = 1.15, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, seed);
  const lp = biquad(src, 'lp', 2600, 0.6), bp = biquad(src, 'bp', 1200, 0.5);
  const r = mulberry32(seed + 1);
  for (let i = 0; i < n; i++) {
    const t = i / SR, p = t / dur;
    const envl = Math.min(1, t / 0.06) * Math.min(1, (1 - p) / 0.25);
    const mod = 0.55 + 0.45 * Math.abs(Math.sin(2 * Math.PI * (6 + p * 4) * t));
    b[i] = (lp[i] * 0.8 + bp[i] * 0.25) * envl * mod * 0.55;
  }
  for (let k = 0; k < 9; k++) bubble(b, 0.08 + r() * 0.9, 280 + r() * 500, 0.05 + r() * 0.07, 0.08 + r() * 0.1);
  return b;
}
function waterDrip() {
  const b = make(0.7), r = mulberry32(83);
  for (let k = 0; k < 3; k++) {
    const at = k * 0.18 + r() * 0.05, f = 700 + r() * 500, dur = 0.14;
    const n = Math.ceil(dur * SR), part = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR, ff = f * (1 - 0.35 * t / dur);
      part[i] = Math.sin(2 * Math.PI * ff * t) * Math.exp(-t / 0.045) * (1 - Math.exp(-t / 0.002));
    }
    add(b, at, part, 0.35);
  }
  return b;
}
function combSound() {
  const dur = 0.44, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 97);
  const lp = biquad(src, 'lp', 3000, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR, envl = Math.sin(Math.PI * Math.min(1, t / 0.4)) ** 1.4;
    b[i] = lp[i] * envl * 0.35;
  }
  for (let k = 0; k < 9; k++) {
    const at = 0.02 + k * 0.045, arr = new Float32Array(Math.ceil(0.02 * SR));
    for (let i = 0; i < arr.length; i++) arr[i] = Math.sin(2 * Math.PI * 1500 * i / SR) * Math.exp(-i / SR / 0.004);
    add(b, at, arr, 0.18);
  }
  return b;
}
function tweezers() {
  const b = make(0.4), r = mulberry32(101);
  [0, 0.09].forEach((at, idx) => {
    const n = Math.ceil(0.08 * SR), src = noise(n, 101 + idx);
    const bp = biquad(src, 'bp', idx ? 3200 : 2700, 2.0);
    const part = new Float32Array(n);
    for (let i = 0; i < n; i++) part[i] = bp[i] * Math.exp(-i / SR / 0.012) + Math.sin(2 * Math.PI * (idx ? 3100 : 2600) * i / SR) * Math.exp(-i / SR / 0.02) * 0.3;
    add(b, at, part, 0.55);
  });
  return b;
}
function scissors() {
  const b = make(0.42), r = mulberry32(113);
  [0.01, 0.2].forEach((at, idx) => {
    const n = Math.ceil(0.12 * SR), src = noise(n, 113 + idx);
    const hp = biquad(src, 'hp', 2600, 0.8), ring = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      ring[i] = (hp[i] * 0.5 + Math.sin(2 * Math.PI * 4300 * t) * 0.35 + Math.sin(2 * Math.PI * 6400 * t) * 0.18) * Math.exp(-t / 0.018);
    }
    add(b, at, ring, 0.6);
  });
  return b;
}
function razor() {
  const dur = 0.55, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 127);
  const hp = biquad(src, 'hp', 3600, 0.7), bp = biquad(src, 'bp', 5200, 1.1);
  for (let i = 0; i < n; i++) {
    const t = i / SR, envl = Math.sin(Math.PI * Math.min(1, t / 0.5)) ** 1.6;
    b[i] = (hp[i] * 0.35 + bp[i] * 0.18) * envl * (0.6 + 0.4 * Math.sin(2 * Math.PI * 9 * t));
  }
  return b;
}
function clayClink(amp = 0.7) {
  const b = make(0.4), n = Math.ceil(0.4 * SR), part = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    part[i] = (Math.sin(2 * Math.PI * 1180 * t) * 0.6 + Math.sin(2 * Math.PI * 1810 * t) * 0.3 + Math.sin(2 * Math.PI * 2470 * t) * 0.12) * Math.exp(-t / 0.055) * (1 - Math.exp(-t / 0.0015));
  }
  add(b, 0, part, amp);
  return b;
}
function coinRattle() {
  const b = make(1.0), r = mulberry32(137);
  for (let k = 0; k < 14; k++) {
    const at = r() * 0.72, f = 1700 + r() * 1900;
    bell(b, at, f, 0.05 + r() * 0.06, 0.22 + r() * 0.12, [1, 2.02, 3.1], 0.35);
  }
  return b;
}
function coinDrop() {
  const b = make(0.7);
  bell(b, 0.02, 2400, 0.3, 0.35, [1, 2.01, 3.2], 0.5);
  bell(b, 0.17, 1900, 0.16, 0.25, [1, 2.01], 0.4);
  bell(b, 0.3, 2200, 0.08, 0.2, [1, 2.01], 0.3);
  return b;
}
function coinJingle() {
  const b = make(0.8), r = mulberry32(149);
  for (let k = 0; k < 5; k++) bell(b, k * 0.07 + r() * 0.02, 2000 + r() * 1200, 0.16, 0.35, [1, 2.02, 3.1], 0.45);
  return b;
}
function iceClink() {
  const b = make(0.55), r = mulberry32(157);
  for (let k = 0; k < 4; k++) bell(b, k * 0.075 + r() * 0.02, 2600 + r() * 1600, 0.13, 0.3, [1, 2.4, 3.6], 0.4);
  return b;
}
function stir() {
  const dur = 0.95, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 163);
  const lp = biquad(src, 'lp', 1600, 0.6), bp = biquad(src, 'bp', 700, 0.5);
  for (let i = 0; i < n; i++) {
    const t = i / SR, p = t / dur;
    const envl = Math.min(1, t / 0.08) * Math.min(1, (1 - p) / 0.2);
    b[i] = (lp[i] * 0.7 + bp[i] * 0.3) * envl * (0.5 + 0.5 * Math.abs(Math.sin(2 * Math.PI * 3.2 * t))) * 0.5;
  }
  const r = mulberry32(164);
  for (let k = 0; k < 6; k++) bubble(b, 0.1 + r() * 0.7, 200 + r() * 300, 0.03 + r() * 0.03, 0.08);
  return b;
}
function honeyDrop() {
  const b = make(0.6), n = Math.ceil(0.6 * SR), part = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = 260 * (1 - 0.55 * Math.min(1, t / 0.2));
    part[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.11) * (1 - Math.exp(-t / 0.004));
  }
  add(b, 0, part, 0.55);
  const stick = new Float32Array(n), r = mulberry32(173);
  for (let i = 0; i < n; i++) stick[i] = (r() * 2 - 1) * Math.exp(-i / SR / 0.05) * 0.08;
  add(b, 0, biquad(stick, 'lp', 700, 0.6), 0.4);
  return b;
}
function pourOut() {
  const dur = 0.9, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 181);
  const lp = biquad(src, 'lp', 1800, 0.6);
  for (let i = 0; i < n; i++) {
    const t = i / SR, p = t / dur;
    const envl = Math.min(1, t / 0.05) * Math.min(1, (1 - p) / 0.3);
    b[i] = lp[i] * envl * (0.4 + 0.6 * Math.abs(Math.sin(2 * Math.PI * 5 * t))) * 0.45;
  }
  bubble(b, 0.7, 200, 0.12, 0.16);
  return b;
}
function drinksOk() { return clayClink(0.65); }
function drinksError() {
  const b = make(0.45);
  bell(b, 0, 196, 0.18, 0.35, [1, 1.06], 0.5);
  bell(b, 0.02, 233, 0.12, 0.3, [1, 1.06], 0.5);
  return b;
}
function serveSuccess() {
  const b = make(1.2);
  add(b, 0, clayClink(0.5), 1);
  add(b, 0.05, coinJingle(), 0.55);
  bell(b, 0.28, 783.99, 0.12, 0.8, [1, 2.01], 0.8);
  return b;
}
function customerArrive() {
  const b = make(0.8);
  woodBlock(b, 0.02, 160, 0.14);
  woodBlock(b, 0.3, 150, 0.1);
  add(b, 0.02, paperRustle(), 0.18);
  return b;
}
function pounding() {
  const b = make(1.2);
  [0.04, 0.58].forEach((at, idx) => {
    const n = Math.ceil(0.4 * SR), part = new Float32Array(n), r = mulberry32(191 + idx);
    for (let i = 0; i < n; i++) {
      const t = i / SR, f = 95 - 35 * Math.min(1, t / 0.12);
      part[i] = Math.sin(2 * Math.PI * f * t) * Math.exp(-t / 0.08) * (1 - Math.exp(-t / 0.002)) + (r() * 2 - 1) * Math.exp(-t / 0.01) * 0.25;
    }
    add(b, at, biquad(part, 'lp', 500, 0.7), 0.7);
  });
  return b;
}
function filtering() {
  const dur = 1.3, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 197);
  const bp = biquad(src, 'bp', 900, 0.55), lp = biquad(src, 'lp', 2000, 0.6);
  for (let i = 0; i < n; i++) {
    const t = i / SR, p = t / dur;
    const envl = Math.min(1, t / 0.1) * Math.min(1, (1 - p) / 0.2);
    b[i] = (bp[i] * 0.45 + lp[i] * 0.3) * envl * (0.4 + 0.6 * Math.abs(Math.sin(2 * Math.PI * 2.6 * t))) * 0.5;
  }
  const r = mulberry32(198);
  for (let k = 0; k < 8; k++) bubble(b, 0.1 + r() * 1.0, 240 + r() * 320, 0.04 + r() * 0.04, 0.07);
  return b;
}
function simmering() {
  const dur = 2.3, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 211);
  const lp = biquad(src, 'lp', 700, 0.6);
  for (let i = 0; i < n; i++) {
    const t = i / SR, fade = Math.min(1, t / 0.06) * Math.min(1, (dur - t) / 0.12);
    b[i] = lp[i] * fade * (0.3 + 0.25 * Math.sin(2 * Math.PI * 1.7 * t) ** 2) * 0.45;
  }
  const r = mulberry32(212);
  for (let k = 0; k < 26; k++) bubble(b, 0.05 + r() * (dur - 0.2), 160 + r() * 360, 0.025 + r() * 0.045, 0.06 + r() * 0.08);
  return b;
}
function windWhoosh() {
  const dur = 1.2, b = make(dur), n = Math.ceil(dur * SR), src = noise(n, 223);
  const band = sweepFilter(src, 'lp', 500, 2600, 0.7);
  const air = biquad(src, 'bp', 1200, 0.5);
  for (let i = 0; i < n; i++) {
    const t = i / SR, p = t / dur;
    const envl = Math.sin(Math.PI * p) ** 1.3;
    b[i] = (band[i] * 0.55 + air[i] * 0.3) * envl * (0.6 + 0.4 * Math.sin(2 * Math.PI * 2.2 * t));
  }
  return b;
}
function drum() {
  const b = make(0.6);
  [0, 0.17].forEach((at, idx) => {
    const n = Math.ceil(0.28 * SR), part = new Float32Array(n), r = mulberry32(229 + idx);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      part[i] = (Math.sin(2 * Math.PI * (170 - 40 * t / 0.28) * t) * 0.75 + Math.sin(2 * Math.PI * 320 * t) * 0.2 + (r() * 2 - 1) * Math.exp(-t / 0.008) * 0.3) * Math.exp(-t / 0.075) * (1 - Math.exp(-t / 0.0015));
    }
    add(b, at, part, idx ? 0.45 : 0.7);
  });
  return b;
}
function toyGiggle() {
  const b = make(0.9), notes = [660, 880, 1046.5, 1318.5];
  notes.forEach((f, i) => {
    const n = Math.ceil(0.16 * SR), part = new Float32Array(n);
    for (let j = 0; j < n; j++) {
      const t = j / SR;
      part[j] = (Math.sin(2 * Math.PI * f * t) * 0.7 + Math.sin(2 * Math.PI * f * 2 * t) * 0.18) * Math.exp(-t / 0.05) * (1 - Math.exp(-t / 0.001));
    }
    add(b, i * 0.11, part, 0.35 - i * 0.03);
  });
  return b;
}
function errorSoft() {
  const b = make(0.45);
  bell(b, 0, 174, 0.2, 0.4, [1, 1.05], 0.6);
  bell(b, 0.03, 207, 0.12, 0.35, [1, 1.06], 0.5);
  return b;
}
function notice() {
  const b = make(0.8);
  bell(b, 0, 659.25, 0.2, 0.7, [1, 2.01], 0.9);
  bell(b, 0.1, 880, 0.14, 0.6, [1, 2.01], 0.9);
  return b;
}
function cloth() {
  const b = make(0.4), n = Math.ceil(0.4 * SR), src = noise(n, 239);
  const lp = biquad(src, 'lp', 2200, 0.7), hp = biquad(src, 'hp', 700, 0.6);
  for (let i = 0; i < n; i++) {
    const t = i / SR, envl = Math.sin(Math.PI * Math.min(1, t / 0.36)) ** 2;
    b[i] = (lp[i] * 0.4 + hp[i] * 0.2) * envl * 0.55;
  }
  return b;
}
function scrollOpen() {
  const b = make(2.4);
  add(b, 0, silkSlide(true), 0.7);
  add(b, 0.5, silkSlide(true), 0.45);
  bell(b, 1.1, 392, 0.06, 1.1, [1, 2.01], 1);
  return b;
}

/* ---------- 清单 ---------- */
const DEFS = [
  ['ui-tap', 0.14, uiTap(false), '按钮、印章等通用轻点'],
  ['ui-tap-soft', 0.1, uiTap(true), '次级按钮轻点'],
  ['page-turn', 0.55, pageTurn(), '翻页、场景推进'],
  ['paper-rustle', 0.42, paperRustle(), '纸张轻响、线索查验'],
  ['paper-unfold', 0.85, paperUnfold(), '展开家书、信纸'],
  ['seal-stamp', 0.5, sealStamp(), '印章落定、记录入册'],
  ['silk-slide', 0.75, silkSlide(false), '画卷轻滑、拖拽'],
  ['silk-long', 1.3, silkSlide(true), '展卷、长距离滑动'],
  ['scroll-open', 2.4, scrollOpen(), '展卷开场'],
  ['brush-stroke', 0.5, brushStroke(), '落笔、书写'],
  ['chime-gentle', 1.5, chimeGentle(), '轻柔提示、页面就绪'],
  ['chime-complete', 2.0, chimeComplete(), '工序完成、获得线索'],
  ['gong-soft', 2.6, gongSoft(), '卜卦卦成弱磬'],
  ['temple-bell', 3.4, templeBell(), '行脚僧完成、寺院钟声'],
  ['woodfish', 0.35, woodfish(), '木鱼、木牌点击'],
  ['water-pour', 1.15, waterPour(), '浇水、倒水'],
  ['water-drip', 0.7, waterDrip(), '水滴'],
  ['comb', 0.44, combSound(), '梳发'],
  ['tweezers', 0.4, tweezers(), '镊发'],
  ['scissors', 0.42, scissors(), '剪须'],
  ['razor', 0.55, razor(), '修面'],
  ['clay-clink', 0.4, clayClink(0.7), '陶盏轻碰'],
  ['coin-rattle', 1.0, coinRattle(), '铜钱摇动'],
  ['coin-drop', 0.7, coinDrop(), '铜钱落定'],
  ['coin-jingle', 0.8, coinJingle(), '进账铜钱'],
  ['ice-clink', 0.55, iceClink(), '冰块入盏'],
  ['stir', 0.95, stir(), '搅匀饮子'],
  ['honey-drop', 0.6, honeyDrop(), '添蜜'],
  ['pour-out', 0.9, pourOut(), '倒掉重做'],
  ['drinks-ok', 0.4, drinksOk(), '调饮操作正确'],
  ['drinks-error', 0.45, drinksError(), '操作提示、不可用'],
  ['serve-success', 1.2, serveSuccess(), '交付成功'],
  ['customer-arrive', 0.8, customerArrive(), '客人到来'],
  ['pounding', 1.2, pounding(), '捣果'],
  ['filtering', 1.3, filtering(), '过滤'],
  ['simmering', 2.3, simmering(), '熬煮'],
  ['wind-whoosh', 1.2, windWhoosh(), '风车、风声'],
  ['drum', 0.6, drum(), '拨浪鼓'],
  ['toy-giggle', 0.9, toyGiggle(), '泥塑童子笑声'],
  ['error-soft', 0.45, errorSoft(), '错误提示弱音'],
  ['notice', 0.8, notice(), '通知、提示'],
  ['cloth', 0.4, cloth(), '布巾、衣料'],
];

/* ---------- WAV 写出 ---------- */
function normalize(buf, peak = 0.86) {
  let max = 0;
  for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  if (max < 1e-6) return buf;
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
}
/* 感知响度归一：以最响 400ms 窗的 RMS 为基准（瞬态与持续音都能公平比较），
   再用 tanh 软限幅控峰，避免不同音效忽大忽小 */
function normalizeRms(buf, targetDb = -20) {
  const win = Math.max(64, Math.round(SR * 0.4)), hop = Math.max(32, Math.round(SR * 0.1));
  let maxRms = 0;
  if (buf.length <= win) {
    let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    maxRms = Math.sqrt(sum / Math.max(1, buf.length));
  } else {
    for (let start = 0; start + win <= buf.length; start += hop) {
      let sum = 0;
      for (let i = start; i < start + win; i++) sum += buf[i] * buf[i];
      maxRms = Math.max(maxRms, Math.sqrt(sum / win));
    }
    // 尾部不足一窗
    const start = buf.length - win;
    let sum = 0; for (let i = start; i < buf.length; i++) sum += buf[i] * buf[i];
    maxRms = Math.max(maxRms, Math.sqrt(sum / win));
  }
  if (maxRms < 1e-7) return buf;
  const gain = Math.pow(10, targetDb / 20) / maxRms;
  for (let i = 0; i < buf.length; i++) {
    const v = buf[i] * gain;
    // tanh 软限幅：<0.7 近似线性，之上平滑压峰
    buf[i] = v > 0.7 || v < -0.7 ? Math.sign(v) * (0.7 + 0.3 * Math.tanh((Math.abs(v) - 0.7) / 0.3)) : v;
  }
  return buf;
}
function fadeEdges(buf, ms = 4) {
  const n = Math.round(ms * SR / 1000);
  for (let i = 0; i < Math.min(n, buf.length); i++) {
    const g = i / n;
    buf[i] *= g;
    buf[buf.length - 1 - i] *= g;
  }
}
function writeWav(file, samples) {
  const n = samples.length, data = Buffer.alloc(44 + n * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + n * 2, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = clamp(samples[i], -1, 1);
    data.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, file + '.wav'), data);
}

const manifest = [];
let totalBytes = 0;
for (const [name, dur, buf, desc] of DEFS) {
  // 统一到相近的感知响度；轻点类稍收敛，场景/氛围类保留动态
  const target = name.startsWith('ui-tap') ? -23 : name === 'scroll-open' || name === 'temple-bell' || name === 'gong-soft' ? -22 : -20;
  normalizeRms(buf, target);
  fadeEdges(buf, name === 'simmering' ? 12 : 4);
  const file = name + '.wav';
  writeWav(name, buf);
  const bytes = fs.statSync(path.join(OUT, file)).size;
  totalBytes += bytes;
  manifest.push({ name, file, duration: Number(dur.toFixed(2)), bytes, description: desc });
}
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ generated: '2026-11-13', sampleRate: SR, sounds: manifest }, null, 2) + '\n');
console.log(`生成 ${manifest.length} 个音效，共 ${(totalBytes / 1024 / 1024).toFixed(2)} MB -> ${OUT}`);
