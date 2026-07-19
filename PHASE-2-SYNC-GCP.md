# Aries Phase 2 — Sync backend on Google Cloud (Firebase Auth + Firestore)

Goal: move Aries off single-browser `localStorage` and onto a cloud backend so your
tasks, notes, goals, and calendar events follow you across devices, with sign-in and
offline support. This guide is written against the current code, not generic boilerplate.

## The one architectural fact that makes this easy

Every piece of app state flows through a single hook, `useLocalState` in
`app/_lib/storage.ts`, and the entire dashboard is one `DashData` object (see
`app/_lib/types.ts`). Phase 2 does not touch your components or your data model. You
replace *where* that one hook reads and writes. Everything downstream stays the same.

The plan:

1. Stand up a Firebase project (Auth + Firestore) on GCP.
2. Add sign-in (Google provider).
3. Store each user's `DashData` as a single Firestore document.
4. Swap `useLocalState` for a `useCloudState` that keeps `localStorage` as the offline cache.
5. Lock it down with security rules, migrate existing local data, then deploy.

## Why Firestore and not a database + API

Aries is one JSON blob per user with no relational queries. Firestore stores that
directly, gives you realtime sync and offline persistence for free, and needs no server
of your own. Standing up Cloud SQL (Postgres) plus a REST API on Cloud Run would be more
moving parts for no benefit at this size. If Aries ever grows multi-user sharing or heavy
querying, revisit. For now, Firestore is the right call.

One caveat up front: Firebase is Google Cloud. A Firebase project *is* a GCP project. You
manage billing, IAM, and quotas in the normal Cloud console. You are not leaving GCP by
using the Firebase console, it is just a friendlier front end over the same project.

---

## Project identifiers (this project, already created)

The Firebase project exists. Use these exact values, do not re-create it:

- Project name: **Project Aries**
- Project ID: **`project-aries-8bf97`**
- Project number / messaging sender ID: **`694367075970`**
- Parent org (GCP): tradeevio.com
- Billing plan: **Spark** (no-cost). See the billing note below.
- Web app (`aries-web`) app ID: **`1:694367075970:web:2e62b2b25194bf30b63e9b`**

Note: the GCP create form previewed the ID `project-aries-502705`, but the project
that was actually created is `project-aries-8bf97`. If a `502705` project also exists,
delete it to avoid confusion.

## Prerequisites

- Node 20+ (already required per `package.json`).
- Two Firebase installs, they do different jobs:
  - `npm install firebase` — the **client SDK** the app imports (Auth, Firestore).
  - `npm install -g firebase-tools` — the **CLI**, machine-global, used only to deploy
    security rules and (if used) Hosting/App Hosting. Then `firebase login`.
- Billing: Aries sits well inside Firestore's free tier, so **Spark is fine for Phase 2**
  (Auth + Firestore both work on Spark). You only need to upgrade to **Blaze** later, when
  you add a Cloud Function or server-side Vertex AI calls (Phase 3).

---

## Step 1 — Create the Firebase project — DONE

The project (`project-aries-8bf97`) and the `aries-web` Web app are already created under
the tradeevio.com org, so this step is complete. The Web app config values it produced go
into `.env.local` in Step 4. They are not secrets in the traditional sense (they ship to
the browser), but you still keep them in env for cleanliness and per-environment config.

Leave Google Analytics off — Aries is a `noindex` personal app and does not need it, so
drop the `getAnalytics` line from Firebase's default snippet.

## Step 2 — Enable Authentication

1. In the Firebase console: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Google**. Expand **Web SDK configuration** and set
   the **support email** (your own email is fine). The **Save** button stays greyed out
   until that email is filled, then Save.
3. Ignore the "SHA-1 release fingerprint" warning and "Safelist client IDs" — the SHA-1 is
   only for native **Android** builds signed with a keystore, which is not relevant to the
   web PWA. You would only revisit it if Aries is later packaged as a native Android app.
4. That is enough for a personal app. If you want email/password too, enable it here as
   well. Google sign-in is the least friction since you are already a Google user.
4. Under **Authentication → Settings → Authorized domains**, make sure your deploy domain
   is listed (it auto-adds the default `*.web.app` / `*.firebaseapp.com`; add your custom
   domain or Cloud Run URL when you have one).

## Step 3 — Enable Firestore

1. **Build → Firestore Database → Create database**.
2. Start in **production mode** (we will write real rules in Step 7, do not ship in test
   mode, it is world-writable).
3. Pick a region close to you, for example `us-central1` or `us-east1`. This is
   permanent for the database, so choose deliberately.

## Step 4 — Add the SDK and config to the app

Install the client SDK:

```bash
npm install firebase
```

Create `.env.local` in the project root (confirm it is gitignored and not committed).
These are this project's real values, filled in from the `aries-web` config:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBWvownIkonRofxSo8F0-7mTSHVgBp_5wY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project-aries-8bf97.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-aries-8bf97
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project-aries-8bf97.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=694367075970
NEXT_PUBLIC_FIREBASE_APP_ID=1:694367075970:web:2e62b2b25194bf30b63e9b
```

The `NEXT_PUBLIC_` prefix is required so Next.js exposes them to the browser. The
`apiKey` is not a secret — Firebase web API keys ship to the browser by design and only
identify the project; your data is protected by the security rules in Step 7, not by
hiding the key. (Note the storage bucket host is `.firebasestorage.app`, the current
default, not the older `.appspot.com`.)

Create `app/_lib/firebase.ts`:

```ts
"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// getApps() guard avoids re-initializing on hot reload / re-render.
export const app = getApps().length ? getApp() : initializeApp(config);

export const auth = getAuth(app);

