import { test } from 'node:test';
import assert from 'node:assert/strict';

import { holidaysOfYear, holidayName } from '../src/core/holidays.js';
import { monthGrid, dayKey, addDays, weekday } from '../src/core/dates.js';
import { createInitialState, applyAction, migrate, ActionError } from '../src/core/engine.js';
import { rollRarity, generateItem, sellPrice } from '../src/core/items.js';
import { createRng } from '../src/core/rng.js';
import { heroStats, addXp, removeXp } from '../src/core/progression.js';
import {
  computeStreak, dailiesForDay, occursOn, overdueTodos, monthSummary, isDailyDone,
} from '../src/core/selectors.js';
import { xpToNext, PITY, BATTLE } from '../src/core/constants.js';

// 2026-11-27(금) 10:00 로컬
const NOW = new Date(2026, 10, 27, 10, 0, 0).getTime();
const DAY = 86400000;
const fresh = () => createInitialState(NOW, { seed: 'test-seed' });
const act = (s, type, payload, now = NOW) => applyAction(s, { type, payload }, { now });

/* ── 공휴일 ─────────────────────────────── */

test('2026 공휴일·대체공휴일', () => {
  const h = holidaysOfYear(2026);
  assert.equal(h['2026-03-02'], '대체공휴일'); // 삼일절(일)
  assert.equal(h['2026-05-01'], '노동절');
  assert.equal(h['2026-05-25'], '대체공휴일'); // 부처님오신날(일)
  assert.equal(h['2026-06-03'], '지방선거');
  assert.equal(h['2026-07-17'], '제헌절');
  assert.equal(h['2026-08-17'], '대체공휴일'); // 광복절(토)
  assert.equal(h['2026-10-05'], '대체공휴일'); // 개천절(토)
  assert.equal(h['2026-09-25'], '추석');
  assert.equal(h['2026-02-16'], '설날');
  assert.equal(h['2026-06-08'], undefined); // 현충일(토)은 대체공휴일 없음
  assert.equal(h['2026-09-28'], undefined); // 추석 토요일은 대체 대상 아님
});

test('2027 대체공휴일 7일 (월력요항과 일치)', () => {
  const h = holidaysOfYear(2027);
  const subs = Object.entries(h).filter(([, n]) => n.includes('대체공휴일')).map(([k]) => k).sort();
  assert.deepEqual(subs, ['2027-02-09', '2027-05-03', '2027-07-19', '2027-08-16', '2027-10-04', '2027-10-11', '2027-12-27']);
});

test('2025 겹침 대체공휴일은 하루만', () => {
  const h = holidaysOfYear(2025);
  assert.equal(h['2025-05-05'], '어린이날·부처님오신날');
  assert.equal(h['2025-05-06'], '대체공휴일');
  assert.equal(h['2025-05-07'], undefined);
  assert.equal(h['2025-10-08'], '대체공휴일');
  assert.equal(h['2025-03-03'], '대체공휴일');
  assert.equal(h['2025-05-01'], undefined); // 노동절은 2026년부터
  assert.equal(holidayName('2025-12-25'), '성탄절');
});

/* ── 날짜 ─────────────────────────────── */

test('월간 그리드는 일요일부터 42칸', () => {
  const g = monthGrid(2026, 10);
  assert.equal(g.length, 42);
  assert.equal(weekday(g[0]), 0);
  assert.ok(g.includes('2026-11-01'));
  assert.ok(g.includes('2026-11-30'));
});

test('하루 시작 시각 반영', () => {
  const early = new Date(2026, 10, 27, 3, 0).getTime();
  assert.equal(dayKey(early, 0), '2026-11-27');
  assert.equal(dayKey(early, 4), '2026-11-26');
});

/* ── 일일임무 보상 ─────────────────────── */

