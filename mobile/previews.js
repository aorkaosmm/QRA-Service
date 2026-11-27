// 홈 화면 위젯 목업: Android(달력·용사 위젯, 라이브 배경화면)와 iPhone(인터랙티브 위젯, 잠금 화면 실시간 현황).
// 위젯의 체크 버튼은 앱과 같은 백엔드로 실제 액션을 보낸다.
import { heroStats } from '../desktop/src/core/progression.js';
import { dayKey, parseKey, addDays, monthGrid, formatKo, timeToMinutes } from '../desktop/src/core/dates.js';
import {
  dailiesForDay, isDailyDone, tasksForDay, isTaskDone, taskColor, timedItemsForDay,
} from '../desktop/src/core/selectors.js';
import { WEEKDAYS_KO } from '../desktop/src/core/constants.js';
import { composeHero, SLIME_FRAMES, SLIME_COLORS } from '../desktop/src/shared/sprites.js';
import { spriteCanvas, drawHero, gearSig } from '../desktop/src/renderer/shared/sprite-canvas.js';

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

function todayItems(state, today) {
  const items = [];
  for (const t of tasksForDay(state, today)) items.push({ kind: 'task', id: t.id, title: t.title, time: t.time, done: isTaskDone(t, today), day: today });
  for (const d of dailiesForDay(state, today)) items.push({ kind: 'daily', id: d.id, title: d.title, time: d.time, done: isDailyDone(d, today), day: today });
  return items;
}

const row = (i) => `<div class="wq ${i.done ? 'done' : ''}">
  <button class="wchk" data-toggle="${i.kind}|${i.id}|${i.day}" aria-label="${i.done ? '완료 취소' : '완료'}: ${esc(i.title)}"></button>
  <span class="t">${esc(i.title)}</span>${i.time ? `<span class="tm">${i.time}</span>` : ''}
</div>`;

/** 라이브 배경화면 미리보기: 용사가 슬라임을 찾아가 때리는 짧은 반복 장면 */
class MiniScene {
  constructor(canvas, getGear) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.getGear = getGear;
    this.texts = [];
    this.parts = [];
    this.resize();
    this.hero = { x: 30, face: 1, t: 0, state: 'walk', anim: 0, cd: 0, hit: false };
    this.spawn();
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(canvas);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.cv.getBoundingClientRect();
    this.dpr = dpr;
    this.S = Math.max(1, Math.round(2 * dpr));
    this.cv.width = Math.max(1, Math.round((r.width || 300) * dpr));
    this.cv.height = Math.max(1, Math.round((r.height || 72) * dpr));
    this.W = Math.ceil(this.cv.width / this.S);
    this.H = Math.ceil(this.cv.height / this.S);
  }

  spawn() {
    const colors = ['green', 'blue', 'red', 'purple', 'gold'];
    const fromLeft = this.hero ? this.hero.x > this.W / 2 : false;
    this.slime = {
      x: fromLeft ? -10 : this.W + 10, y: 0, vx: 0, vy: 0, hp: 3, flash: 0,
      color: colors[Math.floor(Math.random() * colors.length)], hop: 0.3, face: fromLeft ? 1 : -1, dead: 0,
    };
  }

  step(dt) {
    const h = this.hero;
    const s = this.slime;
    h.anim += dt;
    h.t += dt;
    h.cd -= dt;
    if (s.dead > 0) {
      s.dead += dt;
      if (s.dead > 0.9) this.spawn();
    } else {
      s.vy -= 520 * dt;
      s.y += s.vy * dt;
      s.x += s.vx * dt;
      if (s.y <= 0) { s.y = 0; s.vy = 0; s.vx *= 0.85; }
      s.hop -= dt;
      s.flash -= dt;
      if (s.hop <= 0 && s.y === 0) {
        const dir = Math.sign(h.x - s.x) || 1;
        s.face = dir;
        s.vx = dir * 32;
        s.vy = 105;
        s.hop = rand(0.9, 1.5);
      }
    }
    if (h.state === 'atk') {
      if (!h.hit && h.t > 0.12) { h.hit = true; this.strike(); }
      if (h.t > 0.36) { h.state = 'walk'; h.t = 0; }
    } else if (s.dead === 0) {
      const dx = s.x - h.x;
      h.face = dx >= 0 ? 1 : -1;
      if (Math.abs(dx) < 16) {
        if (h.cd <= 0) { h.state = 'atk'; h.t = 0; h.hit = false; h.cd = 0.8; }
      } else {
        h.x += h.face * 26 * dt;
      }
    }
    h.x = clamp(h.x, 10, this.W - 10);
    for (const t of this.texts) { t.t += dt; t.y += 14 * dt; }
    this.texts = this.texts.filter((t) => t.t < 0.9);
    for (const p of this.parts) { p.t += dt; p.vy -= 360 * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    this.parts = this.parts.filter((p) => p.t < 0.6);
  }

  strike() {
    const s = this.slime;
    s.hp -= 1;
    s.flash = 0.12;
    s.vx = this.hero.face * 70;
    s.vy = 90;
    const crit = Math.random() < 0.2;
    const dmg = crit ? Math.round(rand(14, 20)) : Math.round(rand(6, 11));
    this.texts.push({ x: s.x, y: 16, t: 0, text: crit ? `${dmg}!` : String(dmg), color: crit ? '#ffd447' : '#ffffff', big: crit });
    if (s.hp <= 0) {
      s.dead = 0.0001;
      const col = SLIME_COLORS[s.color].g;
      for (let i = 0; i < 10; i++) this.parts.push({ x: s.x, y: 5, vx: rand(-60, 60), vy: rand(60, 130), t: 0, c: col });
      this.texts.push({ x: s.x, y: 22, t: 0, text: '+1G', color: '#ffd447' });
    }
  }

  draw() {
    const g = this.g;
    const { S, W, H } = this;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, this.cv.width, this.cv.height);
    const oy = this.cv.height - H * S;
    g.setTransform(S, 0, 0, S, 0, oy);
    g.imageSmoothingEnabled = false;
    const s = this.slime;
    const h = this.hero;
    const gear = this.getGear();
    if (!s.dead) {
      const frame = s.flash > 0 ? 'hurt' : s.y > 0 ? 'stretch' : 'idle';
      const spr = spriteCanvas(SLIME_FRAMES[frame], SLIME_COLORS[s.color], { flip: s.face < 0, key: `mini:${s.color}:${frame}` });
      g.drawImage(spr, Math.round(s.x - 9), H - 12 - Math.round(s.y));
    }
    const pose = h.state === 'atk' ? (h.t < 0.12 ? 'atk0' : h.t < 0.24 ? 'atk1' : 'atk2') : Math.floor(h.anim * 8) % 2 ? 'walk0' : 'walk1';
    const c = composeHero(pose, gear);
    const hs = spriteCanvas(c.rows, c.palette, { flip: h.face < 0, key: `minih:${pose}:${gearSig(gear)}` });
    g.drawImage(hs, Math.round(h.x) - (h.face < 0 ? 15 : 16), H - 24);
    for (const p of this.parts) {
      g.globalAlpha = 1 - p.t / 0.6;
      g.fillStyle = p.c;
      g.fillRect(Math.round(p.x), H - 1 - Math.round(p.y), 1, 1);
    }
    g.globalAlpha = 1;
    // 숫자는 기기 픽셀로 (도트 글꼴)
    g.setTransform(1, 0, 0, 1, 0, 0);
    const k = Math.max(1, Math.round(this.dpr));
    for (const t of this.texts) {
      const px = (t.big ? 16 : 12) * k;
      g.globalAlpha = Math.max(0, 1 - t.t / 0.9);
      g.font = `700 ${px}px Galmuri11, sans-serif`;
      g.textAlign = 'center';
      g.lineWidth = 3 * k;
      g.strokeStyle = '#1a1423';
      const x = Math.round(t.x * S);
      const y = Math.round(oy + (H - t.y - 8) * S);
      g.strokeText(t.text, x, y);
      g.fillStyle = t.color;
      g.fillText(t.text, x, y);
    }
    g.globalAlpha = 1;
  }
}

