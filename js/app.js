/* Bloquinho: app sem build. Os dados ficam no localStorage do aparelho. */
(() => {
'use strict';

/* =========================================================
   Técnicas
   ========================================================= */
const zone = c => Math.max(1, Math.ceil(c.blocks / 2));
const TECH = {
  muscle: {
    name: 'Muscle Round', mode: 'fixed', lastMax: true, blocks: 6, reps: 4, rest: 10, goal: 20, color: '--hl-y',
    rule: c => `${c.blocks} blocos de ${c.reps} reps com ${c.rest} s de descanso. Carga de 8 a 12 reps. O ideal é falhar entre o ${zone(c)}º e o ${zone(c) + 1}º bloco. Chegou no ${c.blocks}º? Vai até a falha.`,
    first: 'escolhe uma carga que você faria de 8 a 12 reps direto'
  },
  cluster: {
    name: 'Cluster set', mode: 'fixed', lastMax: false, blocks: 5, reps: 3, rest: 20, goal: 20, color: '--hl-g',
    rule: c => `${c.blocks} blocos de ${c.reps} reps com ${c.rest} s de descanso. Carga pesada, de umas 5 a 6 reps. Fechou todos os blocos? Sobe a carga.`,
    first: 'escolhe uma carga que você faria umas 5 ou 6 reps direto'
  },
  restpause: {
    name: 'Rest-pause', mode: 'count', lastMax: false, blocks: 3, reps: 0, rest: 15, goal: 20, color: '--hl-p',
    rule: c => `Vai até a falha, descansa ${c.rest} s e continua, ${c.blocks} blocos no total. Anota as reps de cada um. Somou ${c.goal} reps? Sobe a carga.`,
    first: 'escolhe uma carga que você faria de 8 a 10 reps direto'
  }
};
const LIMITS = { blocks: [2, 10], reps: [1, 20], rest: [3, 180], goal: [3, 200] };

/* =========================================================
   Utilidades
   ========================================================= */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const newId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const dayKey = (d = new Date()) => d.toLocaleDateString('sv-SE');
const fmt = n => n == null || n === '' ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const fmtDate = ts => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const fmtDay = k => k ? `${k.slice(8, 10)}/${k.slice(5, 7)}` : '';
const fmtLong = d => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const sign = n => n > 0 ? '+' : n < 0 ? '−' : '';
const fmtPct = p => { const a = Math.abs(p * 100); return sign(p) + (a < 10 ? a.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : Math.round(a).toLocaleString('pt-BR')) + '%'; };
const fmtSigned = (n, unit = '') => sign(n) + fmt(Math.abs(n)) + unit;
const parseNum = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : null; };
const rand = k => { const x = Math.sin(k * 12.9898) * 43758.5453; return x - Math.floor(x); };
const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

/* =========================================================
   Estado e persistência
   ========================================================= */
const LS = 'bloquinho:v1', LS_RUN = 'bloquinho:run', LS_INSTALL = 'bloquinho:install-seen';
const S = { workouts: [], logs: [], settings: { sound: true, voice: true, hideHow: false }, seeded: false };
let view = { name: 'home' };
let run = null;
let armed = null, armedAt = 0, armedTimer = null;
let focusAfter = null;
let afterRender = [];
const fresh = { w: null, ex: new Set() };   // o que acabou de ser criado, pra animar

function lsLoad() {
  try {
    const d = JSON.parse(localStorage.getItem(LS) || 'null');
    if (!d) return;
    S.workouts = d.workouts || [];
    S.logs = (d.logs || []).sort((a, b) => a.ts - b.ts);
    S.settings = { ...S.settings, ...(d.settings || {}) };
    S.seeded = !!d.seeded;
  } catch (e) {}
}
let persistAsked = false;
function lsSave() {
  try { localStorage.setItem(LS, JSON.stringify({ workouts: S.workouts, logs: S.logs, settings: S.settings, seeded: S.seeded })); }
  catch (e) { toast('Não deu pra salvar no aparelho. Confere se o navegador não tá em aba anônima.'); }
  if (!persistAsked) { persistAsked = true; try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {} }
}
function saveCaderno() { S.seeded = true; lsSave(); }
function addLog(l) { S.logs.push(l); S.logs.sort((a, b) => a.ts - b.ts); S.seeded = true; lsSave(); }
function deleteLog(id) { S.logs = S.logs.filter(l => l.id !== id); lsSave(); }

function mkEx(name, tech = 'muscle') {
  const T = TECH[tech];
  return { id: newId(), name, tech, blocks: T.blocks, reps: T.reps || 4, rest: T.rest, goal: T.goal };
}
function exampleWorkout() {
  return { id: newId(), name: 'Treino A', example: true, exercises: [
    mkEx('Supino inclinado com halteres'), mkEx('Puxada frontal'), mkEx('Cadeira extensora'), mkEx('Elevação lateral')
  ] };
}
const getW = id => S.workouts.find(w => w.id === id);
const getE = (wid, eid) => getW(wid)?.exercises.find(e => e.id === eid);
const logsOf = eid => S.logs.filter(l => l.eid === eid);
const lastLog = eid => logsOf(eid).at(-1);
const cfgOf = e => { const T = TECH[e.tech]; return { tech: e.tech, mode: T.mode, lastMax: T.lastMax, blocks: e.blocks, reps: e.reps || 4, rest: e.rest, goal: e.goal || T.goal }; };
const touchWorkout = w => { if (w && w.example) w.example = false; };

/* =========================================================
   Progressão de carga (veredito)
   ========================================================= */
function stepLoad(load, pct, dir) {
  const min = load >= 10 ? 1 : 0.5;
  let x = load * (1 + dir * pct);
  x = x >= 20 ? Math.round(x) : Math.round(x * 2) / 2;
  return dir > 0 ? Math.max(x, load + min) : Math.max(0, Math.min(x, load - min));
}
function evaluate(cfg, reps, load) {
  const total = reps.reduce((a, b) => a + (+b || 0), 0);
  const ev = { total, verdict: 'keep', failBlock: null, next: load ?? null, big: false };
  if (cfg.mode === 'count') {
    ev.verdict = total >= cfg.goal ? 'up' : 'keep';
  } else {
    let fi = reps.findIndex(r => r < cfg.reps);
    if (fi === -1 && reps.length < cfg.blocks) fi = reps.length;
    if (fi === -1) {
      ev.verdict = 'up';
      ev.big = cfg.lastMax && (reps.at(-1) || 0) >= cfg.reps * 2;
    } else {
      ev.failBlock = fi + 1;
      ev.verdict = ev.failBlock < zone(cfg) ? 'down' : 'keep';
    }
  }
  if (load) {
    if (ev.verdict === 'up') ev.next = stepLoad(load, ev.big ? 0.10 : 0.05, 1);
    if (ev.verdict === 'down') ev.next = stepLoad(load, 0.10, -1);
  }
  return ev;
}
const VWORD = { up: 'sobe', keep: 'mantém', down: 'baixa' };
function verdictCopy(cfg, ev, reps) {
  const kg = ev.next != null ? `${fmt(ev.next)} kg` : null;
  const z = zone(cfg);
  if (cfg.mode === 'count') {
    if (ev.verdict === 'up') return { title: 'Sobe a carga', body: `Somou ${ev.total} reps e bateu a meta de ${cfg.goal}.${kg ? ` Próximo treino: ${kg}.` : ''}` };
    return { title: 'Mantém a carga', body: `Somou ${ev.total} de ${cfg.goal} reps. Mesma carga no próximo treino, tenta somar mais.` };
  }
  if (ev.verdict === 'up') {
    const lastTxt = cfg.lastMax ? ` e fez ${reps.at(-1)} reps no último` : '';
    const bigTxt = ev.big ? ' Sobrou gás, dá pra subir mais.' : '';
    return { title: 'Sobe a carga', body: `Fechou os ${cfg.blocks} blocos${lastTxt}.${bigTxt}${kg ? ` Próximo treino: ${kg}.` : ''}` };
  }
  if (ev.verdict === 'down') {
    return { title: 'Baixa a carga', body: `Falhou já no ${ev.failBlock}º bloco. O alvo é falhar entre o ${z}º e o ${z + 1}º.${kg ? ` Próximo treino: uns ${kg}.` : ''}` };
  }
  let zoneTxt = '';
  if (ev.failBlock === z || ev.failBlock === z + 1) zoneTxt = ' Tá na zona certa.';
  else if (ev.failBlock > z + 1) zoneTxt = ' Tá quase fechando tudo.';
  const goal = ev.failBlock < cfg.blocks ? `passar do ${ev.failBlock}º bloco` : `fechar o ${cfg.blocks}º bloco`;
  return { title: 'Mantém a carga', body: `Falhou no ${ev.failBlock}º bloco.${zoneTxt} Mesma carga no próximo treino, tenta ${goal}.` };
}
function planFor(e) {
  const last = lastLog(e.id), T = TECH[e.tech];
  if (!last) return { load: null, html: `Primeira vez nesse exercício: ${T.first}.` };
  const when = fmtDate(last.ts);
  if (last.verdict === 'up') return { load: last.next ?? last.load, html: `Em ${when} você fechou tudo com ${fmt(last.load)} kg. <b>Hoje: ${fmt(last.next ?? last.load)} kg.</b>` };
  if (last.verdict === 'down') return { load: last.next ?? last.load, html: `Em ${when} ficou pesado com ${fmt(last.load)} kg. <b>Hoje: uns ${fmt(last.next ?? last.load)} kg.</b>` };
  if (last.cfg?.mode === 'count') return { load: last.load, html: `Em ${when}: ${last.total} reps com ${fmt(last.load)} kg. <b>Hoje: mesma carga, tenta ${last.total + 1} ou mais.</b>` };
  return { load: last.load, html: `Em ${when} você falhou no ${last.failBlock}º bloco com ${fmt(last.load)} kg (${last.total} reps). <b>Hoje: mesma carga, tenta passar do ${last.failBlock}º.</b>` };
}

/* =========================================================
   Progresso: hoje vs. treino anterior
   Volume = carga × reps somadas (sem carga, conta só as reps).
   ========================================================= */
const vol = l => (l.load > 0 ? l.load : 1) * (l.total || 0);
const dirOf = p => p > 0.005 ? 'up' : p < -0.005 ? 'down' : 'keep';
function exDelta(now, prev) {
  const nv = vol(now), pv = vol(prev);
  return { nv, pv, dLoad: (now.load || 0) - (prev.load || 0), dReps: (now.total || 0) - (prev.total || 0), pct: pv ? (nv - pv) / pv : 0 };
}
function sessionCompare(w, day) {
  const dayLogs = S.logs.filter(l => l.wid === w.id && l.day === day);
  if (!dayLogs.length) return null;
  const latest = new Map();
  for (const l of dayLogs) latest.set(l.eid, l);
  const before = S.logs.filter(l => l.wid === w.id && l.day < day).map(l => l.day).sort();
  const rows = [...latest.values()].map(t => {
    const p = S.logs.filter(l => l.eid === t.eid && l.day < day).at(-1);
    return { t, p, d: p ? exDelta(t, p) : null };
  });
  const cmp = rows.filter(r => r.p);
  const nv = cmp.reduce((a, r) => a + r.d.nv, 0), pv = cmp.reduce((a, r) => a + r.d.pv, 0);
  return { day, prevDay: before.at(-1) || null, rows, compared: cmp.length, pct: pv ? (nv - pv) / pv : null };
}
function progressSay(cmp) {
  if (cmp.pct == null) return 'Primeiro registro desse treino. Na próxima vez eu comparo com hoje.';
  const ref = cmp.prevDay ? `treino de ${fmtDay(cmp.prevDay)}` : 'último treino';
  const d = dirOf(cmp.pct);
  if (d === 'up') return `Você progrediu <span class="circled">${fmtPct(cmp.pct)}${ICON.ring}</span> em relação ao ${ref}.`;
  if (d === 'down') return `Ficou ${fmtPct(cmp.pct).slice(1)} abaixo do ${ref}. Normal oscilar (sono, comida, estresse). Foco no próximo.`;
  return `Mesmo volume do ${ref}. No próximo, busca 1 rep a mais.`;
}
const deltaChip = p => { const d = dirOf(p); return `<span class="delta delta--${d}">${d === 'keep' ? 'igual' : fmtPct(p)}</span>`; };
const deltaNum = (n, unit = '') => { const d = n > 0 ? 'up' : n < 0 ? 'down' : 'keep'; return `<span class="delta delta--${d}">${n ? fmtSigned(n, unit) : 'igual'}</span>`; };
const loadPair = (a, b) => a === b ? fmt(b) : `${fmt(a)}→${fmt(b)}`;

/* =========================================================
   Som, voz e tela acesa
   ========================================================= */
let actx = null, ptVoice = null, speechPrimed = false, wake = null;
function audioUnlock() {
  try {
    if (!actx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) actx = new AC(); }
    if (actx && actx.state === 'suspended') actx.resume();
  } catch (e) {}
  try {
    if (!speechPrimed && 'speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); speechPrimed = true; }
  } catch (e) {}
}
function beep(freq = 880, dur = 0.12, vol = 0.22) {
  if (!S.settings.sound || !actx) return;
  try {
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t + dur + 0.03);
  } catch (e) {}
}
function pickVoice() {
  try { const vs = speechSynthesis.getVoices(); ptVoice = vs.find(v => /^pt[-_]BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null; } catch (e) {}
}
if ('speechSynthesis' in window) { pickVoice(); try { speechSynthesis.addEventListener('voiceschanged', pickVoice); } catch (e) {} }
function say(text, delay = 0) {
  if (!S.settings.voice || !('speechSynthesis' in window)) return;
  setTimeout(() => {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR'; if (ptVoice) u.voice = ptVoice; u.rate = 1.08;
      speechSynthesis.speak(u);
    } catch (e) {}
  }, delay);
}
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
function cue(kind, n, last) {
  if (kind === 'start') { beep(880, 0.14); say(last ? 'Bloco único. Vai!' : 'Bloco 1. Vai!', 150); }
  if (kind === 'rest') { beep(520, 0.09, 0.16); }
  if (kind === 'count') { beep(760, 0.08); }
  if (kind === 'go') { beep(1180, 0.3, 0.28); buzz([180, 80, 180]); say(last ? 'Último bloco! Até a falha!' : `Bloco ${n}. Vai!`, 330); }
  if (kind === 'done') { beep(880, 0.12); setTimeout(() => beep(1320, 0.22), 150); buzz(300); say('Fim da série.', 420); }
}
async function requestWake() {
  try { if ('wakeLock' in navigator && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) {}
}
function releaseWake() { try { wake && wake.release(); } catch (e) {} wake = null; }
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && view.name === 'run' && run && (run.phase === 'work' || run.phase === 'rest')) { requestWake(); tick(); }
});

