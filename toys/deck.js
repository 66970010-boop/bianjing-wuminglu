const data=[
 {id:'bolanggu',name:'拨浪鼓',seal:'撥浪鼓',short:'轻摇鼓柄，双槌应声',play:'摇一摇',intro:'小鼓两侧系着鼓槌。转动鼓柄时，鼓槌随之摆动，轮流敲击鼓面。',how:'点击正面左起的试玩图标，观察双槌如何随鼓身摇摆。'},
 {id:'xiaoniren',name:'泥塑童子',seal:'泥塑童子',short:'陶泥小偶，持荷而立',play:'转一转',intro:'泥塑以小巧的人物形象寄托生活趣味。这件简化模型呈现一位手持荷叶的童子。',how:'点击正面左起的试玩图标，看看童子的衣饰与姿态。'},
 {id:'xiaofengche',name:'小风车',seal:'小風車',short:'纸叶迎风，绕轴轻转',play:'吹一吹',intro:'风推动叶片，叶片绕着中心转轴旋转。轻巧的纸叶与细杆，组成了这件小玩物。',how:'点击正面左起的试玩图标，观察纸叶转动。'}
];
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,deck=document.querySelector('#deck'),status=document.querySelector('#status'),cards=[],viewers={};
let active=0,lockUntil=0,hoverTimer=0,hoverTarget=-1,drag=null,lastPointer=null,dead=false,raf=0,audio=null,sound=true;
const voices=new Set();
const send=(type,toy)=>{if(type==='bianjing-toy-exit'&&parent===window){location.href='../index.html';return;}parent.postMessage({type,toy},location.protocol==='file:'?'*':location.origin);};
document.querySelector('#return').onclick=()=>send('bianjing-toy-exit');if(new URLSearchParams(location.search).has('embedded'))document.querySelector('#return').hidden=true;
function silence(){for(const o of voices){try{o.stop();}catch(_){}}voices.clear();if(audio)audio.suspend().catch(()=>{});}
function announce(t){status.textContent=t;}
function faceState(i){const c=cards[i],s=c.state;c.el.style.setProperty('--angle',s.angle+'deg');c.front.inert=s.back||i!==active;c.back.inert=!s.back||i!==active;c.front.setAttribute('aria-hidden',String(s.back));c.back.setAttribute('aria-hidden',String(!s.back));c.el.dataset.face=s.back?'back':'front';}
function layout(){cards.forEach((c,i)=>{let side=i===active?0:(i===(active+1)%3?1:-1);c.el.style.setProperty('--x',side===0?'0px':`calc(var(--card-w) * ${side*.48})`);c.el.style.setProperty('--y',side===0?'0px':'20px');c.el.style.setProperty('--tilt',side*5+'deg');c.el.style.setProperty('--scale',side===0?'1':'.9');c.el.dataset.side=String(side);c.el.style.zIndex=side===0?'3':side===1?'2':'1';c.el.dataset.active=String(i===active);c.el.setAttribute('aria-label',data[i].name+(i===active?'，当前纸笺':'，选择纸笺'));faceState(i);});}
function select(i){if(i===active||drag||performance.now()<lockUntil)return;clearTimeout(hoverTimer);Object.values(viewers).forEach(v=>{v.playUntil=0;});silence();active=i;lockUntil=performance.now()+(reduced?100:400);layout();viewers[data[i].id]?.draw(performance.now());announce('已选'+data[i].name);}
function turn(i,back){if(i!==active||drag||performance.now()<lockUntil)return;const s=cards[i].state;let target=Math.round(s.angle/360)*360+(back?180:0);while(target-s.angle>180)target-=360;while(target-s.angle< -180)target+=360;s.angle=target;s.back=back;lockUntil=performance.now()+(reduced?100:420);faceState(i);viewers[data[i].id].playUntil=0;silence();announce(data[i].name+(back?'，介绍':'，正面'));}
function note(freq,duration,delay=0){if(!sound)return;window.SFX?.play('ui-tap-soft',{volume:.5,gap:40});}
function thump(){if(!sound)return;window.SFX?.play('drum',{volume:.9});}
function giggle(){if(!sound)return;window.SFX?.play('toy-giggle',{volume:.85});}
function play(i){if(i!==active||drag||cards[i].state.back||performance.now()<lockUntil)return;const id=data[i].id,v=viewers[id];if(!v)return;if(!sound){send('bianjing-toy-played',id);announce(data[i].name+'正在试玩');return}if(id==='xiaoniren'){if(v.smile&&v.smile())giggle();}else if(id==='xiaofengche'){window.SFX?.play('wind-whoosh',{volume:.75});}else{window.SFX?.play('drum',{volume:.9});}send('bianjing-toy-played',id);announce(data[i].name+'正在试玩');}
data.forEach((toy,i)=>{
 const el=document.createElement('article');el.className='card';el.tabIndex=0;el.dataset.id=toy.id;
 el.innerHTML=`<div class="turn"><section class="face front"><h1 class="seal-title" aria-label="${toy.name}">${toy.seal}</h1><div class="model"><canvas aria-label="${toy.name}三维模型"></canvas></div><div class="actions"><button data-play aria-label="${toy.play}" title="${toy.play}">▷</button><button data-flip aria-label="查看${toy.name}背面介绍" title="翻面">↻</button><button data-reset aria-label="重置${toy.name}视角" title="重置视角">⌖</button><button class="quiet" data-sound aria-label="玩具音效，当前开启" title="音效">♪</button></div></section><section class="face back"><span class="overline">掌中三趣 · 0${i+1}</span><h2>${toy.name}</h2><p>${toy.intro}</p><p>${toy.how}</p><p class="source">模型为原创简化展示，非宋代实物的精确复原。</p><div class="actions"><button data-front aria-label="返回${toy.name}正面" title="返回正面">↻</button></div></section></div>`;
 deck.append(el);const front=el.querySelector('.front'),back=el.querySelector('.back');cards.push({el,front,back,state:{angle:0,back:false}});
 try{viewers[toy.id]=new Viewer(toy.id,el);viewers[toy.id].draw(0);}catch(e){console.error(e);el.querySelector('.model').textContent='模型暂未载入';}
 el.querySelector('[data-play]')?.addEventListener('click',()=>play(i));
 el.querySelector('[data-reset]')?.addEventListener('click',()=>{const v=viewers[toy.id];if(v){v.x=.08;v.y=-.35;v.playUntil=0;v.draw(performance.now());}});
 el.querySelector('[data-flip]')?.addEventListener('click',()=>turn(i,true));
 el.querySelector('[data-front]')?.addEventListener('click',()=>turn(i,false));
 el.querySelector('[data-sound]')?.addEventListener('click',()=>{sound=!sound;if(!sound)silence();document.querySelectorAll('[data-sound]').forEach(b=>{b.textContent=sound?'♪':'♩';b.setAttribute('aria-pressed',String(sound));b.setAttribute('aria-label','玩具音效，当前'+(sound?'开启':'关闭'));});});
 el.addEventListener('pointermove',e=>{if(drag||e.pointerType!=='mouse'||i===active)return;const moved=!lastPointer||Math.hypot(e.clientX-lastPointer.x,e.clientY-lastPointer.y)>.5;if(!moved)return;lastPointer={x:e.clientX,y:e.clientY};if(hoverTarget===i)return;hoverTarget=i;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>{hoverTarget=-1;if(el.matches(':hover'))select(i);},320);});
 el.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);hoverTarget=-1;});
 el.addEventListener('focus',()=>select(i));
 el.addEventListener('keydown',e=>{if(e.target!==el)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();if(i!==active)select(i);else turn(i,!cards[i].state.back);}if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const n=(active+(e.key==='ArrowRight'?1:2))%3;select(n);cards[n].el.focus();}});
 el.addEventListener('pointerdown',e=>{if(e.target.closest('button')||e.button!==0)return;if(i!==active){select(i);return;}if(performance.now()<lockUntil)return;clearTimeout(hoverTimer);drag={i,id:e.pointerId,x:e.clientX,y:e.clientY,kind:e.target.closest('.model')&&!cards[i].state.back?'model':'card',rx:viewers[toy.id]?.x||0,ry:viewers[toy.id]?.y||0,angle:cards[i].state.angle,lastX:e.clientX,time:e.timeStamp,velocity:0,moved:false};el.setPointerCapture(e.pointerId);el.classList.add('dragging');Object.values(viewers).forEach(v=>v.playUntil=0);silence();});
 el.addEventListener('pointermove',e=>{if(!drag||drag.i!==i||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(drag.kind==='model'){e.preventDefault();drag.moved=true;const v=viewers[toy.id];if(v){v.y=drag.ry+dx*.009;v.x=Math.max(-.85,Math.min(.85,drag.rx+dy*.008));v.draw(performance.now());el.dataset.modelYaw=String(v.y);el.dataset.modelPitch=String(v.x);}return;}if(!drag.moved&&Math.abs(dx)<7)return;if(!drag.moved&&Math.abs(dy)>Math.abs(dx)*1.4)return;drag.moved=true;e.preventDefault();const dt=Math.max(1,e.timeStamp-drag.time);drag.velocity=(e.clientX-drag.lastX)/dt;drag.lastX=e.clientX;drag.time=e.timeStamp;cards[i].state.angle=drag.angle+Math.max(-210,Math.min(210,dx/el.clientWidth*240));el.style.setProperty('--angle',cards[i].state.angle+'deg');});
 const release=e=>{if(!drag||drag.i!==i||drag.id!==e.pointerId)return;const d=drag,s=cards[i].state;drag=null;el.classList.remove('dragging');if(d.kind==='model'){if(!d.moved&&toy.id==='xiaoniren'&&!cards[i].state.back){const v=viewers.xiaoniren;if(v&&v.smile&&v.smile()){giggle();announce('童子笑了');}}else{announce(toy.name+'观察角度已调整');}return;}const cancelled=e.type==='pointercancel';const angle=cancelled?d.angle:s.angle+(Math.abs(d.velocity)>.5?Math.sign(d.velocity)*30:0);s.angle=Math.round(angle/180)*180;s.back=Math.abs(Math.round(s.angle/180)%2)===1;faceState(i);lockUntil=performance.now()+(reduced?100:420);announce(toy.name+(s.back?'，介绍':'，正面'));};
 // Flipping can move the hit-tested face away from the original pointer.
 // Finish at window capture level, including release outside the card.
 addEventListener('pointerup',release,true);addEventListener('pointercancel',release,true);
 el.addEventListener('lostpointercapture',e=>release({pointerId:e.pointerId,type:'pointercancel'}));
 addEventListener('blur',()=>{if(drag?.i===i)release({pointerId:drag.id,type:'pointercancel'});});
});
// Track actual movement over the whole page, including the active card and
// buttons, so returning to a previously hovered spot can select again.
addEventListener('pointermove',e=>{if(e.pointerType==='mouse')lastPointer={x:e.clientX,y:e.clientY};});
layout();
let nextThump=0;
function animate(ms){if(dead)return;const c=cards[active],v=viewers[data[active].id];if(v&&!document.hidden&&!c.state.back&&!reduced)v.draw(ms);if(sound&&!c.state.back&&data[active].id==='bolanggu'&&!document.hidden&&ms>=nextThump){thump();nextThump=ms+1050;}raf=requestAnimationFrame(animate);}raf=requestAnimationFrame(animate);
addEventListener('keydown',e=>{if(e.key==='Escape'){if(cards[active].state.back)turn(active,false);else send('bianjing-toy-exit');}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){silence();Object.values(viewers).forEach(v=>v.playUntil=0);}});
addEventListener('pagehide',()=>{dead=true;cancelAnimationFrame(raf);clearTimeout(hoverTimer);audio?.close();for(const v of Object.values(viewers)){v.dispose&&v.dispose();}});
document.querySelector('#hint')?.remove();
// Top-right master music toggle: controls toy sounds locally and the parent BGM together.
const musicBtn=document.querySelector('#musicToggle');
if(musicBtn)musicBtn.onclick=()=>{sound=!sound;musicBtn.classList.toggle('off',!sound);musicBtn.setAttribute('aria-pressed',String(sound));if(!sound)silence();try{if(window.parent&&parent!==window)parent.document.querySelector('.music-mute')?.click();}catch(_){}};
