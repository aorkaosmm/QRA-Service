// 작업표시줄 전투: 용사가 작업표시줄 위를 걸으며 슬라임과 싸운다.
// 피격 시 뒤로 튕겨 나가고(넉백) 머리 위로 데미지 숫자가 떠오른다. 임무 보상은 하늘에서 상자로 떨어진다.
import { resolveApi } from '../shared/api.js';
import { heroStats } from '../../core/progression.js';
import { BATTLE } from '../../core/constants.js';
import { dayKey, timeToMinutes } from '../../core/dates.js';
import { dailiesForDay, isDailyDone, timedItemsForDay } from '../../core/selectors.js';
import {
  composeHero, SLIME_FRAMES, SLIME_COLORS, CROWN, CROWN_PALETTE, CHEST_CLOSED, CHEST_OPEN,
  CHEST_PALETTE, CHEST_GOLD_PALETTE, COIN_FRAMES, COIN_PALETTE, FONT_3X5, INK, ITEM_ICONS,
  itemIconPalette, GEAR_COLORS,
} from '../../shared/sprites.js';
import { spriteCanvas, silhouette, gearSig } from '../shared/sprite-canvas.js';
import { setSoundEnabled, sfx } from '../shared/sfx.js';

const CSS_PX = 3; // 도트 1칸 = CSS 3px
const GRAVITY = 560; // 도트/초²
const HERO_SPEED = 30;
const RARITY_COLOR = { common: '#d6dae2', rare: '#4aa8ff', epic: '#c07bff', legendary: '#ffb52e' };

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
let S = 3; // 기기 픽셀 / 도트
let W = 400; // 도트 단위 폭
let H = 50;
let dpr = 1;

const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const game = {
  api: null,
  state: null,
  stats: null,
  gear: {},
  gearKey: '',
  hero: null,
  slimes: [],
  coins: [],
  chests: [],
  particles: [],
  texts: [],
  labels: [],
  bubble: null,
  spawnT: 2.5,
  kills: 0,
  kingEvery: 20,
  shake: 0,
  flash: 0,
  flashColor: '#ffffff',
  pending: { kills: 0, kings: 0, coins: 0, faints: 0 },
  reportT: 5,
  hover: null,
  ignoring: true,
  chatterT: rand(90, 160),
  time: 0,
};

/* ───────────── 화면 크기 ───────────── */

function resize() {
  dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
  canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  S = Math.max(1, Math.round(CSS_PX * dpr));
  W = Math.ceil(canvas.width / S);
  H = Math.ceil(canvas.height / S);
  if (game.hero) game.hero.x = clamp(game.hero.x, 8, W - 8);
}

/* ───────────── 스프라이트 ───────────── */

function heroSprite(pose, flip, white = false) {
  const key = `bh:${pose}:${game.gearKey}`;
  const c = composeHero(pose, game.gear);
  const spr = spriteCanvas(c.rows, c.palette, { flip, key });
  if (!white) return spr;
  const wk = `${key}|${flip}|white`;
  if (!heroSprite.white) heroSprite.white = new Map();
  if (!heroSprite.white.has(wk)) heroSprite.white.set(wk, silhouette(spr));
  return heroSprite.white.get(wk);
}

function slimeSprite(color, frame, flip, white = false) {
  const spr = spriteCanvas(SLIME_FRAMES[frame], SLIME_COLORS[color], { flip, key: `sl:${color}:${frame}` });
  if (!white) return spr;
  const wk = `sl:${color}:${frame}:${flip}:w`;
  if (!slimeSprite.white) slimeSprite.white = new Map();
  if (!slimeSprite.white.has(wk)) slimeSprite.white.set(wk, silhouette(spr));
  return slimeSprite.white.get(wk);
}

const crownSprite = () => spriteCanvas(CROWN, CROWN_PALETTE, { key: 'crown' });
const chestSprite = (open, gold) => spriteCanvas(open ? CHEST_OPEN : CHEST_CLOSED, gold ? CHEST_GOLD_PALETTE : CHEST_PALETTE, { key: `chest:${open}:${gold}` });
const coinSprite = (f) => spriteCanvas(COIN_FRAMES[f], COIN_PALETTE, { key: `coin:${f}` });
const itemSprite = (item) => spriteCanvas(ITEM_ICONS[item.slot], itemIconPalette(item.rarity), { key: `bi:${item.slot}:${item.rarity}` });

/** 3×5 비트맵 글꼴 (외곽선 포함) 캐시 */
const textCache = new Map();
function textSprite(text, color, scale = 1) {
  const key = `${text}|${color}|${scale}`;
  if (textCache.has(key)) return textCache.get(key);
  const chars = [...String(text).toUpperCase()];
  const gw = 3 * scale;
  const gh = 5 * scale;
  const gap = scale;
  const w = chars.length * (gw + gap) - gap + 2;
  const h = gh + 2;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const plot = (fill, ox, oy) => {
    g.fillStyle = fill;
    chars.forEach((ch, i) => {
      const glyph = FONT_3X5[ch] || FONT_3X5[' '];
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 3; x++) {
          if (glyph[y][x] === '1') g.fillRect(1 + i * (gw + gap) + x * scale + ox, 1 + y * scale + oy, scale, scale);
        }
      }
    });
  };
  for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) plot(INK, ox, oy);
  plot(color, 0, 0);
  if (textCache.size > 300) textCache.clear();
  textCache.set(key, c);
  return c;
}

/* ───────────── 생성 ───────────── */

