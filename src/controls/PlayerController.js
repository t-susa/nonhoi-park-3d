import * as THREE from 'three';

export class PlayerController {
  constructor(camera, domElement, audioManager, landmarks, mapBuilder) {
    this.camera = camera;
    this.domElement = domElement;
    this.audio = audioManager;
    this.landmarks = landmarks;
    this.mapBuilder = mapBuilder;

    // プレイヤー初期位置：中央門前 [-204.9, 2.0, -45.0]
    this.position = new THREE.Vector3(-204.9, 2.0, -45.0);
    this.velocity = new THREE.Vector3();
    this.speed = 12.0;
    this.runMultiplier = 1.9;
    this.isGrounded = true;
    this.gravity = 24.0;
    this.jumpForce = 9.5;

    // 視線角度
    this.yaw = 0.8; // 中央門から園内を向く
    this.pitch = 0;
    this.minPitch = -Math.PI / 2.5;
    this.maxPitch = Math.PI / 2.5;

    // カメラモード: 'fps' (一人称) / 'tps' (三人称) / 'map' (全景ドローンマップ) / 'ferris' (観覧車) / 'bus' (バス乗車)
    this.viewMode = 'fps';

    // ドローン俯瞰マップ時のカメラパラメータ
    this.mapCenter = new THREE.Vector3(-30, 0, 0);
    this.mapHeight = 220;
    this.mapAngle = 0;

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
    this.isPointerLocked = false;

    // モバイルタッチ追跡
    this.touchMoveVector = { x: 0, y: 0 };
    this.touchLookId = null;
    this.touchLookPrev = { x: 0, y: 0 };

    this.stepTimer = 0;
    this.isRidingFerris = false;
    this.isRidingBus = false;

    // 3Dアバター
    this.avatar = null;
    this.initAvatar();

    this.setupEventListeners();
  }

