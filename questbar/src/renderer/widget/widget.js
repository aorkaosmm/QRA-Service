// 위젯 진입점: 상태 구독, 머리말(용사 정보), 탭 전환, 보상 연출
import { RARITIES } from '../../core/constants.js';
import { dayKey, parseKey } from '../../core/dates.js';
import { heroStats } from '../../core/progression.js';
import { dailiesForDay, isDailyDone, tasksForDay, isTaskDone } from '../../core/selectors.js';
import { resolveApi } from '../shared/api.js';
import { uiIcon, drawHero } from '../shared/sprite-canvas.js';
import { setSoundEnabled, sfx } from '../shared/sfx.js';
import { esc, toast, floatText, isModalOpen } from './ui.js';
import { openLoot } from './forms.js';
import { calendarView } from './views/calendar.js';
import { todayView } from './views/today.js';
import { bagView } from './views/bag.js';
import { shopView } from './views/shop.js';
import { settingsView } from './views/settings.js';
import { rowActions } from './views/rows.js';

const TABS = [
  { key: 'calendar', label: '캘린더', icon: 'calendar', view: calendarView },
  { key: 'today', label: '오늘', icon: 'sword', view: todayView },
  { key: 'bag', label: '가방', icon: 'bag', view: bagView },
  { key: 'shop', label: '상점', icon: 'shop', view: shopView },
  { key: 'settings', label: '설정', icon: 'gear', view: settingsView },
];

const UI_KEY = 'questbar-widget-ui';
const $ = (id) => document.getElementById(id);

function loadUi() {
  try {
    return JSON.parse(localStorage.getItem(UI_KEY)) || {};
  } catch {
    return {};
  }
}