test('일일임무 완료 → 경험치·골드, 해제 → 회수, 재체크 → 같은 보상(장비 재추첨 없음)', () => {
  let s = fresh();
  const meal = s.dailies.find((d) => d.title === '점심 식사');
  const r1 = act(s, 'daily/toggle', { id: meal.id });
  s = r1.state;
  const reward = r1.events.find((e) => e.type === 'reward');
  assert.ok(reward.xp > 0 && reward.gold > 0);
  assert.equal(s.stats.questsDone, 1);
  const invAfter = s.inventory.length;
  const goldAfter = s.hero.gold;

  const r2 = act(s, 'daily/toggle', { id: meal.id });
  s = r2.state;
  assert.equal(r2.events[0].type, 'revert');
  assert.equal(s.hero.xp, 0);
  assert.equal(s.hero.gold, 30);
  assert.equal(s.inventory.length, invAfter, '이미 받은 장비는 회수하지 않음');

  const r3 = act(s, 'daily/toggle', { id: meal.id });
  s = r3.state;
  const again = r3.events.find((e) => e.type === 'reward');
  assert.equal(again.xp, reward.xp);
  assert.equal(again.gold, reward.gold);
  assert.equal(again.item, null);
  assert.equal(s.hero.gold, goldAfter);
  assert.equal(s.inventory.length, invAfter);
});

test('같은 시드·같은 날의 보상은 결정적', () => {
  const a = fresh();
  const b = structuredClone(a);
  const id = a.dailies[3].id;
  const ra = act(a, 'daily/toggle', { id }).events.find((e) => e.type === 'reward');
  const rb = act(b, 'daily/toggle', { id }).events.find((e) => e.type === 'reward');
  assert.equal(ra.xp, rb.xp);
  assert.equal(ra.gold, rb.gold);
  assert.equal(Boolean(ra.item), Boolean(rb.item));
});

test('미래 날짜·예정 없는 요일은 완료 불가', () => {
  const s = fresh();
  const work = s.dailies.find((d) => d.category === 'work');
  assert.throws(() => act(s, 'daily/toggle', { id: work.id, day: '2026-11-28' }), ActionError);
  // 업무는 평일만: 토요일(11/28)에 시간을 맞춰도 예정이 아님
  const sat = new Date(2026, 10, 28, 10).getTime();
  assert.throws(() => act(s, 'daily/toggle', { id: work.id }, sat), /예정된 임무가 아니/);
});

test('연속 달성(스트릭)과 보너스', () => {
  let s = fresh();
  const study = s.dailies.find((d) => d.category === 'study');
  study.startDay = '2026-11-20';
  let lastXp = 0;
  for (let i = 0; i < 5; i++) {
    const now = NOW + i * DAY;
    const r = act(s, 'daily/toggle', { id: study.id }, now);
    s = r.state;
    lastXp = r.events.find((e) => e.type === 'reward').streak;
  }
  const d = s.dailies.find((x) => x.id === study.id);
  assert.equal(lastXp, 5);
  assert.equal(computeStreak(d, '2026-12-01'), 5);
  // 하루 건너뛰면 끊김
  assert.equal(computeStreak(d, '2026-12-03'), 0);
  // 당일 미완료는 끊지 않음
  assert.equal(computeStreak(d, '2026-12-02'), 5);
});

test('퍼펙트 데이 보너스는 하루 한 번', () => {
  let s = fresh();
  const todays = dailiesForDay(s, '2026-11-27');
  assert.ok(todays.length >= 2);
  let perfectEvents = 0;
  for (const d of todays) {
    const r = act(s, 'daily/toggle', { id: d.id });
    s = r.state;
    perfectEvents += r.events.filter((e) => e.type === 'reward' && e.source === 'perfect').length;
  }
  assert.equal(perfectEvents, 1);
  assert.ok(s.perfectDays['2026-11-27']);
  // 해제 후 재체크해도 다시 주지 않음
  s = act(s, 'daily/toggle', { id: todays[0].id }).state;
  const r = act(s, 'daily/toggle', { id: todays[0].id });
  assert.equal(r.events.filter((e) => e.source === 'perfect').length, 0);
});

/* ── 장비·확률 ─────────────────────────── */

