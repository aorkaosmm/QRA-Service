// 스프라이트 → 캔버스/이미지 변환 (캐시). 렌더러 전용.
import { rasterize, flipX } from '../../shared/pixel.js';
import {
  UI_ICONS, CATEGORY_ICONS, ITEM_ICONS, itemIconPalette, composeHero,
  CHEST_CLOSED, CHEST_OPEN, CHEST_PALETTE, CHEST_GOLD_PALETTE, POTION, POTION_PALETTE,
  GEM_ROWS, gemPalette, HORN, HORN_PALETTE, CHEST_RAID_PALETTE, MONSTER_COLORS, SLIME_FRAMES, SLIME_COLORS, CROWN, CROWN_PALETTE,
} from '../../shared/sprites.js';
import { GEMS, GEM_ORDER } from '../../core/constants.js';

const canvasCache = new Map();
const urlCache = new Map();

function toCanvas(img) {
  const c = document.createElement('canvas');
  c.width = img.w;
  c.height = img.h;
  c.getContext('2d').putImageData(new ImageData(img.data, img.w, img.h), 0, 0);
  return c;
}

/** 문자열 격자 + 팔레트 → 캔버스(정수 배율) */
export function spriteCanvas(rows, palette, { scale = 1, flip = false, key = null } = {}) {
  const k = key ? `${key}|${scale}|${flip ? 1 : 0}` : null;
  if (k && canvasCache.has(k)) return canvasCache.get(k);
  const base = toCanvas(rasterize(flip ? flipX(rows) : rows, palette));
  let out = base;
  if (scale !== 1) {
    out = document.createElement('canvas');
    out.width = base.width * scale;
    out.height = base.height * scale;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(base, 0, 0, out.width, out.height);
  }
  if (k) canvasCache.set(k, out);
  return out;
}

