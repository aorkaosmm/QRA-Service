// 캘린더 탭: 월간 달력 + 선택한 날의 목록
import { CATEGORIES, WEEKDAYS_KO } from '../../../core/constants.js';
import { monthSummary, isTaskDone, dailiesForDay, isDailyDone } from '../../../core/selectors.js';
import { formatKo, parseKey } from '../../../core/dates.js';
import { holidayName as holName } from '../../../core/holidays.js';
import { uiIcon, catIcon } from '../../shared/sprite-canvas.js';
import { esc } from '../ui.js';
import { taskRow, dailyRow } from './rows.js';
import { openTaskForm } from '../forms.js';


export const calendarView = {
  signature(ctx) {
    const { state, ui } = ctx;
    return JSON.stringify([ctx.today, ui.month, ui.selected, ui.compact, state.tasks, state.dailies.map((d) => [d.id, d.title, d.days, d.time, d.category, d.history]), state.perfectDays]);
  },

  render(ctx) {
    const { state, ui, today } = ctx;
    const { y, m } = ui.month;
    const cells = monthSummary(state, y, m);
    const sel = ui.selected;
    const showChips = !ui.compact;
    const grid = cells.map((c) => {
      const d = parseKey(c.day);
      const wd = d.getDay();
      const cls = [
        'cal-cell',
        c.inMonth ? '' : 'out',
        c.day === today ? 'today' : '',
        c.day === sel ? 'sel' : '',
        wd === 0 ? 'sun' : wd === 6 ? 'sat' : '',
        c.holiday ? 'hol' : '',
      ].join(' ');
      const maxChips = c.holiday ? 1 : 2;
      const chips = showChips
        ? c.tasks.slice(0, maxChips).map((t) => `<div class="chip ${isTaskDone(t, c.day) ? 'done' : ''}" style="--c:${CATEGORIES[t.category].color}">${esc(t.title)}</div>`).join('')
          + (c.tasks.length > maxChips ? `<div class="more">+${c.tasks.length - maxChips}</div>` : '')
        : `<div class="cal-dots">${c.tasks.slice(0, 6).map((t) => `<i style="--c:${CATEGORIES[t.category].color}"></i>`).join('')}</div>`;
      const ratio = c.dailyTotal ? c.dailyDone / c.dailyTotal : 0;
      const prog = c.day <= today && c.dailyTotal && c.dailyDone ? `<div class="prog"><i style="width:${Math.round(ratio * 100)}%"></i></div>` : '';
      return `<div class="${cls}" data-act="select-day" data-day="${c.day}" title="${c.holiday ? esc(c.holiday) : ''}">
        <span class="num">${d.getDate()}</span>
        ${c.holiday && showChips ? `<div class="hol-name">${esc(c.holiday)}</div>` : ''}
        ${chips}${prog}
        ${c.perfect ? `<span class="crown">${uiIcon('crown', 1)}</span>` : ''}
      </div>`;
    }).join('');

    return `
      <div class="cal-head">
        <button class="icon-btn" data-act="month" data-d="-1" title="이전 달">◀</button>
        <div class="title" data-act="month-today" title="이번 달로">${y}년 ${m + 1}월</div>
        <button class="icon-btn" data-act="month" data-d="1" title="다음 달">▶</button>
        <button class="btn small ghost" data-act="toggle-compact" title="칸 보기 전환">${ui.compact ? '자세히' : '간단히'}</button>
        <button class="btn small" data-act="go-today">오늘</button>
      </div>
      <div class="cal-week">${WEEKDAYS_KO.map((w) => `<div>${w}</div>`).join('')}</div>
      <div class="cal-grid ${ui.compact ? 'cal-compact' : ''}">${grid}</div>
      ${dayList(ctx, sel)}`;
  },

  actions: {
    'select-day': (el, ctx) => {
      ctx.ui.selected = el.dataset.day;
      const d = parseKey(el.dataset.day);
      if (d.getMonth() !== ctx.ui.month.m) ctx.ui.month = { y: d.getFullYear(), m: d.getMonth() };
      ctx.rerender(true);
    },
    month: (el, ctx) => {
      const { y, m } = ctx.ui.month;
      const d = new Date(y, m + Number(el.dataset.d), 1);
      ctx.ui.month = { y: d.getFullYear(), m: d.getMonth() };
      ctx.rerender(true);
    },
    'month-today': (_el, ctx) => {
      const t = parseKey(ctx.today);
      ctx.ui.month = { y: t.getFullYear(), m: t.getMonth() };
      ctx.rerender(true);
    },
    'go-today': (_el, ctx) => {
      const t = parseKey(ctx.today);
      ctx.ui.month = { y: t.getFullYear(), m: t.getMonth() };
      ctx.ui.selected = ctx.today;
      ctx.rerender(true);
    },
    'toggle-compact': (_el, ctx) => {
      ctx.ui.compact = !ctx.ui.compact;
      ctx.saveUi();
      ctx.rerender(true);
    },
    'add-on-day': (el, ctx) => openTaskForm(ctx, { date: el.dataset.day, type: 'event' }),
  },

  onWheel(e, ctx) {
    const grid = e.target.closest('.cal-grid');
    if (!grid) return false;
    e.preventDefault();
    const { y, m } = ctx.ui.month;
    const d = new Date(y, m + (e.deltaY > 0 ? 1 : -1), 1);
    ctx.ui.month = { y: d.getFullYear(), m: d.getMonth() };
    ctx.rerender(true);
    return true;
  },
};

