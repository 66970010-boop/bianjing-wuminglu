const fs = require('node:fs');
const p = 'toys/deck.html';
let s = fs.readFileSync(p, 'utf8');
const marker = '<p class="sr" role="status" id="status"></p>';
const tag = '<script src="../assets/audio/sfx.js?v=20261113"></script>';
if (s.includes(tag)) { console.log('already'); process.exit(0); }
const i = s.indexOf(marker);
if (i < 0) { console.log('MISS marker'); process.exit(1); }
const at = i + marker.length;
s = s.slice(0, at) + tag + s.slice(at);
fs.writeFileSync(p, s);
console.log('OK', s.length);
