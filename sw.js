// Service worker ขั้นต่ำ: ทำให้ "ติดตั้งได้" (installable) และเปิดซ้ำได้เร็วขึ้น
// ไม่ cache ข้อมูลจาก Google Sheet เพื่อให้ยอดหนี้อัปเดตสดเสมอ
const CACHE = "loan-tracker-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // ห้าม cache คำขอไปยัง Google Sheet — ต้องได้ข้อมูลสดทุกครั้ง
  if (url.hostname.includes("google.com")) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
