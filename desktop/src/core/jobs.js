// 직업: 1차(전사·궁수·거너·마법사) → 전직마다 4갈래 → 2차 16개 → 3차 64개 (모두 84개).
// 전직할 때마다 능력치 보너스(성향별)와 필살기가 강해진다. 전직 레벨 10 / 30 / 60.

import { GEM_ORDER } from './constants.js';

export const WEAPON_TYPES = ['sword', 'bow', 'gun', 'staff'];
export const WEAPON_LABELS = { sword: '검', bow: '활', gun: '총', staff: '지팡이' };

/** 전직 레벨 (1차, 2차, 3차) */
export const JOB_LEVELS = [10, 30, 60];
/** 전직 비용: 골드 + 직업 보석(classGem) + 다른 색 보석 각각(otherGems) */
export const JOB_COSTS = [
  { gold: 300, classGem: 0, otherGems: 0 },
  { gold: 2000, classGem: 30, otherGems: 0 },
  { gold: 10000, classGem: 100, otherGems: 20 },
];
/** 직업 초기화 비용 (현재 차수 × 1000G) */
export const JOB_RESET_GOLD = 1000;
/** 필살기 배율 (초보자, 1차, 2차, 3차) — 던전 전투에서 초당 피해의 몇 배 */
export const SKILL_MULTS = [6, 7, 8.5, 10.5];

/** 성향별 능력치 보너스 비율. 차수 배율(TIER_SCALE)을 곱해 더한다 */
const FOCUS = {
  atk:     { atk: 1.0, def: 0.2, hp: 0.2, luck: 0.3 },
  def:     { atk: 0.3, def: 1.0, hp: 1.0, luck: 0.1 },
  crit:    { atk: 0.6, def: 0.2, hp: 0.2, luck: 1.0 },
  balance: { atk: 0.6, def: 0.6, hp: 0.6, luck: 0.4 },
  magic:   { atk: 1.0, def: 0.1, hp: 0.3, luck: 0.6 },
  hp:      { atk: 0.4, def: 0.6, hp: 1.2, luck: 0.2 },
  support: { atk: 0.4, def: 0.5, hp: 0.8, luck: 0.6 },
};
export const FOCUS_LABELS = { atk: '공격', def: '방어', crit: '치명', balance: '균형', magic: '마력', hp: '체력', support: '지원' };
const TIER_SCALE = [0.08, 0.12, 0.2];

const J = (id, name, desc, focus, skill, children = []) => ({ id, name, desc, focus, skill, children });

