/* Bloquinho: conta e nuvem (Supabase), em window.Cloud.
   O caderno continua funcionando sem internet: tudo fica no aparelho e sobe
   pra conta quando dá. A "sombra" é a última versão que a nuvem confirmou;
   o que difere dela é o que ainda falta subir. Se dois aparelhos mexem na
   mesma coisa, vale o último que subiu. */
(() => {
'use strict';
const CFG = window.BLOQUINHO_CONFIG || {};
const AUTH_KEY = 'bloquinho:auth';
const TABLES = ['workouts', 'exercises', 'sessions', 'exercise_logs'];   // ordem de gravar (apagar é ao contrário)
const COLS = {
  workouts: 'id,name,position,example',
  exercises: 'id,workout_id,name,tech,blocks,reps,rest,goal,position',
  sessions: 'id,kind,workout_id,name,started_at,closed_at,minutes,note,below,below_reasons,below_note',
  exercise_logs: 'id,session_id,workout_id,exercise_id,done_at,day,name,tech,cfg,load,loads,reps,total,km,verdict,fail_block,next_load'
};

/* o link de "esqueci a senha" chega com isto no endereço */
const hash = new URLSearchParams(location.hash.slice(1));
const recovery = hash.get('type') === 'recovery';
const urlError = hash.get('error_code') || hash.get('error') || null;
if (urlError) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }

let sb = null;
try {
  if (CFG.url && CFG.key && window.supabase) sb = window.supabase.createClient(CFG.url, CFG.key, {
    auth: { storageKey: AUTH_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
} catch (e) { sb = null; }

/* =========================================================
   Mensagens de erro em português
   ========================================================= */
const offline = e => !navigator.onLine || /fetch|network|load failed|timeout|offline/i.test(String(e && (e.message || e)));
function errMsg(e) {
  const m = String((e && (e.message || e.error_description)) || ''), c = e && e.code;
  if (!sb) return 'Não deu pra carregar a conta. Confere a internet e abre o app de novo.';
  if (offline(e)) return 'Sem internet agora. Tenta de novo quando conectar.';
  if (c === 'invalid_credentials' || /invalid login credentials/i.test(m)) return 'E-mail ou senha não conferem.';
  if (c === 'user_already_exists' || c === 'email_exists' || /already (been )?registered/i.test(m)) return 'Esse e-mail já tem conta. Tenta entrar.';
  if (c === 'weak_password' || /password should be/i.test(m)) return 'A senha precisa de pelo menos 6 caracteres.';
  if (c === 'email_not_confirmed' || /email not confirmed/i.test(m)) return 'Falta confirmar o e-mail. Olha a sua caixa de entrada.';
  if (c === 'email_address_invalid' || /invalid.*email|validate email/i.test(m)) return 'Esse e-mail não parece certo.';
  if (c === 'same_password') return 'A senha nova tem que ser diferente da antiga.';
  if (/rate limit|too many/i.test(c + ' ' + m)) return 'Muitas tentativas seguidas. Espera um minutinho.';
  if (/session missing|session_not_found/i.test(c + ' ' + m)) return 'O link expirou. Pede outro em "esqueci a senha".';
  return 'Não deu certo agora. Tenta de novo.';
}

/* =========================================================
   Conta
   ========================================================= */
const need = () => { if (!sb) throw new Error('offline'); };
async function signUp(email, password, phone) {
  need();
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: { phone }, emailRedirectTo: location.origin + '/' } });
  if (error) throw error;
  // com confirmação de e-mail ligada, e-mail repetido volta como usuário sem identidade
  if (data.user && Array.isArray(data.user.identities) && !data.user.identities.length) throw { code: 'user_already_exists' };
  return { user: data.user, session: data.session };
}
async function signIn(email, password) {
  need();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}
async function signOut() {
  try { sb && await sb.auth.signOut({ scope: 'local' }); } catch (e) {}
  try { localStorage.removeItem(AUTH_KEY); } catch (e) {}
}
async function resetPassword(email) {
  need();
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/' });
  if (error) throw error;
}
async function updatePassword(password) {
  need();
  const { data, error } = await sb.auth.updateUser({ password });
  if (error) throw error;
  return data.user;
}
/* o Supabase pede pra não chamar ele de dentro do aviso, então o aviso sai depois */
function onAuth(cb) { if (sb) sb.auth.onAuthStateChange((ev, session) => setTimeout(() => cb(ev, session), 0)); }
/* quem entrou por último neste aparelho, sem precisar de internet */
function storedUser() {
  try {
    const d = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
    const u = d && (d.user || JSON.parse(localStorage.getItem(AUTH_KEY + '-user') || '{}').user);
    return u && u.id ? { id: u.id, email: u.email || '' } : null;
  } catch (e) { return null; }
}

/* =========================================================
   Linhas do banco <-> caderno
   ========================================================= */
const iso = t => t == null ? null : new Date(t).toISOString();
const ms = s => s == null ? null : Date.parse(s);
const num = v => v == null || v === '' || !Number.isFinite(+v) ? null : +v;
const int = (v, d = 0) => Number.isFinite(+v) ? Math.round(+v) : d;
const dayOf = t => new Date(t).toLocaleDateString('sv-SE');
/* JSON com as chaves em ordem: o jsonb do Postgres não guarda a ordem */
const stable = v => JSON.stringify(v === undefined ? null : v, (k, x) => x && typeof x === 'object' && !Array.isArray(x)
  ? Object.keys(x).sort().reduce((o, key) => { o[key] = x[key]; return o; }, {}) : x);

const ROW = {
  workouts: w => ({ id: w.id, name: w.name || '', position: int(w.position), example: !!w.example }),
  exercises: e => ({ id: e.id, workout_id: e.workout_id, name: e.name || '', tech: e.tech, blocks: int(e.blocks, 1), reps: int(e.reps), rest: int(e.rest), goal: int(e.goal), position: int(e.position) }),
  sessions: s => ({ id: s.id, kind: s.kind === 'free' ? 'free' : 'workout', workout_id: s.wid ?? null, name: s.name ?? null,
    started_at: iso(s.startedAt), closed_at: iso(s.closedAt), minutes: num(s.minutes), note: s.note || null,
    below: !!s.below, below_reasons: Array.isArray(s.reasons) ? [...s.reasons] : [],
    // atividade avulsa não usa o motivo da queda: ali vai a ficha dela (jiu-jitsu: kimono, rolas, golpes) em JSON
    below_note: s.kind === 'free' ? (s.details ? stable(s.details) : null) : s.reasonNote || null }),
  exercise_logs: l => ({ id: l.id, session_id: l.sid, workout_id: l.wid ?? null, exercise_id: l.eid ?? null, done_at: iso(l.ts),
    day: l.day || dayOf(l.ts), name: l.name ?? null, tech: l.tech, cfg: l.cfg || {}, load: num(l.load),
    loads: Array.isArray(l.loads) ? l.loads.map(num) : null, reps: (l.reps || []).map(r => int(r)), total: num(l.total) ?? 0,
    km: num(l.km), verdict: l.verdict || null, fail_block: l.failBlock ?? null, next_load: num(l.next) })
};
const details = r => { if (r.kind !== 'free' || !r.below_note || r.below_note[0] !== '{') return null; try { return JSON.parse(r.below_note); } catch (e) { return null; } };
const sessionApp = r => ({ id: r.id, kind: r.kind, wid: r.workout_id, name: r.name, startedAt: ms(r.started_at), closedAt: ms(r.closed_at),
  minutes: num(r.minutes), note: r.note, below: !!r.below, reasons: r.below_reasons || [], reasonNote: r.kind === 'free' ? null : r.below_note, details: details(r) });
const logApp = r => ({ id: r.id, sid: r.session_id, wid: r.workout_id, eid: r.exercise_id, ts: ms(r.done_at), day: r.day, name: r.name,
  tech: r.tech, cfg: r.cfg || {}, load: num(r.load), loads: Array.isArray(r.loads) ? r.loads.map(num) : null, reps: r.reps || [],
  total: num(r.total) ?? 0, km: num(r.km), verdict: r.verdict, failBlock: r.fail_block, next: num(r.next_load) });
/* o que vem do banco passa pelo mesmo molde do que sai do aparelho, pra comparar igual com igual */
const NORM = {
  workouts: ROW.workouts,
  exercises: ROW.exercises,
  sessions: r => ROW.sessions(sessionApp(r)),
  exercise_logs: r => ROW.exercise_logs(logApp(r))
};

function toRows(st) {
  const R = { workouts: new Map(), exercises: new Map(), sessions: new Map(), exercise_logs: new Map() };
  st.workouts.forEach((w, i) => {
    R.workouts.set(w.id, ROW.workouts({ ...w, position: i }));
    w.exercises.forEach((e, j) => R.exercises.set(e.id, ROW.exercises({ ...e, workout_id: w.id, position: j })));
  });
  st.sessions.forEach(s => R.sessions.set(s.id, ROW.sessions(s)));
  st.logs.forEach(l => R.exercise_logs.set(l.id, ROW.exercise_logs(l)));
  return R;
}
function applyRows(st, R) {
  const byW = new Map();
  for (const e of R.exercises.values()) { if (!byW.has(e.workout_id)) byW.set(e.workout_id, []); byW.get(e.workout_id).push(e); }
  st.workouts = [...R.workouts.values()].sort((a, b) => a.position - b.position).map(w => ({
    id: w.id, name: w.name, example: w.example,
    exercises: (byW.get(w.id) || []).sort((a, b) => a.position - b.position)
      .map(e => ({ id: e.id, name: e.name, tech: e.tech, blocks: e.blocks, reps: e.reps, rest: e.rest, goal: e.goal }))
  }));
  st.sessions = [...R.sessions.values()].map(r => sessionApp({ ...r }));
  const sids = new Set(st.sessions.map(s => s.id));
  st.logs = [...R.exercise_logs.values()].filter(l => sids.has(l.session_id)).map(logApp).sort((a, b) => a.ts - b.ts);
}

/* =========================================================
   Sincronização
   ========================================================= */
let me = null;     // { uid, sh (sombra), getState, onStatus, timer, retry, lastPull }
let chain = Promise.resolve();
const lock = fn => { const p = chain.then(fn, fn); chain = p.catch(() => {}); return p; };   // puxar e subir nunca rodam juntos
const shKey = uid => `bloquinho:u:${uid}:nuvem`;
const blankShadow = () => ({ v: 1, tenant: null, rows: { workouts: {}, exercises: {}, sessions: {}, exercise_logs: {} }, settings: null });
function loadShadow(uid) {
  try { const d = JSON.parse(localStorage.getItem(shKey(uid)) || 'null'); if (d && d.v === 1) return d; } catch (e) {}
  return blankShadow();
}
function saveShadow() { try { me && localStorage.setItem(shKey(me.uid), JSON.stringify(me.sh)); } catch (e) {} }
function status(state, extra = {}) { if (me && me.onStatus) me.onStatus({ state, pending: 0, ...extra }); }

function begin(uid, getState, onStatus) {
  end();
  me = { uid, sh: loadShadow(uid), getState, onStatus, timer: null, retry: null, lastPull: 0 };
}
function end() {
  if (!me) return;
  clearTimeout(me.timer); clearTimeout(me.retry);
  me = null;
}
function forget(uid) { try { localStorage.removeItem(shKey(uid)); } catch (e) {} }

function pendingCount() {
  if (!me) return 0;
  const st = me.getState(), R = toRows(st), H = me.sh.rows;
  let n = 0;
  for (const t of TABLES) {
    for (const r of R[t].values()) if (H[t][r.id] !== stable(r)) n++;
    for (const id in H[t]) if (!R[t].has(id)) n++;
  }
  if (stable(st.settings) !== me.sh.settings) n++;
  return n;
}

async function fetchAll(t) {
  const out = [], N = 1000;
  for (let from = 0; ; from += N) {
    const { data, error } = await sb.from(t).select(COLS[t]).eq('tenant_id', me.sh.tenant).order('id').range(from, from + N - 1);
    if (error) throw error;
    out.push(...data);
    if (data.length < N) return out;
  }
}

async function pullNow() {
  const uid = me.uid;
  const { data: prof, error } = await sb.from('profiles').select('tenant_id,settings').eq('id', uid).single();
  if (error) throw error;
  if (!me || me.uid !== uid) return { ok: false };
  me.sh.tenant = prof.tenant_id;
  const got = {};
  for (const t of TABLES) got[t] = await fetchAll(t);
  if (!me || me.uid !== uid) return { ok: false };

  // daqui pra baixo não tem await: o caderno não muda no meio da junção
  const st = me.getState(), L = toRows(st), H = me.sh.rows, R = {}, newH = {};
  let empty = true, changed = false;
  for (const t of TABLES) {
    const Sv = new Map(got[t].map(r => { const n = NORM[t](r); return [n.id, n]; }));
    if (Sv.size) empty = false;
    const h = H[t] || {}, out = new Map();
    for (const [id, sr] of Sv) {
      const lr = L[t].get(id);
      if (!lr && h[id] !== undefined) continue;                     // apagado aqui, falta apagar lá
      out.set(id, lr && stable(lr) !== h[id] ? lr : sr);            // mexido aqui ganha
    }
    for (const [id, lr] of L[t]) {
      if (Sv.has(id)) continue;
      if (h[id] !== undefined && stable(lr) === h[id]) continue;    // apagado em outro aparelho
      out.set(id, lr);                                              // novo aqui
    }
    R[t] = out;
    newH[t] = Object.fromEntries([...Sv].map(([id, r]) => [id, stable(r)]));
    if (out.size !== L[t].size || [...out].some(([id, r]) => { const l = L[t].get(id); return l !== r && stable(l) !== stable(r); })) changed = true;
  }
  for (const [id, e] of R.exercises) if (!R.workouts.has(e.workout_id)) R.exercises.delete(id);

  const server = prof.settings || {}, hasServer = Object.keys(server).length > 0;
  const localSet = me.sh.settings == null ? !hasServer : stable(st.settings) !== me.sh.settings;
  if (!localSet && stable({ ...st.settings, ...server }) !== stable(st.settings)) { st.settings = { ...st.settings, ...server }; changed = true; }

  applyRows(st, R);
  me.sh.rows = newH;
  me.sh.settings = hasServer ? stable(server) : null;
  me.lastPull = Date.now();
  saveShadow();
  return { ok: true, changed, empty };
}

async function pushNow() {
  if (!me.sh.tenant) {
    const { data, error } = await sb.from('profiles').select('tenant_id').eq('id', me.uid).single();
    if (error) throw error;
    me.sh.tenant = data.tenant_id; saveShadow();
  }
  const st = me.getState(), R = toRows(st), H = me.sh.rows, tenant = me.sh.tenant;
  for (const t of TABLES) {
    const up = [...R[t].values()].filter(r => H[t][r.id] !== stable(r));
    for (let i = 0; i < up.length; i += 400) {
      const part = up.slice(i, i + 400);
      const { error } = await sb.from(t).upsert(part.map(r => ({ tenant_id: tenant, ...r })), { onConflict: 'tenant_id,id' });
      if (error) throw error;
      part.forEach(r => { H[t][r.id] = stable(r); });
      saveShadow();
    }
  }
  for (const t of [...TABLES].reverse()) {
    const gone = Object.keys(H[t]).filter(id => !R[t].has(id));
    for (let i = 0; i < gone.length; i += 200) {
      const part = gone.slice(i, i + 200);
      const { error } = await sb.from(t).delete().eq('tenant_id', tenant).in('id', part);
      if (error) throw error;
      part.forEach(id => { delete H[t][id]; });
      saveShadow();
    }
  }
  const ss = stable(st.settings);
  if (me.sh.settings !== ss) {
    const { error } = await sb.from('profiles').update({ settings: st.settings }).eq('id', me.uid);
    if (error) throw error;
    me.sh.settings = ss; saveShadow();
  }
}

/* puxa (opcional) e sobe; sem internet, tenta de novo daqui a pouco */
function run(pull) {
  if (!sb || !me) return Promise.resolve({ ok: false });
  const who = me;
  return lock(async () => {
    if (me !== who) return { ok: false };
    clearTimeout(me.retry);
    status('saving');
    try {
      const r = pull ? await pullNow() : { ok: true };
      if (me !== who) return { ok: false };
      await pushNow();
      if (me !== who) return { ok: false };
      status('ok');
      return r;
    } catch (e) {
      if (me !== who) return { ok: false };
      status(offline(e) ? 'offline' : 'error', { pending: pendingCount(), error: e });
      me.retry = setTimeout(() => queue(0), offline(e) ? 30e3 : 60e3);
      return { ok: false, error: e };
    }
  });
}
const pull = () => run(true);
function queue(delay = 900) {
  if (!me) return;
  clearTimeout(me.timer);
  me.timer = setTimeout(() => run(false), delay);
}
function flush(wait = 3000) {
  if (!me) return Promise.resolve();
  clearTimeout(me.timer);
  return Promise.race([run(false), new Promise(r => setTimeout(r, wait))]);
}
const sinceLastPull = () => me ? Date.now() - me.lastPull : Infinity;
window.addEventListener('online', () => queue(0));

window.Cloud = {
  ready: !!sb, recovery, urlError, errMsg,
  signUp, signIn, signOut, resetPassword, updatePassword, onAuth, storedUser,
  begin, end, forget, pull, queue, flush, pendingCount, sinceLastPull
};
})();