// Firestore with offline persistence turned on. This is what lets Aries keep
// working with no network, which matters for a PWA.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

## Step 5 — Add auth (a sign-in gate)

Create `app/_lib/auth.tsx`, a small context that exposes the current user and
sign-in/out helpers:

```tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
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
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    setLoading(false);
  }), []);

  const signIn = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };
  const signOut = async () => {
    await fbSignOut(auth);
  };

  return <Ctx.Provider value={{ user, loading, signIn, signOut }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
```

Wrap the app in `AuthProvider`. The cleanest spot is a client boundary component that
`app/page.tsx` renders, since your root layout is a server component. Wherever your
`DashApp` mounts, ensure `<AuthProvider>` is above it. Then gate the dashboard: if
`loading`, show a spinner; if no `user`, show a single "Sign in with Google" button; once
signed in, render the dashboard.

## Step 6 — Replace `useLocalState` with `useCloudState`

This is the heart of Phase 2. Keep the exact same signature so calling code does not
change. The behavior: read from `localStorage` immediately (instant paint, offline), then
subscribe to the user's Firestore doc; writes go to both.

Store the whole `DashData` in one document at `users/{uid}`. Aries is small (a few KB),
so a single doc is simpler than splitting tasks/notes into subcollections, and it keeps
your `DashData` type intact. If it ever grows past roughly a megabyte, split then.

Create `app/_lib/cloudState.ts`:

```ts
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
  } catch { return undefined; }
}
function writeLocal<T>(key: string, value: T) {
  try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch {}
}

/**
 * Drop-in replacement for useLocalState. Same signature.
 * - Paints instantly from localStorage (offline-friendly).
 * - Subscribes to users/{uid}/{key} in Firestore once signed in.
 * - Writes go to Firestore (which mirrors to localStorage via its own cache)
 *   AND to our localStorage cache for the pre-auth / logged-out path.
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
        // First sign-in for this key: seed the cloud from whatever is local.
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
```

Then in your components, change the import from `useLocalState` to `useCloudState`. The
call sites do not change at all. Delete `storage.ts` once nothing imports it, or keep it
as the logged-out fallback.

Note the doc path is `users/{uid}/state/{key}`, a `state` subcollection keyed the same way
your localStorage keys are. That keeps parity with the current `aries:<key>` scheme.

## Step 7 — Security rules (do this before you trust it with real data)

In the Firebase console under **Firestore → Rules**, or in a local `firestore.rules`
file, restrict every user to their own document tree:

```
rules_version = "2";
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Deploy with `firebase deploy --only firestore:rules`. Without this, production mode
denies everything, so nothing works until these are in place. Test that a signed-in user
can only touch `users/{their-own-uid}/...`.

## Step 8 — Migrate your existing local data

Your current browser has real data under the `aries:` prefix. The `useCloudState` logic
above handles this automatically: on first sign-in, when the cloud doc for a key does not
exist, it seeds the cloud from whatever is in localStorage. So the migration is: open
Aries in the browser that already has your data, sign in once, and confirm the docs
appear in the Firestore console. Do this before signing in on a second device, otherwise
the empty device could seed empty state first. If you want to be safe, export your
localStorage to a JSON file first as a backup.

## Step 9 — Offline and the service worker

Firestore's `persistentLocalCache` (Step 4) already gives you offline reads and queued
writes that flush when the connection returns. That covers your *data*. Your existing
`public/sw.js` covers the *app shell*. Together that is a genuinely offline-capable PWA.
The README's Phase 1 note about extending `sw.js` or moving to Serwist/Workbox still
applies if you want guaranteed full-shell precaching, but it is independent of this sync
work. Do not block Phase 2 on it.

## Step 10 — Deploy

Two good options, both GCP:

- **Firebase App Hosting** (recommended for you): natively builds and serves Next.js from
  a Git push, and it is the same project your Auth and Firestore already live in. In the
  Firebase console: **Build → App Hosting → Get started**, connect the repo, done. Your
  env vars get set in the App Hosting config.
- **Cloud Run**: containerize (`next build` then `next start`), push to Artifact Registry,
  deploy. More control, slightly more setup. Use this if you outgrow App Hosting.

Either way, add the resulting domain to **Authentication → Settings → Authorized domains**
so Google sign-in works there.

---

## Verification checklist

- Sign in on Device A. Add a task. Confirm the `users/{uid}/state/tasks` doc updates in
  the Firestore console in real time.
- Sign in as the same account on Device B (or a second browser). The task appears without
  a manual refresh.
- Go offline (devtools network → offline). Edit a note. Come back online. The edit syncs.
- Sign out. Confirm the dashboard drops back to the sign-in gate and does not leak the
  previous user's data.
- Try to read another uid's doc in the Firestore rules simulator. Confirm it is denied.

## Rough effort and cost

- Effort: Steps 1 through 3 are console clicks, maybe 20 minutes. Steps 4 through 8 are
  the real code, a focused afternoon. Deploy is another hour or two the first time.
- Cost: For a single-user personal app you will almost certainly stay inside Firestore's
  free tier. Watch it, but do not expect a bill.

## Decisions left open (flag if you want to change course)

- **Single doc vs subcollections**: I have you storing each `DashData` key as its own doc
  under `users/{uid}/state/`. That is the least-change path. If you would rather have one
  document per task (for finer-grained sync or sharing later), that is a bigger refactor
  of the data layer and worth its own conversation.
- **Auth provider**: Google-only is assumed. Add email/password in Step 2 if you want a
  non-Google fallback.
- **Conflict handling**: last-write-wins is what the above gives you. Fine for a personal
  single-user app across your own devices. If two devices edit offline simultaneously, the
  later sync overwrites. Real merge logic is out of scope for Phase 2.
