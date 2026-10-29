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

    // ミュート
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.audio.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // 視点切り替え
    const viewBtn = document.getElementById('btn-view-mode');
    if (viewBtn) {
      viewBtn.addEventListener('click', () => {
        this.player.toggleViewMode();
        viewBtn.textContent = this.player.viewMode === 'fps' ? '👁️' : '🚶';
      });
    }

    // 写真撮影（スクリーンショット）
    const photoBtn = document.getElementById('btn-photo');
    if (photoBtn) {
      photoBtn.addEventListener('click', () => this.takeScreenshot());
    }

    // インタラクションプロンプトクリック
    if (this.actionPrompt) {
      this.actionPrompt.addEventListener('click', () => {
        if (this.nearbySpot) {
          this.dialog.open(this.nearbySpot);
        }
      });
    }

    // キーボード [E] でスポット案内を開く
    window.addEventListener('keydown', (e) => {
      if ((e.code === 'KeyE') && this.nearbySpot && !this.dialog.isOpen) {
        this.dialog.open(this.nearbySpot);
      }
    });
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

  getSpotCoords(id) {
    switch (id) {
      case 'gate': return { x: 0, y: 2, z: 85 };
      case 'africa': return { x: -80, y: 4.9, z: -65 };
      case 'polar': return { x: -45, y: 2, z: -65 };
      case 'greenhouse': return { x: 80, y: 2, z: 50 };
      case 'dino': return { x: -80, y: 2, z: 65 };
      case 'ferris': return { x: 80, y: 2, z: -55 };
      case 'lake': return { x: 0, y: 3.6, z: 0 };
      default: return { x: 0, y: 2, z: 85 };
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

          // プレイヤー入力（Y反転：上方向は前進）
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
    // プレイヤーが近づいているスポットを検知
    if (this.dialog.isOpen || this.player.isRidingFerris) {
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
