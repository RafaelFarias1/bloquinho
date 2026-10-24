// Bloquinho: deixa o app abrir sem internet (academia com sinal ruim).
const VERSION = 'bloquinho-v23';
const SHELL = ['/', '/css/tokens.css?v=23', '/css/app.css?v=23', '/js/vendor/supabase.js?v=23', '/js/theme.js?v=23', '/js/config.js?v=23', '/js/cloud.js?v=23', '/js/fx.js?v=23', '/js/app.js?v=23', '/manifest.webmanifest', '/logo.svg', '/icons/icon-192.png', '/icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Página: tenta a rede primeiro (pega atualizações), cai pro cache sem internet.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put('/', copy)); } return res; })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Arquivos do app e fontes: responde do cache e atualiza em segundo plano.
  // A conta (Supabase) fica em outro endereço e nunca passa pelo cache.
  const cacheable = url.origin === self.location.origin || url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (!cacheable) return;
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(res => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return res; })
        .catch(() => hit);
      return hit || net;
    })
  );
});
