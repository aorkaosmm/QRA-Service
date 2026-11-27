// 상점 탭: 물약·보물 상자, 나만의 보상, 최근 기록
import { SHOP } from '../../../core/constants.js';
import { uiIcon, shopIcon } from '../../shared/sprite-canvas.js';
import { esc, timeAgo, confirmDialog, toast } from '../ui.js';
import { sfx } from '../../shared/sfx.js';

export const shopView = {
  signature(ctx) {
    const { state } = ctx;
    return JSON.stringify([state.hero.gold, state.rewards, state.log.slice(0, 15).map((l) => l.id)]);
  },

  render(ctx) {
    const { state } = ctx;
    const gold = state.hero.gold;
    const products = Object.values(SHOP).map((p) => `
      <div class="shop-item">
        <div class="ico">${shopIcon(p.key, 3)}</div>
        <div class="info"><div class="nm">${esc(p.label)}</div><div class="ds">${esc(p.desc)}</div></div>
        <button class="btn gold small" data-act="buy" data-key="${p.key}" ${gold < p.price ? 'disabled' : ''}>${uiIcon('coin', 1)} ${p.price}</button>
      </div>`).join('');

    const rewards = state.rewards.map((r) => `
      <div class="shop-item">
        <div class="ico">${uiIcon('star', 3)}</div>
        <div class="info"><div class="nm">${esc(r.title)}</div><div class="ds">내가 정한 보상 · 골드로 사용</div></div>
        <button class="icon-btn" data-act="reward-del" data-id="${r.id}" title="삭제">${uiIcon('trash', 2)}</button>
        <button class="btn gold small" data-act="reward-buy" data-id="${r.id}" ${gold < r.cost ? 'disabled' : ''}>${uiIcon('coin', 1)} ${r.cost}</button>
      </div>`).join('');

    const log = state.log.slice(0, 15).map((l) => `<li><time>${timeAgo(l.at)}</time><span class="${l.rarity ? `t-${l.rarity}` : ''}">${esc(l.text)}</span></li>`).join('');

    return `
      <div class="progress-card" style="flex-direction:row;align-items:center">
        ${uiIcon('coin', 3)}
        <div style="flex:1"><div style="color:var(--muted);font-size:11px">보유 골드</div><div class="price" style="font-size:16px">${gold.toLocaleString('ko-KR')} G</div></div>
        <div style="color:var(--muted);font-family:var(--font-small);font-size:10px;text-align:right">임무 완료·슬라임 동전으로<br>골드를 모아요</div>
      </div>
      <div class="section-title">${uiIcon('shop', 1)} 상점</div>
      ${products}
      <div class="section-title">${uiIcon('star', 1)} 나만의 보상</div>
      ${rewards || '<div class="empty">스스로에게 줄 보상을 등록해 보세요.</div>'}
      <div class="form-inline">
        <input type="text" id="reward-title" maxlength="60" placeholder="예: 카페 디저트, 드라마 한 편">
        <input type="number" id="reward-cost" min="1" max="99999" value="50" title="가격(G)">
        <button class="btn primary" data-act="reward-add">추가</button>
      </div>
      <div class="section-title">최근 기록</div>
      ${log ? `<ul class="log">${log}</ul>` : '<div class="empty">아직 기록이 없어요.</div>'}`;
  },

  bind(root, ctx) {
    const t = root.querySelector('#reward-title');
    if (t) t.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) shopView.actions['reward-add'](null, ctx); });
  },

  actions: {
    buy: async (el, ctx) => {
      const res = await ctx.act('shop/buy', { key: el.dataset.key });
      if (res.ok) {
        sfx('buy');
        if (el.dataset.key === 'potion') toast(`${uiIcon('heart', 1)} 체력 물약 사용! 작업표시줄 용사가 회복했어요.`);
      }
    },
    'reward-buy': async (el, ctx) => {
      const r = ctx.state.rewards.find((x) => x.id === el.dataset.id);
      if (!r) return;
      const res = await ctx.act('reward/buy', { id: r.id });
      if (res.ok) {
        sfx('buy');
        toast(`${uiIcon('star', 1)} 「${esc(r.title)}」 보상 사용! 즐기세요 🎉`, { life: 3000 });
      }
    },
    'reward-del': async (el, ctx) => {
      const r = ctx.state.rewards.find((x) => x.id === el.dataset.id);
      if (r && (await confirmDialog(`보상 「${esc(r.title)}」을(를) 삭제할까요?`, { ok: '삭제', danger: true }))) {
        await ctx.act('reward/delete', { id: r.id });
      }
    },
    'reward-add': async (_el, ctx) => {
      const title = document.getElementById('reward-title');
      const cost = document.getElementById('reward-cost');
      const res = await ctx.act('reward/add', { title: title.value, cost: cost.value });
      if (res.ok) {
        // 다시 그린 뒤의 새 입력칸을 비운다
        const fresh = document.getElementById('reward-title');
        if (fresh) fresh.value = '';
        toast('나만의 보상을 추가했어요.');
      }
    },
  },
};
