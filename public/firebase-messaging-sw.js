/* global firebase */

/*
 * NeuroNex unified service worker
 *
 * Handles both PWA/offline behavior and Firebase Cloud Messaging. It never
 * caches API responses, Supabase traffic, authenticated JSON or clinical data.
 */

const CACHE_NAME = 'neuronex-pwa-v3';
const PRECACHE_URLS = [
  '/offline.html',
  '/manifest.json',
  '/pwa-192.png',
  '/pwa-512.png',
  '/favicon-dark.png',
  '/favicon-light.png',
];

let messaging = null;

try {
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

  const params = new URL(self.location.href).searchParams;
  const config = {
    apiKey: params.get('apiKey'),
    authDomain: params.get('authDomain'),
    projectId: params.get('projectId'),
    storageBucket: params.get('storageBucket'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
  };

  const missingConfig = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingConfig.length === 0) {
    firebase.initializeApp(config);
    messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const notification = payload.notification || {};
      const data = payload.data || {};

      self.registration.showNotification(notification.title || 'NeuroNex', {
        body: notification.body || 'Você possui uma nova atualização.',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        tag: data.notificationId || 'neuronex-notification',
        data: { actionUrl: data.actionUrl || '/dashboard' },
      });
    });
  } else {
    console.info('[NeuroNex Worker] PWA ativa; Firebase aguardando configuração.', missingConfig);
  }
} catch (error) {
  // A falha do Firebase não pode impedir a instalação da PWA.
  console.warn('[NeuroNex Worker] Firebase Messaging indisponível; PWA continuará ativa.', error);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('neuronex-pwa-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/functions/v1/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkNavigation(request));
    return;
  }

  if (['script', 'style', 'font', 'image', 'manifest'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.actionUrl || '/dashboard', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return clients.openWindow ? clients.openWindow(target) : undefined;
    }),
  );
});

async function networkNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match('/offline.html')) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkRequest = fetch(request)
    .then(async (response) => {
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    void networkRequest;
    return cached;
  }

  return (await networkRequest) || Response.error();
}
