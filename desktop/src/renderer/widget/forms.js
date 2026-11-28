// 입력 폼·상세 모달: 일정/할 일, 일일임무, 장비 상세, 전리품
import {
  CATEGORIES, CATEGORY_ORDER, DIFFICULTIES, RARITIES, SLOTS, WEEKDAYS_KO, GROUP_COLORS, DEFAULT_GROUP_ID,
} from '../../core/constants.js';
import { heroStats } from '../../core/progression.js';
import { sellPrice, itemScore, weaponTypeOf } from '../../core/items.js';
import { classWeapon, WEAPON_LABELS } from '../../core/jobs.js';
import { uiIcon, catIcon, itemIcon } from '../shared/sprite-canvas.js';
import { esc, stars, openModal, confirmDialog } from './ui.js';

export const STAT_LABELS = { atk: '공격력', def: '방어력', hp: '체력', luck: '행운' };
export const SOURCE_LABELS = { quest: '임무 보상', daily: '임무 보상', task: '임무 보상', perfect: '퍼펙트 데이', levelup: '레벨 달성 보상', shop: '상점', starter: '기본 지급', fieldBoss: '필드 보스', raid: '레이드', job: '전직 기념', auction: '경매장' };

const seg = (name, options, value) => `<div class="seg" data-name="${name}">${options
  .map((o) => `<button type="button" data-v="${o.v}" class="${String(o.v) === String(value) ? 'on' : ''}">${o.html}</button>`)
  .join('')}</div>`;

function bindSeg(el, onChange, { multi = false } = {}) {
  const values = {};
  el.querySelectorAll('.seg').forEach((g) => {
    const name = g.dataset.name;
    const read = () => (multi && g.dataset.multi
      ? [...g.querySelectorAll('button.on')].map((b) => b.dataset.v)
      : (g.querySelector('button.on') || {}).dataset?.v);
    values[name] = read();
    g.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      if (g.dataset.multi) b.classList.toggle('on');
      else g.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      values[name] = read();
      onChange && onChange(name, values[name]);
    });
  });
  return values;
}

function rewardPreview(ctx, difficulty) {
  const d = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
  const st = heroStats(ctx.state);
  const drop = Math.round(Math.min(0.75, d.drop + st.dropBonus) * 100);
  return `예상 보상 · <b>${d.xp} EXP</b> · <b>${d.gold[0]}~${d.gold[1]}G</b> · 장비 드롭 <b>${drop}%</b>`;
}

const catOptions = () => CATEGORY_ORDER.map((k) => ({ v: k, html: `${catIcon(k, 1)} ${CATEGORIES[k].label}` }));
const diffOptions = () => Object.values(DIFFICULTIES).map((d) => ({ v: d.key, html: `${d.label} <span class="stars">${stars(d.stars)}</span>` }));

/* ── 일정 그룹 선택 상자 ─────────────────── */

export const groupDot = (g) => (g && g.color
  ? `<i class="gdot" style="--c:${g.color}"></i>`
  : '<i class="gdot auto" title="분류 색을 따름"></i>');

