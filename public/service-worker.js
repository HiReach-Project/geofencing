self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('push', event => {
    const notification = event.data.json()
    const t = self.registration.showNotification(notification.title, { body: notification.body });
    event.waitUntil(t);
});