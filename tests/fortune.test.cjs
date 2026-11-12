const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data/hexagrams.json');
const core=require('../fortune-core.js')(data);
test('64卦与384爻齐备，卦序、八卦和阴阳编码一致',()=>{
 assert.equal(data.length,64);assert.ok(data[1].judgement.includes('君子有攸往'));assert.deepEqual(data[1].extra,['用六：利永貞。']);assert.equal(new Set(data.map(h=>h.bits)).size,64);
 const bits={乾:'111',兌:'110',離:'101',震:'100',巽:'011',坎:'010',艮:'001',坤:'000'};
 data.forEach((h,i)=>{assert.equal(h.id,i+1);assert.equal(h.symbol,String.fromCodePoint(0x4dc0+i));assert.equal(h.bits,bits[h.lower]+bits[h.upper]);assert.equal(h.lines.length,6);assert.ok(h.judgement);assert.match(h.lines[0],/^初[六九]/);assert.match(h.lines[5],/^上[六九]/);assert.ok(!JSON.stringify(h).includes('mw-parser'));h.lines.forEach(l=>assert.ok(l.length>2));assert.ok(h.source.startsWith('https://zh.wikisource.org/'));});
});
test('已知卦映射：乾、坤、屯、泰、否、既济、未济；初爻在底部',()=>{
 for(const [bits,id] of [['111111',1],['000000',2],['100010',3],['111000',11],['000111',12],['101010',63],['010101',64]])assert.equal(core.cast([...bits].map(b=>b==='1'?7:8)).base.id,id);
 assert.equal(core.cast([6,8,8,8,8,8]).changed.id,24);
 assert.equal(core.cast([9,9,9,9,9,9]).changed.id,2);
 assert.equal(core.cast([6,6,6,6,6,6]).changed.id,1);
});
test('穷举4096种六爻，动爻翻转与静爻不变',()=>{
 for(let n=0;n<4096;n++){const values=Array.from({length:6},(_,i)=>6+((n>>(i*2))&3));const r=core.cast(values);assert.ok(r.base&&r.changed);values.forEach((v,i)=>{assert.equal(Number(r.base.bits[i]),v%2);assert.equal(Number(r.changed.bits[i]),v===6?1:v===9?0:v%2);assert.equal(r.moving.includes(i+1),v===6||v===9);});}
 assert.throws(()=>core.cast([0,1,0,1,0,1]));
});
test('三钱8种组合概率为1:3:3:1',()=>{
 const counts={6:0,7:0,8:0,9:0};for(let i=0;i<8;i++){let j=0;const coins=core.coin(()=> (i>>j++)&1);counts[coins.reduce((a,b)=>a+b,0)]++;}assert.deepEqual(counts,{6:1,7:3,8:3,9:1});
});
test('SSE能够读取拆开的UTF-8与CRLF、注释及多段数据',async()=>{
 const {events}=await import('../server/sse.mjs');const text=': ping\r\n\r\ndata: {"type":"response.output_text.delta","delta":"客官"}\r\n\r\ndata: {"type":"response.completed"}\n\ndata: [DONE]\n\n';const bytes=new TextEncoder().encode(text);
 async function* chunks(){for(const b of bytes)yield Uint8Array.of(b);}
 const found=[];for await(const e of events(chunks()))found.push(e);assert.equal(found[0].delta,'客官');assert.equal(found[1].type,'response.completed');assert.equal(found.length,2);
});
test('接口使用服务器卦象与会话，流式返回、失败降级、隐藏配置与源码',async()=>{
 process.env.OPENAI_API_KEY='test-placeholder';process.env.OPENAI_MODEL='test-model';
 const {createServer}=await import('../server/index.mjs');const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const realFetch=global.fetch;let mode='ok',upstreamBody;
 global.fetch=async(url,opts)=>{if(String(url)!=='https://api.openai.com/v1/responses')return realFetch(url,opts);upstreamBody=JSON.parse(opts.body);if(mode==='fail')return new Response('{}',{status:401});if(mode==='partial')return new Response('data: {"type":"response.output_text.delta","delta":"半句"}\n\n',{headers:{'Content-Type':'text/event-stream'}});return new Response('data: {"type":"response.output_text.delta","delta":"客官，先问清眼前之事。"}\n\ndata: {"type":"response.completed"}\n\n',{headers:{'Content-Type':'text/event-stream'}});};
 const post=(route,value,cookie)=>realFetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{cookie}: {})},body:JSON.stringify(value)});
 try{
  const r=await post('/api/cast',{question:'如何寻找老人？',hexagramId:1,npcContext:'secret'});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0],c=await r.json();assert.equal(c.coins.length,6);c.coins.forEach(coins=>assert.equal(coins.length,3));
  assert.equal((await post('/api/divination',{castId:c.id})).status,409);
  const response=await post('/api/divination',{castId:c.id},cookie),sse=await response.text();assert.ok(sse.includes('"mode":"ai"'));assert.ok(sse.includes('客官'));assert.ok(sse.includes('"type":"done"'));
  const evidence=JSON.parse(upstreamBody.input[0].content);assert.equal(evidence.base.id,core.cast(c.lines).base.id);assert.ok(!JSON.stringify(upstreamBody).includes('secret'));assert.equal(upstreamBody.store,false);
  mode='fail';const fallback=await (await post('/api/divination',{castId:c.id,followup:'下一步呢？'},cookie)).text();assert.ok(fallback.includes('"mode":"offline"'));assert.ok(fallback.includes('"type":"replace"'));assert.ok(!fallback.includes('test-placeholder'));
  mode='partial';const partial=await (await post('/api/divination',{castId:c.id,followup:'再说一句'},cookie)).text();assert.ok(partial.includes('"type":"replace"'));assert.ok(partial.includes('"mode":"offline"'));
  for(const p of ['/.env','/server/index.mjs','/package.json','/tests/fortune.test.cjs','/%2e%2e/.env'])assert.equal((await realFetch(base+p)).status,404,p);
  const malicious=await realFetch(base+'/api/cast',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.invalid'},body:'{"question":"x"}'});assert.equal(malicious.status,403);
  assert.equal((await post('/api/cast',{question:'x'.repeat(201)})).status,400);
  for(let i=0;i<8;i++)await post('/api/divination',{castId:c.id,followup:'再问'},cookie);
  assert.equal((await post('/api/divination',{castId:c.id,followup:'再问'},cookie)).status,429);
 }finally{global.fetch=realFetch;await new Promise(r=>server.close(r));}
});
