const CACHE_NAME = `v1`;

// キャッシュするファイルをセットする
const urlsToCache = [
  '/tapp/',
  '/tapp/index.html'
];

// インストール
self.addEventListener('install', function (e) {
  console.info('install', e);
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 画像をキャッシュ対象に追加
      cache.addAll(urlsToCache)
    })
  )
});

// フェッチ
self.addEventListener('fetch', function (e) {
  console.info('fetch', e);
  e.respondWith(
    caches.match(e.request)
      .then(function (response) {
        // キャッシュがあったのでそのレスポンスを返す
        if (response) {
          console.info(`Using cache: ${e.request.url}`);
          return response;
        }
        return fetch(e.request);
      }
      )
  );
});