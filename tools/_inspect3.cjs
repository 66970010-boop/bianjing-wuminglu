const fs = require('fs');
const p = 'toys/deck.js';
let s = fs.readFileSync(p, 'utf8');
s = s.replace("parent.document.querySelector('.music-toggle')?.click();", "parent.document.querySelector('.music-mute')?.click();");
fs.writeFileSync(p, s);
const h = fs.readFileSync('toys/deck.html', 'utf8');
const i = h.indexOf('<p class="sr" role="status" id="status"></p>');
console.log('insert point', i);
console.log(JSON.stringify(h.slice(i, i + 300)));