function makeHero() {
  return {
    x: Math.round(W * 0.5), y: 0, vx: 0, vy: 0, face: -1, state: 'idle', t: 0, anim: 0,
    hp: game.stats.maxHp, invuln: 0, atkCd: 0, lastHit: -99, wanderX: null, wanderT: 2,
    hitDone: false, walking: false, chest: null, hitFlash: 0,
  };
}

function setState(h, s) {
  h.state = s;
  h.t = 0;
}

const SLIME_TYPES = {
  green: { hp: 1, atk: 1 },
  blue: { hp: 1.4, atk: 1.1 },
  red: { hp: 1.2, atk: 1.5 },
  purple: { hp: 1.8, atk: 1.3 },
  gold: { hp: 1, atk: 1 },
  metal: { hp: 1, atk: 0.8 },
};

function spawnSlime({ forceKing = false } = {}) {
  const L = game.stats.level;
  let color = 'green';
  let kind = 'normal';
  if (forceKing) {
    kind = 'king';
    color = L < 5 ? 'green' : L < 10 ? 'blue' : L < 15 ? 'red' : 'purple';
  } else {
    const r = Math.random();
    if (r < 0.04) { kind = 'metal'; color = 'metal'; } else if (r < 0.08) { kind = 'gold'; color = 'gold'; } else {
      const pool = ['green', 'green'];
      if (L >= 3) pool.push('blue', 'blue');
      if (L >= 6) pool.push('red', 'red');
      if (L >= 10) pool.push('purple');
      color = pool[randi(0, pool.length - 1)];
    }
  }
  const t = SLIME_TYPES[color];
  const size = kind === 'king' ? 2 : 1;
  let hp = Math.round((16 + 8 * L) * t.hp * (kind === 'king' ? 6 : 1));
  if (kind === 'metal') hp = 4 + Math.floor(L / 3);
  const fromLeft = Math.random() < 0.5;
  game.slimes.push({
    x: fromLeft ? -12 * size : W + 12 * size, y: 0, vx: 0, vy: 0, face: fromLeft ? 1 : -1,
    color, kind, size, hp, maxHp: hp,
    atk: (3 + 1.4 * L) * t.atk * (kind === 'king' ? 1.6 : 1),
    def: L * 0.4,
    hopT: rand(0.2, 0.8), onGround: true, squash: 0, stretch: 0, flash: 0, lastHurt: -99,
    entered: false, dead: false, deadT: 0, t: 0,
  });
  if (kind === 'king') {
    game.shake = Math.max(game.shake, 2);
    addText('KING!', fromLeft ? 30 : W - 30, 26, '#ffd447', 2);
  }
}

function addText(text, x, y, color, scale = 1, { vy = 22, life = 1.0, delay = 0 } = {}) {
  game.texts.push({ text: String(text), x, y, color, scale, vy, life, t: -delay });
  if (game.texts.length > 50) game.texts.shift();
}

function addLabel(text, x, y, color, { life = 2.2, vy = 6, size = 1, delay = 0 } = {}) {
  game.labels.push({ text, x, y, color, life, vy, t: -delay, size });
  if (game.labels.length > 12) game.labels.shift();
}

function burst(x, y, color, n = 8, { speed = 70, up = 90, life = 0.6, size = 1 } = {}) {
  for (let i = 0; i < n; i++) {
    game.particles.push({
      x, y, vx: rand(-speed, speed), vy: rand(up * 0.4, up * 1.2), life: rand(life * 0.6, life), t: 0, color, size, grav: true,
    });
  }
  if (game.particles.length > 260) game.particles.splice(0, game.particles.length - 260);
}

function sparkle(x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    game.particles.push({ x: x + rand(-10, 10), y: y + rand(0, 14), vx: rand(-8, 8), vy: rand(14, 34), life: rand(0.6, 1.2), t: 0, color, size: 1, grav: false, twinkle: true });
  }
}

function dust(x, n = 4) {
  for (let i = 0; i < n; i++) {
    game.particles.push({ x: x + rand(-3, 3), y: 1, vx: rand(-25, 25), vy: rand(5, 18), life: rand(0.25, 0.45), t: 0, color: 'rgba(230,230,240,0.55)', size: 1, grav: false });
  }
}

function say(text, life = 4) {
  game.bubble = { text, t: 0, life };
}

/* ───────────── 전투 ───────────── */

function nearestSlime(h) {
  let best = null;
  let bd = Infinity;
  for (const s of game.slimes) {
    if (s.dead || !s.entered) continue;
    const d = Math.abs(s.x - h.x);
    if (d < bd) { bd = d; best = s; }
  }
  return best;
}

function rollHeroDamage(mult = 1) {
  const st = game.stats;
  const crit = Math.random() < st.critChance;
  const amount = st.atk * rand(0.85, 1.15) * (crit ? st.critMult : 1) * mult;
  return { amount, crit };
}

function heroStrike() {
  const h = game.hero;
  const reach = 22;
  let hit = false;
  for (const s of game.slimes) {
    if (s.dead) continue;
    const dx = (s.x - h.x) * h.face;
    if (dx > -6 && dx < reach + s.size * 8 && Math.abs(s.y - h.y) < 14 * s.size) {
      damageSlime(s, rollHeroDamage(), h.face);
      hit = true;
    }
  }
  if (hit) sfx('hit');
}

