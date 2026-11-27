// Calendar RPG 안드로이드 앱 진입점.
// 데스크톱과 같은 게임 엔진·화면을 쓰고, 저장은 안드로이드 기본 저장소(SharedPreferences)에 한다.
// 홈 화면 위젯·라이브 배경화면은 'widget_snapshot'을 읽고, 위젯에서 체크한 것은 'widget_pending'에 쌓였다가
// 앱을 열 때 엔진으로 처리된다(보상도 이때 지급).
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { createWebBackend } from '../../desktop/src/renderer/shared/web-backend.js';
import { heroStats } from '../../desktop/src/core/progression.js';
import { dayKey, addDays, parseKey, formatKo, timeToMinutes } from '../../desktop/src/core/dates.js';
import {
  dailiesForDay, isDailyDone, tasksForDay, isTaskDone, taskColor, timedItemsForDay,
} from '../../desktop/src/core/selectors.js';
import { WEEKDAYS_KO, SLOT_ORDER } from '../../desktop/src/core/constants.js';
import { toast } from '../../desktop/src/renderer/widget/ui.js';

const SAVE_KEY = 'calendar_rpg_save';
const SNAPSHOT_KEY = 'widget_snapshot';
const PENDING_KEY = 'widget_pending';
const native = Capacitor.isNativePlatform();
const WidgetBridge = registerPlugin('WidgetBridge');

const local = {
  get(k) { try { return window.localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch { /* 무시 */ } },
};

/* ── 홈 화면 위젯용 요약 ─────────────────── */

function buildSnapshot(state, hp) {
  const today = dayKey(Date.now(), state.settings.dayStartHour);
  const items = [];
  for (const t of tasksForDay(state, today)) {
    items.push({ k: 'task', id: t.id, day: today, title: t.title, time: t.time || '', done: isTaskDone(t, today), color: taskColor(state, t) });
  }
  for (const d of dailiesForDay(state, today)) {
    items.push({ k: 'daily', id: d.id, day: today, title: d.title, time: d.time || '', done: isDailyDone(d, today), color: '' });
  }
  const done = items.filter((i) => i.done).length;
  const ordered = [...items.filter((i) => !i.done), ...items.filter((i) => i.done)].slice(0, 6);
  const st = heroStats(state);
  const start = addDays(today, -parseKey(today).getDay());
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    return { day: d, d: parseKey(d).getDate(), wd: WEEKDAYS_KO[i], today: d === today, dots: tasksForDay(state, d).slice(0, 3).map((t) => taskColor(state, t)) };
  });
  const gear = {};
  for (const slot of SLOT_ORDER) gear[slot] = st.gear[slot] ? st.gear[slot].rarity : null;
  return {
    v: 1,
    updatedAt: Date.now(),
    today,
    dateLabel: formatKo(today),
    done,
    total: items.length,
    items: ordered,
    week,
    hero: {
      name: state.profile.name, level: st.level, xp: st.xp, xpNext: st.xpNext,
      hp: hp ? Math.min(hp.hp, st.maxHp) : st.maxHp, maxHp: st.maxHp, gold: state.hero.gold,
      slimes: state.stats.slimesDefeated,
    },
    gear,
  };
}

let syncTimer = null;
let lastSnapshot = '';
function syncWidgets(state, hp, { now = false } = {}) {
  if (!native) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    const snap = JSON.stringify(buildSnapshot(state, hp));
    // 체력 숫자만 바뀐 경우는 너무 자주 쓰지 않도록 내용 비교
    if (snap.replace(/"updatedAt":\d+,/, '') === lastSnapshot.replace(/"updatedAt":\d+,/, '')) return;
    lastSnapshot = snap;
    await Preferences.set({ key: SNAPSHOT_KEY, value: snap });
    try { await WidgetBridge.refresh(); } catch { /* 위젯 없음 */ }
  }, now ? 0 : 600);
}

/* ── 위젯에서 체크한 것 처리 ─────────────── */

async function applyWidgetPending(api, getState) {
  if (!native) return 0;
  const { value } = await Preferences.get({ key: PENDING_KEY });
  if (!value) return 0;
  let list = [];
  try { list = JSON.parse(value) || []; } catch { list = []; }
  await Preferences.remove({ key: PENDING_KEY });
  let applied = 0;
  for (const p of list) {
    const state = getState();
    const isDone = p.k === 'daily'
      ? (() => { const d = state.dailies.find((x) => x.id === p.id); return d ? isDailyDone(d, p.day) : null; })()
      : (() => { const t = state.tasks.find((x) => x.id === p.id); return t ? isTaskDone(t, p.day) : null; })();
    if (isDone === null || isDone === Boolean(p.done)) continue;
    const res = await api.dispatch(p.k === 'daily' ? 'daily/toggle' : 'task/toggle', p.k === 'daily' ? { id: p.id, day: p.day } : { id: p.id, occurrence: p.day });
    if (res.ok) applied++;
  }
  return applied;
}