/* =========================================================
   Série em andamento
   ========================================================= */
function saveRunDraft() { try { run && localStorage.setItem(LS_RUN, JSON.stringify({ ...run, ask: null, savedAt: Date.now() })); } catch (e) {} }
function clearRunDraft() { try { localStorage.removeItem(LS_RUN); } catch (e) {} }
function restoreRun() {
  try {
    const d = JSON.parse(localStorage.getItem(LS_RUN) || 'null');
    if (!d || Date.now() - d.savedAt > 3 * 3600e3 || d.phase === 'ready' || !getE(d.wid, d.eid)) { clearRunDraft(); return; }
    run = { ...d, animIdx: -1 };
    if (run.phase === 'rest' && Date.now() >= run.restEnd) run.phase = 'work';
    view = { name: 'run', wid: run.wid };
  } catch (e) {}
}
const curEx = () => run && getE(run.wid, run.eid);
function setPhase(p) { run.phase = p; run.phaseAt = Date.now(); }
function defaultCount(i) {
  const prev = lastLog(run.eid);
  if (prev && prev.reps && prev.reps[i] != null) return prev.reps[i];
  return i === 0 ? 10 : Math.max(1, (run.reps[i - 1] || 4) - 3);
}
let tickT = null;
const RING = 2 * Math.PI * 84;
function startTick() { stopTick(); tickT = setInterval(tick, 100); tick(); }
function stopTick() { if (tickT) { clearInterval(tickT); tickT = null; } }
function tick() {
  if (!run || run.phase !== 'rest') { stopTick(); return; }
  const ms = run.restEnd - Date.now();
  if (ms <= 0) { endRest(); return; }
  const sec = Math.ceil(ms / 1000);
  const c = $('#count'); if (c && c.textContent !== String(sec)) c.textContent = sec;
  const t = $('#timer'); if (t) t.classList.toggle('hot', sec <= 3);
  const r = $('#ringFg'); if (r) r.style.strokeDashoffset = (RING * (1 - ms / run.restMs)).toFixed(1);
  if (sec !== run.lastSec) { if (run.lastSec != null && sec <= 3) cue('count'); run.lastSec = sec; }
}
function startRest() {
  const cfg = cfgOf(curEx());
  setPhase('rest');
  run.restMs = cfg.rest * 1000; run.restEnd = Date.now() + run.restMs; run.lastSec = null;
  cue('rest'); saveRunDraft(); render(); startTick();
}
function endRest() {
  stopTick();
  const cfg = cfgOf(curEx()); const n = run.reps.length + 1;
  setPhase('work');
  cue('go', n, n === cfg.blocks && (cfg.lastMax || cfg.mode === 'count'));
  saveRunDraft(); render();
}
function finish() {
  stopTick(); setPhase('done'); run.ask = null;
  cue('done'); saveRunDraft(); render(); window.scrollTo(0, 0);
}
function pushBlock(v) { run.reps.push(v); run.animIdx = run.reps.length - 1; }

