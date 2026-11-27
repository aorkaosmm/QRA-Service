// 상태에서 화면용 데이터를 뽑아내는 순수 함수들.

import { CATEGORY_ORDER, CATEGORIES, DEFAULT_GROUP_ID } from './constants.js';
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

/** 일정 기간(일수-1). 하루짜리면 0 */
export function taskDuration(task) {
  return task.endDate && task.endDate > task.date ? diffDays(task.date, task.endDate) : 0;
}

/** day 가 반복 규칙상 '시작일'이 될 수 있는가 */
function isStartDay(task, day) {
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

/** day 를 포함하는 회차의 시작일 (없으면 null). 완료 기록은 이 시작일 기준 */
export function occurrenceStart(task, day) {
  const dur = taskDuration(task);
  for (let k = 0; k <= dur; k++) {
    const s = addDays(day, -k);
    if (s < task.date) break;
    if (isStartDay(task, s)) return s;
  }
  return null;
}

export function occursOn(task, day) {
  return occurrenceStart(task, day) !== null;
}

/** 회차 종료일 */
export function occurrenceEnd(task, start) {
  return addDays(start, taskDuration(task));
}

export function isTaskDone(task, day) {
  const occ = occurrenceStart(task, day) || day;
  return Boolean(task.completions && task.completions[occ] && task.completions[occ].done);
}

/** 달력 표시 색: 그룹 색 → 없으면 분류 색 */
export function taskColor(state, task) {
  const g = (state.groups || []).find((x) => x.id === (task.groupId || DEFAULT_GROUP_ID));
  return (g && g.color) || (CATEGORIES[task.category] || CATEGORIES.todo).color;
}

/**
 * 한 주(7일) 안에 걸친 일정 막대들. 겹치지 않게 줄(lane)을 나눠 준다.
 * @returns [{ task, start, end, c1, c2, lane, contLeft, contRight, done }]
 */
export function weekSegments(state, weekDays) {
  const first = weekDays[0];
  const last = weekDays[6];
  const segs = [];
  for (const task of state.tasks) {
    const seen = new Set();
    for (const day of weekDays) {
      const start = occurrenceStart(task, day);
      if (!start || seen.has(start)) continue;
      seen.add(start);
      const end = occurrenceEnd(task, start);
      segs.push({
        task, start, end,
        c1: Math.max(0, diffDays(first, start)),
        c2: Math.min(6, diffDays(first, end)),
        contLeft: start < first,
        contRight: end > last,
        done: isTaskDone(task, start),
      });
    }
  }
  segs.sort((a, b) => a.c1 - b.c1
    || (b.c2 - b.c1) - (a.c2 - a.c1)
    || byTimeThen(a.task, b.task)
    || a.task.createdAt - b.task.createdAt);
  const lanes = [];
  for (const s of segs) {
    let lane = 0;
    while (lanes[lane] && lanes[lane].some((used, c) => used && c >= s.c1 && c <= s.c2)) lane++;
    if (!lanes[lane]) lanes[lane] = new Array(7).fill(false);
    for (let c = s.c1; c <= s.c2; c++) lanes[lane][c] = true;
    s.lane = lane;
  }
  return segs;
}

export function tasksForDay(state, day) {
  return state.tasks
    .filter((t) => occursOn(t, day))
    .sort((a, b) => taskDuration(b) - taskDuration(a)
      || byTimeThen(a, b)
      || (a.type === b.type ? 0 : a.type === 'event' ? -1 : 1)
      || a.createdAt - b.createdAt);
}

/** 기한이 지났는데 아직 안 끝낸 할 일 (최근 60일) */
export function overdueTodos(state, today) {
  return state.tasks
    .filter((t) => t.type === 'todo' && (t.endDate || t.date) < today && !isTaskDone(t, t.date) && diffDays(t.endDate || t.date, today) <= 60)
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
    // 여러 날 일정은 시작하는 날에만 알림
    if (t.time && occurrenceStart(t, day) === day && !isTaskDone(t, day)) out.push({ kind: 'task', id: t.id, title: t.title, time: t.time, category: t.category });
  }
  for (const d of dailiesForDay(state, day)) {
    if (d.time && !isDailyDone(d, day)) out.push({ kind: 'daily', id: d.id, title: d.title, time: d.time, category: d.category });
  }
  return out;
}
