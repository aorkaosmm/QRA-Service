// 시드 고정 난수. 같은 임무·같은 날짜의 보상은 항상 같은 결과가 나오도록(재체크 악용 방지·테스트 재현성).

/** 문자열 → 32비트 해시 (FNV-1a) */
export function hashString(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — 0 이상 1 미만 난수를 돌려주는 함수 생성 */
export function createRng(seed) {
  let a = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    /** min 이상 max 이하 정수 */
    int(min, max) { return min + Math.floor(next() * (max - min + 1)); },
    range(min, max) { return min + next() * (max - min); },
    chance(p) { return next() < p; },
    pick(arr) { return arr[Math.floor(next() * arr.length)]; },
    /** { key: weight } 에서 가중치 추첨 */
    weighted(weights) {
      const entries = Object.entries(weights).filter(([, w]) => w > 0);
      const total = entries.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [k, w] of entries) {
        if ((r -= w) < 0) return k;
      }
      return entries[entries.length - 1][0];
    },
  };
}

/** 충돌 가능성이 매우 낮은 ID (기기 간 동기화를 고려해 시간+난수) */
export function newId(prefix = '') {
  const t = Date.now().toString(36);
  const r = Math.floor(Math.random() * 0x7fffffff).toString(36);
  const r2 = Math.floor(Math.random() * 0x7fffffff).toString(36);
  return `${prefix}${t}${r}${r2}`.slice(0, 24);
}
