"use client";

import { useEffect, useRef, useState, useCallback, type Dispatch, type SetStateAction } from "react";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";

const PREFIX = "aries:";
// Wait this long after the last change before writing to Firestore, so a burst
// of edits (e.g. typing in a note) collapses into a single write.
const WRITE_DEBOUNCE_MS = 2000;

// ---------------------------------------------------------------------------
// Conflict model: EXPLICIT VERSION, not timing.
//
// Every record carries a monotonically increasing `version` (a Lamport clock).
// The rule is simple and unambiguous: the higher version always wins. A device
// can only overwrite the cloud if it holds a STRICTLY newer version. A stale
// device that just painted old data from localStorage holds an OLDER version,
// so it accepts the cloud copy instead of clobbering it. That is what fixes the
// "edit on laptop A, open stale laptop B, B pushes its old copy back" bug.
//
// Ties (same version, different content — only possible if two devices edited
// while both offline) are broken deterministically by `updatedAt` then a stable
// per-device id, so every device converges on the same winner.
// ---------------------------------------------------------------------------

type Meta = { version: number; updatedAt: number; deviceId: string };
type Envelope<T> = { value: T } & Meta;

// A stable id for THIS browser/device, used only to break exact version+time
// ties deterministically. Created once and kept in localStorage.
function deviceId(): string {
  try {
    const k = PREFIX + "__deviceId";
    let id = window.localStorage.getItem(k);
    if (!id) {
      id = (crypto?.randomUUID?.() ?? String(Math.random()).slice(2)) + "";
      window.localStorage.setItem(k, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

function readLocal<T>(key: string): Envelope<T> | undefined {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as unknown;
    // Back-compat: older builds stored the bare value with no envelope.
    if (parsed && typeof parsed === "object" && "value" in (parsed as object) && "version" in (parsed as object)) {
      return parsed as Envelope<T>;
    }
    return { value: parsed as T, version: 0, updatedAt: 0, deviceId: "legacy" };
  } catch {
    return undefined;
  }
}
function writeLocal<T>(key: string, env: Envelope<T>): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(env));
  } catch {
    // Quota / serialization error — persistence is a nice-to-have.
  }
}

// Returns true if `a` should win over `b` (i.e. a is newer).
function aWins(a: Meta, b: Meta): boolean {
  if (a.version !== b.version) return a.version > b.version;
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt;
  return a.deviceId > b.deviceId; // stable, deterministic tie-break
}

/**
 * Drop-in replacement for useLocalState (same signature).
 * - Paints instantly from localStorage (offline-friendly, no hydration flash).
 * - Subscribes to users/{uid}/state/{key} in Firestore once signed in.
 * - localStorage is written on every change (free); Firestore is written
 *   DEBOUNCED and only when THIS DEVICE made a real user edit — never as a side
 *   effect of hydration. That, plus version-based conflict resolution, is what
 *   guarantees a stale device can't overwrite newer cloud data.
 *
 * Conflict model is HIGHEST-VERSION-WINS across a single user's devices.
 */
