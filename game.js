/**
 * Extreme Bricks - Brick Breaker Game
 * 6x1 Brick Grid, Custom Assets, Persistent High Score, Multi-ball & Lives
 */

// --- Configuration & Constants ---
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 1600;

const COLS = 7;
const ROWS = 5;
const TOTAL_BRICKS = COLS * ROWS; // 35
const BRICK_POINTS = 10;
const WAVE_BONUS_POINTS = 500;
const INITIAL_LIVES = 3;
const MAX_LIVES = 3;
const HEADER_HEIGHT = 250; // Header area for score & highscore; ball cannot pass into it

const BRICK_WIDTH = 90;
const BRICK_HEIGHT = 50;
const BRICK_GAP_X = 8;
const BRICK_GAP_Y = 8;
const GRID_START_Y = HEADER_HEIGHT + BRICK_HEIGHT + BRICK_GAP_Y; // 250 + 50 + 8 = 308px (1 brick tall gap from header line)
const GRID_START_X = Math.round((CANVAS_WIDTH - (COLS * BRICK_WIDTH + (COLS - 1) * BRICK_GAP_X)) / 2);

const BAT_WIDTH = 215;
const BAT_EXTENDED_WIDTH = 284;
const BAT_HALF_WIDTH = 146; // Shortened half-board width (Akuta debuff)
const BAT_EXTENDED_DURATION = 30; // seconds that paddle stays extended after hitting brick_yo
const BAT_SHORTENED_DURATION = 60; // 60 seconds (1 minute) debuff duration from Akuta
const TSUKI_MAGNET_CHARGES = 1; // number of magnetized bricks per tsuki power-up
const SHIELD_Y = 1530; // Y coordinate beneath player paddle for straight neon shield line
const SHIELD_DURATION = 15; // seconds that bottom shield stays active (disappears after 1 hit)
const TURRET_DURATION = 30; // seconds that dual side turrets stay active
const BULLET_SPEED = 20; // velocity of turret bullets
const GRAVITY_FIELD_Y = 1120; // Y coordinate for bottom 30% of field (1120 to 1600, 480px height)
const GRAVITY_FIELD_DURATION = 8; // seconds that gravity field stays active
const GRAVITY_FIELD_SLOW_FACTOR = 0.45; // slow down factor while falling in gravity field
const DEBUFF_ICHINOSE_DURATION = 60; // 60 seconds (1 minute) for Ichinose point debuff
const BOARD_SPEED_BOOST_DURATION = 20; // 20 seconds board speed boost from Mita brick
const BAT_HEIGHT = 34;
const BAT_Y = 1440;
const BALL_RADIUS = 16;
const BASE_BALL_SPEED = 11.5;

// --- Web Audio Synthesizer & Audio Asset Player ---
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.buffers = {};
    this.bgm = null;
    this.bgmVolume = 0.28; // 80% of original 0.35 volume
    this.bgmPlaying = false;
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  }

  initBGM(url = 'audio/System_Reserve.mp3') {
    if (!this.bgm) {
      this.bgm = new Audio(url);
      this.bgm.loop = true;
      this.bgm.preload = 'auto';
      this.bgm.muted = this.isMuted;
      this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
    }
  }

  async loadBGM(url = 'audio/System_Reserve.mp3') {
    this.initBGM(url);
    return new Promise((resolve) => {
      if (this.bgm.readyState >= 2) {
        resolve();
        return;
      }
      const onCanPlay = () => {
        this.bgm.removeEventListener('canplay', onCanPlay);
        this.bgm.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        this.bgm.removeEventListener('canplay', onCanPlay);
        this.bgm.removeEventListener('error', onError);
        console.warn('BGM preload note (will play on demand):', url);
        resolve();
      };
      this.bgm.addEventListener('canplay', onCanPlay);
      this.bgm.addEventListener('error', onError);
      setTimeout(() => {
        this.bgm.removeEventListener('canplay', onCanPlay);
        this.bgm.removeEventListener('error', onError);
        resolve();
      }, 1500);
    });
  }

  playBGM(restart = false) {
    if (!this.bgm) {
      this.initBGM();
    }
    this.bgmPlaying = true;
    this.bgm.muted = this.isMuted;
    this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
    if (restart) {
      this.bgm.currentTime = 0;
    }
    const playPromise = this.bgm.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy: will trigger on user interaction
      });
    }
  }

  pauseBGM() {
    this.bgmPlaying = false;
    if (this.bgm && !this.bgm.paused) {
      this.bgm.pause();
    }
  }

  resumeBGM() {
    if (!this.isMuted && this.bgm) {
      this.bgmPlaying = true;
      this.bgm.muted = false;
      this.bgm.volume = this.bgmVolume;
      this.bgm.play().catch(() => {});
    }
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.bgm) {
      this.bgm.muted = this.isMuted;
      this.bgm.volume = this.isMuted ? 0 : this.bgmVolume;
      if (!this.isMuted && this.bgmPlaying && this.bgm.paused) {
        this.bgm.play().catch(() => {});
      }
    }
  }

  async loadSound(key, url) {
    try {
      const response = await fetch(url);
      if (!response.ok) return;
      const arrayBuffer = await response.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx && AudioCtx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx) {
        this.buffers[key] = await this.ctx.decodeAudioData(arrayBuffer);
      }
    } catch (e) {
      console.warn(`Audio decode skipped for ${key}:`, e);
    }
  }

  playBuffer(key, volume = 0.35) {
    if (this.isMuted || !this.ctx || !this.buffers[key]) return false;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      const source = this.ctx.createBufferSource();
      source.buffer = this.buffers[key];
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.onended = () => {
        try {
          source.disconnect();
          gain.disconnect();
        } catch (e) { }
      };
      source.start(0);
      return true;
    } catch (e) {
      return false;
    }
  }

  playBatBounce() {
    if (this.playBuffer('bounce', 0.45)) return;
    this.synthBatBounce();
  }

  synthBatBounce() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) { }
      };

      osc.start(now);
      osc.stop(now + 0.08);
    } catch (e) { }
  }

  playBrickHit() {
    if (this.playBuffer('hit', 0.45)) return;
    this.synthBrickHit();
  }

  synthBrickHit() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00];
      const freq = notes[Math.floor(Math.random() * notes.length)];

      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.06);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) { }
      };

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) { }
  }

  playWallBounce() {
    if (this.playBuffer('bounce', 0.45)) return;
    this.synthBatBounce();
  }

  playSpecialHit() {
    if (this.playBuffer('special_brick', 0.5)) return;
    this.synthSpecialHit();
  }

  playSpecialBrick() {
    this.playSpecialHit();
  }

  playWindGale() {
    this.playSpecialHit();
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.85);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.8);
      filter.Q.setValueAtTime(2.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.onended = () => {
        try {
          noise.disconnect();
          filter.disconnect();
          gain.disconnect();
        } catch (e) { }
      };

      noise.start(now);
      noise.stop(now + 0.85);
    } catch (e) { }
  }

  synthSpecialHit() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50];

      freqs.forEach((freq, idx) => {
        const startTime = now + idx * 0.04;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.22, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (e) { }
        };

        osc.start(startTime);
        osc.stop(startTime + 0.12);
      });
    } catch (e) { }
  }

  playLifeLost() {
    if (this.playBuffer('special_brick_debuff', 0.45)) return;
    this.synthLifeLost();
  }

  playDebuff() {
    if (this.playBuffer('special_brick_debuff', 0.65)) return;
    this.synthLifeLost();
  }

  synthLifeLost() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) { }
      };

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) { }
  }

  playWaveClear() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880, 1108.73];

      notes.forEach((freq, i) => {
        const startTime = now + i * 0.07;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (e) { }
        };

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      });
    } catch (e) {
      console.warn('Audio playWaveClear error:', e);
    }
  }

  playGameOver() {
    if (this.playBuffer('gameover', 0.5)) return;
    this.synthGameOver();
  }

  synthGameOver() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [392.00, 349.23, 311.13, 261.63];

      notes.forEach((freq, i) => {
        const startTime = now + i * 0.12;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.onended = () => {
          try {
            osc.disconnect();
            gain.disconnect();
          } catch (e) { }
        };

        osc.start(startTime);
        osc.stop(startTime + 0.22);
      });
    } catch (e) { }
  }

  playExplode() {
    if (this.playBuffer('explode', 0.55)) return;
    this.synthExplosion();
  }

  synthExplosion() {
    try {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch (e) { }
      };

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) { }
  }

  playLaser() {
    if (this.playBuffer('laser', 0.35)) return;
    this.synthBatBounce();
  }
}

// --- Particle Engine ---
class Particle {
  constructor(x, y, color, size, vx, vy, life) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.alpha = 1;
  }

  update(dt) {
    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;
    this.vy += 0.15 * dt * 60; // slight gravity
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.3, this.size * this.alpha), 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Floating Text Announcement ---
class FloatingText {
  constructor(x, y, text, color, font = '13px "Press Start 2P"') {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.font = font;
    this.life = 1.0;
    this.maxLife = 1.0;
    this.alpha = 1;
  }

  update(dt) {
    this.y -= 35 * dt;
    this.life -= dt;
    this.alpha = Math.max(0, this.life / this.maxLife);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.font = this.font;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// --- Game Engine Class ---
class BrickBreakerGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container = document.getElementById('game-container');

    // UI elements
    this.scoreValEl = document.getElementById('score-val');
    this.highScoreValEl = document.getElementById('high-score-val');
    this.scorePopupContainer = document.getElementById('score-popup-container');
    this.livesContainerEl = document.getElementById('lives-container');
    this.overlayStart = document.getElementById('overlay-start');
    this.loadingSection = document.getElementById('loading-section');
    this.loadingProgressBar = document.getElementById('loading-progress-bar');
    this.loadingPercent = document.getElementById('loading-percent');
    this.loadingItemName = document.getElementById('loading-item-name');
    this.tapSection = document.getElementById('tap-section');
    this.overlayPause = document.getElementById('overlay-pause');
    this.overlayWave = document.getElementById('overlay-wave');
    this.overlayGameOver = document.getElementById('overlay-gameover');
    this.waveTitleEl = document.getElementById('wave-title');
    this.finalScoreEl = document.getElementById('final-score');
    this.gameOverHighScoreEl = document.getElementById('gameover-high-score');
    this.newHighBadgeEl = document.getElementById('new-high-badge');

    this.btnResume = document.getElementById('btn-resume');
    this.btnRestartPause = document.getElementById('btn-restart-pause');
    this.btnRestart = document.getElementById('btn-restart');
    this.btnSound = document.getElementById('btn-sound');
    this.btnPause = document.getElementById('btn-pause');

    // Audio & Particles
    this.sound = new SoundSystem();
    this.particles = [];
    this.floatingTexts = [];

    // State
    this.state = 'LOADING'; // 'LOADING', 'READY', 'PLAYING', 'PAUSED', 'WAVE_CLEARED', 'GAMEOVER'
    this.score = 0;
    this.displayedScore = 0;
    this.highScore = this.loadHighScore();
    this.displayedHighScore = this.highScore;
    this.scoreIncrementTimer = 0;
    this.level = 1;
    this.lives = INITIAL_LIVES;
    this.speedMultiplier = 1.0;
    this.isClearingLevel = false;
    this.magnetBricksRemaining = 0;
    this.shield = { active: false, timer: 0 };
    this.turrets = { active: false, timer: 0 };
    this.bullets = [];
    this.xBeams = [];
    this.plusBeams = [];
    this.jumpingBricks = [];
    this.gravityField = { active: false, timer: 0 };
    this.pointDebuff = { active: false, timer: 0 };
    this.boardSpeedBoost = { active: false, timer: 0 };
    this.mitaSparks = [];
    this.saoriVolleys = [];
    this.saoriBullets = [];
    this.brokenParticles = [];
    this.sakuraPetals = [];
    this.taigaWind = { active: false, timer: 0, duration: 2.0, particles: [], ribbons: [] };
    this.hearts = [];
    this.containers = [];
    this.suiContainerRain = { active: false, timer: 0, nextDropTimer: 0 };
    this.boardSlowDebuff = { active: false, timer: 0 };
    this.magataDebuff = { active: false, timer: 0 };
    this.magataComments = [];
    this.magataTemplates = [];
    this.ruriiroDebuff = { active: false };
    this.haruSlowMotion = { active: false, timer: 0, duration: 2.0, slowFactor: 0.25 };
    this.skillCutins = [];
    this.skillsConfig = {};

    // Performance Caches (Offscreen Canvases & Gradients)
    this.cachedRedVignette = null;
    this.cachedPinkVignette = null;
    this.cachedGravityGrad = null;
    this.cachedWindGrad = null;

    // Assets
    this.images = {};
    this.assetsLoaded = false;

    // Game objects
    this.bat = {
      x: (CANVAS_WIDTH - BAT_WIDTH) / 2,
      y: BAT_Y,
      width: BAT_WIDTH,
      height: BAT_HEIGHT,
      targetX: (CANVAS_WIDTH - BAT_WIDTH) / 2,
      vx: 0,
      isExtended: false,
      extendedTimer: 0,
      isShortened: false,
      shortenedTimer: 0
    };

    this.balls = [];
    this.bricks = [];

    // Input state
    this.keys = { ArrowLeft: false, ArrowRight: false, KeyA: false, KeyD: false };
    this.pointerX = null;
    this.isPointerDown = false;

    this.lastTime = performance.now();
    this.init();
  }

  // Pre-render debuff vignettes to offscreen canvases to eliminate per-frame gradient allocation
  initVignetteCanvases() {
    this.cachedRedVignette = this.renderOffscreenVignette('#dc0a14');
    this.cachedPinkVignette = this.renderOffscreenVignette('#ff006e');
  }

  renderOffscreenVignette(colorHex) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = CANVAS_WIDTH;
    offCanvas.height = CANVAS_HEIGHT;
    const offCtx = offCanvas.getContext('2d');
    const cornerRadius = 420;
    const isPink = colorHex === '#ff006e';
    const cornerColor = isPink ? 'rgba(255, 0, 110, 0.45)' : 'rgba(220, 10, 20, 0.45)';
    const cornerFade = 'rgba(200, 0, 0, 0)';

    // 4 Corner Gradients
    const corners = [
      [0, 0, 0, 0],
      [CANVAS_WIDTH, 0, CANVAS_WIDTH - cornerRadius, 0],
      [0, CANVAS_HEIGHT, 0, CANVAS_HEIGHT - cornerRadius],
      [CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH - cornerRadius, CANVAS_HEIGHT - cornerRadius]
    ];
    for (const [cx, cy, rx, ry] of corners) {
      const g = offCtx.createRadialGradient(cx, cy, 0, cx, cy, cornerRadius);
      g.addColorStop(0, cornerColor);
      g.addColorStop(1, cornerFade);
      offCtx.fillStyle = g;
      offCtx.fillRect(rx, ry, cornerRadius, cornerRadius);
    }