/** 그룹 선택 상자를 holder 안에 그리고 이벤트를 연결한다. 선택값은 holder.dataset.group */
export function mountGroupPicker(holder, ctx, selectedId) {
  const groups = ctx.state.groups || [];
  const cur = groups.find((g) => g.id === selectedId) || groups.find((g) => g.id === DEFAULT_GROUP_ID) || groups[0];
  holder.dataset.group = cur ? cur.id : DEFAULT_GROUP_ID;
  holder.classList.add('group-pick');
  holder.innerHTML = `
    <button type="button" class="group-btn" data-gp="toggle" title="일정 그룹">${groupDot(cur)}<span>${esc(cur ? cur.name : '기본')}</span><b>▾</b></button>
    <div class="group-menu" hidden>
      ${groups.map((g) => `<button type="button" data-gp="pick" data-id="${g.id}" class="${cur && g.id === cur.id ? 'on' : ''}">${groupDot(g)}<span>${esc(g.name)}</span>${g.id === DEFAULT_GROUP_ID ? '<em>분류 색</em>' : ''}</button>`).join('')}
      <div class="group-new">
        <input type="text" maxlength="12" placeholder="새 그룹 이름" data-gp="name">
        <div class="swatches">${GROUP_COLORS.map((c, i) => `<button type="button" data-gp="color" data-c="${c}" class="${i === groups.length % GROUP_COLORS.length ? 'on' : ''}" style="--c:${c}" title="${c}"></button>`).join('')}</div>
        <button type="button" class="btn small primary block" data-gp="add">+ 그룹 추가</button>
      </div>
    </div>`;
  const menu = holder.querySelector('.group-menu');
  const close = () => { menu.hidden = true; };
  const addGroup = async () => {
    const name = holder.querySelector('[data-gp=name]').value;
    const color = (holder.querySelector('[data-gp=color].on') || {}).dataset?.c;
    const res = await ctx.act('group/add', { name, color });
    if (res.ok) {
      const ev = res.events.find((e) => e.what === 'group');
      mountGroupPicker(holder, ctx, ev ? ev.id : holder.dataset.group);
    }
  };
  holder.onclick = (e) => {
    const b = e.target.closest('[data-gp]');
    if (!b) return;
    const kind = b.dataset.gp;
    if (kind === 'toggle') menu.hidden = !menu.hidden;
    if (kind === 'pick') { mountGroupPicker(holder, ctx, b.dataset.id); }
    if (kind === 'color') holder.querySelectorAll('[data-gp=color]').forEach((x) => x.classList.toggle('on', x === b));
    if (kind === 'add') addGroup();
  };
  holder.querySelector('[data-gp=name]').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.stopPropagation(); addGroup(); }
  });
  if (!holder.dataset.outsideBound) {
    holder.dataset.outsideBound = '1';
    document.addEventListener('mousedown', (e) => { if (!holder.contains(e.target)) close(); });
  }
}

/* ── 일정 / 할 일 ─────────────────────────── */

