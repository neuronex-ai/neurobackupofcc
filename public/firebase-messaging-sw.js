/* global firebase */
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

  if (missingConfig.length > 0) {
    throw new Error(`Missing Firebase config: ${missingConfig.join(', ')}`);
  }

  firebase.initializeApp(config);
  messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notification = payload.notification || {};
    const data = payload.data || {};
    self.registration.showNotification(notification.title || 'NeuroNex', {
      body: notification.body || 'Voce possui uma nova atualizacao.',
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: data.notificationId || 'neuronex-notification',
      data: { actionUrl: data.actionUrl || '/dashboard' },
    });
  });
} catch (error) {
  console.error('[NeuroNex Push] Firebase Messaging unavailable in service worker.', error);
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.actionUrl || '/dashboard', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    for (const client of windows) {
      if ('focus' in client) {
        client.navigate(target);
        return client.focus();
      }
    }
    return clients.openWindow ? clients.openWindow(target) : undefined;
  }));
});
