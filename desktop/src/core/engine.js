// 게임 상태와 동작(액션) 처리. 메인 프로세스가 단일 진실 원천으로 이 엔진을 돌리고,
// 렌더러는 액션만 보낸다. 같은 엔진을 향후 모바일 앱·동기화 서버에서도 그대로 쓸 수 있게 순수 JS로 유지.

import {
  SAVE_VERSION, CATEGORIES, DIFFICULTIES, RARITIES, SLOTS, SHOP, BATTLE,
  GOLD_CHEST_WEIGHTS, PERFECT_DAY_WEIGHTS, DEFAULT_SETTINGS, DEFAULT_GROUPS, DEFAULT_GROUP_ID, GROUP_COLORS,
} from './constants.js';
import { createRng, newId } from './rng.js';
import { dayKey, addDays, diffDays } from './dates.js';
import { rollRarity, generateItem, makeItem, sellPrice } from './items.js';
import { heroStats, addXp, removeXp } from './progression.js';
import {
  isDailyScheduled, isDailyDone, computeStreak, dailiesForDay, occurrenceStart,
} from './selectors.js';

export class ActionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ActionError';
  }
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const INVENTORY_CAP = 300;
const LOG_CAP = 120;
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const WORK_DAYS = [1, 2, 3, 4, 5];

/* ── 초기 상태 ─────────────────────────────── */

export function createInitialState(now = Date.now(), { seed } = {}) {
  const today = dayKey(now, DEFAULT_SETTINGS.dayStartHour);
  const daily = (title, category, difficulty, days, time = null) => ({
    id: newId('d_'), title, category, difficulty, days: [...days], time, note: '',
    startDay: today, history: {}, createdAt: now, updatedAt: now,
  });
  const starter = makeItem({ slot: 'weapon', rarity: 'common', name: '견습 용사의 목검', level: 1, atk: 2, source: 'starter', now });
  return {
    version: SAVE_VERSION,
    profile: { id: newId('u_'), name: '용사', seed: seed || newId('seed_'), createdAt: now },
    hero: {
      level: 1, xp: 0, gold: 30, maxLevelReached: 1,
      equipment: { weapon: starter.id, helmet: null, armor: null, cape: null },
    },
    inventory: [starter],
    dailies: [
      daily('아침 식사', 'meal', 'easy', ALL_DAYS, '08:00'),
      daily('점심 식사', 'meal', 'easy', ALL_DAYS, '12:30'),
      daily('저녁 식사', 'meal', 'easy', ALL_DAYS, '18:30'),
      daily('공부 1시간', 'study', 'normal', ALL_DAYS),
      daily('오늘 업무 계획 세우기', 'work', 'easy', WORK_DAYS, '09:00'),
      daily('업무 마무리 정리', 'work', 'normal', WORK_DAYS, '18:00'),
      daily('스트레칭 10분', 'exercise', 'easy', ALL_DAYS),
    ],
    tasks: [
      {
        id: newId('t_'), type: 'todo', title: 'Calendar RPG 둘러보기 (체크하면 보상!)', date: today, endDate: today,
        time: null, endTime: null, category: 'todo', difficulty: 'easy', repeat: 'none', memo: '', groupId: DEFAULT_GROUP_ID,
        completions: {}, createdAt: now, updatedAt: now,
      },
    ],
    groups: DEFAULT_GROUPS.map((g) => ({ ...g, createdAt: now })),
    rewards: [
      { id: newId('r_'), title: '유튜브 30분', cost: 40, createdAt: now },
      { id: newId('r_'), title: '좋아하는 간식', cost: 60, createdAt: now },
      { id: newId('r_'), title: '게임 1시간', cost: 100, createdAt: now },
    ],
    perfectDays: {},
    pity: { sinceEpic: 0, sinceLegendary: 0 },
    stats: {
      questsDone: 0, slimesDefeated: 0, kingsDefeated: 0, faints: 0, itemsFound: 0,
      legendaryFound: 0, goldEarned: 0, chestsOpened: 0, rewardsBought: 0,
    },
    daily: { day: today, coins: 0 },
    log: [],
    settings: { ...DEFAULT_SETTINGS },
    meta: { createdAt: now, updatedAt: now },
  };
}

