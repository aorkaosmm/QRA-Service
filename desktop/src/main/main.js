// Calendar RPG 메인 프로세스: 게임 상태(단일 진실 원천) 보관, 위젯·전투 창 관리, 트레이, 알림.
import {
  app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, Notification,
  globalShortcut, dialog, shell, powerMonitor,
} from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Store, migrateLegacyData } from './store.js';
import { applyAction, createInitialState, migrate, ActionError } from '../core/engine.js';
import { dayKey, timeToMinutes } from '../core/dates.js';
import { timedItemsForDay } from '../core/selectors.js';
import { FIELD_BOSS } from '../core/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const PRELOAD = path.join(__dirname, 'preload.cjs');
const ICON = path.join(ROOT, 'assets', 'icons', 'icon.png');
const TRAY_ICON = path.join(ROOT, 'assets', 'icons', 'tray.png');
// Windows 알림은 asar 안의 파일을 못 읽으므로 풀어 둔 경로(app.asar.unpacked)를 쓴다
const NOTIFY_ICON = ICON.replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);

const argValue = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`${name}=`));
  return hit ? hit.slice(name.length + 1) : null;
};
const IS_DEV = process.argv.includes('--dev');
const IS_SMOKE = process.argv.includes('--smoke-test');
const BATTLE_HEIGHT = 190; // 투명·클릭 통과 영역이라 넉넉하게 (보상 연출 공간)

if (IS_SMOKE) {
  // 스모크 테스트는 실제 데이터를 건드리지 않도록 임시 폴더 사용
  app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'calendar-rpg-smoke-')));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.setAppUserModelId('com.calendarrpg.app');

let store = null;
let state = null;
let widgetWin = null;
let battleWin = null;
let tray = null;
let quitting = false;
let battleHiddenByClose = false; // ✕로 닫으면 용사도 숨김 → 위젯을 다시 열 때 함께 복귀
let lastHp = null;
let lastDay = null;
const notified = new Set();
const rendererErrors = [];

/* ───────────── 상태 & 액션 ───────────── */

function loadState() {
  const raw = store.load();
  if (!raw) return createInitialState();
  try {
    return migrate(raw);
  } catch (err) {
    console.error('[state] 저장 데이터 복구 실패, 새로 시작합니다:', err.message);
    return createInitialState();
  }
}

function broadcast(channel, payload) {
  for (const win of [widgetWin, battleWin]) {
    if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
  }
}

function dispatch(action, { silent = false } = {}) {
  const prev = state;
  const { state: next, events } = applyAction(state, action);
  state = next;
  store.save(state);
  broadcast('rpg:state', state);
  if (events.length && !silent) broadcast('rpg:events', events);
  applySettingsDiff(prev.settings, state.settings);
  if (action.type.startsWith('settings/') || action.type.startsWith('data/')) refreshTray();
  return events;
}

function applySettingsDiff(a, b) {
  if (!widgetWin || widgetWin.isDestroyed()) return;
  if (a.widgetAlwaysOnTop !== b.widgetAlwaysOnTop) widgetWin.setAlwaysOnTop(b.widgetAlwaysOnTop);
  if (a.battleEnabled !== b.battleEnabled) setBattleVisible(b.battleEnabled);
  if (a.launchAtLogin !== b.launchAtLogin) applyLoginItem(b.launchAtLogin);
}

function applyLoginItem(enabled) {
  if (IS_SMOKE || !app.isPackaged) return; // 개발 실행 중에는 등록하지 않음
  // 포터블 exe는 임시 폴더에서 실행되므로 원래 exe 경로를 등록
  const exe = process.env.PORTABLE_EXECUTABLE_FILE || process.execPath;
  app.setLoginItemSettings({ openAtLogin: enabled, path: exe });
}

/* ───────────── 위젯 창 ───────────── */

function defaultWidgetBounds() {
  const wa = screen.getPrimaryDisplay().workArea;
  const width = 400;
  const height = Math.min(720, wa.height - 48);
  return { x: wa.x + wa.width - width - 24, y: wa.y + 24, width, height };
}

function visibleBounds(b) {
  if (!b || typeof b.x !== 'number') return null;
  const hit = screen.getAllDisplays().some((d) => {
    const wa = d.workArea;
    return b.x + 60 > wa.x && b.x < wa.x + wa.width - 60 && b.y >= wa.y - 10 && b.y < wa.y + wa.height - 60;
  });
  return hit ? b : null;
}

