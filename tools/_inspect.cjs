const fs = require('node:fs');
const s = fs.readFileSync('index.html', 'utf8');
const g = s.indexOf("if(p==='game')");
console.log(JSON.stringify(s.slice(g, g + 1050)));
