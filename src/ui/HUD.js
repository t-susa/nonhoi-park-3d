export class HUD {
  constructor(world, player, audio, dialog) {
    this.world = world;
    this.player = player;
    this.audio = audio;
    this.dialog = dialog;

    this.actionPrompt = document.getElementById('action-prompt');
    this.nearbySpot = null;

    this.setupTopActions();
    this.setupTeleportChips();
    this.setupFerrisBadge();
    this.setupMobileJoystick();
  }

  setupTopActions() {
    // 時間帯切替
    const timeBtns = document.querySelectorAll('.time-btn');
    timeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        timeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.time;
        this.world.setTimeMode(mode);
      });
    });

    // ミュート切替
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // 視点切り替え（一人称 FPS ➔ 三人称 TPS ➔ ドローン全景マップ）
    const viewBtn = document.getElementById('btn-view-mode');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        this.player.cycleViewMode();
        this.updateViewButtonIcon(viewBtn);
      });
    }

    // 写真撮影（スクリーンショット保存）
    const photoBtn = document.getElementById('btn-photo');
    if (photoBtn) {
      photoBtn.addEventListener('click', () => this.takeScreenshot());
    }

    // インタラクションプロンプト
    if (this.actionPrompt) {
      this.actionPrompt.addEventListener('click', () => {
        if (this.nearbySpot) {
          this.dialog.open(this.nearbySpot);
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if ((e.code === 'KeyE') && this.nearbySpot && !this.dialog.isOpen) {
        this.dialog.open(this.nearbySpot);
      }
    });
  }

  updateViewButtonIcon(btn) {
    if (this.player.viewMode === 'fps') {
      btn.textContent = '👁️';
      btn.title = '現在の視点：一人称 (FPS) — クリックで三人称へ';
    } else if (this.player.viewMode === 'tps') {
      btn.textContent = '🚶';
      btn.title = '現在の視点：三人称 (TPS) — クリックでドローン全景マップへ';
    } else if (this.player.viewMode === 'map') {
      btn.textContent = '🗺️';
      btn.title = '現在の視点：ドローン全景マップ — 地面クリックで移動';
    }
  }

  setupTeleportChips() {
    const chips = document.querySelectorAll('.teleport-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const spotId = chip.dataset.spot;
        const target = this.getSpotCoords(spotId);
        if (target) {
          this.player.teleportTo(target.x, target.y, target.z);
        }
      });
    });
  }

  // 実在OSM座標に基づく正確なファストトラベル先
  getSpotCoords(id) {
    switch (id) {
      case 'gate': return { x: -204.9, y: 2.0, z: -45.0 };       // 中央門
      case 'ferris': return { x: 176.5, y: 2.0, z: 90.0 };       // 大観覧車
      case 'dino': return { x: -89.1, y: 2.0, z: -25.0 };        // 野外恐竜ランド
      case 'africa': return { x: 129.2, y: 4.9, z: 44.2 };       // キリンデッキ
      case 'greenhouse': return { x: 246.3, y: 2.0, z: -75.0 };   // 大温室
      case 'polar': return { x: -91.9, y: 2.0, z: 115.0 };       // 極地動物館
      case 'elephant': return { x: -149.3, y: 2.0, z: 155.0 };   // アジアゾウ舎
      case 'd51': return { x: -237.5, y: 2.0, z: -5.0 };         // D51蒸気機関車
      case 'monet': return { x: 190.4, y: 2.0, z: -165.0 };      // モネの池
      case 'lake': return { x: 0.1, y: 2.0, z: -5.0 };           // 中央大池
      case 'east_gate': return { x: 290.0, y: 2.0, z: -108.0 };  // 東門
      case 'west_gate': return { x: -315.0, y: 2.0, z: 92.0 };   // 西門
      default: return { x: -204.9, y: 2.0, z: -45.0 };
    }
  }

  setupFerrisBadge() {
    const badge = document.getElementById('ferris-ride-badge');
    const exitBtn = document.getElementById('ferris-exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.player.exitFerrisWheel();
        badge.style.display = 'none';
      });
    }
  }

  setupMobileJoystick() {
    const joystickZone = document.getElementById('joystick-zone');
    const thumb = document.getElementById('joystick-thumb');
    const jumpBtn = document.getElementById('mobile-jump-btn');

    if (!joystickZone || !thumb) return;

    let touchId = null;
    let startX = 0;
    let startY = 0;
    const maxRadius = 35;

    joystickZone.addEventListener('touchstart', (e) => {
      if (touchId !== null) return;
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = joystickZone.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }, { passive: true });

    joystickZone.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - startX;
          const dy = touch.clientY - startY;
          const dist = Math.hypot(dx, dy);

          const angle = Math.atan2(dy, dx);
          const clampedDist = Math.min(dist, maxRadius);

          const thumbX = Math.cos(angle) * clampedDist;
          const thumbY = Math.sin(angle) * clampedDist;

          thumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

          this.player.touchMoveVector.x = thumbX / maxRadius;
          this.player.touchMoveVector.y = -thumbY / maxRadius;
        }
      }
    }, { passive: true });

    const endTouch = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          thumb.style.transform = `translate(0px, 0px)`;
          this.player.touchMoveVector.x = 0;
          this.player.touchMoveVector.y = 0;
        }
      }
    };

    joystickZone.addEventListener('touchend', endTouch);
    joystickZone.addEventListener('touchcancel', endTouch);

    if (jumpBtn) {
      jumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.player.isGrounded && !this.player.isRidingFerris) {
          this.player.velocity.y = this.player.jumpForce;
          this.player.isGrounded = false;
        }
      });
    }
  }

  takeScreenshot() {
    this.world.renderer.render(this.world.scene, this.world.camera);
    const dataURL = this.world.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `nonhoi-park-${Date.now()}.png`;
    a.href = dataURL;
    a.click();
  }

  update() {
    if (this.dialog.isOpen || this.player.isRidingFerris || this.player.viewMode === 'map') {
      if (this.actionPrompt) this.actionPrompt.style.display = 'none';
      return;
    }

    let closest = null;
    let minDist = Infinity;

    this.world.landmarks.spots.forEach(spot => {
      const dist = this.player.position.distanceTo(spot.pos);
      if (dist < spot.dist && dist < minDist) {
        minDist = dist;
        closest = spot;
      }
    });

    this.nearbySpot = closest;

    if (closest) {
      this.actionPrompt.style.display = 'flex';
      this.actionPrompt.innerHTML = `<span>${closest.icon}</span> <span>[E] ${closest.title} の案内を見る</span>`;
    } else {
      this.actionPrompt.style.display = 'none';
    }
  }
}