function createWidget() {
  const saved = store.readJSON('window-state.json', {});
  const bounds = visibleBounds(saved.widget) || defaultWidgetBounds();
  widgetWin = new BrowserWindow({
    ...bounds,
    minWidth: 340,
    minHeight: 460,
    frame: false,
    transparent: true,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: state.settings.widgetAlwaysOnTop,
    show: false,
    backgroundColor: '#00000000',
    title: 'Calendar RPG',
    icon: ICON,
    webPreferences: { preload: PRELOAD, contextIsolation: true, sandbox: true, nodeIntegration: false },
  });
  hardenContents(widgetWin);
  widgetWin.loadFile(path.join(ROOT, 'src', 'renderer', 'widget', 'index.html'));
  widgetWin.once('ready-to-show', () => {
    if (!process.argv.includes('--hidden')) widgetWin.show();
    if (IS_DEV) widgetWin.webContents.openDevTools({ mode: 'detach' });
  });
  widgetWin.on('close', (e) => {
    if (!quitting) {
      e.preventDefault();
      hideAll();
    }
  });
  // Windows 종료·로그오프 때는 숨기지 말고 저장 후 닫히게 한다
  const endSession = () => {
    quitting = true;
    if (store) store.flush();
  };
  widgetWin.on('query-session-end', endSession);
  widgetWin.on('session-end', endSession);
  let t = null;
  const remember = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (widgetWin && !widgetWin.isDestroyed()) {
        store.writeJSON('window-state.json', { ...store.readJSON('window-state.json', {}), widget: widgetWin.getBounds() });
      }
    }, 500);
  };
  widgetWin.on('moved', remember);
  widgetWin.on('resized', remember);
}

function showWidget() {
  if (!widgetWin || widgetWin.isDestroyed()) createWidget();
  if (widgetWin.isMinimized()) widgetWin.restore();
  widgetWin.show();
  widgetWin.focus();
  if (battleHiddenByClose) {
    battleHiddenByClose = false;
    if (state.settings.battleEnabled) setBattleVisible(true);
  }
}

/** ✕ 버튼: 위젯과 작업표시줄 용사를 모두 숨긴다 (트레이에는 남음) */
function hideAll() {
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.hide();
  if (battleWin && !battleWin.isDestroyed() && battleWin.isVisible()) {
    battleWin.hide();
    battleHiddenByClose = true;
  }
}

/** 최소화: 위젯만 숨기고 작업표시줄 용사는 남긴다 */
function minimizeWidget() {
  if (widgetWin && !widgetWin.isDestroyed()) widgetWin.hide();
}

function toggleWidget() {
  if (widgetWin && widgetWin.isVisible() && widgetWin.isFocused()) minimizeWidget();
  else showWidget();
}

/* ───────────── 작업표시줄 전투 창 ───────────── */

/** 작업표시줄 바로 위 띠 영역. 작업표시줄이 아래가 아니면(또는 자동 숨김) 화면 맨 아래 */
function battleBounds() {
  const d = screen.getPrimaryDisplay();
  const { bounds, workArea } = d;
  const taskbarAtBottom = workArea.y + workArea.height < bounds.y + bounds.height;
  const groundY = taskbarAtBottom ? workArea.y + workArea.height : bounds.y + bounds.height;
  return { x: workArea.x, y: groundY - BATTLE_HEIGHT, width: workArea.width, height: BATTLE_HEIGHT };
}

function createBattle() {
  battleWin = new BrowserWindow({
    ...battleBounds(),
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    title: 'Calendar RPG Battle',
    webPreferences: {
      preload: PRELOAD, contextIsolation: true, sandbox: true, nodeIntegration: false, backgroundThrottling: false,
    },
  });
  hardenContents(battleWin);
  battleWin.setAlwaysOnTop(true, 'screen-saver');
  battleWin.setIgnoreMouseEvents(true, { forward: true });
  battleWin.loadFile(path.join(ROOT, 'src', 'renderer', 'battle', 'index.html'));
  battleWin.once('ready-to-show', () => {
    if (state.settings.battleEnabled) battleWin.showInactive();
  });
}