/* ── 일정 알림 (기기 알림) ───────────────── */

let notifyTimer = null;
let notifyAllowed = null;
function scheduleNotifications(state) {
  if (!native) return;
  clearTimeout(notifyTimer);
  notifyTimer = setTimeout(async () => {
    try {
      if (notifyAllowed === null) {
        const perm = await LocalNotifications.checkPermissions();
        notifyAllowed = perm.display === 'granted' || (perm.display !== 'denied' && (await LocalNotifications.requestPermissions()).display === 'granted');
      }
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
      if (!notifyAllowed || !state.settings.notifications) return;
      const lead = state.settings.notifyLeadMinutes || 0;
      const now = Date.now();
      const out = [];
      const today = dayKey(now, state.settings.dayStartHour);
      for (let i = 0; i < 7 && out.length < 60; i++) {
        const day = addDays(today, i);
        for (const item of timedItemsForDay(state, day)) {
          const at = parseKey(day);
          const m = timeToMinutes(item.time) - lead;
          at.setHours(0, m, 0, 0);
          if (at.getTime() <= now + 30 * 1000) continue;
          out.push({
            id: out.length + 1,
            title: item.kind === 'daily' ? '⚔ 일일임무 시간이에요' : '📅 일정 알림',
            body: `${item.time} ${item.title}${lead ? ` (${lead}분 전)` : ''}`,
            schedule: { at, allowWhileIdle: true },
            smallIcon: 'ic_stat_quest',
          });
        }
        // 필드 보스 5분 전 (매일 오후 8시 55분)
        const fb = parseKey(day);
        fb.setHours(20, 55, 0, 0);
        if (fb.getTime() > now + 30 * 1000 && out.length < 60) {
          out.push({
            id: out.length + 1,
            title: '⚔ 필드 보스 5분 전',
            body: '오후 9시에 거대 황금 슬라임 왕이 나타나요! 던전 탭에서 입장하세요 (5분 · 20명)',
            schedule: { at: fb, allowWhileIdle: true },
            smallIcon: 'ic_stat_quest',
          });
        }
      }
      if (out.length) await LocalNotifications.schedule({ notifications: out });
    } catch (err) {
      console.warn('[notify]', err && err.message);
    }
  }, 1500);
}

/* ── 시작 ─────────────────────────────────── */

