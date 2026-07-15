"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const PREFIX = "aries:";

function readStorage<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : undefined;
  } catch {
    return undefined;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or serialization error — persistence is a nice-to-have,
    // not load-bearing, so fail silently rather than break the dashboard.
  }
}

/**
 * State that persists to localStorage under `aries:<key>`. Initializes with
 * `seed` on every render (server and first client render match, so there's
 * no hydration mismatch) and swaps in any persisted value once mounted.
 */
export function useLocalState<T>(key: string, seed: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStorage<T>(key);
    if (stored !== undefined) setValue(stored);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (hydrated) writeStorage(key, value);
  }, [key, value, hydrated]);

  return [value, setValue];
}