export function openTaskForm(ctx, { task = null, date = null, type = 'event' } = {}) {
  const t = task || {
    type, title: '', date: date || ctx.today, endDate: date || ctx.today, time: '', endTime: '',
    category: type === 'todo' ? 'todo' : 'life', difficulty: 'normal', repeat: 'none', memo: '', groupId: DEFAULT_GROUP_ID,
  };
  const edit = Boolean(task);
  const html = `
    <h3>${uiIcon('calendar', 1)} ${edit ? '일정 수정' : '새 일정 · 할 일'}</h3>
    <div class="field">${seg('type', [{ v: 'event', html: '일정 (날짜·시간)' }, { v: 'todo', html: '할 일 (끝낼 때까지)' }], t.type)}</div>
    <div class="field"><label>제목 · 일정 그룹</label>
      <div class="title-row">
        <input type="text" name="title" maxlength="60" value="${esc(t.title)}" placeholder="예: 팀 회의, 보고서 제출" autofocus>
        <div data-group-holder></div>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>시작 날짜</label><input type="date" name="date" value="${esc(t.date)}"></div>
      <div class="field"><label>시작 시간 (선택)</label><input type="time" name="time" value="${esc(t.time || '')}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label data-end-label>종료 날짜</label><input type="date" name="endDate" value="${esc(t.endDate || t.date)}" min="${esc(t.date)}"></div>
      <div class="field only-event"><label>종료 시간 (선택)</label><input type="time" name="endTime" value="${esc(t.endTime || '')}"></div>
    </div>
    <div class="field"><label>분류</label>${seg('category', catOptions(), t.category)}</div>
    <div class="field"><label>난이도</label>${seg('difficulty', diffOptions(), t.difficulty)}</div>
    <div class="reward-preview" data-preview>${rewardPreview(ctx, t.difficulty)}</div>
    <div class="field only-event" style="margin-top:9px"><label>반복</label>${seg('repeat', [
      { v: 'none', html: '없음' }, { v: 'weekly', html: '매주' }, { v: 'monthly', html: '매월' }, { v: 'yearly', html: '매년' },
    ], t.repeat || 'none')}</div>
    <div class="field"><label>메모</label><textarea name="memo" maxlength="500" placeholder="자세한 내용 (선택)">${esc(t.memo || '')}</textarea></div>
    <div class="modal-actions">
      ${edit ? `<button class="btn danger small" data-a="delete">${uiIcon('trash', 1)} 삭제</button>` : ''}
      <span class="spacer"></span>
      <button class="btn ghost" data-a="cancel">취소</button>
      <button class="btn primary" data-a="save">저장</button>
    </div>`;

  openModal(html, (el, close) => {
    const groupHolder = el.querySelector('[data-group-holder]');
    mountGroupPicker(groupHolder, ctx, t.groupId);
    // 시작 날짜를 고르면 종료 날짜도 같은 날로 (종료를 따로 바꿨고 시작보다 늦으면 유지)
    const startInput = el.querySelector('[name=date]');
    const endInput = el.querySelector('[name=endDate]');
    let lastStart = startInput.value;
    startInput.addEventListener('change', () => {
      const v = startInput.value;
      if (!v) return;
      if (!endInput.value || endInput.value === lastStart || endInput.value < v) endInput.value = v;
      endInput.min = v;
      lastStart = v;
    });
    const syncType = (v) => {
      el.querySelectorAll('.only-event').forEach((n) => { n.style.display = v === 'todo' ? 'none' : ''; });
      el.querySelector('[data-end-label]').textContent = v === 'todo' ? '마감 날짜' : '종료 날짜';
    };
    const values = bindSeg(el, (name, v) => {
      if (name === 'difficulty') el.querySelector('[data-preview]').innerHTML = rewardPreview(ctx, v);
      if (name === 'type') syncType(v);
    });
    syncType(values.type);
    const save = async () => {
      const payload = {
        type: values.type,
        title: el.querySelector('[name=title]').value,
        date: startInput.value || ctx.today,
        endDate: endInput.value || startInput.value || ctx.today,
        groupId: groupHolder.dataset.group,
        time: el.querySelector('[name=time]').value || null,
        endTime: values.type === 'event' ? el.querySelector('[name=endTime]').value || null : null,
        category: values.category,
        difficulty: values.difficulty,
        repeat: values.type === 'event' ? values.repeat : 'none',
        memo: el.querySelector('[name=memo]').value,
      };
      const res = edit
        ? await ctx.act('task/update', { id: task.id, patch: payload })
        : await ctx.act('task/add', payload);
      if (res.ok) {
        close();
        ctx.ui.selected = payload.date;
        ctx.rerender(true);
      }
    };
    el.querySelector('[name=title]').addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
    el.querySelector('[data-a=save]').addEventListener('click', save);
    el.querySelector('[data-a=cancel]').addEventListener('click', close);
    const del = el.querySelector('[data-a=delete]');
    if (del) {
      del.addEventListener('click', async () => {
        const msg = task.repeat && task.repeat !== 'none' ? `반복 일정 「${esc(task.title)}」 전체를 삭제할까요?` : `「${esc(task.title)}」을(를) 삭제할까요?`;
        if (await confirmDialog(msg, { ok: '삭제', danger: true })) await ctx.act('task/delete', { id: task.id });
      });
    }
  });
}

/* ── 일일임무 ─────────────────────────────── */

