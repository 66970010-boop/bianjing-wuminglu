/* Original local directional-flow implementation. No radial wave oscillator.
   Semi-Lagrangian velocity/displacement advection + pressure projection, rendered with WebGL. */
window.mountPaintingRefraction=function(root,viewport,painting){
 const fine=matchMedia('(hover:hover) and (pointer:fine)'),reduce=matchMedia('(prefers-reduced-motion:reduce)'),events=new AbortController(),signal=events.signal;
 const crop=document.createElement('canvas'),ctx=crop.getContext('2d',{alpha:false});
 let host,canvas,gl,program,buffer,imageTexture,flowTexture,grid,raf=0,disposed=false,failed=false,dirty=true,last=null,until=0,clock=0,accumulator=0,fieldScroll=viewport.scrollLeft,dragWeight=1;
 const pending=[],uniforms={},resources=[];let width=1,height=1;
 // Lens samples only the original painting: NPCs, captions and other UI never enter its pixels.
 const pointer=document.createElement('div');pointer.className='painting-flow-pointer';pointer.hidden=true;pointer.setAttribute('aria-hidden','true');
 const lens=document.createElement('canvas'),frame=document.createElement('img');lens.className='painting-lens';frame.className='painting-lens-frame';frame.alt='';frame.width=frame.height=128;pointer.append(lens,frame);
 const glint=document.createElementNS('http://www.w3.org/2000/svg','svg');glint.setAttribute('viewBox','0 0 96 96');glint.classList.add('painting-lens-glint');glint.innerHTML='<path d="M 12 36 A 25 25 0 0 1 35 12" fill="none" stroke="#d1b780" stroke-width=".9" stroke-linecap="round" opacity=".6"/>';pointer.append(glint);
 const source=document.createElement('canvas'),sourceCtx=source.getContext('2d',{willReadFrequently:true}),lensCtx=lens.getContext('2d');
 const POINTER_SIZE=128,HOTSPOT=28*128/72,LENS_RADIUS=36;let pointerReady=false,lensFrame=0,mouse=null,lastPointerInput=null;
 function hidePointer(){pointer.hidden=true;cancelAnimationFrame(lensFrame);lensFrame=0;}
 function pointerMode(){viewport.classList.toggle('flow-pointer-ready',pointerReady&&fine.matches);if(!fine.matches)hidePointer();}
 function renderLens(){lensFrame=0;if(pointer.hidden||!mouse||!sourceCtx||!lensCtx||!painting.naturalWidth)return;try{
  const ratio=Math.min(Math.max(devicePixelRatio||1,2),2),n=Math.round(POINTER_SIZE*ratio),k=n/POINTER_SIZE,c=HOTSPOT*k,r=LENS_RADIUS*k;
  if(lens.width!==n){lens.width=lens.height=source.width=source.height=n;}
  sourceCtx.clearRect(0,0,n,n);const ir=painting.getBoundingClientRect(),scale=painting.naturalWidth/ir.width;
  sourceCtx.drawImage(painting,(mouse.x-ir.left-HOTSPOT)*scale,(mouse.y-ir.top-HOTSPOT)*scale,POINTER_SIZE*scale,POINTER_SIZE*scale,0,0,n,n);
  const src=sourceCtx.getImageData(0,0,n,n).data,out=lensCtx.createImageData(n,n),dst=out.data;
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const dx=x-c,dy=y-c,d=Math.hypot(dx,dy)/r;if(d>=1)continue;
   // Monotone barrel map: 2.3x at the optical centre, with increasing compression/bending at the rim.
   // f(d)=d*(a+(1-a)*d^4) joins the unchanged painting at d=1 without folds.
   const radial=1/2.3+(1-1/2.3)*d*d*d*d,sx=c+dx*radial,sy=c+dy*radial;
   const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy,offset=(y*n+x)*4;
   for(let channel=0;channel<4;channel++){const q=(iy*n+ix)*4+channel;dst[offset+channel]=(src[q]*(1-fx)+src[q+4]*fx)*(1-fy)+(src[q+n*4]*(1-fx)+src[q+n*4+4]*fx)*fy;}
   dst[offset+3]*=Math.min(1,(1-d)*r);
  }lensCtx.putImageData(out,0,0);
 }catch(e){lensCtx.clearRect(0,0,lens.width,lens.height);}}
 function scheduleLens(){if(!pointer.hidden&&!lensFrame)lensFrame=requestAnimationFrame(renderLens);}
 frame.addEventListener('load',()=>{pointerReady=true;pointerMode();if(lastPointerInput)updatePointer(lastPointerInput);},{signal});frame.addEventListener('error',()=>{pointerReady=false;pointerMode();hidePointer();},{signal});document.body.append(pointer);frame.src='assets/cursors/scroll-magnifier-original.png';
 function updatePointer(e){lastPointerInput=e;const active=pointerReady&&fine.matches&&e.pointerType!=='touch'&&!e.buttons&&viewport.contains(e.target)&&(!e.target.closest('button,a,[role=button],.story-guide')||Boolean(e.target.closest('.npc-seal')));
  if(!active){hidePointer();return;}pointer.hidden=false;mouse={x:e.clientX,y:e.clientY};pointer.style.transform='translate3d('+(e.clientX-HOTSPOT)+'px,'+(e.clientY-HOTSPOT)+'px,0)';scheduleLens();}
 document.addEventListener('pointermove',updatePointer,{signal,passive:true});document.addEventListener('pointerup',updatePointer,{signal,passive:true});document.addEventListener('visibilitychange',hidePointer,{signal});
 viewport.addEventListener('pointerleave',hidePointer,{signal});viewport.addEventListener('pointerdown',hidePointer,{signal});viewport.addEventListener('scroll',scheduleLens,{signal,passive:true});window.addEventListener('resize',scheduleLens,{signal});window.addEventListener('blur',hidePointer,{signal});fine.addEventListener('change',pointerMode,{signal});
 const allowed=()=>fine.matches&&!reduce.matches&&!document.hidden&&!failed&&!disposed;
 class FlowGrid{
  constructor(w,h){this.w=w;this.h=h;this.n=w*h;for(const key of ['x','y','u','v','dx','dy','du','dv','pressure','swap','div'])this[key]=new Float32Array(this.n);this.pixels=new Uint8Array(this.n*4);}
  sample(a,x,y){if(x<0||y<0||x>this.w-1||y>this.h-1)return 0;const i=Math.floor(x),j=Math.floor(y),fx=x-i,fy=y-j,k=j*this.w+i,r=Math.min(i+1,this.w-1)+j*this.w,b=Math.min(j+1,this.h-1)*this.w;return (a[k]*(1-fx)+a[r]*fx)*(1-fy)+(a[b+i]*(1-fx)+a[b+Math.min(i+1,this.w-1)]*fx)*fy;}
  translate(shift){if(!shift)return;for(const [a,b] of [['x','u'],['y','v'],['dx','du'],['dy','dv']]){for(let j=0;j<this.h;j++)for(let i=0;i<this.w;i++)this[b][j*this.w+i]=this.sample(this[a],i+shift,j);[this[a],this[b]]=[this[b],this[a]];}}
  inject(edge,scroll,budget=48){const sx=this.w/width,sy=this.h/height,ax=edge.a.x-scroll,ay=edge.a.y,bx=edge.b.x-scroll,by=edge.b.y,ex=bx-ax,ey=by-ay;
   const length=Math.hypot(ex,ey),screenLength=Math.hypot(edge.b.sx-edge.a.sx,edge.b.sy-edge.a.sy);if(screenLength<.1)return 0;
   const nx=(edge.b.sx-edge.a.sx)/screenLength,ny=(edge.b.sy-edge.a.sy)/screenLength;
   const n=Math.min(budget,Math.max(1,Math.ceil(length/8))),force=Math.min(screenLength,80)*.95*edge.weight/n;
   const radius=30,rx=Math.ceil(radius*2*sx),ry=Math.ceil(radius*2*sy);
   for(let k=1;k<=n;k++){const px=(ax+ex*k/n)*sx,py=(ay+ey*k/n)*sy;
    for(let j=Math.max(1,Math.floor(py-ry));j<=Math.min(this.h-2,Math.ceil(py+ry));j++)for(let i=Math.max(1,Math.floor(px-rx));i<=Math.min(this.w-2,Math.ceil(px+rx));i++){
     const qx=(i-px)/sx,qy=(j-py)/sy,along=(qx*nx+qy*ny)/radius,across=(-qx*ny+qy*nx)/radius;
     const envelope=Math.exp(-along*along*.8-across*across*2.1),side=across*Math.exp(-across*across)*.45,idx=j*this.w+i;
     this.x[idx]+=force*envelope*(nx-ny*side);this.y[idx]+=force*envelope*(ny+nx*side);
    }
   }
   return n;
  }
  step(dt){const w=this.w,h=this.h,sx=w/width,sy=h/height,damp=Math.exp(-dt*4.8),restore=Math.exp(-dt*3.1);
   // Backtrace velocity through its own field; no periodic/radial forcing.
   for(let j=1;j<h-1;j++)for(let i=1;i<w-1;i++){const k=j*w+i,px=i-this.x[k]*dt*sx,py=j-this.y[k]*dt*sy;
    this.u[k]=(this.sample(this.x,px,py)*.96+(this.x[k-1]+this.x[k+1]+this.x[k-w]+this.x[k+w])*.01)*damp;
    this.v[k]=(this.sample(this.y,px,py)*.96+(this.y[k-1]+this.y[k+1]+this.y[k-w]+this.y[k+w])*.01)*damp;
   }[this.x,this.u]=[this.u,this.x];[this.y,this.v]=[this.v,this.y];
   // Approximate incompressibility produces lateral separation and shear instead of rings.
   this.pressure.fill(0);this.swap.fill(0);
   for(let j=1;j<h-1;j++)for(let i=1;i<w-1;i++){const k=j*w+i;this.div[k]=(this.x[k+1]-this.x[k-1]+this.y[k+w]-this.y[k-w])*.5;}
   for(let pass=0;pass<8;pass++){for(let j=1;j<h-1;j++)for(let i=1;i<w-1;i++){const k=j*w+i;this.swap[k]=(this.pressure[k-1]+this.pressure[k+1]+this.pressure[k-w]+this.pressure[k+w]-this.div[k])*.25;}[this.pressure,this.swap]=[this.swap,this.pressure];}
   for(let j=1;j<h-1;j++)for(let i=1;i<w-1;i++){const k=j*w+i;
    this.x[k]-=(this.pressure[k+1]-this.pressure[k-1])*.5;this.y[k]-=(this.pressure[k+w]-this.pressure[k-w])*.5;
    const speed=Math.hypot(this.x[k],this.y[k]),limit=Math.min(1,170/Math.max(1,speed));this.x[k]*=limit;this.y[k]*=limit;
    const px=i-this.x[k]*dt*sx,py=j-this.y[k]*dt*sy;
    this.du[k]=Math.max(-14,Math.min(14,(this.sample(this.dx,px,py)+this.x[k]*dt)*restore));
    this.dv[k]=Math.max(-14,Math.min(14,(this.sample(this.dy,px,py)+this.y[k]*dt)*restore));
   }[this.dx,this.du]=[this.du,this.dx];[this.dy,this.dv]=[this.dv,this.dy];
  }
  encode(){for(let i=0;i<this.n;i++){this.pixels[i*4]=Math.round(128+this.dx[i]/14*127);this.pixels[i*4+1]=Math.round(128+this.dy[i]/14*127);this.pixels[i*4+2]=Math.round(Math.min(255,Math.hypot(this.x[i],this.y[i])*1.5));this.pixels[i*4+3]=255;}return this.pixels;}
 }
 function destroy(){cancelAnimationFrame(raf);raf=0;pending.length=0;last=null;clock=accumulator=0;until=0;if(gl){for(const [type,obj] of resources.splice(0))gl[type](obj);gl.getExtension('WEBGL_lose_context')?.loseContext();}host?.remove();host=canvas=gl=program=buffer=imageTexture=flowTexture=grid=null;dirty=true;}
 function compile(type,source){const sh=gl.createShader(type);resources.push(['deleteShader',sh]);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
 function texture(unit){const t=gl.createTexture();resources.push(['deleteTexture',t]);gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);for(const p of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,p,gl.LINEAR);for(const p of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,p,gl.CLAMP_TO_EDGE);return t;}
 function init(){if(gl)return true;if(!allowed()||!ctx||!painting.naturalWidth)return false;try{
  host=document.createElement('div');host.className='painting-refraction';host.style.visibility='hidden';canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');host.append(canvas);root.append(host);
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,preserveDrawingBuffer:false});if(!gl)throw Error('WebGL unavailable');
  program=gl.createProgram();resources.push(['deleteProgram',program]);gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision highp float;varying vec2 uv;uniform sampler2D picture;uniform sampler2D field;uniform vec2 size;uniform vec2 texel;uniform float fade;
   vec2 displacement(vec2 p){return (texture2D(field,p).rg*255.-128.)/127.*14.;}
   void main(){vec2 flow=displacement(uv)*fade;vec2 sampleUV=clamp(uv+flow/size,vec2(.0001),vec2(.9999));vec3 color=texture2D(picture,sampleUV).rgb;
    vec2 dx=displacement(uv+vec2(texel.x,0.))-displacement(uv-vec2(texel.x,0.));vec2 dy=displacement(uv+vec2(0.,texel.y))-displacement(uv-vec2(0.,texel.y));
    float slope=clamp((dy.x-dx.y)*.22+(dx.x-dy.y)*.12,-1.,1.)*fade;
    float activity=smoothstep(.15,2.2,length(flow));float kinetic=texture2D(field,uv).b;float sheen=smoothstep(.015,.18,kinetic);float highlight=max(0.,slope)*.045*activity*sheen;float shade=max(0.,-slope)*.03*activity*sheen;
    color=mix(color,vec3(1.,.93,.76),highlight);color*=1.-shade;gl_FragColor=vec4(color,1.);
   }`));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  buffer=gl.createBuffer();resources.push(['deleteBuffer',buffer]);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
  imageTexture=texture(0);flowTexture=texture(1);for(const key of ['picture','field','size','texel','fade'])uniforms[key]=gl.getUniformLocation(program,key);gl.uniform1i(uniforms.picture,0);gl.uniform1i(uniforms.field,1);
  const r=viewport.getBoundingClientRect();width=r.width;height=r.height;const gw=Math.min(192,Math.max(64,Math.round(width/8)));grid=new FlowGrid(gw,Math.max(32,Math.round(gw*height/width)));fieldScroll=viewport.scrollLeft;dirty=true;
  const ownCanvas=canvas;ownCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();if(ownCanvas===canvas){failed=true;destroy();}},{signal});return true;
 }catch(e){console.warn('画卷流动回退原画',e);failed=true;destroy();return false;}}
 function upload(){const r=viewport.getBoundingClientRect(),ir=painting.getBoundingClientRect(),rr=root.getBoundingClientRect();width=r.width;height=r.height;const ratio=Math.min(devicePixelRatio||1,1.25,2048/width,1400/height,gl.getParameter(gl.MAX_TEXTURE_SIZE)/Math.max(width,height));
  const w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=crop.width=w;canvas.height=crop.height=h;}
  host.style.cssText=`position:absolute;left:${r.left-rr.left}px;top:${r.top-rr.top}px;width:${width}px;height:${height}px;visibility:hidden`;canvas.style.cssText='width:100%;height:100%;display:block';
  const scale=painting.naturalWidth/ir.width;ctx.drawImage(painting,(r.left-ir.left)*scale,(r.top-ir.top)*scale,width*scale,height*scale,0,0,w,h);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,imageTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,crop);gl.viewport(0,0,w,h);dirty=false;
 }
 function tick(now){raf=0;if(!allowed()||now>until){destroy();return;}try{
  const shift=viewport.scrollLeft-fieldScroll;if(shift){grid.translate(shift*grid.w/width);fieldScroll=viewport.scrollLeft;}
  if(dirty)upload();let budget=48;while(pending.length&&budget>0){budget-=grid.inject(pending.shift(),viewport.scrollLeft,budget);}
  accumulator+=clock?Math.min(50,now-clock):16.667;clock=now;for(let n=0;n<3&&accumulator>=16.666;n++){grid.step(1/60);accumulator-=16.666;}
  gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,flowTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,grid.w,grid.h,0,gl.RGBA,gl.UNSIGNED_BYTE,grid.encode());
  gl.useProgram(program);gl.uniform2f(uniforms.size,width,height);gl.uniform2f(uniforms.texel,1/grid.w,1/grid.h);gl.uniform1f(uniforms.fade,Math.min(1,Math.max(0,(until-now)/450)));gl.drawArrays(gl.TRIANGLES,0,6);if(gl.getError()!==gl.NO_ERROR)throw Error('WebGL render');host.style.visibility='visible';
 }catch(e){console.warn('画卷流动回退原画',e);failed=true;destroy();return;}raf=requestAnimationFrame(tick);}
 function move(e){if(!allowed()||e.pointerType==='touch'||(e.buttons&~1)||!viewport.contains(e.target)||e.target.closest('button,a,[role=button]')){last=null;return;}
  const r=viewport.getBoundingClientRect(),p={x:e.clientX-r.left+viewport.scrollLeft,y:e.clientY-r.top,sx:e.clientX,sy:e.clientY,t:performance.now()};if(!last){last=p;return;}const a=last;last=p;const distance=Math.hypot(p.sx-a.sx,p.sy-a.sy);if(distance<.1)return;
  const dt=Math.max(1,p.t-a.t),dragging=Boolean(e.buttons&1)||viewport.classList.contains('is-dragging');dragWeight+=((dragging?.4:1)-dragWeight)*(1-Math.exp(-dt/90));
  pending.push({a,b:p,weight:dragWeight});if(pending.length>64)pending.splice(0,pending.length-64);until=p.t+1750;if(init()&&!raf)raf=requestAnimationFrame(tick);
 }
 function scroll(){dirty=true;}
 document.addEventListener('pointermove',move,{signal,passive:true});viewport.addEventListener('scroll',scroll,{signal,passive:true});painting.addEventListener('load',destroy,{signal});window.addEventListener('blur',destroy,{signal});document.addEventListener('visibilitychange',destroy,{signal});fine.addEventListener('change',destroy,{signal});reduce.addEventListener('change',destroy,{signal});const observer=new ResizeObserver(destroy);observer.observe(viewport);
 return ()=>{disposed=true;hidePointer();source.width=source.height=1;pointer.remove();viewport.classList.remove('flow-pointer-ready');events.abort();observer.disconnect();destroy();crop.width=crop.height=1;};
};
