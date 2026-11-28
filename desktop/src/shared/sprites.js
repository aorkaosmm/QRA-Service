// 도트 스프라이트 원본 데이터 (직접 그린 오리지널 아트). 문자 하나 = 픽셀 하나, '.' = 투명.
// 색은 팔레트 문자로 지정하고, 장비 등급에 따라 팔레트만 바꿔 같은 그림을 재사용한다.

import { flipX, flipY, rotateCW, resample, scaleRows, padRows, overlayRows } from './pixel.js';

/* ───────────── 공통 색 ───────────── */

export const INK = '#1a1423';

export const HERO_BASE_PALETTE = {
  o: INK,
  s: '#ffd6ae', S: '#eba882', e: INK, r: '#ff9c9c',
  h: '#7a4a2c', H: '#53301b', j: '#9c633d',          // 머리카락(투구 없을 때)
  a: '#3f9b55', A: '#2b6d3b', q: '#62c277',          // 기본 튜닉(갑옷 없을 때)
  b: '#7a5232',                                       // 허리띠
  c: null, C: null, k: null,                          // 망토·망토 외곽선(없으면 투명)
  l: '#3c4b7d', L: '#2b3558', f: '#5b3b29',
};

/** 장비 등급별 금속·천 색 */
export const GEAR_COLORS = {
  common:    { main: '#aeb6c2', shade: '#6d7584', light: '#e6eaf0', cloth: '#8c7f70', clothShade: '#5f554a' },
  rare:      { main: '#4aa8ff', shade: '#1f5fbf', light: '#c4e6ff', cloth: '#2f7de1', clothShade: '#1b4b93' },
  epic:      { main: '#b672ff', shade: '#6c33c8', light: '#ead2ff', cloth: '#9a44e0', clothShade: '#5c2296' },
  legendary: { main: '#ffc83a', shade: '#c47a10', light: '#fff4b8', cloth: '#ff8a1f', clothShade: '#b8500a' },
};

/* ───────────── 용사 (16×16, 오른쪽 바라봄) ───────────── */

const HERO_BASE = [
  '................',
  '......ooooo.....',
  '....oojhhhhoo...',
  '...ojjhhhhhhho..',
  '..oHhhhhhhhhhho.',
  '..oHhhhhhshssho.',
  '..oHHhsssssssso.',
  '..oHHhsssesseso.',
  '..oHHhsssesseso.',
  '...oHSssrsssrso.',
  '...kooSsssssSo..',
  '..kccoqaaaaAo...',
  '.kcCcoaaaaaaso..',
  '.kcCcobbbbbbo...',
  '.kcCkolloollo...',
  '..kk.offooffo...',
];

const LEGS_APART = ['.kcCollo..ollo..', '..kkoffo..offo..'];
const EYES_HURT = ['..oHHhssseeseeo.', '..oHHhsssssssso.'];
const EYES_CLOSED = ['..oHHhsssssssso.', '..oHHhsseesseeo.'];

const replaceRows = (base, from, rows) => base.map((r, i) => (i >= from && i < from + rows.length ? rows[i - from] : r));
const bobUp = (rows) => [...rows.slice(1, 13), rows[12], ...rows.slice(13)];
const breathe = (rows) => [rows[0], ...rows.slice(0, 11), ...rows.slice(12)];

export const HERO_FRAMES = {
  idle0: HERO_BASE,
  idle1: breathe(HERO_BASE),
  walk0: replaceRows(HERO_BASE, 14, LEGS_APART),
  walk1: bobUp(HERO_BASE),
  hurt: replaceRows(HERO_BASE, 7, EYES_HURT),
  blink: replaceRows(HERO_BASE, 7, EYES_CLOSED),
};
// 쓰러짐: 눈 감은 몸을 눕힌다 (머리가 왼쪽)
const trimBottom = (rows) => {
  let end = rows.length;
  while (end > 1 && /^\.+$/.test(rows[end - 1])) end--;
  return rows.slice(0, end);
};
HERO_FRAMES.faint = padRows(trimBottom(flipY(rotateCW(replaceRows(HERO_BASE, 7, EYES_CLOSED)))), 16, 16);

