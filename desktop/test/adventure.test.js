import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, applyAction, migrate } from '../src/core/engine.js';
import { combatPower, powerBand, bandProgress } from '../src/core/progression.js';
import {
  fieldBossWindow, fieldBossRoom, simulateFieldBoss, raidBoss, simulateRaid, dungeonGems, dayDungeonFor, capInputs,
} from '../src/core/adventure.js';
import { worldPlayers, powerRanking, onlinePlayers, playerView, GUILDS, chatLine } from '../src/core/world.js';
import { createRng } from '../src/core/rng.js';
import { GEM_ORDER, RAID, FIELD_BOSS, POWER_BANDS, DAY_DUNGEON } from '../src/core/constants.js';

// 2026-11-27(금)
const at = (h, m = 0, s = 0, d = 27) => new Date(2026, 10, d, h, m, s).getTime();
const NOW = at(10);
const fresh = () => createInitialState(NOW, { seed: 'adv-seed' });
const act = (s, type, payload, now = NOW) => applyAction(s, { type, payload }, { now });
const sumGems = (g) => Object.values(g).reduce((a, b) => a + b, 0);

/* ── 전투력 ─────────────────────────────── */

test('전투력과 10단계 밴드', () => {
  const s = fresh();
  assert.equal(combatPower(s), 100);
  assert.equal(powerBand(0), 1);
  assert.equal(powerBand(299), 1);
  assert.equal(powerBand(300), 2);
  assert.equal(powerBand(5500), 10);
  assert.equal(powerBand(99999), 10);
  assert.equal(POWER_BANDS.length, 10);
  const p = bandProgress(450);
  assert.equal(p.band, 2);
  assert.equal(p.next, 600);
  assert.ok(Math.abs(p.ratio - 0.5) < 1e-9);
  assert.equal(bandProgress(9000).ratio, 1);
});

/* ── 가상 세계 · 랭킹 ─────────────────────────────── */

test('가상 플레이어는 고정 시드로 매번 같고 이름이 겹치지 않는다', () => {
  const a = worldPlayers();
  assert.equal(a.length, 300);
  assert.equal(new Set(a.map((p) => p.name)).size, 300);
  assert.ok(a.every((p) => p.cp0 >= 60 && p.gear.weapon));
  assert.ok(a.some((p) => p.guild) && a.some((p) => !p.guild));
  // 전투력은 날마다 조금씩 자란다
  const p = a[0];
  assert.ok(playerView(p, '2026-12-27').cp > playerView(p, '2026-11-27').cp);
});

test('전투력 랭킹: 1~3위 시상대, 목록, 내 순위', () => {
  const r = powerRanking({ name: '용사', cp: 100, level: 1, gear: {} }, '2026-11-27');
  assert.equal(r.total, 301);
  assert.equal(r.podium.length, 3);
  assert.ok(r.podium[0].cp >= r.podium[1].cp && r.podium[1].cp >= r.podium[2].cp);
  assert.deepEqual(r.top.slice(0, 3).map((p) => p.rank), [1, 2, 3]);
  assert.ok(r.me.isMe && r.me.rank > 250);
  const strong = powerRanking({ name: '용사', cp: 99999, level: 99, gear: {} }, '2026-11-27');
  assert.equal(strong.me.rank, 1);
  assert.ok(strong.podium[0].isMe);
});

test('파티 초대 목록은 내 전투력 근처 플레이어가 먼저', () => {
  const list = onlinePlayers(100, '2026-11-27', 21, { count: 8 });
  assert.equal(list.length, 8);
  assert.ok(list.filter((p) => p.cp < 400).length >= 5);
  const excluded = onlinePlayers(100, '2026-11-27', 21, { count: 8, exclude: [list[0].id] });
  assert.ok(!excluded.some((p) => p.id === list[0].id));
});

test('채팅 문장: 채널별로 말하는 사람과 내용이 채워진다', () => {
  const rng = createRng('chat');
  const speakers = worldPlayers().slice(0, 5).map((p) => playerView(p, '2026-11-27'));
  const line = chatLine(rng, 'field', speakers);
  assert.ok(line.from && line.text && !line.text.includes('{'));
  const sys = chatLine(rng, 'system', speakers);
  assert.equal(sys.from, null);
  assert.ok(!sys.text.includes('{'));
  assert.equal(chatLine(rng, 'party', []), null);
});

