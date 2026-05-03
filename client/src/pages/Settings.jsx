import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { apiDeleteMe, apiUpdateMe } from "../api/users.api";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { ONBOARDING_TOUR_EVENT, translateOnboardingText } from "../utils/onboardingTour";
import { disableSystemNotifications, getSystemNotificationSupport, requestSystemNotifications } from "../utils/systemNotifications";

export default function Settings() {
  const { user, logout, updateSession } = useAuth();
  const { language, setLanguage, languages, t } = useLanguage();
  const nav = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [profileLanguage, setProfileLanguage] = useState(user?.language || language || "en");

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [notificationStatus, setNotificationStatus] = useState(() => getSystemNotificationSupport());

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setAvatarUrl(user?.avatar_url || null);
    setProfileLanguage(user?.language || language || "en");
  }, [user, language]);

  const avatarPreview = useMemo(() => avatarUrl, [avatarUrl]);

  async function onPickAvatar(file) {
    setError("");
    setStatus("");
    if (!file) {
      setAvatarUrl(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Avatar must be an image file.");
      return;
    }
    if (file.size > 1_000_000) {
      setError("Avatar too large. Please use an image under 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(String(reader.result));
    reader.onerror = () => setError("Failed to read image.");
    reader.readAsDataURL(file);
  }

  async function onSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const data = await apiUpdateMe({
        name,
        email,
        avatarUrl: avatarUrl || null,
        language: profileLanguage,
      });
      updateSession(data);
      setLanguage(profileLanguage);
      setStatus("Saved.");
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteAccount() {
    setError("");
    setStatus("");

    const ok = window.confirm(
      "Delete your account permanently? This will remove all your data (tasks, courses, schedules). This cannot be undone.",
    );
    if (!ok) return;

    try {
      await apiDeleteMe();
      logout();
      nav("/register", { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to delete account",
      );
    }
  }

  function replayWelcomeTour() {
    window.dispatchEvent(new CustomEvent(ONBOARDING_TOUR_EVENT));
  }

  async function enableNotifications() {
    setNotificationStatus(await requestSystemNotifications());
  }

  function turnOffNotifications() {
    disableSystemNotifications();
    setNotificationStatus(getSystemNotificationSupport());
  }

  function tourText(value) {
    return translateOnboardingText(language, value);
  }

  return (
    <div>
      <Navbar />
      <div className="container">
        <div className="page-title">
          <div>
            <div className="title">Account Settings</div>
            <div className="muted small">
              Update your profile, email, and avatar — or delete your account.
            </div>
          </div>
        </div>

        <div className="card">
          <form className="form-grid" onSubmit={onSave}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <div className="avatar" style={{ width: 64, height: 64 }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" />
                ) : (
                  <span className="small">🙂</span>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 260 }}>
                <div className="two-col">
                  <label>
                    Name
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </label>
                  <label>
                    Email
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>
                </div>

                <label style={{ marginTop: 8 }}>
                  Avatar
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickAvatar(e.target.files?.[0] || null)}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="avatar" className="btn btn-ghost file-picker-label">
                    Choose file
                  </label>
                </label>

                <label style={{ marginTop: 8 }}>
                  {t("Language")}
                  <select value={profileLanguage} onChange={(e) => setProfileLanguage(e.target.value)}>
                    {languages.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="row" style={{ marginTop: 10 }}>
                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    disabled={saving || !avatarUrl}
                    title="Remove avatar"
                  >
                    Remove avatar
                  </button>
                </div>

                {status && <div className="small muted">{status}</div>}
                {error && (
                  <div className="small" style={{ color: "var(--danger)" }}>
                    {error}
                  </div>
                )}
              </div>
            </div>

            <hr />

            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 650 }}>System notifications</div>
                <div className="small muted">
                  Chat messages and task reminders can appear as mobile/browser notifications.
                </div>
                <div className="small muted" style={{ marginTop: 4 }}>
                  {notificationStatus.supported
                    ? `Status: ${notificationStatus.enabled ? "enabled" : notificationStatus.permission}`
                    : "This browser does not support system notifications."}
                </div>
              </div>
              <div className="row" style={{ justifyContent: "flex-end" }}>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={enableNotifications}
                  disabled={!notificationStatus.supported || notificationStatus.enabled}
                >
                  {notificationStatus.enabled ? "Enabled" : "Enable"}
                </button>
                {notificationStatus.enabled ? (
                  <button className="btn btn-ghost" type="button" onClick={turnOffNotifications}>
                    Turn off
                  </button>
                ) : null}
              </div>
            </div>

            <hr />

            <div className="row" style={{ justifyContent: "space-between" }} data-tour="settings-replay-tour">
              <div>
                <div style={{ fontWeight: 650 }}>{tourText("Welcome tour")}</div>
                <div className="small muted">{tourText("Replay the first-time tutorial and highlights.")}</div>
              </div>
              <button className="btn btn-ghost" type="button" onClick={replayWelcomeTour}>
                {tourText("Replay tour")}
              </button>
            </div>

            <hr />

            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 650 }}>Danger zone</div>
                <div className="small muted">This action is permanent.</div>
              </div>
              <button
                className="btn btn-danger"
                type="button"
                onClick={onDeleteAccount}
              >
                Delete account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
