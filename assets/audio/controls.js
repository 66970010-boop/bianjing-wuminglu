/* One persistent player; sequential fades prevent overlapping music. */
(()=>{
let prefs;try{prefs=JSON.parse(localStorage.getItem('bj-audio-v1'))}catch{}
let volume=Math.max(0,Math.min(1,Number.isFinite(prefs?.volume)?prefs.volume:.3)),muted=!!prefs?.muted,last= prefs?.last||.3;
const player=new Audio();player.id='background-music';document.body.append(player);player.loop=true;player.preload='metadata';let unlocked=false,current='',desired='opening',running=false,gain=0;
function apply(){player.volume=muted?0:Math.max(0,Math.min(1,volume*gain))}
function persist(){localStorage.setItem('bj-audio-v1',JSON.stringify({volume,muted,last}))}
async function fade(to){const from=gain,start=performance.now();await new Promise(resolve=>{function frame(now){const t=Math.max(0,Math.min(1,(now-start)/450));gain=from+(to-from)*t;apply();if(t<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)})}
async function sync(){if(!unlocked||running)return;running=true;try{while(current!==desired){const next=desired;await fade(0);player.pause();current=next;player.src='assets/audio/'+next+'.mp3';try{await player.play()}catch{unlocked=false;current='';gain=0;break}await fade(1)}}finally{running=false}}
function category(){const p=state.page;if(['ending','delivery'].includes(p)||document.querySelector('.drink-result,.barber-result,.monk-complete,.fortune-step-3,.fortune-step-4'))return 'scroll';if(['home','opening','opening-film'].includes(p)||p==='scroll'&&state.introGuide?.status==='pending')return 'opening';if(['game','barber','drinks','fortune','monk','toys'].includes(p)||p==='dialogue'&&['fortune','monk','merchant','drinks','barber'].includes(state.npc))return 'game';if(['scroll','book','bio','history','collection','dialogue'].includes(p))return 'scroll';return 'scroll'}
const wrap=document.createElement('div');wrap.className='music-control';
wrap.innerHTML='<button class="music-toggle" aria-label="背景音乐音量" aria-expanded="false" aria-controls="music-panel"></button><div id="music-panel" class="music-panel" hidden><label for="music-volume">背景音乐 <output></output></label><input id="music-volume" aria-label="背景音乐音量" type="range" min="0" max="100" step="1"><button class="music-mute"></button></div>';
const toggle=wrap.querySelector('.music-toggle'),panel=wrap.querySelector('.music-panel'),slider=wrap.querySelector('input'),mute=wrap.querySelector('.music-mute');
function paint(){toggle.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/>'+((muted||!volume)?'<path d="m17 9 5 6m0-6-5 6"/>':'<path d="M16 8q5 4 0 8m3-11q8 7 0 14"/>')+'</svg>';slider.value=volume*100;wrap.querySelector('output').textContent=Math.round(volume*100)+'%';mute.textContent=muted||!volume?'恢复声音':'静音';mute.setAttribute('aria-pressed',String(muted||!volume));apply()}
function close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false')}
toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden))};
slider.oninput=()=>{volume=Number(slider.value)/100;if(volume>0){last=volume;muted=false}persist();paint()};
mute.onclick=()=>{if(muted||!volume){muted=false;if(!volume)volume=last||.3}else{last=volume;muted=true}persist();paint()};
function awaken(){if(!player.paused)return;desired=category();if(!current){current=desired;player.src='assets/audio/'+current+'.mp3'}gain=1;apply();player.play().then(()=>{unlocked=true;sync()}).catch(()=>{unlocked=false;current=''});}
 document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close();awaken()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.stopImmediatePropagation();e.preventDefault();close();toggle.focus()}else if(['Enter',' '].includes(e.key))awaken()},true);
function mount(){wrap.hidden=state.page==='opening-film';if(wrap.hidden)close();const bar=document.querySelector('#app .topbar');if(bar){bar.querySelector('.sound')?.remove();if(wrap.parentNode!==bar)bar.append(wrap)}else if(!wrap.isConnected)document.body.append(wrap);const next=category();if(next!==desired){desired=next;sync()}}
paint();mount();new MutationObserver(mount).observe(document.getElementById('app'),{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-fortune-step']});
})();
