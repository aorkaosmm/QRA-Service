// 경매장: 가상 판매자 매물(매시간 바뀜) + 내 매물이 언제 팔리는지 계산.
// 계정 서버 연결 전이라 사고파는 상대는 가상 플레이어다. 서버가 생기면 이 모듈 자리를 실제 거래소로 바꾼다.

import { GEMS, GEM_ORDER, SLOT_ORDER, RAID_GEAR_MULT, RAID_BOSSES } from './constants.js';
import { createRng, hashString } from './rng.js';
import { generateItem } from './items.js';
import { WEAPON_TYPES } from './jobs.js';
import { worldPlayers, WORLD_SEED } from './world.js';

export const AUCTION = {
  feeRate: 0.01, // 등록비 1%
  minFee: 5,
  commission: 0.05, // 판매 수수료 5%
  hours: [12, 24, 48],
  maxListings: 10,
  botCount: 36,
  maxPrice: 9999999,
};

const RARITY_BASE = { common: 20, rare: 80, epic: 320, legendary: 1400 };
const RAID_SLOT = { weapon: { sword: '대검', bow: '장궁', gun: '대포', staff: '지팡이' }, helmet: '투구', armor: '갑주', cape: '망토' };
const roundPrice = (n) => (n >= 1000 ? Math.round(n / 50) * 50 : n >= 100 ? Math.round(n / 5) * 5 : Math.max(1, Math.round(n)));

/** 매물 묶음 시간대: 매시간 새 매물 */
export function marketSlot(now) {
  const d = new Date(now);
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime();
  return { day, hour: d.getHours(), key: `${day}T${String(d.getHours()).padStart(2, '0')}`, start, end: start + 3600 * 1000 };
}

/** 보석 1개 시세 (색마다 날마다 조금씩 다름, 약 8~13G) */
export function gemPrice(gem, day) {
  const r = createRng(`${WORLD_SEED}|gem|${day}|${gem}`);
  return Math.round(10 * r.range(0.8, 1.3));
}

/** 장비 시세: 등급 · 레벨 · 레이드 장비 */
export function marketValue(item) {
  const base = RARITY_BASE[item.rarity] * (1 + item.level * 0.08) * (item.raid ? 1.8 : 1);
  return roundPrice(Math.max(5, base));
}

export function listingValue(l, day) {
  return l.kind === 'gem' ? gemPrice(l.gem, day) * l.qty : marketValue(l.item);
}

/**
 * 가상 판매자 매물 (같은 시간대·같은 레벨이면 항상 같다)
 * @returns {Array<{ id, kind, item?, gem?, qty?, price, seller }>}
 */
export function botListings(slotKey, level, count = AUCTION.botCount) {
  // 레벨 5단위 묶음마다 같은 매물 (사기 직전에 id 로 똑같이 다시 만들 수 있게)
  const bucket = Math.floor(Math.max(1, level) / 5);
  const baseLv = bucket * 5 + 2;
  const rng = createRng(`${WORLD_SEED}|market|${slotKey}|${bucket}`);
  const players = worldPlayers();
  const day = slotKey.slice(0, 10);
  const out = [];
  for (let i = 0; i < count; i++) {
    const id = `mk|${slotKey}|${bucket}|${i}`;
    const seller = rng.pick(players).name;
    if (rng.chance(0.25)) {
      const gem = rng.pick(GEM_ORDER);
      const qty = rng.pick([5, 10, 10, 20, 30, 50]);
      out.push({ id, kind: 'gem', gem, qty, price: roundPrice(gemPrice(gem, day) * qty * rng.range(0.9, 1.25)), seller });
      continue;
    }
    const raid = rng.chance(0.05);
    const rarity = raid ? rng.weighted({ rare: 50, epic: 38, legendary: 12 }) : rng.weighted({ common: 40, rare: 36, epic: 19, legendary: 5 });
    const lv = Math.max(1, Math.min(99, baseLv + rng.int(-4, 6)));
    const slot = rng.pick(SLOT_ORDER);
    const item = generateItem(rng, { level: lv, rarity, slot, weaponType: slot === 'weapon' ? rng.pick(WEAPON_TYPES) : null, source: 'auction', now: 0 });
    if (raid) {
      const boss = RAID_BOSSES[Math.max(0, Math.min(RAID_BOSSES.length - 1, Math.floor(lv / 6)))];
      for (const k of ['atk', 'def', 'hp', 'luck']) item[k] = Math.round(item[k] * RAID_GEAR_MULT);
      item.name = `${boss.set}의 ${slot === 'weapon' ? RAID_SLOT.weapon[item.weaponType] : RAID_SLOT[slot]}`;
      item.raid = boss.tier;
    }
    item.id = `mk_${hashString(id).toString(36)}`;
    out.push({ id, kind: 'item', item, price: roundPrice(marketValue(item) * rng.range(0.85, 1.35)), seller });
  }
  return out;
}

/** 매물 id 로 다시 만든다 (사기 직전 확인용) */
export function findBotListing(id) {
  const m = /^mk\|(\d{4}-\d{2}-\d{2}T\d{2})\|(\d+)\|(\d+)$/.exec(String(id));
  if (!m) return null;
  const list = botListings(m[1], Number(m[2]) * 5 + 2);
  return list.find((l) => l.id === id) || null;
}

/**
 * 내 매물이 팔리기까지 걸리는 시간(ms). null 이면 기간 안에 안 팔림.
 * 시세보다 싸면 몇 분, 비슷하면 몇 시간, 30% 넘게 비싸면 하루 넘게(또는 안 팔림)
 */
export function saleDelayMs(seed, ratio) {
  const rng = createRng(seed);
  let min;
  if (ratio <= 0.7) min = rng.range(2, 10);
  else if (ratio <= 1.0) min = rng.range(10, 180);
  else if (ratio <= 1.3) min = rng.range(120, 1080);
  else if (ratio <= 1.8) min = rng.chance(0.3) ? rng.range(1440, 2880) : null;
  else min = null;
  return min === null ? null : Math.round(min * 60 * 1000);
}

/** 구매자 이름 (정산 기록용) */
export function buyerName(seed) {
  return createRng(`${seed}|buyer`).pick(worldPlayers()).name;
}

export const gemLabel = (g) => (GEMS[g] ? GEMS[g].label : g);
