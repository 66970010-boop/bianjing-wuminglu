const fs = require('fs');
const s = fs.readFileSync('assets/audio/sfx.js', 'utf8');
const m = s.match(/const PAGE_SOUND = \{([^}]+)\}/)[1];
const vals = [...new Set([...m.matchAll(/: '([a-z-]*)'/g)].map(x => x[1]).filter(Boolean))];
const defs = [...s.matchAll(/^    '([a-z-]+)':/gm)].map(x => x[1]);
console.log('page sounds:', vals.join(','));
console.log('missing:', vals.filter(v => !defs.includes(v)));
console.log('defs', defs.length);
