// 안드로이드 이미지 리소스 생성: 앱 아이콘(왕관 슬라임), 시작 화면, 위젯 아이콘·미리보기, 배경화면 썸네일
// 사용: node scripts/make-android-assets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Canvas } from '../../desktop/scripts/png.mjs';
import { rasterize, hexToRgba } from '../../desktop/src/shared/pixel.js';
import { SLIME_FRAMES, SLIME_COLORS, CROWN, CROWN_PALETTE, composeHero } from '../../desktop/src/shared/sprites.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const res = path.join(here, '..', 'android', 'app', 'src', 'main', 'res');
const BG = '#1e1b2c';

/** 16×16 왕관 슬라임 */
function icon16() {
  const cv = new Canvas(16, 16);
  cv.blit(rasterize(SLIME_FRAMES.idle, SLIME_COLORS.green), -1, 3, 1);
  cv.blit(rasterize(CROWN, CROWN_PALETTE), 4, 0, 1);
  return { w: 16, h: 16, data: cv.data };
}

function fill(cv, test, color) {
  const rgba = hexToRgba(color);
  for (let y = 0; y < cv.h; y++) {
    for (let x = 0; x < cv.w; x++) if (test(x + 0.5, y + 0.5)) cv.data.set(rgba, (y * cv.w + x) * 4);
  }
}
const roundRect = (w, h, r) => (x, y) => {
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const circle = (w) => (x, y) => (x - w / 2) ** 2 + (y - w / 2) ** 2 <= (w / 2) ** 2;

function centered(cv, img, maxSize) {
  const k = Math.max(1, Math.floor(maxSize / Math.max(img.w, img.h)));
  cv.blit(img, Math.floor((cv.w - img.w * k) / 2), Math.floor((cv.h - img.h * k) / 2), k);
}

function write(rel, cv) {
  const f = path.join(res, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, cv.png());
}

const img = icon16();
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

// 앱 아이콘
for (const [d, k] of Object.entries(densities)) {
  const size = Math.round(48 * k);
  const sq = new Canvas(size, size);
  fill(sq, roundRect(size, size, size * 0.2), BG);
  centered(sq, img, size * 0.72);
  write(`mipmap-${d}/ic_launcher.png`, sq);
  const rd = new Canvas(size, size);
  fill(rd, circle(size), BG);
  centered(rd, img, size * 0.66);
  write(`mipmap-${d}/ic_launcher_round.png`, rd);
  const fgSize = Math.round(108 * k);
  const fg = new Canvas(fgSize, fgSize);
  centered(fg, img, fgSize * 0.56);
  write(`mipmap-${d}/ic_launcher_foreground.png`, fg);
}
fs.writeFileSync(path.join(res, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n    <color name="splash_bg">#17151f</color>\n</resources>\n`);

// 위젯 아이콘 · 시작 화면 아이콘
const wi = new Canvas(64, 64);
centered(wi, img, 64);
write('drawable-nodpi/widget_icon.png', wi);
const si = new Canvas(192, 192);
centered(si, img, 192);
write('drawable-nodpi/splash_icon.png', si);

// 시작 화면: 기존 Capacitor 그림 지우고 도트 아이콘으로
for (const dir of fs.readdirSync(res)) {
  const f = path.join(res, dir, 'splash.png');
  if (dir.startsWith('drawable') && fs.existsSync(f)) fs.rmSync(f);
}
fs.writeFileSync(path.join(res, 'drawable', 'splash.xml'), `<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/splash_bg" />
    <item>
        <bitmap android:filter="false" android:gravity="center" android:src="@drawable/splash_icon" />
    </item>
</layer-list>
`);

// 배경화면 썸네일: 밤하늘 + 땅 + 용사·슬라임
const T = 256;
const th = new Canvas(T, T);
const sky = ['#0f0d1f', '#1e1940', '#3d2a5c', '#7a4a6e'].map(hexToRgba);
const groundY = 196;
for (let y = 0; y < T; y++) {
  let c;
  if (y < groundY) {
    const f = (y / groundY) * 3;
    const i = Math.min(2, Math.floor(f));
    const t = Math.round((f - i) * 6) / 6;
    c = sky[i].map((v, j) => Math.round(v + (sky[i + 1][j] - v) * t));
  } else c = y < groundY + 4 ? hexToRgba('#3f9b55') : y < groundY + 8 ? hexToRgba('#2b6d3b') : hexToRgba('#3b281c');
  for (let x = 0; x < T; x++) th.data.set(c, (y * T + x) * 4);
}
for (let i = 0; i < 40; i++) {
  const x = (i * 97) % T;
  const y = (i * 53) % 120;
  th.data.set([255, 255, 255, 200], (y * T + x) * 4);
}
const hero = composeHero('atk1', { weapon: { rarity: 'rare' }, cape: { rarity: 'epic' } });
th.blit(rasterize(hero.rows, hero.palette), 40, groundY - 24 * 3, 3);
th.blit(rasterize(SLIME_FRAMES.idle, SLIME_COLORS.blue), 150, groundY - 12 * 3, 3);
write('drawable-nodpi/wallpaper_thumb.png', th);

// 위젯 미리보기 (안드로이드 11 이하 위젯 목록용)
function preview(w, h, draw) {
  const cv = new Canvas(w, h);
  fill(cv, roundRect(w, h, 28), '#191626');
  draw(cv);
  return cv;
}
write('drawable-nodpi/widget_preview_quests.png', preview(500, 300, (cv) => {
  cv.blit(img, 24, 20, 3);
  fill(cv, (x, y) => y > 86 && y < 96 && x > 24 && x < 476, '#33ffffff');
  fill(cv, (x, y) => y > 86 && y < 96 && x > 24 && x < 220, '#6fdc8c');
  for (let r = 0; r < 4; r++) {
    const y0 = 120 + r * 42;
    fill(cv, (x, y) => x > 24 && x < 52 && y > y0 && y < y0 + 28, r === 0 ? '#6fdc8c' : '#8f88ad');
    fill(cv, (x, y) => x > 68 && x < 380 - r * 40 && y > y0 + 9 && y < y0 + 19, '#ece9f5');
  }
}));
write('drawable-nodpi/widget_preview_hero.png', preview(260, 300, (cv) => {
  const idle = composeHero('idle0', { weapon: { rarity: 'common' } });
  cv.blit(rasterize(idle.rows, idle.palette), 34, 20, 6);
  fill(cv, (x, y) => x > 30 && x < 230 && y > 196 && y < 208, '#ff4d6d');
  fill(cv, (x, y) => x > 30 && x < 140 && y > 218 && y < 230, '#7fe3ff');
}));
console.log('android assets →', path.relative(process.cwd(), res));
