// 채팅: 필드(지금 필드의 무작위 대화) · 파티 · 길드 · 시스템.
// 계정 서버 연결 전이라 가상 플레이어가 말하고 대답한다. 서버가 생기면 send/receive 자리만 서버로 바꾼다.
import { createRng, hashString } from '../../core/rng.js';
import { playersById, guildMembers, guildById, chatLine, onlinePlayers, worldPlayers, playerView } from '../../core/world.js';
import { combatPower } from '../../core/progression.js';
import { fieldBossWindow } from '../../core/adventure.js';
import { FIELD_BOSS, RARITIES } from '../../core/constants.js';
import { uiIcon } from '../shared/sprite-canvas.js';
import { esc, openModal } from './ui.js';

export const CHANNELS = [
  { key: 'field', label: '필드', color: '#ece9f5' },
  { key: 'party', label: '파티', color: '#6fdc8c' },
  { key: 'guild', label: '길드', color: '#7fe3ff' },
  { key: 'system', label: '시스템', color: '#ffd447' },
];
const CH = Object.fromEntries(CHANNELS.map((c) => [c.key, c]));
const STORE_KEY = 'calendar-rpg-chat-v1';
const MAX = 60;

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY));
    if (v && Array.isArray(v.msgs)) return v.msgs;
  } catch {
    // 저장소 없음
  }
  return [];
}

const timeOf = (ts) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/**
 * 채팅 붙이기. ctx = 위젯 컨텍스트, opts.openGuilds = 길드 창 열기
 */
