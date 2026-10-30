import fs from 'fs';

const code1 = fs.readFileSync('site1_code.js', 'utf-8');
const code2 = fs.readFileSync('site2_code.js', 'utf-8');

// Let's print the entire model / landmark section of Site 1
console.log('=== SITE 1: Animals & Landmarks ===');
const animIndex = code1.indexOf('function elephant');
if (animIndex !== -1) {
  console.log(code1.slice(animIndex, animIndex + 3500));
}

console.log('\n=== SITE 2: Models & Landmarks ===');
const mIndex = code2.indexOf('const wheel=new THREE.Group');
if (mIndex !== -1) {
  console.log(code2.slice(mIndex - 200, mIndex + 3000));
}
