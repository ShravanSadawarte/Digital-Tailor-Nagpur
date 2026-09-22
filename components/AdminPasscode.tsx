"use client";

import { useState } from "react";

// Hidden second layer for the admin login. Only rendered when the
// server confirms the logged-in email is the admin email.
export default function AdminPasscode({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", code }),
    });
    const j = await res.json();
    setLoading(false);
    if (j.ok) {
      setCode("");
      onSuccess();
    } else {
      setError(j.error || "Wrong passcode.");
    }
  };

  return (
    <div className="admin-pass">
      <form onSubmit={submit}>
        <strong>🔐 Extra verification</strong>
        <p>Enter your admin passcode to unlock management.</p>
        <div className="admin-pass-row">
          <input
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Passcode"
          />
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "…" : "Unlock"}
          </button>
        </div>
        {error && <p className="form-err">{error}</p>}
      </form>
    </div>
  );
}
