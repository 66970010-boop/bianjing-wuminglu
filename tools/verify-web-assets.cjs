// Browser smoke check: real routes, downloaded bytes, broken image requests.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=spawn(process.execPath,['server/index.mjs'],{cwd:root,env:{...process.env,PORT:'3015'},stdio:'ignore'});
 let browser;
 try{
  for(let n=0;n<30;n++){try{await fetch('http://127.0.0.1:3015');break}catch{await new Promise(r=>setTimeout(r,100))}}
  browser=await chromium.launch({channel:'msedge',headless:true});
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage(),failures=[],errors=[];
  page.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()})});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:3015',{waitUntil:'networkidle'});
  await page.screenshot({path:path.join(root,'verification/optimized-home.png')});
  const home=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize})));
  for(const route of ['opening','scroll','book','drinks','barber','monk','fortune']){
   await page.evaluate(p=>{state.introGuide={status:'done'};go(p)},route);
   await page.waitForTimeout(700);
   await page.waitForFunction(()=>[...document.images].every(i=>i.complete));
   await page.waitForLoadState('networkidle');
   if(route==='scroll'){
    await page.evaluate(()=>document.fonts.ready);
    await page.screenshot({path:path.join(root,'verification/optimized-scroll.png')});
   }
  }
  const broken=await page.evaluate(()=>[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>go('home'));
  await page.waitForLoadState('networkidle');
  await page.screenshot({path:path.join(root,'verification/optimized-home-mobile.png')});
  const report={failures,errors,broken,home,homeBytes:home.reduce((s,r)=>s+r.bytes,0)};
  fs.writeFileSync(path.join(root,'verification/asset-browser-check.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  if(failures.length||errors.length||broken.length)process.exitCode=1;
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
