// 던전 탭: 필드 보스(매일 21시) · 요일 던전(하루 1시간) · 레이드(입장권), 파티 · 길드 · 보석 지갑
import {
  GEMS, GEM_ORDER, FIELD_BOSS, FIELD_BOSS_REWARDS, RAID, DAY_DUNGEON, DAY_DUNGEONS, RARITIES, SLOT_ORDER, WEEKDAYS_KO,
} from '../../../core/constants.js';
import { combatPower, powerBand, bandProgress, heroStats } from '../../../core/progression.js';
import {
  fieldBossWindow, fieldBossRoom, damageSeries, dpsOf, TAP_MULT, SKILL_MULT, raidBoss, simulateRaid,
  simulateFieldBoss, dayDungeonFor, gemRate,
} from '../../../core/adventure.js';
import { playersById, onlinePlayers, guildMembers, guildById, GUILDS } from '../../../core/world.js';
import { fieldBossRoomFor } from '../../../core/engine.js';
import { uiIcon, gemIcon, heroImg, raidChestIcon, itemIcon } from '../../shared/sprite-canvas.js';
import { esc, toast, openModal, confirmDialog } from '../ui.js';
import { sfx } from '../../shared/sfx.js';
import { BossScene, HuntScene } from '../scenes.js';

const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
const pad = (n) => String(n).padStart(2, '0');
const clock = (sec) => `${Math.floor(Math.max(0, sec) / 60)}:${pad(Math.floor(Math.max(0, sec) % 60))}`;
function long(sec) {
  const m = Math.ceil(Math.max(0, sec) / 60);
  const h = Math.floor(m / 60);
  return h ? `${h}시간 ${m % 60}분` : `${m}분`;
}

function myGear(state) {
  const g = heroStats(state).gear;
  const out = {};
  for (const slot of SLOT_ORDER) out[slot] = g[slot] ? g[slot].rarity : null;
  return out;
}

const gemList = (gems) => GEM_ORDER.filter((k) => gems[k]).map((k) => `<span class="gem-chip">${gemIcon(k, 1)}${GEMS[k].label} +${gems[k]}</span>`).join('');

/** 현재 실행 중인 전투(캔버스·타이머). 다시 그릴 때 정리한다 */
let live = null;
let hubTimer = null;
/** 같은 전투를 두 번 정산하지 않도록 */
const settling = new Set();
function settleOnce(key, fn) {
  if (settling.has(key)) return;
  settling.add(key);
  fn().finally(() => setTimeout(() => settling.delete(key), 5000));
}
function stopLive() {
  if (live) live.stop();
  live = null;
  clearInterval(hubTimer);
  hubTimer = null;
}

function ui(ctx) {
  if (!ctx.ui.dg) ctx.ui.dg = { mode: null, tier: null, practiceStart: 0, inputs: {} };
  return ctx.ui.dg;
}

function inputFor(ctx, key) {
  const d = ui(ctx);
  if (!d.inputs[key]) d.inputs = { [key]: { taps: 0, skills: 0, lastSkill: 0, tapTimes: [] } };
  return d.inputs[key];
}

/* ── 허브 ─────────────────────────────── */

function fieldBossStatus(ctx, now = Date.now()) {
  const s = ctx.state;
  const w = fieldBossWindow(now);
  const fb = s.fieldBoss;
  const entered = fb.enteredAt && fb.day === w.day;
  if (fb.enteredAt && !fb.result) return { key: 'fighting', text: `전투 중 · ${clock((w.closeAt - now) / 1000)} 남음 (자동으로 싸우는 중)`, btn: '전투 보기', act: 'fb-view', hot: true };
  if (entered && fb.result) return { key: 'done', text: `오늘 결과: <b>${fb.result.rank}위</b> · ${fb.result.reward.label} 보상 받음`, btn: '결과', act: 'fb-result' };
  if (w.phase === 'before') return { key: 'before', text: `오늘 오후 9시 오픈 · ${long((w.openAt - now) / 1000)} 남음`, btn: '입장', act: 'fb-enter', disabled: true };
  if (w.phase === 'open') return { key: 'open', text: `<b class="hot">지금 출현!</b> ${clock((w.closeAt - now) / 1000)} 남음`, btn: '입장', act: 'fb-enter', hot: true };
  return { key: 'closed', text: '오늘은 끝났어요 · 내일 오후 9시', btn: '입장', act: 'fb-enter', disabled: true };
}

function dayStatus(ctx, now = Date.now()) {
  const d = ctx.state.dungeon;
  const elapsed = d.activeSince ? Math.max(0, (now - d.activeSince) / 1000) : 0;
  const left = Math.max(0, DAY_DUNGEON.dailySec - d.usedSec - elapsed);
  return { active: Boolean(d.activeSince), left, used: DAY_DUNGEON.dailySec - left };
}

function raidPreview(ctx, tier) {
  const s = ctx.state;
  const boss = raidBoss(tier);
  const members = [{ id: 'me', name: '나', cp: combatPower(s), isMe: true }, ...playersById(s.social.party, ctx.today)];
  const idle = simulateRaid(boss, members, { seed: 'preview' });
  if (idle.win) return { cls: 'ok', text: `예상: 자동 공격만으로 약 ${idle.sec}초에 토벌` };
  const max = simulateRaid(boss, members, { seed: 'preview', taps: RAID.tapsPerSecMax * RAID.durationSec, skills: 5 });
  if (max.win) return { cls: 'warn', text: '예상: 화면을 열심히 눌러야 토벌 가능' };
  return { cls: 'bad', text: '예상: 실패 — 파티원을 모으거나 전투력을 올리세요' };
}

