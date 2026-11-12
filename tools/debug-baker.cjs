const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9344;
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function httpJson(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request(url, { method }, res => {
      let s = ''; res.on('data', d => s += d);
      res.on('end', () => { try { resolve(JSON.parse(s)); } catch (e) { reject(new Error(s.slice(0, 200))); } });
    });
    req.on('error', reject); req.end();
  });
}
(async () => {
  const profile = path.join(os.tmpdir(), 'bj-dbg-' + Date.now());
  const proc = spawn(EDGE, ['--headless=new', '--disable-gpu', '--disable-extensions', '--no-first-run', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--window-size=1440,900', '--autoplay-policy=no-user-gesture-required'], { stdio: 'ignore' });
  let v;
  for (let i = 0; i < 60; i++) { try { v = await httpJson(`http://localhost:${PORT}/json/version`); break; } catch { await wait(250); } }
  const t = await httpJson(`http://localhost:${PORT}/json/new?about:blank`, 'PUT');
  const ws = new WebSocket(t.webSocketDebuggerUrl.replace('[0000:0000:0000:0000:0000:0000:0000:0001]', 'localhost'));
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const net = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    else if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) net.push(m.params.response.status + ' ' + m.params.response.url);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })); });
  const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true }); if (r.exceptionDetails) return 'EXC: ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text); return r.result?.value; };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:3001/' });
  await wait(2500);
  const seed = { page: 'scroll', frame: 2, region: 'city', scrollCenter: .25427, met: { baker: true, drinks: true }, played: { drinks: true }, clues: {}, step: 0, history: [], dayStory: { started: true, frame: 2, deliveryFrame: 0, ended: false, credited: ['drinks'], heard: { drinks: true } }, introGuide: { version: 1, status: 'completed', step: 8 } };
  console.log('seed:', await ev(`localStorage.setItem('bj-five-letter-v1', ${JSON.stringify(JSON.stringify(seed))}); 'ok'`));
  await send('Page.navigate', { url: 'http://localhost:3001/' });
  await wait(2500);
  console.log('enter:', await ev(`state.npc='baker';state.met.baker=true;go('dialogue'); 'ok'`));
  await wait(2000);
  console.log('before:', await ev(`document.querySelector('.baker-ending')?.dataset.step`));
  console.log('wheel dispatch:', await ev(`(()=>{const el=document.querySelector('.baker-ending');const e=new WheelEvent('wheel',{deltaY:180,bubbles:true,cancelable:true});window.__wheelSeen=0;el.addEventListener('wheel',()=>window.__wheelSeen++,{once:true});const r=el.dispatchEvent(e);return JSON.stringify({dispatch:r,seen:window.__wheelSeen})})()`));
  await wait(2000);
  console.log('after wheel:', await ev(`document.querySelector('.baker-ending')?.dataset.step`));
  console.log('click next:', await ev(`(()=>{const b=document.querySelector('.baker-next');if(!b)return 'no btn';b.click();return 'clicked'})()`));
  await wait(2000);
  console.log('after click:', await ev(`document.querySelector('.baker-ending')?.dataset.step`));
  console.log('music:', await ev(`(()=>{const a=document.querySelector('#background-music');return (a?.src||'none')+' paused='+(a?.paused)})()`));
  console.log('net errors:', net.join('\n'));
  ws.close(); proc.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
})();
