const fs = require('fs');
const s = fs.readFileSync('toys/deck.html', 'utf8');
for (const k of ['function note(', 'toy-giggle', 'wind-whoosh', 'setEnabled', 'data-sound', 'music-mute', 'music-toggle', 'function play(i)']) {
  console.log(k, s.split(k).length - 1);
}
const i = s.indexOf('function note(');
if (i >= 0) console.log(JSON.stringify(s.slice(i, i + 700)));
const j = s.indexOf('function play(i)');
if (j >= 0) console.log('PLAY', JSON.stringify(s.slice(j, j + 700)));