function layoutBattle() {
  if (!battleWin || battleWin.isDestroyed()) return;
  battleWin.setBounds(battleBounds());
  battleWin.webContents.send('rpg:layout', battleBounds());
}

function setBattleVisible(visible) {
  if (!battleWin || battleWin.isDestroyed()) return;
  if (visible) {
    layoutBattle();
    battleWin.showInactive();
  } else {
    battleWin.hide();
  }
}

/* ───────────── 공통 보안 설정 ───────────── */

function hardenContents(win) {
  const wc = win.webContents;
  wc.setWindowOpenHandler(() => ({ action: 'deny' }));
  wc.on('will-navigate', (e) => e.preventDefault());
  wc.on('console-message', (...args) => {
    // Electron 버전에 따라 (event, level, message) 또는 (event{level,message}) 형태
    const ev = args[0];
    const level = typeof args[1] === 'number' ? args[1] : ev.level;
    const message = typeof args[2] === 'string' ? args[2] : ev.message;
    const isError = level === 3 || level === 'error';
    if (isError) rendererErrors.push(String(message));
    if (IS_DEV || IS_SMOKE) console.log(`[renderer:${win.getTitle()}] ${message}`);
  });
  wc.on('render-process-gone', (_e, details) => rendererErrors.push(`render-process-gone: ${details.reason}`));
  wc.on('preload-error', (_e, _p, err) => rendererErrors.push(`preload-error: ${err.message}`));
}

/* ───────────── 트레이 ───────────── */

function trayImage() {
  // tray.png + tray@2x.png 를 두면 고해상도 화면에서 자동으로 2배 이미지를 고른다
  return nativeImage.createFromPath(TRAY_ICON);
}

function createTray() {
  tray = new Tray(trayImage());
  tray.setToolTip('Calendar RPG — 오늘의 임무');
  tray.on('click', () => toggleWidget());
  refreshTray();
}

function refreshTray() {
  if (!tray) return;
  const s = state.settings;
  const set = (patch) => dispatch({ type: 'settings/update', payload: { patch } });
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Calendar RPG 열기', click: () => showWidget() },
    { label: '모두 숨기기 (용사 포함)', click: () => hideAll() },
    { type: 'separator' },
    { label: '작업표시줄 전투 표시', type: 'checkbox', checked: s.battleEnabled, click: (m) => set({ battleEnabled: m.checked }) },
    { label: '위젯 항상 위에 표시', type: 'checkbox', checked: s.widgetAlwaysOnTop, click: (m) => set({ widgetAlwaysOnTop: m.checked }) },
    { label: '일정 알림', type: 'checkbox', checked: s.notifications, click: (m) => set({ notifications: m.checked }) },
    { label: 'Windows 시작 시 실행', type: 'checkbox', checked: s.launchAtLogin, enabled: app.isPackaged, click: (m) => set({ launchAtLogin: m.checked }) },
    { type: 'separator' },
    { label: '데이터 폴더 열기', click: () => shell.openPath(app.getPath('userData')) },
    { label: '종료', click: () => { quitting = true; app.quit(); } },
  ]));
}

/* ───────────── 날짜 변경 · 알림 ───────────── */

function tick() {
  const today = dayKey(Date.now(), state.settings.dayStartHour);
  const now = Date.now();
  // 날짜가 바뀌었거나, 경매장 매물이 팔릴(끝날) 시각이 지났으면 엔진을 깨운다
  const auctionDue = ((state.auction && state.auction.listings) || []).some((l) => (l.sellAt && now >= l.sellAt) || now >= l.expiresAt);
  if (today !== lastDay || auctionDue) {
    lastDay = today;
    dispatch({ type: 'system/tick' });
  }
  checkReminders(today);
}

