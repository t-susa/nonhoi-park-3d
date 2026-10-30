import fs from 'fs';

const code1 = fs.readFileSync('site1_code.js', 'utf-8');
const code2 = fs.readFileSync('site2_code.js', 'utf-8');

console.log('=== SITE 1 FEATURE SUMMARY ===');
// Search for landmark rendering in Site 1
const s1_models = [];
for (const match of code1.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/g)) {
  s1_models.push(match[1]);
}
console.log('Site 1 functions:', s1_models.join(', '));

// Print specific sections of Site 1:
console.log('\n--- Site 1 Landmark creation snippet ---');
const idxFerris1 = code1.indexOf('big_wheel') !== -1 ? code1.indexOf('big_wheel') : code1.indexOf('wheel');
if (idxFerris1 !== -1) {
  console.log(code1.slice(Math.max(0, idxFerris1 - 100), idxFerris1 + 500));
}

console.log('\n=== SITE 2 FEATURE SUMMARY ===');
const s2_models = [];
for (const match of code2.matchAll(/function\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/g)) {
  s2_models.push(match[1]);
}
console.log('Site 2 functions:', s2_models.join(', '));

console.log('\n--- Site 2 Landmark creation snippet ---');
const idxFerris2 = code2.indexOf('wheel') !== -1 ? code2.indexOf('wheel') : -1;
if (idxFerris2 !== -1) {
  console.log(code2.slice(Math.max(0, idxFerris2 - 100), idxFerris2 + 500));
}