export function mountPreviews(api) {
  const $ = (id) => document.getElementById(id);
  let state = null;
  let hp = null;
  let cheerUntil = 0;
  let badge = null;
  const gear = () => (state ? heroStats(state).gear : {});
  const iconURL = () => (document.getElementById('brand-icon') || {}).src || '';

  function heroInfo(st) {
    const max = st.maxHp;
    const cur = hp ? Math.min(hp.hp, max) : max;
    return `<div class="mini-row"><span>${esc(state.profile.name)} Lv.${st.level}</span><span style="color:#ffd447">${state.hero.gold}G</span></div>
      <div class="mini-bar" style="--c:#ff4d6d" title="체력"><i style="width:${Math.round((cur / max) * 100)}%"></i></div>
      <div class="mini-bar" style="--c:#7fe3ff" title="경험치"><i style="width:${Math.round((st.xp / st.xpNext) * 100)}%"></i></div>`;
  }

  function render() {
    if (!state) return;
    const today = dayKey(Date.now(), state.settings.dayStartHour);
    const items = todayItems(state, today);
    const done = items.filter((i) => i.done).length;
    const pending = items.filter((i) => !i.done);
    const shown = [...pending, ...items.filter((i) => i.done)].slice(0, 3);
    const st = heroStats(state);

    // Android 달력 위젯 (4×2)
    const weekStart = addDays(today, -parseKey(today).getDay());
    const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    $('aw-cal').innerHTML = `
      <div class="aw-head"><img class="px" src="${iconURL()}" width="16" height="16" alt="">Calendar RPG<span class="date">${formatKo(today)}</span></div>
      <div class="aw-week">${week.map((d) => {
        const ts = tasksForDay(state, d).slice(0, 3);
        return `<div class="d ${d === today ? 'today' : ''}"><small>${WEEKDAYS_KO[parseKey(d).getDay()]}</small>${parseKey(d).getDate()}<div class="dots">${ts.map((t) => `<i style="--c:${taskColor(state, t)}"></i>`).join('')}</div></div>`;
      }).join('')}</div>
      ${shown.map(row).join('') || '<div class="wq"><span class="t">오늘 임무가 없어요</span></div>'}
      <div class="aw-foot">오늘 ${done}/${items.length} 완료 · ${pending.length ? `남은 임무 ${pending.length}개` : '퍼펙트 데이!'}</div>`;
    $('aw-hero-info').innerHTML = heroInfo(st);

    // iPhone 오늘의 임무 (중간 크기)
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    $('iw-today').innerHTML = `
      <div class="iw-top"><div class="ring" style="--p:${pct}" data-label="${done}/${items.length}"></div>
        <div><div class="iw-title">오늘의 임무</div><div class="iw-sub">${formatKo(today)}</div></div></div>
      ${shown.map(row).join('')}`;

    // iPhone 용사 (작은 크기): 정지 화면, 체크하면 잠깐 바뀜
    $('iw-hero-info').innerHTML = `${heroInfo(st)}${badge && Date.now() < badge.until ? `<div style="margin-top:4px;text-align:center;font-family:var(--pg-display);font-size:11px;color:#1f8fb3">${esc(badge.text)}</div>` : `<div style="margin-top:4px;text-align:center;font-size:10px;color:#6c6880">슬라임 ${state.stats.slimesDefeated}마리 처치</div>`}`;

    // iPhone 이번 달 (작은 크기)
    const t = parseKey(today);
    const grid = monthGrid(t.getFullYear(), t.getMonth());
    $('iw-month').innerHTML = `<div class="mh">${t.getMonth() + 1}월</div>
      <div class="mg">${WEEKDAYS_KO.map((w) => `<span style="color:#9a96aa">${w}</span>`).join('')}${grid.map((d) => {
        const dd = parseKey(d);
        const out = dd.getMonth() !== t.getMonth();
        const has = !out && tasksForDay(state, d).length;
        return `<span class="${out ? 'out' : ''} ${d === today ? 'today' : ''} ${has ? 'has' : ''}">${dd.getDate()}</span>`;
      }).join('')}</div>`;

    // 잠금 화면 실시간 현황
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const next = timedItemsForDay(state, today)
      .map((i) => ({ ...i, m: timeToMinutes(i.time) }))
      .filter((i) => i.m >= nowMin)
      .sort((a, b) => a.m - b.m)[0];
    const laText = next
      ? `<div class="la-title">${esc(next.time)} ${esc(next.title)}</div><div class="la-sub">${next.m - nowMin}분 남음 · 끝내면 경험치와 상자</div>`
      : `<div class="la-title">오늘 남은 임무 ${pending.length}개</div><div class="la-sub">${pending.length ? esc(pending[0].title) : '모두 끝냈어요!'}</div>`;
    $('live-activity').innerHTML = `<canvas id="la-cv" width="64" height="48"></canvas><div>${laText}</div>`;
    drawStatic();
  }

  function drawStatic() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const s3 = Math.max(1, Math.round(3 * dpr));
    const ios = $('iw-hero-cv');
    if (ios) {
      ios.width = 32 * s3;
      ios.height = 24 * s3;
      drawHero(ios, Date.now() < cheerUntil ? 'walk1' : 'idle0', gear(), { scale: s3 });
    }
    const la = $('la-cv');
    if (la) {
      const s2 = Math.max(1, Math.round(1.5 * dpr));
      la.width = 32 * s2;
      la.height = 24 * s2;
      drawHero(la, 'idle0', gear(), { scale: s2 });
    }
  }

  // Android 용사 위젯: 2장 짜리 숨쉬기 움직임
  let frame = 0;
  setInterval(() => {
    if (!state) return;
    frame++;
    const cv = $('aw-hero-cv');
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const s3 = Math.max(1, Math.round(3 * dpr));
    if (cv.width !== 32 * s3) { cv.width = 32 * s3; cv.height = 24 * s3; }
    drawHero(cv, frame % 2 ? 'idle1' : 'idle0', gear(), { scale: s3 });
  }, 520);

  // 라이브 배경화면 장면
  const scene = new MiniScene($('live-wallpaper'), gear);
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state) { scene.step(dt); scene.draw(); }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  // 위젯 체크 버튼 → 실제 액션
  document.getElementById('pane-widgets').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-toggle]');
    if (!b) return;
    const [kind, id, day] = b.dataset.toggle.split('|');
    await api.dispatch(kind === 'daily' ? 'daily/toggle' : 'task/toggle', kind === 'daily' ? { id, day } : { id, occurrence: day });
  });

  api.init().then(({ state: s }) => { state = s; render(); });
  api.onState((s) => { state = s; render(); });
  if (api.onHp) api.onHp((v) => { hp = v; if (state) render(); });
  api.onEvents((events) => {
    const r = events.find((ev) => ev.type === 'reward' && ev.xp);
    if (r) {
      cheerUntil = Date.now() + 1400;
      badge = { text: `+${r.xp} EXP · +${r.gold}G`, until: Date.now() + 1800 };
      render();
      setTimeout(render, 1900);
    }
  });
  setInterval(render, 60 * 1000);
}
