import { World } from './world/World.js';
import { AudioManager } from './world/AudioManager.js';
import { PlayerController } from './controls/PlayerController.js';
import { MiniMap } from './ui/MiniMap.js';
import { Dialog } from './ui/Dialog.js';
import { HUD } from './ui/HUD.js';
import { GateAuth } from './ui/GateAuth.js';
import './style.css';

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.audio = new AudioManager();
    this.world = null;
    this.player = null;
    this.minimap = null;
    this.dialog = null;
    this.hud = null;
    this.isStarted = false;

    // 入園ゲート認証
    this.gateAuth = new GateAuth(() => {
      this.onUnlocked();
    });
  }

  onUnlocked() {
    if (this.isStarted) return;
    this.isStarted = true;

    // オーディオ初期化（ユーザー操作イベント後なので再生許可される）
    this.audio.init();

    // 3Dワールド構築
    this.world = new World(this.container, this.audio);

    // プレイヤーコントローラー
    this.player = new PlayerController(
      this.world.camera,
      this.world.renderer.domElement,
      this.audio,
      this.world.landmarks
    );

    // ダイアログUI
    this.dialog = new Dialog(this.audio, this.player);

    // ミニマップUI
    this.minimap = new MiniMap('minimap-canvas', this.player, this.world.landmarks);

    // HUD
    this.hud = new HUD(this.world, this.player, this.audio, this.dialog);

    // メインアニメーションループ開始
    this.lastTime = performance.now();
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (this.player) this.player.update(delta);
    if (this.world) this.world.render();
    if (this.minimap) this.minimap.update();
    if (this.hud) this.hud.update();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
