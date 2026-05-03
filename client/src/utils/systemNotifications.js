const NOTIFICATION_PREF_KEY = "planerka:system-notifications";
const SERVICE_WORKER_PATH = "/notification-sw.js";

export function getSystemNotificationSupport() {
  const hasWindow = typeof window !== "undefined";
  const hasNotification = typeof Notification !== "undefined";
  const hasServiceWorker = hasWindow && "serviceWorker" in navigator;

  return {
    supported: hasWindow && hasNotification,
    serviceWorkerSupported: hasServiceWorker,
    permission: hasNotification ? Notification.permission : "unsupported",
    enabled: hasNotification && Notification.permission === "granted" && localStorage.getItem(NOTIFICATION_PREF_KEY) === "enabled",
  };
}

export function disableSystemNotifications() {
  localStorage.setItem(NOTIFICATION_PREF_KEY, "disabled");
}

async function getNotificationRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH);
  if (existing) return existing;
  return await navigator.serviceWorker.register(SERVICE_WORKER_PATH);
}

export async function requestSystemNotifications() {
  const support = getSystemNotificationSupport();
  if (!support.supported) return { ...support, enabled: false };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    localStorage.setItem(NOTIFICATION_PREF_KEY, "disabled");
    return { ...getSystemNotificationSupport(), permission, enabled: false };
  }

  localStorage.setItem(NOTIFICATION_PREF_KEY, "enabled");
  try {
    await getNotificationRegistration();
  } catch {
    // Notifications can still work in the foreground without a service worker.
  }

  return getSystemNotificationSupport();
}

export async function showSystemNotification({ title, body, url = "/", tag, silent = false } = {}) {
  const support = getSystemNotificationSupport();
  if (!support.enabled || !title) return false;

  const options = {
    body,
    tag,
    silent,
    icon: "/planorka-logo.png",
    badge: "/planorka-logo.png",
    data: { url },
  };

  try {
    const registration = await getNotificationRegistration();
    if (registration?.showNotification) {
      await registration.showNotification(title, options);
      return true;
    }
  } catch {
    // Fall through to foreground Notification where available.
  }

  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      if (url) window.location.assign(url);
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}