function hub(ctx) {
  const s = ctx.state;
  const d = ui(ctx);
  const cp = combatPower(s);
  const prog = bandProgress(cp);
  const band = prog.band;
  if (!d.tier || d.tier > band) d.tier = band;
  const party = playersById(s.social.party, ctx.today);
  const guild = guildById(s.social.guild);
  const fb = fieldBossStatus(ctx);
  const day = dayStatus(ctx);
  const dg = dayDungeonFor(s.dungeon.day);
  const rate = gemRate(band);
  const boss = raidBoss(d.tier);
  const preview = raidPreview(ctx, d.tier);
  const partyCp = cp + party.reduce((a, p) => a + p.cp, 0);

  const slots = [];
  slots.push(`<div class="pm me">${heroImg(myGear(s), 2)}<div class="nm">${esc(s.profile.name)}</div><div class="cp">${fmt(cp)}</div></div>`);
  for (const p of party) {
    slots.push(`<div class="pm">${heroImg(p.gear, 2)}<div class="nm">${esc(p.name)}</div><div class="cp">${fmt(p.cp)}</div>
      <button class="pm-x" data-act="party-kick" data-id="${p.id}" title="내보내기">×</button></div>`);
  }
  for (let i = party.length; i < RAID.partyMax - 1; i++) slots.push(`<button class="pm empty" data-act="party-invite">${uiIcon('plus', 2)}<span>초대</span></button>`);

  const tiers = Array.from({ length: 10 }, (_, i) => i + 1).map((t) => `
    <button class="tier ${t === d.tier ? 'on' : ''}" data-act="raid-tier" data-tier="${t}" ${t > band ? 'disabled' : ''}>${t > band ? uiIcon('lock', 1) : t}</button>`).join('');

  return `
    <div class="dg-power progress-card">
      <div class="row">
        <div class="cp-label">${uiIcon('sword', 2)} 전투력</div>
        <div class="cp-value">${fmt(cp)}</div>
        <div class="band-badge">${band}단계</div>
      </div>
      <div class="band-bar"><i style="width:${(prog.ratio * 100).toFixed(1)}%"></i></div>
      <div class="sub">${prog.next ? `${band + 1}단계까지 ${fmt(prog.next - cp)} · 레벨과 장비로 올라가요` : '최고 단계예요!'}</div>
      <div class="gem-row">${GEM_ORDER.map((k) => `<span class="gem" title="${GEMS[k].label}">${gemIcon(k, 2)}<b>${fmt(s.gems[k] || 0)}</b></span>`).join('')}</div>
    </div>

    <div class="section-title">${uiIcon('party', 1)} 파티 <span class="muted">${party.length + 1}/${RAID.partyMax} · 합계 전투력 ${fmt(partyCp)}</span>
      ${party.length ? '<button class="btn ghost small push" data-act="party-disband">해산</button>' : ''}</div>
    <div class="party-row">${slots.join('')}</div>
    <div class="guild-row">${uiIcon('crown', 1)} 길드: ${guild ? `<b style="color:${guild.color}">${esc(guild.name)}</b>` : '<span class="muted">없음</span>'}
      <button class="btn ghost small push" data-act="guild-open">${guild ? '길드 정보' : '길드 찾기'}</button></div>

    <div class="section-title">${uiIcon('dungeon', 1)} 던전</div>

    <div class="dg-card fb ${fb.hot ? 'hot' : ''}">
      <div class="dg-head"><span class="dg-name">필드 보스</span><span class="dg-tag">매일 오후 9시 · 5분 · 20명</span></div>
      <div class="dg-desc">${esc(FIELD_BOSS.name)}를 함께 공격하고, 딜 누적 순위대로 보상을 받아요. 파티는 4명까지 함께 입장.</div>
      <div class="dg-status" data-fb-status>${fb.text}</div>
      <div class="dg-btns">
        <button class="btn ${fb.hot ? 'primary' : ''}" data-act="${fb.act}" ${fb.disabled ? 'disabled' : ''} data-fb-btn>${fb.btn}</button>
        <button class="btn ghost small" data-act="fb-practice">연습하기</button>
        <button class="btn ghost small" data-act="fb-rewards">순위 보상</button>
      </div>
    </div>

    <div class="dg-card day">
      <div class="dg-head"><span class="dg-name">요일 던전 · ${esc(dg.name)}</span><span class="dg-tag">하루 1시간</span></div>
      <div class="dg-desc">${dg.gems.length > 1 ? '일요일은 6가지 보석이 모두 나와요!' : `오늘은 ${GEMS[dg.gems[0]].label}가 나와요.`} 들어가 있는 동안 용사가 자동으로 사냥해요 (1분에 보석 ${rate.toFixed(1)}개).</div>
      <div class="dg-gems">${dg.gems.map((k) => gemIcon(k, 2)).join('')}</div>
      <div class="time-bar"><i style="width:${((day.used / DAY_DUNGEON.dailySec) * 100).toFixed(1)}%"></i></div>
      <div class="dg-status" data-day-status>${day.active ? `<b class="hot">사냥 중</b> · 남은 시간 ${clock(day.left)}` : day.left > 0 ? `오늘 남은 시간 ${clock(day.left)}` : '오늘 시간을 모두 썼어요 · 내일 다시 열려요'}</div>
      <div class="dg-btns">
        ${day.active ? '<button class="btn primary" data-act="day-view">사냥 보기</button>' : `<button class="btn primary" data-act="day-enter" ${day.left <= 0 ? 'disabled' : ''}>입장</button>`}
        <span class="dg-week">${WEEKDAYS_KO.map((w, i) => `<i class="${DAY_DUNGEONS[i].key === dg.key ? 'on' : ''}" title="${esc(DAY_DUNGEONS[i].name)}">${w}</i>`).join('')}</span>
      </div>
    </div>

    <div class="dg-card raid">
      <div class="dg-head"><span class="dg-name">레이드</span><span class="dg-tag">${uiIcon('ticket', 1)} 입장권 <b>${s.raid.tickets}</b>/${RAID.ticketMax} · 매일 +1</span></div>
      <div class="dg-desc">파티로 레이드 보스를 토벌하면 레이드 보물상자(레이드 전용 장비·골드·보석)를 받아요. 성공할 때만 입장권을 써요.</div>
      <div class="tiers">${tiers}</div>
      <div class="raid-boss"><b>${d.tier}단계 · ${esc(boss.name)}</b><span class="muted">권장 전투력 ${fmt(boss.recommended)} (4인 합계)</span></div>
      <div class="dg-status ${preview.cls}">${preview.text}</div>
      <div class="dg-btns">
        ${s.raid.session ? '<button class="btn primary" data-act="raid-view">전투 보기</button>' : `<button class="btn primary" data-act="raid-start" ${s.raid.tickets < 1 ? 'disabled' : ''}>토벌 시작</button>`}
        <span class="muted small">최고 기록 ${s.stats.raidBest ? `${s.stats.raidBest}단계` : '-'} · 토벌 ${s.raid.clears}회</span>
      </div>
    </div>`;
}

