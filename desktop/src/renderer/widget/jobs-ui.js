// 직업 창: 현재 전직 경로·보너스, 다음 전직 후보(조건·비용·필살기), 전체 직업 나무, 직업 초기화
import { GEMS } from '../../core/constants.js';
import {
  JOBS, JOB_TREE, JOB_LEVELS, JOB_RESET_GOLD, FOCUS_LABELS, WEAPON_LABELS,
  currentJob, jobBonus, jobSkill, nextJobs, jobCost,
} from '../../core/jobs.js';
import { combatPower, heroStats } from '../../core/progression.js';
import { uiIcon, gemIcon, weaponIcon, itemIcon } from '../shared/sprite-canvas.js';
import { esc, openModal, confirmDialog, toast } from './ui.js';
import { sfx } from '../shared/sfx.js';

const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
const TIER_LABEL = ['초보자', '1차', '2차', '3차'];
const pct = (v) => `+${Math.round(v * 100)}%`;

function bonusLine(b) {
  return [['atk', '공격'], ['def', '방어'], ['hp', '체력'], ['luck', '행운']]
    .filter(([k]) => b[k] >= 0.005).map(([k, l]) => `${l} ${pct(b[k])}`).join(' · ');
}

/** 전직할 수 있는 상태인지 (레벨만 보면) */
export function jobReady(state) {
  const path = state.job ? state.job.path : [];
  return path.length < 3 && state.hero.level >= JOB_LEVELS[path.length];
}

export function jobLabel(path) {
  const j = currentJob(path);
  return j ? `${TIER_LABEL[j.tier]} ${j.name}` : '초보자';
}

function costHtml(state, job) {
  const c = jobCost(job);
  const need = JOB_LEVELS[job.tier - 1];
  const ok = (b) => (b ? 'ok' : 'no');
  const parts = [`<span class="${ok(state.hero.level >= need)}">Lv ${need}</span>`, `<span class="${ok(state.hero.gold >= c.gold)}">${uiIcon('coin', 1)}${fmt(c.gold)}</span>`];
  for (const [g, n] of Object.entries(c.gems)) parts.push(`<span class="${ok((state.gems[g] || 0) >= n)}">${gemIcon(g, 1)}${n}</span>`);
  return parts.join('');
}

function canAfford(state, job) {
  const c = jobCost(job);
  return state.hero.level >= JOB_LEVELS[job.tier - 1] && state.hero.gold >= c.gold
    && Object.entries(c.gems).every(([g, n]) => (state.gems[g] || 0) >= n);
}

function optionCard(state, job) {
  const kids = job.children.map((id) => JOBS[id].name).join(' · ');
  return `
    <div class="job-opt" style="--jc:${job.color}">
      <div class="job-opt-head">${weaponIcon(job.weapon, 2, job.tier >= 3 ? 'legendary' : job.tier === 2 ? 'epic' : 'rare')}
        <div><b>${esc(job.name)}</b><small>${esc(job.desc)}</small></div>
        <span class="job-focus">${FOCUS_LABELS[job.focus]}</span></div>
      <div class="job-opt-body">
        <div>${bonusLine(job.bonus)}</div>
        <div>필살기 「${esc(job.skill.name)}」 ×${job.skill.mult}${job.tier === 1 ? ` · ${WEAPON_LABELS[job.weapon]} 사용` : ''}</div>
        ${kids ? `<div class="muted small">다음 갈래: ${esc(kids)}</div>` : ''}
      </div>
      <div class="job-opt-foot"><span class="job-cost">${costHtml(state, job)}</span>
        <button class="btn small primary" data-adv="${job.id}" ${canAfford(state, job) ? '' : 'disabled'}>전직</button></div>
    </div>`;
}

function treeHtml(path) {
  const on = new Set(path);
  const li = (j) => `<span class="jt ${on.has(j.id) ? 'on' : ''}">${esc(j.name)}</span>`;
  return JOB_TREE.map((c) => `
    <details class="job-tree" ${on.has(c.id) ? 'open' : ''}>
      <summary>${weaponIcon(JOBS[c.id].weapon, 1)} ${li(JOBS[c.id])}</summary>
      ${c.children.map((b) => `<div class="jt-row">${li(JOBS[b.id])}<span class="jt-arrow">›</span>${b.children.map((t) => li(JOBS[t.id])).join('')}</div>`).join('')}
    </details>`).join('');
}

