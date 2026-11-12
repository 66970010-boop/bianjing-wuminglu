/* Handcrafted gestures and paint overlays; dialogue is original fiction. */
function renderBarberDialogue(root){
 root.classList.add('barber-dialogue');root.append(img('barber-layer','baker'));
 const finished=!!state.played.barber;
 const r=div('right',`<div class="eyebrow">城门下 · 刀镊铺</div><h1>刀镊匠</h1><h2>毫末之间</h2><p>${finished?'“城东卖饼的青年，我记得。他替船夫送过一块布巾，说是怕河上那人受了凉。你带了家书，便早些去找他吧。”':'“坐吧，莫急。头发要慢慢梳，旧事也得慢慢想。你若肯搭把手，我便同你说说这街上的熟人。”'}</p>`);
 r.append(btn(finished?'再理一回须发 →':'替他搭把手 →',()=>go('barber'),'choice'),btn('翻看无名录 →',()=>{bookSelection='barber';bookTab='people';go('book')},'choice'),div('history-note','画中人物修复补绘 · 对话为游戏原创'));
 root.append(r,btn('← 返回画卷',()=>go('scroll'),'return'));
}

function mountBarber(root){
 const steps=[
 ['净发','ladle','按住木勺浇过长发，或在发块上稍作停留。水到之处，蓬松的发块立即收拢下垂。','客人：“河上风大，忙了一早，才得这片刻清闲。”'],
 ['梳发','comb','按住木梳沿长发向下梳。可以从发块中段接着梳，梳过之处会收窄、拉直。','刀镊匠：“河上来的人我认得。饼铺留饼，我这里留一张凳子。”'],
 ['镊发','tweezers','按住浅色白发即可夹住，再向外拖一小段拔出。发根和中段都可以夹；黑发不必拔。','客人：“城东卖饼的青年也常来么？”　刀镊匠：“来过，替人送东西。”'],
 ['修须','scissors','将剪刀移到参差的须尾，按下剪切。每束修两次，保留中间长、两侧短的须形。','刀镊匠：“有一回，他抱着块干净布巾，在棚下等那船家。”'],
 ['修面','razor','按住刀刃，轻轻划过下颌旁的小杂毛。先整理一侧，再整理另一侧。','刀镊匠：“问他是谁？我只知船家见了他，笑着接过布巾。”']];
 const old=[4,5].includes(state.barberSession?.version)?state.barberSession:null;
 let step=old?.step||0,wet=old?.wet||Array(6).fill(0),smooth=old?.smooth||Array(6).fill(0),white=old?.white||Array(4).fill(0),beard=old?.beard||Array(3).fill(0),clean=old?.clean||Array(16).fill(0);
 let loaded=false,disposed=false,resetting=false,done=false,pointer=null,cursor=null,muted=true,audio,lastSound=0,raf,finishedAt=0,last=performance.now(),clock=0,blink=0,nextBlink=2.5,gaze=0,nextGaze=1.8,eyeX=0,particles=[],feedback='',feedbackUntil=0;
 let faceSide=0,dirty=false,saveAfter=0;
 const shownWet=wet.slice(),shownSmooth=smooth.slice();
 const shell=div('barber-shell','<div class="barber-title"><h1>毫末之间</h1><p>一梳一镊，片刻闲谈</p></div>'),layout=div('barber-layout'),stage=div('barber-stage'),canvas=document.createElement('canvas');
 canvas.width=1200;canvas.height=840;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','按住并拖动工具整理须发；修须时点击须尾剪切');stage.append(canvas);const loading=div('barber-loading','正在备好刀镊…');stage.append(loading);const aside=div('barber-aside');layout.append(stage,aside);shell.append(layout);root.append(shell);
 const actions=div('barber-actions');actions.append(btn('← 返回刀镊铺',()=>{state.npc='barber';go('dialogue')}),btn('重新整理',()=>{resetting=true;delete state.barberSession;save();go('barber')}),btn('音效：关',()=>{}));const sound=actions.lastChild;sound.onclick=()=>{muted=!muted;sound.textContent='音效：'+(muted?'关':'开');ping()};shell.append(actions,div('barber-footnote','按实际接触位置整理 · 进度自动保存 · 无倒计时。人物为古画风格补绘，流程为游戏设计。'));
 const ctx=canvas.getContext('2d'),customer=new Image(),closedEyes=new Image(),happyCustomer=new Image(),tools={};
 const images=[new Promise((resolve,reject)=>{customer.onload=resolve;customer.onerror=reject;customer.src='assets/barber-customer-base.png'})];
 images.push(new Promise((resolve,reject)=>{closedEyes.onload=resolve;closedEyes.onerror=reject;closedEyes.src='assets/barber-customer-closed.png'}));
 images.push(new Promise((resolve,reject)=>{happyCustomer.onload=resolve;happyCustomer.onerror=reject;happyCustomer.src='assets/barber-customer-happy.png'}));
 for(const key of ['ladle','ladle-pour','comb','tweezers','tweezers-closed','scissors','scissors-closed','razor','mirror']){const im=tools[key]=new Image();images.push(new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src='assets/barber-'+key+(['ladle','comb','tweezers','scissors'].includes(key)?'-idle':'')+'.png'}))}
 // All geometry uses the same 900 x 630 portrait coordinates, then camera transforms everything together.
 const locks=Array.from({length:6},(_,i)=>({x: i<3?345-i*20:555+(i-3)*20,y:115+(i%3)*27,side:i<3?-1:1,len:330-(i%3)*22,w:38}));
 const beardX=[426,450,474],beardLength=[68,125,68];
 const whiteIds=[2,6,9,13];
 const roots=Array.from({length:15},(_,i)=>({x:285+i*24,y:75+(i%3)*24,white:whiteIds.includes(i)}));
 const whiskers=Array.from({length:16},(_,i)=>({x:i<8?390+Math.floor((i%8)/3)*6+(i%3)*5:510-Math.floor((i%8)/3)*6-(i%3)*5,y:288+Math.floor((i%8)/3)*12}));
 let next,progress,status,assistButtons=[],assistOpen=false;
 function values(){return [wet,smooth,white,beard,clean][step]}
 function ratio(){return values().reduce((a,b)=>a+b,0)/values().length}
 function checkpoint(){if(done||resetting)return;state.barberSession={version:5,step,wet:wet.slice(),smooth:smooth.slice(),white:white.slice(),beard:beard.slice(),clean:clean.slice()};save();dirty=false}
 function message(text){feedback=text;feedbackUntil=clock+1.4}
 function panel(){aside.innerHTML='';const list=document.createElement('ol');list.className='barber-steps';steps.forEach((s,i)=>{const li=document.createElement('li');li.textContent=s[0];li.className=i===step?'current':i<step?'done':'';list.append(li)});const title=div('',`<div class="eyebrow">第 ${step+1} 道 · 共五道</div><h2>${steps[step][0]}</h2>`),tool=document.createElement('img');tool.src='assets/barber-'+steps[step][1]+(step<4?'-idle':'')+'.png';tool.className='barber-tool';tool.alt=steps[step][0]+'工具';progress=document.createElement('progress');progress.max=1;progress.className='barber-progress';status=div('barber-status');status.setAttribute('aria-live','polite');next=btn(step===4?'奉镜 · 听他说完 →':'下一道 · '+steps[step+1]?.[0]+' →',advance,'barber-next');aside.append(list,title,tool,div('',`<p>${steps[step][2]}</p>`),progress,status,next,div('barber-talk',steps[step][3]));mountAssist();update()}

 function mountAssist(){
  assistButtons=[];const details=document.createElement('details');details.className='barber-assist';details.open=assistOpen;details.addEventListener('toggle',()=>{assistOpen=details.open});
  const summary=document.createElement('summary');summary.textContent='键盘 / 点按辅助操作';const hint=document.createElement('p');hint.textContent='与画面上的工序相同：按 Tab 选择部位，按 Enter 或空格操作；也可直接点按。';
  const controls=div('barber-assist-controls');
  values().forEach((_,i)=>{const b=btn('',()=>{
   if(!loaded||done||values()[i]>=1)return;
   const amounts=[.25,.25,1,.5,1];values()[i]=Math.min(1,values()[i]+amounts[step]);
   changed(['长发已浇湿一些。','这束长发更顺了。','白发已拔出。','须尾已剪短。','小杂毛已整理。'][step]);checkpoint();
   if(ratio()>=.999)next.focus({preventScroll:true});
  });assistButtons.push(b);controls.append(b)});
  details.append(summary,hint,controls);aside.append(details);
 }
 function updateAssist(){assistButtons.forEach((b,i)=>{const name=step===0?'浇湿第'+(i+1)+'束长发':step===1?'梳顺第'+(i+1)+'束长发':step===2?'拔出第'+(i+1)+'根白发':step===3?'修剪第'+(i+1)+'束须尾':'整理'+(i<8?'左':'右')+'侧第'+(i%8+1)+'处杂毛';const v=values()[i];b.textContent=name+' · '+Math.round(v*100)+'%';b.disabled=!loaded||done||v>=1;})}
  function update(){updateAssist();const r=ratio();progress.value=r;next.disabled=r<.999;status.textContent=r>=.999?'已整理妥当，可以继续。':step===2?'已拔出 '+white.filter(v=>v===1).length+' / 4 根白发':'已整理 '+Math.round(r*100)+'%';}
 function advance(){if(ratio()<.999)return;if(step<4){step++;cursor=null;pointer=null;feedback='';faceSide=0;checkpoint();panel()}else finish()}
 function finish(){done=true;finishedAt=clock;pointer=null;cursor=null;state.played.barber=true;state.clues.barberMemory=true;delete state.barberSession;save();aside.innerHTML='<div class="eyebrow">奉镜 · 收工</div><h2>面目如故</h2><p>须发整齐了。铜镜里，仍是那个奔忙的人。</p><div class="barber-talk">刀镊匠：“人是记得的。城东卖饼那位，总念着家门前的老槐树。”</div><div class="barber-result">拾得一段旧事<br>卖饼青年曾为船夫送来布巾。沿城东去，问起老槐树，他便知道你的来意。</div>';aside.append(btn('记入无名录 →',()=>{bookSelection='barber';bookTab='people';go('book')},'barber-next'),btn('返回画卷',()=>go('scroll'),'person-back'))}
 function ping(){if(muted||performance.now()-lastSound<100)return;lastSound=performance.now();try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='triangle';o.frequency.value=step===2?500:step===3?220:150;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.08);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.09)}catch{}}
 function camera(){if(done||step<2)return {s:1,x:0,y:0};if(step===2)return{s:2.35,x:-610,y:40};if(step===3)return{s:2.15,x:-520,y:-460};const left=clean.slice(0,8).every(v=>v===1);if(!pointer)faceSide=left?1:0;return{s:3.3,x:faceSide?-1180:-950,y:-650}}
 function shape(points,fill){ctx.fillStyle=fill;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill()}
 function lockGeometry(i){const n=locks[i],wetness=shownWet[i],combed=shownSmooth[i],bend=[-61,-46,-53,56,42,68][i];
  const fractions=[0,.22,.48,.73,1],offsets=[0,1,.15,1.28,.45];
  const c=fractions.map((t,j)=>{const loose=n.side*8*t+offsets[j]*bend;
   const damp=n.side*44*t+Math.sin(t*Math.PI*2.2+i*.18)*12;
   const straight=n.side*(12+6*t)*t;
   return {x:n.x+((loose*(1-wetness)+damp*wetness)*(1-combed)+straight*combed),y:n.y+t*(n.len+wetness*30+combed*32)+(i>=3?(i===3?-12:8)*Math.sin(t*Math.PI):0)};});
  for(let j=1;j<c.length;j++)c[j].x=i<3?Math.min(332-(i%3)*6,c[j].x):Math.max(568+(i%3)*6,c[j].x);
  const widths=[24,29,27,24,4].map(w=>w*(1-.12*wetness)*(1-.3*combed));
  const poly=c.map((p,j)=>[p.x-widths[j],p.y]);for(let j=c.length-1;j>=0;j--)poly.push([c[j].x+widths[j],c[j].y-(j===4?8:0)]);return {c,poly};}
 function lockDistance(i,p){const c=lockGeometry(i).c;return Math.min(...c.slice(1).map((v,j)=>distance(p,c[j],v)))}
 function smoothOutline(poly){ctx.beginPath();const n=poly.length;ctx.moveTo((poly[n-1][0]+poly[0][0])/2,(poly[n-1][1]+poly[0][1])/2);for(let j=0;j<n;j++){const p=poly[j],q=poly[(j+1)%n];ctx.quadraticCurveTo(p[0],p[1],(p[0]+q[0])/2,(p[1]+q[1])/2)}ctx.closePath()}
 function lockPath(i){smoothOutline(lockGeometry(i).poly)}
 // A stationary silk-and-ink grain, clipped to deformable blocks rather than painted as hair strands.
 const grain=document.createElement('canvas');grain.width=128;grain.height=128;
 const gc=grain.getContext('2d'),noise=gc.createImageData(128,128);let seed=17;
 for(let i=0;i<noise.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;const light=seed%3===0;noise.data[i]=light?192:27;noise.data[i+1]=light?162:23;noise.data[i+2]=light?113:18;noise.data[i+3]=Math.floor((seed>>>25)/5)+(i/4%5===0?2:0)}
 gc.putImageData(noise,0,0);const grainFill=ctx.createPattern(grain,'repeat');
 function inkTexture(){ctx.save();ctx.clip();ctx.fillStyle=grainFill;ctx.fillRect(0,-100,900,1100);ctx.restore()}
 function drawRoot(n,i,dx=0,dy=0){const w=n.white?5.5:9,curve=Math.sin(i*1.7)*12,x=n.x+dx,y=n.y+dy;
  ctx.beginPath();ctx.moveTo(x-w,y+9);ctx.bezierCurveTo(x-w,y-5,x+w,y-5,x+w,y+9);
  ctx.bezierCurveTo(x+w+curve,y+105,x+22+w,y+340,x+16+w,y+720);
  ctx.quadraticCurveTo(x+16,y+742,x+16-w,y+720);
  ctx.bezierCurveTo(x+22-w,y+340,x-w+curve,y+105,x-w,y+9);ctx.closePath();
  ctx.fillStyle=n.white?'#e4dac1':['#473b2e','#4b3e2f','#514332'][i%3];ctx.fill();inkTexture();
  if(pointer?.chosen===i){ctx.strokeStyle='#b9a66f';ctx.lineWidth=1;ctx.stroke()}
 }
 function beardTip(i){return {x:beardX[i],y:300+beardLength[i]+(1-beard[i])*32}}
 function endingPhase(){return !done?'working':clock-finishedAt<2.6?'mirror':'happy'}
 const mirrorBox={x:115,y:235,w:350,h:350};
 function sideState(a){return {wet:shownWet.slice(a,a+3).reduce((x,y)=>x+y,0)/3,smooth:shownSmooth.slice(a,a+3).reduce((x,y)=>x+y,0)/3}}
 function hairSilhouette(){const ls=sideState(0),rs=sideState(3),mix=(dry,wet,combed,v)=>(dry*(1-v.wet)+wet*v.wet)*(1-v.smooth)+combed*v.smooth;
  const l=mix(242,274,286,ls),r=mix(658,626,614,rs),ll=mix(220,248,280,ls),rr=mix(680,652,620,rs);
  const tips=a=>[a,a+1,a+2].map(i=>lockGeometry(i).c.at(-1)).sort((p,q)=>q.x-p.x),left=tips(0),right=tips(3);
  function fringe(points){for(let j=1;j<points.length;j++){const p=points[j-1],q=points[j],mx=(p.x+q.x)/2,my=Math.min(p.y,q.y)-26;ctx.bezierCurveTo(p.x-2,p.y-10,mx,my,mx,my);ctx.bezierCurveTo(mx,my,q.x+3,q.y-10,q.x,q.y)}}
  ctx.beginPath();ctx.moveTo(450,16);ctx.bezierCurveTo(491,0,540,10,561,53);ctx.bezierCurveTo(581,95,r-8,197,r,260);
  ctx.bezierCurveTo(r+8,310,rr,380,right[0].x+5,right[0].y-18);ctx.quadraticCurveTo(right[0].x+3,right[0].y-3,right[0].x,right[0].y);fringe(right);
  ctx.bezierCurveTo(566,400,579,274,558,183);ctx.bezierCurveTo(553,145,552,134,542,111);ctx.bezierCurveTo(522,69,478,68,450,82);ctx.bezierCurveTo(415,65,378,77,357,113);ctx.bezierCurveTo(347,138,347,159,342,183);
  ctx.bezierCurveTo(321,274,334,400,left[0].x,left[0].y);fringe(left);ctx.quadraticCurveTo(left[2].x-3,left[2].y-3,left[2].x-5,left[2].y-18);
  ctx.bezierCurveTo(ll,380,l-8,310,l,260);ctx.bezierCurveTo(l+8,197,315,94,335,52);ctx.bezierCurveTo(359,4,408,-1,450,16);ctx.closePath()
 }
 function drawPortrait(){
  if(endingPhase()==='happy'){const h=650,w=h*happyCustomer.width/happyCustomer.height,x=450-w/2,y=-20;ctx.drawImage(happyCustomer,x,y,w,h);return}
  ctx.fillStyle='#493e30';ctx.beginPath();ctx.ellipse(450,245,153,216,0,0,Math.PI*2);ctx.fill();inkTexture();ctx.drawImage(customer,portrait.x,portrait.y,portrait.w,portrait.h);
  // Curved locks overlap under the crown: shared fill removes the old horizontal joins.
  ctx.save();hairSilhouette();ctx.fillStyle='#493e30';ctx.fill();inkTexture();ctx.clip();
  for(let i=5;i>=0;i--){lockPath(i);const damp=shownWet[i];ctx.fillStyle=damp>.1?['#443a2d','#453b2e','#42382c'][i%3]:['#4b4031','#493e30','#463b2e'][i%3];ctx.fill();inkTexture()}
  const settle=shownWet.reduce((a,b)=>a+b,0)/6*7;
  ctx.fillStyle='#493e30';ctx.beginPath();ctx.moveTo(321,201);ctx.bezierCurveTo(307,125,315,44+settle,373,16+settle);ctx.bezierCurveTo(403,4+settle,430,10+settle,450,18+settle);ctx.bezierCurveTo(480,5+settle,521,15+settle,549,35+settle);ctx.bezierCurveTo(579,81,582,146,580,203);ctx.bezierCurveTo(558,181,553,137,542,111);ctx.bezierCurveTo(522,69,478,68,450,82);ctx.bezierCurveTo(415,65,378,77,357,113);ctx.bezierCurveTo(342,141,343,183,321,201);ctx.closePath();ctx.fill();inkTexture();ctx.restore();
  // Eye patches and hand-drawn lids/pupils animate independently from the painted face.
  for(const x of [eyeLeft,eyeRight]){const closed=blink>0||(step===0&&pointer);if(closed){const cx=(x-120)/660*closedEyes.width,cy=.275*closedEyes.height;ctx.drawImage(closedEyes,cx-55,cy-22,110,44,x-27.5,eyeY-10,55,22)}else{const sx=(x-120)/660*customer.width,sy=eyeY/630*customer.height;ctx.drawImage(customer,sx-43,sy-12,86,24,x-21.6+eyeX*.6,eyeY-6,43.2,12)}}
  // Moustache and three independently trimmable beard blocks.
  ctx.fillStyle='#493d2e';for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(450+side*3,247);ctx.bezierCurveTo(450+side*15,239,450+side*34,250,450+side*41,265);ctx.quadraticCurveTo(450+side*19,251,450+side*3,253);ctx.closePath();ctx.fill()}
  if(beard.every(v=>v===1)){smoothOutline([[425,293],[440,300],[450,294],[461,300],[475,293],[472,354],[450,425],[428,354]]);ctx.fillStyle='#493d2e';ctx.fill();inkTexture()}else for(let i=0;i<3;i++){const x=beardX[i],y=300,len=beardLength[i]+(1-beard[i])*32,w=i===1?22:11;
   smoothOutline([[x-w,y-5],[x,y+1],[x+w,y-5],[x+w-2,y+len-23],[x,y+len],[x-w+2,y+len-20]]);ctx.fillStyle='#493d2e';ctx.fill();inkTexture()}
  if(step===4&&!done)whiskers.forEach((n,i)=>{if(!clean[i])shape([[n.x,n.y],[n.x+3,n.y-2],[n.x+1,n.y+4],[n.x-2,n.y+7]],'#594937')});
  if(done){const t=clock-finishedAt;ctx.save();ctx.globalAlpha=Math.min(1,t*4)*Math.min(1,(2.6-t)*3);ctx.drawImage(tools.mirror,mirrorBox.x,mirrorBox.y,mirrorBox.w,mirrorBox.h);ctx.restore()}

 }
 // Calibrated after inspecting the generated underpainting.
 const portrait={x:120,y:0,w:660,h:630};let eyeLeft=410,eyeRight=488,eyeY=170,skin='#d0a373';
 // Tool anchors describe the working tip in the original generated image, in source pixels.
 // Camera zoom applies equally to the face and tool; the working tip always stays at the pointer.
 const sprites={
  ladle:[240,800,.14], 'ladle-pour':[110,920,.14],comb:[887,755,.095],
  tweezers:[145,855,.13],'tweezers-closed':[130,915,.13],
  scissors:[210,760,.145],'scissors-closed':[210,760,.145],razor:[100,350,.36]
 };
 function toolState(){const tool=steps[step][1];return tool==='ladle'&&pointer?'ladle-pour':tool==='tweezers'&&pointer?.gripped?'tweezers-closed':tool==='scissors'&&pointer?'scissors-closed':tool}
 function drawTool(){if(!cursor||done)return;const key=toolState(),im=tools[key],spec=sprites[key],z=camera().s;
  ctx.save();ctx.translate(cursor.x,cursor.y);ctx.scale(z,z);
  const flip=cursor.x>620?-1:1;ctx.scale(flip,1);
  ctx.drawImage(im,-spec[0]*spec[2],-spec[1]*spec[2],im.width*spec[2],im.height*spec[2]);ctx.restore();
 }
 function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,1200,840);ctx.scale(1200/900,840/630);ctx.fillStyle='#d9cbb0';ctx.fillRect(0,0,900,630);const cam=camera();ctx.save();ctx.translate(cam.x,cam.y);ctx.scale(cam.s,cam.s);
  if(step===2&&!done){ctx.fillStyle=skin;ctx.fillRect(0,-100,900,1000);ctx.save();ctx.fillStyle=grainFill;ctx.fillRect(0,-100,900,1000);ctx.restore();
   // The enlarged view keeps long hair running off the bottom of the viewport.
   roots.forEach((n,i)=>{if(!n.white)drawRoot(n,i)});
   roots.forEach((n,i)=>{if(!n.white||white[whiteIds.indexOf(i)]===1)return;const held=pointer?.chosen===i;drawRoot(n,i,held?pointer.dx||0:0,held?pointer.dy||0:0)});
  }else drawPortrait();
  particles.forEach(p=>{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=p.life;
   if(p.white){smoothOutline([[-3,0],[2,-2],[5,38],[2,77],[-2,39]]);ctx.fillStyle='#e4dac1';ctx.fill()}
   else{smoothOutline([[-7,-4],[8,0],[2,15],[-5,10]]);ctx.fillStyle='#4a3e30';ctx.fill()}ctx.restore()});ctx.restore();
  drawTool();
  if(cursor&&!done){ctx.beginPath();ctx.arc(cursor.x,cursor.y,6,0,Math.PI*2);ctx.lineWidth=1.2;ctx.strokeStyle=pointer?.gripped?'#856c36':'#90784d99';ctx.stroke()}
  ctx.fillStyle='#76674e';ctx.font='14px SimSun,serif';ctx.fillText(done?'一席闲谈，留下旧事。':step===2?'长发根部 · 夹住白发，向外拖出':step===3?'下巴特写 · 点击须尾剪切':step===4?'下颌特写 · 沿小杂毛轻刮':'城墙根下，暂歇片刻。',25,608);
  if(feedback&&clock<feedbackUntil){ctx.fillStyle='#30463b';ctx.font='16px SimSun,serif';ctx.fillText(feedback,25,575)}
 }
 function point(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*900/r.width,y:(e.clientY-r.top)*630/r.height}}
 function world(p){const c=camera();return{x:(p.x-c.x)/c.s,y:(p.y-c.y)/c.s}}
 function distance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
 function changed(text){dirty=true;ping();update();if(text)message(text)}
 function waterAt(p,amount){let hit=false;locks.forEach((n,i)=>{if(lockDistance(i,p)<50){const before=wet[i];wet[i]=Math.min(1,wet[i]+amount);hit||=wet[i]>before}});if(hit)changed('水到之处，长发收拢垂下。');return hit}
 function combAt(p,prev,amount){if(p.y<prev.y-2)return;let hit=false;locks.forEach((n,i)=>{if(Math.min(lockDistance(i,p),lockDistance(i,prev))<47){const before=smooth[i];smooth[i]=Math.min(1,smooth[i]+amount);hit||=smooth[i]>before}});if(hit)changed('梳过之处，发块顺直贴服。');return hit}
 function rootDistance(n,i,p){const curve=Math.sin(i*1.7)*12;let min=Infinity,prev={x:n.x,y:n.y};
  for(let j=1;j<=16;j++){const t=j/16,y=n.y+t*400,x=n.x+curve*Math.sin(t*Math.PI)*.5+18*t;const q={x,y};min=Math.min(min,distance(p,prev,q));prev=q}return min}
 function grip(p){let best=22,chosen=-1;roots.forEach((n,i)=>{if(!n.white||white[whiteIds.indexOf(i)]===1)return;const d=rootDistance(n,i,p);if(d<best){best=d;chosen=i}});
  if(chosen<0)return false;pointer.chosen=chosen;pointer.start={...p};pointer.dx=0;pointer.dy=0;pointer.gripped=true;message('已夹住白发 · 向外拖一小段');ping();return true}
 function snip(p){let best=38,chosen=-1;for(let i=0;i<3;i++){const tip=beardTip(i),d=Math.hypot(p.x-tip.x,p.y-tip.y);if(d<best&&beard[i]<1){best=d;chosen=i}}
  if(chosen<0)return;beard[chosen]=Math.min(1,beard[chosen]+.5);particles.push({x:p.x,y:p.y,a:0,life:1});changed('须尾已剪短。');checkpoint()}
 function shave(p,prev){let hit=false;whiskers.forEach((n,i)=>{if((faceSide===0?i<8:i>=8)&&!clean[i]&&distance(n,prev,p)<16){clean[i]=1;hit=true}});if(hit)changed('下颌边缘已整理。')}
 function down(e){if(!loaded||done||e.button>0||pointer)return;e.preventDefault();cursor=point(e);const p=world(cursor);pointer={id:e.pointerId,last:p,start:p,chosen:-1,pull:0,gripped:false};canvas.setPointerCapture(e.pointerId);
  if(step===0)waterAt(p,.48);
  if(step===1)combAt(p,p,.16);
  if(step===2&&!grip(p))message('将镊子尖端移到浅色白发上，再向外拖。');
  if(step===3)snip(p);
  if(step===4)shave(p,p);
 }
 function move(e){if(pointer&&pointer.id!==e.pointerId)return;cursor=point(e);if(!pointer||done)return;e.preventDefault();const p=world(cursor),prev=pointer.last,dist=Math.hypot(p.x-prev.x,p.y-prev.y);
  // Sample the swept tool path as well as the endpoint, so quick strokes do not skip a lock.
  if(step===0||step===1){const count=Math.max(1,Math.min(30,Math.ceil(dist/10)));for(let j=1;j<=count;j++){const q={x:prev.x+(p.x-prev.x)*j/count,y:prev.y+(p.y-prev.y)*j/count};
   if(step===0)waterAt(q,Math.min(dist,100)/count/60);
   else combAt(q,prev,Math.max(0,p.y-prev.y)/count/100);
  }}
  if(step===2){if(pointer.chosen<0&&!pointer.gripped)grip(p);
   if(pointer.chosen>=0){const i=whiteIds.indexOf(pointer.chosen);pointer.dx=p.x-pointer.start.x;pointer.dy=p.y-pointer.start.y;pointer.pull=Math.hypot(pointer.dx,pointer.dy);
    if(pointer.pull>=20){const n=roots[pointer.chosen];white[i]=1;particles.push({x:n.x+pointer.dx,y:n.y+pointer.dy,a:0,life:1,white:true});pointer.chosen=-1;changed('白发已拔出。');checkpoint()}
   }
  }
  if(step===4)shave(p,prev);
  pointer.last=p;
 }
 function up(e){if(pointer?.id===e.pointerId){pointer=null;checkpoint();if(step===4&&faceSide===0&&clean.slice(0,8).every(v=>v===1)){faceSide=1;message('这一侧已妥当 · 再整理另一侧。')}}}
 canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);canvas.addEventListener('pointerleave',()=>{if(!pointer)cursor=null});
 function tick(now){if(disposed)return;const elapsed=Math.max(0,(now-last)/1000),dt=Math.min(.1,elapsed);last=now;clock+=elapsed;
  if(clock>nextBlink){blink=.14;nextBlink=clock+2.2+Math.random()*3}blink=Math.max(0,blink-dt);
  if(clock>nextGaze){gaze=(Math.random()-.5)*8;nextGaze=clock+1.2+Math.random()*1.6}
  if(cursor&&step<2)gaze=Math.max(-4,Math.min(4,(cursor.x-450)/50));eyeX+=(gaze-eyeX)*(1-Math.exp(-dt*8));
  if(pointer&&step===0)waterAt(pointer.last,dt*1.8);
  for(let i=0;i<6;i++){const k=1-Math.exp(-elapsed*18);shownWet[i]+=(wet[i]-shownWet[i])*k;shownSmooth[i]+=(smooth[i]-shownSmooth[i])*k}
  if(dirty&&clock>saveAfter){checkpoint();saveAfter=clock+.6}
  particles=particles.filter(p=>{p.y+=dt*(p.white?-130:90);p.a+=dt;p.life-=dt;return p.life>0});if(loaded)draw();raf=requestAnimationFrame(tick)
 }
 panel();Promise.all(images).then(()=>{if(disposed)return;loaded=true;update();loading.remove();raf=requestAnimationFrame(tick)}).catch(()=>{loading.textContent='素材未载入，请完整解压后重试。'});
 window.barberCleanup=()=>{disposed=true;cancelAnimationFrame(raf);checkpoint();audio?.close();window.barberCleanup=null};
}