/* ── 전투 화면 공통 ─────────────────────────────── */

function battleShell({ title, timerId, sub = '', board = true, skill = true, back = '← 던전', giveUp = false }) {
  return `
    <div class="dg-battle">
      <div class="dg-bar">
        <button class="btn ghost small" data-act="dg-back">${back}</button>
        <b class="title">${title}</b>
        <span class="timer" id="${timerId}">-:--</span>
      </div>
      <div class="boss-hp"><span class="nm" id="dg-boss-name"></span><div class="bar"><i id="dg-hp"></i></div><span class="pct" id="dg-hp-pct"></span></div>
      <div class="dg-stage"><canvas id="dg-canvas"></canvas><div class="tap-hint">화면을 누르면 공격!</div></div>
      <div class="dg-me">
        <div class="mine">내 피해 <b id="dg-mydmg">0</b>${sub}</div>
        ${giveUp ? '<button class="btn ghost small" data-act="raid-giveup">포기</button>' : ''}
        ${skill ? '<button class="btn gold" data-act="dg-skill" id="dg-skill">필살기</button>' : ''}
      </div>
      ${board ? '<ol class="dg-board" id="dg-board"></ol>' : ''}
    </div>`;
}

/** 초당 피해 누적합 */
function prefixOf(arr) {
  const p = new Array(arr.length + 1);
  p[0] = 0;
  for (let i = 0; i < arr.length; i++) p[i + 1] = p[i] + arr[i];
  return p;
}

/**
 * 보스전 실시간 진행 (필드 보스·레이드 공통)
 * members: [{ id, name, cp, gear, isMe, party }], seriesSeed, fromSec(내가 들어온 초), T, startAt(전투 0초 시각)
 */
function runBossFight(el, ctx, { key, members, seriesSeed, fromSec, T, startAt, hp, boss, theme, rules, onEnd, rankLabel }) {
  const inp = inputFor(ctx, key);
  const series = members.map((m) => damageSeries(`${seriesSeed}|${m.id}`, m.cp, T, m.isMe ? fromSec : 0));
  const prefix = series.map(prefixOf);
  const meIdx = members.findIndex((m) => m.isMe);
  const myDps = dpsOf(members[meIdx].cp);
  const tapDmg = myDps * TAP_MULT;
  const skillDmg = myDps * SKILL_MULT;
  const dmgAt = (i, t) => {
    const k = Math.max(0, Math.min(T, Math.floor(t)));
    let v = prefix[i][k] + (k < T ? series[i][k] * Math.max(0, Math.min(1, t - k)) : 0);
    if (i === meIdx) v += inp.taps * tapDmg + inp.skills * skillDmg;
    return v;
  };
  const canvas = el.querySelector('#dg-canvas');
  let ended = false;
  const nowSec = () => (Date.now() - startAt) / 1000;
  const tap = () => {
    const t = nowSec();
    if (ended || t < fromSec || t >= T) return;
    const now = Date.now();
    inp.tapTimes = inp.tapTimes.filter((x) => now - x < 1000);
    if (inp.tapTimes.length >= rules.tapsPerSecMax) return;
    inp.tapTimes.push(now);
    inp.taps += 1;
    scene.hit(tapDmg, { mine: true });
    sfx('hit');
  };
  const scene = new BossScene(canvas, {
    boss,
    theme,
    allies: members.map((m) => ({ id: m.id, gear: m.gear || {}, isMe: m.isMe, front: Boolean(m.party || m.isMe) })),
    onTap: tap,
  });
  scene.start();
  const skillBtn = el.querySelector('#dg-skill');
  const skill = () => {
    const t = nowSec();
    if (ended || t < fromSec || t >= T) return;
    if (Date.now() - inp.lastSkill < rules.skillCooldownSec * 1000) return;
    inp.lastSkill = Date.now();
    inp.skills += 1;
    scene.hit(skillDmg, { mine: true, big: true });
    sfx('levelup');
  };
  if (skillBtn) skillBtn.addEventListener('click', skill);
  el.querySelector('#dg-boss-name').textContent = boss.name;
  let lastSec = -1;
  const tick = () => {
    const t = nowSec();
    const tt = Math.max(0, Math.min(T, t));
    let total = 0;
    const dmg = members.map((m, i) => {
      const v = dmgAt(i, tt);
      total += v;
      return v;
    });
    const left = Math.max(0, hp - total);
    const pct = (left / hp) * 100;
    el.querySelector('#dg-hp').style.width = `${pct.toFixed(2)}%`;
    el.querySelector('#dg-hp-pct').textContent = `${pct.toFixed(1)}%`;
    el.querySelector(`#${rules.timerId}`).textContent = clock(T - tt);
    const order = members.map((m, i) => ({ m, d: dmg[i] })).sort((a, b) => b.d - a.d);
    const myRank = order.findIndex((x) => x.m.isMe) + 1;
    el.querySelector('#dg-mydmg').textContent = fmt(dmg[meIdx]);
    const rankEl = el.querySelector('#dg-myrank');
    if (rankEl) rankEl.textContent = myRank;
    if (skillBtn) {
      const cd = Math.max(0, rules.skillCooldownSec - (Date.now() - inp.lastSkill) / 1000);
      skillBtn.disabled = cd > 0 || t < fromSec || ended;
      skillBtn.textContent = cd > 0 ? `필살기 ${Math.ceil(cd)}` : '필살기';
    }
    const board = el.querySelector('#dg-board');
    if (board) {
      const rows = order.slice(0, 5);
      if (!rows.some((x) => x.m.isMe)) rows.push(order[myRank - 1]);
      board.innerHTML = rows.map((x) => {
        const r = order.indexOf(x) + 1;
        return `<li class="${x.m.isMe ? 'me' : ''} ${x.m.party && !x.m.isMe ? 'party' : ''}"><span class="r">${r}</span><span class="n">${esc(x.m.isMe ? `${x.m.name} (나)` : x.m.name)}</span><span class="d">${fmt(x.d)}</span><span class="p">${((x.d / hp) * 100).toFixed(1)}%</span></li>`;
      }).join('');
    }
    // 1초마다 다른 용사들의 피해 숫자
    const sec = Math.floor(tt);
    if (sec !== lastSec && sec < T && !ended) {
      lastSec = sec;
      const hits = members.map((m, i) => ({ i, d: series[i][sec] })).filter((x) => x.d > 0).sort((a, b) => b.d - a.d).slice(0, 2);
      for (const h of hits) scene.hit(h.d, { mine: h.i === meIdx });
    }
    if (!ended && (left <= 0 || t >= T)) {
      ended = true;
      if (left <= 0) scene.defeat();
      onEnd({ killed: left <= 0, inp, t: tt, myRank, rankLabel });
    }
  };
  const timer = setInterval(tick, 200);
  tick();
  live = { key, stop() { clearInterval(timer); scene.stop(); } };
}

