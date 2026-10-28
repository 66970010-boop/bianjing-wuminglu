import './style.css';
import { Scroll, W } from './scroll';
import { Controls } from './input';
import { people, looks, edges, type Person, type Look } from './world';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const KEY = 'juanzhong-renjian-v1';
const TOTAL = people.length;
const REVEAL_R = 1500;

interface Save {
  step: number;
  looked: string[];
}

const load = (): Save => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '');
    if (Number.isInteger(s.step) && Array.isArray(s.looked)) return s;
  } catch {}
  return { step: 0, looked: [] };
};

let save = load();
const persist = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {}
};

const scroll = new Scroll($('#scroll'));
const controls = new Controls(scroll, $('#stage'));
const byId = new Map(people.map((p, i) => [p.id, { p, i }]));

const anim = {
  reveal: people.map(() => 0),
  thread: edges.map(() => 0),
  gone: people.map(() => 0),
  lift: 0,
  shift: 0,
};
let removed = -1;
let finaleOn = false;

const fog = document.createElement('canvas');
const fogCtx = fog.getContext('2d')!;

const targetReveal = (i: number) => (i < save.step ? 1 : i === save.step ? 0.28 : 0);
const edgeShown = (e: (typeof edges)[number], k: number) => {
  if (e.kind === 'gift') return save.step > k;
  return finaleOn;
};

function settle() {
  let busy = false;
  const ease = (cur: number, to: number, rate: number) => {
    const d = to - cur;
    if (Math.abs(d) < 0.002) return to;
    busy = true;
    return cur + d * rate;
  };
  people.forEach((_, i) => {
    anim.reveal[i] = ease(anim.reveal[i], targetReveal(i), 0.035);
    anim.gone[i] = ease(anim.gone[i], removed === i ? 1 : 0, 0.06);
  });
  edges.forEach((e, k) => {
    anim.thread[k] = ease(anim.thread[k], edgeShown(e, k) ? 1 : 0, 0.03);
  });
  anim.lift = ease(anim.lift, finaleOn ? 1 : 0, 0.012);
  anim.shift = ease(anim.shift, finaleEl.hidden ? 0 : -scroll.vh * 0.24, 0.08);
  scroll.vOffset = anim.shift;
  if (busy) scroll.invalidate();
}

