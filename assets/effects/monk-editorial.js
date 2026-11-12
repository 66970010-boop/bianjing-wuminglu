/* 一包行李. New state is namespaced; previous route records are preserved. */
(function(){
const titles=['街口落物','包里是什么','为什么远行','山门里，也有市声','门前下笠','你也有要紧的物事'];
const beats=[
[['“劳烦，替我拦一下。”','一只鞋袋滚到你脚边。'],['你捡起鞋袋，他才腾出手，压住松开的绦带。','“走了这些日子，偏到人多处松了。”'],['“师父，先放下吧。我替你看着。”','他将行装放稳，向你道了声谢。']],
[['“这些都是师父一路背来的？”','“衣裳、被单，还有吃饭用的钵。看着不多，日日背着，也有些分量。”'],['“这个也放进衣包里么？”','“那是钵囊，另放一旁便好。”'],['“原来打包也有这样多讲究。”','“日日要取，日日要收。放得乱了，赶路时就要多受些累。”']],
[['“师父走过不少地方吧？”','“走过一些。”'],['“是去看名山大寺？”','“去参学。有不明白的，向人请问；一处住过，再往别处去。”'],['“那到了汴京，就不走了？”','“先住下，看看能学些什么。”'],['你替他拉住绦带，试了试。','“这回应当牢了。”']],
[['“师父今日往哪里去？”','“相国寺。”'],['“听说今日那里开市，怕是更挤。”','“先去看看。到了，再问寺里接待的人。”'],['有人挑选器物，有人在书画前停步。','市声一直传到门边。'],['“我还以为，进了寺门就清静了。”','“今日来做买卖的，也走这道门。”']],
[['到了门檐下，僧人停下，取下笠，收住手中的杖。','你想替他把行李送进去。'],['“放在里面便是？”','“先不忙。还须向人问讯，说明来意。”'],['“不是到了寺院，就能住么？”','“要问过才知道。各处有各处的规矩，初来，总要先问。”']],
[['“耽搁你这些时候，你原本往哪里去？”','“替人送一封家书。还没寻到收信的人。”'],['“可带稳了？”','你摸向怀里。信还在。'],['“那就好。我的包收齐了，你也莫落下自己的物事。”','他持笠向门内走去。'],['你转身回到街上。','城东的饼摊，还要继续打听。']]];
const propNames={hat:'笠',shoes:'鞋袋',bowl:'钵囊',bundle:'衣包'};
const propWords={hat:'“遮日，也挡些雨。进寺门前，便取下来。”',bowl:'“钵口收好，路上莫撞着。钵囊另放一旁便好。”',bundle:'“这一包是净衣，别同换下的衣物混在一起。”'};
window.renderMonk=function(root){window.monkScrollCleanup?.();const q=monkQuest();const v=q.luggage||(q.luggage={version:1,picked:false,examined:[],tied:false,returned:false,letter:false,completed:false,chapter:0,beats:[0,0,0,0,0,0]});v.beats??=[0,0,0,0,0,0];const events=new AbortController(),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;let raf=0,restore=0,saveTimer=0;const scenes=[],refreshers=[];root.classList.add('monk-editorial','me-luggage');root.querySelector('.topbar')?.remove();root.append(btn('← 返回画卷',()=>go('scroll'),'me-back'));const shell=div('me-scroll');root.append(shell);
const persist=()=>save();const prop=id=>{const n=div('me-prop me-prop-'+id);n.setAttribute('role','img');n.setAttribute('aria-label',propNames[id]);return n;};
const ready=i=>i===0||i===1&&v.picked||i===2&&v.picked&&v.examined.length===3||i===3&&v.tied||i===4&&v.tied||i===5&&v.returned;
const jump=i=>{v.chapter=i;persist();root.scrollTo({top:scenes[i].offsetTop,behavior:reduce?'instant':'smooth'});};
for(let i=0;i<6;i++){
const section=div('me-chapter me-chapter-'+i),stage=div('me-stage'),visual=div('me-visual'),copy=div('me-copy');section.dataset.chapter=String(i);section.setAttribute('aria-label',titles[i]);
const title=document.createElement('h2');title.textContent=i===0?'一包行李':titles[i];copy.append(div('me-kicker',`行脚僧 · ${i+1} / 6`),title);
if([0,2,4,5].includes(i))visual.append(monkPortrait());
if(i===0){visual.append(prop('shoes'));copy.append(div('me-hint','沿画向下，陪他走一程 ↓'));}
if(i===1){const shelf=div('me-prop-shelf');for(const id of ['hat','bowl','bundle']){const b=btn('',()=>{if(!v.picked){status.textContent='先替他拾起街口的鞋袋。';window.SFX?.play('error-soft',{volume:.55});return;}if(!v.examined.includes(id))v.examined.push(id);window.SFX?.play('cloth',{volume:.6});status.textContent=propWords[id];persist();refreshers.forEach(fn=>fn());},'me-prop-button');b.setAttribute('aria-label','查看'+propNames[id]);b.dataset.prop=id;b.append(prop(id),div('me-prop-name',propNames[id]));shelf.append(b);}visual.append(shelf);}
if(i===2)visual.append(prop('bundle'));
if(i===3){visual.append(div('me-market-type','器物\n绦线\n书籍\n图画'));const d=document.createElement('details');const summary=document.createElement('summary');summary.textContent='此景小记';const p=document.createElement('p');p.textContent='《东京梦华录》记相国寺每月五次开放交易，寺中有日用品、绦线、书籍与图画等。此段同行与对白为剧情创作。';const a=document.createElement('a');a.href='https://www.shidianguji.com/zh/book/HY0001/chapter/HY0001_22';a.textContent='阅读古籍原文 ↗';a.target='_blank';a.rel='noopener';d.append(summary,p,a);copy.append(d);}
if(i===4)visual.append(prop('hat'));
if(i===5){const letter=div('me-family-letter');letter.textContent='家书';visual.append(letter);}
const dialogue=div('me-dialogue');dialogue.setAttribute('aria-live','polite');const controls=div('me-beat-controls'),prev=btn('上一句',()=>{v.beats[i]=Math.max(0,v.beats[i]-1);persist();refreshers.forEach(fn=>fn());},'me-dialogue-nav'),next=btn('继续听 →',()=>{v.beats[i]=Math.min(beats[i].length-1,v.beats[i]+1);persist();refreshers.forEach(fn=>fn());},'me-dialogue-nav');controls.append(prev,next);copy.append(dialogue,controls);
const status=div('me-feedback');status.setAttribute('role','status');copy.append(status);
const action=btn('',()=>{
if(!ready(i)){const prior=i<=2?0:i<=4?2:4;status.textContent='前面的物事还未收妥。';window.SFX?.play('error-soft',{volume:.6});jump(prior);return;}
if(i===0){v.picked=true;v.beats[0]=1;window.SFX?.play('cloth',{volume:.75});status.textContent='鞋袋已拾起。';}
if(i===1){if(v.examined.length<3){status.textContent='点看笠、钵囊和衣包，再替他收拾。';return;}jump(2);return;}
if(i===2){v.tied=true;window.SFX?.play('cloth',{volume:.8});status.textContent='你松开手，包袱没有再往下滑。“多谢。又能走一段。”';}
if(i===3){jump(4);return;}
if(i===4){v.returned=true;window.SFX?.play('cloth',{volume:.7});status.textContent='你将笠交还。他理好衣襟，准备向寺里问讯。';}
if(i===5){if(!v.letter){v.letter=true;status.textContent='你将家书往怀里放稳。';}else{v.completed=true;q.done=true;q.node='complete';state.played.monk=true;state.clues.monkRoute=true;state.history??=[];if(!state.history.includes('monk-luggage'))state.history.push('monk-luggage');q.journal='你替行脚僧拾起鞋袋，查看行装、收束衣包，陪他走向相国寺。他向寺里问讯，你收好家书，继续往城东寻人。';if(state.met.merchant)state.clues.kindness=true;persist();window.SFX?.play('temple-bell',{volume:.8});go('scroll');return;}}
persist();refreshers.forEach(fn=>fn());},'me-confirm');copy.append(action);
const advance=btn('向下，继续这一程 ↓',()=>{window.SFX?.play('page-turn',{volume:.55});jump(Math.min(5,i+1))},'me-advance');copy.append(advance);
function refresh(){dialogue.replaceChildren();const locked=!ready(i);for(const line of locked?['前一程的物事还未收妥，回去看看吧。']:beats[i][v.beats[i]||0]){const p=document.createElement('p');p.textContent=line;dialogue.append(p);}prev.disabled=locked||!v.beats[i];next.disabled=locked||v.beats[i]>=beats[i].length-1;section.classList.toggle('me-picked',v.picked);section.classList.toggle('me-tied',v.tied);section.classList.toggle('me-returned',v.returned);visual.querySelectorAll('[data-prop]').forEach(b=>b.setAttribute('aria-pressed',String(v.examined.includes(b.dataset.prop))));action.textContent=locked?'回到前一程':i===0?(v.picked?'鞋袋已拾好':'替他拾起鞋袋'):i===1?'行装认清了 →':i===2?(v.tied?'包袱已收稳':'替他收束绦带'):i===3?'到门前问讯 →':i===4?(v.returned?'笠已交还':'将笠交还'):v.letter?'继续送信 →':'摸一摸怀里的家书';action.disabled=i===0&&v.picked||i===2&&v.tied||i===4&&v.returned;advance.hidden=i===5||!(i===0?v.picked:i===1?v.examined.length===3:i===2?v.tied:i===3?true:v.returned);}
refreshers.push(refresh);stage.append(visual,copy);section.append(stage);shell.append(section);scenes.push(section);refresh();}
const note=div('me-source-note','人物相遇与对白为剧情创作。行装与入寺举止参考《禅苑清规》；寺市参考《东京梦华录》。物件为新生成的叙事示意，非原画抠图或出土复原。');shell.append(note);
function update(){raf=0;let current=v.chapter||0;for(let i=0;i<scenes.length;i++){const s=scenes[i],r=s.getBoundingClientRect(),p=Math.max(0,Math.min(1,-r.top/Math.max(1,s.offsetHeight-root.clientHeight)));s.style.setProperty('--p',p);s.style.setProperty('--reveal',reduce?'100%':Math.min(100,p*260+8)+'%');if(r.top<root.clientHeight*.5&&r.bottom>root.clientHeight*.5)current=i;}if(current!==v.chapter){v.chapter=current;clearTimeout(saveTimer);saveTimer=setTimeout(persist,250);}}
const scroll=()=>{if(!raf)raf=requestAnimationFrame(update);};root.addEventListener('scroll',scroll,{signal:events.signal,passive:true});window.addEventListener('resize',scroll,{signal:events.signal});restore=requestAnimationFrame(()=>{root.scrollTo({top:scenes[Math.min(5,v.chapter||0)].offsetTop,behavior:'instant'});update();});
window.monkScrollCleanup=()=>{events.abort();cancelAnimationFrame(raf);cancelAnimationFrame(restore);clearTimeout(saveTimer);persist();window.monkScrollCleanup=null;};
};})();
