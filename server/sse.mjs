// Decode SSE across arbitrary byte boundaries (including split UTF-8 characters).
export async function* events(body) {
  const decoder = new TextDecoder(); let buffer = '';
  for await (const chunk of body) {
    buffer += decoder.decode(chunk, {stream:true}).replace(/\r/g,'');
    let end;
    while ((end=buffer.indexOf('\n\n'))>=0) {
      const block=buffer.slice(0,end); buffer=buffer.slice(end+2);
      const data=block.split('\n').filter(s=>s.startsWith('data:')).map(s=>s.slice(5).trimStart()).join('\n');
      if(data && data!=='[DONE]') yield JSON.parse(data);
    }
    if(buffer.length>1024*1024) throw new Error('stream too large');
  }
}
