const fs = require('fs');
const s = fs.readFileSync('toys/deck.html', 'utf8');
for (const k of ['ui-tap-soft', 'toy-giggle', 'drum', 'music-mute', 'music-toggle', 'assets/audio/sfx.js']) {
  console.log(k, (s.split(k).length - 1));
}
