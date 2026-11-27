// 스프라이트 → 캔버스/이미지 변환 (캐시). 렌더러 전용.
import { rasterize, flipX } from '../../shared/pixel.js';
import {
  UI_ICONS, CATEGORY_ICONS, ITEM_ICONS, itemIconPalette, composeHero,
  CHEST_CLOSED, CHEST_PALETTE, CHEST_GOLD_PALETTE, POTION, POTION_PALETTE,
} from '../../shared/sprites.js';

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
