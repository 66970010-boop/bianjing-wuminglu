const fs = require('fs');
const s = fs.readFileSync('toys/deck.html', 'utf8');
console.log('engine headers:', s.split('全局交互音效引擎').length - 1);
console.log('__SFX_DATA uses:', s.split('__SFX_DATA').length - 1);
let i = -1, c = 0;
while ((i = s.indexOf('__SFX_DATA', i + 1)) >= 0 && c < 8) {
  c++;
  console.log('---', c, JSON.stringify(s.slice(Math.max(0, i - 260), i + 260)));
}
