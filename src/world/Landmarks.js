import * as THREE from 'three';
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

    // インタラクションスポット
    this.spots = [];

    // 観覧車搭乗管理
    this.isRidingFerris = false;

    this.init();
  }

  init() {
    this.createMainGate();
    this.createFerrisWheel();
    this.createDinosaurPark();
    this.createMuseumBuilding();
    this.createGreenhouse();
    this.createMonetPond();
    this.createZooAfrica();
    this.createZooPolar();
    this.createZooElephant();
    this.createCentralBridge();
    this.createSignposts();
  }

  // 1. 中央門（メインゲート）
  createMainGate() {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, 95);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWoodTexture(),
      roughness: 0.7
    });

    // 重厚な石造りの門柱
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7.5, 1.6), stoneMat);
    p1.position.set(-7, 3.75, 0);
    p1.castShadow = true;
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7.5, 1.6), stoneMat);
    p2.position.set(7, 3.75, 0);
    p2.castShadow = true;
    gateGroup.add(p1, p2);

    // アーチ梁
    const beam = new THREE.Mesh(new THREE.BoxGeometry(16, 1.4, 1.2), woodMat);
    beam.position.set(0, 7.2, 0);
    beam.castShadow = true;
    gateGroup.add(beam);

    // 看板テクスチャ生成
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NONHOI PARK', 512, 105);

    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 50px sans-serif';
    ctx.fillText('豊橋総合動植物公園', 512, 195);

    const signTex = new THREE.CanvasTexture(canvas);
    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3.0),
      new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.4 })
    );
    signBoard.position.set(0, 9.2, 0.2);
    gateGroup.add(signBoard);

    const signBoardBack = signBoard.clone();
    signBoardBack.rotation.y = Math.PI;
    signBoardBack.position.z = -0.2;
    gateGroup.add(signBoardBack);

    // 改札ゲートターンスタイル
    const gateBarMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
    for (let x = -5; x <= 5; x += 2.5) {
      const turnstile = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 1.2), gateBarMat);
      turnstile.position.set(x, 0.55, 0);
      gateGroup.add(turnstile);
    }

    this.scene.add(gateGroup);

    this.spots.push({
      id: 'gate',
      title: '中央門（メインエントランス）',
      category: 'エントランス',
      pos: new THREE.Vector3(0, 2, 95),
      dist: 8,
      desc: 'のんほいパーク（豊橋総合動植物公園）の正面ゲートです。動物園・植物園・遊園地・自然史博物館の4大ゾーンへのワクワクする旅がここから始まります！',
      trivia: '「のんほい」とは東三河地方の方言で、「のん（〜ですね）」と「ほい（おい／ちょっと）」を合わせた親しみあふれる呼びかけの言葉です。',
      icon: '🎫'
    });
  }

  // 2. 遊園地：大観覧車（全高48m・ゴンドラ24基・トラス構造）
  createFerrisWheel() {
    const ferrisGroup = new THREE.Group();
    ferrisGroup.position.set(80, 0, -70);

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.5
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

    // 支柱間のクロスブレース（斜材トラス）
    for (let h = 10; h <= 32; h += 11) {
      const braceMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4 });
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 10), braceMat);
      b1.position.set(0, h, 0);
      ferrisGroup.add(b1);
    }

    // 回転ホイール部
    this.ferrisWheel = new THREE.Group();
    this.ferrisWheel.position.set(0, 42, 0);

    // 車軸ハブ
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 14, 16), steelMat);
    axle.rotation.x = Math.PI / 2;
    this.ferrisWheel.add(axle);

    // 二重リング構造（外径23m）
    const radius = 23;
    const ringGeo = new THREE.TorusGeometry(radius, 0.4, 8, 48);
    const innerRingGeo = new THREE.TorusGeometry(radius - 3.5, 0.3, 8, 48);

    const ring1 = new THREE.Mesh(ringGeo, steelMat); ring1.position.z = -4.2;
    const ring2 = new THREE.Mesh(ringGeo, steelMat); ring2.position.z = 4.2;
    const inRing1 = new THREE.Mesh(innerRingGeo, steelMat); inRing1.position.z = -4.2;
    const inRing2 = new THREE.Mesh(innerRingGeo, steelMat); inRing2.position.z = 4.2;

    this.ferrisWheel.add(ring1, ring2, inRing1, inRing2);

    // ゴンドラ24基
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

      // ラジアルスポーク（骨組み棒）
      const spokeGeo = new THREE.CylinderGeometry(0.12, 0.12, radius, 6);
      const sp1 = new THREE.Mesh(spokeGeo, steelMat);
      sp1.position.set(gx / 2, gy / 2, -4.2);
      sp1.rotation.z = angle - Math.PI / 2;
      const sp2 = new THREE.Mesh(spokeGeo, steelMat);
      sp2.position.set(gx / 2, gy / 2, 4.2);
      sp2.rotation.z = angle - Math.PI / 2;
      this.ferrisWheel.add(sp1, sp2);

      // ゴンドラ吊り下げピボット
      const gondolaPivot = new THREE.Group();
      gondolaPivot.position.set(gx, gy, 0);

      const color = gondolaColors[i % gondolaColors.length];
      const roofMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 });
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

      // ゴンドラ客車
      const gondolaBody = new THREE.Group();
      gondolaBody.position.y = -1.8;

      // 屋根（ドーム状）
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.6, 12), roofMat);
      roof.position.y = 1.3;
      gondolaBody.add(roof);

      // キャビン窓（360度パノラマガラス）
      const glassCabin = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 1.6, 12), glassMat);
      glassCabin.position.y = 0.2;
      gondolaBody.add(glassCabin);

      // キャビン床下部
      const floor = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.25, 0.7, 12), roofMat);
      floor.position.y = -0.8;
      gondolaBody.add(floor);

      // 内部シート
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 1.8), roofMat);
      seat.position.y = -0.3;
      gondolaBody.add(seat);

      // 夜間イルミネーション用LED
      const ledMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.2
      });
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), ledMat);
      led.position.y = 1.7;
      gondolaBody.add(led);
      this.ferrisLights.push(ledMat);

      gondolaPivot.add(gondolaBody);
      this.ferrisWheel.add(gondolaPivot);

      this.ferrisGondolas.push({
        pivot: gondolaPivot,
        angle: angle,
        radius: radius
      });
    }

    ferrisGroup.add(this.ferrisWheel);
    this.scene.add(ferrisGroup);

    this.spots.push({
      id: 'ferris',
      title: '大観覧車（遊園地エリア）',
      category: '遊園地',
      pos: new THREE.Vector3(80, 2, -60),
      dist: 22,
      desc: '全高約48mを誇るのんほいパークのシンボル！1周約12分の空中散歩では、園内の豊かな緑と豊橋の街並み、遠く三河湾まで360度の大パノラマを一望できます。',
      trivia: 'ゴンドラ数は36基！夜間にはイルミネーションが美しく点灯し、遠くの新幹線車窓からもカラフルに輝く姿を見ることができます。',
      icon: '🎡',
      actionType: 'ferris'
    });
  }

  // 3. 自然史博物館：野外恐竜ランド（ブラキオサウルスの親子、ティラノサウルス、トリケラトプス）
  createDinosaurPark() {
    const dinoGroup = new THREE.Group();
    dinoGroup.position.set(-80, 0, 80);

    // 爬虫類ウロコ肌テクスチャ
    const dinoTex1 = TextureGenerator.createDinoSkinTexture('#3d4b38');
    const dinoTex2 = TextureGenerator.createDinoSkinTexture('#6b533a');
    const dinoBump = TextureGenerator.createGrassBumpMap();

    const skinMatParent = new THREE.MeshStandardMaterial({
      map: dinoTex1,
      bumpMap: dinoBump,
      bumpScale: 0.12,
      roughness: 0.85
    });

    const skinMatBaby = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createDinoSkinTexture('#52664d'),
      bumpMap: dinoBump,
      bumpScale: 0.08,
      roughness: 0.85
    });

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });

    // --- 親ブラキオサウルス（全長約23m・高さ13mの実物大迫力！） ---
    const parentBrachio = new THREE.Group();
    parentBrachio.position.set(0, 0, 0);

    // 巨大な樽型胴体
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.8, 5.0, 10, 12), skinMatParent);
    body.rotation.z = Math.PI / 2;
    body.position.y = 8.0;
    body.castShadow = true;
    parentBrachio.add(body);

    // 四肢（巨木のような足）
    const legGeo = new THREE.CylinderGeometry(1.2, 1.7, 7.5, 10);
    const l1 = new THREE.Mesh(legGeo, skinMatParent); l1.position.set(-3.8, 3.75, 2.8); l1.castShadow = true;
    const l2 = new THREE.Mesh(legGeo, skinMatParent); l2.position.set(-3.8, 3.75, -2.8); l2.castShadow = true;
    const l3 = new THREE.Mesh(legGeo, skinMatParent); l3.position.set(3.8, 3.75, 2.8); l3.castShadow = true;
    const l4 = new THREE.Mesh(legGeo, skinMatParent); l4.position.set(3.8, 3.75, -2.8); l4.castShadow = true;
    parentBrachio.add(l1, l2, l3, l4);

    // 首の付け根（アニメーションピボット）
    this.brachioNeck = new THREE.Group();
    this.brachioNeck.position.set(-4.8, 9.2, 0);

    // 長い首（多関節）
    const neck1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 2.0, 9, 10), skinMatParent);
    neck1.position.set(-3.2, 4.2, 0);
    neck1.rotation.z = 0.65;
    neck1.castShadow = true;

    const neck2 = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 9, 10), skinMatParent);
    neck2.position.set(-7.5, 11.2, 0);
    neck2.rotation.z = 0.45;
    neck2.castShadow = true;

    // 頭部
    const head = new THREE.Group();
    head.position.set(-10.2, 16.0, 0);
    const skull = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.6, 1.6), skinMatParent);
    skull.castShadow = true;
    const snout = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.2), skinMatParent);
    snout.position.set(-1.8, -0.2, 0);
    head.add(skull, snout);

    this.brachioNeck.add(neck1, neck2, head);
    parentBrachio.add(this.brachioNeck);

    // 長い尻尾
    const tailGeo = new THREE.ConeGeometry(1.8, 16, 10);
    const tail = new THREE.Mesh(tailGeo, skinMatParent);
    tail.position.set(11.0, 6.8, 0);
    tail.rotation.z = -1.35;
    tail.castShadow = true;
    parentBrachio.add(tail);

    dinoGroup.add(parentBrachio);

    // --- 子ブラキオサウルス（親を見上げる姿） ---
    const babyBrachio = new THREE.Group();
    babyBrachio.position.set(-6, 0, -8);
    babyBrachio.rotation.y = 0.8;
    babyBrachio.scale.set(0.45, 0.45, 0.45);

    const bBody = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.8, 9, 10), skinMatBaby);
    bBody.rotation.z = Math.PI / 2;
    bBody.position.y = 7.5;
    bBody.castShadow = true;
    babyBrachio.add(bBody);

    const bl1 = new THREE.Mesh(legGeo, skinMatBaby); bl1.position.set(-3.5, 3.75, 2.6);
    const bl2 = new THREE.Mesh(legGeo, skinMatBaby); bl2.position.set(-3.5, 3.75, -2.6);
    const bl3 = new THREE.Mesh(legGeo, skinMatBaby); bl3.position.set(3.5, 3.75, 2.6);
    const bl4 = new THREE.Mesh(legGeo, skinMatBaby); bl4.position.set(3.5, 3.75, -2.6);
    babyBrachio.add(bl1, bl2, bl3, bl4);

    this.babyBrachioNeck = new THREE.Group();
    this.babyBrachioNeck.position.set(-4.5, 8.5, 0);
    const bNeck = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.8, 14, 8), skinMatBaby);
    bNeck.position.set(-4.2, 6.5, 0);
    bNeck.rotation.z = 0.5;
    const bHead = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.4), skinMatBaby);
    bHead.position.set(-8.2, 13.0, 0);
    this.babyBrachioNeck.add(bNeck, bHead);
    babyBrachio.add(this.babyBrachioNeck);

    dinoGroup.add(babyBrachio);

    // --- ティラノサウルス（肉食恐竜） ---
    const trexMat = new THREE.MeshStandardMaterial({
      map: dinoTex2,
      bumpMap: dinoBump,
      bumpScale: 0.1,
      roughness: 0.85
    });

    const trex = new THREE.Group();
    trex.position.set(24, 0, -12);
    trex.rotation.y = -Math.PI / 3;

    const tBody = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 3.0, 6.5, 10), trexMat);
    tBody.position.y = 6.0;
    tBody.rotation.z = 0.85;
    tBody.castShadow = true;
    trex.add(tBody);

    const tLegGeo = new THREE.CylinderGeometry(0.8, 1.3, 5.5, 8);
    const tl1 = new THREE.Mesh(tLegGeo, trexMat); tl1.position.set(-1.4, 2.75, 1.6); tl1.castShadow = true;
    const tl2 = new THREE.Mesh(tLegGeo, trexMat); tl2.position.set(-1.4, 2.75, -1.6); tl2.castShadow = true;
    trex.add(tl1, tl2);

    this.trexHead = new THREE.Group();
    this.trexHead.position.set(-3.5, 8.2, 0);
    const tHead = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.4, 2.0), trexMat);
    tHead.position.set(-1.6, 0.5, 0);
    tHead.castShadow = true;

    // 白い牙
    const teethMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.4, 1.6), teethMat);
    teeth.position.set(-1.6, -0.8, 0);
    this.trexHead.add(tHead, teeth);
    trex.add(this.trexHead);

    dinoGroup.add(trex);

    // --- トリケラトプス ---
    const tricer = new THREE.Group();
    tricer.position.set(16, 0, 18);
    tricer.rotation.y = Math.PI / 4;

    const triBody = new THREE.Mesh(new THREE.SphereGeometry(3.0, 10, 10), skinMatParent);
    triBody.position.y = 3.0;
    triBody.scale.set(1.5, 1, 1);
    triBody.castShadow = true;
    tricer.add(triBody);

    const frill = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.4, 10), skinMatParent);
    frill.position.set(-3.0, 4.2, 0);
    frill.rotation.z = 0.65;
    frill.castShadow = true;
    tricer.add(frill);

    const hornMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3 });
    const hornGeo = new THREE.ConeGeometry(0.3, 2.6, 8);
    const h1 = new THREE.Mesh(hornGeo, hornMat); h1.position.set(-4.4, 4.8, 1.1); h1.rotation.z = -1.2;
    const h2 = new THREE.Mesh(hornGeo, hornMat); h2.position.set(-4.4, 4.8, -1.1); h2.rotation.z = -1.2;
    tricer.add(h1, h2);

    dinoGroup.add(tricer);

    this.scene.add(dinoGroup);

    this.spots.push({
      id: 'dino',
      title: '野外恐竜ランド（自然史博物館前広場）',
      category: '博物館',
      pos: new THREE.Vector3(-80, 2, 70),
      dist: 20,
      desc: '太古の白亜紀・ジュラ紀へタイムスリップ！実物大のブラキオサウルス親子をはじめ、ティラノサウルスやトリケラトプスなど10体以上の本格的な恐竜モニュメントが木立の中に堂々と並びます。',
      trivia: '親ブラキオサウルスは全長約23m・高さ約13m！足元から見上げるその巨大さは圧巻で、全国の恐竜ファンが訪れる名物スポットです。',
      icon: '🦕',
      actionType: 'roar'
    });
  }

  // 4. 自然史博物館本館（特徴的なガラスピラミッドエントランスと煉瓦タイルの展示棟）
  createMuseumBuilding() {
    const museum = new THREE.Group();
    museum.position.set(-80, 0, 120);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.75,
      transparent: true,
      roughness: 0.1,
      metalness: 0.3,
      ior: 1.5
    });
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.85 }); // 赤煉瓦風

    // ガラスピラミッド（ルーブル調の近代的なシンボルエントランス）
    const pyrGeo = new THREE.ConeGeometry(13, 11, 4);
    const pyr = new THREE.Mesh(pyrGeo, glassMat);
    pyr.position.set(0, 5.5, -4);
    pyr.rotation.y = Math.PI / 4;
    pyr.castShadow = true;
    museum.add(pyr);

    // ピラミッドのホワイトフレーム
    const frame = new THREE.Mesh(pyrGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true }));
    frame.position.set(0, 5.5, -4);
    frame.rotation.y = Math.PI / 4;
    museum.add(frame);

    // メイン展示棟（煉瓦造り大ホール）
    const hall = new THREE.Mesh(new THREE.BoxGeometry(36, 14, 26), brickMat);
    hall.position.set(0, 7.0, 16);
    hall.castShadow = true;
    hall.receiveShadow = true;
    museum.add(hall);

    this.scene.add(museum);
  }

  // 5. 植物園：大温室（ピラミッド＆ドーム複合ガラス建築）
  createGreenhouse() {
    const ghGroup = new THREE.Group();
    ghGroup.position.set(80, 0, 70);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x67e8f9,
      transmission: 0.8,
      transparent: true,
      roughness: 0.1,
      metalness: 0.2,
      ior: 1.45
    });

    // ジオデシック・トラスガラスドーム
    const domeGeo = new THREE.SphereGeometry(20, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, glassMat);
    ghGroup.add(dome);

    const frameMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const frame = new THREE.Mesh(domeGeo, frameMat);
    ghGroup.add(frame);

    // 温室内部の鬱蒼とした熱帯ジャングル（外から透けて見える）
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });

    const innerTree = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 16, 8), trunkMat);
    innerTree.position.y = 8;
    const innerFoliage = new THREE.Mesh(new THREE.DodecahedronGeometry(6.5, 1), leafMat);
    innerFoliage.position.y = 15;
    ghGroup.add(innerTree, innerFoliage);

    this.scene.add(ghGroup);

    this.spots.push({
      id: 'greenhouse',
      title: '大温室（植物園エリア）',
      category: '植物園',
      pos: new THREE.Vector3(80, 2, 50),
      dist: 18,
      desc: '東門すぐにある植物園のシンボル！約2,700㎡の広さを誇る巨大なガラス温室の中には、熱帯・亜熱帯のジャングル植物や珍しいサボテン、カラフルなランなど約850種類が生い茂っています。',
      trivia: 'フランス・ジヴェルニーのモネの庭から株分けされた由緒正しい睡蓮が咲く「モネのコーナー」もあります！',
      icon: '🌴'
    });
  }

  // モネの池（すいれんの園＆太鼓橋）
  createMonetPond() {
    const pondGroup = new THREE.Group();
    pondGroup.position.set(50, 0, 75);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      roughness: 0.15,
      metalness: 0.75,
      transparent: true,
      opacity: 0.85
    });
    const pondMesh = new THREE.Mesh(new THREE.CircleGeometry(14, 32), waterMat);
    pondMesh.rotation.x = -Math.PI / 2;
    pondMesh.position.y = 0.12;
    pondGroup.add(pondMesh);

    // 睡蓮と花
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.3 });

    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 11;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.9, 10), leafMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(Math.cos(angle) * r, 0.14, Math.sin(angle) * r);
      pondGroup.add(pad);

      if (i % 2 === 0) {
        const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), flowerMat);
        flower.position.set(Math.cos(angle) * r, 0.28, Math.sin(angle) * r);
        pondGroup.add(flower);
      }
    }

    // モネの緑の太鼓橋
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.6 });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(9, 0.5, 8, 24, Math.PI / 3), bridgeMat);
    arch.position.set(0, -4.0, 0);
    arch.rotation.z = Math.PI / 3;
    arch.castShadow = true;
    pondGroup.add(arch);

    this.scene.add(pondGroup);
  }

  // 6. 動物園：アフリカ園・キリンデッキ（地上3.1m・目線が合う展望デッキ＆キリンの親子）
  createZooAfrica() {
    const africaGroup = new THREE.Group();
    africaGroup.position.set(-80, 0, -65);

    const deckWoodMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWoodTexture(),
      roughness: 0.75
    });

    // キリンデッキ（高さ3.1mのウッド製バリアフリー展望デッキ）
    const deckPlatform = new THREE.Mesh(new THREE.BoxGeometry(18, 0.6, 9), deckWoodMat);
    deckPlatform.position.set(0, 3.1, 0);
    deckPlatform.castShadow = true;
    deckPlatform.receiveShadow = true;
    africaGroup.add(deckPlatform);

    // スロープ（地上からデッキへ登れる傾斜路）
    const slope = new THREE.Mesh(new THREE.BoxGeometry(6, 0.5, 12), deckWoodMat);
    slope.position.set(12, 1.5, 0);
    slope.rotation.z = -0.25;
    slope.castShadow = true;
    africaGroup.add(slope);

    // デッキ手すり
    const railMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(18, 1.1, 0.15), railMat);
    r1.position.set(0, 3.9, 4.4);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(18, 1.1, 0.15), railMat);
    r2.position.set(0, 3.9, -4.4);
    africaGroup.add(r1, r2);

    // デッキ支柱
    for (let x = -8; x <= 8; x += 4) {
      for (let z = -4; z <= 4; z += 8) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 3.1, 8), railMat);
        pillar.position.set(x, 1.55, z);
        pillar.castShadow = true;
        africaGroup.add(pillar);
      }
    }

    // キリンのテクスチャ（網目模様）
    const giraffeTex = TextureGenerator.createGiraffeTexture();
    const giraffeMat = new THREE.MeshStandardMaterial({
      map: giraffeTex,
      roughness: 0.7
    });

    // キリンモデル生成ヘルパー
    const createGiraffe = (scale, x, z, rot) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rot;
      g.scale.set(scale, scale, scale);

      // 胴体
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.5, 4.2), giraffeMat);
      body.position.y = 5.8;
      body.castShadow = true;
      g.add(body);

      // 長い脚
      const legGeo = new THREE.CylinderGeometry(0.22, 0.28, 5.2, 8);
      const l1 = new THREE.Mesh(legGeo, giraffeMat); l1.position.set(-0.9, 2.6, 1.5); l1.castShadow = true;
      const l2 = new THREE.Mesh(legGeo, giraffeMat); l2.position.set(0.9, 2.6, 1.5); l2.castShadow = true;
      const l3 = new THREE.Mesh(legGeo, giraffeMat); l3.position.set(-0.9, 2.6, -1.5); l3.castShadow = true;
      const l4 = new THREE.Mesh(legGeo, giraffeMat); l4.position.set(0.9, 2.6, -1.5); l4.castShadow = true;
      g.add(l1, l2, l3, l4);

      // 長い首（デッキの高さ3.1mにちょうど顔が来る絶妙なポジション！）
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 7.2, 8), giraffeMat);
      neck.position.set(0, 10.2, -1.5);
      neck.rotation.x = -0.18;
      neck.castShadow = true;
      g.add(neck);

      // 頭部と耳・ツノ
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 1.6), giraffeMat);
      head.position.set(0, 13.8, -2.1);
      head.castShadow = true;
      g.add(head);

      return g;
    };

    // 親キリン（デッキのすぐ目の前で食事中）
    africaGroup.add(createGiraffe(1.0, 4.5, 7.5, -0.4));
    // 子キリン
    africaGroup.add(createGiraffe(0.68, 10, 8.5, 0.3));

    // シマウマ（ゼブラストライプ）
    const zebraTex = TextureGenerator.createZebraTexture();
    const zebraMat = new THREE.MeshStandardMaterial({ map: zebraTex, roughness: 0.6 });

    const zebra = new THREE.Group();
    zebra.position.set(-10, 0, 8);
    zebra.rotation.y = 0.5;
    const zBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 3.2), zebraMat);
    zBody.position.y = 2.8;
    zBody.castShadow = true;
    const zLeg = new THREE.CylinderGeometry(0.18, 0.22, 2.8, 6);
    const zl1 = new THREE.Mesh(zLeg, zebraMat); zl1.position.set(-0.6, 1.4, 1.1);
    const zl2 = new THREE.Mesh(zLeg, zebraMat); zl2.position.set(0.6, 1.4, 1.1);
    const zl3 = new THREE.Mesh(zLeg, zebraMat); zl3.position.set(-0.6, 1.4, -1.1);
    const zl4 = new THREE.Mesh(zLeg, zebraMat); zl4.position.set(0.6, 1.4, -1.1);
    const zHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.5), zebraMat);
    zHead.position.set(0, 4.2, -1.2);
    zebra.add(zBody, zl1, zl2, zl3, zl4, zHead);
    africaGroup.add(zebra);

    this.scene.add(africaGroup);

    this.spots.push({
      id: 'africa',
      title: 'アフリカ園・キリンデッキ（動物園エリア）',
      category: '動物園',
      pos: new THREE.Vector3(-80, 2, -50),
      dist: 18,
      desc: 'アフリカのサバンナを忠実に再現した開放的エリアです。人気の「キリンデッキ」は地上約3.1mの高さがあり、大人のキリンとほぼ同じ目線の高さから間近に観察できます！',
      trivia: 'キリンデッキはバリアフリー設計で、キリンのほかにシマウマやダチョウ、エランドたちがのびのびと共生する様子を一望できます。',
      icon: '🦒'
    });
  }

  // 7. 極地動物館（ホッキョクグマ＆水中窓＆ペンギン）
  createZooPolar() {
    const polarGroup = new THREE.Group();
    polarGroup.position.set(-45, 0, -80);

    const iceMat = new THREE.MeshStandardMaterial({ color: 0xf0fdf4, roughness: 0.2 });
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.6 });

    // 氷山
    const iceberg = new THREE.Mesh(new THREE.DodecahedronGeometry(9, 1), iceMat);
    iceberg.position.set(0, 2.5, 0);
    iceberg.castShadow = true;
    polarGroup.add(iceberg);

    // 水中観察プール
    const pool = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 1.5, 24), poolMat);
    pool.position.set(7, 0.75, 0);
    polarGroup.add(pool);

    // ホッキョクグマ
    const bearMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const bear = new THREE.Group();
    bear.position.set(2, 5.0, -2);

    const bearBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 4.4), bearMat);
    bearBody.castShadow = true;
    const bearHead = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.4, 1.9), bearMat);
    bearHead.position.set(0, 0.6, 2.5);
    bear.add(bearBody, bearHead);
    polarGroup.add(bear);

    // ペンギン（よちよち歩き）
    const penguinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    this.penguins = [];
    for (let i = 0; i < 7; i++) {
      const p = new THREE.Group();
      p.position.set(11 + Math.cos(i * 0.9) * 3.5, 1.5, Math.sin(i * 0.9) * 3.5);
      p.rotation.y = Math.random() * Math.PI * 2;

      const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 1.3, 8), penguinMat);
      pBody.position.y = 0.65;
      pBody.castShadow = true;

      const pBelly = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.95), bellyMat);
      pBelly.position.set(0, 0.65, 0.38);

      p.add(pBody, pBelly);
      polarGroup.add(p);
      this.penguins.push({ group: p, baseRot: p.rotation.y, phase: i });
    }

    this.scene.add(polarGroup);

    this.spots.push({
      id: 'polar',
      title: '極地動物館（ホッキョクグマ・ペンギン）',
      category: '動物園',
      pos: new THREE.Vector3(-45, 2, -65),
      dist: 18,
      desc: '水中観察トンネルから、ホッキョクグマの豪快な飛び込みやペンギンたちがロケットのように水中を泳ぐ姿を間近で観察できる大人気施設です！',
      trivia: 'ホッキョクグマのおやつタイム（飛び込みフィーディング）は園内屈指のシャッターチャンスです！',
      icon: '🐻‍❄️'
    });
  }

  // 8. アジア園・ゾウ舎
  createZooElephant() {
    const elephantGroup = new THREE.Group();
    elephantGroup.position.set(-90, 0, -20);

    const elephantMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      bumpMap: TextureGenerator.createGrassBumpMap(),
      bumpScale: 0.08,
      roughness: 0.9
    });

    const ele = new THREE.Group();
    ele.position.set(0, 0, 0);

    const body = new THREE.Mesh(new THREE.BoxGeometry(4.8, 4.4, 7.0), elephantMat);
    body.position.y = 4.8;
    body.castShadow = true;
    ele.add(body);

    const legGeo = new THREE.CylinderGeometry(0.85, 1.1, 4.4, 8);
    const l1 = new THREE.Mesh(legGeo, elephantMat); l1.position.set(-1.9, 2.2, 2.3); l1.castShadow = true;
    const l2 = new THREE.Mesh(legGeo, elephantMat); l2.position.set(1.9, 2.2, 2.3); l2.castShadow = true;
    const l3 = new THREE.Mesh(legGeo, elephantMat); l3.position.set(-1.9, 2.2, -2.3); l3.castShadow = true;
    const l4 = new THREE.Mesh(legGeo, elephantMat); l4.position.set(1.9, 2.2, -2.3); l4.castShadow = true;
    ele.add(l1, l2, l3, l4);

    const head = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.8, 2.8), elephantMat);
    head.position.set(0, 6.2, 4.2);
    head.castShadow = true;
    ele.add(head);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.65, 4.2, 8), elephantMat);
    trunk.position.set(0, 3.8, 5.5);
    trunk.rotation.x = 0.45;
    trunk.castShadow = true;
    ele.add(trunk);

    elephantGroup.add(ele);
    this.scene.add(elephantGroup);

    this.spots.push({
      id: 'elephant',
      title: 'アジアゾウ舎（動物園エリア）',
      category: '動物園',
      pos: new THREE.Vector3(-75, 2, -20),
      dist: 18,
      desc: '広々とした放飼場で暮らすアジアゾウたち。水浴びを楽しんだり、群れで仲良くコミュニケーションをとる姿に癒やされます。',
      trivia: 'のんほいパークのアジアゾウ放飼場は、国際的な動物福祉基準に合わせた日本有数の広さを誇ります。',
      icon: '🐘'
    });
  }

  // 9. 中央大橋（展望橋）
  createCentralBridge() {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0, 0);

    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // 鮮やかな朱色の太鼓橋
      roughness: 0.5
    });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, roughness: 0.6 });

    const arch = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.5, 30), bridgeMat);
    arch.position.y = 1.7;
    arch.castShadow = true;
    arch.receiveShadow = true;
    bridgeGroup.add(arch);

    const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.3, 30), railMat);
    r1.position.set(-3.6, 2.5, 0);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.3, 30), railMat);
    r2.position.set(3.6, 2.5, 0);
    bridgeGroup.add(r1, r2);

    this.scene.add(bridgeGroup);

    this.spots.push({
      id: 'central_lake',
      title: '中央大池・展望橋',
      category: '中央エリア',
      pos: new THREE.Vector3(0, 2, 0),
      dist: 14,
      desc: 'のんほいパークの中心に広がる美しい大池。噴水の水しぶきを眺めながら各ゾーンへアクセスできる憩いのスポットです。',
      trivia: '池には水鳥たちが集まり、季節ごとの水生植物が彩りを添えます。',
      icon: '🌊'
    });
  }

  // 10. サインポスト
  createSignposts() {
    const signs = [
      { x: 0, z: 50, rot: 0 },
      { x: 30, z: 0, rot: -Math.PI / 2 },
      { x: -30, z: 0, rot: Math.PI / 2 }
    ];

    signs.forEach(s => {
      const g = new THREE.Group();
      g.position.set(s.x, 0, s.z);
      g.rotation.y = s.rot;

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 3.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.8 })
      );
      pole.position.y = 1.9;
      pole.castShadow = true;
      g.add(pole);

      const createArrow = (y, angle, text, color) => {
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(1.8, 0.38, 0.1),
          new THREE.MeshStandardMaterial({ color: color, roughness: 0.4 })
        );
        board.position.set(0.9 * Math.cos(angle), y, 0.9 * Math.sin(angle));
        board.rotation.y = -angle;
        return board;
      };

      g.add(createArrow(3.4, 0, '動物園', 0x22c55e));
      g.add(createArrow(3.0, Math.PI / 2, '遊園地', 0x3b82f6));
      g.add(createArrow(2.6, Math.PI, '植物園', 0xeab308));
      g.add(createArrow(2.2, -Math.PI / 2, '恐竜博物館', 0xef4444));

      this.scene.add(g);
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

    // 観覧車ネオンLEDの夜間流れるアニメーション
    if (this.ferrisLights.length > 0) {
      for (let i = 0; i < this.ferrisLights.length; i++) {
        const lightMat = this.ferrisLights[i];
        const pulse = Math.sin(time * 4 + i * 0.3) * 0.5 + 0.5;
        lightMat.emissiveIntensity = 0.3 + pulse * 1.5;
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

    // ティラノサウルスの威嚇動作
    if (this.trexHead) {
      this.trexHead.rotation.x = Math.sin(time * 1.4) * 0.12;
      this.trexHead.rotation.y = Math.cos(time * 0.9) * 0.18;
    }

    // ペンギンのよちよち歩き
    this.penguins.forEach(p => {
      p.group.rotation.z = Math.sin(time * 4.5 + p.phase) * 0.14;
    });
  }

  getGondolaWorldPosition(index = 0) {
    if (!this.ferrisGondolas[index]) return new THREE.Vector3(80, 20, -70);
    const target = new THREE.Vector3();
    this.ferrisGondolas[index].pivot.getWorldPosition(target);
    target.y -= 1.6;
    return target;
  }
}
