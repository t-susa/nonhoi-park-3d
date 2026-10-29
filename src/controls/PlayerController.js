import * as THREE from 'three';

export class PlayerController {
  constructor(camera, domElement, audioManager, landmarks) {
    this.camera = camera;
    this.domElement = domElement;
    this.audio = audioManager;
    this.landmarks = landmarks;

    // プレイヤー物理パラメータ
    this.position = new THREE.Vector3(0, 2.0, 85); // 中央門からスタート
    this.velocity = new THREE.Vector3();
    this.speed = 10.0;
    this.runMultiplier = 1.8;
    this.isGrounded = true;
    this.gravity = 24.0;
    this.jumpForce = 9.0;

    // 視線・カメラ角度
    this.yaw = 0; // 水平角度 (ラジアン)
    this.pitch = 0; // 垂直角度 (ラジアン)
    this.minPitch = -Math.PI / 2.5;
    this.maxPitch = Math.PI / 2.5;

    // カメラモード: 'fps' (一人称) / 'tps' (三人称) / 'ferris' (観覧車)
    this.viewMode = 'fps';

    // 入力状態
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      shift: false,
      jump: false
    };

    // マウスドラッグ追跡
    this.isMouseDown = false;
    this.previousMousePosition = { x: 0, y: 0 };

    // モバイルタッチ追跡
    this.touchMoveVector = { x: 0, y: 0 };
    this.touchLookId = null;
    this.touchLookPrev = { x: 0, y: 0 };

    // 足音タイマー
    this.stepTimer = 0;

    // 観覧車乗車状態
    this.isRidingFerris = false;

    // アバター（TPS表示用）
    this.avatar = null;
    this.initAvatar();

