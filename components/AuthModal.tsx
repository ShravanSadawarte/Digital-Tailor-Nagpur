"use client";

import { useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/client-error";

export type AuthMode = "login" | "signup";

type Props = {
  mode: AuthMode | null;
  onClose: () => void;
};

export default function AuthModal({ mode, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!mode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, onClose]);

  if (!mode) return null;
  const isSignup = mode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    const supabase = getSupabase();
    if (!supabase) {
      setError(
        "Supabase is not connected yet. Add your keys to .env.local to enable login."
      );
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.session) {
          // Email confirmation is OFF — user is logged in immediately.
          // Save the profile details they just gave us (best effort —
          // the profile page lets them edit it later anyway).
          try {
            await supabase.from("profiles").upsert({
              id: data.session.user.id,
              full_name: fullName.trim() || null,
              phone: phone.trim() || null,
            });
          } catch {
            /* ignore — account is already created */
          }
          setEmail("");
          setPassword("");
          setFullName("");
          setPhone("");
          onClose();
        } else {
          // Email confirmation is ON — user must confirm first.
          setNotice("Account created! Check your email to confirm.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setEmail("");
        setPassword("");
        onClose();
      }
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        <h2>{isSignup ? "Create Account" : "Login"}</h2>
        {!isSupabaseConfigured() && (
          <p className="form-msg">
            Demo mode — connect Supabase keys to enable real auth.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label>
                Full name
                <input
                  type="text"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />
          </label>
          {error && <p className="form-err">{error}</p>}
          {notice && <p className="form-msg">{notice}</p>}
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Please wait…" : isSignup ? "Sign Up" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
