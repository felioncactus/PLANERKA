import { API_BASE_URL } from "./http";

function normalizeBase(value) {
  return String(value || "").replace(/\/+$/, "");
}

function apiOrigin() {
  const base = normalizeBase(API_BASE_URL);
  if (!/^https?:\/\//i.test(base)) return "";
  return base.replace(/\/api(?:\/.*)?$/i, "");
}

const uploadsBase = normalizeBase(import.meta.env.VITE_UPLOADS_BASE_URL || apiOrigin());

export function assetUrl(value) {
  const url = String(value || "");
  if (!url || /^(?:data:|blob:|https?:\/\/)/i.test(url)) return url;
  if (!url.startsWith("/uploads/")) return url;
  return `${uploadsBase}${url}`;
}
