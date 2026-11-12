const fs = require('fs');
const s = fs.readFileSync('toys/deck.html', 'utf8');
const i = s.indexOf('全局交互音效引擎');
console.log('found at', i);
console.log(JSON.stringify(s.slice(i - 400, i + 1600)));