function damageSlime(s, { amount, crit }, dir) {
  const dmg = s.kind === 'metal' ? (crit ? 2 : 1) : Math.max(1, Math.round(amount - s.def * 0.5));
  s.hp -= dmg;
  s.flash = 0.12;
  s.lastHurt = game.time;
  s.vx = dir * (s.kind === 'king' ? 40 : 95);
  s.vy = s.kind === 'king' ? 55 : 105;
  s.onGround = false;
  const top = s.y + 12 * s.size;
  addText(crit ? `${dmg}!` : `${dmg}`, s.x + rand(-3, 3), top + 2, crit ? '#ffd447' : '#ffffff', crit ? 2 : 1);
  if (crit) {
    game.shake = Math.max(game.shake, 3);
    burst(s.x, s.y + 6 * s.size, '#ffffff', 6, { speed: 60, up: 60, life: 0.35 });
  }
  if (s.hp <= 0) killSlime(s);
}

function killSlime(s) {
  s.dead = true;
  s.deadT = 0;
  const pal = SLIME_COLORS[s.color];
  burst(s.x, s.y + 5 * s.size, pal.g, 10 * s.size, { speed: 70 * s.size, up: 110, life: 0.7, size: s.size });
  burst(s.x, s.y + 5 * s.size, pal.l, 5 * s.size, { speed: 60, up: 90, life: 0.5 });
  const coins = s.kind === 'king' ? randi(10, 14) : s.kind === 'metal' ? randi(5, 8) : s.kind === 'gold' ? randi(4, 6) : randi(1, 2);
  for (let i = 0; i < coins; i++) {
    game.coins.push({ x: s.x, y: s.y + 6, vx: rand(-45, 45), vy: rand(90, 150), t: 0, magnet: false, value: 1, f: randi(0, 1) });
  }
  game.kills += 1;
  game.pending.kills += 1;
  if (s.kind === 'king') {
    game.pending.kings += 1;
    game.shake = Math.max(game.shake, 5);
    addText('KING DOWN!', s.x, s.y + 30, '#ffd447', 2, { life: 1.6 });
  }
}

function hitHero(s) {
  const h = game.hero;
  const st = game.stats;
  const raw = s.atk * rand(0.8, 1.2);
  const dmg = Math.max(1, Math.round((raw * 100) / (100 + st.def * 4)));
  h.hp -= dmg;
  h.lastHit = game.time;
  h.invuln = 1.0;
  h.hitFlash = 0.1;
  const dir = Math.sign(h.x - s.x) || -s.face || 1;
  // 넉백: 맞은 반대 방향으로 튕겨 나간다
  h.vx = dir * (s.kind === 'king' ? 170 : 125);
  h.vy = s.kind === 'king' ? 150 : 120;
  h.face = -dir;
  s.vx = -dir * 45;
  s.vy = 60;
  s.onGround = false;
  setState(h, 'hurt');
  addText(`${dmg}`, h.x + rand(-2, 2), h.y + 24, '#ff4d6d', s.kind === 'king' ? 2 : 1);
  game.shake = Math.max(game.shake, s.kind === 'king' ? 4 : 2);
  dust(h.x, 5);
  sfx('hurt');
  if (h.hp <= 0) {
    h.hp = 0;
    setState(h, 'faint');
    h.vx = dir * 60;
    game.pending.faints += 1;
    addLabel('기절…', h.x, 26, '#ff8fa3', { life: 2.5 });
  }
}

function revive() {
  const h = game.hero;
  h.hp = game.stats.maxHp;
  h.invuln = 1.5;
  setState(h, 'cheer');
  h.vy = 120;
  sparkle(h.x, 4, '#7fe3ff', 14);
  addLabel('부활!', h.x, 30, '#7fe3ff');
}

/* ───────────── 갱신 ───────────── */

function updateHero(dt) {
  const h = game.hero;
  const st = game.stats;
  h.t += dt;
  h.anim += dt;
  h.invuln = Math.max(0, h.invuln - dt);
  h.atkCd = Math.max(0, h.atkCd - dt);
  h.hitFlash = Math.max(0, h.hitFlash - dt);
  h.vy -= GRAVITY * dt;
  h.y += h.vy * dt;
  if (h.y <= 0) { h.y = 0; h.vy = 0; }
  h.x += h.vx * dt;
  if (h.y === 0) h.vx *= Math.exp(-8 * dt);
  if (Math.abs(h.vx) < 1) h.vx = 0;
  h.x = clamp(h.x, 8, W - 8);
  h.walking = false;

  if (h.state === 'faint') { if (h.t > 4) revive(); return; }
  if (h.state === 'hurt') { if (h.t > 0.4 && h.y === 0) setState(h, 'idle'); return; }
  if (h.state === 'attack') {
    if (!h.hitDone && h.t >= 0.12) { h.hitDone = true; heroStrike(); }
    if (h.t >= 0.36) setState(h, 'idle');
    return;
  }
  if (h.state === 'open') {
    if (h.t >= 0.45) {
      if (h.chest) openChest(h.chest);
      h.chest = null;
      setState(h, 'cheer');
      h.vy = 110;
    }
    return;
  }
  if (h.state === 'cheer') { if (h.t >= 0.7 && h.y === 0) setState(h, 'idle'); return; }

  if (game.time - h.lastHit > 5 && h.hp < st.maxHp) h.hp = Math.min(st.maxHp, h.hp + st.maxHp * 0.03 * dt);

  let tx = null;
  const chest = game.chests.find((c) => c.state === 'closed' && c.landed);
  if (chest) {
    if (Math.abs(chest.x - h.x) < 7) {
      h.face = chest.x >= h.x ? 1 : -1;
      h.chest = chest;
      chest.state = 'opening';
      setState(h, 'open');
      return;
    }
    tx = chest.x;
  } else {
    const target = nearestSlime(h);
    if (target) {
      const dx = target.x - h.x;
      const reach = 14 + target.size * 6;
      h.face = dx >= 0 ? 1 : -1;
      if (Math.abs(dx) <= reach) {
        if (h.atkCd <= 0 && h.y === 0) {
          setState(h, 'attack');
          h.hitDone = false;
          h.atkCd = 0.75;
          return;
        }
      } else {
        tx = target.x - Math.sign(dx) * (reach - 4);
      }
    } else {
      h.wanderT -= dt;
      if (h.wanderT <= 0) {
        h.wanderX = Math.random() < 0.65 ? rand(W * 0.06, W * 0.94) : null;
        h.wanderT = rand(3, 8);
      }
      tx = h.wanderX;
    }
  }
  if (tx !== null && Math.abs(tx - h.x) > 2 && Math.abs(h.vx) < 25) {
    const dir = Math.sign(tx - h.x);
    h.face = dir;
    h.x = clamp(h.x + dir * HERO_SPEED * dt, 8, W - 8);
    h.walking = true;
  }
}

