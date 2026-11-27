// 게임 밸런스·분류 상수. 메인 프로세스, 렌더러, (향후) 모바일·서버가 함께 쓰는 순수 데이터.

export const SAVE_VERSION = 1;

/** 임무 분류 */
export const CATEGORIES = {
  todo:     { key: 'todo',     label: '할 일', color: '#f2c94c', icon: 'cat_todo' },
  study:    { key: 'study',    label: '공부',  color: '#56ccf2', icon: 'cat_study' },
  work:     { key: 'work',     label: '업무',  color: '#bb86fc', icon: 'cat_work' },
  meal:     { key: 'meal',     label: '식사',  color: '#ff9f5a', icon: 'cat_meal' },
  exercise: { key: 'exercise', label: '운동',  color: '#6fdc8c', icon: 'cat_exercise' },
  life:     { key: 'life',     label: '생활',  color: '#a7b0c0', icon: 'cat_life' },
};
export const CATEGORY_ORDER = ['meal', 'study', 'work', 'todo', 'exercise', 'life'];

/** 난이도별 기본 보상 */
export const DIFFICULTIES = {
  easy:   { key: 'easy',   label: '쉬움',   stars: 1, xp: 10, gold: [2, 5],   drop: 0.20, heal: 0.10 },
  normal: { key: 'normal', label: '보통',   stars: 2, xp: 20, gold: [5, 10],  drop: 0.30, heal: 0.15 },
  hard:   { key: 'hard',   label: '어려움', stars: 3, xp: 35, gold: [10, 18], drop: 0.45, heal: 0.25 },
};

/** 장비 등급. weight = 드롭 시 등급 가중치(%) */
export const RARITIES = {
  common:    { key: 'common',    label: '일반', rank: 0, weight: 64, color: '#c3c8d2', mult: 1.0, sell: 5 },
  rare:      { key: 'rare',      label: '희귀', rank: 1, weight: 25, color: '#4aa8ff', mult: 1.6, sell: 20 },
  epic:      { key: 'epic',      label: '영웅', rank: 2, weight: 9,  color: '#c07bff', mult: 2.4, sell: 60 },
  legendary: { key: 'legendary', label: '전설', rank: 3, weight: 2,  color: '#ffb52e', mult: 3.6, sell: 200 },
};
export const RARITY_ORDER = ['common', 'rare', 'epic', 'legendary'];

/** 천장(보장) — 장비 드롭 N회 동안 해당 등급 이상이 안 나오면 다음 드롭에서 보장 */
export const PITY = { epic: 30, legendary: 90 };

/** 장비 부위 */
export const SLOTS = {
  weapon: { key: 'weapon', label: '무기', icon: 'item_weapon' },
  helmet: { key: 'helmet', label: '투구', icon: 'item_helmet' },
  armor:  { key: 'armor',  label: '갑옷', icon: 'item_armor' },
  cape:   { key: 'cape',   label: '망토', icon: 'item_cape' },
};
export const SLOT_ORDER = ['weapon', 'helmet', 'armor', 'cape'];

/** 상점 상품 */
export const SHOP = {
  potion:     { key: 'potion',     label: '체력 물약',      price: 30,  desc: '작업표시줄 용사의 체력을 모두 회복합니다.', icon: 'potion' },
  chest:      { key: 'chest',      label: '보물 상자',      price: 120, desc: '무작위 장비 1개 (기본 확률).', icon: 'chest' },
  goldChest:  { key: 'goldChest',  label: '황금 보물 상자', price: 450, desc: '희귀 등급 이상 장비 1개 보장.', icon: 'chest_gold' },
};
export const GOLD_CHEST_WEIGHTS = { common: 0, rare: 70, epic: 24, legendary: 6 };
export const PERFECT_DAY_WEIGHTS = { common: 40, rare: 40, epic: 16, legendary: 4 };

/** 전투(작업표시줄) 관련 */
export const BATTLE = {
  coinDailyCap: 60,       // 슬라임 동전으로 하루에 얻을 수 있는 최대 골드
  spawnRates: {
    low:    { label: '낮음', interval: [12, 20], max: 1 },
    normal: { label: '보통', interval: [6, 12],  max: 2 },
    high:   { label: '높음', interval: [3, 6],   max: 4 },
  },
};

/** 일정 그룹(캘린더). color가 null이면 임무 분류 색을 따른다 */
export const DEFAULT_GROUP_ID = 'g_default';
export const DEFAULT_GROUPS = [
  { id: 'g_default', name: '기본', color: null },
  { id: 'g_personal', name: '개인', color: '#4aa8ff' },
  { id: 'g_company', name: '회사', color: '#b46cff' },
  { id: 'g_family', name: '가족', color: '#ff8a5c' },
];
export const GROUP_COLORS = ['#4aa8ff', '#b46cff', '#ff8a5c', '#6fdc8c', '#f2c94c', '#ff6b9a', '#56ccf2', '#a7b0c0'];

export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

export const DEFAULT_SETTINGS = {
  dayStartHour: 0,          // 하루 시작 시각(0~6시)
  battleEnabled: true,
  battleInteractive: true,  // 슬라임/용사 클릭 상호작용
  spawnRate: 'normal',
  widgetAlwaysOnTop: false,
  widgetOpacity: 0.94,
  theme: 'dark',
  notifications: true,
  notifyLeadMinutes: 0,
  launchAtLogin: false,
  sound: false,
};

/** 레벨 n → n+1에 필요한 경험치 */
export function xpToNext(level) {
  return 60 + (level - 1) * 40;
}
