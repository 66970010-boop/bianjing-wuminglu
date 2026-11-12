/* 卖饼青年 · 终章页：滚轮/触摸/键盘分幕，沿用无名录与卜卦的阅读机制。
   只重做卖饼青年的对话页；递上家书后的四幕与终章仍走原流程。 */
function renderBakerEnding(root){
 const d=dayStory();
 if(d.inquiries?.boat)d.breadSeen=true;
 const scenes=[
  {
   eyebrow:'人物对话 · 剧情创作',
   quote:'“客官，可否替我照看一会儿炉火？”',
   body:'天还没亮透，炉火先亮了起来。青年把最后一屉饼挪到炉边，抬手抹了抹额角的汗。听见脚步声，他回过头。',
   note:d.breadSeen?'案角包着一张饼。“船家还没吃饭，这张不卖。”':'',
   actions:[['说起城外的老槐树 →',1],['查看已记录的人物和线索 →','book']]
  },
  {
   eyebrow:'前情 · 老槐树',
   quote:'“是我娘托你来的？”',
   body:'他手里的活停住了。面团还搁在案上，他却半晌没有动，只把沾着面粉的手在围裙上擦了又擦，抬眼望向城外的方向。',
   note:'',
   actions:[['应他一声，取出家书 →',2]]
  },
  {
   eyebrow:'家书 · 一纸无字',
   quote:'“河上有位熟客，我每天都给他留一张饼。”',
   body:'他把家书接过去，却没有立刻拆。炉火在两人之间轻轻爆了一声，他低着头，像在等一个很久以前就该到的名字。',
   note:d.ended?'家书已至。他仍把那张空白的纸收在怀中。':'',
   actions:[[d.ended?'回想这封家书 →':'递上家书 →','hand']]
  }
 ];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const events=new AbortController(),signal=events.signal;
 const on=(el,type,fn,opts={})=>el.addEventListener(type,fn,{...opts,signal});
 let step=0,disposed=false,transitioning=false,busy=false,readyAt=performance.now()+(reduced.matches?0:900),wheelAmount=0,wheelAt=0,touchY=null;
 const shell=div('baker-shell');
 shell.append(div('baker-portrait-glow'));
 const portrait=document.createElement('img');portrait.className='baker-portrait';portrait.src='assets/baker-ending-portrait.webp';portrait.alt='卖饼青年半身立绘';portrait.draggable=false;portrait.width=880;portrait.height=1120;shell.append(portrait);
 shell.append(btn('← 返回画卷',()=>go('scroll'),'baker-back'));
 const stage=div('baker-stage');stage.tabIndex=-1;stage.setAttribute('role','region');stage.setAttribute('aria-label','卖饼青年对话');
 const live=div('baker-live');live.className='ui-sr-only';live.setAttribute('role','status');live.setAttribute('aria-live','polite');
 const footer=div('baker-footer'),prev=btn('上一幕',()=>move(-1),'baker-prev'),next=btn('向下滚动',()=>move(1),'baker-next'),progress=div('baker-progress');
 for(let i=0;i<scenes.length;i++){const mark=document.createElement('span');mark.textContent=String(i+1).padStart(2,'0');progress.append(mark)}
 footer.append(prev,next,progress);shell.append(stage,footer,live);root.append(shell);
 // keep title and subtitle stable between scenes; only the reading block turns like a page
 function paint(){
  stage.replaceChildren();
  const s=scenes[step];
  const scene=div('baker-scene');
  scene.append(div('baker-eyebrow',s.eyebrow));
  const h=document.createElement('h1');h.className='baker-title';h.textContent='卖饼青年';scene.append(h);
  const sub=document.createElement('h2');sub.className='baker-subtitle';sub.textContent='五更炉火';scene.append(sub);
  scene.append(div('baker-rule'));
  const q=document.createElement('p');q.className='baker-quote';q.textContent=s.quote;scene.append(q);
  const b=document.createElement('p');b.className='baker-body';b.textContent=s.body;scene.append(b);
  if(s.note){const n=document.createElement('p');n.className='baker-note';n.textContent=s.note;scene.append(n)}
  const actions=div('baker-actions');
  s.actions.forEach(([label,target])=>{actions.append(btn(label,()=>{if(target==='book'){go('book');return}if(target==='hand'){handOver();return}change(target)},'baker-action'))});
  scene.append(actions);stage.append(scene);
  stage.scrollTop=0;
  root.dataset.step=String(step);
  [...progress.children].forEach((m,i)=>{m.className=i===step?'is-current':i<step?'is-complete':'';m.setAttribute('aria-current',i===step?'step':'false')});
  prev.hidden=step===0;next.hidden=step===scenes.length-1;next.textContent='向下滚动';
  live.textContent=`卖饼青年，第 ${step+1} 幕，共 ${scenes.length} 幕。`;
 }
 function handOver(){if(busy)return;if(d.ended){go('ending');return}d.deliveryPeriod=dayPeriod();d.started=true;d.deliveryFrame=0;window.SFX?.play('paper-unfold',{volume:.8});save();go('delivery')}
 async function change(to){
  if(disposed||transitioning||to===step||to<0||to>=scenes.length)return;
  window.SFX?.play('page-turn',{volume:.55});
  if(reduced.matches){step=to;paint();readyAt=performance.now();return}
  transitioning=true;stage.inert=true;root.classList.add('baker-leaving');
  await new Promise(resolve=>setTimeout(resolve,380));if(disposed)return;
  step=to;paint();root.classList.remove('baker-leaving');root.classList.add('baker-entering');
  readyAt=performance.now()+1250;
  setTimeout(()=>{if(disposed)return;root.classList.remove('baker-entering');transitioning=false;stage.inert=false;stage.focus({preventScroll:true})},750);
 }
 function move(direction){if(busy||transitioning)return;const to=step+direction;if(to<0||to>=scenes.length)return;change(to)}
 on(root,'wheel',e=>{
  if(e.ctrlKey||e.metaKey||e.target.closest('input,textarea,dialog'))return;
  const insideStage=!!e.target.closest('.baker-stage');
  if(insideStage&&stage.scrollHeight>stage.clientHeight+2){
   const atTop=stage.scrollTop<=0,atBottom=stage.scrollTop+stage.clientHeight>=stage.scrollHeight-2;
   if((e.deltaY>0&&!atBottom)||(e.deltaY<0&&!atTop))return;
  }
  e.preventDefault();
  if(busy||transitioning||performance.now()<readyAt)return;
  const now=performance.now();if(now-wheelAt>180)wheelAmount=0;wheelAt=now;
  wheelAmount+=e.deltaY*(e.deltaMode===1?20:e.deltaMode===2?innerHeight:1);
  if(Math.abs(wheelAmount)>65){const dir=Math.sign(wheelAmount);wheelAmount=0;readyAt=now+900;move(dir)}
 },{passive:false});
 on(root,'touchstart',e=>{
  if(e.target.closest('input,textarea,dialog')){touchY=null;return}
  if(e.target.closest('.baker-stage')&&stage.scrollHeight>stage.clientHeight+2){touchY=null;return}
  touchY=e.touches[0].clientY;
 },{passive:true});
 on(root,'touchend',e=>{if(touchY===null)return;const delta=touchY-e.changedTouches[0].clientY;touchY=null;if(Math.abs(delta)>45&&performance.now()>=readyAt)move(Math.sign(delta))},{passive:true});
 on(document,'keydown',e=>{
  if(e.target.closest('input,textarea,dialog'))return;
  if(['ArrowDown','PageDown','ArrowRight','ArrowUp','PageUp','ArrowLeft'].includes(e.key)){e.preventDefault();if(performance.now()>=readyAt)move(['ArrowDown','PageDown','ArrowRight'].includes(e.key)?1:-1)}
 },{capture:true});
 window.bakerEndingCleanup=()=>{disposed=true;events.abort();window.bakerEndingCleanup=null};
 paint();stage.focus({preventScroll:true});
}