/* ── 필드 보스 ─────────────────────────────── */

const FB_THEME = { sky: ['#1b1433', '#3d2a5c'], ground: '#4a3b6b' };

function fieldBossBattle(el, ctx, practice) {
  const s = ctx.state;
  const d = ui(ctx);
  let room;
  let startAt;
  let fromSec;
  let key;
  if (practice) {
    const st = heroStats(s);
    room = fieldBossRoom({
      day: ctx.today,
      me: { name: s.profile.name, cp: combatPower(s), level: st.level, gear: myGear(s) },
      party: playersById(s.social.party, ctx.today),
      practice: true,
    });
    startAt = d.practiceStart;
    fromSec = 0;
    key = `fbp:${startAt}`;
  } else {
    room = fieldBossRoomFor(s);
    room.members[0].gear = myGear(s);
    startAt = fieldBossWindow(s.fieldBoss.enteredAt).openAt;
    fromSec = s.fieldBoss.enteredSec;
    key = `fb:${s.fieldBoss.enteredAt}`;
  }
  runBossFight(el, ctx, {
    key,
    members: room.members,
    seriesSeed: room.seed,
    fromSec,
    T: room.durationSec,
    startAt,
    hp: room.hp,
    boss: { name: FIELD_BOSS.name, color: 'gold', crown: true, horns: false },
    theme: FB_THEME,
    rules: { ...FIELD_BOSS, timerId: 'dg-timer' },
    onEnd: ({ inp, t }) => {
      setTimeout(async () => {
        stopLive();
        d.mode = null;
        if (practice) {
          const sim = simulateFieldBoss(room, { enteredSec: 0, reportSec: t, taps: inp.taps, skills: inp.skills });
          showFieldBossResult(ctx, { ...sim.me, rank: sim.me.rank, damage: sim.me.damage, total: sim.total, killed: sim.killed, endSec: sim.endSec, hp: sim.hp, top: sim.ranking.slice(0, 5) }, true);
          ctx.rerender(true);
          return;
        }
        settleOnce(key, async () => {
          const res = await ctx.act('fieldBoss/finish', { taps: inp.taps, skills: inp.skills });
          const ev = res.ok && res.events.find((e) => e.type === 'fieldBossResult');
          ctx.rerender(true);
          if (ev) showFieldBossResult(ctx, ev, false);
        });
      }, 1400);
    },
  });
}

