/// <reference lib="webworker" />

export type { };
declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
    console.log('SW: Push event received', event);
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options: NotificationOptions = {
            body: data.notification.body,
            icon: data.notification.icon || '/aurie-official-logo.png',
            badge: data.notification.badge || '/icons/icon-192x192.png',
            vibrate: [100, 50, 100],
            data: data.notification.data || {}
        };

        event.waitUntil(
            self.registration.showNotification(data.notification.title, options)
        );
    } catch (e) {
        console.error('Push event error:', e);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = (event.notification.data as any)?.url || '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return (client as WindowClient).focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
