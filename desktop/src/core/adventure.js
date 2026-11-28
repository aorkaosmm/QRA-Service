// 던전 규칙: 필드 보스(매일 21:00, 20명, 5분 딜 순위), 요일 던전(하루 1시간, 요일별 보석), 레이드(전투력 단계별 보스).
// 화면의 실시간 연출과 엔진의 최종 정산이 같은 함수를 쓰도록 순수 함수로 둔다.

import {
  FIELD_BOSS, RAID, RAID_BOSSES, POWER_BANDS, DAY_DUNGEON, DAY_DUNGEONS, GEM_ORDER,
} from './constants.js';
import { createRng } from './rng.js';
import { toKey, weekday } from './dates.js';
import { worldPlayers, playerView, WORLD_SEED } from './world.js';

/** 전투력 → 초당 피해 */
export const dpsOf = (cp) => Math.max(20, cp) * 0.5;
/** 화면 터치 한 번 = 초당 피해의 35%, 필살기 = 초당 피해의 6배 */
export const TAP_MULT = 0.35;
export const SKILL_MULT = 6;
/** 무작위 흔들림·치명타를 넣은 평균 배율 */
const AVG = 1.08;

/** 초당 피해 배열 (결정적). fromSec 전은 0. 들어온 시각과 상관없이 같은 난수열을 쓴다 */
export function damageSeries(seed, cp, seconds, fromSec = 0, untilSec = seconds) {
  const rng = createRng(seed);
  const base = dpsOf(cp);
  const out = new Array(seconds);
  for (let t = 0; t < seconds; t++) {
    const r1 = rng.next();
    const r2 = rng.next();
    out[t] = t < fromSec || t >= untilSec ? 0 : Math.round(base * (0.85 + r1 * 0.3) * (r2 < 0.1 ? 1.8 : 1));
  }
  return out;
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 터치·필살기 횟수를 참가 시간에 맞게 자른다 */
export function capInputs({ taps = 0, skills = 0 }, activeSec, rules) {
  const sec = Math.max(0, activeSec);
  return {
    taps: Math.max(0, Math.min(Math.floor(Number(taps) || 0), rules.tapsPerSecMax * sec)),
    skills: Math.max(0, Math.min(Math.floor(Number(skills) || 0), Math.floor(sec / rules.skillCooldownSec) + (sec > 0 ? 1 : 0))),
  };
}

/* ── 필드 보스 ─────────────────────────────── */

/** 오늘 21:00~21:05 일정. phase: before | open | closed */
export function fieldBossWindow(now) {
  const d = new Date(now);
  const openAt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), FIELD_BOSS.openHour, 0, 0, 0).getTime();
  const closeAt = openAt + FIELD_BOSS.durationSec * 1000;
  const phase = now < openAt ? 'before' : now < closeAt ? 'open' : 'closed';
  return { day: toKey(d), openAt, closeAt, phase, sec: Math.max(0, Math.min(FIELD_BOSS.durationSec, Math.floor((now - openAt) / 1000))) };
}

/**
 * 필드 보스 맵 (20명): 나 + 파티원 + 그날 맵에 들어온 가상 플레이어(내 전투력 근처가 먼저)
 * me = { name, cp, level, gear }, party = 플레이어 뷰 배열(최대 3)
 */
export function fieldBossRoom({ day, me, party = [], practice = false }) {
  const seed = `${WORLD_SEED}|fb|${day}${practice ? '|practice' : ''}`;
  const rng = createRng(seed);
  const partyIds = new Set(party.map((p) => p.id));
  const pool = worldPlayers().filter((p) => !partyIds.has(p.id)).map((p) => playerView(p, day));
  const near = shuffle(pool.filter((p) => p.cp >= me.cp * 0.35 && p.cp <= me.cp * 3), rng);
  const nearIds = new Set(near.map((p) => p.id));
  const rest = shuffle(pool.filter((p) => !nearIds.has(p.id)), rng);
  const need = FIELD_BOSS.mapSize - 1 - party.length;
  const members = [
    { ...me, id: 'me', isMe: true, party: true },
    ...party.map((p) => ({ ...p, party: true })),
    ...[...near, ...rest].slice(0, need).map((p) => ({ ...p, party: false })),
  ];
  // 모두가 5분 내내 자동 공격하면 4분 반쯤에 쓰러지는 체력
  const hp = Math.round(members.reduce((s, m) => s + dpsOf(m.cp) * AVG * FIELD_BOSS.durationSec, 0) * 0.92);
  return { seed, day, members, hp, durationSec: FIELD_BOSS.durationSec };
}

/**
 * 필드 보스 전투 계산.
 * 나는 enteredSec 부터 싸우고(자동 공격은 끝까지 이어짐), 터치·필살기 피해는 [enteredSec, reportSec) 에 고르게 나눈다.
 * 보스가 쓰러지면 그 순간까지의 누적 피해로 순위를 매긴다.
 */
