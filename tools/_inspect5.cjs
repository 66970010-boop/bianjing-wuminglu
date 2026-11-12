const fs = require('fs');
const s = fs.readFileSync('toys/deck.html', 'utf8');
console.log('len', s.length);
const last = s.lastIndexOf('</body>');
console.log(JSON.stringify(s.slice(Math.max(0, last - 1500), last + 20)));
console.log('--- script srcs ---');
for (const m of s.matchAll(/<script[^>]*src="([^"]+)"/g)) console.log(m[1]);
