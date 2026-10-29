import * as THREE from 'three';

export class Landmarks {
  constructor(scene, audioManager) {
    this.scene = scene;
    this.audio = audioManager;

    // アニメーション対象
    this.ferrisWheel = null;
    this.ferrisGondolas = [];
    this.ferrisLights = [];
    this.brachioNeck = null;
    this.trexHead = null;
    this.penguins = [];

    // インタラクションスポット
    this.spots = [];

    // 観覧車搭乗管理
    this.isRidingFerris = false;
    this.ridingGondolaIndex = 0;

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

    // 柱
    const pillarMat = new THREE.MeshLambertMaterial({ color: 0x854d0e });
    const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 7, 12), pillarMat);
    p1.position.set(-6, 3.5, 0);
    const p2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 7, 12), pillarMat);
    p2.position.set(6, 3.5, 0);
    gateGroup.add(p1, p2);

    // アーチ梁
    const archMat = new THREE.MeshLambertMaterial({ color: 0x1e3a8a });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 1), archMat);
    beam.position.set(0, 6.8, 0);
    gateGroup.add(beam);

    // 看板テクスチャ生成
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NONHOI PARK', 256, 52);
    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('豊橋総合動植物公園', 256, 96);

    const signTex = new THREE.CanvasTexture(canvas);
    const signBoard = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 2.5),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signBoard.position.set(0, 8.5, 0.2);
    gateGroup.add(signBoard);

    // 背面看板
    const signBoardBack = signBoard.clone();
    signBoardBack.rotation.y = Math.PI;
    signBoardBack.position.z = -0.2;
    gateGroup.add(signBoardBack);

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

  // 2. 遊園地：大観覧車
  createFerrisWheel() {
    const ferrisGroup = new THREE.Group();
    ferrisGroup.position.set(80, 0, -70);

    const steelMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const neonMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3
    });

    // A字フレーム支柱（高さ約42m）
    const legGeo = new THREE.CylinderGeometry(0.5, 0.9, 44, 8);
    const leg1 = new THREE.Mesh(legGeo, steelMat);
    leg1.position.set(-6, 21, -6);
    leg1.rotation.z = -0.15;
    leg1.rotation.x = 0.15;

    const leg2 = new THREE.Mesh(legGeo, steelMat);
    leg2.position.set(6, 21, -6);
    leg2.rotation.z = 0.15;
    leg2.rotation.x = 0.15;

    const leg3 = new THREE.Mesh(legGeo, steelMat);
    leg3.position.set(-6, 21, 6);
    leg3.rotation.z = -0.15;
    leg3.rotation.x = -0.15;

    const leg4 = new THREE.Mesh(legGeo, steelMat);
    leg4.position.set(6, 21, 6);
    leg4.rotation.z = 0.15;
    leg4.rotation.x = -0.15;

    ferrisGroup.add(leg1, leg2, leg3, leg4);

    // 回転ホイール部
    this.ferrisWheel = new THREE.Group();
    this.ferrisWheel.position.set(0, 40, 0);

    // 車軸
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 14, 16), steelMat);
    axle.rotation.x = Math.PI / 2;
    this.ferrisWheel.add(axle);

    // 巨大リング2本
    const radius = 22;
    const ringGeo = new THREE.TorusGeometry(radius, 0.35, 8, 36);
    const ring1 = new THREE.Mesh(ringGeo, steelMat);
    ring1.position.z = -4;
    const ring2 = new THREE.Mesh(ringGeo, steelMat);
    ring2.position.z = 4;
    this.ferrisWheel.add(ring1, ring2);

    // ゴンドラ（16個）
    const gondolaColors = [0xef4444, 0xf59e0b, 0x10b981, 0x3b82f6, 0xec4899, 0x8b5cf6];
    this.ferrisGondolas = [];

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const gx = Math.cos(angle) * radius;
      const gy = Math.sin(angle) * radius;

      // スポーク（棒）
      const spokeGeo = new THREE.CylinderGeometry(0.12, 0.12, radius, 6);
      const spoke1 = new THREE.Mesh(spokeGeo, steelMat);
      spoke1.position.set(gx / 2, gy / 2, -4);
      spoke1.rotation.z = angle - Math.PI / 2;
      const spoke2 = new THREE.Mesh(spokeGeo, steelMat);
      spoke2.position.set(gx / 2, gy / 2, 4);
      spoke2.rotation.z = angle - Math.PI / 2;
      this.ferrisWheel.add(spoke1, spoke2);

      // ゴンドラピボット
      const gondolaPivot = new THREE.Group();
      gondolaPivot.position.set(gx, gy, 0);

      // ゴンドラ本体（吊り下げ構造）
      const gColor = gondolaColors[i % gondolaColors.length];
      const cabinMat = new THREE.MeshLambertMaterial({ color: gColor });
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.6), cabinMat);
      cabin.position.y = -1.6;

      // 窓
      const winMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
      const win1 = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), winMat);
      win1.position.set(0, -1.4, 1.32);
      const win2 = win1.clone();
      win2.position.set(0, -1.4, -1.32);
      win2.rotation.y = Math.PI;

      gondolaPivot.add(cabin, win1, win2);
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
      dist: 20,
      desc: 'のんほいパークのシンボル！地上約50mの最高到達点からは、動物園や植物園の豊かな緑はもちろん、豊橋の街並みや遠く三河湾まで360度の大パノラマを一望できます。',
      trivia: '夜間営業時には美しくライトアップされ、遠くの新幹線車窓からもカラフルに輝く姿を見ることができます！',
      icon: '🎡',
      actionType: 'ferris'
    });
  }

  // 3. 自然史博物館：野外恐竜ランド
  createDinosaurPark() {
    const dinoGroup = new THREE.Group();
    dinoGroup.position.set(-80, 0, 80);

    const dinoSkin1 = new THREE.MeshLambertMaterial({ color: 0x4d5b44 });
    const dinoSkin2 = new THREE.MeshLambertMaterial({ color: 0x8c6d48 });
    const dinoEye = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    // --- ブラキオサウルス（実物大超巨大恐竜） ---
    const brachio = new THREE.Group();
    brachio.position.set(0, 0, 0);

    // 胴体
    const body = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.5, 9, 10), dinoSkin1);
    body.rotation.z = Math.PI / 2;
    body.position.y = 7.5;
    brachio.add(body);

    // 4本の巨木のような脚
    const legGeo = new THREE.CylinderGeometry(1.1, 1.5, 7, 8);
    const l1 = new THREE.Mesh(legGeo, dinoSkin1);
    l1.position.set(-3.5, 3.5, 2.5);
    const l2 = new THREE.Mesh(legGeo, dinoSkin1);
    l2.position.set(-3.5, 3.5, -2.5);
    const l3 = new THREE.Mesh(legGeo, dinoSkin1);
    l3.position.set(3.5, 3.5, 2.5);
    const l4 = new THREE.Mesh(legGeo, dinoSkin1);
    l4.position.set(3.5, 3.5, -2.5);
    brachio.add(l1, l2, l3, l4);

    // 長い首（アニメーション用ピボット）
    this.brachioNeck = new THREE.Group();
    this.brachioNeck.position.set(-4.5, 8.5, 0);

    const neckGeo = new THREE.CylinderGeometry(0.8, 1.8, 16, 8);
    const neck = new THREE.Mesh(neckGeo, dinoSkin1);
    neck.position.set(-4.5, 7, 0);
    neck.rotation.z = 0.55;
    this.brachioNeck.add(neck);

    // 頭部
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 1.4), dinoSkin1);
    head.position.set(-8.8, 14, 0);
    this.brachioNeck.add(head);

    brachio.add(this.brachioNeck);

    // 長い尻尾
    const tailGeo = new THREE.ConeGeometry(1.6, 14, 8);
    const tail = new THREE.Mesh(tailGeo, dinoSkin1);
    tail.position.set(9.5, 6.5, 0);
    tail.rotation.z = -1.25;
    brachio.add(tail);

    dinoGroup.add(brachio);

    // --- ティラノサウルス（二足歩行肉食恐竜） ---
    const trex = new THREE.Group();
    trex.position.set(22, 0, -10);
    trex.rotation.y = -Math.PI / 3;

    const tBody = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.8, 6, 8), dinoSkin2);
    tBody.position.y = 5.5;
    tBody.rotation.z = 0.8;
    trex.add(tBody);

    // 脚
    const tLegGeo = new THREE.CylinderGeometry(0.7, 1.1, 5, 8);
    const tl1 = new THREE.Mesh(tLegGeo, dinoSkin2);
    tl1.position.set(-1.2, 2.5, 1.5);
    const tl2 = new THREE.Mesh(tLegGeo, dinoSkin2);
    tl2.position.set(-1.2, 2.5, -1.5);
    trex.add(tl1, tl2);

    // 頭部（ピボット）
    this.trexHead = new THREE.Group();
    this.trexHead.position.set(-3.2, 7.5, 0);
    const tHead = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.2, 1.8), dinoSkin2);
    tHead.position.set(-1.5, 0.4, 0);
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.3, 1.4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    teeth.position.set(-1.5, -0.7, 0);
    this.trexHead.add(tHead, teeth);
    trex.add(this.trexHead);

    dinoGroup.add(trex);

    // --- トリケラトプス ---
    const tricer = new THREE.Group();
    tricer.position.set(15, 0, 16);
    tricer.rotation.y = Math.PI / 4;

    const triBody = new THREE.Mesh(new THREE.SphereGeometry(2.8, 8, 8), dinoSkin1);
    triBody.position.y = 2.8;
    triBody.scale.set(1.4, 1, 1);
    tricer.add(triBody);

    // フリルと3本の角
    const frill = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.4, 8), dinoSkin1);
    frill.position.set(-2.8, 3.8, 0);
    frill.rotation.z = 0.6;
    tricer.add(frill);

    const hornGeo = new THREE.ConeGeometry(0.25, 2.2, 6);
    const hornMat = new THREE.MeshLambertMaterial({ color: 0xd4d4d8 });
    const h1 = new THREE.Mesh(hornGeo, hornMat);
    h1.position.set(-4, 4.4, 1);
    h1.rotation.z = -1.2;
    const h2 = new THREE.Mesh(hornGeo, hornMat);
    h2.position.set(-4, 4.4, -1);
    h2.rotation.z = -1.2;
    tricer.add(h1, h2);

    dinoGroup.add(tricer);

    this.scene.add(dinoGroup);

    this.spots.push({
      id: 'dino',
      title: '野外恐竜ランド（自然史博物館）',
      category: '博物館',
      pos: new THREE.Vector3(-80, 2, 70),
      dist: 18,
      desc: '太古の白亜紀・ジュラ紀へタイムスリップ！芝生広場に実物大のブラキオサウルス、ティラノサウルス、トリケラトプスなどが堂々と展示されています。',
      trivia: 'ブラキオサウルスの模型は体長23メートル！下から見上げるとその圧倒的なスケールに誰もが息を呑みます。国内の動植物園でも屈指の人気恐竜スポットです。',
      icon: '🦕',
      actionType: 'roar'
    });
  }

  // 自然史博物館本館（建物）
  createMuseumBuilding() {
    const museum = new THREE.Group();
    museum.position.set(-80, 0, 115);

    // 近代的なピラミッドガラスエントランス
    const pyrGeo = new THREE.ConeGeometry(12, 10, 4);
    const pyrMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      roughness: 0.2
    });
    const entrance = new THREE.Mesh(pyrGeo, pyrMat);
    entrance.position.y = 5;
    entrance.rotation.y = Math.PI / 4;
    museum.add(entrance);

    // 本館展示棟
    const bldgMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const hall = new THREE.Mesh(new THREE.BoxGeometry(32, 12, 22), bldgMat);
    hall.position.set(0, 6, 14);
    museum.add(hall);

    this.scene.add(museum);
  }

  // 4. 植物園：大温室
  createGreenhouse() {
    const ghGroup = new THREE.Group();
    ghGroup.position.set(80, 0, 70);

    // ガラスドーム/ピラミッド構造（多角形半透明シェル）
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.55,
      roughness: 0.1,
      metalness: 0.2
    });

    const domeGeo = new THREE.SphereGeometry(18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const dome = new THREE.Mesh(domeGeo, glassMat);
    dome.position.y = 0;
    ghGroup.add(dome);

    // フレーム構造（白い骨組み）
    const frameMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
    const frame = new THREE.Mesh(domeGeo, frameMat);
    ghGroup.add(frame);

    // 温室内部の巨大熱帯植物（外から透けて見える）
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x15803d });

    const innerTree = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 14, 8), trunkMat);
    innerTree.position.y = 7;
    const innerTop = new THREE.Mesh(new THREE.DodecahedronGeometry(5, 1), leafMat);
    innerTop.position.y = 14;
    ghGroup.add(innerTree, innerTop);

    this.scene.add(ghGroup);

    this.spots.push({
      id: 'greenhouse',
      title: '大温室（植物園エリア）',
      category: '植物園',
      pos: new THREE.Vector3(80, 2, 50),
      dist: 16,
      desc: '一年中常夏の緑と花々に包まれる巨大なガラス温室です。熱帯雨林植物、色鮮やかな蘭、砂漠のサボテンなど、世界各地の珍しい植物が元気に育っています。',
      trivia: '温室内にはフランス・ジヴェルニーのモネの庭から譲り受けた由緒正しい睡蓮が浮かぶ「モネのコーナー」もあります！',
      icon: '🌴'
    });
  }

  // モネの池（すいれんの園）
  createMonetPond() {
    const pondGroup = new THREE.Group();
    pondGroup.position.set(50, 0, 75);

    // 睡蓮池の水面
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x0e7490,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.8
    });
    const pondMesh = new THREE.Mesh(new THREE.CircleGeometry(12, 24), waterMat);
    pondMesh.rotation.x = -Math.PI / 2;
    pondMesh.position.y = 0.1;
    pondGroup.add(pondMesh);

    // 睡蓮の葉と花
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x166534 });
    const flowerMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });

    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 9;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.8, 8), leafMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(Math.cos(angle) * r, 0.12, Math.sin(angle) * r);
      pondGroup.add(pad);

      if (i % 2 === 0) {
        const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0), flowerMat);
        flower.position.set(Math.cos(angle) * r, 0.25, Math.sin(angle) * r);
        pondGroup.add(flower);
      }
    }

    // モネの太鼓橋（緑のアーチ橋）
    const bridgeMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const bridge = new THREE.Mesh(new THREE.TorusGeometry(8, 0.4, 8, 20, Math.PI / 3), bridgeMat);
    bridge.position.set(0, -3.5, 0);
    bridge.rotation.z = Math.PI / 3;
    pondGroup.add(bridge);

    this.scene.add(pondGroup);
  }

  // 5. 動物園：アフリカ園（キリン＆キリンデッキ）
  createZooAfrica() {
    const africaGroup = new THREE.Group();
    africaGroup.position.set(-80, 0, -65);

    const deckWoodMat = new THREE.MeshLambertMaterial({ color: 0xa16207 });
    const giraffeBodyMat = new THREE.MeshLambertMaterial({ color: 0xeab308 });
    const spotMat = new THREE.MeshLambertMaterial({ color: 0x78350f });

    // キリンデッキ（見晴らし台）
    const deckPlatform = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 8), deckWoodMat);
    deckPlatform.position.set(0, 4.5, 0);
    africaGroup.add(deckPlatform);

    // デッキ脚
    for (let x = -7; x <= 7; x += 3.5) {
      for (let z = -3.5; z <= 3.5; z += 7) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 4.5, 6), deckWoodMat);
        p.position.set(x, 2.25, z);
        africaGroup.add(p);
      }
    }

    // キリンの親子
    const createGiraffe = (scale, x, z, rot) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.rotation.y = rot;
      g.scale.set(scale, scale, scale);

      // 胴体
      const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 3.8), giraffeBodyMat);
      body.position.y = 5.5;
      g.add(body);

      // 4本の長〜い脚
      const legGeo = new THREE.CylinderGeometry(0.2, 0.25, 5, 6);
      const l1 = new THREE.Mesh(legGeo, giraffeBodyMat); l1.position.set(-0.8, 2.5, 1.4);
      const l2 = new THREE.Mesh(legGeo, giraffeBodyMat); l2.position.set(0.8, 2.5, 1.4);
      const l3 = new THREE.Mesh(legGeo, giraffeBodyMat); l3.position.set(-0.8, 2.5, -1.4);
      const l4 = new THREE.Mesh(legGeo, giraffeBodyMat); l4.position.set(0.8, 2.5, -1.4);
      g.add(l1, l2, l3, l4);

      // 長い首
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 6.5, 6), giraffeBodyMat);
      neck.position.set(0, 9.5, -1.4);
      neck.rotation.x = -0.15;
      g.add(neck);

      // 頭
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.4), giraffeBodyMat);
      head.position.set(0, 12.8, -1.9);
      g.add(head);

      return g;
    };

    africaGroup.add(createGiraffe(1.0, 6, 8, -0.6));
    africaGroup.add(createGiraffe(0.65, 11, 7, 0.4)); // 子キリン

    this.scene.add(africaGroup);

    this.spots.push({
      id: 'africa',
      title: 'アフリカ園・キリンデッキ（動物園エリア）',
      category: '動物園',
      pos: new THREE.Vector3(-80, 2, -50),
      dist: 16,
      desc: 'アフリカの大草原をイメージした広大なエリアです。人気の「キリンデッキ」では、キリンの目線と同じ高さから食事や歩き回る姿をじっくり観察できます！',
      trivia: 'のんほいパークのアフリカ園は国内トップクラスの広さを誇り、キリンのほかにシマウマやダチョウ、エランドなどがのびのびと共生しています。',
      icon: '🦒'
    });
  }

  // 極地動物館（ホッキョクグマ＆ペンギン）
  createZooPolar() {
    const polarGroup = new THREE.Group();
    polarGroup.position.set(-45, 0, -80);

    // 白と氷の館
    const iceMat = new THREE.MeshStandardMaterial({ color: 0xe0f2fe, roughness: 0.1 });
    const poolMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1 });

    const iceberg = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 1), iceMat);
    iceberg.position.set(0, 2, 0);
    polarGroup.add(iceberg);

    const pool = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 1.2, 24), poolMat);
    pool.position.set(6, 0.6, 0);
    polarGroup.add(pool);

    // ホッキョクグマ
    const bearMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const bear = new THREE.Group();
    bear.position.set(2, 4.5, -2);

    const bearBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 4.2), bearMat);
    const bearHead = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 1.8), bearMat);
    bearHead.position.set(0, 0.6, 2.4);
    bear.add(bearBody, bearHead);
    polarGroup.add(bear);

    // ペンギン（よちよちアニメーション）
    const penguinMat = new THREE.MeshLambertMaterial({ color: 0x0f172a });
    const bellyMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    this.penguins = [];
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Group();
      p.position.set(10 + Math.cos(i) * 3, 1.3, Math.sin(i) * 3);
      p.rotation.y = Math.random() * Math.PI * 2;

      const pBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.2, 8), penguinMat);
      pBody.position.y = 0.6;
      const pBelly = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.9), bellyMat);
      pBelly.position.set(0, 0.6, 0.35);
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
      dist: 16,
      desc: 'ダイナミックな水中トンネルから、ホッキョクグマの豪快な飛び込みやペンギンたちがロケットのように水中を泳ぐ姿を間近で観察できる大人気施設です！',
      trivia: 'ホッキョクグマのおやつタイム（飛び込みフィーディング）は園内屈指のシャッターチャンスです！',
      icon: '🐻‍❄️'
    });
  }

  // アジア園・ゾウ舎
  createZooElephant() {
    const elephantGroup = new THREE.Group();
    elephantGroup.position.set(-90, 0, -20);

    const elephantMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const ele = new THREE.Group();
    ele.position.set(0, 0, 0);

    // 胴体
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 4.2, 6.5), elephantMat);
    body.position.y = 4.5;
    ele.add(body);

    // 脚
    const legGeo = new THREE.CylinderGeometry(0.8, 1, 4, 8);
    const l1 = new THREE.Mesh(legGeo, elephantMat); l1.position.set(-1.8, 2, 2.2);
    const l2 = new THREE.Mesh(legGeo, elephantMat); l2.position.set(1.8, 2, 2.2);
    const l3 = new THREE.Mesh(legGeo, elephantMat); l3.position.set(-1.8, 2, -2.2);
    const l4 = new THREE.Mesh(legGeo, elephantMat); l4.position.set(1.8, 2, -2.2);
    ele.add(l1, l2, l3, l4);

    // 頭と大きな耳
    const head = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 2.6), elephantMat);
    head.position.set(0, 5.8, 4);
    ele.add(head);

    // 鼻
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 3.8, 6), elephantMat);
    trunk.position.set(0, 3.6, 5.2);
    trunk.rotation.x = 0.4;
    ele.add(trunk);

    elephantGroup.add(ele);
    this.scene.add(elephantGroup);

    this.spots.push({
      id: 'elephant',
      title: 'アジアゾウ舎（動物園エリア）',
      category: '動物園',
      pos: new THREE.Vector3(-75, 2, -20),
      dist: 16,
      desc: '広々とした放飼場で暮らすアジアゾウたち。水浴びを楽しんだり、群れで仲良くコミュニケーションをとる姿に癒やされます。',
      trivia: 'のんほいパークのアジアゾウ放飼場は、国際的な動物福祉基準に合わせた日本有数の広さを誇ります。',
      icon: '🐘'
    });
  }

  // 中央大橋（中央池をまたぐ橋）
  createCentralBridge() {
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, 0, 0);

    const bridgeMat = new THREE.MeshLambertMaterial({ color: 0x991b1b }); // 朱色の美しい太鼓橋
    const railMat = new THREE.MeshLambertMaterial({ color: 0x7f1d1d });

    const arch = new THREE.Mesh(new THREE.BoxGeometry(7, 0.4, 28), bridgeMat);
    arch.position.y = 1.6;
    bridgeGroup.add(arch);

    // 欄干（手すり）
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 28), railMat);
    r1.position.set(-3.4, 2.4, 0);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 28), railMat);
    r2.position.set(3.4, 2.4, 0);
    bridgeGroup.add(r1, r2);

    this.scene.add(bridgeGroup);

    this.spots.push({
      id: 'central_lake',
      title: '中央大池・展望橋',
      category: '中央エリア',
      pos: new THREE.Vector3(0, 2, 0),
      dist: 12,
      desc: 'のんほいパークの中心に広がる美しい大池。噴水の水しぶきを眺めながら各ゾーンへアクセスできる憩いのスポットです。',
      trivia: '池には水鳥たちが集まり、季節ごとの水生植物が彩りを添えます。',
      icon: '🌊'
    });
  }

  // 園内案内看板
  createSignposts() {
    const signs = [
      { x: 0, z: 50, rot: 0, text: '中央交差点' },
      { x: 30, z: 0, rot: -Math.PI / 2, text: '東ゾーン分岐' },
      { x: -30, z: 0, rot: Math.PI / 2, text: '西ゾーン分岐' }
    ];

    signs.forEach(s => {
      const g = new THREE.Group();
      g.position.set(s.x, 0, s.z);
      g.rotation.y = s.rot;

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8),
        new THREE.MeshLambertMaterial({ color: 0x334155 })
      );
      pole.position.y = 1.75;
      g.add(pole);

      // 4方向の矢印看板
      const createArrow = (y, angle, text, color) => {
        const board = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.35, 0.1),
          new THREE.MeshLambertMaterial({ color: color })
        );
        board.position.set(0.8 * Math.cos(angle), y, 0.8 * Math.sin(angle));
        board.rotation.y = -angle;
        return board;
      };

      g.add(createArrow(3.2, 0, '動物園', 0x22c55e));
      g.add(createArrow(2.8, Math.PI / 2, '遊園地', 0x3b82f6));
      g.add(createArrow(2.4, Math.PI, '植物園', 0xeab308));
      g.add(createArrow(2.0, -Math.PI / 2, '恐竜博物館', 0xef4444));

      this.scene.add(g);
    });
  }

  update(delta, time) {
    // 観覧車の回転
    if (this.ferrisWheel) {
      this.ferrisWheel.rotation.z -= delta * 0.12;

      // ゴンドラが常に垂直下向きを向くように逆回転補正
      this.ferrisGondolas.forEach(g => {
        g.pivot.rotation.z = -this.ferrisWheel.rotation.z;
      });
    }

    // ブラキオサウルスの首の穏やかな動き
    if (this.brachioNeck) {
      this.brachioNeck.rotation.y = Math.sin(time * 0.8) * 0.15;
      this.brachioNeck.rotation.z = Math.cos(time * 0.5) * 0.08;
    }

    // ティラノサウルスの頭部威嚇
    if (this.trexHead) {
      this.trexHead.rotation.x = Math.sin(time * 1.5) * 0.1;
      this.trexHead.rotation.y = Math.cos(time * 1.0) * 0.15;
    }

    // ペンギンのよちよち歩き
    this.penguins.forEach(p => {
      p.group.rotation.z = Math.sin(time * 4 + p.phase) * 0.12;
    });
  }

  // 観覧車乗車時のゴンドラワールド座標を取得
  getGondolaWorldPosition(index = 0) {
    if (!this.ferrisGondolas[index]) return new THREE.Vector3(80, 20, -70);
    const target = new THREE.Vector3();
    this.ferrisGondolas[index].pivot.getWorldPosition(target);
    target.y -= 1.4; // 客車座面付近
    return target;
  }
}