/** 손 위치(무기 손잡이가 놓일 곳) — 프레임 좌표 */
export const HERO_HAND = { x: 12, y: 12 };

/* ───────────── 무기 ───────────── */
// x: 칼날 밝은 면, m: 칼날, g: 가드, p: 손잡이, G: 폼멜

const SWORD_UP = [
  '..oo..',
  '.oxmo.',
  '.oxmo.',
  '.oxmo.',
  '.oxmo.',
  '.oxmo.',
  '.oxmo.',
  'oggggo',
  '.oppo.',
  '.oppo.',
  '.oGGo.',
  '..oo..',
];

const SWORD_DIAG = [
  '........oo',
  '.......oxo',
  '......oxmo',
  '.....oxmo.',
  '....oxmo..',
  '.oo.xmo...',
  '.ogomo....',
  '..oggo....',
  '.opoogo...',
  'oGo..oo...',
  '.o........',
];

export const WEAPON_SPRITES = {
  up: { rows: SWORD_UP, grip: { x: 2, y: 9 } },
  fwd: { rows: rotateCW(SWORD_UP), grip: { x: 2, y: 2 } },
  diagUp: { rows: SWORD_DIAG, grip: { x: 2, y: 8 } },
  diagDown: { rows: flipY(SWORD_DIAG), grip: { x: 2, y: 2 } },
  back: { rows: flipX(SWORD_DIAG), grip: { x: 7, y: 8 } },
};

/* 활·총·지팡이 (같은 팔레트 문자: x 밝은 면, m 몸체, g 장식, p 나무, G 그림자) */
const STAFF_UP = [
  '..oo..',
  '.oxmo.',
  'oxmmGo',
  'omGGGo',
  '.oggo.',
  '.oppo.',
  '.oppo.',
  '.oppo.',
  '.oppo.',
  '.oppo.',
  '.oppo.',
  '.oggo.',
  '..oo..',
];
const STAFF_DIAG = [
  '.......oo.',
  '......oxmo',
  '.....oxmGo',
  '.....omGo.',
  '....ogo...',
  '...opo....',
  '..opo.....',
  '.opo......',
  'opo.......',
  'oo........',
  '..........',
];
const BOW = [
  '.oo...',
  'o.mo..',
  'o..mo.',
  'o...mo',
  'o...xo',
  'o...mo',
  'o..gpo',
  'o..gpo',
  'o..mo.',
  'o.mo..',
  '.oo...',
];
const GUN = [
  '.oooooooo',
  'oxxmmmmmo',
  'ommGoooo.',
  'oppo.....',
  'oppo.....',
  '.oo......',
];
const rotateCCW = (rows) => rotateCW(rotateCW(rotateCW(rows)));

export const ARROW_FX = [
  '......ww..',
  'wwwwwwwwww',
  '......ww..',
];
export const FLASH_FX = [
  '..w..',
  'w.w.w',
  '.www.',
  'w.w.w',
  '..w..',
];
export const MAGIC_FX = [
  '...w...',
  '..w.w..',
  '.w...w.',
  'w..w..w',
  '.w...w.',
  '..w.w..',
  '...w...',
];

export const SLASH = [
  '..ww....',
  '....ww..',
  '.....ww.',
  '......w.',
  '......ww',
  '.......w',
  '.......w',
  '......ww',
  '......w.',
  '.....ww.',
  '....ww..',
  '..ww....',
];

/** 무기 종류별 자세 그림 + 공격 효과 위치 */
export const WEAPON_SETS = {
  sword: { ...WEAPON_SPRITES, fx: SLASH, fxAt: { dx: 4, dy: -9 } },
  staff: {
    up: { rows: STAFF_UP, grip: { x: 2, y: 9 } },
    fwd: { rows: rotateCW(STAFF_UP), grip: { x: 3, y: 2 } },
    diagUp: { rows: STAFF_DIAG, grip: { x: 2, y: 7 } },
    diagDown: { rows: flipY(STAFF_DIAG), grip: { x: 2, y: 3 } },
    fx: MAGIC_FX,
    fxAt: { dx: 9, dy: -6 },
  },
  bow: {
    // 활은 팔을 앞으로 뻗어 몸 앞에서 든다
    up: { rows: BOW, grip: { x: 4, y: 7 } },
    fwd: { rows: BOW, grip: { x: 4, y: 7 } },
    diagUp: { rows: BOW, grip: { x: 4, y: 7 } },
    diagDown: { rows: BOW, grip: { x: 4, y: 7 } },
    handDx: 3,
    fx: ARROW_FX,
    fxAt: { dx: 2, dy: -3 },
  },
  gun: {
    up: { rows: rotateCCW(GUN), grip: { x: 3, y: 6 } },
    fwd: { rows: GUN, grip: { x: 2, y: 3 } },
    diagUp: { rows: GUN, grip: { x: 2, y: 3 } },
    diagDown: { rows: GUN, grip: { x: 2, y: 3 } },
    fx: FLASH_FX,
    fxAt: { dx: 8, dy: -5 },
  },
};

