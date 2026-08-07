self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // A malformed payload should never prevent the user from receiving a reminder.
  }
  event.waitUntil(Promise.all([
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows =>
      windows.forEach(client => client.postMessage({ type: 'REMINDER_RECEIVED' }))
    ),
    self.registration.showNotification(data.title || 'Revision check-in', {
    body: data.body || 'What are you learning right now?',
    icon: '/focus-icon.svg',
    badge: '/focus-icon.svg',
    tag: data.tag || 'revision-check-in',
    renotify: true,
    requireInteraction: true,
    silent: false,
    vibrate: [250, 100, 250, 100, 400],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open goal' },
      { action: 'later', title: 'Remind me again' },
    ],
    }),
  ]));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'later') return;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const existing = windows.find(client => 'focus' in client);
    return existing ? existing.focus() : clients.openWindow(event.notification.data.url || '/');
  }));
});
