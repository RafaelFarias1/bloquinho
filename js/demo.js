/* Bloquinho: modo demonstração. Abre com ?demo na URL.
   Troca a nuvem por um dublê que não fala com o Supabase e enche o caderno
   com treinos de exemplo, pra ver todas as telas sem entrar numa conta.
   ?demo=novo começa de novo com o caderno de exemplo. */
(() => {
'use strict';
const q = new URLSearchParams(location.search);
if (!q.has('demo')) return;

const USER = { id: 'demo', email: 'demo@bloquinho.app' };
const KEY = `bloquinho:u:${USER.id}`;
const DAY = 864e5;

window.Cloud = {
  ready: true, recovery: false, urlError: null,
  errMsg: () => 'Modo demonstração: nada sai do aparelho.',
  signUp: async () => ({ user: USER, session: {} }),
  signIn: async () => USER,
  signOut: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => USER,
  onAuth: () => {},
  storedUser: () => USER,
  begin: () => {}, end: () => {}, forget: () => {},
  pull: async () => ({ ok: true, changed: false, empty: false }),
  queue: () => {}, flush: async () => ({ ok: true }),
  pendingCount: () => 0, sinceLastPull: () => 0
};

try { localStorage.setItem('bloquinho:install-seen', '1'); } catch (e) {}
if (q.get('demo') === 'novo') { try { localStorage.removeItem(KEY); localStorage.removeItem('bloquinho:run'); } catch (e) {} }
try { if (localStorage.getItem(KEY)) return; } catch (e) { return; }

let n = 0;
const id = p => `${p}${++n}`;
const ex = (name, tech, blocks, reps, rest, goal) => ({ id: id('e'), name, tech, blocks, reps, rest, goal });
const workouts = [
  { id: 'wA', name: 'Treino A · Peito e ombro', exercises: [
    ex('Supino inclinado com halteres', 'normal', 3, 10, 90, 0),
    ex('Crucifixo na máquina', 'muscle', 6, 4, 10, 20),
    ex('Desenvolvimento com halteres', 'normal', 3, 10, 90, 0),
    ex('Elevação lateral', 'restpause', 3, 0, 15, 20),
    ex('Esteira', 'time', 1, 0, 0, 20)
  ] },
  { id: 'wB', name: 'Treino B · Costas', exercises: [
    ex('Puxada frontal', 'normal', 3, 10, 90, 0),
    ex('Remada curvada', 'cluster', 5, 3, 20, 20),
    ex('Remada baixa', 'normal', 3, 12, 75, 8),
    ex('Rosca direta', 'muscle', 6, 4, 10, 20)
  ] },
  { id: 'wC', name: 'Treino C · Pernas', exercises: [
    ex('Agachamento livre', 'normal', 4, 8, 120, 0),
    ex('Leg press', 'cluster', 5, 3, 20, 20),
    ex('Cadeira extensora', 'muscle', 6, 4, 10, 20),
    ex('Panturrilha em pé', 'restpause', 3, 0, 15, 20)
  ] }
];

const MODE = { normal: 'sets', muscle: 'fixed', cluster: 'fixed', restpause: 'count', time: 'time' };
const LAST = { muscle: true };
const BASE = { e1: 22, e2: 45, e3: 16, e4: 8, e6: 55, e7: 60, e8: 50, e9: 14, e10: 60, e11: 160, e12: 40, e13: 70 };
const day = d => d.toLocaleDateString('sv-SE');
const logs = [], sessions = [];

function logFor(w, e, s, ts, round, mood) {
  const mode = MODE[e.tech];
  const cfg = { tech: e.tech, mode, lastMax: !!LAST[e.tech], blocks: e.blocks, reps: e.reps || 4, rest: e.rest, goal: e.goal, repsMin: mode === 'sets' && e.goal > 0 ? e.goal : null };
  const l = { id: id('l'), ts, day: day(new Date(ts)), wid: w.id, sid: s.id, eid: e.id, name: e.name, tech: e.tech, cfg, load: null, reps: [], total: 0, verdict: 'keep', failBlock: null, next: null };
  if (mode === 'time') {
    l.total = mood < 0 ? 14 : 20 + round * 2; l.verdict = l.total >= e.goal ? 'up' : 'keep'; l.km = +(l.total * 0.11).toFixed(1);
    return l;
  }
  const base = BASE[e.id] || 20;
  const load = Math.round((base + round * (base >= 40 ? 2.5 : 1)) * 2) / 2;
  l.load = load;
  if (mode === 'sets') {
    const r = mood < 0 ? [e.reps, e.reps - 2, e.reps - 4] : round % 2 ? [e.reps, e.reps, e.reps] : [e.reps, e.reps, e.reps - 1];
    while (r.length < e.blocks) r.push(e.reps - (mood < 0 ? 3 : 0));
    l.reps = r.slice(0, e.blocks); l.loads = l.reps.map(() => load);
    const fi = l.reps.findIndex(x => x < e.reps);
    l.failBlock = fi === -1 ? null : fi + 1;
    l.verdict = fi === -1 ? 'up' : mood < 0 ? 'down' : 'keep';
    l.next = l.verdict === 'up' ? load + (load >= 10 ? 1 : 0.5) * (load >= 20 ? 2 : 1) : l.verdict === 'down' ? Math.round(load * 0.9) : load;
  } else if (mode === 'fixed') {
    const fail = mood < 0 ? 2 : round % 2 ? null : e.blocks - 1;
    l.reps = Array.from({ length: e.blocks }, (_, i) => fail && i + 1 >= fail ? Math.max(1, e.reps - 1 - (i + 1 - fail)) : e.reps);
    if (LAST[e.tech] && !fail) l.reps[e.blocks - 1] = e.reps * 2 + 1;
    l.failBlock = fail; l.verdict = fail ? (mood < 0 ? 'down' : 'keep') : 'up';
    l.next = l.verdict === 'up' ? load + 2 : l.verdict === 'down' ? Math.round(load * 0.9) : load;
  } else {
    l.reps = mood < 0 ? [7, 3, 2] : [9 + round % 2, 6, 5];
    l.verdict = l.reps.reduce((a, b) => a + b, 0) >= e.goal ? 'up' : 'keep';
    l.next = l.verdict === 'up' ? load + 1 : load;
  }
  l.total = l.reps.reduce((a, b) => a + b, 0);
  return l;
}

/* quatro semanas de A, B, C com folga, um treino fraco e um jiu-jitsu */
const today = new Date(); today.setHours(19, 10, 0, 0);
const plan = [];
for (let back = 26; back >= 1; back--) {
  const d = new Date(today.getTime() - back * DAY), wd = d.getDay();
  if (wd === 0) continue;
  if (wd === 6) { if (back % 2) plan.push({ d, free: 'Jiu-jitsu' }); continue; }
  if (wd === 3 && back > 14) continue;
  plan.push({ d, w: workouts[plan.filter(p => p.w).length % 3] });
}
const rounds = { wA: 0, wB: 0, wC: 0 };
plan.forEach((p, i) => {
  const t0 = p.d.getTime();
  if (p.free) {
    const k = sessions.filter(x => x.kind === 'free').length;
    const golpes = [['Triângulo', 'Raspagem'], ['Armlock'], ['Passagem de guarda', 'Mata-leão'], []][k % 4];
    const note = ['A passagem toreando: controla as calças, gira o quadril e cola no lado.', 'Ajuste do triângulo: puxa a cabeça e angula antes de fechar.', null, 'Defesa da montada: ponte e cotovelo no joelho.'][k % 4];
    sessions.push({ id: id('s'), kind: 'free', wid: null, name: p.free, startedAt: t0, closedAt: t0, minutes: 90, note, details: { tipo: 'bjj', kimono: k % 3 !== 2, rolas: 4 + (k * 3) % 5, golpes } });
    return;
  }
  const w = p.w, round = rounds[w.id]++;
  const mood = i === plan.length - 5 ? -1 : 0;
  const s = { id: id('s'), wid: w.id, name: w.name, startedAt: t0, closedAt: null };
  w.exercises.forEach((e, k) => logs.push(logFor(w, e, s, t0 + (k + 1) * 9 * 6e4, round, mood)));
  s.closedAt = t0 + (w.exercises.length + 1) * 9 * 6e4;
  s.below = mood < 0;
  if (mood < 0) { s.reasons = ['sono', 'cansaco']; s.reasonNote = 'plantão no trabalho'; }
  sessions.push(s);
});

try {
  localStorage.setItem(KEY, JSON.stringify({ workouts, logs, sessions, settings: { sound: false, voice: false, hideHow: false, seeded: true } }));
} catch (e) {}
})();
