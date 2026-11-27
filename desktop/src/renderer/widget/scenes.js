// 던전 전투 장면(캔버스). 필드 보스·레이드 = 여러 용사 vs 큰 보스, 요일 던전 = 용사 vs 몬스터 행렬 + 보석.
// 좌표는 장치 픽셀. S = 도트 1칸의 장치 픽셀 수(정수)라 어떤 화면에서도 도트가 또렷하다.
import { heroSprite, gearFrom, bossSprite, monsterSprite, spriteCanvas, silhouette } from '../shared/sprite-canvas.js';
import { GEM_ROWS, gemPalette } from '../../shared/sprites.js';
import { GEMS } from '../../core/constants.js';

const FONT = "'Galmuri11', 'Malgun Gothic', sans-serif";
const rand = (a, b) => a + Math.random() * (b - a);

class Stage {
  constructor(canvas, { onTap } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.texts = [];
    this.parts = [];
    this.shake = 0;
    this.t = 0;
    this.running = false;
    this.onTap = onTap;
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    canvas.addEventListener('pointerdown', (e) => {
      if (!this.onTap) return;
      const r = canvas.getBoundingClientRect();
      this.onTap((e.clientX - r.left) * this.dpr, (e.clientY - r.top) * this.dpr);
    });
  }

  resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const r = this.canvas.getBoundingClientRect();
    this.dpr = dpr;
    this.S = Math.max(1, Math.round(2 * dpr));
    this.W = this.canvas.width = Math.max(1, Math.round(r.width * dpr));
    this.H = this.canvas.height = Math.max(1, Math.round(r.height * dpr));
    if (this.layout) this.layout();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      if (!this.canvas.isConnected) { this.stop(); return; }
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.t += dt;
      this.update(dt);
      this.stepFx(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.ro) this.ro.disconnect();
  }

  float(text, x, y, { color = '#ffffff', size = 1, life = 0.9, vy = -60 } = {}) {
    this.texts.push({ text, x, y, color, size, life, t: 0, vy: vy * this.dpr });
    if (this.texts.length > 40) this.texts.shift();
  }

  burst(x, y, color, n = 10, speed = 90) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const v = rand(0.4, 1) * speed * this.dpr;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40 * this.dpr, color, t: 0, life: rand(0.4, 0.8) });
    }
    if (this.parts.length > 160) this.parts.splice(0, this.parts.length - 160);
  }

  stepFx(dt) {
    for (const p of this.parts) {
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * this.dpr * dt;
    }
    this.parts = this.parts.filter((p) => p.t < p.life);
    for (const t of this.texts) {
      t.t += dt;
      t.y += t.vy * dt;
      t.vy *= 0.92;
    }
    this.texts = this.texts.filter((t) => t.t < t.life);
    this.shake = Math.max(0, this.shake - dt * 3);
  }

  drawFx() {
    const { ctx, S } = this;
    for (const p of this.parts) {
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), S, S);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    for (const t of this.texts) {
      const px = Math.round(11 * Math.max(1, Math.round(this.dpr)) * t.size);
      ctx.font = `${px}px ${FONT}`;
      ctx.globalAlpha = Math.min(1, 2.2 * (1 - t.t / t.life));
      ctx.lineWidth = Math.max(2, Math.round(px / 4));
      ctx.strokeStyle = '#1a1423';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  background(theme) {
    const { ctx, W, H } = this;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // 별·먼지
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 18; i++) {
      const x = (i * 97 + 13) % W;
      const y = ((i * 53 + 7) % Math.max(1, this.groundY * 0.6));
      if ((i + Math.floor(this.t * 2)) % 7) ctx.fillRect(x, y, this.S, this.S);
    }
    ctx.fillStyle = theme.ground;
    ctx.fillRect(0, this.groundY, W, H - this.groundY);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, this.groundY, W, this.S);
  }

  img(img, x, y, scale = 1) {
    this.ctx.drawImage(img, Math.round(x), Math.round(y), img.width * scale, img.height * scale);
  }
}

/* ── 보스전 (필드 보스·레이드) ─────────────────────────────── */

export class BossScene extends Stage {
  /**
   * @param {{ boss: { color, crown, horns }, allies: Array<{ id, gear, isMe, front }>, theme, onTap }} opts
   */
  constructor(canvas, opts) {
    super(canvas, opts);
    this.boss = opts.boss;
    this.theme = opts.theme;
    this.allies = opts.allies.map((a, i) => ({
      ...a,
      gear: gearFrom(a.gear),
      phase: rand(0, 2),
      atk: rand(1.1, 2.2),
      atkT: rand(0, 2),
      i,
    }));
    this.bossHurt = 0;
    this.bossDead = false;
    this.layout();
  }

