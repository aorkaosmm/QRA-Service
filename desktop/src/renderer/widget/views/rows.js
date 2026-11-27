// 임무 한 줄 (일정·할 일·일일임무) 렌더러와 공용 동작
import { CATEGORIES, DIFFICULTIES, DEFAULT_GROUP_ID } from '../../../core/constants.js';
import {
  isTaskDone, isDailyDone, computeStreak, occurrenceStart, occurrenceEnd, taskDuration, taskColor,
} from '../../../core/selectors.js';
import { diffDays, parseKey } from '../../../core/dates.js';
import { uiIcon, catIcon } from '../../shared/sprite-canvas.js';
import { esc, stars } from '../ui.js';
import { openTaskForm, openDailyForm } from '../forms.js';

const md = (key) => { const d = parseKey(key); return `${d.getMonth() + 1}/${d.getDate()}`; };

export function taskRow(ctx, t, day) {
  const done = isTaskDone(t, day);
  const cat = CATEGORIES[t.category] || CATEGORIES.todo;
  const start = occurrenceStart(t, day) || day;
  const future = t.type === 'event' && start > ctx.today;
  const due = t.endDate || t.date;
  const late = t.type === 'todo' && !done && due < ctx.today ? diffDays(due, ctx.today) : 0;
  const span = taskDuration(t) > 0 ? `${md(start)}~${md(occurrenceEnd(t, start))}` : '';
  const group = (ctx.state.groups || []).find((g) => g.id === t.groupId);
  const groupTag = group && group.id !== DEFAULT_GROUP_ID ? `<span class="gtag" style="--c:${group.color}">${esc(group.name)}</span>` : '';
  const when = t.time ? (t.endTime ? `${t.time}~${t.endTime}` : t.time) : t.type === 'todo' ? '' : '종일';
  const repeat = { weekly: '매주', monthly: '매월', yearly: '매년' }[t.repeat];
  return `<div class="quest ${done ? 'done' : ''}" style="--c:${taskColor(ctx.state, t)}" data-key="task:${t.id}:${day}">
    <button class="chk" data-act="toggle-task" data-id="${t.id}" data-day="${day}" ${future ? 'disabled title="아직 오지 않은 일정이에요"' : 'title="완료"'}>${uiIcon('check', 2)}</button>
    <div class="q-body" data-act="edit-task" data-id="${t.id}" title="눌러서 수정">
      <div class="q-title">${esc(t.title)}</div>
      <div class="q-meta">${groupTag}${catIcon(t.category, 1)}<span>${cat.label}</span>${span ? `<span>${span}</span>` : ''}${when ? `<span>${when}</span>` : ''}${repeat ? `<span>↻ ${repeat}</span>` : ''}${late ? `<span class="late">${late}일 지남</span>` : ''}<span class="stars">${stars((DIFFICULTIES[t.difficulty] || DIFFICULTIES.normal).stars)}</span></div>
    </div>
  </div>`;
}

export function dailyRow(ctx, d, day) {
  const done = isDailyDone(d, day);
  const cat = CATEGORIES[d.category] || CATEGORIES.todo;
  const streak = computeStreak(d, day);
  return `<div class="quest ${done ? 'done' : ''}" style="--c:${cat.color}" data-key="daily:${d.id}:${day}">
    <button class="chk" data-act="toggle-daily" data-id="${d.id}" data-day="${day}" title="완료">${uiIcon('check', 2)}</button>
    <div class="q-body" data-act="edit-daily" data-id="${d.id}" title="눌러서 수정">
      <div class="q-title">${esc(d.title)}</div>
      <div class="q-meta">${d.time ? `<span>${d.time}</span>` : ''}${streak >= 2 ? `<span class="streak">${uiIcon('flame', 1)}${streak}일 연속</span>` : ''}<span class="stars">${stars((DIFFICULTIES[d.difficulty] || DIFFICULTIES.normal).stars)}</span></div>
    </div>
  </div>`;
}

export const rowActions = {
  'toggle-task': (el, ctx) => ctx.complete('task/toggle', { id: el.dataset.id, occurrence: el.dataset.day }, `task:${el.dataset.id}:${el.dataset.day}`),
  'toggle-daily': (el, ctx) => ctx.complete('daily/toggle', { id: el.dataset.id, day: el.dataset.day }, `daily:${el.dataset.id}:${el.dataset.day}`),
  'edit-task': (el, ctx) => {
    const task = ctx.state.tasks.find((t) => t.id === el.dataset.id);
    if (task) openTaskForm(ctx, { task });
  },
  'edit-daily': (el, ctx) => {
    const daily = ctx.state.dailies.find((d) => d.id === el.dataset.id);
    if (daily) openDailyForm(ctx, { daily });
  },
};
