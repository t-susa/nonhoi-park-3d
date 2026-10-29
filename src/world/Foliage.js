import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';

export class Foliage {
  constructor(scene) {
    this.scene = scene;
    this.streetLights = [];
    this.fountainParticles = null;
    this.fountainGeo = null;

    // 3D草むら（風に揺れる）
    this.grassMesh = null;
    this.grassCount = 800;
    this.grassMatrices = [];

    // 園内バス（巡回）
    this.parkBus = null;
    this.busProgress = 0;
    this.busRoute = [];

    this.init();
  }

  init() {
    this.createTrees();
    this.create3DGrass();
    this.createHedges();
    this.createFlowerBeds();
    this.createStreetFurniture();
    this.createParkBus();
    this.createFountain();
  }

  // 1. リアルな樹木群
  createTrees() {
    const treeGroup = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4a3525,
      roughness: 0.9,
      metalness: 0.1
    });

    const leafMatA = new THREE.MeshStandardMaterial({ color: 0x2e6b2c, roughness: 0.8, flatShading: true });
    const leafMatB = new THREE.MeshStandardMaterial({ color: 0x3d8b3a, roughness: 0.8, flatShading: true });
    const leafMatC = new THREE.MeshStandardMaterial({ color: 0x1e5020, roughness: 0.8, flatShading: true });
    const sakuraMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.7, flatShading: true });
    const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6, side: THREE.DoubleSide });

    for (let i = 0; i < 220; i++) {
      const x = (Math.random() - 0.5) * 350;
      const z = (Math.random() - 0.5) * 350;
      const distFromCenter = Math.hypot(x, z);

      if (distFromCenter < 32) continue;
      if (Math.abs(x) < 9 && z > -70 && z < 100) continue;
      if (Math.abs(z) < 8 && Math.abs(x) < 110) continue;
      if (Math.hypot(x - 80, z + 70) < 26) continue;
      if (Math.hypot(x + 80, z - 80) < 28) continue;
      if (Math.hypot(x + 80, z + 65) < 25) continue;

      if (Math.hypot(x - 80, z - 70) < 32) {
        this.createPalmTree(x, z, treeGroup, trunkMat, palmLeafMat);
        continue;
      }

      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      const scale = 0.85 + Math.random() * 0.7;
      tree.scale.set(scale, scale, scale);

      const mainTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 4.2, 8), trunkMat);
      mainTrunk.position.y = 2.1;
      mainTrunk.castShadow = true;
      mainTrunk.receiveShadow = true;
      tree.add(mainTrunk);

      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 2.5, 6), trunkMat);
      branch.position.set(0.6, 3.6, 0.3);
      branch.rotation.z = -0.55;
      branch.rotation.y = Math.random() * Math.PI;
      branch.castShadow = true;
      tree.add(branch);

      const treeType = Math.random();
      if (treeType < 0.65) {
        const mats = [leafMatA, leafMatB, leafMatC];
        const clusters = [
          { x: 0, y: 4.8, z: 0, r: 2.4, m: mats[0] },
          { x: 0.9, y: 5.6, z: 0.5, r: 1.8, m: mats[1] },
          { x: -0.7, y: 5.2, z: -0.6, r: 1.7, m: mats[2] },
          { x: 0, y: 6.8, z: 0, r: 1.6, m: mats[1] }
        ];

        clusters.forEach(c => {
          const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), c.m);
          foliage.position.set(c.x, c.y, c.z);
          foliage.castShadow = true;
          foliage.receiveShadow = true;
          tree.add(foliage);
        });
      } else if (treeType < 0.85) {
        for (let l = 0; l < 3; l++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6 - l * 0.6, 3.2, 8), leafMatC);
          cone.position.y = 3.6 + l * 2.0;
          cone.castShadow = true;
          tree.add(cone);
        }
      } else {
        const clusters = [
          { x: 0, y: 5.0, z: 0, r: 2.6 },
          { x: 0.8, y: 5.8, z: 0.4, r: 2.0 },
          { x: -0.8, y: 5.4, z: -0.5, r: 1.9 }
        ];
        clusters.forEach(c => {
          const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), sakuraMat);
          foliage.position.set(c.x, c.y, c.z);
          foliage.castShadow = true;
          tree.add(foliage);
        });
      }

      treeGroup.add(tree);
    }

    this.scene.add(treeGroup);
  }

  createPalmTree(x, z, parent, trunkMat, leafMat) {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 8.5, 7), trunkMat);
    trunk.position.y = 4.25;
    trunk.rotation.z = (Math.random() - 0.5) * 0.18;
    trunk.castShadow = true;
    palm.add(trunk);

    const nutMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
    for (let i = 0; i < 4; i++) {
      const nut = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), nutMat);
      nut.position.set(Math.sin(i * 1.5) * 0.6, 7.8, Math.cos(i * 1.5) * 0.6);
      palm.add(nut);
    }

    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const leafGroup = new THREE.Group();
      leafGroup.position.set(0, 8.3, 0);
      leafGroup.rotation.y = angle;

      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 4.2), leafMat);
      leaf.position.set(0, 0, 2.0);
      leaf.rotation.x = 0.45;
      leaf.castShadow = true;
      leafGroup.add(leaf);

      palm.add(leafGroup);
    }

    parent.add(palm);
  }

  create3DGrass() {
    const bladeGeo = new THREE.PlaneGeometry(0.2, 0.8, 1, 2);
    bladeGeo.translate(0, 0.4, 0);
    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.7,
      side: THREE.DoubleSide
    });

    this.grassMesh = new THREE.InstancedMesh(bladeGeo, grassMat, this.grassCount);
    this.grassMesh.castShadow = false;
    this.grassMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    this.grassMatrices = [];

    for (let i = 0; i < this.grassCount; i++) {
      let x = 0;
      let z = 0;

      if (i < 400) {
        const side = Math.random() > 0.5 ? 1 : -1;
        x = (7.5 + Math.random() * 3.5) * side;
        z = -60 + Math.random() * 155;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const rad = 25 + Math.random() * 4;
        x = Math.cos(angle) * rad;
        z = Math.sin(angle) * rad;
      }

      dummy.position.set(x, 0, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.rotation.x = (Math.random() - 0.5) * 0.2;
      const s = 0.7 + Math.random() * 0.8;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      this.grassMesh.setMatrixAt(i, dummy.matrix);
      this.grassMatrices.push({
        basePos: dummy.position.clone(),
        baseRot: dummy.rotation.clone(),
        scale: dummy.scale.clone(),
        phase: Math.random() * Math.PI * 2
      });
    }

    this.grassMesh.instanceMatrix.needsUpdate = true;
    this.scene.add(this.grassMesh);
  }

  createHedges() {
    const hedgeMat = new THREE.MeshStandardMaterial({
      color: 0x1b431c,
      roughness: 0.9,
      flatShading: true
    });

    const hedgeGroup = new THREE.Group();
    const addHedgeBlock = (x, z, w, l, rot = 0) => {
      const h = new THREE.Mesh(new THREE.BoxGeometry(w, 1.1, l), hedgeMat);
      h.position.set(x, 0.55, z);
      h.rotation.y = rot;
      h.castShadow = true;
      h.receiveShadow = true;
      hedgeGroup.add(h);
    };

    addHedgeBlock(-7.5, 45, 1.2, 70);
    addHedgeBlock(7.5, 45, 1.2, 70);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      if (Math.abs(angle) < 0.3 || Math.abs(angle - Math.PI) < 0.3) continue;
      const rad = 27;
      addHedgeBlock(Math.cos(angle) * rad, Math.sin(angle) * rad, 1.4, 8, -angle);
    }

    this.scene.add(hedgeGroup);
  }

  createFlowerBeds() {
    const bedGroup = new THREE.Group();
    const colors = [0xf43f5e, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x38bdf8, 0xfacc15];

    const bedCenters = [
      { x: 55, z: 45, r: 11 },
      { x: 75, z: 40, r: 9 },
      { x: 60, z: 65, r: 8 },
      { x: 0, z: 25, r: 6 }
    ];

    bedCenters.forEach(center => {
      const curbGeo = new THREE.TorusGeometry(center.r, 0.35, 8, 32);
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      const curb = new THREE.Mesh(curbGeo, curbMat);
      curb.position.set(center.x, 0.25, center.z);
      curb.rotation.x = Math.PI / 2;
      bedGroup.add(curb);

      const mound = new THREE.Mesh(
        new THREE.CylinderGeometry(center.r - 0.2, center.r, 0.45, 24),
        new THREE.MeshStandardMaterial({ color: 0x3b2314, roughness: 0.95 })
      );
      mound.position.set(center.x, 0.22, center.z);
      bedGroup.add(mound);

      const flowerCount = Math.floor(center.r * 8);
      for (let i = 0; i < flowerCount; i++) {
        const rad = Math.random() * (center.r - 0.8);
        const angle = Math.random() * Math.PI * 2;
        const fx = center.x + Math.cos(angle) * rad;
        const fz = center.z + Math.sin(angle) * rad;

        const flowerColor = colors[Math.floor(Math.random() * colors.length)];
        const flowerMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.5 });
        const flower = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38 + Math.random() * 0.2, 0), flowerMat);
        flower.position.set(fx, 0.55 + Math.random() * 0.2, fz);
        flower.castShadow = true;
        bedGroup.add(flower);
      }
    });

    this.scene.add(bedGroup);
  }

  createStreetFurniture() {
    const furnGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({
      map: TextureGenerator.createWoodTexture(),
      roughness: 0.8
    });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.8 });

    const benchPositions = [
      { x: 12, z: 15, rot: 0.6 },
      { x: -12, z: 15, rot: -0.6 },
      { x: 35, z: 12, rot: 0 },
      { x: -35, z: -12, rot: Math.PI },
      { x: 0, z: -32, rot: 0 },
      { x: 0, z: 65, rot: Math.PI }
    ];

    benchPositions.forEach(p => {
      const bench = new THREE.Group();
      bench.position.set(p.x, 0, p.z);
      bench.rotation.y = p.rot;

      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.6), woodMat);
      seat.position.set(0, 0.5, 0);
      seat.castShadow = true;

      const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.65, 0.08), woodMat);
      back.position.set(0, 0.95, -0.28);
      back.castShadow = true;

      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.6), ironMat);
      leg1.position.set(-1.1, 0.25, 0);
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.6), ironMat);
      leg2.position.set(1.1, 0.25, 0);

      bench.add(seat, back, leg1, leg2);
      furnGroup.add(bench);
    });

    const lampPositions = [
      { x: 15, z: 0 }, { x: -15, z: 0 },
      { x: 0, z: 20 }, { x: 0, z: -20 },
      { x: 45, z: -30 }, { x: -45, z: -30 },
      { x: 50, z: 35 }, { x: -50, z: 35 },
      { x: 0, z: 70 }, { x: 0, z: -55 }
    ];

    lampPositions.forEach(p => {
      const lamp = new THREE.Group();
      lamp.position.set(p.x, 0, p.z);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 5.0, 8), ironMat);
      pole.position.y = 2.5;
      pole.castShadow = true;
      lamp.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), ironMat);
      arm.position.set(0.35, 4.8, 0);
      lamp.add(arm);

      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xffedd5,
        emissive: 0xfde047,
        emissiveIntensity: 0.3
      });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), bulbMat);
      bulb.position.set(0.65, 4.5, 0);
      lamp.add(bulb);

      const pLight = new THREE.PointLight(0xffedd5, 0, 18);
      pLight.position.set(0.65, 4.5, 0);
      lamp.add(pLight);

      this.streetLights.push({ bulbMat, light: pLight });
      furnGroup.add(lamp);
    });

    const vendingPositions = [
      { x: 10, z: 55, color: 0xef4444 },
      { x: 12.2, z: 55, color: 0x3b82f6 }
    ];

    vendingPositions.forEach(v => {
      const vend = new THREE.Group();
      vend.position.set(v.x, 0, v.z);
      vend.rotation.y = -Math.PI / 2;

      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 2.4, 1.0),
        new THREE.MeshStandardMaterial({ color: v.color, roughness: 0.3, metalness: 0.2 })
      );
      body.position.y = 1.2;
      body.castShadow = true;

      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.8),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: 0xffffff,
          emissiveIntensity: 0.6,
          roughness: 0.1
        })
      );
      glass.position.set(0, 1.4, 0.51);

      vend.add(body, glass);
      furnGroup.add(vend);
    });

    const binGroup = new THREE.Group();
    binGroup.position.set(15, 0, 55);
    const binMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
    for (let b = 0; b < 3; b++) {
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.0, 0.6), binMat);
      bin.position.set(b * 0.7, 0.5, 0);
      bin.castShadow = true;
      binGroup.add(bin);
    }
    furnGroup.add(binGroup);

    this.scene.add(furnGroup);
  }

  createParkBus() {
    this.parkBus = new THREE.Group();

    const redMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
    const creamMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.1, metalness: 0.6 });
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.2, 7.5), redMat);
    lowerBody.position.y = 1.0;
    lowerBody.castShadow = true;

    const upperBody = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.3, 7.2), creamMat);
    upperBody.position.y = 2.25;
    upperBody.castShadow = true;

    const winGeo = new THREE.BoxGeometry(3.05, 0.8, 6.8);
    const windowMesh = new THREE.Mesh(winGeo, glassMat);
    windowMesh.position.y = 2.25;

    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const w1 = new THREE.Mesh(wheelGeo, wheelMat); w1.position.set(-1.6, 0.55, 2.2);
    const w2 = new THREE.Mesh(wheelGeo, wheelMat); w2.position.set(1.6, 0.55, 2.2);
    const w3 = new THREE.Mesh(wheelGeo, wheelMat); w3.position.set(-1.6, 0.55, -2.2);
    const w4 = new THREE.Mesh(wheelGeo, wheelMat); w4.position.set(1.6, 0.55, -2.2);

    this.parkBus.add(lowerBody, upperBody, windowMesh, w1, w2, w3, w4);

    this.busRoute = [
      new THREE.Vector3(0, 0, 70),
      new THREE.Vector3(0, 0, 15),
      new THREE.Vector3(60, 0, 15),
      new THREE.Vector3(80, 0, -40),
      new THREE.Vector3(40, 0, -50),
      new THREE.Vector3(-40, 0, -50),
      new THREE.Vector3(-80, 0, -30),
      new THREE.Vector3(-60, 0, 15),
      new THREE.Vector3(0, 0, 15)
    ];

    this.parkBus.position.copy(this.busRoute[0]);
    this.scene.add(this.parkBus);
  }

  createFountain() {
    const particleCount = 180;
    this.fountainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.6;
      positions[i * 3 + 1] = 0.6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.6;

      velocities.push({
        x: (Math.random() - 0.5) * 2.0,
        y: 6.0 + Math.random() * 4.0,
        z: (Math.random() - 0.5) * 2.0
      });
    }

    this.fountainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.fountainVelocities = velocities;

    const pMat = new THREE.PointsMaterial({
      color: 0xbfdbfe,
      size: 0.55,
      transparent: true,
      opacity: 0.85
    });

    this.fountainParticles = new THREE.Points(this.fountainGeo, pMat);
    this.fountainParticles.position.set(0, 0.5, 0);
    this.scene.add(this.fountainParticles);

    const baseGeo = new THREE.CylinderGeometry(2.4, 3.2, 1.2, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0.6, 0);
    base.receiveShadow = true;
    this.scene.add(base);
  }

  update(delta, time = 0) {
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

    if (this.parkBus && this.busRoute.length > 1) {
      this.busProgress += delta * 0.04;
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

    if (this.fountainGeo && this.fountainVelocities) {
      const pos = this.fountainGeo.attributes.position.array;
      for (let i = 0; i < this.fountainVelocities.length; i++) {
        const vel = this.fountainVelocities[i];
        pos[i * 3] += vel.x * delta;
        pos[i * 3 + 1] += vel.y * delta;
        pos[i * 3 + 2] += vel.z * delta;

        vel.y -= 10.5 * delta;

        if (pos[i * 3 + 1] <= 0.6) {
          pos[i * 3] = (Math.random() - 0.5) * 0.5;
          pos[i * 3 + 1] = 0.7;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
          vel.x = (Math.random() - 0.5) * 2.2;
          vel.y = 6.0 + Math.random() * 4.5;
          vel.z = (Math.random() - 0.5) * 2.2;
        }
      }
      this.fountainGeo.attributes.position.needsUpdate = true;
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