/* ───────────── 슬라임 (16×12, 오른쪽 바라봄) ───────────── */

const SLIME_BASE = [
  '................',
  '................',
  '......oooo......',
  '....ooggggoo....',
  '...ogglwggggo...',
  '..oggglggggggo..',
  '..oggggggegego..',
  '.ogggggggegegGo.',
  '.oggggggggggGGo.',
  '.oGgggggggggGGo.',
  '..oGGGGGGGGGGo..',
  '...oooooooooo...',
];

const trimTop = (rows) => {
  let i = 0;
  while (i < rows.length - 1 && /^\.+$/.test(rows[i])) i++;
  return rows.slice(i);
};

export const SLIME_FRAMES = {
  idle: SLIME_BASE,
  squash: padRows(resample(trimTop(SLIME_BASE), 18, 8), 18, 12),
  stretch: padRows(resample(trimTop(SLIME_BASE), 12, 12), 18, 12),
  hurt: replaceRows(SLIME_BASE, 6, ['..oggggggwgwgo..', '.ogggggggwgwgGo.']),
};
SLIME_FRAMES.idle = padRows(SLIME_BASE, 18, 12);
SLIME_FRAMES.hurt = padRows(SLIME_FRAMES.hurt, 18, 12);

export const SLIME_COLORS = {
  green:  { g: '#62d46f', G: '#2f8f48', l: '#a6f0a0', w: '#ffffff', e: INK, o: INK },
  blue:   { g: '#55a9ff', G: '#2763c4', l: '#b3dcff', w: '#ffffff', e: INK, o: INK },
  red:    { g: '#ff6d6d', G: '#b8324a', l: '#ffb3b3', w: '#ffffff', e: INK, o: INK },
  purple: { g: '#b884ff', G: '#6c3fc1', l: '#e1ccff', w: '#ffffff', e: INK, o: INK },
  metal:  { g: '#cfd6e0', G: '#7d8797', l: '#ffffff', w: '#ffffff', e: INK, o: INK },
  gold:   { g: '#ffd447', G: '#c28a14', l: '#fff3a8', w: '#ffffff', e: INK, o: INK },
};

export const CROWN = [
  '.y..y..y.',
  'oyoyyyoyo',
  'oyyyryyyo',
  'oYYYYYYYo',
  '.ooooooo.',
];
export const CROWN_PALETTE = { o: INK, y: '#ffd447', Y: '#c28a14', r: '#ff4d6d' };

/* ───────────── 보물 상자·동전·물약 ───────────── */

export const CHEST_CLOSED = [
  '............',
  '..oooooooo..',
  '.onnnnnnnno.',
  'onnnnnnnnnno',
  'oyyyyyyyyyyo',
  'onnnnyynnnno',
  'onnnnkknnnno',
  'onnnnyynnnno',
  'onnnnnnnnnno',
  'oddddddddddo',
  'oooooooooooo',
];
export const CHEST_OPEN = [
  '.oooooooooo.',
  'onnnnnnnnnno',
  'oyyyyyyyyyyo',
  'oiiiiiiiiiio',
  'oyyyyyyyyyyo',
  'onnnnyynnnno',
  'onnnnkknnnno',
  'onnnnyynnnno',
  'onnnnnnnnnno',
  'oddddddddddo',
  'oooooooooooo',
];
export const CHEST_PALETTE = { o: INK, n: '#b8743a', d: '#7d4a22', y: '#ffd447', k: INK, i: '#3a2350' };
export const CHEST_GOLD_PALETTE = { o: INK, n: '#ffcf4a', d: '#c28a14', y: '#fff3a8', k: INK, i: '#3a2350' };