test('등급 확률 분포가 가중치에 근접', () => {
  const rng = createRng(12345);
  const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
  const N = 40000;
  for (let i = 0; i < N; i++) {
    const pity = { sinceEpic: 0, sinceLegendary: 0 }; // 천장 영향 배제
    counts[rollRarity(rng, pity)]++;
  }
  const pct = (k) => (counts[k] / N) * 100;
  assert.ok(Math.abs(pct('common') - 64) < 1.5, `common ${pct('common')}`);
  assert.ok(Math.abs(pct('rare') - 25) < 1.5, `rare ${pct('rare')}`);
  assert.ok(Math.abs(pct('epic') - 9) < 1, `epic ${pct('epic')}`);
  assert.ok(Math.abs(pct('legendary') - 2) < 0.5, `legendary ${pct('legendary')}`);
});

test('천장: 영웅 30회, 전설 90회 보장', () => {
  const rng = createRng(1);
  const weights = { common: 100, rare: 0, epic: 0, legendary: 0 };
  const pity = { sinceEpic: 0, sinceLegendary: 0 };
  let firstEpic = null;
  for (let i = 1; i <= PITY.epic; i++) {
    const r = rollRarity(rng, pity, weights);
    if (r === 'epic' || r === 'legendary') { firstEpic = i; break; }
  }
  assert.equal(firstEpic, PITY.epic);
  // 전설 천장 직전이면 다음 드롭은 반드시 전설
  const p2 = { sinceEpic: 0, sinceLegendary: PITY.legendary - 1 };
  assert.equal(rollRarity(rng, p2, weights), 'legendary');
  assert.deepEqual(p2, { sinceEpic: 0, sinceLegendary: 0 });
  // 천장 전에는 일반만 나오는 가중치에서 전설이 나오지 않음
  const p3 = { sinceEpic: 0, sinceLegendary: PITY.legendary - 3 };
  assert.equal(rollRarity(rng, p3, weights), 'common');
});

test('장비 생성: 부위별 능력치와 등급 배율', () => {
  const rng = createRng('items');
  const c = generateItem(rng, { level: 10, rarity: 'common', slot: 'weapon' });
  const l = generateItem(rng, { level: 10, rarity: 'legendary', slot: 'weapon' });
  assert.ok(l.atk > c.atk * 2);
  const armor = generateItem(rng, { level: 5, rarity: 'rare', slot: 'armor' });
  assert.ok(armor.def > 0 && armor.hp > 0 && armor.atk === 0);
  assert.ok(sellPrice(l) > sellPrice(c));
});

test('장착 중·잠금 장비는 판매 불가, 일괄 판매', () => {
  let s = fresh();
  const starter = s.inventory[0];
  assert.throws(() => act(s, 'item/sell', { id: starter.id }), /장착 중/);
  const rng = createRng('bulk');
  for (let i = 0; i < 3; i++) s.inventory.push(generateItem(rng, { level: 1, rarity: 'common' }));
  s.inventory[1].locked = true;
  const gold0 = s.hero.gold;
  const r = act(s, 'item/sellBulk', { rarity: 'common' });
  assert.equal(r.events[0].count, 2);
  assert.ok(r.state.hero.gold > gold0);
  assert.equal(r.state.inventory.length, 2); // 장착 목검 + 잠금 1
});

/* ── 레벨 ─────────────────────────────── */

test('레벨업·레벨다운', () => {
  const hero = { level: 1, xp: 0 };
  const ups = [];
  addXp(hero, xpToNext(1) + xpToNext(2) + 5, (lv) => ups.push(lv));
  assert.deepEqual(ups, [2, 3]);
  assert.equal(hero.xp, 5);
  removeXp(hero, 10);
  assert.equal(hero.level, 2);
  assert.equal(hero.xp, xpToNext(2) - 5);
  removeXp(hero, 10000);
  assert.equal(hero.level, 1);
  assert.equal(hero.xp, 0);
});

test('최고 레벨 갱신 때만 레벨업 보상, 5레벨마다 장비', () => {
  let s = fresh();
  s.hero.level = 4;
  s.hero.maxLevelReached = 4;
  s.hero.xp = xpToNext(4) - 1;
  const r = act(s, 'daily/toggle', { id: s.dailies[0].id });
  const lv = r.events.find((e) => e.type === 'levelUp');
  assert.equal(lv.level, 5);
  assert.ok(lv.gold > 0);
  assert.ok(lv.item, '5레벨 보상 장비');
  s = act(r.state, 'daily/toggle', { id: s.dailies[0].id }).state; // 해제 → 4레벨
  assert.equal(s.hero.level, 4);
  const again = act(s, 'daily/toggle', { id: s.dailies[0].id });
  const lv2 = again.events.find((e) => e.type === 'levelUp');
  assert.equal(lv2.gold, 0);
  assert.equal(lv2.item, null);
});

