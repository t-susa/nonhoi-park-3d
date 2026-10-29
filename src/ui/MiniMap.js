export class MiniMap {
  constructor(canvasId, playerController, landmarks) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.player = playerController;
    this.landmarks = landmarks;

    // ワールド座標系（-160〜160）をミニマップ解像度にマッピング
    this.mapWorldSize = 320; // -160 to +160

    this.setupClickTeleport();
  }

  setupClickTeleport() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // canvasピクセル座標をワールド座標へ逆変換
      const normX = clickX / rect.width;
      const normY = clickY / rect.height;

      const worldX = (normX - 0.5) * this.mapWorldSize;
      const worldZ = (normY - 0.5) * this.mapWorldSize;

      this.player.teleportTo(worldX, 2.0, worldZ);
    });
  }

  update() {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    // 背景（芝生）
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, w, h);

    // 座標変換ヘルパー
    const toMapX = (wx) => ((wx / this.mapWorldSize) + 0.5) * w;
    const toMapY = (wz) => ((wz / this.mapWorldSize) + 0.5) * h;

    // 歩道（グレーライン）
    ctx.strokeStyle = '#a8a29e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    // メイン中央縦道
    ctx.moveTo(toMapX(0), toMapY(95));
    ctx.lineTo(toMapX(0), toMapY(-60));
    // 横道
    ctx.moveTo(toMapX(-100), toMapY(0));
    ctx.lineTo(toMapX(100), toMapY(0));
    // 各ゾーン連絡路
    ctx.moveTo(toMapX(0), toMapY(-60));
    ctx.lineTo(toMapX(80), toMapY(-60)); // 遊園地
    ctx.lineTo(toMapX(80), toMapY(70));  // 植物園
    ctx.moveTo(toMapX(0), toMapY(-60));
    ctx.lineTo(toMapX(-80), toMapY(-60)); // 動物園
    ctx.lineTo(toMapX(-80), toMapY(80));  // 恐竜
    ctx.stroke();

    // 中央池（ブルー円）
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(toMapX(0), toMapY(0), (24 / this.mapWorldSize) * w, 0, Math.PI * 2);
    ctx.fill();

    // 4大エリアのラベルとアイコン
    const zones = [
      { name: '🦒 動物園', x: -80, z: -65, color: '#4ade80' },
      { name: '🎡 遊園地', x: 80, z: -70, color: '#38bdf8' },
      { name: '🦕 恐竜博', x: -80, z: 80, color: '#f87171' },
      { name: '🌴 植物園', x: 80, z: 70, color: '#facc15' },
      { name: '🎫 正門', x: 0, z: 95, color: '#fb923c' }
    ];

    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    zones.forEach(z => {
      const mx = toMapX(z.x);
      const my = toMapY(z.z);

      ctx.fillStyle = z.color;
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(z.name, mx, my + 13);
      ctx.shadowBlur = 0;
    });

    // プレイヤー位置（赤い点＋視線コーン）
    const px = toMapX(this.player.position.x);
    const py = toMapY(this.player.position.z);

    // 視線コーン
    const lookAngle = -this.player.yaw - Math.PI / 2;
    const coneLen = 14;
    ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, coneLen, lookAngle - 0.5, lookAngle + 0.5);
    ctx.closePath();
    ctx.fill();

    // プレイヤードット
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