async function main() {
  const api = await resolveApi();
  const init = await api.init();
  const saved = loadUi();

  const ctx = {
    api,
    state: init.state,
    isWeb: init.platform === 'web',
    today: dayKey(Date.now(), init.state.settings.dayStartHour),
    ui: {
      tab: TABS.some((t) => t.key === saved.tab) ? saved.tab : 'calendar',
      compact: Boolean(saved.compact),
      invSort: saved.invSort || 'rarity',
      invFilter: 'all',
      seen: new Set(saved.seen || []),
      month: null,
      selected: null,
      quickDraft: '',
    },
    tasksFor: (day) => tasksForDay(ctx.state, day),
    saveUi() {
      try {
        localStorage.setItem(UI_KEY, JSON.stringify({
          tab: ctx.ui.tab, compact: ctx.ui.compact, invSort: ctx.ui.invSort, seen: [...ctx.ui.seen].slice(-400),
        }));
      } catch {
        // 저장소 사용 불가 → 무시
      }
    },
    isNewItem: (id) => !ctx.ui.seen.has(id),
    markItemsSeen() {
      let changed = false;
      for (const it of ctx.state.inventory) {
        if (!ctx.ui.seen.has(it.id)) { ctx.ui.seen.add(it.id); changed = true; }
      }
      if (changed) { ctx.saveUi(); renderTabs(); }
    },
    async act(type, payload) {
      const res = await api.dispatch(type, payload);
      if (!res.ok) {
        toast(esc(res.error || '실패했어요.'), { kind: 'error' });
        sfx('error');
      }
      return res;
    },
    pendingAnchor: null,
    async complete(type, payload, anchorKey) {
      ctx.pendingAnchor = anchorKey;
      const res = await ctx.act(type, payload);
      setTimeout(() => { if (ctx.pendingAnchor === anchorKey) ctx.pendingAnchor = null; }, 500);
      return res;
    },
    rerender: (force) => renderView(force),
  };

  // 처음 실행: 이미 가진 장비는 '새 장비'로 표시하지 않음
  if (!saved.seen) ctx.markItemsSeen();

  const t = parseKey(ctx.today);
  ctx.ui.month = { y: t.getFullYear(), m: t.getMonth() };
  ctx.ui.selected = ctx.today;

  /* ── 머리말 ───────────────────────── */
  $('gold-icon').innerHTML = uiIcon('coin', 1);
  $('today-icon').innerHTML = uiIcon('sword', 1);
  $('btn-pin').innerHTML = uiIcon('pin', 2);
  $('btn-min').innerHTML = uiIcon('min', 2);
  $('btn-close').innerHTML = uiIcon('close', 2);
  $('btn-pin').addEventListener('click', () => api.windowCmd('toggle-pin'));
  $('btn-min').addEventListener('click', () => api.windowCmd('minimize'));
  $('btn-close').addEventListener('click', () => api.windowCmd('hide'));
  $('hero-portrait').addEventListener('click', () => switchTab('bag'));
  if (ctx.isWeb) {
    document.querySelector('.win-btns').style.display = 'none';
    $('resize-grip').style.display = 'none';
  }
  // 크기 조절 손잡이: 끌면 창 크기를 메인 프로세스에 요청
  $('resize-grip').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const grip = e.currentTarget;
    grip.setPointerCapture(e.pointerId);
    const start = { x: e.screenX, y: e.screenY, w: window.outerWidth, h: window.outerHeight };
    let raf = 0;
    const move = (ev) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => api.windowCmd({ type: 'resize', width: start.w + ev.screenX - start.x, height: start.h + ev.screenY - start.y }));
    };
    const up = () => {
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', up);
      api.windowCmd({ type: 'resize-end' });
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', up);
  });

  const portrait = $('hero-portrait');
  const dpr = () => Math.max(1, window.devicePixelRatio || 1);
  let frame = 0;
  function drawPortraits() {
    const gear = heroStats(ctx.state).gear;
    frame++;
    const pose = frame % 9 === 0 ? 'blink' : frame % 2 ? 'idle1' : 'idle0';
    const s2 = Math.max(1, Math.round(2 * dpr()));
    if (portrait.width !== 32 * s2) { portrait.width = 32 * s2; portrait.height = 24 * s2; }
    drawHero(portrait, pose, gear, { scale: s2 });
    document.querySelectorAll('canvas[data-hero]').forEach((c) => {
      const s3 = Math.max(1, Math.round(3 * dpr()));
      if (c.width !== 32 * s3) { c.width = 32 * s3; c.height = 24 * s3; }
      drawHero(c, pose, gear, { scale: s3 });
    });
  }
  setInterval(drawPortraits, 550);

  function renderHeader() {
    const s = ctx.state;
    const st = heroStats(s);
    $('hero-name').textContent = s.profile.name;
    $('hero-lv').textContent = st.level;
    $('xp-fill').style.width = `${Math.min(100, (st.xp / st.xpNext) * 100)}%`;
    $('xp-text').textContent = `${st.xp} / ${st.xpNext} EXP`;
    $('gold').textContent = s.hero.gold.toLocaleString('ko-KR');
    const dailies = dailiesForDay(s, ctx.today);
    const tasks = tasksForDay(s, ctx.today);
    const done = dailies.filter((d) => isDailyDone(d, ctx.today)).length + tasks.filter((x) => isTaskDone(x, ctx.today)).length;
    $('today-prog').textContent = `${done}/${dailies.length + tasks.length}`;
    $('btn-pin').classList.toggle('on', s.settings.widgetAlwaysOnTop);
    document.documentElement.dataset.theme = s.settings.theme;
    document.documentElement.style.setProperty('--opacity', String(s.settings.widgetOpacity));
    setSoundEnabled(s.settings.sound);
  }

  /* ── 탭 ───────────────────────────── */
  function renderTabs() {
    const unseen = ctx.state.inventory.filter((it) => !ctx.ui.seen.has(it.id)).length;
    const dailies = dailiesForDay(ctx.state, ctx.today);
    const left = dailies.filter((d) => !isDailyDone(d, ctx.today)).length;
    const badges = { bag: unseen, today: left };
    $('tabs').innerHTML = TABS.map((tab) => `
      <button data-tab="${tab.key}" class="${ctx.ui.tab === tab.key ? 'active' : ''}" title="${tab.label} (Ctrl+${TABS.indexOf(tab) + 1})">
        ${uiIcon(tab.icon, 2)}<span>${tab.label}</span>
        ${badges[tab.key] ? `<span class="badge">${badges[tab.key] > 99 ? '99+' : badges[tab.key]}</span>` : ''}
      </button>`).join('');
  }

  function switchTab(key) {
    if (!TABS.some((t) => t.key === key)) return;
    ctx.ui.tab = key;
    ctx.saveUi();
    renderTabs();
    renderView(true, { resetScroll: true });
  }

  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]');
    if (b) switchTab(b.dataset.tab);
  });

  /* ── 본문 ─────────────────────────── */
  const viewEl = $('view');
  let lastSig = null;
  let lastTab = null;

  function currentView() {
    return TABS.find((t) => t.key === ctx.ui.tab).view;
  }

  function renderView(force = false, { resetScroll = false } = {}) {
    const view = currentView();
    const sig = view.signature ? `${ctx.ui.tab}|${view.signature(ctx)}` : null;
    if (!force && sig && sig === lastSig && lastTab === ctx.ui.tab) {
      if (view.live) view.live(viewEl, ctx);
      return;
    }
    const scroll = resetScroll ? 0 : viewEl.scrollTop;
    const active = document.activeElement;
    const focusId = active && viewEl.contains(active) ? active.id : null;
    const caret = focusId && typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
    // 같은 탭을 다시 그릴 때는 입력 중인 글자를 지키기 (전투 보고로 골드가 바뀌어도 입력이 사라지지 않게)
    const drafts = {};
    if (!resetScroll && lastTab === ctx.ui.tab) {
      viewEl.querySelectorAll('input[id], textarea[id]').forEach((el) => { drafts[el.id] = el.value; });
    }
    viewEl.innerHTML = view.render(ctx);
    if (view.bind) view.bind(viewEl, ctx);
    for (const [id, value] of Object.entries(drafts)) {
      const el = document.getElementById(id);
      if (el && viewEl.contains(el) && el.type !== 'range') el.value = value;
    }
    viewEl.scrollTop = scroll;
    if (focusId) {
      const f = document.getElementById(focusId);
      if (f && viewEl.contains(f)) {
        f.focus();
        if (caret) { try { f.setSelectionRange(caret[0], caret[1]); } catch { /* 숫자 입력 등 */ } }
      }
    }
    lastSig = sig;
    lastTab = ctx.ui.tab;
    drawPortraits();
    if (view.afterRender) view.afterRender(viewEl, ctx);
  }

  const sharedActions = {
    ...rowActions,
    tab: (el) => switchTab(el.dataset.tab),
  };

  viewEl.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !viewEl.contains(el) || el.disabled) return;
    const fn = (currentView().actions || {})[el.dataset.act] || sharedActions[el.dataset.act];
    if (fn) fn(el, ctx);
  });

  viewEl.addEventListener('wheel', (e) => {
    const view = currentView();
    if (view.onWheel) view.onWheel(e, ctx);
  }, { passive: false });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && !e.altKey && /^[1-5]$/.test(e.key)) {
      e.preventDefault();
      switchTab(TABS[Number(e.key) - 1].key);
    }
  });

  /* ── 보상 연출 ───────────────────── */
  const lootQueue = [];
  let lootShowing = false;

  function pumpLoot() {
    if (lootShowing || !lootQueue.length) return;
    if (isModalOpen()) {
      setTimeout(pumpLoot, 400);
      return;
    }
    const { item, title } = lootQueue.shift();
    lootShowing = true;
    sfx(item.rarity === 'legendary' ? 'legendary' : 'loot');
    openLoot(ctx, item, {
      title,
      onClose: () => {
        lootShowing = false;
        setTimeout(pumpLoot, 150);
      },
    });
  }

  function anchorEl() {
    return ctx.pendingAnchor ? document.querySelector(`[data-key="${ctx.pendingAnchor}"]`) : null;
  }

  function handleEvents(events) {
    for (const ev of events) {
      switch (ev.type) {
        case 'reward': {
          const anchor = ev.source === 'daily' || ev.source === 'task' ? anchorEl() : null;
          const chk = anchor ? anchor.querySelector('.chk') : $('xp-fill');
          if (ev.xp) floatText(chk, `+${ev.xp} EXP`, { cls: 'xp-text' });
          if (ev.gold) floatText(chk, `+${ev.gold} G`, { cls: 'gold-text', dx: 54, delay: 120 });
          if (ev.xp || ev.gold) {
            sfx('check');
            $('gold-wrap').classList.remove('pulse');
            void $('gold-wrap').offsetWidth;
            $('gold-wrap').classList.add('pulse');
          }
          if (ev.streak >= 3) toast(`${uiIcon('flame', 1)} ${ev.streak}일 연속 달성! 보너스 경험치`, { life: 1800 });
          if (ev.source === 'perfect') toast(`${uiIcon('crown', 1)} 퍼펙트 데이! 오늘의 일일임무를 모두 끝냈어요`, { kind: 'level', life: 3200 });
          if (ev.item) {
            const title = ev.source === 'perfect' ? '퍼펙트 데이 보너스 상자!' : ev.source === 'shop' ? `${ev.title} 개봉!` : `「${ev.title}」 완료 보상!`;
            lootQueue.push({ item: ev.item, title });
          }
          if (ev.soldOverflow) toast(`가방이 가득 차서 자동 판매 (+${ev.soldOverflow}G)`);
          break;
        }
        case 'revert': {
          const anchor = anchorEl();
          floatText(anchor ? anchor.querySelector('.chk') : null, `-${ev.xp} EXP`, { cls: '' });
          sfx('uncheck');
          break;
        }
        case 'levelUp':
          sfx('levelup');
          toast(`${uiIcon('star', 1)} 레벨 업! <b>Lv.${ev.level}</b>${ev.gold ? ` · 보너스 ${ev.gold}G` : ''}`, { kind: 'level', life: 3200 });
          $('hero-lv').parentElement.classList.remove('pulse');
          void $('hero-lv').offsetWidth;
          $('hero-lv').parentElement.classList.add('pulse');
          if (ev.item) lootQueue.push({ item: ev.item, title: `레벨 ${ev.level} 달성 보상!` });
          break;
        case 'sold':
          sfx('coin');
          toast(`${uiIcon('coin', 1)} ${ev.count}개 판매 · +${ev.gold}G`);
          break;
        case 'equip':
          if (ev.item) toast(`<span class="t-${ev.item.rarity}">${esc(ev.item.name)}</span> 장착!`, { life: 1600 });
          break;
        case 'dayChanged':
          ctx.today = ev.day;
          toast('새로운 하루가 시작됐어요. 오늘의 임무를 확인하세요!', { life: 3000 });
          break;
        default:
          break;
      }
    }
    pumpLoot();
  }

  /* ── 구독 ─────────────────────────── */
  function onState(next) {
    ctx.state = next;
    ctx.today = dayKey(Date.now(), next.settings.dayStartHour);
    renderHeader();
    renderTabs();
    renderView(false);
  }

  api.onState(onState);
  api.onEvents(handleEvents);

  // 날짜가 바뀌었는지 1분마다 확인 (화면 갱신)
  setInterval(() => {
    const now = dayKey(Date.now(), ctx.state.settings.dayStartHour);
    if (now !== ctx.today) {
      ctx.today = now;
      renderHeader();
      renderTabs();
      renderView(true);
    }
  }, 60 * 1000);

  await document.fonts.ready.catch(() => {});
  renderHeader();
  renderTabs();
  renderView(true);
  drawPortraits();
  window.__questbarReady = true;
  void RARITIES;
}

main().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="color:#ff8080;padding:12px;white-space:pre-wrap">QuestBar 위젯 오류\n${String(err && err.stack || err)}</pre>`;
});