test('장비 능력치가 최종 능력치에 반영', () => {
  const s = fresh();
  const base = heroStats(s);
  assert.equal(base.atk, 6 + 2);
  const rng = createRng('gear');
  const cape = generateItem(rng, { level: 5, rarity: 'epic', slot: 'cape' });
  s.inventory.push(cape);
  s.hero.equipment.cape = cape.id;
  const st = heroStats(s);
  assert.equal(st.luck, cape.luck);
  assert.ok(st.critChance > base.critChance);
});

/* ── 상점·전투 ─────────────────────────── */

test('상점: 골드 부족 오류, 보물 상자 개봉', () => {
  let s = fresh();
  assert.throws(() => act(s, 'shop/buy', { key: 'chest' }), /골드가 부족/);
  s.hero.gold = 1000;
  const r = act(s, 'shop/buy', { key: 'goldChest' });
  const ev = r.events.find((e) => e.type === 'reward');
  assert.ok(ev.item);
  assert.notEqual(ev.item.rarity, 'common');
  assert.equal(r.state.hero.gold, 1000 - 450);
  const p = act(r.state, 'shop/buy', { key: 'potion' });
  assert.equal(p.events[0].type, 'potion');
});

test('나만의 보상 구매', () => {
  let s = fresh();
  s = act(s, 'reward/add', { title: '넷플릭스 한 편', cost: 25 }).state;
  const r = s.rewards.find((x) => x.title === '넷플릭스 한 편');
  const out = act(s, 'reward/buy', { id: r.id });
  assert.equal(out.state.hero.gold, 5);
  assert.equal(out.events[0].type, 'customReward');
});

test('슬라임 동전은 하루 상한까지만', () => {
  let s = fresh();
  s = act(s, 'battle/report', { kills: 10, coins: 40 }).state;
  s = act(s, 'battle/report', { kills: 10, coins: 40 }).state;
  assert.equal(s.daily.coins, BATTLE.coinDailyCap);
  assert.equal(s.hero.gold, 30 + BATTLE.coinDailyCap);
  assert.equal(s.stats.slimesDefeated, 20);
  // 다음 날 초기화
  const r = act(s, 'battle/report', { coins: 5 }, NOW + DAY);
  assert.equal(r.state.daily.coins, 5);
  assert.ok(r.events.some((e) => e.type === 'dayChanged'));
});

/* ── 일정·할 일 ─────────────────────────── */

test('반복 일정과 미래 일정 완료 제한', () => {
  let s = fresh();
  s = act(s, 'task/add', { type: 'event', title: '주간 회의', date: '2026-11-23', time: '10:00', repeat: 'weekly', category: 'work' }).state;
  const t = s.tasks.find((x) => x.title === '주간 회의');
  assert.ok(occursOn(t, '2026-11-30'));
  assert.ok(!occursOn(t, '2026-11-24'));
  assert.ok(!occursOn(t, '2026-11-16'));
  assert.throws(() => act(s, 'task/toggle', { id: t.id, occurrence: '2026-11-30' }), /아직 오지 않은/);
  const r = act(s, 'task/toggle', { id: t.id, occurrence: '2026-11-23' });
  assert.ok(r.events.some((e) => e.type === 'reward'));
});

test('밀린 할 일 목록', () => {
  let s = fresh();
  s = act(s, 'task/add', { type: 'todo', title: '보고서 제출', date: '2026-11-25' }).state;
  const over = overdueTodos(s, '2026-11-27');
  assert.equal(over.length, 1);
  s = act(s, 'task/toggle', { id: over[0].id }).state;
  assert.equal(overdueTodos(s, '2026-11-27').length, 0);
});