/* ── 파티 · 길드 ─────────────────────────────── */

test('파티는 나 포함 4명까지, 길드는 하나만', () => {
  let s = fresh();
  const ids = worldPlayers().slice(0, 4).map((p) => p.id);
  for (const id of ids.slice(0, 3)) s = act(s, 'party/invite', { id }).state;
  assert.equal(s.social.party.length, 3);
  assert.throws(() => act(s, 'party/invite', { id: ids[3] }), /4명까지/);
  assert.throws(() => act(s, 'party/invite', { id: ids[0] }), /이미 파티/);
  assert.throws(() => act(s, 'party/invite', { id: 'nobody' }), /찾을 수 없/);
  s = act(s, 'party/kick', { id: ids[1] }).state;
  assert.deepEqual(s.social.party, [ids[0], ids[2]]);
  s = act(s, 'party/disband', {}).state;
  assert.deepEqual(s.social.party, []);
  s = act(s, 'guild/join', { id: GUILDS[1].id }).state;
  assert.equal(s.social.guild, 'gd_bread');
  assert.throws(() => act(s, 'guild/join', { id: GUILDS[1].id }), /이미/);
  s = act(s, 'guild/leave', {}).state;
  assert.equal(s.social.guild, null);
});

/* ── 요일 던전 ─────────────────────────────── */

test('요일 던전: 요일마다 다른 보석, 일요일은 6색 모두', () => {
  assert.deepEqual(dayDungeonFor('2026-11-23').gems, ['ruby']); // 월
  assert.deepEqual(dayDungeonFor('2026-11-27').gems, ['sapphire']); // 금
  assert.deepEqual(dayDungeonFor('2026-11-28').gems, ['amethyst']); // 토
  const sunday = dayDungeonFor('2026-11-29');
  assert.deepEqual(sunday.gems, GEM_ORDER);
  const got = dungeonGems('2026-11-29', 3600, 1);
  assert.equal(got.whole, 60);
  assert.ok(Object.keys(got.gems).length >= 5, '일요일 1시간이면 여러 색이 나와야 함');
  // 전투력 단계가 높으면 더 많이
  assert.equal(dungeonGems('2026-11-27', 3600, 6).whole, 90);
});

test('요일 던전: 하루 1시간까지, 30분 사냥하면 보석 30개', () => {
  let s = fresh();
  s = act(s, 'dungeon/enter', {}).state;
  assert.throws(() => act(s, 'dungeon/enter', {}), /이미 던전/);
  const r = act(s, 'dungeon/leave', {}, NOW + 30 * 60 * 1000);
  s = r.state;
  assert.equal(s.dungeon.usedSec, 1800);
  assert.equal(s.gems.sapphire, 30); // 금요일 = 사파이어
  const ev = r.events.find((e) => e.type === 'dungeonResult');
  assert.equal(ev.count, 30);
  assert.equal(ev.left, 1800);
  // 다시 들어가서 2시간 있어도 남은 30분만 인정
  s = act(s, 'dungeon/enter', {}, NOW + 31 * 60 * 1000).state;
  s = act(s, 'dungeon/leave', {}, NOW + 3 * 3600 * 1000).state;
  assert.equal(s.dungeon.usedSec, DAY_DUNGEON.dailySec);
  assert.equal(s.gems.sapphire, 60);
  assert.throws(() => act(s, 'dungeon/enter', {}, NOW + 4 * 3600 * 1000), /모두 썼어요/);
  // 다음 날이면 다시 1시간
  s = act(s, 'dungeon/enter', {}, at(10, 0, 0, 28)).state;
  assert.equal(s.dungeon.day, '2026-11-28');
  assert.equal(s.dungeon.usedSec, 0);
});

test('요일 던전: 켜 둔 채 날이 바뀌면 어제 몫을 정산', () => {
  let s = fresh();
  s = act(s, 'dungeon/enter', {}, at(23, 40)).state;
  const r = act(s, 'system/tick', {}, at(9, 0, 0, 28));
  s = r.state;
  assert.equal(s.dungeon.day, '2026-11-28');
  assert.equal(s.dungeon.activeSince, null);
  assert.equal(s.gems.sapphire, 60, '어제 남은 1시간 몫');
  assert.ok(r.events.some((e) => e.type === 'dungeonResult'));
});

