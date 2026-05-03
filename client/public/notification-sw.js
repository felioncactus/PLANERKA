/* global clients */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification?.data?.url || "/";
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const target = new URL(targetUrl, self.location.origin).href;

    for (const client of allClients) {
      if ("focus" in client) {
        if (client.url === target || client.url.startsWith(self.location.origin)) {
          await client.focus();
          if ("navigate" in client) await client.navigate(target);
          return;
        }
      }
    }

    if (clients.openWindow) await clients.openWindow(target);
  })());
});