export const COIN_FRAMES = [
  ['.ooo.', 'oywyo', 'oyyYo', 'oyYYo', '.ooo.'],
  ['..o..', '.owo.', '.oyo.', '.oYo.', '..o..'],
];
export const COIN_PALETTE = { o: '#8a5a00', y: '#ffd447', Y: '#e0a419', w: '#fffbe0' };

export const POTION = [
  '...oo...',
  '..onno..',
  '..oooo..',
  '...oo...',
  '..owwo..',
  '.orwrro.',
  'orrwrrro',
  'orrrrrRo',
  'oRrrrRRo',
  '.oRRRRo.',
  '..oooo..',
];
export const POTION_PALETTE = { o: INK, n: '#a0703a', w: '#ffe4ea', r: '#ff4d6d', R: '#b82a48' };

/* ───────────── 장비 아이콘 (12×12) ───────────── */
// m 금속, M 금속 그림자, x 밝은 면, c 천, C 천 그림자, p 손잡이, y 장식

/** 무기 종류별 장비 아이콘 (12×12, 검은 ITEM_ICONS.weapon) */
export const WEAPON_ICONS = {
  bow: [
    '...oo.......',
    '...omo......',
    '...o.mo.....',
    '...o..mo....',
    '...o...mo...',
    '...o..oppo..',
    '...o..oppo..',
    '...o...mo...',
    '...o..mo....',
    '...o.mo.....',
    '...omo......',
    '...oo.......',
  ],
  gun: [
    '............',
    '............',
    '.oooooooooo.',
    'oxxmmmmmmmmo',
    'ommmmmmmmmo.',
    'oMMMoooooo..',
    'oppo.oo.....',
    'oppo..o.....',
    'oppo.oo.....',
    'oppo........',
    '.oo.........',
    '............',
  ],
  staff: [
    '.........oo.',
    '........oxmo',
    '.......oxmMo',
    '.......omMo.',
    '......opo...',
    '.....opo....',
    '....opo.....',
    '...opo......',
    '..opo.......',
    '.opo........',
    'opo.........',
    'oo..........',
  ],
};

export const ITEM_ICONS = {
  weapon: [
    '..........oo',
    '.........oxo',
    '........oxmo',
    '.......oxmo.',
    '......oxmo..',
    '..oo.oxmo...',
    '..oMoxmo....',
    '...oMmo.....',
    '..opoMo.....',
    '.opo.oo.....',
    'oyo.........',
    '.o..........',
  ],
  helmet: [
    '....oooo....',
    '..ooxxmmoo..',
    '.oxxmmmmmMo.',
    '.oxmmmmmmMo.',
    'oxmmmmmmmmMo',
    'oxmoooooomMo',
    'oxmmmoommmMo',
    'oxmmmoommmMo',
    'oMmmmoommMMo',
    '.oMmmoomMMo.',
    '..oooooooo..',
    '............',
  ],
  armor: [
    '.oo......oo.',
    'oxmo....omMo',
    'oxmmooooomMo',
    'oxmmmxxmmmMo',
    '.oxmmxxmmMo.',
    '.oxmmmmmmMo.',
    '.oxmmyymmMo.',
    '.oxmmmmmmMo.',
    '.oMmmmmmmMo.',
    '..oMmmmmMo..',
    '...oooooo...',
    '............',
  ],
  cape: [
    '..oooooooo..',
    '.oyyyyyyyyo.',
    '.occcccccco.',
    'occcccccccCo',
    'occcccccccCo',
    'occcccccccCo',
    'occcccccCCCo',
    'occcccccCCCo',
    'occccccCCCCo',
    'occccccCCCCo',
    'oCcoCcoCCoCo',
    '.oo.oo.oo.o.',
  ],
};

/* ───────────── UI 아이콘 (10×10) ───────────── */

