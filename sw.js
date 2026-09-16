/* پلتفرم دانشگاه سمنان — Service Worker برای اعلان‌ها */
"use strict";

self.addEventListener("install", function (e) {
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(self.clients.claim());
});

/* وقتی پیام push می‌رسد، آن را نشان بده.
   اگر صفحهٔ سایت باز و فوکوس باشد، خودِ صفحه نوتیف را می‌دهد؛
   پس اینجا ساکت می‌مانیم تا تکراری نزند. */
self.addEventListener("push", function (e) {
  if (!self.registration || !self.registration.showNotification) return;
  var data = {};
  try {
    data = e.data ? e.data.json() : {};
  } catch (_) {
    data = { title: "اعلان پلتفرم دانشگاه سمنان", body: "" };
  }
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      var focused = list.some(function (w) {
        return typeof w.focused === "boolean" && w.focused;
      });
      if (focused) return null;
      return self.registration.showNotification(data.title || "اعلان پلتفرم دانشگاه سمنان", {
        body: data.body || "",
        icon: data.icon || "assets/images/SVG/logo.svg",
        data: { url: data.url || "/" },
        tag: data.tag || "platform-notif"
      });
    })
  );
});

self.addEventListener("notificationclick", function (e) {
  var url = (e.notification.data && e.notification.data.url) || "/";
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if ("focus" in list[i]) return list[i].focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});