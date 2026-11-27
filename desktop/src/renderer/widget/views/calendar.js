// 캘린더 탭: 월간 달력(여러 날 일정은 이어진 막대) + 선택한 날의 목록
import { WEEKDAYS_KO } from '../../../core/constants.js';
import {
  monthSummary, dailiesForDay, isDailyDone, weekSegments, taskColor, taskDuration,
} from '../../../core/selectors.js';
import { formatKo, parseKey } from '../../../core/dates.js';
import { holidayName as holName } from '../../../core/holidays.js';
import { uiIcon, catIcon } from '../../shared/sprite-canvas.js';
import { esc } from '../ui.js';
import { taskRow, dailyRow } from './rows.js';
import { openTaskForm } from '../forms.js';

const MAX_LANES = 3;

/** 막대 위 글자색: 밝은 색 위에는 진한 글자 */
function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? '#1a1423' : '#ffffff';
}

const md = (key) => {
  const d = parseKey(key);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export const calendarView = {
  signature(ctx) {
    const { state, ui } = ctx;
    return JSON.stringify([ctx.today, ui.month, ui.selected, ui.compact, state.tasks, state.groups,
      state.dailies.map((d) => [d.id, d.title, d.days, d.time, d.category, d.history]), state.perfectDays]);
  },

  render(ctx) {
    const { state, ui, today } = ctx;
    const { y, m } = ui.month;
    const cells = monthSummary(state, y, m);
    const sel = ui.selected;
    const compact = ui.compact;
    const weeks = [];
    for (let w = 0; w < 6; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));

    const grid = weeks.map((week) => {
      const days = week.map((c) => c.day);
      const segs = weekSegments(state, days);
      const hidden = new Array(7).fill(0);
      for (const s of segs) if (s.lane >= MAX_LANES) for (let c = s.c1; c <= s.c2; c++) hidden[c]++;

      const dayCells = week.map((c, i) => {
        const d = parseKey(c.day);
        const wd = d.getDay();
        const cls = [
          'cal-day',
          c.inMonth ? '' : 'out',
          c.day === today ? 'today' : '',
          c.day === sel ? 'sel' : '',
          wd === 0 ? 'sun' : wd === 6 ? 'sat' : '',
          c.holiday ? 'hol' : '',
        ].join(' ');
        const ratio = c.dailyTotal ? c.dailyDone / c.dailyTotal : 0;
        const prog = c.day <= today && c.dailyTotal && c.dailyDone ? `<div class="prog"><i style="width:${Math.round(ratio * 100)}%"></i></div>` : '';
        return `<div class="${cls}" style="grid-column:${i + 1}" data-act="select-day" data-day="${c.day}" title="${c.holiday ? esc(c.holiday) : ''}">
          <div class="cal-dhead"><span class="num">${d.getDate()}</span>${c.holiday && !compact ? `<span class="hol-name">${esc(c.holiday)}</span>` : ''}</div>
          ${prog}${c.perfect ? `<span class="crown">${uiIcon('crown', 1)}</span>` : ''}
        </div>`;
      }).join('');

      const bars = segs.filter((s) => s.lane < MAX_LANES).map((s) => {
        const color = taskColor(state, s.task);
        const multi = taskDuration(s.task) > 0;
        const cls = [
          'cal-bar',
          multi ? 'multi' : 'single',
          s.done ? 'done' : '',
          s.contLeft ? 'cont-l' : '',
          s.contRight ? 'cont-r' : '',
        ].join(' ');
        const label = multi ? `${s.task.title} (${md(s.start)}~${md(s.end)})` : s.task.title;
        return `<div class="${cls}" style="grid-column:${s.c1 + 1} / ${s.c2 + 2};grid-row:${s.lane + 2};--c:${color};--on:${textOn(color)}" data-act="bar" title="${esc(label)}">${compact ? '' : esc(s.task.title)}</div>`;
      }).join('');

      const more = hidden.map((n, i) => (n
        ? `<div class="cal-more" style="grid-column:${i + 1};grid-row:${MAX_LANES + 2}" data-act="select-day" data-day="${days[i]}">+${n}</div>`
        : '')).join('');

      return `<div class="cal-wk">${dayCells}${bars}${more}</div>`;
    }).join('');

    return `
      <div class="cal-head">
        <button class="icon-btn" data-act="month" data-d="-1" title="이전 달">◀</button>
        <div class="title" data-act="month-today" title="이번 달로">${y}년 ${m + 1}월</div>
        <button class="icon-btn" data-act="month" data-d="1" title="다음 달">▶</button>
        <button class="btn small ghost" data-act="toggle-compact" title="칸 보기 전환">${compact ? '자세히' : '간단히'}</button>
        <button class="btn small" data-act="go-today">오늘</button>
      </div>
      <div class="cal-week">${WEEKDAYS_KO.map((w) => `<div>${w}</div>`).join('')}</div>
      <div class="cal-grid ${compact ? 'cal-compact' : ''}">${grid}</div>
      ${dayList(ctx, sel)}`;
  },

  actions: {
    'select-day': (el, ctx) => selectDay(ctx, el.dataset.day),
    // 막대를 누르면 누른 위치의 날짜를 고른다
    bar: (el, ctx, e) => {
      const wk = el.closest('.cal-wk');
      const rect = wk.getBoundingClientRect();
      const col = Math.min(6, Math.max(0, Math.floor(((e ? e.clientX : rect.left) - rect.left) / (rect.width / 7))));
      const cell = wk.querySelectorAll('.cal-day')[col];
      if (cell) selectDay(ctx, cell.dataset.day);
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

function selectDay(ctx, day) {
  ctx.ui.selected = day;
  const d = parseKey(day);
  if (d.getMonth() !== ctx.ui.month.m) ctx.ui.month = { y: d.getFullYear(), m: d.getMonth() };
  ctx.rerender(true);
}

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
