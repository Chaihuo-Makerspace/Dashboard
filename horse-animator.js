'use strict';
// horse-animator.js
// Canvas overlay: horse-shaped path + clockwise golden particle animation

class HorseAnimator {
  // [lng, lat] waypoints tracing a galloping horse outline, clockwise from nose.
  // Horse faces left (west). Head near Xinjiang, back across Inner Mongolia,
  // tail in northeast, hind hooves near Guangdong, front hooves near Tibet/Sichuan.
  static HORSE_PATH = [
    // ─── NOSE (leftmost, eastern Xinjiang) ───
    [83.0, 42.0],

    // ─── JAW / CHIN ───
    [83.0, 40.0],
    [83.5, 38.5],

    // ─── NECK FRONT / CHEST ───
    [84.5, 37.0],
    [86.0, 35.5],
    [87.0, 34.0],

    // ─── FRONT LEG 1 (galloping forward/southwest) ───
    [87.5, 31.5],
    [88.5, 29.0],
    [89.5, 26.5],
    [91.0, 24.5],

    // ─── FRONT HOOF 1 ───
    [92.0, 23.0],
    [93.5, 22.0],
    [95.5, 22.5],
    [96.5, 24.0],
    [96.5, 27.0],

    // ─── STEP BETWEEN FRONT LEGS ───
    [97.5, 29.5],

    // ─── FRONT LEG 2 (slightly behind, galloping) ───
    [99.0, 27.5],
    [100.0, 25.5],
    [101.0, 23.5],

    // ─── FRONT HOOF 2 ───
    [102.5, 22.0],
    [104.0, 22.5],
    [104.5, 24.5],
    [104.5, 28.0],

    // ─── BELLY (running east) ───
    [106.5, 29.5],
    [109.5, 29.5],
    [112.5, 30.0],

    // ─── HIND LEG 1 (inner, going down) ───
    [114.5, 32.0],
    [115.0, 28.5],
    [114.5, 25.5],
    [113.5, 23.0],

    // ─── HIND HOOF 1 (near Guangdong/深圳) ───
    [113.0, 22.0],
    [114.5, 22.0],
    [115.0, 23.5],
    [115.0, 27.5],

    // ─── STEP BETWEEN HIND LEGS ───
    [116.5, 30.5],

    // ─── HIND LEG 2 (outer) ───
    [117.5, 28.0],
    [118.0, 25.5],
    [117.5, 23.0],

    // ─── HIND HOOF 2 ───
    [116.5, 22.0],
    [118.0, 22.0],
    [118.5, 23.5],
    [119.0, 27.0],
    [119.5, 31.0],

    // ─── RUMP / HINDQUARTERS ───
    [120.5, 35.0],
    [121.0, 39.5],
    [121.5, 42.0],

    // ─── TAIL BASE ───
    [122.5, 43.5],
    [124.5, 45.0],

    // ─── TAIL (curving northeast toward 大庆) ───
    [126.5, 47.0],
    [128.5, 49.0],
    [129.5, 49.5],

    // ─── TAIL BACK SIDE ───
    [130.5, 48.5],
    [129.0, 47.5],
    [127.0, 46.0],
    [125.0, 44.5],
    [123.5, 44.0],

    // ─── BACK / TOPLINE (running west along Inner Mongolia) ───
    [121.0, 44.0],
    [117.0, 44.0],
    [113.0, 44.0],
    [109.0, 44.0],
    [105.0, 43.5],
    [101.0, 43.5],
    [97.0,  43.5],

    // ─── WITHERS / NECK TOP ───
    [93.0, 43.5],
    [90.0, 43.5],

    // ─── POLL (top of head) ───
    [88.0, 44.5],

    // ─── RIGHT EAR (horse's left ear) ───
    [88.5, 46.0],
    [87.5, 48.5],
    [86.0, 47.5],

    // ─── LEFT EAR (horse's right ear) ───
    [84.5, 48.5],
    [83.5, 47.0],

    // ─── FOREHEAD → NOSE BRIDGE → close ───
    [83.0, 45.5],
    [83.0, 44.0],
    [83.0, 42.0],
  ];

  static PARTICLE_COUNT = 12;
  static SPEED = 0.04;          // ~25 s per revolution, slow and elegant
  static TRAIL_STEPS = 5;
  static TRAIL_SPACING = 0.012;

  constructor(chart, canvas) {
    this.chart = chart;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelPath = [];
    this.pathLengths = [];
    this.totalLength = 0;
    this.particles = Array.from({ length: HorseAnimator.PARTICLE_COUNT },
      (_, i) => ({ t: i / HorseAnimator.PARTICLE_COUNT }));
    this.lastTime = null;
    this._rafId = null;
  }

  computePixelPath() {
    this.pixelPath = HorseAnimator.HORSE_PATH
      .map(p => this.chart.convertToPixel('geo', p))
      .filter(p => p && Number.isFinite(p[0]) && Number.isFinite(p[1]));

    let total = 0;
    this.pathLengths = [0];
    for (let i = 1; i < this.pixelPath.length; i++) {
      const dx = this.pixelPath[i][0] - this.pixelPath[i - 1][0];
      const dy = this.pixelPath[i][1] - this.pixelPath[i - 1][1];
      total += Math.hypot(dx, dy);
      this.pathLengths.push(total);
    }
    this.totalLength = total;
  }

  _getPoint(t) {
    const target = (((t % 1) + 1) % 1) * this.totalLength;
    let lo = 0, hi = this.pathLengths.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      this.pathLengths[mid] <= target ? (lo = mid) : (hi = mid);
    }
    const seg = this.pathLengths[hi] - this.pathLengths[lo];
    const alpha = seg > 0 ? (target - this.pathLengths[lo]) / seg : 0;
    const a = this.pixelPath[lo];
    const b = this.pixelPath[Math.min(hi, this.pixelPath.length - 1)] || a;
    return [a[0] + alpha * (b[0] - a[0]), a[1] + alpha * (b[1] - a[1])];
  }

  _draw(ts) {
    if (!this.lastTime) this.lastTime = ts;
    const dt = Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;

    const { canvas, ctx } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!this.pixelPath.length || this.totalLength === 0) {
      this._rafId = requestAnimationFrame(t => this._draw(t));
      return;
    }

    // Horse outline
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 200, 0, 0.30)';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(255, 180, 0, 0.25)';
    ctx.beginPath();
    this.pixelPath.forEach(([x, y], i) =>
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    );
    ctx.stroke();
    ctx.restore();

    // Particles with trailing glow
    const { SPEED, TRAIL_STEPS, TRAIL_SPACING } = HorseAnimator;
    this.particles.forEach(p => {
      p.t = (p.t + SPEED * dt) % 1;
      for (let j = TRAIL_STEPS - 1; j >= 0; j--) {
        const [x, y] = this._getPoint(p.t - j * TRAIL_SPACING);
        const alpha = (1 - j / TRAIL_STEPS) * (j === 0 ? 0.95 : 0.50);
        const r = Math.max(0.5, j === 0 ? 3 : 3 - j * 0.45);
        ctx.save();
        if (j === 0) { ctx.shadowBlur = 10; ctx.shadowColor = '#FFD700'; }
        ctx.fillStyle = `rgba(255, ${Math.round(175 + j * 8)}, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    this._rafId = requestAnimationFrame(t => this._draw(t));
  }

  start() {
    this._rafId = requestAnimationFrame(t => this._draw(t));
  }

  stop() {
    cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }
}

window.HorseAnimator = HorseAnimator;