function showFieldBossResult(ctx, r, practice) {
  const reward = r.reward;
  const item = r.item || (reward && reward.itemId ? ctx.state.inventory.find((it) => it.id === reward.itemId) : null);
  const top = (r.top || []).map((m, i) => `<li class="${m.isMe ? 'me' : ''}"><span class="r">${i + 1}</span><span class="n">${esc(m.isMe ? `${m.name} (나)` : m.name)}</span><span class="d">${fmt(m.damage)}</span></li>`).join('');
  const rewards = practice ? '<div class="muted">연습이라 보상은 없어요. 오후 9시에 진짜 보스가 나타나요!</div>' : `
    <div class="reward-list">
      <div>${uiIcon('coin', 2)} 골드 <b>+${fmt(reward.gold)}</b></div>
      <div class="gems">${gemList(reward.gems)}</div>
      ${item ? `<div class="t-${item.rarity}">${itemIcon(item, 2)} ${esc(item.name)} (${RARITIES[item.rarity].label})</div>` : ''}
    </div>`;
  openModal(`
    <div class="dg-result">
      <div class="muted">${practice ? '필드 보스 연습 결과' : `필드 보스 결과 · ${esc(reward.label)} 보상`}</div>
      <div class="rank-big">${r.rank}<small>위 / ${FIELD_BOSS.mapSize}명</small></div>
      <div class="muted">내 피해 ${fmt(r.damage)} (보스 체력의 ${((r.damage / r.hp) * 100).toFixed(1)}%) · ${r.killed ? `보스 처치! ${clock(r.endSec)}` : '보스가 도망쳤어요'}</div>
      ${rewards}
      <ol class="mini-board">${top}</ol>
      <div class="modal-actions"><span class="spacer"></span><button class="btn primary" data-a="ok" autofocus>확인</button></div>
    </div>`, (el, close) => el.querySelector('[data-a=ok]').addEventListener('click', close));
  sfx(practice ? 'check' : 'loot');
}

function showRewardTable() {
  const rows = FIELD_BOSS_REWARDS.map((r) => `<tr><td>${r.label}</td><td>${r.gold}G~</td><td>보석 ${r.gems}</td><td>${r.weights ? `${r.item >= 1 ? '장비 1개' : `장비 ${Math.round(r.item * 100)}%`} (${r.weights.legendary ? `전설 ${r.weights.legendary}%` : ''})` : '-'}</td></tr>`).join('');
  openModal(`<h3>${uiIcon('trophy', 1)} 필드 보스 순위 보상</h3>
    <table class="reward-table"><tr><th>순위</th><th>골드</th><th>보석</th><th>장비</th></tr>${rows}</table>
    <p class="muted small">골드는 전투력 단계마다 15%씩 늘어요. 입장하면 끝날 때까지 자동으로 싸우고, 화면을 누르거나 필살기를 쓰면 피해가 커져요.</p>
    <div class="modal-actions"><span class="spacer"></span><button class="btn primary" data-a="ok" autofocus>확인</button></div>`,
  (el, close) => el.querySelector('[data-a=ok]').addEventListener('click', close));
}

/* ── 레이드 ─────────────────────────────── */

const RAID_THEMES = {
  green: { sky: ['#0f2418', '#24553a'], ground: '#3f7a43' },
  poison: { sky: ['#1a1428', '#3a2a4a'], ground: '#4f6a2f' },
  red: { sky: ['#2a0f14', '#6b1d22'], ground: '#8a3a2a' },
  frost: { sky: ['#0f2236', '#3a6f99'], ground: '#9fc9e0' },
  metal: { sky: ['#1a1d24', '#454b59'], ground: '#6a707f' },
  gold: { sky: ['#2a210f', '#6b5422'], ground: '#a3823a' },
  abyss: { sky: ['#050b1c', '#12244d'], ground: '#1f3a6b' },
  shadow: { sky: ['#0c0814', '#2a1840'], ground: '#3a2a52' },
  rainbow: { sky: ['#2b1d4a', '#7a4a6e'], ground: '#6b5aa8' },
};

function raidBattle(el, ctx) {
  const s = ctx.state;
  const d = ui(ctx);
  const ses = s.raid.session;
  const boss = raidBoss(ses.tier);
  const members = [
    { id: 'me', name: s.profile.name, cp: ses.cp, isMe: true, party: true, gear: myGear(s) },
    ...playersById(ses.party || [], s.raid.day).map((p) => ({ ...p, party: true })),
  ];
  runBossFight(el, ctx, {
    key: `raid:${ses.startedAt}`,
    members,
    seriesSeed: `${s.profile.seed}|raid|${ses.startedAt}`,
    fromSec: 0,
    T: RAID.durationSec,
    startAt: ses.startedAt,
    hp: boss.hp,
    boss: { name: `${ses.tier}단계 · ${boss.name}`, color: boss.color, crown: boss.crown, horns: boss.horns },
    theme: RAID_THEMES[boss.color] || RAID_THEMES.green,
    rules: { ...RAID, timerId: 'dg-timer' },
    onEnd: ({ inp }) => {
      setTimeout(async () => {
        stopLive();
        d.mode = null;
        settleOnce(`raid:${ses.startedAt}`, async () => {
          const res = await ctx.act('raid/finish', { taps: inp.taps, skills: inp.skills });
          const ev = res.ok && res.events.find((e) => e.type === 'raidResult');
          ctx.rerender(true);
          if (ev) showRaidResult(ctx, ev);
        });
      }, 1400);
    },
  });
}

