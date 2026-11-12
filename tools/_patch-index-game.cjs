const fs = require('node:fs');
const p = 'index.html';
let s = fs.readFileSync(p, 'utf8');
const old = "root.append(hotspot(arr[state.step],x,y,()=>{state.step++;if(state.step>=3){state.played[state.npc]=true;clue();state.step=0;go('dialogue');toast(state.npc==='boat'?'船只平安通过虹桥；再回访饼店主人。':'饼已出炉，饼店主人为船夫留了一张。')}else{save();render()}}));";
const neu = "root.append(hotspot(arr[state.step],x,y,()=>{state.step++;window.SFX?.play(state.npc==='boat'?'water-pour':'cloth',{volume:.8});if(state.step>=3){state.played[state.npc]=true;clue();state.step=0;window.SFX?.play('chime-complete',{volume:.7});go('dialogue');toast(state.npc==='boat'?'船只平安通过虹桥；再回访饼店主人。':'饼已出炉，饼店主人为船夫留了一张。')}else{save();render()}}));";
if (!s.includes(old)) { console.log('MISS game'); process.exit(1); }
s = s.replace(old, neu);
fs.writeFileSync(p, s);
console.log('OK', s.length);
