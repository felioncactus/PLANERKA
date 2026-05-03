import React, { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { apiResendVerification } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const { user, verifyEmail } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const initialEmail = useMemo(() => params.get("email") || "", [params]);

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
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
      await verifyEmail({ email, code });
      nav("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error?.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await apiResendVerification({ email });
      setNotice(data?.message || "Code sent.");
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
          <div className="auth-badge auth-badge-subtle">Email verification</div>
          <div className="title auth-title">Enter the 6-digit code</div>
          <div className="muted small">We sent a code to your email. It expires in 15 minutes.</div>
        </div>

        <form className="form-grid auth-form" onSubmit={onSubmit}>
          <label className="auth-label" htmlFor="verify-email">
            <span>Email</span>
            <input id="verify-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>

          <label className="auth-label" htmlFor="verify-code">
            <span>Code</span>
            <input id="verify-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="123456" className="auth-code-input" />
          </label>

          {notice ? <div className="notice notice-success small">{notice}</div> : null}
          {error ? <div className="notice notice-danger small">{error}</div> : null}

          <button className="btn btn-primary auth-submit" type="submit" disabled={busy || !email.trim() || code.length !== 6}>
            {busy ? "Checking..." : "Verify email"}
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