(async () => {
  let saved = null;
  if (native) {
    try { saved = (await Preferences.get({ key: SAVE_KEY })).value; } catch { saved = null; }
  }
  if (!saved) saved = local.get(SAVE_KEY);
  const storage = {
    get: () => saved,
    set: (_k, v) => {
      saved = v;
      local.set(SAVE_KEY, v);
      if (native) Preferences.set({ key: SAVE_KEY, value: v }).catch(() => {});
    },
  };
  const api = createWebBackend({ storage });
  window.calendarRpg = api;
  // 화면 위 용사(다른 앱 위에 표시) 상태
  let overlay = { permission: false, running: false, wanted: false };
  let overlayPendingEnable = false;
  const refreshOverlay = async () => {
    try { overlay = await WidgetBridge.overlayStatus(); } catch { /* 웹 */ }
    return overlay;
  };
  if (native) {
    api.platformTitle = '안드로이드 홈 화면';
    api.platformSettings = () => [
      { id: 'overlay', label: '화면 위 용사', desc: '고양이 키우기 앱처럼, 다른 앱을 쓰는 중에도 화면 아래에서 용사가 슬라임과 싸워요', button: overlay.running ? '끄기' : '켜기' },
      { id: 'pin-hero', label: '위젯 · 용사', desc: '용사가 슬라임과 싸우는 장면이 반복돼요 + 레벨·체력·경험치', button: '추가' },
      { id: 'pin-quests', label: '위젯 · 오늘의 임무', desc: '홈 화면에서 바로 체크 (보상은 앱을 열 때 받아요)', button: '추가' },
      { id: 'wallpaper', label: '라이브 배경화면', desc: '홈 화면 배경에서 내 용사가 슬라임과 싸워요', button: '설정' },
    ];
    api.runPlatformAction = async (id) => {
      try {
        if (id === 'overlay') {
          await refreshOverlay();
          if (overlay.running) {
            overlay = { ...overlay, ...(await WidgetBridge.setOverlay({ enabled: false })), wanted: false };
            return { message: '화면 위 용사를 숨겼어요' };
          }
          if (!overlay.permission) {
            overlayPendingEnable = true;
            await WidgetBridge.requestOverlayPermission();
            return { message: "'다른 앱 위에 표시'를 허용하고 돌아오면 용사가 나와요" };
          }
          overlay = { ...overlay, ...(await WidgetBridge.setOverlay({ enabled: true })), wanted: true };
          return { message: '용사가 화면 아래로 나왔어요! 알림의 [숨기기]로 끌 수 있어요' };
        }
        if (id === 'wallpaper') {
          const r = await WidgetBridge.openWallpaperPicker();
          return { message: r.opened ? '[배경화면 설정]을 누르면 적용돼요' : '이 기기는 라이브 배경화면을 지원하지 않아요' };
        }
        const r = await WidgetBridge.pinWidget({ kind: id === 'pin-hero' ? 'hero' : 'quests' });
        return { message: r.requested ? '홈 화면에 추가할지 물어보는 창이 떠요' : '홈 화면을 길게 눌러 [위젯] → Calendar RPG 에서 추가해 주세요' };
      } catch {
        return { message: '지금은 실행할 수 없어요' };
      }
    };
  }

  let state = (await api.init()).state;
  // 첫 실행: 새로 만든 모험(임무 ID·보상 시드)을 바로 저장해 둔다.
  // 저장 전에 앱이 꺼지면 다음 실행 때 ID가 달라져 위젯 체크가 엇갈릴 수 있다.
  if (!saved) storage.set(SAVE_KEY, JSON.stringify(state));
  let hp = null;
  api.onState((s) => { state = s; syncWidgets(s, hp); scheduleNotifications(s); });
  if (api.onHp) api.onHp((v) => { hp = v; syncWidgets(state, hp); });

  await import('../../desktop/src/renderer/widget/widget.js');
  await import('../../desktop/src/renderer/battle/battle.js');

  const handlePending = async () => {
    const n = await applyWidgetPending(api, () => state);
    syncWidgets(state, hp, { now: true });
    return n;
  };
  // 화면 위 용사: 허용하고 돌아왔거나, 켜 두었는데 꺼져 있으면(재부팅 등) 다시 켠다
  const restoreOverlay = async () => {
    if (!native) return;
    await refreshOverlay();
    if (overlay.permission && !overlay.running && (overlay.wanted || overlayPendingEnable)) {
      const fromPermission = overlayPendingEnable;
      overlayPendingEnable = false;
      overlay = { ...overlay, ...(await WidgetBridge.setOverlay({ enabled: true })), wanted: true };
      if (fromPermission) toast('용사가 화면 아래로 나왔어요! 알림의 [숨기기]로 끌 수 있어요', { life: 3500 });
    } else if (overlayPendingEnable && !overlay.permission) {
      overlayPendingEnable = false;
      toast("'다른 앱 위에 표시'가 꺼져 있어서 용사를 띄우지 못했어요", { kind: 'error', life: 3500 });
    }
  };
  // 임무 보상 → 화면 위 용사 머리 위 연출
  api.onEvents((events) => {
    if (!native) return;
    for (const ev of events) {
      if (ev.type === 'reward' && (ev.xp || ev.gold || ev.item)) {
        WidgetBridge.notifyReward({ xp: ev.xp || 0, gold: ev.gold || 0, rarity: ev.item ? ev.item.rarity : null }).catch(() => {});
      }
    }
  });
  await handlePending();
  await restoreOverlay();
  scheduleNotifications(state);

  if (native) {
    App.addListener('resume', () => { handlePending(); restoreOverlay(); });
    App.addListener('pause', () => syncWidgets(state, hp, { now: true }));
    // 뒤로 가기: 창 닫기 → 캘린더 탭 → 앱 내리기
    App.addListener('backButton', () => {
      const modal = document.querySelector('#modal-root .modal-backdrop');
      if (modal) {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        return;
      }
      // 던전 전투 화면 → 던전 허브
      if (window.__calendarRpgBack && window.__calendarRpgBack()) return;
      const active = document.querySelector('#tabs button.active');
      if (active && active.dataset.tab !== 'calendar') {
        document.querySelector('#tabs button[data-tab="calendar"]').click();
        return;
      }
      App.minimizeApp();
    });
  }
})().catch((err) => {
  console.error('[app]', err);
  document.body.insertAdjacentHTML('beforeend', `<pre style="position:fixed;inset:auto 0 0;z-index:99;margin:0;padding:12px;background:#4a1a26;color:#fff;white-space:pre-wrap">시작 오류: ${String(err && err.message || err)}</pre>`);
});
