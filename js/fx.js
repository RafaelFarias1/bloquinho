/* Bloquinho: animações da caderneta.
   O lápis desenha, a borracha apaga, o carimbo bate, o post-it descola e a folha vira na lombada.
   Com "reduzir movimento" ligado no aparelho, nada anima. */
(() => {
'use strict';

const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand = k => { const x = Math.sin(k * 12.9898) * 43758.5453; return x - Math.floor(x); };
const reduceMotion = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/* ---------- desenhos ---------- */
const PENCIL = '<g transform="rotate(35)" stroke="#1b1c21" stroke-width="1.6" stroke-linejoin="round"><rect x="-5" y="-57" width="10" height="7" rx="2" fill="#ff9fb3"/><rect x="-5" y="-50" width="10" height="6" fill="#b9bdc7"/><rect x="-5" y="-44" width="10" height="32" fill="#ffcf3f"/><path d="M-1.6 -44V-12M1.6 -44V-12" stroke-width="1" opacity=".3"/><path d="M-5 -12H5L0 0Z" fill="#f1d3a6"/><path d="M-1.9 -4.6H1.9L0 0Z" fill="#2b2c33" stroke="none"/></g>';
/* borracha bicolor de escola: metade vermelha, metade azul */
const ERASER = '<g transform="rotate(-16)" stroke="#1b1c21" stroke-width="1.8" stroke-linejoin="round"><path d="M-22 -10H0V10H-22a4 4 0 0 1-4-4V-6a4 4 0 0 1 4-4Z" fill="#e5484d"/><path d="M0 -10H22a4 4 0 0 1 4 4V6a4 4 0 0 1-4 4H0Z" fill="#3b78d8"/><path d="M-21 -5.5H19" stroke="#fff" stroke-width="1.6" opacity=".45" stroke-linecap="round"/></g>';

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

/* carimbo de professora: estrela sorrindo e "MUITO BEM!" em volta */
let teacherN = 0;
function teacherStamp(extra = '') {
  const id = `teacher-arc-${++teacherN}`;
  return `<svg class="teacher${extra}" viewBox="0 0 120 120" aria-hidden="true"><defs><path id="${id}" d="M17 60a43 43 0 1 1 86 0a43 43 0 1 1-86 0"/></defs><g filter="url(#rough)">`
    + '<circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="4"/>'
    + '<circle cx="60" cy="60" r="34" fill="none" stroke="currentColor" stroke-width="2"/>'
    + `<text class="teacher-txt"><textPath href="#${id}" textLength="266" lengthAdjust="spacing">MUITO BEM! • MUITO BEM! •</textPath></text>`
    + '<path class="teacher-star" d="M60 34L66.5 51.1L84.7 52L70.5 63.4L75.3 81L60 71L44.7 81L49.5 63.4L35.3 52L53.5 51.1Z" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>'
    + '<circle cx="55" cy="57" r="2.1" class="teacher-face"/><circle cx="65" cy="57" r="2.1" class="teacher-face"/>'
    + '<path d="M54 63.5q6 5 12 0" fill="none" class="teacher-smile"/></g></svg>';
}

/* ---------- lápis: contorna um cartão novo e o conteúdo aparece escrito ---------- */
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
  const start = performance.now() + delay;
  const step = now => {
    const t = clamp((now - start) / dur, 0, 1), e = easeInOut(t);
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
const measure = document.createElement('canvas').getContext('2d');
function penFollow(input, scribble) {
  const pen = input.closest('.field-wrap')?.querySelector('.field-pen');
  if (!pen) return;
  const cs = getComputedStyle(input);
  measure.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const x = Math.min(measure.measureText(input.value || '').width + (parseFloat(cs.paddingLeft) || 0), input.clientWidth - 8);
  pen.style.setProperty('--x', `${Math.max(0, x)}px`);
  if (scribble && !reduceMotion()) replay(pen, 'scribble');
}

/* ---------- borracha: esfrega da esquerda pra direita e solta farelo ---------- */
function crumb(layer, x, y) {
  const c = document.createElement('i');
  c.className = 'fx-crumb';
  c.style.left = `${x - 16 + Math.random() * 12}px`;
  c.style.top = `${y + 4 + Math.random() * 6}px`;
  layer.append(c);
  const dx = (Math.random() - 0.5) * 34, dy = 16 + Math.random() * 30, rot = Math.random() * 220;
  const a = c.animate(
    [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 }],
    { duration: 500 + Math.random() * 350, easing: 'cubic-bezier(.3,.6,.6,1)', fill: 'forwards' }
  );
  a.onfinish = () => c.remove();
}
function collapseOut(el) {
  const cs = getComputedStyle(el);
  el.style.overflow = 'hidden';
  const a = el.animate(
    [{ height: `${el.offsetHeight}px`, marginTop: cs.marginTop, marginBottom: cs.marginBottom, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom },
     { height: '0px', marginTop: '0px', marginBottom: '0px', paddingTop: '0px', paddingBottom: '0px' }],
    { duration: 260, easing: 'ease-in', fill: 'forwards' }
  );
  return a.finished.catch(() => {});
}
function eraseOut(el, { dur = 640, collapse = false, parts = null } = {}) {
  return new Promise(resolve => {
    if (!el || !el.isConnected || reduceMotion()) { resolve(); return; }
    const r = el.getBoundingClientRect();
    const layer = document.createElement('div');
    layer.className = 'fx-layer';
    layer.style.cssText = `left:${r.left + scrollX}px;top:${r.top + scrollY}px;width:${r.width}px;height:${r.height}px`;
    layer.innerHTML = `<svg class="fx-eraser" viewBox="-30 -30 60 60" aria-hidden="true">${ERASER}</svg>`;
    document.body.append(layer);
    const er = layer.firstChild;
    const targets = parts ? [...parts] : [el];
    const offs = targets.map(t => t.getBoundingClientRect().left - r.left);
    const amp = Math.min(r.height * 0.36, 110);
    const start = performance.now();
    let lastCrumb = 0;
    const step = now => {
      const t = clamp((now - start) / dur, 0, 1);
      const wave = Math.sin(t * Math.PI * 9);
      const x = -18 + (r.width + 36) * easeInOut(t);
      const y = r.height / 2 + amp * wave;
      er.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) rotate(${(wave * 10).toFixed(1)}deg)`;
      targets.forEach((tg, i) => {
        const lx = x - offs[i];
        const m = `linear-gradient(90deg,transparent ${(lx - 12).toFixed(1)}px,#000 ${(lx + 20).toFixed(1)}px)`;
        tg.style.webkitMaskImage = m; tg.style.maskImage = m;
      });
      if (now - lastCrumb > 34 && t < 0.97) { lastCrumb = now; crumb(layer, x, y); }
      if (t < 1) { requestAnimationFrame(step); return; }
      targets.forEach(tg => { tg.style.visibility = 'hidden'; });
      er.classList.add('lift');
      const done = () => { setTimeout(() => layer.remove(), 650); resolve(); };
      if (collapse) collapseOut(el).then(done); else done();
    };
    requestAnimationFrame(step);
  });
}

