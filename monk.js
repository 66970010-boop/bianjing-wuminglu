/* 问路：与主线共享人物、存档与手记；寺院和草图均为剧情虚构。 */
const MONK_STORY = {
 arrival:{act:0,title:'借问一程',text:['“小施主，借问一声。贫僧初到东京，欲往城中一寺挂搭，却在这里绕了两回。”','他扶稳竹箧，从衣襟中取出一张折得发软的纸。'],choices:[['我也不熟悉，不过可以一同看看。','together','greeting'],['师父要去的寺院，叫什么名字？','temple','greeting'],['东京寺院不少，为何偏寻这一处？','why','greeting']]},
 together:{act:0,title:'同看一纸',text:['“不妨事。识得自己不熟悉，总比随口指一条路好。”','“是清隐院。一位旧日师友曾在那里暂住，临别时给我留下这张寻寺笺。”'],next:'paper'},
 temple:{act:0,title:'有名的去处',text:['“清隐院。名字记得，道路却记不清。”','“我来参访一位师友。先寻到山门，也好向寺中问讯，求个暂住之处。”'],next:'paper'},
 why:{act:0,title:'远来的约定',text:['“临别时，师友说，若有一日到东京，不妨来坐坐。”','“并无非去不可的缘故。只是走了这么远，还记得那句话。”'],next:'paper'},
 paper:{act:0,title:'寻寺残笺',text:['纸上几行小字被水洇开：“循水……过桥入市……双……北折……”','“这是记路的笺纸，不是官府凭验。一路风雨，倒把要紧处淋去了。”'],next:'lodging'},
 lodging:{act:0,title:'今夜的落脚处',text:['你问：“到了寺院，便能住下么？”','“还须依寺中规矩问讯、求挂搭，不能径自推门进去。今夜能否留下，到了才知。”','他拂了拂袖上的尘土：“出家人也要吃饭、歇脚。今日先把这条路寻清。”'],next:'uncertain'},
 uncertain:{act:1,title:'若他已不在',text:['“写笺已有些时日。师友如今是否还在，贫僧并不知道。”','你看着那张残笺：“既然如此，这一趟会不会白走？”','僧人没有答，反问：“若你要寻的人未必在那里，你还去么？”'],choices:[['会去。没有亲自走到，我总不甘心。','goAnyway','purpose'],['先弄清楚他在不在，再决定。','checkFirst','purpose'],['也许换个去处，不一定守着旧约。','changeCourse','purpose']]},
 goAnyway:{act:1,title:'值得一行',text:['“这份不甘，也是一种缘故。”','“只是若到了，山门里没有故人，你还能容得下这趟落空么？”'],choices:[['会失望，但走这一趟仍是我的选择。','acceptLoss','loss'],['若见不到人，我大概会后悔。','regretLoss','loss']]},
 checkFirst:{act:1,title:'等待确知',text:['“问清再走，自是稳妥。”','“只是隔着几程山水，消息到手时，人也可能又动身了。若迟迟等不到准信呢？”'],choices:[['给自己一个期限，过后再作决定。','setLimit','loss'],['不知结果，也可以先走一段。','acceptLoss','loss']]},
 changeCourse:{act:1,title:'更换去处',text:['“改道也未尝不可。旧日的约定，不该替今日的人走路。”','“不过换了去处，是自己另有所求，还是只怕扑一个空？”'],choices:[['我确实有更想去的地方。','newPurpose','loss'],['也许只是怕失望。','regretLoss','loss']]},
 acceptLoss:{act:1,title:'允许落空',text:['“原来你并不是不怕落空，只是愿意担下它。”','他低头把残笺压平：“贫僧也盼着见他。这一点，与俗人并无分别。”'],next:'questionBack'},
 regretLoss:{act:1,title:'未能放下',text:['“贫僧也会。路上累了，便想，何苦走这一遭。”','“可失望尚未来到，就先替它关了门，也未必更自在。”'],next:'questionBack'},
 setLimit:{act:1,title:'有限的等待',text:['“等多久，走多远，原来都要自己定。”','“若一味等到万事明白，天色也许先暗了。给等待一个止处，倒是实在。”'],next:'questionBack'},
 newPurpose:{act:1,title:'今日所求',text:['“既已看清今日所求，便不必为改道惭愧。”','“只是新路也未必有准信。到头来，我们仍要带着些不知道的事上路。”'],next:'questionBack'},
 questionBack:{act:1,title:'问路的人',text:['你问：“师父行脚多年，莫非也没有想明白？”','“若事事明白，方才又何必向你问路。”','“我知道今夜想去哪里。至于这一程究竟能得些什么，却还不能说。”'],choices:[['原来知道去处，也不等于知道结果。','whereVsWhy','reflection'],['那为什么不就近寻个落脚处？','nearby','reflection']]},
 whereVsWhy:{act:1,title:'一程与一生',text:['“是啊。山门可以写在纸上，见面之后会如何，却写不下。”','“但不知结果，并不妨碍我们先看清脚下这一段。”'],next:'roads'},
 nearby:{act:1,title:'先顾眼前',text:['“天色若晚，便先找个可歇脚的地方。也不必为守一张旧笺，硬挨一夜风寒。”','“如今还早，不妨先试着辨路。若实在走不通，再另作打算。”'],next:'roads'},
 roads:{act:2,title:'近路与稳路',text:['僧人展开一幅沿路描下的草图。两条路隔水相望：浅滩看着近些，石桥却要绕行。','“小施主，若同往一处，你会怎样选？”'],choices:[['走最近的。少绕一段，便早到一刻。','shortRoad','road'],['走稳妥的。多走几步也无妨。','safeRoad','road'],['先看水势和天色，再决定。','lookRoad','road']]},
 shortRoad:{act:2,title:'纸上的近',text:['“近，是纸上两点之间的事。水深几许，脚下能否站稳，纸上却未画。”','“若浅滩过不去，折回再走桥，倒比起初绕行更远。先辨清近路能不能走，如何？”'],next:'recollection'},
 safeRoad:{act:2,title:'稳妥的代价',text:['“桥路稳些，却也要多费脚程。你愿走远路，自有你的道理。”','“不过稳妥也不只是听着放心。桥是否通，路通何处，总还须辨认。”'],next:'recollection'},
 lookRoad:{act:2,title:'看过再走',text:['“正是。路并未因我们想走便变得好走。”','“今日水涨，昨夜的近路也许已不能行。选路，总得看眼前的情形。”'],next:'recollection'},
 recollection:{act:2,title:'记得与忘记',text:['“我还记得两句叮嘱：涨水时走石桥，莫涉浅滩；见两槐相并，才往北折。”','他指着草图：“街巷画得粗疏，却留下了这些标记。还请你替我辨一辨。”'],next:'yourSearch'},
 yourSearch:{act:2,title:'你也有所寻',text:['你说：“我也在寻一个人。一位母亲托我把家书送给城东卖饼的青年。”','“那你如今怎样寻？”','“她让我问他，可还记得城外那棵老槐树。”','僧人点头：“有人等你，便有归处。你已有一条路，不妨先往城东问问。”'],next:'beforeMap'},
 beforeMap:{act:2,title:'把路交给你',text:['“先读残笺，再看草图与我记下的几句话。字迹缺了，可以相互参照。”','你接过纸，开始辨认河道、街市与树木。','接下来查验三件线索，依次标出四处路标，为僧人指向寺院。'],next:'puzzle'},
 found:{act:4,title:'路已寻得',text:['你把路线重新指了一遍：“过石桥，穿闹市，见双槐往北折。山门就在北巷尽处。”','僧人将残笺收好：“劳烦你。贫僧如今知道该往何处走了。”','你问：“若到了那里，师友已不在呢？”'],choices:[['至少，师父亲自走到了。','endArrival','farewell'],['愿这一路，还有别的相逢。','endMeeting','farewell'],['先到那里，再作打算吧。','endNext','farewell']]},
 endArrival:{act:4,title:'抵达之后',text:['“是。只是走到，也不必装作从未失望。”','“若见不到他，就向寺中问讯。若仍无消息，歇过一夜，再想下一程。”'],next:'kindness'},
 endMeeting:{act:4,title:'路上相逢',text:['“今日本是来寻故人，却先遇见了你。”','“这相逢不能代替故人，但也是这一日里实实在在的一件事。”'],next:'kindness'},
 endNext:{act:4,title:'下一步',text:['“好。先把脚下这一段走完。”','“并非前路都已明白，只是不必在此处，把往后的一生一并想定。”'],next:'kindness'},
 kindness:{act:4,title:'一件小事',text:['告别前，你问他是否认识街上卖杂货的人。','“有过一面之缘。他的物件落在路旁，贫僧替他拾回。小事罢了。”','他重新背起竹箧：“今日我替人拾物，明日也要请人为我指路。”'],next:'farewell'},
 farewell:{act:4,title:'行而未至',text:['“路有远近，行而后知。”','僧人向你合掌，转身走入街巷。师友是否仍在寺中，画卷没有替他作答。','你留在原处，又看了一眼来往的人。每个人似乎都有去处，也都有尚未知道的事。'],next:'complete'}
};
const MONK_EVIDENCE = [
 {id:'letter',name:'寻寺残笺',mark:'一',title:'先桥，后市',text:'循水过桥，穿闹市而行。见双……北折，清隐……',detail:'洇开的字之间，“过桥”与“穿闹市”仍能辨认。次序是先过桥，再穿过市街。',clue:'须过桥入市，不能沿城外小径绕开街市。'},
 {id:'sketch',name:'沿路草图',mark:'二',title:'山门在北巷',text:'上北下南。北巷尽处画有山门，南边方屋旁记着一个“仓”字。',detail:'草图是途中所绘，不是原卷实测地图。双槐旁有南北岔路，山门画在北方。',clue:'过双槐后北折；南巷通仓房，北巷通寺院。'},
 {id:'memory',name:'僧人追记',mark:'三',title:'双槐才转向',text:'今朝水涨，不涉浅滩。见两槐相并，方可转巷，勿认独柳。',detail:'近路画了浅滩，但僧人已记下水涨；桥路仍可通行。转向的标记是两棵槐树，不是一棵柳树。',clue:'走石桥，莫涉浅滩；认双槐，不认独柳。'}
];
const MONK_STEPS = [
 {name:'渡水',options:[['bridge','石桥'],['ford','浅滩']]},
 {name:'入市',options:[['market','闹市'],['outside','城外小径']]},
 {name:'辨树',options:[['pair','双槐'],['willow','独柳']]},
 {name:'折向',options:[['temple','北巷山门'],['store','南巷仓房']]}
];
const MONK_ANSWER=['bridge','market','pair','temple'];
const MONK_HINTS=['僧人记下今日水涨。近处的浅滩，还适合步行么？','残笺说“穿闹市而行”，不是绕开街市。','两槐相并才是折向处；独柳只有一株。','先看草图的北向标记，再辨山门与仓房。'];
function monkQuest(){return state.monkQuest||(state.monkQuest={node:'arrival',choices:{},examined:[],route:[],attempts:0,done:false});}
function monkAdvance(node){const q=monkQuest();q.node=node;delete q.feedback;save();window.SFX?.play('page-turn',{volume:.65});render();}
function monkComplete(){const q=monkQuest();q.done=true;q.node='complete';state.played.monk=true;state.clues.monkRoute=true;state.history=state.history||[];if(!state.history.includes('monk-route'))state.history.push('monk-route');if(state.met.merchant)state.clues.kindness=true;save();window.SFX?.play('temple-bell',{volume:.8});render();}
function monkRestart(){state.monkQuest={node:'arrival',choices:{},examined:[],route:[],attempts:0,done:false};save();render();}
function monkPortrait(cls=''){let im=document.createElement('img');im.src='assets/monk-layer.webp';im.alt='背负竹箧、持杖行走的行脚僧';im.className=cls;return im;}
function renderMonk(root){
 const q=monkQuest();root.classList.add('monk-quest');
 const current=q.node==='puzzle'?3:q.node==='complete'?4:(MONK_STORY[q.node]?.act||0);
 let shell=div('monk-shell');
 let mast=div('monk-mast','<div><span class="eyebrow">行脚僧 · 人物支线</span><h1>问路</h1></div>');
 mast.append(btn('← 返回画卷',()=>go('scroll'),'monk-back'));shell.append(mast);
 let progress=div('monk-progress');['借问一程','去处与归处','路有远近','残笺寻路','行而未至'].forEach((name,i)=>{let s=document.createElement('span');s.textContent=`${'一二三四五'[i]} · ${name}`;if(i===current)s.setAttribute('aria-current','step');if(i<current)s.classList.add('passed');progress.append(s)});shell.append(progress);
 if(q.node==='puzzle'){renderMonkPuzzle(shell,q);root.append(shell);return;}
 if(q.node==='complete'){
  let wrap=div('monk-complete');let portrait=div('monk-complete-portrait');portrait.append(monkPortrait());
  let copy=div('monk-complete-copy','<div class="eyebrow">无名录 · 行脚僧</div><h2>行而未至</h2><p class="monk-verse">路有远近，行而后知。</p><p>你为他辨清了一段路，未替他决定此行的意义。</p><div class="monk-route-record">石桥 → 闹市 → 双槐 → 北巷山门</div><p class="monk-muted">寻寺路线与相助往事，已记入《无名录》。</p>');
  let actions=div('monk-end-actions');actions.append(btn('继续游卷 →',()=>go('scroll'),'monk-primary'),btn('翻看人物手记',()=>{bookTab='people';bookSelection='monk';go('book')},'monk-secondary'),btn('重走这一程',monkRestart,'monk-text-button'));copy.append(actions);wrap.append(portrait,copy);shell.append(wrap);root.append(shell);return;
 }
 const data=MONK_STORY[q.node]||MONK_STORY.arrival;
 let layout=div('monk-dialogue-layout'),portrait=div('monk-portrait');portrait.append(div('monk-portrait-stamp','行<br>脚'),monkPortrait(),div('monk-portrait-caption','一杖一箧 · 身在途中'));
 let panel=div('monk-talk');panel.setAttribute('aria-labelledby','monk-scene-title');
 let title=document.createElement('h2');title.id='monk-scene-title';title.tabIndex=-1;title.textContent=data.title;
 panel.append(div('eyebrow','汴京街头 · 你与行脚僧'),title);
 let words=div('monk-words');for(const line of data.text){let p=document.createElement('p');p.textContent=line;words.append(p)}panel.append(words);
 let choices=div('monk-choices');
 if(data.choices){choices.append(div('monk-choice-label','你的回应'));data.choices.forEach(([label,next,key])=>choices.append(btn(label,()=>{q.choices[key]=label;monkAdvance(next)},'monk-choice')));}
 else choices.append(btn(data.next==='puzzle'?'展开草图，辨认线索 →':data.next==='complete'?'将这一程收入无名录 →':'继续 →',()=>data.next==='complete'?monkComplete():monkAdvance(data.next),'monk-primary'));
 panel.append(choices);if(q.node==='arrival')panel.append(div('monk-footnote','约 5—8 分钟 · 对话选择无对错 · 途中离开可继续'));
 layout.append(portrait,panel);shell.append(layout);shell.append(div('monk-fiction-note','人物对白、清隐院与寻寺路线为剧情创作。'));root.append(shell);
 if(q.node!=='arrival')title.focus({preventScroll:true});
}
function renderMonkPuzzle(shell,q){
 let intro=div('monk-puzzle-head','<div><div class="eyebrow">残笺寻路</div><h2>替他辨清眼前这一程</h2><p>先查验三件线索，再在草图上依次选出四处路标。</p></div>');intro.append(div('monk-evidence-count',`线索 ${q.examined.length} / 3`));shell.append(intro);
 let grid=div('monk-puzzle-grid'),aside=div('monk-evidence-list');
 for(const ev of MONK_EVIDENCE){let b=btn('',()=>{q.activeEvidence=ev.id;if(!q.examined.includes(ev.id)){q.examined.push(ev.id);window.SFX?.play('paper-rustle',{volume:.75})}else window.SFX?.play('ui-tap-soft',{volume:.7});delete q.feedback;save();render()},'monk-evidence'+(q.activeEvidence===ev.id?' selected':''));b.innerHTML=`<span class="monk-evidence-mark">${ev.mark}</span><span><strong>${ev.name}</strong><small>${q.examined.includes(ev.id)?'已查验 · '+ev.title:'点击展开查验'}</small></span>`;b.setAttribute('aria-pressed',String(q.activeEvidence===ev.id));aside.append(b);}
 const ev=MONK_EVIDENCE.find(e=>e.id===q.activeEvidence);
 let detail=div('monk-evidence-detail');if(ev){detail.innerHTML=`<div class="eyebrow">${ev.title}</div><blockquote>${ev.text}</blockquote><p>${ev.detail}</p><div class="monk-evidence-clue">${ev.clue}</div>`;}else detail.innerHTML='<div class="eyebrow">纸上留痕</div><h3>路藏在线索之间</h3><p>三件物品可以随时翻看。残笺、草图和追记，各自保留了一部分道路信息。</p>';
 aside.append(detail);let companion=div('monk-companion');companion.append(monkPortrait(),div('','<strong>行脚僧</strong><p>“字迹缺了，可以相互参照。”</p>'));aside.append(companion);grid.append(aside);
 let stage=div('monk-map-panel');stage.append(div('monk-map-label','<span>清隐院寻寺草图</span><small>上北下南 · 剧情虚构路线</small>'));
 let map=div('monk-map');map.innerHTML=monkMapSvg();
 const coords={bridge:[72,37],ford:[72,78],market:[48,37],outside:[48,78],pair:[26,37],willow:[26,78],temple:[15,14],store:[10,60]};
 let step=Math.min(q.route.length,3);if(q.route.length<4)map.dataset.step=String(step);
 MONK_STEPS.forEach((item,i)=>item.options.forEach(([id,label])=>{let chosen=q.route[i]===id;let b=btn(label,()=>{if(i>q.route.length){q.feedback={kind:'info',text:'先从东侧起点辨路：渡水、入市、辨树，再选折向。'};window.SFX?.play('error-soft',{volume:.7});save();render();return;}q.route=q.route.slice(0,i);q.route.push(id);delete q.feedback;save();window.SFX?.play('woodfish',{volume:.75});render()},'monk-map-node'+(chosen?' chosen':'')+(i===q.route.length?' available':''));b.dataset.landmark=id;b.style.left=coords[id][0]+'%';b.style.top=coords[id][1]+'%';b.setAttribute('aria-pressed',String(chosen));b.setAttribute('aria-label',`${item.name}：${label}`);map.append(b)}));
 map.append(div('monk-start','你们在此'));stage.append(map);
 let route=div('monk-route-slots');MONK_STEPS.forEach((s,i)=>{let slot=div('monk-route-slot'+(q.route[i]?' filled':''));slot.innerHTML=`<small>${i+1} · ${s.name}</small><span>${s.options.find(x=>x[0]===q.route[i])?.[1]||'待辨认'}</span>`;route.append(slot)});stage.append(route);
 let feedback=div('monk-puzzle-feedback');feedback.setAttribute('role','status');feedback.textContent=q.feedback?.text||(q.route.length===4?'路线已标出。对照三件线索，再交给僧人。':`接下来：${MONK_STEPS[q.route.length].name}。在草图上点击相应路标。`);if(q.feedback?.kind)feedback.dataset.kind=q.feedback.kind;stage.append(feedback);
 let actions=div('monk-map-actions');let undo=btn('撤回一步',()=>{q.route.pop();delete q.feedback;save();window.SFX?.play('ui-tap-soft',{volume:.7});render()},'monk-secondary');undo.disabled=!q.route.length;actions.append(undo,btn('请师父提示',()=>{const i=q.route.findIndex((x,n)=>x!==MONK_ANSWER[n]);const index=i>=0?i:Math.min(q.route.length,3);q.feedback={kind:'info',text:MONK_HINTS[index]};window.SFX?.play('notice',{volume:.6});save();render()},'monk-secondary'),btn('将路线指给僧人 →',()=>{
 if(q.examined.length<3){q.feedback={kind:'info',text:'还有线索未查验。先把残笺、草图与追记都展开看看。'};}
 else if(q.route.length<4){q.feedback={kind:'info',text:'还未指到山门。请依次补齐四处路标。'};}
 else{const wrong=q.route.findIndex((x,i)=>x!==MONK_ANSWER[i]);if(wrong===-1){window.SFX?.play('chime-complete',{volume:.7});monkAdvance('found');return;}q.attempts++;q.feedback={kind:'retry',text:'这一路还有一处对不上。'+MONK_HINTS[wrong]+' 点击那一处路标即可改道。'};window.SFX?.play('error-soft',{volume:.75});}
 save();render();},'monk-primary'));stage.append(actions);grid.append(stage);shell.append(grid);
}
function monkMapSvg(){return `<svg viewBox="0 0 900 500" preserveAspectRatio="none" aria-hidden="true">
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
 <path class="map-water" d="M660 -30 C620 80 690 180 633 270 S605 450 661 530"/>
 <path class="map-water-edge" d="M640 0 C600 95 673 180 614 270 S590 450 640 500 M680 0 C640 95 708 180 650 275 S628 450 679 500"/>
 <g class="map-road"><path d="M850 185 L655 185 L432 185 L234 185 L135 70"/><path d="M850 185 L805 390 L648 390 L432 390 L234 390 L90 300"/><path d="M234 185 L90 300 M234 390 L135 70"/></g>
 <g class="map-bridge"><path d="M617 167 L678 167 M617 202 L678 202 M620 159 L620 208 M675 159 L675 208 M631 167 L631 202 M642 167 L642 202 M653 167 L653 202 M664 167 L664 202"/></g>
 <g class="map-ripples"><path d="M624 336 l20 -4 19 5 M618 355 l17 -4 20 4 M633 413 l15 -4 17 5"/></g>
 <g class="map-houses"><path d="M355 151 l30 -24 31 24 M364 149 v23 h43 v-23 M436 151 l28 -22 28 22 M444 149 v24 h40 v-24 M350 227 l29 -23 29 23 M360 226 v24 h39 v-24 M436 229 l28 -25 31 25 M445 226 v24 h39 v-24"/></g>
 <g class="map-trees"><path d="M212 160 v-40 m-3 5 c-36 8 -40 -29 -10 -34 c-10 -27 36 -35 37 -8 c30 -1 28 38 -1 40 M253 159 v-40 m-4 5 c-34 8 -35 -24 -12 -30 c-12 -24 30 -37 35 -13 c27 -5 35 30 6 39 M231 366 v-56 m0 8 c-38 -20 -43 9 -41 24 m41 -23 c27 -27 45 -6 46 15 m-47 -9 c-12 4 -16 18 -12 30"/></g>
 <g class="map-temple"><path d="M100 47 l35 -22 35 22 M109 47 v28 h53 v-28 M125 75 V56 h20 v19 M99 44 h72 M98 82 h76"/></g>
 <g class="map-houses"><path d="M57 277 l33 -20 35 20 M65 276 v28 h52 v-28 M77 304 v-17 h25 v17"/></g>
</g><g class="map-calligraphy"><text x="823" y="159">起</text><text x="705" y="90">水</text><text x="510" y="440">城外</text><text x="850" y="46">北 ↑</text><text x="48" y="463">循水入市 · 见树折巷</text></g></svg>`;}
