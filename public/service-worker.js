const CACHE_NAME = 'nguyenhongdiemphucvn-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/public/index.html',
  '/public/store.html',
  '/public/code-editor.html',
  '/public/create-access-key.html',
  '/public/create-readme.html',
  '/public/html-editor-preview.html',
  '/public/toggle-repository.html',
  '/public/zip-tool.html',
  '/public/guide-git.html',
  '/public/ci-cd-dashboard.html',
  '/public/git-advanced.html',
  '/public/admin.html',
  '/public/status.html',
  '/public/training.html',
  '/styles/styles.css',
  '/app.js',
  '/scripts/script.js',
  '/logo.webp',
  '/manifest.json',
];

// Cài đặt Service Worker và cache các tài nguyên
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting(); // Kích hoạt ngay khi cài đặt xong
});

// Kích hoạt Service Worker và xóa cache cũ
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Áp dụng service worker ngay cho các client
});

// Xử lý các yêu cầu và trả về từ cache hoặc mạng
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
