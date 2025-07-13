// Updated cache name to ensure users get the new version
const CACHE_NAME = 'resolve-v3';

// NOTE: For PWA to be fully installable, you must create an 'icons' folder
// and add the icon images referenced in your manifest.json.
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
    // Example: '/icons/icon-192x192.png',
    // Example: '/icons/icon-512x512.png'
];

// Install the service worker and cache the app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(URLS_TO_CACHE);
            })
    );
});

// Serve cached content when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});


// Listen for the periodic sync event to show a notification
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'task-reminder') {
        event.waitUntil(showNotification());
    }
});

function showNotification() {
    const notificationOptions = {
        body: "Don't forget to check your pending tasks for today!",
        // IMPORTANT: Replace these with your actual icon paths
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        actions: [
            { action: 'open_app', title: 'Open Resolve' }
        ]
    };
    return self.registration.showNotification('Time to Resolve!', notificationOptions);
}

// Handle notification click to open the app
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If the app window is already open, focus it.
            const windowClient = clientList.find(client => client.url === '/' && 'focus' in client);
            if (windowClient) {
                return windowClient.focus();
            }
            // Otherwise, open a new window.
            return clients.openWindow('/');
        })
    );
});