/* ── 필드 보스 ─────────────────────────────── */

test('필드 보스 일정: 21:00~21:05', () => {
  assert.equal(fieldBossWindow(at(20, 59, 59)).phase, 'before');
  const w = fieldBossWindow(at(21, 1, 30));
  assert.equal(w.phase, 'open');
  assert.equal(w.sec, 90);
  assert.equal(fieldBossWindow(at(21, 5)).phase, 'closed');
});

test('필드 보스 맵: 20명(나+파티원+다른 플레이어), 같은 날은 같은 구성', () => {
  const party = worldPlayers().slice(10, 13).map((p) => playerView(p, '2026-11-27'));
  const me = { name: '용사', cp: 500, level: 5, gear: {} };
  const a = fieldBossRoom({ day: '2026-11-27', me, party });
  const b = fieldBossRoom({ day: '2026-11-27', me, party });
  assert.equal(a.members.length, FIELD_BOSS.mapSize);
  assert.equal(a.members.filter((m) => m.party).length, 4);
  assert.equal(new Set(a.members.map((m) => m.id)).size, 20);
  assert.deepEqual(a.members.map((m) => m.id), b.members.map((m) => m.id));
  assert.equal(a.hp, b.hp);
});

test('필드 보스 전투: 많이 누르면 순위가 오르고, 늦게 오면 내려간다', () => {
  const room = fieldBossRoom({ day: '2026-11-27', me: { name: '용사', cp: 800, level: 8, gear: {} } });
  const idle = simulateFieldBoss(room);
  const active = simulateFieldBoss(room, { taps: 1200, skills: 20 });
  const late = simulateFieldBoss(room, { enteredSec: 240 });
  assert.ok(idle.killed && idle.endSec > 240 && idle.endSec <= 300);
  assert.ok(active.me.rank < idle.me.rank);
  assert.ok(late.me.rank > idle.me.rank);
  assert.equal(idle.ranking.length, 20);
  // 터치는 초당 5번, 필살기는 15초마다
  assert.deepEqual(capInputs({ taps: 99999, skills: 999 }, 60, FIELD_BOSS), { taps: 300, skills: 5 });
});

test('필드 보스 입장·정산: 시간 밖 입장 불가, 하루 한 번, 순위 보상', () => {
  let s = fresh();
  assert.throws(() => act(s, 'fieldBoss/enter', {}, at(20, 50)), /오후 9시/);
  assert.throws(() => act(s, 'fieldBoss/enter', {}, at(21, 10)), /끝났어요/);
  s = act(s, 'fieldBoss/enter', {}, at(21, 0, 20)).state;
  assert.equal(s.fieldBoss.enteredSec, 20);
  assert.throws(() => act(s, 'fieldBoss/enter', {}, at(21, 1)), /이미 입장/);
  const gold0 = s.hero.gold;
  const r = act(s, 'fieldBoss/finish', { taps: 600, skills: 10 }, at(21, 5));
  s = r.state;
  const ev = r.events.find((e) => e.type === 'fieldBossResult');
  assert.ok(ev.rank >= 1 && ev.rank <= 20);
  assert.ok(ev.reward.gold > 0 && s.hero.gold >= gold0 + ev.reward.gold);
  assert.equal(sumGems(s.gems), sumGems(ev.reward.gems));
  assert.ok(s.fieldBoss.result && s.fieldBoss.result.rank === ev.rank);
  assert.equal(s.fieldBoss.result.top.length, 5);
  assert.throws(() => act(s, 'fieldBoss/finish', {}, at(21, 6)), /정산할/);
});

test('필드 보스: 들어간 뒤 앱을 닫아도 다음에 열면 자동 정산', () => {
  let s = fresh();
  s = act(s, 'fieldBoss/enter', {}, at(21, 2)).state;
  // 끝난 직후의 다른 동작은 화면의 정산(터치 횟수 포함)을 기다린다
  assert.equal(act(s, 'system/tick', {}, at(21, 6)).state.fieldBoss.result, null);
  const r = act(s, 'system/tick', {}, at(8, 0, 0, 28));
  assert.ok(r.state.fieldBoss.result);
  assert.ok(r.events.some((e) => e.type === 'fieldBossResult'));
});

