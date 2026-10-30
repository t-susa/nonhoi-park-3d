import { parkData } from '../src/data/parkData.js';

console.log('=== GATES ===');
parkData.gates.forEach(g => console.log(g.n, g.p));

console.log('\n=== ZONES ===');
parkData.zones.forEach(z => {
  let cx = 0, cz = 0;
  z.p.forEach(p => { cx += p[0]; cz += p[1]; });
  cx /= z.p.length; cz /= z.p.length;
  console.log(z.n, `(${z.s}): center=(${cx.toFixed(1)}, ${cz.toFixed(1)})`);
});

console.log('\n=== POIs ===');
parkData.pois.forEach(p => console.log(p.n, `kind=${p.k}, pos=(${p.p[0].toFixed(1)}, ${p.p[1].toFixed(1)})`));

console.log('\n=== NAMED BUILDINGS ===');
parkData.buildings.filter(b => b.n).forEach(b => {
  let cx = 0, cz = 0;
  b.o.forEach(p => { cx += p[0]; cz += p[1]; });
  cx /= b.o.length; cz /= b.o.length;
  console.log(b.n, `pos=(${cx.toFixed(1)}, ${cz.toFixed(1)}), height=${b.ht || b.lv || 'auto'}`);
});

console.log('\n=== WATER BODIES ===');
parkData.water.forEach((w, i) => {
  let cx = 0, cz = 0;
  w.o.forEach(p => { cx += p[0]; cz += p[1]; });
  cx /= w.o.length; cz /= w.o.length;
  console.log(`Water #${i}: center=(${cx.toFixed(1)}, ${cz.toFixed(1)}), fountain=${w.f || false}, pts=${w.o.length}`);
});
