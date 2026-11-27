// 장비 생성: 등급 추첨(천장 포함), 이름·능력치 생성, 판매가.

import { RARITIES, RARITY_ORDER, SLOT_ORDER, PITY } from './constants.js';
import { newId } from './rng.js';

const NAMES = {
  weapon: {
    common: ['훈련용 목검', '녹슨 철검', '무딘 숏소드', '견습 기사의 검'],
    rare: ['푸른 강철검', '파도결 세이버', '서리 깃든 검', '청람 기사검'],
    epic: ['자수정 룬블레이드', '폭풍을 부르는 검', '보랏빛 월광검', '심연의 마검'],
    legendary: ['여명을 가르는 성검', '태양왕의 황금검', '별을 삼킨 검 「노을」', '천둥 비늘 대검'],
  },
  helmet: {
    common: ['가죽 모자', '찌그러진 철모', '견습생 두건', '낡은 사슬 두건'],
    rare: ['푸른 강철 투구', '기사단 투구', '청람 깃털 투구', '파도 문양 투구'],
    epic: ['자수정 왕관투구', '그림자 사냥꾼의 투구', '폭풍 수호자의 투구', '룬 새김 투구'],
    legendary: ['태양관 투구', '황금 사자 투구', '새벽 군주의 왕관', '불꽃 깃 투구'],
  },
  armor: {
    common: ['누빈 천옷', '가죽 조끼', '낡은 사슬갑옷', '견습생 튜닉'],
    rare: ['푸른 강철 흉갑', '기사단 판금갑옷', '파도 비늘 갑옷', '청람 경갑'],
    epic: ['자수정 룬갑옷', '심연 기사의 갑주', '천둥 비늘 갑옷', '밤하늘 판금'],
    legendary: ['황금 태양 갑주', '불사조 깃털 갑옷', '여명 수호자의 판금', '용비늘 황금갑'],
  },
  cape: {
    common: ['헤진 망토', '여행자의 망토', '거친 삼베 망토', '회색 외투'],
    rare: ['푸른 비단 망토', '바람결 망토', '별무늬 망토', '파도빛 망토'],
    epic: ['밤하늘 성운 망토', '마법사의 보랏빛 망토', '그림자 망토', '자수정 장식 망토'],
    legendary: ['황금 날개 망토', '황혼빛 왕의 망토', '태양 문장 망토', '은하수 망토'],
  },
};

const PREFIXES = ['튼튼한', '가벼운', '날렵한', '반짝이는', '단단한', '오래된', '행운의'];

/** 천장 반영 등급 추첨. pity 객체를 갱신한다. */
export function rollRarity(rng, pity, weights) {
  const w = weights || Object.fromEntries(RARITY_ORDER.map((k) => [k, RARITIES[k].weight]));
  let rarity;
  if (pity.sinceLegendary + 1 >= PITY.legendary) {
    rarity = 'legendary';
  } else if (pity.sinceEpic + 1 >= PITY.epic) {
    rarity = rng.weighted({ epic: w.epic || RARITIES.epic.weight, legendary: w.legendary || RARITIES.legendary.weight });
  } else {
    rarity = rng.weighted(w);
  }
  const rank = RARITIES[rarity].rank;
  pity.sinceEpic = rank >= RARITIES.epic.rank ? 0 : pity.sinceEpic + 1;
  pity.sinceLegendary = rarity === 'legendary' ? 0 : pity.sinceLegendary + 1;
  return rarity;
}

/** 무작위 장비 생성 */
export function generateItem(rng, { level, rarity, slot, source = 'quest', now = Date.now() }) {
  const s = slot || rng.pick(SLOT_ORDER);
  const r = RARITIES[rarity];
  const base = (3 + level * 1.2) * r.mult;
  const power = Math.max(1, Math.round(base * rng.range(0.85, 1.15)));
  let name = rng.pick(NAMES[s][rarity]);
  if ((rarity === 'common' || rarity === 'rare') && rng.chance(0.5)) {
    name = `${rng.pick(PREFIXES)} ${name}`;
  }
  const stats = { atk: 0, def: 0, hp: 0, luck: 0 };
  switch (s) {
    case 'weapon':
      stats.atk = power;
      if (r.rank >= 2) stats.luck = Math.round(power * 0.15);
      break;
    case 'helmet':
      stats.def = Math.max(1, Math.round(power * 0.5));
      stats.hp = Math.round(power * 2);
      break;
    case 'armor':
      stats.def = Math.max(1, Math.round(power * 0.8));
      stats.hp = Math.round(power * 3);
      break;
    case 'cape':
      stats.luck = Math.max(1, Math.round(power * 0.6));
      stats.atk = Math.round(power * 0.3);
      break;
  }
  return makeItem({ slot: s, rarity, name, level, ...stats, source, now });
}

export function makeItem({ slot, rarity, name, level = 1, atk = 0, def = 0, hp = 0, luck = 0, source = 'quest', now = Date.now() }) {
  return {
    id: newId('it_'),
    slot,
    rarity,
    name,
    level,
    atk,
    def,
    hp,
    luck,
    locked: false,
    source,
    createdAt: now,
  };
}

export function sellPrice(item) {
  const r = RARITIES[item.rarity];
  return r.sell + Math.floor(item.level * r.sell * 0.05);
}

/** 비교용 장비 점수 */
export function itemScore(item) {
  if (!item) return 0;
  return item.atk + item.def * 1.3 + item.hp * 0.25 + item.luck * 0.9;
}