function showRaidResult(ctx, ev) {
  if (!ev.win) {
    if (ev.giveUp) {
      toast('레이드를 포기했어요. 입장권은 그대로예요.');
      return;
    }
    const pct = ev.hp ? Math.min(99.9, (ev.total / ev.hp) * 100) : 0;
    openModal(`
      <div class="dg-result fail">
        <div class="muted">${ev.tier}단계 · ${esc(ev.boss)}</div>
        <div class="rank-big">토벌 실패</div>
        <div class="muted">보스 체력의 ${pct.toFixed(1)}%를 깎았어요. 입장권은 그대로예요.</div>
        <ul class="tips"><li>파티원을 초대하면 함께 싸워요 (최대 4명)</li><li>전투 중 화면을 누르고 필살기를 쓰면 피해가 커져요</li><li>장비를 바꾸거나 레벨을 올려 전투력을 높여 보세요</li></ul>
        <div class="modal-actions"><span class="spacer"></span><button class="btn primary" data-a="ok" autofocus>확인</button></div>
      </div>`, (el, close) => el.querySelector('[data-a=ok]').addEventListener('click', close));
    sfx('hurt');
    return;
  }
  const c = ev.chest;
  const items = c.items.map((it) => `<div class="loot-line t-${it.rarity}">${itemIcon(it, 2)} <span>${esc(it.name)}</span><small>${RARITIES[it.rarity].label}${it.raid ? ' · 레이드 전용' : ''}</small></div>`).join('');
  openModal(`
    <div class="dg-result raid-chest">
      <div class="muted">${ev.tier}단계 · ${esc(ev.boss)} 토벌! (${ev.sec}초)</div>
      <button class="chest-btn" data-a="open" title="열기">${raidChestIcon(6, false)}</button>
      <div class="chest-hint">레이드 보물상자를 눌러 열어 보세요</div>
      <div class="chest-loot" hidden>
        ${items}
        <div>${uiIcon('coin', 2)} 골드 <b>+${fmt(c.gold)}</b> · ${uiIcon('star', 2)} 경험치 <b>+${fmt(c.xp)}</b></div>
        <div class="gems">${gemList(c.gems)}</div>
      </div>
      <div class="modal-actions"><span class="spacer"></span><button class="btn primary" data-a="ok">확인</button></div>
    </div>`, (el, close) => {
    const btn = el.querySelector('[data-a=open]');
    btn.addEventListener('click', () => {
      btn.innerHTML = raidChestIcon(6, true);
      btn.classList.add('opened');
      el.querySelector('.chest-hint').hidden = true;
      el.querySelector('.chest-loot').hidden = false;
      sfx(c.items.some((it) => it.rarity === 'legendary') ? 'legendary' : 'loot');
    }, { once: true });
    el.querySelector('[data-a=ok]').addEventListener('click', close);
  });
  sfx('levelup');
}

/* ── 요일 던전 ─────────────────────────────── */

function dayBattle(el, ctx) {
  const s = ctx.state;
  const d = s.dungeon;
  const dg = dayDungeonFor(d.day);
  const band = powerBand(combatPower(s));
  const rate = gemRate(band);
  const canvas = el.querySelector('#dg-canvas');
  const scene = new HuntScene(canvas, { gear: myGear(s), monster: dg.monster, gems: dg.gems, theme: { sky: dg.sky, ground: dg.ground }, active: Boolean(d.activeSince) });
  scene.start();
  let leaving = false;
  const tick = () => {
    const st = dayStatus(ctx);
    el.querySelector('#dd-left').textContent = `남은 ${clock(st.left)}`;
    const elapsed = d.activeSince ? Math.max(0, (Date.now() - d.activeSince) / 1000) : 0;
    const expected = Math.floor((Math.min(elapsed, DAY_DUNGEON.dailySec - d.usedSec) / 60) * rate + d.frac + 1e-9);
    el.querySelector('#dd-count').textContent = `+${expected}`;
    const bar = el.querySelector('#dd-bar');
    if (bar) bar.style.width = `${((st.used / DAY_DUNGEON.dailySec) * 100).toFixed(2)}%`;
    if (st.active && st.left <= 0 && !leaving) {
      leaving = true;
      leave(ctx);
    }
  };
  const timer = setInterval(tick, 500);
  tick();
  live = { key: `day:${d.day}`, stop() { clearInterval(timer); scene.stop(); } };
}

async function leave(ctx) {
  stopLive();
  ui(ctx).mode = null;
  const res = await ctx.act('dungeon/leave', {});
  ctx.rerender(true);
  const ev = res.ok && res.events.find((e) => e.type === 'dungeonResult');
  if (ev) {
    if (ev.count) sfx('coin');
    toast(ev.count ? `${esc(ev.name)}: ${gemList(ev.gems)} (${Math.max(1, Math.floor(ev.sec / 60))}분 사냥)` : `${esc(ev.name)}: 1분 이상 사냥하면 보석이 나와요`, { life: 3600 });
  }
}

function dayShell(ctx) {
  const s = ctx.state;
  const dg = dayDungeonFor(s.dungeon.day);
  const band = powerBand(combatPower(s));
  const active = Boolean(s.dungeon.activeSince);
  return `
    <div class="dg-battle day">
      <div class="dg-bar">
        <button class="btn ghost small" data-act="dg-back">← 던전</button>
        <b class="title">${esc(dg.name)}</b>
        <span class="timer" id="dd-left">-:--</span>
      </div>
      <div class="dg-stage"><canvas id="dg-canvas"></canvas></div>
      <div class="time-bar"><i id="dd-bar"></i></div>
      <div class="dd-info">
        <div class="dd-gems">${dg.gems.map((k) => gemIcon(k, 2)).join('')}<b id="dd-count">+0</b><span class="muted">획득 예정</span></div>
        <div class="muted small">1분마다 보석 ${gemRate(band).toFixed(1)}개 (전투력 ${band}단계) · 앱을 닫아도 사냥은 계속돼요 · 하루 최대 1시간</div>
        <div class="dg-btns">${active ? '<button class="btn primary block" data-act="day-leave">나가서 보석 받기</button>' : '<button class="btn primary block" data-act="day-enter">입장</button>'}</div>
      </div>
    </div>`;
}

/* ── 파티 · 길드 창 ─────────────────────────────── */

