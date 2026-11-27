// 상태에서 화면용 데이터를 뽑아내는 순수 함수들.

import { CATEGORY_ORDER } from './constants.js';
import { weekday, parseKey, addDays, diffDays, timeToMinutes, monthGrid } from './dates.js';
import { holidayName } from './holidays.js';

/* ── 일일임무 ─────────────────────────────── */

export function isDailyScheduled(daily, day) {
  if (daily.startDay && day < daily.startDay) return false;
  return daily.days.includes(weekday(day));
}

export function isDailyDone(daily, day) {
  return Boolean(daily.history && daily.history[day] && daily.history[day].done);
}

/**
 * 연속 달성 일수. day 당일이 아직 미완료면 당일은 건너뛰고(끊지 않고) 이전부터 센다.
 */
export function computeStreak(daily, day) {
  let streak = 0;
  let cursor = day;
  for (let i = 0; i < 400; i++) {
    if (daily.startDay && cursor < daily.startDay) break;
    if (isDailyScheduled(daily, cursor)) {
      if (isDailyDone(daily, cursor)) streak++;
      else if (cursor !== day) break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

const byTimeThen = (a, b) => {
  const ta = timeToMinutes(a.time);
  const tb = timeToMinutes(b.time);
  if (ta !== tb) {
    if (ta === null) return 1;
    if (tb === null) return -1;
    return ta - tb;
  }
  return 0;
};

export function dailiesForDay(state, day) {
  return state.dailies
    .filter((d) => isDailyScheduled(d, day))
    .sort((a, b) => byTimeThen(a, b)
      || CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
      || a.createdAt - b.createdAt);
}

/* ── 일정·할 일 ───────────────────────────── */

export function occursOn(task, day) {
  if (day < task.date) return false;
  const rep = task.repeat || 'none';
  if (rep === 'none') return day === task.date;
  const a = parseKey(task.date);
  const b = parseKey(day);
  switch (rep) {
    case 'weekly': return a.getDay() === b.getDay();
    case 'monthly': return a.getDate() === b.getDate();
    case 'yearly': return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
    default: return false;
  }
}

export function isTaskDone(task, occurrence) {
  return Boolean(task.completions && task.completions[occurrence] && task.completions[occurrence].done);
}

export function tasksForDay(state, day) {
  return state.tasks
    .filter((t) => occursOn(t, day))
    .sort((a, b) => byTimeThen(a, b)
      || (a.type === b.type ? 0 : a.type === 'event' ? -1 : 1)
      || a.createdAt - b.createdAt);
}

/** 기한이 지났는데 아직 안 끝낸 할 일 (최근 60일) */
export function overdueTodos(state, today) {
  return state.tasks
    .filter((t) => t.type === 'todo' && t.date < today && !isTaskDone(t, t.date) && diffDays(t.date, today) <= 60)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/* ── 요약 ─────────────────────────────────── */

export function dayProgress(state, day) {
  const dailies = dailiesForDay(state, day);
  const tasks = tasksForDay(state, day);
  const dailyDone = dailies.filter((d) => isDailyDone(d, day)).length;
  const taskDone = tasks.filter((t) => isTaskDone(t, day)).length;
  return {
    dailyTotal: dailies.length,
    dailyDone,
    taskTotal: tasks.length,
    taskDone,
    total: dailies.length + tasks.length,
    done: dailyDone + taskDone,
  };
}

export function daySummary(state, day) {
  return {
    day,
    holiday: holidayName(day),
    tasks: tasksForDay(state, day),
    perfect: Boolean(state.perfectDays[day]),
    ...dayProgress(state, day),
  };
}

/** 월간 달력 6주치 요약 */
export function monthSummary(state, year, month0) {
  return monthGrid(year, month0).map((day) => ({
    ...daySummary(state, day),
    inMonth: parseKey(day).getMonth() === month0,
  }));
}

/** 해당 날짜에 시각이 있는 알림 대상 (일정 + 일일임무) */
export function timedItemsForDay(state, day) {
  const out = [];
  for (const t of tasksForDay(state, day)) {
    if (t.time && !isTaskDone(t, day)) out.push({ kind: 'task', id: t.id, title: t.title, time: t.time, category: t.category });
  }
  for (const d of dailiesForDay(state, day)) {
    if (d.time && !isDailyDone(d, day)) out.push({ kind: 'daily', id: d.id, title: d.title, time: d.time, category: d.category });
  }
  return out;
}
