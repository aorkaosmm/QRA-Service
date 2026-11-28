// 경매장 (상점 탭 안): 구매 · 판매 · 내 등록 · 정산함. 지금은 가상 플레이어와 거래하고, 서버가 생기면 실제 거래소로.
import { GEMS, GEM_ORDER, RARITIES, SLOTS, SLOT_ORDER } from '../../../core/constants.js';
import { AUCTION, botListings, marketSlot, marketValue, gemPrice } from '../../../core/market.js';
import { WEAPON_LABELS } from '../../../core/jobs.js';
import { weaponTypeOf } from '../../../core/items.js';
import { uiIcon, gemIcon, itemIcon } from '../../shared/sprite-canvas.js';
import { esc, openModal, toast } from '../ui.js';
import { openItemDetail } from '../forms.js';
import { sfx } from '../../shared/sfx.js';

const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
const CATS = [['all', '전체'], ...SLOT_ORDER.map((s) => [s, SLOTS[s].label]), ['gem', '보석']];
const SORTS = { price: '낮은 가격', '-price': '높은 가격', level: '높은 레벨' };

function au(ctx) {
  if (!ctx.ui.au) ctx.ui.au = { tab: 'buy', cat: 'all', rarity: 'all', sort: 'price', q: '' };
  return ctx.ui.au;
}