test('월간 요약에 공휴일·진행도 포함', () => {
  let s = fresh();
  s = act(s, 'daily/toggle', { id: s.dailies[0].id }).state;
  const dec = monthSummary(s, 2026, 11);
  const xmas = dec.find((d) => d.day === '2026-12-25');
  assert.equal(xmas.holiday, '성탄절');
  assert.equal(dec.find((d) => d.day === '2026-11-30').inMonth, false);
  const nov = monthSummary(s, 2026, 10);
  const nov27 = nov.find((d) => d.day === '2026-11-27');
  assert.equal(nov27.inMonth, true);
  assert.equal(nov27.dailyDone, 1);
  assert.equal(nov27.dailyTotal, dailiesForDay(s, '2026-11-27').length);
});

/* ── 저장 형식 ─────────────────────────── */

test('마이그레이션: 빠진 필드를 채우고 잘못된 장착 참조 제거', () => {
  const s = fresh();
  const raw = JSON.parse(JSON.stringify(s));
  delete raw.settings.sound;
  delete raw.stats;
  raw.hero.equipment.helmet = 'missing-id';
  const m = migrate(raw, NOW);
  assert.equal(m.settings.sound, false);
  assert.equal(m.stats.questsDone, 0);
  assert.equal(m.hero.equipment.helmet, null);
  assert.throws(() => migrate({ foo: 1 }), ActionError);
});

test('데이터 교체·초기화 액션', () => {
  let s = fresh();
  s.hero.gold = 999;
  const copy = JSON.parse(JSON.stringify(s));
  let t = act(fresh(), 'data/replace', { state: copy }).state;
  assert.equal(t.hero.gold, 999);
  t = act(t, 'settings/update', { patch: { spawnRate: 'high', widgetOpacity: 0.1, bogus: 1 } }).state;
  assert.equal(t.settings.spawnRate, 'high');
  assert.equal(t.settings.widgetOpacity, 0.5);
  assert.equal(t.settings.bogus, undefined);
  const r = act(t, 'data/reset', {}).state;
  assert.equal(r.hero.gold, 30);
  assert.equal(r.settings.spawnRate, 'high');
  assert.ok(!isDailyDone(r.dailies[0], '2026-11-27'));
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});

/* ── 여러 날 일정 · 일정 그룹 ─────────────── */

import { occurrenceStart, weekSegments, taskColor, timedItemsForDay } from '../src/core/selectors.js';

test('여러 날 일정: 기간 안 어느 날이든 같은 회차, 완료는 시작일 기준', () => {
  let s = fresh();
  s = act(s, 'task/add', { type: 'event', title: '제주 워크숍', date: '2026-11-25', endDate: '2026-11-27', time: '09:00', category: 'work' }).state;
  const t = s.tasks.find((x) => x.title === '제주 워크숍');
  assert.equal(t.endDate, '2026-11-27');
  for (const d of ['2026-11-25', '2026-11-26', '2026-11-27']) assert.equal(occurrenceStart(t, d), '2026-11-25');
  assert.equal(occurrenceStart(t, '2026-11-28'), null);
  // 가운데 날짜에서 체크해도 시작일로 기록, 기간 내 모든 날에 완료 표시
  const r = act(s, 'task/toggle', { id: t.id, occurrence: '2026-11-26' });
  assert.ok(r.state.tasks.find((x) => x.id === t.id).completions['2026-11-25'].done);
  const m = monthSummary(r.state, 2026, 10);
  assert.equal(m.find((d) => d.day === '2026-11-27').taskDone, 1);
  // 알림은 시작하는 날에만
  assert.equal(timedItemsForDay(s, '2026-11-26').filter((i) => i.kind === 'task').length, 0);
  assert.equal(timedItemsForDay(s, '2026-11-25').filter((i) => i.kind === 'task').length, 1);
});

