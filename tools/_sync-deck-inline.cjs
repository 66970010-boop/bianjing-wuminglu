const fs = require('fs');
const OLD_NOTE = "function note(freq,duration,delay=0){window.SFX?.play('ui-tap-soft',{volume:.5,gap:40});}\nfunction thump(){window.SFX?.play('drum',{volume:.9});}\nfunction giggle(){window.SFX?.play('toy-giggle',{volume:.85});}\nfunction play(i){if(i!==active||drag||cards[i].state.back||performance.now()<lockUntil)return;const id=data[i].id,v=viewers[id];if(!v)return;if(id==='xiaoniren'){if(v.smile&&v.smile())giggle();}else if(id==='xiaofengche'){window.SFX?.play('wind-whoosh',{volume:.75});}else{window.SFX?.play('drum',{volume:.9});}send('bianjing-toy-played',id);announce(data[i].name+'正在试玩');}";
const NEW_NOTE = "function note(freq,duration,delay=0){if(!sound)return;window.SFX?.play('ui-tap-soft',{volume:.5,gap:40});}\nfunction thump(){if(!sound)return;window.SFX?.play('drum',{volume:.9});}\nfunction giggle(){if(!sound)return;window.SFX?.play('toy-giggle',{volume:.85});}\nfunction play(i){if(i!==active||drag||cards[i].state.back||performance.now()<lockUntil)return;const id=data[i].id,v=viewers[id];if(!v)return;if(!sound){send('bianjing-toy-played',id);announce(data[i].name+'正在试玩');return}if(id==='xiaoniren'){if(v.smile&&v.smile())giggle();}else if(id==='xiaofengche'){window.SFX?.play('wind-whoosh',{volume:.75});}else{window.SFX?.play('drum',{volume:.9});}send('bianjing-toy-played',id);announce(data[i].name+'正在试玩');}";
const OLD_SOUND = "[data-sound]').addEventListener('click',()=>{sound=!sound;window.SFX?.setEnabled(sound);if(!sound)silence();});";
const NEW_SOUND = "[data-sound]').addEventListener('click',()=>{sound=!sound;if(!sound)silence();});";
const OLD_MUSIC = "if(musicBtn)musicBtn.onclick=()=>{sound=!sound;window.SFX?.setEnabled(sound);musicBtn.classList.toggle('off',!sound);";
const NEW_MUSIC = "if(musicBtn)musicBtn.onclick=()=>{sound=!sound;musicBtn.classList.toggle('off',!sound);";

for (const p of ['toys/deck.html', 'toys/杂货商.html']) {
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  const before = s;
  s = s.replace(OLD_NOTE, NEW_NOTE).replace(OLD_SOUND, NEW_SOUND).replace(OLD_MUSIC, NEW_MUSIC);
  if (s !== before) { fs.writeFileSync(p, s); console.log('patched', p); }
  else console.log('no-change', p, 'note:', s.includes(OLD_NOTE), 'sound:', s.includes(OLD_SOUND));
}