/** 저장 파일/가져오기 데이터를 현재 형식으로 맞춘다 */
export function migrate(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object' || !raw.hero || !raw.profile) {
    throw new ActionError('Calendar RPG 저장 데이터 형식이 아니에요.');
  }
  const base = createInitialState(now, { seed: raw.profile.seed });
  const arr = (v, fallback) => (Array.isArray(v) ? v : fallback);
  const s = {
    ...base,
    ...raw,
    version: SAVE_VERSION,
    profile: { ...base.profile, ...raw.profile },
    hero: { ...base.hero, ...raw.hero, equipment: { ...base.hero.equipment, ...(raw.hero.equipment || {}) } },
    inventory: arr(raw.inventory, base.inventory),
    dailies: arr(raw.dailies, base.dailies),
    tasks: arr(raw.tasks, []),
    rewards: arr(raw.rewards, base.rewards),
    groups: arr(raw.groups, base.groups),
    log: arr(raw.log, []),
    perfectDays: raw.perfectDays && typeof raw.perfectDays === 'object' ? raw.perfectDays : {},
    pity: { ...base.pity, ...(raw.pity || {}) },
    stats: { ...base.stats, ...(raw.stats || {}) },
    daily: { ...base.daily, ...(raw.daily || {}) },
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
    meta: { ...base.meta, ...(raw.meta || {}) },
  };
  const ids = new Set(s.inventory.map((it) => it.id));
  for (const slot of Object.keys(SLOTS)) {
    if (s.hero.equipment[slot] && !ids.has(s.hero.equipment[slot])) s.hero.equipment[slot] = null;
  }
  for (const d of s.dailies) d.history = d.history || {};
  if (!s.groups.some((g) => g.id === DEFAULT_GROUP_ID)) s.groups.unshift({ ...DEFAULT_GROUPS[0], createdAt: now });
  const groupIds = new Set(s.groups.map((g) => g.id));
  for (const t of s.tasks) {
    t.completions = t.completions || {};
    if (!t.endDate || t.endDate < t.date) t.endDate = t.date;
    if (!groupIds.has(t.groupId)) t.groupId = DEFAULT_GROUP_ID;
  }
  return s;
}

/* ── 액션 처리 ─────────────────────────────── */

/**
 * @returns {{ state, events }} 새 상태(원본 불변)와 화면 연출용 이벤트 목록
 */
export function applyAction(state, action, ctx = {}) {
  const now = ctx.now ?? Date.now();
  const s = structuredClone(state);
  const handler = HANDLERS[action && action.type];
  if (!handler) throw new ActionError(`알 수 없는 동작이에요: ${action && action.type}`);
  const today = dayKey(now, s.settings.dayStartHour);
  const events = [];
  if (s.daily.day !== today) {
    s.daily = { day: today, coins: 0 };
    events.push({ type: 'dayChanged', day: today });
  }
  const c = { now, today, events };
  handler(s, action.payload || {}, c);
  s.meta.updatedAt = now;
  return { state: s, events };
}

