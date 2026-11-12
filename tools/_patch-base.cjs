const fs = require('fs');
for (const p of ['toys/deck.html', 'toys/杂货商.html']) {
  let s = fs.readFileSync(p, 'utf8');
  const old = '<script src="../assets/audio/sfx.js?v=20261113"></script>';
  const neu = '<script src="../assets/audio/sfx.js?v=20261113" data-sfx-base="../assets/audio/sfx/"></script>';
  if (s.includes(old)) { s = s.replace(old, neu); fs.writeFileSync(p, s); console.log('patched', p); }
  else console.log('skip', p, s.includes('data-sfx-base'));
}
