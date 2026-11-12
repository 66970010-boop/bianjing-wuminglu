/* One persistent music player + shared sound-effects controls; sequential fades prevent overlapping music. */
(()=>{
let prefs;try{prefs=JSON.parse(localStorage.getItem('bj-audio-v1'))}catch{}
let volume=Math.max(0,Math.min(1,Number.isFinite(prefs?.volume)?prefs.volume:.3)),muted=!!prefs?.muted,last= prefs?.last||.3;
const player=new Audio();player.id='background-music';document.body.append(player);player.loop=true;player.preload='metadata';let unlocked=false,current='',desired='opening',running=false,gain=0;
function apply(){player.muted=muted||!volume;player.volume=muted?0:Math.max(0,Math.min(1,volume*gain))}
function persist(){localStorage.setItem('bj-audio-v1',JSON.stringify({volume,muted,last}))}
async function fade(to){const from=gain,start=performance.now(),DUR=450;await new Promise(resolve=>{function step(){const t=Math.max(0,Math.min(1,(performance.now()-start)/DUR));gain=from+(to-from)*t;apply();if(t<1)setTimeout(step,16);else resolve()}step()})}
async function sync(){if(!unlocked||running)return;running=true;try{let guard=0;while(current!==desired){if(++guard>8)break;const next=desired;await fade(0);player.pause();current=next;player.src='assets/audio/'+next+'.mp3';try{await player.play()}catch{unlocked=false;current='';gain=0;break}await fade(1)}}finally{running=false}}
function category(){const p=state.page;if(state.dayStory&&state.dayStory.ended)return 'ending';if(p==='ending'||p==='delivery'||p==='book'||p==='dialogue'&&state.npc==='baker')return 'ending';if(document.querySelector('.drink-result,.barber-result,.monk-complete,.fortune-step-3,.fortune-step-4'))return 'scroll';if(['home','opening','opening-film'].includes(p)||p==='scroll'&&state.introGuide?.status==='pending')return 'opening';if(['game','barber','drinks','fortune','monk','toys'].includes(p)||p==='dialogue'&&['fortune','monk','merchant','drinks','barber'].includes(state.npc))return 'game';if(['scroll','book','bio','history','collection','dialogue'].includes(p))return 'scroll';return 'scroll'}
const wrap=document.createElement('div');wrap.className='music-control';
wrap.innerHTML='<button class="music-toggle" aria-label="背景音乐音量" aria-expanded="false" aria-controls="music-panel"></button><div id="music-panel" class="music-panel" hidden><div class="music-row music-row-music"><label for="music-volume">背景音乐 <output></output></label><input id="music-volume" aria-label="背景音乐音量" type="range" min="0" max="100" step="1"><button class="music-mute"></button></div><div class="music-row music-row-sfx"><label for="sfx-volume">交互音效 <output></output></label><input id="sfx-volume" aria-label="交互音效音量" type="range" min="0" max="100" step="1"><button class="sfx-mute"></button></div></div>';
const toggle=wrap.querySelector('.music-toggle'),panel=wrap.querySelector('.music-panel'),slider=wrap.querySelector('#music-volume'),mute=wrap.querySelector('.music-mute'),sfxSlider=wrap.querySelector('#sfx-volume'),sfxMute=wrap.querySelector('.sfx-mute');
function sfxState(){return window.SFX?SFX.getState():{enabled:true,volume:.7,muted:false,audible:true}}
function paintSfx(){const s=sfxState();sfxSlider.value=Math.round(s.volume*100);wrap.querySelector('.music-row-sfx output').textContent=Math.round(s.volume*100)+'%';sfxMute.textContent=s.audible?'静音':'恢复声音';sfxMute.setAttribute('aria-pressed',String(!s.audible))}
function paint(){const silent=muted||!volume;toggle.setAttribute('aria-label','声音设置：背景音乐'+(silent?'已静音':'开启')+'，交互音效'+(sfxState().audible?'开启':'已静音'));toggle.removeAttribute('aria-pressed');toggle.title='声音设置';toggle.innerHTML='<svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/>'+(silent&&!sfxState().audible?'<path d="m17 9 5 6m0-6-5 6"/>':'<path d="M16 8q5 4 0 8m3-11q8 7 0 14"/>')+'</svg>';slider.value=volume*100;wrap.querySelector('.music-row-music output').textContent=Math.round(volume*100)+'%';mute.textContent=silent?'恢复声音':'静音';mute.setAttribute('aria-pressed',String(silent));apply();paintSfx()}
function close(){panel.hidden=true;toggle.setAttribute('aria-expanded','false')}
toggle.onclick=()=>{const open=panel.hidden;if(open){panel.hidden=false;toggle.setAttribute('aria-expanded','true')}else close()};
slider.oninput=()=>{volume=Number(slider.value)/100;if(volume>0){last=volume;muted=false}persist();paint()};
mute.onclick=()=>{if(muted||!volume){muted=false;if(!volume)volume=last||.3}else{last=volume;muted=true}persist();paint()};
sfxSlider.oninput=()=>{window.SFX?.setVolume(Number(sfxSlider.value)/100);paintSfx()};
sfxMute.onclick=()=>{const s=sfxState();window.SFX?.setMuted(s.audible)};
document.addEventListener('sfxchange',()=>{if(!panel.hidden)paintSfx()});
function awaken(){if(!player.paused)return;desired=category();if(!current){current=desired;player.src='assets/audio/'+current+'.mp3'}gain=1;apply();player.play().then(()=>{unlocked=true;sync()}).catch(()=>{unlocked=false;current=''})}
document.addEventListener('pointerdown',e=>{if(!wrap.contains(e.target))close();awaken()},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){e.stopImmediatePropagation();e.preventDefault();close();toggle.focus()}else if(['Enter',' '].includes(e.key))awaken()},true);
function mount(){wrap.hidden=state.page==='opening-film';if(wrap.hidden)close();const bar=document.querySelector('#app .topbar');if(bar){bar.querySelector('.sound')?.remove();if(wrap.parentNode!==bar)bar.append(wrap)}else if(!wrap.isConnected)document.body.append(wrap);const next=category();if(next!==desired){desired=next;sync()}}
paint();mount();new MutationObserver(mount).observe(document.getElementById('app'),{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-fortune-step']});
})();
