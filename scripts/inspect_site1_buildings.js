import fs from 'fs';

const code1 = fs.readFileSync('site1_code.js', 'utf-8');

const idxBld = code1.indexOf('function extrude');
console.log(code1.slice(idxBld, idxBld + 2500));
