export const W = 38414;
export const H = 1800;

export interface Camera {
  x: number;
  y: number;
  z: number;
}

interface Level {
  dir: string;
  tileW: number;
  count: number;
  cache: Map<number, HTMLImageElement>;
  loaded: Set<number>;
}

const level = (dir: string, tileW: number): Level => ({
  dir,
  tileW,
  count: Math.ceil(W / tileW),
  cache: new Map(),
  loaded: new Set(),
});

export class Scroll {
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly cam: Camera = { x: W / 2, y: H / 2, z: 0.4 };
  vw = 0;
  vh = 0;
  vOffset = 0;
  dpr = 1;
  onFrame: (s: Scroll) => void = () => {};
  paint: (s: Scroll, ctx: CanvasRenderingContext2D) => void = () => {};

  private overview = new Image();
  private overviewReady = false;
  private half = level('h', 2048);
  private full = level('f', 1024);
  private dirty = true;
  private raf = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.overview.onload = () => {
      this.overviewReady = true;
      this.invalidate();
    };
    this.overview.src = '/tiles/ov.webp';
    new ResizeObserver(() => this.resize()).observe(canvas.parentElement!);
    this.resize();
  }

  get minZoom() {
    return Math.min(this.vh / H, this.vw / 16000);
  }

  get maxZoom() {
    return 1.1;
  }

  resize() {
    const box = this.canvas.parentElement!.getBoundingClientRect();
    this.vw = box.width;
    this.vh = box.height;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);
    this.clamp();
    this.invalidate();
  }

  clamp() {
    const c = this.cam;
    c.z = Math.min(this.maxZoom, Math.max(this.minZoom, c.z));
    const halfW = this.vw / 2 / c.z;
    const halfH = this.vh / 2 / c.z;
    c.x = halfW * 2 >= W ? W / 2 : Math.min(W - halfW, Math.max(halfW, c.x));
    c.y = halfH * 2 >= H ? H / 2 : Math.min(H - halfH, Math.max(halfH, c.y));
  }

  toScreen(wx: number, wy: number): [number, number] {
    const { x, y, z } = this.cam;
    return [this.vw / 2 + (wx - x) * z, this.vh / 2 + (wy - y) * z + this.vOffset];
  }

  toWorld(sx: number, sy: number): [number, number] {
    const { x, y, z } = this.cam;
    return [x + (sx - this.vw / 2) / z, y + (sy - this.vOffset - this.vh / 2) / z];
  }

  invalidate() {
    if (this.dirty && this.raf) return;
    this.dirty = true;
    this.raf ||= requestAnimationFrame(() => {
      this.raf = 0;
      this.render();
    });
  }

  private tile(lv: Level, i: number) {
    let img = lv.cache.get(i);
    if (!img) {
      img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        lv.loaded.add(i);
        this.invalidate();
      };
      img.src = `/tiles/${lv.dir}/${i}.webp`;
      lv.cache.set(i, img);
    }
    return lv.loaded.has(i) ? img : null;
  }

  private drawLevel(lv: Level, left: number, top: number) {
    const { ctx, cam, vw } = this;
    const z = cam.z;
    const first = Math.max(0, Math.floor((cam.x - vw / 2 / z) / lv.tileW));
    const last = Math.min(lv.count - 1, Math.floor((cam.x + vw / 2 / z) / lv.tileW));
    for (let i = first; i <= last; i++) {
      const img = this.tile(lv, i);
      if (!img) continue;
      const x0 = Math.floor(left + i * lv.tileW * z);
      const x1 = Math.ceil(left + Math.min(W, (i + 1) * lv.tileW) * z);
      ctx.drawImage(img, x0, Math.floor(top), x1 - x0, Math.ceil(H * z));
    }
    if (lv.cache.size > 18) {
      for (const [i, img] of lv.cache) {
        if (Math.abs(i - (first + last) / 2) > 8) {
          lv.cache.delete(i);
          lv.loaded.delete(i);
          img.src = '';
        }
      }
    }
  }

  private render() {
    this.dirty = false;
    this.clamp();
    const { ctx, cam, vw, vh, dpr } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#2a241c';
    ctx.fillRect(0, 0, vw, vh);
    const [left, top] = this.toScreen(0, 0);
    if (this.overviewReady) ctx.drawImage(this.overview, left, top, W * cam.z, H * cam.z);
    this.drawLevel(this.half, left, top);
    if (cam.z * dpr > 0.5) this.drawLevel(this.full, left, top);
    this.paint(this, ctx);
    this.onFrame(this);
  }
}