const HANDLERS = {
  /* 일일임무 */
  'daily/add'(s, p, c) {
    const d = {
      id: newId('d_'),
      title: cleanTitle(p.title),
      category: cleanCategory(p.category, 'todo'),
      difficulty: cleanDifficulty(p.difficulty),
      days: cleanDays(p.days),
      time: cleanTime(p.time),
      note: cleanNote(p.note),
      startDay: c.today,
      history: {},
      createdAt: c.now,
      updatedAt: c.now,
    };
    s.dailies.push(d);
    c.events.push({ type: 'saved', what: 'daily', id: d.id });
  },
  'daily/update'(s, p, c) {
    const d = findDaily(s, p.id);
    const patch = p.patch || {};
    if ('title' in patch) d.title = cleanTitle(patch.title);
    if ('category' in patch) d.category = cleanCategory(patch.category, d.category);
    if ('difficulty' in patch) d.difficulty = cleanDifficulty(patch.difficulty);
    if ('days' in patch) d.days = cleanDays(patch.days);
    if ('time' in patch) d.time = cleanTime(patch.time);
    if ('note' in patch) d.note = cleanNote(patch.note);
    d.updatedAt = c.now;
    c.events.push({ type: 'saved', what: 'daily', id: d.id });
  },
  'daily/delete'(s, p) {
    findDaily(s, p.id);
    s.dailies = s.dailies.filter((d) => d.id !== p.id);
  },
  'daily/toggle'(s, p, c) {
    const d = findDaily(s, p.id);
    const day = p.day || c.today;
    assertDate(day);
    if (day > c.today) throw new ActionError('아직 오지 않은 날의 임무는 완료할 수 없어요.');
    if (!isDailyScheduled(d, day)) throw new ActionError('이 날은 예정된 임무가 아니에요.');
    const done = toggleCompletion(s, c, {
      record: d.history, key: day, questId: d.id, kind: 'daily', title: d.title,
      difficulty: d.difficulty, category: d.category,
      streak: () => computeStreak(d, day) + 1,
    });
    if (done) checkPerfectDay(s, c, day);
  },

  /* 일정·할 일 */
  'task/add'(s, p, c) {
    const type = p.type === 'todo' ? 'todo' : 'event';
    const date = cleanDate(p.date || c.today);
    const t = {
      id: newId('t_'),
      type,
      title: cleanTitle(p.title),
      date,
      endDate: cleanEndDate(p.endDate, date),
      groupId: cleanGroup(s, p.groupId),
      time: cleanTime(p.time),
      endTime: cleanTime(p.endTime),
      category: cleanCategory(p.category, type === 'todo' ? 'todo' : 'life'),
      difficulty: cleanDifficulty(p.difficulty),
      repeat: type === 'event' ? cleanRepeat(p.repeat) : 'none',
      memo: cleanNote(p.memo),
      completions: {},
      createdAt: c.now,
      updatedAt: c.now,
    };
    s.tasks.push(t);
    c.events.push({ type: 'saved', what: 'task', id: t.id });
  },
  'task/update'(s, p, c) {
    const t = findTask(s, p.id);
    const patch = p.patch || {};
    if ('type' in patch) t.type = patch.type === 'todo' ? 'todo' : 'event';
    if ('title' in patch) t.title = cleanTitle(patch.title);
    if ('date' in patch && !('endDate' in patch)) {
      // 시작 날짜만 옮기면 기간(일수)을 유지한 채 종료 날짜도 함께 옮긴다
      const span = diffDays(t.date, t.endDate || t.date);
      t.date = cleanDate(patch.date);
      t.endDate = addDays(t.date, Math.max(0, span));
    } else {
      if ('date' in patch) t.date = cleanDate(patch.date);
      if ('endDate' in patch || 'date' in patch) t.endDate = cleanEndDate('endDate' in patch ? patch.endDate : t.endDate, t.date);
    }
    if ('groupId' in patch) t.groupId = cleanGroup(s, patch.groupId);
    if ('time' in patch) t.time = cleanTime(patch.time);
    if ('endTime' in patch) t.endTime = cleanTime(patch.endTime);
    if ('category' in patch) t.category = cleanCategory(patch.category, t.category);
    if ('difficulty' in patch) t.difficulty = cleanDifficulty(patch.difficulty);
    if ('repeat' in patch) t.repeat = cleanRepeat(patch.repeat);
    if ('memo' in patch) t.memo = cleanNote(patch.memo);
    if (t.type === 'todo') t.repeat = 'none';
    t.updatedAt = c.now;
    c.events.push({ type: 'saved', what: 'task', id: t.id });
  },
  'task/delete'(s, p) {
    findTask(s, p.id);
    s.tasks = s.tasks.filter((t) => t.id !== p.id);
  },
  'task/toggle'(s, p, c) {
    const t = findTask(s, p.id);
    assertDate(p.occurrence || t.date);
    // 여러 날 일정은 어느 날에 눌러도 그 회차의 시작일로 기록
    const occ = occurrenceStart(t, p.occurrence || t.date);
    if (!occ) throw new ActionError('그 날짜에는 이 일정이 없어요.');
    if (t.type === 'event' && occ > c.today) throw new ActionError('아직 오지 않은 일정은 완료할 수 없어요.');
    toggleCompletion(s, c, {
      record: t.completions, key: occ, questId: t.id, kind: 'task', title: t.title,
      difficulty: t.difficulty, category: t.category, streak: () => 0,
    });
  },

  /* 일정 그룹 */
  'group/add'(s, p, c) {
    const name = cleanGroupName(p.name);
    if (s.groups.some((g) => g.name === name)) throw new ActionError('같은 이름의 그룹이 있어요.');
    if (s.groups.length >= 20) throw new ActionError('그룹은 20개까지 만들 수 있어요.');
    const g = { id: newId('g_'), name, color: cleanColor(p.color, s.groups.length), createdAt: c.now };
    s.groups.push(g);
    c.events.push({ type: 'saved', what: 'group', id: g.id });
  },
  'group/update'(s, p) {
    const g = s.groups.find((x) => x.id === p.id);
    if (!g) throw new ActionError('그룹을 찾을 수 없어요.');
    const patch = p.patch || {};
    if ('name' in patch) g.name = cleanGroupName(patch.name);
    if ('color' in patch && g.id !== DEFAULT_GROUP_ID) g.color = cleanColor(patch.color, 0);
  },
  'group/delete'(s, p) {
    if (p.id === DEFAULT_GROUP_ID) throw new ActionError('기본 그룹은 지울 수 없어요.');
    if (!s.groups.some((g) => g.id === p.id)) throw new ActionError('그룹을 찾을 수 없어요.');
    s.groups = s.groups.filter((g) => g.id !== p.id);
    for (const t of s.tasks) if (t.groupId === p.id) t.groupId = DEFAULT_GROUP_ID;
  },

  /* 장비 */
  'item/equip'(s, p, c) {
    const it = findItem(s, p.id);
    s.hero.equipment[it.slot] = it.id;
    c.events.push({ type: 'equip', item: it });
  },
  'item/unequip'(s, p, c) {
    if (!SLOTS[p.slot]) throw new ActionError('알 수 없는 장비 부위예요.');
    s.hero.equipment[p.slot] = null;
    c.events.push({ type: 'equip', item: null, slot: p.slot });
  },
  'item/lock'(s, p) {
    const it = findItem(s, p.id);
    it.locked = !it.locked;
  },
  'item/sell'(s, p, c) {
    const it = findItem(s, p.id);
    if (it.locked) throw new ActionError('잠긴 장비는 판매할 수 없어요.');
    if (s.hero.equipment[it.slot] === it.id) throw new ActionError('장착 중인 장비는 판매할 수 없어요.');
    const price = sellPrice(it);
    s.inventory = s.inventory.filter((x) => x.id !== it.id);
    s.hero.gold += price;
    pushLog(s, c.now, { kind: 'sell', text: `${it.name} 판매 (+${price}G)`, rarity: it.rarity });
    c.events.push({ type: 'sold', count: 1, gold: price });
  },
  'item/sellBulk'(s, p, c) {
    if (!RARITIES[p.rarity]) throw new ActionError('알 수 없는 등급이에요.');
    const equipped = new Set(Object.values(s.hero.equipment).filter(Boolean));
    const targets = s.inventory.filter((it) => it.rarity === p.rarity && !it.locked && !equipped.has(it.id));
    if (!targets.length) throw new ActionError('판매할 장비가 없어요.');
    const gold = targets.reduce((sum, it) => sum + sellPrice(it), 0);
    const ids = new Set(targets.map((it) => it.id));
    s.inventory = s.inventory.filter((it) => !ids.has(it.id));
    s.hero.gold += gold;
    pushLog(s, c.now, { kind: 'sell', text: `${RARITIES[p.rarity].label} 장비 ${targets.length}개 일괄 판매 (+${gold}G)` });
    c.events.push({ type: 'sold', count: targets.length, gold });
  },

  /* 상점 */
  'shop/buy'(s, p, c) {
    const prod = SHOP[p.key];
    if (!prod) throw new ActionError('없는 상품이에요.');
    spendGold(s, prod.price);
    if (prod.key === 'potion') {
      pushLog(s, c.now, { kind: 'shop', text: `${prod.label} 구매 (-${prod.price}G)` });
      c.events.push({ type: 'potion' });
      return;
    }
    s.stats.chestsOpened += 1;
    const rng = createRng(`${s.profile.seed}|shop|${s.stats.chestsOpened}`);
    const rarity = rollRarity(rng, s.pity, prod.key === 'goldChest' ? GOLD_CHEST_WEIGHTS : undefined);
    const item = generateItem(rng, { level: s.hero.level, rarity, source: 'shop', now: c.now });
    pushLog(s, c.now, { kind: 'shop', text: `${prod.label} 개봉 (-${prod.price}G)` });
    grant(s, c, { item, source: 'shop', title: prod.label });
  },
  'reward/add'(s, p, c) {
    s.rewards.push({ id: newId('r_'), title: cleanTitle(p.title), cost: cleanCost(p.cost), createdAt: c.now });
  },
  'reward/update'(s, p) {
    const r = findReward(s, p.id);
    if ('title' in (p.patch || {})) r.title = cleanTitle(p.patch.title);
    if ('cost' in (p.patch || {})) r.cost = cleanCost(p.patch.cost);
  },
  'reward/delete'(s, p) {
    findReward(s, p.id);
    s.rewards = s.rewards.filter((r) => r.id !== p.id);
  },
  'reward/buy'(s, p, c) {
    const r = findReward(s, p.id);
    spendGold(s, r.cost);
    s.stats.rewardsBought += 1;
    pushLog(s, c.now, { kind: 'reward', text: `나만의 보상: ${r.title} (-${r.cost}G)` });
    c.events.push({ type: 'customReward', title: r.title, cost: r.cost });
  },

  /* 작업표시줄 전투 결과 보고 */
  'battle/report'(s, p) {
    const kills = clampInt(p.kills, 0, 5000);
    const kings = clampInt(p.kings, 0, 500);
    const faints = clampInt(p.faints, 0, 500);
    const coins = clampInt(p.coins, 0, 5000);
    s.stats.slimesDefeated += kills;
    s.stats.kingsDefeated += kings;
    s.stats.faints += faints;
    const gained = Math.min(Math.max(0, BATTLE.coinDailyCap - s.daily.coins), coins);
    s.hero.gold += gained;
    s.daily.coins += gained;
    s.stats.goldEarned += gained;
  },

  /* 프로필·설정 */
  'hero/rename'(s, p) {
    const name = String(p.name || '').trim().slice(0, 12);
    if (!name) throw new ActionError('이름을 입력해 주세요.');
    s.profile.name = name;
  },
  'settings/update'(s, p) {
    for (const [k, v] of Object.entries(p.patch || {})) {
      if (!(k in DEFAULT_SETTINGS)) continue;
      s.settings[k] = cleanSetting(k, v);
    }
  },
  'system/tick'() {
    // 날짜 변경 처리는 applyAction 앞단에서 수행
  },
  'data/replace'(s, p, c) {
    const next = migrate(p.state, c.now);
    for (const k of Object.keys(s)) delete s[k];
    Object.assign(s, next);
    c.events.push({ type: 'replaced' });
  },
  'data/reset'(s, p, c) {
    const keepSettings = s.settings;
    const next = createInitialState(c.now);
    next.settings = { ...keepSettings };
    for (const k of Object.keys(s)) delete s[k];
    Object.assign(s, next);
    c.events.push({ type: 'replaced' });
  },
};

