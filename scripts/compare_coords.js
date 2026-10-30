import fs from 'fs';

// Extract OSM data from site1
const site1Html = fs.readFileSync('site1.html', 'utf-8');
const osmMatch = site1Html.match(/window\.OSM\s*=\s*(\{[\s\S]*?\});/);
const osm = osmMatch ? JSON.parse(osmMatch[1]) : null;

// Extract D from site2
const site2Html = fs.readFileSync('site2.html', 'utf-8');
const dMatch = site2Html.match(/const D\s*=\s*(\{[\s\S]*?\});/);
const d2 = dMatch ? JSON.parse(dMatch[1]) : null;

console.log('OSM origin:', osm?.origin, 'unitMetres:', osm?.unitMetres);
console.log('OSM ways count:', osm?.ways.length);
console.log('OSM buildings count:', osm?.buildings.length);
console.log('OSM water count:', osm?.water.length);
console.log('OSM zones count:', osm?.zones.length);
console.log('OSM POIs count:', osm?.pois.length);
console.log('Site 2 plateauMuseum length:', d2?.plateauMuseum?.length);
console.log('Site 2 plateauBuildings length:', d2?.plateauBuildings?.length);

// Let's inspect the coordinate systems of both to see how they map:
// In Site 1:
// origin: [34.7200018, 137.4324381]
// let's look at park boundary in Site 1 vs Site 2
console.log('Site 1 park[0]:', osm?.park[0]);
console.log('Site 2 boundary[0]:', d2?.boundary[0]);
// Notice: 346.5, -15.9 in site 1 vs 472.65, -20.22 in site 2
// Let's check ratio: 472.65 / 346.5 = 1.364...
// Let's check why: in site 1, unitMetres is 1.25. If 346.5 * 1.25 = 433.125.
// Let's check how coordinates are mapped in Site 1 vs Site 2.
