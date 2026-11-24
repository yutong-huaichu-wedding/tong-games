import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/blackjack',{recursive:true});
await copyFile('dist/index.html','dist/blackjack/index.html');
console.log('Static /blackjack/ fallback created.');