export function openDailyForm(ctx, { daily = null, category = 'study' } = {}) {
  const d = daily || { title: '', category, difficulty: 'normal', days: [0, 1, 2, 3, 4, 5, 6], time: '', note: '' };
  const edit = Boolean(daily);
  const dayBtns = WEEKDAYS_KO.map((label, i) => `<button type="button" data-v="${i}" class="${d.days.includes(i) ? 'on' : ''}">${label}</button>`).join('');
  const html = `
    <h3>${uiIcon('sword', 1)} ${edit ? '일일임무 수정' : '새 일일임무'}</h3>
    <div class="field"><label>제목</label><input type="text" name="title" maxlength="60" value="${esc(d.title)}" placeholder="예: 영어 단어 30개, 점심 식사" autofocus></div>
    <div class="field"><label>분류</label>${seg('category', catOptions(), d.category)}</div>
    <div class="field"><label>반복 요일</label>
      <div class="seg" data-name="days" data-multi="1">${dayBtns}</div>
      <div class="seg" style="margin-top:4px">
        <button type="button" data-preset="all">매일</button>
        <button type="button" data-preset="week">평일</button>
        <button type="button" data-preset="weekend">주말</button>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>시간 (선택 · 알림)</label><input type="time" name="time" value="${esc(d.time || '')}"></div>
    </div>
    <div class="field"><label>난이도</label>${seg('difficulty', diffOptions(), d.difficulty)}</div>
    <div class="reward-preview" data-preview>${rewardPreview(ctx, d.difficulty)}</div>
    <div class="field" style="margin-top:9px"><label>메모</label><textarea name="note" maxlength="500">${esc(d.note || '')}</textarea></div>
    <div class="modal-actions">
      ${edit ? `<button class="btn danger small" data-a="delete">${uiIcon('trash', 1)} 삭제</button>` : ''}
      <span class="spacer"></span>
      <button class="btn ghost" data-a="cancel">취소</button>
      <button class="btn primary" data-a="save">저장</button>
    </div>`;

  openModal(html, (el, close) => {
    const values = bindSeg(el, (name, v) => {
      if (name === 'difficulty') el.querySelector('[data-preview]').innerHTML = rewardPreview(ctx, v);
    }, { multi: true });
    const dayGroup = el.querySelector('[data-name=days]');
    el.querySelectorAll('[data-preset]').forEach((b) => b.addEventListener('click', () => {
      const set = { all: [0, 1, 2, 3, 4, 5, 6], week: [1, 2, 3, 4, 5], weekend: [0, 6] }[b.dataset.preset];
      dayGroup.querySelectorAll('button').forEach((x) => x.classList.toggle('on', set.includes(Number(x.dataset.v))));
      values.days = set.map(String);
    }));
    const save = async () => {
      const payload = {
        title: el.querySelector('[name=title]').value,
        category: values.category,
        difficulty: values.difficulty,
        days: [...dayGroup.querySelectorAll('button.on')].map((b) => Number(b.dataset.v)),
        time: el.querySelector('[name=time]').value || null,
        note: el.querySelector('[name=note]').value,
      };
      const res = edit ? await ctx.act('daily/update', { id: daily.id, patch: payload }) : await ctx.act('daily/add', payload);
      if (res.ok) close();
    };
    el.querySelector('[name=title]').addEventListener('keydown', (e) => { if (e.key === 'Enter') save(); });
    el.querySelector('[data-a=save]').addEventListener('click', save);
    el.querySelector('[data-a=cancel]').addEventListener('click', close);
    const del = el.querySelector('[data-a=delete]');
    if (del) {
      del.addEventListener('click', async () => {
        if (await confirmDialog(`일일임무 「${esc(daily.title)}」을(를) 삭제할까요?<br><span style="color:var(--muted)">지난 기록도 함께 사라져요.</span>`, { ok: '삭제', danger: true })) {
          await ctx.act('daily/delete', { id: daily.id });
        }
      });
    }
  });
}

/* ── 장비 상세 ─────────────────────────────── */

function statRows(item, compare) {
  return ['atk', 'def', 'hp', 'luck']
    .filter((k) => item[k] || (compare && compare[k]))
    .map((k) => {
      const diff = compare ? item[k] - compare[k] : 0;
      const d = diff ? `<em class="${diff > 0 ? 'up' : 'down'}">${diff > 0 ? '▲' : '▼'}${Math.abs(diff)}</em>` : '';
      return `<div><span>${STAT_LABELS[k]}</span><b>+${item[k]} ${d}</b></div>`;
    })
    .join('');
}

export function itemSubline(item) {
  const slot = item.slot === 'weapon' ? `무기(${WEAPON_LABELS[weaponTypeOf(item)]})` : SLOTS[item.slot].label;
  return `${RARITIES[item.rarity].label} · ${slot} · Lv ${item.level} · ${SOURCE_LABELS[item.source] || ''}${item.raid ? ' · 레이드 전용' : ''}`;
}

