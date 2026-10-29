// 限定公開のための入園ゲート（パスコード＆トークン照合）
export class GateAuth {
  constructor(onAuthenticated) {
    this.onAuthenticated = onAuthenticated;

    // 正解合言葉のSHA-256ハッシュ
    // "nonhoi" のSHA-256ハッシュ:
    // e07d2f9540b6e927c37617b0d6253c7c25ec5a895bba67a99eaef32f38d3810f
    // または "のんほい"
    this.validHashes = [
      'e07d2f9540b6e927c37617b0d6253c7c25ec5a895bba67a99eaef32f38d3810f', // nonhoi
      '7953ea493a3a41147e85c1aa7b2eb6ca24c3111f13bceeeea05f6b3b5ec1beaa'  // のんほい
    ];

    // トークン（URLフラグメントまたはクエリで直接入園可能にするキー）
    this.secretToken = 'nh-guest-2025';

    this.gateOverlay = document.getElementById('gate-overlay');
    this.passInput = document.getElementById('gate-passcode-input');
    this.enterBtn = document.getElementById('gate-enter-btn');
    this.errorMsg = document.getElementById('gate-error');
    this.shareBtn = document.getElementById('copy-invite-link-btn');

    this.init();
  }

  async sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  init() {
    // 1. URLトークンチェック（#token=nh-guest-2025 または ?key=nh-guest-2025）
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    if (hash.includes(this.secretToken) || searchParams.get('key') === this.secretToken) {
      this.grantAccess();
      return;
    }

    // 2. ローカルストレージチェック
    if (localStorage.getItem('nonhoi_authorized') === 'true') {
      this.grantAccess();
      return;
    }

    // 3. 認証フォームのイベント登録
    this.enterBtn.addEventListener('click', () => this.verify());
    this.passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.verify();
    });

    if (this.shareBtn) {
      this.shareBtn.addEventListener('click', () => this.copyInviteLink());
    }
  }

  async verify() {
    const val = (this.passInput.value || '').trim().toLowerCase();
    if (!val) {
      this.showError('合言葉を入力してください');
      return;
    }

    const hash = await this.sha256(val);
    if (this.validHashes.includes(hash) || val === 'nonhoi' || val === 'のんほい') {
      localStorage.setItem('nonhoi_authorized', 'true');
      this.grantAccess();
    } else {
      this.showError('合言葉が違います（ヒント: nonhoi）');
      this.passInput.value = '';
    }
  }

  grantAccess() {
    if (this.gateOverlay) {
      this.gateOverlay.style.opacity = '0';
      this.gateOverlay.style.transition = 'opacity 0.5s ease-out';
      setTimeout(() => {
        this.gateOverlay.style.display = 'none';
      }, 500);
    }
    if (this.onAuthenticated) {
      this.onAuthenticated();
    }
  }

  showError(msg) {
    if (this.errorMsg) {
      this.errorMsg.textContent = msg;
      this.passInput.classList.add('error');
      setTimeout(() => {
        this.passInput.classList.remove('error');
      }, 1000);
    }
  }

  // 閲覧限定共有リンク（合言葉入力不要のワンクリックURL）
  copyInviteLink() {
    const base = window.location.href.split('#')[0].split('?')[0];
    const inviteUrl = `${base}#token=${this.secretToken}`;

    navigator.clipboard.writeText(inviteUrl).then(() => {
      this.showToast('招待URLをクリップボードにコピーしました！');
    }).catch(() => {
      prompt('以下の招待URLをコピーしてください:', inviteUrl);
    });
  }

  showToast(msg) {
    const toast = document.getElementById('toast-msg');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }
}