test('종료 날짜 기본값은 시작 날짜, 시작보다 빠르면 오류', () => {
  let s = fresh();
  s = act(s, 'task/add', { type: 'event', title: '하루 일정', date: '2026-12-01' }).state;
  assert.equal(s.tasks.find((x) => x.title === '하루 일정').endDate, '2026-12-01');
  assert.throws(() => act(s, 'task/add', { title: '역순', date: '2026-12-05', endDate: '2026-12-03' }), /종료 날짜/);
  // 시작 날짜만 옮기면 종료 날짜가 앞서지 않도록 맞춰짐
  const t = s.tasks.find((x) => x.title === '하루 일정');
  const moved = act(s, 'task/update', { id: t.id, patch: { date: '2026-12-09' } }).state.tasks.find((x) => x.id === t.id);
  assert.equal(moved.endDate, '2026-12-09');
});

test('주간 막대: 주를 넘어가는 일정은 이어짐 표시, 겹치면 다른 줄', () => {
  let s = fresh();
  s.tasks = [];
  s = act(s, 'task/add', { type: 'event', title: 'A 긴 일정', date: '2026-11-27', endDate: '2026-12-02' }).state;
  s = act(s, 'task/add', { type: 'event', title: 'B 같은 날', date: '2026-11-28' }).state;
  // 2026-11-22(일) ~ 11-28(토) 주
  const week = ['2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28'];
  const segs = weekSegments(s, week);
  const a = segs.find((x) => x.task.title === 'A 긴 일정');
  const b = segs.find((x) => x.task.title === 'B 같은 날');
  assert.deepEqual([a.c1, a.c2, a.contLeft, a.contRight], [5, 6, false, true]);
  assert.notEqual(a.lane, b.lane);
  // 다음 주에서는 왼쪽이 이어짐
  const next = weekSegments(s, ['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05']);
  const a2 = next.find((x) => x.task.title === 'A 긴 일정');
  assert.deepEqual([a2.c1, a2.c2, a2.contLeft, a2.contRight], [0, 3, true, false]);
});

test('반복 + 여러 날: 매주 2일짜리 일정', () => {
  let s = fresh();
  s = act(s, 'task/add', { type: 'event', title: '주말 캠핑', date: '2026-11-28', endDate: '2026-11-29', repeat: 'weekly' }).state;
  const t = s.tasks.find((x) => x.title === '주말 캠핑');
  assert.equal(occurrenceStart(t, '2026-12-06'), '2026-12-05');
  assert.equal(occurrenceStart(t, '2026-12-07'), null);
});

test('일정 그룹: 추가·색상·삭제 시 기본 그룹으로 이동', () => {
  let s = fresh();
  assert.ok(s.groups.find((g) => g.id === 'g_default'));
  let r = act(s, 'group/add', { name: '동호회', color: '#6fdc8c' });
  const gid = r.events.find((e) => e.what === 'group').id;
  s = r.state;
  assert.throws(() => act(s, 'group/add', { name: '동호회' }), /같은 이름/);
  s = act(s, 'task/add', { type: 'event', title: '정모', date: '2026-12-12', groupId: gid, category: 'life' }).state;
  const t = s.tasks.find((x) => x.title === '정모');
  assert.equal(taskColor(s, t), '#6fdc8c');
  s = act(s, 'group/delete', { id: gid }).state;
  const t2 = s.tasks.find((x) => x.title === '정모');
  assert.equal(t2.groupId, 'g_default');
  assert.equal(taskColor(s, t2), '#a7b0c0'); // 기본 그룹 → 분류(생활) 색
  assert.throws(() => act(s, 'group/delete', { id: 'g_default' }), /기본 그룹/);
  // 없는 그룹으로 추가하면 기본 그룹
  s = act(s, 'task/add', { title: 'x', date: '2026-12-01', groupId: 'nope' }).state;
  assert.equal(s.tasks.find((x) => x.title === 'x').groupId, 'g_default');
});

test('예전 저장 데이터: 그룹·종료 날짜 채워 넣기', () => {
  const s = fresh();
  const raw = JSON.parse(JSON.stringify(s));
  delete raw.groups;
  for (const t of raw.tasks) { delete t.endDate; delete t.groupId; }
  const m = migrate(raw, NOW);
  assert.ok(m.groups.length >= 1);
  assert.equal(m.tasks[0].endDate, m.tasks[0].date);
  assert.equal(m.tasks[0].groupId, 'g_default');
});
