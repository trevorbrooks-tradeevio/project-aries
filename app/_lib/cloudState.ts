"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";

const PREFIX = "aries:";
// Wait this long after the last change before writing to Firestore, so a burst
// of edits (e.g. typing in a note) collapses into a single write.
const WRITE_DEBOUNCE_MS = 2000;

function readLocal<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}
function writeLocal<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota / serialization error — persistence is a nice-to-have, not
    // load-bearing, so fail silently.
  }
}

/**
 * Drop-in replacement for useLocalState (same signature).
 * - Paints instantly from localStorage (offline-friendly, no hydration flash).
 * - Subscribes to users/{uid}/state/{key} in Firestore once signed in.
 * - localStorage is written on every change (free); Firestore is written
 *   DEBOUNCED and only when the value actually differs from what's in the
 *   cloud. This is what keeps Firestore usage low and, crucially, breaks the
 *   snapshot -> write -> snapshot loop that otherwise runs up the quota.
 * - Pending writes are flushed when the tab/app is hidden or unmounts, so the
 *   cloud copy never lags behind local.
 *
 * Conflict model is last-write-wins, fine for one user across their devices.
 */
export function useCloudState<T>(key: string, seed: T): [T, Dispatch<SetStateAction<T>>] {
  const { user } = useAuth();
  const [value, setValue] = useState<T>(seed);
  const [hydrated, setHydrated] = useState(false);

  // JSON of what the cloud currently holds (from the last snapshot or our last
  // write). A change matching this is a no-op / an echo, so we skip it.
  const lastCloudJson = useRef<string | null>(null);
  const pendingJson = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  // Write whatever is pending to Firestore right now (used by the debounce
  // timer and by the hide/unmount flush).
  const flush = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const u = userRef.current;
    if (!u || pendingJson.current == null) return;
    const json = pendingJson.current;
    pendingJson.current = null;
    lastCloudJson.current = json;
    void setDoc(doc(db, "users", u.uid, "state", key), { value: JSON.parse(json) as T });
  };

  // 1. Instant local paint.
  useEffect(() => {
    const local = readLocal<T>(key);
    if (local !== undefined) setValue(local);
    setHydrated(true);
  }, [key]);

  // 2. Subscribe to the cloud doc once we know the user.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "state", key);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = (snap.data() as { value: T }).value;
        // Record the cloud value so our persist effect won't echo it back.
        lastCloudJson.current = JSON.stringify(data);
        pendingJson.current = null;
        setValue(data);
        writeLocal(key, data);
      } else {
        // First sign-in for this key: seed the cloud from local (or seed) once.
        const local = readLocal<T>(key) ?? seed;
        lastCloudJson.current = JSON.stringify(local);
        void setDoc(ref, { value: local });
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, key]);

  // 3. Persist: localStorage immediately, Firestore debounced + de-duped.
  useEffect(() => {
    if (!hydrated) return;
    writeLocal(key, value);
    if (!user) return;
    const json = JSON.stringify(value);
    if (json === lastCloudJson.current) return; // unchanged, or an echo from the cloud
    pendingJson.current = json;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, WRITE_DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value, hydrated, user]);

  // 4. Flush a pending write when the app is hidden or the hook unmounts, so a
  //    quick close right after an edit doesn't leave the cloud stale.
  useEffect(() => {
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    const onPageHide = () => flush();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, setValue];
}
