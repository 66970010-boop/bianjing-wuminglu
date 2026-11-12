/* Main-story adapter. Gameplay modules retain their existing mechanics. */
const dayPeriods=['晨光 · 各为生计','街市 · 人间相逢','虹桥 · 一念之间','暮色 · 万家灯火'];
function dayStory(){return state.dayStory||(state.dayStory={started:false,frame:0,deliveryFrame:0,ended:false,credited:[]})}
function dayPeriod(){return dayPeriods[Math.min(3,dayStory().credited.length)]}
const originalSave=save;
save=function(){const d=dayStory();for(const id of ['baker','boat','fortune','barber','drinks','merchant','monk'])if(state.played[id]&&!d.credited.includes(id))d.credited.push(id);d.heard=d.heard||{};for(const id of d.credited)d.heard[id]=true;originalSave()};
personSpeech.fortune='“先见到人，再想说什么也不迟。”';
// Conversation progress is separate from meeting a person or finishing a mini-game.
function markNpcTalked(id){state.talked=state.talked||{};state.talked[id]=true;save();}
const conversationGo=go;
go=function(page){
 if(state.page==='dialogue'&&['baker','boat','merchant','barber'].includes(state.npc)&&page!==state.page)markNpcTalked(state.npc);
 conversationGo(page);
};
const originalRender=render;
SCROLL_NPCS.find(n=>n.id==='baker').label='卖饼青年';
function cleanupDay(){for(const key of ['fortuneCleanup','drinkCleanup','barberCleanup','scrollViewCleanup'])window[key]?.()}
function dayRoot(cls){cleanupDay();app.innerHTML='';const root=div('screen '+cls);app.append(root);return root}
function dayCard(root,kicker,title,body){const c=div('story-card');c.append(div('eyebrow',kicker));const h=document.createElement('h1');h.textContent=title;c.append(h);for(const line of body){const p=document.createElement('p');p.textContent=line;c.append(p)}root.append(c);return c}
function dayStart(){const d=dayStory();if(!d.started){d.started=true;d.frame=0;go('opening')}else go('opening-film')}
function findBaker(){const npc=SCROLL_NPCS.find(n=>n.id==='baker');state.scrollCenter=npc.x;state.region='city';save();go('scroll')}
render=function(){
 if(['collection','letter'].includes(state.page)){state.page='scroll';save()}
 const p=state.page,d=dayStory();
 if(p==='home'){
  const root=dayRoot('home hero texture');root.append(img('boatman-layer','hero-people'));const c=div('hero-content','<div class="eyebrow">ONE DAY IN BIANJING</div><h1>汴京一日</h1><p>人间一日，亦是千秋。</p>');c.append(btn(d.ended?'家书已至 · 继续游卷':d.started?'继续送信之旅':'入画',dayStart,'seal'),btn('直接游玩',()=>{d.started=true;delete d.returnAfterOpening;go('opening-film')},'home-direct'));if(d.started)root.append(btn('重看序章',()=>{d.frame=0;delete d.returnAfterOpening;go('opening')},'home-replay'));root.append(c);root.append(btn('重看入门引导',replayIntroGuide,'home-guide-replay'));return;
 }
 if(p==='opening'){
  const root=dayRoot('opening texture');const art=scene('river-layer');art.classList.add('opening-original');art.style.backgroundImage='url(assets/qingming-scroll.webp)';root.append(header(),art);const frames=[['清晨 · 城外','老妇人抚平信封，重新压紧封口，才将信递来。','“劳烦，将这封信送给城东卖烧饼的年轻人。”'],['一封无名的家书','“他叫什么？”','“你只问，他可还记得城外那棵老槐树。”'],['船已远去','你收好家书，走向城中。','沿城东寻去。沿途有人忙碌，有人停留，你也可以选择自己的路。']];const f=frames[d.frame]||frames[0],c=div('opening-card',`<div class="eyebrow">${f[0]}</div><h2>${f[1]}</h2><p>${f[2]}</p>`);const finish=()=>{d.started=true;const next='opening-film';delete d.returnAfterOpening;go(next)};c.append(btn(d.frame===2?'收好家书，入城 →':'继续 →',()=>{if(d.frame<2){d.frame++;save();render()}else finish()},'link'));root.append(c,btn('收好家书，跳过序章',finish,'skip'),div('frame-counter',`0${d.frame+1} / 03`));return;
 }
 if(p==='opening-film'){
 const root=dayRoot('opening-film');const video=document.createElement('video');video.src='assets/opening-animation.mp4';video.controls=false;video.disablePictureInPicture=true;video.playsInline=true;video.preload='auto';video.setAttribute('aria-label','入城动画');
 let leaving=false;const next=()=>{if(leaving)return;leaving=true;video.pause();const still=root.cloneNode(true);still.querySelectorAll('button,input').forEach(n=>n.remove());const frame=still.querySelector('video');const canvas=document.createElement('canvas');canvas.width=video.videoWidth||1920;canvas.height=video.videoHeight||1080;try{canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height)}catch(e){}canvas.className='film-last-frame';frame.replaceWith(canvas);still.classList.add('film-transition');document.body.append(still);go('scroll');requestAnimationFrame(()=>requestAnimationFrame(()=>still.classList.add('film-fade-out')));setTimeout(()=>still.remove(),1400)};video.onended=next;
 const play=btn('播放动画',()=>{video.play().then(()=>play.hidden=true).catch(()=>play.hidden=false)},'film-play');
 video.onplay=()=>play.hidden=true;video.onerror=()=>{play.textContent='动画暂未能播放，请继续入画';play.onclick=next;play.hidden=false;};
 root.append(video,play,btn('跳过动画 →',next,'film-skip'));
 video.play().catch(()=>{play.hidden=false});return;
 }
 if(p==='delivery'){

  const root=dayRoot('delivery');root.append(header());const frames=[['老槐树',['青年听见这三个字，停下手中的活。','“是我娘托你来的？”']],['纸上无字',['他拆开信封。里面，只有一张空白的纸。']],['“我娘不识字。”',['“从前她总说，等我来了汴京，她就学写字，好给我寄信。”']],['“可我知道，她想我了。”',['他把纸轻轻折好，收进怀中。']]];const f=frames[d.deliveryFrame]||frames[0],c=dayCard(root,(d.deliveryPeriod||dayPeriod())+' · 家书已至',f[0],f[1]);if(d.deliveryFrame===1){const paper=div('blank-letter');paper.setAttribute('aria-label','一张空白的信纸');c.append(paper)}if(d.deliveryFrame<3)c.append(btn('继续 →',()=>{d.deliveryFrame++;go('delivery')},'choice'));else ['告诉他：今日在城外见过她','静静听他说完'].forEach((label,i)=>c.append(btn(label,()=>{d.toldMother=i===0;d.ended=true;d.endingLines=endingMoments();go('ending')},'choice')));return;
 }
 if(p==='ending'){
  const root=dayRoot('ending end');root.append(header(),div('sun'),div('city'));const lines=[];if(d.toldMother)lines.push('“她刚乘船离去，还一直望着城里。”青年听着，点了点头。');lines.push('“明日歇一天。我回家看看。”',...(d.endingLines||[]));const c=dayCard(root,'这一日，汴京无大事','人间一日，亦是千秋。',lines);const note=document.createElement('small');note.textContent=`今日你与 ${Object.keys(state.met).length} 人相逢，在 ${d.credited.length} 处停留。没有好坏之分，这只是你走过的一日。`;c.append(note,btn('回到画卷 →',()=>go('scroll'),'choice'),btn('翻看这一日 →',()=>go('book'),'choice'));return;
 }
 state.guideDismissed=true;originalRender();
 const root=app.firstElementChild;
 if(p==='dialogue'&&['boat','merchant','barber'].includes(state.npc)){const panel=root.querySelector('.right')||root;panel.append(btn('打听城东的饼摊',()=>{d.directions=true;d.inquiries=d.inquiries||{};d.inquiries[state.npc]=true;save();toast({boat:'“城东临河，青布围裙的小伙子。他替我留着饭呢。”',merchant:'“沿河向东，挂蓝布的饼摊就在路旁。”',barber:'“那青年提过城外老槐树。你到城东问问。”'}[state.npc]);},'choice'));}
 if(p==='dialogue'&&state.npc==='baker'&&d.inquiries?.boat){d.breadSeen=true;save();root.querySelector('.right').append(div('history-note','案角包着一张饼。“船家还没吃饭，这张不卖。”'));}

 if(p==='scroll'){
 queueMicrotask(()=>{if(state.page==='scroll')mountIntroGuide(root)});

 }
 if(p==='dialogue'&&state.npc==='baker'){
  const right=root.querySelector('.right');right.querySelector('h1').textContent='卖饼青年';const send=btn(d.ended?'回想这封家书 →':'问起老槐树，递上家书 →',()=>{if(d.ended){go('ending');return}d.deliveryPeriod=dayPeriod();d.started=true;d.deliveryFrame=0;go('delivery')},'choice');right.insertBefore(send,right.querySelector('.choice'));
 }

};
function endingMoments(){const d=dayStory(),a=[];if(d.breadSeen)a.push('青年重新包好留给船夫的饼，放在炉边。');if(state.played.barber)a.push('理好须发的客人整了整衣领，重新上路。');if(state.played.boat)a.push('船身穿过桥影，岸上的人松开纤绳。');if(state.played.drinks)a.push('摊主将陶罐收好，木案留出一盏饮子的位置。');if(state.played.monk)a.push('行脚僧收起草图，向刚辨过的街巷走去。');return a.slice(0,3)}
render();

