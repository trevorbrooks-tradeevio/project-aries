"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

// Config comes from .env.local (NEXT_PUBLIC_* so it reaches the browser).
// These are not secrets: Firebase web keys ship to the client by design and
// only identify the project. Data is protected by Firestore security rules,
// not by hiding the key.
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

// Firestore with offline persistence. This is what lets Aries keep working
// with no network, which matters for a PWA.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
