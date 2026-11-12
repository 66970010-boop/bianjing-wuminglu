/* Presentation only: all names, locations and relationships come from the original game. */
function showPaintingRelations(){
 const known=SCROLL_NPCS.filter(p=>state.met[p.id]);
 if(!known.length){toast('先在画卷中认识一位人物，再回望他们的位置。');return;}
 const previous=document.activeElement;
 const overlay=div('painting-projection');overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','画中回望');window.SFX?.play('scroll-open',{volume:.55});
 const heading=div('projection-heading','<div class="eyebrow">人间羁绊 · 画中回望</div><h2>相逢皆在此卷中</h2>');
 const close=btn('返回人间羁绊',dispose,'projection-close');
 const stage=div('projection-stage'),world=div('projection-world');
 const art=document.createElement('img');art.src=SCROLL_ART.src;art.alt='清明上河图中的人物位置';world.append(art);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 14794 700');svg.classList.add('projection-lines');
 const confirmed=relations.filter(r=>state.met[r.a]&&state.met[r.b]);
 confirmed.forEach((r,i)=>{const a=SCROLL_NPCS.find(p=>p.id===r.a),b=SCROLL_NPCS.find(p=>p.id===r.b);const path=document.createElementNS(svg.namespaceURI,'path');const ax=a.x*14794,ay=a.y*700,bx=b.x*14794,by=b.y*700;path.setAttribute('d',`M ${ax} ${ay} Q ${(ax+bx)/2} ${Math.min(ay,by)-Math.min(280,Math.abs(ax-bx)*.12)} ${bx} ${by}`);path.setAttribute('pathLength','1');path.style.setProperty('--delay',`${900+i*550}ms`);const title=document.createElementNS(svg.namespaceURI,'title');title.textContent=r.title;path.append(title);svg.append(path);});
 world.append(svg);
 known.forEach((p,i)=>{const pin=btn(p.label,()=>{status.textContent=people[p.id].bio;},'projection-person');pin.style.left=p.x*100+'%';pin.style.top=p.y*100+'%';pin.style.setProperty('--delay',`${550+i*180}ms`);world.append(pin);});
 stage.append(world);
 const status=div('projection-status',`已相遇 ${known.length} 人 · 已确认 ${confirmed.length} 条关系`);status.setAttribute('aria-live','polite');
 overlay.append(heading,close,stage,status);document.body.append(overlay);close.focus();
 let frame=0,started=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function fit(){const width=stage.clientWidth,height=stage.clientHeight;const target=Math.min(width/14794,height/700),x=(width-14794*target)/2,y=(height-700*target)/2;world.style.setProperty('--projection-scale',target);world.style.setProperty('--pin-scale',1/target);world.style.setProperty('--projection-x',x+'px');world.style.setProperty('--projection-y',y+'px');
  if(!started){const from=Math.max(target,Math.min(height/700,width/3400));const p=known[0];world.style.transform=`translate(${width/2-p.x*14794*from}px,${height/2-p.y*700*from}px) scale(${from})`;frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{if(!overlay.isConnected)return;overlay.classList.add('projection-ready');world.style.transform=`translate(${x}px,${y}px) scale(${target})`;started=true;});});}else world.style.transform=`translate(${x}px,${y}px) scale(${target})`;
 }
 const observer=new ResizeObserver(fit);observer.observe(stage);
 function escape(e){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();dispose();}if(e.key==='Tab'){const buttons=[...overlay.querySelectorAll('button')],first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}
 document.addEventListener('keydown',escape,true);
 function dispose(){cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('keydown',escape,true);overlay.remove();previous?.focus();}
 if(reduced)overlay.classList.add('projection-reduced');
}
