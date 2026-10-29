import * as THREE from 'three';

export class Foliage {
  constructor(scene) {
    this.scene = scene;
    this.streetLights = [];
    this.fountainParticles = null;
    this.fountainGeo = null;
    this.init();
  }

  init() {
    this.createTrees();
    this.createFlowerBeds();
    this.createStreetFurniture();
    this.createFountain();
  }

  createTrees() {
    // 樹木の種類：丸い広葉樹、針葉樹、ヤシの木（植物園付近）
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
    const leafMat1 = new THREE.MeshLambertMaterial({ color: 0x2e7d32, flatShading: true });
    const leafMat2 = new THREE.MeshLambertMaterial({ color: 0x43a047, flatShading: true });
    const leafMat3 = new THREE.MeshLambertMaterial({ color: 0x1b5e20, flatShading: true });
    const palmLeafMat = new THREE.MeshLambertMaterial({ color: 0x388e3c, flatShading: true });

    const treeGroup = new THREE.Group();

    // 園内の外周や緑地帯に木をランダム配置（歩道や池を避ける）
    const treePositions = [];
    const minDistance = 6;

    for (let i = 0; i < 180; i++) {
      const x = (Math.random() - 0.5) * 360;
      const z = (Math.random() - 0.5) * 360;
      const distFromCenter = Math.hypot(x, z);

      // 中央池（半径約25）や建物周辺を避ける
      if (distFromCenter < 30) continue;
      // 観覧車エリア周辺（X: 80, Z: -70）
      if (Math.hypot(x - 80, z + 70) < 25) continue;
      // 恐竜エリア周辺（X: -80, Z: 80）
      if (Math.hypot(x + 80, z - 80) < 25) continue;
      // 温室エリア周辺（X: 80, Z: 70）
      if (Math.hypot(x - 80, z - 70) < 28) {
        // 温室周辺はヤシの木
        this.createPalmTree(x, z, treeGroup, trunkMat, palmLeafMat);
        continue;
      }

      // 一般の木
      const scale = 0.8 + Math.random() * 0.7;
      const type = Math.random();

      const tree = new THREE.Group();
      tree.position.set(x, 0, z);
      tree.scale.set(scale, scale, scale);

      // 幹
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 6);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      tree.add(trunk);

      if (type < 0.6) {
        // 丸い木
        const leafMat = type < 0.3 ? leafMat1 : leafMat2;
        const leafGeo1 = new THREE.DodecahedronGeometry(2.2, 1);
        const foliage = new THREE.Mesh(leafGeo1, leafMat);
        foliage.position.y = 4.5;
        foliage.castShadow = true;
        tree.add(foliage);

        const leafGeo2 = new THREE.DodecahedronGeometry(1.6, 1);
        const foliage2 = new THREE.Mesh(leafGeo2, leafMat3);
        foliage2.position.set(0.6, 5.5, -0.4);
        foliage2.castShadow = true;
        tree.add(foliage2);
      } else {
        // コニファー（円錐）
        const coneGeo = new THREE.ConeGeometry(2.2, 5, 7);
        const cone = new THREE.Mesh(coneGeo, leafMat3);
        cone.position.y = 4.8;
        cone.castShadow = true;
        tree.add(cone);
      }

      treeGroup.add(tree);
    }