export function mountChat(ctx, api, { openGuilds } = {}) {
  let msgs = load();
  let seq = Date.now();
  const unread = { field: 0, party: 0, guild: 0, system: 0 };
  let sheet = null; // { channel, el, renderList }
  let lastChannel = 'field';
  const rng = createRng(`chat|${Date.now()}`);

  const save = (() => {
    let t = null;
    return () => {
      clearTimeout(t);
      t = setTimeout(() => {
        try { localStorage.setItem(STORE_KEY, JSON.stringify({ msgs })); } catch { /* 무시 */ }
      }, 400);
    };
  })();

  /* ── 누가 말할 수 있나 ─────────────────── */
  const day = () => ctx.today;
  const fieldName = () => {
    const d = ctx.ui.dg;
    if (d && (d.mode === 'fieldBoss' || d.mode === 'practice')) return '필드 보스 맵';
    const n = (hashString(day()) % 5) + 1;
    return `초록 들판 ${n}채널`;
  };
  const speakers = (ch) => {
    const s = ctx.state;
    if (ch === 'party') return playersById(s.social.party, day());
    if (ch === 'guild') return s.social.guild ? guildMembers(s.social.guild, day()).slice(0, 24) : [];
    if (ch === 'system') return worldPlayers().slice(0, 120).map((p) => playerView(p, day()));
    return onlinePlayers(combatPower(s), day(), new Date().getHours(), { count: 14, exclude: s.social.party });
  };

  /* ── 메시지 넣기 ─────────────────── */
  function push(ch, from, text) {
    const m = { id: seq++, ch, from: from === 'me' ? 'me' : from ? { id: from.id, name: from.name, guild: from.guild || null } : null, text: String(text).slice(0, 80), at: Date.now() };
    msgs.push(m);
    const per = msgs.filter((x) => x.ch === ch);
    if (per.length > MAX) {
      const drop = new Set(per.slice(0, per.length - MAX).map((x) => x.id));
      msgs = msgs.filter((x) => !drop.has(x.id));
    }
    if (!sheet || sheet.channel !== ch) unread[ch] += 1;
    save();
    renderDock(m);
    if (sheet && sheet.channel === ch) sheet.renderList();
    if (sheet) sheet.renderTabs();
    return m;
  }

  function botSay(ch, { reply = false } = {}) {
    const line = chatLine(rng, ch, speakers(ch), { reply });
    if (line) push(ch, line.from, line.text);
  }

  /* ── 아래 한 줄(도크) ─────────────────── */
  const dock = document.createElement('button');
  dock.id = 'chat-dock';
  dock.type = 'button';
  dock.title = '채팅 (필드 · 파티 · 길드 · 시스템)';
  const strip = document.getElementById('battle-strip');
  if (strip) strip.appendChild(dock);
  else document.getElementById('view').after(dock);
  dock.addEventListener('click', (e) => {
    e.stopPropagation();
    openSheet(lastChannel);
  });

  function lineHtml(m) {
    const c = CH[m.ch];
    const who = m.from === 'me' ? esc(ctx.state.profile.name) : m.from ? esc(m.from.name) : '';
    return `<span class="ch" style="color:${c.color}">[${c.label}]</span>${who ? `<b>${who}</b>: ` : ' '}${esc(m.text)}`;
  }

  function renderDock(m = msgs[msgs.length - 1]) {
    const total = Object.values(unread).reduce((a, b) => a + b, 0);
    dock.innerHTML = `${uiIcon('chat', 1)}<span class="txt">${m ? lineHtml(m) : '<span class="muted">채팅</span>'}</span>${total ? `<span class="badge">${total > 99 ? '99+' : total}</span>` : ''}`;
  }

  /* ── 채팅 창 ─────────────────── */
  function openSheet(channel) {
    lastChannel = channel;
    openModal(`
      <div class="chat-sheet">
        <div class="chat-head"><b>${uiIcon('chat', 1)} 채팅</b><span class="muted small chat-where"></span><button class="icon-btn chat-x" data-a="close" title="닫기">${uiIcon('close', 2)}</button></div>
        <div class="chat-tabs"></div>
        <ul class="chat-list"></ul>
        <div class="chat-empty muted small" hidden></div>
        <form class="chat-input"><input id="chat-text" maxlength="60" autocomplete="off" placeholder="메시지 입력 (60자)"><button class="btn primary small" type="submit">전송</button></form>
      </div>`, (el, close) => {
      const list = el.querySelector('.chat-list');
      const tabs = el.querySelector('.chat-tabs');
      const empty = el.querySelector('.chat-empty');
      const form = el.querySelector('.chat-input');
      const input = el.querySelector('#chat-text');
      const where = el.querySelector('.chat-where');
      sheet = {
        channel,
        el,
        renderTabs() {
          tabs.innerHTML = CHANNELS.map((c) => `<button type="button" data-ch="${c.key}" class="${sheet.channel === c.key ? 'on' : ''}">${c.label}${unread[c.key] && sheet.channel !== c.key ? `<i>${unread[c.key] > 9 ? '9+' : unread[c.key]}</i>` : ''}</button>`).join('');
        },
        renderList() {
          const ch = sheet.channel;
          unread[ch] = 0;
          const s = ctx.state;
          const g = guildById(s.social.guild);
          where.textContent = ch === 'field' ? `${fieldName()} · ${speakers('field').length + 1}명`
            : ch === 'party' ? `파티 ${s.social.party.length + 1}명`
              : ch === 'guild' ? (g ? `${g.name} · ${guildMembers(g.id, day()).length + 1}명` : '길드 없음') : '알림';
          const mine = msgs.filter((m) => m.ch === ch);
          list.innerHTML = mine.map((m) => {
            const me = m.from === 'me';
            const name = me ? ctx.state.profile.name : m.from ? m.from.name : '';
            const gg = m.from && m.from !== 'me' ? guildById(m.from.guild) : null;
            return `<li class="${me ? 'me' : ''} ${m.from ? '' : 'sys'}">${name ? `<b class="who">${esc(name)}${gg && ch !== 'guild' ? `<small style="color:${gg.color}"> ${esc(gg.name)}</small>` : ''}</b>` : ''}<span class="txt">${esc(m.text)}</span><time>${timeOf(m.at)}</time></li>`;
          }).join('');
          let hint = '';
          if (ch === 'party' && !s.social.party.length) hint = '파티가 없어요. 던전 탭에서 파티원을 초대하면 파티 채팅을 할 수 있어요.';
          if (ch === 'guild' && !s.social.guild) hint = '길드에 가입하면 길드원과 대화할 수 있어요. <button class="btn small primary" data-a="guilds">길드 찾기</button>';
          empty.hidden = !hint;
          empty.innerHTML = hint;
          const canSend = ch !== 'system' && !hint;
          form.hidden = ch === 'system';
          input.disabled = !canSend;
          list.scrollTop = list.scrollHeight;
          renderDock();
        },
      };
      sheet.renderTabs();
      sheet.renderList();
      tabs.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ch]');
        if (!b) return;
        sheet.channel = b.dataset.ch;
        lastChannel = sheet.channel;
        sheet.renderTabs();
        sheet.renderList();
      });
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-a=close]')) close();
        if (e.target.closest('[data-a=guilds]') && openGuilds) openGuilds(ctx);
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text || input.disabled) return;
        input.value = '';
        const ch = sheet.channel;
        push(ch, 'me', text);
        // 가상 플레이어가 가끔 대답
        if (rng.chance(ch === 'field' ? 0.55 : 0.85)) setTimeout(() => botSay(ch, { reply: true }), 1200 + rng.next() * 2600);
      });
      setTimeout(() => input.focus(), 40);
    });
    // 창이 닫히면 정리
    const watch = setInterval(() => {
      if (!document.querySelector('.chat-sheet')) {
        clearInterval(watch);
        sheet = null;
        renderDock();
      }
    }, 300);
  }

  /* ── 게임 일이 시스템 채팅으로 ─────────────────── */
  api.onEvents((events) => {
    for (const ev of events) {
      switch (ev.type) {
        case 'reward':
          if (ev.item && (ev.item.rarity === 'legendary' || ev.item.rarity === 'epic')) push('system', null, `${RARITIES[ev.item.rarity].label} 장비 「${ev.item.name}」을(를) 얻었어요!`);
          break;
        case 'levelUp':
          push('system', null, `레벨 ${ev.level} 달성!`);
          break;
        case 'jobAdvance':
          push('system', null, `${ev.tier}차 전직! ${ev.name}이(가) 되었어요 (필살기 「${ev.skill.name}」)`);
          if (ctx.state.social.guild) setTimeout(() => botSay('guild', { reply: true }), 1500);
          break;
        case 'auctionSold':
          push('system', null, `경매장: ${ev.name} 판매 (${ev.buyer}님 구매, +${ev.net}G 정산함)`);
          break;
        case 'raidResult':
          if (ev.win) {
            push('system', null, `레이드 ${ev.tier}단계 「${ev.boss}」 토벌 성공!`);
            const legend = ev.chest.items.find((it) => it.rarity === 'legendary');
            if (legend) push('system', null, `레이드 보물상자에서 전설 장비 「${legend.name}」 획득!`);
            if (ctx.state.social.party.length) setTimeout(() => botSay('party', { reply: true }), 1500);
          }
          break;
        case 'fieldBossResult':
          push('system', null, `필드 보스 딜 ${ev.rank}위! (${ev.reward.label} 보상)`);
          break;
        case 'dungeonResult':
          if (ev.count) push('system', null, `${ev.name}에서 보석 ${ev.count}개를 모았어요`);
          break;
        case 'party':
          if (ev.action === 'join') {
            push('party', null, `${ev.name}님이 파티에 들어왔어요`);
            setTimeout(() => {
              const p = playersById([ev.id], day())[0];
              if (p) push('party', p, rng.pick(['안녕하세요! 잘 부탁해요', '초대 감사해요~', '같이 레이드 가요!', '반가워요!']));
            }, 900 + rng.next() * 1200);
          } else if (ev.action === 'leave') push('party', null, `${ev.name}님이 파티를 떠났어요`);
          else if (ev.action === 'disband') push('party', null, '파티를 해산했어요');
          break;
        case 'guild':
          if (ev.action === 'join') {
            push('guild', null, `${ev.name} 길드에 가입했어요`);
            setTimeout(() => botSay('guild', { reply: true }), 1400);
          } else push('guild', null, `${ev.name} 길드를 떠났어요`);
          break;
        default:
          break;
      }
    }
  });

  /* ── 가상 플레이어 대화 ─────────────────── */
  if (!msgs.length) push('system', null, '채팅에 오신 걸 환영해요! 지금은 계정 서버 연결 전이라 가상 플레이어와 대화해요.');
  renderDock();
  let announced = '';
  const loop = () => {
    const s = ctx.state;
    const r = rng.next();
    const ch = r < 0.06 ? 'system' : r < 0.26 && s.social.guild ? 'guild' : r < 0.4 && s.social.party.length ? 'party' : 'field';
    botSay(ch);
    // 필드 보스 예고
    const now = Date.now();
    const w = fieldBossWindow(now);
    const mins = (w.openAt - now) / 60000;
    const tag = mins > 0 && mins <= 5 ? `soon|${w.day}` : w.phase === 'open' ? `open|${w.day}` : '';
    if (tag && tag !== announced) {
      announced = tag;
      push('system', null, tag.startsWith('soon') ? `곧 ${FIELD_BOSS.name}이(가) 나타나요! (오후 9시)` : `${FIELD_BOSS.name} 출현! 던전 탭에서 입장하세요 (5분)`);
    }
    setTimeout(loop, 7000 + rng.next() * 9000);
  };
  setTimeout(loop, 2500);

  return { open: openSheet, push };
}
