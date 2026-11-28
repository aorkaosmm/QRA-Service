// 안드로이드 앱 웹 부분 빌드: web/ → www/ (JS 번들, CSS, 도트 글꼴)
// + 네이티브(홈 화면 위젯·라이브 배경화면)가 같은 도트 그림을 쓰도록 sprites.json 내보내기
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import {
  composeHero, heroPalette, HERO_BASE_PALETTE, GEAR_COLORS, SLIME_FRAMES, SLIME_COLORS,
  FONT_3X5, COIN_FRAMES, COIN_PALETTE, CROWN, CROWN_PALETTE, INK,
} from '../desktop/src/shared/sprites.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const desktop = path.join(here, '..', 'desktop');
const www = path.join(here, 'www');
const assets = path.join(here, 'android', 'app', 'src', 'main', 'assets');

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(path.join(www, 'fonts'), { recursive: true });

// JS
await esbuild.build({
  entryPoints: [path.join(here, 'web', 'app.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'chrome100',
  outfile: path.join(www, 'app.js'),
  legalComments: 'none',
  logLevel: 'warning',
});

// CSS + 글꼴
let css = [
  path.join(desktop, 'src/renderer/shared/base.css'),
  path.join(desktop, 'src/renderer/widget/widget.css'),
  path.join(here, 'web', 'app.css'),
].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
css = css.replace(/url\('\.\.\/\.\.\/\.\.\/assets\/fonts\/([^']+)'\)/g, (_, f) => `url('fonts/${f}')`);
css = (await esbuild.transform(css, { loader: 'css', minify: true })).code;
fs.writeFileSync(path.join(www, 'app.css'), css);
for (const f of ['Galmuri11.woff2', 'Galmuri11-Bold.woff2', 'Galmuri9.woff2', 'Galmuri-OFL.txt']) {
  fs.copyFileSync(path.join(desktop, 'assets', 'fonts', f), path.join(www, 'fonts', f));
}
fs.copyFileSync(path.join(here, 'web', 'index.html'), path.join(www, 'index.html'));

// 네이티브용 도트 그림 데이터. 색은 안드로이드 형식(#AARRGGBB)으로
const argb = (c) => {
  if (!c) return null;
  const h = c.replace('#', '');
  return h.length === 8 ? `#${h.slice(6)}${h.slice(0, 6)}` : `#ff${h}`;
};
const pal = (p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, argb(v)]));
const RARITIES = ['common', 'rare', 'epic', 'legendary'];
const base = pal(heroPalette({}));
const parts = {};
for (const slot of ['helmet', 'armor', 'cape']) {
  parts[slot] = {};
  for (const r of RARITIES) {
    const p = pal(heroPalette({ [slot]: { rarity: r } }));
    parts[slot][r] = Object.fromEntries(Object.entries(p).filter(([k, v]) => v !== base[k]));
  }
}
parts.weapon = {};
for (const r of RARITIES) {
  const p = pal(composeHero('idle0', { weapon: { rarity: r } }).palette);
  parts.weapon[r] = Object.fromEntries(['1', '2', '3', '4', '5', '6'].map((k) => [k, p[k]]));
}
const poses = ['idle0', 'idle1', 'walk0', 'walk1', 'atk0', 'atk1', 'atk2', 'hurt', 'faint'];
const sprites = {
  hero: {
    w: 32, h: 24, footX: 16,
    poses: Object.fromEntries(poses.map((p) => [p, composeHero(p, { weapon: { rarity: 'common' } }).rows])),
    // 무기 종류별 자세 (궁수 활 · 거너 총 · 마법사 지팡이). 색은 parts.weapon 팔레트를 같이 쓴다
    posesByWeapon: Object.fromEntries(['sword', 'bow', 'gun', 'staff'].map((t) => [t,
      Object.fromEntries(poses.map((p) => [p, composeHero(p, { weapon: { rarity: 'common', type: t } }).rows]))])),
    base,
    parts,
  },
  slime: { frames: SLIME_FRAMES, colors: Object.fromEntries(Object.entries(SLIME_COLORS).map(([k, v]) => [k, pal(v)])) },
  crown: { rows: CROWN, palette: pal(CROWN_PALETTE) },
  coin: { frames: COIN_FRAMES, palette: pal(COIN_PALETTE) },
  font: FONT_3X5,
  ink: argb(INK),
  gearColors: Object.fromEntries(Object.entries(GEAR_COLORS).map(([k, v]) => [k, pal(v)])),
};
void HERO_BASE_PALETTE;
fs.mkdirSync(assets, { recursive: true });
fs.writeFileSync(path.join(assets, 'sprites.json'), JSON.stringify(sprites));
const kb = (f) => `${(fs.statSync(f).size / 1024).toFixed(0)}KB`;
console.log(`www/app.js ${kb(path.join(www, 'app.js'))} · www/app.css ${kb(path.join(www, 'app.css'))} · assets/sprites.json ${kb(path.join(assets, 'sprites.json'))}`);
