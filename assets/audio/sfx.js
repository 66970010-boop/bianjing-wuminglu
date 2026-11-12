/* 汴京一日 · 全局交互音效引擎
 * 与背景音乐共用一套开关面板（assets/audio/controls.js），独立音量、独立静音。
 * 使用 HTMLAudio 池预加载，兼容 http(s) 与 file:// 离线打开。
 * 所有素材由 tools/generate-sfx.cjs 原创合成，无第三方版权。
 */
(() => {
  'use strict';
  /* 以脚本自身位置计算素材路径：根目录与 toys/ 子页（iframe）均可使用
     deck.html 内联副本额外提供 data-sfx-base，避免 currentScript 在部分内联场景为空。 */
  const cs = document.currentScript;
  const explicitBase = cs && cs.dataset ? cs.dataset.sfxBase : '';
  const BASE = explicitBase
    ? new URL(explicitBase, document.baseURI).href
    : cs && cs.src
      ? new URL('sfx/', cs.src).href
      : new URL(location.pathname.includes('/toys/') ? '../assets/audio/sfx/' : 'assets/audio/sfx/', location.href).href;
  const KEY = 'bj-sfx-v1';

  /* 每个音效的默认音量、并发声部与最小间隔（毫秒） */
  const DEFS = {
    'ui-tap': { vol: .5, max: 3, gap: 30 },
    'ui-tap-soft': { vol: .32, max: 4, gap: 25 },
    'page-turn': { vol: .5, max: 2, gap: 90 },
    'paper-rustle': { vol: .42, max: 2, gap: 120 },
    'paper-unfold': { vol: .55, max: 2, gap: 200 },
    'seal-stamp': { vol: .58, max: 2, gap: 150 },
    'silk-slide': { vol: .26, max: 2, gap: 260 },
    'silk-long': { vol: .4, max: 2, gap: 400 },
    'scroll-open': { vol: .5, max: 1, gap: 1500 },
    'brush-stroke': { vol: .38, max: 2, gap: 200 },
    'chime-gentle': { vol: .34, max: 2, gap: 250 },
    'chime-complete': { vol: .42, max: 2, gap: 500 },
    'gong-soft': { vol: .36, max: 1, gap: 800 },
    'temple-bell': { vol: .38, max: 1, gap: 1500 },
    'woodfish': { vol: .4, max: 3, gap: 70 },
    'water-pour': { vol: .42, max: 2, gap: 220 },
    'water-drip': { vol: .4, max: 2, gap: 200 },
    'comb': { vol: .36, max: 2, gap: 160 },
    'tweezers': { vol: .42, max: 2, gap: 160 },
    'scissors': { vol: .45, max: 2, gap: 160 },
    'razor': { vol: .36, max: 2, gap: 180 },
    'clay-clink': { vol: .48, max: 3, gap: 70 },
    'coin-rattle': { vol: .5, max: 1, gap: 500 },
    'coin-drop': { vol: .45, max: 2, gap: 120 },
    'coin-jingle': { vol: .42, max: 2, gap: 200 },
    'ice-clink': { vol: .45, max: 2, gap: 120 },
    'stir': { vol: .4, max: 1, gap: 400 },
    'honey-drop': { vol: .42, max: 2, gap: 200 },
    'pour-out': { vol: .42, max: 1, gap: 300 },
    'drinks-ok': { vol: .4, max: 3, gap: 90 },
    'drinks-error': { vol: .42, max: 2, gap: 200 },
    'serve-success': { vol: .5, max: 2, gap: 300 },
    'customer-arrive': { vol: .34, max: 2, gap: 500 },
    'pounding': { vol: .5, max: 1, gap: 600 },
    'filtering': { vol: .4, max: 1, gap: 700 },
    'simmering': { vol: .4, max: 1, gap: 1200 },
    'wind-whoosh': { vol: .4, max: 2, gap: 400 },
    'drum': { vol: .5, max: 3, gap: 120 },
    'toy-giggle': { vol: .45, max: 1, gap: 500 },
    'error-soft': { vol: .42, max: 2, gap: 240 },
    'notice': { vol: .34, max: 2, gap: 400 },
    'cloth': { vol: .36, max: 2, gap: 200 }
  };
  const HIGH_PRIORITY = ['ui-tap', 'ui-tap-soft', 'page-turn', 'paper-rustle', 'seal-stamp', 'silk-slide', 'chime-complete', 'drinks-ok', 'drinks-error', 'woodfish', 'clay-clink'];

  let prefs;
  try { prefs = JSON.parse(localStorage.getItem(KEY)); } catch (_) { prefs = null; }
  let enabled = prefs && typeof prefs.enabled === 'boolean' ? prefs.enabled : true;
  let volume = prefs && Number.isFinite(Number(prefs.volume)) ? Math.max(0, Math.min(1, Number(prefs.volume))) : .7;
  let muted = !!(prefs && prefs.muted);

  const pools = new Map();
  const lastPlayed = new Map();
  const ready = new Set();

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify({ enabled, volume, muted })); } catch (_) {}
  }
  function defOf(name) { return DEFS[name] || { vol: .4, max: 2, gap: 60 }; }
  function createVoice(name) {
    const d = defOf(name);
    const el = new Audio(BASE + name + '.wav');
    el.preload = 'auto';
    el.volume = 0;
    el.addEventListener('error', () => {}, { once: true });
    return { el, busy: false, d };
  }
  function poolOf(name) {
    let pool = pools.get(name);
    if (!pool) {
      const d = defOf(name);
      pool = Array.from({ length: d.max }, () => createVoice(name));
      pools.set(name, pool);
    }
    return pool;
  }
  function warm(names) {
    for (const name of names) if (DEFS[name]) poolOf(name);
  }
  function effectiveVolume(name, extra) {
    if (!enabled || muted || volume <= 0) return 0;
    return Math.max(0, Math.min(1, volume * (DEFS[name]?.vol ?? .4) * (extra === undefined ? 1 : extra)));
  }
  function play(name, options = {}) {
    if (!enabled || muted || volume <= 0) return null;
    const d = defOf(name);
    const now = performance.now();
    if (now - (lastPlayed.get(name) || 0) < (options.gap ?? d.gap)) return null;
    let pool;
    try { pool = poolOf(name); } catch (_) { return null; }
    const voice = pool.find(v => v.el.paused || v.el.ended) || pool[0];
    const el = voice.el;
    const target = effectiveVolume(name, options.volume);
    if (target <= 0) return null;
    lastPlayed.set(name, now);
    try {
      el.pause();
      el.currentTime = 0;
      el.playbackRate = Math.max(.5, Math.min(2, options.rate || 1));
      el.volume = target;
      const p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
      return el;
    } catch (_) { return null; }
  }
  function setEnabled(next) {
    enabled = !!next;
    if (enabled) muted = false;
    persist();
    document.dispatchEvent(new CustomEvent('sfxchange', { detail: getState() }));
  }
  function setVolume(next) {
    volume = Math.max(0, Math.min(1, Number(next) || 0));
    if (volume > 0) muted = false;
    persist();
    document.dispatchEvent(new CustomEvent('sfxchange', { detail: getState() }));
  }
  function setMuted(next) {
    muted = !!next;
    persist();
    document.dispatchEvent(new CustomEvent('sfxchange', { detail: getState() }));
  }
  function getState() { return { enabled, volume, muted, audible: enabled && !muted && volume > 0 }; }
  function stopAll() { for (const pool of pools.values()) for (const v of pool) { try { v.el.pause(); v.el.currentTime = 0; } catch (_) {} } }

  window.SFX = { play, warm, setEnabled, setVolume, setMuted, getState, stopAll, sounds: Object.keys(DEFS) };

  /* 预加载高频音效；其余首次使用时按需加载 */
  const warmNow = () => warm(HIGH_PRIORITY);
  if (document.readyState === 'complete') setTimeout(warmNow, 0);
  else window.addEventListener('load', warmNow, { once: true });

  /* 通用按钮轻点：覆盖全部页面与弹层；音乐面板自身除外 */
  document.addEventListener('click', e => {
    const el = e.target.closest('button,[role="button"],.drink-bowl-card,.book-item,.exhibit-person,.exhibit-dot,.npc-seal');
    if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    if (el.closest('.music-control')) return;
    if (el.dataset.sfx === 'none' || el.dataset.sfx === 'custom') return;
    if (el.classList.contains('seal')) { play('seal-stamp', { volume: .9 }); return; }
    if (el.classList.contains('npc-seal')) { play('woodfish', { volume: .8 }); return; }
    play('ui-tap-soft', { volume: .8 });
  }, true);

  /* 页面切换音：等待原 go 完成后播放，按目标页面选择质感 */
  const PAGE_SOUND = {
    home: 'page-turn', opening: 'page-turn', 'opening-film': 'wind-whoosh', scroll: 'silk-slide',
    dialogue: 'page-turn', game: 'woodfish', barber: 'cloth', drinks: 'clay-clink', monk: 'woodfish',
    toys: 'page-turn', fortune: 'page-turn', book: 'page-turn', bio: 'page-turn', history: 'page-turn',
    delivery: '', ending: ''
  };
  const baseGo = window.go;
  if (typeof baseGo === 'function') {
    window.go = function (page) {
      const from = (typeof state !== 'undefined' && state && state.page) || '';
      if (page !== from && PAGE_SOUND[page]) play(PAGE_SOUND[page], { volume: page === 'scroll' ? .8 : 1 });
      return baseGo.apply(this, arguments);
    };
  }
  /* 通知音：toast 由 ui-fixes.js 覆盖 */
  const baseToast = window.toast;
  if (typeof baseToast === 'function') {
    window.toast = function () {
      play('notice', { volume: .75 });
      return baseToast.apply(this, arguments);
    };
  }

  /* 首次手势解锁（部分浏览器要求一次可见的用户手势后才允许播放） */
  const unlock = () => { warm(HIGH_PRIORITY); document.removeEventListener('pointerdown', unlock, true); document.removeEventListener('keydown', unlock, true); };
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
})();
