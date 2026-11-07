// Service worker : app hors-ligne. Changer VERSION à chaque mise à jour du site.
const VERSION = 'yd-v1';
const CORE = ['./', 'index.html', 'css/app.css', 'js/config.js', 'js/app.js', 'data/products.json', 'manifest.webmanifest', 'img/ui/logo.png', 'img/ui/icon-192.png', 'fonts/jakarta.woff'];
self.addEventListener('install', e => e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.hostname.endsWith('script.google.com') || u.hostname.endsWith('googleusercontent.com')) return;
  const cacheFirst = u.pathname.includes('/img/') || u.pathname.includes('/fonts/');
  const put = res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); } return res; };
  if (cacheFirst) e.respondWith(caches.match(r).then(m => m || fetch(r).then(put)));
  else e.respondWith(fetch(r).then(put).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
});