function updateSlimes(dt) {
  const h = game.hero;
  for (const s of game.slimes) {
    s.t += dt;
    s.flash = Math.max(0, s.flash - dt);
    if (s.dead) { s.deadT += dt; continue; }
    s.vy -= GRAVITY * dt;
    s.y += s.vy * dt;
    s.x += s.vx * dt;
    if (s.y <= 0) {
      if (!s.onGround) {
        s.onGround = true;
        s.squash = 0.12;
        if (s.kind === 'king') { game.shake = Math.max(game.shake, 2); dust(s.x, 6); }
      }
      s.y = 0;
      s.vy = 0;
      s.vx *= Math.exp(-12 * dt);
    } else {
      s.onGround = false;
    }
    s.squash = Math.max(0, s.squash - dt);
    s.stretch = Math.max(0, s.stretch - dt);
    if (s.entered) s.x = clamp(s.x, 6, W - 6);
    else if (s.x > 8 && s.x < W - 8) s.entered = true;

    s.hopT -= dt;
    if (s.onGround && s.hopT <= 0 && game.time - s.lastHurt > 0.35) {
      let dir = Math.sign(h.x - s.x) || 1;
      if (!s.entered) dir = s.x < 0 ? 1 : -1;
      else if (s.kind === 'metal') dir = -dir; // 메탈은 도망
      else if (h.state === 'faint') dir = Math.random() < 0.5 ? -1 : 1; // 기절하면 신나서 통통
      s.face = dir;
      const king = s.kind === 'king';
      s.vx = dir * rand(28, 46) * (king ? 0.75 : 1);
      s.vy = rand(95, 130) * (king ? 0.9 : 1);
      s.onGround = false;
      s.stretch = 0.15;
      s.hopT = king ? rand(1.6, 2.4) : rand(0.8, 1.5);
    }

    if (h.state !== 'faint' && h.invuln <= 0 && s.entered
      && Math.abs(s.x - h.x) < 5 + s.size * 6 && Math.abs(s.y - h.y) < 9 * s.size) {
      hitHero(s);
    }
  }
  game.slimes = game.slimes.filter((s) => !(s.dead && s.deadT > 0.25));
}

function capLeft() {
  const used = (game.state.daily && game.state.daily.day === todayKey() ? game.state.daily.coins : 0) + game.pending.coins;
  return BATTLE.coinDailyCap - used;
}

function updateCoins(dt) {
  const h = game.hero;
  for (const c of game.coins) {
    c.t += dt;
    const dx = h.x - c.x;
    const dy = h.y + 10 - c.y;
    if (c.t > 0.7 && (Math.abs(dx) < 40 || c.t > 4)) c.magnet = true;
    if (c.magnet) {
      const d = Math.hypot(dx, dy) || 1;
      const sp = 120 + c.t * 50;
      c.x += (dx / d) * sp * dt;
      c.y += (dy / d) * sp * dt;
      if (d < 5) {
        c.done = true;
        if (capLeft() > 0) {
          game.pending.coins += c.value;
          addText(`+${c.value}G`, h.x + rand(-4, 4), h.y + 22, '#ffd447', 1, { vy: 18, life: 0.8 });
        }
        sfx('coin');
      }
    } else {
      c.vy -= GRAVITY * dt;
      c.y += c.vy * dt;
      c.x += c.vx * dt;
      if (c.y <= 0) {
        c.y = 0;
        c.vy = Math.abs(c.vy) > 40 ? -c.vy * 0.45 : 0;
        c.vx *= 0.6;
      }
    }
  }
  game.coins = game.coins.filter((c) => !c.done);
}

function spawnChest(item) {
  const h = game.hero;
  const x = clamp(h.x + rand(-34, 34), 14, W - 14);
  game.chests.push({ x, y: H + 8, vy: 0, state: 'closed', landed: false, item, t: 0, openT: 0 });
}