  initAvatar() {
    this.avatar = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
    const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.1, 8), bodyMat);
    body.position.y = 0.55; body.castShadow = true;

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), headMat);
    head.position.y = 1.35; head.castShadow = true;

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.3, 8), capMat);
    cap.position.y = 1.65;

    this.avatar.add(body, head, cap);
    this.avatar.visible = false;
    this.landmarks.scene.add(this.avatar);
  }

  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // マウス操作
    this.domElement.addEventListener('mousedown', (e) => {
      if (this.viewMode === 'map') {
        // マップモード時：クリックした地面の位置へナビゲート
        this.handleMapClick(e);
        return;
      }
      this.isMouseDown = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      const sensitivity = 0.0032;
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
        if (touch.clientX > window.innerWidth * 0.35 && this.touchLookId === null) {
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

          const sensitivity = 0.0042;
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
        if (this.isGrounded && !this.isRidingFerris && !this.isRidingBus) {
          this.velocity.y = this.jumpForce;
          this.isGrounded = false;
        }
        break;
      case 'KeyV':
        this.cycleViewMode();
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

  // カメラ視点サイクリング: FPS -> TPS -> ドローン俯瞰MAP -> FPS
  cycleViewMode() {
    if (this.isRidingFerris || this.isRidingBus) return;

    if (this.viewMode === 'fps') {
      this.setViewMode('tps');
    } else if (this.viewMode === 'tps') {
      this.setViewMode('map');
    } else {
      this.setViewMode('fps');
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    if (this.avatar) {
      this.avatar.visible = (this.viewMode === 'tps');
    }
  }

  // 瞬間移動（ファストトラベル）
  teleportTo(x, y, z) {
    this.exitFerrisWheel();
    this.exitBus();
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.isGrounded = true;
    if (this.audio) this.audio.playWarpSound();
  }

  // 観覧車搭乗
  enterFerrisWheel() {
    this.exitBus();
    this.isRidingFerris = true;
    this.viewMode = 'ferris';
    if (this.avatar) this.avatar.visible = false;
    if (this.audio) this.audio.playMusicBoxNote();
  }

  exitFerrisWheel() {
    if (!this.isRidingFerris) return;
    this.isRidingFerris = false;
    this.viewMode = 'fps';
    this.position.set(176.5, 2.0, 90.0);
    this.velocity.set(0, 0, 0);
    if (this.avatar) this.avatar.visible = false;
  }

  // 園内バス乗車
  enterBus() {
    this.exitFerrisWheel();
    this.isRidingBus = true;
    this.viewMode = 'bus';
    if (this.avatar) this.avatar.visible = false;
    if (this.audio) this.audio.playWarpSound();
  }

  exitBus() {
    if (!this.isRidingBus) return;
    this.isRidingBus = false;
    this.viewMode = 'fps';
    if (this.avatar) this.avatar.visible = false;
  }

  // ドローンマップ俯瞰モード時のクリック移動
  handleMapClick(e) {
    const rect = this.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();

    if (raycaster.ray.intersectPlane(plane, target)) {
      this.teleportTo(target.x, 2.0, target.z);
      this.setViewMode('fps');
    }
  }

  update(delta) {
    // 1. 観覧車乗車時のカメラ
    if (this.isRidingFerris) {
      const gondolaPos = this.landmarks.getGondolaWorldPosition(0);
      this.camera.position.copy(gondolaPos);
      this.position.copy(gondolaPos);

      const lookDir = new THREE.Vector3(
        Math.sin(this.yaw) * Math.cos(this.pitch),
        Math.sin(this.pitch),
        Math.cos(this.yaw) * Math.cos(this.pitch)
      );
      this.camera.lookAt(this.camera.position.clone().add(lookDir));
      return;
    }

    // 2. 園内バス乗車時のカメラ
    if (this.isRidingBus && this.landmarks.scene) {
      const bus = this.landmarks.scene.getObjectByName('parkBus');
      if (bus) {
        this.position.copy(bus.position).add(new THREE.Vector3(0, 2.4, 0));
        this.camera.position.copy(this.position);
        const lookDir = new THREE.Vector3(
          Math.sin(this.yaw) * Math.cos(this.pitch),
          Math.sin(this.pitch),
          Math.cos(this.yaw) * Math.cos(this.pitch)
        );
        this.camera.lookAt(this.camera.position.clone().add(lookDir));
        return;
      }
    }

    // 3. 全景ドローンマップ俯瞰モード
    if (this.viewMode === 'map') {
      // プレイヤーを中心とした上空からの俯瞰視点
      const camX = this.position.x;
      const camZ = this.position.z + 120;
      this.camera.position.set(camX, this.mapHeight, camZ);
      this.camera.lookAt(this.position.x, 0, this.position.z);
      return;
    }

    // 4. 移動計算（一人称・三人称）
    let moveX = 0;
    let moveZ = 0;

    if (this.keys.forward) moveZ += 1;
    if (this.keys.backward) moveZ -= 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    moveX += this.touchMoveVector.x;
    moveZ += this.touchMoveVector.y;

    const inputLength = Math.hypot(moveX, moveZ);
    const isMoving = inputLength > 0.05;

    if (isMoving) {
      const normX = moveX / Math.max(1, inputLength);
      const normZ = moveZ / Math.max(1, inputLength);
      const currentSpeed = (this.keys.shift ? this.speed * this.runMultiplier : this.speed);

      const sinYaw = Math.sin(this.yaw);
      const cosYaw = Math.cos(this.yaw);

      const forwardX = -sinYaw;
      const forwardZ = -cosYaw;
      const rightX = -forwardZ;
      const rightZ = forwardX;

      const vx = (forwardX * normZ + rightX * normX) * currentSpeed;
      const vz = (forwardZ * normZ + rightZ * normX) * currentSpeed;

      // 障害物との衝突判定とスムーズな壁沿いスライド
      const nextX = this.position.x + vx * delta;
      const nextZ = this.position.z + vz * delta;

      if (!this.mapBuilder.checkCollision(nextX, this.position.z, 0.8)) {
        this.position.x = nextX;
      }
      if (!this.mapBuilder.checkCollision(this.position.x, nextZ, 0.8)) {
        this.position.z = nextZ;
      }

      // 足音
      if (this.isGrounded && this.audio) {
        this.stepTimer += delta * (this.keys.shift ? 1.8 : 1.2);
        if (this.stepTimer > 0.48) {
          this.audio.playFootstep();
          this.stepTimer = 0;
        }
      }
    }

    // 重力
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
    }
    this.position.y += this.velocity.y * delta;

    // キリンデッキ（高さ3.1m + 目の高さ1.8m = 4.9m）の床高さ判定
    let targetGroundY = 1.8;
    // キリンデッキ周辺: [129.2, 44.2]
    if (Math.hypot(this.position.x - 129.2, this.position.z - 44.2) < 9) {
      targetGroundY = 4.9;
    }

    if (this.position.y <= targetGroundY) {
      this.position.y = targetGroundY;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // アバター追従
    if (this.avatar) {
      this.avatar.position.set(this.position.x, this.position.y - 1.8, this.position.z);
      this.avatar.rotation.y = this.yaw + Math.PI;
    }

    // カメラ位置・視線
    const lookDir = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch)
    );

    if (this.viewMode === 'fps') {
      this.camera.position.copy(this.position);
      this.camera.lookAt(this.camera.position.clone().add(lookDir));
    } else if (this.viewMode === 'tps') {
      const camOffset = new THREE.Vector3(
        -Math.sin(this.yaw) * 5.0,
        2.2,
        -Math.cos(this.yaw) * 5.0
      );
      this.camera.position.copy(this.position).add(camOffset);
      this.camera.lookAt(this.position.clone().add(new THREE.Vector3(0, 0.6, 0)));
    }
  }
}
