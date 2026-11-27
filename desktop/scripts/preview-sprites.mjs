// 스프라이트 시트 미리보기 PNG 생성 + 행 길이 검증: node scripts/preview-sprites.mjs <out.png>
import fs from 'node:fs';
import { Canvas } from './png.mjs';
import { rasterize } from '../src/shared/pixel.js';
import * as S from '../src/shared/sprites.js';

const out = process.argv[2] || 'sprites-preview.png';
const items = [];
const add = (name, rows, palette) => items.push({ name, rows, palette });

function check(name, rows) {
  const w = rows[0].length;
  rows.forEach((r, i) => {
    if (r.length !== w) console.error(`✗ ${name} row ${i}: length ${r.length} != ${w} → "${r}"`);
  });
}

const gearSets = {
  none: { weapon: { rarity: 'common' } },
  rare: { weapon: { rarity: 'rare' }, helmet: { rarity: 'rare' }, armor: { rarity: 'rare' }, cape: { rarity: 'rare' } },
  epic: { weapon: { rarity: 'epic' }, armor: { rarity: 'epic' }, cape: { rarity: 'epic' } },
  legendary: { weapon: { rarity: 'legendary' }, helmet: { rarity: 'legendary' }, armor: { rarity: 'legendary' }, cape: { rarity: 'legendary' } },
};
for (const pose of ['idle0', 'idle1', 'walk0', 'walk1', 'atk0', 'atk1', 'atk2', 'hurt', 'faint']) {
  const c = S.composeHero(pose, gearSets.none);
  add(`hero ${pose}`, c.rows, c.palette);
}
for (const [k, g] of Object.entries(gearSets)) {
  const c = S.composeHero('idle0', g);
  add(`hero gear ${k}`, c.rows, c.palette);
}
for (const [k, f] of Object.entries(S.SLIME_FRAMES)) add(`slime ${k}`, f, S.SLIME_COLORS.green);
for (const k of Object.keys(S.SLIME_COLORS)) add(`slime ${k}`, S.SLIME_FRAMES.idle, S.SLIME_COLORS[k]);
add('crown', S.CROWN, S.CROWN_PALETTE);
add('chest closed', S.CHEST_CLOSED, S.CHEST_PALETTE);
add('chest open', S.CHEST_OPEN, S.CHEST_PALETTE);
add('chest gold', S.CHEST_CLOSED, S.CHEST_GOLD_PALETTE);
S.COIN_FRAMES.forEach((f, i) => add(`coin ${i}`, f, S.COIN_PALETTE));
add('potion', S.POTION, S.POTION_PALETTE);
for (const r of ['common', 'rare', 'epic', 'legendary']) {
  for (const [slot, rows] of Object.entries(S.ITEM_ICONS)) add(`${slot} ${r}`, rows, S.itemIconPalette(r));
}
for (const [k, v] of Object.entries(S.UI_ICONS)) add(`ui ${k}`, v.rows, v.palette);
for (const [k, v] of Object.entries(S.CATEGORY_ICONS)) add(`cat ${k}`, v.rows, v.palette);
const font = Object.entries(S.FONT_3X5).map(([ch, rows]) => ({ ch, rows: rows.map((r) => r.replace(/0/g, '.').replace(/1/g, 'w')) }));
for (const { ch, rows } of font) add(`font ${ch}`, rows, { w: '#ffffff' });

for (const it of items) check(it.name, it.rows);

const SCALE = 5;
const CELL = 34 * SCALE;
const COLS = 8;
const rowsN = Math.ceil(items.length / COLS);
const cv = new Canvas(COLS * CELL, rowsN * CELL, [40, 44, 58, 255]);
items.forEach((it, i) => {
  const img = rasterize(it.rows, it.palette);
  const cx = (i % COLS) * CELL;
  const cy = Math.floor(i / COLS) * CELL;
  // 셀 경계
  for (let x = 0; x < CELL; x++) { cv.data.set([60, 66, 84, 255], ((cy) * cv.w + cx + x) * 4); }
  for (let y = 0; y < CELL; y++) { cv.data.set([60, 66, 84, 255], ((cy + y) * cv.w + cx) * 4); }
  cv.blit(img, cx + 4, cy + 4, SCALE);
});
fs.writeFileSync(out, cv.png());
console.log(`${items.length} sprites → ${out}`);
items.forEach((it, i) => process.stdout.write(`${i}:${it.name}${i % 8 === 7 ? '\n' : ' | '}`));
console.log();
