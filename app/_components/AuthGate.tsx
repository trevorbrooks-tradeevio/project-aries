"use client";

/* Real auth gate (Phase 2). Wraps the app in the Firebase AuthProvider and
   shows a "Sign in with Google" screen until the user is authenticated. This
   supersedes the old client-side PasswordGate for the dashboard: Google
   sign-in is both the privacy gate and what makes cloud sync (useCloudState)
   actually sync. */

import { AuthProvider, useAuth } from "../_lib/auth";

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth();

  // Avoid a flash of the sign-in screen while auth state resolves.
  if (loading) return null;

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 320 }}>
          <h1 style={{ fontSize: 22, marginBottom: 8, color: "#fff" }}>Project Aries</h1>
          <p style={{ marginBottom: 24, color: "rgba(255,255,255,0.7)" }}>
            Sign in to load your dashboard.
          </p>
          <button
            onClick={() => void signIn()}
            style={{
              padding: "12px 20px",
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "#fff",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}
