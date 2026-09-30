// Custom service worker code for push notifications
// This file is injected into the generated service worker by next-pwa

self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push notification received', event);

  let payload = {
    title: 'Amani',
    body: 'Nouvelle notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: {
      url: '/',
    },
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      console.error('[Service Worker] Failed to parse push payload:', error);
    }
  }

  const notificationPromise = self.registration.showNotification(
    payload.title,
    {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192.png',
      badge: payload.badge || '/icons/icon-192.png',
      tag: payload.data?.eventId || 'amani-notification',
      data: payload.data,
      requireInteraction: false,
      vibrate: [200, 100, 200],
    }
  );

  event.waitUntil(notificationPromise);
});

self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification clicked', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/evenements';

  const promiseChain = clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then(function (windowClients) {
      // Check if there is already a window open with this URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }

      // If not, check if there's any window we can navigate
      if (windowClients.length > 0 && 'navigate' in windowClients[0]) {
        return windowClients[0].navigate(urlToOpen).then((client) => client?.focus());
      }

      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

console.log('[Service Worker] Push notification handlers registered');