export function useCloudState<T>(key: string, seed: T): [T, Dispatch<SetStateAction<T>>] {
  const { user } = useAuth();
  const [value, setValue] = useState<T>(seed);
  const [hydrated, setHydrated] = useState(false);

  // Meta for the value we currently hold in `value`.
  const meta = useRef<Meta>({ version: 0, updatedAt: 0, deviceId: deviceId() });
  // Highest version we know exists in the cloud (from snapshots / our writes).
  const cloudVersion = useRef(0);
  // True only when THIS device made a user edit that hasn't reached the cloud.
  const dirty = useRef(false);
  // JSON of the last value we wrote to (or read from) the cloud — used to skip
  // no-op writes so we don't churn the snapshot->write->snapshot loop.
  const lastCloudJson = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef(user);
  userRef.current = user;
  const valueRef = useRef(value);
  valueRef.current = value;

  // Push the current (dirty) value to Firestore. Called by the debounce timer
  // and by the hide/unmount flush.
  const flush = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const u = userRef.current;
    if (!u || !dirty.current) return;
    const json = JSON.stringify(valueRef.current);
    if (json === lastCloudJson.current) { dirty.current = false; return; }
    dirty.current = false;
    lastCloudJson.current = json;
    cloudVersion.current = meta.current.version;
    void setDoc(doc(db, "users", u.uid, "state", key), {
      value: valueRef.current,
      version: meta.current.version,
      updatedAt: meta.current.updatedAt,
      deviceId: meta.current.deviceId,
      // Human-auditable server clock; NOT used for conflict logic (clocks skew).
      serverUpdatedAt: serverTimestamp(),
    });
  }, [key]);

  // Public setter. Any call here is a REAL user edit on this device, so we bump
  // the version above anything we've seen (Lamport clock) and mark dirty. The
  // cloud/local hydration paths below use the raw `setValue`, so they never
  // trigger a write.
  const setUserValue = useCallback<Dispatch<SetStateAction<T>>>((action) => {
    dirty.current = true;
    meta.current = {
      version: Math.max(meta.current.version, cloudVersion.current) + 1,
      updatedAt: Date.now(),
      deviceId: meta.current.deviceId,
    };
    setValue(action);
  }, []);

  // 1. Instant local paint (restores the stored version too).
  useEffect(() => {
    const local = readLocal<T>(key);
    if (local !== undefined) {
      setValue(local.value);
      meta.current = { version: local.version, updatedAt: local.updatedAt, deviceId: meta.current.deviceId };
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 2. Subscribe to the cloud doc once we know the user.
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "state", key);
    const unsub = onSnapshot(ref, (snap) => {
      // Ignore the local, not-yet-acknowledged echo of our own setDoc.
      if (snap.metadata.hasPendingWrites) return;

      if (!snap.exists()) {
        // First sign-in for this key: seed the cloud from local (or seed) once.
        const start = Math.max(meta.current.version, 1);
        meta.current = { ...meta.current, version: start, updatedAt: meta.current.updatedAt || Date.now() };
        cloudVersion.current = start;
        lastCloudJson.current = JSON.stringify(valueRef.current);
        void setDoc(ref, {
          value: valueRef.current,
          version: start,
          updatedAt: meta.current.updatedAt,
          deviceId: meta.current.deviceId,
          serverUpdatedAt: serverTimestamp(),
        });
        return;
      }

      const data = snap.data() as Envelope<T>;
      const cloudMeta: Meta = {
        version: data.version ?? 0,
        updatedAt: data.updatedAt ?? 0,
        deviceId: data.deviceId ?? "cloud",
      };
      cloudVersion.current = Math.max(cloudVersion.current, cloudMeta.version);

      // Decide the winner by VERSION, not by whether a write is pending.
      // Keep our local copy only if it is genuinely newer (a real, un-flushed
      // edit on this device). Otherwise take the cloud copy — this is exactly
      // the case a stale device hits, and it must NOT overwrite the cloud.
      if (dirty.current && aWins(meta.current, cloudMeta)) return;

      lastCloudJson.current = JSON.stringify(data.value);
      meta.current = cloudMeta;
      dirty.current = false; // cloud has superseded anything stale we held
      setValue(data.value);
      writeLocal(key, data);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, key]);

  // 3. Persist: localStorage immediately; Firestore debounced, ONLY when dirty.
  useEffect(() => {
    if (!hydrated) return;
    writeLocal(key, { value, ...meta.current });
    if (!user) return;
    if (!dirty.current) return; // hydration/cloud paints are not our edits
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, WRITE_DEBOUNCE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value, hydrated, user]);

  // 4. Flush a pending write when the app is hidden or the hook unmounts.
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
  }, [key, flush]);

  return [value, setUserValue];
}
