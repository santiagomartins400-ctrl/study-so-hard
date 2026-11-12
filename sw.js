/* Service worker do Study So Hard.
 * Páginas e /data/: network-first (com recurso à cache se estiver offline).
 * Restantes recursos: cache-first.
 * Ao alterar a aplicação, sobe o nome da cache (ver scripts/bump-version.mjs). */
const CACHE = 'app-v1-3';
const PRECACHE = ['./', './index.html', './app.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function ePagina(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function eDados(url) {
  return url.pathname.includes('/data/');
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const resposta = await fetch(request);
    if (resposta.ok) cache.put(request, resposta.clone());
    return resposta;
  } catch (e) {
    const guardada = await cache.match(request);
    if (guardada) return guardada;
    throw e;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const guardada = await cache.match(request);
  if (guardada) return guardada;
  const resposta = await fetch(request);
  if (resposta.ok) cache.put(request, resposta.clone());
  return resposta;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (ePagina(request) || eDados(url)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
