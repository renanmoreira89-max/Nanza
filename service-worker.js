const CACHE_NAME = 'bellazo-v1';
const URLS_TO_CACHE = [
  '/BellaZo/',
  '/BellaZo/index.html',
  '/BellaZo/manifest.json',
  '/BellaZo/1000321047%20(1).png'
];

// Instala o service worker e faz cache dos arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(err => {
        console.log('Erro ao fazer cache dos arquivos:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativa o service worker e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro, fallback para cache
self.addEventListener('fetch', event => {
  // Ignora requisições para Firebase e APIs externas
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('gstatic')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Se a resposta é válida, faz cache
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Se falhar, tenta pegar do cache
        return caches.match(event.request).then(response => {
          return response || new Response('Offline - Arquivo não disponível no cache', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});