function updateChests(dt) {
  for (const c of game.chests) {
    c.t += dt;
    if (!c.landed) {
      c.vy -= GRAVITY * 0.8 * dt;
      c.y += c.vy * dt;
      if (Math.random() < 0.6) game.particles.push({ x: c.x + rand(-5, 5), y: c.y + rand(0, 8), vx: 0, vy: 0, life: 0.4, t: 0, color: RARITY_COLOR[c.item.rarity], size: 1, grav: false, twinkle: true });
      if (c.y <= 0) {
        c.y = 0;
        if (c.vy < -70) {
          c.vy = -c.vy * 0.3;
          dust(c.x, 6);
          game.shake = Math.max(game.shake, 1.5);
        } else {
          c.vy = 0;
          c.landed = true;
        }
      }
    }
    if (c.state === 'opened') c.openT += dt;
  }
  game.chests = game.chests.filter((c) => !(c.state === 'opened' && c.openT > 3.8));
}

function openChest(c) {
  c.state = 'opened';
  c.openT = 0;
  const it = c.item;
  const col = RARITY_COLOR[it.rarity];
  sparkle(c.x, 8, col, it.rarity === 'legendary' ? 30 : 14);
  burst(c.x, 10, col, 12, { speed: 50, up: 120, life: 0.8 });
  addLabel(it.name, c.x, 30, col, { life: 3.2, vy: 2, size: it.rarity === 'legendary' ? 1.2 : 1 });
  if (it.rarity === 'legendary') {
    game.flash = 0.55;
    game.flashColor = '#ffe9a8';
    game.shake = Math.max(game.shake, 6);
    addText('LEGENDARY!', c.x, 36, '#ffb52e', 2, { life: 2.2, vy: 4 });
  } else if (it.rarity === 'epic') {
    game.flash = 0.25;
    game.flashColor = '#e3c9ff';
    addText('EPIC!', c.x, 36, '#c07bff', 2, { life: 1.8, vy: 4 });
  }
}

function updateFx(dt) {
  for (const p of game.particles) {
    p.t += dt;
    if (p.grav) p.vy -= GRAVITY * 0.7 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.grav && p.y < 0) { p.y = 0; p.vy *= -0.3; p.vx *= 0.5; }
  }
  game.particles = game.particles.filter((p) => p.t < p.life);
  for (const t of game.texts) { t.t += dt; if (t.t > 0) t.y += t.vy * dt * (1 - t.t / t.life); }
  game.texts = game.texts.filter((t) => t.t < t.life);
  for (const l of game.labels) { l.t += dt; if (l.t > 0) l.y += l.vy * dt; }
  game.labels = game.labels.filter((l) => l.t < l.life);
  if (game.bubble) { game.bubble.t += dt; if (game.bubble.t > game.bubble.life) game.bubble = null; }
  game.shake = Math.max(0, game.shake - dt * 25);
  game.flash = Math.max(0, game.flash - dt * 1.4);
}

function spawnLogic(dt) {
  const rate = BATTLE.spawnRates[game.state.settings.spawnRate] || BATTLE.spawnRates.normal;
  game.spawnT -= dt;
  if (game.spawnT > 0 || game.hero.state === 'faint') return;
  const alive = game.slimes.filter((s) => !s.dead).length;
  const kingDue = game.kills > 0 && game.kills >= game.nextKing;
  if (kingDue && !game.slimes.some((s) => s.kind === 'king' && !s.dead)) {
    spawnSlime({ forceKing: true });
    game.nextKing = game.kills + game.kingEvery;
  } else if (alive < rate.max) {
    spawnSlime();
  }
  game.spawnT = rand(rate.interval[0], rate.interval[1]);
}

function reportLogic(dt) {
  game.reportT -= dt;
  if (game.reportT > 0) return;
  game.reportT = 5;
  flushReport();
}

function flushReport() {
  const p = game.pending;
  if (!p.kills && !p.kings && !p.coins && !p.faints) return;
  game.api.battleReport({ ...p });
  game.pending = { kills: 0, kings: 0, coins: 0, faints: 0 };
}

function todayKey() {
  return dayKey(Date.now(), game.state.settings.dayStartHour);
}

function chatterText() {
  const s = game.state;
  const today = todayKey();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const short = (t) => (t.length > 14 ? `${t.slice(0, 13)}…` : t);
  const soon = timedItemsForDay(s, today)
    .map((i) => ({ ...i, m: timeToMinutes(i.time) }))
    .filter((i) => i.m >= nowMin && i.m - nowMin <= 60)
    .sort((a, b) => a.m - b.m)[0];
  if (soon) return soon.m === nowMin ? `지금! ${short(soon.title)}` : `${soon.m - nowMin}분 뒤 ${short(soon.title)}!`;
  const ds = dailiesForDay(s, today);
  const left = ds.filter((d) => !isDailyDone(d, today)).length;
  if (ds.length && !left) return '오늘 임무 완료! 최고예요!';
  if (left) return `오늘 임무 ${left}개 남았어요!`;
  return '오늘도 힘내요!';
}

function chatterLogic(dt) {
  game.chatterT -= dt;
  if (game.chatterT > 0) return;
  game.chatterT = rand(200, 320);
  if (game.hero.state !== 'faint') say(chatterText(), 5);
}

/* ───────────── 그리기 ───────────── */

function heroPose(h) {
  switch (h.state) {
    case 'attack': return h.t < 0.12 ? 'atk0' : h.t < 0.24 ? 'atk1' : 'atk2';
    case 'hurt': return 'hurt';
    case 'faint': return 'faint';
    case 'cheer': return 'walk1';
    case 'open': return 'idle1';
    default:
      if (h.walking) return Math.floor(h.anim * 8) % 2 ? 'walk0' : 'walk1';
      if (h.anim % 4 < 0.12) return 'blink';
      return Math.floor(h.anim * 1.6) % 2 ? 'idle1' : 'idle0';
  }
}

