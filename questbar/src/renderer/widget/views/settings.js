// 설정 탭: 프로필, 일일임무 관리, 위젯·전투·알림·데이터, 기록
import { CATEGORIES, CATEGORY_ORDER, BATTLE, WEEKDAYS_KO } from '../../../core/constants.js';
import { catIcon, uiIcon } from '../../shared/sprite-canvas.js';
import { esc, confirmDialog, toast } from '../ui.js';
import { openDailyForm } from '../forms.js';

const toggle = (key, on) => `<label class="toggle"><input type="checkbox" data-setting="${key}" ${on ? 'checked' : ''}><span></span></label>`;
const daysText = (days) => (days.length === 7 ? '매일' : days.join() === '1,2,3,4,5' ? '평일' : days.join() === '0,6' ? '주말' : days.map((d) => WEEKDAYS_KO[d]).join('·'));

export const settingsView = {
  signature(ctx) {
    const { state } = ctx;
    return JSON.stringify([state.settings, state.profile.name, state.dailies.map((d) => [d.id, d.title, d.days, d.time, d.category, d.difficulty])]);
  },

  render(ctx) {
    const { state, isWeb } = ctx;
    const s = state.settings;
    const dailies = [...state.dailies].sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));
    const dailyList = dailies.map((d) => `
      <div class="quest" style="--c:${CATEGORIES[d.category].color}">
        ${catIcon(d.category, 2)}
        <div class="q-body" data-act="edit-daily" data-id="${d.id}">
          <div class="q-title">${esc(d.title)}</div>
          <div class="q-meta"><span>${CATEGORIES[d.category].label}</span><span>${daysText(d.days)}</span>${d.time ? `<span>${d.time}</span>` : ''}</div>
        </div>
        <button class="icon-btn" data-act="edit-daily" data-id="${d.id}" title="수정">${uiIcon('edit', 2)}</button>
      </div>`).join('');

    return `
      <div class="section-title">${uiIcon('star', 1)} 프로필</div>
      <div class="form-inline" style="margin-top:0">
        <input type="text" id="hero-name-input" maxlength="12" value="${esc(state.profile.name)}" placeholder="용사 이름">
        <button class="btn primary" data-act="rename">저장</button>
      </div>

      <div class="section-title">${uiIcon('sword', 1)} 일일임무 관리 <span class="count">${dailies.length}개</span></div>
      ${dailyList || '<div class="empty">일일임무가 없어요.</div>'}
      <button class="btn block ghost" data-act="new-daily">${uiIcon('plus', 1)} 일일임무 추가</button>

      <div class="section-title">위젯</div>
      <div class="row-setting"><div>항상 위에 표시<div class="desc">다른 창보다 위에 둡니다</div></div>${toggle('widgetAlwaysOnTop', s.widgetAlwaysOnTop)}</div>
      <div class="row-setting"><div>배경 불투명도</div><input type="range" min="50" max="100" value="${Math.round(s.widgetOpacity * 100)}" data-setting-range="widgetOpacity" style="width:130px"></div>
      <div class="row-setting"><div>테마</div><div class="seg">${[['dark', '다크'], ['light', '라이트']].map(([k, l]) => `<button data-act="set" data-key="theme" data-v="${k}" class="${s.theme === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="row-setting"><div>효과음</div>${toggle('sound', s.sound)}</div>

      <div class="section-title">작업표시줄 전투</div>
      <div class="row-setting"><div>전투 표시<div class="desc">단축키 Ctrl+Alt+B</div></div>${toggle('battleEnabled', s.battleEnabled)}</div>
      <div class="row-setting"><div>클릭 상호작용<div class="desc">슬라임 클릭 공격·용사 클릭 시 위젯 열기</div></div>${toggle('battleInteractive', s.battleInteractive)}</div>
      <div class="row-setting"><div>슬라임 출현</div><div class="seg">${Object.entries(BATTLE.spawnRates).map(([k, v]) => `<button data-act="set" data-key="spawnRate" data-v="${k}" class="${s.spawnRate === k ? 'on' : ''}">${v.label}</button>`).join('')}</div></div>

      <div class="section-title">하루 · 알림</div>
      <div class="row-setting"><div>하루 시작 시각<div class="desc">밤늦게 끝낸 임무를 전날로 칠 때</div></div>
        <select data-setting-select="dayStartHour">${[0, 1, 2, 3, 4, 5, 6].map((h) => `<option value="${h}" ${s.dayStartHour === h ? 'selected' : ''}>${h === 0 ? '자정 (0시)' : `새벽 ${h}시`}</option>`).join('')}</select></div>
      <div class="row-setting"><div>일정 알림<div class="desc">시간을 정한 일정·일일임무를 Windows 알림으로</div></div>${toggle('notifications', s.notifications)}</div>
      <div class="row-setting"><div>알림 시점</div>
        <select data-setting-select="notifyLeadMinutes">${[0, 5, 10, 15, 30].map((m) => `<option value="${m}" ${s.notifyLeadMinutes === m ? 'selected' : ''}>${m ? `${m}분 전` : '정각'}</option>`).join('')}</select></div>
      ${isWeb ? '' : `<div class="row-setting"><div>Windows 시작 시 실행<div class="desc">설치판에서만 동작</div></div>${toggle('launchAtLogin', s.launchAtLogin)}</div>`}

      <div class="section-title">데이터</div>
      <div class="seg" style="gap:6px">
        <button class="btn small" data-act="export">내보내기</button>
        <button class="btn small" data-act="import">가져오기</button>
        ${isWeb ? '' : '<button class="btn small" data-act="open-folder">저장 폴더</button>'}
        <button class="btn small danger" data-act="reset">초기화</button>
      </div>
      <div class="desc" style="color:var(--faint);font-family:var(--font-small);font-size:10px;margin-top:4px">모든 데이터는 이 PC에만 저장돼요. 내보낸 JSON은 다른 PC·향후 모바일 앱으로 옮길 때 씁니다.</div>

      <div class="section-title">모험 기록</div>
      <div class="stat-grid" data-live="stats">${statsHtml(state)}</div>
      <div style="margin-top:10px;color:var(--faint);font-family:var(--font-small);font-size:10px;text-align:center">
        단축키 · Ctrl+Alt+Q 위젯 열기/숨기기 · Ctrl+Alt+B 전투 표시/숨기기<br>
        글꼴: Galmuri (SIL Open Font License 1.1)
      </div>`;
  },

  live(root, ctx) {
    const box = root.querySelector('[data-live=stats]');
    if (box) box.innerHTML = statsHtml(ctx.state);
  },

  bind(root, ctx) {
    root.querySelectorAll('[data-setting]').forEach((input) => {
      input.addEventListener('change', () => ctx.act('settings/update', { patch: { [input.dataset.setting]: input.checked } }));
    });
    root.querySelectorAll('[data-setting-select]').forEach((sel) => {
      sel.addEventListener('change', () => ctx.act('settings/update', { patch: { [sel.dataset.settingSelect]: Number(sel.value) } }));
    });
    const range = root.querySelector('[data-setting-range]');
    if (range) {
      range.addEventListener('input', () => document.documentElement.style.setProperty('--opacity', String(range.value / 100)));
      range.addEventListener('change', () => ctx.act('settings/update', { patch: { widgetOpacity: range.value / 100 } }));
    }
    const name = root.querySelector('#hero-name-input');
    if (name) name.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) settingsView.actions.rename(null, ctx); });
  },

  actions: {
    set: (el, ctx) => ctx.act('settings/update', { patch: { [el.dataset.key]: el.dataset.v } }),
    rename: async (_el, ctx) => {
      const v = document.getElementById('hero-name-input').value;
      if ((await ctx.act('hero/rename', { name: v })).ok) toast('이름을 바꿨어요.');
    },
    'new-daily': (_el, ctx) => openDailyForm(ctx),
    export: async (_el, ctx) => {
      const res = await ctx.api.exportData();
      if (res && res.ok) toast(res.path ? `내보냄: ${esc(res.path)}` : '내보내기 완료', { life: 3500 });
    },
    import: async (_el, ctx) => {
      if (!(await confirmDialog('가져온 데이터로 <b>지금 데이터를 덮어씁니다.</b> 계속할까요?', { ok: '가져오기', danger: true }))) return;
      const res = await ctx.api.importData();
      if (res && res.ok) toast('데이터를 가져왔어요.');
      else if (res && res.error) toast(esc(res.error), { kind: 'error' });
    },
    'open-folder': (_el, ctx) => ctx.api.openDataFolder(),
    reset: async (_el, ctx) => {
      if (!(await confirmDialog('레벨·장비·골드·일정이 모두 <b>처음 상태</b>로 돌아갑니다.<br>정말 초기화할까요?', { ok: '초기화', danger: true }))) return;
      await ctx.act('data/reset', {});
      toast('새 모험을 시작합니다!');
    },
  },
};

function statsHtml(state) {
  const st = state.stats;
  const rows = [
    ['완료한 임무', st.questsDone], ['처치한 슬라임', st.slimesDefeated], ['킹 슬라임 토벌', st.kingsDefeated],
    ['획득한 장비', st.itemsFound], ['전설 장비', st.legendaryFound], ['누적 골드', st.goldEarned],
    ['퍼펙트 데이', Object.keys(state.perfectDays).length], ['기절', st.faints],
  ];
  return rows.map(([k, v]) => `<div><span>${k}</span><b>${Number(v || 0).toLocaleString('ko-KR')}</b></div>`).join('');
}