    this.scene.add(treeGroup);
  }

  createPalmTree(x, z, parent, trunkMat, leafMat) {
    const palm = new THREE.Group();
    palm.position.set(x, 0, z);

    // カーブした幹
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 7, 6);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.5;
    trunk.rotation.z = (Math.random() - 0.5) * 0.15;
    palm.add(trunk);

    // 放射状のヤシの葉
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const leafGeo = new THREE.BoxGeometry(0.4, 0.1, 3.2);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.set(Math.sin(angle) * 1.4, 6.8, Math.cos(angle) * 1.4);
      leaf.rotation.y = angle;
      leaf.rotation.x = 0.5;
      palm.add(leaf);
    }

    parent.add(palm);
  }

  createFlowerBeds() {
    // 植物園エリア（X: 80, Z: 60付近）と中央広場に色とりどりの大花壇
    const bedGroup = new THREE.Group();
    const colors = [0xe11d48, 0xf59e0b, 0x8b5cf6, 0xec4899, 0xfbbf24, 0x38bdf8];

    // 植物園の大花壇群
    const bedCenters = [
      { x: 55, z: 45, r: 12 },
      { x: 75, z: 40, r: 10 },
      { x: 60, z: 65, r: 8 },
      { x: 0, z: 30, r: 6 } // 中央門前花壇
    ];

    bedCenters.forEach(center => {
      // 土台
      const baseGeo = new THREE.CylinderGeometry(center.r, center.r + 0.4, 0.4, 16);
      const baseMat = new THREE.MeshLambertMaterial({ color: 0x3d271d });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(center.x, 0.2, center.z);
      bedGroup.add(base);

      // レンガ枠
      const rimGeo = new THREE.TorusGeometry(center.r + 0.2, 0.3, 8, 24);
      const rimMat = new THREE.MeshLambertMaterial({ color: 0x9a3412 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      rim.position.set(center.x, 0.35, center.z);
      rim.rotation.x = Math.PI / 2;
      bedGroup.add(rim);

      // 花の房
      const flowerCount = Math.floor(center.r * 6);
      for (let i = 0; i < flowerCount; i++) {
        const rad = Math.random() * (center.r - 0.8);
        const angle = Math.random() * Math.PI * 2;
        const fx = center.x + Math.cos(angle) * rad;
        const fz = center.z + Math.sin(angle) * rad;

        const flowerColor = colors[Math.floor(Math.random() * colors.length)];
        const flowerGeo = new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.25, 0);
        const flowerMat = new THREE.MeshLambertMaterial({ color: flowerColor });
        const flower = new THREE.Mesh(flowerGeo, flowerMat);
        flower.position.set(fx, 0.55 + Math.random() * 0.2, fz);
        bedGroup.add(flower);
      }
    });

    this.scene.add(bedGroup);
  }

  createStreetFurniture() {
    // ベンチと街灯を園内の道沿いに配置
    const furnGroup = new THREE.Group();
    const benchPositions = [
      { x: 12, z: 12, rot: 0.8 },
      { x: -12, z: 12, rot: -0.8 },
      { x: 35, z: 20, rot: 0 },
      { x: -35, z: -20, rot: Math.PI },
      { x: 60, z: -40, rot: -0.5 },
      { x: -60, z: 40, rot: 0.5 },
      { x: 0, z: -28, rot: 0 }, // 観覧車手前
      { x: 0, z: 45, rot: Math.PI } // 中央門付近
    ];

    const benchMatWood = new THREE.MeshLambertMaterial({ color: 0x854d0e });
    const benchMatIron = new THREE.MeshLambertMaterial({ color: 0x1e293b });

    benchPositions.forEach(p => {
      const bench = new THREE.Group();
      bench.position.set(p.x, 0, p.z);
      bench.rotation.y = p.rot;

      // 座面と背もたれ
      const seat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.6), benchMatWood);
      seat.position.set(0, 0.5, 0);
      bench.add(seat);

      const back = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.6, 0.1), benchMatWood);
      back.position.set(0, 0.9, -0.25);
      bench.add(back);

      // 脚
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.6), benchMatIron);
      leg1.position.set(-1, 0.25, 0);
      bench.add(leg1);
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.6), benchMatIron);
      leg2.position.set(1, 0.25, 0);
      bench.add(leg2);

      furnGroup.add(bench);
    });

    // 街灯（夜間に点灯）
    const lampPositions = [
      { x: 20, z: 0 },
      { x: -20, z: 0 },
      { x: 0, z: 20 },
      { x: 0, z: -20 },
      { x: 45, z: -35 },
      { x: -45, z: -35 },
      { x: 50, z: 35 },
      { x: -50, z: 35 },
      { x: 0, z: 60 },
      { x: 0, z: -60 }
    ];

    const poleMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const lampBulbMat = new THREE.MeshStandardMaterial({
      color: 0xfffbeb,
      emissive: 0xfef08a,
      emissiveIntensity: 0.2
    });

    lampPositions.forEach(p => {
      const lamp = new THREE.Group();
      lamp.position.set(p.x, 0, p.z);

      // 支柱
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 4.5, 8), poleMat);
      pole.position.y = 2.25;
      lamp.add(pole);

      // ランプ頭部
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), lampBulbMat);
      bulb.position.y = 4.6;
      lamp.add(bulb);

      // 夜間用ポイントライト
      const pLight = new THREE.PointLight(0xffedd5, 0, 15);
      pLight.position.y = 4.6;
      lamp.add(pLight);

      this.streetLights.push({ bulbMat: lampBulbMat, light: pLight });
      furnGroup.add(lamp);
    });

    this.scene.add(furnGroup);
  }

  createFountain() {
    // 中央池（X: 0, Z: 0）の真ん中にある噴水
    const particleCount = 120;
    this.fountainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 1] = 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      velocities.push({
        x: (Math.random() - 0.5) * 1.5,
        y: 4.5 + Math.random() * 3.5,
        z: (Math.random() - 0.5) * 1.5
      });
    }

    this.fountainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.fountainVelocities = velocities;

    const pMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.45,
      transparent: true,
      opacity: 0.8
    });

    this.fountainParticles = new THREE.Points(this.fountainGeo, pMat);
    this.fountainParticles.position.set(0, 0.5, 0);
    this.scene.add(this.fountainParticles);

    // 噴水台座
    const baseGeo = new THREE.CylinderGeometry(2, 2.5, 1, 16);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, 0.5, 0);
    this.scene.add(base);
  }

  update(delta) {
    // 噴水パーティクルの更新
    if (this.fountainGeo && this.fountainVelocities) {
      const pos = this.fountainGeo.attributes.position.array;
      for (let i = 0; i < this.fountainVelocities.length; i++) {
        const vel = this.fountainVelocities[i];
        pos[i * 3] += vel.x * delta;
        pos[i * 3 + 1] += vel.y * delta;
        pos[i * 3 + 2] += vel.z * delta;

        vel.y -= 9.8 * delta; // 重力

        if (pos[i * 3 + 1] <= 0.5) {
          // リセット
          pos[i * 3] = (Math.random() - 0.5) * 0.4;
          pos[i * 3 + 1] = 0.6;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
          vel.x = (Math.random() - 0.5) * 1.8;
          vel.y = 5.0 + Math.random() * 4.0;
          vel.z = (Math.random() - 0.5) * 1.8;
        }
      }
      this.fountainGeo.attributes.position.needsUpdate = true;
    }
  }

  setNightMode(isNight) {
    this.streetLights.forEach(item => {
      if (isNight) {
        item.bulbMat.emissiveIntensity = 1.0;
        item.light.intensity = 1.5;
      } else {
        item.bulbMat.emissiveIntensity = 0.2;
        item.light.intensity = 0;
      }
    });
  }
}
