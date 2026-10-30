import * as THREE from 'three';
import { parkData } from '../data/parkData.js';
import { TextureGenerator } from './TextureGenerator.js';

export class Landmarks {
  constructor(scene, audioManager) {
    this.scene = scene;
    this.audio = audioManager;

    // アニメーション対象
    this.ferrisWheel = null;
    this.ferrisGondolas = [];
    this.ferrisLights = [];
    this.brachioNeck = null;
    this.babyBrachioNeck = null;
    this.trexHead = null;
    this.penguins = [];
    this.elephants = [];
    this.waterWheel = null;
    this.coasterCars = [];

    // インタラクションスポット
    this.spots = [];

    // 観覧車搭乗
    this.isRidingFerris = false;

    this.init();
  }

  init() {
    this.createGates();
    this.createFerrisWheel();
    this.createDinosaurLand();
    this.createGiraffeDeckAndSavanna();
    this.createElephantEnclosure();
    this.createPolarPavilion();
    this.createLionEnclosure();
    this.createSteamLocomotive();
    this.createRollerCoaster();
    this.createMonetPondAndWatermill();
    this.createCentralLakeFountain();
  }

  // 1. 各ゲート（中央門・東門・西門）
  createGates() {
    const woodMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWoodTexture(),
      roughness: 0.7
    });
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });

    const createGateStructure = (x, z, name, rot = 0, isMain = false) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rot;

      // 柱
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 7, 1.4), steelMat); p1.position.set(-6, 3.5, 0); p1.castShadow = true;
      const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 7, 1.4), steelMat); p2.position.set(6, 3.5, 0); p2.castShadow = true;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(15, 1.2, 1.2), woodMat); beam.position.set(0, 6.8, 0); beam.castShadow = true;
      g.add(p1, p2, beam);

      // 看板
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, 512, 128);
      ctx.strokeStyle = '#86efac'; ctx.lineWidth = 8; ctx.strokeRect(6, 6, 500, 116);
      ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 38px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(name, 256, 56);
      ctx.fillStyle = '#86efac'; ctx.font = 'bold 24px sans-serif';
      ctx.fillText('NONHOI PARK 豊橋総合動植物公園', 256, 96);

      const signTex = new THREE.CanvasTexture(canvas);
      const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(10, 2.5), new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 }));
      signBoard.position.set(0, 8.6, 0.1);
      g.add(signBoard);

      const signBack = signBoard.clone(); signBack.rotation.y = Math.PI; signBack.position.z = -0.1;
      g.add(signBack);

      this.scene.add(g);
      return g;
    };

    // 中央門: [-204.9, -59.0]
    createGateStructure(-204.9, -59.0, '中央門（メインゲート）', 0.8, true);
    this.spots.push({
      id: 'gate_main',
      title: '中央門（メインエントランス）',
      category: 'エントランス',
      pos: new THREE.Vector3(-204.9, 2, -59.0),
      dist: 16,
      desc: 'のんほいパーク（豊橋総合動植物公園）の正面ゲートです。動物園・植物園・遊園地・自然史博物館の4大ゾーンへのワクワクする旅がここから始まります！',
      trivia: '「のんほい」とは東三河地方の方言で、「のん（〜ですね）」と「ほい（おい／ちょっと）」を合わせた親しみあふれる呼びかけの言葉です。',
      icon: '🎫'
    });

    // 東門: [298.6, -108.9] (遊園地・植物園側)
    createGateStructure(298.6, -108.9, '東門', -0.5);
    this.spots.push({
      id: 'gate_east',
      title: '東門（遊園地・植物園口）',
      category: 'エントランス',
      pos: new THREE.Vector3(298.6, 2, -108.9),
      dist: 16,
      desc: '大観覧車や温室、大花壇がすぐ近くに広がる東側エントランスです。大型駐車場が直結しています。',
      trivia: '春には桜並木が美しく、植物園への最短アクセスゲートとして愛されています。',
      icon: '🌸'
    });

    // 西門: [-321.9, 92.9] (恐竜・動物園側)
    createGateStructure(-321.9, 92.9, '西門', 1.5);
    this.spots.push({
      id: 'gate_west',
      title: '西門（自然史博物館口）',
      category: 'エントランス',
      pos: new THREE.Vector3(-321.9, 2, 92.9),
      dist: 16,
      desc: '野外恐竜ランドや自然史博物館、動物園エリアに直結する西側ゲートです。',
      trivia: '西門から入ると、太古の森を模した木立の中に実物大の巨大恐竜モニュメントが次々と現れます！',
      icon: '🦕'
    });
  }

  // 2. 遊園地：実物大 大観覧車（全高48m・ゴンドラ24基・搭乗可能！）
  createFerrisWheel() {
    const fx = 176.5, fz = 99.7; // 実在OSM座標
    const ferrisGroup = new THREE.Group();
    ferrisGroup.position.set(fx, 0, fz);

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.6
    });

    // Aフレーム主支柱4本（高さ42m）
    const legGeo = new THREE.CylinderGeometry(0.65, 1.1, 44, 8);
    const legPositions = [
      { x: -7, z: -7, rx: 0.16, rz: -0.16 },
      { x: 7, z: -7, rx: 0.16, rz: 0.16 },
      { x: -7, z: 7, rx: -0.16, rz: -0.16 },
      { x: 7, z: 7, rx: -0.16, rz: 0.16 }
    ];

    legPositions.forEach(p => {
      const leg = new THREE.Mesh(legGeo, steelMat);
      leg.position.set(p.x, 21, p.z);
      leg.rotation.x = p.rx;
      leg.rotation.z = p.rz;
      leg.castShadow = true;
      ferrisGroup.add(leg);
    });

    // 支柱トラス横梁
    for (let h = 10; h <= 32; h += 11) {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 11), steelMat);
      b1.position.set(0, h, 0);
      ferrisGroup.add(b1);
    }

    // 回転ホイール部
    this.ferrisWheel = new THREE.Group();
    this.ferrisWheel.position.set(0, 42, 0);

    const axle = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 15, 16), steelMat);
    axle.rotation.x = Math.PI / 2;
    this.ferrisWheel.add(axle);

    const radius = 23;
    const ringGeo = new THREE.TorusGeometry(radius, 0.4, 8, 48);
    const innerRingGeo = new THREE.TorusGeometry(radius - 3.5, 0.3, 8, 48);

    const ring1 = new THREE.Mesh(ringGeo, steelMat); ring1.position.z = -4.2;
    const ring2 = new THREE.Mesh(ringGeo, steelMat); ring2.position.z = 4.2;
    const inRing1 = new THREE.Mesh(innerRingGeo, steelMat); inRing1.position.z = -4.2;
    const inRing2 = new THREE.Mesh(innerRingGeo, steelMat); inRing2.position.z = 4.2;
    this.ferrisWheel.add(ring1, ring2, inRing1, inRing2);

    const gondolaCount = 24;
    const gondolaColors = [0xef4444, 0xf59e0b, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899];
    this.ferrisGondolas = [];
    this.ferrisLights = [];

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      transmission: 0.85,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.5
    });

    for (let i = 0; i < gondolaCount; i++) {
      const angle = (i / gondolaCount) * Math.PI * 2;
      const gx = Math.cos(angle) * radius;
      const gy = Math.sin(angle) * radius;

      const spokeGeo = new THREE.CylinderGeometry(0.12, 0.12, radius, 6);
      const sp1 = new THREE.Mesh(spokeGeo, steelMat); sp1.position.set(gx / 2, gy / 2, -4.2); sp1.rotation.z = angle - Math.PI / 2;
      const sp2 = new THREE.Mesh(spokeGeo, steelMat); sp2.position.set(gx / 2, gy / 2, 4.2); sp2.rotation.z = angle - Math.PI / 2;
      this.ferrisWheel.add(sp1, sp2);

      const gondolaPivot = new THREE.Group();
      gondolaPivot.position.set(gx, gy, 0);

      const color = gondolaColors[i % gondolaColors.length];
      const roofMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });

      const gondolaBody = new THREE.Group();
      gondolaBody.position.y = -1.8;

      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.6, 12), roofMat);
      roof.position.y = 1.3;
      const glassCabin = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 1.6, 12), glassMat);
      glassCabin.position.y = 0.2;
      const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.25, 0.7, 12), roofMat);
      floor.position.y = -0.8;
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 1.8), roofMat);
      seat.position.y = -0.3;

      const ledMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3 });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), ledMat);
      led.position.y = 1.7;
      this.ferrisLights.push(ledMat);

      gondolaBody.add(roof, glassCabin, floor, seat, led);
      gondolaPivot.add(gondolaBody);
      this.ferrisWheel.add(gondolaPivot);

      this.ferrisGondolas.push({ pivot: gondolaPivot, angle, radius });
    }

    ferrisGroup.add(this.ferrisWheel);
    this.scene.add(ferrisGroup);

    this.spots.push({
      id: 'ferris',
      title: '大観覧車（遊園地エリア）',
      category: '遊園地',
      pos: new THREE.Vector3(fx, 2, fz),
      dist: 22,
      desc: '全高約48mを誇るのんほいパークのシンボル！1周約12分の空中散歩では、園内の豊かな緑と豊橋の街並み、遠く三河湾まで360度の大パノラマを一望できます。',
      trivia: '夜間にはイルミネーションが美しく点灯し、遠くの新幹線車窓からもカラフルに輝く姿を見ることができます。',
      icon: '🎡',
      actionType: 'ferris'
    });
  }

  // 3. 野外恐竜ランド（実在する実物大ブラキオサウルス親子、T-Rex、トリケラトプス等）
  createDinosaurLand() {
    const dinoGroup = new THREE.Group();
    const dinoBump = TextureGenerator.createGrassBumpMap();
    const dinoTex1 = TextureGenerator.createDinoSkinTexture('#3d4b38');
    const dinoTex2 = TextureGenerator.createDinoSkinTexture('#6b533a');

    const skinMatParent = new THREE.MeshStandardMaterial({
      map: dinoTex1, bumpMap: dinoBump, bumpScale: 0.12, roughness: 0.85
    });
    const skinMatBaby = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createDinoSkinTexture('#52664d'), bumpMap: dinoBump, bumpScale: 0.08, roughness: 0.85
    });

    // --- ブラキオサウルスの親子（親：全長23m・高さ13mの実物大！）---
    // OSM実在座標: [-89.1, -34.5]
    const bx = -89.1, bz = -34.5;
    const parentBrachio = new THREE.Group();
    parentBrachio.position.set(bx, 0, bz);

    const bBody = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 5.0, 10, 12), skinMatParent);
    bBody.rotation.z = Math.PI / 2; bBody.position.y = 8.0; bBody.castShadow = true;
    parentBrachio.add(bBody);

    const legGeo = new THREE.CylinderGeometry(1.2, 1.7, 7.5, 10);
    const l1 = new THREE.Mesh(legGeo, skinMatParent); l1.position.set(-3.8, 3.75, 2.8); l1.castShadow = true;
    const l2 = new THREE.Mesh(legGeo, skinMatParent); l2.position.set(-3.8, 3.75, -2.8); l2.castShadow = true;
    const l3 = new THREE.Mesh(legGeo, skinMatParent); l3.position.set(3.8, 3.75, 2.8); l3.castShadow = true;
    const l4 = new THREE.Mesh(legGeo, skinMatParent); l4.position.set(3.8, 3.75, -2.8); l4.castShadow = true;
    parentBrachio.add(l1, l2, l3, l4);

    this.brachioNeck = new THREE.Group();
    this.brachioNeck.position.set(-4.8, 9.2, 0);

    const neck1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.0, 9, 10), skinMatParent);
    neck1.position.set(-3.2, 4.2, 0); neck1.rotation.z = 0.65; neck1.castShadow = true;
    const neck2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 9, 10), skinMatParent);
    neck2.position.set(-7.5, 11.2, 0); neck2.rotation.z = 0.45; neck2.castShadow = true;

    const head = new THREE.Group(); head.position.set(-10.2, 16.0, 0);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 1.6), skinMatParent); skull.castShadow = true;
    const snout = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.2), skinMatParent); snout.position.set(-1.8, -0.2, 0);
    head.add(skull, snout);

    this.brachioNeck.add(neck1, neck2, head);
    parentBrachio.add(this.brachioNeck);

    const tailGeo = new THREE.ConeGeometry(1.8, 16, 10);
    const tail = new THREE.Mesh(tailGeo, skinMatParent);
    tail.position.set(11.0, 6.8, 0); tail.rotation.z = -1.35; tail.castShadow = true;
    parentBrachio.add(tail);

    dinoGroup.add(parentBrachio);

    // 子ブラキオサウルス
    const babyBrachio = new THREE.Group();
    babyBrachio.position.set(bx - 6, 0, bz - 8);
    babyBrachio.rotation.y = 0.8; babyBrachio.scale.set(0.45, 0.45, 0.45);

    const bbBody = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.8, 9, 10), skinMatBaby);
    bbBody.rotation.z = Math.PI / 2; bbBody.position.y = 7.5; bbBody.castShadow = true;
    babyBrachio.add(bbBody);

    const bl1 = new THREE.Mesh(legGeo, skinMatBaby); bl1.position.set(-3.5, 3.75, 2.6);
    const bl2 = new THREE.Mesh(legGeo, skinMatBaby); bl2.position.set(-3.5, 3.75, -2.6);
    const bl3 = new THREE.Mesh(legGeo, skinMatBaby); bl3.position.set(3.5, 3.75, 2.6);
    const bl4 = new THREE.Mesh(legGeo, skinMatBaby); bl4.position.set(3.5, 3.75, -2.6);
    babyBrachio.add(bl1, bl2, bl3, bl4);

    this.babyBrachioNeck = new THREE.Group();
    this.babyBrachioNeck.position.set(-4.5, 8.5, 0);
    const bNeck = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.8, 14, 8), skinMatBaby);
    bNeck.position.set(-4.2, 6.5, 0); bNeck.rotation.z = 0.5;
    const bHead = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.4), skinMatBaby);
    bHead.position.set(-8.2, 13.0, 0);
    this.babyBrachioNeck.add(bNeck, bHead);
    babyBrachio.add(this.babyBrachioNeck);

    dinoGroup.add(babyBrachio);

    // --- ティラノサウルス (T-Rex) ---
    const trexMat = new THREE.MeshStandardMaterial({
      map: dinoTex2, bumpMap: dinoBump, bumpScale: 0.1, roughness: 0.85
    });
    const trex = new THREE.Group();
    trex.position.set(-40, 0, -40);
    trex.rotation.y = -Math.PI / 3;

    const tBody = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.0, 6.5, 10), trexMat);
    tBody.position.y = 6.0; tBody.rotation.z = 0.85; tBody.castShadow = true;
    trex.add(tBody);

    const tLegGeo = new THREE.CylinderGeometry(0.8, 1.3, 5.5, 8);
    const tl1 = new THREE.Mesh(tLegGeo, trexMat); tl1.position.set(-1.4, 2.75, 1.6); tl1.castShadow = true;
    const tl2 = new THREE.Mesh(tLegGeo, trexMat); tl2.position.set(-1.4, 2.75, -1.6); tl2.castShadow = true;
    trex.add(tl1, tl2);

    this.trexHead = new THREE.Group();
    this.trexHead.position.set(-3.5, 8.2, 0);
    const tHead = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 2.0), trexMat);
    tHead.position.set(-1.6, 0.5, 0); tHead.castShadow = true;
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 1.6), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }));
    teeth.position.set(-1.6, -0.8, 0);
    this.trexHead.add(tHead, teeth);
    trex.add(this.trexHead);

    dinoGroup.add(trex);

    // --- トリケラトプス (OSM: [-60.9, -34.2]) ---
    const tri = new THREE.Group();
    tri.position.set(-60.9, 0, -34.2);
    tri.rotation.y = Math.PI / 4;

    const triBody = new THREE.Mesh(new THREE.SphereGeometry(3.0, 10, 10), skinMatParent);
    triBody.position.y = 3.0; triBody.scale.set(1.5, 1, 1); triBody.castShadow = true;
    tri.add(triBody);

    const frill = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.4, 10), skinMatParent);
    frill.position.set(-3.0, 4.2, 0); frill.rotation.z = 0.65; frill.castShadow = true;
    tri.add(frill);

    const hornMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    const hornGeo = new THREE.ConeGeometry(0.3, 2.6, 8);
    const h1 = new THREE.Mesh(hornGeo, hornMat); h1.position.set(-4.4, 4.8, 1.1); h1.rotation.z = -1.2;
    const h2 = new THREE.Mesh(hornGeo, hornMat); h2.position.set(-4.4, 4.8, -1.1); h2.rotation.z = -1.2;
    tri.add(h1, h2);

    dinoGroup.add(tri);

    // --- メガロドン (巨大ザメの顎モニュメント, OSM: [-34.9, -22.2]) ---
    const jawGroup = new THREE.Group();
    jawGroup.position.set(-34.9, 0, -22.2);
    const jawMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.5 });
    const jawArch = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.45, 8, 24, Math.PI), jawMat);
    jawArch.position.y = 3.2; jawArch.rotation.z = Math.PI;
    jawGroup.add(jawArch);
    dinoGroup.add(jawGroup);

    this.scene.add(dinoGroup);

    this.spots.push({
      id: 'dino',
      title: '野外恐竜ランド（自然史博物館前広場）',
      category: '博物館',
      pos: new THREE.Vector3(bx, 2, bz),
      dist: 20,
      desc: '太古の白亜紀・ジュラ紀へタイムスリップ！実物大のブラキオサウルス親子をはじめ、ティラノサウルスやトリケラトプスなど10体以上の本格的な恐竜モニュメントが木立の中に堂々と並びます。',
      trivia: '親ブラキオサウルスは全長約23m・高さ約13m！足元から見上げるその巨大さは圧巻で、全国の恐竜ファンが訪れる名物スポットです。',
      icon: '🦕',
      actionType: 'roar'
    });
  }

  // 4. キリンデッキ & アフリカサバンナ園 (OSM: [129.2, 44.2] 付近)
  createGiraffeDeckAndSavanna() {
    const gx = 129.2, gz = 44.2;
    const savannaGroup = new THREE.Group();
    savannaGroup.position.set(gx, 0, gz);

    const woodMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWoodTexture(),
      roughness: 0.75
    });

    // キリンデッキ（高さ3.1mの木製観察デッキ）
    const deckPlatform = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 9), woodMat);
    deckPlatform.position.set(0, 3.1, 0); deckPlatform.castShadow = true; deckPlatform.receiveShadow = true;
    savannaGroup.add(deckPlatform);

    // スロープ（地上から登れるバリアフリースロープ）
    const slope = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 12), woodMat);
    slope.position.set(12, 1.5, 0); slope.rotation.z = -0.25; slope.castShadow = true;
    savannaGroup.add(slope);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(18, 1.1, 0.15), railMat); r1.position.set(0, 3.9, 4.4);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(18, 1.1, 0.15), railMat); r2.position.set(0, 3.9, -4.4);
    savannaGroup.add(r1, r2);

    for (let x = -8; x <= 8; x += 4) {
      for (let z = -4; z <= 4; z += 8) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3.1, 8), railMat);
        pillar.position.set(x, 1.55, z); pillar.castShadow = true;
        savannaGroup.add(pillar);
      }
    }

    // キリンのモデル（網目模様テクスチャ）
    const giraffeTex = TextureGenerator.createGiraffeTexture();
    const giraffeMat = new THREE.MeshStandardMaterial({ map: giraffeTex, roughness: 0.7 });

    const createGiraffe = (scale, x, z, rot) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z); g.rotation.y = rot; g.scale.set(scale, scale, scale);

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 4.2), giraffeMat);
      body.position.y = 5.8; body.castShadow = true; g.add(body);

      const legGeo = new THREE.CylinderGeometry(0.22, 0.28, 5.2, 8);
      const l1 = new THREE.Mesh(legGeo, giraffeMat); l1.position.set(-0.9, 2.6, 1.5); l1.castShadow = true;
      const l2 = new THREE.Mesh(legGeo, giraffeMat); l2.position.set(0.9, 2.6, 1.5); l2.castShadow = true;
      const l3 = new THREE.Mesh(legGeo, giraffeMat); l3.position.set(-0.9, 2.6, -1.5); l3.castShadow = true;
      const l4 = new THREE.Mesh(legGeo, giraffeMat); l4.position.set(0.9, 2.6, -1.5); l4.castShadow = true;
      g.add(l1, l2, l3, l4);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7.2, 8), giraffeMat);
      neck.position.set(0, 10.2, -1.5); neck.rotation.x = -0.18; neck.castShadow = true;
      g.add(neck);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 1.6), giraffeMat);
      head.position.set(0, 13.8, -2.1); head.castShadow = true;
      g.add(head);

      return g;
    };

    savannaGroup.add(createGiraffe(1.0, 4.5, 7.5, -0.4));
    savannaGroup.add(createGiraffe(0.68, 10, 8.5, 0.3));

    // シマウマ
    const zebraTex = TextureGenerator.createZebraTexture();
    const zebraMat = new THREE.MeshStandardMaterial({ map: zebraTex, roughness: 0.6 });
    const zebra = new THREE.Group();
    zebra.position.set(-10, 0, 8);
    zebra.rotation.y = 0.5;
    const zBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 3.2), zebraMat); zBody.position.y = 2.8; zBody.castShadow = true;
    const zHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.5), zebraMat); zHead.position.set(0, 4.2, -1.2);
    zebra.add(zBody, zHead);
    savannaGroup.add(zebra);

    this.scene.add(savannaGroup);

    this.spots.push({
      id: 'africa',
      title: 'アフリカ園・キリンデッキ（動物園エリア）',
      category: '動物園',
      pos: new THREE.Vector3(gx, 4.9, gz),
      dist: 18,
      desc: 'アフリカのサバンナを忠実に再現した開放的エリアです。人気の「キリンデッキ」は地上約3.1mの高さがあり、大人のキリンとほぼ同じ目線の高さから間近に観察できます！',
      trivia: 'キリンデッキはバリアフリー設計で、キリンのほかにシマウマやダチョウ、エランドたちがのびのびと共生する様子を一望できます。',
      icon: '🦒'
    });
  }

  // 5. アジアゾウ舎 (OSM: [-149.3, 170.5])
  createElephantEnclosure() {
    const ex = -149.3, ez = 170.5;
    const elephantGroup = new THREE.Group();
    elephantGroup.position.set(ex, 0, ez);

    const elephantMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, bumpMap: TextureGenerator.createGrassBumpMap(), bumpScale: 0.08, roughness: 0.9
    });

    const createEle = (scale, x, z, rot) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z); g.rotation.y = rot; g.scale.set(scale, scale, scale);

      const body = new THREE.Mesh(new THREE.BoxGeometry(4.8, 4.4, 7.0), elephantMat);
      body.position.y = 4.8; body.castShadow = true; g.add(body);

      const legGeo = new THREE.CylinderGeometry(0.85, 1.1, 4.4, 8);
      const l1 = new THREE.Mesh(legGeo, elephantMat); l1.position.set(-1.9, 2.2, 2.3); l1.castShadow = true;
      const l2 = new THREE.Mesh(legGeo, elephantMat); l2.position.set(1.9, 2.2, 2.3); l2.castShadow = true;
      const l3 = new THREE.Mesh(legGeo, elephantMat); l3.position.set(-1.9, 2.2, -2.3); l3.castShadow = true;
      const l4 = new THREE.Mesh(legGeo, elephantMat); l4.position.set(1.9, 2.2, -2.3); l4.castShadow = true;
      g.add(l1, l2, l3, l4);

      const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), elephantMat);
      head.position.set(0, 6.2, 4.2); head.castShadow = true; g.add(head);

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.65, 4.2, 8), elephantMat);
      trunk.position.set(0, 3.8, 5.5); trunk.rotation.x = 0.45; trunk.castShadow = true;
      g.add(trunk);

      this.elephants.push({ group: g, trunk });
      return g;
    };

    elephantGroup.add(createEle(1.0, 0, 0, 0.5));
    elephantGroup.add(createEle(0.7, 8, -6, -0.8));

    this.scene.add(elephantGroup);

    this.spots.push({
      id: 'elephant',
      title: 'アジアゾウ舎（動物園エリア）',
      category: '動物園',
      pos: new THREE.Vector3(ex, 2, ez),
      dist: 18,
      desc: '広々とした放飼場で暮らすアジアゾウたち。水浴びを楽しんだり、群れで仲良くコミュニケーションをとる姿に癒やされます。',
      trivia: 'のんほいパークのアジアゾウ放飼場は、国際的な動物福祉基準に合わせた日本有数の広さを誇ります。',
      icon: '🐘'
    });
  }

  // 6. 極地動物館 (OSM: [-91.9, 127.9])
  createPolarPavilion() {
    const px = -91.9, pz = 127.9;
    const polarGroup = new THREE.Group();
    polarGroup.position.set(px, 0, pz);

    const iceMat = new THREE.MeshStandardMaterial({ color: 0xf0fdf4, roughness: 0.2 });
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.6 });

    const iceberg = new THREE.Mesh(new THREE.DodecahedronGeometry(9, 1), iceMat);
    iceberg.position.set(0, 2.5, 0); iceberg.castShadow = true;
    polarGroup.add(iceberg);

    const pool = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 1.5, 24), poolMat);
    pool.position.set(7, 0.75, 0);
    polarGroup.add(pool);

    const bearMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const bear = new THREE.Group();
    bear.position.set(2, 5.0, -2);
    const bearBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 4.4), bearMat); bearBody.castShadow = true;
    const bearHead = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 1.9), bearMat); bearHead.position.set(0, 0.6, 2.5);
    bear.add(bearBody, bearHead);
    polarGroup.add(bear);

    // よちよち歩くペンギン8羽
    const penguinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    for (let i = 0; i < 8; i++) {
      const p = new THREE.Group();
      p.position.set(11 + Math.cos(i * 0.8) * 3.5, 1.5, Math.sin(i * 0.8) * 3.5);
      p.rotation.y = Math.random() * Math.PI * 2;

      const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 1.3, 8), penguinMat);
      pBody.position.y = 0.65; pBody.castShadow = true;
      const pBelly = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.95), bellyMat);
      pBelly.position.set(0, 0.65, 0.38);
      p.add(pBody, pBelly);

      polarGroup.add(p);
      this.penguins.push({ group: p, phase: i });
    }

    this.scene.add(polarGroup);

    this.spots.push({
      id: 'polar',
      title: '極地動物館（ホッキョクグマ・ペンギン）',
      category: '動物園',
      pos: new THREE.Vector3(px, 2, pz),
      dist: 18,
      desc: '水中観察トンネルから、ホッキョクグマの豪快な飛び込みやペンギンたちがロケットのように水中を泳ぐ姿を間近で観察できる大人気施設です！',
      trivia: 'ホッキョクグマのおやつタイム（飛び込みフィーディング）は園内屈指のシャッターチャンスです！',
      icon: '🐻‍❄️'
    });
  }

  // 7. 猛獣舎 (OSM: [-287.5, 206.9])
  createLionEnclosure() {
    const lx = -287.5, lz = 206.9;
    const lionGroup = new THREE.Group();
    lionGroup.position.set(lx, 0, lz);

    const lionMat = new THREE.MeshStandardMaterial({ color: 0xc8913f, roughness: 0.8 });
    const maneMat = new THREE.MeshStandardMaterial({ color: 0x5c2b0c, roughness: 0.9 });
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });

    // 岩山
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(4.5, 1), rockMat);
    rock.position.y = 2.0; rock.castShadow = true;
    lionGroup.add(rock);

    // オスライオン
    const lion = new THREE.Group();
    lion.position.set(0, 4.2, 0);
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 3.2), lionMat); body.castShadow = true;
    const mane = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 8), maneMat); mane.position.set(0, 1.2, 1.4);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.2), lionMat); head.position.set(0, 1.2, 2.0);
    lion.add(body, mane, head);
    lionGroup.add(lion);

    this.scene.add(lionGroup);
  }

  // 8. D51 89 蒸気機関車モニュメント (OSM: [-237.5, -10.7])
  createSteamLocomotive() {
    const lx = -237.5, lz = -10.7;
    const locoGroup = new THREE.Group();
    locoGroup.position.set(lx, 0, lz);
    locoGroup.rotation.y = 0.4;

    const darkSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });

    // ボイラー胴体
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 8, 16), darkSteel);
    boiler.rotation.x = Math.PI / 2; boiler.position.set(0, 2.6, 0); boiler.castShadow = true;
    locoGroup.add(boiler);

    // 煙突
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.2, 10), darkSteel);
    chimney.position.set(0, 4.2, 3.0);
    locoGroup.add(chimney);

    // 運転席キャブ
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 3.2), darkSteel);
    cab.position.set(0, 3.0, -3.2); cab.castShadow = true;
    locoGroup.add(cab);

    // ナンバープレート "D51 89"
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.05), goldMat);
    plate.position.set(0, 3.6, 4.02);
    locoGroup.add(plate);

    // 動輪（巨大な車輪）
    const wheelGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.25, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    for (let i = -2; i <= 2; i++) {
      const wL = new THREE.Mesh(wheelGeo, darkSteel); wL.position.set(-1.4, 0.85, i * 1.5);
      const wR = new THREE.Mesh(wheelGeo, darkSteel); wR.position.set(1.4, 0.85, i * 1.5);
      locoGroup.add(wL, wR);
    }

    this.scene.add(locoGroup);

    this.spots.push({
      id: 'd51',
      title: '蒸気機関車 D51 89（デゴイチ）',
      category: 'モニュメント',
      pos: new THREE.Vector3(lx, 2, lz),
      dist: 16,
      desc: '昭和13年に製造され、国鉄で活躍した本物の蒸気機関車「D51 89号機」が美しく静態保存されています。',
      trivia: '通称「デゴイチ」の愛称で親しまれ、中央門から入ってすぐの広場で堂々たる姿を見せてくれます！',
      icon: '🚂'
    });
  }

  // 9. のんほいコースター (OSM: [264.0, -8.7])
  createRollerCoaster() {
    const cx = 264.0, cz = -8.7;
    const coasterGroup = new THREE.Group();
    coasterGroup.position.set(cx, 0, cz);

    const railMat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.4 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.3 });

    // コースター軌道のループ曲線
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 3, -15),
      new THREE.Vector3(15, 14, 0),
      new THREE.Vector3(0, 8, 15),
      new THREE.Vector3(-15, 16, 0),
      new THREE.Vector3(0, 3, -15)
    ], true);

    const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.25, 8, true);
    const tube = new THREE.Mesh(tubeGeo, railMat);
    tube.castShadow = true;
    coasterGroup.add(tube);

    // 支柱
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      const px = Math.cos(a) * 14;
      const pz = Math.sin(a) * 14;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 16, 8), pillarMat);
      pil.position.set(px, 8, pz);
      coasterGroup.add(pil);
    }

    this.scene.add(coasterGroup);

    this.spots.push({
      id: 'coaster',
      title: 'のんほいコースター（遊園地エリア）',
      category: '遊園地',
      pos: new THREE.Vector3(cx, 2, cz),
      dist: 18,
      desc: '小さな子どもから大人まで楽しめる、スリル満点のファミリーコースターです！',
      trivia: '木々の間を縫うように疾走し、心地よい風を感じられます。',
      icon: '🎢'
    });
  }

  // 10. モネの池・太鼓橋・水車 (OSM: [190.4, -177.3] & [114.4, -207.3])
  createMonetPondAndWatermill() {
    const mx = 190.4, mz = -177.3;
    const monetGroup = new THREE.Group();
    monetGroup.position.set(mx, 0, mz);

    // モネの緑の太鼓橋
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(9, 0.5, 8, 24, Math.PI / 3), bridgeMat);
    arch.position.set(0, -4.0, 0); arch.rotation.z = Math.PI / 3; arch.castShadow = true;
    monetGroup.add(arch);

    // 睡蓮の葉と花
    const padMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 });
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * Math.PI * 2; const r = Math.random() * 8;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.8, 8), padMat);
      pad.rotation.x = -Math.PI / 2; pad.position.set(Math.cos(a) * r, 0.12, Math.sin(a) * r);
      monetGroup.add(pad);
      if (i % 2 === 0) {
        const fl = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), flowerMat);
        fl.position.set(Math.cos(a) * r, 0.25, Math.sin(a) * r);
        monetGroup.add(fl);
      }
    }
    this.scene.add(monetGroup);

    // 水車 (OSM: [114.4, -207.3])
    const wx = 114.4, wz = -207.3;
    const millGroup = new THREE.Group();
    millGroup.position.set(wx, 0, wz);
    const woodMat = new THREE.MeshStandardMaterial({ map: TextureGenerator.createWoodTexture(), roughness: 0.8 });

    this.waterWheel = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.35, 8, 16), woodMat);
    this.waterWheel.position.set(0, 2.5, 0);
    millGroup.add(this.waterWheel);

    const hut = new THREE.Mesh(new THREE.BoxGeometry(3.5, 3.0, 3.5), woodMat);
    hut.position.set(-2.5, 1.5, 0); hut.castShadow = true;
    millGroup.add(hut);

    this.scene.add(millGroup);

    this.spots.push({
      id: 'monet',
      title: 'モネの池・すいれんの園（植物園エリア）',
      category: '植物園',
      pos: new THREE.Vector3(mx, 2, mz),
      dist: 16,
      desc: 'フランス・ジヴェルニーの画家モネの自宅の庭から株分けされた貴重な睡蓮が浮かぶ美しい池です。',
      trivia: '名画「睡蓮」の世界観そのままの緑の太鼓橋がかかり、絶好のフォトスポットとなっています。',
      icon: '🪷'
    });
  }

  // 11. 中央大池・大噴水 (OSM: [0.1, -20.0])
  createCentralLakeFountain() {
    const fx = 0.1, fz = -20.0;
    const fountainGroup = new THREE.Group();
    fountainGroup.position.set(fx, 0, fz);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 1.4, 20), stoneMat);
    base.position.y = 0.7; base.castShadow = true;
    fountainGroup.add(base);

    // 噴水パーティクル
    const count = 160;
    const fountainGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const vel = [];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 1] = 1.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      vel.push({ x: (Math.random() - 0.5) * 2.2, y: 7.0 + Math.random() * 4.5, z: (Math.random() - 0.5) * 2.2 });
    }

    fountainGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.fountainGeo = fountainGeo;
    this.fountainVel = vel;

    const pMat = new THREE.PointsMaterial({ color: 0xbfdbfe, size: 0.6, transparent: true, opacity: 0.85 });
    this.fountainPoints = new THREE.Points(fountainGeo, pMat);
    fountainGroup.add(this.fountainPoints);

    this.scene.add(fountainGroup);

    this.spots.push({
      id: 'lake',
      title: '中央大池・大噴水',
      category: '中央エリア',
      pos: new THREE.Vector3(fx, 2, fz),
      dist: 16,
      desc: 'のんほいパークの中心に広がる雄大な大池です。水鳥が集い、水しぶきを上げる大噴水が散策者を迎えます。',
      trivia: '4つのゾーンを結ぶ要となる場所で、ボート遊びや湖畔の散策を楽しむことができます。',
      icon: '🌊'
    });
  }

  update(delta, time) {
    // 観覧車の回転
    if (this.ferrisWheel) {
      this.ferrisWheel.rotation.z -= delta * 0.12;
      this.ferrisGondolas.forEach(g => {
        g.pivot.rotation.z = -this.ferrisWheel.rotation.z;
      });
    }

    // 観覧車ネオン点滅
    if (this.ferrisLights.length > 0) {
      for (let i = 0; i < this.ferrisLights.length; i++) {
        const pulse = Math.sin(time * 4 + i * 0.3) * 0.5 + 0.5;
        this.ferrisLights[i].emissiveIntensity = 0.3 + pulse * 1.5;
      }
    }

    // ブラキオサウルスの首の穏やかな動き
    if (this.brachioNeck) {
      this.brachioNeck.rotation.y = Math.sin(time * 0.7) * 0.12;
      this.brachioNeck.rotation.z = Math.cos(time * 0.4) * 0.06;
    }
    if (this.babyBrachioNeck) {
      this.babyBrachioNeck.rotation.y = Math.sin(time * 0.9 + 1) * 0.15;
    }

    // T-Rexの首の威嚇動作
    if (this.trexHead) {
      this.trexHead.rotation.x = Math.sin(time * 1.4) * 0.12;
      this.trexHead.rotation.y = Math.cos(time * 0.9) * 0.18;
    }

    // ペンギンのよちよち歩き
    this.penguins.forEach(p => {
      p.group.rotation.z = Math.sin(time * 4.5 + p.phase) * 0.14;
    });

    // ゾウの鼻スイング
    this.elephants.forEach((e, idx) => {
      e.trunk.rotation.x = 0.45 + Math.sin(time * 1.5 + idx) * 0.25;
    });

    // 水車の回転
    if (this.waterWheel) {
      this.waterWheel.rotation.x += delta * 0.8;
    }

    // 噴水パーティクルの更新
    if (this.fountainGeo && this.fountainVel) {
      const pos = this.fountainGeo.attributes.position.array;
      for (let i = 0; i < this.fountainVel.length; i++) {
        const v = this.fountainVel[i];
        pos[i * 3] += v.x * delta;
        pos[i * 3 + 1] += v.y * delta;
        pos[i * 3 + 2] += v.z * delta;
        v.y -= 10.5 * delta;

        if (pos[i * 3 + 1] <= 1.0) {
          pos[i * 3] = (Math.random() - 0.5) * 0.5;
          pos[i * 3 + 1] = 1.0;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          v.x = (Math.random() - 0.5) * 2.2;
          v.y = 7.0 + Math.random() * 4.5;
          v.z = (Math.random() - 0.5) * 2.2;
        }
      }
      this.fountainGeo.attributes.position.needsUpdate = true;
    }
  }

  // 観覧車乗車時のゴンドラワールド座標
  getGondolaWorldPosition(index = 0) {
    if (!this.ferrisGondolas[index]) return new THREE.Vector3(176.5, 20, 99.7);
    const target = new THREE.Vector3();
    this.ferrisGondolas[index].pivot.getWorldPosition(target);
    target.y -= 1.6;
    return target;
  }
}
