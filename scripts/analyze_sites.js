import fs from 'fs';

function analyzeFile(name, filePath) {
  console.log(`\n=================== ${name} ===================`);
  const content = fs.readFileSync(filePath, 'utf-8');
  console.log(`File size: ${content.length} chars`);

  // Check script tags / libraries
  const scripts = content.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
  console.log(`Total <script> tags: ${scripts.length}`);

  const cdnMatches = content.match(/https?:\/\/[^\s"'`<>]+/g) || [];
  const uniqueCdns = [...new Set(cdnMatches.filter(u => u.includes('cdn') || u.includes('.js') || u.includes('three')))];
  console.log('External script/asset URLs:', uniqueCdns);

  // Look for zone / landmark / map definitions
  const lines = content.split('\n');
  const interestingKeywords = ['Three', 'BABYLON', 'camera', 'PointerLock', 'OrbitControls', 'landmark', 'zone', 'gate', 'ferris', 'dino', 'africa', 'greenhouse', 'polar', 'lake', 'map', 'minimap', 'lat', 'lon', 'osm', 'geojson'];

  const keywordCounts = {};
  for (const kw of interestingKeywords) {
    const reg = new RegExp(kw, 'gi');
    const matches = content.match(reg);
    keywordCounts[kw] = matches ? matches.length : 0;
  }
  console.log('Keyword occurrences:', keywordCounts);
}

analyzeFile('Site 1 (Cloudflare Worker)', 'site1.html');
analyzeFile('Site 2 (ChatGPT keenbasil73)', 'site2.html');