/* ── 보상 처리 ─────────────────────────────── */

function toggleCompletion(s, c, { record, key, questId, kind, title, difficulty, category, streak }) {
  const rec = record[key];
  if (rec && rec.done) {
    removeXp(s.hero, rec.reward.xp);
    s.hero.gold = Math.max(0, s.hero.gold - rec.reward.gold);
    s.stats.questsDone = Math.max(0, s.stats.questsDone - 1);
    rec.done = false;
    rec.undoneAt = c.now;
    c.events.push({ type: 'revert', kind, questId, occurrence: key, title, xp: rec.reward.xp, gold: rec.reward.gold });
    return false;
  }
  let reward;
  let item = null;
  if (rec && rec.reward) {
    // 같은 날 다시 체크: 경험치·골드만 동일하게 돌려주고 장비는 다시 굴리지 않는다
    reward = rec.reward;
  } else {
    const rolled = rollQuestReward(s, { questId, occurrence: key, difficulty, streak: streak(), now: c.now });
    item = rolled.item;
    reward = { xp: rolled.xp, gold: rolled.gold, streak: rolled.streak, itemId: item ? item.id : null, itemRarity: item ? item.rarity : null };
  }
  record[key] = { done: true, at: c.now, reward };
  s.stats.questsDone += 1;
  grant(s, c, {
    xp: reward.xp, gold: reward.gold, item, heal: (DIFFICULTIES[difficulty] || DIFFICULTIES.normal).heal,
    source: kind, questId, occurrence: key, title, category, streak: reward.streak,
  });
  return true;
}

