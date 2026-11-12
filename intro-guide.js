/* First visit guide: separate progress, no story rewards or clock changes. */
const guideLegacy=!!(state.dayStory?.started||Object.keys(state.met||{}).length||Object.keys(state.played||{}).length);
if(!state.introGuide){state.introGuide={version:1,status:guideLegacy?'completed':'pending',step:0};save()}
let introGuideCleanup=()=>{};
const guideOriginalGo=go;
go=function(page){introGuideCleanup();guideOriginalGo(page)};
function replayIntroGuide(){state.introGuide={version:1,status:'pending',step:0};save();go('scroll')}
function mountIntroGuide(root){
 const g=state.introGuide;if(!g||!['pending','active'].includes(g.status))return;
 g.status='active';save();const events=new AbortController(),signal=events.signal;
 const card=div('intro-guide-card');card.setAttribute('role','region');card.setAttribute('aria-label','入门引导');const title=document.createElement('h2'),copy=document.createElement('p'),count=document.createElement('small'),gesture=div('intro-guide-gesture','↔'),actions=div('intro-guide-actions');const next=btn('继续 →',advance),skip=btn('跳过引导 →',()=>finish('skipped'));actions.append(next,skip);card.append(count,title,copy,gesture,actions);root.append(card);let target=null,motion=null,armed=false,timer;
 const steps=[['入城','河岸有人卸货，街边有人开摊。你也带着一件受托的事，走进了汴京。'],['家书在怀','一位母亲托你将家书交给城东卖烧饼的年轻人。你收好信，向城东寻去。'],['记住一句话','“问他可还记得城外那棵老槐树。”你可以向街坊问路，也可以自己寻找。'],['展卷寻人',matchMedia('(pointer:coarse)').matches?'左右滑动画卷，看看街市。':'滚动鼠标或按住画卷拖动，看看街市。'],['走近画中人',matchMedia('(pointer:coarse)').matches?'轻触朱印，走近交谈。':'悬停朱印，看看画中人；点击朱印，走近交谈。'],['照自己的步子走','行程提示收着母亲的托付。问路即可得到方向，不必玩遍所有小游戏。'],['把相遇记下来','《无名录》记录你确实遇见的人、听过的故事与已知线索。'],['家书收好，照自己的步子走。','你可以停下来搭把手，也可以继续赶路。']];
 function clearTarget(){target?.classList.remove('intro-guide-highlight');target=null;motion?.cancel();motion=null;clearTimeout(timer)}
 function draw(){clearTarget();armed=false;const i=Math.min(g.step,steps.length-1);count.textContent='初入汴京 · '+(i+1)+' / '+steps.length;title.textContent=steps[i][0];copy.textContent=steps[i][1];gesture.hidden=i!==3;next.textContent=i===steps.length-1?'开始游卷 →':'继续 →';card.classList.toggle('intro-guide-top',i>=5);if(i===0&&!matchMedia('(prefers-reduced-motion: reduce)').matches)motion=root.querySelector('.scroll-world')?.animate([{translate:'25px 0'},{translate:'0 0'}],{duration:1600,easing:'ease-out'});
 if(i===4){const pins=[...root.querySelectorAll('.npc-seal')];target=pins.find(p=>{const r=p.getBoundingClientRect();return r.left>20&&r.right<innerWidth-20})||null;}
 if(i===5)target=root.querySelector('.story-guide');if(i===6)target=[...root.querySelectorAll('.topbar button')].find(b=>b.textContent==='无名录');target?.classList.add('intro-guide-highlight');timer=setTimeout(()=>armed=true,350);save();}
 function finish(status){g.status=status;save();introGuideCleanup()}
 function advance(){if(g.step>=steps.length-1){finish('completed');return}g.step++;draw()}
 const viewport=root.querySelector('.scroll-viewport');viewport?.addEventListener('scroll',()=>{if(g.step===3&&armed)advance()},{signal,passive:true});root.addEventListener('click',e=>{if(e.target.closest('.npc-seal'))finish('completed')},{signal,capture:true});root.querySelector('.topbar')?.addEventListener('click',()=>finish('completed'),{signal,capture:true});
 introGuideCleanup=()=>{clearTarget();events.abort();card.remove();introGuideCleanup=()=>{}};draw();
}