/* =========================================================
   Ícones e desenhos
   ========================================================= */
const PENCIL = '<g transform="rotate(35)" stroke="#1b1c21" stroke-width="1.6" stroke-linejoin="round"><rect x="-5" y="-57" width="10" height="7" rx="2" fill="#ff9fb3"/><rect x="-5" y="-50" width="10" height="6" fill="#b9bdc7"/><rect x="-5" y="-44" width="10" height="32" fill="#ffcf3f"/><path d="M-1.6 -44V-12M1.6 -44V-12" stroke-width="1" opacity=".3"/><path d="M-5 -12H5L0 0Z" fill="#f1d3a6"/><path d="M-1.9 -4.6H1.9L0 0Z" fill="#2b2c33" stroke="none"/></g>';
const PEN = `<span class="field-pen" aria-hidden="true"><svg viewBox="-3 -52 42 54">${PENCIL}</svg></span>`;
const ICON = {
  play: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5 19 12 7 19.5Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12.5 9 18.5 21 3.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sound: on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.5h3.6L12 5.4v13.2l-4.9-4.1H3.5z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>${on
    ? '<path d="M15.4 9c1.3 1.7 1.3 4.3 0 6M18.2 6.3c2.6 3.2 2.6 8.2 0 11.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    : '<path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'}</svg>`,
  circle: '<svg class="circ" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M50 5C80 3 97 25 96 51 95 79 73 97 47 95 20 93 3 74 5 47 7 21 29 6 60 9"/></svg>',
  ring: '<svg class="circ" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M52 6C82 4 98 26 97 51 96 79 73 96 47 95 19 94 3 74 4 47 6 21 30 5 63 10"/></svg>',
  scrib: '<svg class="scrib" viewBox="0 0 220 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 8C40 2 78 11 118 6S188 3 217 7"/></svg>',
  phone: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M8 10H6v10h12V10h-2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>'
};
function tally(n, ghost = 0, seed = 1, anim = false) {
  const total = n + ghost;
  if (!total) return '<svg class="t" viewBox="0 0 30 26" aria-hidden="true"></svg>';
  const groups = Math.ceil(total / 5), W = Math.max(30, groups * 30 - 4);
  let s = '';
  for (let i = 0; i < total; i++) {
    const g = Math.floor(i / 5), p = i % 5, solid = i < n;
    const j = k => (rand(seed * 31 + i * 7 + k) * 2 - 1);
    const cls = solid ? (anim ? 's a' : 's') : 'g';
    const st = solid && anim ? ` style="--d:${i * 70}ms"` : '';
    const d = p < 4
      ? `M${(4 + g * 30 + p * 6.2 + j(1) * 0.8).toFixed(1)} ${(3.5 + j(2)).toFixed(1)}L${(4 + g * 30 + p * 6.2 + j(3) * 1.4).toFixed(1)} ${(22.5 + j(4)).toFixed(1)}`
      : `M${g * 30 + 0.5} ${(18 + j(5)).toFixed(1)}L${g * 30 + 25.5} ${(7 + j(6)).toFixed(1)}`;
    s += `<path class="${cls}"${st} pathLength="1" d="${d}"/>`;
  }
  return `<svg class="t" viewBox="0 0 ${W} 26" aria-hidden="true">${s}</svg>`;
}

/* =========================================================
   Animações de desenho
   ========================================================= */
const NS = 'http://www.w3.org/2000/svg';
function roughRect(w, h, s) {
  const j = k => (rand(s + k) - 0.5) * 4;
  const p = (x, y) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  return `M${p(8 + j(1), 1 + j(2))}`
    + `C${p(w * 0.35, -1 + j(3))} ${p(w * 0.7, 2 + j(4))} ${p(w - 3 + j(5), 1 + j(6))}`
    + `C${p(w + 1 + j(7), h * 0.35)} ${p(w - 1 + j(8), h * 0.7)} ${p(w + j(9), h - 2 + j(10))}`
    + `C${p(w * 0.65, h + 1 + j(11))} ${p(w * 0.3, h - 1 + j(12))} ${p(2 + j(13), h + j(14))}`
    + `C${p(-1 + j(15), h * 0.65)} ${p(1 + j(16), h * 0.3)} ${p(j(17), 6 + j(18))}`
    + `Q${p(1, 0)} ${p(22 + j(19), -2 + j(20))}`;
}
/* Um lápis contorna o cartão e o conteúdo aparece como se fosse escrito. */
function drawIn(el, { delay = 0, dur = 750 } = {}) {
  if (!el || reduceMotion() || el.querySelector(':scope > .draw-svg')) return;
  const w = el.offsetWidth, h = el.offsetHeight;
  if (!w || !h) return;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'draw-svg'); svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('viewBox', `-12 -12 ${w + 24} ${h + 24}`);
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('class', 'draw-line'); path.setAttribute('d', roughRect(w, h, Math.random() * 1000));
  const pen = document.createElementNS(NS, 'g');
  pen.setAttribute('class', 'pencil'); pen.innerHTML = `<g transform="scale(.8)">${PENCIL}</g>`;
  svg.append(path, pen);
  el.classList.add('is-drawing');
  el.append(svg);
  const len = path.getTotalLength();
  path.style.strokeDasharray = `${len} ${len}`; path.style.strokeDashoffset = len;
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const start = performance.now() + delay;
  const step = now => {
    const t = clamp((now - start) / dur, 0, 1), e = ease(t);
    path.style.strokeDashoffset = len * (1 - e);
    const pt = path.getPointAtLength(len * e);
    pen.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    if (t > 0.4) el.classList.add('is-revealing');
    if (t < 1) { requestAnimationFrame(step); return; }
    pen.classList.add('lift');
    setTimeout(() => { svg.classList.add('fade'); el.classList.remove('is-drawing', 'is-revealing'); }, 180);
    setTimeout(() => svg.remove(), 520);
  };
  requestAnimationFrame(step);
}
/* Linhas de texto aparecem da esquerda pra direita, uma depois da outra. */
function writeIn(els) {
  if (reduceMotion()) return;
  els.forEach((el, i) => {
    el.style.animationDelay = `${i * 110}ms`;
    el.classList.add('write-in');
    el.addEventListener('animationend', () => { el.classList.remove('write-in'); el.style.animationDelay = ''; }, { once: true });
  });
}
function lineIn(el) {
  if (!el || reduceMotion()) return;
  el.classList.add('line-in');
  setTimeout(() => el.classList.remove('line-in'), 900);
}
/* O lápis do campo acompanha o fim do texto e rabisca a cada letra. */
const measure = document.createElement('canvas').getContext('2d');
function penFollow(input, scribble) {
  const pen = input.closest('.field-wrap')?.querySelector('.field-pen');
  if (!pen) return;
  const cs = getComputedStyle(input);
  measure.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const x = Math.min(measure.measureText(input.value || '').width + (parseFloat(cs.paddingLeft) || 0), input.clientWidth - 8);
  pen.style.setProperty('--x', `${Math.max(0, x)}px`);
  if (scribble && !reduceMotion()) { pen.classList.remove('scribble'); void pen.offsetWidth; pen.classList.add('scribble'); }
}

