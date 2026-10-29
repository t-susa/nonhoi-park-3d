import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TextureGenerator } from './TextureGenerator.js';
import { Foliage } from './Foliage.js';
import { Landmarks } from './Landmarks.js';

export class World {
  constructor(container, audioManager) {
    this.container = container;
    this.audio = audioManager;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;

    this.sunLight = null;
    this.hemiLight = null;
    this.skyDome = null;
    this.stars = null;
    this.waterMesh = null;
    this.waterNormal = null;

    // 雲
    this.clouds = [];

    this.foliage = null;
    this.landmarks = null;

    this.currentTimeMode = 'day';
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. シーン＆自然な大気フォグ
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xcde8f6, 0.0028);

    // 2. カメラ
    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 105);

    // 3. 高性能WebGLレンダラー
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. ポストプロセッシング（EffectComposer ＋ UnrealBloomPass）
    this.setupPostProcessing();

    // 5. 照明（PBR太陽光＆アンビエント）
    this.setupLighting();

    // 6. 大気散乱スカイ＆流れる積雲
    this.setupSkyAndClouds();

    // 7. 高精細PBRテクスチャ地面＆敷石舗装路
    this.setupGround();

    // 8. リアル水面（法線マップさざ波アニメーション）
    this.setupWater();

    // 9. 植生・3D草むら・ストリートファニチャー・園内バス
    this.foliage = new Foliage(this.scene);

    // 10. ランドマーク（観覧車・恐竜親子・温室・キリンデッキ）
    this.landmarks = new Landmarks(this.scene, this.audio);

    window.addEventListener('resize', () => this.onResize());
  }

  setupPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);

    // 美しいグレア・ブルーム（夜間ネオンや太陽光の眩しい光拡散）
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35,  // strength
      0.4,   // radius
      0.85   // threshold
    );

    const outputPass = new OutputPass();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(outputPass);
  }

  setupLighting() {
    // 半球環境光（空光と大地反射光）
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x3d6e3c, 0.75);
    this.hemiLight.position.set(0, 60, 0);
    this.scene.add(this.hemiLight);

    // 太陽光（DirectionalLight）
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.sunLight.position.set(90, 110, 60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 320;
    const d = 140;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);
  }

  setupSkyAndClouds() {
    // 大気グラデーションスカイドーム
    const skyGeo = new THREE.SphereGeometry(460, 32, 16);
    this.skyMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide
    });
    this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyDome);

    // 流れるリアルな積雲（複数層）
    const cloudTex = TextureGenerator.createCloudTexture();
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });

    this.clouds = [];
    for (let i = 0; i < 28; i++) {
      const cloud = new THREE.Mesh(new THREE.PlaneGeometry(70, 45), cloudMat);
      cloud.rotation.x = -Math.PI / 2;
      cloud.position.set(
        (Math.random() - 0.5) * 500,
        90 + Math.random() * 25,
        (Math.random() - 0.5) * 500
      );
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }

    // 星空パーティクル
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 440;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 15;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: 0
    });
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.stars);
  }

  setupGround() {
    // 1. 芝生の大地（PBRテクスチャ ＋ バンプマップ）
    const grassTex = TextureGenerator.createGrassTexture();
    const grassBump = TextureGenerator.createGrassBumpMap();

    const groundGeo = new THREE.PlaneGeometry(420, 420, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      bumpMap: grassBump,
      bumpScale: 0.08,
      roughness: 0.88,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. 敷石・インターロッキング舗装路
    const pavementTex = TextureGenerator.createPavementTexture();
    const pavementMat = new THREE.MeshStandardMaterial({
      map: pavementTex,
      bumpMap: grassBump,
      bumpScale: 0.05,
      roughness: 0.75,
      metalness: 0.1
    });

    // 中央円形広場
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(28, 36), pavementMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.02, 0);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // 中央大通り
    const mainAvenue = new THREE.Mesh(new THREE.PlaneGeometry(14, 90), pavementMat);
    mainAvenue.rotation.x = -Math.PI / 2;
    mainAvenue.position.set(0, 0.03, 50);
    mainAvenue.receiveShadow = true;
    this.scene.add(mainAvenue);

    // 東西大通り
    const crossStreet = new THREE.Mesh(new THREE.PlaneGeometry(240, 10), pavementMat);
    crossStreet.rotation.x = -Math.PI / 2;
    crossStreet.position.set(0, 0.03, 0);
    crossStreet.receiveShadow = true;
    this.scene.add(crossStreet);

    // 各ゾーン連絡路
    const addRoad = (x, z, w, l) => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(w, l), pavementMat);
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.03, z);
      road.receiveShadow = true;
      this.scene.add(road);
    };

    addRoad(80, -25, 10, 110);  // 遊園地へ
    addRoad(-80, -25, 10, 110); // 動物園へ
    addRoad(80, 50, 10, 90);    // 植物園へ
    addRoad(-80, 50, 10, 90);   // 恐竜博物館へ
  }

  setupWater() {
    this.waterNormal = TextureGenerator.createWaterNormalTexture();

    const waterGeo = new THREE.CircleGeometry(25, 36);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      normalMap: this.waterNormal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.12,
      metalness: 0.75,
      transparent: true,
      opacity: 0.88
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(0, 0.09, 0);
    this.scene.add(this.waterMesh);
  }

  setTimeMode(mode) {
    this.currentTimeMode = mode;

    if (mode === 'day') {
      this.skyMat.color.setHex(0x38bdf8);
      this.scene.fog.color.setHex(0xcde8f6);
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.intensity = 1.4;
      this.sunLight.position.set(90, 110, 60);
      this.hemiLight.color.setHex(0xdbeafe);
      this.hemiLight.groundColor.setHex(0x3d6e3c);
      this.hemiLight.intensity = 0.75;
      this.starMat.opacity = 0;
      this.bloomPass.strength = 0.35;
      this.foliage.setNightMode(false);
    } else if (mode === 'sunset') {
      this.skyMat.color.setHex(0xf97316);
      this.scene.fog.color.setHex(0xfecdd3);
      this.sunLight.color.setHex(0xfb923c);
      this.sunLight.intensity = 1.1;
      this.sunLight.position.set(130, 25, 20);
      this.hemiLight.color.setHex(0xfb7185);
      this.hemiLight.groundColor.setHex(0x451a03);
      this.hemiLight.intensity = 0.65;
      this.starMat.opacity = 0.25;
      this.bloomPass.strength = 0.55; // 夕日の美しいグレア
      this.foliage.setNightMode(false);
    } else if (mode === 'night') {
      this.skyMat.color.setHex(0x020617);
      this.scene.fog.color.setHex(0x020617);
      this.sunLight.color.setHex(0x60a5fa);
      this.sunLight.intensity = 0.38;
      this.sunLight.position.set(-60, 90, -40);
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.32;
      this.starMat.opacity = 0.95;
      this.bloomPass.strength = 0.95; // 夜間イルミネーションの鮮やかなネオングロー！
      this.foliage.setNightMode(true);
    }
  }

  onResize() {
    if (!this.camera || !this.renderer || !this.composer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 1. 雲の風によるゆっくりした移動
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.position.x += delta * 3.5;
      if (c.position.x > 250) c.position.x = -250;
    }

    // 2. 水面波紋のオフセットアニメーション（きらめくさざ波）
    if (this.waterNormal) {
      this.waterNormal.offset.x = (elapsedTime * 0.05) % 1;
      this.waterNormal.offset.y = (elapsedTime * 0.03) % 1;
    }

    // 3. 植生・3D草むら・園内バスの更新
    if (this.foliage) this.foliage.update(delta, elapsedTime);

    // 4. ランドマークの更新
    if (this.landmarks) this.landmarks.update(delta, elapsedTime);

    // 5. ポストプロセッシングによる高品質レンダリング
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
