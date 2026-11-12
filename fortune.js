/* Six three-coin throws; original rules, endpoints and save schema retained. */
function mountFortune(root){
 root.classList.add('fortune-screen');root.querySelector('.topbar')?.remove();
 const events=new AbortController(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const on=(el,type,fn,opts={})=>el.addEventListener(type,fn,{...opts,signal:events.signal});
 let disposed=false,busy=false,transitioning=false,controller=null,timeout=null,coinStage=null,coinLoading=null;
 let session=state.fortuneSession||null;
 if(session&&(!Array.isArray(session.coins)||session.coins.length!==6||!session.coins.every(c=>Array.isArray(c)&&c.length===3&&c.every(v=>v===2||v===3))))session=null;
 if(session){session.revealed=Math.max(0,Math.min(6,Math.floor(Number(session.revealed)||0)));session.messages=Array.isArray(session.messages)?session.messages:[];}
 let castEntered=false,liveHex=null,castEpoch=0;
 let step=0,readingIndex=0,readyAt=performance.now()+(reduced?0:2100),wheelAmount=0,wheelAt=0;
 const timers=new Set();
 const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);if(!disposed)fn();},ms);timers.add(id);return id;};
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const shell=div('fortune-shell');shell.tabIndex=-1;
 // A subpixel ink-edge filter gives live Song text a restrained printed edge.
 const ns='http://www.w3.org/2000/svg',ink=document.createElementNS(ns,'svg');ink.setAttribute('width','0');ink.setAttribute('height','0');ink.setAttribute('aria-hidden','true');ink.style.position='absolute';
 const defs=document.createElementNS(ns,'defs'),filter=document.createElementNS(ns,'filter');filter.id='fortune-ink-edge';
 const noise=document.createElementNS(ns,'feTurbulence');noise.setAttribute('type','fractalNoise');noise.setAttribute('baseFrequency','.18');noise.setAttribute('numOctaves','2');noise.setAttribute('result','grain');
 const edge=document.createElementNS(ns,'feDisplacementMap');edge.setAttribute('in','SourceGraphic');edge.setAttribute('in2','grain');edge.setAttribute('scale','.65');edge.setAttribute('xChannelSelector','R');edge.setAttribute('yChannelSelector','G');filter.append(noise,edge);defs.append(filter);ink.append(defs);shell.append(ink);
 const back=btn('返回画卷',()=>go('scroll'),'fortune-back');
 const content=div('fortune-scene');content.tabIndex=-1;content.setAttribute('aria-label','卜卦叙事');
 const coinHost=div('fortune-model');coinHost.hidden=true;coinHost.setAttribute('role','img');coinHost.setAttribute('aria-label','三枚古铜钱');
 const footer=div('fortune-footer'),previous=btn('上一幕',()=>move(-1),'fortune-previous'),next=btn('向下滚动',()=>move(1),'fortune-next');
 const live=div('fortune-live');live.setAttribute('role','status');live.setAttribute('aria-live','polite');
 footer.append(previous,next);shell.append(back,content,coinHost,footer,live);root.append(shell);
 const checkpoint=()=>{state.fortuneSession=session;save();};
 const say=value=>{live.textContent=value;};
 const text=(tag,value,cls='')=>{const node=document.createElement(tag);node.className=cls;node.textContent=value;return node;};
 const heading=(value,cls='')=>{const h=text('h1','','fortune-heading '+cls);h.append(text('span',value,'fortune-print'));return h;};
 function segment(value){return (value.match(/[^。！？；]+[。！？；]?/g)||[value]).flatMap(s=>s.length>70?(s.match(/.{1,65}/g)||[]):[s]).filter(Boolean);}
 function readings(){return session?.messages.filter(m=>m.role==='assistant').flatMap(m=>segment(m.text))||[];}
 function result(){return BJFortune.cast(session.coins.map(c=>c.reduce((a,b)=>a+b,0)));}
 function updateFooter(){previous.hidden=step===0;next.hidden=step===2||(step===1&&!session);next.textContent=step===0?'向下滚动':step===1?(session?'继续':'写下所问'):step===2?(session?.revealed===6?'观卦':'继续'):step===3?'向下滚动':readingIndex<readings().length-1?'继续听':'返回画卷';}
 async function ensureCoins(){
  if(coinStage)return coinStage;
  if(!coinLoading)coinLoading=Promise.resolve().then(async()=>{try{return await window.FortuneAssets.createCoinStage(coinHost,{reduced});}catch(error){console.error('三维铜钱初始化失败',error);coinHost.replaceChildren();return window.FortuneAssets.createFallback(coinHost,{reduced});}}).then(stage=>{if(disposed){stage.dispose();return null;}coinStage=stage;return stage;}).catch(error=>{console.error('铜钱初始化失败',error);coinLoading=null;if(!disposed)say('铜钱未能载入，请重试。');return null;});
  return coinLoading;
 }
 function chart(h,moving=[]){
  const wrap=div('fortune-hex');wrap.setAttribute('role','img');wrap.setAttribute('aria-label',h.name+'卦，自下而上'+[...h.bits].map(v=>v==='1'?'阳':'阴').join('、'));
  for(let i=5;i>=0;i--){const row=div('fortune-line '+(h.bits[i]==='1'?'yang':'yin')+(moving.includes(i+1)?' moving':''));row.setAttribute('aria-hidden','true');row.append(div('fortune-stroke'),div('fortune-stroke'));wrap.append(row);}return wrap;
 }
 function draw(){
  shell.querySelectorAll('.is-centered').forEach(n=>n.remove());castEpoch++; if(step!==2){root.dataset.castPhase='';coinHost.style.opacity='';} if(step!==2&&step!==3){liveHex?.remove();liveHex=null;}
  content.replaceChildren();content.className='fortune-scene fortune-step-'+step;root.dataset.fortuneStep=String(step);
  coinHost.hidden=step!==2;coinHost.classList.remove('is-tossing');say('');
  if(step===0)content.append(heading('年轻人，此番前来所为何事？','fortune-greeting'));
  if(step===1)ask();if(step===2)casting();if(step===3)observation();if(step===4)reading();updateFooter();
 }
 async function change(to){
  if(disposed||transitioning||busy)return;transitioning=true;content.inert=true;previous.disabled=next.disabled=true;root.classList.add('fortune-leaving');
  await delay(reduced?0:380);if(disposed)return;
  step=to;draw();root.classList.remove('fortune-leaving');root.classList.add('fortune-entering');content.focus({preventScroll:true});
  readyAt=performance.now()+(reduced?120:1250);wheelAmount=0;
  later(()=>{root.classList.remove('fortune-entering');transitioning=false;content.inert=false;previous.disabled=next.disabled=false;content.focus({preventScroll:true});},reduced?0:750);
 }
 function move(direction){
  if(busy||transitioning)return;
  if(direction<0){if(step===4&&readingIndex>0){readingIndex--;change(4);}else if(step>0)change(step-1);return;}
  if(step===0){change(1);return;}
  if(step===1){if(session){change(session.revealed===6?3:2);return;}content.querySelector('#fortune-question')?.focus();say('先写下一件挂心的事。');return;}
  if(step===2){if(session.revealed===6)change(3);else{content.querySelector('.fortune-toss')?.focus();say('轻点“掷三钱”，落定这一爻。');}return;}
  if(step===3){if(readings().length){readingIndex=0;change(4);}else answer('');return;}
  if(step===4){if(readingIndex<readings().length-1){readingIndex++;change(4);}else go('scroll');}
 }
 function bit(){const v=new Uint32Array(1);crypto.getRandomValues(v);return v[0]&1;}
 function ask(){
  content.append(heading('心中所问，是何事？'));
  if(session){content.append(text('p',session.question,'fortune-question-echo'),btn(session.revealed===6?'再观此卦':'继续起卦',()=>change(session.revealed===6?3:2),'fortune-primary'),btn('另问一事',reset,'fortune-secondary'));return;}
  const form=document.createElement('form');form.className='fortune-question-form';
  const label=text('label','所问之事','fortune-sr-only');label.htmlFor='fortune-question';
  const input=document.createElement('input');input.type='text';input.autocomplete='off';input.id='fortune-question';input.maxLength=200;input.required=true;input.placeholder='写下一件挂心的事';input.value=state.fortuneQuestionDraft||'';
  on(input,'input',()=>{state.fortuneQuestionDraft=input.value;save();});
  const submit=btn('落定此问',()=>{},'fortune-primary');submit.type='submit';form.append(label,input,submit);
  form.onsubmit=e=>{e.preventDefault();const q=input.value.trim();if(q)begin(q);else input.focus();};content.append(form);
 }
 async function begin(question){
  if(busy||transitioning)return;busy=true;content.querySelectorAll('button,input').forEach(n=>n.disabled=true);next.disabled=true;say('请稍候。');
  let plan;controller=new AbortController();timeout=setTimeout(()=>controller.abort(),6000);
  if(location.protocol!=='file:')try{const r=await fetch('/api/cast',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question}),signal:controller.signal});if(r.ok){const v=await r.json();if(Array.isArray(v.coins)&&v.coins.length===6&&v.coins.every(c=>Array.isArray(c)&&c.length===3&&c.every(n=>n===2||n===3)))plan=v;}}catch(_){}finally{clearTimeout(timeout);}
  else clearTimeout(timeout);
  if(disposed)return;
  session={question,coins:plan?.coins||Array.from({length:6},()=>BJFortune.coin(bit)),castId:plan?.id||null,revealed:0,messages:[]};
  delete state.fortuneQuestionDraft;checkpoint();busy=false;next.disabled=false;change(2);
 }
 function casting(){
  const epoch=castEpoch;
  content.append(heading('静心，掷钱。','fortune-cast-heading'));
  const progress=div('fortune-progress');progress.setAttribute('role','img');
  for(let i=0;i<6;i++){const mark=text('span',String(i+1));mark.dataset.index=String(i);progress.append(mark);}
  const guide=text('p','','fortune-cast-guide'),status=text('p','','fortune-cast-status');
  const action=btn('点击投掷',toss,'fortune-primary fortune-toss');
  const controls=div('fortune-cast-controls');controls.append(action,guide,status,progress);content.append(controls);
  liveHex?.remove();liveHex=div('fortune-cast-hex');liveHex.setAttribute('role','img');liveHex.setAttribute('aria-label','六爻逐次成卦');
  for(let i=5;i>=0;i--){const row=div('fortune-line');row.dataset.line=String(i);row.style.opacity='0';row.append(div('fortune-stroke'),div('fortune-stroke'));liveHex.append(row);}
  shell.append(liveHex);updateCast();
  if(castEntered||session.revealed){root.dataset.castPhase='ready';ensureCoins().then(stage=>{if(stage&&!disposed&&epoch===castEpoch){const v=session.revealed?session.coins[session.revealed-1]:[3,2,3];stage.settle(v);describeCoins(v);}});return;}
  root.dataset.castPhase='invocation';busy=true;previous.disabled=true;
  const preparedStage=ensureCoins();
  (async()=>{await delay(reduced?0:750);if(disposed||epoch!==castEpoch)return;
   await delay(reduced?80:1150);if(disposed||epoch!==castEpoch)return;
   const fx=window.FortuneAssets;await fx.dissolveText(content.querySelector('h1'),shell,reduced);if(disposed||epoch!==castEpoch)return;
   root.dataset.castPhase='arrival';const stage=await preparedStage;if(disposed||epoch!==castEpoch)return;
   if(stage)await stage.arrive();if(disposed||epoch!==castEpoch)return;castEntered=true;busy=false;previous.disabled=false;root.dataset.castPhase='ready';updateCast();
  })();
 }
 function updateCast(active=false){
  const n=session.revealed;content.querySelector('.fortune-toss').textContent=n===6&&!busy?'观卦':'点击投掷';const guide=content.querySelector('.fortune-cast-guide'),status=content.querySelector('.fortune-cast-status');
  if(!guide)return;guide.textContent='';guide.hidden=true;
  status.textContent=active?'第'+(n+1)+'次投掷中':'已成'+n+'爻 · 共6爻';
  content.querySelectorAll('.fortune-progress span').forEach((m,i)=>{m.className=i<n?'is-complete':i===n?'is-current':'';m.setAttribute('aria-label',i<n?'第'+(i+1)+'次已完成':i===n?'当前第'+(i+1)+'次':'第'+(i+1)+'次未完成');});
  for(let i=0;i<n;i++){const row=liveHex.querySelector('[data-line="'+i+'"]'),sum=session.coins[i].reduce((a,b)=>a+b,0);row.classList.add(sum%2?'yang':'yin');row.classList.toggle('moving',sum===6||sum===9);row.style.opacity='1';}
  progressLabel();
 }
 function progressLabel(){content.querySelector('.fortune-progress')?.setAttribute('aria-label','已成 '+session.revealed+' 爻，共六爻');}
 function describeCoins(values){coinHost.setAttribute('aria-label','三枚铜钱：'+values.map(v=>v===3?'正面，记三':'背面，记二').join('；'));coinHost.dataset.faces=values.join(',');}
 async function toss(){
  if(busy||transitioning)return;if(session.revealed>=6){change(3);return;}busy=true;const epoch=castEpoch,button=content.querySelector('.fortune-toss');button.disabled=true;previous.disabled=true;button.classList.remove('is-clicked');void button.offsetWidth;button.classList.add('is-clicked');updateCast(true);window.SFX?.play('coin-rattle',{volume:.75});
  const stage=await ensureCoins();if(disposed||epoch!==castEpoch)return;if(!stage){busy=false;button.disabled=false;previous.disabled=false;return;}
  const values=session.coins[session.revealed];await stage.toss(values);if(disposed||epoch!==castEpoch)return;describeCoins(values);window.SFX?.play('coin-drop',{volume:.8});
  session.revealed++;checkpoint();updateCast();const row=liveHex.querySelector('[data-line="'+(session.revealed-1)+'"]');row.classList.add('is-drawing');await delay(reduced?60:950);if(disposed||epoch!==castEpoch)return;row.classList.remove('is-drawing');
  if(session.revealed===6){root.dataset.castPhase='complete';liveHex.classList.add('is-complete');window.SFX?.play('gong-soft',{volume:.85});await delay(reduced?100:600);if(disposed||epoch!==castEpoch)return;liveHex.classList.add('is-centering');root.dataset.castPhase='centering';await delay(reduced?150:1500);if(disposed||epoch!==castEpoch)return;busy=false;previous.disabled=false;change(3);}
  else{busy=false;button.disabled=false;previous.disabled=false;}
 }
  function observation(){
  const r=result();let finished=liveHex;if(finished){finished.className='fortune-cast-hex is-centered';liveHex=null;shell.append(finished);}if(!finished){finished=chart(r.base,r.moving);finished.className='fortune-cast-hex is-centered';shell.append(finished);}content.append(heading(r.base.name,'fortune-result-name'),text('p','上'+r.base.upper+' · 下'+r.base.lower,'fortune-trigrams'));window.SFX?.play('chime-gentle',{volume:.6});
  content.append(btn(readings().length?'听先生解卦':'请先生解卦',()=>move(1),'fortune-primary'));
  const tools=div('fortune-result-tools');tools.append(btn('细看此卦',openDetails,'fortune-secondary'),btn('另问一事',reset,'fortune-secondary'));content.append(tools);
 }
 function reading(){
  const chunks=readings();content.append(text('p',chunks[readingIndex]||'卦已成。','fortune-reading'),text('span',(readingIndex+1)+' / '+chunks.length,'fortune-reading-count'));
  const tools=div('fortune-result-tools');tools.append(btn('细看问答',openDetails,'fortune-secondary'));if(readingIndex===chunks.length-1)tools.append(btn('记下此问',remember,'fortune-primary'));content.append(tools);
 }
 function remember(){state.played.fortune=true;state.clues.fortuneVisit=true;save();window.SFX?.play('seal-stamp',{volume:.8});say('此番问答已记下。');}
 function reset(){if(busy||transitioning)return;castEntered=false;session=null;checkpoint();readingIndex=0;change(1);}
 function openDetails(){
  const r=result(),dialog=document.createElement('dialog');dialog.className='fortune-details';dialog.setAttribute('aria-label','卦象与问答');
  const close=btn('收起',()=>dialog.close(),'fortune-details-close'),body=div('fortune-details-body');
  body.append(text('h2',r.base.name),text('p','所问：'+session.question),text('p',BJFortune.describe(r)));
  const charts=div('fortune-detail-charts');
  const same=r.base.id===r.changed.id;charts.classList.toggle('is-single',same);for(const [label,h]of (same?[['本卦',r.base]]:[['本卦',r.base],['之卦',r.changed]])){const item=div('');item.append(text('h3',label+' · '+h.name),chart(h),text('p',h.judgement));charts.append(item);}body.append(charts);
  for(const i of r.moving)body.append(text('p',r.base.lines[i-1]));
  if([1,2].includes(r.base.id)&&r.moving.length===6)body.append(text('p',r.base.extra.join(' ')));
  const source=text('a','所据《周易》经文 ↗');source.href=r.base.source;source.target='_blank';source.rel='noopener noreferrer';body.append(source);
  for(const m of session.messages){const block=div('fortune-message');block.append(text('h3',m.role==='user'?'客官':m.mode==='ai'?'先生 · AI解读':'先生 · 离线解读'),text('p',m.text));body.append(block);}
  if(session.messages.length&&session.messages.length<8){
   const form=document.createElement('form');form.className='fortune-followup';const label=text('label','再问先生一句');label.htmlFor='fortune-followup';const input=document.createElement('input');input.id='fortune-followup';input.required=true;input.maxLength=200;input.placeholder='就此事，再问一句';const submit=btn('追问',()=>{},'fortune-primary');submit.type='submit';form.append(label,input,submit);form.onsubmit=e=>{e.preventDefault();if(input.value.trim()){const q=input.value.trim();dialog.close();answer(q);}};body.append(form);
  }
  body.append(text('p','三钱法为游戏简化；人物对话与解读为创作，供文化体验与自我思考。','fortune-source-note'));
  dialog.append(close,body);shell.append(dialog);dialog.addEventListener('close',()=>{dialog.remove();content.querySelector('button')?.focus();},{once:true});on(dialog,'cancel',e=>{e.preventDefault();dialog.close();});dialog.showModal();
 }
 async function answer(followup){
  if(busy||transitioning)return;busy=true;next.disabled=previous.disabled=true;content.querySelectorAll('button').forEach(n=>n.disabled=true);say('先生正在思量…');
  const user={role:'user',text:followup||session.question},draft={role:'assistant',mode:'offline',text:''},oldCount=readings().length;let complete=false;controller=new AbortController();timeout=setTimeout(()=>controller.abort(),50000);
  try{
   if(!session.castId)throw new Error('offline');
   const response=await fetch('/api/divination',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({castId:session.castId,...(followup?{followup}:{})}),signal:controller.signal});if(!response.ok)throw new Error('unavailable');
   const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
   while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true}).replace(/\r/g,'');let end;
    while((end=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,end);buffer=buffer.slice(end+2);const line=block.split('\n').find(l=>l.startsWith('data: '));if(!line)continue;const v=JSON.parse(line.slice(6));if(v.type==='mode')draft.mode=v.mode;if(v.type==='delta')draft.text+=v.text;if(v.type==='replace')draft.text=v.text;if(v.type==='done')complete=true;}
   }
   if(!complete||!draft.text)throw new Error('incomplete');
  }catch(_){if(disposed)return;draft.mode='offline';draft.text=BJFortune.offline(result(),user.text,!!followup);}finally{clearTimeout(timeout);}
  if(disposed)return;session.messages.push(user,draft);markNpcTalked('fortune');checkpoint();busy=false;next.disabled=previous.disabled=false;readingIndex=oldCount;change(4);
 }
 // One gesture advances one scene. Scrolling never draws randomness or skips a throw.
 on(root,'wheel',e=>{
  if(e.ctrlKey||e.metaKey||e.target.closest('textarea,input,dialog'))return;e.preventDefault();if(busy||transitioning||performance.now()<readyAt)return;
  const now=performance.now();if(now-wheelAt>180)wheelAmount=0;wheelAt=now;wheelAmount+=e.deltaY*(e.deltaMode===1?20:e.deltaMode===2?innerHeight:1);
  if(Math.abs(wheelAmount)>65){const d=Math.sign(wheelAmount);wheelAmount=0;readyAt=now+900;move(d);}
 },{passive:false});
 let touchY=null;
 on(root,'touchstart',e=>{touchY=e.target.closest('input,textarea,dialog')?null:e.touches[0].clientY;},{passive:true});
 on(root,'touchend',e=>{if(touchY===null)return;const delta=touchY-e.changedTouches[0].clientY;touchY=null;if(Math.abs(delta)>45&&performance.now()>=readyAt)move(Math.sign(delta));},{passive:true});
 on(document,'keydown',e=>{if(e.target.closest('input,textarea,dialog')||shell.querySelector('dialog[open]'))return;if(['ArrowDown','PageDown','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();if(performance.now()>=readyAt)move(['ArrowDown','PageDown'].includes(e.key)?1:-1);}},{capture:true});
 on(document,'keydown',e=>{const d=shell.querySelector('dialog[open]');if(e.key==='Escape'&&d){e.preventDefault();e.stopImmediatePropagation();d.close();}},{capture:true});
 window.fortuneCleanup=()=>{disposed=true;events.abort();controller?.abort();clearTimeout(timeout);timers.forEach(clearTimeout);coinStage?.dispose();shell.querySelectorAll('dialog').forEach(d=>d.close());window.fortuneCleanup=null;};
 draw();shell.focus({preventScroll:true});
}
