// 대한민국 공휴일 계산 (관공서의 공휴일에 관한 규정 + 대체공휴일 규칙).
// 양력 고정 공휴일과 대체공휴일은 규칙으로 계산하고, 음력 공휴일·선거일·임시공휴일은 표로 관리한다.
// 2028년 이후 음력 공휴일은 우주항공청(한국천문연구원) 월력요항 발표 후 LUNAR 표에 추가.

import { toKey, parseKey, addDays, weekday } from './dates.js';

// sub: 'weekend' = 토·일 또는 다른 공휴일과 겹치면 대체공휴일, null = 대체공휴일 없음
const FIXED = [
  { md: '01-01', name: '신정',     sub: null },
  { md: '03-01', name: '삼일절',   sub: 'weekend' },
  { md: '05-01', name: '노동절',   sub: 'weekend', since: 2026 },
  { md: '05-05', name: '어린이날', sub: 'weekend' },
  { md: '06-06', name: '현충일',   sub: null },
  { md: '07-17', name: '제헌절',   sub: 'weekend', since: 2026 },
  { md: '08-15', name: '광복절',   sub: 'weekend' },
  { md: '10-03', name: '개천절',   sub: 'weekend' },
  { md: '10-09', name: '한글날',   sub: 'weekend' },
  { md: '12-25', name: '성탄절',   sub: 'weekend' },
];

// 음력 공휴일(양력 환산). seollal/chuseok = 당일, buddha = 부처님오신날
const LUNAR = {
  2025: { seollal: '2025-01-29', buddha: '2025-05-05', chuseok: '2025-10-06' },
  2026: { seollal: '2026-02-17', buddha: '2026-05-24', chuseok: '2026-09-25' },
  2027: { seollal: '2027-02-07', buddha: '2027-05-13', chuseok: '2027-09-15' },
};

// 선거일·임시공휴일 (대체공휴일 대상 아님)
const ONE_OFF = {
  '2025-01-27': '임시공휴일',
  '2025-06-03': '대통령선거',
  '2026-06-03': '지방선거',
};

const cache = new Map();

/** 해당 연도의 { 'YYYY-MM-DD': '이름' } 맵 */
export function holidaysOfYear(year) {
  if (cache.has(year)) return cache.get(year);
  const map = {};
  const add = (key, name) => {
    map[key] = map[key] ? `${map[key]}·${name}` : name;
  };
  const groups = []; // 대체공휴일 판정 대상

  for (const f of FIXED) {
    if (f.since && year < f.since) continue;
    const key = `${year}-${f.md}`;
    add(key, f.name);
    if (f.sub) groups.push({ days: [key], rule: 'weekend' });
  }

  const lunar = LUNAR[year];
  if (lunar) {
    for (const [k, name] of [['seollal', '설날'], ['chuseok', '추석']]) {
      const day = lunar[k];
      const days = [addDays(day, -1), day, addDays(day, 1)];
      days.forEach((d) => add(d, name));
      groups.push({ days, rule: 'sunday' });
    }
    add(lunar.buddha, '부처님오신날');
    groups.push({ days: [lunar.buddha], rule: 'weekend' });
  }

  for (const [key, name] of Object.entries(ONE_OFF)) {
    if (key.startsWith(`${year}-`)) add(key, name);
  }

  // 겹침 판정용: 날짜별 몇 개의 공휴일이 걸려 있는지
  const count = {};
  const bump = (key) => { count[key] = (count[key] || 0) + 1; };
  for (const f of FIXED) if (!(f.since && year < f.since)) bump(`${year}-${f.md}`);
  if (lunar) {
    for (const k of ['seollal', 'chuseok']) [-1, 0, 1].forEach((n) => bump(addDays(lunar[k], n)));
    bump(lunar.buddha);
  }
  for (const key of Object.keys(ONE_OFF)) if (key.startsWith(`${year}-`)) bump(key);

  const isOff = (key) => {
    const wd = weekday(key);
    return wd === 0 || wd === 6 || Boolean(map[key]);
  };

  groups.sort((a, b) => (a.days[0] < b.days[0] ? -1 : 1));
  const claimedOverlap = new Set(); // 겹친 날은 대체공휴일 1일만
  for (const g of groups) {
    let needed = 0;
    for (const d of g.days) {
      const wd = weekday(d);
      const weekendHit = g.rule === 'weekend' ? (wd === 0 || wd === 6) : wd === 0;
      if (weekendHit) {
        needed++;
      } else if (count[d] > 1 && !claimedOverlap.has(d)) {
        claimedOverlap.add(d);
        needed++;
      }
    }
    let cursor = g.days[g.days.length - 1];
    while (needed > 0) {
      cursor = addDays(cursor, 1);
      if (!isOff(cursor)) {
        add(cursor, '대체공휴일');
        needed--;
      }
    }
  }

  cache.set(year, map);
  return map;
}

/** 날짜 키의 공휴일 이름 (없으면 null) */
export function holidayName(key) {
  const year = parseKey(key).getFullYear();
  return holidaysOfYear(year)[key] || null;
}

export function isHoliday(key) {
  return holidayName(key) !== null;
}

export { toKey };
