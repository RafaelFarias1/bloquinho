/* Bloquinho: app sem build. O caderno fica no aparelho (localStorage) e sobe
   pra conta na nuvem quando tem internet (cloud.js, window.Cloud).
   Animações em fx.js (window.FX). */
(() => {
'use strict';
const FX = window.FX, Cloud = window.Cloud;

/* =========================================================
   Técnicas
   mode: sets (séries normais), fixed (blocos de reps fixas),
   count (blocos até a falha) e time (cronômetro, pra cardio).
   ========================================================= */
const zone = c => Math.max(1, Math.ceil(c.blocks / 2));
const TECH = {
  normal: {
    name: 'Séries normais', mode: 'sets', lastMax: false, blocks: 3, reps: 10, rest: 90, goal: 0, color: '--pen',
    rule: c => c.repsMin
      ? `${c.blocks} séries de ${c.repsMin} a ${c.reps} reps com ${fmtRest(c.rest)} de descanso entre elas. Dá pra mudar a carga de uma série pra outra. Chegou nas ${c.reps} reps em todas? Sobe a carga. Ficou abaixo de ${c.repsMin}? Baixa.`
      : `${c.blocks} séries de ${c.reps} reps com ${fmtRest(c.rest)} de descanso entre elas. Dá pra mudar a carga de uma série pra outra. Fechou todas com ${c.reps} reps? Sobe a carga.`,
    first: c => c.repsMin ? `escolhe uma carga que dá pra fazer entre ${c.repsMin} e ${c.reps} reps` : `escolhe uma carga que dá pra fazer ${c.reps} reps com 1 ou 2 de sobra`
  },
  muscle: {
    name: 'Muscle Round', mode: 'fixed', lastMax: true, blocks: 6, reps: 4, rest: 10, goal: 20, color: '--stamp',
    rule: c => `${c.blocks} blocos de ${c.reps} reps com ${fmtRest(c.rest)} de descanso. Carga de 8 a 12 reps. O ideal é falhar entre o ${zone(c)}º e o ${zone(c) + 1}º bloco. Chegou no ${c.blocks}º? Vai até a falha.`,
    first: () => 'escolhe uma carga que você faria de 8 a 12 reps direto'
  },
  cluster: {
    name: 'Cluster set', mode: 'fixed', lastMax: false, blocks: 5, reps: 3, rest: 20, goal: 20, color: '--ok',
    rule: c => `${c.blocks} blocos de ${c.reps} reps com ${fmtRest(c.rest)} de descanso. Carga pesada, de umas 5 a 6 reps. Fechou todos os blocos? Sobe a carga.`,
    first: () => 'escolhe uma carga que você faria umas 5 ou 6 reps direto'
  },
  restpause: {
    name: 'Rest-pause', mode: 'count', lastMax: false, blocks: 3, reps: 0, rest: 15, goal: 20, color: '--print',
    rule: c => `Vai até a falha, descansa ${fmtRest(c.rest)} e continua, ${c.blocks} blocos no total. Anota as reps de cada um. Somou ${c.goal} reps? Sobe a carga.`,
    first: () => 'escolhe uma carga que você faria de 8 a 10 reps direto'
  },
  time: {
    name: 'Tempo (cardio)', mode: 'time', lastMax: false, blocks: 1, reps: 0, rest: 0, goal: 20, color: '--orange',
    rule: c => `Esteira, bike, corrida, prancha: o app marca o tempo e avisa quando bater a meta de ${c.goal} min. No fim, dá pra anotar a distância.`,
    first: c => `vai no seu ritmo, a meta é ${c.goal} min`
  }
};
const LIMITS = { blocks: [1, 12], reps: [1, 50], rest: [3, 600], goal: [1, 300] };
/* séries normais podem ter faixa de reps (5 a 9): o mínimo fica em goal, que essa técnica não usa (0 = reps fixas) */
const repsTxt = c => c.repsMin ? `${c.repsMin} a ${c.reps}` : `${c.reps}`;
const lowOf = c => c.mode === 'sets' && c.repsMin ? c.repsMin : c.reps;
const spec = c => c.mode === 'time' ? `meta de ${c.goal} min`
  : c.mode === 'count' ? `${c.blocks} blocos até a falha · ${fmtRest(c.rest)} de descanso · meta de ${c.goal} reps`
  : `${c.blocks} ${c.mode === 'sets' ? 'séries' : 'blocos'} × ${c.mode === 'sets' ? repsTxt(c) : c.reps} reps · ${fmtRest(c.rest)} de descanso`;
/* bloco é masculino, série é feminina: as frases mudam junto */
const UNIT = {
  block: { one: 'bloco', many: 'blocos', short: 'B', next: 'próximo', last: 'o último', done: 'Fim da série!', said: 'Fim da série.' },
  set: { one: 'série', many: 'séries', short: 'S', next: 'próxima', last: 'a última', done: 'Fim do exercício!', said: 'Fim do exercício.' }
};
const unit = c => c.mode === 'sets' ? UNIT.set : UNIT.block;
const REASONS = [['sono', 'dormi mal'], ['comida', 'comi mal'], ['cansaco', 'cansaço'], ['estresse', 'estresse'], ['dor', 'dor ou lesão'],
  ['doente', 'doente'], ['tempo', 'pouco tempo'], ['cheia', 'academia cheia'], ['vontade', 'sem vontade'], ['outro', 'outro motivo']];
const REASON_LABEL = Object.fromEntries(REASONS);
const FREE_PICKS = ['Corrida', 'Caminhada', 'Bike', 'Natação', 'Jiu-jitsu', 'Futebol', 'Yoga', 'Alongamento'];
/* jiu-jitsu ganha ficha própria: kimono, rolas, golpes que encaixou e o que aprendeu */
const isBJJ = name => /jiu|bjj|\bjj\b/i.test(name || '');
const BJJ_GOLPES = ['Armlock', 'Triângulo', 'Mata-leão', 'Kimura', 'Americana', 'Guilhotina', 'Omoplata', 'Estrangulamento de gola', 'Chave de pé', 'Raspagem', 'Passagem de guarda', 'Queda', 'Pegada nas costas', 'Montada'];
const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/* =========================================================
   Utilidades
   ========================================================= */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const newId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const dayKey = (d = new Date()) => d.toLocaleDateString('sv-SE');
const dateOf = k => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10), 12);
const fmt = n => n == null || n === '' ? '—' : Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
const fmtDate = ts => new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const fmtDay = k => k ? `${k.slice(8, 10)}/${k.slice(5, 7)}` : '';
const fmtLong = d => d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtTime = ts => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const fmtRest = s => s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`;
const fmtClock = ms => { const t = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const sameDay = ts => dayKey(new Date(ts)) === dayKey();
const sign = n => n > 0 ? '+' : n < 0 ? '−' : '';
const fmtPct = p => { const a = Math.abs(p * 100); return sign(p) + (a < 10 ? a.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : Math.round(a).toLocaleString('pt-BR')) + '%'; };
const fmtSigned = (n, unit = '') => sign(n) + fmt(Math.abs(n)) + unit;
const parseNum = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : null; };
const numIn = v => v != null ? String(v).replace('.', ',') : '';
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const listPt = a => { try { return new Intl.ListFormat('pt-BR', { type: 'conjunction' }).format(a.map(String)); } catch (e) { return a.join(', '); } };

/* =========================================================
   Estado e persistência
   Cada conta tem o próprio caderno no aparelho. O de antes do login
   (bloquinho:v1) vai pra primeira conta que entrar neste aparelho.
   ========================================================= */
const LS_LEGACY = 'bloquinho:v1', LS_RUN = 'bloquinho:run', LS_INSTALL = 'bloquinho:install-seen';
const DEFAULTS = { sound: true, voice: true, hideHow: false, seeded: false, theme: 'auto' };
const S = { user: null, workouts: [], logs: [], sessions: [], settings: { ...DEFAULTS } };
let view = { name: 'home' };
let run = null;
let sheet = null;                                        // folha de baixo: motivo da queda ou outra atividade
const blankAuth = () => ({ mode: 'login', email: '', phone: '', pass: '', err: '', msg: '', busy: false });
let auth = blankAuth();
let recovering = Cloud.recovery;                         // abriu o link de "esqueci a senha"
let sync = { state: 'ok', pending: 0 };
let armed = null, armedAt = 0, armedTimer = null;
let focusAfter = null;
let afterRender = [];
let busy = false;                                        // enquanto a borracha trabalha
let needRender = false;                                  // chegou coisa da nuvem enquanto você digitava
const fresh = { w: null, ex: new Set(), done: null, closed: false };   // o que acabou de acontecer, pra animar

const lsKey = () => `bloquinho:u:${S.user.id}`;
function resetState() { S.workouts = []; S.logs = []; S.sessions = []; S.settings = { ...DEFAULTS }; }
function lsLoad() {
  try {
    const d = JSON.parse(localStorage.getItem(lsKey()) || 'null');
    if (!d) return;
    S.workouts = d.workouts || [];
    S.logs = (d.logs || []).sort((a, b) => a.ts - b.ts);
    S.sessions = d.sessions || [];
    S.settings = { ...S.settings, ...(d.settings || {}) };
    migrateSessions();
  } catch (e) {}
}
let persistAsked = false;
function lsSave() {
  if (!S.user) return;
  try { localStorage.setItem(lsKey(), JSON.stringify({ workouts: S.workouts, logs: S.logs, sessions: S.sessions, settings: S.settings })); }
  catch (e) { toast('Não deu pra salvar no aparelho. Confere se o navegador não tá em aba anônima.'); }
  Cloud.queue();
  if (!persistAsked) { persistAsked = true; try { navigator.storage && navigator.storage.persist && navigator.storage.persist().catch(() => {}); } catch (e) {} }
}
function saveCaderno() { S.settings.seeded = true; lsSave(); }
function addLog(l) { S.logs.push(l); S.logs.sort((a, b) => a.ts - b.ts); S.settings.seeded = true; lsSave(); }
function deleteLog(id) { S.logs = S.logs.filter(l => l.id !== id); lsSave(); }
/* o caderno de antes do login vem junto na primeira conta que entrar aqui */
function importLegacy(accountEmpty) {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(LS_LEGACY) || 'null'); } catch (e) {}
  if (!d) return false;
  try { localStorage.setItem(LS_LEGACY + ':levado', JSON.stringify(d)); localStorage.removeItem(LS_LEGACY); } catch (e) {}
  const logs = d.logs || [];
  if (!d.seeded && !logs.length) return false;           // só tinha o treino de exemplo
  const has = new Set(S.workouts.map(w => w.id));
  const ws = (d.workouts || []).filter(w => !has.has(w.id) && (accountEmpty || !w.example));
  const known = new Set(S.logs.map(l => l.id)), knownS = new Set(S.sessions.map(s => s.id));
  S.workouts.push(...ws);
  S.logs.push(...logs.filter(l => !known.has(l.id)));
  S.logs.sort((a, b) => a.ts - b.ts);
  S.sessions.push(...(d.sessions || []).filter(s => !knownS.has(s.id)));
  if (accountEmpty) S.settings = { ...S.settings, ...(d.settings || {}) };
  S.settings.seeded = true;
  migrateSessions();
  return !!(ws.length || logs.length);
}

function mkEx(name, tech = 'normal') {
  const T = TECH[tech];
  return { id: newId(), name, tech, blocks: T.blocks, reps: T.reps || 4, rest: T.rest, goal: T.goal };
}
function exampleWorkout() {
  return { id: newId(), name: 'Treino A', example: true, exercises: [
    mkEx('Supino inclinado com halteres'), mkEx('Puxada frontal'), mkEx('Cadeira extensora', 'muscle'), mkEx('Elevação lateral'), mkEx('Esteira', 'time')
  ] };
}
const getW = id => S.workouts.find(w => w.id === id);
const getE = (wid, eid) => getW(wid)?.exercises.find(e => e.id === eid);
const logsOf = eid => S.logs.filter(l => l.eid === eid);
const lastLog = eid => logsOf(eid).at(-1);
const techOf = e => TECH[e.tech] || TECH.normal;
const cfgOf = e => { const T = techOf(e), reps = e.reps || 4; return { tech: e.tech, mode: T.mode, lastMax: T.lastMax, blocks: e.blocks, reps, rest: e.rest, goal: e.goal || T.goal,
  repsMin: T.mode === 'sets' && e.goal > 0 && e.goal < reps ? e.goal : null }; };
const touchWorkout = w => { if (w && w.example) w.example = false; };

/* =========================================================
   Rodadas de treino
   Uma rodada começa quando você toca pra fazer o treino e fecha quando
   todos os exercícios forem anotados, quando você encerra, ou depois de
   6 horas parada. Fechada, ela fica na tela até você começar outra.
   Atividades avulsas (kind: 'free') são rodadas sem treino, só pro calendário.
   ========================================================= */
const IDLE = 6 * 3600e3;
const isFree = s => s.kind === 'free';
const sessLogs = sid => S.logs.filter(l => l.sid === sid);
const lastActivity = s => Math.max(s.startedAt, ...sessLogs(s.id).map(l => l.ts));
const isComplete = (w, s) => w.exercises.length > 0 && w.exercises.every(e => S.logs.some(l => l.sid === s.id && l.eid === e.id));
const openSession = wid => S.sessions.find(s => s.wid === wid && !s.closedAt && !isFree(s));
const sessionsOf = wid => S.sessions.filter(s => s.wid === wid && sessLogs(s.id).length).sort((a, b) => a.startedAt - b.startedAt);
const shownSession = wid => openSession(wid) || sessionsOf(wid).at(-1) || null;
/* registros antigos (de antes das rodadas) viram uma rodada por treino e por dia */
function migrateSessions() {
  const known = new Set(S.sessions.map(s => s.id));
  for (const l of S.logs) {
    if (!l.sid) l.sid = `d-${l.wid}-${l.day}`;
    if (!known.has(l.sid)) {
      known.add(l.sid);
      S.sessions.push({ id: l.sid, wid: l.wid, startedAt: l.ts, closedAt: null });
    }
  }
  tidySessions();
}
function tidySessions() {
  const now = Date.now();
  let changed = false;
  for (const s of S.sessions) {
    if (s.closedAt || isFree(s)) continue;
    const w = getW(s.wid), n = sessLogs(s.id).length;
    if (!w || (n && isComplete(w, s)) || now - lastActivity(s) > IDLE) { closeSession(s, w, lastActivity(s)); changed = true; }
  }
  const before = S.sessions.length;
  S.sessions = S.sessions.filter(s => isFree(s) || !s.closedAt || sessLogs(s.id).length);   // rodada fechada sem nada anotado some
  return changed || before !== S.sessions.length;
}
/* fechar a rodada também diz se ela ficou abaixo do normal (pra perguntar o motivo) */
function closeSession(s, w, at = Date.now()) {
  s.closedAt = at;
  if (w) s.name = w.name;
  s.below = !!(w && sessLogs(s.id).length && belowNormal(w, s));
}
function belowNormal(w, s) {
  if (!isComplete(w, s)) return true;
  const cmp = sessionCompare(w, s);
  return !!(cmp && cmp.pct != null && dirOf(cmp.pct) === 'down');
}
function startSession(wid) {
  let s = openSession(wid), isNew = false;
  if (!s) { s = { id: newId(), wid, name: getW(wid)?.name || '', startedAt: Date.now(), closedAt: null }; S.sessions.push(s); isNew = true; saveCaderno(); }
  return { s, isNew };
}
function dropIfEmpty(sid) {
  if (!sessLogs(sid).length) { S.sessions = S.sessions.filter(s => s.id !== sid); saveCaderno(); }
}
/* dias com treino: rodadas com algo anotado e atividades avulsas */
function dayMap() {
  const has = new Set(S.logs.map(l => l.sid)), m = new Map();
  for (const s of S.sessions) {
    if (!isFree(s) && !has.has(s.id)) continue;
    const k = dayKey(new Date(s.startedAt));
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(s);
  }
  for (const list of m.values()) list.sort((a, b) => a.startedAt - b.startedAt);
  return m;
}

/* =========================================================
   Progressão de carga (veredito)
   ========================================================= */
function stepLoad(load, pct, dir) {
  const min = load >= 10 ? 1 : 0.5;
  let x = load * (1 + dir * pct);
  x = x >= 20 ? Math.round(x) : Math.round(x * 2) / 2;
  return dir > 0 ? Math.max(x, load + min) : Math.max(0, Math.min(x, load - min));
}
function evaluate(cfg, reps, load, minutes) {
  if (cfg.mode === 'time') {
    const total = +minutes || 0;
    return { total, verdict: total >= cfg.goal ? 'up' : 'keep', failBlock: null, next: null, big: false };
  }
  const total = reps.reduce((a, b) => a + (+b || 0), 0);
  const ev = { total, verdict: 'keep', failBlock: null, next: load ?? null, big: false };
  if (cfg.mode === 'count') {
    ev.verdict = total >= cfg.goal ? 'up' : 'keep';
  } else if (cfg.mode === 'sets') {
    const fi = reps.findIndex(r => r < cfg.reps);
    if (fi !== -1) ev.failBlock = fi + 1;
    if (reps.length >= cfg.blocks && fi === -1) {
      ev.verdict = 'up';
      ev.big = reps.every(r => r >= cfg.reps + 3);
    } else {
      // parar antes com séries boas não é queda: só baixa se as séries feitas ficaram longe do alvo (ou abaixo da faixa)
      ev.verdict = total / Math.max(1, reps.length) < (cfg.repsMin || cfg.reps * 0.75) ? 'down' : 'keep';
    }
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
function verdictCopy(cfg, ev, reps, km) {
  const kg = ev.next != null ? `${fmt(ev.next)} kg` : null;
  const z = zone(cfg);
  if (cfg.mode === 'time') {
    const dist = km ? ` · ${fmt(km)} km` : '';
    if (ev.verdict === 'up') return { title: 'Meta batida', body: `${fmt(ev.total)} min${dist}. Bateu os ${cfg.goal} min.` };
    return { title: 'Bom treino', body: `${fmt(ev.total)} de ${cfg.goal} min${dist}. No próximo, tenta chegar na meta.` };
  }
  if (cfg.mode === 'sets') {
    const R = cfg.repsMin;
    if (ev.verdict === 'up') return { title: 'Sobe a carga', body: `${R ? `Chegou nas ${cfg.reps} reps em todas as séries.` : `Fechou ${cfg.blocks} × ${cfg.reps}.`}${ev.big ? ' Sobrou gás, dá pra subir mais.' : ''}${kg ? ` Próximo treino: ${kg}.` : ''}` };
    if (ev.verdict === 'down') return { title: 'Baixa a carga', body: `Fez ${listPt(reps)} reps, ${R ? `abaixo da faixa de ${R} a ${cfg.reps}` : `longe das ${cfg.reps} por série`}.${kg ? ` Próximo treino: uns ${kg}.` : ''}` };
    return { title: 'Mantém a carga', body: `Fez ${listPt(reps)} reps${R ? ', dentro da faixa' : ''}. Mesma carga no próximo treino, tenta ${R ? `chegar nas ${cfg.reps} em todas as séries` : `fechar ${cfg.blocks} × ${cfg.reps}`}.` };
  }
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
  const last = lastLog(e.id), T = techOf(e), cfg = cfgOf(e);
  if (!last) return { load: null, html: `Primeira vez: ${T.first(cfg)}.` };
  const when = fmtDate(last.ts), m = last.cfg?.mode, time = cfg.mode === 'time';
  if ((m === 'time') !== time) return { load: null, html: `Primeira vez desse jeito: ${T.first(cfg)}.` };
  if (time) {
    const was = `Em ${when}: ${logSummary(last)}.`;
    return { load: null, html: last.verdict === 'up' ? `${was} <b>Hoje: mantém a meta e tenta ir mais longe.</b>` : `${was} <b>Hoje: tenta chegar nos ${cfg.goal} min.</b>` };
  }
  const at = last.load != null ? ` com ${fmt(last.load)} kg` : '';
  if (last.verdict === 'up') return { load: last.next ?? last.load, html: `Em ${when} você fechou tudo${at}. <b>${last.next != null ? `Hoje: ${fmt(last.next)} kg.` : 'Hoje: tenta umas reps a mais.'}</b>` };
  if (last.verdict === 'down') return { load: last.next ?? last.load, html: `Em ${when} ficou pesado${at}. <b>${last.next != null ? `Hoje: uns ${fmt(last.next)} kg.` : 'Hoje: vai com calma.'}</b>` };
  if (m === 'count') return { load: last.load, html: `Em ${when}: ${last.total} reps${at}. <b>Hoje: mesma carga, tenta ${last.total + 1} ou mais.</b>` };
  if (m === 'sets') return { load: last.load, html: `Em ${when}: ${last.reps.join('·')} reps${at}. <b>Hoje: mesma carga, tenta ${cfg.repsMin ? `chegar nas ${cfg.reps} em todas` : `fechar ${cfg.blocks} × ${cfg.reps}`}.</b>` };
  return { load: last.load, html: `Em ${when} você falhou no ${last.failBlock}º bloco${at}. <b>Hoje: mesma carga, tenta passar do ${last.failBlock}º.</b>` };
}

/* =========================================================
   Progresso: hoje vs. treino anterior
   Volume = carga × reps somadas (sem carga, conta só as reps; em séries
   normais cada série tem a própria carga). Cardio compara os minutos.
   ========================================================= */
const loadsOf = l => Array.isArray(l.loads) && l.loads.length ? l.loads : null;
const vol = l => {
  if (l.tech === 'time') return +l.total || 0;
  const ls = loadsOf(l);
  if (ls && l.reps) return l.reps.reduce((a, r, i) => a + (ls[i] > 0 ? ls[i] : 1) * (+r || 0), 0);
  return (l.load > 0 ? l.load : 1) * (l.total || 0);
};
const dirOf = p => p > 0.005 ? 'up' : p < -0.005 ? 'down' : 'keep';
function exDelta(now, prev) {
  const nv = vol(now), pv = vol(prev);
  return { nv, pv, dLoad: (now.load || 0) - (prev.load || 0), dReps: (now.total || 0) - (prev.total || 0), pct: pv ? (nv - pv) / pv : 0 };
}
/* carga de um registro: "40", ou "40–45" quando mudou entre as séries */
function loadTxt(l) {
  const ls = loadsOf(l);
  if (!ls) return l.load != null ? fmt(l.load) : null;
  const v = ls.filter(x => x != null);
  if (!v.length) return null;
  const lo = Math.min(...v), hi = Math.max(...v);
  return lo === hi ? fmt(lo) : `${fmt(lo)}–${fmt(hi)}`;
}
function logSummary(l, detail = false) {
  if (l.tech === 'time') return `${fmt(l.total)} min${l.km ? ` · ${fmt(l.km)} km` : ''}`;
  const kg = loadTxt(l), reps = l.reps || [];
  return `${kg != null ? `${kg} kg · ` : ''}${detail && reps.length > 1 ? `${reps.join('·')} reps` : `${fmt(l.total)} reps`}`;
}
/* compara uma rodada com as anteriores do mesmo treino, exercício por exercício */
function sessionCompare(w, s) {
  const logs = s ? sessLogs(s.id) : [];
  if (!logs.length) return null;
  const latest = new Map();
  for (const l of logs) latest.set(l.eid, l);
  const earlier = sessionsOf(w.id).filter(x => x.id !== s.id && x.startedAt < s.startedAt);
  const ids = new Set(earlier.map(x => x.id));
  const rows = [...latest.values()].map(t => {
    const p = S.logs.filter(l => l.eid === t.eid && ids.has(l.sid)).at(-1);
    return { t, p, d: p ? exDelta(t, p) : null };
  });
  const cmp = rows.filter(r => r.p);
  // minutos de cardio não somam com kg × reps: com musculação na rodada, o cardio fica de fora do percentual
  const lift = cmp.filter(r => r.t.tech !== 'time' && r.p.tech !== 'time'), base = lift.length ? lift : cmp;
  const nv = base.reduce((a, r) => a + r.d.nv, 0), pv = base.reduce((a, r) => a + r.d.pv, 0);
  const prev = earlier.at(-1);
  return { prevTs: prev ? prev.startedAt : null, rows, compared: cmp.length, pct: pv ? (nv - pv) / pv : null };
}
function progressSay(cmp) {
  if (cmp.pct == null) return 'Primeiro registro desse treino. Na próxima vez eu comparo com este.';
  const ref = cmp.prevTs ? `treino de ${fmtDate(cmp.prevTs)}` : 'último treino';
  const d = dirOf(cmp.pct);
  if (d === 'up') return `Você progrediu <span class="circled">${fmtPct(cmp.pct)}${ICON.ring}</span> em relação ao ${ref}.`;
  if (d === 'down') return `Ficou ${fmtPct(cmp.pct).slice(1)} abaixo do ${ref}. Normal oscilar (sono, comida, estresse). Foco no próximo.`;
  return `Mesmo volume do ${ref}. No próximo, busca 1 rep a mais.`;
}
const deltaChip = (p, sm = '') => { const d = dirOf(p); return `<span class="delta delta--${d}${sm}">${d === 'keep' ? 'igual' : fmtPct(p)}</span>`; };
const loadPair = (p, t) => { const a = loadTxt(p) ?? '—', b = loadTxt(t) ?? '—'; return a === b ? b : `${a}→${b}`; };
function resultOf(s) {
  if (isFree(s)) return 'free';
  if (s.below) return 'down';
  const w = getW(s.wid), cmp = w ? sessionCompare(w, s) : null;
  return cmp && cmp.pct != null ? dirOf(cmp.pct) : 'keep';
}

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
function cue(kind, n, last, u = UNIT.block) {
  const U = cap(u.one);
  if (kind === 'start') { beep(880, 0.14); say(last ? (u === UNIT.set ? 'Série única. Vai!' : 'Bloco único. Vai!') : `${U} 1. Vai!`, 150); }
  if (kind === 'clock') { beep(880, 0.14); say('Valendo!', 150); }
  if (kind === 'rest') { beep(520, 0.09, 0.16); }
  if (kind === 'count') { beep(760, 0.08); }
  if (kind === 'go') { beep(1180, 0.3, 0.28); buzz([180, 80, 180]); say(last ? 'Último bloco! Até a falha!' : `${U} ${n}. Vai!`, 330); }
  if (kind === 'goal') { beep(1180, 0.3, 0.28); buzz([180, 80, 180]); say('Meta batida!', 330); }
  if (kind === 'done') { beep(880, 0.12); setTimeout(() => beep(1320, 0.22), 150); buzz(300); say(u.said, 420); }
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
    run = { ...d, animIdx: -1, slap: false, fresh: false };
    if (run.phase === 'rest' && Date.now() >= run.restEnd) run.phase = 'work';
    view = { name: 'run', wid: run.wid };
  } catch (e) {}
}
const curEx = () => run && getE(run.wid, run.eid);
const clockRun = () => { const e = curEx(); return !!e && techOf(e).mode === 'time' && run.phase === 'work'; };
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
  if (run && clockRun()) { tickClock(); return; }
  if (!run || run.phase !== 'rest') { stopTick(); return; }
  const ms = run.restEnd - Date.now();
  if (ms <= 0) { endRest(); return; }
  const sec = Math.ceil(ms / 1000);
  const c = $('#count'); if (c && c.textContent !== String(sec)) c.textContent = sec;
  const t = $('#timer'); if (t) t.classList.toggle('hot', sec <= 3);
  const r = $('#ringFg'); if (r) r.style.strokeDashoffset = (RING * (1 - ms / run.restMs)).toFixed(1);
  if (sec !== run.lastSec) { if (run.lastSec != null && sec <= 3) cue('count'); run.lastSec = sec; }
}
/* cardio: o relógio sobe e o anel enche até a meta */
function tickClock() {
  const ms = Date.now() - run.phaseAt, goal = cfgOf(curEx()).goal * 60000;
  const txt = fmtClock(ms), c = $('#count'); if (c && c.textContent !== txt) c.textContent = txt;
  const r = $('#ringFg'); if (r) r.style.strokeDashoffset = (RING * (1 - Math.min(1, ms / goal))).toFixed(1);
  if (!run.goalHit && ms >= goal) { run.goalHit = true; cue('goal'); const t = $('#timer'); if (t) t.classList.add('met'); saveRunDraft(); }
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
  setPhase('work'); run.slap = true;
  cue('go', n, n === cfg.blocks && (cfg.lastMax || cfg.mode === 'count'), unit(cfg));
  saveRunDraft(); render();
}
function finish(quiet = false) {
  stopTick();
  const cfg = cfgOf(curEx());
  if (cfg.mode === 'time' && run.phase === 'work') run.minutes = Math.max(1, Math.round((Date.now() - run.phaseAt) / 60000));
  setPhase('done'); run.ask = null; run.fresh = true;
  if (!quiet) cue('done', 0, false, unit(cfg));
  saveRunDraft(); render(); window.scrollTo(0, 0);
}
function pushBlock(v) {
  run.reps.push(v);
  if (run.loads) run.loads.push(run.load ?? null);
  run.animIdx = run.reps.length - 1;
}

/* =========================================================
   Ícones
   ========================================================= */
const PEN = `<span class="field-pen" aria-hidden="true"><svg viewBox="-3 -52 42 54">${FX.PENCIL}</svg></span>`;
const ICON = {
  play: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5 19 12 7 19.5Z" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M3.5 12.5 9 18.5 21 3.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sound: on => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 9.5h3.6L12 5.4v13.2l-4.9-4.1H3.5z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>${on
    ? '<path d="M15.4 9c1.3 1.7 1.3 4.3 0 6M18.2 6.3c2.6 3.2 2.6 8.2 0 11.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    : '<path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'}</svg>`,
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5h17"/><path d="M5 16.5 9.5 11l3.5 3 6-7.5"/></svg>',
  circle: '<svg class="circ" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path vector-effect="non-scaling-stroke" d="M50 5C80 3 97 25 96 51 95 79 73 97 47 95 20 93 3 74 5 47 7 21 29 6 60 9"/></svg>',
  ring: '<svg class="circ" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M52 6C82 4 98 26 97 51 96 79 73 96 47 95 19 94 3 74 4 47 6 21 30 5 63 10"/></svg>',
  scrib: '<svg class="scrib" viewBox="0 0 220 12" preserveAspectRatio="none" aria-hidden="true"><path d="M3 8C40 2 78 11 118 6S188 3 217 7"/></svg>',
  phone: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M8 10H6v10h12V10h-2"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
  back: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19.5 12H5M11 5.5 4.5 12 11 18.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5"/></svg>',
  book: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8h3.5M12.5 12h3.5"/></svg>',
  cal: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="15" cy="15.2" r="2.3"/></svg>',
  user: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8.5" r="3.6"/><path d="M5 20.5c1.2-3.7 4-5.6 7-5.6s5.8 1.9 7 5.6"/></svg>',
  pen: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 19.5l1-4.2L15.8 5l3.2 3.2L8.7 18.5z"/><path d="M13.6 7.2l3.2 3.2"/></svg>'
};
const tally = FX.tally;
/* carimbo datador: dia e mês, cada coisa carimbada torta do seu jeito */
const MES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const dstamp = (d, key, cls = '') => `<span class="dstamp${cls}" style="${FX.hand(key)}" aria-hidden="true"><b>${d.getDate()}</b><small>${MES[d.getMonth()]}</small></span>`;
/* o descanso e o cronômetro são um carimbo redondo: texto em cima, texto embaixo e duas estrelas */
const star = (cx, cy, R = 5.5, r = 2.3) => 'M' + Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r : R;
  return `${(cx + k * Math.cos(a)).toFixed(1)} ${(cy + k * Math.sin(a)).toFixed(1)}`;
}).join('L') + 'Z';
let ringN = 0;
function stampRing(top, bottom, off) {
  const id = `rg${++ringN}`;
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <defs><path id="${id}t" d="M36 100a64 64 0 0 1 128 0"/><path id="${id}b" d="M27 100a73 73 0 0 0 146 0"/></defs>
    <g class="ring"><circle class="ring-bg" cx="100" cy="100" r="84"/><circle class="ring-fg" id="ringFg" cx="100" cy="100" r="84" stroke-dasharray="${RING.toFixed(1)}" style="stroke-dashoffset:${off}"/></g>
    <circle class="ring-in" cx="100" cy="100" r="56"/>
    <text class="ring-txt" text-anchor="middle"><textPath href="#${id}t" startOffset="50%">${esc(top.toUpperCase())}</textPath></text>
    <text class="ring-txt" text-anchor="middle"><textPath href="#${id}b" startOffset="50%">${esc(bottom.toUpperCase())}</textPath></text>
    <path class="ring-star" d="${star(32, 100)}"/><path class="ring-star" d="${star(168, 100)}"/>
  </svg>`;
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
    <p class="t-note">Abriu pelo WhatsApp ou Instagram? Abre no Safari primeiro (no menu, “Abrir no Safari”). Depois, usa sempre pelo ícone.</p>`;
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
    ${deferredPrompt ? '<button class="btn btn--wide" data-a="install-go">Instalar neste computador</button>' : ''}`;
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
let installChecked = false;
function maybeInstall() {
  if (installChecked) return;
  installChecked = true;
  let seen = false;
  try { seen = !!localStorage.getItem(LS_INSTALL); } catch (e) {}
  if (!isStandalone() && (isIOS || isAndroid) && !seen && !run) setTimeout(openInstall, 900);
}

/* =========================================================
   Telas: conta
   ========================================================= */
function phoneE164(v) {
  const s = String(v || '').trim(), d = s.replace(/\D/g, '');
  if (s.startsWith('+')) return d.length >= 8 && d.length <= 15 && d[0] !== '0' ? '+' + d : null;
  const n = d.replace(/^0+/, '');
  if (n.length === 10 || n.length === 11) return '+55' + n;
  return null;
}
function phoneMask(v) {
  if (v.trim().startsWith('+')) return '+' + v.replace(/\D/g, '').slice(0, 15);
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function authCheck(m, email, pass, phone) {
  if (m !== 'newpass' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { field: 'aEmail', msg: email ? 'Confere o e-mail.' : 'Falta o e-mail.' };
  if (m === 'signup' && !phoneE164(phone)) return { field: 'aPhone', msg: 'Põe o celular com DDD, tipo (11) 98765-4321.' };
  if (m === 'login' && !pass) return { field: 'aPass', msg: 'Falta a senha.' };
  if ((m === 'signup' || m === 'newpass') && pass.length < 6) return { field: 'aPass', msg: 'A senha precisa de pelo menos 6 caracteres.' };
  return null;
}
function viewAuth() {
  const m = auth.mode, tabs = m === 'login' || m === 'signup';
  const fEmail = `<div class="fgroup"><label class="t-label" for="aEmail">E-mail</label><div class="field-wrap"><input id="aEmail" class="field" type="email" inputmode="email" autocomplete="${m === 'signup' ? 'email' : 'username'}" autocapitalize="off" spellcheck="false" data-in="a-email" value="${esc(auth.email)}" placeholder="voce@email.com">${PEN}</div></div>`;
  const fPhone = `<div class="fgroup"><label class="t-label" for="aPhone">Celular</label><div class="field-wrap"><input id="aPhone" class="field" type="tel" inputmode="tel" autocomplete="tel" data-in="a-phone" value="${esc(auth.phone)}" placeholder="(11) 98765-4321"></div></div>`;
  const fPass = (label, ac) => `<div class="fgroup"><label class="t-label" for="aPass">${label}</label><div class="field-wrap pass"><input id="aPass" class="field" type="password" autocomplete="${ac}" data-in="a-pass" value="${esc(auth.pass)}"${ac === 'new-password' ? ' placeholder="mín. 6 caracteres"' : ''}><button type="button" class="link pass-eye" data-a="auth-eye" aria-controls="aPass" aria-pressed="false">mostrar</button></div></div>`;
  const err = auth.err ? `<p class="auth-err" role="alert">${esc(auth.err)}</p>` : '';
  const submit = (label, busyLabel) => `<button class="btn btn--go btn--wide btn--xl" type="submit"${auth.busy ? ' disabled' : ''}>${auth.busy ? busyLabel : label}</button>`;
  let body;
  if (m === 'sent') body = `<h2 class="t-card">Confere seu e-mail</h2><p>${esc(auth.msg)}</p>
    <button class="btn btn--wide" data-a="auth-mode" data-m="login">Voltar pra entrar</button>`;
  else if (m === 'forgot') body = `<h2 class="t-card">Esqueci a senha</h2>
    <form class="auth-form" data-f="auth" novalidate><p class="t-muted">Põe o e-mail da sua conta que eu mando um link pra criar uma senha nova.</p>
      ${fEmail}${err}${submit('Mandar o link', 'Mandando…')}
      <button type="button" class="link" data-a="auth-mode" data-m="login">voltar</button></form>`;
  else if (m === 'newpass') body = `<h2 class="t-card">Senha nova</h2>
    <form class="auth-form" data-f="auth" novalidate><p class="t-muted">Escolhe a senha nova da sua conta.</p>
      ${fPass('Senha nova', 'new-password')}${err}${submit('Salvar a senha nova', 'Salvando…')}</form>`;
  else body = `<div class="tech-pick auth-tabs" role="group" aria-label="Entrar ou criar conta">
      <button class="tp${m === 'login' ? ' on' : ''}" aria-pressed="${m === 'login'}" data-a="auth-mode" data-m="login">Entrar</button>
      <button class="tp${m === 'signup' ? ' on' : ''}" aria-pressed="${m === 'signup'}" data-a="auth-mode" data-m="signup">Criar conta</button>
    </div>
    <form class="auth-form" data-f="auth" novalidate>
      ${fEmail}${m === 'signup' ? fPhone : ''}${fPass('Senha', m === 'signup' ? 'new-password' : 'current-password')}
      ${err}${m === 'signup' ? submit('Criar minha conta', 'Criando a conta…') : submit('Entrar', 'Entrando…')}
      ${m === 'login' ? '<button type="button" class="link" data-a="auth-mode" data-m="forgot">esqueci a senha</button>' : '<p class="t-note">Com a conta, seus treinos ficam guardados mesmo se você trocar de celular.</p>'}
    </form>`;
  return `
  <header class="cover-band auth-top">
    <img class="logo" src="/logo.svg" alt="" width="72" height="72">
    <div class="cover-title"><h1 class="t-hero">Bloquinho</h1><p class="cover-sub">caderno de treino: séries, técnicas, cardio e o que mais você fizer</p></div>
  </header>
  <section class="card hand auth${tabs ? '' : ' auth--solo'}" style="${FX.hand('auth', 0.5)}">${FX.tapes('auth')}${body}</section>`;
}

/* =========================================================
   Telas: caderno
   ========================================================= */
function syncText() {
  if (sync.state === 'saving') return 'Salvando na sua conta…';
  if (sync.state === 'offline') return sync.pending ? `Sem internet: ${plural(sync.pending, 'alteração esperando', 'alterações esperando')} pra subir. Tá tudo guardado no aparelho.` : 'Sem internet agora. Tá tudo guardado no aparelho.';
  if (sync.state === 'error') return 'Não deu pra salvar na nuvem agora. Tento de novo sozinho.';
  return 'Tudo salvo na sua conta.';
}
function viewHome() {
  const how = !S.settings.hideHow && S.logs.length < 3;
  return `
  <header class="cover-band">
    <img class="logo" src="/logo.svg" alt="" width="56" height="56">
    <div class="cover-title"><h1 class="t-hero">Bloquinho</h1><p class="cover-sub">caderno de treino</p></div>
    <p class="cover-label"><span>Nome</span><b>${esc(S.user.email.split('@')[0])}</b></p>
  </header>
  ${how ? `<section class="card card--flat how" aria-label="Como funciona">
    <ol class="how-list">
      <li>Monta o treino: séries normais, técnicas (Muscle Round, Cluster, Rest-pause) ou cardio.</li>
      <li>Na hora, toca no post-it a cada série. O app conta o descanso.</li>
      <li>No fim, ele diz se sobe a carga, quanto você progrediu e marca o dia no calendário.</li>
    </ol>
    <button class="link how-ok" data-a="hide-how">entendi</button>
  </section>` : ''}
  ${weekStrip()}
  <h2 class="t-section"><span class="under">Meus treinos</span></h2>
  <div class="cards">${S.workouts.map(wcard).join('') || '<p class="t-muted">Nenhum treino ainda. Cria o primeiro aqui embaixo.</p>'}</div>
  <button class="btn btn--ghost btn--wide add-w" data-a="new-w">+ novo treino</button>
  <details class="cola">
    <summary class="t-section"><span class="under">Cola das técnicas</span></summary>
    <div class="cola-grid">${Object.values(TECH).map(T => `<div><h3><span class="hl" style="--c:var(${T.color})">${T.name}</span></h3><p>${T.rule({ blocks: T.blocks, reps: T.reps, rest: T.rest, goal: T.goal })}</p></div>`).join('')}</div>
  </details>
  ${folio('home')}
  `;
}
function viewAccount() {
  const t = S.settings.theme || 'auto';
  const sw = v => v === 'auto'
    ? `<span class="sw sw--auto" aria-hidden="true">${sw('light')}${sw('dark')}</span>`
    : `<span class="sw" data-theme="${v}" aria-hidden="true"><i class="sw-cover"></i><i class="sw-line"></i><i class="sw-line"></i><i class="sw-stamp"></i></span>`;
  const opt = (v, label, note) => `<button class="theme-opt${t === v ? ' on' : ''}" role="radio" aria-checked="${t === v}" data-a="theme" data-v="${v}">${sw(v)}<b>${label}</b><small>${note}</small></button>`;
  return `
  <h1 class="t-title t-title--print page-top">Conta</h1>
  <p class="t-note">A identificação e as configurações da sua caderneta.</p>
  <section class="ident" aria-label="Identificação">
    <h2 class="ident-title">Esta caderneta pertence a</h2>
    <p class="ident-line"><span class="t-label">Nome</span><b>${esc(S.user.email.split('@')[0])}</b></p>
    <p class="ident-line ident-line--mail"><span class="t-label">E-mail</span><b>${esc(S.user.email)}</b></p>
    <p class="t-note" id="syncStatus" role="status">${esc(syncText())}</p>
    <button class="link link--danger" data-a="logout">sair da conta</button>
  </section>
  <h2 class="t-section">Aparência</h2>
  <div class="theme-pick" role="radiogroup" aria-label="Tema">${opt('auto', 'Automático', 'segue o celular')}${opt('light', 'Claro', 'página clara')}${opt('dark', 'Escuro', 'página escura')}</div>
  <h2 class="t-section">Avisos na série</h2>
  <div class="toggles">
    <button class="toggle" data-a="set" data-k="sound" aria-pressed="${!!S.settings.sound}"><span class="toggle-box">${S.settings.sound ? ICON.check : ''}</span>bipe</button>
    <button class="toggle" data-a="set" data-k="voice" aria-pressed="${!!S.settings.voice}"><span class="toggle-box">${S.settings.voice ? ICON.check : ''}</span>voz (“bloco 3, vai!”)</button>
  </div>
  <p class="t-note">No iPhone, tira do modo silencioso pra ouvir os avisos.</p>
  ${isStandalone() ? '' : `<h2 class="t-section">No celular</h2><button class="btn btn--ghost btn--wide" data-a="install">${ICON.phone}<span>Pôr na tela do celular</span></button>`}
  ${folio('account')}`;
}
/* a semana na capa: um quadradinho por dia, com visto quando treinou */
function weekStrip() {
  const days = dayMap(), today = dayKey(), start = new Date();
  start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - start.getDay());
  let n = 0, cells = '';
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = dayKey(d), on = days.has(k);
    if (on) n++;
    cells += `<button class="wd${on ? ' is-on' : ''}${k === today ? ' is-today' : ''}" data-a="calendar" data-d="${k}" aria-label="${fmtLong(d)}${on ? ', treinou' : ''}">
      <span class="wd-k" aria-hidden="true">${WEEK[i]}</span><span class="wd-box">${on ? dstamp(d, k + ':wk') : `<span class="wd-n" aria-hidden="true">${d.getDate()}</span>`}</span>
    </button>`;
  }
  const end = new Date(start); end.setDate(start.getDate() + 6);
  const mon = d => d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const range = start.getMonth() === end.getMonth() ? `${start.getDate()} a ${end.getDate()} de ${mon(end)}` : `${start.getDate()} de ${mon(start)} a ${end.getDate()} de ${mon(end)}`;
  return `<section class="week" aria-label="Esta semana">
    <div class="week-head"><h2 class="t-section">Esta semana</h2><span class="guide">${range}</span><button class="link" data-a="calendar">ver calendário</button></div>
    <div class="week-days">${cells}</div>
    <p class="t-note">${n ? `${plural(n, 'dia', 'dias')} de treino nesta semana.` : 'Nenhum treino nesta semana ainda. Bora?'}</p>
  </section>`;
}
function wcard(w, n = 0) {
  const s = shownSession(w.id), going = s && !s.closedAt;
  const done = sessionsOf(w.id).at(-1);
  const cmp = done ? sessionCompare(w, done) : null;
  const techs = [...new Set(w.exercises.map(e => techOf(e).name))];
  const when = going ? '<span class="hl" style="--c:var(--stamp)">em andamento</span>' : done ? `último: ${fmtDate(done.startedAt)}` : 'ainda não feito';
  return `<button class="card hand wcard" id="wc-${w.id}" data-a="open-w" data-w="${w.id}" style="${FX.hand(w.id)}">
    ${FX.tapes(w.id)}
    <span class="wcard-head"><span class="wcard-no">nº ${n + 1}</span><span class="t-card">${esc(w.name || 'Treino sem nome')}</span>${w.example ? '<span class="chip chip--example">exemplo</span>' : ''}</span>
    <span class="wcard-list">${w.exercises.map(e => `<span>${esc(e.name || 'Exercício sem nome')}</span>`).join('') || '<span class="t-muted">sem exercícios ainda</span>'}</span>
    <span class="wcard-meta"><span>${techs.join(' + ') || 'vazio'} · ${when}</span>${!going && cmp && cmp.pct != null ? deltaChip(cmp.pct) : ''}</span>
  </button>`;
}
function viewWorkout() {
  const w = getW(view.wid);
  if (!w) { view = { name: 'home' }; return viewHome(); }
  if (view.edit) return viewEdit(w);
  if (tidySessions()) lsSave();
  // a tela mostra a rodada aberta ou, se não tiver, a última que foi feita
  const s = shownSession(w.id), going = !!(s && !s.closedAt);
  const items = w.exercises.map(e => ({ e, done: s ? sessLogs(s.id).filter(l => l.eid === e.id).at(-1) : null, last: lastLog(e.id) }));
  const doneN = items.filter(i => i.done).length;
  const next = going ? items.find(i => !i.done) : null;
  const complete = !!(s && s.closedAt && isComplete(w, s));
  const cmp = s && doneN ? sessionCompare(w, s) : null;
  const first = w.exercises[0];
  let sub, top = '';
  if (going) {
    sub = `começou ${sameDay(s.startedAt) ? 'hoje' : 'em ' + fmtDate(s.startedAt)} às ${fmtTime(s.startedAt)} · ${doneN} de ${w.exercises.length} feitos`;
    if (next) top = `<button class="btn btn--go btn--wide btn--xl go-next" data-a="run" data-e="${next.e.id}">${ICON.play}<span>${doneN ? 'Próximo' : 'Primeiro'}: ${esc(next.e.name || 'exercício')}</span></button>`;
  } else if (s) {
    sub = `${complete ? 'feito' : `${doneN} de ${w.exercises.length} feitos`} ${sameDay(s.startedAt) ? 'hoje' : 'em ' + fmtLong(new Date(s.startedAt))}`;
    top = `${complete ? `<p class="alldone"><span class="hl${fresh.closed ? ' hl--swipe' : ''}" style="--c:var(--up)">Treino fechado!</span></p>` : ''}
      ${cmp ? compareCard(w, cmp, true, s) : ''}
      ${first ? `<button class="btn btn--go btn--wide btn--xl go-next" data-a="start-w">${ICON.play}<span>Começar treino de novo</span></button>` : ''}`;
  } else {
    sub = 'ainda não feito';
    if (first) top = `<button class="btn btn--go btn--wide btn--xl go-next" data-a="start-w">${ICON.play}<span>Começar treino</span></button>`;
  }
  return `
  <nav class="crumbs"><button class="link link--back" data-a="home">${ICON.back}caderno</button><span class="runhead">treino nº ${S.workouts.indexOf(w) + 1} de ${S.workouts.length}</span><button class="link link--tab" data-a="edit-w">${ICON.pen}editar</button></nav>
  <h1 class="t-title">${esc(w.name || 'Treino sem nome')}</h1>
  <p class="t-note">${sub}</p>
  ${top}
  <ol class="exlist">${items.map(i => {
    const ref = i.done || i.last;
    const info = ref ? `${i.done && going ? 'agora' : fmtDate(ref.ts)}: ${logSummary(ref)}` : 'ainda sem registro';
    const chip = ref && ref.tech !== 'time' && ref.verdict ? ` <span class="delta delta--sm delta--${ref.verdict}">${VWORD[ref.verdict]}</span>` : '';
    const cls = `${i.done ? ' is-done' : ''}${next && next.e.id === i.e.id && doneN ? ' is-next' : ''}${fresh.done === i.e.id ? ' just-done' : ''}`;
    return `<li class="ex${cls}" id="row-${i.e.id}">
      <span class="cb" aria-hidden="true">${i.done ? dstamp(new Date(i.done.ts), i.e.id + ':cb') : ''}</span>
      <button class="ex-main" data-a="run" data-e="${i.e.id}">
        <span class="ex-name"><span class="strike">${esc(i.e.name || 'Exercício sem nome')}</span></span>
        <span class="ex-info">${techOf(i.e).name} · ${esc(info)}${chip}</span>
      </button>
      <button class="btn-round btn-round--quiet" data-a="hist" data-e="${i.e.id}" aria-label="Histórico de ${esc(i.e.name || 'exercício')}">${ICON.chart}</button>
    </li>`;
  }).join('')}</ol>
  ${!w.exercises.length ? '<p class="t-muted empty">Esse treino tá vazio. <button class="link" data-a="edit-w">Adicionar exercícios</button></p>' : ''}
  ${going && cmp ? compareCard(w, cmp, false, s) : ''}
  ${going && doneN ? '<p class="end-w"><button class="link" data-a="end-w">encerrar o treino por aqui</button></p>' : ''}`;
}
function compareCard(w, cmp, final, s) {
  const rows = cmp.rows.map(r => {
    const name = esc(getE(w.id, r.t.eid)?.name || r.t.name || 'Exercício');
    const time = r.t.tech === 'time';
    const kr = (kg, reps) => `<td class="kr">${kg != null ? `<span>${kg} kg</span>` : ''}<span>${reps}</span></td>`;
    if (!r.p) return `<tr><th scope="row">${name}</th>${kr(time ? null : loadTxt(r.t) ?? '—', time ? `${fmt(r.t.total)} min` : `${fmt(r.t.total)} reps`)}<td><span class="t-muted">1ª vez</span></td></tr>`;
    const reps = time ? `${fmt(r.p.total)}→${fmt(r.t.total)} min` : `${fmt(r.p.total)}→${fmt(r.t.total)} reps`;
    return `<tr><th scope="row">${name}</th>${kr(time ? null : loadPair(r.p, r.t), reps)}<td>${deltaChip(r.d.pct)}</td></tr>`;
  }).join('');
  const teacher = final && cmp.pct != null && dirOf(cmp.pct) === 'up' ? FX.teacherStamp(fresh.closed ? ' is-new' : '') : '';
  return `<section class="card card--flat compare${final ? ' compare--final' : ''}" aria-label="Progresso">
    ${teacher}
    <p class="t-label">${final ? (sameDay(s.startedAt) ? 'Hoje' : `Treino de ${fmtDate(s.startedAt)}`) : 'Até agora'}${cmp.prevTs ? ` vs. ${fmtDate(cmp.prevTs)}` : ''}</p>
    <p class="compare-say">${progressSay(cmp)}</p>
    <div class="table-wrap"><table class="compare-t">
      <thead><tr><th scope="col">exercício</th><th scope="col">carga e reps</th><th scope="col">volume</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    ${cmp.compared ? '<p class="t-note">Volume é carga × reps somadas.</p>' : ''}
    ${final && s.below ? whyLine(s) : ''}
  </section>`;
}
/* o motivo de um treino abaixo do normal, ou o convite pra anotar */
function whyLine(s) {
  const picks = (s.reasons || []).map(k => REASON_LABEL[k] || k), note = s.reasonNote;
  if (picks.length || note) return `<p class="why"><span class="t-label">motivo</span> ${esc(listPt(picks))}${note ? `${picks.length ? ' · ' : ''}“${esc(note)}”` : ''} <button class="link" data-a="reason-open" data-s="${s.id}">mudar</button></p>`;
  return `<p class="why">Ficou abaixo do normal. <button class="link" data-a="reason-open" data-s="${s.id}">anotar o motivo</button></p>`;
}
function numField(e, k, label) {
  const id = `n-${k}-${e.id}`;
  return `<label class="num" for="${id}"><span>${label}</span><input id="${id}" type="number" inputmode="numeric" min="${LIMITS[k][0]}" max="${LIMITS[k][1]}" data-in="ex-num" data-e="${e.id}" data-k="${k}" value="${e[k]}"></label>`;
}
function params(e) {
  const m = techOf(e).mode;
  if (m === 'time') return numField(e, 'goal', 'meta (min)');
  if (m === 'sets') {
    const range = e.goal > 0;
    return `<div class="tech-pick range-pick" role="radiogroup" aria-label="Repetições de ${esc(e.name || 'exercício')}">
        <button role="radio" aria-checked="${!range}" class="tp${range ? '' : ' on'}" data-a="ex-range" data-e="${e.id}" data-v="0">reps fixas</button>
        <button role="radio" aria-checked="${range}" class="tp${range ? ' on' : ''}" data-a="ex-range" data-e="${e.id}" data-v="1">faixa de reps</button>
      </div>`
      + numField(e, 'blocks', 'séries') + (range ? numField(e, 'goal', 'reps, de') + numField(e, 'reps', 'até') : numField(e, 'reps', 'reps')) + numField(e, 'rest', 'descanso (s)');
  }
  return numField(e, 'blocks', 'blocos') + (m === 'fixed' ? numField(e, 'reps', 'reps/bloco') : numField(e, 'goal', 'meta')) + numField(e, 'rest', 'descanso (s)');
}
function viewEdit(w) {
  return `
  <nav class="crumbs"><button class="link link--back" data-a="edit-done">${ICON.back}pronto</button><span class="t-note">editando</span></nav>
  <label class="t-label" for="wname">Nome do treino</label>
  <div class="field-wrap" id="fw-wname"><input id="wname" class="field field--display" data-in="w-name" value="${esc(w.name)}" placeholder="Treino A, Peito e costas…" autocomplete="off">${PEN}</div>
  <h2 class="t-section"><span class="under">Exercícios</span></h2>
  <div class="edlist">${w.exercises.map((e, i) => `<div class="card card--flat hand ed" id="ed-${e.id}" style="${FX.hand(e.id, 0.4)}">
      <div class="ed-row"><span class="ed-n">${i + 1}.</span><div class="field-wrap"><input id="exn-${e.id}" class="field" data-in="ex-name" data-e="${e.id}" value="${esc(e.name)}" placeholder="Nome do exercício" autocomplete="off" aria-label="Nome do exercício ${i + 1}">${PEN}</div></div>
      <div class="tech-pick" role="radiogroup" aria-label="Como vai ser">${Object.entries(TECH).map(([k, t]) => `<button role="radio" aria-checked="${k === e.tech}" class="tp${k === e.tech ? ' on' : ''}" data-a="ex-tech" data-e="${e.id}" data-t="${k}">${t.name}</button>`).join('')}</div>
      <div class="params">${params(e)}</div>
      <div class="ed-actions">${i > 0 ? `<button class="link" data-a="ex-up" data-e="${e.id}">subir</button>` : '<span></span>'}<button class="link link--danger" data-a="ex-del" data-e="${e.id}">apagar</button></div>
    </div>`).join('')}</div>
  <button class="btn btn--ghost btn--wide ed-add" data-a="ex-add">+ exercício</button>
  <div class="ed-foot"><button class="btn btn--wide" data-a="edit-done">Pronto</button><button class="link link--danger" data-a="w-del">apagar este treino</button></div>`;
}

/* =========================================================
   Telas: série
   ========================================================= */
const setCell = (r, kg) => `<span class="cell-v">${r}${kg != null ? `<small>×${fmt(kg)}</small>` : ''}</span>`;
function blockStrip(cfg) {
  const n = cfg.blocks, cur = run.reps.length, u = unit(cfg), sets = cfg.mode === 'sets';
  const plan = sets ? `<span class="cell-v cell-v--ghost">${cfg.repsMin ? `${cfg.repsMin}–${cfg.reps}` : cfg.reps}</span>` : null;
  let cells = '';
  for (let i = 0; i < n; i++) {
    const r = run.reps[i];
    let cls = 'is-todo', inner = '', extra = i === n - 1 && cfg.lastMax ? '<span class="maxb">máx</span>' : '';
    if (r != null) {
      const failed = (cfg.mode === 'fixed' || sets) && r < lowOf(cfg);
      cls = failed ? 'is-fail' : 'is-done';
      inner = (sets ? setCell(r, run.loads?.[i]) : tally(r, failed ? cfg.reps - r : 0, i + 1, i === run.animIdx))
        + dstamp(new Date(), `${run.eid}:${i}:s`, i === run.animIdx ? ' is-new' : '');
    } else if (i === cur && run.phase === 'work') {
      cls = 'is-cur';
      inner = sets ? plan : cfg.mode === 'fixed' ? tally(0, cfg.reps, i + 1) : '<span class="q">?</span>';
      extra += ICON.circle;
    } else {
      if (i === cur && run.phase === 'rest') cls += ' is-next';
      inner = run.phase === 'ready' ? (sets ? plan : cfg.mode === 'fixed' ? tally(0, cfg.reps, i + 1) : '') : '';
    }
    cells += `<div class="cell hand ${cls}" style="${FX.hand(`${run.eid}:${i}`, 0.7)}"><span class="cell-n">${u.short}${i + 1}</span>${inner}${extra}</div>`;
  }
  return `<div class="blocks" style="--n:${n}" aria-label="${run.reps.length} de ${n} ${u.many} feit${sets ? 'as' : 'os'}">${cells}</div>`;
}
function viewRun() {
  const e = curEx();
  if (!e) { run = null; clearRunDraft(); view = { name: 'home' }; return viewHome(); }
  const T = techOf(e), cfg = cfgOf(e), time = cfg.mode === 'time';
  if (cfg.mode === 'sets' && !run.loads) run.loads = run.reps.map(() => run.load ?? null);
  const soundOn = S.settings.sound || S.settings.voice;
  const w = getW(run.wid), pos = w ? w.exercises.findIndex(x => x.id === e.id) : -1;
  let stage;
  if (run.phase === 'ready') stage = stageReady(e, cfg, T);
  else if (run.phase === 'work') stage = time ? stageClock(cfg) : stageWork(cfg);
  else if (run.phase === 'rest') stage = stageRest(cfg);
  else stage = time ? stageDoneTime(e, cfg) : stageDone(e, cfg);
  return `<section class="run">
    <header class="run-top">
      <button class="link link--back" data-a="run-exit">${ICON.back}sair</button>
      <span class="chip">${T.name}</span>
      <button class="btn-round" data-a="mute" aria-label="${soundOn ? 'Desligar som e voz' : 'Ligar som e voz'}" aria-pressed="${soundOn}">${ICON.sound(soundOn)}</button>
    </header>
    ${w ? `<p class="runhead runhead--run">${esc(w.name || 'Treino')}${pos >= 0 ? `, exercício ${pos + 1} de ${w.exercises.length}` : ''}</p>` : ''}
    <h1 class="t-card run-name">${esc(e.name || 'Exercício')}${!time && run.phase !== 'ready' && run.load != null ? ` <small>· ${fmt(run.load)} kg</small>` : ''}</h1>
    ${run.phase !== 'done' && !time ? blockStrip(cfg) : ''}
    <div class="stage">${stage}</div>
  </section>`;
}
function stageReady(e, cfg, T) {
  const plan = planFor(e), time = cfg.mode === 'time', sets = cfg.mode === 'sets';
  return `
    <details class="rule"><summary>${spec(cfg)}</summary><p>${T.rule(cfg)}</p></details>
    <div class="card card--flat plan"><span class="t-label">Plano de hoje</span><p>${plan.html}</p></div>
    ${time ? '' : `<div>
      <label class="t-label" for="loadIn">Carga de hoje</label>
      <div class="load-row">
        <button class="key" data-a="load" data-d="-2.5" aria-label="menos 2,5 kg">−2,5</button>
        <button class="key" data-a="load" data-d="-1" aria-label="menos 1 kg">−1</button>
        <div class="load-in"><input id="loadIn" data-in="load" inputmode="decimal" autocomplete="off" value="${numIn(run.load)}" placeholder="0"><span>kg</span></div>
        <button class="key" data-a="load" data-d="1" aria-label="mais 1 kg">+1</button>
        <button class="key" data-a="load" data-d="2.5" aria-label="mais 2,5 kg">+2,5</button>
      </div>
    </div>`}
    <div class="spacer"></div>
    <button class="btn btn--go btn--wide btn--xl" data-a="begin">${ICON.play}<span>${time ? 'Começar o cronômetro' : sets ? 'Começar a 1ª série' : 'Começar a série'}</span></button>
    <p class="t-note hint">${time ? 'O app marca o tempo e avisa quando bater a meta.' : sets ? 'Toca no post-it no fim de cada série. O app conta o descanso.' : 'Deixa o celular de pé na sua frente e toca no post-it a cada bloco.'}</p>
    <p class="quick"><button class="link" data-a="quick">já fiz, só quero anotar</button></p>`;
}
function stageWork(cfg) {
  const i = run.reps.length, isLast = i === cfg.blocks - 1, u = unit(cfg), sets = cfg.mode === 'sets';
  const lastMax = isLast && cfg.lastMax;
  let sub;
  if (cfg.mode === 'count') sub = 'até a falha';
  else if (lastMax) sub = '<span class="hl" style="--c:var(--stamp)">último: máximo de reps!</span>';
  else sub = `${sets ? repsTxt(cfg) : cfg.reps} reps${sets && run.load != null ? ` · ${fmt(run.load)} kg` : ''}`;
  const secondary = [];
  if (cfg.mode === 'fixed' && !lastMax) secondary.push(`<button class="btn btn--warn" data-a="fail">Falhei antes de ${cfg.reps}</button>`);
  if ((cfg.mode === 'count' || sets) && i > 0) secondary.push('<button class="btn btn--ghost" data-a="end-set">Encerrar aqui</button>');
  if (i > 0) secondary.push(`<button class="link" data-a="undo">desfazer ${u.one} ${i}</button>`);
  return `
    <div class="cue"><span class="cue-k">${u.one}</span><b>${i + 1}</b><span class="cue-of">/${cfg.blocks}</span></div>
    <p class="cue-sub">${sub}</p>
    <button class="postit${run.slap ? ' postit--in' : ''}" data-a="block-done" aria-label="Terminei ${sets ? 'a série' : 'o bloco'} ${i + 1}">
      <span class="postit-big">${isLast ? 'Terminei!' : sets ? 'Terminei a série' : 'Terminei o bloco'}</span>
      <span class="postit-small">toca aqui</span>
    </button>
    ${secondary.length ? `<div class="row2">${secondary.join('')}</div>` : ''}`;
}
function stageClock(cfg) {
  const ms = Date.now() - run.phaseAt, goal = cfg.goal * 60000;
  return `
    <div class="timer timer--up${run.goalHit ? ' met' : ''}" id="timer" role="timer" aria-label="tempo">
      ${stampRing('tempo', `meta ${cfg.goal} min`, (RING * (1 - Math.min(1, ms / goal))).toFixed(1))}
      <b id="count">${fmtClock(ms)}</b>
    </div>
    <p class="rest-sub">meta: ${cfg.goal} min</p>
    <button class="postit postit--short${run.slap ? ' postit--in' : ''}" data-a="clock-done" aria-label="Terminei">
      <span class="postit-big">Terminei!</span>
      <span class="postit-small">toca aqui</span>
    </button>`;
}
function stageRest(cfg) {
  const ms = Math.max(0, run.restEnd - Date.now());
  const sec = Math.ceil(ms / 1000), nextI = run.reps.length, u = unit(cfg), sets = cfg.mode === 'sets';
  const nextLast = nextI === cfg.blocks - 1 && (cfg.lastMax || cfg.mode === 'count' || sets);
  const done = run.reps.length - 1;
  return `
    <div class="timer${sec <= 3 ? ' hot' : ''}" id="timer" role="timer" aria-label="descanso">
      ${stampRing('descanso', `${u.one} ${nextI + 1} de ${cfg.blocks}`, (RING * (1 - ms / run.restMs)).toFixed(1))}
      <b id="count">${sec}</b>
    </div>
    <p class="rest-sub">descansa… <span class="t-muted">${u.next}: ${u.one} ${nextI + 1}${nextLast ? `, ${u.last}` : ''}</span></p>
    ${cfg.mode === 'count' || sets ? `<div class="repadj"><span>Quantas reps saíram ${sets ? 'na série' : 'no bloco'} ${done + 1}?</span>${stepper(done)}</div>` : ''}
    ${sets ? `<div class="nextload"><span class="t-label">Carga da ${nextI + 1}ª série</span>
      <div class="load-row">
        <button class="key" data-a="load" data-d="-2.5" aria-label="menos 2,5 kg">−2,5</button>
        <button class="key" data-a="load" data-d="-1" aria-label="menos 1 kg">−1</button>
        <output class="load-out">${run.load != null ? fmt(run.load) : '0'}<span>kg</span></output>
        <button class="key" data-a="load" data-d="1" aria-label="mais 1 kg">+1</button>
        <button class="key" data-a="load" data-d="2.5" aria-label="mais 2,5 kg">+2,5</button>
      </div></div>` : ''}
    <div class="spacer"></div>
    <div class="row2"><button class="btn btn--ghost" data-a="undo">desfazer ${u.one} ${done + 1}</button><button class="btn" data-a="skip">${ICON.play}<span>já vou</span></button></div>`;
}
function stepper(i) {
  return `<div class="stepper"><button class="btn-round" data-a="rep" data-i="${i}" data-d="-1" aria-label="menos uma rep na ${i + 1}ª">−</button><output>${run.reps[i]}</output><button class="btn-round" data-a="rep" data-i="${i}" data-d="1" aria-label="mais uma rep na ${i + 1}ª">+</button></div>`;
}
function stageDone(e, cfg) {
  const sets = cfg.mode === 'sets', u = unit(cfg);
  const load = sets ? (run.loads[0] ?? null) : run.load;
  const ev = evaluate(cfg, run.reps, load);
  const vc = verdictCopy(cfg, ev, run.reps);
  const prev = lastLog(e.id);
  const now = { tech: e.tech, load, loads: sets ? run.loads : null, reps: run.reps, total: ev.total };
  let cmp;
  if (prev && prev.tech !== 'time') {
    const d = exDelta(now, prev), a = loadTxt(prev), b = loadTxt(now);
    const kg = a !== b && (a != null || b != null) ? `, ${a ?? '—'} → ${b ?? '—'} kg` : '';
    cmp = `<p class="stamp-cmp"><span class="t-label">vs. ${fmtDate(prev.ts)}</span>${deltaChip(d.pct)} de volume <span class="t-muted">(${fmt(prev.total)} → ${ev.total} reps${kg})</span></p>`;
  } else cmp = '<p class="stamp-cmp t-note">Primeira vez nesse exercício. No próximo treino eu mostro quanto você progrediu.</p>';
  const askLast = cfg.lastMax || cfg.mode === 'count';
  const rows = run.reps.map((r, i) => {
    const failed = (cfg.mode === 'fixed' || sets) && r < lowOf(cfg);
    const ask = askLast && i === run.reps.length - 1 && (cfg.mode === 'count' || i === cfg.blocks - 1);
    const mid = sets
      ? `<span class="rt"><input id="kg-${i}" class="kg-in" inputmode="decimal" autocomplete="off" data-in="set-load" data-i="${i}" value="${numIn(run.loads[i])}" placeholder="0" aria-label="carga da ${i + 1}ª série"><span class="kg-u">kg</span></span>`
      : `<span class="rt">${tally(r, 0, i + 1)}</span>`;
    return `<div class="rrow${failed ? ' fail' : ''}${ask ? ' ask' : ''}">
      <span class="rn">${u.short}${i + 1}</span>
      ${mid}
      ${stepper(i)}
      ${i === run.reps.length - 1 && run.reps.length > 1 ? `<button class="xbtn" data-a="rm-block" aria-label="apagar ${u.one} ${i + 1}">${ICON.x}</button>` : '<span></span>'}
    </div>`;
  }).join('');
  const canAdd = run.reps.length < cfg.blocks && (cfg.mode === 'count' || sets || ev.failBlock == null || ev.failBlock > run.reps.length);
  const isNew = run.fresh;
  return `
    <div class="done-head"><span class="hl${isNew ? ' hl--swipe' : ''}" style="--c:var(--up)">${u.done}</span><span class="total">${ev.total} reps</span></div>
    <div>
      <span class="t-label">${sets ? 'Confere reps e carga de cada série' : 'Confere as reps de cada bloco'}</span>
      <div class="rrows">${rows}</div>
      ${canAdd ? `<button class="link addb" data-a="add-block">+ esqueci de marcar ${sets ? 'uma série' : 'um bloco'}</button>` : ''}
    </div>
    <div class="card card--b stamp${isNew ? ' is-new' : ''}" style="--c:var(--${ev.verdict})"><h3>${vc.title}</h3><p>${vc.body}</p>${cmp}</div>
    <div class="done-actions">
      <button class="btn btn--go btn--wide btn--xl" data-a="save">Anotar no caderno</button>
      <button class="link link--danger" data-a="discard">descartar ${sets ? 'este exercício' : 'esta série'}</button>
    </div>`;
}
function stageDoneTime(e, cfg) {
  const ev = evaluate(cfg, [], null, run.minutes);
  const vc = verdictCopy(cfg, ev, [], run.km);
  const prev = lastLog(e.id);
  let cmp;
  if (prev && prev.tech === 'time') {
    const d = exDelta({ tech: 'time', total: ev.total }, prev);
    const km = prev.km != null || run.km != null ? `, ${fmt(prev.km)} → ${fmt(run.km)} km` : '';
    cmp = `<p class="stamp-cmp"><span class="t-label">vs. ${fmtDate(prev.ts)}</span>${deltaChip(d.pct)} de tempo <span class="t-muted">(${fmt(prev.total)} → ${fmt(ev.total)} min${km})</span></p>`;
  } else cmp = '<p class="stamp-cmp t-note">Primeira vez nesse exercício. No próximo treino eu mostro quanto você progrediu.</p>';
  const isNew = run.fresh;
  return `
    <div class="done-head"><span class="hl${isNew ? ' hl--swipe' : ''}" style="--c:var(--up)">Fim!</span><span class="total">${fmt(ev.total)} min</span></div>
    <div class="time-adj">
      <div class="num"><span>tempo (min)</span><div class="stepper"><button class="btn-round" data-a="min" data-d="-1" aria-label="menos um minuto">−</button><output>${fmt(run.minutes)}</output><button class="btn-round" data-a="min" data-d="1" aria-label="mais um minuto">+</button></div></div>
      <label class="num" for="kmIn"><span>distância (km)</span><input id="kmIn" inputmode="decimal" autocomplete="off" data-in="km" value="${numIn(run.km)}" placeholder="—"></label>
    </div>
    <div class="card card--b stamp${isNew ? ' is-new' : ''}" style="--c:var(--${ev.verdict})"><h3>${vc.title}</h3><p>${vc.body}</p>${cmp}</div>
    <div class="done-actions">
      <button class="btn btn--go btn--wide btn--xl" data-a="save">Anotar no caderno</button>
      <button class="link link--danger" data-a="discard">descartar</button>
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
  const logs = logsOf(e.id), time = techOf(e).mode === 'time';
  const rows = logs.map((l, i) => {
    const p = logs[i - 1];
    const mid = l.tech === 'time'
      ? `<td>${fmt(l.total)}</td><td>${l.km != null ? fmt(l.km) : '—'}</td>`
      : `<td>${loadTxt(l) ?? '—'}</td><td class="reps">${(l.reps || []).join('·')} <b>= ${fmt(l.total)}</b></td>`;
    return `<tr id="log-${l.id}">
      <td>${fmtDate(l.ts)}</td>
      ${mid}
      <td>${p ? deltaChip(exDelta(l, p).pct) : '<span class="t-muted">—</span>'}</td>
      <td><button class="del" data-a="del-log" data-l="${l.id}" aria-label="apagar registro de ${fmtDate(l.ts)}">${ICON.x}</button></td>
    </tr>`;
  }).reverse().join('');
  return `
  <nav class="crumbs"><button class="link link--back" data-a="open-w" data-w="${w.id}">${ICON.back}${esc(w.name || 'treino')}</button></nav>
  <h1 class="t-title">${esc(e.name || 'Exercício')}</h1>
  <p class="t-note">${techOf(e).name} · ${plural(logs.length, 'registro', 'registros')}</p>
  ${logs.length >= 2 ? chart(logs, time) : ''}
  ${logs.length ? `<div class="table-wrap hist"><table class="compare-t">
    <thead><tr><th scope="col">data</th>${time ? '<th scope="col">min</th><th scope="col">km</th><th scope="col">tempo</th>' : '<th scope="col">kg</th><th scope="col">reps</th><th scope="col">volume</th>'}<th scope="col"><span class="sr">apagar</span></th></tr></thead>
    <tbody>${rows}</tbody></table></div>`
    : '<p class="t-muted empty">Ainda não tem nada anotado aqui. Faz uma vez e ela aparece nesta página.</p>'}
  <div class="hist-go"><button class="btn btn--go btn--wide" data-a="run" data-e="${e.id}">${ICON.play}<span>Fazer agora</span></button></div>`;
}
function chart(all, time) {
  const L = all.slice(-10), W = 340, H = 170, pl = 20, pr = 20, pt = 30, pb = 40;
  const vals = L.map(l => +l.total || 0), max = Math.max(...vals), min = Math.min(...vals), span = Math.max(1, max - min);
  const x = i => L.length === 1 ? W / 2 : pl + i * (W - pl - pr) / (L.length - 1);
  const y = v => pt + (1 - (v - min) / span) * (H - pt - pb);
  const d = L.map((l, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(+l.total || 0).toFixed(1)}`).join('');
  const pts = L.map((l, i) => `<circle class="pt ${l.verdict}" cx="${x(i).toFixed(1)}" cy="${y(+l.total || 0).toFixed(1)}" r="5.5"/>
    <text class="v" x="${x(i).toFixed(1)}" y="${(y(+l.total || 0) - 12).toFixed(1)}">${fmt(l.total)}</text>
    <text class="kg" x="${x(i).toFixed(1)}" y="${H - 20}">${time ? (l.km != null ? `${fmt(l.km)}km` : '') : `${loadTxt(l) ?? '—'}kg`}</text>
    <text class="kg" x="${x(i).toFixed(1)}" y="${H - 6}">${fmtDate(l.ts)}</text>`).join('');
  return `<figure class="chart">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${time ? 'Minutos' : 'Total de reps'} nos últimos ${L.length} treinos"><path class="ln" d="${d}"/>${pts}</svg>
    <figcaption class="t-note">${time ? 'Minutos por treino. Verde: bateu a meta.' : 'Total de reps por treino. Verde: subiu a carga. Roxo: manteve. Laranja: baixou.'}</figcaption>
  </figure>`;
}

/* =========================================================
   Telas: calendário
   ========================================================= */
function viewCalendar() {
  const today = dayKey(), mk = view.month || today.slice(0, 7);
  const first = new Date(+mk.slice(0, 4), +mk.slice(5, 7) - 1, 1, 12), nDays = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const map = dayMap();
  const sel = view.day && view.day.startsWith(mk) ? view.day : mk === today.slice(0, 7) ? today : null;
  const month = first.toLocaleDateString('pt-BR', { month: 'long' });
  let cells = WEEK.map(d => `<span class="cal-wk t-label" aria-hidden="true">${d}</span>`).join('');
  for (let i = 0; i < first.getDay(); i++) cells += '<span aria-hidden="true"></span>';
  let trained = 0;
  for (let d = 1; d <= nDays; d++) {
    const k = `${mk}-${String(d).padStart(2, '0')}`, list = map.get(k) || [];
    if (list.length) trained++;
    const cls = `${list.length ? ' is-on' : ''}${k === today ? ' is-today' : ''}${k === sel ? ' is-sel' : ''}${k > today ? ' is-future' : ''}`;
    cells += `<button class="cal-day${cls}" data-a="cal-day" data-d="${k}" aria-pressed="${k === sel}" aria-label="${fmtLong(dateOf(k))}${list.length ? `, ${plural(list.length, 'treino', 'treinos')}` : ''}">
      <span class="cal-n"${list.length ? ` style="${FX.hand(k + ':cal', .7)}"` : ''}>${d}</span>
      <span class="dots" aria-hidden="true">${list.slice(0, 3).map(s => `<i class="dot dot--${resultOf(s)}"></i>`).join('')}</span>
    </button>`;
  }
  return `
  <h1 class="t-title t-title--print page-top">Calendário</h1>
  <p class="t-note">${trained ? `${plural(trained, 'dia', 'dias')} de treino em ${month}.` : `Nenhum treino anotado em ${month}.`}</p>
  <div class="cal-nav">
    <button class="btn-round" data-a="cal-month" data-d="-1" aria-label="Mês anterior">${ICON.prev}</button>
    <p class="cal-title"><span class="t-label">Mês</span><b>${month} de ${first.getFullYear()}</b></p>
    <button class="btn-round" data-a="cal-month" data-d="1" aria-label="Próximo mês">${ICON.next}</button>
  </div>
  <div class="cal-caption">Frequência de ${month}</div>
  <div class="cal-grid">${cells}</div>
  <div class="cal-legend" aria-hidden="true"><span><i class="dot dot--up"></i>progrediu</span><span><i class="dot dot--keep"></i>manteve</span><span><i class="dot dot--down"></i>abaixo do normal</span><span><i class="dot dot--free"></i>outra atividade</span></div>
  ${sel ? dayDetail(sel, map.get(sel) || []) : '<p class="t-muted empty">Toca num dia pra ver o que foi feito.</p>'}
  ${folio('calendar')}`;
}
function dayDetail(k, list) {
  const future = k > dayKey();
  return `<section class="cal-detail" aria-label="${fmtLong(dateOf(k))}">
    <h2 class="t-section"><span class="under">${cap(fmtLong(dateOf(k)))}</span></h2>
    ${list.length ? `<div class="day-list">${list.map(sessCard).join('')}</div>` : `<p class="t-muted">${future ? 'Esse dia ainda não chegou.' : 'Nada anotado nesse dia.'}</p>`}
    ${future ? '' : `<button class="btn btn--ghost btn--wide day-add" data-a="free-open" data-d="${k}">+ anotar outra atividade nesse dia</button>`}
  </section>`;
}
function sessCard(s) {
  if (isFree(s)) {
    const d = s.details && s.details.tipo === 'bjj' ? s.details : null;
    const golpes = d ? d.golpes || [] : [];
    return `<article class="card card--flat hand sess${d ? ' sess--bjj' : ''}" style="${FX.hand(s.id, 0.4)}">
    <div class="sess-head"><h3>${esc(s.name || 'Atividade')}</h3><span class="delta delta--sm" style="--c:var(--free)">${s.minutes ? `${fmt(s.minutes)} min` : 'feito'}</span></div>
    ${d ? `<p class="bjj-kimono">${d.kimono === false ? 'sem kimono' : 'de kimono'}</p>
    <div class="bjj-row"><span class="t-label">Rolas</span><span class="bjj-tally">${d.rolas ? tally(d.rolas, 0, s.startedAt % 97) : '<span class="t-muted">nenhum</span>'}</span>${d.rolas ? `<b>${d.rolas}</b>` : ''}</div>
    ${golpes.length ? `<div class="bjj-row bjj-row--top"><span class="t-label">Encaixei</span><span class="bjj-golpes">${golpes.map(g => `<span class="hl" style="--c:var(--ok);${FX.hand(s.id + g, 0.3)}">${esc(g)}</span>`).join('')}</span></div>` : ''}` : ''}
    ${s.note ? (d ? `<div class="bjj-learn"><span class="t-label">O que aprendi</span><p>${esc(s.note)}</p></div>` : `<p>${esc(s.note)}</p>`) : ''}
    <div class="sess-foot"><span class="t-note">${d ? 'diário de jiu-jitsu' : 'outra atividade'}</span><button class="link link--danger" data-a="free-del" data-s="${s.id}">apagar</button></div>
  </article>`;
  }
  const w = getW(s.wid), logs = sessLogs(s.id), cmp = w ? sessionCompare(w, s) : null;
  const doneN = new Set(logs.map(l => l.eid)).size;
  const meta = `às ${fmtTime(s.startedAt)} · ${w ? `${doneN} de ${w.exercises.length} exercícios` : plural(doneN, 'exercício', 'exercícios')}${s.closedAt ? '' : ' · em andamento'}`;
  const latest = [...new Map(logs.map(l => [l.eid, l])).values()];
  return `<article class="card card--flat hand sess" style="${FX.hand(s.id, 0.4)}">
    <div class="sess-head"><h3>${esc(w?.name || s.name || 'Treino')}</h3>${cmp && cmp.pct != null ? deltaChip(cmp.pct, ' delta--sm') : ''}</div>
    <p class="t-note">${meta}</p>
    <ul class="sess-list">${latest.map(l => `<li><b>${esc(l.name || 'Exercício')}</b> <span>${esc(logSummary(l, true))}</span></li>`).join('')}</ul>
    ${s.below ? whyLine(s) : ''}
    ${w ? `<div class="sess-foot"><span></span><button class="link link--fwd" data-a="open-w" data-w="${w.id}">abrir o treino${ICON.next.replace('<svg ', '<svg class="ic" ')}</button></div>` : ''}
  </article>`;
}

/* =========================================================
   Folhas de baixo: motivo da queda e outra atividade
   ========================================================= */
function viewReason() {
  const s = S.sessions.find(x => x.id === sheet.sid);
  if (!s) { sheet = null; return ''; }
  const w = getW(s.wid);
  let why = 'Ficou abaixo do normal';
  if (w && !isComplete(w, s)) why = `Você encerrou com ${new Set(sessLogs(s.id).map(l => l.eid)).size} de ${w.exercises.length} exercícios`;
  else if (w) { const cmp = sessionCompare(w, s); if (cmp && cmp.pct != null && cmp.prevTs) why = `Ficou ${fmtPct(cmp.pct).slice(1)} abaixo do treino de ${fmtDate(cmp.prevTs)}`; }
  return `<div class="backdrop" data-a="sheet-close">
    <div class="card bsheet" role="dialog" aria-modal="true" aria-labelledby="rsT" data-a="noop">
      <h2 id="rsT">O que rolou hoje?</h2>
      <p class="t-muted">${esc(why)}. Acontece. Anota o motivo pra lembrar depois.</p>
      <div class="tags" role="group" aria-label="Motivos">${REASONS.map(([k, t]) => `<button class="tag" aria-pressed="${sheet.picks.includes(k)}" data-a="reason-pick" data-k="${k}">${t}</button>`).join('')}</div>
      <div class="fgroup"><label class="t-label" for="rNote">Quer contar mais? (opcional)</label>
        <div class="field-wrap"><input id="rNote" class="field" data-in="reason-note" value="${esc(sheet.note)}" placeholder="ex.: dormi 4 horas" autocomplete="off" maxlength="200">${PEN}</div></div>
      <button class="btn btn--go btn--wide" data-a="reason-save">Anotar o motivo</button>
      <button class="link" data-a="sheet-close">agora não</button>
    </div>
  </div>`;
}
function bjjForm() {
  return `<section class="bjj" aria-label="Diário de jiu-jitsu">
    <div class="tech-pick" role="radiogroup" aria-label="Kimono">
      <button role="radio" aria-checked="${sheet.gi}" class="tp${sheet.gi ? ' on' : ''}" data-a="bjj-gi" data-v="1">de kimono</button>
      <button role="radio" aria-checked="${!sheet.gi}" class="tp${sheet.gi ? '' : ' on'}" data-a="bjj-gi" data-v="0">sem kimono</button>
    </div>
    <div class="min-row"><span class="t-label">Rolas</span><span class="bjj-tally" aria-hidden="true">${sheet.rolas ? tally(sheet.rolas, 0, 7) : ''}</span>
      <div class="stepper"><button class="btn-round" data-a="bjj-rolas" data-d="-1" aria-label="menos um rola">−</button><output>${sheet.rolas}</output><button class="btn-round" data-a="bjj-rolas" data-d="1" aria-label="mais um rola">+</button></div></div>
    <div class="fgroup"><span class="t-label">Golpes que encaixei</span>
      <div class="tags" role="group" aria-label="Golpes que encaixei">${BJJ_GOLPES.map(g => `<button class="tag" aria-pressed="${sheet.golpes.includes(g)}" data-a="bjj-golpe" data-v="${g}">${g}</button>`).join('')}</div>
      <div class="field-wrap"><input id="fGolpe" class="field" data-in="bjj-extra" value="${esc(sheet.extra)}" placeholder="outro golpe (separa por vírgula)" autocomplete="off" maxlength="120" aria-label="Outro golpe">${PEN}</div></div>
    <div class="fgroup"><label class="t-label" for="fLearn">O que aprendi hoje</label>
      <textarea id="fLearn" class="lined" data-in="free-note" rows="4" maxlength="600" placeholder="a passagem toreando, o ajuste do triângulo…">${esc(sheet.note)}</textarea></div>
  </section>`;
}
function viewFree() {
  return `<div class="backdrop" data-a="sheet-close">
    <div class="card bsheet${sheet.shown ? ' bsheet--still' : ''}" role="dialog" aria-modal="true" aria-labelledby="fsT" data-a="noop">
      <h2 id="fsT">Anotar outra atividade</h2>
      <p class="t-muted">${sheet.day === dayKey() ? 'Hoje' : cap(fmtLong(dateOf(sheet.day)))}. Jiu-jitsu, corrida, futebol, o que for.</p>
      <div class="fgroup"><label class="t-label" for="fName">O que você fez?</label>
        <div class="field-wrap"><input id="fName" class="field field--display" data-in="free-name" value="${esc(sheet.name)}" placeholder="Corrida no parque" autocomplete="off" maxlength="60">${PEN}</div></div>
      <div class="tags">${FREE_PICKS.map(n => `<button class="tag" data-a="free-pick" data-v="${n}" aria-pressed="${sheet.name === n}">${n}</button>`).join('')}</div>
      <div class="min-row"><span class="t-label">Quanto tempo</span><div class="stepper"><button class="btn-round" data-a="free-min" data-d="-5" aria-label="menos 5 minutos">−</button><output id="fMin">${sheet.minutes} min</output><button class="btn-round" data-a="free-min" data-d="5" aria-label="mais 5 minutos">+</button></div></div>
      ${isBJJ(sheet.name) ? bjjForm() : `<div class="fgroup"><label class="t-label" for="fNote">Nota (opcional)</label>
        <div class="field-wrap"><input id="fNote" class="field" data-in="free-note" value="${esc(sheet.note)}" placeholder="treino puxado, 5 rounds" autocomplete="off" maxlength="200">${PEN}</div></div>`}
      <button class="btn btn--go btn--wide" data-a="free-save">Anotar no calendário</button>
      <button class="link" data-a="sheet-close">cancelar</button>
    </div>
  </div>`;
}
/* depois de fechar o treino abaixo do normal, pergunta o motivo (se você ainda estiver na tela do treino) */
const askWhy = (sid, delay) => afterRender.push(() => setTimeout(() => { if (view.name === 'workout' && !sheet) openReason(sid); }, delay));
function openReason(sid) {
  const s = S.sessions.find(x => x.id === sid); if (!s) return;
  sheet = { kind: 'reason', sid, picks: [...(s.reasons || [])], note: s.reasonNote || '' };
  renderSheet();
}
let lastSheet = '';
function renderSheet() {
  let h = '';
  if (view.name === 'run' && run && run.ask) h = viewAsk();
  else if (sheet && sheet.kind === 'reason') h = viewReason();
  else if (sheet && sheet.kind === 'free') h = viewFree();
  if (h !== lastSheet) { $('#sheetLayer').innerHTML = h; lastSheet = h; }
}

/* =========================================================
   Render e navegação
   ========================================================= */
/* tema: automático (segue o celular), claro ou escuro; vale pra conta e fica lembrado no aparelho pra abrir sem piscar */
const THEME_COLOR = { light: '#172e6c', dark: '#0a1229' };
function applyTheme() {
  let t = 'auto';
  if (S.user) t = S.settings.theme || 'auto';
  else { try { t = localStorage.getItem('bloquinho:theme') || 'auto'; } catch (e) {} }
  const root = document.documentElement;
  if (t === 'light' || t === 'dark') root.dataset.theme = t; else delete root.dataset.theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.content = THEME_COLOR[t] || (/dark/.test(m.media) ? THEME_COLOR.dark : THEME_COLOR.light); });
  if (S.user) { try { localStorage.setItem('bloquinho:theme', t); } catch (e) {} }
}
/* deslizar o dedo: nas abas, da direita pra esquerda avança e da esquerda pra direita volta;
   nas telas de dentro, puxar da beirada esquerda volta */
let swipe = null;
document.addEventListener('touchstart', ev => {
  swipe = null;
  if (ev.touches.length !== 1 || sheet || installOpen || (run && run.ask) || busy) return;
  if (ev.target.closest && ev.target.closest('input, textarea, .table-wrap')) return;
  const t = ev.touches[0];
  swipe = { x: t.clientX, y: t.clientY, at: Date.now() };
}, { passive: true });
document.addEventListener('touchend', ev => {
  if (!swipe) return;
  const t = ev.changedTouches[0], dx = t.clientX - swipe.x, dy = t.clientY - swipe.y, x0 = swipe.x, dt = Date.now() - swipe.at;
  swipe = null;
  if (dt > 700 || Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
  const i = TABS.findIndex(([v]) => v === view.name);
  if (i >= 0) {
    const j = i + (dx < 0 ? 1 : -1);
    if (j < 0 || j >= TABS.length) return;
    const v = TABS[j][0];
    if (v === 'home') ACT.home(); else go({ name: v });
    return;
  }
  if (dx > 0 && x0 < 48) { const back = $('#app .link--back'); if (back) back.click(); }
}, { passive: true });
/* abas da caderneta nas telas principais */
const TABS = [['home', 'Caderno', 'book'], ['calendar', 'Calendário', 'cal'], ['account', 'Conta', 'user']];
/* rodapé de folha: cada aba é uma folha numerada da caderneta */
const folio = v => `<footer class="folio" aria-hidden="true"><span>Bloquinho</span><span>folha ${TABS.findIndex(([k]) => k === v) + 1} de ${TABS.length}</span></footer>`;
function renderTabs() {
  const on = !!S.user && TABS.some(([v]) => v === view.name);
  document.body.toggleAttribute('data-tabs', on);
  $('#tabLayer').innerHTML = on ? `<nav class="tabbar" aria-label="Seções">${TABS.map(([v, label, ic]) => `<button class="tabb${view.name === v ? ' on' : ''}" data-a="tab" data-v="${v}"${view.name === v ? ' aria-current="page"' : ''}>${ICON[ic]}<span>${label}</span></button>`).join('')}</nav>` : '';
}
function render() {
  applyTheme();
  let html;
  if (!S.user && view.name !== 'auth') view = { name: 'auth' };
  switch (view.name) {
    case 'auth': html = viewAuth(); break;
    case 'workout': html = viewWorkout(); break;
    case 'run': html = run ? viewRun() : (view = { name: 'home' }, viewHome()); break;
    case 'history': html = viewHistory(); break;
    case 'calendar': html = viewCalendar(); break;
    case 'account': html = viewAccount(); break;
    default: html = viewHome();
  }
  $('#app').innerHTML = html;
  document.body.dataset.view = view.name;
  renderTabs();
  renderSheet();
  if (run) { run.animIdx = -1; run.slap = false; run.fresh = false; }
  if (view.name === 'run' && run && (run.phase === 'rest' || clockRun()) && !tickT) startTick();
  if (focusAfter) {
    const el = document.getElementById(focusAfter); focusAfter = null;
    if (el) { el.focus(); if (el.select) el.select(); }
  }
  const cbs = afterRender; afterRender = [];
  cbs.forEach(fn => { try { fn(); } catch (e) {} });
}
/* coisa nova da nuvem não atropela quem tá digitando */
const typing = () => { const a = document.activeElement; return !!(a && a.matches && a.matches('input, textarea, select')); };
function safeRender() { if (busy || typing()) { needRender = true; return; } needRender = false; render(); }
document.addEventListener('focusout', () => setTimeout(() => { if (needRender && !typing() && !busy) { needRender = false; render(); } }, 0));
/* re-renderiza sem perder o campo onde você tá */
function renderKeepFocus() { setTimeout(() => { const id = document.activeElement && document.activeElement.id; render(); if (id) { const el = document.getElementById(id); if (el) el.focus(); } }, 0); }
/* profundidade de cada tela: ir mais fundo vira a folha pra cima, voltar traz a folha de volta */
/* ordem das folhas: as abas (caderno, calendário, conta) e as telas de dentro; ir pra frente vira a folha, voltar traz de volta */
const depthOf = v => ({ auth: 0, home: 0, calendar: 0.4, account: 0.8, workout: v.edit ? 1.5 : 1 })[v.name] ?? 2;
function go(v) {
  const from = depthOf(view), to = depthOf(v);
  const apply = () => { view = v; armed = null; window.scrollTo(0, 0); render(); };
  // a folha vira a partir do topo, então sobe antes de virar
  if (from !== to) window.scrollTo(0, 0);
  FX.flipPage(apply, from === to ? null : to > from ? 'fwd' : 'back');
}
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
/* tocar pra fazer um exercício começa a rodada (se não tiver uma aberta) */
function startRun(wid, eid) {
  const e = getE(wid, eid); if (!e) return;
  const { s, isNew } = startSession(wid);
  run = { wid, eid: e.id, sid: s.id, newSession: isNew, phase: 'ready', phaseAt: Date.now(), load: planFor(e).load, reps: [], animIdx: -1 };
  go({ name: 'run', wid });
}
/* saiu da série sem anotar: se a rodada tinha acabado de começar, desfaz */
function leaveRun() {
  stopTick(); releaseWake();
  const wid = run ? run.wid : view.wid;
  if (run && run.newSession) dropIfEmpty(run.sid);
  run = null; clearRunDraft();
  go({ name: 'workout', wid });
}
/* roda uma animação de borracha e só depois muda o estado */
async function erase(el, opts, then) {
  if (busy) return;
  busy = true;
  try { await FX.eraseOut(el, opts); } finally { busy = false; }
  then();
}

/* =========================================================
   Conta: entrar, sair e sincronizar
   ========================================================= */
function onSync(st) {
  sync = st;
  const el = $('#syncStatus'); if (el) el.textContent = syncText();
}
async function enter(user) {
  if (S.user && S.user.id === user.id) { if (view.name === 'auth') go({ name: 'home' }); return; }
  S.user = { id: user.id, email: user.email || '' };
  resetState(); lsLoad();
  Cloud.begin(S.user.id, () => S, onSync);
  run = null; restoreRun();
  if (!run) view = { name: 'home' };
  render();
  maybeInstall();
  await pullAndMerge(true);
}
let pulling = false;
async function pullAndMerge(first) {
  if (!S.user || pulling) return;
  pulling = true;
  const uid = S.user.id;
  try {
    const r = await Cloud.pull();
    if (!S.user || S.user.id !== uid) return;
    if (!r.ok) { if (first && !S.workouts.length && !S.logs.length) toast('Sem internet: seus treinos aparecem quando conectar.'); return; }
    let changed = r.changed;
    if (first && importLegacy(r.empty)) { changed = true; toast('Trouxe os treinos deste aparelho pra sua conta.'); }
    migrateSessions();
    if (!S.workouts.length && !S.logs.length && !S.settings.seeded) { S.workouts = [exampleWorkout()]; changed = true; }
    lsSave();
    if (changed) safeRender();
  } finally { pulling = false; }
}
async function leaveAccount(byUser) {
  if (!S.user) return;
  const uid = S.user.id;
  S.user = null;                                         // o aviso de "saiu" do Supabase chega depois e não repete isto
  stopTick(); releaseWake(); run = null; clearRunDraft(); sheet = null;
  Cloud.end();
  if (byUser) await Cloud.signOut();
  try { localStorage.removeItem(`bloquinho:u:${uid}`); } catch (e) {}
  Cloud.forget(uid);
  resetState();
  auth = blankAuth();
  view = { name: 'auth' }; render();
  toast(byUser ? 'Você saiu da conta.' : 'Sua sessão acabou. Entra de novo.');
}
function onAuthEvent(ev, session) {
  if (ev === 'PASSWORD_RECOVERY') { recovering = true; auth = { ...blankAuth(), mode: 'newpass' }; view = { name: 'auth' }; render(); return; }
  if (ev === 'SIGNED_OUT' && S.user) { leaveAccount(false); return; }
  if (ev === 'SIGNED_IN' && session && session.user && !S.user && !recovering && !auth.busy) enter(session.user);
}
document.addEventListener('visibilitychange', () => {
  if (!S.user) return;
  if (document.visibilityState === 'hidden') Cloud.flush(0);
  else if (Cloud.sinceLastPull() > 60e3) pullAndMerge(false);
});

/* =========================================================
   Ações
   ========================================================= */
const SUB = {
  async auth(f) {
    if (auth.busy) return;
    const m = auth.mode;
    const email = (f.querySelector('#aEmail')?.value || auth.email).trim().toLowerCase();
    const pass = f.querySelector('#aPass')?.value ?? '';
    const phone = f.querySelector('#aPhone')?.value ?? auth.phone;
    Object.assign(auth, { email, pass, phone });
    const bad = authCheck(m, email, pass, phone);
    if (bad) { auth.err = bad.msg; focusAfter = bad.field; render(); return; }
    auth.busy = true; auth.err = ''; render();
    try {
      if (m === 'login') {
        const u = await Cloud.signIn(email, pass);
        auth = blankAuth(); await enter(u);
      } else if (m === 'signup') {
        const r = await Cloud.signUp(email, pass, phoneE164(phone));
        if (r.session) { auth = blankAuth(); await enter(r.user); toast('Conta criada! O caderno é seu.'); }
        else { auth = { ...blankAuth(), mode: 'sent', email, msg: `Mandei um link de confirmação pra ${email}. Abre ele e depois entra por aqui.` }; render(); }
      } else if (m === 'forgot') {
        await Cloud.resetPassword(email);
        auth = { ...blankAuth(), mode: 'sent', email, msg: `Se ${email} tiver conta, chegou um link pra criar uma senha nova. Olha também no spam.` }; render();
      } else if (m === 'newpass') {
        const u = await Cloud.updatePassword(pass);
        recovering = false; auth = blankAuth();
        if (S.user) go({ name: 'home' }); else await enter(u);
        toast('Senha nova salva.');
      }
    } catch (e) { auth.busy = false; auth.err = Cloud.errMsg(e); render(); }
  }
};
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
  'auth-mode'(el) {
    auth = { ...blankAuth(), mode: el.dataset.m, email: auth.email, phone: auth.phone };
    focusAfter = el.dataset.m === 'newpass' ? 'aPass' : 'aEmail';
    render();
  },
  'auth-eye'(el) {
    const i = $('#aPass'); if (!i) return;
    const show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    el.textContent = show ? 'esconder' : 'mostrar'; el.setAttribute('aria-pressed', show);
  },
  async logout(el) {
    const n = Cloud.pendingCount();
    if (!confirmTap(el, 'logout', n ? 'tem coisa sem subir. sair mesmo?' : 'toca de novo pra sair')) return;
    if (n) await Cloud.flush(4000);
    await leaveAccount(true);
  },
  home() {
    const fw = fresh.w; fresh.w = null;
    if (fw) afterRender.push(() => FX.drawIn($(`#wc-${fw}`), { delay: 420 }));
    go({ name: 'home' });
  },
  'hide-how'(el) { erase(el.closest('.how'), { collapse: true }, () => { S.settings.hideHow = true; saveCaderno(); render(); }); },
  set(el) { const k = el.dataset.k; S.settings[k] = !S.settings[k]; saveCaderno(); render(); },
  theme(el) { if (S.settings.theme === el.dataset.v) return; S.settings.theme = el.dataset.v; saveCaderno(); render(); },
  tab(el) {
    const v = el.dataset.v;
    if (v === view.name) { window.scrollTo({ top: 0, behavior: FX.reduceMotion() ? 'auto' : 'smooth' }); return; }
    if (v === 'home') ACT.home(); else go({ name: v });
  },
  'open-w'(el) { go({ name: 'workout', wid: el.dataset.w }); },
  'new-w'() {
    const w = { id: newId(), name: '', exercises: [mkEx('')] };
    S.workouts.push(w); saveCaderno();
    fresh.w = w.id; fresh.ex.add(w.exercises[0].id);
    focusAfter = 'wname';
    afterRender.push(() => { FX.lineIn($('#fw-wname')); FX.drawIn($(`#ed-${w.exercises[0].id}`), { delay: 450 }); });
    go({ name: 'workout', wid: w.id, edit: true });
  },
  'edit-w'() { go({ ...view, edit: true }); },
  'edit-done'() {
    const w = getW(view.wid);
    // treino criado e abandonado sem nada escrito não vira lixo no caderno
    if (w && !w.name.trim() && !w.exercises.some(e => e.name.trim()) && !S.logs.some(l => l.wid === w.id)) {
      S.workouts = S.workouts.filter(x => x.id !== w.id); fresh.ex.clear();
      if (fresh.w === w.id) fresh.w = null;
      saveCaderno(); go({ name: 'home' }); return;
    }
    const ids = [...fresh.ex]; fresh.ex.clear();
    afterRender.push(() => setTimeout(() => FX.writeIn(ids.map(id => document.getElementById(`row-${id}`)).filter(Boolean)), 380));
    go({ ...view, edit: false });
  },
  'ex-tech'(el) {
    const w = getW(view.wid), e = getE(view.wid, el.dataset.e), T = TECH[el.dataset.t];
    if (!e || e.tech === el.dataset.t) return;
    Object.assign(e, { tech: el.dataset.t, blocks: T.blocks, reps: T.reps || 4, rest: T.rest, goal: T.goal });
    touchWorkout(w); saveCaderno(); render();
  },
  'ex-range'(el) {
    const w = getW(view.wid), e = getE(view.wid, el.dataset.e); if (!e) return;
    const on = el.dataset.v === '1';
    if (on === e.goal > 0) return;
    if (on) { e.reps = Math.max(2, e.reps); e.goal = clamp(e.reps - 4, 1, e.reps - 1); }
    else e.goal = 0;
    touchWorkout(w); saveCaderno(); render();
  },
  'ex-up'(el) {
    const w = getW(view.wid), i = w.exercises.findIndex(e => e.id === el.dataset.e);
    if (i > 0) { [w.exercises[i - 1], w.exercises[i]] = [w.exercises[i], w.exercises[i - 1]]; touchWorkout(w); saveCaderno(); render(); }
  },
  'ex-del'(el) {
    if (!confirmTap(el, 'ex-del:' + el.dataset.e, 'apagar mesmo?')) return;
    const id = el.dataset.e;
    erase(document.getElementById(`ed-${id}`), { collapse: true }, () => {
      const w = getW(view.wid); w.exercises = w.exercises.filter(e => e.id !== id);
      fresh.ex.delete(id); touchWorkout(w); saveCaderno(); render();
    });
  },
  'ex-add'() {
    const w = getW(view.wid), e = mkEx('');
    w.exercises.push(e); fresh.ex.add(e.id); touchWorkout(w); saveCaderno();
    focusAfter = 'exn-' + e.id;
    afterRender.push(() => FX.drawIn(document.getElementById(`ed-${e.id}`), { delay: 80 }));
    render();
  },
  'w-del'(el) {
    if (!confirmTap(el, 'w-del', 'apagar o treino inteiro?')) return;
    const w = getW(view.wid), idx = S.workouts.indexOf(w);
    const ghost = wcard(w);
    S.workouts = S.workouts.filter(x => x !== w);
    S.sessions = S.sessions.filter(x => x.wid !== w.id || sessLogs(x.id).length);
    if (fresh.w === w.id) fresh.w = null;
    saveCaderno();
    // o cartão aparece na capa e a borracha apaga ele lá
    afterRender.push(() => {
      const cards = $('.cards'); if (!cards) return;
      const tmp = document.createElement('div'); tmp.innerHTML = ghost;
      const g = tmp.firstElementChild; g.removeAttribute('data-a'); g.setAttribute('aria-hidden', 'true'); g.tabIndex = -1;
      const ref = cards.querySelectorAll('.wcard')[idx];
      if (!cards.querySelector('.wcard')) cards.innerHTML = '';
      cards.insertBefore(g, ref || null);
      setTimeout(() => erase(g, { collapse: true }, () => { render(); toast('Treino apagado.'); }), 450);
    });
    go({ name: 'home' });
  },
  run(el) { startRun(view.wid, el.dataset.e); },
  'start-w'() { const w = getW(view.wid); if (w && w.exercises[0]) startRun(w.id, w.exercises[0].id); },
  'end-w'(el) {
    if (!confirmTap(el, 'end-w', 'toca de novo pra encerrar')) return;
    const s = openSession(view.wid); if (!s) return;
    closeSession(s, getW(view.wid)); saveCaderno();
    fresh.closed = true;
    afterRender.push(() => { FX.drawIn($('.compare--final'), { delay: 120 }); fresh.closed = false; });
    if (s.below) askWhy(s.id, 900);
    window.scrollTo(0, 0); render();
  },
  hist(el) { go({ name: 'history', wid: view.wid, eid: el.dataset.e }); },
  load(el) {
    const inp = $('#loadIn'); const cur = parseNum(inp ? inp.value : run.load ?? 0) ?? 0;
    run.load = Math.max(0, Math.round((cur + parseFloat(el.dataset.d)) * 10) / 10);
    saveRunDraft(); render();
  },
  begin() {
    const inp = $('#loadIn'); if (inp) run.load = parseNum(inp.value);
    audioUnlock(); requestWake();
    const cfg = cfgOf(curEx());
    run.reps = []; run.loads = cfg.mode === 'sets' ? [] : undefined; run.goalHit = false;
    setPhase('work'); run.slap = true;
    if (cfg.mode === 'time') cue('clock'); else cue('start', 1, cfg.blocks === 1, unit(cfg));
    saveRunDraft(); render(); window.scrollTo(0, 0);
  },
  /* anotar sem cronometrar: já abre a conferência com o plano preenchido */
  quick() {
    const inp = $('#loadIn'); if (inp) run.load = parseNum(inp.value);
    const cfg = cfgOf(curEx());
    run.reps = []; run.loads = cfg.mode === 'sets' ? [] : undefined;
    if (cfg.mode === 'time') { run.minutes = cfg.goal; run.km = null; }
    else for (let i = 0; i < cfg.blocks; i++) pushBlock(cfg.mode === 'count' ? defaultCount(i) : cfg.reps);
    finish(true);
  },
  'block-done'(el) {
    if (!run || run.phase !== 'work' || busy || Date.now() - run.phaseAt < 400) return;
    audioUnlock();
    FX.peelOff(el);
    const cfg = cfgOf(curEx()), i = run.reps.length, isLast = i === cfg.blocks - 1;
    pushBlock(cfg.mode === 'count' ? defaultCount(i) : cfg.reps);
    if (isLast) finish(); else startRest();
  },
  'clock-done'(el) {
    if (!run || run.phase !== 'work' || Date.now() - run.phaseAt < 400) return;
    FX.peelOff(el);
    finish();
  },
  fail() { run.ask = 'fail'; render(); },
  'fail-pick'(el) { pushBlock(parseInt(el.dataset.v, 10)); run.ask = null; finish(); },
  'ask-close'() { run.ask = null; render(); },
  'end-set'() { finish(); },
  undo() {
    if (!run || !run.reps.length) return;
    stopTick();
    const cell = document.querySelectorAll('.blocks .cell')[run.reps.length - 1];
    erase(cell && cell.querySelector('.t, .cell-v'), { dur: 480 }, () => {
      run.reps.pop();
      if (run.loads) { const l = run.loads.pop(); if (l !== undefined) run.load = l; }
      setPhase('work'); run.slap = true; saveRunDraft(); render();
    });
  },
  skip() { endRest(); },
  rep(el) {
    const i = +el.dataset.i; run.reps[i] = clamp((run.reps[i] || 0) + (+el.dataset.d), 0, 99); saveRunDraft(); render();
  },
  min(el) { run.minutes = clamp((run.minutes || 0) + (+el.dataset.d), 1, 600); saveRunDraft(); render(); },
  'rm-block'(el) {
    if (run.reps.length <= 1) return;
    erase(el.closest('.rrow'), { dur: 480, collapse: true }, () => { run.reps.pop(); if (run.loads) run.loads.pop(); saveRunDraft(); render(); });
  },
  'add-block'() {
    const cfg = cfgOf(curEx());
    if (run.reps.length >= cfg.blocks) return;
    run.reps.push(cfg.mode === 'count' ? (run.reps.at(-1) || 1) : cfg.reps);
    if (run.loads) run.loads.push(run.loads.at(-1) ?? run.load ?? null);
    saveRunDraft(); render();
  },
  save() {
    const e = curEx(), w = getW(run.wid), cfg = cfgOf(e), sets = cfg.mode === 'sets', time = cfg.mode === 'time';
    const load = time ? null : sets ? (run.loads[0] ?? null) : run.load;
    const ev = evaluate(cfg, run.reps, load, run.minutes);
    const prev = lastLog(e.id);
    // se a rodada fechou enquanto a série estava aberta (6 h parada), começa outra
    let s = S.sessions.find(x => x.id === run.sid);
    if (!s || s.closedAt) s = startSession(run.wid).s;
    const log = { id: newId(), ts: Date.now(), day: dayKey(), wid: run.wid, sid: s.id, eid: e.id, name: e.name, tech: e.tech, cfg,
      load, reps: time ? [] : run.reps.slice(), total: ev.total, verdict: ev.verdict, failBlock: ev.failBlock, next: ev.next };
    if (sets) log.loads = run.loads.slice();
    if (time && run.km != null) log.km = run.km;
    addLog(log);
    touchWorkout(w);
    const allDone = isComplete(w, s);
    if (allDone) closeSession(s, w);
    saveCaderno();
    const wid = run.wid; run = null; clearRunDraft(); releaseWake();
    const sess = allDone ? sessionCompare(w, s) : null;
    let msg = 'Anotado no caderno.';
    fresh.done = e.id;
    if (allDone) {
      fresh.closed = true;
      msg = sess && sess.pct != null && dirOf(sess.pct) === 'up' ? `Treino fechado! ${fmtPct(sess.pct)} vs. o treino anterior.` : 'Treino fechado! Tudo anotado.';
      afterRender.push(() => FX.drawIn($('.compare--final'), { delay: 450 }));
      if (s.below) askWhy(s.id, 1300);
    } else if (prev) {
      const d = exDelta(log, prev), dir = dirOf(d.pct);
      msg = dir === 'up' ? `Anotado! ${fmtPct(d.pct)} vs. ${fmtDate(prev.ts)}.`
        : dir === 'down' ? `Anotado. ${fmtPct(d.pct)} vs. ${fmtDate(prev.ts)}, bola pra frente.`
        : `Anotado. Igual a ${fmtDate(prev.ts)}.`;
    }
    afterRender.push(() => { fresh.done = null; fresh.closed = false; });
    go({ name: 'workout', wid }); toast(msg);
  },
  discard(el) {
    if (!confirmTap(el, 'discard', 'toca de novo pra descartar')) return;
    erase($('.stage'), { dur: 700 }, leaveRun);
  },
  'run-exit'(el) {
    if (run && (run.reps.length || clockRun()) && run.phase !== 'ready') { if (!confirmTap(el, 'exit', 'sair sem anotar?')) return; }
    leaveRun();
  },
  mute() {
    const on = S.settings.sound || S.settings.voice;
    S.settings.sound = S.settings.voice = !on;
    if (on) { try { speechSynthesis.cancel(); } catch (e) {} } else audioUnlock();
    saveCaderno(); render();
  },
  'del-log'(el) {
    if (!confirmTap(el, 'del:' + el.dataset.l, 'apagar?')) return;
    const id = el.dataset.l, tr = document.getElementById(`log-${id}`);
    erase(tr, { parts: tr ? tr.children : null }, () => { deleteLog(id); tidySessions(); lsSave(); render(); toast('Registro apagado.'); });
  },
  calendar(el) { const d = el.dataset.d || dayKey(); go({ name: 'calendar', month: d.slice(0, 7), day: d }); },
  'cal-month'(el) {
    const mk = view.month || dayKey().slice(0, 7);
    const d = new Date(+mk.slice(0, 4), +mk.slice(5, 7) - 1 + (+el.dataset.d), 1, 12);
    view = { ...view, month: dayKey(d).slice(0, 7), day: null }; render();
  },
  'cal-day'(el) {
    view = { ...view, day: el.dataset.d };
    afterRender.push(() => { const d = $('.cal-detail'); if (d) d.scrollIntoView({ behavior: FX.reduceMotion() ? 'auto' : 'smooth', block: 'nearest' }); });
    render();
  },
  'reason-open'(el) { openReason(el.dataset.s); },
  'reason-pick'(el) {
    const k = el.dataset.k, on = !sheet.picks.includes(k);
    sheet.picks = on ? [...sheet.picks, k] : sheet.picks.filter(x => x !== k);
    el.setAttribute('aria-pressed', on);
  },
  'reason-save'() {
    const s = S.sessions.find(x => x.id === sheet.sid);
    const note = sheet.note.trim();
    if (s) { s.reasons = sheet.picks.slice(); s.reasonNote = note || null; saveCaderno(); }
    sheet = null; render();
    toast(s && (s.reasons.length || note) ? 'Motivo anotado. Bola pra frente.' : 'Sem motivo anotado.');
  },
  'sheet-close'() { sheet = null; renderSheet(); },
  'free-open'(el) { sheet = { kind: 'free', day: el.dataset.d, name: '', minutes: 60, note: '', gi: true, rolas: 0, golpes: [], extra: '' }; renderSheet(); sheet.shown = true; },
  'free-pick'(el) {
    sheet.name = el.dataset.v;
    if (isBJJ(sheet.name) && sheet.minutes === 60) sheet.minutes = 90;
    renderSheet();
    const i = $('#fName'); if (i) FX.penFollow(i, true);
  },
  'bjj-gi'(el) { sheet.gi = el.dataset.v === '1'; renderSheet(); },
  'bjj-rolas'(el) { sheet.rolas = clamp(sheet.rolas + (+el.dataset.d), 0, 40); renderSheet(); },
  'bjj-golpe'(el) {
    const g = el.dataset.v;
    sheet.golpes = sheet.golpes.includes(g) ? sheet.golpes.filter(x => x !== g) : [...sheet.golpes, g];
    renderSheet();
  },
  'free-min'(el) {
    sheet.minutes = clamp(sheet.minutes + (+el.dataset.d), 5, 600);
    const o = $('#fMin'); if (o) o.textContent = `${sheet.minutes} min`;
  },
  'free-save'() {
    const name = sheet.name.trim();
    if (!name) { toast('Escreve o que você fez.'); $('#fName')?.focus(); return; }
    const at = sheet.day === dayKey() ? Date.now() : dateOf(sheet.day).getTime();
    const golpes = [...new Set([...sheet.golpes, ...sheet.extra.split(',').map(x => x.trim()).filter(Boolean)])];
    const details = isBJJ(name) ? { tipo: 'bjj', kimono: !!sheet.gi, rolas: sheet.rolas, golpes } : null;
    S.sessions.push({ id: newId(), kind: 'free', wid: null, name, startedAt: at, closedAt: at, minutes: sheet.minutes, note: sheet.note.trim() || null, details });
    sheet = null; saveCaderno(); render(); toast('Anotado no calendário.');
  },
  'free-del'(el) {
    if (!confirmTap(el, 'free-del:' + el.dataset.s, 'apagar mesmo?')) return;
    const id = el.dataset.s;
    erase(el.closest('.sess'), { collapse: true }, () => { S.sessions = S.sessions.filter(x => x.id !== id); saveCaderno(); render(); toast('Atividade apagada.'); });
  }
};
const INP = {
  'w-name'(el) { const w = getW(view.wid); if (!w) return; w.name = el.value; touchWorkout(w); saveCaderno(); },
  'ex-name'(el) { const w = getW(view.wid), e = getE(view.wid, el.dataset.e); if (!e) return; e.name = el.value; touchWorkout(w); saveCaderno(); },
  load(el) { if (run) { run.load = parseNum(el.value); saveRunDraft(); } },
  'set-load'(el) { if (run && run.loads) { run.loads[+el.dataset.i] = parseNum(el.value); saveRunDraft(); } },
  km(el) { if (run) { run.km = parseNum(el.value); saveRunDraft(); } },
  'a-email'(el) { auth.email = el.value; },
  'a-phone'(el) { const v = phoneMask(el.value); if (v !== el.value) el.value = v; auth.phone = v; },
  'a-pass'(el) { auth.pass = el.value; },
  'reason-note'(el) { if (sheet) sheet.note = el.value; },
  'free-name'(el) { if (sheet) sheet.name = el.value; },
  'free-note'(el) { if (sheet) sheet.note = el.value; },
  'bjj-extra'(el) { if (sheet) sheet.extra = el.value; }
};
const CHG = {
  /* escreveu "jiu-jitsu" à mão: a ficha de jiu-jitsu aparece */
  'free-name'(el) { if (sheet && isBJJ(el.value) !== !!$('.bjj')) { sheet.name = el.value; renderSheet(); } },
  'ex-num'(el) {
    const w = getW(view.wid), e = getE(view.wid, el.dataset.e), k = el.dataset.k; if (!e) return;
    const v = parseInt(el.value, 10);
    e[k] = clamp(Number.isFinite(v) ? v : e[k], LIMITS[k][0], LIMITS[k][1]);
    // na faixa, o mínimo fica sempre abaixo do máximo
    if (techOf(e).mode === 'sets' && e.goal > 0 && (k === 'goal' || k === 'reps') && e.goal >= e.reps) {
      if (k === 'goal') e.goal = Math.max(1, e.reps - 1); else e.reps = Math.min(LIMITS.reps[1], e.goal + 1);
      const other = document.getElementById(`n-${k === 'goal' ? 'reps' : 'goal'}-${e.id}`);
      if (other) other.value = k === 'goal' ? e.reps : e.goal;
      if (k === 'goal' && e.goal >= e.reps) e.goal = e.reps - 1;
    }
    el.value = e[k]; touchWorkout(w); saveCaderno();
  },
  'set-load'() { renderKeepFocus(); },
  km() { renderKeepFocus(); }
};
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el) return;
  const fn = ACT[el.dataset.a]; if (fn) fn(el, ev);
});
document.addEventListener('submit', ev => {
  const f = ev.target.closest('[data-f]'); if (!f) return;
  ev.preventDefault();
  const fn = SUB[f.dataset.f]; if (fn) fn(f);
});
document.addEventListener('input', ev => {
  const el = ev.target.closest('[data-in]'); if (el && INP[el.dataset.in]) INP[el.dataset.in](el);
  if (ev.target.matches && ev.target.matches('.field-wrap .field')) FX.penFollow(ev.target, true);
});
document.addEventListener('change', ev => { const el = ev.target.closest('[data-in]'); if (el && CHG[el.dataset.in]) CHG[el.dataset.in](el); });
document.addEventListener('focusin', ev => { if (ev.target.matches && ev.target.matches('.field-wrap .field')) FX.penFollow(ev.target, false); });
document.addEventListener('keydown', ev => {
  if (ev.key === 'Enter' && ev.target.matches && ev.target.matches('input') && !ev.target.form) ev.target.blur();
  if (ev.key === 'Escape' && installOpen) { closeInstall(); return; }
  if (ev.key === 'Escape' && run && run.ask) { run.ask = null; render(); return; }
  if (ev.key === 'Escape' && sheet) { sheet = null; renderSheet(); }
});

/* =========================================================
   Início
   ========================================================= */
Cloud.onAuth(onAuthEvent);
if (!Cloud.ready) auth.err = Cloud.errMsg(null);
else if (Cloud.urlError) auth.err = /expired/.test(Cloud.urlError) ? 'Esse link expirou. Pede outro em "esqueci a senha".' : 'Esse link não funcionou. Tenta de novo.';
const stored = Cloud.ready ? Cloud.storedUser() : null;
if (recovering) { auth.mode = 'newpass'; view = { name: 'auth' }; render(); }
else if (stored) enter(stored);
else { view = { name: 'auth' }; render(); }

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}
})();
