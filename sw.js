// Service Worker（PWA付加機能）
// 方針：アプリ本体（HTML/JS/CSS/アイコン）は「ネット優先・失敗時キャッシュ」、
//       設定・データ（config/, data/）は「ネット優先」で常に最新を取得し、オフライン時のみキャッシュを返す。
//       背景地図タイル・外部URLはキャッシュしない（利用規約と容量のため）。
// 新バージョン公開時：CACHE の版を上げると古いキャッシュを削除する。
const CACHE = 'riben-gis-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './icon.svg', './manifest.webmanifest']))); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // 地図データ（config/, data/）はブラウザ通常のキャッシュに任せる（端末に大きなデータをため込まない）
  if (/\/(config|data)\//.test(url.pathname)) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || new Response('オフラインのため取得できません', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })))
  );
});