export const UI_ICONS = {
  heart: {
    rows: ['.oo..oo...', 'orro.orro.', 'orwrrrrro.', 'orrrrrrRo.', '.orrrrRo..', '..orrRo...', '...oRo....', '....o.....', '..........', '..........'],
    palette: { o: INK, r: '#ff4d6d', R: '#b82a48', w: '#ffd0da' },
  },
  star: {
    rows: ['....o.....', '...oyo....', '...oyo....', 'oooyyyooo.', 'oyyywyyyo.', '.oyyyyyo..', '..oyyyo...', '.oyYoYyo..', '.oYo.oYo..', '.oo...oo..'],
    palette: { o: INK, y: '#7fe3ff', Y: '#3aa6d6', w: '#ffffff' },
  },
  coin: {
    rows: ['..oooo....', '.oyyyyo...', 'oyywyyYo..', 'oywyyyYo..', 'oyyyyyYo..', 'oyyyyYYo..', '.oYYYYo...', '..oooo....', '..........', '..........'],
    palette: { o: '#8a5a00', y: '#ffd447', Y: '#e0a419', w: '#fffbe0' },
  },
  flame: {
    rows: ['....o.....', '...oro....', '...orro...', '..orrro...', '.oryrrro..', '.oryyrro..', 'oryyyyrro.', 'oryywyyro.', '.oryyyyo..', '..oooooo..'],
    palette: { o: INK, r: '#ff6a2b', y: '#ffd447', w: '#fff7d6' },
  },
  calendar: {
    rows: ['.o....o...', 'ooooooooo.', 'orrrrrrro.', 'owwwwwwwo.', 'owkwkwkwo.', 'owwwwwwwo.', 'owkwkwkwo.', 'owwwwwwwo.', 'ooooooooo.', '..........'],
    palette: { o: INK, r: '#ff5c6c', w: '#f4f1ea', k: '#7a7f8c' },
  },
  sword: {
    rows: ['.......oo.', '......oxo.', '.....oxmo.', '....oxmo..', '.oo.xmo...', '.oyomo....', '..oyo.....', '.opoyo....', 'opo.oo....', '.o........'],
    palette: { o: INK, x: '#ffffff', m: '#b7c0cc', y: '#ffd447', p: '#8a5a33' },
  },
  bag: {
    rows: ['...oooo...', '..o....o..', '..oooooo..', '.onnnnnno.', 'onnyyyynno', 'onnyonynno', 'onnnnnnnno', 'onnnnnnndo', '.oddddddo.', '..oooooo..'],
    palette: { o: INK, n: '#c98a4b', d: '#8a5a2b', y: '#ffd447' },
  },
  shop: {
    rows: ['..oooooo..', '.orwrwrwo.', 'orwrwrwrwo', 'oooooooooo', '.onnnnnno.', '.onyyonno.', '.onyyonno.', '.onnnonno.', '.oooooooo.', '..........'],
    palette: { o: INK, r: '#ff5c6c', w: '#f4f1ea', n: '#c98a4b', y: '#7fe3ff' },
  },
  gear: {
    rows: ['...oo.....', '.o.oo.o...', 'oooggooo..', '.oggggo...', 'oogoogoo..', 'oogoogoo..', '.oggggo...', 'oooggooo..', '.o.oo.o...', '...oo.....'],
    palette: { o: INK, g: '#b7c0cc' },
  },
  check: {
    rows: ['..........', '.......oo.', '......ogo.', '.oo..ogo..', 'ogo.ogo...', '.ogogo....', '..ogo.....', '...o......', '..........', '..........'],
    palette: { o: INK, g: '#ffffff' },
  },
  lock: {
    rows: ['..oooo....', '.o....o...', '.o....o...', 'oooooooo..', 'oyyyyyyo..', 'oyyooyyo..', 'oyyooyyo..', 'oyyyyyyo..', 'oooooooo..', '..........'],
    palette: { o: INK, y: '#ffd447' },
  },
  crown: {
    rows: ['..........', 'o..o..o...', 'oo.oo.oo..', 'oyoyyoyo..', 'oyyyryyo..', 'oyyyyyyo..', 'oYYYYYYo..', '.oooooo...', '..........', '..........'],
    palette: { o: INK, y: '#ffd447', Y: '#c28a14', r: '#ff4d6d' },
  },
  pin: {
    rows: ['...oooo...', '..oyyyyo..', '..oyyyYo..', '..oyyyYo..', '.oyyyyyYo.', 'oooooooooo', '....oo....', '....oo....', '....o.....', '..........'],
    palette: { o: INK, y: '#ff5c6c', Y: '#b82a48' },
  },
  min: {
    rows: ['..........', '..........', '..........', '..........', '..........', '.oooooooo.', '.owwwwwwo.', '.oooooooo.', '..........', '..........'],
    palette: { o: INK, w: '#ece9f5' },
  },
  close: {
    rows: ['..........', '.oo....oo.', 'owwo..owwo', '.owwoowwo.', '..owwwwo..', '..owwwwo..', '.owwoowwo.', 'owwo..owwo', '.oo....oo.', '..........'],
    palette: { o: INK, w: '#ece9f5' },
  },
  edit: {
    rows: ['......oo..', '.....oyyo.', '....oyyo..', '...owwo...', '..owwo....', '.owwo.....', '.oko......', 'oooo......', '..........', '..........'],
    palette: { o: INK, y: '#ff9fb0', w: '#ffd447', k: '#7a5232' },
  },
  trash: {
    rows: ['...oooo...', 'oooooooooo', '.owwwwwwo.', '.owkwkwko.', '.owkwkwko.', '.owkwkwko.', '.owkwkwko.', '.owwwwwwo.', '..oooooo..', '..........'],
    palette: { o: INK, w: '#cfd6e0', k: '#7d8797' },
  },
  plus: {
    rows: ['..........', '...ooo....', '...owo....', '.oooweooo.', '.owwwwwwo.', '.oooweooo.', '...owo....', '...ooo....', '..........', '..........'],
    palette: { o: INK, w: '#ffffff', e: '#ffffff' },
  },
  dungeon: {
    rows: ['..oooooo..', '.oggggggo.', 'oggokkoggo', 'ogokkkkogo', 'ogokkkkogo', 'ogokykyogo', 'ogokkkkogo', 'ogokkkkogo', 'ogokkkkogo', 'oooooooooo'],
    palette: { o: INK, g: '#9aa3b5', k: '#2a2238', y: '#ffd447' },
  },
  trophy: {
    rows: ['.oooooooo.', 'oyyywyyyyo', 'oyoywyyoyo', 'oyoyyyyoyo', '.oyyyyyyo.', '..oyyyyo..', '...oyyo...', '...oYYo...', '..oYYYYo..', '..oooooo..'],
    palette: { o: INK, y: '#ffd447', Y: '#c28a14', w: '#fff8d0' },
  },
  chat: {
    rows: ['..oooooo..', '.owwwwwwo.', 'owwwwwwwwo', 'owwkwkwkwo', 'owwwwwwwwo', '.owwwwwwo.', '.oowoooo..', '.owo......', '.oo.......', '..........'],
    palette: { o: INK, w: '#f4f1ea', k: '#4a4458' },
  },
  ticket: {
    rows: ['..........', 'oooooooooo', 'oyyyyyoyyo', '.oyrryoyyo', '.oyrryoyyo', 'oyyyyyoyyo', 'oooooooooo', '..........', '..........', '..........'],
    palette: { o: INK, y: '#b46cff', r: '#ffd447' },
  },
  party: {
    rows: ['..........', '.oo...oo..', 'oyyo.oyyo.', 'oyyo.oyyo.', '.oo...oo..', 'obbo.occo.', 'obbbooccco', 'obbbooccco', 'oooooooooo', '..........'],
    palette: { o: INK, y: '#ffd0a8', b: '#4aa8ff', c: '#ff8a5c' },
  },
};

