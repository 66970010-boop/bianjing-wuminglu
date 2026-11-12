const fs = require('fs');
for (const p of ['toys/deck.html', 'toys/杂货商.html']) {
  if (!fs.existsSync(p)) { console.log('skip', p); continue; }
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  s = s.replaceAll("parent.document.querySelector('.music-toggle')?.click();", "parent.document.querySelector('.music-mute')?.click();");
  if (s !== before) { fs.writeFileSync(p, s); console.log('patched', p); }
  else console.log('no change', p);
}
