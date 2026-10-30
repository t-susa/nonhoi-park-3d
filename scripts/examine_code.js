import fs from 'fs';

function examineCode1() {
  const code = fs.readFileSync('site1_code.js', 'utf-8');
  console.log('=== SITE 1 CODE ANALYSIS ===');
  console.log('Length:', code.length);

  // Search for key functions and features
  const lines = code.split('\n');
  const headers = lines.filter(l => l.trim().startsWith('function ') || l.trim().startsWith('const ') && (l.includes('= ()') || l.includes('= function') || l.includes('class ')));
  console.log('Functions & Classes (Site 1, sample 25):', headers.slice(0, 25));

  // Search for landmark creation
  const landmarksLines = lines.filter(l => l.includes('ferris') || l.includes('Dino') || l.includes('brachio') || l.includes('wheel') || l.includes('Giraffe') || l.includes('greenhouse') || l.includes('Museum') || l.includes('Bus') || l.includes('pointerLock') || l.includes('PointerLock') || l.includes('animate'));
  console.log('Interesting lines in Site 1:', landmarksLines.slice(0, 30));
}

function examineCode2() {
  const code = fs.readFileSync('site2_code.js', 'utf-8');
  console.log('\n=== SITE 2 CODE ANALYSIS ===');
  console.log('Length:', code.length);

  // Search for key functions and features
  const lines = code.split('\n');
  const interestingLines = lines.filter(l => l.includes('function ') || l.includes('class ') || l.includes('PointerLock') || l.includes('camera') || l.includes('wheel') || l.includes('dino') || l.includes('bus') || l.includes('animat'));
  console.log('Interesting lines count in Site 2:', interestingLines.length);
  console.log('Sample interesting lines:', interestingLines.slice(0, 30));
}

examineCode1();
examineCode2();