/* ───────────── 던전 · 레이드 ───────────── */

/** 보석 (10×10). 팔레트는 GEMS 색으로 */
export const GEM_ROWS = ['..........', '..oooooo..', '.olwlccco.', 'ollccccCCo', '.occcccCo.', '..occcCo..', '...occo...', '....oo....', '..........', '..........'];
export function gemPalette(g) {
  return { o: INK, c: g.color, C: g.shade, l: g.light, w: '#ffffff' };
}

/** 보스 뿔 (왼쪽, 오른쪽은 좌우 반전) */
export const HORN = ['o...', 'wo..', 'wwo.', '.wwo', '..wo'];
export const HORN_PALETTE = { o: INK, w: '#f4e9d0' };

/** 레이드 보물상자 색 */
export const CHEST_RAID_PALETTE = { o: INK, n: '#8a5ad6', d: '#4f2d91', y: '#7fe3ff', k: INK, i: '#1a1030' };

/** 몬스터·보스 색 (슬라임 팔레트 문자 g/G/l/w/e/o) */
export const MONSTER_COLORS = {
  amber:  { g: '#ffb35c', G: '#c2621a', l: '#ffe0b3', w: '#ffffff', e: INK, o: INK },
  poison: { g: '#9be15d', G: '#5a8f2a', l: '#e4ffb0', w: '#ffffff', e: '#b0306a', o: INK },
  frost:  { g: '#c8f1ff', G: '#5aa9d6', l: '#ffffff', w: '#ffffff', e: '#2a4a8a', o: INK },
  abyss:  { g: '#2d3f7a', G: '#151f45', l: '#5a7bd6', w: '#bfe0ff', e: '#7fe3ff', o: INK },
  shadow: { g: '#3a2a52', G: '#1c1230', l: '#6a4f8f', w: '#e1ccff', e: '#ff4d6d', o: INK },
};

