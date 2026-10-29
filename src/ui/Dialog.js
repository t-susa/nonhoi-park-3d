export class Dialog {
  constructor(audioManager, playerController) {
    this.audio = audioManager;
    this.player = playerController;

    this.backdrop = document.getElementById('spot-modal-backdrop');
    this.titleEl = document.getElementById('modal-spot-title');
    this.catEl = document.getElementById('modal-spot-category');
    this.descEl = document.getElementById('modal-spot-desc');
    this.triviaEl = document.getElementById('modal-spot-trivia');
    this.artEl = document.getElementById('modal-spot-art');
    this.closeBtn = document.getElementById('modal-close-btn');
    this.actionBtn = document.getElementById('modal-action-btn');

    this.currentSpot = null;
    this.isOpen = false;

    this.setupEvents();
  }

  setupEvents() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) this.close();
    });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    if (this.actionBtn) {
      this.actionBtn.addEventListener('click', () => {
        if (!this.currentSpot) return;
        if (this.currentSpot.actionType === 'ferris') {
          this.close();
          this.player.enterFerrisWheel();
          document.getElementById('ferris-ride-badge').style.display = 'flex';
        } else if (this.currentSpot.actionType === 'roar') {
          if (this.audio) this.audio.playDinosaurRoar();
        } else {
          this.close();
        }
      });
    }
  }

  open(spot) {
    this.currentSpot = spot;
    this.isOpen = true;

    this.titleEl.textContent = spot.title;
    this.catEl.textContent = spot.category;
    this.descEl.textContent = spot.desc;
    this.triviaEl.textContent = '💡 ' + spot.trivia;
    this.artEl.textContent = spot.icon || '🌲';

    if (spot.actionType === 'ferris') {
      this.actionBtn.innerHTML = '🎡 観覧車に乗る！';
      this.actionBtn.style.display = 'flex';
    } else if (spot.actionType === 'roar') {
      this.actionBtn.innerHTML = '🦖 恐竜の鳴き声を聞く！';
      this.actionBtn.style.display = 'flex';
    } else {
      this.actionBtn.innerHTML = '閉じて散策を続ける';
      this.actionBtn.style.display = 'flex';
    }

    this.backdrop.classList.add('open');
    if (this.audio) this.audio.playWarpSound();
  }

  close() {
    this.isOpen = false;
    this.backdrop.classList.remove('open');
  }
}
