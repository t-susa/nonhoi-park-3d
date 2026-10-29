import * as THREE from 'three';

// プロシージャルPBRテクスチャジェネレーター（外部画像ファイル不要で超高精細・軽量）
export class TextureGenerator {
  // 1. 芝生テクスチャ（カラーマップ＆バンプマップ）
  static createGrassTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // ベースの深い土・緑
    ctx.fillStyle = '#2f5b24';
    ctx.fillRect(0, 0, size, size);

    // ノイズとブレンド層（色むら）
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = Math.random();
      if (r < 0.4) {
        ctx.fillStyle = '#3f732e'; // 明るい草色
      } else if (r < 0.7) {
        ctx.fillStyle = '#23471c'; // 深緑
      } else if (r < 0.9) {
        ctx.fillStyle = '#4c8636'; // 若草色
      } else {
        ctx.fillStyle = '#453823'; // 土・小石
      }
      ctx.fillRect(x, y, 2.5, 3.5);
    }

    // 草の繊維（縦スジ）
    ctx.fillStyle = 'rgba(80, 150, 60, 0.25)';
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const h = 4 + Math.random() * 8;
      ctx.fillRect(x, y, 1.2, h);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(30, 30);
    return tex;
  }

  // 芝生用バンプ（法線）マップ
  static createGrassBumpMap() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(size, size);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      imgData.data[i] = v;
      imgData.data[i + 1] = v;
      imgData.data[i + 2] = v;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(30, 30);
    return tex;
  }

  // 2. 歩道・インターロッキング敷石テクスチャ
  static createPavementTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 目地のベース（濃いグレー）
    ctx.fillStyle = '#57534e';
    ctx.fillRect(0, 0, size, size);

    // インターロッキングブロック（敷石パターン）
    const blockSizeX = 32;
    const blockSizeY = 16;
    const gap = 2;

    for (let y = 0; y < size; y += blockSizeY) {
      const row = Math.floor(y / blockSizeY);
      const offsetX = (row % 2 === 0) ? 0 : blockSizeX / 2;

      for (let x = -blockSizeX; x < size + blockSizeX; x += blockSizeX) {
        // 各ブロックごとに微細な色味の変化
        const shade = 180 + Math.floor((Math.random() - 0.5) * 35);
        const r = shade + 8;
        const g = shade;
        const b = shade - 6;

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + offsetX + gap, y + gap, blockSizeX - gap * 2, blockSizeY - gap * 2);

        // ブロック表面の微細なノイズ・ざらつき
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let n = 0; n < 20; n++) {
          ctx.fillRect(
            x + offsetX + gap + Math.random() * (blockSizeX - gap * 2),
            y + gap + Math.random() * (blockSizeY - gap * 2),
            1.5,
            1.5
          );
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(12, 12);
    return tex;
  }

  // 3. 恐竜の皮膚テクスチャ（爬虫類・ウロコとシワ）
  static createDinoSkinTexture(baseColor = '#4a5943') {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // ウロコ・セルの境界線（ボロノイ風グリッド）
    const cellSize = 16;
    for (let y = 0; y < size; y += cellSize) {
      for (let x = 0; x < size; x += cellSize) {
        const cx = x + cellSize / 2 + (Math.random() - 0.5) * 6;
        const cy = y + cellSize / 2 + (Math.random() - 0.5) * 6;
        const rad = cellSize / 2 - 1.5;

        // セル中心
        const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, rad);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  // 4. キリンの網目模様テクスチャ
  static createGiraffeTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // 地の色（淡いクリーム色）
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(0, 0, size, size);

    // 茶色の不規則な斑点（パッチ）
    ctx.fillStyle = '#92400e';
    const patchSize = 48;
    for (let y = 8; y < size; y += patchSize) {
      for (let x = 8; x < size; x += patchSize) {
        const px = x + (Math.random() - 0.5) * 12;
        const py = y + (Math.random() - 0.5) * 12;
        const w = patchSize - 12 + (Math.random() - 0.5) * 8;
        const h = patchSize - 12 + (Math.random() - 0.5) * 8;

        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(px, py, w, h, 8) : ctx.rect(px, py, w, h);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    return tex;
  }

  // 5. シマウマのストライプテクスチャ
  static createZebraTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#1e293b';
    for (let y = 0; y < size; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + 16, size * 0.7, y - 16, size, y + 8);
      ctx.lineTo(size, y + 20);
      ctx.bezierCurveTo(size * 0.7, y - 4, size * 0.3, y + 28, 0, y + 16);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    return tex;
  }

  // 6. 木目・デッキ板テクスチャ
  static createWoodTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 0, size, size);

    // デッキ板の隙間（縦目地）
    const plankWidth = 64;
    for (let x = 0; x < size; x += plankWidth) {
      // 木目スジ
      ctx.fillStyle = 'rgba(69, 26, 3, 0.15)';
      for (let i = 0; i < 40; i++) {
        const gx = x + Math.random() * plankWidth;
        ctx.fillRect(gx, 0, 1.5, size);
      }

      // 板と板の境目
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x, 0, 2.5, size);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    return tex;
  }

  // 7. 水面ノーマルマップ（さざ波）
  static createWaterNormalTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const imgData = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        // さざ波の傾斜（法線ベクトル計算）
        const nx = Math.sin((x / size) * Math.PI * 8) * 0.5 + 0.5;
        const ny = Math.cos((y / size) * Math.PI * 8) * 0.5 + 0.5;
        imgData.data[idx] = Math.floor(nx * 255);     // R (X法線)
        imgData.data[idx + 1] = Math.floor(ny * 255); // G (Y法線)
        imgData.data[idx + 2] = 255;                  // B (Z法線)
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    return tex;
  }

  // 8. 雲のふんわりテクスチャ
  static createCloudTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
    grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
  }
}
