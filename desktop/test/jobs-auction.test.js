import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, applyAction, migrate, fieldBossRoomFor } from '../src/core/engine.js';
import { combatPower, heroStats } from '../src/core/progression.js';
import { generateItem, makeItem, weaponTypeOf } from '../src/core/items.js';
import { createRng } from '../src/core/rng.js';
import {
  JOBS, JOB_TREE, JOB_LEVELS, CLASS_IDS, jobCost, jobSkill, nextJobs, jobPathName, SKILL_MULTS,
} from '../src/core/jobs.js';
import { simulateFieldBoss } from '../src/core/adventure.js';
import { worldPlayers, playerView } from '../src/core/world.js';
import {
  AUCTION, botListings, findBotListing, marketSlot, marketValue, gemPrice, saleDelayMs,
} from '../src/core/market.js';

const at = (h, m = 0, d = 28) => new Date(2026, 10, d, h, m, 0).getTime();
const NOW = at(10);
const H = 3600 * 1000;
const fresh = () => createInitialState(NOW, { seed: 'job-seed' });
const act = (s, type, payload, now = NOW) => applyAction(s, { type, payload }, { now });

function hero(level, gold = 50000, gems = 500) {
  const s = fresh();
  s.hero.level = level;
  s.hero.maxLevelReached = level;
  s.hero.gold = gold;
  for (const k of Object.keys(s.gems)) s.gems[k] = gems;
  return s;
}

/* ── 직업 나무 ─────────────────────────────── */

test('직업: 1차 4개 → 2차 16개 → 3차 64개, 전직마다 4갈래', () => {
  const all = Object.values(JOBS);
  assert.equal(all.length, 84);
  assert.deepEqual([1, 2, 3].map((t) => all.filter((j) => j.tier === t).length), [4, 16, 64]);
  assert.deepEqual(JOB_TREE.map((n) => n.name), ['전사', '궁수', '거너', '마법사']);
  assert.ok(all.filter((j) => j.tier < 3).every((j) => j.children.length === 4));
  assert.equal(new Set(all.map((j) => j.name)).size, 84);
  assert.deepEqual(CLASS_IDS.map((id) => JOBS[id].weapon), ['sword', 'bow', 'gun', 'staff']);
  assert.deepEqual(nextJobs([]).map((j) => j.id), CLASS_IDS);
  assert.equal(nextJobs(['archer']).length, 4);
  assert.equal(jobPathName(['mage', 'necromancer', 'lich']), '마법사 › 사령술사 › 리치');
  assert.deepEqual(JOB_LEVELS, [10, 30, 60]);
});

test('1차 전직: 레벨 10부터, 골드를 내고 계열 무기를 받아 바로 든다', () => {
  let s = hero(9);
  assert.throws(() => act(s, 'job/advance', { id: 'warrior' }), /레벨 10부터/);
  s = hero(10, 1000);
  const before = combatPower(s);
  const r = act(s, 'job/advance', { id: 'archer' });
  s = r.state;
  assert.deepEqual(s.job.path, ['archer']);
  assert.equal(s.hero.gold, 1000 - jobCost(JOBS.archer).gold);
  const ev = r.events.find((e) => e.type === 'jobAdvance');
  assert.equal(ev.item.weaponType, 'bow');
  assert.equal(s.hero.equipment.weapon, ev.item.id);
  assert.ok(combatPower(s) > before, '전직하면 전투력이 오른다');
  assert.equal(heroStats(s).job.name, '궁수');
  assert.equal(heroStats(s).skill.name, '연사');
});

test('직업이 있으면 계열 무기만 장착', () => {
  let s = act(hero(10), 'job/advance', { id: 'warrior' }).state;
  const bow = makeItem({ slot: 'weapon', rarity: 'epic', name: '시험용 활', level: 10, atk: 30, weaponType: 'bow', now: NOW });
  const sword = makeItem({ slot: 'weapon', rarity: 'epic', name: '시험용 검', level: 10, atk: 30, now: NOW });
  s.inventory.push(bow, sword);
  assert.throws(() => act(s, 'item/equip', { id: bow.id }), /검만 장착/);
  s = act(s, 'item/equip', { id: sword.id }).state;
  assert.equal(s.hero.equipment.weapon, sword.id);
  assert.equal(weaponTypeOf(sword), 'sword');
});

