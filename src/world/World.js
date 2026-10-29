import * as THREE from 'three';
import { Foliage } from './Foliage.js';
import { Landmarks } from './Landmarks.js';

export class World {
  constructor(container, audioManager) {
    this.container = container;
    this.audio = audioManager;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.sunLight = null;
    this.hemiLight = null;
    this.skyDome = null;
    this.stars = null;
    this.waterMesh = null;

    this.foliage = null;
    this.landmarks = null;

    this.currentTimeMode = 'day'; // 'day', 'sunset', 'night'
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. シーン
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xd1fae5, 0.0035);

    // 2. カメラ
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 3, 110);

    // 3. レンダラー
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // 4. 照明
    this.setupLighting();

    // 5. 空・環境
    this.setupSky();

    // 6. 地面と歩道
    this.setupGround();

    // 7. 水面
    this.setupWater();

    // 8. 植生・設備
    this.foliage = new Foliage(this.scene);

    // 9. ランドマーク
    this.landmarks = new Landmarks(this.scene, this.audio);

    // リサイズイベント
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x3d7042, 0.7);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.2);
    this.sunLight.position.set(80, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 300;
    const d = 130;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
  }

  setupSky() {
    // 巨大球体スカイドーム
    const skyGeo = new THREE.SphereGeometry(450, 32, 16);
    this.skyMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      side: THREE.BackSide
    });
    this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyDome);

    // 星空（夜用パーティクル）
    const starGeo = new THREE.BufferGeometry();
    const starCount = 800;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 430;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 20; // 地平線より上
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
    // 園内全体の大地（芝生）
    const groundGeo = new THREE.PlaneGeometry(420, 420, 32, 32);
    const groundMat = new THREE.MeshLambertMaterial({
      color: 0x4d7c0f // 瑞々しい芝生の緑
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 園内の舗装路ネットワーク（石畳・アスファルト）
    const pathMat = new THREE.MeshLambertMaterial({
      color: 0xd6d3d1 // 明るい砂利・石畳色
    });
    const plazaMat = new THREE.MeshLambertMaterial({
      color: 0xa8a29e // 中央広場用
    });

    // 中央広場（円形）
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(28, 32), plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.02, 0);
    plaza.receiveShadow = true;
    this.scene.add(plaza);

    // 中央門前プロムナード
    const mainAvenue = new THREE.Mesh(new THREE.PlaneGeometry(14, 90), pathMat);
    mainAvenue.rotation.x = -Math.PI / 2;
    mainAvenue.position.set(0, 0.03, 50);
    mainAvenue.receiveShadow = true;
    this.scene.add(mainAvenue);

    // 東西のメインストリート
    const crossStreet = new THREE.Mesh(new THREE.PlaneGeometry(240, 10), pathMat);
    crossStreet.rotation.x = -Math.PI / 2;
    crossStreet.position.set(0, 0.03, 0);
    crossStreet.receiveShadow = true;
    this.scene.add(crossStreet);

    // 遊園地への連絡路（北東）
    const toParkRoad = new THREE.Mesh(new THREE.PlaneGeometry(10, 110), pathMat);
    toParkRoad.rotation.x = -Math.PI / 2;
    toParkRoad.position.set(80, 0.03, -25);
    toParkRoad.receiveShadow = true;
    this.scene.add(toParkRoad);

    // 動物園への連絡路（北西）
    const toZooRoad = new THREE.Mesh(new THREE.PlaneGeometry(10, 110), pathMat);
    toZooRoad.rotation.x = -Math.PI / 2;
    toZooRoad.position.set(-80, 0.03, -25);
    toZooRoad.receiveShadow = true;
    this.scene.add(toZooRoad);

    // 植物園への連絡路（南東）
    const toBotanicalRoad = new THREE.Mesh(new THREE.PlaneGeometry(10, 90), pathMat);
    toBotanicalRoad.rotation.x = -Math.PI / 2;
    toBotanicalRoad.position.set(80, 0.03, 50);
    toBotanicalRoad.receiveShadow = true;
    this.scene.add(toBotanicalRoad);

    // 恐竜博物館への連絡路（南西）
    const toMuseumRoad = new THREE.Mesh(new THREE.PlaneGeometry(10, 90), pathMat);
    toMuseumRoad.rotation.x = -Math.PI / 2;
    toMuseumRoad.position.set(-80, 0.03, 50);
    toMuseumRoad.receiveShadow = true;
    this.scene.add(toMuseumRoad);
  }

  setupWater() {
    // 中央大池（ドーナツ/楕円状のリアルな水面）
    const waterGeo = new THREE.CircleGeometry(24, 32);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.15,
      metalness: 0.7,
      transparent: true,
      opacity: 0.85
    });
    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.set(0, 0.08, 0);
    this.scene.add(this.waterMesh);
  }

  setTimeMode(mode) {
    this.currentTimeMode = mode;

    if (mode === 'day') {
      this.skyMat.color.setHex(0x38bdf8);
      this.scene.fog.color.setHex(0xe0f2fe);
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.intensity = 1.3;
      this.sunLight.position.set(80, 100, 50);
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x3d7042);
      this.hemiLight.intensity = 0.7;
      this.starMat.opacity = 0;
      this.foliage.setNightMode(false);
    } else if (mode === 'sunset') {
      this.skyMat.color.setHex(0xf97316);
      this.scene.fog.color.setHex(0xfda4af);
      this.sunLight.color.setHex(0xfb923c);
      this.sunLight.intensity = 1.0;
      this.sunLight.position.set(120, 30, 20);
      this.hemiLight.color.setHex(0xfb7185);
      this.hemiLight.groundColor.setHex(0x451a03);
      this.hemiLight.intensity = 0.6;
      this.starMat.opacity = 0.2;
      this.foliage.setNightMode(false);
    } else if (mode === 'night') {
      this.skyMat.color.setHex(0x020617);
      this.scene.fog.color.setHex(0x020617);
      this.sunLight.color.setHex(0x60a5fa);
      this.sunLight.intensity = 0.35;
      this.sunLight.position.set(-60, 90, -40);
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.3;
      this.starMat.opacity = 0.95;
      this.foliage.setNightMode(true);
    }
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // 植生（噴水等）の更新
    if (this.foliage) this.foliage.update(delta);

    // ランドマーク（観覧車、恐竜、ペンギン等）の更新
    if (this.landmarks) this.landmarks.update(delta, elapsedTime);

    // 水面のわずかな揺らめき
    if (this.waterMat) {
      this.waterMesh.rotation.z = Math.sin(elapsedTime * 0.4) * 0.02;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
