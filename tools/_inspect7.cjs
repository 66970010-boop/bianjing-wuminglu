const fs = require('fs');
const s = fs.readFileSync('toys/deck.html', 'utf8');
console.log('window.SFX count', s.split('window.SFX').length - 1);
console.log('SFX= count', s.split('SFX=').length - 1);
let i = -1, c = 0;
while ((i = s.indexOf('window.SFX', i + 1)) >= 0 && c < 8) {
  c++;
  console.log('---', c, JSON.stringify(s.slice(Math.max(0, i - 160), i + 200)));
}