function dayList(ctx, day) {
  const { state, today } = ctx;
  const tasks = ctx.tasksFor(day);
  const hol = holName(day);
  const dailies = dailiesForDay(state, day);
  const done = dailies.filter((d) => isDailyDone(d, day)).length;
  const isPast = day < today;
  const isToday = day === today;
  let dailyPart = '';
  if (dailies.length) {
    if (isToday) {
      dailyPart = `<div class="section-title">${uiIcon('sword', 1)} 오늘의 일일임무 <span class="count">${done}/${dailies.length}</span></div>`
        + dailies.slice(0, 4).map((d) => dailyRow(ctx, d, day)).join('')
        + (dailies.length > 4 ? `<button class="btn small ghost block" data-act="tab" data-tab="today">일일임무 ${dailies.length - 4}개 더 보기 →</button>` : '');
    } else if (isPast) {
      const perfect = state.perfectDays[day];
      dailyPart = `<div class="section-title">${uiIcon('sword', 1)} 일일임무 기록 <span class="count">${done}/${dailies.length}</span>${perfect ? ` ${uiIcon('crown', 1)}` : ''}</div>
        <div class="quest" style="--c:var(--ok)"><div class="q-body"><div class="bar ok"><i style="width:${Math.round((done / dailies.length) * 100)}%"></i><span>${done} / ${dailies.length} 완료${perfect ? ' · 퍼펙트 데이!' : ''}</span></div></div></div>`;
    } else {
      dailyPart = `<div class="section-title">${uiIcon('sword', 1)} 예정된 일일임무 <span class="count">${dailies.length}개</span></div>`;
    }
  }
  return `
    <div class="day-head">
      <span class="date">${formatKo(day)}</span>
      ${hol ? `<span class="hol">${esc(hol)}</span>` : ''}
      <span class="spacer"></span>
      <button class="btn small primary" data-act="add-on-day" data-day="${day}">${uiIcon('plus', 1)} 일정 추가</button>
    </div>
    ${tasks.length ? tasks.map((t) => taskRow(ctx, t, day)).join('') : `<div class="empty">${catIcon('life', 2)}<br>등록된 일정이 없어요.<br><span style="font-size:10px">날짜를 고르고 [일정 추가]로 퀘스트를 걸어 두세요.</span></div>`}
    ${dailyPart}`;
}
