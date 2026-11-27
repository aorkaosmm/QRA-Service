// 문자열 격자로 정의한 도트 스프라이트를 RGBA 픽셀로 바꾸는 순수 함수들 (브라우저·Node 공용).

/** '#rrggbb' | '#rrggbbaa' → [r,g,b,a] */
export function hexToRgba(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 6 ? h + 'ff' : h, 16);
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}

/**
 * 스프라이트 → { w, h, data: Uint8ClampedArray(RGBA) }
 * palette: { 문자: '#rrggbb' | null(투명) }
 */
export function rasterize(sprite, palette) {
  const h = sprite.length;
  const w = sprite[0].length;
  const data = new Uint8ClampedArray(w * h * 4);
  const cache = {};
  for (let y = 0; y < h; y++) {
    const row = sprite[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ' || ch === undefined) continue;
      const col = palette[ch];
      if (!col) continue;
      const rgba = cache[col] || (cache[col] = hexToRgba(col));
      const i = (y * w + x) * 4;
      data[i] = rgba[0];
      data[i + 1] = rgba[1];
      data[i + 2] = rgba[2];
      data[i + 3] = rgba[3];
    }
  }
  return { w, h, data };
}

/** 문자열 격자 변환 */
export const flipX = (rows) => rows.map((r) => [...r].reverse().join(''));
export const flipY = (rows) => [...rows].reverse();
/** 시계 방향 90도 회전 */
export function rotateCW(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const out = [];
  for (let x = 0; x < w; x++) {
    let line = '';
    for (let y = h - 1; y >= 0; y--) line += rows[y][x];
    out.push(line);
  }
  return out;
}

/** 최근접 리샘플 (찌그러짐/늘어남 프레임용). 바닥선 기준 정렬은 호출 측에서 */
export function resample(rows, newW, newH) {
  const h = rows.length;
  const w = rows[0].length;
  const out = [];
  for (let y = 0; y < newH; y++) {
    const sy = Math.min(h - 1, Math.floor(((y + 0.5) * h) / newH));
    let line = '';
    for (let x = 0; x < newW; x++) {
      const sx = Math.min(w - 1, Math.floor(((x + 0.5) * w) / newW));
      line += rows[sy][sx];
    }
    out.push(line);
  }
  return out;
}

/** 정수 배율 확대 */
export function scaleRows(rows, k) {
  const out = [];
  for (const r of rows) {
    const line = [...r].map((c) => c.repeat(k)).join('');
    for (let i = 0; i < k; i++) out.push(line);
  }
  return out;
}

/** 크기를 맞추려고 투명 여백을 붙인다 (anchor: 'bottom-center' 등) */
export function padRows(rows, w, h, { alignX = 'center', alignY = 'bottom' } = {}) {
  const ow = rows[0].length;
  const oh = rows.length;
  const left = alignX === 'left' ? 0 : alignX === 'right' ? w - ow : Math.floor((w - ow) / 2);
  const top = alignY === 'top' ? 0 : alignY === 'bottom' ? h - oh : Math.floor((h - oh) / 2);
  const out = [];
  for (let y = 0; y < h; y++) {
    const sy = y - top;
    if (sy < 0 || sy >= oh) { out.push('.'.repeat(w)); continue; }
    let line = '';
    for (let x = 0; x < w; x++) {
      const sx = x - left;
      line += sx >= 0 && sx < ow ? rows[sy][sx] : '.';
    }
    out.push(line);
  }
  return out;
}

/** 여러 레이어(같은 크기) 합성: 뒤 → 앞 순서, '.'은 투명 */
export function overlayRows(...layers) {
  const h = layers[0].length;
  const w = layers[0][0].length;
  const out = [];
  for (let y = 0; y < h; y++) {
    let line = '';
    for (let x = 0; x < w; x++) {
      let ch = '.';
      for (const L of layers) {
        const c = L[y] && L[y][x];
        if (c && c !== '.') ch = c;
      }
      line += ch;
    }
    out.push(line);
  }
  return out;
}
