import fs from 'fs';

function extractSections(filename) {
  console.log(`\n================== EXTRACTING ${filename} ==================`);
  const content = fs.readFileSync(filename, 'utf-8');

  // Find all JS variable definitions or objects
  const jsMatches = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsMatches) {
    jsMatches.forEach((sc, i) => {
      console.log(`--- Script #${i} (length: ${sc.length}) ---`);
      // Print first 500 chars and search for landmarks, points, geo, etc.
      const sample = sc.slice(0, 1000);
      console.log('Sample:', sample.slice(0, 300));
    });
  }
}

extractSections('site1.html');
extractSections('site2.html');
