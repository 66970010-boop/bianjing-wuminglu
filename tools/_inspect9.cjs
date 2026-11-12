const fs = require('fs');
const s = fs.readFileSync('toys/deck.html', 'utf8');
console.log('data:audio occurrences', s.split('data:audio').length - 1);
const i = s.indexOf('data:audio');
if (i >= 0) console.log(JSON.stringify(s.slice(i - 200, i + 200)));
console.log('--- sfx.js refs ---');
let j = -1, c = 0;
while ((j = s.indexOf('assets/audio/sfx.js', j + 1)) >= 0 && c < 5) { c++; console.log(c, JSON.stringify(s.slice(j - 120, j + 120))); }