function left(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`;
}

function statLine(it) {
  const parts = [];
  if (it.atk) parts.push(`공격 ${it.atk}`);
  if (it.def) parts.push(`방어 ${it.def}`);
  if (it.hp) parts.push(`체력 ${it.hp}`);
  if (it.luck) parts.push(`행운 ${it.luck}`);
  return parts.join(' · ');
}

function slotLabel(it) {
  return it.slot === 'weapon' ? `무기(${WEAPON_LABELS[weaponTypeOf(it)]})` : SLOTS[it.slot].label;
}

/** 시세 대비 표시 */
function deal(price, value) {
  const r = price / value;
  if (r < 0.95) return '<span class="deal good">싸요</span>';
  if (r > 1.15) return '<span class="deal bad">비싸요</span>';
  return '<span class="deal">시세</span>';
}

function speedHint(ratio) {
  if (ratio <= 0.7) return '몇 분 안에 팔릴 거예요';
  if (ratio <= 1.0) return '몇 시간 안에 팔릴 거예요';
  if (ratio <= 1.3) return '하루 안에 팔릴 수도 있어요';
  if (ratio <= 1.8) return '팔릴지 모르겠어요 (비싼 편)';
  return '너무 비싸서 안 팔릴 거예요';
}

/* ── 구매 ─────────────────────────────── */

function buyTab(ctx) {
  const s = ctx.state;
  const a = au(ctx);
  const slot = marketSlot(Date.now());
  let list = botListings(slot.key, s.hero.level).filter((l) => !s.auction.bought[l.id]);
  if (a.cat === 'gem') list = list.filter((l) => l.kind === 'gem');
  else if (a.cat !== 'all') list = list.filter((l) => l.kind === 'item' && l.item.slot === a.cat);
  if (a.rarity !== 'all') list = list.filter((l) => l.kind === 'item' && l.item.rarity === a.rarity);
  const q = a.q.trim();
  if (q) list = list.filter((l) => (l.kind === 'gem' ? GEMS[l.gem].label : l.item.name).includes(q));
  const lv = (l) => (l.kind === 'item' ? l.item.level : 0);
  list.sort(a.sort === '-price' ? (x, y) => y.price - x.price : a.sort === 'level' ? (x, y) => lv(y) - lv(x) : (x, y) => x.price - y.price);
  const rows = list.map((l) => {
    if (l.kind === 'gem') {
      const each = gemPrice(l.gem, slot.day);
      return `<li class="au-row">${gemIcon(l.gem, 3)}
        <div class="au-info"><b>${GEMS[l.gem].label} ×${l.qty}</b><small>개당 ${fmt(l.price / l.qty)}G (시세 ${each}G) · ${esc(l.seller)}</small></div>
        <div class="au-price">${deal(l.price, each * l.qty)}<b>${fmt(l.price)}G</b></div>
        <button class="btn small gold" data-act="au-buy" data-id="${esc(l.id)}" ${s.hero.gold < l.price ? 'disabled' : ''}>구매</button></li>`;
    }
    const it = l.item;
    return `<li class="au-row" data-act="au-view" data-id="${esc(l.id)}">${itemIcon(it, 3)}
      <div class="au-info"><b class="t-${it.rarity}">${esc(it.name)}${it.raid ? ' <span class="raid-chip">레이드</span>' : ''}</b><small>${RARITIES[it.rarity].label} · ${slotLabel(it)} · Lv ${it.level} · ${statLine(it)}</small><small>${esc(l.seller)}</small></div>
      <div class="au-price">${deal(l.price, marketValue(it))}<b>${fmt(l.price)}G</b></div>
      <button class="btn small gold" data-act="au-buy" data-id="${esc(l.id)}" ${s.hero.gold < l.price ? 'disabled' : ''}>구매</button></li>`;
  }).join('');
  return `
    <div class="au-filters">
      <div class="seg wrap">${CATS.map(([k, label]) => `<button data-act="au-cat" data-v="${k}" class="${a.cat === k ? 'on' : ''}">${label}</button>`).join('')}</div>
      <div class="au-row2">
        <select id="au-rarity" data-change="au-rarity">${[['all', '모든 등급'], ...Object.values(RARITIES).map((r) => [r.key, r.label])].map(([k, label]) => `<option value="${k}" ${a.rarity === k ? 'selected' : ''}>${label}</option>`).join('')}</select>
        <input id="au-q" type="text" placeholder="이름 검색" value="${esc(a.q)}" autocomplete="off">
        <button class="btn small ghost" data-act="au-sort">${SORTS[a.sort]} ▾</button>
      </div>
    </div>
    <div class="muted small au-note">매물은 매시간 바뀌어요 (${left(slot.end - Date.now())} 뒤) · 보유 ${fmt(s.hero.gold)}G</div>
    ${rows ? `<ul class="au-list">${rows}</ul>` : '<div class="empty">조건에 맞는 매물이 없어요.</div>'}`;
}

/* ── 판매 ─────────────────────────────── */

function sellTab(ctx) {
  const s = ctx.state;
  const equipped = new Set(Object.values(s.hero.equipment).filter(Boolean));
  const items = s.inventory.filter((it) => !equipped.has(it.id) && !it.locked)
    .sort((x, y) => RARITIES[y.rarity].rank - RARITIES[x.rarity].rank || y.level - x.level);
  const grid = items.map((it) => `<div class="inv-item rc-${it.rarity} r-${it.rarity}" data-act="au-sell-item" data-id="${it.id}" title="${esc(it.name)}">${itemIcon(it, 3)}${it.raid ? '<span class="raid-tag">R</span>' : ''}</div>`).join('');
  const day = marketSlot(Date.now()).day;
  const gems = GEM_ORDER.filter((g) => (s.gems[g] || 0) > 0).map((g) => `
    <li class="au-row">${gemIcon(g, 3)}<div class="au-info"><b>${GEMS[g].label} ${fmt(s.gems[g])}개</b><small>오늘 시세 개당 ${gemPrice(g, day)}G</small></div>
      <button class="btn small" data-act="au-sell-gem" data-gem="${g}">팔기</button></li>`).join('');
  return `
    <div class="muted small au-note">등록비 ${Math.round(AUCTION.feeRate * 100)}%(최소 ${AUCTION.minFee}G) · 팔리면 수수료 ${Math.round(AUCTION.commission * 100)}%를 뺀 금액이 정산함으로 · 등록 ${s.auction.listings.length}/${AUCTION.maxListings}</div>
    <div class="section-title">${uiIcon('bag', 1)} 장비 (장착·잠금 제외)</div>
    ${grid ? `<div class="inv-grid">${grid}</div>` : '<div class="empty">올릴 수 있는 장비가 없어요.</div>'}
    <div class="section-title">${gemIcon('ruby', 1)} 보석</div>
    ${gems ? `<ul class="au-list">${gems}</ul>` : '<div class="empty">보석이 없어요. 요일 던전에서 모아요.</div>'}`;
}

function openSellModal(ctx, { item = null, gem = null }) {
  const s = ctx.state;
  const day = marketSlot(Date.now()).day;
  const unit = gem ? gemPrice(gem, day) : 0;
  const maxQty = gem ? s.gems[gem] || 0 : 1;
  const value = item ? marketValue(item) : unit * Math.min(10, maxQty);
  openModal(`
    <h3>${uiIcon('coin', 1)} 경매장에 올리기</h3>
    <div class="au-sell-head">${item ? itemIcon(item, 4) : gemIcon(gem, 4)}
      <div>${item ? `<b class="t-${item.rarity}">${esc(item.name)}</b><small class="muted">${RARITIES[item.rarity].label} · ${slotLabel(item)} · Lv ${item.level}<br>${statLine(item)}</small>` : `<b>${GEMS[gem].label}</b><small class="muted">보유 ${fmt(maxQty)}개 · 시세 개당 ${unit}G</small>`}</div></div>
    ${gem ? `<label class="field"><span>개수</span><input id="au-qty" type="number" min="1" max="${maxQty}" value="${Math.min(10, maxQty)}"></label>` : ''}
    <label class="field"><span>가격 (G)</span><input id="au-price" type="number" min="1" max="${AUCTION.maxPrice}" value="${value}"></label>
    <div class="seg" id="au-hours">${AUCTION.hours.map((h) => `<button type="button" data-v="${h}" class="${h === 24 ? 'on' : ''}">${h}시간</button>`).join('')}</div>
    <div class="au-preview muted small" id="au-preview"></div>
    <div class="modal-actions"><span class="spacer"></span><button class="btn ghost" data-a="cancel">취소</button><button class="btn primary" data-a="ok">등록</button></div>`,
  (el, close) => {
    const price = el.querySelector('#au-price');
    const qty = el.querySelector('#au-qty');
    let hours = 24;
    const preview = () => {
      const p = Math.max(0, Math.floor(Number(price.value) || 0));
      const q = qty ? Math.max(1, Math.floor(Number(qty.value) || 1)) : 1;
      const v = item ? marketValue(item) : unit * q;
      const fee = Math.max(AUCTION.minFee, Math.round(p * AUCTION.feeRate));
      const net = p - Math.round(p * AUCTION.commission);
      el.querySelector('#au-preview').innerHTML = `시세 ${fmt(v)}G · 등록비 ${fmt(fee)}G · 팔리면 ${fmt(net)}G 받음<br><b>${p ? speedHint(p / v) : '가격을 입력해 주세요'}</b>`;
    };
    preview();
    price.addEventListener('input', preview);
    if (qty) qty.addEventListener('input', () => {
      price.value = Math.max(1, Math.floor(Number(qty.value) || 1)) * unit;
      preview();
    });
    el.querySelector('#au-hours').addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      hours = Number(b.dataset.v);
      el.querySelectorAll('#au-hours button').forEach((x) => x.classList.toggle('on', x === b));
    });
    el.querySelector('[data-a=cancel]').addEventListener('click', close);
    el.querySelector('[data-a=ok]').addEventListener('click', async () => {
      const payload = { price: Math.floor(Number(price.value) || 0), hours };
      if (item) payload.itemId = item.id;
      else Object.assign(payload, { gem, qty: Math.floor(Number(qty.value) || 0) });
      const res = await ctx.act('auction/list', payload);
      if (!res.ok) return;
      close();
      sfx('buy');
      toast('경매장에 올렸어요. 팔리면 정산함으로 들어와요.');
    });
    setTimeout(() => price.focus(), 40);
  });
}

/* ── 내 등록 · 정산함 ─────────────────────────────── */

function mineTab(ctx) {
  const s = ctx.state;
  const now = Date.now();
  const rows = s.auction.listings.map((l) => `
    <li class="au-row">${l.kind === 'gem' ? gemIcon(l.gem, 3) : itemIcon(l.item, 3)}
      <div class="au-info"><b class="${l.kind === 'item' ? `t-${l.item.rarity}` : ''}">${esc(l.kind === 'gem' ? `${GEMS[l.gem].label} ×${l.qty}` : l.item.name)}</b>
        <small>${fmt(l.price)}G · 남은 시간 ${left(l.expiresAt - now)} · 시세 ${fmt(l.value)}G</small></div>
      <button class="btn small ghost" data-act="au-cancel" data-id="${l.id}">취소</button></li>`).join('');
  return `<div class="muted small au-note">시세보다 싸면 빨리, 비싸면 늦게 팔려요. 취소하면 물건은 바로 돌아오고 등록비는 돌려받지 못해요.</div>
    ${rows ? `<ul class="au-list">${rows}</ul>` : '<div class="empty">올린 물건이 없어요. [판매]에서 올려 보세요.</div>'}`;
}

function mailTab(ctx) {
  const s = ctx.state;
  const rows = [...s.auction.mailbox].reverse().map((m) => {
    const ico = m.kind === 'gold' ? uiIcon('coin', 3) : m.kind === 'gem' ? gemIcon(m.gem, 3) : itemIcon(m.item, 3);
    const what = m.kind === 'gold' ? `+${fmt(m.amount)}G` : m.kind === 'gem' ? `${GEMS[m.gem].label} ×${m.qty}` : esc(m.item.name);
    return `<li class="au-row">${ico}<div class="au-info"><b>${what}</b><small>${esc(m.text)}</small></div>
      <button class="btn small primary" data-act="au-claim" data-id="${m.id}">받기</button></li>`;
  }).join('');
  return rows ? `<button class="btn primary block" data-act="au-claim-all" style="margin-bottom:6px">모두 받기 (${s.auction.mailbox.length})</button><ul class="au-list">${rows}</ul>`
    : '<div class="empty">받을 것이 없어요. 물건이 팔리거나 기간이 끝나면 여기로 와요.</div>';
}

/* ── 공개 ─────────────────────────────── */

export function auctionSignature(ctx) {
  const s = ctx.state;
  return JSON.stringify([au(ctx), s.hero.gold, s.hero.level, s.auction, s.gems, s.inventory.length, s.inventory.map((i) => [i.id, i.locked]), s.hero.equipment, marketSlot(Date.now()).key]);
}

export function auctionRender(ctx) {
  const a = au(ctx);
  const s = ctx.state;
  const tabs = [['buy', '구매'], ['sell', '판매'], ['mine', `내 등록 ${s.auction.listings.length}`], ['mail', `정산함${s.auction.mailbox.length ? ` ${s.auction.mailbox.length}` : ''}`]];
  const body = a.tab === 'sell' ? sellTab(ctx) : a.tab === 'mine' ? mineTab(ctx) : a.tab === 'mail' ? mailTab(ctx) : buyTab(ctx);
  return `
    <div class="au-tabs">${tabs.map(([k, label]) => `<button data-act="au-tab" data-v="${k}" class="${a.tab === k ? 'on' : ''} ${k === 'mail' && s.auction.mailbox.length ? 'has' : ''}">${label}</button>`).join('')}</div>
    ${body}
    <p class="muted small rank-note">지금은 계정 서버 연결 전이라 가상 플레이어와 사고팔아요.</p>`;
}

export function auctionBind(root, ctx) {
  const q = root.querySelector('#au-q');
  if (q) {
    let t = null;
    q.addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => { au(ctx).q = q.value; ctx.rerender(true); }, 350);
    });
  }
  const r = root.querySelector('#au-rarity');
  if (r) r.addEventListener('change', () => { au(ctx).rarity = r.value; ctx.rerender(true); });
}

export const auctionActions = {
  'au-tab': (el, ctx) => { au(ctx).tab = el.dataset.v; ctx.rerender(true); },
  'au-cat': (el, ctx) => { au(ctx).cat = el.dataset.v; ctx.rerender(true); },
  'au-sort': (el, ctx) => {
    const keys = Object.keys(SORTS);
    const a = au(ctx);
    a.sort = keys[(keys.indexOf(a.sort) + 1) % keys.length];
    ctx.rerender(true);
  },
  'au-view': (el, ctx, e) => {
    if (e && e.target.closest('button')) return;
    const l = botListings(marketSlot(Date.now()).key, ctx.state.hero.level).find((x) => x.id === el.dataset.id);
    if (l && l.kind === 'item') openItemDetail(ctx, l.item, { preview: true });
  },
  'au-buy': async (el, ctx) => {
    const res = await ctx.act('auction/buy', { id: el.dataset.id });
    if (res.ok) {
      sfx('buy');
      const ev = res.events.find((x) => x.type === 'auctionBuy');
      toast(`${esc(ev.name)} 구매! (-${fmt(ev.price)}G)`);
    } else ctx.rerender(true);
  },
  'au-sell-item': (el, ctx) => {
    const it = ctx.state.inventory.find((x) => x.id === el.dataset.id);
    if (it) openSellModal(ctx, { item: it });
  },
  'au-sell-gem': (el, ctx) => openSellModal(ctx, { gem: el.dataset.gem }),
  'au-cancel': async (el, ctx) => {
    const res = await ctx.act('auction/cancel', { id: el.dataset.id });
    if (res.ok) toast('등록을 취소했어요. 물건이 돌아왔어요.');
  },
  'au-claim': async (el, ctx) => {
    const res = await ctx.act('auction/claim', { id: el.dataset.id });
    if (res.ok) sfx('coin');
  },
  'au-claim-all': async (el, ctx) => {
    const res = await ctx.act('auction/claim', {});
    const ev = res.ok && res.events.find((x) => x.type === 'auctionClaim');
    if (ev) {
      sfx('coin');
      toast(`정산함: ${ev.gold ? `+${fmt(ev.gold)}G ` : ''}${ev.items ? `장비 ${ev.items}개 ` : ''}${ev.gems ? `보석 ${ev.gems}개` : ''}${ev.left ? ` (가방이 가득 차서 ${ev.left}개 남음)` : ''}`);
    }
  },
};
