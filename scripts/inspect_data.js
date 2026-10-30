import fs from 'fs';

function inspectSite1() {
  const content = fs.readFileSync('site1.html', 'utf-8');
  console.log('=== SITE 1 DATA KEYS ===');
  const osmMatch = content.match(/window\.OSM\s*=\s*(\{[\s\S]*?\});/);
  if (osmMatch) {
    const jsonStr = osmMatch[1];
    try {
      const data = JSON.parse(jsonStr);
      console.log('OSM keys:', Object.keys(data));
      for (const k of Object.keys(data)) {
        if (Array.isArray(data[k])) {
          console.log(`  ${k}: array of length ${data[k].length}, sample:`, JSON.stringify(data[k][0]).slice(0, 100));
        } else if (typeof data[k] === 'object') {
          console.log(`  ${k}: object keys:`, Object.keys(data[k]));
        } else {
          console.log(`  ${k}:`, data[k]);
        }
      }
    } catch(e) {
      console.log('Parse error:', e.message);
    }
  }

  // Check the module script in Site 1
  const script1 = content.match(/<script type="module">([\s\S]*?)<\/script>/i);
  if (script1) {
    fs.writeFileSync('site1_code.js', script1[1]);
    console.log('Saved site1_code.js, length:', script1[1].length);
  }
}

function inspectSite2() {
  const content = fs.readFileSync('site2.html', 'utf-8');
  console.log('=== SITE 2 DATA KEYS ===');
  const dMatch = content.match(/const D\s*=\s*(\{[\s\S]*?\});/);
  if (dMatch) {
    try {
      const data = JSON.parse(dMatch[1]);
      console.log('Site 2 D keys:', Object.keys(data));
      for (const k of Object.keys(data)) {
        if (Array.isArray(data[k])) {
          console.log(`  ${k}: array of length ${data[k].length}, sample:`, JSON.stringify(data[k][0]).slice(0, 100));
        } else if (typeof data[k] === 'object') {
          console.log(`  ${k}: object keys:`, Object.keys(data[k]));
        } else {
          console.log(`  ${k}:`, data[k]);
        }
      }
    } catch(e) {
      console.log('Parse error:', e.message);
    }
  }

  // Check script #1 in Site 2
  const scripts = content.match(/<script>([\s\S]*?)<\/script>/gi);
  if (scripts && scripts[0]) {
    fs.writeFileSync('site2_code.js', scripts[0]);
    console.log('Saved site2_code.js, length:', scripts[0].length);
  }
}

inspectSite1();
inspectSite2();
