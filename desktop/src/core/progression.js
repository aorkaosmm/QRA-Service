// 레벨·경험치·능력치 계산.

import { xpToNext, SLOT_ORDER } from './constants.js';

export function equippedItems(state) {
  const byId = new Map(state.inventory.map((it) => [it.id, it]));
  const out = {};
  for (const slot of SLOT_ORDER) {
    const id = state.hero.equipment[slot];
    out[slot] = id ? byId.get(id) || null : null;
  }
  return out;
}

/** 레벨 + 장비로 계산한 최종 능력치 */
export function heroStats(state) {
  const { level, xp } = state.hero;
  const gear = equippedItems(state);
  const sum = { atk: 0, def: 0, hp: 0, luck: 0 };
  for (const it of Object.values(gear)) {
    if (!it) continue;
    sum.atk += it.atk;
    sum.def += it.def;
    sum.hp += it.hp;
    sum.luck += it.luck;
  }
  const luck = sum.luck;
  return {
    level,
    xp,
    xpNext: xpToNext(level),
    maxHp: 60 + (level - 1) * 12 + sum.hp,
    atk: 6 + (level - 1) * 2 + sum.atk,
    def: 2 + (level - 1) + sum.def,
    luck,
    critChance: Math.min(0.5, 0.05 + luck * 0.006),
    critMult: 1.8,
    dropBonus: Math.min(0.25, luck * 0.004),
    gear,
  };
}

/** 경험치 추가. 레벨업 시 onLevel(level) 호출 */
export function addXp(hero, amount, onLevel) {
  hero.xp += amount;
  while (hero.xp >= xpToNext(hero.level)) {
    hero.xp -= xpToNext(hero.level);
    hero.level += 1;
    if (onLevel) onLevel(hero.level);
  }
}

/** 경험치 회수(체크 해제). 필요하면 레벨이 내려간다 */
export function removeXp(hero, amount) {
  hero.xp -= amount;
  while (hero.xp < 0 && hero.level > 1) {
    hero.level -= 1;
    hero.xp += xpToNext(hero.level);
  }
  if (hero.xp < 0) hero.xp = 0;
}