/* =========================================================
   Instalar na tela do celular
   ========================================================= */
const UA = navigator.userAgent || '';
const isAndroid = /Android/i.test(UA);
const isIOS = !isAndroid && (/iPhone|iPad|iPod/i.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
const isStandalone = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
let deferredPrompt = null, installOpen = false;
function viewInstall() {
  let body;
  if (isIOS) body = `
    <ol class="isteps">
      <li><span class="ibadge">${ICON.share}</span><span>Toca em <b>Compartilhar</b> (o quadrado com a seta pra cima). Se não aparecer, toca antes em <b>•••</b>.</span></li>
      <li><span class="ibadge">${ICON.plus}</span><span>Rola a lista e toca em <b>Adicionar à Tela de Início</b>.</span></li>
      <li><span class="ibadge">${ICON.check}</span><span>Toca em <b>Adicionar</b>. O Bloquinho aparece junto dos seus apps.</span></li>
    </ol>
    <p class="t-note">Abriu pelo WhatsApp ou Instagram? Abre no Safari primeiro (no menu, “Abrir no Safari”).</p>
    <p class="t-note">Depois, usa sempre pelo ícone: o que você anota fica guardado nele.</p>`;
  else if (isAndroid && deferredPrompt) body = `
    <button class="btn btn--go btn--wide btn--xl" data-a="install-go">${ICON.plus}<span>Instalar o Bloquinho</span></button>`;
  else if (isAndroid) body = `
    <ol class="isteps">
      <li><span class="ibadge">${ICON.dots}</span><span>Toca no menu <b>⋮</b> do Chrome, no canto de cima.</span></li>
      <li><span class="ibadge">${ICON.plus}</span><span>Toca em <b>Adicionar à tela inicial</b> ou <b>Instalar app</b>.</span></li>
      <li><span class="ibadge">${ICON.check}</span><span>Confirma em <b>Instalar</b>. O ícone aparece na tela do celular.</span></li>
    </ol>`;
  else body = `
    <p>O Bloquinho foi feito pro celular. Abre este endereço no navegador do celular e ele mostra o passo a passo:</p>
    <p class="iurl">${esc(location.host || '')}</p>
    ${deferredPrompt ? `<button class="btn btn--wide" data-a="install-go">Instalar neste computador</button>` : ''}`;
  return `<div class="backdrop" data-a="install-close">
    <div class="card bsheet" role="dialog" aria-modal="true" aria-labelledby="instT" data-a="noop">
      <div class="ihead"><img class="logo" src="/logo.svg" alt="" width="52" height="52"><h2 id="instT">Põe o Bloquinho na tela do celular</h2></div>
      <p class="t-muted">Assim ele abre em tela cheia, igual um app, e funciona até sem internet na academia.</p>
      ${body}
      <button class="link" data-a="install-close">agora não</button>
    </div>
  </div>`;
}
function renderInstall() { $('#installLayer').innerHTML = installOpen ? viewInstall() : ''; }
function openInstall() { installOpen = true; renderInstall(); }
function closeInstall() { installOpen = false; renderInstall(); try { localStorage.setItem(LS_INSTALL, '1'); } catch (e) {} }
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; if (installOpen) renderInstall(); });
window.addEventListener('appinstalled', () => { deferredPrompt = null; closeInstall(); toast('Pronto! O Bloquinho tá na sua tela.'); });

/* =========================================================
   Telas
   ========================================================= */