/* ---------- post-it: descola ao tocar ---------- */
function peelOff(el) {
  if (!el || reduceMotion()) return;
  const r = el.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
  const g = el.cloneNode(true);
  g.removeAttribute('data-a'); g.removeAttribute('id'); g.setAttribute('aria-hidden', 'true'); g.tabIndex = -1;
  g.classList.remove('postit--in'); g.classList.add('fx-peel');
  Object.assign(g.style, {
    position: 'fixed', left: `${r.left + r.width / 2 - w / 2}px`, top: `${r.top + r.height / 2 - h / 2}px`,
    width: `${w}px`, height: `${h}px`, margin: '0', zIndex: '45', pointerEvents: 'none', transformOrigin: '50% 0'
  });
  document.body.append(g);
  const a = g.animate([
    { transform: 'perspective(900px) rotate(-1.1deg)', opacity: 1 },
    { transform: 'perspective(900px) rotateX(38deg) rotate(1deg)', opacity: 1, offset: 0.35 },
    { transform: 'perspective(900px) translate(70px,-240px) rotateX(55deg) rotate(18deg) scale(.85)', opacity: 0 }
  ], { duration: 560, easing: 'cubic-bezier(.45,0,.7,.4)', fill: 'forwards' });
  a.onfinish = () => g.remove();
}

/* ---------- folha virando ao trocar de tela ---------- */
function flipPage(apply, dir) {
  if (!document.startViewTransition || reduceMotion() || !dir || document.visibilityState === 'hidden') { apply(); return; }
  const root = document.documentElement;
  root.dataset.nav = dir;
  let applied = false;
  const once = () => { if (!applied) { applied = true; apply(); } };
  const done = () => { delete root.dataset.nav; once(); };
  try {
    const t = document.startViewTransition(once);
    // tocar rápido entre telas (ou a virada ser pulada) não pode deixar a tela parada: ela muda do mesmo jeito
    t.ready.catch(() => {});
    t.updateCallbackDone.catch(once);
    t.finished.then(done, done);
  } catch (e) { done(); }
}

/* ---------- carimbo torto: sorteado a partir do id ---------- */
function seeded(key) {
  let h = 2166136261;
  for (const c of String(key)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6D2B79F5; let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const between = (r, a, b) => a + (b - a) * r();
/* carimbo: cada coisa carimbada cai torta do seu jeito, sempre do mesmo jeito pra mesma coisa.
   k = quanto varia: 1 nos carimbos de data, menos nos pequenos */
function hand(key, k = 1) {
  const r = seeded(key);
  const rot = (r() < 0.5 ? -1 : 1) * between(r, 3, 11) * k;
  return `--hrot:${rot.toFixed(1)}deg;--hx:${(between(r, -2.5, 2.5) * k).toFixed(1)}px;--stamp-a:${between(r, 0.64, 0.94).toFixed(2)}`;
}
/* a caderneta não leva fita adesiva */
function tapes() { return ''; }

/* reinicia uma animação de CSS */
function replay(el, cls) {
  if (!el) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}

window.FX = { PENCIL, ERASER, tally, teacherStamp, hand, tapes, drawIn, writeIn, lineIn, penFollow, eraseOut, peelOff, flipPage, replay, reduceMotion };
})();
