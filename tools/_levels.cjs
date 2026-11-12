const fs = require('node:fs');
const dir = 'assets/audio/sfx';
const bad = [];
for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.wav'))) {
  const b = fs.readFileSync(dir + '/' + f);
  const n = (b.length - 44) / 2;
  let peak = 0, sum = 0;
  for (let i = 0; i < n; i++) {
    const v = b.readInt16LE(44 + i * 2) / 32768;
    peak = Math.max(peak, Math.abs(v));
    sum += v * v;
  }
  const rms = Math.sqrt(sum / n);
  console.log(f.padEnd(24), (n / 44100).toFixed(2) + 's', 'peak=' + peak.toFixed(2), 'rms=' + rms.toFixed(3));
  if (peak < 0.05) bad.push(f);
}
console.log('SILENT:', bad);
