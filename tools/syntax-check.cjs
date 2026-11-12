const fs = require('fs');
process.chdir('D:/system files/Documents/ChatGPT/清明上河图/汴京一日');
for (const f of ['story.js', 'baker-ending.js']) {
  const s = fs.readFileSync(f, 'utf8');
  try { new Function(s); console.log(f, 'OK'); } catch (e) { console.log(f, 'ERR', e.message); }
}
const html = fs.readFileSync('index.html', 'utf8');
const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
matches.forEach((m, i) => {
  try { new Function(m[1]); console.log('inline ' + i + ' OK'); } catch (e) { console.log('inline ' + i + ' ERR', e.message); }
});
