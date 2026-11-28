// 가상 세계: 계정 서버가 생기기 전까지 '다른 플레이어'(랭킹·필드 보스 참가자·파티원·길드원·채팅 상대)를 흉내 낸다.
// 고정 시드라 모든 기기에서 같은 플레이어·같은 랭킹이 나온다. 서버가 생기면 이 모듈 자리를 서버 응답으로 바꾼다.

import { createRng, hashString } from './rng.js';
import { diffDays } from './dates.js';
import { SLOT_ORDER } from './constants.js';
import { JOBS, botJobPath } from './jobs.js';

export const WORLD_SEED = 'calendar-rpg-world-1';
/** 가상 플레이어 전투력이 자라기 시작한 날 */
export const WORLD_EPOCH = '2026-11-01';
const PLAYER_COUNT = 300;

export const GUILDS = [
  { id: 'gd_dawn',  name: '새벽기사단',   motto: '아침 6시 기상 인증하는 길드',   color: '#4aa8ff' },
  { id: 'gd_bread', name: '빵집탐방대',   motto: '주말마다 빵집 지도를 채워요',   color: '#ff9f43' },
  { id: 'gd_study', name: '공부의신',     motto: '오늘도 순공 3시간',             color: '#4cd98a' },
  { id: 'gd_clock', name: '칼퇴연구소',   motto: '업무는 빠르게, 사냥은 길게',     color: '#b46cff' },
  { id: 'gd_slime', name: '슬라임사냥꾼', motto: '필드 보스 매일 출석',           color: '#ff4d6d' },
];

const ADJ = ['새벽', '달빛', '졸린', '성실한', '빵굽는', '야근하는', '공부하는', '용감한', '느긋한', '반짝', '푸른', '붉은', '황금', '은빛',
  '고독한', '행복한', '출근하는', '퇴근한', '배고픈', '작은', '전설의', '조용한', '수줍은', '부지런한', '커피마시는', '산책하는', '노래하는',
  '꿈꾸는', '바람의', '별빛'];
const NOUN = ['검객', '기사', '토끼', '용사', '마법사', '궁수', '고양이', '곰', '여우', '탐험가', '학생', '직장인', '요리사', '슬라임', '드래곤',
  '펭귄', '다람쥐', '음유시인', '수호자', '방랑자', '도적', '사제', '해적', '부엉이', '고래'];

let cache = null;

function rarityFor(rng, cp) {
  // 전투력이 높을수록 좋은 장비를 두르고 있다 (그림용)
  const w = cp > 5000 ? { epic: 30, legendary: 70 }
    : cp > 2500 ? { rare: 15, epic: 50, legendary: 35 }
      : cp > 1000 ? { common: 10, rare: 45, epic: 38, legendary: 7 }
        : cp > 400 ? { common: 45, rare: 45, epic: 10 }
          : { common: 80, rare: 20 };
  return rng.weighted(w);
}

/** 가상 플레이어 목록 (한 번 만들어 재사용) */
export function worldPlayers() {
  if (cache) return cache;
  const rng = createRng(WORLD_SEED);
  const used = new Set();
  const out = [];
  for (let i = 0; i < PLAYER_COUNT; i++) {
    let name;
    do {
      name = rng.pick(ADJ) + rng.pick(NOUN) + (rng.chance(0.15) ? String(rng.int(1, 99)) : '');
    } while (used.has(name));
    used.add(name);
    // 막 시작한 초보 8% + 대부분 300~3000, 소수의 상위권 (로그 정규 분포 비슷하게)
    const z = (rng.next() + rng.next() + rng.next() - 1.5) / 0.5;
    const cp0 = rng.chance(0.08) ? rng.int(60, 250) : Math.max(150, Math.round(Math.exp(Math.log(1100) + z * 0.75)));
    const gear = {};
    for (const slot of SLOT_ORDER) gear[slot] = rng.chance(slot === 'weapon' ? 1 : 0.85) ? rarityFor(rng, cp0) : null;
    out.push({
      id: `w${String(i + 1).padStart(3, '0')}`,
      name,
      cp0,
      growth: 0.002 + rng.next() * 0.004,
      gear,
      guild: rng.chance(0.45) ? GUILDS[rng.int(0, GUILDS.length - 1)].id : null,
    });
  }
  cache = out;
  return out;
}

export function findPlayer(id) {
  return worldPlayers().find((p) => p.id === id) || null;
}

export function guildById(id) {
  return GUILDS.find((g) => g.id === id) || null;
}

export const levelFromPower = (cp) => Math.max(1, Math.min(99, Math.round(2 + cp / 115)));

/** 그 날의 모습 (전투력은 하루 0.2~0.6%씩 자란다). 직업은 레벨에 맞는 차수까지 */
export function playerView(p, day) {
  const days = Math.max(0, diffDays(WORLD_EPOCH, day));
  const cp = Math.round(p.cp0 * (1 + p.growth) ** days);
  const level = levelFromPower(cp);
  const jobPath = botJobPath(hashString(p.id), level);
  const job = jobPath.length ? jobPath[jobPath.length - 1] : null;
  const weaponType = jobPath.length ? JOBS[jobPath[0]].weapon : 'sword';
  return { id: p.id, name: p.name, cp, level, gear: { ...p.gear, weaponType }, guild: p.guild, job, jobPath };
}