/* ───────────── 분류 아이콘 (10×10) ───────────── */

export const CATEGORY_ICONS = {
  todo: {
    rows: ['..oooo....', 'oowwwwoo..', 'owgwkkwo..', 'owwwwwwo..', 'owgwkkwo..', 'owwwwwwo..', 'owwwkkwo..', 'owwwwwwo..', 'oooooooo..', '..........'],
    palette: { o: INK, w: '#f4f1ea', k: '#7a7f8c', g: '#3fbf6a' },
  },
  study: {
    rows: ['..........', 'ooooo.oooo', 'obbbbobbbo', 'obwwbobwwo', 'obbbbobbbo', 'obwwbobwwo', 'obbbbobbbo', 'oooooBoooo', '....oo....', '..........'],
    palette: { o: INK, b: '#56ccf2', B: '#2b8db3', w: '#d9f4ff' },
  },
  work: {
    rows: ['..........', '...oooo...', '...o..o...', 'oooooooooo', 'onnnnnnnno', 'onnnyynnno', 'oooooooooo', 'onnnnnnnno', 'oooooooooo', '..........'],
    palette: { o: INK, n: '#bb86fc', y: '#ffd447' },
  },
  meal: {
    rows: ['...w.w....', '..w.w.....', '.owwwwwwo.', 'owwwwwwwwo', 'oooooooooo', 'onnnnnnnno', '.onnnnnno.', '..onnnno..', '...oooo...', '..........'],
    palette: { o: INK, w: '#fff7ea', n: '#ff9f5a' },
  },
  exercise: {
    rows: ['..........', 'oo......oo', 'oko....oko', 'okooooooko', 'okggggggko', 'okooooooko', 'oko....oko', 'oo......oo', '..........', '..........'],
    palette: { o: INK, k: '#6fdc8c', g: '#cfd6e0' },
  },
  life: {
    rows: ['....oo....', '...orro...', '..orrrro..', '.orrrrrro.', 'oooooooooo', '.owwwwwwo.', '.owwoowwo.', '.owwoywwo.', '.oooooooo.', '..........'],
    palette: { o: INK, r: '#ff7a59', w: '#f4f1ea', y: '#ffd447' },
  },
};

/* ───────────── 3×5 비트맵 글꼴 (데미지 숫자 등) ───────────── */

