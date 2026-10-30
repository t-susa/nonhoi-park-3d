import * as THREE from 'three';
import { parkData } from '../data/parkData.js';
import { TextureGenerator } from './TextureGenerator.js';

export class MapBuilder {
  constructor(scene) {
    this.scene = scene;
    this.colliders = []; // AABB & polygon colliders for walking collision
    this.roadNetwork = []; // Road segments for pathfinding & navigation
    this.waterPolys = []; // Water bounding boxes for water collision/splashing
    this.namedBuildings = []; // Named buildings for camera & spot detection
    this.pathGrid = new Map(); // Spatial hash of path segments

    this.init();
  }

  init() {
    this.buildGroundAndZones();
    this.buildWaterBodies();
    this.buildRoadNetwork();
    this.buildBuildings();
    this.buildRailway();
  }

  // 多角形の外積面積計算（符号付き面積）
  areaOf(p) {
    let s = 0;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      s += p[j][0] * p[i][1] - p[i][0] * p[j][1];
    }
    return s / 2;
  }

  // 多角形の中心座標計算
  centroid(p) {
    let x = 0, z = 0;
    p.forEach(q => { x += q[0]; z += q[1]; });
    return [x / p.length, z / p.length];
  }

  // 境界ボックス（AABB）計算
  bboxOf(p) {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const [x, z] of p) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    return { minX, maxX, minZ, maxZ };
  }

  // 多角形の内外判定（Ray Casting法）
  inPoly(poly, x, z) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, zi] = poly[i];
      const [xj, zj] = poly[j];
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) {
        c = !c;
      }
    }
    return c;
  }

  // 線分と点の最短距離
  segDist(x, z, ax, az, bx, bz) {
    const dx = bx - ax;
    const dz = bz - az;
    const l2 = dx * dx + dz * dz || 1e-9;
    let t = ((x - ax) * dx + (z - az) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(x - ax - t * dx, z - az - t * dz);
  }

  // 多角形の頂点・インデックス配列への変換（ShapeUtils triangulation）
  addPoly(V, I, outer, holes = [], y = 0) {
    if (outer.length < 3) return;
    const v2 = p => p.map(([x, z]) => new THREE.Vector2(x, z));
    const contour = v2(outer);
    const hs = holes.filter(h => h.length >= 3).map(v2);

    const tris = THREE.ShapeUtils.triangulateShape(contour, hs);
    const all = [...contour, ...hs.flat()];
    const base = V.length / 3;

    all.forEach(p => V.push(p.x, y, p.y));

    tris.forEach(([a, b, c]) => {
      const A = all[a], B = all[b], C = all[c];
      const cy = (B.y - A.y) * (C.x - A.x) - (B.x - A.x) * (C.y - A.y);
      if (cy > 0) {
        I.push(base + a, base + b, base + c);
      } else {
        I.push(base + a, base + c, base + b);
      }
    });
  }

  // 平面メッシュの生成
  flatMesh(V, I, mat, y = 0, shadow = true) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3));
    const N = new Float32Array(V.length);
    for (let i = 1; i < N.length; i += 3) N[i] = 1;
    g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    g.setIndex(I);

    const m = new THREE.Mesh(g, mat);
    m.position.y = y;
    m.receiveShadow = shadow;
    this.scene.add(m);
    return m;
  }

  // 1. 地面およびゾーン・緑地レイヤーの構築
  buildGroundAndZones() {
    // 園外の広大な緑地ベース
    const outerGroundGeo = new THREE.PlaneGeometry(1600, 1600, 32, 32);
    const outerGrassTex = TextureGenerator.createGrassTexture();
    const outerGrassBump = TextureGenerator.createGrassBumpMap();
    const outerGroundMat = new THREE.MeshStandardMaterial({
      map: outerGrassTex,
      bumpMap: outerGrassBump,
      bumpScale: 0.06,
      roughness: 0.9,
      color: 0x7aa56b
    });
    const outerGround = new THREE.Mesh(outerGroundGeo, outerGroundMat);
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.receiveShadow = true;
    this.scene.add(outerGround);

    // のんほいパーク実物境界（148頂点の正確な公園ポリゴン）
    const parkPoly = parkData.park;
    const parkV = [], parkI = [];
    this.addPoly(parkV, parkI, parkPoly, [], 0.02);

    const innerGrassTex = TextureGenerator.createGrassTexture();
    const parkMat = new THREE.MeshStandardMaterial({
      map: innerGrassTex,
      bumpMap: outerGrassBump,
      bumpScale: 0.08,
      roughness: 0.85,
      color: 0x68a554
    });
    this.flatMesh(parkV, parkI, parkMat, 0.02);

    // 4大ゾーン（自然史博物館、動物園、植物園、遊園地）
    const zoneColors = {
      '自然史博物館': 0xbba67b, // 太古の大地・砂岩色
      '遊園地': 0x82b8dd,       // 爽快なスカイブルー
      '植物園': 0x73b866,       // 豊かなボタニカルグリーン
      '動物園エリア': 0x8db57a  // サバンナグリーン
    };

    parkData.zones.forEach((z, i) => {
      const zV = [], zI = [];
      this.addPoly(zV, zI, z.p, [], 0.025);
      const color = zoneColors[z.n] || 0x7fb069;
      const zoneMat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.9,
        transparent: true,
        opacity: 0.35
      });
      this.flatMesh(zV, zI, zoneMat, 0.025);
    });

    // 森林エリア（Forest）
    if (parkData.forest) {
      const fV = [], fI = [];
      parkData.forest.forEach(f => this.addPoly(fV, fI, f, [], 0.03));
      const forestMat = new THREE.MeshStandardMaterial({
        color: 0x2e6b2c,
        roughness: 0.92,
        transparent: true,
        opacity: 0.4
      });
      this.flatMesh(fV, fI, forestMat, 0.03);
    }

    // 庭園エリア（Gardens）
    if (parkData.gardens) {
      const gV = [], gI = [];
      parkData.gardens.forEach(g => this.addPoly(gV, gI, g, [], 0.035));
      const gardenMat = new THREE.MeshStandardMaterial({
        color: 0x5bb850,
        roughness: 0.85,
        transparent: true,
        opacity: 0.4
      });
      this.flatMesh(gV, gI, gardenMat, 0.035);
    }

    // 駐車場エリア（Parking）
    if (parkData.parking) {
      const pV = [], pI = [];
      parkData.parking.forEach(p => this.addPoly(pV, pI, p, [], 0.04));
      const parkLotMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        roughness: 0.8
      });
      this.flatMesh(pV, pI, parkLotMat, 0.04);
    }
  }

  // 2. 実在する池・水域の構築
  buildWaterBodies() {
    const waterNormal = TextureGenerator.createWaterNormalTexture();
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      normalMap: waterNormal,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.1,
      metalness: 0.75,
      transparent: true,
      opacity: 0.85
    });
    this.waterMaterial = waterMat;
    this.waterNormal = waterNormal;

    parkData.water.forEach((w, idx) => {
      const wV = [], wI = [];
      this.addPoly(wV, wI, w.o, [], 0.08);
      this.flatMesh(wV, wI, waterMat, 0.08);

      const bb = this.bboxOf(w.o);
      const [cx, cz] = this.centroid(w.o);
      this.waterPolys.push({ poly: w.o, bb, cx, cz, isFountain: w.f });
    });
  }

  // 3. 園内全278本の道路・歩道ネットワーク構築（幅付きリボンメッシュ）
  buildRoadNetwork() {
    const pavementTex = TextureGenerator.createPavementTexture();
    const pathMat = new THREE.MeshStandardMaterial({
      map: pavementTex,
      roughness: 0.75,
      metalness: 0.1
    });

    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9
    });

    const PV = [], PI = [];
    const CV = [], CI = [];

    const GRID = 15;
    const gridAdd = (x1, z1, x2, z2, hw) => {
      const s = { x1, z1, x2, z2, hw };
      const a = Math.floor((Math.min(x1, x2) - hw) / GRID);
      const b = Math.floor((Math.max(x1, x2) + hw) / GRID);
      const c = Math.floor((Math.min(z1, z2) - hw) / GRID);
      const d = Math.floor((Math.max(z1, z2) + hw) / GRID);
      for (let i = a; i <= b; i++) {
        for (let j = c; j <= d; j++) {
          const k = i + ',' + j;
          if (!this.pathGrid.has(k)) this.pathGrid.set(k, []);
          this.pathGrid.get(k).push(s);
        }
      }
    };

    parkData.ways.forEach(w => {
      const pts = w.p;
      if (!pts || pts.length < 2) return;
      const width = w.w || 3.5;
      const halfW = width / 2;

      // 道路リボンの頂点計算
      const baseIdx = PV.length / 3;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(pts.length - 1, i + 1)];

        let tx = next[0] - prev[0];
        let tz = next[1] - prev[1];
        const len = Math.hypot(tx, tz) || 1;
        const nx = (-tz / len) * halfW;
        const nz = (tx / len) * halfW;

        PV.push(p[0] + nx, 0.05, p[1] + nz);
        PV.push(p[0] - nx, 0.05, p[1] - nz);

        // 空間ハッシュに登録
        if (i < pts.length - 1) {
          const nextP = pts[i + 1];
          gridAdd(p[0], p[1], nextP[0], nextP[1], halfW);
          this.roadNetwork.push({ from: p, to: nextP, width });
        }
      }

      for (let i = 0; i < pts.length - 1; i++) {
        const k = baseIdx + i * 2;
        PI.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      }
    });

    if (PV.length > 0) {
      this.flatMesh(PV, PI, pathMat, 0.05);
    }
  }

  // 4. 実在する128棟の建築物群の3D押し出し（Extrude）＆ディテール
  buildBuildings() {
    const wallPalette = [0xf1f5f9, 0xe2e8f0, 0xf8fafc, 0xfde68a, 0xfed7aa];
    const roofPalette = [0x991b1b, 0x1e3a8a, 0x334155, 0x78350f, 0x065f46];

    const wallTex = TextureGenerator.createPavementTexture();
    const woodTex = TextureGenerator.createWoodTexture();

    const normalWallMat = new THREE.MeshStandardMaterial({
      map: wallTex,
      roughness: 0.8,
      metalness: 0.1
    });

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.6
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x67e8f9,
      transmission: 0.82,
      transparent: true,
      roughness: 0.1,
      metalness: 0.3,
      ior: 1.5
    });

    parkData.buildings.forEach(b => {
      const o = b.o;
      if (!o || o.length < 3) return;

      const area = Math.abs(this.areaOf(o));
      let height = b.ht ? parseFloat(b.ht) : (b.lv ? parseFloat(b.lv) * 3.5 + 1 : (area < 40 ? 3.5 : (area > 1500 ? 10 : 6)));
      if (b.n && b.n.includes('展望塔')) height = 32; // 展望塔は32mの威容

      const [cx, cz] = this.centroid(o);
      const bb = this.bboxOf(o);

      const isGreenhouse = b.n && b.n.includes('温室');
      const isMuseum = b.n && b.n.includes('自然史博物館');
      const isTower = b.n && b.n.includes('展望塔');

      if (isGreenhouse) {
        // 温室：トラスガラスドーム＆ピラミッド
        this.buildGreenhouseArchitecture(o, height, cx, cz, glassMat);
      } else if (isMuseum) {
        // 自然史博物館：エントランスピラミッド＆展示ホール
        this.buildMuseumArchitecture(o, height, cx, cz, normalWallMat, glassMat);
      } else if (isTower) {
        // 展望塔
        this.buildObservationTower(cx, cz, height);
      } else {
        // 一般建築物の立体押し出し
        this.extrudePolygonBuilding(o, height, normalWallMat, roofMat);
      }

      // 名前付きスポットを登録
      if (b.n) {
        const cleanName = b.n.replace('豊橋総合動植物公園　', '').replace('豊橋市', '');
        this.namedBuildings.push({
          name: cleanName,
          x: cx,
          z: cz,
          h: height,
          poly: o,
          bb
        });
      }

      // 衝突判定コライダー登録
      this.colliders.push({ poly: o, bb, cx, cz, h: height });
    });
  }

  // 多角形壁面・屋根の押し出し生成
  extrudePolygonBuilding(poly, height, wallMat, roofMat) {
    const shape = new THREE.Shape();
    shape.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      shape.lineTo(poly[i][0], poly[i][1]);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: height,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.15,
      bevelThickness: 0.2
    };

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.rotateX(Math.PI / 2); // Three.jsの押し出しはZ方向なのでXZ平面に合わせる

    const mesh = new THREE.Mesh(geo, [wallMat, roofMat]);
    mesh.position.y = height;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  // 温室の精巧なガラス建築
  buildGreenhouseArchitecture(poly, height, cx, cz, glassMat) {
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.3 });
    const bb = this.bboxOf(poly);
    const width = bb.maxX - bb.minX;
    const depth = bb.maxZ - bb.minZ;

    // 半透明ガラス大ドーム
    const domeGeo = new THREE.SphereGeometry(Math.max(width, depth) / 2.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, glassMat);
    dome.position.set(cx, 0, cz);
    this.scene.add(dome);

    // ホワイトフレーム構造
    const wireGeo = new THREE.WireframeGeometry(domeGeo);
    const line = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    line.position.set(cx, 0, cz);
    this.scene.add(line);

    // 内部に透けて見える熱帯のヤシ・シダ巨木
    const innerTrunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const innerLeafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, height * 1.2, 8), innerTrunkMat);
    trunk.position.set(cx, height * 0.6, cz);
    const top = new THREE.Mesh(new THREE.DodecahedronGeometry(height * 0.55, 1), innerLeafMat);
    top.position.set(cx, height * 1.1, cz);
    this.scene.add(trunk, top);
  }

  // 自然史博物館のルーブル調ガラスピラミッド＆展示ホール
  buildMuseumArchitecture(poly, height, cx, cz, wallMat, glassMat) {
    const brickMat = new THREE.MeshStandardMaterial({
      color: 0x9a3412, // 鮮やかな赤煉瓦
      roughness: 0.85
    });

    // メインホール押し出し
    this.extrudePolygonBuilding(poly, height, brickMat, wallMat);

    // ピラミッド型ガラスエントランスキャノピー
    const pyrGeo = new THREE.ConeGeometry(12, 9, 4);
    const pyr = new THREE.Mesh(pyrGeo, glassMat);
    pyr.position.set(cx, 4.5, cz - 12);
    pyr.rotation.y = Math.PI / 4;
    pyr.castShadow = true;
    this.scene.add(pyr);

    const pyrWire = new THREE.Mesh(pyrGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
    pyrWire.position.set(cx, 4.5, cz - 12);
    pyrWire.rotation.y = Math.PI / 4;
    this.scene.add(pyrWire);
  }

  // 展望塔（地上32m）
  buildObservationTower(cx, cz, height) {
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.4, metalness: 0.3 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transmission: 0.8, roughness: 0.1 });

    const tower = new THREE.Group();
    tower.position.set(cx, 0, cz);

    // 主塔
    const column = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.8, height, 12), towerMat);
    column.position.y = height / 2;
    column.castShadow = true;
    tower.add(column);

    // 上部展望デッキ（パノラマ窓）
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 6.0, 4.5, 16), glassMat);
    deck.position.y = height;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(8.5, 3.5, 16), towerMat);
    roof.position.y = height + 3.8;
    tower.add(deck, roof);

    this.scene.add(tower);
  }

  // 5. こども汽車の線路レール
  buildRailway() {
    if (!parkData.rail) return;
    const railPts = parkData.rail;
    const railMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.8 });
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

    for (let i = 0; i < railPts.length; i++) {
      const p = railPts[i];
      const next = railPts[(i + 1) % railPts.length];

      // 枕木
      const midX = (p[0] + next[0]) / 2;
      const midZ = (p[1] + next[1]) / 2;
      const angle = Math.atan2(next[0] - p[0], next[1] - p[1]);

      const sleeper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.12, 0.4), sleeperMat);
      sleeper.position.set(midX, 0.08, midZ);
      sleeper.rotation.y = angle + Math.PI / 2;
      this.scene.add(sleeper);
    }
  }

  // プレイヤーの衝突判定チェック（建物・池に入らない）
  checkCollision(x, z, radius = 0.6) {
    // 建物との衝突判定
    for (const b of this.colliders) {
      if (x > b.bb.minX - radius && x < b.bb.maxX + radius &&
          z > b.bb.minZ - radius && z < b.bb.maxZ + radius) {
        if (this.inPoly(b.poly, x, z)) {
          return true; // 衝突
        }
      }
    }
    // 水域との衝突判定
    for (const w of this.waterPolys) {
      if (x > w.bb.minX - radius && x < w.bb.maxX + radius &&
          z > w.bb.minZ - radius && z < w.bb.maxZ + radius) {
        if (this.inPoly(w.poly, x, z)) {
          return true; // 水没防止
        }
      }
    }
    return false;
  }
}