export function playersById(ids, day) {
  return ids.map(findPlayer).filter(Boolean).map((p) => playerView(p, day));
}

export function guildMembers(guildId, day) {
  return worldPlayers().filter((p) => p.guild === guildId).map((p) => playerView(p, day)).sort((a, b) => b.cp - a.cp);
}

/**
 * 전투력 랭킹. me = { name, cp, level, gear, guild }
 * @returns {{ total, top: Array, me: { rank, ... }, podium: Array }}
 */
export function powerRanking(me, day, { limit = 50 } = {}) {
  const all = worldPlayers().map((p) => playerView(p, day));
  all.push({ ...me, id: 'me', isMe: true });
  all.sort((a, b) => b.cp - a.cp || (a.isMe ? -1 : b.isMe ? 1 : a.name.localeCompare(b.name)));
  all.forEach((p, i) => { p.rank = i + 1; });
  const mine = all.find((p) => p.isMe);
  return { total: all.length, top: all.slice(0, limit), podium: all.slice(0, 3), me: mine };
}

/** 지금 접속 중인 플레이어(파티 초대 목록). 내 전투력 근처가 먼저, 시간대마다 바뀐다 */
export function onlinePlayers(myCp, day, slot, { count = 12, exclude = [] } = {}) {
  const rng = createRng(`${WORLD_SEED}|online|${day}|${slot}`);
  const skip = new Set(exclude);
  return worldPlayers()
    .filter((p) => !skip.has(p.id))
    .map((p) => playerView(p, day))
    .map((p) => ({ p, key: Math.abs(Math.log(p.cp / Math.max(50, myCp))) + rng.next() * 0.9 }))
    .sort((a, b) => a.key - b.key)
    .slice(0, count)
    .map((x) => x.p);
}

/* ── 채팅 문장 ─────────────────────────────── */

const FIELD_LINES = [
  '오늘 필드 보스 9시 맞죠?', '공부 1시간 끝! 슬라임 잡으러 왔어요', '전설 무기 떴다!!!', '야근 끝나고 사냥 중이에요 ㅠㅠ',
  '파티 구해요 (전투력 {cp})', '여기 슬라임 많네요', '점심 뭐 먹지...', '오늘 퍼펙트 데이 달성!', '요일 던전 몇 분 남으셨어요?',
  '레이드 {tier}단계 같이 가실 분~', '와 방금 치명타 터졌어요', '운동 인증하고 왔습니다', '주말에 빵집 탐방 가요',
  '물약 너무 비싸요 ㅋㅋ', '안녕하세요~ 처음 왔어요', '오늘 할 일 다 끝냈다!', '슬라임 왕 나왔어요!!', '보석 모으는 중이에요',
  '내일 시험인데 사냥 중...', '일요일 무지개 보물고 최고', '오늘도 칼퇴 성공', '스트레칭 하고 왔어요', '레벨 {lv} 찍었어요!',
];
const GUILD_LINES = [
  '길드 출석 체크!', '오늘 레이드 몇 시에 가요?', '필드 보스 다 같이 가요!', '빵집 추천 받아요', '이번 주 길드 목표: 퍼펙트 데이 3번',
  '공부 인증: 2시간 완료', '다들 오늘 일정 다 체크하셨나요?', '레이드 장비 먹었어요!', '칼퇴 성공!', '내일 아침 회의 잊지 마세요',
  '신입 길드원 환영해요!', '전투력 {cp} 돌파!', '오늘 요일 던전 보석 몇 개 나왔어요?',
];
const PARTY_LINES = [
  '준비됐어요!', 'ㄱㄱ', '보스 체력 얼마 안 남았어요!', '버프 걸게요', '잠깐 물 좀 마시고 올게요', '오늘 파티 최고다',
  '다음 단계도 가볼까요?', '필살기 쿨 돌았어요', '9시 필드 보스 같이 가요',
];
const REPLIES = ['ㅋㅋㅋ', '좋아요!', '반가워요~', '오 대박', '화이팅!', '저도요!', 'ㅇㅈ', '같이 가요!', '굿굿', '수고하셨어요', '헉 축하해요'];
const NEWS = [
  '{name}님이 전설 장비를 획득했습니다!', '{name}님이 레이드 {tier}단계를 토벌했습니다!', '{name}님이 레벨 {lv}을(를) 달성했습니다!',
  '{guild} 길드가 오늘도 출석 100%를 달성했습니다!',
];

const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));

/**
 * 가상 플레이어 한 줄. channel: 'field' | 'guild' | 'party' | 'system'
 * speakers: 말할 수 있는 플레이어(뷰) 목록. reply=true 면 짧은 대답
 */
export function chatLine(rng, channel, speakers, { reply = false } = {}) {
  if (!speakers.length) return null;
  const who = rng.pick(speakers);
  const vars = { cp: who.cp, lv: who.level, tier: Math.max(1, Math.min(10, Math.ceil(who.cp / 600))), name: who.name };
  if (channel === 'system') {
    const g = guildById(who.guild);
    vars.guild = g ? g.name : GUILDS[0].name;
    return { from: null, text: fill(rng.pick(NEWS), vars) };
  }
  const pool = reply ? REPLIES : channel === 'guild' ? GUILD_LINES : channel === 'party' ? PARTY_LINES : FIELD_LINES;
  return { from: who, text: fill(rng.pick(pool), vars) };
}
