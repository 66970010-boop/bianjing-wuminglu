const fs = require('fs');
const s = fs.readFileSync('toys/deck.html', 'utf8');
console.log('has sfx:', s.includes('assets/audio/sfx.js'));
console.log('len', s.length);
console.log('has musicToggle:', s.includes('musicToggle'));
const j = fs.readFileSync('toys/deck.js', 'utf8');
const i = j.lastIndexOf('musicBtn');
console.log(JSON.stringify(j.slice(i - 100, i + 460)));