scroll.paint = (s, ctx) => {
  settle();
  const { vw, vh, dpr, cam } = s;
  if (anim.lift < 1) {
    if (fog.width !== s.canvas.width || fog.height !== s.canvas.height) {
      fog.width = s.canvas.width;
      fog.height = s.canvas.height;
    }
    fogCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fogCtx.globalCompositeOperation = 'source-over';
    fogCtx.fillStyle = 'rgb(150,142,126)';
    fogCtx.fillRect(0, 0, vw, vh);
    fogCtx.globalCompositeOperation = 'destination-out';
    people.forEach((p, i) => {
      if (anim.reveal[i] <= 0.001) return;
      const [sx, sy] = s.toScreen(p.x, p.y);
      const r = REVEAL_R * cam.z * anim.reveal[i];
      const g = fogCtx.createRadialGradient(sx, sy, r * 0.2, sx, sy, r);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(0.6, 'rgba(0,0,0,0.85)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      fogCtx.fillStyle = g;
      fogCtx.fillRect(sx - r, sy - r, r * 2, r * 2);
    });
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = 0.92 * (1 - anim.lift);
    ctx.drawImage(fog, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.3 * (1 - anim.lift);
    ctx.drawImage(fog, 0, 0);
    ctx.restore();
  }
  people.forEach((p, i) => {
    if (anim.gone[i] < 0.01) return;
    const [sx, sy] = s.toScreen(p.x, p.y);
    const r = 300 * cam.z;
    const g = ctx.createRadialGradient(sx, sy, r * 0.3, sx, sy, r);
    const a = 0.94 * anim.gone[i];
    g.addColorStop(0, `rgba(190,164,112,${a})`);
    g.addColorStop(0.7, `rgba(190,164,112,${a * 0.85})`);
    g.addColorStop(1, 'rgba(190,164,112,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  });
  drawThreads(s, ctx);
};

function drawThreads(s: Scroll, ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.lineCap = 'round';
  const lift = (p: Person) => s.toScreen(p.x, p.y - 150);
  edges.forEach((e, k) => {
    const t = anim.thread[k];
    if (t < 0.01) return;
    const a = byId.get(e.a)!;
    const b = byId.get(e.b)!;
    const broken = removed === a.i || removed === b.i;
    const [ax, ay] = lift(a.p);
    const [bx, by] = lift(b.p);
    const dist = Math.hypot(bx - ax, by - ay);
    const bend = e.kind === 'gift' ? -0.22 : 0.16;
    const cx = (ax + bx) / 2;
    const cy = (ay + by) / 2 + dist * bend;
    const len = dist * 1.2 + 1;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(cx, cy, bx, by);
    const gift = e.kind === 'gift';
    ctx.strokeStyle = gift ? '#b23a2b' : '#231d16';
    ctx.globalAlpha = (broken ? 0.18 : 0.9) * Math.min(1, t * 1.5);
    ctx.lineWidth = gift ? 3 : 1.8;
    ctx.setLineDash(gift && !broken ? [len, len] : [7, 8]);
    ctx.lineDashOffset = gift && !broken ? len * (1 - t) : 0;
    ctx.shadowColor = gift ? 'rgba(255,240,210,0.9)' : 'transparent';
    ctx.shadowBlur = 6;
    ctx.stroke();
  });
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  people.forEach((p, i) => {
    if (anim.reveal[i] < 0.5 || anim.gone[i] > 0.5) return;
    const [x, y] = lift(p);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#b23a2b';
    ctx.strokeStyle = '#fff3df';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - 11, y - 11, 22, 22, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3df';
    ctx.font = '600 14px "Kaiti SC", "STKaiti", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.name[0], x, y + 1);
  });
  ctx.restore();
}

const pinsEl = $('#pins');
const pins = new Map<string, { el: HTMLElement; x: number; y: number; show: () => boolean }>();

function addPin(id: string, cls: string, x: number, y: number, label: string, onClick: () => void, show: () => boolean) {
  const el = document.createElement('div');
  el.className = `pin ${cls}`;
  el.innerHTML = `<button aria-label="${label}"></button><span class="tag">${label}</span>`;
  el.querySelector('button')!.addEventListener('click', () => {
    if (!controls.dragged) onClick();
  });
  pinsEl.append(el);
  pins.set(id, { el, x, y, show });
}

const near = (x: number) => Math.abs(scroll.cam.x - x) < (scroll.vw / scroll.cam.z) * 0.9;

people.forEach((p, i) => {
  addPin(
    p.id,
    'npc',
    p.x,
    p.y,
    p.name,
    () => talk(i),
    () => !finaleOn && started && (i < save.step || (i === save.step && near(p.x))),
  );
});
looks.forEach((l) => addPin(l.id, 'look', l.x, l.y, l.name, () => look(l), () => !finaleOn && started));

const minimap = $('#minimap .strip');
const win = $('#minimap .win');
const dots = people.map(() => {
  const d = document.createElement('i');
  minimap.append(d);
  return d;
});

scroll.onFrame = (s) => {
  for (const [id, pin] of pins) {
    const [sx, sy] = s.toScreen(pin.x, pin.y);
    const visible = pin.show() && sx > -60 && sx < s.vw + 60 && sy > -60 && sy < s.vh + 60;
    pin.el.hidden = !visible;
    if (visible) pin.el.style.transform = `translate3d(${sx}px,${sy}px,0)`;
    const i = byId.get(id)?.i;
    if (i !== undefined) {
      pin.el.classList.toggle('live', i === save.step);
      pin.el.classList.toggle('done', i < save.step);
    } else pin.el.classList.toggle('seen', save.looked.includes(id));
  }
  const half = s.vw / s.cam.z / 2;
  win.style.left = `${Math.max(0, ((s.cam.x - half) / W) * 100)}%`;
  win.style.width = `${Math.min(100, ((half * 2) / W) * 100)}%`;
  win.style.minWidth = '6px';
};

function placeDots() {
  people.forEach((p, i) => {
    const d = dots[i];
    d.hidden = i > save.step;
    d.style.left = `${(p.x / W) * 100}%`;
    d.className = i === save.step ? 'todo' : '';
  });
}

let jumping = false;
const jump = (e: PointerEvent) => {
  const r = minimap.getBoundingClientRect();
  const x = ((e.clientX - r.left) / r.width) * W;
  scroll.cam.x = x;
  scroll.invalidate();
};
minimap.addEventListener('pointerdown', (e) => {
  jumping = true;
  minimap.setPointerCapture(e.pointerId);
  jump(e);
});
minimap.addEventListener('pointermove', (e) => jumping && jump(e));
minimap.addEventListener('pointerup', () => (jumping = false));

let toastTimer = 0;
function toast(msg: string, ms = 3200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t.classList.remove('on'), ms);
}

const distanceMs = (x: number) => Math.min(9000, 1400 + Math.abs(scroll.cam.x - x) * 0.45);
const focusZoom = () => Math.min(0.7, Math.max(0.45, scroll.vh / 1500));

function updateHud() {
  const done = save.step >= TOTAL;
  $('#ledger b').textContent = String(Math.min(save.step, TOTAL - 1));
  $('#ledger').hidden = save.step === 0;
  const bag = $('#bag');
  const held = save.step > 0 && save.step < TOTAL ? people[save.step - 1].give : undefined;
  bag.hidden = !held;
  if (held) {
    bag.querySelector('i')!.textContent = held.mark;
    bag.querySelector('span')!.textContent = held.name;
  }
  $('#looks b').textContent = String(save.looked.length);
  const task = $('#task');
  task.hidden = !started || done || talking;
  if (!task.hidden) {
    const p = people[save.step];
    task.querySelector('.kicker')!.textContent = `第 ${save.step + 1} 站 · 共 ${TOTAL} 站`;
    task.querySelector('h2')!.textContent = held ? `把${held.name}送去` : `去找${p.role}`;
    task.querySelector('.hint')!.textContent = p.find;
  }
  placeDots();
}

let started = false;
let talking = false;
let cur: { p: Person; i: number; lines: string[]; idx: number; chosen: boolean } | null = null;
const talkEl = $('#talk');

function talk(i: number) {
  const p = people[i];
  const current = i === save.step;
  const lines = current ? p.scene.lines : [p.after];
  cur = { p, i, lines, idx: 0, chosen: !(current && p.scene.pick) };
  talking = true;
  $('#note').hidden = true;
  const img = talkEl.querySelector<HTMLImageElement>('.portrait')!;
  img.src = `/people/${p.id}.webp`;
  img.alt = p.name;
  talkEl.querySelector('.who b')!.textContent = p.name;
  talkEl.querySelector('.who span')!.textContent = p.role;
  talkEl.hidden = false;
  controls.fly(p.x, p.y, focusZoom(), 1200, 0.28);
  renderTalk();
  updateHud();
}

function renderTalk() {
  if (!cur) return;
  const { p, lines, idx } = cur;
  const last = idx === lines.length - 1;
  const current = cur.i === save.step;
  talkEl.querySelector('.line')!.textContent = lines[idx];
  const choices = talkEl.querySelector<HTMLElement>('.choices')!;
  choices.innerHTML = '';
  if (last && current && p.scene.pick && !cur.chosen) {
    p.scene.pick.options.forEach((o) => {
      const b = document.createElement('button');
      b.textContent = o.label;
      b.onclick = () => {
        cur!.lines = [...cur!.lines, o.reply];
        cur!.idx++;
        cur!.chosen = true;
        renderTalk();
      };
      choices.append(b);
    });
    talkEl.querySelector('.line')!.textContent = `${lines[idx]}（${p.scene.pick.prompt}）`;
  }
  const hist = talkEl.querySelector<HTMLElement>('.history')!;
  const atEnd = idx === cur.lines.length - 1 && cur.chosen;
  hist.hidden = !(atEnd && p.scene.history);
  hist.textContent = p.scene.history ?? '';
  const next = $('#talk-next');
  next.hidden = !atEnd && last && !cur.chosen;
  next.textContent = !atEnd ? '继续' : current ? p.scene.take : '好';
}

function endTalk() {
  talkEl.hidden = true;
  talking = false;
  cur = null;
  updateHud();
}

$('#talk-close').onclick = endTalk;
$('#talk-next').onclick = () => {
  if (!cur) return;
  if (cur.idx < cur.lines.length - 1) {
    cur.idx++;
    renderTalk();
    return;
  }
  if (cur.i === save.step) complete(cur.p, cur.i);
  else endTalk();
};

function complete(p: Person, i: number) {
  const prev = i > 0 ? people[i - 1].give : undefined;
  save.step = i + 1;
  persist();
  endTalk();
  if (i === TOTAL - 1) {
    toast(`${p.name}把一切都听进去了`, 2600);
    setTimeout(finale, 2200);
    return;
  }
  toast(`${prev ? `交出${prev.name}，` : ''}收下${p.give!.name}`);
  const next = people[i + 1];
  setTimeout(() => {
    if (!talking && !finaleOn) controls.fly(next.x, next.y, focusZoom(), distanceMs(next.x), 0.45);
  }, 1500);
}

$('#go').onclick = () => {
  const p = people[Math.min(save.step, TOTAL - 1)];
  controls.fly(p.x, p.y, focusZoom(), distanceMs(p.x), 0.45);
};
$('#bag').onclick = () => $('#go').click();

const noteEl = $('#note');
function look(l: Look) {
  if (talking) endTalk();
  if (!save.looked.includes(l.id)) {
    save.looked.push(l.id);
    persist();
    updateHud();
  }
  noteEl.querySelector('.kicker')!.textContent = `画中细看 · ${save.looked.length}/${looks.length}`;
  noteEl.querySelector('h3')!.textContent = l.name;
  noteEl.querySelector('.text')!.textContent = l.text;
  noteEl.hidden = false;
  controls.fly(l.x, l.y, l.zoom, 1100, 0.4);
}
noteEl.querySelector('.x')!.addEventListener('click', () => (noteEl.hidden = true));
$('#looks-total').textContent = String(looks.length);
$('#looks').onclick = () => {
  const next = looks.find((l) => !save.looked.includes(l.id)) ?? looks[0];
  controls.fly(next.x, next.y, 0.45, distanceMs(next.x), 0.5);
  toast(`前面有处值得细看的地方：${next.name}`);
};

const finaleEl = $('#finale');
const roster = finaleEl.querySelector<HTMLElement>('.roster')!;
const effect = finaleEl.querySelector<HTMLElement>('.effect')!;

function neighbours(i: number) {
  const id = people[i].id;
  const set = new Set<number>();
  edges.forEach((e) => {
    if (e.a === id) set.add(byId.get(e.b)!.i);
    if (e.b === id) set.add(byId.get(e.a)!.i);
  });
  return set;
}

function renderRoster() {
  const hurt = removed >= 0 ? neighbours(removed) : new Set<number>();
  roster.innerHTML = '';
  people.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = removed === i ? 'gone' : hurt.has(i) ? 'hurt' : '';
    b.innerHTML = `<img src="/people/${p.id}.webp" alt=""><span>${p.name}</span><small>${p.role}</small>`;
    b.onclick = () => {
      removed = removed === i ? -1 : i;
      effect.textContent = removed < 0 ? '' : p.fade;
      scroll.invalidate();
      renderRoster();
    };
    roster.append(b);
  });
}

function finale() {
  finaleOn = true;
  talkEl.hidden = true;
  noteEl.hidden = true;
  $('#task').hidden = true;
  const xs = people.map((p) => p.x);
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  controls.fly((lo + hi) / 2, 900, scroll.vw / (hi - lo + 4200), 3600);
  renderRoster();
  effect.textContent = '';
  setTimeout(() => (finaleEl.hidden = false), 2600);
  scroll.invalidate();
}

$('#roam').onclick = () => {
  finaleEl.hidden = true;
  removed = -1;
  toast('卷已展开，可以随意漫游，或点画中细看', 4000);
  scroll.invalidate();
};
$('#reset').onclick = () => {
  save = { step: 0, looked: [] };
  persist();
  location.reload();
};

const creditEl = $('#credit');
creditEl.querySelector('.x')!.addEventListener('click', () => (creditEl.hidden = true));
$('#ledger').onclick = () => {
  if (save.step >= TOTAL) {
    finale();
    return;
  }
  const lines = edges
    .map((e, k) => ({ e, k }))
    .filter(({ e }) => e.kind === 'gift' && save.step > edges.indexOf(e))
    .map(({ e }) => `${byId.get(e.a)!.p.name} → ${byId.get(e.b)!.p.name}：${e.label}`);
  toast(lines.join('　·　'), 6000);
};
$('#home').onclick = () => {
  creditEl.hidden = !creditEl.hidden;
};
controls.onUserMove = () => {
  if (!started) return;
  noteEl.hidden = true;
};

const cover = $('#cover');
const startBtn = $('#start');
const resumeNote = $('#resume-note');

const farRight = () => W - scroll.vw / scroll.cam.z / 2;
scroll.cam.z = Math.max(scroll.minZoom, 0.45);
scroll.cam.x = farRight();
scroll.cam.y = 900;
scroll.invalidate();

if (save.step > 0 && save.step < TOTAL) {
  startBtn.textContent = '继续';
  resumeNote.hidden = false;
  resumeNote.textContent = `上次走到第 ${save.step + 1} 站`;
  $('#restart').hidden = false;
  $('#restart').onclick = () => $('#reset').click();
}

startBtn.onclick = () => {
  cover.classList.add('out');
  setTimeout(() => (cover.hidden = true), 1000);
  started = true;
  $('#bar').hidden = false;
  $('#minimap').hidden = false;
  if (save.step >= TOTAL) {
    finaleOn = true;
    anim.lift = 1;
    finale();
    return;
  }
  const p = people[save.step];
  const z = focusZoom();
  if (save.step === 0) {
    scroll.cam.x = farRight();
    scroll.cam.y = 900;
    controls.fly(p.x, p.y, z, 11000, 0.45).then(() => toast('画卷自右向左展开，先去找找那炉烧饼', 4200));
  } else controls.fly(p.x, p.y, z, distanceMs(p.x), 0.45);
  updateHud();
};

addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (talking) endTalk();
  noteEl.hidden = true;
  creditEl.hidden = true;
});
updateHud();
