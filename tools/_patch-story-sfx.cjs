const fs = require('fs');
let p = 'story.js';
let s = fs.readFileSync(p, 'utf8');
const a = "const root=dayRoot('delivery');root.append(header());window.SFX?.play('paper-unfold',{volume:.75});const frames=";
const b = "const root=dayRoot('delivery');root.append(header());if(d.deliveryFrame===1)window.SFX?.play('paper-unfold',{volume:.75});const frames=";
if (s.includes(a)) { s = s.replace(a, b); fs.writeFileSync(p, s); console.log('story patched'); }
else console.log('story no-match', s.includes('paper-unfold'));

p = 'assets/audio/sfx.js';
s = fs.readFileSync(p, 'utf8');
const c = "delivery: 'paper-unfold', ending: 'gong-soft'";
const d = "delivery: '', ending: ''";
if (s.includes(c)) { s = s.replace(c, d); fs.writeFileSync(p, s); console.log('sfx patched'); }
else console.log('sfx no-match');
