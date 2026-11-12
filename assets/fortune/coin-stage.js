import * as THREE from '../vendor/three-0.170.0.js';
// Coin body and square hole are geometry; the generated images supply face detail.
export async function createCoinStage(host,{reduced=false}={}){
 const loader=new THREE.TextureLoader();
 const maps=await Promise.all(['coin-front.webp','coin-back.webp'].map(name=>loader.loadAsync(new URL(name,import.meta.url).href)));
 maps.forEach(t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;});
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:false});renderer.setClearColor(0x000000,1);renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');host.dataset.renderer='webgl';
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-5,5,2.8,-2.8,.1,30);camera.position.set(0,9,12);camera.lookAt(0,0,0);
 scene.add(new THREE.AmbientLight(0xffffff,1.8));const light=new THREE.DirectionalLight(0xffecd3,2.8);light.position.set(-3,5,8);scene.add(light);const fill=new THREE.DirectionalLight(0xd1d7db,.7);fill.position.set(4,-1,3);scene.add(fill);
 const radius=.97,shape=new THREE.Shape();shape.absarc(0,0,radius,0,Math.PI*2,false);
 const hole=new THREE.Path();hole.moveTo(-.196,-.196);hole.lineTo(-.196,.196);hole.lineTo(.196,.196);hole.lineTo(.196,-.196);hole.closePath();shape.holes.push(hole);
 const face=new THREE.ShapeGeometry(shape,96),positions=face.attributes.position;
 for(let i=0;i<positions.count;i++)face.attributes.uv.setXY(i,(positions.getX(i)+1)/2,(positions.getY(i)+1)/2);
 const edge=new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false,curveSegments:96});edge.translate(0,0,-.06);
 const edgeMaterial=new THREE.MeshStandardMaterial({color:0x66543b,roughness:.9,metalness:.35});
 const materials=maps.map(map=>new THREE.MeshStandardMaterial({map,roughness:.92,metalness:.12,transparent:true,alphaTest:.2}));
 let origins=[[-2.9,.7],[0,-1.2],[2.9,.8]], angles=[0,0,0];
 function randomize(){const spread=2.9+(Math.random()-.5)*.08;origins=[[-spread,.7+(Math.random()-.5)*.12],[0,-1.2+(Math.random()-.5)*.12],[spread,.8+(Math.random()-.5)*.12]];angles=origins.map(()=>(Math.random()-.5)*.45);host.dataset.positions=JSON.stringify(origins);}
 const group=new THREE.Group();scene.add(group);
 const coins=origins.map(([x,y])=>{const g=new THREE.Group();g.position.set(x,y,0);g.scale.setScalar(1.44);g.add(new THREE.Mesh(edge,edgeMaterial));const a=new THREE.Mesh(face,materials[0]);a.userData.value=3;a.position.z=.061;g.add(a);const b=new THREE.Mesh(face,materials[1]);b.userData.value=2;b.rotation.y=Math.PI;b.position.z=-.061;g.add(b);group.add(g);return g;});
 let raf=0,disposed=false,pending=null;
 // Orthographic camera's horizontal axis is world X. Center the projected
 // geometry, including rims, rather than the canvas or mean model origins.
 const point=new THREE.Vector3();
 function projectedBounds(){
  scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const coin of coins)for(const mesh of coin.children){const attr=mesh.geometry.attributes.position;for(let i=0;i<attr.count;i++){point.fromBufferAttribute(attr,i).applyMatrix4(mesh.matrixWorld).project(camera);left=Math.min(left,point.x);right=Math.max(right,point.x);top=Math.min(top,point.y);bottom=Math.max(bottom,point.y);}}
  return {left,right,top,bottom};
 }
 // The outer cylinder bounds have a closed form. Avoid walking all mesh
 // vertices and repeatedly projecting them on every animation frame.
 function centerGroup(){
  group.updateMatrixWorld(true);let left=Infinity,right=-Infinity;
  for(const coin of coins){const e=coin.matrixWorld.elements;
   const extent=radius*Math.hypot(e[0],e[4])+.061*Math.abs(e[8]);
   left=Math.min(left,e[12]-extent);right=Math.max(right,e[12]+extent);
  }
  group.position.x-=(left+right)/2;
 }
 const render=()=>{if(!disposed){renderer.render(scene,camera);}};
 // Diagnostic uses the actual outward face normals and material, not the
 // requested result. Only called after settling; no random values consumed.
 function inspect(){
  const bounds=projectedBounds(),direction=camera.getWorldDirection(new THREE.Vector3()).negate();
  const visible=coins.map(coin=>{const surfaces=coin.children.filter(m=>m.userData.value);return surfaces.map(mesh=>({value:mesh.userData.value,texture:mesh.material.map.source.data.src,facing:new THREE.Vector3(0,0,1).transformDirection(mesh.matrixWorld).dot(direction)})).sort((a,b)=>b.facing-a.facing)[0];});
  return {visible,bounds,centerErrorPx:(bounds.left+bounds.right)*host.clientWidth/4};
 }
 function resize(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const halfHeight=w<500?4.5:4.0;camera.top=halfHeight;camera.bottom=-halfHeight;camera.left=-halfHeight*w/h;camera.right=halfHeight*w/h;camera.updateProjectionMatrix();centerGroup();render();}
 const observer=new ResizeObserver(resize);observer.observe(host);
 function settle(values){coins.forEach((coin,i)=>{coin.position.set(origins[i][0],0,origins[i][1]);coin.rotation.set(-Math.PI/2,values[i]===3?0:Math.PI,angles[i]);});render();}
 function animate(values,arrival=false){
  if(pending)return pending.promise;
  randomize();const starts=coins.map(c=>c.position.clone()),rotations=coins.map(c=>c.rotation.clone());
  const ends=values.map((v,i)=>{const base=v===3?0:Math.PI,from=rotations[i].y;return from+Math.PI*2+((base-from)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);});
  let resolve;const promise=new Promise(r=>resolve=r);pending=Object.assign(resolve,{promise});let start;
  const duration=reduced?160:arrival?1600:2100;
  const tick=now=>{if(disposed)return;start??=now;const all=Math.min(1,(now-start)/duration);
   coins.forEach((coin,i)=>{const t=Math.max(0,Math.min(1,(all-i*.025)/.95)),ease=t*t*t*(10+t*(-15+6*t));
    const lift=reduced?0:arrival?4.8*(1-ease):1.8*4*t*(1-t);
    coin.position.set(THREE.MathUtils.lerp(starts[i].x,origins[i][0],ease),lift,THREE.MathUtils.lerp(starts[i].z,origins[i][1],ease));
    coin.rotation.set(-Math.PI/2+(reduced||arrival?0:Math.sin(Math.PI*t)*.3),THREE.MathUtils.lerp(rotations[i].y,ends[i],ease),THREE.MathUtils.lerp(rotations[i].z,angles[i],ease));
   });render();if(all<1)raf=requestAnimationFrame(tick);else{pending=null;resolve();}
  };raf=requestAnimationFrame(tick);return promise;
 }
 function toss(values){return animate(values);}
 function arrive(){return animate([3,2,3],true);}
 resize();settle([3,2,3]);
 // Upload both faces and compile the shader while the invocation is visible.
 await renderer.compileAsync(scene,camera);render();
 return {settle,toss,arrive,inspect,dispose(){disposed=true;cancelAnimationFrame(raf);pending?.();observer.disconnect();face.dispose();edge.dispose();materials.forEach(m=>m.dispose());edgeMaterial.dispose();maps.forEach(t=>t.dispose());renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