function openInvite(ctx) {
  const draw = (el) => {
    const s = ctx.state;
    const cp = combatPower(s);
    const inParty = new Set(s.social.party);
    const full = s.social.party.length >= RAID.partyMax - 1;
    const guildList = s.social.guild ? guildMembers(s.social.guild, ctx.today).slice(0, 8) : [];
    const online = onlinePlayers(cp, ctx.today, new Date().getHours(), { count: 10, exclude: guildList.map((p) => p.id) });
    const row = (p) => {
      const g = guildById(p.guild);
      return `<div class="pl-row">${heroImg(p.gear, 1)}<div class="pl-info"><b>${esc(p.name)}</b><span class="muted">Lv.${p.level} · 전투력 ${fmt(p.cp)}${g ? ` · ${esc(g.name)}` : ''}</span></div>
        ${inParty.has(p.id) ? '<span class="muted small">파티원</span>' : `<button class="btn small primary" data-inv="${p.id}" ${full ? 'disabled' : ''}>초대</button>`}</div>`;
    };
    el.querySelector('.pl-list').innerHTML = `
      ${guildList.length ? `<div class="section-title">${uiIcon('crown', 1)} 길드원</div>${guildList.map(row).join('')}` : ''}
      <div class="section-title">${uiIcon('party', 1)} 지금 접속 중 (내 전투력 근처)</div>${online.map(row).join('')}`;
    el.querySelector('.pl-count').textContent = `${s.social.party.length + 1}/${RAID.partyMax}`;
  };
  openModal(`<h3>${uiIcon('party', 1)} 파티 초대 <span class="pl-count muted"></span></h3>
    <p class="muted small" style="margin:0 0 6px">지금은 계정 서버 연결 전이라 가상 플레이어와 파티를 맺어요. 파티원은 필드 보스·레이드에 함께 들어가요.</p>
    <div class="pl-list"></div>
    <div class="modal-actions"><span class="spacer"></span><button class="btn primary" data-a="ok">완료</button></div>`, (el, close) => {
    draw(el);
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-inv]');
      if (b) {
        const res = await ctx.act('party/invite', { id: b.dataset.inv });
        if (res.ok) { sfx('check'); draw(el); }
      }
      if (e.target.closest('[data-a=ok]')) close();
    });
  });
}

export function openGuilds(ctx) {
  const draw = (el) => {
    const s = ctx.state;
    el.querySelector('.gd-list').innerHTML = GUILDS.map((g) => {
      const n = guildMembers(g.id, ctx.today).length + (s.social.guild === g.id ? 1 : 0);
      const mine = s.social.guild === g.id;
      return `<div class="pl-row gd ${mine ? 'mine' : ''}"><span class="gd-dot" style="background:${g.color}"></span><div class="pl-info"><b>${esc(g.name)}</b><span class="muted">${esc(g.motto)} · ${n}명</span></div>
        ${mine ? '<button class="btn small ghost" data-leave="1">탈퇴</button>' : `<button class="btn small primary" data-join="${g.id}">가입</button>`}</div>`;
    }).join('');
  };
  openModal(`<h3>${uiIcon('crown', 1)} 길드</h3>
    <p class="muted small" style="margin:0 0 6px">길드원끼리 길드 채팅을 하고 파티를 맺을 수 있어요. 길드 만들기·일정 취합은 계정 서버가 생기면 열려요.</p>
    <div class="gd-list"></div>
    <div class="modal-actions"><span class="spacer"></span><button class="btn primary" data-a="ok">닫기</button></div>`, (el, close) => {
    draw(el);
    el.addEventListener('click', async (e) => {
      const j = e.target.closest('[data-join]');
      if (j) {
        if (ctx.state.social.guild && !(await confirmDialog('지금 길드를 떠나 새 길드에 가입할까요?', { ok: '가입' }))) return;
        const res = await ctx.act('guild/join', { id: j.dataset.join });
        if (res.ok) { sfx('check'); toast(`${esc(guildById(j.dataset.join).name)} 길드에 가입했어요!`); }
        openGuilds(ctx);
        return;
      }
      if (e.target.closest('[data-leave]')) {
        await ctx.act('guild/leave', {});
        draw(el);
      }
      if (e.target.closest('[data-a=ok]')) close();
    });
  });
}

/* ── 뷰 ─────────────────────────────── */

