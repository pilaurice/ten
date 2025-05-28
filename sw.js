const CACHE_NAME = 'ultimate-tictactoe-v7';
const urlsToCache = [
  // Core files
  './',
  './manifest.json',
  
  // Stylesheets
  './css/styles.css',
  
  // JavaScript modules
  './js/utils/utils.js',
  './js/utils/analytics.js',
  './js/core/game.js',
  './js/core/ai.js',
  './js/ui/ui.js',
  './js/app.js',
  
  // Icons
  './assets/icons/favicon.ico',
  './assets/icons/favicon-16x16.png',
  './assets/icons/favicon-32x32.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/android-chrome-192x192.png',
  './assets/icons/android-chrome-512x512.png',
  
  // Images
  './assets/images/og-image.png',
  './assets/images/screenshot-narrow.png',
  './assets/images/screenshot-wide.png',
  
  // External resources
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell and assets');
        return cache.addAll(urlsToCache.map(url => {
          // Handle external URLs differently
          if (url.startsWith('http')) {
            return new Request(url, { mode: 'cors' });
          }
          return url;
        }));
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Error during service worker installation:', error);
        // Try to cache essential files only if full cache fails
        return caches.open(CACHE_NAME).then(cache => {
          const essentialFiles = [
            './', 
            './manifest.json',
            './css/styles.css',
            './js/app.js'
          ];
          return cache.addAll(essentialFiles);
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Skip Google Analytics requests (let them go to network)
  if (event.request.url.includes('google-analytics.com') || 
      event.request.url.includes('googletagmanager.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache the new response for future use
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.warn('Failed to cache response:', error);
              });

            return response;
          });
      })
      .catch(error => {
        console.error('Fetch failed:', error);
        
        // If both cache and network fail, return the main page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./').then(response => {
            return response || new Response('Offline - Please check your internet connection', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        }
        
        // For other requests, return a generic offline response
        return new Response('Offline content not available', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});

// Handle background sync for analytics (if supported)
self.addEventListener('sync', event => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(
      // Here you could implement offline analytics queue
      console.log('Background sync triggered for analytics')
    );
  }
});

// Handle push notifications (if you plan to add them later)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: './assets/icons/android-chrome-192x192.png',
      badge: './assets/icons/favicon-32x32.png',
      tag: 'ultimate-tictactoe-notification'
    };

    event.waitUntil(
      self.registration.showNotification('Ultimate Tic-Tac-Toe', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'content-sync') {
    event.waitUntil(
      // Could be used for updating game content or checking for updates
      console.log('Periodic background sync triggered')
    );
  }
});

// Message handling for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
