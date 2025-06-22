const CACHE_NAME = 'resolve-v2';
// NOTE: For this to work, you'll need to create an 'icons' folder
// and add the icon images referenced in your manifest.json.
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json'
    // Example: '/icons/icon-192x192.png'
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
                return response || fetch(event.request);
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
        icon: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSGlrnDbumlaMEMk4T7aKG96B-cyqyW7dhleg&s', // Make sure this path is correct
        badge: 'https://thumb.ac-illust.com/81/81ca7b7db823f0f6054a04f8db8143e4_t.jpeg', // A smaller icon is usually used here
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
            const windowClient = clientList.find(client => client.url === '/' && 'focus' in client);
            return windowClient ? windowClient.focus() : clients.openWindow('/');
        })
    );
});