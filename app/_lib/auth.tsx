"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FbUser,
} from "firebase/auth";
import { auth } from "./firebase";

type AuthCtx = {
  user: FbUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Short-lived Google OAuth access token carrying the Calendar read scope,
      captured on demand via connectCalendar (or after a redirect). */
  calendarToken: string | null;
  /** Ask Google for calendar.readonly access. Returns the token, or null if a
      full-page redirect was started (token arrives on return). */
  connectCalendar: () => Promise<string | null>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  calendarToken: null,
  connectCalendar: async () => null,
});

const provider = new GoogleAuthProvider();

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";
// Marks that the pending redirect was a calendar-connect (not a plain sign-in),
// so getRedirectResult knows to keep the returned access token.
const GCAL_REDIRECT_FLAG = "aries:gcal_redirect";

// Popup errors that mean "the popup route won't work here" — fall back to a
// full-page redirect, which is reliable on desktop, in installed PWAs, and on
// iOS where popups are flaky. This is what fixes the "popup flickers then
// disappears" symptom.
const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarToken, setCalendarToken] = useState<string | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }),
    []
  );

  // Complete any redirect-based sign-in when the page comes back from Google.
  // If the redirect was a calendar-connect, keep the returned access token.
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (!result) return;
        let flagged = false;
        try { flagged = sessionStorage.getItem(GCAL_REDIRECT_FLAG) === "1"; } catch { /* ignore */ }
        if (flagged) {
          const cred = GoogleAuthProvider.credentialFromResult(result);
          if (cred?.accessToken) setCalendarToken(cred.accessToken);
          try { sessionStorage.removeItem(GCAL_REDIRECT_FLAG); } catch { /* ignore */ }
        }
      })
      .catch(() => {
        // Surfaced via onAuthStateChanged / next sign-in attempt; swallow here.
      });
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (POPUP_FALLBACK_CODES.has(code)) {
        await signInWithRedirect(auth, provider);
      } else {
        throw err;
      }
    }
  };

  const signOut = async () => {
    setCalendarToken(null);
    await fbSignOut(auth);
  };

  // Request Google Calendar read access for the signed-in account. Popup first;
  // fall back to redirect where popups don't work (installed PWA, iOS).
  const connectCalendar = async (): Promise<string | null> => {
    const p = new GoogleAuthProvider();
    p.addScope(CALENDAR_SCOPE);
    // prompt=consent forces Google to actually show the calendar permission;
    // without it, an existing login grant is reused and the token comes back
    // WITHOUT the calendar scope, which makes the Calendar API return 403.
    p.setCustomParameters({ prompt: "consent", include_granted_scopes: "true" });
    try {
      const result = await signInWithPopup(auth, p);
      const cred = GoogleAuthProvider.credentialFromResult(result);
      const token = cred?.accessToken ?? null;
      setCalendarToken(token);
      return token;
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (POPUP_FALLBACK_CODES.has(code)) {
        try { sessionStorage.setItem(GCAL_REDIRECT_FLAG, "1"); } catch { /* ignore */ }
        await signInWithRedirect(auth, p);
        return null; // token captured on return via getRedirectResult
      }
      throw err;
    }
  };

  return (
    <Ctx.Provider value={{ user, loading, signIn, signOut, calendarToken, connectCalendar }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