function viewHome() {
  const how = !S.settings.hideHow && S.logs.length < 3;
  return `
  <header class="home-top">
    <div class="brand"><img class="logo" src="/logo.svg" alt="" width="56" height="56"><div><h1 class="t-hero">Bloquinho</h1>${ICON.scrib}</div></div>
    <p class="t-note">caderno de técnicas avançadas</p>
  </header>
  ${how ? `<section class="card card--b card--tilt-b how" aria-label="Como funciona">
    <span class="tape" aria-hidden="true"></span>
    <ol class="how-list">
      <li><b>Monta o treino</b> e escolhe a técnica de cada exercício.</li>
      <li><b>Deixa o celular na sua frente</b> e toca no post-it a cada bloco. O app conta o descanso e avisa com bipe e voz (de fone, fica no ouvido).</li>
      <li><b>No fim da série</b> ele diz se sobe, mantém ou baixa a carga, e quanto você progrediu desde o último treino.</li>
    </ol>
    <div class="how-foot"><button class="link" data-a="hide-how">entendi, esconder</button></div>
  </section>` : ''}
  <h2 class="t-section"><span class="under">Meus treinos</span></h2>
  <div class="cards">${S.workouts.map(wcard).join('') || '<p class="t-muted">Nenhum treino ainda. Cria o primeiro aqui embaixo.</p>'}</div>
  <button class="btn btn--ghost btn--wide add-w" data-a="new-w">+ novo treino</button>
  <h2 class="t-section"><span class="under">Cola das técnicas</span></h2>
  <div class="cola">${Object.values(TECH).map(T => `<div><h3><span class="hl" style="--c:var(${T.color})">${T.name}</span></h3><p>${T.rule({ blocks: T.blocks, reps: T.reps, rest: T.rest, goal: T.goal })}</p></div>`).join('')}</div>
  <footer class="foot">
    ${isStandalone() ? '' : `<button class="btn btn--ghost btn--wide" data-a="install">${ICON.phone}<span>Pôr o Bloquinho na tela do celular</span></button>`}
    <div class="toggles">
      <button class="toggle" data-a="set" data-k="sound" aria-pressed="${!!S.settings.sound}"><span class="toggle-box">${S.settings.sound ? ICON.check : ''}</span>bipe na contagem</button>
      <button class="toggle" data-a="set" data-k="voice" aria-pressed="${!!S.settings.voice}"><span class="toggle-box">${S.settings.voice ? ICON.check : ''}</span>voz (“bloco 3, vai!”)</button>
    </div>
    <p>No iPhone, tira do modo silencioso pra ouvir os avisos.</p>
    <p class="sync"><span class="dot"></span>Seus treinos ficam salvos neste aparelho.</p>
  </footer>`;
}
function wcard(w) {
  const days = [...new Set(S.logs.filter(l => l.wid === w.id).map(l => l.day))].sort();
  const last = days.at(-1);
  const cmp = last ? sessionCompare(w, last) : null;
  const n = w.exercises.length;
  return `<button class="card card--tilt-a wcard" id="wc-${w.id}" data-a="open-w" data-w="${w.id}">
    <span class="tape" aria-hidden="true"></span>
    <span class="wcard-head"><span class="t-card">${esc(w.name || 'Treino sem nome')}</span>${w.example ? '<span class="chip chip--example">exemplo · edita à vontade</span>' : ''}</span>
    <span class="wcard-list">${w.exercises.map(e => `<span class="wcard-ex"><span>${esc(e.name || 'Exercício sem nome')}</span><span class="chip">${TECH[e.tech].name}</span></span>`).join('') || '<span class="wcard-ex t-muted">sem exercícios ainda</span>'}</span>
    <span class="wcard-meta"><span>${n} exercício${n === 1 ? '' : 's'} · ${last ? `último treino em ${fmtDay(last)}` : 'ainda não feito'}</span>${cmp && cmp.pct != null ? deltaChip(cmp.pct) : ''}</span>
  </button>`;
}
const vmini = v => `<span class="delta delta--${v}">${VWORD[v]}</span>`;
function viewWorkout() {
  const w = getW(view.wid);
  if (!w) { view = { name: 'home' }; return viewHome(); }
  if (view.edit) return viewEdit(w);
  const today = dayKey();
  const items = w.exercises.map(e => ({ e, today: logsOf(e.id).filter(l => l.day === today).at(-1), last: lastLog(e.id) }));
  const next = items.find(i => !i.today);
  const doneN = items.filter(i => i.today).length;
  const allDone = w.exercises.length > 0 && !next;
  const cmp = doneN ? sessionCompare(w, today) : null;
  return `
  <nav class="crumbs"><button class="link" data-a="home">← caderno</button><button class="link" data-a="edit-w">editar treino</button></nav>
  <h1 class="t-title">${esc(w.name || 'Treino sem nome')}</h1>
  <p class="t-note">${fmtLong(new Date())} · ${doneN} de ${w.exercises.length} feitos</p>
  ${allDone ? `<p class="alldone"><span class="hl" style="--c:var(--up)">Treino fechado!</span></p>${cmp ? compareCard(w, cmp, true) : ''}` : ''}
  ${next ? `<button class="btn btn--go btn--wide btn--xl go-next" data-a="run" data-e="${next.e.id}">${ICON.play}<span>${doneN ? 'Próximo' : 'Começar'}: ${esc(next.e.name || 'exercício')}</span></button>` : ''}
  <ol class="exlist">${items.map(i => {
    const ref = i.today || i.last;
    const info = ref ? `${i.today ? 'hoje' : fmtDate(ref.ts)}: ${fmt(ref.load)} kg · ${ref.total} reps` : 'ainda sem registro';
    return `<li class="ex${i.today ? ' is-done' : ''}${next && next.e.id === i.e.id && doneN ? ' is-next' : ''}" id="row-${i.e.id}">
      <span class="cb" aria-hidden="true">${i.today ? ICON.check : ''}</span>
      <button class="ex-main" data-a="run" data-e="${i.e.id}">
        <span class="ex-name">${esc(i.e.name || 'Exercício sem nome')}</span>
        <span class="ex-info"><span class="chip">${TECH[i.e.tech].name}</span><span>${esc(info)}</span>${ref ? vmini(ref.verdict) : ''}</span>
      </button>
      <button class="link ex-hist" data-a="hist" data-e="${i.e.id}">histórico</button>
    </li>`;
  }).join('')}</ol>
  ${!w.exercises.length ? `<p class="t-muted" style="margin-top:var(--sp-4)">Esse treino tá vazio. <button class="link" data-a="edit-w">Adicionar exercícios</button></p>` : ''}
  ${!allDone && cmp ? compareCard(w, cmp, false) : ''}`;
}
function compareCard(w, cmp, final) {
  const rows = cmp.rows.map(r => {
    const name = esc(getE(w.id, r.t.eid)?.name || r.t.name || 'Exercício');
    if (!r.p) return `<tr><th scope="row">${name}</th><td>${fmt(r.t.load)}</td><td>${r.t.total}</td><td><span class="t-muted">1ª vez</span></td></tr>`;
    return `<tr><th scope="row">${name}</th><td>${loadPair(r.p.load, r.t.load)}</td><td>${r.p.total}→${r.t.total}</td><td>${deltaChip(r.d.pct)}</td></tr>`;
  }).join('');
  return `<section class="card card--b compare${final ? ' compare--final' : ''}" aria-label="Progresso">
    <span class="tape" aria-hidden="true"></span>
    <p class="t-label">${final ? 'Hoje' : 'Até agora'}${cmp.prevDay ? ` vs. ${fmtDay(cmp.prevDay)}` : ''}</p>
    <p class="compare-say">${progressSay(cmp)}</p>
    <div class="table-wrap"><table class="compare-t">
      <thead><tr><th scope="col">exercício</th><th scope="col">kg</th><th scope="col">reps</th><th scope="col">volume</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    ${cmp.compared ? '<p class="t-note">Volume é carga × reps somadas. É o jeito mais justo de comparar quando a carga muda.</p>' : ''}
  </section>`;
}
function numField(e, k, label) {
  const id = `n-${k}-${e.id}`;
  return `<label class="num" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="numeric" min="${LIMITS[k][0]}" max="${LIMITS[k][1]}" data-in="ex-num" data-e="${e.id}" data-k="${k}" value="${e[k]}"></label>`;
}
function viewEdit(w) {
  return `
  <nav class="crumbs"><button class="link" data-a="edit-done">← pronto</button><span class="t-muted">editando</span></nav>
  <label class="t-label" for="wname">Nome do treino</label>
  <div class="field-wrap" id="fw-wname"><input id="wname" class="field field--display" data-in="w-name" value="${esc(w.name)}" placeholder="Treino A, Peito e costas…" autocomplete="off">${PEN}</div>
  <h2 class="t-section"><span class="under">Exercícios</span></h2>
  <div class="edlist">${w.exercises.map((e, i) => {
    const T = TECH[e.tech];
    return `<div class="card ed" id="ed-${e.id}">
      <div class="ed-row"><span class="ed-n">${i + 1}.</span><div class="field-wrap"><input id="exn-${e.id}" class="field" data-in="ex-name" data-e="${e.id}" value="${esc(e.name)}" placeholder="Nome do exercício" autocomplete="off" aria-label="Nome do exercício ${i + 1}">${PEN}</div></div>
      <div class="tech-pick" role="radiogroup" aria-label="Técnica">${Object.entries(TECH).map(([k, t]) => `<button role="radio" aria-checked="${k === e.tech}" class="tp${k === e.tech ? ' on' : ''}" data-a="ex-tech" data-e="${e.id}" data-t="${k}">${t.name}</button>`).join('')}</div>
      <div class="params">${numField(e, 'blocks', 'blocos')}${T.mode === 'fixed' ? numField(e, 'reps', 'reps por bloco') : numField(e, 'goal', 'meta de reps')}${numField(e, 'rest', 'descanso (s)')}</div>
      <div class="ed-actions">${i > 0 ? `<button class="link" data-a="ex-up" data-e="${e.id}">subir na lista</button>` : '<span></span>'}<button class="link link--danger" data-a="ex-del" data-e="${e.id}">apagar</button></div>
    </div>`;
  }).join('')}</div>
  <button class="btn btn--ghost btn--wide ed-add" data-a="ex-add">+ adicionar exercício</button>
  <div class="ed-foot"><button class="btn btn--wide" data-a="edit-done">Pronto</button><button class="link link--danger" data-a="w-del">apagar este treino</button></div>`;
}