/* ── 레이드 ─────────────────────────────── */

test('레이드 보스: 권장 파티면 40초 남짓에 토벌, 혼자는 열심히 눌러야 성공', () => {
  for (const tier of [1, 5, 10]) {
    const b = raidBoss(tier);
    const each = b.recommended / 4;
    const party = [{ id: 'me', name: 'me', cp: each, isMe: true }, ...[1, 2, 3].map((i) => ({ id: `p${i}`, name: 'p', cp: each }))];
    const r = simulateRaid(b, party, { seed: 'x' });
    assert.ok(r.win && r.sec > 30 && r.sec < 55, `${tier}단계 파티 ${r.sec}초`);
    const solo = [{ id: 'me', name: 'me', cp: each, isMe: true }];
    assert.equal(simulateRaid(b, solo, { seed: 'x' }).win, false);
    assert.equal(simulateRaid(b, solo, { seed: 'x', taps: 300, skills: 5 }).win, true);
  }
});

test('레이드 입장권: 처음 3개, 하루 1개씩 최대 10개', () => {
  let s = fresh();
  assert.equal(s.raid.tickets, RAID.startTickets);
  s = act(s, 'system/tick', {}, NOW + 2 * 86400000).state;
  assert.equal(s.raid.tickets, 5);
  s = act(s, 'system/tick', {}, NOW + 30 * 86400000).state;
  assert.equal(s.raid.tickets, RAID.ticketMax);
});

test('레이드: 단계 제한, 실패하면 입장권 유지, 성공하면 레이드 보물상자', () => {
  let s = fresh();
  assert.throws(() => act(s, 'raid/start', { tier: 2 }), /전투력 1단계/);
  // 혼자 가만히 있으면 실패 → 입장권 그대로
  s = act(s, 'raid/start', { tier: 1 }).state;
  let r = act(s, 'raid/finish', {}, NOW + 60000);
  s = r.state;
  assert.equal(r.events.find((e) => e.type === 'raidResult').win, false);
  assert.equal(s.raid.tickets, 3);
  // 파티원 3명(전투력 높은 플레이어)과 가면 성공
  const strong = worldPlayers().map((p) => playerView(p, '2026-11-27')).sort((a, b) => b.cp - a.cp).slice(20, 23);
  for (const p of strong) s = act(s, 'party/invite', { id: p.id }).state;
  s = act(s, 'raid/start', { tier: 1 }, NOW + 70000).state;
  r = act(s, 'raid/finish', { taps: 50, skills: 2 }, NOW + 100000);
  s = r.state;
  const ev = r.events.find((e) => e.type === 'raidResult');
  assert.equal(ev.win, true);
  assert.equal(s.raid.tickets, 2);
  assert.equal(s.raid.clears, 1);
  assert.ok(ev.chest.items.length >= 1);
  const raidGear = ev.chest.items[0];
  assert.equal(raidGear.raid, 1);
  assert.ok(raidGear.name.startsWith('끈적이의 '));
  assert.notEqual(raidGear.rarity, 'common');
  assert.ok(s.inventory.some((it) => it.id === raidGear.id));
  assert.ok(ev.chest.gold > 0 && sumGems(ev.chest.gems) > 0);
  assert.equal(sumGems(s.gems), sumGems(ev.chest.gems));
  // 포기는 결과 없이 끝
  s = act(s, 'raid/start', { tier: 1 }, NOW + 200000).state;
  r = act(s, 'raid/finish', { giveUp: true }, NOW + 205000);
  assert.equal(r.state.raid.tickets, 2);
  assert.equal(r.events.find((e) => e.type === 'raidResult').giveUp, true);
});

test('예전 저장 파일도 새 항목이 채워진다', () => {
  const old = fresh();
  for (const k of ['gems', 'raid', 'dungeon', 'fieldBoss', 'social']) delete old[k];
  old.social = { party: ['w001', 'nobody'], guild: 'gd_none' };
  const m = migrate(old, NOW);
  assert.equal(m.raid.tickets, RAID.startTickets);
  assert.equal(Object.keys(m.gems).length, 6);
  assert.deepEqual(m.social.party, ['w001']);
  assert.equal(m.social.guild, null);
  assert.equal(m.dungeon.usedSec, 0);
});
