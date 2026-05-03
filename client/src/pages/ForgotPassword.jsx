import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { apiForgotPassword } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";

export default function ForgotPassword() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiForgotPassword({ email });
      nav(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Could not send recovery code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-shell auth-shell-compact">
      <div className="auth-card card auth-card-narrow">
        <div className="auth-header">
          <div className="auth-badge auth-badge-subtle">Password recovery</div>
          <div className="title auth-title">Get a recovery code</div>
          <div className="muted small">Enter your email and we will send a 6-digit code to reset your password.</div>
        </div>

        <form className="form-grid auth-form" onSubmit={onSubmit}>
          <label className="auth-label" htmlFor="recovery-email">
            <span>Email</span>
            <input id="recovery-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>

          {error ? <div className="notice notice-danger small">{error}</div> : null}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy || !email.trim()}>
            {busy ? "Sending..." : "Send recovery code"}
          </button>

          <div className="small muted auth-footer">
            Remembered it? <Link to="/login">Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
