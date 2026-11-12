export async function dissolveText(element,host,reduced){
 if(reduced){element.style.opacity='0';return;}
 const r=element.getBoundingClientRect(),hr=host.getBoundingClientRect(),s=getComputedStyle(element),c=document.createElement('canvas');c.width=host.clientWidth;c.height=host.clientHeight;c.className='fortune-particles';host.append(c);const ctx=c.getContext('2d'),mask=document.createElement('canvas');mask.width=c.width;mask.height=c.height;const m=mask.getContext('2d');m.font=s.font;m.letterSpacing=s.letterSpacing;m.textAlign='center';m.textBaseline='middle';m.fillStyle='#fff';m.fillText(element.textContent,r.left+r.width/2-hr.left,r.top+r.height/2-hr.top);const data=m.getImageData(0,0,c.width,c.height).data,points=[];
 for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2)if(data[(y*c.width+x)*4+3]>100)points.push({x,y,dx:(Math.random()-.5)*65,dy:-15-Math.random()*45,release:Math.random()*.28});
 const start=performance.now();await new Promise(resolve=>{function tick(t){
  if(!host.isConnected||!element.isConnected){c.remove();resolve();return;}
  const p=Math.min(1,(t-start)/2000);element.style.opacity=String(Math.max(0,1-p/.34));ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#c7b58d';
  for(const q of points){const drift=Math.max(0,(p-q.release)/(1-q.release)),alpha=Math.min(1,p/.18)*Math.pow(1-drift,1.4)*.7;ctx.globalAlpha=alpha;ctx.fillRect(q.x+q.dx*drift*drift,q.y+q.dy*drift,1.2,1.2);}
  if(p<1)requestAnimationFrame(tick);else{element.style.opacity='0';c.remove();resolve();}
 }requestAnimationFrame(tick);});
}