function rollQuestReward(s, { questId, occurrence, difficulty, streak, now }) {
  const rng = createRng(`${s.profile.seed}|q|${questId}|${occurrence}`);
  const d = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
  const stats = heroStats(s);
  const streakBonus = Math.min(0.5, Math.max(0, streak - 1) * 0.03);
  const xp = Math.max(1, Math.round(d.xp * (1 + streakBonus) * rng.range(0.9, 1.1)));
  const goldBase = rng.int(d.gold[0], d.gold[1]);
  const gold = Math.max(1, Math.round(goldBase * (1 + (s.hero.level - 1) * 0.05) * (1 + streakBonus * 0.5)));
  let item = null;
  if (rng.chance(Math.min(0.75, d.drop + stats.dropBonus))) {
    const rarity = rollRarity(rng, s.pity);
    item = generateItem(rng, { level: s.hero.level, rarity, source: 'quest', now });
  }
  return { xp, gold, item, streak };
}

function grant(s, c, { xp = 0, gold = 0, item = null, heal = 0, ...info }) {
  const levels = [];
  if (xp) addXp(s.hero, xp, (lv) => levels.push(lv));
  s.hero.gold += gold;
  s.stats.goldEarned += gold;
  let soldOverflow = 0;
  if (item) soldOverflow = addItem(s, c, item);
  c.events.push({ type: 'reward', xp, gold, item, heal, soldOverflow, ...info });
  for (const lv of levels) onLevelUp(s, c, lv);
}