export function simulateFieldBoss(room, { enteredSec = 0, reportSec = room.durationSec, taps = 0, skills = 0 } = {}) {
  const T = room.durationSec;
  const from = Math.max(0, Math.min(T, Math.floor(enteredSec)));
  const until = Math.max(from + 1, Math.min(T, Math.ceil(reportSec)));
  const inputs = capInputs({ taps, skills }, until - from, FIELD_BOSS);
  const series = room.members.map((m) => damageSeries(`${room.seed}|${m.id}`, m.cp, T, m.isMe ? from : 0));
  const meIdx = room.members.findIndex((m) => m.isMe);
  const myDps = dpsOf(room.members[meIdx].cp);
  const skillMult = room.members[meIdx].skillMult || SKILL_MULT;
  const extraPerSec = (inputs.taps * myDps * TAP_MULT + inputs.skills * myDps * skillMult) / (until - from);
  const damage = new Array(room.members.length).fill(0);
  let total = 0;
  let deathSec = null;
  for (let t = 0; t < T; t++) {
    for (let i = 0; i < series.length; i++) {
      let d = series[i][t];
      if (i === meIdx && t >= from && t < until) d += extraPerSec;
      damage[i] += d;
      total += d;
    }
    if (total >= room.hp) {
      deathSec = t + 1;
      break;
    }
  }
  const ranking = room.members
    .map((m, i) => ({ ...m, damage: Math.round(damage[i]) }))
    .sort((a, b) => b.damage - a.damage)
    .map((m, i) => ({ ...m, rank: i + 1 }));
  const mine = ranking.find((m) => m.isMe);
  return { ranking, me: mine, killed: deathSec !== null, endSec: deathSec ?? T, total: Math.round(total), hp: room.hp, inputs };
}

/* ── 레이드 ─────────────────────────────── */

/** 단계별 보스: 권장 파티 전투력(4명 × 단계 시작 전투력)이면 자동 공격만으로 40초에 쓰러진다 */
export function raidBoss(tier) {
  const t = Math.max(1, Math.min(RAID_BOSSES.length, Math.floor(tier)));
  const recommended = 4 * Math.max(200, POWER_BANDS[t - 1]);
  return { ...RAID_BOSSES[t - 1], recommended, hp: Math.round(dpsOf(recommended / 4) * 4 * AVG * 40) };
}

/**
 * 레이드 전투 계산 (60초). members = [나, 파티원…] (각각 { id, cp, isMe })
 * 자동 공격은 60초 내내, 터치·필살기 피해는 [0, reportSec) 에 고르게 나눈다.
 */
export function simulateRaid(boss, members, { seed, reportSec = RAID.durationSec, taps = 0, skills = 0 } = {}) {
  const T = RAID.durationSec;
  const until = Math.max(1, Math.min(T, Math.ceil(reportSec)));
  const inputs = capInputs({ taps, skills }, until, RAID);
  const series = members.map((m) => damageSeries(`${seed}|${m.id}`, m.cp, T));
  const meIdx = members.findIndex((m) => m.isMe);
  const myDps = dpsOf(members[meIdx].cp);
  const skillMult = members[meIdx].skillMult || SKILL_MULT;
  const extraPerSec = (inputs.taps * myDps * TAP_MULT + inputs.skills * myDps * skillMult) / until;
  const damage = new Array(members.length).fill(0);
  let total = 0;
  let killSec = null;
  for (let t = 0; t < T; t++) {
    for (let i = 0; i < series.length; i++) {
      const d = series[i][t] + (i === meIdx && t < until ? extraPerSec : 0);
      damage[i] += d;
      total += d;
    }
    if (total >= boss.hp) {
      killSec = t + 1;
      break;
    }
  }
  return {
    win: killSec !== null,
    sec: killSec ?? T,
    total: Math.round(total),
    damage: members.map((m, i) => ({ id: m.id, name: m.name, isMe: Boolean(m.isMe), damage: Math.round(damage[i]) })),
    inputs,
  };
}

/** 레이드 상자 장비 등급 가중치: 1단계 희귀 위주 → 10단계 전설 40% */
export function raidWeights(tier) {
  const f = (Math.max(1, Math.min(10, tier)) - 1) / 9;
  return { common: 0, rare: Math.round(60 - 50 * f), epic: Math.round(32 + 18 * f), legendary: Math.round(8 + 32 * f) };
}

export const RAID_SLOT_NAMES = { weapon: '대검', helmet: '투구', armor: '갑주', cape: '망토' };
export const RAID_WEAPON_NAMES = { sword: '대검', bow: '장궁', gun: '대포', staff: '지팡이' };

/* ── 요일 던전 ─────────────────────────────── */

export function dayDungeonFor(day) {
  return DAY_DUNGEONS[weekday(day)];
}

/** 분당 보석 수 (전투력 단계마다 +10%) */
export function gemRate(band) {
  return DAY_DUNGEON.gemsPerMin * (1 + DAY_DUNGEON.bandBonus * (band - 1));
}

/**
 * 사냥한 시간만큼 보석을 나눈다. count = 오늘 이미 받은 보석 수(색 뽑기 순번), frac = 이전 자투리
 * @returns {{ gems: Record<string, number>, whole, frac }}
 */
export function dungeonGems(day, seconds, band, { count = 0, frac = 0 } = {}) {
  const dg = dayDungeonFor(day);
  const raw = (Math.max(0, seconds) / 60) * gemRate(band) + frac;
  const whole = Math.floor(raw + 1e-9);
  const gems = {};
  for (let i = 0; i < whole; i++) {
    const color = dg.gems.length === 1 ? dg.gems[0] : createRng(`${WORLD_SEED}|dd|${day}|${count + i}`).pick(dg.gems);
    gems[color] = (gems[color] || 0) + 1;
  }
  return { gems, whole, frac: raw - whole };
}

/** 보석 n개를 무작위 색으로 */
export function randomGems(rng, n, colors = GEM_ORDER) {
  const out = {};
  for (let i = 0; i < n; i++) {
    const c = rng.pick(colors);
    out[c] = (out[c] || 0) + 1;
  }
  return out;
}
