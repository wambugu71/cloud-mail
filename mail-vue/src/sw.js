// Cloud Mail Service Worker
// Handles Web Push notifications when the app is closed or backgrounded.

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (_) {
    data = { title: 'New Email', body: event.data.text() };
  }

  const title = data.title || 'New Email';
  const options = {
    body: data.body || '(no subject)',
    icon: '/mail-pwa.png',
    badge: '/mail-pwa.png',
    tag: data.tag || 'cloud-mail',       // groups notifications per account
    renotify: true,
    data: { emailId: data.emailId },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // If app is already open, focus it
      for (const client of list) {
        if (client.url && 'focus' in client) return client.focus();
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
