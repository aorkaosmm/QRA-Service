// 레벨·경험치·능력치 계산.

import { xpToNext, SLOT_ORDER, POWER_BANDS } from './constants.js';

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

/** 전투력: 능력치를 한 숫자로 (랭킹·던전·레이드 단계 기준) */
export function powerFromStats(st) {
  return Math.round(st.atk * 4 + st.def * 5 + st.maxHp * 0.8 + st.luck * 3 + st.level * 10);
}

export function combatPower(state) {
  return powerFromStats(heroStats(state));
}

/** 전투력 단계 1~10 */
export function powerBand(cp) {
  let band = 1;
  for (let i = 0; i < POWER_BANDS.length; i++) if (cp >= POWER_BANDS[i]) band = i + 1;
  return band;
}

/** 다음 단계까지 진행률 (0~1, 10단계는 1) */
export function bandProgress(cp) {
  const b = powerBand(cp);
  if (b >= POWER_BANDS.length) return { band: b, next: null, ratio: 1 };
  const lo = POWER_BANDS[b - 1];
  const hi = POWER_BANDS[b];
  return { band: b, next: hi, ratio: Math.max(0, Math.min(1, (cp - lo) / (hi - lo))) };
}
