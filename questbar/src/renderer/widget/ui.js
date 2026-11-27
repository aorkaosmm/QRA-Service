// 위젯 공용 UI 도우미: 이스케이프, 토스트, 떠오르는 글자, 모달, 확인창
import { uiIcon } from '../shared/sprite-canvas.js';

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const stars = (n) => '★'.repeat(n);

export function timeAgo(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const root = () => document.getElementById('app');

export function toast(html, { kind = '', life = 2400 } = {}) {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.style.setProperty('--life', `${life}ms`);
  el.innerHTML = html;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => el.remove(), life + 400);
}

/** 요소 위에서 글자가 떠오른다 */
export function floatText(anchor, html, { cls = '', dx = 0, dy = 0, delay = 0 } = {}) {
  const host = root();
  if (!host) return;
  const hostRect = host.getBoundingClientRect();
  const r = anchor ? anchor.getBoundingClientRect() : { left: hostRect.left + hostRect.width / 2, top: hostRect.top + 80, width: 0 };
  const el = document.createElement('div');
  el.className = `float-text ${cls}`;
  el.innerHTML = html;
  el.style.left = `${r.left - hostRect.left + r.width / 2 - 20 + dx}px`;
  el.style.top = `${r.top - hostRect.top - 6 + dy}px`;
  el.style.animationDelay = `${delay}ms`;
  el.style.opacity = '0';
  host.appendChild(el);
  setTimeout(() => el.remove(), 1300 + delay);
}

let modalClose = null;

/** 모달 열기. mount(el, close) 에서 이벤트 연결 */
export function openModal(html, mount, { dismissible = true } = {}) {
  closeModal();
  const holder = document.getElementById('modal-root');
  holder.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog">${html}</div></div>`;
  const backdrop = holder.firstElementChild;
  const modal = backdrop.firstElementChild;
  const close = () => {
    holder.innerHTML = '';
    document.removeEventListener('keydown', onKey);
    modalClose = null;
  };
  const onKey = (e) => {
    if (e.key === 'Escape' && dismissible) close();
  };
  document.addEventListener('keydown', onKey);
  if (dismissible) backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
  modalClose = close;
  if (mount) mount(modal, close);
  const first = modal.querySelector('[autofocus]');
  if (first) setTimeout(() => first.focus(), 30);
  return close;
}

export function closeModal() {
  if (modalClose) modalClose();
}

export const isModalOpen = () => Boolean(modalClose);

export function confirmDialog(message, { ok = '확인', danger = false } = {}) {
  return new Promise((resolve) => {
    openModal(
      `<h3>${uiIcon('lock', 1)} 확인</h3><p style="margin:0 0 4px">${message}</p>
       <div class="modal-actions"><span class="spacer"></span>
       <button class="btn ghost" data-r="0">취소</button>
       <button class="btn ${danger ? 'danger' : 'primary'}" data-r="1" autofocus>${esc(ok)}</button></div>`,
      (el, close) => {
        el.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', () => {
          close();
          resolve(b.dataset.r === '1');
        }));
      },
    );
  });
}
