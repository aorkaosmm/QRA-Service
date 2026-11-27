// 앱·트레이 아이콘 생성 (왕관 쓴 슬라임): node scripts/make-icons.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas, encodeICO } from './png.mjs';
import { rasterize } from '../src/shared/pixel.js';
import { SLIME_FRAMES, SLIME_COLORS, CROWN, CROWN_PALETTE } from '../src/shared/sprites.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'build');
fs.mkdirSync(outDir, { recursive: true });

// 16×16 원본 합성
function base16() {
  const cv = new Canvas(16, 16);
  const slime = rasterize(SLIME_FRAMES.idle, SLIME_COLORS.green); // 18×12
  cv.blit(slime, -1, 3, 1);
  cv.blit(rasterize(CROWN, CROWN_PALETTE), 4, 0, 1);
  return { w: 16, h: 16, data: cv.data };
}

function scaled(img, size, pad = 0) {
  const k = Math.floor((size - pad * 2) / 16);
  const cv = new Canvas(size, size);
  const off = Math.floor((size - 16 * k) / 2);
  cv.blit(img, off, off, k);
  return cv;
}

const img = base16();
const sizes = [16, 32, 48, 64, 128, 256];
const pngs = sizes.map((size) => ({ size, png: scaled(img, size, size >= 64 ? size / 16 : 0).png() }));
fs.writeFileSync(path.join(outDir, 'icon.png'), pngs.find((p) => p.size === 256).png);
fs.writeFileSync(path.join(outDir, 'icon.ico'), encodeICO(pngs));
fs.writeFileSync(path.join(outDir, 'tray.png'), scaled(img, 16).png());
fs.writeFileSync(path.join(outDir, 'tray@2x.png'), scaled(img, 32).png());
console.log('icons →', outDir);