function onLevelUp(s, c, level) {
  const ev = { type: 'levelUp', level, gold: 0, item: null };
  if (level > s.hero.maxLevelReached) {
    s.hero.maxLevelReached = level;
    ev.gold = 20 + level * 5;
    s.hero.gold += ev.gold;
    s.stats.goldEarned += ev.gold;
    if (level % 5 === 0) {
      const rng = createRng(`${s.profile.seed}|lv|${level}`);
      const rarity = rollRarity(rng, s.pity, GOLD_CHEST_WEIGHTS);
      ev.item = generateItem(rng, { level, rarity, source: 'levelup', now: c.now });
      addItem(s, c, ev.item);
    }
  }
  pushLog(s, c.now, { kind: 'level', text: `레벨 ${level} 달성!` });
  c.events.push(ev);
}

function checkPerfectDay(s, c, day) {
  if (s.perfectDays[day]) return;
  const list = dailiesForDay(s, day);
  if (list.length < 2 || !list.every((d) => isDailyDone(d, day))) return;
  const rng = createRng(`${s.profile.seed}|perfect|${day}`);
  const rarity = rollRarity(rng, s.pity, PERFECT_DAY_WEIGHTS);
  const item = generateItem(rng, { level: s.hero.level, rarity, source: 'perfect', now: c.now });
  s.perfectDays[day] = { at: c.now, itemId: item.id };
  pushLog(s, c.now, { kind: 'perfect', text: '퍼펙트 데이! 일일임무를 모두 완료했어요' });
  grant(s, c, { xp: 30, gold: 20, item, heal: 1, source: 'perfect', title: '퍼펙트 데이 보너스' });
}

/** 가방에 넣는다. 가방이 가득 차면 자동 판매하고 판매 금액을 돌려준다 */
function addItem(s, c, item) {
  s.stats.itemsFound += 1;
  if (item.rarity === 'legendary') s.stats.legendaryFound += 1;
  if (s.inventory.length >= INVENTORY_CAP) {
    const price = sellPrice(item);
    s.hero.gold += price;
    pushLog(s, c.now, { kind: 'sell', text: `가방이 가득 차서 ${item.name} 자동 판매 (+${price}G)`, rarity: item.rarity });
    return price;
  }
  s.inventory.push(item);
  pushLog(s, c.now, { kind: 'item', text: `${RARITIES[item.rarity].label} 장비 획득: ${item.name}`, rarity: item.rarity });
  return 0;
}

