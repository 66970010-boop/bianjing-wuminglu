const fs = require('fs');
const s = fs.readFileSync('toys/deck.html', 'utf8');
const i = s.indexOf('window.__SFX_DATA');
const seg = s.slice(i - 5, i + 800000);
const end = seg.indexOf('</script>');
console.log('payload length', end);
const head = seg.slice(0, end);
console.log('keys', [...head.matchAll(/\"([a-z0-9-]+)\":\"data:audio/g)].map(m => m[1]).join(','));