    // Outer screen perimeter vignette
    const edgeVignette = offCtx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.42,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, Math.hypot(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
    );
    edgeVignette.addColorStop(0, 'rgba(255, 0, 0, 0)');
    edgeVignette.addColorStop(0.75, 'rgba(200, 0, 20, 0.08)');
    edgeVignette.addColorStop(1, isPink ? 'rgba(255, 0, 110, 0.28)' : 'rgba(220, 10, 20, 0.28)');
    offCtx.fillStyle = edgeVignette;
    offCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    return offCanvas;
  }

  // --- High Score Persistence ---
  loadHighScore() {
    try {
      const stored = localStorage.getItem('t9_brickbreaker_highscore');
      return stored ? parseInt(stored, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }

  saveHighScore(score) {
    try {
      localStorage.setItem('t9_brickbreaker_highscore', score.toString());
    } catch {
      // storage unavailable / incognito
    }
  }

  formatScore(val) {
    return val.toString().padStart(5, '0');
  }

  updateHUD() {
    const cur = this.displayedScore !== undefined ? this.displayedScore : this.score;
    this.scoreValEl.textContent = this.formatScore(cur);
    const hi = Math.max(this.highScore, cur);
    this.highScoreValEl.textContent = this.formatScore(hi);

    // Render dynamic life icons using images/ball.png (max 3 life slots)
    this.livesContainerEl.innerHTML = '';
    const totalSlots = MAX_LIVES;
    for (let i = 0; i < totalSlots; i++) {
      const icon = document.createElement('img');
      icon.src = 'images/ball.png';
      icon.className = 'life-icon' + (i >= this.lives ? ' lost' : '');
      icon.alt = 'Life';
      this.livesContainerEl.appendChild(icon);
    }
  }

  addScore(points) {
    const isDebuffed = this.pointDebuff && this.pointDebuff.active;
    const finalPoints = isDebuffed ? 1 : points;
    this.score += finalPoints;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore(this.highScore);
    }
    this.triggerScorePopup(finalPoints);
    return finalPoints;
  }

  triggerScorePopup(points) {
    if (!this.scorePopupContainer) {
      this.scorePopupContainer = document.getElementById('score-popup-container');
    }
    if (!this.scorePopupContainer) return;

    // Prune oldest popup to prevent DOM thrashing during large multi-brick cascades
    while (this.scorePopupContainer.children.length >= 8) {
      this.scorePopupContainer.removeChild(this.scorePopupContainer.firstChild);
    }

    const popup = document.createElement('span');
    popup.className = 'score-popup';
    const isDebuffed = this.pointDebuff && this.pointDebuff.active;
    if (points >= 500) {
      popup.classList.add('bonus-gold');
    } else if (isDebuffed || points === 1) {
      popup.classList.add('debuff');
    }
    popup.textContent = `+${points}`;

    // Random horizontal jitter for layered arcade effect
    const offsetX = Math.round((Math.random() - 0.5) * 14);
    popup.style.left = `${offsetX}px`;

    this.scorePopupContainer.appendChild(popup);

    // Pulse the score display
    if (this.scoreValEl) {
      this.scoreValEl.classList.remove('score-pulse');
      void this.scoreValEl.offsetWidth; // trigger reflow
      this.scoreValEl.classList.add('score-pulse');
    }

    const cleanup = () => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    };
    popup.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 850);
  }

  updateScoreIncrement(dt) {
    if (this.displayedScore < this.score) {
      const diff = this.score - this.displayedScore;
      this.scoreIncrementTimer = (this.scoreIncrementTimer || 0) + dt;

      // Pacing interval:
      // For small brick hits (diff <= 10): ~25ms per tick (rapid, visible digit counting)
      // For larger bonuses (> 10): 16ms per tick with proportional steps
      const interval = diff <= 10 ? 0.025 : 0.016;

      if (this.scoreIncrementTimer >= interval) {
        let step;
        if (diff <= 10) {
          step = 1;
        } else {
          step = Math.max(1, Math.ceil(diff / 15));
        }

        this.displayedScore = Math.min(this.score, this.displayedScore + step);
        this.scoreValEl.textContent = this.formatScore(this.displayedScore);

        if (this.displayedScore > this.displayedHighScore) {
          this.displayedHighScore = this.displayedScore;
          this.highScoreValEl.textContent = this.formatScore(this.displayedHighScore);
        }

        this.scoreIncrementTimer = 0;
      }
    } else {
      this.displayedScore = this.score;
      this.scoreIncrementTimer = 0;
    }
  }

  // --- Asset Preloading with Loading Bar ---
  async loadAllAssetsWithProgress() {
    const assets = [
      { type: 'image', key: 'bg', src: 'images/background.jpg', label: 'Background Texture' },
      { type: 'image', key: 'bat', src: 'images/bat.png', label: 'Paddle Sprite' },
      { type: 'image', key: 'bat_extended', src: 'images/bat_extended.png', label: 'Extended Paddle' },
      { type: 'image', key: 'ball', src: 'images/ball.png', label: 'Ball Sprite' },
      { type: 'image', key: 'brick_normal', src: 'images/brick_normal.png', label: 'Normal Bricks' },
      { type: 'image', key: 'brick_zero', src: 'images/brick_zero.png', label: 'Special Bricks (Zero)' },
      { type: 'image', key: 'brick_yo', src: 'images/brick_yo.png', label: 'Special Bricks (Yo)' },
      { type: 'image', key: 'brick_tsuki', src: 'images/brick_tsuki.png', label: 'Special Bricks (Tsuki)' },
      { type: 'image', key: 'brick_q', src: 'images/brick_q.png', label: 'Special Bricks (Q)' },
      { type: 'image', key: 'brick_kazuki', src: 'images/brick_kazuki.png', label: 'Special Bricks (Kazuki)' },
      { type: 'image', key: 'brick_miu', src: 'images/brick_miu.png', label: 'Special Bricks (Miu)' },
      { type: 'image', key: 'brick_jio', src: 'images/brick_jio.png', label: 'Special Bricks (Jio)' },
      { type: 'image', key: 'brick_enoki', src: 'images/brick_enoki.png', label: 'Special Bricks (Enoki)' },
      { type: 'image', key: 'brick_koishi', src: 'images/brick_koishi.png', label: 'Special Bricks (Koishi)' },
      { type: 'image', key: 'brick_shun', src: 'images/brick_shun.png', label: 'Special Bricks (Shun)' },
      { type: 'image', key: 'brick_eiji', src: 'images/brick_eiji.png', label: 'Special Bricks (Eiji)' },
      { type: 'image', key: 'brick_saigo', src: 'images/brick_saigo.png', label: 'Special Bricks (Saigo)' },
      { type: 'image', key: 'brick_hyakuichitaro', src: 'images/brick_hyakuichitaro.png', label: 'Special Bricks (Hyakuichitaro)' },
      { type: 'image', key: 'brick_tsuruko', src: 'images/brick_tsuruko.png', label: 'Special Bricks (Tsuruko)' },
      { type: 'image', key: 'brick_ichinose', src: 'images/brick_ichinose.png', label: 'Debuff Bricks (Ichinose)' },
      { type: 'image', key: 'brick_mita', src: 'images/brick_mita.png', label: 'Special Bricks (Mita)' },
      { type: 'image', key: 'brick_manami', src: 'images/brick_manami.png', label: 'Special Bricks (Manami)' },
      { type: 'image', key: 'brick_saori', src: 'images/brick_saori.png', label: 'Special Bricks (Saori)' },
      { type: 'image', key: 'brick_akuta', src: 'images/brick_akuta.png', label: 'Debuff Bricks (Akuta)' },
      { type: 'image', key: 'brick_taiga', src: 'images/brick_taiga.png', label: 'Special Bricks (Taiga)' },
      { type: 'image', key: 'brick_sui', src: 'images/brick_sui.png', label: 'Debuff Bricks (Sui)' },
      { type: 'image', key: 'brick_magata', src: 'images/brick_magata.png', label: 'Debuff Bricks (Magata)' },
      { type: 'image', key: 'brick_ruriiro', src: 'images/brick_ruriiro.png', label: 'Debuff Bricks (Ruriiro)' },
      { type: 'image', key: 'brick_haru', src: 'images/brick_haru.png', label: 'Special Bricks (Haru)' },
      { type: 'image', key: 'container', src: 'images/container.png', label: 'Falling Container' },
      { type: 'image', key: 'bat_half', src: 'images/bat_half.png', label: 'Shortened Board' },
      { type: 'image', key: 'turret', src: 'images/turret.png', label: 'Turret Sprite' },
      { type: 'image', key: 'zero_heart', src: 'images/zero_heart.webp', label: 'Zero Heart' },
      { type: 'image', key: 'buff_skill_cutin', src: 'images/buff_skill_cutin.png', label: 'Buff Skill Cutin' },
      { type: 'image', key: 'debuff_skill_cutin', src: 'images/debuff_skill_cutin.png', label: 'Debuff Skill Cutin' },
      { type: 'image', key: 'brick_hard', src: 'images/brick_hard.png', label: 'Hard Bricks' },
      { type: 'image', key: 'brick_cracked', src: 'images/brick_cracked.png', label: 'Cracked Bricks' },
      { type: 'audio', key: 'bounce', src: 'audio/bounce.mp3', label: 'Bounce SFX' },
      { type: 'audio', key: 'hit', src: 'audio/hit.mp3', label: 'Hit SFX' },
      { type: 'audio', key: 'special_brick', src: 'audio/special_brick.mp3', label: 'Special Brick SFX' },
      { type: 'audio', key: 'laser', src: 'audio/laser.mp3', label: 'Laser SFX' },
      { type: 'audio', key: 'explode', src: 'audio/explode.mp3', label: 'Explosion SFX' },
      { type: 'audio', key: 'special_brick_debuff', src: 'audio/special_brick_debuff.mp3', label: 'Debuff SFX' },
      { type: 'audio', key: 'gameover', src: 'audio/gameover.mp3', label: 'Game Over SFX' },
      { type: 'bgm', key: 'bgm', src: 'audio/System_Reserve.mp3', label: 'BGM (System Reserve)' }
    ];

    const total = assets.length;
    let completed = 0;

    const updateLoadingUI = (percent, label) => {
      if (this.loadingProgressBar && this.loadingProgressBar.style) {
        this.loadingProgressBar.style.width = `${percent}%`;
      }
      if (this.loadingPercent) {
        this.loadingPercent.textContent = `${percent}%`;
      }
      if (this.loadingItemName && label) {
        this.loadingItemName.textContent = label;
      }
    };

    updateLoadingUI(0, 'PREPARING ASSETS...');

    for (const item of assets) {
      try {
        if (item.type === 'image') {
          await new Promise((resolve) => {
            const img = new Image();
            img.src = item.src;
            img.onload = () => {
              this.images[item.key] = img;
              resolve();
            };
            img.onerror = () => {
              console.warn('Image failed to load:', item.src);
              resolve();
            };
          });
        } else if (item.type === 'bgm') {
          await this.sound.loadBGM(item.src);
        } else if (item.type === 'audio') {
          await this.sound.loadSound(item.key, item.src);
        }
      } catch (e) {
        console.warn('Asset load error:', item.src, e);
      } finally {
        completed++;
        const targetPercent = Math.min(100, Math.round((completed / total) * 100));
        updateLoadingUI(targetPercent, `LOADED: ${item.label}`);
        // Gentle pacing to make loading visible and smooth
        await new Promise((r) => setTimeout(r, 45));
      }
    }

    this.assetsLoaded = true;

    // Load customizable Nico Nico Douga comment templates from magata_comments.json
    try {
      const res = await fetch('magata_comments.json?v=' + Date.now());
      if (res.ok) {
        this.magataTemplates = await res.json();
      }
    } catch (e) {
      console.warn('Failed to load magata_comments.json, using fallback templates', e);
    }
    if (!this.magataTemplates || !Array.isArray(this.magataTemplates) || this.magataTemplates.length === 0) {
      this.magataTemplates = this.getDefaultMagataComments();
    }

    // Load customizable skill cutin configurations from skills_config.json
    try {
      const sRes = await fetch('skills_config.json?v=' + Date.now());
      if (sRes.ok) {
        this.skillsConfig = await sRes.json();
      }
    } catch (e) {
      console.warn('Failed to load skills_config.json, using fallback config', e);
    }
    if (!this.skillsConfig || typeof this.skillsConfig !== 'object' || Object.keys(this.skillsConfig).length === 0) {
      this.skillsConfig = this.getDefaultSkillsConfig();
    }

    updateLoadingUI(100, 'ALL ASSETS READY!');

    // Transition to "Tap to start" section
    await new Promise((r) => setTimeout(r, 300));
    if (this.loadingSection) {
      this.loadingSection.classList.add('hidden');
    }
    if (this.tapSection) {
      this.tapSection.classList.remove('hidden');
    }
    this.state = 'READY';
  }

  // --- Brick Grid Generator ---
  generateBricks(slideDown = false) {
    this.bricks = [];
    this.ruriiroDebuff = { active: false };
    const total = ROWS * COLS; // 35 bricks

    // At the minimum half of the bricks are special bricks (>= 18 out of 35, up to 22)
    const minSpecial = Math.ceil(total / 2); // 18
    const maxSpecial = Math.min(total - 4, Math.floor(total * 0.65)); // 22
    const specialCount = Math.floor(Math.random() * (maxSpecial - minSpecial + 1)) + minSpecial;

    // Pick unique indices for special bricks
    const indices = Array.from({ length: total }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const specialIndices = new Set(indices.slice(0, specialCount));
    const normalIndices = indices.slice(specialCount);
    // Random count of hard bricks from remaining normal brick pool (between 3 and 6)
    const hardBrickCount = Math.min(normalIndices.length, Math.floor(Math.random() * 4) + 3);
    const hardIndices = new Set(normalIndices.slice(0, hardBrickCount));

    // Weighted selection for special bricks (Zero has a distinctly lower spawn rate than others)
    const getSpecialBrickType = () => {
      const isExtended = this.bat && this.bat.isExtended;
      const weights = {
        yo: isExtended ? 0.3 : 1.0,
        tsuki: 1.0,
        q: 1.0,
        kazuki: 1.0,
        miu: 1.0,
        jio: 1.0,
        enoki: 1.0,
        koishi: 1.0,
        shun: 1.0,
        eiji: 1.0,
        saigo: 1.0,
        hyakuichitaro: 1.0,
        tsuruko: 1.0,
        ichinose: 1.0,
        mita: (this.boardSpeedBoost && this.boardSpeedBoost.active) ? 0.3 : 1.0,
        manami: 1.0,
        saori: 1.0,
        akuta: (this.bat && this.bat.isShortened) ? 0.3 : 1.0,
        taiga: 1.0,
        sui: 1.0,
        magata: 1.0,
        ruriiro: (this.ruriiroDebuff && this.ruriiroDebuff.active) ? 0.1 : 1.0,
        haru: 1.0,
        zero: 0.45 // Lower percentage than others (~7% vs ~15-16% for others)
      };

      const entries = Object.entries(weights);
      const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
      let rand = Math.random() * totalWeight;

      for (const [type, weight] of entries) {
        if (rand < weight) {
          return type;
        }
        rand -= weight;
      }
      return 'q';
    };

    // Pre-roll special brick types and guarantee at least one debuff brick per round
    const debuffTypes = ['ichinose', 'akuta', 'sui', 'magata', 'ruriiro'];
    const specialTypeMap = new Map();
    for (const idx of specialIndices) {
      specialTypeMap.set(idx, getSpecialBrickType());
    }
    const hasDebuff = Array.from(specialTypeMap.values()).some(t => debuffTypes.includes(t));
    if (!hasDebuff) {
      const specialArr = Array.from(specialIndices);
      const chosenIdx = specialArr[Math.floor(Math.random() * specialArr.length)];
      const randomDebuff = debuffTypes[Math.floor(Math.random() * debuffTypes.length)];
      specialTypeMap.set(chosenIdx, randomDebuff);
    }

    const slideOffset = (GRID_START_Y + ROWS * (BRICK_HEIGHT + BRICK_GAP_Y)) - HEADER_HEIGHT;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const index = r * COLS + c;
        const isSpecial = specialIndices.has(index);
        // Each special brick has its individually randomized type, with >= 1 debuff brick guaranteed
        const type = isSpecial ? specialTypeMap.get(index) : 'normal';
        const isHard = !isSpecial && hardIndices.has(index);
        const points = isHard ? 30 : (isSpecial ? 100 : BRICK_POINTS);
        const hitsRequired = (type === 'enoki' || type === 'saigo') ? 3 : (isHard ? 2 : 1);
        const x = GRID_START_X + c * (BRICK_WIDTH + BRICK_GAP_X);
        const targetY = GRID_START_Y + r * (BRICK_HEIGHT + BRICK_GAP_Y);
        // Start so all rows are tucked completely behind the 250px header line
        const startY = slideDown ? (targetY - slideOffset) : targetY;

        let brickImg = isHard ? this.images.brick_hard : this.images.brick_normal;
        if (isSpecial) {
          if (type === 'yo') brickImg = this.images.brick_yo;
          else if (type === 'tsuki') brickImg = this.images.brick_tsuki;
          else if (type === 'q') brickImg = this.images.brick_q;
          else if (type === 'kazuki') brickImg = this.images.brick_kazuki;
          else if (type === 'miu') brickImg = this.images.brick_miu;
          else if (type === 'jio') brickImg = this.images.brick_jio;
          else if (type === 'enoki') brickImg = this.images.brick_enoki;
          else if (type === 'koishi') brickImg = this.images.brick_koishi;
          else if (type === 'shun') brickImg = this.images.brick_shun;
          else if (type === 'eiji') brickImg = this.images.brick_eiji;
          else if (type === 'saigo') brickImg = this.images.brick_saigo;
          else if (type === 'hyakuichitaro') brickImg = this.images.brick_hyakuichitaro;
          else if (type === 'tsuruko') brickImg = this.images.brick_tsuruko;
          else if (type === 'ichinose') brickImg = this.images.brick_ichinose;
          else if (type === 'mita') brickImg = this.images.brick_mita;
          else if (type === 'manami') brickImg = this.images.brick_manami;
          else if (type === 'saori') brickImg = this.images.brick_saori;
          else if (type === 'akuta') brickImg = this.images.brick_akuta;
          else if (type === 'taiga') brickImg = this.images.brick_taiga;
          else if (type === 'sui') brickImg = this.images.brick_sui;
          else if (type === 'magata') brickImg = this.images.brick_magata;
          else if (type === 'ruriiro') brickImg = this.images.brick_ruriiro;
          else if (type === 'haru') brickImg = this.images.brick_haru;
          else brickImg = this.images.brick_zero;
        }

        this.bricks.push({
          x,
          y: startY,
          startY,
          targetY,
          row: r,
          col: c,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          isSpecial,
          isHard,
          points,
          isDebuff: (type === 'ichinose' || type === 'akuta' || type === 'sui' || type === 'magata' || type === 'ruriiro'),
          specialType: type,
          image: brickImg,
          alive: true,
          hitsRequired,
          hitsRemaining: hitsRequired,
          hitFlashTimer: 0,
          hasMagnet: false,
          isPoisoned: false,
          poisonTimer: 0,
          poisonDuration: 5.0,
          isSliding: slideDown,
          slideTimer: 0,
          slideDuration: 0.6
        });
      }
    }
    this.updateMagnetBrick();
  }

  // --- Ball Initialization ---
  spawnBall(attached = true, x = null, y = null, vx = null, vy = null) {
    const speed = BASE_BALL_SPEED * this.speedMultiplier;
    const initialVx = (Math.random() > 0.5 ? 1 : -1) * (speed * 0.5 + Math.random() * 2);
    const initialVy = -Math.sqrt(Math.max(10, speed * speed - initialVx * initialVx));

    return {
      x: x !== null ? x : this.bat.x + this.bat.width / 2,
      y: y !== null ? y : this.bat.y - BALL_RADIUS - 1,
      radius: BALL_RADIUS,
      vx: vx !== null ? vx : initialVx,
      vy: vy !== null ? vy : initialVy,
      isAttached: attached,
      hasMagnetEffect: false,
      isFireBall: false,
      fireHitsRemaining: 0,
      trail: []
    };
  }

  launchAttachedBalls() {
    let launchedAny = false;
    for (const ball of this.balls) {
      if (ball.isAttached) {
        ball.isAttached = false;
        const speed = BASE_BALL_SPEED * this.speedMultiplier;
        const angle = (Math.random() * 0.4 - 0.2) * Math.PI; // slight random vertical angle
        ball.vx = speed * Math.sin(angle);
        ball.vy = -Math.abs(speed * Math.cos(angle));
        launchedAny = true;
      }
    }
    if (launchedAny) {
      this.sound.playBatBounce();
    }
  }

  // --- Input Handlers ---
  setupInputs() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (e.code in this.keys) {
        this.keys[e.code] = true;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (this.state === 'READY') {
          this.handleTapToStart();
        } else if (this.state === 'PLAYING') {
          this.launchAttachedBalls();
        }
      }
      if (e.code === 'KeyP') {
        this.togglePause();
      }
      if (e.code === 'KeyM') {
        toggleSoundMute();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code in this.keys) {
        this.keys[e.code] = false;
      }
    });

    // Pointer / Touch Swiping - Cache bounding rect to avoid layout recalculation on high-frequency moves
    let cachedRect = this.canvas.getBoundingClientRect();
    const updateRect = () => {
      cachedRect = this.canvas.getBoundingClientRect();
    };
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });

    const getCanvasX = (clientX) => {
      const scaleX = CANVAS_WIDTH / (cachedRect.width || 1);
      return (clientX - cachedRect.left) * scaleX;
    };

    const handlePointerMove = (clientX) => {
      const targetCanvasX = getCanvasX(clientX);
      this.bat.targetX = Math.max(0, Math.min(CANVAS_WIDTH - this.bat.width, targetCanvasX - this.bat.width / 2));
    };

    this.container.addEventListener('pointerdown', (e) => {
      updateRect();
      this.sound.init();
      this.isPointerDown = true;
      handlePointerMove(e.clientX);
      if (this.state === 'READY') {
        this.handleTapToStart();
      } else if (this.state === 'PLAYING') {
        this.launchAttachedBalls();
      }
    });

    if (this.overlayStart) {
      this.overlayStart.addEventListener('pointerdown', (e) => {
        if (this.state === 'READY') {
          e.stopPropagation();
          this.handleTapToStart();
        }
      });
    }

    window.addEventListener('pointermove', (e) => {
      if (this.isPointerDown || e.pointerType === 'mouse') {
        handlePointerMove(e.clientX);
      }
    });

    window.addEventListener('pointerup', () => {
      this.isPointerDown = false;
    });

    window.addEventListener('pointercancel', () => {
      this.isPointerDown = false;
    });

    // Touch events fallback to ensure silky smooth swipe on mobile
    this.container.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX);
      }
    }, { passive: false });

    // Buttons
    this.btnResume.addEventListener('click', () => this.togglePause());
    this.btnRestartPause.addEventListener('click', () => this.restartGame());
    this.btnRestart.addEventListener('click', () => this.restartGame());

    const toggleSoundMute = () => {
      this.sound.init();
      const newMuted = !this.sound.isMuted;
      this.sound.setMuted(newMuted);
      this.btnSound.textContent = this.sound.isMuted ? '🔇' : '🔊';
      this.btnSound.classList.toggle('muted', this.sound.isMuted);
    };

    this.btnSound.addEventListener('click', toggleSoundMute);

    this.btnPause.addEventListener('click', () => this.togglePause());
  }

  handleTapToStart() {
    if (this.state !== 'READY') return;
    this.state = 'STARTING';
    this.sound.init();
    this.sound.playLaser();
    this.sound.playBGM();
    if (this.overlayStart) {
      this.overlayStart.style.opacity = '0';
      setTimeout(() => {
        this.overlayStart.classList.add('hidden');
        this.overlayStart.style.opacity = '';
      }, 350);
    }
    this.startGame();
  }

  // --- Game Flow Methods ---
  async init() {
    this.initVignetteCanvases();
    this.setupInputs();
    this.updateHUD();
    // Position paddle and resting preview ball on canvas behind overlay
    this.bat.x = (CANVAS_WIDTH - BAT_WIDTH) / 2;
    this.bat.targetX = this.bat.x;
    this.balls = [this.spawnBall(true)];
    this.requestFrame();
    await this.loadAllAssetsWithProgress();
  }

  startGame() {
    this.sound.init();
    this.sound.playBGM();
    this.score = 0;
    this.displayedScore = 0;
    this.displayedHighScore = this.highScore;
    this.scoreIncrementTimer = 0;
    if (this.scorePopupContainer) {
      this.scorePopupContainer.innerHTML = '';
    }
    this.level = 1;
    this.lives = INITIAL_LIVES;
    this.speedMultiplier = 1.0;
    this.particles = [];
    this.floatingTexts = [];
    this.magnetBricksRemaining = 0;
    this.shield = { active: false, timer: 0 };
    this.turrets = { active: false, timer: 0 };
    this.bullets = [];
    this.xBeams = [];
    this.plusBeams = [];
    this.jumpingBricks = [];
    this.gravityField = { active: false, timer: 0 };
    this.pointDebuff = { active: false, timer: 0 };
    this.boardSpeedBoost = { active: false, timer: 0 };
    this.mitaSparks = [];
    this.saoriVolleys = [];
    this.saoriBullets = [];
    this.brokenParticles = [];
    this.sakuraPetals = [];
    this.taigaWind = { active: false, timer: 0, duration: 2.0, particles: [], ribbons: [] };
    this.hearts = [];
    this.containers = [];
    this.suiContainerRain = { active: false, timer: 0, nextDropTimer: 0 };
    this.boardSlowDebuff = { active: false, timer: 0 };
    this.magataDebuff = { active: false, timer: 0 };
    this.magataComments = [];
    this.ruriiroDebuff = { active: false };
    this.setSlowMotion(false);
    this.skillCutins = [];
    this.resetBatSize();
    this.generateBricks(true); // Bricks push in from top on start
    this.bat.x = (CANVAS_WIDTH - this.bat.width) / 2;
    this.bat.targetX = this.bat.x;
    this.balls = [this.spawnBall(false)]; // Ball launches immediately

    this.state = 'PLAYING';
    if (this.overlayStart) {
      this.overlayStart.classList.add('hidden');
    }
    this.overlayPause.classList.add('hidden');
    this.overlayGameOver.classList.add('hidden');
    this.overlayWave.classList.add('hidden');
    this.updateHUD();
    this.lastTime = performance.now();
  }

  restartGame() {
    this.sound.playBGM(true);
    this.startGame();
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.overlayPause.classList.remove('hidden');
      this.sound.pauseBGM();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.overlayPause.classList.add('hidden');
      this.lastTime = performance.now();
      this.sound.resumeBGM();
    }
  }

  triggerLevelClear() {
    try {
      this.level++;
      this.speedMultiplier = Math.min(1.4, 1.0 + (this.level - 1) * 0.05);
      const bonus = typeof WAVE_BONUS_POINTS !== 'undefined' ? WAVE_BONUS_POINTS : 500;
      const ptsGained = this.addScore(bonus);

      // 1. Immediately generate the next set of bricks sliding down from above!
      this.generateBricks(true);

      // 2. Safely play clear sound
      try {
        this.sound.playWaveClear();
      } catch (e) { }

      // 3. Safely display floating bonus text
      try {
        const bonusColor = ptsGained === 1 && bonus > 1 ? '#ff3344' : '#ffe600';
        this.floatingTexts.push(
          new FloatingText(CANVAS_WIDTH / 2, HEADER_HEIGHT + 140, `+${ptsGained} BONUS!`, bonusColor, '16px "Press Start 2P"')
        );
      } catch (e) { }
    } catch (err) {
      console.error('Level clear error:', err);
      // Guarantee bricks are spawned even on error
      if (!this.bricks || this.bricks.length === 0 || !this.bricks.some(b => b.alive)) {
        this.generateBricks(true);
      }
    } finally {
      this.isClearingLevel = false;
    }
  }

  triggerGameOver() {
    this.displayedScore = this.score;
    this.displayedHighScore = this.highScore;
    this.updateHUD();
    this.state = 'GAMEOVER';
    this.sound.pauseBGM();
    this.sound.playGameOver();

    this.finalScoreEl.textContent = this.formatScore(this.score);
    this.gameOverHighScoreEl.textContent = this.formatScore(this.highScore);

    const isNewRecord = this.score > 0 && this.score >= this.highScore;
    this.newHighBadgeEl.classList.toggle('hidden', !isNewRecord);

    this.overlayGameOver.classList.remove('hidden');
    this.setSlowMotion(false);
  }

  setSlowMotion(active) {
    if (active) {
      this.haruSlowMotion = {
        active: true,
        timer: 2.0,
        duration: 2.0,
        slowFactor: 0.25
      };
      if (this.container) {
        this.container.classList.add('slowmo-grayscale');
      }
    } else {
      if (this.haruSlowMotion) {
        this.haruSlowMotion.active = false;
        this.haruSlowMotion.timer = 0;
      }
      if (this.container) {
        this.container.classList.remove('slowmo-grayscale');
      }
    }
  }

  extendBat() {
    this.bat.isExtended = true;
    this.bat.extendedTimer = BAT_EXTENDED_DURATION;
    this.bat.isShortened = false;
    this.bat.shortenedTimer = 0;
    const oldWidth = this.bat.width;
    this.bat.width = BAT_EXTENDED_WIDTH;
    const diff = (BAT_EXTENDED_WIDTH - oldWidth) / 2;
    this.bat.x = Math.max(0, Math.min(CANVAS_WIDTH - this.bat.width, this.bat.x - diff));
    this.bat.targetX = Math.max(0, Math.min(CANVAS_WIDTH - this.bat.width, this.bat.targetX - diff));

    // Subtle burst of glowing sakura petals upon board extension
    this.spawnSakuraPetals(3);
  }

  spawnSakuraPetals(count = 1) {
    if (!this.bat) return;
    if (this.sakuraPetals.length >= 15) return;
    for (let i = 0; i < count; i++) {
      const colorRoll = Math.random();
      let colorMode;
      let primaryColor;
      let secondaryColor;
      let glowColor;

      if (colorRoll < 0.48) {
        // Neon Pink Petal
        colorMode = 'pink';
        primaryColor = '#ff2a8d';
        secondaryColor = '#ff77bb';
        glowColor = '#ff1493';
      } else if (colorRoll < 0.96) {
        // Neon Blue Petal
        colorMode = 'blue';
        primaryColor = '#00f0ff';
        secondaryColor = '#70e5ff';
        glowColor = '#00bfff';
      } else {
        // Duo Neon Gradient Petal
        colorMode = 'duo';
        primaryColor = '#ff2a8d';
        secondaryColor = '#00f0ff';
        glowColor = '#ff007f';
      }

      // Spawn across the extended board surface and edges
      const px = this.bat.x + 6 + Math.random() * (this.bat.width - 12);
      const py = this.bat.y + this.bat.height * 0.25 + Math.random() * (this.bat.height * 0.75);

      this.sakuraPetals.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 1.5 + (this.bat.vx ? this.bat.vx * 0.2 : 0),
        vy: 1.2 + Math.random() * 1.8,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 2.2 + Math.random() * 2.8,
        swayAmp: 1.2 + Math.random() * 1.8,
        flipAngle: Math.random() * Math.PI * 2,
        flipSpeed: 1.8 + Math.random() * 3.0,
        angle: (Math.random() - 0.5) * 1.6,
        angularVelocity: (Math.random() - 0.5) * 1.8,
        length: 13 + Math.random() * 8,
        width: 8 + Math.random() * 6,
        colorMode,
        primaryColor,
        secondaryColor,
        glowColor,
        life: 1.8 + Math.random() * 1.2,
        maxLife: 3.0,
        hasSparkle: Math.random() < 0.4
      });
    }
  }

  triggerTaigaWind(brick) {
    this.sound.playWindGale();

    const bx = brick ? (brick.x + brick.width / 2) : (CANVAS_WIDTH / 2);
    const by = brick ? (brick.y + brick.height / 2) : (HEADER_HEIGHT + 200);

    // Floating text
    this.floatingTexts.push(
      new FloatingText(bx, by, 'GREEN GALE!', '#00ff88', '13px "Press Start 2P"')
    );

    // Burst of emerald green and mint sparks at brick
    this.spawnExplosion(bx, by, '#00ff88', 35);
    this.spawnExplosion(bx, by, '#39ff14', 24);
    this.spawnExplosion(bx, by, '#ffffff', 14);

    // Activate the wind surge from the bottom: blows strictly for 1 second
    this.taigaWind.active = true;
    this.taigaWind.timer = 1.0;
    this.taigaWind.duration = 1.0;
    this.taigaWind.hasBlown = true;

    // Create dynamic vertical wind streamer ribbons rushing upward from bottom
    this.taigaWind.ribbons = [];
    const numRibbons = 14;
    for (let r = 0; r < numRibbons; r++) {
      this.taigaWind.ribbons.push({
        baseX: (CANVAS_WIDTH / (numRibbons + 1)) * (r + 1) + (Math.random() - 0.5) * 35,
        y: CANVAS_HEIGHT + Math.random() * 80,
        speed: 1100 + Math.random() * 600, // fast upward rush
        length: 240 + Math.random() * 180,
        thickness: 3 + Math.random() * 4,
        frequency: 0.015 + Math.random() * 0.015,
        amplitude: 18 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        color: Math.random() < 0.6 ? '#00ff88' : (Math.random() < 0.5 ? '#39ff14' : '#70ffcc'),
        alpha: 0.65 + Math.random() * 0.35
      });
    }

    // Create flurry of green wind swirl particles from bottom
    this.taigaWind.particles = [];
    for (let p = 0; p < 45; p++) {
      this.spawnTaigaWindParticle(true);
    }

    // Bounce EVERY active ball upwards once!
    for (const ball of this.balls) {
      ball.bouncedByWind = false;
      this.bounceBallUpwardsWithWind(ball);
    }
  }

  bounceBallUpwardsWithWind(ball) {
    if (!ball || ball.isAttached || ball.bouncedByWind) return;
    ball.bouncedByWind = true;

    const currentSpeed = Math.hypot(ball.vx, ball.vy) || (BASE_BALL_SPEED * this.speedMultiplier);

    // Fan upward toward the brick field maintaining exact current speed (no speed increase)
    const upwardAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.65;
    ball.vx = currentSpeed * Math.cos(upwardAngle);
    ball.vy = -Math.abs(currentSpeed * Math.sin(upwardAngle)); // strictly upward!

    if (ball.y >= BAT_Y) {
      ball.y = BAT_Y - 25;
    }

    ball.hasWindTrail = true;
    ball.windTrailTimer = 1.0;

    // Emerald splash at ball position
    this.spawnExplosion(ball.x, ball.y, '#00ff88', 18);
    this.spawnExplosion(ball.x, ball.y, '#ffffff', 8);
  }

  spawnTaigaWindParticle(randomY = false) {
    const py = randomY ? (CANVAS_HEIGHT - Math.random() * 800) : (CANVAS_HEIGHT + Math.random() * 40);
    this.taigaWind.particles.push({
      x: 20 + Math.random() * (CANVAS_WIDTH - 40),
      y: py,
      vy: -650 - Math.random() * 650, // rushing upward
      vx: (Math.random() - 0.5) * 80,
      size: 4 + Math.random() * 6,
      swirlPhase: Math.random() * Math.PI * 2,
      swirlSpeed: 3 + Math.random() * 4,
      swirlAmp: 12 + Math.random() * 18,
      life: 1.2 + Math.random() * 0.6,
      maxLife: 1.8,
      color: Math.random() < 0.5 ? '#00ff88' : (Math.random() < 0.5 ? '#39ff14' : '#7affc8')
    });
  }

  triggerSuiDebuff(brick) {
    this.sound.playDebuff();

    const bx = brick ? (brick.x + brick.width / 2) : (CANVAS_WIDTH / 2);
    const by = brick ? (brick.y + brick.height / 2) : (HEADER_HEIGHT + 200);

    // One container falls every few seconds for about 30 seconds
    this.suiContainerRain.active = true;
    this.suiContainerRain.timer = 30.0;
    this.suiContainerRain.nextDropTimer = 0.5; // first container drops 0.5s after break

    this.floatingTexts.push(
      new FloatingText(bx, by, 'CONTAINER RAIN (30S)!', '#ff3344', '11px "Press Start 2P"')
    );

    this.spawnExplosion(bx, by, '#ff3344', 32);
    this.spawnExplosion(bx, by, '#8b0000', 20);
    this.spawnExplosion(bx, by, '#ffffff', 12);
  }

  spawnFallingContainer() {
    const cWidth = 86;
    const cHeight = 48;
    // Random horizontal position across the playfield
    const minX = 40;
    const maxX = CANVAS_WIDTH - cWidth - 40;
    const x = minX + Math.random() * (maxX - minX);
    // Drop from top header line
    const y = HEADER_HEIGHT - 25;
    const vy = 5.8 + Math.random() * 2.0; // downward falling speed

    // Spin around dynamically!
    const spinDir = Math.random() < 0.5 ? 1 : -1;
    const rotationSpeed = spinDir * (3.0 + Math.random() * 2.5); // ~170 to 315 deg/sec

    this.containers.push({
      x,
      y,
      width: cWidth,
      height: cHeight,
      vy,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed
    });

    try {
      this.sound.playLaser();
    } catch (e) { }
    this.spawnExplosion(x + cWidth / 2, y + cHeight / 2, '#ff3344', 16);
  }

  triggerBoardSlowDebuff(duration = 2.0) {
    this.boardSlowDebuff.active = true;
    this.boardSlowDebuff.timer = duration;
    this.sound.playDebuff();

    this.container.classList.add('shake');
    setTimeout(() => this.container.classList.remove('shake'), 220);

    this.floatingTexts.push(
      new FloatingText(this.bat.x + this.bat.width / 2, this.bat.y - 25, 'HEAVY SLOW (2s)!', '#ff3344', '13px "Press Start 2P"')
    );

    // Red impact sparks & smoke at paddle
    this.spawnExplosion(this.bat.x + this.bat.width / 2, this.bat.y, '#ff3344', 30);
    this.spawnExplosion(this.bat.x + this.bat.width / 2, this.bat.y, '#8b0000', 20);
    this.spawnExplosion(this.bat.x + this.bat.width / 2, this.bat.y, '#ffffff', 14);
  }

  getDefaultMagataComments() {
    return [
      { text: "MA☆GA☆TA", color: "#ff007f", size: 110, speed: 55, standout: true },
      { text: "wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww", color: "#ffffff", size: 52, speed: 230 },
      { text: "弾幕ｷﾀ━━━━━━(ﾟ∀ﾟ)━━━━━━!!", color: "#00f3ff", size: 56, speed: 210 },
      { text: "見えない見えない見えない見えないｗｗｗ", color: "#ffffff", size: 50, speed: 240 },
      { text: "888888888888888888888888888888888888", color: "#ffea00", size: 48, speed: 190 },
      { text: "邪魔すぎるだろこれｗｗｗｗｗｗｗｗｗ", color: "#ff3344", size: 54, speed: 250 },
      { text: "画面が完全に埋まったｗｗｗｗｗｗ", color: "#ff9900", size: 50, speed: 200 },
      { text: "ボールどこだよ！？！？！？ｗｗｗ", color: "#ffffff", size: 52, speed: 230 },
      { text: "草草草草草草草草草草草草草草草草草草", color: "#39ff14", size: 54, speed: 260 },
      { text: "MAGATA SAMA DAISUKI BARRAGE!!!", color: "#ff69b4", size: 56, speed: 180 },
      { text: "？？？？？？？？？？？？？？？？？？", color: "#ff2a85", size: 58, speed: 170 },
      { text: "前が見えねェェェェェェェェ！！！", color: "#ffffff", size: 50, speed: 220 },
      { text: "ブロックどこいったｗｗｗｗｗｗｗ", color: "#ffcc00", size: 48, speed: 210 },
      { text: "うわあああああああああああああ", color: "#ffffff", size: 52, speed: 240 },
      { text: "MA☆GA☆TA☆MA☆GA☆TA☆MA☆GA☆TA", color: "#ff00aa", size: 60, speed: 160 },
      { text: "ｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗ", color: "#ffffff", size: 58, speed: 270 },
      { text: "完全遮断モード突入ｗｗｗｗｗｗｗｗ", color: "#00f3ff", size: 48, speed: 225 },
      { text: "たすけてええええええええええ！！", color: "#ff3b30", size: 52, speed: 215 },
      { text: "ログの暴力ｗｗｗｗｗｗｗｗｗｗｗｗ", color: "#00ff88", size: 50, speed: 235 },
      { text: "★☆★☆★☆★☆★☆★☆★☆★☆★", color: "#ffe600", size: 54, speed: 185 },
      { text: "TOTAL BLIND DANMAKU WALL!!", color: "#ff0055", size: 52, speed: 200 },
      { text: "きたあああああああああああああ！", color: "#ffffff", size: 50, speed: 240 },
      { text: "無理ゲーすぎて草生えるｗｗｗｗｗ", color: "#39ff14", size: 50, speed: 220 },
      { text: "なんも見えんぞオイィィィィィィィ！", color: "#ff3344", size: 52, speed: 250 },
      { text: "神回避しろおおおおおおおおｗｗｗ", color: "#ffea00", size: 48, speed: 195 },
      { text: "音だけで反射しろｗｗｗｗｗｗｗｗ", color: "#00f3ff", size: 50, speed: 210 },
      { text: "大草原不可避ｗｗｗｗｗｗｗｗｗｗ", color: "#ffffff", size: 54, speed: 230 },
      { text: "MAGATA ZONE ACTIVE 1000%!!", color: "#ff007f", size: 56, speed: 175 },
      { text: "文字の壁ｗｗｗｗｗｗｗｗｗｗｗｗ", color: "#ff9900", size: 52, speed: 245 },
      { text: "心眼で打て心眼でｗｗｗｗｗｗｗｗ", color: "#00ff88", size: 48, speed: 205 },
      { text: "ｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗｗ", color: "#ffffff", size: 62, speed: 280 }
    ];
  }

  triggerMagataDebuff(brick) {
    this.sound.playDebuff();

    const bx = brick ? (brick.x + brick.width / 2) : (CANVAS_WIDTH / 2);
    const by = brick ? (brick.y + brick.height / 2) : (HEADER_HEIGHT + 180);

    this.container.classList.add('shake');
    setTimeout(() => this.container.classList.remove('shake'), 320);

    this.magataDebuff.active = true;
    this.magataDebuff.timer = 30.0;
    this.magataComments = [];

    const templates = (this.magataTemplates && Array.isArray(this.magataTemplates) && this.magataTemplates.length > 0)
      ? this.magataTemplates
      : this.getDefaultMagataComments();

    const lanes = [280, 315, 350, 385, 420, 455, 490, 525, 560, 595, 630];

    // Spawn the comments across the lanes with staggered X positions running from right to left
    templates.forEach((tmpl, idx) => {
      const isStandout = Boolean(tmpl.standout);
      const size = tmpl.size || (isStandout ? 110 : 50);
      const color = tmpl.color || (isStandout ? '#ff007f' : '#ffffff');
      // "MA☆GA☆TA" moving very slowly!
      const speed = tmpl.speed || (isStandout ? 55 : (180 + Math.random() * 80));

      let y;
      let x;
      if (isStandout) {
        // Prominent center lane
        y = 440;
        x = CANVAS_WIDTH + 30;
      } else {
        y = lanes[idx % lanes.length] + (Math.random() - 0.5) * 6;
        // Distribute densely across current playfield and queue from right so bricks are immediately covered
        x = -80 + (idx * 36) + Math.random() * 45;
      }

      this.magataComments.push({
        text: tmpl.text,
        color,
        size,
        speed,
        standout: isStandout,
        x,
        y,
        width: 0
      });
    });

    this.floatingTexts.push(
      new FloatingText(bx, by, 'MA☆GA☆TA DANMAKU (30S)!', '#ff007f', '11px "Press Start 2P"')
    );

    this.spawnExplosion(bx, by, '#ff007f', 32);
    this.spawnExplosion(bx, by, '#ff69b4', 22);
    this.spawnExplosion(bx, by, '#ffffff', 14);
  }

  triggerRuriiroDebuff(brick) {
    this.sound.playDebuff();

    const bx = brick ? (brick.x + brick.width / 2) : (CANVAS_WIDTH / 2);
    const by = brick ? (brick.y + brick.height / 2) : (HEADER_HEIGHT + 200);

    this.container.classList.add('shake');
    setTimeout(() => this.container.classList.remove('shake'), 320);

    this.spawnExplosion(bx, by, '#4d79ff', 35);
    this.spawnExplosion(bx, by, '#1f4e96', 24);
    this.spawnExplosion(bx, by, '#ffffff', 16);

    this.floatingTexts.push(
      new FloatingText(bx, by, 'RURIIRO ILLUSION!', '#4d79ff', '12px "Press Start 2P"')
    );

    // Get all other alive bricks currently on the field
    const aliveBricks = this.bricks.filter(b => b.alive && b !== brick);
    if (aliveBricks.length === 0) return;

    this.ruriiroDebuff.active = true;

    // Pick one random brick to become the "Real" Ruriiro brick
    const realIndex = Math.floor(Math.random() * aliveBricks.length);
    const realBrick = aliveBricks[realIndex];

    for (let i = 0; i < aliveBricks.length; i++) {
      const b = aliveBricks[i];
      // Store original previous state if not already stored
      if (!b.previousState) {
        b.previousState = {
          isSpecial: b.isSpecial,
          isHard: b.isHard,
          points: b.points,
          isDebuff: b.isDebuff,
          specialType: b.specialType,
          image: b.image,
          hitsRequired: b.hitsRequired,
          hitsRemaining: b.hitsRemaining
        };
      }

      if (b === realBrick) {
        // "Real" Ruriiro brick (will revert all bricks when broken)
        b.isSpecial = true;
        b.isHard = false;
        b.points = 100;
        b.isDebuff = true;
        b.specialType = 'ruriiro_real';
        b.image = this.images.brick_ruriiro;
        b.hitsRequired = 1;
        b.hitsRemaining = 1;
      } else {
        // "Fake" Ruriiro brick (acts like a normal brick, no effect when broken)
        b.isSpecial = false;
        b.isHard = false;
        b.points = BRICK_POINTS;
        b.isDebuff = false;
        b.specialType = 'ruriiro_fake';
        b.image = this.images.brick_ruriiro;
        b.hitsRequired = 1;
        b.hitsRemaining = 1;
      }

      // Visual poof / illusion transformation smoke on the swapped bricks
      this.spawnExplosion(b.x + b.width / 2, b.y + b.height / 2, '#4d79ff', 8);
    }
  }

  revertRuriiroIllusion(brick) {
    this.sound.playSpecialHit();

    const bx = brick ? (brick.x + brick.width / 2) : (CANVAS_WIDTH / 2);
    const by = brick ? (brick.y + brick.height / 2) : (HEADER_HEIGHT + 200);

    this.spawnExplosion(bx, by, '#00f3ff', 35);
    this.spawnExplosion(bx, by, '#4d79ff', 24);
    this.spawnExplosion(bx, by, '#ffffff', 18);

    this.floatingTexts.push(
      new FloatingText(bx, by, 'REAL FOUND! DISPELLED!', '#00f3ff', '12px "Press Start 2P"')
    );

    this.ruriiroDebuff.active = false;

    // Revert all remaining alive bricks to their previous state
    for (const b of this.bricks) {
      if (b.alive && b !== brick && b.previousState) {
        b.isSpecial = b.previousState.isSpecial;
        b.isHard = b.previousState.isHard;
        b.points = b.previousState.points;
        b.isDebuff = b.previousState.isDebuff;
        b.specialType = b.previousState.specialType;
        b.image = b.previousState.image;
        b.hitsRequired = b.previousState.hitsRequired;
        b.hitsRemaining = b.previousState.hitsRemaining;
        delete b.previousState;

        // Sparkle effect showing brick reversion
        this.spawnExplosion(b.x + b.width / 2, b.y + b.height / 2, '#00f3ff', 8);
        this.spawnExplosion(b.x + b.width / 2, b.y + b.height / 2, '#ffffff', 4);
      } else if (b.previousState) {
        delete b.previousState;
      }
    }
  }

  shortenBat() {
    this.bat.isShortened = true;
    this.bat.shortenedTimer = BAT_SHORTENED_DURATION;
    this.bat.isExtended = false;
    this.bat.extendedTimer = 0;
    const oldWidth = this.bat.width;
    this.bat.width = BAT_HALF_WIDTH;
    const diff = (oldWidth - BAT_HALF_WIDTH) / 2;
    this.bat.x = Math.max(0, Math.min(CANVAS_WIDTH - this.bat.width, this.bat.x + diff));
    this.bat.targetX = Math.max(0, Math.min(CANVAS_WIDTH - this.bat.width, this.bat.targetX + diff));
  }

  resetBatSize() {
    this.bat.isExtended = false;
    this.bat.extendedTimer = 0;
    this.bat.isShortened = false;
    this.bat.shortenedTimer = 0;
    const oldWidth = this.bat.width;
    this.bat.width = BAT_WIDTH;
    const diff = (oldWidth - BAT_WIDTH) / 2;
    this.bat.x = Math.max(0, Math.min(CANVAS_WIDTH - this.bat.width, this.bat.x + diff));
    this.bat.targetX = Math.max(0, Math.min(CANVAS_WIDTH - this.bat.width, this.bat.targetX + diff));
  }

  getMagnetBrick() {
    if (this.magnetBricksRemaining <= 0) return null;
    return this.bricks.find(b => b.alive && b.hasMagnet) || null;
  }

  updateMagnetBrick() {
    if (this.magnetBricksRemaining <= 0) {
      for (const b of this.bricks) {
        b.hasMagnet = false;
      }
      return null;
    }

    // Keep currently active magnetized brick if it is still alive
    const current = this.bricks.find(b => b.alive && b.hasMagnet);
    if (current) {
      return current;
    }

    // Otherwise, select the single closest alive brick to the player's board (paddle)
    const aliveBricks = this.bricks.filter(b => b.alive);
    if (aliveBricks.length === 0) {
      for (const b of this.bricks) {
        b.hasMagnet = false;
      }
      return null;
    }

    const batCenterX = this.bat.x + this.bat.width / 2;
    const batCenterY = this.bat.y;

    let closestBrick = null;
    let minDist = Infinity;

    for (const brick of aliveBricks) {
      const brickCenterX = brick.x + brick.width / 2;
      const brickCenterY = brick.y + brick.height / 2;
      const dist = Math.hypot(brickCenterX - batCenterX, brickCenterY - batCenterY);
      if (dist < minDist) {
        minDist = dist;
        closestBrick = brick;
      }
    }

    for (const b of this.bricks) {
      b.hasMagnet = (b === closestBrick);
    }

    return closestBrick;
  }

  getDefaultSkillsConfig() {
    return {
      yo: { name: "EXTENDED BOARD", type: "buff", icon: "images/brick_yo.png" },
      tsuki: { name: "MAGNET TRACTOR", type: "buff", icon: "images/brick_tsuki.png" },
      q: { name: "BOMB BLAST", type: "buff", icon: "images/brick_q.png" },
      kazuki: { name: "NEON SHIELD", type: "buff", icon: "images/brick_kazuki.png" },
      miu: { name: "DUAL TURRETS", type: "buff", icon: "images/brick_miu.png" },
      jio: { name: "TOXIC POISON", type: "buff", icon: "images/brick_jio.png" },
      enoki: { name: "X-LINE BLAST", type: "buff", icon: "images/brick_enoki.png" },
      koishi: { name: "DEBUFF DISPEL", type: "buff", icon: "images/brick_koishi.png" },
      shun: { name: "EXTRA MULTIBALL", type: "buff", icon: "images/brick_shun.png" },
      eiji: { name: "GOLDEN TREASURE", type: "buff", icon: "images/brick_eiji.png" },
      saigo: { name: "PLUS BLAST", type: "buff", icon: "images/brick_saigo.png" },
      hyakuichitaro: { name: "FIREBALL PIERCE", type: "buff", icon: "images/brick_hyakuichitaro.png" },
      tsuruko: { name: "GRAVITY FIELD", type: "buff", icon: "images/brick_tsuruko.png" },
      ichinose: { name: "POINT PENALTY", type: "debuff", icon: "images/brick_ichinose.png" },
      mita: { name: "SPEED BOOST", type: "buff", icon: "images/brick_mita.png" },
      manami: { name: "WARP CROSS BLAST", type: "buff", icon: "images/brick_manami.png" },
      saori: { name: "RAPID BULLETS", type: "buff", icon: "images/brick_saori.png" },
      akuta: { name: "BOARD DAMAGED", type: "debuff", icon: "images/brick_akuta.png" },
      taiga: { name: "GREEN GALE", type: "buff", icon: "images/brick_taiga.png" },
      sui: { name: "CONTAINER HAZARD", type: "debuff", icon: "images/brick_sui.png" },
      magata: { name: "DANMAKU BARRAGE", type: "debuff", icon: "images/brick_magata.png" },
      ruriiro: { name: "RURIIRO ILLUSION", type: "debuff", icon: "images/brick_ruriiro.png" },
      ruriiro_real: { name: "ILLUSION DISPELLED", type: "buff", icon: "images/brick_ruriiro.png" },
      zero: { name: "ZERO HEART DROP", type: "buff", icon: "images/brick_zero.png" },
      haru: { name: "POWER RESONANCE", type: "buff", icon: "images/brick_haru.png" }
    };
  }

  triggerSkillCutin(brickType) {
    const config = (this.skillsConfig && this.skillsConfig[brickType]) || (this.getDefaultSkillsConfig && this.getDefaultSkillsConfig()[brickType]);
    if (!config) return;

    // Shift existing active cutins down by 1 slot (Slot 0 -> Slot 1, Slot 1 -> Slot 2)
    for (const cutin of this.skillCutins) {
      cutin.slot++;
      cutin.targetY = 960 + cutin.slot * 97;
      // If pushed beyond the 2 visible slots (slot >= 2), mark as displaced so it rapidly fades out
      if (cutin.slot >= 2) {
        cutin.isDisplaced = true;
      }
    }

    // Resolve icon image from loaded images
    let iconImg = this.images['brick_' + brickType] || this.images[brickType];
    if (!iconImg && config.icon) {
      const matchKey = config.icon.replace('images/', '').replace('.png', '').replace('.webp', '');
      iconImg = this.images[matchKey];
    }
    if (!iconImg) {
      iconImg = this.images.brick_normal;
    }

    const newCutin = {
      key: brickType,
      name: config.name || 'SKILL ACTIVATED',
      type: config.type || 'buff',
      iconImage: iconImg,
      slot: 0,
      x: -360,
      targetX: 24,
      y: 960,
      targetY: 960,
      width: 328,
      height: 81,
      age: 0,
      duration: 1.0,
      alpha: 1.0,
      isDisplaced: false
    };

    this.skillCutins.unshift(newCutin);

    // Limit array to prevent unbounded growth
    if (this.skillCutins.length > 4) {
      this.skillCutins.length = 4;
    }
  }

  drawSkillCutins() {
    if (!this.skillCutins || this.skillCutins.length === 0) return;

    for (const cutin of this.skillCutins) {
      if (cutin.alpha <= 0) continue;
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, Math.min(1, cutin.alpha));

      const isDebuff = (cutin.type === 'debuff');

      // 1. Draw cutin banner sprite with glowing aura (red for debuff, blue for buff)
      const bannerImg = isDebuff
        ? this.images.debuff_skill_cutin
        : this.images.buff_skill_cutin;

      const glowColor = isDebuff ? '#ff1e42' : '#00d4ff';
      this.ctx.shadowColor = glowColor;
      this.ctx.shadowBlur = 20;

      if (bannerImg && bannerImg.complete && bannerImg.naturalWidth !== 0) {
        this.ctx.drawImage(bannerImg, cutin.x, cutin.y, cutin.width, cutin.height);
      } else {
        this.ctx.fillStyle = isDebuff ? '#ff2244' : '#00a8ff';
        this.ctx.fillRect(cutin.x, cutin.y, cutin.width, cutin.height);
      }

      // 2. "Buff" or "Debuff" text on the black tab box (red small text for debuff, blue small text for buff)
      const badgeText = isDebuff ? 'Debuff' : 'Buff';
      this.ctx.font = '7px "Press Start 2P"';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = isDebuff ? '#ff3b56' : '#00e5ff';
      this.ctx.shadowColor = isDebuff ? '#ff0033' : '#0088ff';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(badgeText, cutin.x + 76, cutin.y + 28.5);

      // 3. Skill Name vertically centered inside the red / blue colored box
      let fontSize = 11;
      if (cutin.name.length > 17) fontSize = 8.5;
      else if (cutin.name.length > 14) fontSize = 9.5;
      else if (cutin.name.length > 11) fontSize = 10.5;

      this.ctx.font = `${fontSize}px "Press Start 2P"`;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 6;
      this.ctx.fillStyle = '#ffffff';
      const textX = cutin.x + 28;
      const textY = cutin.y + 51;
      this.ctx.fillText(cutin.name, textX, textY, 215);

      // 4. Brick icon on the most right (centered within the colored box)
      const iconImg = cutin.iconImage || this.images['brick_' + cutin.key] || this.images[cutin.key];
      if (iconImg && iconImg.complete && iconImg.naturalWidth !== 0) {
        const iconW = 56;
        const iconH = 28;
        const iconX = cutin.x + cutin.width - iconW - 14;
        const iconY = cutin.y + 50 - iconH / 2;
        this.ctx.shadowColor = isDebuff ? '#ff0033' : '#00f3ff';
        this.ctx.shadowBlur = 8;
        this.ctx.drawImage(iconImg, iconX, iconY, iconW, iconH);
      }

      this.ctx.restore();
    }
  }

  // --- Special Brick Hook ---
  onSpecialBrickDestroyed(brick, sourceBall) {
    if (brick && brick.specialType) {
      this.triggerSkillCutin(brick.specialType);
    }
    // Check if this is the "yo" brick that extends the paddle
    if (brick.specialType === 'yo') {
      this.extendBat();
      this.sound.playSpecialHit();
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'EXTENDED BOARD! (30s)', '#ffe600', '11px "Press Start 2P"')
      );
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffe600', 24);
      return;
    }

    // Check if this is the "tsuki" brick that adds magnetism for next 1 closest brick
    if (brick.specialType === 'tsuki') {
      this.magnetBricksRemaining = TSUKI_MAGNET_CHARGES;
      this.updateMagnetBrick();

      // Clear magnet effect on all balls first
      for (const b of this.balls) {
        b.hasMagnetEffect = false;
      }

      // Tsuki's magnet effect should only affect the ball that breaks the tsuki brick
      if (sourceBall) {
        sourceBall.hasMagnetEffect = true;
      } else if (this.balls.length > 0) {
        // Fallback if broken by explosion/turret laser: assign to first unattached active ball
        const activeBall = this.balls.find(b => !b.isAttached) || this.balls[0];
        if (activeBall) activeBall.hasMagnetEffect = true;
      }

      this.sound.playSpecialHit();
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'MAGNET ACTIVE (1 BALL)!', '#00f3ff', '10px "Press Start 2P"')
      );
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#00f3ff', 30);
      return;
    }

    // Check if this is the "q" brick: explodes all adjacent bricks around it!
    if (brick.specialType === 'q') {
      this.sound.playExplode();
      this.container.classList.add('shake');
      setTimeout(() => this.container.classList.remove('shake'), 250);

      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff3b30', 36);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff9500', 20);

      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'BOOM!', '#ff3b30', '14px "Press Start 2P"')
      );

      // Explode all adjacent bricks
      const adjacentBricks = this.bricks.filter(
        b => b.alive && b !== brick && Math.abs(b.col - brick.col) <= 1 && Math.abs(b.row - brick.row) <= 1
      );

      for (const adj of adjacentBricks) {
        if (!adj.alive) continue;
        adj.alive = false;
        adj.isPoisoned = false;
        const basePoints = adj.points || BRICK_POINTS;
        const ptsGained = this.addScore(basePoints);

        if (adj.hasMagnet) {
          this.magnetBricksRemaining--;
          adj.hasMagnet = false;
          this.updateMagnetBrick();
        }

        if (adj.isSpecial) {
          // Activate special skill effect when broken by explosion!
          this.onSpecialBrickDestroyed(adj, sourceBall);
        } else {
          this.spawnExplosion(adj.x + adj.width / 2, adj.y + adj.height / 2, adj.isHard ? '#e0e0e0' : '#ff5722', 20);
          if (adj.isHard) {
            this.spawnExplosion(adj.x + adj.width / 2, adj.y + adj.height / 2, '#ffcc00', 10);
          }
          const ptsColor = ptsGained === 1 && basePoints > 1 ? '#ff3344' : (adj.isHard ? '#ffcc00' : '#ff9800');
          this.floatingTexts.push(
            new FloatingText(adj.x + adj.width / 2, adj.y, `+${ptsGained}`, ptsColor, '10px "Press Start 2P"')
          );
        }
      }
      return;
    }

    // Check if this is the "kazuki" brick: adds shield beneath player's board (15s or 1 hit)
    if (brick.specialType === 'kazuki') {
      this.shield.active = true;
      this.shield.timer = SHIELD_DURATION;
      this.sound.playSpecialHit();
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'NEON SHIELD (15s / 1 HIT)!', '#00f3ff', '10px "Press Start 2P"')
      );
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#00f3ff', 30);
      return;
    }

    // Check if this is the "miu" brick: summons dual turrets on left & right of board
    if (brick.specialType === 'miu') {
      this.turrets.active = true;
      this.turrets.timer = TURRET_DURATION;
      this.sound.playSpecialHit();
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'DUAL TURRETS (30s)!', '#ff2a85', '10px "Press Start 2P"')
      );
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff2a85', 30);
      return;
    }

    // Check if this is the "jio" brick: poisons one adjacent brick from it
    // Check if this is the "jio" brick: poisons one adjacent brick from it (if none adjacent, effect doesn't run at all)
    if (brick.specialType === 'jio') {
      // Find adjacent alive unpoisoned bricks strictly neighboring this brick
      const adjacentUnpoisoned = this.bricks.filter(
        b => b.alive && !b.isPoisoned && Math.abs(b.col - brick.col) <= 1 && Math.abs(b.row - brick.row) <= 1 && b !== brick
      );

      if (adjacentUnpoisoned.length > 0) {
        this.sound.playSpecialHit();
        this.floatingTexts.push(
          new FloatingText(brick.x + brick.width / 2, brick.y, 'POISON SPREAD!', '#39ff14', '10px "Press Start 2P"')
        );
        this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#39ff14', 30);
        const target = adjacentUnpoisoned[Math.floor(Math.random() * adjacentUnpoisoned.length)];
        this.poisonBrick(target);
      } else {
        // No adjacent brick: effect doesn't run at all
        this.sound.playBrickHit();
        this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#39ff14', 16);
      }
      return;
    }

    // Check if this is the "enoki" brick: destroys every brick in X line from this brick
    if (brick.specialType === 'enoki') {
      this.sound.playExplode();
      this.container.classList.add('shake');
      setTimeout(() => this.container.classList.remove('shake'), 350);

      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#bf00ff', 40);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 20);

      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'X-BLAST!', '#bf00ff', '15px "Press Start 2P"')
      );

      // Create dramatic diagonal purple neon laser beams across the grid
      this.xBeams.push({
        cx: brick.x + brick.width / 2,
        cy: brick.y + brick.height / 2,
        timer: 0.5,
        duration: 0.5
      });

      // Find all alive bricks in X line (diagonal cross through this brick)
      const xLineBricks = this.bricks.filter(
        b => b.alive && b !== brick && Math.abs(b.col - brick.col) === Math.abs(b.row - brick.row)
      );

      for (const target of xLineBricks) {
        if (!target.alive) continue;
        target.alive = false;
        target.isPoisoned = false;
        const basePoints = target.points || BRICK_POINTS;
        const ptsGained = this.addScore(basePoints);

        this.spawnExplosion(target.x + target.width / 2, target.y + target.height / 2, '#bf00ff', 24);
        this.spawnExplosion(target.x + target.width / 2, target.y + target.height / 2, '#ffffff', 10);
        const ptsColor = ptsGained === 1 && basePoints > 1 ? '#ff3344' : (target.isHard ? '#ffcc00' : '#df40ff');
        this.floatingTexts.push(
          new FloatingText(target.x + target.width / 2, target.y, `+${ptsGained}`, ptsColor, '10px "Press Start 2P"')
        );

        if (target.hasMagnet) {
          this.magnetBricksRemaining--;
          target.hasMagnet = false;
          this.updateMagnetBrick();
        }

        // Activate special skills of any special bricks caught in the X line blast!
        if (target.isSpecial) {
          this.onSpecialBrickDestroyed(target, sourceBall);
        }
      }
      return;
    }

    // Check if this is the "zero" brick: drops a heavy Zero Heart (sized to ball) that must be bounced 3 times!
    if (brick.specialType === 'zero') {
      const spawnX = brick.x + brick.width / 2;
      const spawnY = brick.y + brick.height / 2;

      this.hearts.push({
        x: spawnX,
        y: spawnY,
        radius: BALL_RADIUS, // Resized to the exact size of the ball (16px radius, 32px diameter)
        vx: (Math.random() - 0.5) * 3.5,
        vy: 2.5,
        bounces: 0,
        maxBounces: 3
      });

      this.sound.playSpecialHit();
      this.floatingTexts.push(
        new FloatingText(spawnX, brick.y, 'BOUNCE HEART 3x!', '#00f3ff', '11px "Press Start 2P"')
      );

      // Cyan & magenta neon particle burst
      this.spawnExplosion(spawnX, spawnY, '#00f3ff', 24);
      this.spawnExplosion(spawnX, spawnY, '#ff2a85', 20);
      this.spawnExplosion(spawnX, spawnY, '#ffffff', 10);
      return;
    }

    // Check if this is the "eiji" brick: awards +1000 bonus points!
    if (brick.specialType === 'eiji') {
      const gained = this.addScore(1000);
      this.sound.playSpecialHit();
      const txtColor = gained === 1 ? '#ff3344' : '#ffe600';
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, `+${gained} PTS!`, txtColor, '15px "Press Start 2P"')
      );

      // Radiant golden treasure burst
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffe600', 32);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffb700', 20);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 14);
      return;
    }

    // Check if this is the "mita" brick: fastens board speed for 20 seconds!
    if (brick.specialType === 'mita') {
      this.boardSpeedBoost.active = true;
      this.boardSpeedBoost.timer = BOARD_SPEED_BOOST_DURATION;
      this.sound.playSpecialHit();
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'SPEED BOOST (20s)!', '#ffea00', '11px "Press Start 2P"')
      );
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffea00', 28);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff9100', 20);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 12);
      return;
    }

    // Check if this is the "manami" brick: physically jumps to a random brick and destroys 5 bricks in a + sign around it!
    if (brick.specialType === 'manami') {
      this.sound.playBatBounce();
      this.sound.playSpecialHit();

      const sourceX = brick.x + brick.width / 2;
      const sourceY = brick.y + brick.height / 2;

      this.floatingTexts.push(
        new FloatingText(sourceX, brick.y, 'JUMP!', '#f368e0', '13px "Press Start 2P"')
      );
      this.spawnExplosion(sourceX, sourceY, '#f368e0', 20);
      this.spawnExplosion(sourceX, sourceY, '#ff00aa', 14);
      this.spawnExplosion(sourceX, sourceY, '#ffffff', 8);

      // Find another alive brick to jump to
      const otherAliveBricks = this.bricks.filter(b => b.alive && b !== brick);

      if (otherAliveBricks.length > 0) {
        // Pick a random target brick
        const targetBrick = otherAliveBricks[Math.floor(Math.random() * otherAliveBricks.length)];

        // Launch jumping animated brick
        this.jumpingBricks.push({
          startX: brick.x,
          startY: brick.y,
          targetX: targetBrick.x,
          targetY: targetBrick.y,
          targetCol: targetBrick.col,
          targetRow: targetBrick.row,
          targetBrick: targetBrick,
          width: brick.width,
          height: brick.height,
          progress: 0,
          duration: 0.48, // 0.48s in flight
          peakHeight: 110, // vertical jump arc height
          sourceBall: sourceBall,
          trailTimer: 0
        });
      }

      return;
    }

    // Check if this is the "saori" brick: shoots 5 sequential white round bullets from the center of the board that break bricks in line!
    if (brick.specialType === 'saori') {
      this.sound.playLaser();
      this.sound.playSpecialHit();

      const sourceX = brick.x + brick.width / 2;
      const sourceY = brick.y + brick.height / 2;

      this.floatingTexts.push(
        new FloatingText(sourceX, brick.y, 'RAPID BULLETS (x5)!', '#ffffff', '11px "Press Start 2P"')
      );
      this.spawnExplosion(sourceX, sourceY, '#ffffff', 26);
      this.spawnExplosion(sourceX, sourceY, '#e0f7fa', 16);

      // Queue 5 sequential shots fired from the paddle center
      this.saoriVolleys.push({
        shotsRemaining: 5,
        timer: 0, // shot 1 fires immediately
        interval: 0.12 // subsequent shots fire every 0.12s
      });

      return;
    }

    // Check if this is the "akuta" debuff brick: shortens the board into bat_half for 1 minute!
    if (brick.specialType === 'akuta') {
      this.shortenBat();
      this.sound.playDebuff();
      this.container.classList.add('shake');
      setTimeout(() => this.container.classList.remove('shake'), 320);

      const sourceX = brick.x + brick.width / 2;
      const sourceY = brick.y + brick.height / 2;

      this.floatingTexts.push(
        new FloatingText(sourceX, brick.y, 'BOARD SHORTENED (1M)!', '#ff3344', '11px "Press Start 2P"')
      );
      this.spawnExplosion(sourceX, sourceY, '#ff3344', 32);
      this.spawnExplosion(sourceX, sourceY, '#555555', 24);
      this.spawnExplosion(sourceX, sourceY, '#00f3ff', 16);

      return;
    }

    // Check if this is the "taiga" brick: green wind effect from bottom pushes all balls back to brick area!
    if (brick.specialType === 'taiga') {
      this.triggerTaigaWind(brick);
      return;
    }

    // Check if this is the "sui" debuff brick: drops 1-3 containers sequentially from random places
    if (brick.specialType === 'sui') {
      this.triggerSuiDebuff(brick);
      return;
    }

    // Check if this is the "magata" debuff brick: blocks brick area with Nico Nico Douga comment barrage for 30s!
    if (brick.specialType === 'magata') {
      this.triggerMagataDebuff(brick);
      return;
    }

    // Check if this is the "ruriiro" debuff brick: swaps a random brick with Real Ruriiro and turns the rest fake
    if (brick.specialType === 'ruriiro') {
      this.triggerRuriiroDebuff(brick);
      return;
    }

    // Check if this is the "Real" Ruriiro brick: reverts all bricks to their previous state!
    if (brick.specialType === 'ruriiro_real') {
      this.revertRuriiroIllusion(brick);
      return;
    }

    // Check if this is the "saigo" brick: breaks all bricks in + shape from this brick!
    if (brick.specialType === 'saigo') {
      this.sound.playExplode();
      this.container.classList.add('shake');
      setTimeout(() => this.container.classList.remove('shake'), 350);

      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff3300', 40);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 20);

      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, '+ BLAST!', '#ff3300', '15px "Press Start 2P"')
      );

      // Create dramatic horizontal & vertical fiery laser beams across the grid
      this.plusBeams.push({
        cx: brick.x + brick.width / 2,
        cy: brick.y + brick.height / 2,
        timer: 0.5,
        duration: 0.5
      });

      // Find all alive bricks in + shape (same row OR same column)
      const plusLineBricks = this.bricks.filter(
        b => b.alive && b !== brick && (b.col === brick.col || b.row === brick.row)
      );

      for (const target of plusLineBricks) {
        if (!target.alive) continue;
        target.alive = false;
        target.isPoisoned = false;
        const basePoints = target.points || BRICK_POINTS;
        const ptsGained = this.addScore(basePoints);

        this.spawnExplosion(target.x + target.width / 2, target.y + target.height / 2, '#ff4500', 24);
        this.spawnExplosion(target.x + target.width / 2, target.y + target.height / 2, '#ffffff', 10);
        const ptsColor = ptsGained === 1 && basePoints > 1 ? '#ff3344' : (target.isHard ? '#ffcc00' : '#ff7733');
        this.floatingTexts.push(
          new FloatingText(target.x + target.width / 2, target.y, `+${ptsGained}`, ptsColor, '10px "Press Start 2P"')
        );

        if (target.hasMagnet) {
          this.magnetBricksRemaining--;
          target.hasMagnet = false;
          this.updateMagnetBrick();
        }

        // Activate special skills of any special bricks caught in the + blast!
        if (target.isSpecial) {
          this.onSpecialBrickDestroyed(target, sourceBall);
        }
      }
      return;
    }

    // Check if this is the "hyakuichitaro" brick: turns ball into a fire ball for 5 hits!
    if (brick.specialType === 'hyakuichitaro') {
      const ballsToEmpower = sourceBall ? [sourceBall] : this.balls.filter(b => !b.isAttached);
      for (const b of ballsToEmpower) {
        b.isFireBall = true;
        b.fireHitsRemaining = 5;
        this.spawnExplosion(b.x, b.y, '#ff4500', 28);
        this.spawnExplosion(b.x, b.y, '#ffcc00', 18);
        this.spawnExplosion(b.x, b.y, '#ffffff', 10);
      }

      this.sound.playSpecialHit();
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'FIRE BALL! (x5)', '#ff4500', '13px "Press Start 2P"')
      );

      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff3b30', 32);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffa500', 22);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 12);
      return;
    }

    // Check if this is the "tsuruko" brick: adds a pink transparent gravity field in bottom half for 8s
    if (brick.specialType === 'tsuruko') {
      this.gravityField.active = true;
      this.gravityField.timer = GRAVITY_FIELD_DURATION;
      this.sound.playSpecialHit();
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'GRAVITY FIELD (8s)!', '#ff69b4', '11px "Press Start 2P"')
      );

      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff69b4', 32);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff1493', 20);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 12);
      return;
    }

    // Check if this is the "ichinose" debuff brick: all points gained for next 1 min become only 1 pt!
    if (brick.specialType === 'ichinose') {
      this.pointDebuff.active = true;
      this.pointDebuff.timer = DEBUFF_ICHINOSE_DURATION;
      this.sound.playDebuff();
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'DEBUFF: 1 PT ONLY! (60s)', '#ff0033', '10px "Press Start 2P"')
      );

      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ff0033', 35);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#880015', 24);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#220005', 16);
      return;
    }

    // Check if this is the "shun" brick: Launch extra active ball into play (Multiball)
    if (brick.specialType === 'shun') {
      const speed = BASE_BALL_SPEED * this.speedMultiplier;
      const angle = (Math.random() - 0.5) * Math.PI * 0.5; // upward fan
      const newBall = this.spawnBall(
        false,
        brick.x + brick.width / 2,
        brick.y + brick.height / 2,
        speed * Math.sin(angle),
        -Math.abs(speed * Math.cos(angle))
      );
      this.balls.push(newBall);

      // Audio & Floating notification
      this.sound.playSpecialHit();
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'EXTRA BALL!', '#00c3e3', '12px "Press Start 2P"')
      );

      // Cyan & Silver starburst explosion
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#00c3e3', 24);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 16);
      return;
    }

    // Check if this is the "koishi" brick: clears any running debuff. Don't do anything if there is no debuff.
    if (brick.specialType === 'koishi') {
      const hasPointDebuff = this.pointDebuff && this.pointDebuff.active;
      const hasShortenedBat = this.bat && this.bat.isShortened;
      const hasSlowDebuff = this.boardSlowDebuff && this.boardSlowDebuff.active;
      const hasContainerRain = (this.suiContainerRain && this.suiContainerRain.active) || (this.containers && this.containers.length > 0);
      const hasPoison = this.bricks && this.bricks.some(b => b.alive && b.isPoisoned);
      const hasMagataDebuff = this.magataDebuff && this.magataDebuff.active;
      const hasRuriiroDebuff = this.ruriiroDebuff && this.ruriiroDebuff.active;

      const anyDebuffRunning = hasPointDebuff || hasShortenedBat || hasSlowDebuff || hasContainerRain || hasPoison || hasMagataDebuff || hasRuriiroDebuff;

      if (anyDebuffRunning) {
        if (hasPointDebuff) {
          this.pointDebuff.active = false;
          this.pointDebuff.timer = 0;
        }
        if (hasShortenedBat) {
          this.resetBatSize();
        }
        if (hasSlowDebuff) {
          this.boardSlowDebuff.active = false;
          this.boardSlowDebuff.timer = 0;
        }
        if (this.suiContainerRain && this.suiContainerRain.active) {
          this.suiContainerRain.active = false;
          this.suiContainerRain.timer = 0;
        }
        if (this.containers && this.containers.length > 0) {
          for (const c of this.containers) {
            this.spawnExplosion(c.x + c.width / 2, c.y + c.height / 2, '#00ff88', 12);
          }
          this.containers = [];
        }
        if (hasPoison) {
          for (const b of this.bricks) {
            if (b.alive && b.isPoisoned) {
              b.isPoisoned = false;
              b.poisonTimer = 0;
              this.spawnExplosion(b.x + b.width / 2, b.y + b.height / 2, '#39ff14', 10);
            }
          }
        }
        if (hasMagataDebuff) {
          this.magataDebuff.active = false;
          this.magataDebuff.timer = 0;
          this.magataComments = [];
        }
        if (hasRuriiroDebuff) {
          this.ruriiroDebuff.active = false;
          for (const b of this.bricks) {
            if (b.alive && b.previousState) {
              b.isSpecial = b.previousState.isSpecial;
              b.isHard = b.previousState.isHard;
              b.points = b.previousState.points;
              b.isDebuff = b.previousState.isDebuff;
              b.specialType = b.previousState.specialType;
              b.image = b.previousState.image;
              b.hitsRequired = b.previousState.hitsRequired;
              b.hitsRemaining = b.previousState.hitsRemaining;
              delete b.previousState;
              this.spawnExplosion(b.x + b.width / 2, b.y + b.height / 2, '#88d629', 10);
            } else if (b.previousState) {
              delete b.previousState;
            }
          }
        }

        this.sound.playSpecialHit();
        this.floatingTexts.push(
          new FloatingText(brick.x + brick.width / 2, brick.y, 'DEBUFF CLEARED!', '#88d629', '12px "Press Start 2P"')
        );

        // Cleansing Emerald & Lime starburst explosion
        this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#88d629', 28);
        this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#00ff88', 18);
        this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 10);
        this.spawnExplosion(this.bat.x + this.bat.width / 2, this.bat.y, '#00ff88', 14);
      } else {
        // No debuff running: don't do anything (standard brick hit sound, break spark, no special effect)
        this.sound.playBrickHit();
        this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#88d629', 12);
      }
      return;
    }

    // Check if this is the "haru" brick: triggers 2s slow motion for balls & falling items, then resets ball speeds
    if (brick.specialType === 'haru') {
      this.sound.playSpecialHit();

      // Activate 2-second slow motion (0.25x speed for balls, hearts, containers) & grayscale mode
      this.setSlowMotion(true);

      // Resonant pulse burst around each active ball upon slow-mo activation
      for (const b of this.balls) {
        if (!b) continue;
        this.spawnExplosion(b.x, b.y, '#00e5ff', 16);
        this.spawnExplosion(b.x, b.y, '#ffffff', 8);
      }

      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y, 'POWER RESONANCE!', '#00e5ff', '12px "Press Start 2P"')
      );
      this.floatingTexts.push(
        new FloatingText(brick.x + brick.width / 2, brick.y + 16, 'SLOW MOTION (2s)!', '#ffffff', '10px "Press Start 2P"')
      );

      // Cyan, sky blue & radiant white resonance particle burst
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#00e5ff', 30);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#76ffff', 20);
      this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffffff', 14);
      return;
    }

    // Fallback default
    this.sound.playBrickHit();
    this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#b537f2', 12);
  }

  poisonBrick(brick) {
    if (!brick || !brick.alive) return;
    brick.isPoisoned = true;
    brick.poisonTimer = 5.0;
    brick.poisonDuration = 5.0;
    this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#39ff14', 16);
    this.floatingTexts.push(
      new FloatingText(brick.x + brick.width / 2, brick.y - 12, 'POISONED (5s)!', '#39ff14', '10px "Press Start 2P"')
    );
  }

  spawnExplosion(x, y, color, count = 16) {
    if (this.particles.length >= 220) return;
    const effectiveCount = Math.min(count, 220 - this.particles.length);
    for (let i = 0; i < effectiveCount; i++) {
      const angle = (Math.PI * 2 * i) / effectiveCount + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 6 + 2;
      const size = Math.random() * 4 + 2;
      const life = Math.random() * 0.4 + 0.35;
      this.particles.push(
        new Particle(x, y, color, size, Math.cos(angle) * speed, Math.sin(angle) * speed, life)
      );
    }
  }

  fireTurrets() {
    if (!this.turrets.active) return;
    const leftX = this.bat.x - 14;
    const rightX = this.bat.x + this.bat.width + 14;
    const spawnY = this.bat.y - 20;

    this.bullets.push({ x: leftX, y: spawnY, vy: -BULLET_SPEED });
    this.bullets.push({ x: rightX, y: spawnY, vy: -BULLET_SPEED });

    this.sound.playLaser();
    this.spawnExplosion(leftX, spawnY, '#ff007f', 6);
    this.spawnExplosion(rightX, spawnY, '#ff007f', 6);
  }

  // --- Physics & Updates ---
  update(dt) {
    this.updateScoreIncrement(dt);
    if (this.state !== 'PLAYING') return;

    // Bat movement with keyboard
    const isSpeedBoosted = this.boardSpeedBoost && this.boardSpeedBoost.active;
    const isSlowDebuffed = this.boardSlowDebuff && this.boardSlowDebuff.active;

    let baseKeySpeed = 16;
    if (isSpeedBoosted) baseKeySpeed = 28;
    if (isSlowDebuffed) baseKeySpeed = 4.0; // very slow crawl
    const keySpeed = baseKeySpeed * dt * 60;

    if (this.keys.ArrowLeft || this.keys.KeyA) {
      this.bat.targetX = Math.max(0, this.bat.targetX - keySpeed);
    }
    if (this.keys.ArrowRight || this.keys.KeyD) {
      this.bat.targetX = Math.min(CANVAS_WIDTH - this.bat.width, this.bat.targetX + keySpeed);
    }

    // Smooth paddle interpolation (sluggish & clamped when slow debuff is active)
    const prevBatX = this.bat.x;
    let lerpFactor = 0.35;
    if (isSpeedBoosted) lerpFactor = 0.65;
    if (isSlowDebuffed) lerpFactor = 0.05;

    let targetDelta = (this.bat.targetX - this.bat.x) * lerpFactor;
    if (isSlowDebuffed) {
      // Strictly clamp per-frame movement so mouse/touch cannot bypass the heavy slow
      const maxDelta = 4.5 * dt * 60;
      targetDelta = Math.max(-maxDelta, Math.min(maxDelta, targetDelta));
    }

    this.bat.x += targetDelta;
    this.bat.x = Math.max(0, Math.min(CANVAS_WIDTH - this.bat.width, this.bat.x));
    this.bat.vx = this.bat.x - prevBatX;

    // Bat extension timer countdown (revert back to normal after 30 seconds)
    if (this.bat.isExtended) {
      this.bat.extendedTimer -= dt;
      if (this.bat.extendedTimer <= 0) {
        this.resetBatSize();
        try {
          this.sound.playLaser();
        } catch (e) { }
        this.floatingTexts.push(
          new FloatingText(this.bat.x + this.bat.width / 2, this.bat.y - 20, 'BOARD NORMALIZED', '#00f3ff', '10px "Press Start 2P"')
        );
      } else {
        // Delicate, sparse drift of glowing sakura petals falling off extended board
        if (this.sakuraPetals.length < 12 && Math.random() < 0.12) {
          this.spawnSakuraPetals(1);
        }
      }
    }

    // Bat shortened timer countdown (revert back to normal after 60 seconds - Akuta)
    if (this.bat.isShortened) {
      this.bat.shortenedTimer -= dt;

      // Spawn broken effect smoke puffs & electric short-circuit sparks
      // Smoke puff
      if (Math.random() > 0.25) {
        const sx = this.bat.x + 6 + Math.random() * (this.bat.width - 12);
        const sy = this.bat.y + Math.random() * 8;
        this.brokenParticles.push({
          type: 'smoke',
          x: sx,
          y: sy,
          vx: (Math.random() - 0.5) * 1.6,
          vy: -1.6 - Math.random() * 2.2,
          size: 4 + Math.random() * 4,
          maxSize: 18 + Math.random() * 10,
          life: 0.5 + Math.random() * 0.45,
          maxLife: 0.95,
          gray: Math.floor(55 + Math.random() * 55)
        });
      }

      // Electric short-circuit spark
      if (Math.random() > 0.4) {
        const spx = this.bat.x + Math.random() * this.bat.width;
        const spy = this.bat.y + Math.random() * this.bat.height;
        this.brokenParticles.push({
          type: 'spark',
          x: spx,
          y: spy,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2,
          size: 1.5 + Math.random() * 2.5,
          life: 0.12 + Math.random() * 0.16,
          maxLife: 0.28,
          color: Math.random() > 0.5 ? '#00f3ff' : (Math.random() > 0.5 ? '#ffe600' : '#ffffff')
        });
      }

      if (this.bat.shortenedTimer <= 0) {
        this.resetBatSize();
        try {
          this.sound.playSpecialHit();
        } catch (e) { }
        this.floatingTexts.push(
          new FloatingText(this.bat.x + this.bat.width / 2, this.bat.y - 20, 'BOARD RESTORED!', '#00ff88', '11px "Press Start 2P"')
        );
      }
    }

    // Bottom neon shield timer countdown
    if (this.shield.active) {
      this.shield.timer -= dt;
      if (this.shield.timer <= 0) {
        this.shield.active = false;
        this.shield.timer = 0;
        this.floatingTexts.push(
          new FloatingText(CANVAS_WIDTH / 2, SHIELD_Y - 20, 'SHIELD EXPIRED', '#00f3ff', '10px "Press Start 2P"')
        );
      }
    }

    // Dual turrets timer countdown
    if (this.turrets.active) {
      this.turrets.timer -= dt;
      if (this.turrets.timer <= 0) {
        this.turrets.active = false;
        this.turrets.timer = 0;
        this.floatingTexts.push(
          new FloatingText(this.bat.x + this.bat.width / 2, this.bat.y - 20, 'TURRETS EXPIRED', '#ff2a85', '10px "Press Start 2P"')
        );
      }
    }

    // Tsuruko pink gravity field timer countdown
    if (this.gravityField.active) {
      this.gravityField.timer -= dt;
      if (this.gravityField.timer <= 0) {
        this.gravityField.active = false;
        this.gravityField.timer = 0;
        this.floatingTexts.push(
          new FloatingText(CANVAS_WIDTH / 2, GRAVITY_FIELD_Y + 40, 'GRAVITY FIELD ENDED', '#ff69b4', '10px "Press Start 2P"')
        );
      }
    }

    // Ichinose 1-point debuff timer countdown
    if (this.pointDebuff && this.pointDebuff.active) {
      this.pointDebuff.timer -= dt;
      if (this.pointDebuff.timer <= 0) {
        this.pointDebuff.active = false;
        this.pointDebuff.timer = 0;
        this.floatingTexts.push(
          new FloatingText(CANVAS_WIDTH / 2, HEADER_HEIGHT + 40, 'DEBUFF CLEARED', '#00ff88', '11px "Press Start 2P"')
        );
      }
    }

    // Haru slow motion timer countdown (2 seconds slow-mo, then reset all ball speeds to normal)
    if (this.haruSlowMotion && this.haruSlowMotion.active) {
      this.haruSlowMotion.timer -= dt;

      // Spawn subtle ambient resonance sparkles around slow-moving balls
      for (const b of this.balls) {
        if (!b || b.isAttached) continue;
        if (Math.random() < 0.25) {
          this.spawnExplosion(
            b.x + (Math.random() - 0.5) * b.radius * 2,
            b.y + (Math.random() - 0.5) * b.radius * 2,
            Math.random() > 0.5 ? '#00e5ff' : '#ffffff',
            1
          );
        }
      }

      if (this.haruSlowMotion.timer <= 0) {
        this.setSlowMotion(false);

        // Reset all ball speeds to normal default base speed!
        this.speedMultiplier = 1.0;
        for (const b of this.balls) {
          if (!b) continue;
          const currentSpeed = Math.hypot(b.vx, b.vy);
          if (currentSpeed > 0) {
            const ratio = BASE_BALL_SPEED / currentSpeed;
            b.vx *= ratio;
            b.vy *= ratio;
          } else if (!b.isAttached) {
            b.vx = (Math.random() > 0.5 ? 1 : -1) * (BASE_BALL_SPEED * 0.5);
            b.vy = -BASE_BALL_SPEED * 0.85;
          }
          // Harmonic pulse burst around each ball when normalized
          this.spawnExplosion(b.x, b.y, '#00e5ff', 20);
          this.spawnExplosion(b.x, b.y, '#ffffff', 10);
        }

        try {
          this.sound.playSpecialHit();
        } catch (e) { }

        this.floatingTexts.push(
          new FloatingText(CANVAS_WIDTH / 2, HEADER_HEIGHT + 60, 'SPEED NORMALIZED!', '#00e5ff', '12px "Press Start 2P"')
        );
      }
    }

    // Board speed boost timer countdown (20 seconds)
    if (this.boardSpeedBoost && this.boardSpeedBoost.active) {
      this.boardSpeedBoost.timer -= dt;

      // Spawn electric spark particles from board perimeter
      for (let s = 0; s < 2; s++) {
        const edge = Math.random();
        let sx, sy;
        if (edge < 0.65) {
          // Top edge of paddle
          sx = this.bat.x + Math.random() * this.bat.width;
          sy = this.bat.y + (Math.random() - 0.5) * 6;
        } else if (edge < 0.82) {
          // Left edge
          sx = this.bat.x + (Math.random() - 0.5) * 6;
          sy = this.bat.y + Math.random() * this.bat.height;
        } else {
          // Right edge
          sx = this.bat.x + this.bat.width + (Math.random() - 0.5) * 6;
          sy = this.bat.y + Math.random() * this.bat.height;
        }

        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
        const speed = 40 + Math.random() * 100;
        this.mitaSparks.push({
          x: sx,
          y: sy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.16 + Math.random() * 0.22,
          maxLife: 0.38,
          size: 1.5 + Math.random() * 2.2,
          color: Math.random() > 0.4 ? '#ffea00' : (Math.random() > 0.5 ? '#ffffff' : '#fff566')
        });
      }

      if (this.boardSpeedBoost.timer <= 0) {
        this.boardSpeedBoost.active = false;
        this.boardSpeedBoost.timer = 0;
        this.floatingTexts.push(
          new FloatingText(this.bat.x + this.bat.width / 2, this.bat.y - 20, 'SPEED NORMALIZED', '#ffea00', '10px "Press Start 2P"')
        );
      }
    }

    // Board heavy slow debuff timer countdown (2 seconds from catching container)
    if (this.boardSlowDebuff && this.boardSlowDebuff.active) {
      this.boardSlowDebuff.timer -= dt;

      // Heavy sludge / weight drag particles from paddle
      if (Math.random() < 0.35) {
        const sx = this.bat.x + 8 + Math.random() * (this.bat.width - 16);
        const sy = this.bat.y + this.bat.height - 2;
        this.brokenParticles.push({
          x: sx,
          y: sy,
          vx: (Math.random() - 0.5) * 15,
          vy: 20 + Math.random() * 35,
          color: Math.random() < 0.6 ? '#8b0000' : '#ff3344',
          alpha: 0.8,
          size: 3 + Math.random() * 4,
          life: 0.35 + Math.random() * 0.25
        });
      }

      if (this.boardSlowDebuff.timer <= 0) {
        this.boardSlowDebuff.active = false;
        this.boardSlowDebuff.timer = 0;
        this.floatingTexts.push(
          new FloatingText(this.bat.x + this.bat.width / 2, this.bat.y - 20, 'SPEED RESTORED', '#00ff88', '10px "Press Start 2P"')
        );
      }
    }

    // Magata Danmaku Running Comments debuff timer countdown (30 seconds)
    if (this.magataDebuff && this.magataDebuff.active) {
      this.magataDebuff.timer -= dt;

      const lanes = [280, 315, 350, 385, 420, 455, 490, 525, 560, 595, 630];

      for (let i = this.magataComments.length - 1; i >= 0; i--) {
        const c = this.magataComments[i];
        c.x -= c.speed * dt;

        const textWidth = c.width || (c.size * (c.text ? c.text.length : 10) * 0.85);
        if (c.x + textWidth < -20) {
          if (this.magataDebuff.timer > 0) {
            // Respawn from right
            if (c.standout) {
              c.x = CANVAS_WIDTH + 30;
              c.y = 440;
            } else {
              c.x = CANVAS_WIDTH + 10 + Math.random() * 150;
              c.y = lanes[Math.floor(Math.random() * lanes.length)] + (Math.random() - 0.5) * 6;
            }
          } else {
            this.magataComments.splice(i, 1);
          }
        }
      }

      if (this.magataDebuff.timer <= 0 && this.magataComments.length === 0) {
        this.magataDebuff.active = false;
        this.floatingTexts.push(
          new FloatingText(CANVAS_WIDTH / 2, HEADER_HEIGHT + 40, 'DANMAKU CLEARED', '#00ff88', '11px "Press Start 2P"')
        );
      }
    }

    // Update sliding bricks animation (smooth push down from top)
    for (const brick of this.bricks) {
      if (brick.hitFlashTimer > 0) {
        brick.hitFlashTimer -= dt;
      }
      if (brick.isSliding) {
        brick.slideTimer += dt;
        const progress = Math.min(1, brick.slideTimer / brick.slideDuration);
        // easeOutCubic: fast push in, gentle settling into place
        const ease = 1 - Math.pow(1 - progress, 3);
        brick.y = brick.startY + (brick.targetY - brick.startY) * ease;
        if (progress >= 1) {
          brick.y = brick.targetY;
          brick.isSliding = false;
        }
      }
    }

    // Update Poisoned Bricks countdown & auto-break & poison spread
    for (const brick of this.bricks) {
      if (!brick.alive || !brick.isPoisoned) continue;

      brick.poisonTimer -= dt;

      // Periodic toxic spore bubbling
      if (Math.random() < 0.22) {
        this.particles.push(
          new Particle(
            brick.x + Math.random() * brick.width,
            brick.y + Math.random() * brick.height,
            '#39ff14',
            Math.random() * 3 + 1.5,
            (Math.random() - 0.5) * 1.5,
            -Math.random() * 2 - 0.5,
            0.45
          )
        );
      }

      // If the poisoned brick is not destroyed by a ball, after 5 seconds it will break and spread poison to another adjacent brick
      if (brick.poisonTimer <= 0) {
        brick.alive = false;
        brick.isPoisoned = false;
        const basePoints = brick.points || BRICK_POINTS;
        const ptsGained = this.addScore(basePoints);

        const wasMagnet = brick.hasMagnet;
        if (wasMagnet) {
          this.magnetBricksRemaining--;
          brick.hasMagnet = false;
          this.updateMagnetBrick();
        }

        this.sound.playBrickHit();
        this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#39ff14', 24);
        const ptsColor = ptsGained === 1 && basePoints > 1 ? '#ff3344' : (brick.isHard ? '#ffcc00' : '#39ff14');
        this.floatingTexts.push(
          new FloatingText(brick.x + brick.width / 2, brick.y, `POISON BREAK! +${ptsGained}`, ptsColor, '10px "Press Start 2P"')
        );

        if (brick.isSpecial) {
          this.onSpecialBrickDestroyed(brick, null);
        }

        // Spread poison to another adjacent brick!
        const adjacentUnpoisoned = this.bricks.filter(
          b => b.alive && !b.isPoisoned && Math.abs(b.col - brick.col) <= 1 && Math.abs(b.row - brick.row) <= 1 && b !== brick
        );

        if (adjacentUnpoisoned.length > 0) {
          const nextTarget = adjacentUnpoisoned[Math.floor(Math.random() * adjacentUnpoisoned.length)];
          this.poisonBrick(nextTarget);
        }
      }
    }

    // Update Balls
    for (let b = this.balls.length - 1; b >= 0; b--) {
      const ball = this.balls[b];

      if (ball.isAttached) {
        ball.x = this.bat.x + this.bat.width / 2;
        ball.y = this.bat.y - ball.radius - 2;
        continue;
      }

      // Magnetism homing: only affects the ball that breaks the tsuki brick
      const magnetBrick = this.getMagnetBrick();
      if (magnetBrick && ball.hasMagnetEffect) {
        const targetX = magnetBrick.x + magnetBrick.width / 2;
        const targetY = magnetBrick.y + magnetBrick.height / 2;
        const dx = targetX - ball.x;
        const dy = targetY - ball.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 2) {
          const speed = Math.hypot(ball.vx, ball.vy) || (BASE_BALL_SPEED * this.speedMultiplier);
          ball.vx = (dx / dist) * speed;
          ball.vy = (dy / dist) * speed;
        }
      }

      // High-resolution trail record for silky smooth comet trail
      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 16) ball.trail.shift();

      // Motion step with gravity field slow-down & Haru slow-motion
      const inGravityField = this.gravityField.active && ball.y >= GRAVITY_FIELD_Y && ball.vy > 0;
      const gravityModifier = inGravityField ? GRAVITY_FIELD_SLOW_FACTOR : 1.0;
      const haruSlowModifier = (this.haruSlowMotion && this.haruSlowMotion.active) ? this.haruSlowMotion.slowFactor : 1.0;
      const speedModifier = gravityModifier * haruSlowModifier;

      ball.x += ball.vx * dt * 60 * speedModifier;
      ball.y += ball.vy * dt * 60 * speedModifier;

      if (inGravityField && Math.random() < 0.25) {
        this.spawnExplosion(ball.x + (Math.random() - 0.5) * ball.radius, ball.y + (Math.random() - 0.5) * ball.radius, '#ff69b4', 2);
      }

      // Wall reflections
      // Left Wall
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        this.sound.playWallBounce();
      }
      // Right Wall
      if (ball.x + ball.radius >= CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        this.sound.playWallBounce();
      }
      // Top Boundary (Header Space at Y = 250 - Ball cannot pass into header)
      if (ball.y - ball.radius <= HEADER_HEIGHT) {
        ball.y = HEADER_HEIGHT + ball.radius;
        ball.vy = Math.abs(ball.vy);
        this.sound.playWallBounce();
        this.spawnExplosion(ball.x, HEADER_HEIGHT, '#00f3ff', 6);
      }

      // Bat Collision
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= this.bat.y &&
        ball.y - ball.radius <= this.bat.y + this.bat.height &&
        ball.x + ball.radius >= this.bat.x &&
        ball.x - ball.radius <= this.bat.x + this.bat.width
      ) {
        // Place above bat
        ball.y = this.bat.y - ball.radius;

        // Angle deflection based on hit location
        const batCenter = this.bat.x + this.bat.width / 2;
        const hitOffset = (ball.x - batCenter) / (this.bat.width / 2); // -1 to 1
        const clampedOffset = Math.max(-1, Math.min(1, hitOffset));
        const maxAngle = Math.PI * 0.38; // ~68 degrees max
        const deflectionAngle = clampedOffset * maxAngle;

        const currentSpeed = Math.hypot(ball.vx, ball.vy);
        const targetSpeed = Math.max(currentSpeed, BASE_BALL_SPEED * this.speedMultiplier);

        const magnetBrick = this.getMagnetBrick();
        if (magnetBrick && ball.hasMagnetEffect) {
          const targetX = magnetBrick.x + magnetBrick.width / 2;
          const targetY = magnetBrick.y + magnetBrick.height / 2;
          const dx = targetX - ball.x;
          const dy = targetY - ball.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 2) {
            ball.vx = (dx / dist) * targetSpeed;
            ball.vy = (dy / dist) * targetSpeed;
          } else {
            ball.vx = targetSpeed * Math.sin(deflectionAngle) + this.bat.vx * 0.15;
            ball.vy = -Math.abs(targetSpeed * Math.cos(deflectionAngle));
          }
        } else {
          ball.vx = targetSpeed * Math.sin(deflectionAngle) + this.bat.vx * 0.15;
          ball.vy = -Math.abs(targetSpeed * Math.cos(deflectionAngle));
        }

        this.sound.playBatBounce();
        this.spawnExplosion(ball.x, ball.y + ball.radius, '#00f3ff', 6);
        if (this.turrets.active) {
          this.fireTurrets();
        }
      }

      // Brick Collisions
      for (const brick of this.bricks) {
        if (!brick.alive) continue;
        if (brick.y + brick.height <= HEADER_HEIGHT) continue; // Still sliding above header line

        // Bounding box collision
        const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distSquared = distX * distX + distY * distY;

        if (distSquared <= ball.radius * ball.radius) {
          const isFirePierce = ball.isFireBall && ball.fireHitsRemaining > 0;

          if (!isFirePierce) {
            // Determine reflection normal first
            const overlapLeft = (ball.x + ball.radius) - brick.x;
            const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
            const overlapTop = (ball.y + ball.radius) - brick.y;
            const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);

            const minOverlapX = Math.min(overlapLeft, overlapRight);
            const minOverlapY = Math.min(overlapTop, overlapBottom);

            if (minOverlapX < minOverlapY) {
              ball.vx = -ball.vx;
            } else {
              ball.vy = -ball.vy;
            }

            // Check if this is a hard brick that requires 2 hits (turns into cracked on 1st hit)
            if (brick.isHard && brick.hitsRemaining > 1) {
              brick.hitsRemaining--;
              brick.image = this.images.brick_cracked;
              brick.hitFlashTimer = 0.35;
              this.sound.playBrickHit();
              this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#d0d0d0', 14);
              this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#888888', 8);
              this.floatingTexts.push(
                new FloatingText(
                  brick.x + brick.width / 2,
                  brick.y - 14,
                  'CRACKED! (1 HIT LEFT)',
                  '#ffcc00',
                  '11px "Press Start 2P"'
                )
              );
              break;
            }

            // Check if this is a 3-hit brick (Enoki or Saigo) that still requires more hits
            if ((brick.specialType === 'enoki' || brick.specialType === 'saigo') && brick.hitsRemaining > 1) {
              brick.hitsRemaining--;
              brick.hitFlashTimer = 0.45;
              this.sound.playBrickHit();
              const sparkColor = brick.specialType === 'saigo' ? '#ff3b30' : '#bf00ff';
              const textColor = brick.specialType === 'saigo' ? '#ff5533' : '#df40ff';
              this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, sparkColor, 18);
              this.floatingTexts.push(
                new FloatingText(
                  brick.x + brick.width / 2,
                  brick.y - 14,
                  `${brick.hitsRemaining} HIT${brick.hitsRemaining > 1 ? 'S' : ''} LEFT!`,
                  textColor,
                  '11px "Press Start 2P"'
                )
              );
              break;
            }
          } else {
            // FIRE BALL PIERCE: does not bounce back when hitting bricks for next 5 bricks!
            ball.fireHitsRemaining--;
            if (ball.fireHitsRemaining <= 0) {
              ball.isFireBall = false;
            }

            this.sound.playBrickHit();
            this.spawnExplosion(closestX, closestY, '#ff4500', 24);
            this.spawnExplosion(closestX, closestY, '#ffcc00', 16);
            this.spawnExplosion(closestX, closestY, '#ffffff', 8);

            this.floatingTexts.push(
              new FloatingText(
                brick.x + brick.width / 2,
                brick.y - 14,
                ball.fireHitsRemaining > 0 ? `PIERCE! (${ball.fireHitsRemaining} LEFT)` : 'PIERCE (LAST)!',
                '#ff4500',
                '11px "Press Start 2P"'
              )
            );
          }

          // Brick destroyed on 3rd hit (or 2nd hit for hard bricks, 1st hit for standard bricks)
          brick.alive = false;
          brick.isPoisoned = false;
          const basePoints = brick.points || BRICK_POINTS;
          const ptsGained = this.addScore(basePoints);

          const wasMagnet = brick.hasMagnet;
          const hadMagnetEffect = ball.hasMagnetEffect;

          if (wasMagnet) {
            this.magnetBricksRemaining--;
            brick.hasMagnet = false;
            ball.hasMagnetEffect = false;
            this.updateMagnetBrick();
          } else if (hadMagnetEffect) {
            // If the ball breaks another brick that is not the brick that has the magnet, remove the magnet effect
            ball.hasMagnetEffect = false;
            this.magnetBricksRemaining = 0;
            this.updateMagnetBrick();
            this.floatingTexts.push(
              new FloatingText(brick.x + brick.width / 2, brick.y - 14, 'MAGNET REMOVED', '#00f3ff', '10px "Press Start 2P"')
            );
          }

          // Handle special brick vs normal brick
          if (brick.isSpecial) {
            this.onSpecialBrickDestroyed(brick, ball);
          } else {
            this.sound.playBrickHit();
            const sparkColor = wasMagnet ? '#00f3ff' : (brick.isHard ? '#e0e0e0' : '#b537f2');
            this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, sparkColor, 14);
            if (brick.isHard) {
              this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffcc00', 8);
            }
            if (wasMagnet) {
              const countText = this.magnetBricksRemaining > 0 ? `MAGNET (${this.magnetBricksRemaining} LEFT)` : 'MAGNET ENDED';
              this.floatingTexts.push(
                new FloatingText(brick.x + brick.width / 2, brick.y - 14, countText, '#00f3ff', '10px "Press Start 2P"')
              );
            }
            const ptsColor = ptsGained === 1 && basePoints > 1 ? '#ff3344' : (brick.isHard ? '#ffcc00' : '#ff2a85');
            this.floatingTexts.push(
              new FloatingText(brick.x + brick.width / 2, brick.y, `+${ptsGained}`, ptsColor, '10px "Press Start 2P"')
            );
          }

          break; // break brick iteration for this ball in this frame
        }
      }

      // Shield Line Collision (animated jagged glowing line beneath player board - disappears after 1 hit)
      if (this.shield.active && ball.vy > 0 && ball.y + ball.radius >= SHIELD_Y - 10 && ball.y - ball.radius <= SHIELD_Y + 25) {
        ball.y = SHIELD_Y - 10 - ball.radius;
        ball.vy = -Math.abs(ball.vy);
        this.sound.playWallBounce();

        // Disappear after 1 hit
        this.shield.active = false;
        this.shield.timer = 0;

        this.spawnExplosion(ball.x, SHIELD_Y, '#00f3ff', 24);
        this.spawnExplosion(ball.x, SHIELD_Y, '#ffffff', 12);
        this.floatingTexts.push(
          new FloatingText(ball.x, SHIELD_Y - 20, 'SHIELD DEFLECT!', '#00f3ff', '10px "Press Start 2P"')
        );
      }

      // Green Wind Updraft (Taiga Brick Effect): during the 1-second blow, bounce any ball reaching the bottom upwards once
      if (this.taigaWind && this.taigaWind.active && ball.vy > 0 && ball.y + ball.radius >= this.bat.y && !ball.bouncedByWind) {
        this.bounceBallUpwardsWithWind(ball);
        this.sound.playWindGale();
        this.sound.playWallBounce();
        this.floatingTexts.push(
          new FloatingText(ball.x, BAT_Y - 25, '🍃 WIND RESCUE!', '#00ff88', '14px "Press Start 2P"')
        );
      }

      // Ball falls below screen bottom
      if (ball.y - ball.radius > CANVAS_HEIGHT) {
        if (this.taigaWind && this.taigaWind.active && !ball.bouncedByWind) {
          this.bounceBallUpwardsWithWind(ball);
          this.sound.playWindGale();
          this.floatingTexts.push(
            new FloatingText(ball.x, BAT_Y - 25, '🍃 WIND RESCUE!', '#00ff88', '14px "Press Start 2P"')
          );
        } else {
          if (ball.hasMagnetEffect) {
            ball.hasMagnetEffect = false;
            this.magnetBricksRemaining = 0;
            this.updateMagnetBrick();
          }
          this.balls.splice(b, 1);
        }
      }
    }

    // Update Bullets (Straight Lasers)
    const LASER_LENGTH = 28;
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const bullet = this.bullets[bi];
      bullet.y += bullet.vy * dt * 60;

      // Laser tip hits header line
      if (bullet.y <= HEADER_HEIGHT) {
        this.spawnExplosion(bullet.x, HEADER_HEIGHT, '#ff007f', 5);
        this.bullets.splice(bi, 1);
        continue;
      }

      // Check laser collisions with alive bricks
      let hit = false;
      const laserTip = bullet.y;
      const laserTail = bullet.y + LASER_LENGTH;

      for (const brick of this.bricks) {
        if (!brick.alive) continue;
        if (brick.y + brick.height <= HEADER_HEIGHT) continue;

        if (
          bullet.x >= brick.x &&
          bullet.x <= brick.x + brick.width &&
          laserTip <= brick.y + brick.height &&
          laserTail >= brick.y
        ) {
          hit = true;

          // If this is a hard brick that still requires 1 more hit:
          if (brick.isHard && brick.hitsRemaining > 1) {
            brick.hitsRemaining--;
            brick.image = this.images.brick_cracked;
            brick.hitFlashTimer = 0.35;
            this.sound.playBrickHit();
            this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#d0d0d0', 14);
            this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#888888', 8);
            this.floatingTexts.push(
              new FloatingText(
                brick.x + brick.width / 2,
                brick.y - 14,
                'CRACKED! (1 HIT LEFT)',
                '#ffcc00',
                '11px "Press Start 2P"'
              )
            );
            break;
          }

          // If this is an enoki or saigo brick that still requires more hits:
          if ((brick.specialType === 'enoki' || brick.specialType === 'saigo') && brick.hitsRemaining > 1) {
            brick.hitsRemaining--;
            brick.hitFlashTimer = 0.45;
            this.sound.playBrickHit();
            const sparkColor = brick.specialType === 'saigo' ? '#ff3b30' : '#bf00ff';
            const textColor = brick.specialType === 'saigo' ? '#ff5533' : '#df40ff';
            this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, sparkColor, 16);
            this.floatingTexts.push(
              new FloatingText(
                brick.x + brick.width / 2,
                brick.y - 14,
                `${brick.hitsRemaining} HIT${brick.hitsRemaining > 1 ? 'S' : ''} LEFT!`,
                textColor,
                '11px "Press Start 2P"'
              )
            );
            break;
          }

          brick.alive = false;
          brick.isPoisoned = false;
          const basePoints = brick.points || BRICK_POINTS;
          const ptsGained = this.addScore(basePoints);

          const wasMagnet = brick.hasMagnet;
          if (wasMagnet) {
            this.magnetBricksRemaining--;
            brick.hasMagnet = false;
            this.updateMagnetBrick();
          }

          if (brick.isSpecial) {
            this.onSpecialBrickDestroyed(brick, null);
          } else {
            this.sound.playBrickHit();
            const sparkColor = wasMagnet ? '#00f3ff' : (brick.isHard ? '#e0e0e0' : '#ff007f');
            this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, sparkColor, 14);
            if (brick.isHard) {
              this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffcc00', 8);
            }
            const ptsColor = ptsGained === 1 && basePoints > 1 ? '#ff3344' : (brick.isHard ? '#ffcc00' : '#ff007f');
            this.floatingTexts.push(
              new FloatingText(brick.x + brick.width / 2, brick.y, `+${ptsGained}`, ptsColor, '10px "Press Start 2P"')
            );
          }
          break;
        }
      }

      if (hit) {
        this.bullets.splice(bi, 1);
      }
    }

    // Update Falling / Bouncing Heart Icons (dropped from Zero bricks)
    const HEART_GRAVITY = 0.40; // Heavy gravity acceleration
    const heartSlowModifier = (this.haruSlowMotion && this.haruSlowMotion.active) ? this.haruSlowMotion.slowFactor : 1.0;
    for (let hi = this.hearts.length - 1; hi >= 0; hi--) {
      const heart = this.hearts[hi];

      // Heart is heavier than usual ball (applies downward gravity, unaffected by gravity field)
      heart.vy += HEART_GRAVITY * dt * 60 * heartSlowModifier;
      heart.vy = Math.min(heart.vy, 15); // Terminal fall velocity

      heart.x += heart.vx * dt * 60 * heartSlowModifier;
      heart.y += heart.vy * dt * 60 * heartSlowModifier;

      // Wall reflections (left and right edges)
      if (heart.x - heart.radius <= 0) {
        heart.x = heart.radius;
        heart.vx = Math.abs(heart.vx) * 0.85;
      } else if (heart.x + heart.radius >= CANVAS_WIDTH) {
        heart.x = CANVAS_WIDTH - heart.radius;
        heart.vx = -Math.abs(heart.vx) * 0.85;
      }

      // Paddle / Bat Collision (Must be bounced 3 times to become an extra life!)
      if (
        heart.vy > 0 &&
        heart.y + heart.radius >= this.bat.y &&
        heart.y - heart.radius <= this.bat.y + this.bat.height &&
        heart.x + heart.radius >= this.bat.x &&
        heart.x - heart.radius <= this.bat.x + this.bat.width
      ) {
        heart.bounces++;

        if (heart.bounces >= 3) {
          // 3rd bounce achieved: transforms into an extra life!
          if (this.lives < MAX_LIVES) {
            this.lives = Math.min(MAX_LIVES, this.lives + 1);
            this.updateHUD();
            this.sound.playSpecialHit();
            this.floatingTexts.push(
              new FloatingText(heart.x, this.bat.y - 20, '+1 LIFE!', '#00ff88', '14px "Press Start 2P"')
            );
            this.spawnExplosion(heart.x, this.bat.y, '#88d629', 32);
            this.spawnExplosion(heart.x, this.bat.y, '#00ff88', 24);
            this.spawnExplosion(heart.x, this.bat.y, '#ffe600', 16);
          } else {
            // Already at max 3 lives
            this.sound.playSpecialHit();
            this.floatingTexts.push(
              new FloatingText(heart.x, this.bat.y - 20, 'MAX LIVES (3/3)!', '#00ff88', '11px "Press Start 2P"')
            );
            this.spawnExplosion(heart.x, this.bat.y, '#88d629', 20);
          }

          this.hearts.splice(hi, 1);
          continue;
        } else {
          // 1st or 2nd bounce: bounce upward with heavy feel (does NOT reach bricks)
          heart.y = this.bat.y - heart.radius;
          heart.vy = -12.5;

          // Horizontal deflection based on paddle offset
          const batCenter = this.bat.x + this.bat.width / 2;
          const hitOffset = (heart.x - batCenter) / (this.bat.width / 2);
          heart.vx = hitOffset * 6 + (this.bat.vx ? this.bat.vx * 0.25 : 0);

          this.sound.playWallBounce();
          this.spawnExplosion(heart.x, this.bat.y, '#ff3366', 16);
          this.spawnExplosion(heart.x, this.bat.y, '#00ff88', 10);
          const remaining = 3 - heart.bounces;
          this.floatingTexts.push(
            new FloatingText(
              heart.x,
              this.bat.y - 18,
              `HEART ${heart.bounces}/3! (${remaining} LEFT)`,
              '#ff3366',
              '10px "Press Start 2P"'
            )
          );
        }
      }

      // Heart falls off bottom of screen:
      // Note: Heart does NOT destroy Kazuki shield if fallen off (shield is only destroyed by balls)
      if (heart.y - heart.radius > CANVAS_HEIGHT) {
        this.floatingTexts.push(
          new FloatingText(heart.x, CANVAS_HEIGHT - 35, 'HEART LOST', '#ff4466', '10px "Press Start 2P"')
        );
        this.hearts.splice(hi, 1);
      }
    }

    // Check if all balls are lost
    if (this.balls.length === 0) {
      this.lives--;
      this.sound.playLifeLost();
      this.container.classList.add('shake');
      setTimeout(() => this.container.classList.remove('shake'), 300);
      this.updateHUD();
      this.resetBatSize();
      this.magnetBricksRemaining = 0;
      this.updateMagnetBrick();
      this.shield.active = false;
      this.shield.timer = 0;
      this.turrets.active = false;
      this.turrets.timer = 0;
      this.bullets = [];
      this.xBeams = [];
      this.plusBeams = [];
      this.jumpingBricks = [];
      this.gravityField.active = false;
      this.gravityField.timer = 0;
      this.pointDebuff.active = false;
      this.pointDebuff.timer = 0;
      this.boardSpeedBoost.active = false;
      this.boardSpeedBoost.timer = 0;
      this.mitaSparks = [];
      this.saoriVolleys = [];
      this.saoriBullets = [];
      this.brokenParticles = [];
      this.sakuraPetals = [];
      this.taigaWind.active = false;
      this.taigaWind.timer = 0;
      this.taigaWind.particles = [];
      this.taigaWind.ribbons = [];
      this.hearts = [];
      this.containers = [];
      this.suiContainerRain = { active: false, timer: 0, nextDropTimer: 0 };
      this.boardSlowDebuff = { active: false, timer: 0 };
      this.magataDebuff = { active: false, timer: 0 };
      this.magataComments = [];
      this.setSlowMotion(false);
      this.skillCutins = [];

      if (this.lives > 0) {
        this.balls = [this.spawnBall(true)];
        setTimeout(() => {
          if (this.state === 'PLAYING') {
            this.launchAttachedBalls();
          }
        }, 800);
      } else {
        this.triggerGameOver();
      }
    }

    // Check if all bricks are cleared
    if (this.state === 'PLAYING' && !this.isClearingLevel) {
      const remainingBricks = this.bricks.filter(b => b.alive).length;
      if (remainingBricks === 0) {
        this.isClearingLevel = true;
        this.triggerLevelClear();
      }
    }

    // Update Particles
    for (let p = this.particles.length - 1; p >= 0; p--) {
      this.particles[p].update(dt);
      if (this.particles[p].life <= 0) {
        this.particles.splice(p, 1);
      }
    }

    // Update Floating Texts (capped at 18 to avoid cascade backlog)
    if (this.floatingTexts.length > 18) {
      this.floatingTexts.splice(0, this.floatingTexts.length - 18);
    }
    for (let t = this.floatingTexts.length - 1; t >= 0; t--) {
      this.floatingTexts[t].update(dt);
      if (this.floatingTexts[t].life <= 0) {
        this.floatingTexts.splice(t, 1);
      }
    }

    // Update Skill Cutin Banners
    for (let ci = this.skillCutins.length - 1; ci >= 0; ci--) {
      const cutin = this.skillCutins[ci];
      cutin.age += dt;

      // Smooth horizontal entrance slide-in from offscreen left
      cutin.x += (cutin.targetX - cutin.x) * Math.min(1, dt * 18);

      // Smooth vertical slide down when pushed by newer cutin
      cutin.y += (cutin.targetY - cutin.y) * Math.min(1, dt * 14);

      // Fade-out handling: if displaced beyond max 2 visible or during final portion of 1-second lifespan
      if (cutin.isDisplaced) {
        cutin.alpha -= dt * 4;
      } else if (cutin.age >= 0.75) {
        cutin.alpha = Math.max(0, (cutin.duration - cutin.age) / 0.25);
      }

      if (cutin.age >= cutin.duration || cutin.alpha <= 0) {
        this.skillCutins.splice(ci, 1);
      }
    }

    // Update X-Blast diagonal laser beams
    for (let xbi = this.xBeams.length - 1; xbi >= 0; xbi--) {
      this.xBeams[xbi].timer -= dt;
      if (this.xBeams[xbi].timer <= 0) {
        this.xBeams.splice(xbi, 1);
      }
    }

    // Update + Blast (Cross) fiery laser beams
    for (let pbi = this.plusBeams.length - 1; pbi >= 0; pbi--) {
      this.plusBeams[pbi].timer -= dt;
      if (this.plusBeams[pbi].timer <= 0) {
        this.plusBeams.splice(pbi, 1);
      }
    }

    // Update Jumping Bricks (Manami)
    for (let jbi = this.jumpingBricks.length - 1; jbi >= 0; jbi--) {
      const jb = this.jumpingBricks[jbi];
      jb.progress += dt / jb.duration;

      const destX = jb.targetBrick ? jb.targetBrick.x : jb.targetX;
      const destY = jb.targetBrick ? jb.targetBrick.y : jb.targetY;

      // Spawn trail particles while flying
      jb.trailTimer = (jb.trailTimer || 0) + dt;
      if (jb.trailTimer >= 0.035) {
        jb.trailTimer = 0;
        const t = Math.min(1, jb.progress);
        const currX = jb.startX + (destX - jb.startX) * t + jb.width / 2;
        const currY = jb.startY + (destY - jb.startY) * t - Math.sin(t * Math.PI) * jb.peakHeight + jb.height / 2;
        this.particles.push(
          new Particle(
            currX + (Math.random() - 0.5) * 12,
            currY + (Math.random() - 0.5) * 12,
            Math.random() > 0.4 ? '#f368e0' : '#ffffff',
            3.5,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5,
            0.22
          )
        );
      }

      // Check if brick has completed jump and landed
      if (jb.progress >= 1) {
        this.jumpingBricks.splice(jbi, 1);

        const impactX = destX + jb.width / 2;
        const impactY = destY + jb.height / 2;

        this.sound.playExplode();
        this.container.classList.add('shake');
        setTimeout(() => this.container.classList.remove('shake'), 320);

        // Teleport arrival explosion and announcement
        this.spawnExplosion(impactX, impactY, '#f368e0', 36);
        this.spawnExplosion(impactX, impactY, '#ff00aa', 24);
        this.spawnExplosion(impactX, impactY, '#ffffff', 16);
        this.floatingTexts.push(
          new FloatingText(impactX, destY - 14, '+ CROSS BLAST!', '#f368e0', '13px "Press Start 2P"')
        );

        // Find the 5 bricks in a + sign around the target (center + up, down, left, right)
        const crossBricks = this.bricks.filter(
          b => b.alive && ((b.col === jb.targetCol && Math.abs(b.row - jb.targetRow) <= 1) ||
            (b.row === jb.targetRow && Math.abs(b.col - jb.targetCol) <= 1))
        );

        for (const target of crossBricks) {
          if (!target.alive) continue;
          target.alive = false;
          target.isPoisoned = false;
          const basePoints = target.points || BRICK_POINTS;
          const ptsGained = this.addScore(basePoints);

          if (target.hasMagnet) {
            this.magnetBricksRemaining--;
            target.hasMagnet = false;
            this.updateMagnetBrick();
          }

          if (target.isSpecial) {
            this.onSpecialBrickDestroyed(target, jb.sourceBall);
          } else {
            this.spawnExplosion(target.x + target.width / 2, target.y + target.height / 2, target.isHard ? '#e0e0e0' : '#f368e0', 20);
            if (target.isHard) {
              this.spawnExplosion(target.x + target.width / 2, target.y + target.height / 2, '#ffcc00', 8);
            }
            const ptsColor = ptsGained === 1 && basePoints > 1 ? '#ff3344' : (target.isHard ? '#ffcc00' : '#ff00aa');
            this.floatingTexts.push(
              new FloatingText(target.x + target.width / 2, target.y, `+${ptsGained}`, ptsColor, '10px "Press Start 2P"')
            );
          }
        }
      }
    }

    // Update Mita electric spark particles
    for (let spi = this.mitaSparks.length - 1; spi >= 0; spi--) {
      const sp = this.mitaSparks[spi];
      sp.x += sp.vx * dt + (Math.random() - 0.5) * 1.5;
      sp.y += sp.vy * dt + (Math.random() - 0.5) * 1.5;
      sp.life -= dt;
      if (sp.life <= 0) {
        this.mitaSparks.splice(spi, 1);
      }
    }

    // Update Saori Sequential Volleys (fires 5 sequential bullets from center of board)
    for (let vi = this.saoriVolleys.length - 1; vi >= 0; vi--) {
      const volley = this.saoriVolleys[vi];
      volley.timer -= dt;
      if (volley.timer <= 0 && volley.shotsRemaining > 0) {
        volley.shotsRemaining--;
        volley.timer = volley.interval;

        // Shoot from current center of player board
        const spawnX = this.bat.x + this.bat.width / 2;
        const spawnY = this.bat.y - 12;

        this.saoriBullets.push({
          x: spawnX,
          y: spawnY,
          vy: -BULLET_SPEED, // 20px per frame (1200px/s)
          radius: 9
        });

        this.sound.playLaser();
        this.spawnExplosion(spawnX, spawnY, '#ffffff', 6);
      }

      if (volley.shotsRemaining <= 0) {
        this.saoriVolleys.splice(vi, 1);
      }
    }

    // Update Saori White Round Bullets
    for (let bi = this.saoriBullets.length - 1; bi >= 0; bi--) {
      const sb = this.saoriBullets[bi];
      sb.y += sb.vy * dt * 60;

      // Subtle trailing spark
      if (Math.random() > 0.35) {
        this.particles.push(
          new Particle(
            sb.x + (Math.random() - 0.5) * 4,
            sb.y + sb.radius + 2,
            '#ffffff',
            2.5,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5,
            0.15
          )
        );
      }

      // Reached top header boundary
      if (sb.y - sb.radius <= HEADER_HEIGHT) {
        this.spawnExplosion(sb.x, HEADER_HEIGHT, '#ffffff', 6);
        this.saoriBullets.splice(bi, 1);
        continue;
      }

      // Check collision with bricks in line
      let hit = false;
      for (const brick of this.bricks) {
        if (!brick.alive) continue;
        if (brick.y + brick.height <= HEADER_HEIGHT) continue;

        if (
          sb.x + sb.radius >= brick.x &&
          sb.x - sb.radius <= brick.x + brick.width &&
          sb.y - sb.radius <= brick.y + brick.height &&
          sb.y + sb.radius >= brick.y
        ) {
          hit = true;

          // If this is a hard brick that still requires 1 more hit:
          if (brick.isHard && brick.hitsRemaining > 1) {
            brick.hitsRemaining--;
            brick.image = this.images.brick_cracked;
            brick.hitFlashTimer = 0.35;
            this.sound.playBrickHit();
            this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#d0d0d0', 14);
            this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#888888', 8);
            this.floatingTexts.push(
              new FloatingText(
                brick.x + brick.width / 2,
                brick.y - 14,
                'CRACKED! (1 HIT LEFT)',
                '#ffcc00',
                '11px "Press Start 2P"'
              )
            );
            break;
          }

          // If this is an enoki or saigo brick that still requires more hits:
          if ((brick.specialType === 'enoki' || brick.specialType === 'saigo') && brick.hitsRemaining > 1) {
            brick.hitsRemaining--;
            brick.hitFlashTimer = 0.45;
            this.sound.playBrickHit();
            const sparkColor = brick.specialType === 'saigo' ? '#ff3b30' : '#bf00ff';
            const textColor = brick.specialType === 'saigo' ? '#ff5533' : '#df40ff';
            this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, sparkColor, 16);
            this.floatingTexts.push(
              new FloatingText(
                brick.x + brick.width / 2,
                brick.y - 14,
                `${brick.hitsRemaining} HIT${brick.hitsRemaining > 1 ? 'S' : ''} LEFT!`,
                textColor,
                '11px "Press Start 2P"'
              )
            );
            break;
          }

          brick.alive = false;
          brick.isPoisoned = false;
          const basePoints = brick.points || BRICK_POINTS;
          const ptsGained = this.addScore(basePoints);

          const wasMagnet = brick.hasMagnet;
          if (wasMagnet) {
            this.magnetBricksRemaining--;
            brick.hasMagnet = false;
            this.updateMagnetBrick();
          }

          if (brick.isSpecial) {
            this.onSpecialBrickDestroyed(brick, null);
          } else {
            this.sound.playBrickHit();
            const sparkColor = wasMagnet ? '#00f3ff' : (brick.isHard ? '#e0e0e0' : '#ffffff');
            this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, sparkColor, 16);
            if (brick.isHard) {
              this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#ffcc00', 8);
            } else {
              this.spawnExplosion(brick.x + brick.width / 2, brick.y + brick.height / 2, '#e0f7fa', 8);
            }
            const ptsColor = ptsGained === 1 && basePoints > 1 ? '#ff3344' : (brick.isHard ? '#ffcc00' : '#ffffff');
            this.floatingTexts.push(
              new FloatingText(brick.x + brick.width / 2, brick.y, `+${ptsGained}`, ptsColor, '10px "Press Start 2P"')
            );
          }
          break;
        }
      }

      if (hit) {
        this.spawnExplosion(sb.x, sb.y, '#ffffff', 10);
        this.saoriBullets.splice(bi, 1);
      }
    }

    // Update Sui Continuous Container Drops (one container every few seconds for ~30 seconds)
    if (this.suiContainerRain && this.suiContainerRain.active) {
      this.suiContainerRain.timer -= dt;
      this.suiContainerRain.nextDropTimer -= dt;

      if (this.suiContainerRain.nextDropTimer <= 0) {
        this.spawnFallingContainer();
        // Drop next container in 3.0 to 4.5 seconds
        this.suiContainerRain.nextDropTimer = 3.0 + Math.random() * 1.5;
      }

      if (this.suiContainerRain.timer <= 0) {
        this.suiContainerRain.active = false;
        this.floatingTexts.push(
          new FloatingText(CANVAS_WIDTH / 2, HEADER_HEIGHT + 40, 'CONTAINER RAIN ENDED', '#00ff88', '11px "Press Start 2P"')
        );
      }
    }

    // Update Falling Containers (Sui Debuff - spinning dynamically around)
    const containerSlowModifier = (this.haruSlowMotion && this.haruSlowMotion.active) ? this.haruSlowMotion.slowFactor : 1.0;
    for (let ci = this.containers.length - 1; ci >= 0; ci--) {
      const c = this.containers[ci];
      c.y += c.vy * dt * 60 * containerSlowModifier;
      c.rotation += c.rotationSpeed * dt * containerSlowModifier;

      // Check collision with board (board catches spinning container)
      const cx = c.x + c.width / 2;
      const cy = c.y + c.height / 2;
      const collisionRadius = 38;

      const closestX = Math.max(this.bat.x, Math.min(cx, this.bat.x + this.bat.width));
      const closestY = Math.max(this.bat.y, Math.min(cy, this.bat.y + this.bat.height));
      const distSq = (cx - closestX) * (cx - closestX) + (cy - closestY) * (cy - closestY);

      if (distSq <= collisionRadius * collisionRadius) {
        this.triggerBoardSlowDebuff(2.0);
        this.containers.splice(ci, 1);
        continue;
      }

      // Container falls below screen bottom without being caught
      if (c.y - c.height > CANVAS_HEIGHT) {
        this.containers.splice(ci, 1);
      }
    }

    // Update Broken Effect Particles (Smoke & Sparks from Shortened Board)
    for (let bpi = this.brokenParticles.length - 1; bpi >= 0; bpi--) {
      const bp = this.brokenParticles[bpi];
      bp.life -= dt;
      if (bp.life <= 0) {
        this.brokenParticles.splice(bpi, 1);
        continue;
      }
      if (bp.type === 'smoke') {
        bp.x += bp.vx * dt * 60;
        bp.y += bp.vy * dt * 60;
        bp.size += (bp.maxSize - bp.size) * 0.08 * dt * 60;
      } else if (bp.type === 'spark') {
        bp.x += bp.vx * dt * 60 + (Math.random() - 0.5) * 2;
        bp.y += bp.vy * dt * 60 + (Math.random() - 0.5) * 2;
      }
    }

    // Update Glowing Sakura Petals (Yo Brick Extended Board)
    for (let spi = this.sakuraPetals.length - 1; spi >= 0; spi--) {
      const sp = this.sakuraPetals[spi];
      sp.life -= dt;
      if (sp.life <= 0 || sp.y > CANVAS_HEIGHT + 40) {
        this.sakuraPetals.splice(spi, 1);
        continue;
      }
      sp.swayPhase += sp.swaySpeed * dt;
      sp.flipAngle += sp.flipSpeed * dt;
      sp.angle += sp.angularVelocity * dt;

      // Gentle floating physics with harmonic horizontal wind flutter
      const swayVx = Math.cos(sp.swayPhase) * sp.swayAmp;
      sp.x += (sp.vx + swayVx) * dt * 60;
      sp.y += sp.vy * dt * 60;
    }

    // Update ball wind trail timers
    for (const ball of this.balls) {
      if (ball.windTrailTimer > 0) {
        ball.windTrailTimer -= dt;
      }
    }

    // Update Taiga Wind Visual Surge & Loop while active
    if (this.taigaWind && (this.taigaWind.active || this.taigaWind.particles.length > 0 || this.taigaWind.ribbons.length > 0)) {
      if (this.taigaWind.active) {
        this.taigaWind.timer -= dt;
        if (this.taigaWind.timer <= 0) {
          this.taigaWind.active = false;
          for (const ball of this.balls) {
            ball.bouncedByWind = false;
          }
        }

        // Keep ribbons continuously rising and looping from bottom while active
        for (const rib of this.taigaWind.ribbons) {
          rib.y -= rib.speed * dt;
          rib.phase += dt * 4;
          if (rib.y + rib.length < HEADER_HEIGHT) {
            rib.y = CANVAS_HEIGHT + Math.random() * 60;
            rib.baseX = 30 + Math.random() * (CANVAS_WIDTH - 60);
          }
        }

        // Continuously spawn fresh wind swirl particles from bottom while active
        if (this.taigaWind.particles.length < 35 && Math.random() < 0.35) {
          this.spawnTaigaWindParticle(false);
        }
      } else {
        // When no longer active (after one-shot blow or timer expiry), let ribbons drift up and fade out
        for (let ri = this.taigaWind.ribbons.length - 1; ri >= 0; ri--) {
          const rib = this.taigaWind.ribbons[ri];
          rib.y -= rib.speed * dt;
          rib.phase += dt * 4;
          rib.alpha -= dt * 1.5;
          if (rib.alpha <= 0 || rib.y + rib.length < HEADER_HEIGHT) {
            this.taigaWind.ribbons.splice(ri, 1);
          }
        }
      }

      // Update wind particles
      for (let pi = this.taigaWind.particles.length - 1; pi >= 0; pi--) {
        const p = this.taigaWind.particles[pi];
        p.life -= dt;
        if (p.life <= 0 || p.y < HEADER_HEIGHT - 30) {
          this.taigaWind.particles.splice(pi, 1);
          continue;
        }
        p.swirlPhase += p.swirlSpeed * dt;
        p.y += p.vy * dt;
        p.x += Math.cos(p.swirlPhase) * p.swirlAmp * dt * 60 + p.vx * dt;
      }
    }
  }

  // --- Rendering ---
  draw() {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Background image
    if (this.images.bg) {
      this.ctx.drawImage(this.images.bg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      this.ctx.fillStyle = '#060511';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Header divider line (at Y = 250)
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(181, 55, 242, 0.6)';
    this.ctx.lineWidth = 3;
    this.ctx.shadowColor = '#00f3ff';
    this.ctx.shadowBlur = 10;
    this.ctx.beginPath();
    this.ctx.moveTo(0, HEADER_HEIGHT);
    this.ctx.lineTo(CANVAS_WIDTH, HEADER_HEIGHT);
    this.ctx.stroke();
    this.ctx.restore();

    // 2. Draw Bricks (7 columns x 5 rows) - clipped below header line
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, HEADER_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HEADER_HEIGHT);
    this.ctx.clip();

    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (brick.image && brick.image.complete && brick.image.naturalWidth !== 0) {
        this.ctx.drawImage(brick.image, brick.x, brick.y, brick.width, brick.height);
      } else {
        let fallback = brick.isHard ? '#7a8288' : ((brick.specialType === 'ruriiro_fake') ? '#1f4e96' : '#b537f2');
        if (brick.isSpecial) {
          if (brick.specialType === 'yo') fallback = '#ffe600';
          else if (brick.specialType === 'q') fallback = '#ff3b30';
          else if (brick.specialType === 'kazuki') fallback = '#00a8ff';
          else if (brick.specialType === 'miu') fallback = '#ff2a85';
          else if (brick.specialType === 'jio') fallback = '#39ff14';
          else if (brick.specialType === 'enoki') fallback = '#bf00ff';
          else if (brick.specialType === 'koishi') fallback = '#88d629';
          else if (brick.specialType === 'shun') fallback = '#00c3e3';
          else if (brick.specialType === 'eiji') fallback = '#ffe600';
          else if (brick.specialType === 'saigo') fallback = '#ff3300';
          else if (brick.specialType === 'hyakuichitaro') fallback = '#9d1bb2';
          else if (brick.specialType === 'tsuruko') fallback = '#ff69b4';
          else if (brick.specialType === 'ichinose') fallback = '#ff0033';
          else if (brick.specialType === 'mita') fallback = '#ffea00';
          else if (brick.specialType === 'manami') fallback = '#f368e0';
          else if (brick.specialType === 'saori') fallback = '#ffffff';
          else if (brick.specialType === 'akuta') fallback = '#8b0000';
          else if (brick.specialType === 'taiga') fallback = '#00ff88';
          else if (brick.specialType === 'sui') fallback = '#ff3344';
          else if (brick.specialType === 'magata') fallback = '#ff00aa';
          else if (brick.specialType === 'ruriiro' || brick.specialType === 'ruriiro_real') fallback = '#1f4e96';
          else if (brick.specialType === 'haru') fallback = '#00e5ff';
          else fallback = '#00f3ff';
        }
        this.ctx.fillStyle = fallback;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
      }

      // Add light blue neon around the bricks that have magnets
      if (brick.hasMagnet) {
        this.ctx.save();
        const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 120);
        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 18 * pulse + 4;
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(brick.x - 3, brick.y - 3, brick.width + 6, brick.height + 6);

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(brick.x - 1, brick.y - 1, brick.width + 2, brick.height + 2);
        this.ctx.restore();
      }

      // Add glowing neon toxic green effect for poisoned bricks
      if (brick.isPoisoned) {
        this.ctx.save();
        const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 100);

        // Toxic green inner wash overlay
        this.ctx.fillStyle = `rgba(57, 255, 20, ${0.25 + 0.15 * pulse})`;
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Toxic green outer neon border
        this.ctx.shadowColor = '#39ff14';
        this.ctx.shadowBlur = 18 * pulse + 4;
        this.ctx.strokeStyle = '#39ff14';
        this.ctx.lineWidth = 3.5;
        this.ctx.strokeRect(brick.x - 2, brick.y - 2, brick.width + 4, brick.height + 4);

        // Inner white/bright highlight
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // Mini countdown progress bar along the bottom edge of the brick
        const barHeight = 4;
        const barY = brick.y + brick.height - barHeight - 2;
        const barWidth = brick.width - 6;
        const pct = Math.max(0, brick.poisonTimer / (brick.poisonDuration || 5.0));
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(brick.x + 3, barY, barWidth, barHeight);
        this.ctx.fillStyle = '#39ff14';
        this.ctx.fillRect(brick.x + 3, barY, barWidth * pct, barHeight);

        // Countdown timer text (e.g. "5s", "4s", "3s")
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#00ff66';
        this.ctx.shadowBlur = 8;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`☣ ${Math.max(1, Math.ceil(brick.poisonTimer))}s`, brick.x + brick.width / 2, brick.y + brick.height / 2 + 3);

        this.ctx.restore();
      }

      // Glowing purple neon effect and countdown for Enoki bricks
      if (brick.specialType === 'enoki') {
        this.ctx.save();
        const isFlashing = brick.hitFlashTimer > 0;
        const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 90);
        const glowColor = isFlashing ? '#f075ff' : '#bf00ff';
        const glowBlur = isFlashing ? 32 : (16 * pulse + 6);

        // Purple neon glow border
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = glowBlur;
        this.ctx.strokeStyle = glowColor;
        this.ctx.lineWidth = isFlashing ? 4.5 : 3;
        this.ctx.strokeRect(brick.x - 2, brick.y - 2, brick.width + 4, brick.height + 4);

        // Inner neon highlight border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // If flashing from a hit, add a light purple flash wash
        if (isFlashing) {
          this.ctx.fillStyle = 'rgba(191, 0, 255, 0.35)';
          this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }

        // Countdown indicator badge in top-right showing hits remaining (3, 2, or 1)
        const count = brick.hitsRemaining !== undefined ? brick.hitsRemaining : 3;
        const badgeWidth = 24;
        const badgeHeight = 18;
        const badgeX = brick.x + brick.width - badgeWidth - 3;
        const badgeY = brick.y + 3;

        // Badge background
        this.ctx.shadowColor = '#bf00ff';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = 'rgba(20, 0, 35, 0.88)';
        this.ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
        this.ctx.strokeStyle = isFlashing ? '#ffffff' : '#df40ff';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

        // Badge text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${count}`, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 1);

        this.ctx.restore();
      }



      // Glowing fiery crimson neon effect and countdown for Saigo bricks
      if (brick.specialType === 'saigo') {
        this.ctx.save();
        const isFlashing = brick.hitFlashTimer > 0;
        const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 90);
        const glowColor = isFlashing ? '#ff7755' : '#ff3300';
        const glowBlur = isFlashing ? 32 : (16 * pulse + 6);

        // Crimson fiery neon glow border
        this.ctx.shadowColor = glowColor;
        this.ctx.shadowBlur = glowBlur;
        this.ctx.strokeStyle = glowColor;
        this.ctx.lineWidth = isFlashing ? 4.5 : 3;
        this.ctx.strokeRect(brick.x - 2, brick.y - 2, brick.width + 4, brick.height + 4);

        // Inner neon highlight border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // If flashing from a hit, add a fiery crimson flash wash
        if (isFlashing) {
          this.ctx.fillStyle = 'rgba(255, 50, 0, 0.35)';
          this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }

        // Countdown indicator badge in top-right showing hits remaining (3, 2, or 1)
        const count = brick.hitsRemaining !== undefined ? brick.hitsRemaining : 3;
        const badgeWidth = 24;
        const badgeHeight = 18;
        const badgeX = brick.x + brick.width - badgeWidth - 3;
        const badgeY = brick.y + 3;

        // Badge background
        this.ctx.shadowColor = '#ff3300';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = 'rgba(40, 10, 0, 0.88)';
        this.ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
        this.ctx.strokeStyle = isFlashing ? '#ffffff' : '#ff5533';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);

        // Badge text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${count}`, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2 + 1);

        this.ctx.restore();
      }

      // Hit flash effect for hard bricks when cracked
      if (brick.isHard && brick.hitFlashTimer > 0) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        this.ctx.restore();
      }
    }
    this.ctx.restore();

    // Draw light blue neon magnetic tether from active balls to magnetized brick
    const activeMagnetBrick = this.getMagnetBrick();
    if (activeMagnetBrick) {
      const targetX = activeMagnetBrick.x + activeMagnetBrick.width / 2;
      const targetY = activeMagnetBrick.y + activeMagnetBrick.height / 2;
      this.ctx.save();
      for (const ball of this.balls) {
        if (ball.isAttached || !ball.hasMagnetEffect) continue;
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 6]);
        this.ctx.lineDashOffset = -Date.now() / 30;
        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(ball.x, ball.y);
        this.ctx.lineTo(targetX, targetY);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 2b. Draw Pink Transparent Gravity Field (Bottom 30% of playfield: Y = 1120 to 1600)
    if (this.gravityField.active) {
      this.ctx.save();
      const isEndingSoon = this.gravityField.timer <= 3.0;
      const fieldAlpha = isEndingSoon ? (Math.floor(this.gravityField.timer * 6) % 2 === 0 ? 0.35 : 1.0) : 1.0;
      const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 100);

      this.ctx.globalAlpha = fieldAlpha;

      // Vertical pink transparent gradient covering bottom 30% of field
      if (!this.cachedGravityGrad) {
        this.cachedGravityGrad = this.ctx.createLinearGradient(0, GRAVITY_FIELD_Y, 0, CANVAS_HEIGHT);
        this.cachedGravityGrad.addColorStop(0, 'rgba(255, 105, 180, 0.08)');
        this.cachedGravityGrad.addColorStop(0.35, 'rgba(255, 20, 147, 0.13)');
        this.cachedGravityGrad.addColorStop(1, 'rgba(255, 105, 180, 0.22)');
      }

      this.ctx.fillStyle = this.cachedGravityGrad;
      this.ctx.fillRect(0, GRAVITY_FIELD_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GRAVITY_FIELD_Y);

      // Top glowing neon boundary line at Y = 1120
      this.ctx.shadowColor = '#ff69b4';
      this.ctx.shadowBlur = 18 * pulse + 4;
      this.ctx.strokeStyle = '#ff69b4';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(0, GRAVITY_FIELD_Y);
      this.ctx.lineTo(CANVAS_WIDTH, GRAVITY_FIELD_Y);
      this.ctx.stroke();

      // Inner white-hot boundary core
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, GRAVITY_FIELD_Y);
      this.ctx.lineTo(CANVAS_WIDTH, GRAVITY_FIELD_Y);
      this.ctx.stroke();

      // Subtle upward drifting anti-gravity wave lines
      const waveOffset = (Date.now() / 40) % 60;
      this.ctx.strokeStyle = 'rgba(255, 105, 180, 0.12)';
      this.ctx.lineWidth = 1.5;
      for (let y = CANVAS_HEIGHT - waveOffset; y >= GRAVITY_FIELD_Y; y -= 60) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(CANVAS_WIDTH, y);
        this.ctx.stroke();
      }

      // Live HUD indicator label inside the field
      this.ctx.shadowColor = '#ff1493';
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = 'rgba(255, 200, 230, 0.85)';
      this.ctx.font = '10px "Press Start 2P"';
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'top';
      const secLeft = Math.ceil(this.gravityField.timer);
      this.ctx.fillText(`GRAVITY FIELD: ${secLeft}s`, CANVAS_WIDTH - 20, GRAVITY_FIELD_Y + 12);

      this.ctx.restore();
    }

    // 2c. Draw Green Wind Surge Updraft (Taiga Brick Effect)
    if (this.taigaWind && (this.taigaWind.active || this.taigaWind.particles.length > 0 || this.taigaWind.ribbons.length > 0)) {
      this.ctx.save();
      const windAlpha = this.taigaWind.active ? Math.min(1.0, this.taigaWind.timer * 3.0) : 0;

      // Layer 1: Ambient emerald / mint upward gale glow from bottom
      if (!this.cachedWindGrad) {
        this.cachedWindGrad = this.ctx.createLinearGradient(0, CANVAS_HEIGHT, 0, HEADER_HEIGHT);
        this.cachedWindGrad.addColorStop(0, 'rgba(0, 255, 136, 0.30)');
        this.cachedWindGrad.addColorStop(0.35, 'rgba(57, 255, 20, 0.15)');
        this.cachedWindGrad.addColorStop(0.75, 'rgba(0, 243, 255, 0.08)');
        this.cachedWindGrad.addColorStop(1, 'rgba(0, 255, 136, 0)');
      }
      this.ctx.save();
      this.ctx.globalAlpha = windAlpha;
      this.ctx.fillStyle = this.cachedWindGrad;
      this.ctx.fillRect(0, HEADER_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT - HEADER_HEIGHT);
      this.ctx.restore();

      // Layer 2: Flowing dynamic vertical wind streamer ribbons
      for (const rib of this.taigaWind.ribbons) {
        this.ctx.save();
        this.ctx.globalAlpha = rib.alpha * windAlpha;
        this.ctx.shadowColor = rib.color;
        this.ctx.shadowBlur = 16;
        this.ctx.strokeStyle = rib.color;
        this.ctx.lineWidth = rib.thickness;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        const segments = 8;
        const segLen = rib.length / segments;
        for (let s = 0; s <= segments; s++) {
          const sy = rib.y - s * segLen;
          const sx = rib.baseX + Math.sin(rib.phase + s * 0.6) * rib.amplitude;
          if (s === 0) {
            this.ctx.moveTo(sx, sy);
          } else {
            this.ctx.lineTo(sx, sy);
          }
        }
        this.ctx.stroke();

        // Bright white core line for the ribbon
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = Math.max(1, rib.thickness * 0.35);
        this.ctx.stroke();
        this.ctx.restore();
      }

      // Layer 3: Swirling green wind vortex / gale particles
      for (const p of this.taigaWind.particles) {
        const pAlpha = Math.max(0, p.life / p.maxLife) * windAlpha;
        this.ctx.save();
        this.ctx.globalAlpha = pAlpha;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = p.color;

        // Draw aerodynamic wind droplet / leaf
        this.ctx.translate(p.x, p.y);
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size * 0.45, p.size * 1.2, p.vx * 0.005, 0, Math.PI * 2);
        this.ctx.fill();

        // White core highlight
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size * 0.25, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
      }

      this.ctx.restore();
    }

    // Red glow behind board during Container Slow debuff (Sui)
    if (this.boardSlowDebuff && this.boardSlowDebuff.active) {
      this.ctx.save();
      const pulse = 0.75 + 0.25 * Math.sin(Date.now() / 110);
      const rx = 10;
      const bx = this.bat.x - 4;
      const by = this.bat.y - 4;
      const bw = this.bat.width + 8;
      const bh = this.bat.height + 8;

      // Soft intense red back-glow aura
      this.ctx.shadowColor = '#ff1e38';
      this.ctx.shadowBlur = 24 * pulse;
      this.ctx.fillStyle = `rgba(255, 30, 56, ${0.65 * pulse})`;
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(bx, by, bw, bh, rx);
      } else {
        this.ctx.rect(bx, by, bw, bh);
      }
      this.ctx.fill();

      // Ambient outer red halo diffusion
      this.ctx.shadowColor = '#ff0033';
      this.ctx.shadowBlur = 38 * pulse;
      this.ctx.fillStyle = `rgba(255, 20, 40, ${0.35 * pulse})`;
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(bx - 4, by - 4, bw + 8, bh + 8, rx + 4);
      } else {
        this.ctx.rect(bx - 4, by - 4, bw + 8, bh + 8);
      }
      this.ctx.fill();

      this.ctx.restore();
    }

    // 3. Draw Bat / Paddle
    let batImg = this.images.bat;
    if (this.bat.isExtended && this.images.bat_extended) {
      batImg = this.images.bat_extended;
    } else if (this.bat.isShortened && this.images.bat_half) {
      batImg = this.images.bat_half;
    }

    // Warning blink during last 3 seconds of extended or shortened time
    const isEndingSoon = this.bat.isExtended && this.bat.extendedTimer <= 3.0;
    const isShortenedEnding = this.bat.isShortened && this.bat.shortenedTimer <= 3.0;
    const batAlpha = (isEndingSoon || isShortenedEnding) ? (Math.floor((isEndingSoon ? this.bat.extendedTimer : this.bat.shortenedTimer) * 6) % 2 === 0 ? 0.35 : 1.0) : 1.0;

    if (batImg) {
      this.ctx.save();
      this.ctx.globalAlpha = batAlpha;
      this.ctx.drawImage(batImg, this.bat.x, this.bat.y, this.bat.width, this.bat.height);
      this.ctx.restore();
    } else {
      this.ctx.save();
      this.ctx.globalAlpha = batAlpha;
      this.ctx.fillStyle = this.bat.isExtended ? '#ffe600' : (this.bat.isShortened ? '#ff3b30' : '#00f3ff');
      this.ctx.fillRect(this.bat.x, this.bat.y, this.bat.width, this.bat.height);
      this.ctx.restore();
    }

    // 3c. Broken Smoke & Electric Short-Circuit Effect on Board (Akuta Debuff)
    if (this.bat.isShortened) {
      this.ctx.save();
      // Draw smoke puffs drifting off damaged paddle
      for (const bp of this.brokenParticles) {
        if (bp.type === 'smoke') {
          const alpha = Math.max(0, bp.life / bp.maxLife) * 0.45;
          this.ctx.globalAlpha = alpha;
          this.ctx.fillStyle = `rgb(${bp.gray}, ${bp.gray}, ${bp.gray})`;
          this.ctx.beginPath();
          this.ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (bp.type === 'spark') {
          const alpha = Math.max(0, bp.life / bp.maxLife);
          this.ctx.globalAlpha = alpha;
          this.ctx.fillStyle = bp.color;
          this.ctx.beginPath();
          this.ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }

      // Erratic short-circuit electric lightning snaps on the broken paddle edges
      const numJolts = 2;
      for (let j = 0; j < numJolts; j++) {
        if (Math.random() > 0.35) {
          const jx1 = this.bat.x + Math.random() * this.bat.width;
          const jy1 = this.bat.y + Math.random() * this.bat.height;
          const jx2 = jx1 + (Math.random() - 0.5) * 22;
          const jy2 = jy1 + (Math.random() - 0.5) * 14;

          this.ctx.save();
          this.ctx.strokeStyle = Math.random() > 0.5 ? '#00f3ff' : '#ffff55';
          this.ctx.shadowColor = '#00f3ff';
          this.ctx.shadowBlur = 8;
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(jx1, jy1);
          this.ctx.lineTo((jx1 + jx2) / 2 + (Math.random() - 0.5) * 8, (jy1 + jy2) / 2 + (Math.random() - 0.5) * 6);
          this.ctx.lineTo(jx2, jy2);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
      this.ctx.restore();
    }

    // 3d. Draw Glowing Sakura Petals Falling Off Board (Yo Brick Extension)
    if (this.sakuraPetals.length > 0) {
      this.ctx.save();
      for (const sp of this.sakuraPetals) {
        const progress = Math.max(0, sp.life / sp.maxLife);
        // Smooth fade-in at birth, fade-out near death
        const alpha = Math.min(1.0, progress * 1.8, (sp.maxLife - sp.life) * 4.0);
        if (alpha <= 0.01) continue;

        this.ctx.save();
        this.ctx.translate(sp.x, sp.y);
        this.ctx.rotate(sp.angle);

        // 3D tumbling flutter: scale the horizontal axis with cos(flipAngle)
        const flipScale = Math.cos(sp.flipAngle);
        const effectiveFlip = Math.abs(flipScale) < 0.12 ? (flipScale >= 0 ? 0.12 : -0.12) : flipScale;
        this.ctx.scale(effectiveFlip, 1.0);

        this.ctx.globalAlpha = alpha;

        // Vivid neon glow effect
        this.ctx.shadowColor = sp.glowColor;
        this.ctx.shadowBlur = 14;

        // Create radiant linear gradient along petal length
        const grad = this.ctx.createLinearGradient(0, -sp.length * 0.5, 0, sp.length * 0.5);
        if (sp.colorMode === 'pink') {
          grad.addColorStop(0, '#ffffff'); // bright luminous tip
          grad.addColorStop(0.35, '#ff77bb');
          grad.addColorStop(1, '#ff1493');
        } else if (sp.colorMode === 'blue') {
          grad.addColorStop(0, '#ffffff'); // luminous tip
          grad.addColorStop(0.35, '#70e5ff');
          grad.addColorStop(1, '#00aaff');
        } else {
          // Duo pink & blue
          grad.addColorStop(0, '#00f0ff'); // electric cyan tip
          grad.addColorStop(0.5, '#ffffff'); // white core
          grad.addColorStop(1, '#ff2a8d'); // neon pink base
        }

        this.ctx.fillStyle = grad;

        // Draw sculpted sakura petal geometry
        const halfW = sp.width / 2;
        const tipNotch = sp.length * 0.12;

        this.ctx.beginPath();
        this.ctx.moveTo(0, sp.length * 0.45);
        this.ctx.bezierCurveTo(halfW * 1.25, sp.length * 0.25, halfW * 1.3, -sp.length * 0.25, halfW * 0.65, -sp.length * 0.45);
        this.ctx.quadraticCurveTo(halfW * 0.2, -sp.length * 0.45 + tipNotch, 0, -sp.length * 0.45 + tipNotch);
        this.ctx.quadraticCurveTo(-halfW * 0.2, -sp.length * 0.45 + tipNotch, -halfW * 0.65, -sp.length * 0.45);
        this.ctx.bezierCurveTo(-halfW * 1.3, -sp.length * 0.25, -halfW * 1.25, sp.length * 0.25, 0, sp.length * 0.45);
        this.ctx.closePath();
        this.ctx.fill();

        // Delicate neon rim/edge stroke for extra neon pop
        this.ctx.strokeStyle = sp.secondaryColor;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Optional tiny trailing neon sparkle / stardust
        if (sp.hasSparkle && alpha > 0.35) {
          this.ctx.shadowBlur = 10;
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          const sparkleDist = sp.length * 0.65;
          this.ctx.arc(0, sparkleDist, 1.5, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
      }
      this.ctx.restore();
    }

    // 3b. Electric Sparks & Crackling Lightning Arcs on Board during Speed Boost (Mita)
    if (this.boardSpeedBoost && this.boardSpeedBoost.active) {
      this.ctx.save();
      const isBoostEnding = this.boardSpeedBoost.timer <= 3.0;
      const boostAlpha = isBoostEnding ? (Math.floor(this.boardSpeedBoost.timer * 6) % 2 === 0 ? 0.35 : 1.0) : 1.0;

      // Crackling electric lightning arcs crawling along the board surface
      const numBolts = 3;
      for (let b = 0; b < numBolts; b++) {
        const startX = this.bat.x + 8 + Math.random() * (this.bat.width - 16);
        const startY = this.bat.y + Math.random() * this.bat.height;
        const targetX = this.bat.x + 8 + Math.random() * (this.bat.width - 16);
        const targetY = this.bat.y + (Math.random() > 0.5 ? -4 : this.bat.height + 4);

        this.ctx.save();
        this.ctx.globalAlpha = boostAlpha * (0.65 + Math.random() * 0.35);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.shadowColor = '#ffea00';
        this.ctx.shadowBlur = 10;
        this.ctx.lineWidth = 1.6;
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);

        const segments = 4;
        for (let s = 1; s <= segments; s++) {
          const t = s / segments;
          const nextX = startX + (targetX - startX) * t + (Math.random() - 0.5) * 12;
          const nextY = startY + (targetY - startY) * t + (Math.random() - 0.5) * 7;
          this.ctx.lineTo(nextX, nextY);
        }
        this.ctx.stroke();

        // Electric golden glow outer pass
        this.ctx.strokeStyle = '#ffea00';
        this.ctx.lineWidth = 3.2;
        this.ctx.stroke();
        this.ctx.restore();
      }

      // Flying electric spark streak particles
      for (const sp of this.mitaSparks) {
        const sparkAlpha = Math.max(0, sp.life / sp.maxLife) * boostAlpha;
        this.ctx.save();
        this.ctx.globalAlpha = sparkAlpha;
        this.ctx.strokeStyle = sp.color;
        this.ctx.shadowColor = '#ffea00';
        this.ctx.shadowBlur = 8;
        this.ctx.lineWidth = sp.size;
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(sp.x, sp.y);
        this.ctx.lineTo(sp.x - sp.vx * 0.04, sp.y - sp.vy * 0.04);
        this.ctx.stroke();

        // Center white-hot spark node
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(sp.x, sp.y, sp.size * 0.55, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      }

      this.ctx.restore();
    }

    // 3d. Draw Dual Turrets on Paddle (Left & Right)
    if (this.turrets.active) {
      this.ctx.save();
      const isTurretEnding = this.turrets.timer <= 3.0;
      const turretAlpha = isTurretEnding ? (Math.floor(this.turrets.timer * 6) % 2 === 0 ? 0.35 : 1.0) : 1.0;
      const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 90);
      this.ctx.globalAlpha = turretAlpha;

      const leftX = this.bat.x - 14;
      const rightX = this.bat.x + this.bat.width + 14;
      const mountY = this.bat.y + 8;

      const drawTurret = (tx, isLeft) => {
        this.ctx.save();
        this.ctx.translate(tx, mountY);

        // Hover bobbing float effect
        const bob = Math.sin(Date.now() / 140) * 1.5;

        // Glowing neon magenta aura behind crystal turret
        this.ctx.shadowColor = '#ff007f';
        this.ctx.shadowBlur = 18 * pulse;

        const tw = 30;
        const th = 56;

        if (this.images.turret && this.images.turret.complete && this.images.turret.naturalWidth !== 0) {
          this.ctx.drawImage(this.images.turret, -tw / 2, -th / 2 + bob, tw, th);
        } else {
          // Fallback crystal vector
          this.ctx.fillStyle = '#ff007f';
          this.ctx.beginPath();
          this.ctx.moveTo(0, -28 + bob);
          this.ctx.lineTo(14, 0 + bob);
          this.ctx.lineTo(0, 28 + bob);
          this.ctx.lineTo(-14, 0 + bob);
          this.ctx.closePath();
          this.ctx.fill();
        }

        this.ctx.restore();
      };

      drawTurret(leftX, true);
      drawTurret(rightX, false);
      this.ctx.restore();
    }

    // 3c. Draw Turret Bullets (Small Straight Laser with Magenta Pink Color)
    const LASER_DRAW_LENGTH = 28;
    for (const bullet of this.bullets) {
      this.ctx.save();
      const startY = bullet.y; // head/tip of laser
      const endY = bullet.y + LASER_DRAW_LENGTH; // tail of laser

      // Pass 1: Outer vivid neon magenta pink glow
      this.ctx.strokeStyle = '#ff007f';
      this.ctx.shadowColor = '#ff1493';
      this.ctx.shadowBlur = 14;
      this.ctx.lineWidth = 4;
      this.ctx.lineCap = 'butt';
      this.ctx.beginPath();
      this.ctx.moveTo(bullet.x, startY);
      this.ctx.lineTo(bullet.x, endY);
      this.ctx.stroke();

      // Pass 2: Intense vibrant magenta-pink beam
      this.ctx.strokeStyle = '#ff3399';
      this.ctx.shadowColor = '#ff007f';
      this.ctx.shadowBlur = 8;
      this.ctx.lineWidth = 2.4;
      this.ctx.beginPath();
      this.ctx.moveTo(bullet.x, startY);
      this.ctx.lineTo(bullet.x, endY);
      this.ctx.stroke();

      // Pass 3: Ultra-hot bright core (white-pink laser line)
      this.ctx.strokeStyle = '#fff0f6';
      this.ctx.shadowBlur = 0;
      this.ctx.lineWidth = 1.0;
      this.ctx.beginPath();
      this.ctx.moveTo(bullet.x, startY);
      this.ctx.lineTo(bullet.x, endY);
      this.ctx.stroke();

      // Small sharp laser energy tip
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#ff007f';
      this.ctx.shadowBlur = 6;
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, startY, 1.5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    // 3d. Draw Saori White Round Bullets
    for (const sb of this.saoriBullets) {
      this.ctx.save();
      this.ctx.shadowColor = '#ffffff';
      this.ctx.shadowBlur = 15;

      // Outer soft glowing aura
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      this.ctx.beginPath();
      this.ctx.arc(sb.x, sb.y, sb.radius + 3.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Middle bright white round body
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(sb.x, sb.y, sb.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Inner intense core
      this.ctx.fillStyle = '#f0ffff';
      this.ctx.beginPath();
      this.ctx.arc(sb.x, sb.y, sb.radius * 0.55, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }

    // 4. Draw Balls & Enhanced Cyber Comet Trails
    for (const ball of this.balls) {
      const isFire = ball.isFireBall && ball.fireHitsRemaining > 0;

      if (ball.trail.length > 1) {
        this.ctx.save();
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        const trail = ball.trail;
        const trailLen = trail.length;

        // Pass 1: Outer Neon Blue/Cyan Comet Glow (or Fiery Orange Blaze)
        this.ctx.shadowColor = isFire ? '#ff4500' : '#00f3ff';
        this.ctx.shadowBlur = isFire ? 18 : 12;
        for (let i = 0; i < trailLen; i++) {
          const p1 = trail[i];
          const p2 = (i === trailLen - 1) ? ball : trail[i + 1];
          const progress = (i + 1) / (trailLen + 1);
          const alpha = Math.pow(progress, 1.2) * (isFire ? 0.75 : 0.55);
          const width = ball.radius * (0.35 + 1.25 * progress);

          this.ctx.strokeStyle = isFire ? `rgba(255, 69, 0, ${alpha})` : `rgba(0, 243, 255, ${alpha})`;
          this.ctx.lineWidth = width;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }

        // Pass 2: Inner Laser Core (Hot White / Electric Cyan or Fiery Yellow-White)
        this.ctx.shadowBlur = isFire ? 8 : 5;
        for (let i = 0; i < trailLen; i++) {
          const p1 = trail[i];
          const p2 = (i === trailLen - 1) ? ball : trail[i + 1];
          const progress = (i + 1) / (trailLen + 1);
          const alpha = Math.pow(progress, 1.5) * 0.85;
          const width = ball.radius * (0.15 + 0.55 * progress);

          this.ctx.strokeStyle = isFire ? `rgba(255, 240, 180, ${alpha})` : `rgba(230, 255, 255, ${alpha})`;
          this.ctx.lineWidth = width;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }

        // Pass 3: Trailing Energy Motes (disable shadowBlur for fast drawing)
        this.ctx.shadowBlur = 0;
        for (let i = 0; i < trailLen; i += 2) {
          const pt = trail[i];
          const progress = (i + 1) / (trailLen + 1);
          const moteSize = Math.max(0.8, ball.radius * 0.3 * progress);
          const alpha = Math.pow(progress, 1.8) * 0.65;

          this.ctx.fillStyle = isFire ? `rgba(255, 140, 0, ${alpha})` : `rgba(0, 243, 255, ${alpha})`;
          this.ctx.beginPath();
          this.ctx.arc(pt.x, pt.y, moteSize, 0, Math.PI * 2);
          this.ctx.fill();
        }

        this.ctx.restore();
      }

      // Ball sprite with energetic neon halo
      this.ctx.save();
      this.ctx.shadowColor = isFire ? '#ff3b30' : '#00f3ff';
      this.ctx.shadowBlur = isFire ? 24 : 14;

      if (this.images.ball) {
        this.ctx.drawImage(
          this.images.ball,
          ball.x - ball.radius,
          ball.y - ball.radius,
          ball.radius * 2,
          ball.radius * 2
        );
      } else {
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();

      // Glowing magnet aura around the magnetized ball
      if (ball.hasMagnetEffect) {
        this.ctx.save();
        const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 80);
        this.ctx.strokeStyle = '#00f3ff';
        this.ctx.lineWidth = 2.5;
        this.ctx.shadowColor = '#00f3ff';
        this.ctx.shadowBlur = 12 * pulse;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius + 4, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
      }

      // Blazing Fire Ball corona & hits remaining counter
      if (isFire) {
        this.ctx.save();
        const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 60);
        // Outer fiery blaze ring
        this.ctx.shadowColor = '#ff3300';
        this.ctx.shadowBlur = 24 * pulse;
        this.ctx.strokeStyle = '#ff5500';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius + 3 * pulse, 0, Math.PI * 2);
        this.ctx.stroke();

        // Inner white-hot flame ring
        this.ctx.strokeStyle = '#ffea00';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius + 1, 0, Math.PI * 2);
        this.ctx.stroke();

        // Hits remaining indicator floating right above the ball
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ff2200';
        this.ctx.shadowBlur = 8;
        this.ctx.font = '8px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(`🔥x${ball.fireHitsRemaining}`, ball.x, ball.y - ball.radius - 4);

        this.ctx.restore();
      }

      // Soft neon pink anti-gravity pulse ring when falling in gravity field
      if (this.gravityField.active && ball.y >= GRAVITY_FIELD_Y && ball.vy > 0) {
        this.ctx.save();
        const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 70);
        this.ctx.shadowColor = '#ff69b4';
        this.ctx.shadowBlur = 14 * pulse;
        this.ctx.strokeStyle = 'rgba(255, 105, 180, 0.85)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([4, 4]);
        this.ctx.lineDashOffset = -Date.now() / 25;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius + 5 * pulse, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
      }

      // Glowing emerald wind cyclone ring when ball is propelled by Taiga wind
      if (ball.windTrailTimer > 0) {
        this.ctx.save();
        const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 60);
        const wAlpha = Math.min(1.0, ball.windTrailTimer / 0.4);
        this.ctx.globalAlpha = wAlpha;
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 18 * pulse;
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2.5;
        this.ctx.setLineDash([6, 4]);
        this.ctx.lineDashOffset = -Date.now() / 20;
        this.ctx.beginPath();
        this.ctx.arc(ball.x, ball.y, ball.radius + 6, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.restore();
      }
    }

    // 4b. Draw Falling & Bouncing Zero Heart (Zero Brick)
    for (const heart of this.hearts) {
      this.ctx.save();
      this.ctx.translate(heart.x, heart.y);

      const r = heart.radius || BALL_RADIUS;
      const diameter = r * 2;

      if (this.images.zero_heart && this.images.zero_heart.complete && this.images.zero_heart.naturalWidth !== 0) {
        this.ctx.drawImage(this.images.zero_heart, -r, -r, diameter, diameter);
      } else {
        // Fallback heart vector
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    // 4c. Draw Falling Containers (Sui Debuff Brick Effect - Spinning Dynamically)
    for (const c of this.containers) {
      this.ctx.save();
      this.ctx.translate(c.x + c.width / 2, c.y + c.height / 2);
      this.ctx.rotate(c.rotation || 0);

      // Red hazard glow
      this.ctx.shadowColor = '#ff2233';
      this.ctx.shadowBlur = 14;

      if (this.images.container && this.images.container.complete && this.images.container.naturalWidth !== 0) {
        this.ctx.drawImage(this.images.container, -c.width / 2, -c.height / 2, c.width, c.height);
      } else {
        this.ctx.fillStyle = '#ff2233';
        this.ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
      }
      this.ctx.restore();
    }

    // 4d. Draw Magata Nico Nico Douga Running Comments (blocks brick area)
    if (this.magataDebuff && this.magataDebuff.active && this.magataComments.length > 0) {
      this.drawMagataDanmaku();
    }

    // 5. Draw Particles (batched without per-particle context pushes)
    if (this.particles.length > 0) {
      this.ctx.save();
      for (let p = 0; p < this.particles.length; p++) {
        this.particles[p].draw(this.ctx);
      }
      this.ctx.restore();
    }

    // 6. Draw Floating Texts
    for (const text of this.floatingTexts) {
      text.draw(this.ctx);
    }

    // 6b. Draw Skill Cutin Banners (Stacking Buff / Debuff Cutin Banners)
    this.drawSkillCutins();

    // 7. Draw Jagged Animated Glowing Neon Light Blue Shield Line beneath player board
    if (this.shield.active) {
      this.ctx.save();
      const isEndingSoon = this.shield.timer <= 3.0;
      const shieldAlpha = isEndingSoon ? (Math.floor(this.shield.timer * 6) % 2 === 0 ? 0.35 : 1.0) : 1.0;
      const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 80);

      this.ctx.globalAlpha = shieldAlpha;

      // 1. Subtle straight baseline reference beam
      this.ctx.strokeStyle = '#00f3ff';
      this.ctx.lineWidth = 1.5;
      this.ctx.globalAlpha = shieldAlpha * 0.35;
      this.ctx.beginPath();
      this.ctx.moveTo(0, SHIELD_Y);
      this.ctx.lineTo(CANVAS_WIDTH, SHIELD_Y);
      this.ctx.stroke();

      // 2. Animated digital jagged pulse wave moving smoothly to the right
      const period = 220;
      const speed = 160; // px/sec to the right
      const offset = (Date.now() / 1000 * speed) % period;
      const stepHeight = 10;

      // Clip shield within canvas horizontal bounds
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(0, SHIELD_Y - 30, CANVAS_WIDTH, 60);
      this.ctx.clip();

      // Draw semi-transparent cyan filled rectangular pulse blocks matching design
      this.ctx.globalAlpha = shieldAlpha * (0.35 + 0.15 * pulse);
      this.ctx.fillStyle = '#00f3ff';
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 12 * pulse;
      for (let base = -period + offset - period; base <= CANVAS_WIDTH + period; base += period) {
        // Raised rectangular block
        this.ctx.fillRect(base + 40, SHIELD_Y - stepHeight, 45, stepHeight);
        // Lowered rectangular block
        this.ctx.fillRect(base + 115, SHIELD_Y, 45, stepHeight);
      }

      // Build continuous jagged waveform path
      const path = new Path2D();
      let started = false;

      for (let base = -period + offset - period; base <= CANVAS_WIDTH + period; base += period) {
        const p0 = base;
        const p1 = base + 40;
        const p2 = base + 85;
        const p3 = base + 115;
        const p4 = base + 160;
        const p5 = base + 220;

        if (!started) {
          path.moveTo(p0, SHIELD_Y);
          started = true;
        } else {
          path.lineTo(p0, SHIELD_Y);
        }

        path.lineTo(p1, SHIELD_Y);
        path.lineTo(p1, SHIELD_Y - stepHeight);
        path.lineTo(p2, SHIELD_Y - stepHeight);
        path.lineTo(p2, SHIELD_Y);
        path.lineTo(p3, SHIELD_Y);
        path.lineTo(p3, SHIELD_Y + stepHeight);
        path.lineTo(p4, SHIELD_Y + stepHeight);
        path.lineTo(p4, SHIELD_Y);
        path.lineTo(p5, SHIELD_Y);
      }

      this.ctx.globalAlpha = shieldAlpha;

      // Outer light blue neon glow
      this.ctx.strokeStyle = '#00f3ff';
      this.ctx.lineWidth = 5.5;
      this.ctx.shadowColor = '#00f3ff';
      this.ctx.shadowBlur = 20 * pulse + 6;
      this.ctx.stroke(path);

      // Middle bright cyan beam
      this.ctx.strokeStyle = '#66ffff';
      this.ctx.lineWidth = 2.8;
      this.ctx.stroke(path);

      // Inner intense laser core
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.4;
      this.ctx.stroke(path);

      this.ctx.restore(); // end clip
      this.ctx.restore();
    }

    // 8. Draw X-Blast Diagonal Laser Beams
    for (const beam of this.xBeams) {
      this.ctx.save();
      const progress = Math.max(0, beam.timer / beam.duration);
      const alpha = Math.pow(progress, 0.7);
      const width = 12 * alpha + 2;
      const diagLen = 1600;

      this.ctx.globalAlpha = alpha;
      this.ctx.shadowColor = '#bf00ff';
      this.ctx.shadowBlur = 28;

      // Diagonal 1: top-left to bottom-right (\)
      // Diagonal 2: bottom-left to top-right (/)
      this.ctx.strokeStyle = '#bf00ff';
      this.ctx.lineWidth = width + 6;
      this.ctx.beginPath();
      this.ctx.moveTo(beam.cx - diagLen, beam.cy - diagLen);
      this.ctx.lineTo(beam.cx + diagLen, beam.cy + diagLen);
      this.ctx.moveTo(beam.cx - diagLen, beam.cy + diagLen);
      this.ctx.lineTo(beam.cx + diagLen, beam.cy - diagLen);
      this.ctx.stroke();

      // Middle bright magenta/purple beam
      this.ctx.strokeStyle = '#e066ff';
      this.ctx.lineWidth = width + 2;
      this.ctx.beginPath();
      this.ctx.moveTo(beam.cx - diagLen, beam.cy - diagLen);
      this.ctx.lineTo(beam.cx + diagLen, beam.cy + diagLen);
      this.ctx.moveTo(beam.cx - diagLen, beam.cy + diagLen);
      this.ctx.lineTo(beam.cx + diagLen, beam.cy - diagLen);
      this.ctx.stroke();

      // White-hot core
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = Math.max(1, width * 0.35);
      this.ctx.beginPath();
      this.ctx.moveTo(beam.cx - diagLen, beam.cy - diagLen);
      this.ctx.lineTo(beam.cx + diagLen, beam.cy + diagLen);
      this.ctx.moveTo(beam.cx - diagLen, beam.cy + diagLen);
      this.ctx.lineTo(beam.cx + diagLen, beam.cy - diagLen);
      this.ctx.stroke();

      this.ctx.restore();
    }

    // 9. Draw + Blast (Cross/Plus) Fiery Laser Beams
    for (const beam of this.plusBeams) {
      this.ctx.save();
      const progress = Math.max(0, beam.timer / beam.duration);
      const alpha = Math.pow(progress, 0.7);
      const width = 12 * alpha + 2;

      this.ctx.globalAlpha = alpha;
      this.ctx.shadowColor = '#ff3300';
      this.ctx.shadowBlur = 28;

      // Outer fiery red beam (Horizontal across width, Vertical across height)
      this.ctx.strokeStyle = '#ff3300';
      this.ctx.lineWidth = width + 6;
      this.ctx.beginPath();
      // Horizontal
      this.ctx.moveTo(0, beam.cy);
      this.ctx.lineTo(CANVAS_WIDTH, beam.cy);
      // Vertical
      this.ctx.moveTo(beam.cx, HEADER_HEIGHT);
      this.ctx.lineTo(beam.cx, CANVAS_HEIGHT);
      this.ctx.stroke();

      // Middle bright orange beam
      this.ctx.strokeStyle = '#ffa500';
      this.ctx.lineWidth = width + 2;
      this.ctx.beginPath();
      this.ctx.moveTo(0, beam.cy);
      this.ctx.lineTo(CANVAS_WIDTH, beam.cy);
      this.ctx.moveTo(beam.cx, HEADER_HEIGHT);
      this.ctx.lineTo(beam.cx, CANVAS_HEIGHT);
      this.ctx.stroke();

      // White-hot core
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = Math.max(1, width * 0.35);
      this.ctx.beginPath();
      this.ctx.moveTo(0, beam.cy);
      this.ctx.lineTo(CANVAS_WIDTH, beam.cy);
      this.ctx.moveTo(beam.cx, HEADER_HEIGHT);
      this.ctx.lineTo(beam.cx, CANVAS_HEIGHT);
      this.ctx.stroke();

      this.ctx.restore();
    }

    // 9b. Draw Jumping Bricks (Manami)
    for (const jb of this.jumpingBricks) {
      const t = Math.min(1, jb.progress);
      const destX = jb.targetBrick ? jb.targetBrick.x : jb.targetX;
      const destY = jb.targetBrick ? jb.targetBrick.y : jb.targetY;
      const groundX = jb.startX + (destX - jb.startX) * t + jb.width / 2;
      const groundY = jb.startY + (destY - jb.startY) * t + jb.height / 2;
      const currX = groundX;
      const currY = groundY - Math.sin(t * Math.PI) * jb.peakHeight;

      // Draw ground shadow ellipse (scales with altitude)
      const altitude = Math.sin(t * Math.PI);
      const shadowScale = 1 - 0.4 * altitude;
      this.ctx.save();
      this.ctx.globalAlpha = 0.35 * shadowScale;
      this.ctx.fillStyle = '#110022';
      this.ctx.beginPath();
      this.ctx.ellipse(groundX, groundY + jb.height * 0.3, (jb.width * 0.45) * shadowScale, (jb.height * 0.22) * shadowScale, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      // Draw jumping Manami brick in mid-air
      this.ctx.save();
      this.ctx.translate(currX, currY);

      // Spin 360 degrees during the jump
      const rotation = t * Math.PI * 2;
      this.ctx.rotate(rotation);

      // Pop slightly larger at apex of jump
      const popScale = 1 + 0.25 * altitude;
      this.ctx.scale(popScale, popScale);

      // Glowing orchid aura around the flying brick
      this.ctx.shadowColor = '#f368e0';
      this.ctx.shadowBlur = 18;

      if (this.images.brick_manami && this.images.brick_manami.complete && this.images.brick_manami.naturalWidth !== 0) {
        this.ctx.drawImage(this.images.brick_manami, -jb.width / 2, -jb.height / 2, jb.width, jb.height);
      } else {
        this.ctx.fillStyle = '#f368e0';
        this.ctx.fillRect(-jb.width / 2, -jb.height / 2, jb.width, jb.height);
      }

      this.ctx.restore();
    }

    // 10. Draw Red Corner Vignette when Debuff Brick Effect is Active (Ichinose, Akuta Shortened Bat, Sui Container Rain, Sui Heavy Slow, Magata Danmaku, Ruriiro Illusion)
    const isPointDebuffActive = this.pointDebuff && this.pointDebuff.active;
    const isBatShortened = Boolean(this.bat && this.bat.isShortened);
    const isSuiRainActive = this.suiContainerRain && this.suiContainerRain.active;
    const isSlowActive = this.boardSlowDebuff && this.boardSlowDebuff.active;
    const isMagataActive = this.magataDebuff && this.magataDebuff.active;
    const isRuriiroActive = this.ruriiroDebuff && this.ruriiroDebuff.active;

    if (isPointDebuffActive || isBatShortened || isSuiRainActive || isSlowActive || isMagataActive || isRuriiroActive) {
      this.ctx.save();
      const pulse = 0.82 + 0.18 * Math.sin(Date.now() / 140);

      // Check ending blink: if any active debuff is in its final 3 seconds
      let minTimer = Infinity;
      if (isPointDebuffActive) minTimer = Math.min(minTimer, this.pointDebuff.timer);
      if (isBatShortened && this.bat.shortenedTimer) minTimer = Math.min(minTimer, this.bat.shortenedTimer);
      if (isSuiRainActive) minTimer = Math.min(minTimer, this.suiContainerRain.timer);
      if (isSlowActive) minTimer = Math.min(minTimer, this.boardSlowDebuff.timer);
      if (isMagataActive) minTimer = Math.min(minTimer, this.magataDebuff.timer);

      const isEnding = minTimer <= 3.0;
      const debuffAlpha = (isEnding ? (Math.floor(minTimer * 6) % 2 === 0 ? 0.35 : 1.0) : 1.0) * pulse;

      this.ctx.globalAlpha = debuffAlpha;
      const isPinkOnly = isMagataActive && !isPointDebuffActive && !isBatShortened && !isSuiRainActive && !isSlowActive && !isRuriiroActive;
      const vignette = isPinkOnly ? this.cachedPinkVignette : this.cachedRedVignette;
      if (vignette) {
        this.ctx.drawImage(vignette, 0, 0);
      }

      this.ctx.restore();
    }

    // 11. Haru Slow Motion harmonic resonance border aura
    if (this.haruSlowMotion && this.haruSlowMotion.active) {
      this.ctx.save();
      const progress = this.haruSlowMotion.timer / this.haruSlowMotion.duration;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 90);
      this.ctx.strokeStyle = `rgba(0, 229, 255, ${0.45 * progress * pulse})`;
      this.ctx.lineWidth = 4;
      this.ctx.shadowColor = '#00e5ff';
      this.ctx.shadowBlur = 14;
      this.ctx.strokeRect(3, HEADER_HEIGHT + 3, CANVAS_WIDTH - 6, CANVAS_HEIGHT - HEADER_HEIGHT - 6);
      this.ctx.restore();
    }
  }

  // Render Nico Nico Douga running comments blocking the brick playfield area
  drawMagataDanmaku() {
    this.ctx.save();

    // Clip strictly to the brick playfield area (HEADER_HEIGHT down to above the paddle board area)
    this.ctx.beginPath();
    this.ctx.rect(0, HEADER_HEIGHT, CANVAS_WIDTH, BAT_Y - HEADER_HEIGHT - 35);
    this.ctx.clip();

    // 1. Draw regular background running comments (Nico Nico Douga text with black outline)
    for (const c of this.magataComments) {
      if (c.standout) continue;

      this.ctx.font = `900 ${c.size}px "Impact", "Hiragino Kaku Gothic Pro", "Meiryo", "Arial Black", sans-serif`;
      if (!c.width) {
        c.width = this.ctx.measureText(c.text).width;
      }

      this.ctx.lineWidth = Math.max(3, c.size * 0.12);
      this.ctx.strokeStyle = '#000000';
      this.ctx.strokeText(c.text, c.x, c.y);

      this.ctx.fillStyle = c.color || '#ffffff';
      this.ctx.fillText(c.text, c.x, c.y);
    }

    // 2. Draw standout "MA☆GA☆TA" comment ON TOP of all other comments in neon pink, moving very slowly!
    for (const c of this.magataComments) {
      if (!c.standout) continue;

      this.ctx.save();
      this.ctx.font = `900 ${c.size}px "Impact", "Hiragino Kaku Gothic Pro", "Meiryo", "Arial Black", sans-serif`;
      if (!c.width) {
        c.width = this.ctx.measureText(c.text).width;
      }

      const pulse = 0.85 + 0.15 * Math.sin(Date.now() / 80);
      this.ctx.shadowColor = '#ff007f';
      this.ctx.shadowBlur = 24 * pulse;

      // Dark pink outline
      this.ctx.lineWidth = Math.max(5, c.size * 0.16);
      this.ctx.strokeStyle = '#280014';
      this.ctx.strokeText(c.text, c.x, c.y);

      // Neon pink fill
      this.ctx.fillStyle = c.color || '#ff007f';
      this.ctx.fillText(c.text, c.x, c.y);

      // Bright inner shine
      this.ctx.lineWidth = 1.6;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.strokeText(c.text, c.x, c.y);

      this.ctx.restore();
    }

    this.ctx.restore();
  }

  // --- Main Loop ---
  requestFrame() {
    const loop = (currentTime) => {
      // Always schedule next frame first so game loop NEVER halts
      requestAnimationFrame(loop);

      const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      try {
        this.update(dt);
        this.draw();
      } catch (err) {
        console.error('Game loop error:', err);
      }
    };
    requestAnimationFrame(loop);
  }
}

// Instantiate game upon DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.game = new BrickBreakerGame();
});
