// 랭킹 탭: 전투력 랭킹. 1~3위는 금·은·동 시상대 위에 캐릭터가 서고, 아래는 순위 목록, 맨 아래 줄은 내 순위.
import { SLOT_ORDER } from '../../../core/constants.js';
import { combatPower, heroStats, powerBand } from '../../../core/progression.js';
import { powerRanking, guildById } from '../../../core/world.js';
import { uiIcon, heroImg } from '../../shared/sprite-canvas.js';
import { esc } from '../ui.js';

const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
const LIMIT = 50;

function meEntry(s) {
  const st = heroStats(s);
  const gear = {};
  for (const slot of SLOT_ORDER) gear[slot] = st.gear[slot] ? st.gear[slot].rarity : null;
  return { name: s.profile.name, cp: combatPower(s), level: st.level, gear, guild: s.social.guild };
}

function guildTag(id) {
  const g = guildById(id);
  return g ? `<small class="g" style="color:${g.color}">${esc(g.name)}</small>` : '';
}

function spot(p, place) {
  return `
    <div class="podium-spot p${place} ${p.isMe ? 'me' : ''}">
      ${place === 1 ? `<div class="crown">${uiIcon('crown', 2)}</div>` : `<div class="medal m${place}"></div>`}
      <div class="hero">${heroImg(p.gear, place === 1 ? 3 : 2)}</div>
      <div class="nm">${esc(p.name)}${p.isMe ? ' (나)' : ''}</div>
      <div class="cp">${uiIcon('sword', 1)} ${fmt(p.cp)}</div>
      <div class="block"><span>${place}</span></div>
    </div>`;
}

export const rankingView = {
  signature(ctx) {
    const me = meEntry(ctx.state);
    return JSON.stringify([me, ctx.today]);
  },

  render(ctx) {
    const s = ctx.state;
    const me = meEntry(s);
    const r = powerRanking(me, ctx.today, { limit: LIMIT });
    const [first, second, third] = r.podium;
    const rows = r.top.slice(3).map((p) => `
      <li class="${p.isMe ? 'me' : ''}">
        <span class="r">${p.rank}</span>
        <span class="face">${heroImg(p.gear, 1)}</span>
        <span class="n">${esc(p.name)}${p.isMe ? ' (나)' : ''}${guildTag(p.guild)}</span>
        <span class="lv">Lv.${p.level}</span>
        <span class="cp">${fmt(p.cp)}</span>
      </li>`).join('');
    const top = ((r.me.rank / r.total) * 100);
    return `
      <div class="rank-head">
        <div class="section-title" style="margin:0">${uiIcon('trophy', 1)} 전투력 랭킹</div>
        <span class="muted small">${ctx.today.replace(/-/g, '.')} 기준 · ${fmt(r.total)}명</span>
      </div>
      <div class="podium">
        <div class="rays"></div>
        ${spot(second, 2)}
        ${spot(first, 1)}
        ${spot(third, 3)}
      </div>
      <ol class="rank-list">${rows}</ol>
      ${r.me.rank > LIMIT ? `<div class="rank-gap muted small">… ${fmt(r.me.rank - LIMIT - 1)}명 …</div>` : ''}
      <div class="my-rank">
        <span class="r">${r.me.rank}</span>
        <span class="face">${heroImg(me.gear, 1)}</span>
        <span class="n">내 순위 <b>${fmt(r.me.rank)}위</b><small>상위 ${top < 1 ? top.toFixed(2) : top.toFixed(1)}% · ${powerBand(me.cp)}단계</small></span>
        <span class="cp">${fmt(me.cp)}</span>
      </div>
      <p class="muted small rank-note">지금은 계정 서버 연결 전이라 가상 플레이어와 순위를 겨뤄요. 레벨을 올리고 좋은 장비(레이드 장비 등)를 끼면 전투력이 올라요.</p>`;
  },
};