test('2·3차 전직: 레벨 30/60, 직업 보석, 갈래 확인, 필살기 강화', () => {
  let s = act(hero(30), 'job/advance', { id: 'warrior' }).state;
  assert.throws(() => act(s, 'job/advance', { id: 'ranger' }), /고를 수 없는/);
  s.gems.ruby = 10;
  assert.throws(() => act(s, 'job/advance', { id: 'knight' }), /루비/);
  s.gems.ruby = 500;
  s = act(s, 'job/advance', { id: 'knight' }).state;
  assert.equal(s.gems.ruby, 470);
  assert.throws(() => act(s, 'job/advance', { id: 'guardian' }), /레벨 60부터/);
  s.hero.level = 60;
  const gold = s.hero.gold;
  s = act(s, 'job/advance', { id: 'guardian' }).state;
  assert.deepEqual(s.job.path, ['warrior', 'knight', 'guardian']);
  assert.equal(s.hero.gold, gold - 10000);
  assert.equal(s.gems.ruby, 370);
  assert.equal(s.gems.sapphire, 480);
  assert.equal(jobSkill(s.job.path).mult, SKILL_MULTS[3]);
  assert.throws(() => act(s, 'job/advance', { id: 'royalguard' }), /고를 수 없는/);
});

test('직업 필살기 배율이 필드 보스 정산에 들어간다', () => {
  let s = hero(60);
  s = act(s, 'job/advance', { id: 'mage' }).state;
  s = act(s, 'job/advance', { id: 'necromancer' }).state;
  s = act(s, 'job/advance', { id: 'lich' }).state;
  s = act(s, 'fieldBoss/enter', {}, at(21, 0)).state;
  assert.equal(s.fieldBoss.skillMult, 10.5);
  const room = fieldBossRoomFor(s);
  const strong = simulateFieldBoss(room, { skills: 10 });
  room.members[0].skillMult = 6;
  const weak = simulateFieldBoss(room, { skills: 10 });
  assert.ok(strong.me.damage > weak.me.damage);
});

test('직업 초기화: 차수 × 1000G, 다시 아무 무기나', () => {
  let s = act(hero(30), 'job/advance', { id: 'gunner' }).state;
  s = act(s, 'job/advance', { id: 'mechanic' }).state;
  const gold = s.hero.gold;
  s = act(s, 'job/reset', {}).state;
  assert.deepEqual(s.job.path, []);
  assert.equal(s.hero.gold, gold - 2000);
  assert.throws(() => act(s, 'job/reset', {}), /전직하지 않았/);
});

test('드롭 무기는 내 계열 무기가 많이 나온다', () => {
  const rng = createRng('drops');
  let bows = 0;
  for (let i = 0; i < 300; i++) {
    const it = generateItem(rng, { level: 10, rarity: 'rare', slot: 'weapon', weaponPref: 'bow', now: NOW });
    if (it.weaponType === 'bow') bows += 1;
  }
  assert.ok(bows > 200 && bows < 290, `활 ${bows}/300`);
  const staff = generateItem(createRng('x'), { level: 5, rarity: 'legendary', slot: 'weapon', weaponType: 'staff', now: NOW });
  assert.ok(staff.hp > 0 && /지팡이|홀/.test(staff.name));
});

test('가상 플레이어도 레벨에 맞는 직업', () => {
  const views = worldPlayers().map((p) => playerView(p, '2026-11-28'));
  for (const v of views) {
    const tier = v.level >= 60 ? 3 : v.level >= 30 ? 2 : v.level >= 10 ? 1 : 0;
    assert.equal(v.jobPath.length, tier);
    if (tier) assert.equal(v.gear.weaponType, JOBS[v.jobPath[0]].weapon);
  }
  assert.ok(views.some((v) => v.jobPath.length === 3));
});

test('저장된 전직 경로가 틀리면 맞는 데까지만', () => {
  const s = fresh();
  s.job = { path: ['warrior', 'ranger', 'hawkeye'] };
  assert.deepEqual(migrate(s, NOW).job.path, ['warrior']);
  delete s.job;
  assert.deepEqual(migrate(s, NOW).job.path, []);
});

/* ── 경매장 ─────────────────────────────── */

test('가상 매물: 같은 시간대는 같고, id 로 다시 찾을 수 있다', () => {
  const slot = marketSlot(NOW);
  const a = botListings(slot.key, 12);
  const b = botListings(slot.key, 14);
  assert.equal(a.length, AUCTION.botCount);
  assert.deepEqual(a.map((l) => l.id), b.map((l) => l.id), '레벨 5단위 묶음은 같은 매물');
  assert.ok(a.some((l) => l.kind === 'gem') && a.some((l) => l.kind === 'item'));
  const pick = a.find((l) => l.kind === 'item');
  assert.deepEqual(findBotListing(pick.id), pick);
  assert.notDeepEqual(botListings(marketSlot(NOW + H).key, 12).map((l) => l.price), a.map((l) => l.price));
  assert.ok(gemPrice('ruby', '2026-11-28') >= 8 && gemPrice('ruby', '2026-11-28') <= 13);
});

