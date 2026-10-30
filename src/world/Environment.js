import * as THREE from 'three';
import { parkData } from '../data/parkData.js';
import { TextureGenerator } from './TextureGenerator.js';

export class Environment {
  constructor(scene, mapBuilder) {
    this.scene = scene;
    this.mapBuilder = mapBuilder;

    this.streetLights = [];
    this.grassMesh = null;
    this.grassMatrices = [];
    this.grassCount = 1200;

    // 園内巡回バス
    this.parkBus = null;
    this.busProgress = 0;
    this.busRoute = [];
    this.busSpeed = 0.035;

    this.init();
  }

  init() {
    this.createTrees();
    this.create3DGrass();
    this.createStreetFurniture();
    this.createParkBus();
  }

  createTrees() {
    const treeGroup = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });
    const leafMatA = new THREE.MeshStandardMaterial({ color: 0x2e6b2c, roughness: 0.8, flatShading: true });
    const leafMatB = new THREE.MeshStandardMaterial({ color: 0x3d8b3a, roughness: 0.8, flatShading: true });
    const leafMatC = new THREE.MeshStandardMaterial({ color: 0x1e5020, roughness: 0.8, flatShading: true });
    const sakuraMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.7, flatShading: true });
    const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6, side: THREE.DoubleSide });

    // 園内境界および森林エリア・緑地帯に木を分散配置
    const parkPoly = parkData.park;
    const bb = this.mapBuilder.bboxOf(parkPoly);

    let placedCount = 0;
    const targetCount = 380;

    for (let attempt = 0; attempt < 1800 && placedCount < targetCount; attempt++) {
      const x = bb.minX + Math.random() * (bb.maxX - bb.minX);
      const z = bb.minZ + Math.random() * (bb.maxZ - bb.minZ);

      // 公園内にあるか
      if (!this.mapBuilder.inPoly(parkPoly, x, z)) continue;

      // 建物・水面・道路を避ける
      if (this.mapBuilder.checkCollision(x, z, 3.5)) continue;

      // 温室周辺（東側：X > 200, Z < -70）はヤシの木
      if (x > 210 && z < -70 && z > -150) {
        this.createPalmTree(x, z, treeGroup, trunkMat, palmLeafMat);
        placedCount++;
        continue;
      }

      // 一般樹木
      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      const scale = 0.85 + Math.random() * 0.7;
      tree.scale.set(scale, scale, scale);

      const mainTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 4.2, 8), trunkMat);
      mainTrunk.position.y = 2.1; mainTrunk.castShadow = true;
      tree.add(mainTrunk);

      const treeType = Math.random();
      if (treeType < 0.65) {
        // クスノキ・広葉樹
        const mats = [leafMatA, leafMatB, leafMatC];
        const clusters = [
          { x: 0, y: 4.8, z: 0, r: 2.4, m: mats[0] },
          { x: 0.9, y: 5.6, z: 0.5, r: 1.8, m: mats[1] },
          { x: -0.7, y: 5.2, z: -0.6, r: 1.7, m: mats[2] },
          { x: 0, y: 6.8, z: 0, r: 1.6, m: mats[1] }
        ];
        clusters.forEach(c => {
          const f = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), c.m);
          f.position.set(c.x, c.y, c.z); f.castShadow = true;
          tree.add(f);
        });
      } else if (treeType < 0.85) {
        // コニファー（松）
        for (let l = 0; l < 3; l++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6 - l * 0.6, 3.2, 8), leafMatC);
          cone.position.y = 3.6 + l * 2.0; cone.castShadow = true;
          tree.add(cone);
        }
      } else {
        // 桜の木
        const f1 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), sakuraMat); f1.position.set(0, 5.0, 0); f1.castShadow = true;
        const f2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.0, 1), sakuraMat); f2.position.set(0.8, 5.8, 0.4); f2.castShadow = true;
        tree.add(f1, f2);
      }

      treeGroup.add(tree);
      placedCount++;
    }

    this.scene.add(treeGroup);
  }

  createPalmTree(x, z, parent, trunkMat, leafMat) {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 8.5, 7), trunkMat);
    trunk.position.y = 4.25; trunk.rotation.z = (Math.random() - 0.5) * 0.18; trunk.castShadow = true;
    palm.add(trunk);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const leafGroup = new THREE.Group();
      leafGroup.position.set(0, 8.3, 0); leafGroup.rotation.y = angle;

      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 4.2), leafMat);
      leaf.position.set(0, 0, 2.0); leaf.rotation.x = 0.45; leaf.castShadow = true;
      leafGroup.add(leaf);
      palm.add(leafGroup);
    }

    parent.add(palm);
  }

  create3DGrass() {
    const bladeGeo = new THREE.PlaneGeometry(0.2, 0.8, 1, 2);
    bladeGeo.translate(0, 0.4, 0);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80, roughness: 0.7, side: THREE.DoubleSide
    });

    this.grassMesh = new THREE.InstancedMesh(bladeGeo, grassMat, this.grassCount);
    this.grassMesh.castShadow = false;
    this.grassMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    this.grassMatrices = [];

    const parkPoly = parkData.park;
    const bb = this.mapBuilder.bboxOf(parkPoly);

    let count = 0;
    for (let i = 0; i < 3000 && count < this.grassCount; i++) {
      const x = bb.minX + Math.random() * (bb.maxX - bb.minX);
      const z = bb.minZ + Math.random() * (bb.maxZ - bb.minZ);

      if (!this.mapBuilder.inPoly(parkPoly, x, z)) continue;
      if (this.mapBuilder.checkCollision(x, z, 1.2)) continue;

      dummy.position.set(x, 0, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.rotation.x = (Math.random() - 0.5) * 0.2;
      const s = 0.7 + Math.random() * 0.8;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      this.grassMesh.setMatrixAt(count, dummy.matrix);
      this.grassMatrices.push({
        basePos: dummy.position.clone(),
        baseRot: dummy.rotation.clone(),
        scale: dummy.scale.clone(),
        phase: Math.random() * Math.PI * 2
      });
      count++;
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.grassMesh);
  }

  createStreetFurniture() {
    const furnGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ map: TextureGenerator.createWoodTexture(), roughness: 0.8 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });

    // 街灯配置（主要ゲートや交差点・広場）
    const lampCoords = [
      [-204, -50], [-190, -50], [-170, -40], [-100, -30], [-50, -20],
      [0, -10], [50, 0], [100, 20], [150, 50], [176, 80],
      [220, 20], [260, -20], [280, -80], [-250, 50], [-280, 100],
      [-100, 100], [-50, 80], [30, 50]
    ];

    lampCoords.forEach(([lx, lz]) => {
      const lamp = new THREE.Group();
      lamp.position.set(lx, 0, lz);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.0, 8), ironMat);
      pole.position.y = 2.5; pole.castShadow = true;
      lamp.add(pole);

      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffedd5, emissive: 0xfde047, emissiveIntensity: 0.2
      });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), bulbMat);
      bulb.position.set(0.65, 4.8, 0);
      lamp.add(bulb);

      const pLight = new THREE.PointLight(0xffedd5, 0, 18);
      pLight.position.set(0.65, 4.8, 0);
      lamp.add(pLight);

      this.streetLights.push({ bulbMat, light: pLight });
      furnGroup.add(lamp);

      // ベンチも併設
      const bench = new THREE.Group();
      bench.position.set(lx + 2.5, 0, lz);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.6), woodMat); seat.position.set(0, 0.5, 0);
      const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.65, 0.08), woodMat); back.position.set(0, 0.95, -0.28);
      bench.add(seat, back);
      furnGroup.add(bench);
    });

    // 自販機
    const vend1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.0), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
    vend1.position.set(-198, 1.2, -52);
    const vend2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 1.0), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
    vend2.position.set(-196, 1.2, -52);
    furnGroup.add(vend1, vend2);

    this.scene.add(furnGroup);
  }

  // 実在の園内巡回バス（parkData.busの373頂点ルートを周遊）
  createParkBus() {
    this.parkBus = new THREE.Group();

    const redMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 }); // レトロオレンジ
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.6 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 7.5), redMat);
    lowerBody.position.y = 1.0; lowerBody.castShadow = true;
    const upperBody = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.3, 7.2), creamMat);
    upperBody.position.y = 2.25; upperBody.castShadow = true;
    const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.8, 6.8), glassMat);
    windowMesh.position.y = 2.25;

    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.position.set(-1.6, 0.55, 2.2);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat); w2.position.set(1.6, 0.55, 2.2);
    const w3 = new THREE.Mesh(wheelGeo, wheelMat); w3.position.set(-1.6, 0.55, -2.2);
    const w4 = new THREE.Mesh(wheelGeo, wheelMat); w4.position.set(1.6, 0.55, -2.2);

    this.parkBus.add(lowerBody, upperBody, windowMesh, w1, w2, w3, w4);

    // 実在のバス走行ルート
    if (parkData.bus && parkData.bus.length > 2) {
      this.busRoute = parkData.bus.map(p => new THREE.Vector3(p[0], 0, p[1]));
    } else {
      this.busRoute = [
        new THREE.Vector3(-204, 0, -50),
        new THREE.Vector3(-80, 0, -30),
        new THREE.Vector3(50, 0, 0),
        new THREE.Vector3(176, 0, 80),
        new THREE.Vector3(260, 0, -50),
        new THREE.Vector3(-100, 0, 100),
        new THREE.Vector3(-204, 0, -50)
      ];
    }

    this.parkBus.position.copy(this.busRoute[0]);
    this.scene.add(this.parkBus);
  }

  update(delta, time = 0) {
    // 草むらの揺れ
    if (this.grassMesh && this.grassMatrices.length > 0) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < this.grassMatrices.length; i++) {
        const item = this.grassMatrices[i];
        const sway = Math.sin(time * 3 + item.phase) * 0.15;
        dummy.position.copy(item.basePos);
        dummy.rotation.set(item.baseRot.x + sway, item.baseRot.y, item.baseRot.z + sway * 0.5);
        dummy.scale.copy(item.scale);
        dummy.updateMatrix();
        this.grassMesh.setMatrixAt(i, dummy.matrix);
      }
      this.grassMesh.instanceMatrix.needsUpdate = true;
    }

    // 園内バスの巡回走行
    if (this.parkBus && this.busRoute.length > 1) {
      this.busProgress += delta * this.busSpeed;
      if (this.busProgress >= this.busRoute.length - 1) {
        this.busProgress = 0;
      }

      const curIdx = Math.floor(this.busProgress);
      const nextIdx = (curIdx + 1) % this.busRoute.length;
      const t = this.busProgress - curIdx;

      const p1 = this.busRoute[curIdx];
      const p2 = this.busRoute[nextIdx];

      const currentPos = new THREE.Vector3().lerpVectors(p1, p2, t);
      this.parkBus.position.copy(currentPos);

      const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
      if (dir.lengthSq() > 0.001) {
        const targetRot = Math.atan2(dir.x, dir.z);
        this.parkBus.rotation.y = targetRot;
      }
    }
  }

  setNightMode(isNight) {
    this.streetLights.forEach(item => {
      if (isNight) {
        item.bulbMat.emissiveIntensity = 1.2;
        item.light.intensity = 2.0;
      } else {
        item.bulbMat.emissiveIntensity = 0.2;
        item.light.intensity = 0;
      }
    });
  }
}
