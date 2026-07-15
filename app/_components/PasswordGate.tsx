"use client";

import { useEffect, useState } from "react";

/*
 * Temporary client-side password gate for the whole app.
 *
 * NOTE: this runs in the browser and the password is present in the shipped
 * bundle — it's a light privacy screen, not real security. It's a stopgap
 * ("for now") until roadmap Phase 2 adds real server-side auth. To remove it,
 * delete this component and unwrap it in app/page.tsx.
 */

const PASSWORD = "anthony"; // case-insensitive (see check below)
const UNLOCK_KEY = "aries:unlocked";

export function PasswordGate({ children }: { children: React.ReactNode }) {
  // undefined = still checking storage (avoids a flash of the gate on reload)
  const [unlocked, setUnlocked] = useState<boolean | undefined>(undefined);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(window.localStorage.getItem(UNLOCK_KEY) === "1");
    } catch {
      setUnlocked(false);
    }
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim().toLowerCase() === PASSWORD) {
      try {
        window.localStorage.setItem(UNLOCK_KEY, "1");
      } catch {
        /* ignore storage failures — still unlock for this session */
      }
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  // Still reading storage: render nothing to avoid a gate flash.
  if (unlocked === undefined) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        padding: "0 24px",
      }}
    >
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <span
            style={{
              display: "flex",
              height: 48,
              width: 48,
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#c0392b",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="1" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        </div>
        <label
          htmlFor="aries-password"
          style={{
            display: "block",
            textAlign: "center",
            marginBottom: 8,
            fontFamily: "var(--font-heading)",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          Enter password
        </label>
        <input
          id="aries-password"
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          autoFocus
          aria-label="Password"
          style={{
            marginBottom: 12,
            width: "100%",
            border: `1px solid ${error ? "#c0392b" : "rgba(255,255,255,0.15)"}`,
            background: "#111111",
            padding: "12px",
            textAlign: "center",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            letterSpacing: "0.2em",
            color: "#fff",
            outline: "none",
          }}
        />
        {error && (
          <p
            style={{
              marginBottom: 12,
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: 12,
              color: "#c0392b",
            }}
          >
            Incorrect password.
          </p>
        )}
        <button
          type="submit"
          style={{
            width: "100%",
            background: "#c0392b",
            border: "none",
            padding: "12px 16px",
            fontFamily: "var(--font-heading)",
            fontSize: 13,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </form>
    </div>
  );
}
