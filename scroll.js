/* Painting coordinates are fractions of the full scroll, never viewport positions. */
const SCROLL_ART = {src:'assets/qingming-scroll.webp',thumb:'assets/qingming-overview.webp',width:14794,height:700};
const SCROLL_REGIONS = [
  {id:'outskirts',label:'郊野',title:'城郊 · 行旅',center:.91},
  {id:'river',label:'虹桥',title:'汴河 · 虹桥',center:.505},
  {id:'city',label:'城内',title:'城内 · 百业',center:.22}
];
const SCROLL_NPCS = [
  {id:'drinks',label:'香饮子铺 · 一盏汴京凉',x:865/14794,y:590/700},
  {id:'barber',label:'刀镊匠 · 毫末之间',x:2172/14794,y:666/700},
  {id:'monk',label:'行脚僧',x:.91,y:.64},
  {id:'boat',label:'船夫',x:.515,y:.38},
  {id:'baker',label:'饼店主人',x:.482,y:.63},
  {id:'merchant',label:'杂货商',x:.23,y:.64},
  {id:'fortune',label:'卜卦先生',x:11100/14794,y:280/700}
];

function mountScroll(root){
 const events=new AbortController();
 const listen=(el,type,fn,opts={})=>el.addEventListener(type,fn,{...opts,signal:events.signal});
 const viewport=document.createElement('div');
 viewport.className='scroll-viewport';viewport.tabIndex=0;
 viewport.setAttribute('role','region');viewport.setAttribute('aria-label','清明上河图画卷，可滚轮横移、拖动，或使用左右方向键');
 const world=div('scroll-world');
 const painting=document.createElement('img');painting.className='scroll-painting';
 painting.width=SCROLL_ART.width;painting.height=SCROLL_ART.height;
 painting.alt='北宋张择端《清明上河图》全卷，故宫博物院藏';painting.draggable=false;
 world.append(painting);
 const names={drinks:'香饮子摊',barber:'刀镊匠',monk:'行脚僧',boat:'船夫',baker:'炊饼',merchant:'杂货商',fortune:'卜卦先生'};
 let activePin=null;const preview=div('npc-seal-preview');preview.hidden=true;root.append(preview);
 function closePreview(){preview.hidden=true;activePin?.setAttribute('aria-expanded','false');activePin=null;}
 function showPreview(npc,pin){if(activePin===pin)return;closePreview();activePin=pin;pin.setAttribute('aria-expanded','true');preview.replaceChildren();const portrait=document.createElement('img');portrait.src=npc.id==='drinks'?'assets/drink-keeper-portrait.png':'assets/'+personImages[npc.id]+'.png';portrait.alt=names[npc.id];const name=document.createElement('h2');name.textContent=names[npc.id];preview.append(portrait,name);preview.hidden=false;const r=pin.getBoundingClientRect(),height=Math.min(380,innerHeight-180),width=Math.min(240,innerWidth-32);preview.style.width=width+'px';preview.style.height=height+'px';preview.style.left=Math.max(16,Math.min(innerWidth-width-16,r.left-width/2+28))+'px';preview.style.top=Math.max(76,Math.min(innerHeight-height-140,r.top-height))+'px';}
 for(const npc of SCROLL_NPCS){const pin=btn('',()=>visit(npc.id),'npc-seal'+(state.played[npc.id]?' is-complete':''));pin.style.left=npc.x*100+'%';pin.style.top=npc.y*100+'%';pin.dataset.npc=npc.id;pin.setAttribute('aria-label',names[npc.id]);pin.setAttribute('aria-expanded','false');const seal=document.createElement('img');seal.src='assets/seals/'+npc.id+(['baker','drinks','boat'].includes(npc.id)?'-v2':'')+'.png';seal.alt='';seal.draggable=false;pin.append(seal);listen(pin,'pointerenter',e=>{if(e.pointerType!=='touch')showPreview(npc,pin)});listen(pin,'pointerleave',closePreview);listen(pin,'focus',()=>showPreview(npc,pin));listen(pin,'blur',closePreview);world.append(pin);}
 listen(viewport,'click',e=>{if(!e.target.closest('.npc-seal'))closePreview()});listen(document,'keydown',e=>{if(e.key==='Escape')closePreview()});listen(viewport,'pointerdown',e=>{if(!e.target.closest('.npc-seal'))closePreview()});
 viewport.append(world);
 const caption=div('scroll-caption');
 const regionName=document.createElement('span');
 caption.append(regionName);
 
 const footer=div('scroll-footer');footer.setAttribute('aria-label','画卷导航');
 const regions=div('scroll-regions');const underline=div('region-underline');regions.append(underline);
 const timeline=div('scroll-timeline');
 const overview=div('scroll-overview');overview.setAttribute('aria-hidden','true');
 const thumbnail=document.createElement('img');thumbnail.src=SCROLL_ART.thumb;thumbnail.alt='';thumbnail.draggable=false;
 const windowMark=div('scroll-window');overview.append(thumbnail,windowMark);
 const range=document.createElement('input');range.className='scroll-range';range.type='range';range.min=0;range.max=1000;range.step=1;
 range.setAttribute('aria-label','画卷横向位置');
 timeline.append(overview,range);
 const actions=div('scroll-actions');
 const viewToggle=btn('欣赏原画',()=>{const clean=root.classList.toggle('is-art-only');viewToggle.textContent=clean?'返回寻访':'欣赏原画';viewToggle.setAttribute('aria-pressed',String(clean));});
 viewToggle.setAttribute('aria-pressed','false');
 const source=document.createElement('a');source.href='https://www.dpm.org.cn/collection/paint/228226.html';source.target='_blank';source.rel='noopener noreferrer';source.textContent='故宫博物院藏 ↗';
 actions.append(viewToggle,source);footer.append(regions,timeline,actions);
 const loading=div('scroll-loading');loading.setAttribute('role','status');loading.textContent='正在展卷…';
 const story=state.dayStory||{};
 const delivering=!story.ended&&(story.directions||story.credited?.length>=3);
 const target=delivering?SCROLL_NPCS.find(n=>n.id==='baker'):SCROLL_NPCS.find(n=>!state.talked?.[n.id]&&!state.dayStory?.heard?.[n.id]&&!state.played[n.id]);
 const drinkGuide=btn('',()=>{
  if(!target)return;
  stopEntrance();closePreview();
  const pin=world.querySelector('[data-npc="'+target.id+'"]');
  viewport.scrollTo({left:Math.max(0,Math.min(limits(),target.x*world.scrollWidth-viewport.clientWidth/2)),behavior:reduced()?'instant':'smooth'});
  pin?.focus({preventScroll:true});closePreview();
 },'scroll-drink-guide');
 drinkGuide.dataset.target=target?.id||'';
 drinkGuide.append(document.createTextNode(target?'寻下一位有缘人':'已访遍画中人'));
 if(target){const arrow=document.createElement('span');arrow.className='scroll-guide-arrow';arrow.textContent='→';arrow.setAttribute('aria-hidden','true');drinkGuide.append(arrow);}
 drinkGuide.disabled=!target;
 root.append(viewport,caption,footer,loading,drinkGuide);
 let frame=0,saveTimer=0,drag=null,miniDrag=null,entrance=0;
 const stopEntrance=()=>{cancelAnimationFrame(entrance);entrance=0;};
 for(const type of ['wheel','pointerdown','keydown'])listen(root,type,stopEntrance,{capture:true,passive:true});
 let center=Number.isFinite(state.scrollCenter)?state.scrollCenter:(SCROLL_REGIONS.find(r=>r.id===state.region)||SCROLL_REGIONS[1]).center;
 const limits=()=>Math.max(0,viewport.scrollWidth-viewport.clientWidth);
 let currentRegion=null,labelMotion=null;const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function positionUnderline(){const b=regions.querySelector('button[aria-current="true"]');if(b){underline.style.width=b.offsetWidth+'px';underline.style.transform='translateX('+b.offsetLeft+'px)';}}
 function update(instant=false){
  frame=0;
  const total=world.scrollWidth,vw=viewport.clientWidth,max=limits();
  if(!total||!vw)return;
  center=(viewport.scrollLeft+vw/2)/total;
  const position=max?viewport.scrollLeft/max:0;
  range.value=String(Math.round(position*1000));
  windowMark.style.width=Math.min(100,vw/total*100)+'%';
  windowMark.style.left=viewport.scrollLeft/total*100+'%';
  let current=SCROLL_REGIONS.reduce((a,b)=>Math.abs(a.center-center)<Math.abs(b.center-center)?a:b);
  if(!instant&&currentRegion&&current.id!==currentRegion.id){const boundary=(current.center+currentRegion.center)/2;if(Math.abs(center-boundary)<.006)current=currentRegion;}
  if(!currentRegion||currentRegion.id!==current.id){const previous=currentRegion;currentRegion=current;labelMotion?.cancel();regionName.replaceChildren();const label=document.createElement('span');label.textContent=({city:'城內',river:'虹橋',outskirts:'郊野'})[current.id];caption.setAttribute('aria-label',current.label);regionName.append(label);
   if(previous&&!instant&&!reduced()){const old=document.createElement('span');old.textContent=({city:'城內',river:'虹橋',outskirts:'郊野'})[previous.id];old.setAttribute('aria-hidden','true');old.className='region-old';regionName.append(old);old.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-5px)'}],{duration:180,easing:'ease-out',fill:'forwards'}).onfinish=()=>old.remove();labelMotion=label.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'ease-out'});}
  }
  for(const b of regions.querySelectorAll('button'))b.setAttribute('aria-current',String(b.dataset.region===current.id));positionUnderline();
  range.setAttribute('aria-valuetext',current.title+'，画卷位置 '+Math.round(position*100)+'%');
  state.scrollCenter=center;state.region=current.id;
  clearTimeout(saveTimer);saveTimer=setTimeout(save,180);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(()=>update());}
 function seek(c){viewport.scrollLeft=Math.max(0,Math.min(limits(),c*world.scrollWidth-viewport.clientWidth/2));update();}
 for(const r of SCROLL_REGIONS){const b=btn(r.label,()=>seek(r.center));b.dataset.region=r.id;regions.append(b);}
 listen(viewport,'scroll',schedule,{passive:true});
 listen(root,'wheel',e=>{
  if(e.ctrlKey||e.metaKey||!limits())return;
  e.preventDefault();
  const unit=e.deltaMode===1?24:e.deltaMode===2?viewport.clientWidth:1;
  viewport.scrollLeft+=(Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY)*unit;
 },{passive:false});
 listen(viewport,'keydown',e=>{
  if(e.target!==viewport)return;
  const amount=viewport.clientWidth*.2;
  if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
   e.preventDefault();viewport.scrollLeft=e.key==='Home'?0:e.key==='End'?limits():viewport.scrollLeft+(e.key==='ArrowRight'?amount:-amount);
  }
 });
 listen(viewport,'pointerdown',e=>{
  if(e.pointerType==='touch'||e.target.closest('button')||![0,1].includes(e.button))return;
  e.preventDefault();drag={id:e.pointerId,x:e.clientX,left:viewport.scrollLeft};viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-dragging');
 });
 listen(viewport,'pointermove',e=>{if(drag&&e.pointerId===drag.id)viewport.scrollLeft=drag.left+drag.x-e.clientX;});
 function endDrag(){drag=null;viewport.classList.remove('is-dragging');}
 listen(viewport,'pointerup',endDrag);listen(viewport,'pointercancel',endDrag);listen(viewport,'lostpointercapture',endDrag);
 listen(viewport,'auxclick',e=>{if(e.button===1)e.preventDefault();});
 listen(range,'input',()=>{viewport.scrollLeft=limits()*Number(range.value)/1000;update();});
 function moveMini(e){
  const rect=overview.getBoundingClientRect();
  const next=(e.clientX-rect.left)/rect.width-(miniDrag?.offset||0);
  seek(Math.max(0,Math.min(1,next)));
 }
 listen(overview,'pointerdown',e=>{
  if(e.button!==0)return;e.preventDefault();
  const rect=overview.getBoundingClientRect(),fraction=(e.clientX-rect.left)/rect.width;
  const visible=viewport.clientWidth/world.scrollWidth;
  miniDrag={offset:Math.abs(fraction-center)<=visible/2?fraction-center:0};
  overview.setPointerCapture(e.pointerId);moveMini(e);
 });
 listen(overview,'pointermove',e=>{if(miniDrag)moveMini(e);});
 listen(overview,'pointerup',()=>{miniDrag=null;});listen(overview,'pointercancel',()=>{miniDrag=null;});
 let previousWidth=0,previousHeight=0;
 const observer=new ResizeObserver(()=>{
  if(viewport.clientWidth===previousWidth&&viewport.clientHeight===previousHeight)return;
  previousWidth=viewport.clientWidth;previousHeight=viewport.clientHeight;
  seek(center);update(true);
 });observer.observe(viewport);
 listen(painting,'load',()=>{loading.hidden=true;seek(center);
  if(window.playScrollEntrance){window.playScrollEntrance=false;
   const story=state.dayStory||{};
 const delivering=!story.ended&&(story.directions||story.credited?.length>=3);
 const target=SCROLL_NPCS.find(p=>p.id==='baker').x;
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){seek(target);return;}
   const start=performance.now(),from=1-viewport.clientWidth/world.scrollWidth/2;
   seek(from);
   const tick=now=>{const t=Math.min(1,(now-start)/11000),k=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;seek(from+(target-from)*k);if(t<1)entrance=requestAnimationFrame(tick);};
   entrance=requestAnimationFrame(tick);
  }
 });
 listen(painting,'error',()=>{loading.hidden=false;loading.textContent='画卷暂未载入，请重试';loading.append(btn('重新展卷',()=>{loading.textContent='正在展卷…';painting.src=SCROLL_ART.src+'?retry='+Date.now();}));});
 painting.src=SCROLL_ART.src;
 seek(center);update(true);

 const refractionCleanup=window.mountPaintingRefraction?.(root,viewport,painting)||(()=>{});
 window.scrollViewCleanup=()=>{refractionCleanup();stopEntrance();clearTimeout(saveTimer);cancelAnimationFrame(frame);observer.disconnect();labelMotion?.cancel();events.abort();save();window.scrollViewCleanup=null;};
}