  layout() {
    const { W, H, S } = this;
    if (!this.allies) return;
    this.groundY = H - 10 * S;
    this.B = Math.max(S * 2, Math.floor(Math.min((W * 0.4) / 18, (H * 0.62) / 18)));
    this.bossX = W - 18 * this.B - 4 * S;
    this.bossY = this.groundY - 18 * this.B + 2 * this.B;
    const front = this.allies.filter((a) => a.front);
    const crowd = this.allies.filter((a) => !a.front);
    const cs = Math.max(1, Math.floor(S / 2));
    const spanX = Math.max(32 * cs, this.bossX - 40 * S);
    crowd.forEach((a, k) => {
      const row = k % 3;
      const col = Math.floor(k / 3);
      const cols = Math.max(1, Math.ceil(crowd.length / 3));
      a.scale = cs;
      a.x = 2 * S + (col / Math.max(1, cols - 1)) * Math.max(0, spanX - 32 * cs) + (row % 2) * 6 * cs;
      a.y = this.groundY - 24 * cs - (2 - row) * 9 * cs - 14 * S;
    });
    front.forEach((a, k) => {
      a.scale = S;
      a.x = this.bossX - (34 + (k % 2) * 16 + Math.floor(k / 2) * 30) * S;
      a.y = this.groundY - 24 * S + (k % 2) * 3 * S - 2 * S;
    });
    // 뒤쪽(위)부터 그리도록
    this.drawOrder = [...this.allies].sort((a, b) => a.y - b.y);
  }

  bossCenter() {
    return { x: this.bossX + 9 * this.B, y: this.bossY + 11 * this.B };
  }

  /** 피해 숫자 연출. mine=true 면 크게, big=true 면 화면 흔들림 */
  hit(amount, { mine = false, big = false, color } = {}) {
    if (this.bossDead) return;
    const c = this.bossCenter();
    const txt = Math.round(amount).toLocaleString('ko-KR');
    this.float(big ? `${txt}!` : txt, c.x + rand(-7, 7) * this.B, c.y - rand(4, 9) * this.B, {
      color: color || (mine ? (big ? '#ffd447' : '#ffffff') : '#c9c3dd'),
      size: big ? 2 : mine ? 1.4 : 1,
      life: big ? 1.3 : 0.9,
    });
    if (mine || big) {
      this.bossHurt = 0.18;
      this.burst(c.x + rand(-4, 4) * this.B, c.y + rand(-3, 3) * this.B, big ? '#ffd447' : '#ffffff', big ? 22 : 8, big ? 160 : 90);
    }
    if (big) this.shake = 0.6;
  }

  defeat() {
    if (this.bossDead) return;
    this.bossDead = true;
    this.deadT = 0;
    const c = this.bossCenter();
    for (let i = 0; i < 4; i++) this.burst(c.x + rand(-6, 6) * this.B, c.y + rand(-5, 5) * this.B, ['#ffd447', '#ffffff', '#ff8a5c'][i % 3], 24, 220);
    this.shake = 1;
  }

  update(dt) {
    this.bossHurt = Math.max(0, this.bossHurt - dt);
    if (this.bossDead) this.deadT += dt;
    for (const a of this.allies) {
      a.atkT += dt;
      if (!this.bossDead && a.atkT > a.atk) {
        a.atkT = 0;
        a.swing = 0.36;
        if (a.front) {
          const c = this.bossCenter();
          this.burst(c.x - 7 * this.B, c.y + rand(-4, 4) * this.B, '#ffffff', 3, 60);
        }
      }
      if (a.swing) a.swing = Math.max(0, a.swing - dt);
    }
  }

  render() {
    const { ctx, S } = this;
    ctx.save();
    if (this.shake) ctx.translate(Math.round(rand(-1, 1) * this.shake * 3 * S), Math.round(rand(-1, 1) * this.shake * 2 * S));
    ctx.imageSmoothingEnabled = false;
    this.background(this.theme);
    // 보스
    const tick = Math.floor(this.t * 10);
    if (!this.bossDead || this.deadT < 0.9) {
      const frame = this.bossHurt > 0 ? 'hurt' : (Math.floor(this.t * 2) % 2 ? 'squash' : 'idle');
      const spr = bossSprite(this.boss.color, { crown: this.boss.crown, horns: this.boss.horns, frame, tick });
      ctx.globalAlpha = this.bossDead ? Math.max(0, 1 - this.deadT / 0.9) : 1;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(this.bossX + 2 * this.B, this.groundY - this.B, 14 * this.B, this.B);
      this.img(this.bossHurt > 0.1 ? silhouette(spr, '#ffffff') : spr, this.bossX, this.bossY, this.B);
      ctx.globalAlpha = 1;
    }
    // 용사들
    for (const a of this.drawOrder) {
      const bob = Math.floor((this.t + a.phase) * 2.5) % 2;
      const pose = a.swing ? (a.swing > 0.24 ? 'atk0' : a.swing > 0.12 ? 'atk1' : 'atk2') : bob ? 'idle1' : 'idle0';
      const spr = heroSprite(pose, a.gear, a.scale);
      if (!a.front) ctx.globalAlpha = 0.9;
      this.img(spr, a.x, a.y);
      ctx.globalAlpha = 1;
      if (a.isMe) {
        ctx.fillStyle = '#7fe3ff';
        const cx = a.x + 16 * a.scale;
        const ty = a.y + 2 * a.scale - (Math.floor(this.t * 3) % 2) * S;
        ctx.fillRect(cx - S, ty, 3 * S, S);
        ctx.fillRect(cx, ty + S, S, S);
      }
    }
    this.drawFx();
    ctx.restore();
  }
}

