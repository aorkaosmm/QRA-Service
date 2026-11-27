// 아주 작은 칩튠 효과음 (WebAudio). 설정에서 켰을 때만 재생.
let ctx = null;
let enabled = false;

export function setSoundEnabled(v) {
  enabled = Boolean(v);
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function tone(freq, dur, { type = 'square', vol = 0.06, slide = 0, delay = 0 } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  check: () => { tone(660, 0.07); tone(990, 0.09, { delay: 0.06 }); },
  uncheck: () => tone(440, 0.08, { slide: -120 }),
  coin: () => { tone(1320, 0.05, { vol: 0.04 }); tone(1760, 0.08, { vol: 0.04, delay: 0.05 }); },
  hit: () => tone(180, 0.06, { type: 'sawtooth', vol: 0.05, slide: -80 }),
  hurt: () => tone(220, 0.12, { type: 'triangle', vol: 0.08, slide: -140 }),
  loot: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, { vol: 0.05, delay: i * 0.08 })),
  legendary: () => [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => tone(f, 0.16, { vol: 0.06, delay: i * 0.09 })),
  levelup: () => [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.08, delay: i * 0.07 })),
  buy: () => { tone(880, 0.06); tone(1175, 0.1, { delay: 0.06 }); },
  error: () => tone(160, 0.15, { type: 'square', vol: 0.05 }),
};

export function sfx(name) {
  if (!enabled) return;
  try {
    SOUNDS[name] && SOUNDS[name]();
  } catch {
    // 오디오 장치 없음 등 무시
  }
}
