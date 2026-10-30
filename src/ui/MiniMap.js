import { parkData } from '../data/parkData.js';

export class MiniMap {
  constructor(canvasId, playerController, landmarks) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.player = playerController;
    this.landmarks = landmarks;

    // ワールド座標マッピング範囲（-380〜+380, -280〜+280）
    this.minX = -380;
    this.maxX = 380;
    this.minZ = -280;
    this.maxZ = 280;

    this.setupClickTeleport();
  }

  setupClickTeleport() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const normX = clickX / rect.width;
      const normY = clickY / rect.height;

      const worldX = this.minX + normX * (this.maxX - this.minX);
      const worldZ = this.minZ + normY * (this.maxZ - this.minZ);

      this.player.teleportTo(worldX, 2.0, worldZ);
    });
  }

  toMapX(wx) {
    return ((wx - this.minX) / (this.maxX - this.minX)) * this.canvas.width;
  }

  toMapY(wz) {
    return ((wz - this.minZ) / (this.maxZ - this.minZ)) * this.canvas.height;
  }

  update() {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // 1. 背景（園外）
    ctx.fillStyle = '#1e3820';
    ctx.fillRect(0, 0, w, h);

    // 2. 実寸公園境界ポリゴン（緑地）
    ctx.beginPath();
    parkData.park.forEach(([px, pz], i) => {
      const mx = this.toMapX(px);
      const my = this.toMapY(pz);
      if (i === 0) ctx.moveTo(mx, my);
      else ctx.lineTo(mx, my);
    });
    ctx.closePath();
    ctx.fillStyle = '#2f6629';
    ctx.fill();
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3. 実寸水域・池（ブルー）
    ctx.fillStyle = '#0284c7';
    parkData.water.forEach(water => {
      ctx.beginPath();
      water.o.forEach(([wx, wz], i) => {
        const mx = this.toMapX(wx);
        const my = this.toMapY(wz);
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      });
      ctx.closePath();
      ctx.fill();
    });

    // 4. 実寸道路網（ライトグレーライン）
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    parkData.ways.forEach(way => {
      if (!way.p || way.p.length < 2) return;
      ctx.beginPath();
      way.p.forEach(([rx, rz], i) => {
        const mx = this.toMapX(rx);
        const my = this.toMapY(rz);
        if (i === 0) ctx.moveTo(mx, my);
        else ctx.lineTo(mx, my);
      });
      ctx.stroke();
    });

    // 5. ランドマークアイコン群
    const landmarks = [
      { name: '🎫 正門', x: -204.9, z: -59.0, color: '#fb923c' },
      { name: '🎡 観覧車', x: 176.5, z: 99.7, color: '#38bdf8' },
      { name: '🦕 恐竜', x: -89.1, z: -34.5, color: '#f87171' },
      { name: '🦒 キリン', x: 129.2, z: 44.2, color: '#facc15' },
      { name: '🌴 温室', x: 246.3, z: -91.1, color: '#4ade80' },
      { name: '🐻‍❄️ 極地', x: -91.9, z: 127.9, color: '#a5f3fc' },
      { name: '🐘 ゾウ', x: -149.3, z: 170.5, color: '#cbd5e1' },
      { name: '🚂 D51', x: -237.5, z: -10.7, color: '#e2e8f0' },
      { name: '🌊 大池', x: 0.1, z: -20.0, color: '#60a5fa' }
    ];

    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    landmarks.forEach(l => {
      const mx = this.toMapX(l.x);
      const my = this.toMapY(l.z);

      ctx.fillStyle = l.color;
      ctx.beginPath();
      ctx.arc(mx, my, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 3;
      ctx.fillText(l.name, mx, my + 10);
      ctx.shadowBlur = 0;
    });

    // 6. プレイヤー位置（赤丸）＆視線コーン
    const px = this.toMapX(this.player.position.x);
    const py = this.toMapY(this.player.position.z);

    const lookAngle = -this.player.yaw - Math.PI / 2;
    const coneLen = 14;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, coneLen, lookAngle - 0.5, lookAngle + 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
