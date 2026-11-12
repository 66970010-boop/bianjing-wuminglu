const fs = require('node:fs');
const vm = require('node:vm');
const files = ['scroll.js','story.js','barber.js','drinks.js','monk.js','fortune.js','motion.js','intro-guide.js','baker-ending.js','assets/audio/sfx.js','assets/audio/controls.js','assets/book-exhibit/exhibit.js','assets/effects/monk-editorial.js','toys/deck.js'];
let bad = 0;
for (const f of files) {
  try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); console.log('OK', f); }
  catch (e) { bad++; console.log('FAIL', f, e.message); }
}
process.exitCode = bad ? 1 : 0;