/** 직업 나무 */
export const JOB_TREE = [
  J('warrior', '전사', '검과 갑옷으로 맞서는 근접 전사', 'balance', '강타', [
    J('knight', '나이트', '방패로 동료를 지키는 기사', 'def', '방패 돌진', [
      J('guardian', '가디언', '무너지지 않는 성벽', 'def', '철벽'),
      J('royalguard', '로열가드', '왕을 지키는 근위 기사', 'balance', '근위의 일격'),
      J('dragonknight', '드래곤나이트', '용의 힘을 빌린 창기사', 'atk', '용의 숨결'),
      J('crusader', '크루세이더', '신념으로 싸우는 성전사', 'hp', '성전의 함성'),
    ]),
    J('berserker', '버서커', '고통을 힘으로 바꾸는 광전사', 'atk', '광폭화', [
      J('warlord', '워로드', '전장을 지배하는 전쟁군주', 'atk', '군주의 진격'),
      J('bloodrage', '블러드레이지', '피를 볼수록 강해지는 자', 'crit', '피의 폭주'),
      J('barbarian', '바바리안', '거대한 도끼의 야만 전사', 'hp', '대지 가르기'),
      J('deathbringer', '데스브링어', '죽음을 몰고 오는 검', 'atk', '종말의 칼날'),
    ]),
    J('swordmaster', '소드마스터', '검 하나로 길을 연 검객', 'crit', '일섬', [
      J('swordsaint', '검성', '검의 이치를 깨우친 자', 'crit', '천검'),
      J('bladedancer', '블레이드댄서', '춤추듯 베는 쌍검사', 'balance', '칼날 무희'),
      J('samurai', '사무라이', '한 칼에 모든 것을 거는 무사', 'atk', '발도'),
      J('spellsword', '스펠소드', '마법을 검에 두른 마검사', 'magic', '마검 해방'),
    ]),
    J('paladin', '팔라딘', '빛으로 동료를 치유하는 성기사', 'support', '성스러운 빛', [
      J('templar', '템플러', '신전을 지키는 기사단장', 'def', '심판의 방패'),
      J('inquisitor', '인퀴지터', '어둠을 심판하는 이단심문관', 'atk', '단죄'),
      J('holyknight', '홀리나이트', '축복받은 백은의 기사', 'balance', '천상의 검'),
      J('saint', '세인트', '기적을 일으키는 성자', 'support', '기적'),
    ]),
  ]),
  J('archer', '궁수', '멀리서 화살로 적을 쏘는 사수', 'crit', '연사', [
    J('ranger', '레인저', '숲을 누비는 순찰자', 'balance', '바람 화살', [
      J('windwalker', '윈드워커', '바람을 타고 쏘는 궁수', 'crit', '질풍 사격'),
      J('beastmaster', '비스트마스터', '늑대와 함께 사냥하는 자', 'hp', '야수의 포효'),
      J('pathfinder', '패스파인더', '길을 여는 개척자', 'balance', '개척의 화살'),
      J('sylvanguard', '실반가드', '숲을 지키는 수호 궁수', 'def', '숲의 가호'),
    ]),
    J('sniper', '스나이퍼', '멀리서 급소를 꿰뚫는 저격수', 'crit', '조준 사격', [
      J('hawkeye', '호크아이', '매의 눈을 가진 명사수', 'crit', '매의 일격'),
      J('shadowsniper', '섀도우스나이퍼', '그림자에 숨은 저격수', 'atk', '그림자 관통'),
      J('deadeye', '데드아이', '한 발도 빗나가지 않는 자', 'crit', '필중'),
      J('stormarrow', '스톰애로우', '번개를 실은 화살', 'magic', '뇌전 화살'),
    ]),
    J('elementalarcher', '정령궁수', '정령의 힘을 화살에 담는 궁수', 'magic', '정령 화살', [
      J('flamearrow', '플레임애로우', '불꽃 화살의 궁수', 'atk', '화염 화살비'),
      J('frostarrow', '프로스트애로우', '얼음 화살의 궁수', 'def', '빙결 화살'),
      J('lightarrow', '라이트애로우', '빛을 쏘아 올리는 궁수', 'support', '빛의 화살비'),
      J('spiritweaver', '스피릿위버', '정령과 하나 된 궁수', 'magic', '정령 강림'),
    ]),
    J('trapper', '트래퍼', '덫과 함정의 사냥꾼', 'atk', '덫 설치', [
      J('hunter', '헌터', '거대 짐승 사냥꾼', 'atk', '사냥 개시'),
      J('venomstalker', '베놈스토커', '독화살을 쏘는 추적자', 'crit', '맹독 화살'),
      J('bountyhunter', '바운티헌터', '현상금을 쫓는 사냥꾼', 'balance', '현상 수배'),
      J('mastertrapper', '마스터트래퍼', '함정의 달인', 'def', '연쇄 함정'),
    ]),
  ]),
  J('gunner', '거너', '총과 화약으로 싸우는 사수', 'atk', '난사', [
    J('gunslinger', '건슬링어', '쌍권총의 명수', 'crit', '퀵 드로우', [
      J('desperado', '데스페라도', '무법의 총잡이', 'atk', '무법 난사'),
      J('trickster', '트릭스터', '곡예 사격의 달인', 'crit', '곡예 사격'),
      J('duelist', '듀얼리스트', '결투의 승부사', 'balance', '결투 사격'),
      J('peacemaker', '피스메이커', '마을을 지키는 보안관', 'support', '정의의 탄환'),
    ]),
    J('cannonshooter', '캐논슈터', '대포를 짊어진 포병', 'atk', '포격', [
      J('artillery', '아틸러리', '하늘을 덮는 포격', 'atk', '집중 포격'),
      J('destroyer', '디스트로이어', '모든 것을 부수는 파괴자', 'hp', '대파괴'),
      J('rocketeer', '로켓티어', '로켓포 사수', 'crit', '로켓 일제사격'),
      J('siegebreaker', '시즈브레이커', '성문을 부수는 공성병', 'def', '공성 포탄'),
    ]),
    J('mechanic', '메카닉', '기계를 다루는 기술자', 'balance', '포탑 설치', [
      J('engineer', '엔지니어', '방어 포탑의 설계자', 'def', '방어 포탑'),
      J('mechapilot', '메카파일럿', '거대 로봇 조종사', 'hp', '로봇 출격'),
      J('dronemaster', '드론마스터', '드론 편대 지휘관', 'crit', '드론 편대'),
      J('cyborg', '사이보그', '기계와 하나 된 전사', 'atk', '오버클럭'),
    ]),
    J('blaster', '블래스터', '화염과 폭발의 사수', 'magic', '화염 방사', [
      J('pyro', '파이로', '불꽃 방사기 사수', 'atk', '지옥불'),
      J('demolisher', '데몰리셔', '폭파 전문가', 'hp', '연쇄 폭발'),
      J('plasmagunner', '플라즈마건너', '플라즈마 총의 사수', 'magic', '플라즈마 캐논'),
      J('grenadier', '그레네이더', '수류탄 투척병', 'balance', '수류탄 세례'),
    ]),
  ]),
  J('mage', '마법사', '지팡이로 원소 마법을 다루는 자', 'magic', '마력탄', [
    J('pyromancer', '화염술사', '불꽃을 다루는 마법사', 'atk', '화염구', [
      J('inferno', '인페르노', '지옥불의 대마법사', 'atk', '업화'),
      J('phoenixcaller', '피닉스콜러', '불사조를 부르는 자', 'hp', '불사조 소환'),
      J('meteormaster', '메테오마스터', '운석을 떨어뜨리는 자', 'magic', '메테오'),
      J('lavalord', '라바로드', '용암의 군주', 'def', '용암 분출'),
    ]),
    J('cryomancer', '빙결술사', '얼음을 다루는 마법사', 'def', '얼음 화살', [
      J('blizzardmage', '블리자드메이지', '눈보라를 부르는 마법사', 'magic', '블리자드'),
      J('icelord', '아이스로드', '얼음 성채의 군주', 'def', '빙벽'),
      J('frostwitch', '프로스트위치', '서리의 마녀', 'crit', '서리 저주'),
      J('glacier', '글래시어', '빙하처럼 단단한 마법사', 'hp', '빙하 충돌'),
    ]),
    J('electromancer', '뇌전술사', '번개를 부르는 마법사', 'crit', '체인 라이트닝', [
      J('thunderlord', '썬더로드', '천둥의 군주', 'atk', '천벌'),
      J('tempest', '템페스트', '폭풍 그 자체가 된 자', 'magic', '대폭풍'),
      J('sparkwizard', '스파크위저드', '불꽃 튀는 번개 마법사', 'crit', '스파크 폭발'),
      J('skywarden', '스카이워든', '하늘을 지키는 수호자', 'support', '하늘의 심판'),
    ]),
    J('necromancer', '사령술사', '망자를 부리는 마법사', 'hp', '해골 소환', [
      J('lich', '리치', '죽음을 초월한 대마법사', 'magic', '죽음의 손길'),
      J('bonelord', '본로드', '해골 군단의 군주', 'def', '뼈 감옥'),
      J('soulreaper', '소울리퍼', '영혼을 거두는 자', 'crit', '영혼 수확'),
      J('hexcaster', '헥스캐스터', '저주의 대가', 'balance', '대저주'),
    ]),
  ]),
];