function blockStrip(cfg) {
  const n = cfg.blocks, cur = run.reps.length;
  let cells = '';
  for (let i = 0; i < n; i++) {
    const r = run.reps[i];
    let cls = 'is-todo', inner = '', extra = i === n - 1 && cfg.lastMax ? '<span class="maxb">máx</span>' : '';
    if (r != null) {
      const failed = cfg.mode === 'fixed' && r < cfg.reps;
      cls = failed ? 'is-fail' : 'is-done';
      inner = tally(r, failed ? cfg.reps - r : 0, i + 1, i === run.animIdx);
    } else if (i === cur && run.phase === 'work') {
      cls = 'is-cur';
      inner = cfg.mode === 'fixed' ? tally(0, cfg.reps, i + 1) : '<span class="q">?</span>';
      extra += ICON.circle;
    } else {
      if (i === cur && run.phase === 'rest') cls += ' is-next';
      inner = cfg.mode === 'fixed' && run.phase === 'ready' ? tally(0, cfg.reps, i + 1) : '';
    }
    cells += `<div class="cell ${cls}"><span class="cell-n">B${i + 1}</span>${inner}${extra}</div>`;
  }
  return `<div class="blocks" style="--n:${n}" aria-label="${run.reps.length} de ${n} blocos feitos">${cells}</div>`;
}
function viewRun() {
  const e = curEx();
  if (!e) { run = null; clearRunDraft(); view = { name: 'home' }; return viewHome(); }
  const T = TECH[e.tech], cfg = cfgOf(e);
  const soundOn = S.settings.sound || S.settings.voice;
  let stage;
  if (run.phase === 'ready') stage = stageReady(e, cfg, T);
  else if (run.phase === 'work') stage = stageWork(cfg);
  else if (run.phase === 'rest') stage = stageRest(cfg);
  else stage = stageDone(e, cfg);
  return `<section class="run">
    <header class="run-top">
      <button class="link" data-a="run-exit">← sair</button>
      <span class="chip">${T.name}</span>
      <button class="btn-round" data-a="mute" aria-label="${soundOn ? 'Desligar som e voz' : 'Ligar som e voz'}" aria-pressed="${soundOn}">${ICON.sound(soundOn)}</button>
    </header>
    <h1 class="t-card run-name">${esc(e.name || 'Exercício')}${run.phase !== 'ready' && run.load != null ? ` <small>· ${fmt(run.load)} kg</small>` : ''}</h1>
    ${run.phase !== 'done' ? blockStrip(cfg) : ''}
    <div class="stage">${stage}</div>
  </section>`;
}
function stageReady(e, cfg, T) {
  const plan = planFor(e);
  return `
    <p class="t-note">${T.rule(cfg)}</p>
    <div class="card card--b plan"><span class="tape" aria-hidden="true"></span><span class="t-label">Plano de hoje</span><p>${plan.html}</p></div>
    <div>
      <label class="t-label" for="loadIn">Carga de hoje</label>
      <div class="load-row">
        <button class="key" data-a="load" data-d="-2.5" aria-label="menos 2,5 kg">−2,5</button>
        <button class="key" data-a="load" data-d="-1" aria-label="menos 1 kg">−1</button>
        <div class="load-in"><input id="loadIn" data-in="load" inputmode="decimal" autocomplete="off" value="${run.load != null ? String(run.load).replace('.', ',') : ''}" placeholder="0"><span>kg</span></div>
        <button class="key" data-a="load" data-d="1" aria-label="mais 1 kg">+1</button>
        <button class="key" data-a="load" data-d="2.5" aria-label="mais 2,5 kg">+2,5</button>
      </div>
    </div>
    <div class="spacer"></div>
    <button class="btn btn--go btn--wide btn--xl" data-a="begin">${ICON.play}<span>Começar a série</span></button>
    <p class="t-note hint">Deixa o celular de pé na sua frente. A cada bloco, um toque no post-it.</p>`;
}
function stageWork(cfg) {
  const i = run.reps.length, isLast = i === cfg.blocks - 1;
  const lastMax = isLast && cfg.lastMax;
  let sub;
  if (cfg.mode === 'count') sub = 'até a falha';
  else if (lastMax) sub = '<span class="hl" style="--c:var(--hl-p)">último: máximo de reps!</span>';
  else sub = `${cfg.reps} reps`;
  const secondary = [];
  if (cfg.mode === 'fixed' && !lastMax) secondary.push(`<button class="btn btn--warn" data-a="fail">Falhei antes de ${cfg.reps}</button>`);
  if (cfg.mode === 'count' && i > 0) secondary.push('<button class="btn btn--ghost" data-a="end-set">Encerrar aqui</button>');
  if (i > 0) secondary.push(`<button class="link" data-a="undo">desfazer bloco ${i}</button>`);
  return `
    <div class="cue"><span class="cue-k">bloco</span><b>${i + 1}</b><span class="cue-of">/${cfg.blocks}</span></div>
    <p class="cue-sub">${sub}</p>
    <button class="postit" data-a="block-done" aria-label="Terminei o bloco ${i + 1}">
      <span class="postit-big">${isLast ? 'Terminei!' : 'Terminei o bloco'}</span>
      <span class="postit-small">toca aqui</span>
    </button>
    ${secondary.length ? `<div class="row2">${secondary.join('')}</div>` : ''}`;
}
function stageRest(cfg) {
  const ms = Math.max(0, run.restEnd - Date.now());
  const sec = Math.ceil(ms / 1000), nextI = run.reps.length;
  const nextLast = nextI === cfg.blocks - 1 && (cfg.lastMax || cfg.mode === 'count');
  const done = run.reps.length - 1;
  return `
    <div class="timer${sec <= 3 ? ' hot' : ''}" id="timer" role="timer" aria-label="descanso">
      <svg viewBox="0 0 200 200" aria-hidden="true"><circle class="ring-bg" cx="100" cy="100" r="84"/><circle class="ring-fg" id="ringFg" cx="100" cy="100" r="84" stroke-dasharray="${RING.toFixed(1)}" style="stroke-dashoffset:${(RING * (1 - ms / run.restMs)).toFixed(1)}"/></svg>
      <b id="count">${sec}</b>
    </div>
    <p class="rest-sub">descansa… <span class="t-muted">próximo: bloco ${nextI + 1}${nextLast ? ', o último' : ''}</span></p>
    ${cfg.mode === 'count' ? `<div class="repadj"><span>Quantas reps saíram no bloco ${done + 1}?</span>${stepper(done)}</div>` : ''}
    <div class="spacer"></div>
    <div class="row2"><button class="btn btn--ghost" data-a="undo">desfazer bloco ${done + 1}</button><button class="btn" data-a="skip">${ICON.play}<span>já vou</span></button></div>`;
}
function stepper(i) {
  return `<div class="stepper"><button class="btn-round" data-a="rep" data-i="${i}" data-d="-1" aria-label="menos uma rep no bloco ${i + 1}">−</button><output>${run.reps[i]}</output><button class="btn-round" data-a="rep" data-i="${i}" data-d="1" aria-label="mais uma rep no bloco ${i + 1}">+</button></div>`;
}
function stageDone(e, cfg) {
  const ev = evaluate(cfg, run.reps, run.load);
  const vc = verdictCopy(cfg, ev, run.reps);
  const prev = lastLog(e.id);
  let prog;
  if (prev) {
    const d = exDelta({ load: run.load, total: ev.total }, prev);
    const hasLoad = prev.load != null || run.load != null;
    prog = `<section class="card compare compare--ex" aria-label="Comparado ao último treino">
      <p class="t-label">Comparado a ${fmtDate(prev.ts)}</p>
      <p class="compare-say">${dirOf(d.pct) === 'up' ? `Progrediu <span class="circled">${fmtPct(d.pct)}${ICON.ring}</span> em volume.` : dirOf(d.pct) === 'down' ? `${fmtPct(d.pct).slice(1)} abaixo em volume. Bola pra frente.` : 'Mesmo volume da última vez.'}</p>
      <table class="compare-t">
        <thead><tr><th scope="col"></th><th scope="col">antes</th><th scope="col">hoje</th><th scope="col"></th></tr></thead>
        <tbody>
          ${hasLoad ? `<tr><th scope="row">carga</th><td>${fmt(prev.load)} kg</td><td>${fmt(run.load)} kg</td><td>${deltaNum(d.dLoad, ' kg')}</td></tr>` : ''}
          <tr><th scope="row">reps</th><td>${prev.total}</td><td>${ev.total}</td><td>${deltaNum(d.dReps)}</td></tr>
          <tr><th scope="row">volume</th><td>${fmt(d.pv)}</td><td>${fmt(d.nv)}</td><td>${deltaChip(d.pct)}</td></tr>
        </tbody>
      </table>
    </section>`;
  } else prog = '<p class="t-note">Primeira vez nesse exercício. No próximo treino eu mostro quanto você progrediu.</p>';
  const askLast = cfg.lastMax || cfg.mode === 'count';
  const rows = run.reps.map((r, i) => {
    const failed = cfg.mode === 'fixed' && r < cfg.reps;
    const ask = askLast && i === run.reps.length - 1 && (cfg.mode === 'count' || i === cfg.blocks - 1);
    return `<div class="rrow${failed ? ' fail' : ''}${ask ? ' ask' : ''}">
      <span class="rn">B${i + 1}</span>
      <span class="rt">${tally(r, 0, i + 1)}</span>
      ${stepper(i)}
      ${i === run.reps.length - 1 && run.reps.length > 1 ? `<button class="xbtn" data-a="rm-block" aria-label="remover bloco ${i + 1}">×</button>` : '<span></span>'}
    </div>`;
  }).join('');
  const canAdd = run.reps.length < cfg.blocks && (cfg.mode === 'count' || ev.failBlock == null || ev.failBlock > run.reps.length);
  return `
    <div class="done-head"><span class="hl" style="--c:var(--up)">Fim da série!</span><span class="total">${ev.total} reps</span></div>
    <div>
      <span class="t-label">Confere as reps de cada bloco</span>
      <div class="rrows">${rows}</div>
      ${canAdd ? '<button class="link addb" data-a="add-block">+ esqueci de marcar um bloco</button>' : ''}
    </div>
    ${prog}
    <div class="card card--b stamp" style="--c:var(--${ev.verdict})"><h3>${vc.title}</h3><p>${vc.body}</p></div>
    <div class="done-actions">
      <button class="btn btn--go btn--wide btn--xl" data-a="save">Anotar no caderno</button>
      <button class="link link--danger" data-a="discard">descartar esta série</button>
    </div>`;
}
function viewAsk() {
  const cfg = cfgOf(curEx()); const i = run.reps.length;
  return `<div class="backdrop" data-a="ask-close">
    <div class="card bsheet" role="dialog" aria-modal="true" aria-labelledby="askT" data-a="noop">
      <h2 id="askT">Quantas reps saíram no bloco ${i + 1}?</h2>
      <div class="picks">${Array.from({ length: cfg.reps }, (_, k) => `<button class="btn-round btn-round--pick" data-a="fail-pick" data-v="${k}">${k}</button>`).join('')}</div>
      <button class="link" data-a="ask-close">voltar, ainda não falhei</button>
    </div>
  </div>`;
}
function viewHistory() {
  const w = getW(view.wid), e = getE(view.wid, view.eid);
  if (!e) { view = { name: 'workout', wid: view.wid }; return viewWorkout(); }
  const logs = logsOf(e.id);
  const rows = logs.map((l, i) => {
    const p = logs[i - 1];
    return `<tr>
      <td>${fmtDate(l.ts)}</td>
      <td>${fmt(l.load)}</td>
      <td class="reps">${l.reps.join('·')} <b>= ${l.total}</b></td>
      <td>${p ? deltaChip(exDelta(l, p).pct) : '<span class="t-muted">—</span>'}</td>
      <td>${vmini(l.verdict)}</td>
      <td><button class="del" data-a="del-log" data-l="${l.id}" aria-label="apagar registro de ${fmtDate(l.ts)}">×</button></td>
    </tr>`;
  }).reverse().join('');
  return `
  <nav class="crumbs"><button class="link" data-a="open-w" data-w="${w.id}">← ${esc(w.name || 'treino')}</button></nav>
  <h1 class="t-title">${esc(e.name || 'Exercício')}</h1>
  <p class="t-note"><span class="chip">${TECH[e.tech].name}</span> · ${logs.length} registro${logs.length === 1 ? '' : 's'}</p>
  ${logs.length >= 2 ? chart(logs) : ''}
  ${logs.length ? `<div class="table-wrap hist"><table class="compare-t">
    <thead><tr><th scope="col">data</th><th scope="col">kg</th><th scope="col">reps por bloco</th><th scope="col">volume</th><th scope="col">próx.</th><th scope="col"><span class="t-muted" aria-label="apagar"></span></th></tr></thead>
    <tbody>${rows}</tbody></table></div>`
    : '<p class="t-muted" style="margin-top:var(--sp-4)">Ainda não tem nada anotado aqui. Faz uma série e ela aparece nesta página.</p>'}
  <div style="margin-top:var(--sp-5)"><button class="btn btn--go btn--wide" data-a="run" data-e="${e.id}">${ICON.play}<span>Fazer agora</span></button></div>`;
}
function chart(all) {
  const L = all.slice(-10), W = 340, H = 170, pl = 20, pr = 20, pt = 30, pb = 40;
  const vals = L.map(l => l.total), max = Math.max(...vals), min = Math.min(...vals), span = Math.max(1, max - min);
  const x = i => L.length === 1 ? W / 2 : pl + i * (W - pl - pr) / (L.length - 1);
  const y = v => pt + (1 - (v - min) / span) * (H - pt - pb);
  const d = L.map((l, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(l.total).toFixed(1)}`).join('');
  const pts = L.map((l, i) => `<circle class="pt ${l.verdict}" cx="${x(i).toFixed(1)}" cy="${y(l.total).toFixed(1)}" r="5.5"/>
    <text class="v" x="${x(i).toFixed(1)}" y="${(y(l.total) - 12).toFixed(1)}">${l.total}</text>
    <text class="kg" x="${x(i).toFixed(1)}" y="${H - 20}">${fmt(l.load)}kg</text>
    <text class="kg" x="${x(i).toFixed(1)}" y="${H - 6}">${fmtDate(l.ts)}</text>`).join('');
  return `<figure class="chart">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Total de reps nos últimos ${L.length} treinos"><path class="ln" d="${d}"/>${pts}</svg>
    <figcaption class="t-note">Total de reps por treino. A bolinha mostra o veredito: verde sobe, amarelo mantém, rosa baixa.</figcaption>
  </figure>`;
}

/* =========================================================
   Render
   ========================================================= */
function render() {
  let html;
  switch (view.name) {
    case 'workout': html = viewWorkout(); break;
    case 'run': html = run ? viewRun() : (view = { name: 'home' }, viewHome()); break;
    case 'history': html = viewHistory(); break;
    default: html = viewHome();
  }
  $('#app').innerHTML = html;
  $('#sheetLayer').innerHTML = view.name === 'run' && run && run.ask ? viewAsk() : '';
  if (run) run.animIdx = -1;
  if (view.name === 'run' && run && run.phase === 'rest' && !tickT) startTick();
  if (focusAfter) {
    const el = document.getElementById(focusAfter); focusAfter = null;
    if (el) { el.focus(); if (el.select) el.select(); }
  }
  const cbs = afterRender; afterRender = [];
  cbs.forEach(fn => { try { fn(); } catch (e) {} });
}
function go(v) { view = v; armed = null; window.scrollTo(0, 0); render(); }
function confirmTap(el, key, label) {
  if (armed === key && Date.now() - armedAt < 3500) { armed = null; clearTimeout(armedTimer); return true; }
  armed = key; armedAt = Date.now();
  el.textContent = label; el.classList.add('armed');
  clearTimeout(armedTimer);
  armedTimer = setTimeout(() => { if (armed === key) { armed = null; render(); } }, 3500);
  return false;
}
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2800);
}

/* =========================================================
   Ações
   ========================================================= */
const ACT = {
  noop() {},
  install() { openInstall(); },
  'install-close'() { closeInstall(); },
  async 'install-go'() {
    if (!deferredPrompt) return;
    const p = deferredPrompt; deferredPrompt = null;
    try { p.prompt(); const r = await p.userChoice; if (r && r.outcome === 'accepted') { closeInstall(); return; } } catch (e) {}
    renderInstall();
  },
  home() {
    const fw = fresh.w; fresh.w = null;
    if (fw) afterRender.push(() => drawIn($(`#wc-${fw}`), { delay: 150 }));
    go({ name: 'home' });
  },
  'hide-how'() { S.settings.hideHow = true; saveCaderno(); render(); },
  set(el) { const k = el.dataset.k; S.settings[k] = !S.settings[k]; saveCaderno(); render(); },
  'open-w'(el) { go({ name: 'workout', wid: el.dataset.w }); },
  'new-w'() {
    const w = { id: newId(), name: '', exercises: [mkEx('')] };
    S.workouts.push(w); saveCaderno();
    fresh.w = w.id; fresh.ex.add(w.exercises[0].id);
    focusAfter = 'wname';
    afterRender.push(() => { lineIn($('#fw-wname')); drawIn($(`#ed-${w.exercises[0].id}`), { delay: 300 }); });
    go({ name: 'workout', wid: w.id, edit: true });
  },
  'edit-w'() { view.edit = true; render(); },
  'edit-done'() {
    const w = getW(view.wid);
    // treino criado e abandonado sem nada escrito não vira lixo no caderno
    if (w && !w.name.trim() && !w.exercises.some(e => e.name.trim()) && !S.logs.some(l => l.wid === w.id)) {
      S.workouts = S.workouts.filter(x => x.id !== w.id); fresh.ex.clear();
      if (fresh.w === w.id) fresh.w = null;
      saveCaderno(); go({ name: 'home' }); return;
    }
    const ids = [...fresh.ex]; fresh.ex.clear();
    afterRender.push(() => writeIn(ids.map(id => document.getElementById(`row-${id}`)).filter(Boolean)));
    go({ ...view, edit: false });
  },
  'ex-tech'(el) {
    const w = getW(view.wid), e = getE(view.wid, el.dataset.e), T = TECH[el.dataset.t];
    if (!e || e.tech === el.dataset.t) return;
    Object.assign(e, { tech: el.dataset.t, blocks: T.blocks, reps: T.reps || 4, rest: T.rest, goal: T.goal });
    touchWorkout(w); saveCaderno(); render();
  },
  'ex-up'(el) {
    const w = getW(view.wid), i = w.exercises.findIndex(e => e.id === el.dataset.e);
    if (i > 0) { [w.exercises[i - 1], w.exercises[i]] = [w.exercises[i], w.exercises[i - 1]]; touchWorkout(w); saveCaderno(); render(); }
  },
  'ex-del'(el) {
    if (!confirmTap(el, 'ex-del:' + el.dataset.e, 'apagar mesmo?')) return;
    const w = getW(view.wid); w.exercises = w.exercises.filter(e => e.id !== el.dataset.e);
    fresh.ex.delete(el.dataset.e);
    touchWorkout(w); saveCaderno(); render();
  },
  'ex-add'() {
    const w = getW(view.wid), e = mkEx('');
    w.exercises.push(e); fresh.ex.add(e.id); touchWorkout(w); saveCaderno();
    focusAfter = 'exn-' + e.id;
    afterRender.push(() => drawIn(document.getElementById(`ed-${e.id}`), { delay: 80 }));
    render();
  },
  'w-del'(el) {
    if (!confirmTap(el, 'w-del', 'apagar o treino inteiro?')) return;
    S.workouts = S.workouts.filter(w => w.id !== view.wid);
    if (fresh.w === view.wid) fresh.w = null;
    saveCaderno(); go({ name: 'home' }); toast('Treino apagado.');
  },
  run(el) {
    const wid = view.wid, e = getE(wid, el.dataset.e); if (!e) return;
    run = { wid, eid: e.id, phase: 'ready', phaseAt: Date.now(), load: planFor(e).load, reps: [], animIdx: -1 };
    go({ name: 'run', wid });
  },
  hist(el) { go({ name: 'history', wid: view.wid, eid: el.dataset.e }); },
  load(el) {
    const inp = $('#loadIn'); const cur = parseNum(inp ? inp.value : run.load) ?? 0;
    run.load = Math.max(0, Math.round((cur + parseFloat(el.dataset.d)) * 10) / 10);
    render();
  },
  begin() {
    const inp = $('#loadIn'); if (inp) run.load = parseNum(inp.value);
    audioUnlock(); requestWake();
    const cfg = cfgOf(curEx());
    run.reps = []; setPhase('work');
    cue('start', 1, cfg.blocks === 1);
    saveRunDraft(); render(); window.scrollTo(0, 0);
  },
  'block-done'() {
    if (!run || run.phase !== 'work' || Date.now() - run.phaseAt < 400) return;
    audioUnlock();
    const cfg = cfgOf(curEx()), i = run.reps.length, isLast = i === cfg.blocks - 1;
    pushBlock(cfg.mode === 'count' ? defaultCount(i) : cfg.reps);
    if (isLast) finish(); else startRest();
  },
  fail() { run.ask = 'fail'; render(); },
  'fail-pick'(el) { pushBlock(parseInt(el.dataset.v, 10)); run.ask = null; finish(); },
  'ask-close'() { run.ask = null; render(); },
  'end-set'() { finish(); },
  undo() { stopTick(); run.reps.pop(); setPhase('work'); saveRunDraft(); render(); },
  skip() { endRest(); },
  rep(el) {
    const i = +el.dataset.i; run.reps[i] = clamp((run.reps[i] || 0) + (+el.dataset.d), 0, 99); saveRunDraft(); render();
  },
  'rm-block'() { if (run.reps.length > 1) { run.reps.pop(); saveRunDraft(); render(); } },
  'add-block'() {
    const cfg = cfgOf(curEx());
    if (run.reps.length < cfg.blocks) { run.reps.push(cfg.mode === 'fixed' ? cfg.reps : (run.reps.at(-1) || 1)); saveRunDraft(); render(); }
  },
  save() {
    const e = curEx(), w = getW(run.wid), cfg = cfgOf(e), ev = evaluate(cfg, run.reps, run.load);
    const prev = lastLog(e.id);
    const log = { id: newId(), ts: Date.now(), day: dayKey(), wid: run.wid, eid: e.id, name: e.name, tech: e.tech, cfg,
      load: run.load, reps: run.reps.slice(), total: ev.total, verdict: ev.verdict, failBlock: ev.failBlock, next: ev.next };
    addLog(log);
    touchWorkout(w); saveCaderno();
    const wid = run.wid; run = null; clearRunDraft(); releaseWake();
    const today = dayKey();
    const allDone = w.exercises.every(x => logsOf(x.id).some(l => l.day === today));
    const sess = allDone ? sessionCompare(w, today) : null;
    let msg = 'Anotado no caderno.';
    if (allDone) {
      msg = sess && sess.pct != null && dirOf(sess.pct) === 'up' ? `Treino fechado! ${fmtPct(sess.pct)} vs. o treino anterior.` : 'Treino fechado! Tudo anotado.';
      afterRender.push(() => drawIn($('.compare--final'), { delay: 250 }));
    } else if (prev) {
      const d = exDelta(log, prev), dir = dirOf(d.pct);
      msg = dir === 'up' ? `Anotado! ${fmtPct(d.pct)} de volume vs. ${fmtDate(prev.ts)}.`
        : dir === 'down' ? `Anotado. ${fmtPct(d.pct)} vs. ${fmtDate(prev.ts)}, bola pra frente.`
        : `Anotado. Igual a ${fmtDate(prev.ts)}.`;
    }
    go({ name: 'workout', wid }); toast(msg);
  },
  discard(el) {
    if (!confirmTap(el, 'discard', 'toca de novo pra descartar')) return;
    const wid = run.wid; run = null; clearRunDraft(); releaseWake(); go({ name: 'workout', wid });
  },
  'run-exit'(el) {
    if (run && run.reps.length && run.phase !== 'ready') { if (!confirmTap(el, 'exit', 'sair sem anotar?')) return; }
    stopTick(); const wid = run ? run.wid : view.wid; run = null; clearRunDraft(); releaseWake(); go({ name: 'workout', wid });
  },
  mute() {
    const on = S.settings.sound || S.settings.voice;
    S.settings.sound = S.settings.voice = !on;
    if (on) { try { speechSynthesis.cancel(); } catch (e) {} } else audioUnlock();
    saveCaderno(); render();
  },
  'del-log'(el) {
    if (!confirmTap(el, 'del:' + el.dataset.l, 'apagar?')) return;
    deleteLog(el.dataset.l); render(); toast('Registro apagado.');
  }
};
const INP = {
  'w-name'(el) { const w = getW(view.wid); if (!w) return; w.name = el.value; touchWorkout(w); saveCaderno(); },
  'ex-name'(el) { const w = getW(view.wid), e = getE(view.wid, el.dataset.e); if (!e) return; e.name = el.value; touchWorkout(w); saveCaderno(); },
  load(el) { if (run) { run.load = parseNum(el.value); saveRunDraft(); } }
};
const CHG = {
  'ex-num'(el) {
    const w = getW(view.wid), e = getE(view.wid, el.dataset.e), k = el.dataset.k; if (!e) return;
    const v = parseInt(el.value, 10);
    e[k] = clamp(Number.isFinite(v) ? v : e[k], LIMITS[k][0], LIMITS[k][1]);
    el.value = e[k]; touchWorkout(w); saveCaderno();
  }
};
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el) return;
  const fn = ACT[el.dataset.a]; if (fn) fn(el, ev);
});
document.addEventListener('input', ev => {
  const el = ev.target.closest('[data-in]'); if (el && INP[el.dataset.in]) INP[el.dataset.in](el);
  if (ev.target.matches && ev.target.matches('.field-wrap .field')) penFollow(ev.target, true);
});
document.addEventListener('change', ev => { const el = ev.target.closest('[data-in]'); if (el && CHG[el.dataset.in]) CHG[el.dataset.in](el); });
document.addEventListener('focusin', ev => { if (ev.target.matches && ev.target.matches('.field-wrap .field')) penFollow(ev.target, false); });
document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('input')) ev.target.blur();
  if (ev.key === 'Escape' && installOpen) { closeInstall(); return; }
  if (ev.key === 'Escape' && run && run.ask) { run.ask = null; render(); }
});

/* =========================================================
   Início
   ========================================================= */
lsLoad();
if (!S.workouts.length && !S.seeded) S.workouts = [exampleWorkout()];
restoreRun();
render();

let seenInstall = false;
try { seenInstall = !!localStorage.getItem(LS_INSTALL); } catch (e) {}
if (!isStandalone() && (isIOS || isAndroid) && !seenInstall && !run) setTimeout(openInstall, 900);
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
})();
