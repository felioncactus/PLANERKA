import React from "react";
import { PASSWORD_RULES } from "../utils/passwordRules";

export default function PasswordRules({ password }) {
  const value = String(password || "");
  return (
    <div className="password-rules" aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <div key={rule.id} className={`password-rule${ok ? " is-ok" : ""}`}>
            <span aria-hidden="true">{ok ? "✓" : "•"}</span>
            <span>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
}