/** 1차 직업(계열) 정보 */
export const CLASS_INFO = {
  warrior: { weapon: 'sword', gem: 'ruby', color: '#ff6b6b' },
  archer: { weapon: 'bow', gem: 'emerald', color: '#4cd98a' },
  gunner: { weapon: 'gun', gem: 'amber', color: '#ff9f43' },
  mage: { weapon: 'staff', gem: 'amethyst', color: '#b46cff' },
};

/** id → 직업 (tier, parent, classId, bonus, skill{name, mult}, children) */
export const JOBS = {};
(function build(nodes, tier, parent, classId) {
  for (const n of nodes) {
    const cls = classId || n.id;
    const scale = TIER_SCALE[tier - 1];
    const f = FOCUS[n.focus];
    JOBS[n.id] = {
      id: n.id,
      name: n.name,
      desc: n.desc,
      focus: n.focus,
      tier,
      parent,
      classId: cls,
      weapon: CLASS_INFO[cls].weapon,
      gem: CLASS_INFO[cls].gem,
      color: CLASS_INFO[cls].color,
      bonus: { atk: f.atk * scale, def: f.def * scale, hp: f.hp * scale, luck: f.luck * scale },
      skill: { name: n.skill, mult: SKILL_MULTS[tier] },
      children: n.children.map((c) => c.id),
    };
    build(n.children, tier + 1, n.id, cls);
  }
}(JOB_TREE, 1, null, null));