export const dungeonView = {
  signature(ctx) {
    const s = ctx.state;
    const d = ui(ctx);
    if (d.mode === 'fieldBoss') return `fb|${s.fieldBoss.enteredAt}|${Boolean(s.fieldBoss.result)}`;
    if (d.mode === 'practice') return `fbp|${d.practiceStart}`;
    if (d.mode === 'raid') return `raid|${s.raid.session ? s.raid.session.startedAt : '-'}`;
    if (d.mode === 'day') return `day|${s.dungeon.activeSince}|${s.dungeon.usedSec}`;
    return JSON.stringify([combatPower(s), s.gems, s.raid, s.dungeon, s.fieldBoss.enteredAt, Boolean(s.fieldBoss.result), s.social, d.tier, ctx.today]);
  },

  render(ctx) {
    stopLive();
    const s = ctx.state;
    const d = ui(ctx);
    // 끝난 세션이면 허브로
    if (d.mode === 'fieldBoss' && (!s.fieldBoss.enteredAt || s.fieldBoss.result)) d.mode = null;
    if (d.mode === 'raid' && !s.raid.session) d.mode = null;
    if (d.mode === 'fieldBoss' || d.mode === 'practice') {
      return battleShell({ title: d.mode === 'practice' ? '필드 보스 연습' : '필드 보스', timerId: 'dg-timer', sub: ' · <b id="dg-myrank">-</b>위 / 20' });
    }
    if (d.mode === 'raid') return battleShell({ title: `레이드 ${s.raid.session.tier}단계`, timerId: 'dg-timer', giveUp: true });
    if (d.mode === 'day') return dayShell(ctx);
    return hub(ctx);
  },

  afterRender(el, ctx) {
    const s = ctx.state;
    const d = ui(ctx);
    if (d.mode === 'fieldBoss') return fieldBossBattle(el, ctx, false);
    if (d.mode === 'practice') return fieldBossBattle(el, ctx, true);
    if (d.mode === 'raid') {
      // 60초가 지난 레이드는 바로 정산
      if (Date.now() - s.raid.session.startedAt > RAID.durationSec * 1000 + 3000) {
        const key = `raid:${s.raid.session.startedAt}`;
        const inp = inputFor(ctx, key);
        d.mode = null;
        settleOnce(key, () => ctx.act('raid/finish', { taps: inp.taps, skills: inp.skills }).then((res) => {
          ctx.rerender(true);
          const ev = res.ok && res.events.find((e) => e.type === 'raidResult');
          if (ev) showRaidResult(ctx, ev);
        }));
        return undefined;
      }
      return raidBattle(el, ctx);
    }
    if (d.mode === 'day') return dayBattle(el, ctx);
    // 오늘 1시간을 다 쓴 사냥은 바로 정산
    const dayNow = dayStatus(ctx);
    if (dayNow.active && dayNow.left <= 0) {
      leave(ctx);
      return undefined;
    }
    // 허브: 시간 표시를 1초마다, 단계가 바뀌면(21시 등) 다시 그림
    const first = fieldBossStatus(ctx).key;
    hubTimer = setInterval(() => {
      if (!el.isConnected) { clearInterval(hubTimer); return; }
      const fb = fieldBossStatus(ctx);
      if (fb.key !== first) { ctx.rerender(true); return; }
      const st = el.querySelector('[data-fb-status]');
      if (st) st.innerHTML = fb.text;
      const day = dayStatus(ctx);
      const ds = el.querySelector('[data-day-status]');
      if (ds && day.active) ds.innerHTML = `<b class="hot">사냥 중</b> · 남은 시간 ${clock(day.left)}`;
    }, 1000);
    // 끝난 필드 보스를 아직 정산하지 않았으면 정산
    const fbState = s.fieldBoss;
    if (fbState.enteredAt && !fbState.result && Date.now() >= fieldBossWindow(fbState.enteredAt).closeAt) {
      const key = `fb:${fbState.enteredAt}`;
      const inp = inputFor(ctx, key);
      settleOnce(key, () => ctx.act('fieldBoss/finish', { taps: inp.taps, skills: inp.skills }).then((res) => {
        const ev = res.ok && res.events.find((e) => e.type === 'fieldBossResult');
        if (ev) showFieldBossResult(ctx, ev, false);
      }));
    }
    return undefined;
  },

  actions: {
    'dg-back': (el, ctx) => {
      // 전투는 계속된다(필드 보스·요일 던전은 자동, 레이드는 60초 뒤 정산)
      ui(ctx).mode = null;
      ctx.rerender(true);
    },
    'fb-enter': async (el, ctx) => {
      const res = await ctx.act('fieldBoss/enter', {});
      if (!res.ok) return;
      ui(ctx).mode = 'fieldBoss';
      sfx('buy');
      ctx.rerender(true);
    },
    'fb-view': (el, ctx) => { ui(ctx).mode = 'fieldBoss'; ctx.rerender(true); },
    'fb-result': (el, ctx) => {
      const r = ctx.state.fieldBoss.result;
      if (r) showFieldBossResult(ctx, r, false);
    },
    'fb-practice': (el, ctx) => {
      const d = ui(ctx);
      d.practiceStart = Date.now();
      d.mode = 'practice';
      ctx.rerender(true);
    },
    'fb-rewards': () => showRewardTable(),
    'day-enter': async (el, ctx) => {
      const res = await ctx.act('dungeon/enter', {});
      if (!res.ok) return;
      ui(ctx).mode = 'day';
      sfx('buy');
      ctx.rerender(true);
    },
    'day-view': (el, ctx) => { ui(ctx).mode = 'day'; ctx.rerender(true); },
    'day-leave': (el, ctx) => leave(ctx),
    'raid-tier': (el, ctx) => { ui(ctx).tier = Number(el.dataset.tier); ctx.rerender(true); },
    'raid-start': async (el, ctx) => {
      const res = await ctx.act('raid/start', { tier: ui(ctx).tier });
      if (!res.ok) return;
      ui(ctx).mode = 'raid';
      sfx('buy');
      ctx.rerender(true);
    },
    'raid-view': (el, ctx) => { ui(ctx).mode = 'raid'; ctx.rerender(true); },
    'raid-giveup': async (el, ctx) => {
      if (!(await confirmDialog('레이드를 포기할까요? 입장권은 쓰지 않아요.', { ok: '포기' }))) return;
      stopLive();
      ui(ctx).mode = null;
      const res = await ctx.act('raid/finish', { giveUp: true });
      ctx.rerender(true);
      const ev = res.ok && res.events.find((e) => e.type === 'raidResult');
      if (ev) showRaidResult(ctx, ev);
    },
    'party-invite': (el, ctx) => openInvite(ctx),
    'party-kick': (el, ctx) => ctx.act('party/kick', { id: el.dataset.id }),
    'party-disband': async (el, ctx) => {
      if (await confirmDialog('파티를 해산할까요?', { ok: '해산', danger: true })) ctx.act('party/disband', {});
    },
    'guild-open': (el, ctx) => openGuilds(ctx),
  },
};

/** 뒤로 가기(안드로이드): 전투 화면이면 던전 허브로 */
export function dungeonBack(ctx) {
  const d = ctx.ui.dg;
  if (d && d.mode) {
    d.mode = null;
    ctx.rerender(true);
    return true;
  }
  return false;
}
