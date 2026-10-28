import type { Scroll } from './scroll';

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export class Controls {
  private flight = 0;
  private vx = 0;
  private vy = 0;
  private inertia = 0;
  private pointers = new Map<number, { x: number; y: number }>();
  private pinch = 0;
  dragged = false;
  onUserMove: () => void = () => {};

  constructor(private s: Scroll, el: HTMLElement) {
    el.addEventListener('pointerdown', (e) => this.down(e, el));
    el.addEventListener('pointermove', (e) => this.move(e));
    el.addEventListener('pointerup', (e) => this.up(e));
    el.addEventListener('pointercancel', (e) => this.up(e));
    el.addEventListener('wheel', (e) => this.wheel(e), { passive: false });
    el.addEventListener('dblclick', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      this.zoomAt(e.clientX, e.clientY, this.s.cam.z * 1.8);
    });
    addEventListener('keydown', (e) => this.key(e));
  }

  private stop() {
    cancelAnimationFrame(this.flight);
    cancelAnimationFrame(this.inertia);
    this.flight = 0;
  }

  private down(e: PointerEvent, el: HTMLElement) {
    if ((e.target as HTMLElement).closest('button')) return;
    this.stop();
    this.dragged = false;
    this.vx = this.vy = 0;
    el.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.pinch = this.span();
  }

  private span() {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }

  private move(e: PointerEvent) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (this.pointers.size >= 2) {
      const span = this.span();
      if (this.pinch) this.zoomAt(e.clientX, e.clientY, this.s.cam.z * (span / this.pinch));
      this.pinch = span;
    } else {
      if (!this.dragged && Math.hypot(dx, dy) < 1) return;
      this.dragged = true;
      this.vx = dx;
      this.vy = dy;
      this.panBy(-dx, -dy);
    }
    this.onUserMove();
  }

  private up(e: PointerEvent) {
    if (!this.pointers.delete(e.pointerId)) return;
    this.pinch = 0;
    if (this.pointers.size === 0 && this.dragged) this.glide();
    setTimeout(() => (this.dragged = false), 0);
  }

  private glide() {
    const step = () => {
      this.vx *= 0.94;
      this.vy *= 0.94;
      if (Math.hypot(this.vx, this.vy) < 0.3) return;
      this.panBy(-this.vx, -this.vy);
      this.inertia = requestAnimationFrame(step);
    };
    this.inertia = requestAnimationFrame(step);
  }

  private panBy(dx: number, dy: number) {
    const c = this.s.cam;
    c.x += dx / c.z;
    c.y += dy / c.z;
    this.s.invalidate();
  }

  private wheel(e: WheelEvent) {
    e.preventDefault();
    this.stop();
    if (e.ctrlKey || e.metaKey) {
      this.zoomAt(e.clientX, e.clientY, this.s.cam.z * Math.exp(-e.deltaY * 0.01));
    } else {
      this.panBy(e.deltaX + (e.shiftKey || !e.deltaX ? e.deltaY : 0), e.deltaX ? e.deltaY : 0);
    }
    this.onUserMove();
  }

  private key(e: KeyboardEvent) {
    if ((e.target as HTMLElement).closest('input, textarea')) return;
    const k = e.key;
    if (k === 'ArrowLeft') this.panBy(-120, 0);
    else if (k === 'ArrowRight') this.panBy(120, 0);
    else if (k === 'ArrowUp') this.panBy(0, -80);
    else if (k === 'ArrowDown') this.panBy(0, 80);
    else if (k === '+' || k === '=') this.zoomBy(1.25);
    else if (k === '-') this.zoomBy(0.8);
    else return;
    this.stop();
    this.onUserMove();
  }

  zoomBy(f: number) {
    this.zoomAt(this.s.vw / 2, this.s.vh / 2, this.s.cam.z * f);
  }

  zoomAt(sx: number, sy: number, z: number) {
    const s = this.s;
    const [wx, wy] = s.toWorld(sx, sy);
    s.cam.z = Math.min(s.maxZoom, Math.max(s.minZoom, z));
    s.cam.x = wx - (sx - s.vw / 2) / s.cam.z;
    s.cam.y = wy - (sy - s.vh / 2) / s.cam.z;
    s.invalidate();
  }

  fly(x: number, y: number, z: number, ms: number, anchorY = 0.5): Promise<void> {
    this.stop();
    const s = this.s;
    const from = { ...s.cam };
    const zEnd = Math.min(s.maxZoom, Math.max(s.minZoom, z));
    const yEnd = y + (0.5 - anchorY) * (s.vh / zEnd);
    const t0 = performance.now();
    return new Promise((resolve) => {
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        const k = ease(t);
        const arc = Math.sin(Math.PI * k) * Math.max(0, 1 - Math.abs(Math.log(zEnd / from.z)));
        s.cam.z = from.z * (zEnd / from.z) ** k * (1 - 0.18 * arc);
        s.cam.x = from.x + (x - from.x) * k;
        s.cam.y = from.y + (yEnd - from.y) * k;
        s.invalidate();
        if (t < 1) this.flight = requestAnimationFrame(step);
        else {
          this.flight = 0;
          resolve();
        }
      };
      this.flight = requestAnimationFrame(step);
    });
  }
}