/* ── 요일 던전 (사냥) ─────────────────────────────── */

export class HuntScene extends Stage {
  /** @param {{ gear, monster, gems: string[], theme, active: boolean }} opts */
  constructor(canvas, opts) {
    super(canvas, opts);
    this.gear = gearFrom(opts.gear);
    this.monster = opts.monster;
    this.gemKeys = opts.gems;
    this.theme = opts.theme;
    this.active = opts.active;
    this.mobs = [];
    this.flying = [];
    this.spawnT = 0.4;
    this.swing = 0;
    this.layout();
  }

  layout() {
    const { W, H, S } = this;
    this.groundY = H - 10 * S;
    this.heroX = Math.round(W * 0.18);
    this.heroY = this.groundY - 24 * S;
    this.gemTarget = { x: 14 * S, y: 10 * S };
  }

  setActive(v) {
    this.active = v;
  }

  update(dt) {
    const { S, W } = this;
    if (this.active) {
      this.spawnT -= dt;
      if (this.spawnT <= 0 && this.mobs.length < 3) {
        this.spawnT = rand(1.4, 2.4);
        this.mobs.push({ x: W + 4 * S, hp: 3, hurt: 0, dead: 0, hop: rand(0, 1) });
      }
    }
    this.swing = Math.max(0, this.swing - dt);
    const reach = this.heroX + 30 * S;
    for (const m of this.mobs) {
      m.hurt = Math.max(0, m.hurt - dt);
      if (m.dead) { m.dead += dt; continue; }
      const front = this.mobs.filter((o) => !o.dead && o.x < m.x).length;
      const stopAt = reach + front * 20 * S;
      if (m.x > stopAt) m.x -= 34 * S * dt;
      else if (this.swing === 0 && front === 0 && this.active) {
        this.swing = 0.36;
        m.hp -= 1;
        m.hurt = 0.2;
        this.float(String(Math.round(rand(8, 24))), m.x + 9 * S, this.groundY - 14 * S, { color: '#ffffff' });
        if (m.hp <= 0) {
          m.dead = 0.001;
          this.burst(m.x + 9 * S, this.groundY - 6 * S, '#ffffff', 12, 100);
          const key = this.gemKeys[Math.floor(Math.random() * this.gemKeys.length)];
          this.flying.push({ key, x: m.x + 9 * S, y: this.groundY - 10 * S, vx: rand(-30, 30) * this.dpr, vy: -160 * this.dpr, t: 0 });
        }
      }
    }
    this.mobs = this.mobs.filter((m) => !m.dead || m.dead < 0.5);
    for (const g of this.flying) {
      g.t += dt;
      if (g.t < 0.5) {
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        g.vy += 400 * this.dpr * dt;
      } else {
        g.x += (this.gemTarget.x - g.x) * Math.min(1, dt * 7);
        g.y += (this.gemTarget.y - g.y) * Math.min(1, dt * 7);
      }
    }
    this.flying = this.flying.filter((g) => g.t < 1.2);
  }

  render() {
    const { ctx, S } = this;
    ctx.imageSmoothingEnabled = false;
    this.background(this.theme);
    const tick = Math.floor(this.t * 10);
    for (const m of this.mobs) {
      const frame = m.hurt ? 'hurt' : Math.floor(this.t * 3 + m.hop * 3) % 2 ? 'squash' : 'idle';
      const spr = monsterSprite(this.monster, frame, tick);
      ctx.globalAlpha = m.dead ? Math.max(0, 1 - m.dead * 2) : 1;
      this.img(m.hurt > 0.1 ? silhouette(spr, '#ffffff') : spr, m.x, this.groundY - 12 * S, S);
      ctx.globalAlpha = 1;
    }
    const bob = Math.floor(this.t * 2.5) % 2;
    const pose = this.swing ? (this.swing > 0.24 ? 'atk0' : this.swing > 0.12 ? 'atk1' : 'atk2') : !this.active ? 'idle0' : bob ? 'walk0' : 'walk1';
    this.img(heroSprite(pose, this.gear, S), this.heroX, this.heroY);
    for (const g of this.flying) {
      const spr = spriteCanvas(GEM_ROWS, gemPalette(GEMS[g.key]), { key: `gem:${g.key}` });
      this.img(spr, g.x - 5 * S, g.y - 5 * S, S);
    }
    this.drawFx();
  }
}
