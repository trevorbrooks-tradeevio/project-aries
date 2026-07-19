"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";

const PREFIX = "aries:";

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
 * - Writes go to localStorage AND, when signed in, to Firestore.
 * - First sign-in for a key seeds the cloud doc from whatever is local.
 *
 * Conflict model is last-write-wins, which is fine for one user across their
 * own devices. Real merge logic is out of scope for Phase 2.
 */
export function useCloudState<T>(key: string, seed: T): [T, Dispatch<SetStateAction<T>>] {
  const { user } = useAuth();
  const [value, setValue] = useState<T>(seed);
  const [hydrated, setHydrated] = useState(false);
  const remoteApplied = useRef(false);

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
        remoteApplied.current = true;
        setValue(data);
        writeLocal(key, data);
      } else {
        // First sign-in for this key: seed the cloud from local (or seed).
        const local = readLocal<T>(key) ?? seed;
        void setDoc(ref, { value: local });
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, key]);

  // 3. Persist writes.
  useEffect(() => {
    if (!hydrated) return;
    writeLocal(key, value);
    if (user) {
      const ref = doc(db, "users", user.uid, "state", key);
      void setDoc(ref, { value });
    }
  }, [key, value, hydrated, user]);

  return [value, setValue];
}
