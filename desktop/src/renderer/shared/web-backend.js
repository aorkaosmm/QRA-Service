// Electron 없이(브라우저 미리보기·향후 웹/모바일) 같은 엔진을 돌리는 로컬 백엔드.
// window.calendarRpg 와 같은 모양의 API를 제공한다.
import { applyAction, createInitialState, migrate, ActionError } from '../../core/engine.js';

const KEY = 'calendar-rpg-web-save-v1';

export function createWebBackend({ storage = safeStorage() } = {}) {
  let state;
  try {
    const raw = storage.get(KEY);
    state = raw ? migrate(JSON.parse(raw)) : createInitialState();
  } catch {
    state = createInitialState();
  }
  const subs = { state: new Set(), events: new Set(), layout: new Set(), hp: new Set() };
  let lastHp = null;
  const emit = (ch, payload) => subs[ch].forEach((cb) => {
    try { cb(payload); } catch (err) { console.error(err); }
  });
  const save = () => storage.set(KEY, JSON.stringify(state));

  const run = (type, payload, { silent = false } = {}) => {
    try {
      const r = applyAction(state, { type, payload });
      state = r.state;
      save();
      emit('state', state);
      if (r.events.length && !silent) emit('events', r.events);
      return { ok: true, events: r.events };
    } catch (err) {
      if (err instanceof ActionError) return { ok: false, error: err.message };
      console.error(err);
      return { ok: false, error: '처리 중 오류가 발생했어요.' };
    }
  };

  const sub = (ch) => (cb) => {
    subs[ch].add(cb);
    return () => subs[ch].delete(cb);
  };

  return {
    isWeb: true,
    init: async () => ({ state, platform: 'web', version: 'web' }),
    dispatch: async (type, payload) => run(type, payload),
    onState: sub('state'),
    onEvents: sub('events'),
    onLayout: sub('layout'),
    onHp: sub('hp'),
    reportHp: (hp) => { lastHp = hp; emit('hp', hp); },
    getHp: async () => lastHp,
    battleReport: (report) => run('battle/report', report, { silent: true }),
    setIgnoreMouse: () => {},
    windowCmd: () => {},
    openWidget: () => {},
    openDataFolder: () => {},
    exportData: async () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'calendar-rpg-backup.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return { ok: true };
    },
    importData: () => new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) return resolve({ ok: false, canceled: true });
        try {
          resolve(run('data/replace', { state: JSON.parse(await file.text()) }));
        } catch {
          resolve({ ok: false, error: '파일을 읽을 수 없어요.' });
        }
      };
      input.click();
    }),
    /** 미리보기용: 전투 창 크기 변경 알림 */
    emitLayout: (bounds) => emit('layout', bounds),
  };
}

function safeStorage() {
  const mem = new Map();
  return {
    get(k) {
      try { return window.localStorage.getItem(k); } catch { return mem.get(k) ?? null; }
    },
    set(k, v) {
      try { window.localStorage.setItem(k, v); } catch { mem.set(k, v); }
    },
  };
}