    this.setupEventListeners();
  }

  initAvatar() {
    this.avatar = new THREE.Group();

    // シンプルで愛らしい探検家風アバター
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x15803d });
    const headMat = new THREE.MeshLambertMaterial({ color: 0xfde047 });
    const capMat = new THREE.MeshLambertMaterial({ color: 0xb45309 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.1, 8), bodyMat);
    body.position.y = 0.55;
    body.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), headMat);
    head.position.y = 1.35;
    head.castShadow = true;

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.3, 8), capMat);
    cap.position.y = 1.65;

    this.avatar.add(body, head, cap);
    this.avatar.visible = false; // デフォルトFPSのため非表示
    this.landmarks.scene.add(this.avatar);
  }

  setupEventListeners() {
    // キーボード
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // マウス操作（ドラッグで視点変更）
    this.domElement.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      const sensitivity = 0.003;
      this.yaw -= deltaX * sensitivity;
      this.pitch -= deltaY * sensitivity;
      this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    // モバイルタッチ（画面右半分で視点移動）
    this.domElement.addEventListener('touchstart', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX > window.innerWidth * 0.4 && this.touchLookId === null) {
          this.touchLookId = touch.identifier;
          this.touchLookPrev = { x: touch.clientX, y: touch.clientY };
        }
      }
    }, { passive: true });

    this.domElement.addEventListener('touchmove', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.touchLookId) {
          const deltaX = touch.clientX - this.touchLookPrev.x;
          const deltaY = touch.clientY - this.touchLookPrev.y;

          const sensitivity = 0.004;
          this.yaw -= deltaX * sensitivity;
          this.pitch -= deltaY * sensitivity;
          this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));

          this.touchLookPrev = { x: touch.clientX, y: touch.clientY };
        }
      }
    }, { passive: true });

    const endTouchLook = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this.touchLookId) {
          this.touchLookId = null;
        }
      }
    };
    this.domElement.addEventListener('touchend', endTouchLook);
    this.domElement.addEventListener('touchcancel', endTouchLook);
  }

  onKeyDown(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = true;
        break;
      case 'Space':
        if (this.isGrounded && !this.isRidingFerris) {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
        }
        break;
      case 'KeyV':
        this.toggleViewMode();
        break;
    }
  }

  onKeyUp(e) {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.keys.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.keys.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.keys.right = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.shift = false;
        break;
    }
  }

  toggleViewMode() {
    if (this.isRidingFerris) return;
    this.viewMode = this.viewMode === 'fps' ? 'tps' : 'fps';
    if (this.avatar) {
      this.avatar.visible = (this.viewMode === 'tps');
    }
  }

  // 瞬間移動（ファストトラベル）
  teleportTo(x, y, z) {
    this.exitFerrisWheel();
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    if (this.audio) this.audio.playWarpSound();
  }

  // 観覧車搭乗
  enterFerrisWheel() {
    this.isRidingFerris = true;
    this.viewMode = 'ferris';
    if (this.avatar) this.avatar.visible = false;
    if (this.audio) this.audio.playMusicBoxNote();
  }

  // 観覧車下車
  exitFerrisWheel() {
    if (!this.isRidingFerris) return;
    this.isRidingFerris = false;
    this.viewMode = 'fps';
    this.position.set(80, 2, -55);
    this.velocity.set(0, 0, 0);
    if (this.avatar) this.avatar.visible = false;
  }

  update(delta) {
    // 観覧車乗車時のカメラ位置制御
    if (this.isRidingFerris) {
      const gondolaPos = this.landmarks.getGondolaWorldPosition(0);
      this.camera.position.copy(gondolaPos);
      this.position.copy(gondolaPos);

      // 視線方向
      const lookDir = new THREE.Vector3(
        Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        Math.cos(this.yaw) * Math.cos(this.pitch)
      );
      this.camera.lookAt(this.camera.position.clone().add(lookDir));
      return;
    }

    // 移動方向の計算
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ += 1;
    if (this.keys.backward) moveZ -= 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // モバイルタッチジョイスティック入力の合成
    moveX += this.touchMoveVector.x;
    moveZ += this.touchMoveVector.y;

    const inputLength = Math.hypot(moveX, moveZ);
    const isMoving = inputLength > 0.05;

    if (isMoving) {
      // 正規化
      const normX = moveX / Math.max(1, inputLength);
      const normZ = moveZ / Math.max(1, inputLength);

      const currentSpeed = (this.keys.shift ? this.speed * this.runMultiplier : this.speed);

      // 視線角度に基づく移動
      const sinYaw = Math.sin(this.yaw);
      const cosYaw = Math.cos(this.yaw);

      const forwardX = -sinYaw;
      const forwardZ = -cosYaw;
      const rightX = -forwardZ;
      const rightZ = forwardX;

      this.velocity.x = (forwardX * normZ + rightX * normX) * currentSpeed;
      this.velocity.z = (forwardZ * normZ + rightZ * normX) * currentSpeed;

      // 足音
      if (this.isGrounded && this.audio) {
        this.stepTimer += delta * (this.keys.shift ? 1.8 : 1.2);
        if (this.stepTimer > 0.5) {
          this.audio.playFootstep();
          this.stepTimer = 0;
        }
      }
    } else {
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // 重力
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
    }

    // 位置更新
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
    this.position.z += this.velocity.z * delta;

    // 中央橋（X: -3.8〜3.8, Z: -15〜15）
    let targetGroundY = 1.8; // 地面の通常高さ
    if (Math.abs(this.position.x) < 3.8 && Math.abs(this.position.z) < 15) {
      targetGroundY = 3.6; // 橋の上
    } else if (this.position.x >= -89 && this.position.x <= -71 && Math.abs(this.position.z - (-65)) < 5) {
      targetGroundY = 4.9; // キリンデッキ（高さ3.1m + 目の高さ1.8m）
    } else if (this.position.x > -71 && this.position.x <= -65 && Math.abs(this.position.z - (-65)) < 5) {
      // キリンデッキのスロープ
      const slopeProgress = (-65 - this.position.x) / 6.0;
      targetGroundY = 1.8 + slopeProgress * 3.1;
    }

    if (this.position.y <= targetGroundY) {
      this.position.y = targetGroundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // 園内エリア制限バウンダリ（境界から外に出ない）
    const limit = 160;
    this.position.x = Math.max(-limit, Math.min(limit, this.position.x));
    this.position.z = Math.max(-limit, Math.min(limit, this.position.z));

    // アバター追従
    if (this.avatar) {
      this.avatar.position.set(this.position.x, this.position.y - 1.8, this.position.z);
      this.avatar.rotation.y = this.yaw + Math.PI;
    }

    // カメラ位置・視線設定
    const lookDir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    );

    if (this.viewMode === 'fps') {
      this.camera.position.copy(this.position);
      this.camera.lookAt(this.camera.position.clone().add(lookDir));
    } else if (this.viewMode === 'tps') {
      // プレイヤー背後から追従
      const camOffset = new THREE.Vector3(
        -Math.sin(this.yaw) * 4.5,
        1.8,
        -Math.cos(this.yaw) * 4.5
      );
      this.camera.position.copy(this.position).add(camOffset);
      this.camera.lookAt(this.position.clone().add(new THREE.Vector3(0, 0.5, 0)));
    }
  }
}