/** 단색 실루엣 (피격 번쩍임용) */
export function silhouette(canvas, color = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = canvas.width;
  c.height = canvas.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(canvas, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

function spriteURL(key, rows, palette) {
  if (urlCache.has(key)) return urlCache.get(key);
  const url = spriteCanvas(rows, palette).toDataURL();
  urlCache.set(key, url);
  return url;
}

const img = (url, w, h, scale, cls = '') =>
  `<img class="px ${cls}" src="${url}" width="${w * scale}" height="${h * scale}" alt="" draggable="false">`;

/** UI 아이콘 HTML (10×10 원본) */
export function uiIcon(name, scale = 2, cls = '') {
  const d = UI_ICONS[name];
  if (!d) return '';
  return img(spriteURL(`ui:${name}`, d.rows, d.palette), 10, 10, scale, cls);
}

export function catIcon(category, scale = 2, cls = '') {
  const d = CATEGORY_ICONS[category] || CATEGORY_ICONS.todo;
  return img(spriteURL(`cat:${category}`, d.rows, d.palette), 10, 10, scale, cls);
}

export function itemIcon(item, scale = 3, cls = '') {
  const rows = ITEM_ICONS[item.slot];
  return img(spriteURL(`item:${item.slot}:${item.rarity}`, rows, itemIconPalette(item.rarity)), 12, 12, scale, cls);
}

export function slotIcon(slot, scale = 3, cls = '') {
  const rows = ITEM_ICONS[slot];
  const ghost = { o: '#00000055', m: '#ffffff22', M: '#ffffff18', x: '#ffffff30', c: '#ffffff22', C: '#ffffff18', p: '#ffffff18', y: '#ffffff22' };
  return img(spriteURL(`slot:${slot}`, rows, ghost), 12, 12, scale, cls);
}

export function shopIcon(key, scale = 3) {
  if (key === 'potion') return img(spriteURL('shop:potion', POTION, POTION_PALETTE), 8, 11, scale);
  const pal = key === 'goldChest' ? CHEST_GOLD_PALETTE : CHEST_PALETTE;
  return img(spriteURL(`shop:${key}`, CHEST_CLOSED, pal), 12, 11, scale);
}

/** 용사 초상화를 캔버스에 그린다 (장비 반영) */
export function drawHero(canvas, pose, gear, { scale = 3, flip = false } = {}) {
  const c = composeHero(pose, gear);
  const sig = `hero:${pose}:${gearSig(gear)}`;
  const sprite = spriteCanvas(c.rows, c.palette, { scale, flip, key: sig });
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const dx = Math.round((canvas.width - sprite.width) / 2);
  const dy = canvas.height - sprite.height;
  ctx.drawImage(sprite, dx, dy);
}

export function gearSig(gear) {
  return ['weapon', 'helmet', 'armor', 'cape'].map((s) => (gear[s] ? gear[s].rarity[0] : '-')).join('');
}

/* ── 던전 · 레이드 ─────────────────────────────── */

export function gemIcon(key, scale = 2, cls = '') {
  const g = GEMS[key];
  if (!g) return '';
  return img(spriteURL(`gem:${key}`, GEM_ROWS, gemPalette(g)), 10, 10, scale, cls);
}

export function raidChestIcon(scale = 3, open = false) {
  return img(spriteURL(`chest:raid:${open ? 1 : 0}`, open ? CHEST_OPEN : CHEST_CLOSED, CHEST_RAID_PALETTE), 12, 11, scale);
}

/** 장비 등급 문자열({ weapon: 'epic' }) 또는 장비 객체 → composeHero 형식 */
export function gearFrom(g = {}) {
  const out = {};
  for (const slot of ['weapon', 'helmet', 'armor', 'cape']) {
    const v = g[slot];
    out[slot] = !v ? null : typeof v === 'string' ? { rarity: v } : { rarity: v.rarity };
  }
  return out;
}

/** 용사 캔버스 (정수 배율, 캐시) */
export function heroSprite(pose, gear, scale = 1, flip = false) {
  const c = composeHero(pose, gear);
  return spriteCanvas(c.rows, c.palette, { scale, flip, key: `hero:${pose}:${gearSig(gear)}` });
}

/** 다른 플레이어 초상 HTML (랭킹·파티 목록) */
export function heroImg(gearRarities, scale = 2, pose = 'idle0') {
  const gear = gearFrom(gearRarities);
  const key = `heroimg:${pose}:${gearSig(gear)}`;
  if (!urlCache.has(key)) urlCache.set(key, heroSprite(pose, gear, 1).toDataURL());
  return img(urlCache.get(key), 32, 24, scale, 'hero-img');
}

function monsterPalette(color, tick = 0) {
  if (color === 'rainbow') {
    const g = GEMS[GEM_ORDER[Math.floor(tick / 6) % GEM_ORDER.length]];
    return { g: g.color, G: g.shade, l: g.light, w: '#ffffff', e: INK_EYES, o: '#1a1423' };
  }
  return MONSTER_COLORS[color] || SLIME_COLORS[color] || SLIME_COLORS.green;
}
const INK_EYES = '#1a1423';

/** 몬스터(슬라임) 1배 캔버스. frame: idle | squash | stretch | hurt */
export function monsterSprite(color, frame = 'idle', tick = 0) {
  const key = `mon:${color}:${frame}:${color === 'rainbow' ? Math.floor(tick / 6) % 6 : 0}`;
  return spriteCanvas(SLIME_FRAMES[frame] || SLIME_FRAMES.idle, monsterPalette(color, tick), { key });
}

/**
 * 보스 1배 캔버스: 슬라임 + (왕관) + (뿔). 위쪽 여백 6칸에 장식을 얹는다.
 * @returns {HTMLCanvasElement} 18×18
 */
export function bossSprite(color, { crown = false, horns = false, frame = 'idle', tick = 0 } = {}) {
  const key = `boss:${color}:${crown ? 1 : 0}${horns ? 1 : 0}:${frame}:${color === 'rainbow' ? Math.floor(tick / 6) % 6 : 0}`;
  if (canvasCache.has(key)) return canvasCache.get(key);
  const out = document.createElement('canvas');
  out.width = 18;
  out.height = 18;
  const ctx = out.getContext('2d');
  const body = monsterSprite(color, frame, tick);
  ctx.drawImage(body, 0, 6);
  const top = frame === 'squash' ? 6 + 4 : frame === 'stretch' ? 6 : 6 + 2;
  if (horns) {
    const h = spriteCanvas(HORN, HORN_PALETTE, { key: 'horn' });
    const hf = spriteCanvas(HORN, HORN_PALETTE, { flip: true, key: 'horn' });
    ctx.drawImage(h, 3, top - 3);
    ctx.drawImage(hf, 11, top - 3);
  }
  if (crown) ctx.drawImage(spriteCanvas(CROWN, CROWN_PALETTE, { key: 'crown' }), 5, top - 4);
  canvasCache.set(key, out);
  return out;
}
