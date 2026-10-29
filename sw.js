/* Hardwood GM offline cache. Uses its own cache names and never touches other apps' caches. */
const PREFIX = 'hardwood-gm-';
const CACHE = PREFIX + 'v10';
const CORE = ['./', 'index.html', 'manifest.json', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Serve from cache right away, then refresh the cache in the background when online.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // The page itself: try the network first (bypassing the browser's 10-minute cache) so new versions load right away.
  if (e.request.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(async c => {
      try { const r = await fetch(e.request.url, { cache: 'no-cache' }); if (r && r.ok) { c.put('index.html', r.clone()); return r; } } catch (err) { /* offline */ }
      return (await c.match('index.html')) || (await c.match('./')) || Response.error();
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(e.request, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const r = await net;
    if (r) return r;
    if (e.request.mode === 'navigate') return (await c.match('index.html')) || Response.error();
    return Response.error();
  }));
});
