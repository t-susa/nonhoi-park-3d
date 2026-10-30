import fs from 'fs';
import path from 'path';

const projectDir = 'C:/Users/susat/.gemini/antigravity/scratch/nonhoi-park-3d';

// 1. Read site1.html
const site1Html = fs.readFileSync(path.join(projectDir, 'site1.html'), 'utf-8');
const osmMatch = site1Html.match(/window\.OSM\s*=\s*(\{[\s\S]*?\});/);
if (!osmMatch) {
  throw new Error('OSM match failed in site1.html');
}
const osm = JSON.parse(osmMatch[1]);

// 2. Read site2.html for plateau data
const site2Html = fs.readFileSync(path.join(projectDir, 'site2.html'), 'utf-8');
const dMatch = site2Html.match(/const D\s*=\s*(\{[\s\S]*?\});/);
let plateauMuseum = null;
let plateauBuildings = null;
if (dMatch) {
  const d2 = JSON.parse(dMatch[1]);
  plateauMuseum = d2.plateauMuseum || null;
  plateauBuildings = d2.plateauBuildings || null;
  console.log('Found plateauMuseum vertices:', plateauMuseum?.length);
  console.log('Found plateauBuildings count:', plateauBuildings?.length);
}

// 3. Create parkData object
const parkData = {
  origin: osm.origin, // [34.7200018, 137.4324381]
  unitMetres: osm.unitMetres, // 1.25
  park: osm.park, // 148 boundary coordinates
  ways: osm.ways, // 278 real road/walkway paths
  buildings: osm.buildings, // 128 building footprints
  water: osm.water, // 9 water bodies / ponds
  streams: osm.streams, // 16 streams / moats
  zones: osm.zones, // 4 official zones
  pois: osm.pois, // 22 POIs (dinosaur artworks, Ferris wheel, locomotive, etc.)
  forest: osm.forest, // 86 forested / wooded regions
  gardens: osm.gardens, // 13 garden regions
  rail: osm.rail, // 1 mini train rail track
  parking: osm.parking, // 3 parking lots
  gates: osm.gates, // 3 gates (東門, 西門, 中央門)
  bus: osm.bus, // 373 bus route vertices
  busStops: osm.busStops, // 5 bus stops
  plateauMuseum,
  plateauBuildings,
  attribution: osm.attribution
};

const dataDir = path.join(projectDir, 'src/data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const exportContent = `// Real-world OpenStreetMap and PLATEAU data for Nonhoi Park (Toyohashi Zoo & Botanical Park)
// Origin: [34.7200018, 137.4324381], Scale: 1 unit = 1.25 metres (+X: East, +Z: South)
export const parkData = ${JSON.stringify(parkData)};
`;

fs.writeFileSync(path.join(dataDir, 'parkData.js'), exportContent, 'utf-8');
console.log('Successfully created src/data/parkData.js! Size:', exportContent.length, 'bytes');