function spendGold(s, amount) {
  if (s.hero.gold < amount) throw new ActionError(`골드가 부족해요. (${amount - s.hero.gold}G 더 필요)`);
  s.hero.gold -= amount;
}

function pushLog(s, at, entry) {
  s.log.unshift({ id: newId('l_'), at, ...entry });
  if (s.log.length > LOG_CAP) s.log.length = LOG_CAP;
}

/* ── 조회·검증 ─────────────────────────────── */

function findDaily(s, id) {
  const d = s.dailies.find((x) => x.id === id);
  if (!d) throw new ActionError('일일임무를 찾을 수 없어요.');
  return d;
}
function findTask(s, id) {
  const t = s.tasks.find((x) => x.id === id);
  if (!t) throw new ActionError('일정을 찾을 수 없어요.');
  return t;
}
function findItem(s, id) {
  const it = s.inventory.find((x) => x.id === id);
  if (!it) throw new ActionError('장비를 찾을 수 없어요.');
  return it;
}
function findReward(s, id) {
  const r = s.rewards.find((x) => x.id === id);
  if (!r) throw new ActionError('보상을 찾을 수 없어요.');
  return r;
}

function cleanTitle(v) {
  const t = String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
  if (!t) throw new ActionError('제목을 입력해 주세요.');
  return t;
}
function cleanNote(v) {
  return String(v ?? '').trim().slice(0, 500);
}
function cleanCategory(v, fallback) {
  return CATEGORIES[v] ? v : fallback;
}
function cleanDifficulty(v) {
  return DIFFICULTIES[v] ? v : 'normal';
}
function cleanTime(v) {
  if (v === null || v === undefined || v === '') return null;
  if (!TIME_RE.test(v)) throw new ActionError('시간 형식은 HH:MM 이에요.');
  return v;
}
function cleanDate(v) {
  assertDate(v);
  return v;
}
function cleanEndDate(v, start) {
  if (v === null || v === undefined || v === '') return start;
  assertDate(v);
  if (v < start) throw new ActionError('종료 날짜가 시작 날짜보다 빨라요.');
  return v;
}
function cleanGroup(s, id) {
  return (s.groups || []).some((g) => g.id === id) ? id : DEFAULT_GROUP_ID;
}
function cleanGroupName(v) {
  const t = String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, 12);
  if (!t) throw new ActionError('그룹 이름을 입력해 주세요.');
  return t;
}
function cleanColor(v, index) {
  return /^#[0-9a-fA-F]{6}$/.test(String(v)) ? String(v) : GROUP_COLORS[index % GROUP_COLORS.length];
}
function assertDate(v) {
  if (!DATE_RE.test(String(v))) throw new ActionError('날짜 형식이 올바르지 않아요.');
}
function cleanDays(v) {
  const days = Array.isArray(v) ? [...new Set(v.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6))].sort() : [];
  if (!days.length) throw new ActionError('반복할 요일을 하나 이상 골라 주세요.');
  return days;
}
function cleanRepeat(v) {
  return ['none', 'weekly', 'monthly', 'yearly'].includes(v) ? v : 'none';
}
function cleanCost(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 1 || n > 99999) throw new ActionError('가격은 1~99999G 사이로 정해 주세요.');
  return n;
}
function clampInt(v, min, max) {
  const n = Math.floor(Number(v) || 0);
  return Math.min(max, Math.max(min, n));
}
function cleanSetting(key, v) {
  const def = DEFAULT_SETTINGS[key];
  switch (key) {
    case 'dayStartHour': return clampInt(v, 0, 6);
    case 'spawnRate': return BATTLE.spawnRates[v] ? v : def;
    case 'widgetOpacity': return Math.min(1, Math.max(0.5, Number(v) || def));
    case 'theme': return v === 'light' ? 'light' : 'dark';
    case 'notifyLeadMinutes': return [0, 5, 10, 15, 30].includes(Number(v)) ? Number(v) : def;
    default: return typeof def === 'boolean' ? Boolean(v) : def;
  }
}
