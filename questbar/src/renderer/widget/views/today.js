// 오늘 탭: 진행도, 빠른 추가, 일정·할 일·일일임무(분류별)
import { CATEGORIES, CATEGORY_ORDER } from '../../../core/constants.js';
import { dailiesForDay, isDailyDone, overdueTodos, isTaskDone } from '../../../core/selectors.js';
import { formatKo } from '../../../core/dates.js';
import { uiIcon, catIcon } from '../../shared/sprite-canvas.js';
import { taskRow, dailyRow } from './rows.js';
import { openDailyForm, openTaskForm } from '../forms.js';
import { esc } from '../ui.js';

export const todayView = {
  signature(ctx) {
    const { state } = ctx;
    return JSON.stringify([ctx.today, state.tasks, state.dailies, state.perfectDays[ctx.today]]);
  },

  render(ctx) {
    const { state, today } = ctx;
    const tasks = ctx.tasksFor(today);
    const events = tasks.filter((t) => t.type === 'event');
    const todos = tasks.filter((t) => t.type === 'todo');
    const overdue = overdueTodos(state, today);
    const dailies = dailiesForDay(state, today);
    const dDone = dailies.filter((d) => isDailyDone(d, today)).length;
    const tDone = tasks.filter((t) => isTaskDone(t, today)).length;
    const total = dailies.length + tasks.length;
    const done = dDone + tDone;
    const left = dailies.length - dDone;
    const perfect = state.perfectDays[today];
    const hint = !dailies.length ? '' : perfect ? '퍼펙트 데이 달성! 보너스 상자 획득' : `퍼펙트 데이까지 일일임무 ${left}개`;

    const groups = CATEGORY_ORDER
      .map((cat) => ({ cat, list: dailies.filter((d) => d.category === cat) }))
      .filter((g) => g.list.length)
      .map((g) => {
        const gDone = g.list.filter((d) => isDailyDone(d, today)).length;
        return `<div class="cat-group">
          <div class="cat-head">${catIcon(g.cat, 1)} <b>${CATEGORIES[g.cat].label}</b> <span>${gDone}/${g.list.length}</span></div>
          ${g.list.map((d) => dailyRow(ctx, d, today)).join('')}
        </div>`;
      }).join('');

    return `
      <div class="progress-card">
        <div class="top"><span class="big">${formatKo(today)}</span><span>오늘의 임무</span><span class="hint">${hint}</span></div>
        <div class="bar ok"><i style="width:${total ? Math.round((done / total) * 100) : 0}%"></i><span>${done} / ${total} 완료</span></div>
      </div>
      <div class="quick-add">
        <input type="text" id="quick-todo" maxlength="60" placeholder="오늘 할 일 빠르게 추가 (Enter)">
        <button class="btn primary" data-act="quick-add" title="추가">${uiIcon('plus', 1)}</button>
        <button class="btn" data-act="new-task" title="자세히 추가">${uiIcon('calendar', 1)}</button>
      </div>
      ${events.length ? `<div class="section-title">${uiIcon('calendar', 1)} 오늘 일정 <span class="count">${events.length}</span></div>${events.map((t) => taskRow(ctx, t, today)).join('')}` : ''}
      ${todos.length || overdue.length ? `<div class="section-title">${catIcon('todo', 1)} 할 일 <span class="count">${todos.length + overdue.length}</span></div>
        ${overdue.map((t) => taskRow(ctx, t, t.date)).join('')}${todos.map((t) => taskRow(ctx, t, today)).join('')}` : ''}
      <div class="section-title">${uiIcon('sword', 1)} 일일임무 <span class="count">${dDone}/${dailies.length}</span></div>
      ${groups || '<div class="empty">오늘 예정된 일일임무가 없어요.</div>'}
      <button class="btn block ghost" style="margin-top:6px" data-act="new-daily">${uiIcon('plus', 1)} 일일임무 추가 (공부·업무·식사…)</button>`;
  },

  bind(root, ctx) {
    const input = root.querySelector('#quick-todo');
    if (!input) return;
    if (ctx.ui.quickDraft) input.value = ctx.ui.quickDraft;
    input.addEventListener('input', () => { ctx.ui.quickDraft = input.value; });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) todayView.actions['quick-add'](null, ctx);
    });
  },

  actions: {
    'quick-add': async (_el, ctx) => {
      const input = document.getElementById('quick-todo');
      const title = input ? input.value.trim() : '';
      if (!title) {
        if (input) input.focus();
        return;
      }
      const res = await ctx.act('task/add', { type: 'todo', title, date: ctx.today, category: 'todo', difficulty: 'normal' });
      if (res.ok) {
        ctx.ui.quickDraft = '';
        const again = document.getElementById('quick-todo');
        if (again) { again.value = ''; again.focus(); }
      }
    },
    'new-daily': (_el, ctx) => openDailyForm(ctx),
    'new-task': (_el, ctx) => openTaskForm(ctx, { type: 'todo', date: ctx.today, task: null }),
  },
};

export { esc };
