// 가방 탭: 용사 능력치, 장착 슬롯, 장비 목록
import { SLOTS, SLOT_ORDER, RARITIES, PITY } from '../../../core/constants.js';
import { heroStats } from '../../../core/progression.js';
import { itemScore, sellPrice } from '../../../core/items.js';
import { itemIcon, slotIcon, uiIcon } from '../../shared/sprite-canvas.js';
import { esc, confirmDialog } from '../ui.js';
import { openItemDetail } from '../forms.js';

const SORTS = {
  rarity: { label: '등급순', fn: (a, b) => RARITIES[b.rarity].rank - RARITIES[a.rarity].rank || itemScore(b) - itemScore(a) },
  power: { label: '능력순', fn: (a, b) => itemScore(b) - itemScore(a) },
  recent: { label: '최신순', fn: (a, b) => b.createdAt - a.createdAt },
};

export const bagView = {
  signature(ctx) {
    const { state, ui } = ctx;
    return JSON.stringify([state.inventory.length, state.inventory.map((i) => [i.id, i.locked]), state.hero.equipment, state.hero.level, state.pity, ui.invFilter, ui.invSort]);
  },

  render(ctx) {
    const { state, ui } = ctx;
    const st = heroStats(state);
    const equippedIds = new Set(Object.values(state.hero.equipment).filter(Boolean));
    const filter = ui.invFilter || 'all';
    const sort = SORTS[ui.invSort] ? ui.invSort : 'rarity';
    const items = state.inventory.filter((it) => filter === 'all' || it.slot === filter).sort(SORTS[sort].fn);
    const commons = state.inventory.filter((it) => it.rarity === 'common' && !it.locked && !equippedIds.has(it.id));
    const commonGold = commons.reduce((s, it) => s + sellPrice(it), 0);

    const slots = SLOT_ORDER.map((slot) => {
      const it = st.gear[slot];
      return `<div class="slot ${it ? `rc-${it.rarity} r-${it.rarity}` : ''}" data-act="slot" data-slot="${slot}" title="${it ? esc(it.name) : `${SLOTS[slot].label} 없음`}">
        ${it ? itemIcon(it, 3) : slotIcon(slot, 3)}
        <span class="lbl">${SLOTS[slot].label}</span>
      </div>`;
    }).join('');

    const grid = items.map((it) => `<div class="inv-item rc-${it.rarity} r-${it.rarity} ${ctx.isNewItem(it.id) ? 'new' : ''}" data-act="item" data-id="${it.id}" title="${esc(it.name)}">
        ${itemIcon(it, 3)}
        ${equippedIds.has(it.id) ? '<span class="tag">E</span>' : ''}
        ${it.locked ? `<span class="lk">${uiIcon('lock', 1)}</span>` : ''}
      </div>`).join('');

    return `
      <div class="hero-card">
        <canvas data-hero width="96" height="72"></canvas>
        <div>
          <div style="font-weight:700;margin-bottom:4px">${esc(state.profile.name)} <span class="lv">Lv.${st.level}</span></div>
          <div class="stats">
            <div><span>공격력</span><b>${st.atk}</b></div>
            <div><span>방어력</span><b>${st.def}</b></div>
            <div><span>최대 체력</span><b>${st.maxHp}</b></div>
            <div><span>행운</span><b>${st.luck}</b></div>
            <div><span>치명타</span><b>${Math.round(st.critChance * 100)}%</b></div>
            <div><span>드롭 보너스</span><b>+${Math.round(st.dropBonus * 100)}%</b></div>
          </div>
        </div>
      </div>
      <div class="slots">${slots}</div>
      <div class="pity">
        <span>영웅 보장까지 <b>${PITY.epic - state.pity.sinceEpic}</b>회</span>
        <span>전설 보장까지 <b>${PITY.legendary - state.pity.sinceLegendary}</b>회</span>
        <span>보유 <b>${state.inventory.length}</b>/300</span>
      </div>
      <div class="inv-tools">
        <div class="seg" data-act-seg="inv-filter">
          ${[['all', '전체'], ...SLOT_ORDER.map((s) => [s, SLOTS[s].label])].map(([k, l]) => `<button data-act="inv-filter" data-v="${k}" class="${filter === k ? 'on' : ''}">${l}</button>`).join('')}
        </div>
        <span class="spacer"></span>
        <button class="btn small ghost" data-act="inv-sort">${SORTS[sort].label} ▾</button>
      </div>
      ${items.length ? `<div class="inv-grid">${grid}</div>` : '<div class="empty">아직 장비가 없어요. 임무를 완료하면 확률로 장비가 떨어져요!</div>'}
      <button class="btn small block" style="margin-top:10px" data-act="sell-commons" ${commons.length ? '' : 'disabled'}>일반 등급 일괄 판매 (${commons.length}개 · ${commonGold}G)</button>`;
  },

  afterRender(_root, ctx) {
    ctx.markItemsSeen();
  },

  actions: {
    item: (el, ctx) => {
      const it = ctx.state.inventory.find((x) => x.id === el.dataset.id);
      if (it) openItemDetail(ctx, it);
    },
    slot: (el, ctx) => {
      const it = heroStats(ctx.state).gear[el.dataset.slot];
      if (it) openItemDetail(ctx, it);
      else {
        ctx.ui.invFilter = el.dataset.slot;
        ctx.rerender(true);
      }
    },
    'inv-filter': (el, ctx) => {
      ctx.ui.invFilter = el.dataset.v;
      ctx.rerender(true);
    },
    'inv-sort': (_el, ctx) => {
      const keys = Object.keys(SORTS);
      ctx.ui.invSort = keys[(keys.indexOf(ctx.ui.invSort) + 1) % keys.length];
      ctx.saveUi();
      ctx.rerender(true);
    },
    'sell-commons': async (_el, ctx) => {
      if (await confirmDialog('잠그지 않은 <b>일반</b> 등급 장비를 모두 판매할까요?', { ok: '일괄 판매' })) {
        await ctx.act('item/sellBulk', { rarity: 'common' });
      }
    },
  },
};