test('경매장 구매: 골드를 내고 새 id 로 가방에, 같은 매물은 한 번만', () => {
  let s = hero(12, 100000);
  const list = botListings(marketSlot(NOW).key, 12);
  const it = list.find((l) => l.kind === 'item');
  const gem = list.find((l) => l.kind === 'gem');
  const r = act(s, 'auction/buy', { id: it.id });
  s = r.state;
  const got = s.inventory.find((x) => x.name === it.item.name && x.source === 'auction');
  assert.ok(got && got.id !== it.item.id);
  assert.equal(s.hero.gold, 100000 - it.price);
  assert.throws(() => act(s, 'auction/buy', { id: it.id }), /이미 팔린/);
  const before = s.gems[gem.gem];
  s = act(s, 'auction/buy', { id: gem.id }).state;
  assert.equal(s.gems[gem.gem], before + gem.qty);
  // 두 시간 지나면 그 매물은 내려감
  assert.throws(() => act(s, 'auction/buy', { id: list[5].id }, NOW + 2 * H), /내려간/);
});

test('경매장 판매: 싸게 올리면 금방 팔려 정산함에, 수수료 5%', () => {
  let s = hero(12, 1000);
  const item = s.inventory.find((x) => x.slot === 'weapon');
  s.hero.equipment.weapon = null;
  assert.throws(() => act(s, 'auction/list', { itemId: 'nope', price: 10, hours: 12 }), /찾을 수 없/);
  const value = marketValue(item);
  const price = Math.max(1, Math.floor(value * 0.5));
  const r = act(s, 'auction/list', { itemId: item.id, price, hours: 12 });
  s = r.state;
  const l = s.auction.listings[0];
  assert.ok(!s.inventory.some((x) => x.id === item.id), '올린 장비는 가방에서 빠진다');
  assert.equal(s.hero.gold, 1000 - Math.max(AUCTION.minFee, Math.round(price * AUCTION.feeRate)));
  assert.ok(l.sellAt && l.sellAt - NOW <= 10 * 60 * 1000, '시세의 절반이면 10분 안에 팔림');
  const t = act(s, 'system/tick', {}, NOW + 11 * 60 * 1000);
  s = t.state;
  assert.equal(s.auction.listings.length, 0);
  const sold = t.events.find((e) => e.type === 'auctionSold');
  assert.equal(sold.net, price - Math.round(price * AUCTION.commission));
  const gold = s.hero.gold;
  s = act(s, 'auction/claim', {}, NOW + 12 * 60 * 1000).state;
  assert.equal(s.hero.gold, gold + sold.net);
  assert.equal(s.auction.mailbox.length, 0);
  assert.throws(() => act(s, 'auction/claim', {}), /받을 것이 없/);
});

test('경매장: 너무 비싸면 안 팔리고 기간이 끝나면 돌아온다, 장착·잠금은 못 올림', () => {
  let s = hero(12, 1000);
  const w = s.inventory.find((x) => x.slot === 'weapon');
  assert.throws(() => act(s, 'auction/list', { itemId: w.id, price: 100, hours: 12 }), /장착 중/);
  s.hero.equipment.weapon = null;
  s.inventory[0].locked = true;
  assert.throws(() => act(s, 'auction/list', { itemId: w.id, price: 100, hours: 12 }), /잠긴/);
  s.inventory[0].locked = false;
  s = act(s, 'auction/list', { itemId: w.id, price: marketValue(w) * 10, hours: 12 }).state;
  assert.equal(s.auction.listings[0].sellAt, null);
  const r = act(s, 'system/tick', {}, NOW + 13 * H);
  s = r.state;
  assert.ok(r.events.some((e) => e.type === 'auctionExpired'));
  assert.equal(s.auction.mailbox[0].kind, 'item');
  s = act(s, 'auction/claim', { id: s.auction.mailbox[0].id }, NOW + 13 * H).state;
  assert.ok(s.inventory.some((x) => x.id === w.id));
});

test('경매장: 보석 올리기·취소, 최대 10개', () => {
  let s = hero(12, 5000, 100);
  s = act(s, 'auction/list', { gem: 'ruby', qty: 30, price: 300, hours: 24 }).state;
  assert.equal(s.gems.ruby, 70);
  assert.throws(() => act(s, 'auction/list', { gem: 'ruby', qty: 999, price: 300, hours: 24 }), /개수/);
  s = act(s, 'auction/cancel', { id: s.auction.listings[0].id }).state;
  assert.equal(s.gems.ruby, 100);
  for (let i = 0; i < 10; i++) s = act(s, 'auction/list', { gem: 'topaz', qty: 1, price: 5000, hours: 48 }).state;
  assert.throws(() => act(s, 'auction/list', { gem: 'topaz', qty: 1, price: 5000, hours: 48 }), /10개까지/);
  // 판매 시간 표: 싸면 빨리, 비싸면 안 팔림
  assert.ok(saleDelayMs('a', 0.5) < 10 * 60 * 1000);
  assert.equal(saleDelayMs('a', 3), null);
});

test('예전 저장 파일에 경매장·직업이 채워진다', () => {
  const old = fresh();
  delete old.auction;
  delete old.job;
  const m = migrate(old, NOW);
  assert.deepEqual(m.auction, { listings: [], mailbox: [], bought: {} });
  assert.deepEqual(m.job.path, []);
});
