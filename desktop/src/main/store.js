// 로컬 JSON 저장소. 원자적 쓰기(임시 파일 → 이름 바꾸기) + 주기적 백업.
import fs from 'node:fs';
import path from 'node:path';

const SAVE_FILE = 'calendar-rpg-save.json';
const BACKUP_FILE = 'calendar-rpg-save.backup.json';
const BACKUP_INTERVAL = 10 * 60 * 1000;

/**
 * 이전 이름(QuestBar)으로 저장된 데이터를 새 저장 위치로 한 번 복사한다.
 * dir = 새 userData 폴더, legacyDirs = 예전 userData 후보 폴더들
 */
export function migrateLegacyData(dir, legacyDirs) {
  const target = path.join(dir, SAVE_FILE);
  if (fs.existsSync(target)) return null;
  const candidates = [dir, ...legacyDirs].map((d) => path.join(d, 'questbar-save.json'));
  const src = candidates.find((f) => fs.existsSync(f));
  if (!src) return null;
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, target);
  for (const d of legacyDirs) {
    const win = path.join(d, 'window-state.json');
    const winTarget = path.join(dir, 'window-state.json');
    if (fs.existsSync(win) && !fs.existsSync(winTarget)) fs.copyFileSync(win, winTarget);
  }
  return src;
}

export class Store {
  constructor(dir) {
    this.dir = dir;
    this.file = path.join(dir, SAVE_FILE);
    this.backup = path.join(dir, BACKUP_FILE);
    this.timer = null;
    this.pending = null;
    this.lastBackup = 0;
    fs.mkdirSync(dir, { recursive: true });
  }

  /** 저장 데이터 읽기. 본 파일이 깨졌으면 백업에서 복구. 없으면 null */
  load() {
    for (const f of [this.file, this.backup]) {
      try {
        if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
      } catch (err) {
        console.error(`[store] ${path.basename(f)} 읽기 실패:`, err.message);
      }
    }
    return null;
  }

  /** 디바운스 저장 */
  save(state) {
    this.pending = state;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 400);
  }

  flush() {
    clearTimeout(this.timer);
    if (!this.pending) return;
    const data = JSON.stringify(this.pending);
    this.pending = null;
    writeAtomic(this.file, data);
    const now = Date.now();
    if (now - this.lastBackup > BACKUP_INTERVAL) {
      this.lastBackup = now;
      writeAtomic(this.backup, data);
    }
  }

  readJSON(name, fallback = null) {
    try {
      return JSON.parse(fs.readFileSync(path.join(this.dir, name), 'utf8'));
    } catch {
      return fallback;
    }
  }

  writeJSON(name, value) {
    writeAtomic(path.join(this.dir, name), JSON.stringify(value, null, 2));
  }
}

function writeAtomic(file, data) {
  const tmp = `${file}.tmp`;
  try {
    fs.writeFileSync(tmp, data, 'utf8');
    fs.renameSync(tmp, file);
  } catch (err) {
    // 백신 등이 파일을 잡고 있으면 이름 바꾸기가 실패할 수 있다 → 직접 쓰기
    try {
      fs.writeFileSync(file, data, 'utf8');
    } catch (err2) {
      console.error('[store] 저장 실패:', err2.message);
    }
  }
}
