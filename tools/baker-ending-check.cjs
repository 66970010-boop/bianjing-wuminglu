/* Minimal CDP driver using Node 22's built-in WebSocket. No npm dependencies. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9333;
const OUT = path.join(__dirname, '..', 'verification', 'baker-ending');

function httpPutJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method: 'PUT' }, res => {
      let s = '';
      res.on('data', d => s += d);
      res.on('end', () => { try { resolve(JSON.parse(s)); } catch (e) { reject(new Error(s.slice(0, 120))); } });
    });
    req.on('error', reject); req.end();
  });
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function httpJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let s = '';
      res.on('data', d => s += d);
      res.on('end', () => { try { resolve(JSON.parse(s)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const profile = path.join(os.tmpdir(), 'bj-edge-profile-' + Date.now());
  const args = [
    '--headless=new', '--disable-gpu', '--disable-extensions', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile,
    '--window-size=1440,900'
  ];
  const proc = spawn(EDGE, args, { stdio: 'ignore', detached: false });
  let version;
  for (let i = 0; i < 60; i++) {
    try { version = await httpJson(`http://localhost:${PORT}/json/version`); break; } catch (e) { await wait(250); }
  }
  if (!version) throw new Error('Edge did not start');
  let pages = [];
  for (let i = 0; i < 20; i++) {
    pages = await httpJson(`http://localhost:${PORT}/json/list`);
    if (pages.some(p => p.type === 'page')) break;
    await wait(250);
  }
  // always open a clean tab we control
  const fresh = await httpPutJson(`http://localhost:${PORT}/json/new?about:blank`);
  const target = fresh.type === 'page' ? fresh : pages.find(p => p.type === 'page');
  if (!target) throw new Error('no page target');
  console.log('target:', target.url);
  const wsUrl = target.webSocketDebuggerUrl.replace('[0000:0000:0000:0000:0000:0000:0000:0001]', 'localhost');
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });

  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id); if (msg.error) reject(new Error(JSON.stringify(msg.error))); else resolve(msg.result); }
    else if (msg.method) events.push(msg);
  };
  function send(method, params = {}) {
    const mid = ++id;
    return new Promise((resolve, reject) => { pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  }
  async function evalJs(expression, awaitPromise = true) {
    const r = await send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception?.description || ''));
    return r.result?.value;
  }
  async function screenshot(name) {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT, name), Buffer.from(r.data, 'base64'));
    console.log('screenshot', name);
  }
  async function navigate(url) {
    await send('Page.navigate', { url });
    for (let i = 0; i < 60; i++) {
      await wait(250);
      try {
        const href = await evalJs('location.href');
        if (href && href.startsWith('http')) return;
      } catch (e) {}
    }
    throw new Error('navigation did not complete: ' + url);
  }
  async function setViewport(width, height, mobile = false) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  }

  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await setViewport(1440, 900);
  await navigate('http://localhost:3001/');
  await wait(600);

  const seed = JSON.stringify({
    page: 'scroll', frame: 2, region: 'city', scrollCenter: .25427, met: { drinks: true, barber: true, boat: true, baker: true, merchant: true, monk: true, fortune: true },
    played: { drinks: true, barber: true }, clues: { drinkMemory: true, barberMemory: true, goods: true, kindness: true }, step: 0, history: [],
    dayStory: { started: true, frame: 2, deliveryFrame: 0, ended: false, credited: ['drinks', 'barber'], heard: { drinks: true, barber: true } },
    introGuide: { version: 1, status: 'completed', step: 8 }
  });
  await evalJs(`localStorage.setItem('bj-five-letter-v1', ${JSON.stringify(seed)}); 'seeded'`);
  await navigate('http://localhost:3001/');
  await wait(1200);

  await evalJs(`state.npc='baker';state.met.baker=true;go('dialogue'); 'ok'`);
  await wait(1200);
  await evalJs(`document.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})); 'awaken'`);
  await wait(800);
  await screenshot('desktop-01-scene1.png');
  console.log('step1:', await evalJs(`document.querySelector('.baker-ending')?.dataset.step`));
  console.log('shell exists:', await evalJs(`!!document.querySelector('.baker-ending')`));
  console.log('buttons:', await evalJs(`[...document.querySelectorAll('.baker-ending button')].map(b=>b.textContent.trim()).join(' | ')`));
  console.log('music:', await evalJs(`(()=>{const a=document.querySelector('#background-music');return (a?.getAttribute('src')||'none')+' paused='+(a?.paused??'na')})()`));

  await evalJs(`document.querySelector('.baker-ending').dispatchEvent(new WheelEvent('wheel',{deltaY:180,bubbles:true,cancelable:true})); 'ok'`);
  await wait(1500);
  await screenshot('desktop-02-scene2.png');
  console.log('step2:', await evalJs(`document.querySelector('.baker-ending')?.dataset.step`));

  await evalJs(`document.querySelector('.baker-ending').dispatchEvent(new WheelEvent('wheel',{deltaY:180,bubbles:true,cancelable:true})); 'ok'`);
  await wait(1500);
  await screenshot('desktop-03-scene3.png');
  console.log('step3:', await evalJs(`document.querySelector('.baker-ending')?.dataset.step`));
  console.log('step3 buttons:', await evalJs(`[...document.querySelectorAll('.baker-ending .baker-stage button')].map(b=>b.textContent.trim()).join(' | ')`));

  // click hand over -> delivery page should appear and music remain ending
  await evalJs(`document.querySelector('.baker-ending .baker-stage button')?.click(); 'click'`);
  await wait(1600);
  console.log('after handover page:', await evalJs(`state.page`));
  console.log('music after handover:', await evalJs(`(()=>{const a=document.querySelector('#background-music');return (a?.getAttribute('src')||'none')+' paused='+(a?.paused??'na')})()`));

  // return to scroll for further tests
  await evalJs(`go('scroll'); 'back'`);
  await wait(800);

  // mobile: re-enter the baker page
  await setViewport(390, 844, true);
  await wait(400);
  await evalJs(`state.npc='baker';state.met.baker=true;go('dialogue'); 'ok'`);
  await wait(1800);
  console.log('mobile page:', await evalJs(`state.page+'/'+state.npc`), 'shell:', await evalJs(`!!document.querySelector('.baker-ending')`));
  await screenshot('mobile-01-scene1.png');
  console.log('mobile overflow:', await evalJs(`(()=>{const d=document.documentElement;return JSON.stringify({sw:d.scrollWidth,cw:d.clientWidth,sh:d.scrollHeight,ch:d.clientHeight})})()`));
  console.log('mobile stage rect:', await evalJs(`(()=>{const s=document.querySelector('.baker-stage'),p=document.querySelector('.baker-portrait');const a=s?.getBoundingClientRect(),b=p?.getBoundingClientRect();return JSON.stringify({stage:a&&[a.x,a.y,a.width,a.height],portrait:b&&[b.x,b.y,b.width,b.height]})})()`));

  const errors = events.filter(e => e.method === 'Log.entryAdded' && ['error', 'warning'].includes(e.params.entry.level)).map(e => e.params.entry.text);
  console.log('console:', JSON.stringify(errors));

  ws.close();
  proc.kill();
  await wait(600);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) {}
}
main().catch(e => { console.error('FAILED', e); process.exit(1); });
