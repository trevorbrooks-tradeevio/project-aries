"use client";

/* Real auth gate (Phase 2). Wraps the app in the Firebase AuthProvider and
   shows the sign-in screen until the user is authenticated. Google sign-in
   is both the privacy gate and what makes cloud sync (useCloudState) sync.

   Look and feel follows the Aries Design System token layer (app/theme.css,
   documented at /style-guide): warm beige page, white card with generous
   radius, quiet shadow, Google-only sign-in. */

import { AuthProvider, useAuth } from "../_lib/auth";

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/* Brand mark — simple Aries glyph in a soft accent tile. */
function AriesMark({ size = 34 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "var(--aries-radius-md)",
        background: "var(--aries-accent-soft)",
        color: "var(--aries-accent)",
      }}
    >
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        {/* Ram-horn / aries symbol */}
        <path d="M4 6c0-2 1.5-3.5 3.5-3.5S11 4 11 6.5V21" />
        <path d="M20 6c0-2-1.5-3.5-3.5-3.5S13 4 13 6.5V21" />
      </svg>
    </span>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuth();

  // Avoid a flash of the sign-in screen while auth state resolves.
  if (loading) return null;

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "var(--aries-bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--aries-space-5)",
          fontFamily: "var(--aries-font-body)",
          color: "var(--aries-ink)",
        }}
      >
        {/* Brand lockup above the card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: "var(--aries-space-5)",
          }}
        >
          <AriesMark />
          <span
            style={{
              fontFamily: "var(--aries-font-heading)",
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            Aries
          </span>
        </div>

        {/* Sign-in card */}
        <div
          style={{
            width: "100%",
            maxWidth: 400,
            background: "var(--aries-surface)",
            borderRadius: "var(--aries-radius-xl)",
            boxShadow: "var(--aries-shadow-3)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 28px",
              borderBottom: "1px solid var(--aries-border)",
            }}
          >
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Sign in</h1>
          </div>

          <div style={{ padding: "28px" }}>
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 14,
                lineHeight: 1.5,
                color: "var(--aries-ink-2)",
              }}
            >
              Sign in to load your dashboard.
            </p>
            <button
              onClick={() => void signIn()}
              type="button"
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "13px 20px",
                borderRadius: "var(--aries-radius-md)",
                border: "1px solid var(--aries-border-strong)",
                background: "var(--aries-surface)",
                boxShadow: "var(--aries-shadow-1)",
                cursor: "pointer",
                fontFamily: "var(--aries-font-body)",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--aries-ink)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--aries-surface-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--aries-surface)"; }}
            >
              <GoogleG />
              Continue with Google
            </button>
          </div>
        </div>

        {/* Footer */}
        <p
          style={{
            marginTop: "var(--aries-space-5)",
            maxWidth: 400,
            textAlign: "center",
            fontSize: 12,
            lineHeight: 1.6,
            color: "var(--aries-ink-3)",
          }}
        >
          Private workspace — access is limited to authorized Google accounts.
        </p>
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