export function openJobs(ctx) {
  const draw = (el) => {
    const s = ctx.state;
    const path = s.job.path;
    const cur = currentJob(path);
    const b = jobBonus(path);
    const sk = jobSkill(path);
    const next = nextJobs(path);
    const tier = path.length;
    el.querySelector('.job-body').innerHTML = `
      <div class="job-path">${['초보자', ...path.map((id) => JOBS[id].name)].map((n, i) => `<span class="jp ${i === path.length ? 'cur' : ''}"><small>${i ? TIER_LABEL[i] : '시작'}</small>${esc(n)}</span>`).join('<span class="jt-arrow">›</span>')}</div>
      <div class="job-now">
        <div>${cur ? `<b style="color:${cur.color}">${esc(cur.name)}</b> · ${esc(cur.desc)}` : '<b>초보자</b> · 아무 무기나 쓸 수 있어요'}</div>
        <div class="muted small">보너스 ${bonusLine(b) || '없음'} · 필살기 「${esc(sk.name)}」 ×${sk.mult} · 전투력 ${fmt(combatPower(s))}</div>
      </div>
      ${tier < 3 ? `
        <div class="section-title">${uiIcon('star', 1)} ${tier + 1}차 전직 <span class="muted">레벨 ${JOB_LEVELS[tier]}부터 · 지금 Lv.${s.hero.level}</span></div>
        <div class="job-opts">${next.map((j) => optionCard(s, j)).join('')}</div>`
        : '<div class="job-max">최종 3차 전직을 마쳤어요!</div>'}
      <div class="section-title">${uiIcon('crown', 1)} 전체 직업 (84개)</div>
      ${treeHtml(path)}
      <p class="muted small">전직 비용: 1차 300G · 2차 2,000G + 직업 보석 30 · 3차 10,000G + 직업 보석 100 + 다른 보석 각 20. 직업 보석 = 전사 루비 · 궁수 에메랄드 · 거너 호박석 · 마법사 자수정 (요일 던전·경매장에서 모아요)</p>`;
    const reset = el.querySelector('[data-a=reset]');
    reset.style.display = tier ? '' : 'none';
    reset.textContent = `직업 초기화 (${fmt(JOB_RESET_GOLD * tier)}G)`;
  };
  openModal(`<h3>${uiIcon('sword', 1)} 직업</h3><div class="job-body"></div>
    <div class="modal-actions"><button class="btn ghost small" data-a="reset" hidden></button><span class="spacer"></span><button class="btn primary" data-a="ok">닫기</button></div>`,
  (el, close) => {
    draw(el);
    el.addEventListener('click', async (e) => {
      const adv = e.target.closest('[data-adv]');
      if (adv) {
        const job = JOBS[adv.dataset.adv];
        const c = jobCost(job);
        const gemTxt = Object.entries(c.gems).map(([g, n]) => `${GEMS[g].label} ${n}`).join(', ');
        if (!(await confirmDialog(`<b>${esc(job.name)}</b>(으)로 ${job.tier}차 전직할까요?<br><span class="muted small">비용 ${fmt(c.gold)}G${gemTxt ? ` · ${gemTxt}` : ''}</span>`, { ok: '전직' }))) {
          openJobs(ctx);
          return;
        }
        const res = await ctx.act('job/advance', { id: job.id });
        const ev = res.ok && res.events.find((x) => x.type === 'jobAdvance');
        if (ev) celebrate(ctx, ev);
        else openJobs(ctx);
        return;
      }
      if (e.target.closest('[data-a=reset]')) {
        const tier = ctx.state.job.path.length;
        if (await confirmDialog(`직업을 초기화하고 초보자로 돌아갈까요? (${fmt(JOB_RESET_GOLD * tier)}G, 쓴 비용은 돌려받지 못해요)`, { ok: '초기화', danger: true })) {
          const res = await ctx.act('job/reset', {});
          if (res.ok) toast('초보자로 돌아갔어요.');
        }
        openJobs(ctx);
        return;
      }
      if (e.target.closest('[data-a=ok]')) close();
    });
  });
}

function celebrate(ctx, ev) {
  const job = JOBS[ev.id];
  sfx('levelup');
  openModal(`
    <div class="job-celebrate" style="--jc:${job.color}">
      <div class="rays"></div>
      <div class="muted">${job.tier}차 전직 완료!</div>
      <canvas data-hero width="96" height="72"></canvas>
      <div class="job-new">${esc(job.name)}</div>
      <div class="muted small">${esc(job.desc)}</div>
      <div class="reward-list">
        <div>${uiIcon('star', 2)} 보너스 ${bonusLine(job.bonus)}</div>
        <div>${uiIcon('flame', 2)} 필살기 「${esc(job.skill.name)}」 ×${job.skill.mult}</div>
        ${ev.item ? `<div class="t-${ev.item.rarity}">${itemIcon(ev.item, 2)} ${esc(ev.item.name)} 획득 · 장착</div>` : ''}
      </div>
      <div class="muted small">전투력 ${fmt(combatPower(ctx.state))} · 가방의 ${heroStats(ctx.state).job ? WEAPON_LABELS[job.weapon] : '무기'}만 장착할 수 있어요</div>
      <div class="modal-actions"><span class="spacer"></span><button class="btn primary" data-a="ok" autofocus>확인</button></div>
    </div>`, (el, close) => el.querySelector('[data-a=ok]').addEventListener('click', close));
  toast(`${uiIcon('star', 1)} ${job.tier}차 전직! <b>${esc(job.name)}</b>`, { kind: 'level', life: 3200 });
}