function shadow(x, y, w) {
  const a = clamp(0.28 - y * 0.006, 0.06, 0.28);
  ctx.fillStyle = `rgba(0,0,0,${a.toFixed(3)})`;
  const ww = Math.max(2, Math.round(w * (1 - Math.min(0.5, y / 60))));
  ctx.fillRect(Math.round(x - ww / 2), H - 1, ww, 1);
}

function drawBar(x, y, w, ratio, color) {
  ctx.fillStyle = INK;
  ctx.fillRect(Math.round(x - w / 2) - 1, y - 1, w + 2, 3);
  ctx.fillStyle = '#3a2340';
  ctx.fillRect(Math.round(x - w / 2), y, w, 1);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - w / 2), y, Math.max(0, Math.round(w * ratio)), 1);
}

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const sx = game.shake > 0.3 ? Math.round(rand(-1, 1) * Math.min(2, game.shake / 2)) : 0;
  const sy = game.shake > 0.3 ? Math.round(rand(-1, 1) * Math.min(1, game.shake / 3)) : 0;
  const oy = canvas.height - H * S;
  ctx.setTransform(S, 0, 0, S, sx * S, oy + sy * S);
  ctx.imageSmoothingEnabled = false;
  const h = game.hero;

  // 상자 빛기둥
  for (const c of game.chests) {
    if (c.state !== 'opened') continue;
    const col = RARITY_COLOR[c.item.rarity];
    const fade = c.openT > 3.0 ? Math.max(0, 1 - (c.openT - 3.0) / 0.8) : 1;
    const pulse = 0.35 + 0.15 * Math.sin(c.openT * 10);
    const bw = c.item.rarity === 'legendary' ? 10 : 6;
    const top = H - 1 - Math.min(H, 70);
    const grad = ctx.createLinearGradient(0, H, 0, top);
    grad.addColorStop(0, `${col}${Math.round(255 * pulse * fade).toString(16).padStart(2, '0')}`);
    grad.addColorStop(1, `${col}00`);
    ctx.fillStyle = grad;
    ctx.fillRect(Math.round(c.x - bw / 2), top, bw, H - top - 4);
  }

  // 그림자
  shadow(h.x, h.y, h.state === 'faint' ? 14 : 10);
  for (const s of game.slimes) if (!s.dead) shadow(s.x, s.y, 12 * s.size);
  for (const c of game.chests) shadow(c.x, c.y, 11);

  // 상자
  for (const c of game.chests) {
    const fade = c.state === 'opened' && c.openT > 3.0 ? Math.max(0, 1 - (c.openT - 3.0) / 0.8) : 1;
    ctx.globalAlpha = fade;
    const gold = c.item.rarity === 'epic' || c.item.rarity === 'legendary';
    const spr = chestSprite(c.state === 'opened', gold);
    ctx.drawImage(spr, Math.round(c.x) - 6, H - spr.height - Math.round(c.y));
    if (c.state === 'opened') {
      const rise = Math.min(1, c.openT / 0.5);
      const iy = H - 11 - 14 - Math.round(rise * 12 + Math.sin(c.openT * 4) * 1.5);
      ctx.drawImage(itemSprite(c.item), Math.round(c.x) - 6, iy);
    }
    ctx.globalAlpha = 1;
  }

  // 동전
  for (const c of game.coins) {
    const spr = coinSprite(Math.floor((c.t + c.f) * 8) % 2);
    ctx.drawImage(spr, Math.round(c.x) - 2, H - 5 - Math.round(c.y));
  }

  // 슬라임
  for (const s of game.slimes) {
    let frame = 'idle';
    if (s.flash > 0) frame = 'hurt';
    else if (s.squash > 0) frame = 'squash';
    else if (!s.onGround || s.stretch > 0) frame = 'stretch';
    const flip = s.face < 0;
    const spr = slimeSprite(s.color, frame, flip, s.flash > 0.06);
    const w = spr.width * s.size;
    const hh = spr.height * s.size;
    if (s.dead) {
      ctx.globalAlpha = Math.max(0, 1 - s.deadT / 0.25);
    }
    ctx.drawImage(spr, Math.round(s.x - w / 2), H - hh - Math.round(s.y), w, hh);
    if (s.kind === 'king') {
      const cr = crownSprite();
      const topOff = frame === 'squash' ? 8 : frame === 'stretch' ? 0 : 4;
      ctx.drawImage(cr, Math.round(s.x - cr.width / 2), H - hh - Math.round(s.y) + topOff - 2);
    }
    ctx.globalAlpha = 1;
    if (!s.dead && game.time - s.lastHurt < 4 && s.hp < s.maxHp) {
      drawBar(s.x, H - hh - Math.round(s.y) - 3, 10 * s.size, s.hp / s.maxHp, '#ff6d6d');
    }
  }

  // 용사
  const blinkHide = h.invuln > 0 && h.state !== 'hurt' && Math.floor(h.invuln * 14) % 2 === 0;
  if (!blinkHide) {
    const pose = heroPose(h);
    const spr = heroSprite(pose, h.face < 0, h.hitFlash > 0);
    const fx = h.face < 0 ? 15 : 16;
    ctx.drawImage(spr, Math.round(h.x) - fx, H - 24 - Math.round(h.y));
  }
  if (h.hp < game.stats.maxHp && h.state !== 'faint') {
    const ratio = h.hp / game.stats.maxHp;
    drawBar(h.x, H - 26 - Math.round(h.y), 14, ratio, ratio > 0.5 ? '#6fdc8c' : ratio > 0.25 ? '#ffd447' : '#ff4d6d');
  }

  // 파티클
  for (const p of game.particles) {
    const a = 1 - p.t / p.life;
    if (p.twinkle && Math.floor(p.t * 12) % 2) continue;
    ctx.globalAlpha = Math.max(0, Math.min(1, a * 1.4));
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), H - 1 - Math.round(p.y), p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // 데미지·보상 숫자 (비트맵 글꼴)
  for (const t of game.texts) {
    if (t.t < 0) continue;
    const a = t.t > t.life * 0.65 ? 1 - (t.t - t.life * 0.65) / (t.life * 0.35) : 1;
    const pop = t.t < 0.08 ? 1 : 0;
    const spr = textSprite(t.text, t.color, t.scale);
    ctx.globalAlpha = Math.max(0, a);
    const tx = clamp(Math.round(t.x - spr.width / 2), 1, W - spr.width - 1);
    const ty = Math.max(1, H - Math.round(t.y) - spr.height - pop);
    ctx.drawImage(spr, tx, ty);
  }
  ctx.globalAlpha = 1;

  // ── 기기 픽셀 단위: 한글 라벨·말풍선·번쩍임
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const toDev = (x, y) => [x * S + sx * S, oy + (H - y) * S + sy * S];
  const k = Math.max(1, Math.round(dpr));
  for (const l of game.labels) {
    if (l.t < 0) continue;
    const a = l.t > l.life - 0.5 ? (l.life - l.t) / 0.5 : 1;
    const [dx, dy] = toDev(l.x, l.y);
    drawKoText(l.text, dx, dy, l.color, Math.round(12 * k * l.size), a);
  }
  if (game.bubble || game.hover === 'hero') {
    const text = game.hover === 'hero'
      ? `${game.state.profile.name} Lv.${game.stats.level} · HP ${Math.ceil(h.hp)}/${game.stats.maxHp}`
      : game.bubble.text;
    const [dx, dy] = toDev(h.x, h.y + 30);
    drawBubble(text, dx, dy, k);
  }
  if (game.flash > 0) {
    ctx.globalAlpha = Math.min(0.5, game.flash);
    ctx.fillStyle = game.flashColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
}

