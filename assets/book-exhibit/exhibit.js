/* Scroll exhibition. Presentation reads existing people/relations; never writes story progress. */
(()=>{
 const originalBook=renderBook,previousRender=render;
 render=function(){window.bookExhibitCleanup?.();return previousRender.apply(this,arguments)};
 renderBook=function(root){if(bookTab==='people'&&bookSelection&&state.met[bookSelection]){originalBook(root);const portrait=root.querySelector('.person-portrait img');if(portrait)portrait.src='assets/book-exhibit/people/'+bookSelection+'.webp';return;}mount(root)};
 function mount(root){
 const events=new AbortController(),signal=events.signal,reduced=matchMedia('(prefers-reduced-motion: reduce)'),ids=['drinks','barber','baker','boat','merchant','monk','fortune'];
 const layout={barber:[40,10,300,1],boat:[130,-5,350,1],fortune:[310,35,310,1],drinks:[-5,170,300,3],monk:[230,170,340,3],baker:[35,330,300,5],merchant:[280,350,300,5]};
 const available=relations.filter(r=>state.dayStory?.heard?.[r.a]||state.dayStory?.heard?.[r.b]);
 const data=bookTab==='relations'?available:ids;let selected=-1,raf=0,scale=1,target=0,displayed=0,sectionHeight=700,disposed=false;
 const scroller=div('book-exhibit'),rail=div('exhibit-rail'),view=div('exhibit-view'),stage=div('exhibit-stage');window.SFX?.play('paper-unfold',{volume:.55});
 const head=div('exhibit-head');head.append(div('eyebrow','一日手记 · 记录与发现'),div('exhibit-title','无名录'),div('exhibit-intro','《无名录》是你的行旅记录册，收录相遇的人与他们之间的羁绊。'));
 const tabs=div('exhibit-tabs');for(const [id,label] of [['people','人物小传'],['relations','人间羁绊']]){const b=btn(label,()=>{bookTab=id;bookSelection=null;render()},id===bookTab?'active':'');b.setAttribute('aria-pressed',String(id===bookTab));tabs.append(b)}head.append(tabs);
 const group=div('exhibit-group'),figures={};
 function portrait(id,cls){const p=document.createElement('img');p.src='assets/book-exhibit/people/'+id+'.webp';p.alt=people[id].name;p.className=cls;p.draggable=false;return p}
 for(const id of ids){const [x,y,h,z]=layout[id],b=btn('',()=>seek(ids.indexOf(id)),'exhibit-person');b.style.cssText=`left:${x}px;top:${y}px;height:${h}px;z-index:${z}`;b.style.setProperty('--arrival',ids.indexOf(id)*35+'ms');b.append(portrait(id,'exhibit-original'));b.setAttribute('aria-label',people[id].name+(state.met[id]?'':' · 尚未相逢'));figures[id]=b;group.append(b)}
 const ns='http://www.w3.org/2000/svg',lines=document.createElementNS(ns,'svg');lines.classList.add('exhibit-bonds');lines.setAttribute('viewBox','0 0 680 700');group.append(lines);
 const reel=div('exhibit-reel'),chapters=[];
 data.forEach((item,i)=>{const c=div('exhibit-chapter'),copy=div('exhibit-copy');const related=bookTab==='people'?[item]:[item.a,item.b];
 const known=bookTab==='people'?state.met[item]:true;
 copy.append(div('exhibit-number',bookTab==='people'?`${String(i+1).padStart(2,'0')} / 07`:'人间羁绊 · 今日相逢'));
 const h=document.createElement('h2');h.textContent=bookTab==='people'?people[item].name:item.title;copy.append(h);
 if(bookTab==='people'){
 copy.append(div('exhibit-role',known?people[item].role:'画中人 · 尚未相逢'));
 copy.append(div('exhibit-bio',known?people[item].bio:'这一页尚未写下。回到画卷，与他相逢后，人物小传会记在这里。'));
 if(known){const heard=state.dayStory?.heard?.[item];copy.append(div('exhibit-note',heard?'已听过故事':state.played[item]?'已参与营生':'已相逢 · 故事待听'));copy.append(btn('翻看小传与线索 →',()=>{bookSelection=item;render()},'exhibit-action'))}else copy.append(btn('回画卷寻访 →',()=>go('scroll'),'exhibit-action'));
 }else{
 const a=!!state.dayStory?.heard?.[item.a],b=!!state.dayStory?.heard?.[item.b],both=a&&b;
 copy.append(div('exhibit-role',both?people[item.a].name+' · '+people[item.b].name:people[a?item.a:item.b].name+' · 另一端待寻访'));
 copy.append(div('exhibit-bio',both?item.done:(a?item.fromA:item.fromB)));
 if(!both)copy.append(div('exhibit-note',a?item.seekA:item.seekB));else copy.append(div('exhibit-note','关系已确认'));
 copy.append(btn('返回画卷寻访 →',()=>go('scroll'),'exhibit-action'));
 }
 c.append(copy);related.forEach((id,j)=>{if(bookTab==='relations'&&!state.dayStory?.heard?.[id])return;const large=portrait(id,'exhibit-large');large.classList.toggle('pair',related.length===2);large.style.setProperty('--pair',j);c.append(large)});reel.append(c);chapters.push(c);
 });
 if(!data.length)reel.append(div('exhibit-empty','人间羁绊\n这一页尚未写下。听见人物提起熟人后，再回来看看。'),btn('返回画卷 →',()=>go('scroll'),'exhibit-action'));
 const portal=div('exhibit-portal','无名录');const prologue=div('exhibit-prologue','一卷人间，见字如面。');const progress=div('exhibit-progress'),status=div('exhibit-status','向下展开 ↓');
 (bookTab==='people'?ids:data).forEach((item,i)=>{const label=bookTab==='people'?people[item].name:item.title;const b=btn(String(i+1).padStart(2,'0'),()=>seek(i,true),'exhibit-dot');b.setAttribute('aria-label','查看'+label);b.title=label;progress.append(b)});
 const tail=div('exhibit-tail','这一日，相逢仍在画中。');tail.append(btn('继续游卷 →',()=>go('scroll'),'exhibit-action'));if(Object.keys(state.met).length)tail.append(btn('画中回望 →',()=>showPaintingRelations(),'exhibit-action'));
 stage.append(head,group,reel,portal,prologue,progress,status);view.append(stage);rail.append(view);scroller.append(rail,tail);root.append(scroller);scroller.tabIndex=0;scroller.setAttribute('aria-label','无名录人物展览，向下滚动逐位阅读，方向键或底部编号也可导航');
 function seek(i,direct=false){if(bookTab==='relations'&&!direct){const match=data.findIndex(r=>r.a===ids[i]||r.b===ids[i]);if(match<0){toast('这段关系尚未记下，先回画卷听听他们的故事。');return}i=match}window.SFX?.play('page-turn',{volume:.55});scroller.scrollTo({top:(i+1)*sectionHeight,behavior:reduced.matches?'instant':'smooth'})}
 function draw(){raf=0;if(disposed)return;const delta=target-displayed;displayed=reduced.matches?target:displayed+Math.sign(delta)*Math.min(Math.abs(delta),.085);const p=displayed,entrance=Math.min(1,p),step=p-1;
 group.style.opacity=String(.2+.8*Math.min(1,p*2));group.style.transform=`translate(${500-365*entrance}px,180px) scale(${1.12-.02*entrance})`;portal.style.opacity=String(1-Math.min(1,p*1.7));portal.style.transform=`translate(-50%,-50%) scale(${1+p*4})`;prologue.style.opacity=String(1-entrance);reel.style.opacity=String(entrance);
 const index=Math.min(data.length-1,Math.max(0,Math.round(step)));if(selected!==index){selected=index;stage.dataset.current=bookTab==='people'?data[index]||'':data[index]?.id||'';status.textContent=index>=0?`${String(index+1).padStart(2,'0')} / ${String(data.length).padStart(2,'0')} · 向下展开`:'向下展开 ↓';
 lines.replaceChildren();if(bookTab==='relations'&&data[index]){const rel=data[index];if(state.dayStory?.heard?.[rel.a]&&state.dayStory?.heard?.[rel.b]){const path=document.createElementNS(ns,'path'),a=layout[rel.a],b=layout[rel.b];path.setAttribute('d',`M ${a[0]+90} ${a[1]+100} Q 270 250 ${b[0]+90} ${b[1]+100}`);lines.append(path)}}}
 for(const [id,fig] of Object.entries(figures)){let weight=0;if(bookTab==='people'){const i=ids.indexOf(id);weight=Math.max(0,1-Math.abs(step-i))}else data.forEach((rel,i)=>{if((rel.a===id||rel.b===id)&&state.dayStory?.heard?.[id])weight=Math.max(weight,Math.max(0,1-Math.abs(step-i)))});fig.style.opacity=String(.83+.17*weight);fig.style.filter=weight>.1?`drop-shadow(0 0 ${weight*.8}px #f0dcac)`:'none';fig.style.scale=String(1+weight*.035)}
 chapters.forEach((c,i)=>{const d=i-step;c.style.transform=`translateY(${d*760}px)`;c.style.opacity=String(Math.max(0,1-Math.abs(d)));c.style.visibility=Math.abs(d)<1.35?'visible':'hidden';c.inert=Math.abs(d)>.5;const entering=Math.max(0,d);c.querySelector('h2')?.style.setProperty('translate','0 '+(-entering*18)+'px');c.querySelectorAll('.exhibit-bio,.exhibit-note,.exhibit-action').forEach(el=>{el.style.opacity=String(Math.max(0,1-entering*1.6));el.style.translate='0 '+(entering*22)+'px'})});
 [...progress.children].forEach((b,i)=>{b.classList.toggle('active',i===index);b.setAttribute('aria-current',i===index?'step':'false')});
 if(Math.abs(target-displayed)>.001)raf=requestAnimationFrame(draw);
 }
 function update(){target=Math.min(data.length+.3,Math.max(0,scroller.scrollTop/sectionHeight));if(!raf)raf=requestAnimationFrame(draw)}
 function resize(){const normalized=scroller.scrollTop/sectionHeight;const w=scroller.clientWidth,h=scroller.clientHeight;sectionHeight=Math.max(500,h*.9);view.style.height=h+'px';rail.style.height=((Math.max(1,data.length)+1.35)*sectionHeight+h)+'px';scale=Math.min(w/1600,h/1000);if(w<700)scale=Math.min(w/800,h/1750);stage.style.setProperty('--exhibit-scale',scale);stage.style.left=((w-(w<700?800:1600)*scale)/2)+'px';view.classList.toggle('compact',w<700);scroller.scrollTop=normalized*sectionHeight;update()}
 scroller.addEventListener('scroll',update,{signal,passive:true});scroller.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<1||e.ctrlKey)return;const max=sectionHeight*.45;if(Math.abs(e.deltaY)>max){e.preventDefault();scroller.scrollTop+=Math.sign(e.deltaY)*max}},{signal,passive:false});scroller.addEventListener('keydown',e=>{if(e.target.closest('button,a'))return;if(['ArrowDown','ArrowRight','PageDown','ArrowUp','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();const dir=['ArrowUp','ArrowLeft','PageUp'].includes(e.key)?-1:1;scroller.scrollTo({top:Math.max(0,Math.round(scroller.scrollTop/sectionHeight)+dir)*sectionHeight,behavior:reduced.matches?'instant':'smooth'})}},{signal});const observer=new ResizeObserver(resize);observer.observe(scroller);resize();if(bookTab==='relations'&&bookSelection){const i=data.findIndex(r=>r.id===bookSelection);if(i>=0){scroller.scrollTop=(i+1)*sectionHeight;update()}}draw();
 window.bookExhibitCleanup=()=>{disposed=true;events.abort();observer.disconnect();cancelAnimationFrame(raf);window.bookExhibitCleanup=null};
 }
})();
