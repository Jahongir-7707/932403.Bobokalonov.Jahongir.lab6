'use strict';

const CACHE_NAME = 'rateweek-v1';
const APP_SHELL = [
  '/',
  '/about',
  '/index.html',
  '/about.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/api/rates/USD',
  '/api/rates/EUR',
  '/api/rates/CNY'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // API: сначала сеть, а если интернета нет — сохранённый ответ.
  // Query для маршрута rates не влияет на данные; используем URL без query.
  if (/^\/api\/rates\/(USD|EUR|CNY)$/i.test(url.pathname)) {
    const key = new Request(url.origin + url.pathname.toUpperCase().replace('/API/RATES/', '/api/rates/'));
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(key, copy)));
        }
        return response;
      }).catch(() => caches.match(key).then((cached) => cached || new Response(
        JSON.stringify({ error: 'Нет сети и кешированных данных' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      )))
    );
    return;
  }

  // Статические ресурсы и страницы: сначала кеш, затем сеть.
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => cached ||
      fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      })
    )
  );
});
