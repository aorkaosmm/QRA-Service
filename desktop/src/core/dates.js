// 날짜 유틸. 모든 날짜 키는 로컬 시간 기준 'YYYY-MM-DD' 문자열.

import { WEEKDAYS_KO } from './constants.js';

const pad = (n) => String(n).padStart(2, '0');

export function toKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 하루 시작 시각(dayStartHour)을 반영한 '오늘' 키. 예: 시작 4시면 새벽 3시는 전날로 취급 */
export function dayKey(now = Date.now(), dayStartHour = 0) {
  const d = new Date(typeof now === 'number' ? now : now.getTime());
  d.setHours(d.getHours() - dayStartHour);
  return toKey(d);
}

export function addDays(key, n) {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function weekday(key) {
  return parseKey(key).getDay();
}

export function daysInMonth(year, month0) {
  return new Date(year, month0 + 1, 0).getDate();
}

/** 두 키 사이의 일수 (b - a) */
export function diffDays(a, b) {
  const ms = parseKey(b).getTime() - parseKey(a).getTime();
  return Math.round(ms / 86400000);
}

/** 월간 달력용 6주(42일) 키 배열. 일요일 시작 */
export function monthGrid(year, month0) {
  const first = new Date(year, month0, 1);
  const start = new Date(year, month0, 1 - first.getDay());
  const out = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    out.push(toKey(d));
  }
  return out;
}

export function formatKo(key, { withYear = false } = {}) {
  const d = parseKey(key);
  const s = `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS_KO[d.getDay()]})`;
  return withYear ? `${d.getFullYear()}년 ${s}` : s;
}

/** 'HH:MM' → 분 */
export function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
