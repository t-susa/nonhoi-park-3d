import fs from 'fs';

const code1 = fs.readFileSync('site1_code.js', 'utf-8');

// Find how it renders ground, park, ways, buildings, water
const idxGround = code1.indexOf('// ---------- terrain / layers ----------');
if (idxGround !== -1) {
  console.log(code1.slice(idxGround, idxGround + 4000));
} else {
  const idxFlat = code1.indexOf('addPoly');
  console.log(code1.slice(idxFlat - 100, idxFlat + 3500));
}