function checkReminders(today) {
  if (!state.settings.notifications || !Notification.isSupported()) return;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const lead = state.settings.notifyLeadMinutes || 0;
  for (const item of timedItemsForDay(state, today)) {
    const at = timeToMinutes(item.time) - lead;
    const key = `${today}|${item.kind}|${item.id}|${item.time}`;
    if (notified.has(key)) continue;
    // 알림 시각이 지났고 10분 이내인 것만 (앱을 늦게 켰을 때 몰아서 울리지 않도록)
    if (nowMin >= at && nowMin - at <= 10) {
      notified.add(key);
      const title = item.kind === 'daily' ? '⚔ 일일임무 시간이에요' : '📅 일정 알림';
      const body = `${item.time} ${item.title}${lead ? ` (${lead}분 전)` : ''}`;
      const n = new Notification({ title, body, icon: NOTIFY_ICON, silent: false });
      n.on('click', () => showWidget());
      n.show();
    }
  }
  // 필드 보스 예고: 오후 8시 55분 ~ 9시 4분 사이에 하루 한 번 (이미 입장했으면 생략)
  const openMin = FIELD_BOSS.openHour * 60;
  const fbKey = `${today}|fieldBoss`;
  const fb = state.fieldBoss || {};
  const entered = fb.enteredAt && new Date(fb.enteredAt).toDateString() === now.toDateString();
  if (!notified.has(fbKey) && !entered && nowMin >= openMin - 5 && nowMin < openMin + 5) {
    notified.add(fbKey);
    const body = nowMin < openMin ? `오후 9시에 ${FIELD_BOSS.name}이(가) 나타나요! (5분 · 20명)` : `${FIELD_BOSS.name} 출현! 위젯의 던전 탭에서 입장하세요`;
    const n = new Notification({ title: '⚔ 필드 보스', body, icon: NOTIFY_ICON, silent: false });
    n.on('click', () => showWidget());
    n.show();
  }
}

/* ───────────── IPC ───────────── */

