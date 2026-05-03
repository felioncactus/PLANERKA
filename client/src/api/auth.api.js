import { http } from "./http";

export async function apiRegister(payload) {
  const res = await http.post("/auth/register", payload);
  return res.data; // { user, token }
}

export async function apiLogin(payload) {
  const res = await http.post("/auth/login", payload);
  return res.data; // { user, token }
}

export async function apiVerifyEmail(payload) {
  const res = await http.post("/auth/verify-email", payload);
  return res.data; // { user, token }
}

export async function apiResendVerification(payload) {
  const res = await http.post("/auth/resend-verification", payload);
  return res.data;
}

export async function apiForgotPassword(payload) {
  const res = await http.post("/auth/forgot-password", payload);
  return res.data;
}

export async function apiResetPassword(payload) {
  const res = await http.post("/auth/reset-password", payload);
  return res.data;
}

export async function apiMe() {
  const res = await http.get("/auth/me");
  return res.data; // { user }
}