export const CLASS_IDS = JOB_TREE.map((n) => n.id);

/** 현재 직업 (없으면 null = 초보자) */
export function currentJob(path) {
  return path && path.length ? JOBS[path[path.length - 1]] || null : null;
}

/** 전직 경로의 능력치 보너스 합 */
export function jobBonus(path) {
  const out = { atk: 0, def: 0, hp: 0, luck: 0 };
  for (const id of path || []) {
    const j = JOBS[id];
    if (!j) continue;
    for (const k of Object.keys(out)) out[k] += j.bonus[k];
  }
  return out;
}

/** 지금 쓸 필살기 */
export function jobSkill(path) {
  const j = currentJob(path);
  return j ? j.skill : { name: '필살기', mult: SKILL_MULTS[0] };
}

/** 다음 전직 후보 */
export function nextJobs(path) {
  const j = currentJob(path);
  if (!j) return CLASS_IDS.map((id) => JOBS[id]);
  return j.children.map((id) => JOBS[id]);
}

/** 이 경로의 계열(1차 직업) 무기 — 초보자는 null(아무 무기나) */
export function classWeapon(path) {
  const j = currentJob(path);
  return j ? j.weapon : null;
}

/** 전직 비용: { gold, gems: { color: n } } */
export function jobCost(job) {
  const c = JOB_COSTS[job.tier - 1];
  const gems = {};
  if (c.classGem) gems[job.gem] = c.classGem;
  if (c.otherGems) for (const g of GEM_ORDER) if (g !== job.gem) gems[g] = c.otherGems;
  return { gold: c.gold, gems };
}

/** 전직 경로 이름 (예: 전사 › 나이트 › 가디언) */
export function jobPathName(path) {
  return (path || []).map((id) => (JOBS[id] ? JOBS[id].name : '')).filter(Boolean).join(' › ') || '초보자';
}

/** 가상 플레이어 직업: 레벨에 맞는 차수까지, id 로 정한 갈래를 따라간다 */
export function botJobPath(seedNumber, level) {
  const tier = level >= JOB_LEVELS[2] ? 3 : level >= JOB_LEVELS[1] ? 2 : level >= JOB_LEVELS[0] ? 1 : 0;
  const path = [];
  let options = CLASS_IDS;
  let n = seedNumber >>> 0;
  for (let t = 0; t < tier; t++) {
    const id = options[n % options.length];
    path.push(id);
    n = Math.floor(n / options.length) + 7 * (t + 1);
    options = JOBS[id].children;
  }
  return path;
}
