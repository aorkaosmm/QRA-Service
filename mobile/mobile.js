// Calendar RPG 모바일 시안 진입점.
// Windows 앱과 같은 게임 엔진·화면 코드를 브라우저 안 백엔드로 돌린다.
import { createWebBackend } from '../desktop/src/renderer/shared/web-backend.js';
import { rasterize } from '../desktop/src/shared/pixel.js';
import { SLIME_FRAMES, SLIME_COLORS, CROWN, CROWN_PALETTE } from '../desktop/src/shared/sprites.js';

/** 왕관 쓴 슬라임 앱 아이콘 (Windows 아이콘과 같은 그림) */
function appIconURL(size = 64) {
  const c = document.createElement('canvas');
  c.width = 16;
  c.height = 16;
  const g = c.getContext('2d');
  const slime = rasterize(SLIME_FRAMES.idle, SLIME_COLORS.green);
  const crown = rasterize(CROWN, CROWN_PALETTE);
  const put = (img, dx, dy) => {
    const tmp = document.createElement('canvas');
    tmp.width = img.w;
    tmp.height = img.h;
    tmp.getContext('2d').putImageData(new ImageData(img.data, img.w, img.h), 0, 0);
    g.drawImage(tmp, dx, dy);
  };
  put(slime, -1, 3);
  put(crown, 4, 0);
  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const o = out.getContext('2d');
  o.imageSmoothingEnabled = false;
  o.drawImage(c, 0, 0, size, size);
  return out.toDataURL();
}

/** 좁은 화면에서는 위 탭으로 한 면씩 보여 준다 (주소 #app · #widgets · #mobile-info) */
function setupPanes() {
  const panes = ['app', 'widgets', 'mobile-info'];
  const links = [...document.querySelectorAll('.pane-nav a')];
  const show = () => {
    const want = location.hash.replace('#', '');
    const name = panes.includes(want) ? want : 'app';
    for (const p of panes) document.getElementById(`pane-${p}`).classList.toggle('active', p === name);
    links.forEach((a) => a.classList.toggle('on', a.dataset.pane === name));
    return name;
  };
  window.addEventListener('hashchange', () => {
    const name = show();
    // 넓은 화면에서는 세 면이 다 보이므로 해당 면으로 스크롤
    if (window.matchMedia('(min-width: 861px)').matches) {
      document.getElementById(`pane-${name}`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
  });
  show();
}

function tickClocks() {
  const d = new Date();
  const t = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  for (const id of ['clock-app', 'clock-android', 'clock-ios']) {
    const el = document.getElementById(id);
    if (el) el.textContent = t;
  }
}

(async () => {
  // 위젯 화면·전투·홈 화면 위젯이 모두 이 하나의 백엔드(상태)를 함께 쓴다
  window.calendarRpg = createWebBackend();
  const icon = appIconURL(64);
  document.getElementById('brand-icon').src = icon;
  const appIcon = document.getElementById('app-icon-a');
  if (appIcon) appIcon.src = icon;
  setupPanes();
  tickClocks();
  setInterval(tickClocks, 15000);
  await import('../desktop/src/renderer/widget/widget.js');
  await import('../desktop/src/renderer/battle/battle.js');
  const { mountPreviews } = await import('./previews.js');
  mountPreviews(window.calendarRpg);
})().catch((err) => console.error('[mobile]', err));