export function openItemDetail(ctx, item, { preview = false } = {}) {
  const st = heroStats(ctx.state);
  const current = st.gear[item.slot];
  const equipped = current && current.id === item.id;
  // 직업이 있으면 계열 무기만
  const need = classWeapon(ctx.state.job ? ctx.state.job.path : []);
  const wrongWeapon = item.slot === 'weapon' && need && weaponTypeOf(item) !== need;
  const compare = current && !equipped ? current : null;
  const better = compare ? itemScore(item) - itemScore(compare) : 0;
  const html = `
    <div class="item-head rc-${item.rarity}">
      <div class="frame-ico">${itemIcon(item, 4)}</div>
      <div><div class="nm t-${item.rarity}">${esc(item.name)}</div><div class="sub">${itemSubline(item)}</div>
      ${equipped ? '<div class="sub" style="color:var(--accent)">장착 중</div>' : ''}
      ${compare ? `<div class="sub">현재 장착: <span class="t-${compare.rarity}">${esc(compare.name)}</span> ${better > 0 ? '<b class="up">더 좋아요</b>' : better < 0 ? '<b class="down">더 약해요</b>' : ''}</div>` : ''}
      </div>
    </div>
    <div class="item-stats">${statRows(item, compare)}</div>
    ${wrongWeapon ? `<div class="sub" style="color:var(--warn);margin-top:6px">${esc(st.job.name)} 직업은 ${WEAPON_LABELS[need]}만 장착할 수 있어요 (경매장에 팔 수 있어요)</div>` : ''}
    ${preview ? `<div class="modal-actions"><span class="muted small">경매장 매물 미리보기</span><span class="spacer"></span><button class="btn primary" data-a="close">닫기</button></div>` : `
    <div class="modal-actions">
      <button class="btn small ghost" data-a="lock">${uiIcon('lock', 1)} ${item.locked ? '잠금 해제' : '잠금'}</button>
      <button class="btn small" data-a="sell" ${item.locked || equipped ? 'disabled' : ''}>판매 <span class="price">${sellPrice(item)}G</span></button>
      <span class="spacer"></span>
      ${equipped ? '<button class="btn" data-a="unequip">해제</button>' : `<button class="btn primary" data-a="equip" ${wrongWeapon ? 'disabled' : ''}>장착</button>`}
    </div>`}`;
  openModal(html, (el, close) => {
    const on = (a, fn) => { const b = el.querySelector(`[data-a=${a}]`); if (b) b.addEventListener('click', fn); };
    on('close', close);
    on('equip', async () => { if ((await ctx.act('item/equip', { id: item.id })).ok) close(); });
    on('unequip', async () => { if ((await ctx.act('item/unequip', { slot: item.slot })).ok) close(); });
    on('lock', async () => { if ((await ctx.act('item/lock', { id: item.id })).ok) close(); });
    on('sell', async () => {
      const big = item.rarity === 'epic' || item.rarity === 'legendary';
      if (big && !(await confirmDialog(`${RARITIES[item.rarity].label} 장비 「${esc(item.name)}」을(를) ${sellPrice(item)}G에 판매할까요?`, { ok: '판매', danger: true }))) return;
      if ((await ctx.act('item/sell', { id: item.id })).ok) close();
    });
  });
}

/* ── 전리품 연출 ─────────────────────────── */

export function openLoot(ctx, item, { title, onClose } = {}) {
  const r = RARITIES[item.rarity];
  const deco = item.rarity === 'legendary' ? '★ 전설 ★' : item.rarity === 'epic' ? '◆ 영웅 ◆' : r.label;
  const html = `
    <div class="loot rc-${item.rarity}">
      <div class="rays"></div>
      <div class="grade t-${item.rarity}">${deco}</div>
      <div style="position:relative;color:var(--muted);font-size:11px">${esc(title || '장비 획득!')}</div>
      <div class="big-ico">${itemIcon(item, 6)}</div>
      <div class="nm t-${item.rarity}">${esc(item.name)}</div>
      <div style="position:relative;color:var(--muted);font-family:var(--font-small);font-size:10px">${SLOTS[item.slot].label} · Lv ${item.level}</div>
      <div class="item-stats">${statRows(item, heroStats(ctx.state).gear[item.slot])}</div>
      <div class="modal-actions">
        <button class="btn" data-a="equip">바로 장착</button>
        <span class="spacer"></span>
        <button class="btn primary" data-a="ok" autofocus>확인</button>
      </div>
    </div>`;
  let closed = false;
  openModal(html, (el, close) => {
    const done = () => {
      if (closed) return;
      closed = true;
      close();
      onClose && onClose();
    };
    el.querySelector('[data-a=ok]').addEventListener('click', done);
    el.querySelector('[data-a=equip]').addEventListener('click', async () => {
      await ctx.act('item/equip', { id: item.id });
      done();
    });
  }, { dismissible: true });
  // 바깥 클릭/ESC 로 닫혀도 다음 전리품이 나오도록 감시
  const watch = setInterval(() => {
    if (!document.querySelector('.loot')) {
      clearInterval(watch);
      if (!closed) { closed = true; onClose && onClose(); }
    }
  }, 200);
}
