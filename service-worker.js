/* 오늘, 다이어리 — notification-only service worker
   오프라인 캐시를 만들지 않아 새 배포가 오래된 캐시에 갇히지 않게 합니다. */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith('today-diary-shell-'))
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBjzZON7YqYGJxqZZ-2W-7f64B1VoDj3uY",
  authDomain: "todaydiary-427d5.firebaseapp.com",
  databaseURL: "https://todaydiary-427d5-default-rtdb.firebaseio.com",
  projectId: "todaydiary-427d5",
  storageBucket: "todaydiary-427d5.firebasestorage.app",
  messagingSenderId: "492551492057",
  appId: "1:492551492057:web:d1341d3e7ecf1fc0a589c8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const data = payload?.data || {};
  const title = data.title || '오늘, 다이어리';
  const options = {
    body: data.body || '다이어리를 확인해볼까요?',
    icon: './icon-192.png',
    badge: './favicon-64.png',
    tag: data.tag || 'today-diary',
    renotify: false,
    data: {
      url: data.url || './'
    }
  };
  return self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const destination = new URL(event.notification?.data?.url || './', self.registration.scope).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for(const client of windows){
      if(new URL(client.url).origin === new URL(destination).origin){
        try{
          await client.focus();
          if('navigate' in client) await client.navigate(destination);
          return;
        }catch(_){}
      }
    }
    await self.clients.openWindow(destination);
  })());
});