function registerIpc() {
  ipcMain.handle('rpg:init', () => ({ state, platform: process.platform, version: app.getVersion() }));

  ipcMain.handle('rpg:dispatch', (_e, action) => {
    try {
      return { ok: true, events: dispatch(action) };
    } catch (err) {
      if (err instanceof ActionError) return { ok: false, error: err.message };
      console.error('[dispatch]', err);
      return { ok: false, error: '처리 중 오류가 발생했어요.' };
    }
  });

  ipcMain.on('rpg:battle-report', (_e, report) => {
    try {
      dispatch({ type: 'battle/report', payload: report }, { silent: true });
    } catch (err) {
      console.error('[battle-report]', err.message);
    }
  });

  ipcMain.on('rpg:set-ignore-mouse', (_e, ignore) => {
    if (!battleWin || battleWin.isDestroyed()) return;
    if (ignore || !state.settings.battleInteractive) battleWin.setIgnoreMouseEvents(true, { forward: true });
    else battleWin.setIgnoreMouseEvents(false);
  });

  ipcMain.on('rpg:window', (e, cmd) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (!win || win !== widgetWin) return;
    if (cmd && typeof cmd === 'object' && cmd.type === 'resize') {
      const [minW, minH] = win.getMinimumSize();
      const wa = screen.getDisplayMatching(win.getBounds()).workArea;
      const width = Math.round(Math.min(wa.width, Math.max(minW, Number(cmd.width) || minW)));
      const height = Math.round(Math.min(wa.height, Math.max(minH, Number(cmd.height) || minH)));
      win.setSize(width, height);
      return;
    }
    if (cmd && typeof cmd === 'object' && cmd.type === 'resize-end') {
      win.emit('resized');
      return;
    }
    if (cmd === 'hide') hideAll();
    if (cmd === 'minimize') minimizeWidget();
    if (cmd === 'toggle-pin') dispatch({ type: 'settings/update', payload: { patch: { widgetAlwaysOnTop: !state.settings.widgetAlwaysOnTop } } });
  });

  ipcMain.on('rpg:open-widget', () => showWidget());

  // 작업표시줄 용사의 현재 체력 → 위젯 머리말 체력바
  ipcMain.on('rpg:hp', (_e, hp) => {
    lastHp = hp;
    if (widgetWin && !widgetWin.isDestroyed()) widgetWin.webContents.send('rpg:hp', hp);
  });
  ipcMain.handle('rpg:get-hp', () => lastHp);

  ipcMain.handle('rpg:export', async () => {
    const stamp = dayKey(Date.now(), 0);
    const res = await dialog.showSaveDialog(widgetWin, {
      title: 'Calendar RPG 데이터 내보내기',
      defaultPath: path.join(app.getPath('documents'), `calendar-rpg-backup-${stamp}.json`),
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (res.canceled || !res.filePath) return { ok: false, canceled: true };
    fs.writeFileSync(res.filePath, JSON.stringify(state, null, 2), 'utf8');
    return { ok: true, path: res.filePath };
  });

  ipcMain.handle('rpg:import', async () => {
    const res = await dialog.showOpenDialog(widgetWin, {
      title: 'Calendar RPG 데이터 가져오기',
      properties: ['openFile'],
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true };
    try {
      const raw = JSON.parse(fs.readFileSync(res.filePaths[0], 'utf8'));
      dispatch({ type: 'data/replace', payload: { state: raw } });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof ActionError ? err.message : '파일을 읽을 수 없어요.' };
    }
  });

  ipcMain.on('rpg:open-data-folder', () => shell.openPath(app.getPath('userData')));
}

/* ───────────── 스모크 테스트 (CI·개발용) ───────────── */

async function runSmokeTest() {
  const outDir = argValue('--smoke-out') || app.getPath('temp');
  fs.mkdirSync(outDir, { recursive: true });
  await new Promise((r) => setTimeout(r, 3500));
  const result = { ok: true, errors: [] };
  try {
    // 실제 액션 경로 점검: 첫 번째 할 일 완료 → 보상 이벤트
    const todo = state.tasks[0];
    const events = dispatch({ type: 'task/toggle', payload: { id: todo.id } });
    result.rewardEvent = events.find((e) => e.type === 'reward') || null;
    await new Promise((r) => setTimeout(r, 2500));
    result.widgetBounds = widgetWin.getBounds();
    result.battleBounds = battleWin.getBounds();
    result.workArea = screen.getPrimaryDisplay().workArea;
    for (const [name, win] of [['widget', widgetWin], ['battle', battleWin]]) {
      const img = await win.webContents.capturePage();
      fs.writeFileSync(path.join(outDir, `smoke-${name}.png`), img.toPNG());
    }
    result.questsDone = state.stats.questsDone;
  } catch (err) {
    result.ok = false;
    result.errors.push(String(err && err.stack || err));
  }
  result.errors.push(...rendererErrors);
  if (rendererErrors.length) result.ok = false;
  fs.writeFileSync(path.join(outDir, 'smoke-result.json'), JSON.stringify(result, null, 2));
  console.log(`SMOKE_RESULT ${JSON.stringify(result)}`);
  quitting = true;
  app.exit(result.ok ? 0 : 1);
}

/* ───────────── 앱 수명주기 ───────────── */

app.on('second-instance', () => showWidget());

app.whenReady().then(() => {
  if (!IS_SMOKE) {
    try {
      const from = migrateLegacyData(app.getPath('userData'), [path.join(app.getPath('appData'), 'QuestBar')]);
      if (from) console.log('[migrate] 이전 QuestBar 데이터를 옮겼습니다:', from);
    } catch (err) {
      console.error('[migrate] 이전 데이터 이동 실패:', err.message);
    }
  }
  store = new Store(app.getPath('userData'));
  state = loadState();
  lastDay = dayKey(Date.now(), state.settings.dayStartHour);
  registerIpc();
  createWidget();
  createBattle();
  createTray();
  applyLoginItem(state.settings.launchAtLogin);

  try {
    globalShortcut.register('Control+Alt+Q', () => toggleWidget());
    globalShortcut.register('Control+Alt+B', () => dispatch({ type: 'settings/update', payload: { patch: { battleEnabled: !state.settings.battleEnabled } } }));
  } catch (err) {
    console.warn('[shortcut] 단축키 등록 실패:', err.message);
  }

  screen.on('display-metrics-changed', layoutBattle);
  screen.on('display-added', layoutBattle);
  screen.on('display-removed', layoutBattle);
  powerMonitor.on('resume', () => { tick(); layoutBattle(); });

  setInterval(tick, 30 * 1000);
  // 작업표시줄을 클릭하면 z-순서가 밀릴 수 있어 주기적으로 맨 위로
  setInterval(() => {
    if (battleWin && !battleWin.isDestroyed() && battleWin.isVisible()) battleWin.moveTop();
  }, 10 * 1000);

  if (IS_SMOKE) runSmokeTest();
});

app.on('window-all-closed', () => {
  // 트레이 상주 앱: 창이 모두 닫혀도 종료하지 않음
});

app.on('before-quit', () => {
  quitting = true;
  if (store) store.flush();
});

app.on('will-quit', () => globalShortcut.unregisterAll());
