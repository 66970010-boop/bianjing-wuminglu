const fs = require('node:fs');
const files = ['index.html','scroll.js','story.js','barber.js','drinks.js','monk.js','fortune.js','motion.js','intro-guide.js','baker-ending.js','collection.js','ui-fixes.js','assets/audio/sfx.js','assets/audio/controls.js','assets/book-exhibit/exhibit.js','assets/effects/monk-editorial.js','toys/deck.js','toys/deck.html'];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  const m = s.match(/SFX\??\.(play|setMuted|setEnabled|getState|warm)/g) || [];
  console.log(f, m.length, [...new Set(m)].join(','));
}
