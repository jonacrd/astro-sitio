// Service Worker para notificaciones push
// Este archivo maneja las notificaciones en segundo plano

const CACHE_NAME = 'town-app-v1';
const urlsToCache = [
  '/',
  '/src/styles/global.css',
  '/favicon.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  console.log('📱 Notificación push recibida:', event);
  
  let notificationData = {
    title: 'Town App',
    body: 'Tienes una nueva notificación',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'town-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Abrir App',
        icon: '/favicon.svg'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/favicon.svg'
      }
    ]
  };

  // Si hay datos en la notificación, usarlos
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        icon: data.icon || '/favicon.svg',
        badge: data.badge || '/favicon.svg'
      };
    } catch (e) {
      console.error('❌ Error parseando datos de notificación:', e);
    }
  }

  console.log('📤 Mostrando notificación:', notificationData);

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificación clickeada:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Abrir la aplicación
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Manejo de notificaciones cerradas
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificación cerrada:', event);
});

// Manejo de errores
self.addEventListener('error', (event) => {
  console.error('❌ Error en Service Worker:', event);
});

// Manejo de mensajes del cliente
self.addEventListener('message', (event) => {
  console.log('💬 Mensaje recibido en Service Worker:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Manejar notificaciones de prueba
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    console.log('📱 Mostrando notificación de prueba:', event.data.notification);
    
    event.waitUntil(
      self.registration.showNotification(
        event.data.notification.title,
        event.data.notification
      )
    );
  }
});

// Función para enviar notificación de prueba
self.addEventListener('sync', (event) => {
  console.log('🔄 Sync event:', event);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aquí puedes sincronizar datos en segundo plano
      console.log('🔄 Sincronizando en segundo plano...')
    );
  }
});

console.log('🚀 Service Worker cargado y listo para notificaciones push');
