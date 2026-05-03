import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { apiForgotPassword, apiResetPassword } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";

export default function ResetPassword() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialEmail = useMemo(() => params.get("email") || "", [params]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (password !== confirm) throw new Error("Passwords do not match");
      await apiResetPassword({ email, code, password });
      nav("/login", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || "Could not reset password");
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiForgotPassword({ email });
      setNotice("A new recovery code was sent.");
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not resend code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell auth-shell-compact">
      <div className="auth-card card auth-card-narrow">
        <div className="auth-header">
          <div className="auth-badge auth-badge-subtle">Reset password</div>
          <div className="title auth-title">Create a new password</div>
          <div className="muted small">Use the recovery code from your email.</div>
        </div>

        <form className="form-grid auth-form" onSubmit={onSubmit}>
          <label className="auth-label" htmlFor="reset-email">
            <span>Email</span>
            <input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>

          <label className="auth-label" htmlFor="reset-code">
            <span>Code</span>
            <input id="reset-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" className="auth-code-input" />
          </label>

          <label className="auth-label" htmlFor="new-password">
            <span>New password</span>
            <input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <label className="auth-label" htmlFor="confirm-password">
            <span>Confirm password</span>
            <input id="confirm-password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </label>

          {notice ? <div className="notice notice-success small">{notice}</div> : null}
          {error ? <div className="notice notice-danger small">{error}</div> : null}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy || !email.trim() || code.length !== 6 || password.length < 8 || confirm.length < 8}>
            {busy ? "Saving..." : "Reset password"}
          </button>

          <div className="auth-inline-actions">
            <button type="button" className="btn btn-ghost" onClick={onResend} disabled={busy || !email.trim()}>Resend code</button>
            <Link to="/login" className="btn">Back to login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
