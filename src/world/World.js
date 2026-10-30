import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { TextureGenerator } from './TextureGenerator.js';
import { MapBuilder } from './MapBuilder.js';
import { Landmarks } from './Landmarks.js';
import { Environment } from './Environment.js';

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
    this.clouds = [];

    this.mapBuilder = null;
    this.landmarks = null;
    this.environment = null;

    this.currentTimeMode = 'day';
    this.clock = new THREE.Clock();

    this.init();
  }

  init() {
    // 1. シーン＆自然な大気ヘイズ
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xcde8f6, 0.0016); // 広大な園内を見通せるクリアな視程

    // 2. カメラ（初期位置：中央門 [-204.9, 2.0, -50.0]）
    this.camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      0.1,
      2500
    );
    this.camera.position.set(-204.9, 2.0, -45.0);

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

    // 5. 照明（太陽光・半球環境光）
    this.setupLighting();

    // 6. スカイ＆流れる積雲
    this.setupSkyAndClouds();

    // 7. 実寸大地・OSM道路網・実在128棟建築群の構築
    this.mapBuilder = new MapBuilder(this.scene);

    // 8. 精巧な3Dランドマーク群（大観覧車・恐竜親子・キリンデッキ・D51等）
    this.landmarks = new Landmarks(this.scene, this.audio);

    // 9. 植生・3D草むら・ストリート設備・自動巡回バス
    this.environment = new Environment(this.scene, this.mapBuilder);

    window.addEventListener('resize', () => this.onResize());
  }

  setupPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);

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
    this.hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x3d6e3c, 0.75);
    this.hemiLight.position.set(0, 100, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.sunLight.position.set(200, 320, 150);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 800;
    const d = 350;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0004;
    this.scene.add(this.sunLight);
  }

  setupSkyAndClouds() {
    const skyGeo = new THREE.SphereGeometry(1200, 32, 16);
    this.skyMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.BackSide
    });
    this.skyDome = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyDome);

    // 漂う積雲
    const cloudTex = TextureGenerator.createCloudTexture();
    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });

    this.clouds = [];
    for (let i = 0; i < 32; i++) {
      const cloud = new THREE.Mesh(new THREE.PlaneGeometry(120, 80), cloudMat);
      cloud.rotation.x = -Math.PI / 2;
      cloud.position.set(
        (Math.random() - 0.5) * 1200,
        180 + Math.random() * 40,
        (Math.random() - 0.5) * 1200
      );
      this.clouds.push(cloud);
      this.scene.add(cloud);
    }

    // 星空
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1100;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 20;
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.0,
      transparent: true,
      opacity: 0
    });
    this.stars = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.stars);
  }

  setTimeMode(mode) {
    this.currentTimeMode = mode;

    if (mode === 'day') {
      this.skyMat.color.setHex(0x38bdf8);
      this.scene.fog.color.setHex(0xcde8f6);
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.intensity = 1.4;
      this.sunLight.position.set(200, 320, 150);
      this.hemiLight.color.setHex(0xdbeafe);
      this.hemiLight.groundColor.setHex(0x3d6e3c);
      this.hemiLight.intensity = 0.75;
      this.starMat.opacity = 0;
      this.bloomPass.strength = 0.35;
      if (this.environment) this.environment.setNightMode(false);
    } else if (mode === 'sunset') {
      this.skyMat.color.setHex(0xf97316);
      this.scene.fog.color.setHex(0xfecdd3);
      this.sunLight.color.setHex(0xfb923c);
      this.sunLight.intensity = 1.1;
      this.sunLight.position.set(300, 70, 80);
      this.hemiLight.color.setHex(0xfb7185);
      this.hemiLight.groundColor.setHex(0x451a03);
      this.hemiLight.intensity = 0.65;
      this.starMat.opacity = 0.25;
      this.bloomPass.strength = 0.55;
      if (this.environment) this.environment.setNightMode(false);
    } else if (mode === 'night') {
      this.skyMat.color.setHex(0x020617);
      this.scene.fog.color.setHex(0x020617);
      this.sunLight.color.setHex(0x60a5fa);
      this.sunLight.intensity = 0.38;
      this.sunLight.position.set(-150, 250, -100);
      this.hemiLight.color.setHex(0x1e293b);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.32;
      this.starMat.opacity = 0.95;
      this.bloomPass.strength = 0.95; // 夜間LEDネオングロー！
      if (this.environment) this.environment.setNightMode(true);
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

    // 雲の移動
    for (let i = 0; i < this.clouds.length; i++) {
      const c = this.clouds[i];
      c.position.x += delta * 4.0;
      if (c.position.x > 600) c.position.x = -600;
    }

    // 水面さざ波アニメーション
    if (this.mapBuilder && this.mapBuilder.waterNormal) {
      this.mapBuilder.waterNormal.offset.x = (elapsedTime * 0.05) % 1;
      this.mapBuilder.waterNormal.offset.y = (elapsedTime * 0.03) % 1;
    }

    // ランドマーク・噴水の更新
    if (this.landmarks) this.landmarks.update(delta, elapsedTime);

    // 植生・自動巡回バスの更新
    if (this.environment) this.environment.update(delta, elapsedTime);

    // ポストプロセッシングレンダリング
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