export const FONT_3X5 = {
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '011', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'],
  7: ['111', '001', '001', '010', '010'],
  8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
  '+': ['000', '010', '111', '010', '000'],
  '-': ['000', '000', '111', '000', '000'],
  '!': ['010', '010', '010', '000', '010'],
  '.': ['000', '000', '000', '000', '010'],
  ' ': ['000', '000', '000', '000', '000'],
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['110', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
};

/* ───────────── 팔레트 조합 ───────────── */

/** 장착 장비(부위 → 아이템 또는 null)로 용사 팔레트를 만든다 */
export function heroPalette(gear = {}) {
  const p = { ...HERO_BASE_PALETTE };
  if (gear.helmet) {
    const g = GEAR_COLORS[gear.helmet.rarity];
    p.h = g.main; p.H = g.shade; p.j = g.light;
  }
  if (gear.armor) {
    const g = GEAR_COLORS[gear.armor.rarity];
    p.a = g.main; p.A = g.shade; p.q = g.light;
  }
  if (gear.cape) {
    const g = GEAR_COLORS[gear.cape.rarity];
    p.c = g.cloth; p.C = g.clothShade; p.k = INK;
  }
  return p;
}

export function weaponPalette(rarity = 'common') {
  const g = GEAR_COLORS[rarity];
  return { o: INK, x: g.light, m: g.main, g: rarity === 'common' ? '#8a6a45' : g.shade, p: '#7a5232', G: g.shade };
}

/** 장비 아이콘 팔레트 */
export function itemIconPalette(rarity) {
  const g = GEAR_COLORS[rarity];
  return { o: INK, m: g.main, M: g.shade, x: g.light, c: g.cloth, C: g.clothShade, p: '#7a5232', y: rarity === 'legendary' ? '#fff4b8' : '#ffd447' };
}

/**
 * 용사 + 무기를 한 장으로 합성한 문자열 격자와 팔레트 (32×24, 발 중앙 = (16, 23))
 * pose: 'idle0' | 'idle1' | 'walk0' | 'walk1' | 'hurt' | 'blink' | 'faint' | 'atk0' | 'atk1' | 'atk2'
 */
export function composeHero(pose, gear = {}) {
  const W = 32;
  const H = 24;
  const ox = 8; // 용사 프레임을 놓는 위치
  const oy = 8;
  const bodyKey = { atk0: 'idle0', atk1: 'walk0', atk2: 'idle0' }[pose] || pose;
  const body = HERO_FRAMES[bodyKey] || HERO_FRAMES.idle0;
  const lean = pose === 'atk1' ? 1 : pose === 'atk0' ? -1 : 0;
  const canvas = Array.from({ length: H }, () => '.'.repeat(W).split(''));
  const put = (rows, dx, dy, map) => {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        const cx = dx + x;
        const cy = dy + y;
        if (cx < 0 || cy < 0 || cx >= W || cy >= H) return;
        canvas[cy][cx] = map ? map[ch] || ch : ch;
      });
    });
  };
  // 무기 키를 용사 팔레트와 겹치지 않게 대문자/숫자 계열로 치환
  const WMAP = { o: 'o', x: '1', m: '2', g: '3', p: '4', G: '5' };
  const POSES = { atk0: 'up', atk1: 'fwd', atk2: 'diagDown', faint: null };
  const weaponPose = pose in POSES ? POSES[pose] : 'diagUp';
  const hand = pose === 'atk0'
    ? { x: ox + 14 + lean, y: oy + 12 } // 칼을 세워 들고 몸을 뒤로 젖힘
    : { x: ox + HERO_HAND.x + lean, y: oy + HERO_HAND.y };
  const wtype = gear.weapon ? gear.weapon.type || gear.weapon.weaponType || 'sword' : 'sword';
  const set = WEAPON_SETS[wtype] || WEAPON_SETS.sword;
  const weapon = gear.weapon && weaponPose ? set[weaponPose] : null;
  if (set.handDx) hand.x += set.handDx;
  const behind = weaponPose === 'back';
  if (weapon && behind) put(weapon.rows, hand.x - weapon.grip.x, hand.y - weapon.grip.y, WMAP);
  put(body, ox + lean, oy);
  if (weapon && !behind) put(weapon.rows, hand.x - weapon.grip.x, hand.y - weapon.grip.y, WMAP);
  if (pose === 'atk1') put(set.fx, hand.x + set.fxAt.dx, hand.y + set.fxAt.dy, { w: '6' });
  const wp = weaponPalette(gear.weapon ? gear.weapon.rarity : 'common');
  const palette = {
    ...heroPalette(gear),
    1: wp.x, 2: wp.m, 3: wp.g, 4: wp.p, 5: wp.G, 6: '#ffffffcc',
  };
  return { rows: canvas.map((r) => r.join('')), palette, foot: { x: 16, y: 23 } };
}

export { flipX, flipY, scaleRows, overlayRows };
