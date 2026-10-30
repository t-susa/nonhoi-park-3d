import fs from 'fs';

const code1 = fs.readFileSync('site1_code.js', 'utf-8');

// Find the beginning of scene setup
console.log('--- Site 1 Scene Setup & Building Extraction ---');
const idxD = code1.indexOf('const D = window.OSM');
console.log(code1.slice(idxD, idxD + 2500));