function drawKoText(text, x, y, color, px, alpha = 1) {
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.font = `700 ${px}px Galmuri11, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, Math.round(px / 4));
  const half = ctx.measureText(text).width / 2 + ctx.lineWidth;
  const cx = Math.round(clamp(x, half + 2, canvas.width - half - 2));
  const cy = Math.round(clamp(y, px + 4, canvas.height));
  ctx.strokeStyle = INK;
  ctx.strokeText(text, cx, cy);
  ctx.fillStyle = color;
  ctx.fillText(text, cx, cy);
  ctx.globalAlpha = 1;
}

function drawBubble(text, x, y, k) {
  const px = 12 * k;
  ctx.font = `${px}px Galmuri11, sans-serif`;
  const tw = Math.ceil(ctx.measureText(text).width);
  const pad = 6 * k;
  const bw = tw + pad * 2;
  const bh = px + pad * 1.4;
  let bx = Math.round(x - bw / 2);
  bx = clamp(bx, 4, canvas.width - bw - 4);
  const by = Math.round(y - bh - 6 * k);
  ctx.fillStyle = INK;
  ctx.fillRect(bx - k * 2, by, bw + k * 4, bh);
  ctx.fillRect(bx, by - k * 2, bw, bh + k * 4);
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(bx, by, bw, bh);
  // 꼬리
  const tx = clamp(Math.round(x), bx + 8 * k, bx + bw - 8 * k);
  ctx.fillStyle = INK;
  ctx.fillRect(tx - 3 * k, by + bh, 6 * k, 3 * k);
  ctx.fillRect(tx - k, by + bh + 3 * k, 2 * k, 2 * k);
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(tx - k * 2, by + bh - k, 4 * k, 3 * k);
  ctx.fillStyle = '#2a2633';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + pad, by + bh / 2 + k);
}

/* ───────────── 입력 (클릭 통과 + 호버 판정) ───────────── */

function worldPoint(e) {
  return { x: (e.clientX * dpr) / S, y: (canvas.height - e.clientY * dpr) / S };
}

function hitTest(p) {
  const h = game.hero;
  for (const c of game.chests) {
    if (c.state === 'closed' && Math.abs(p.x - c.x) < 8 && p.y >= c.y - 1 && p.y < c.y + 12) return { type: 'chest', ref: c };
  }
  for (const s of game.slimes) {
    if (s.dead) continue;
    if (Math.abs(p.x - s.x) < 8 * s.size && p.y >= s.y - 1 && p.y < s.y + 11 * s.size) return { type: 'slime', ref: s };
  }
  if (Math.abs(p.x - h.x) < 8 && p.y >= h.y - 1 && p.y < h.y + 18) return { type: 'hero' };
  return null;
}

function setIgnore(ignore) {
  if (ignore === game.ignoring) return;
  game.ignoring = ignore;
  game.api.setIgnoreMouse(ignore);
}

function onMove(e) {
  if (!game.state || !game.state.settings.battleInteractive) {
    game.hover = null;
    setIgnore(true);
    return;
  }
  const hit = hitTest(worldPoint(e));
  game.hover = hit ? hit.type : null;
  canvas.style.cursor = hit ? 'pointer' : 'default';
  setIgnore(!hit);
}

function onDown(e) {
  if (!game.state || !game.state.settings.battleInteractive) return;
  const hit = hitTest(worldPoint(e));
  if (!hit) return;
  if (hit.type === 'hero') {
    game.api.openWidget();
    say(chatterText(), 4);
  } else if (hit.type === 'slime') {
    // 플레이어 지원 공격: 클릭한 슬라임을 때린다
    const dir = Math.sign(hit.ref.x - game.hero.x) || 1;
    damageSlime(hit.ref, rollHeroDamage(0.6), dir);
    burst(hit.ref.x, hit.ref.y + 6, '#ffffff', 5, { speed: 40, up: 50, life: 0.3 });
    sfx('hit');
  } else if (hit.type === 'chest' && hit.ref.landed) {
    game.hero.x = clamp(hit.ref.x - 6, 8, W - 8);
  }
}

/* ───────────── 상태·이벤트 ───────────── */

function applyState(s) {
  game.state = s;
  game.stats = heroStats(s);
  game.gear = game.stats.gear;
  const key = gearSig(game.gear);
  if (key !== game.gearKey) game.gearKey = key;
  if (game.hero) game.hero.hp = Math.min(game.hero.hp, game.stats.maxHp);
  setSoundEnabled(s.settings.sound);
  if (!s.settings.battleInteractive) setIgnore(true);
}

function onEvents(events) {
  const h = game.hero;
  let delay = 0;
  let lift = 0;
  for (const ev of events) {
    if (ev.type === 'reward') {
      // 같은 보상의 숫자들은 위아래로 쌓아서 함께 떠오른다
      if (ev.xp) { addText(`+${ev.xp} EXP`, h.x, h.y + 26 + lift, '#7fe3ff', 1, { life: 1.5, delay }); lift += 8; }
      if (ev.gold) { addText(`+${ev.gold}G`, h.x, h.y + 26 + lift, '#ffd447', 1, { life: 1.5, delay }); lift += 8; }
      delay += 0.35;
      if (ev.heal && h.state !== 'faint') {
        const amt = Math.round(game.stats.maxHp * Math.min(1, ev.heal));
        const real = Math.min(amt, game.stats.maxHp - Math.ceil(h.hp));
        h.hp = Math.min(game.stats.maxHp, h.hp + amt);
        if (real > 0) { addText(`+${real}`, h.x + 8, h.y + 18, '#6fdc8c', 1, { life: 1.1, delay }); }
      }
      if (ev.item) spawnChest(ev.item);
      if ((ev.xp || ev.item) && (h.state === 'idle' || h.state === 'cheer')) { setState(h, 'cheer'); h.vy = 100; }
      if (ev.source === 'perfect') say('퍼펙트 데이! 보너스 상자다!', 4);
    } else if (ev.type === 'levelUp') {
      h.hp = game.stats.maxHp;
      if (h.state === 'faint') revive();
      addText('LEVEL UP!', h.x, h.y + 34, '#7fe3ff', 2, { life: 2.2, vy: 10, delay });
      sparkle(h.x, 4, '#7fe3ff', 22);
      sparkle(h.x, 4, '#ffd447', 10);
      if (ev.item) spawnChest(ev.item);
    } else if (ev.type === 'potion') {
      if (h.state === 'faint') revive();
      const real = game.stats.maxHp - Math.ceil(h.hp);
      h.hp = game.stats.maxHp;
      addText(real > 0 ? `+${real}` : 'FULL', h.x, h.y + 24, '#6fdc8c', 1, { life: 1.2 });
      sparkle(h.x, 2, '#ff8fa3', 12);
    } else if (ev.type === 'customReward') {
      say(`「${ev.title.length > 10 ? `${ev.title.slice(0, 9)}…` : ev.title}」 즐겨요!`, 4);
      sparkle(h.x, 4, '#ffd447', 12);
      if (h.state === 'idle') { setState(h, 'cheer'); h.vy = 120; }
    } else if (ev.type === 'equip') {
      sparkle(h.x, 4, ev.item ? RARITY_COLOR[ev.item.rarity] : '#ffffff', 10);
    } else if (ev.type === 'replaced') {
      game.hero = makeHero();
      game.slimes = [];
      game.chests = [];
    }
  }
}

/* ───────────── 루프 ───────────── */

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (game.state) {
    game.time += dt;
    updateHero(dt);
    updateSlimes(dt);
    updateCoins(dt);
    updateChests(dt);
    updateFx(dt);
    spawnLogic(dt);
    reportLogic(dt);
    chatterLogic(dt);
    render();
  }
  requestAnimationFrame(loop);
}

async function main() {
  game.api = await resolveApi();
  const init = await game.api.init();
  resize();
  window.addEventListener('resize', resize);
  game.api.onLayout && game.api.onLayout(() => setTimeout(resize, 30));
  applyState(init.state);
  game.hero = makeHero();
  game.nextKing = game.kingEvery;
  game.api.onState(applyState);
  game.api.onEvents(onEvents);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mousedown', onDown);
  document.addEventListener('mouseleave', () => { game.hover = null; setIgnore(true); });
  window.addEventListener('beforeunload', flushReport);
  try { await document.fonts.load('12px Galmuri11'); } catch { /* 글꼴 없으면 기본 글꼴 */ }
  say('오늘도 모험을 떠나 볼까요?', 4);
  game.debug = { spawnSlime, spawnChest, hitHero };
  window.__questbarBattle = game; // 디버그·테스트용
  requestAnimationFrame((t) => { last = t; loop(t); });
}

main().catch((err) => console.error('[battle]', err));

export { GEAR_COLORS };
