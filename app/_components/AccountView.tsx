"use client";

/* Account view — edit the profile (name + image), time zone, Daily Reminders,
   and the Quote of the Time. Edits are held in local draft state and only
   committed to cloud state (localStorage + Firestore) when Save is pressed. */

import { useMemo, useRef, useState } from "react";
import { Icons } from "./Icons";
import { initialsFrom } from "../_lib/profile";
import type { Profile, Quote } from "../_lib/types";

// IANA zone list — prefer the browser's full set, fall back to a common few.
const TIMEZONES: string[] = (() => {
  try {
    const sv = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (typeof sv === "function") return sv("timeZone");
  } catch { /* older engine — use fallback */ }
  return [
    "UTC", "America/New_York", "America/Chicago", "America/Denver",
    "America/Phoenix", "America/Los_Angeles", "America/Anchorage",
    "Pacific/Honolulu", "Europe/London", "Europe/Paris", "Europe/Berlin",
    "Asia/Kolkata", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney",
  ];
})();

const MAX_AVATAR_PX = 256;

type AccountViewProps = {
  profile: Profile;
  setProfile: (updater: Profile | ((prev: Profile) => Profile)) => void;
  quote: Quote;
  setQuote: (updater: Quote | ((prev: Quote) => Quote)) => void;
  reminders: string[];
  setReminders: (updater: string[] | ((prev: string[]) => string[])) => void;
  timezone: string;
  setTimezone: (updater: string | ((prev: string) => string)) => void;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  onSignOut: () => void;
};

export function AccountView({
  profile, setProfile, quote, setQuote, reminders, setReminders, timezone, setTimezone,
  theme, setTheme, onSignOut,
}: AccountViewProps) {
  // Local drafts — nothing persists until Save.
  const [pDraft, setPDraft] = useState<Profile>(profile);
  const [qDraft, setQDraft] = useState<Quote>(quote);
  const [rDraft, setRDraft] = useState<string[]>(reminders);
  const [tzDraft, setTzDraft] = useState<string>(timezone);
  const [savedFlash, setSavedFlash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty = useMemo(
    () =>
      JSON.stringify({ p: pDraft, q: qDraft, r: rDraft, tz: tzDraft }) !==
      JSON.stringify({ p: profile, q: quote, r: reminders, tz: timezone }),
    [pDraft, qDraft, rDraft, tzDraft, profile, quote, reminders, timezone],
  );

  const editReminder = (i: number, value: string) => setRDraft((prev) => prev.map((r, j) => (j === i ? value : r)));
  const removeReminder = (i: number) => setRDraft((prev) => prev.filter((_, j) => j !== i));
  const addReminder = () => setRDraft((prev) => [...prev, ""]);
  const moveReminder = (i: number, dir: -1 | 1) =>
    setRDraft((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const arr = [...prev];
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
      return arr;
    });

  // Downscale the picked image to a small square-ish data URL so it stays well
  // under localStorage / Firestore size limits.
  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_AVATAR_PX / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, w, h);
        setPDraft((p) => ({ ...p, avatar: canvas.toDataURL("image/jpeg", 0.85) }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    setProfile({ ...pDraft, name: pDraft.name.trim() || "Unnamed", role: pDraft.role.trim() });
    setQuote(qDraft);
    setReminders(rDraft.map((r) => r.trim()).filter(Boolean)); // drop blank rows
    setTimezone(tzDraft);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  const reset = () => {
    setPDraft(profile); setQDraft(quote); setRDraft(reminders); setTzDraft(timezone);
  };

  return (
    <>
      <div className="view-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow"><span className="slash">/</span>Account</span>
          <h1 className="view-title">Account</h1>
        </div>
        <div className="acct-save-bar">
          {savedFlash && <span className="acct-saved"><Icons.Check size={14} />Saved</span>}
          {dirty && <button className="btn btn-ghost btn-sm" type="button" onClick={reset}>Discard</button>}
          <button className="btn btn-red" type="button" onClick={save} disabled={!dirty} style={!dirty ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>Save</button>
        </div>
      </div>

      {/* Profile */}
      <section className="acct-card">
        <div className="acct-card-head">
          <span className="eyebrow"><span className="slash">/</span>Profile</span>
        </div>
        <div className="acct-profile">
          <div className="acct-avatar">
            {pDraft.avatar
              ? <img src={pDraft.avatar} alt="Profile" />
              : <span>{initialsFrom(pDraft.name)}</span>}
          </div>
          <div className="acct-avatar-actions">
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} hidden />
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => fileRef.current?.click()}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14.5 4h-5L7 7H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3l-2.5-3Z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              {pDraft.avatar ? "Change image" : "Upload image"}
            </button>
            {pDraft.avatar && <button className="btn btn-ghost btn-sm" type="button" onClick={() => setPDraft((p) => ({ ...p, avatar: null }))}>Remove</button>}
          </div>
        </div>
        <div className="acct-grid">
          <div className="field">
            <label>Name</label>
            <input className="inp" value={pDraft.name} placeholder="Your name" onChange={(e) => setPDraft((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="field">
            <label>Role <span className="acct-optional">(optional)</span></label>
            <input className="inp" value={pDraft.role} placeholder="e.g. Personal" onChange={(e) => setPDraft((p) => ({ ...p, role: e.target.value }))} />
          </div>
        </div>
      </section>

      {/* Appearance — theme applies immediately, independent of Save. */}
      <section className="acct-card">
        <div className="acct-card-head">
          <span className="eyebrow"><span className="slash">/</span>Appearance</span>
        </div>
        <div className="field">
          <label>Theme</label>
          <div className="fb-seg acct-theme-seg">
            <button type="button" className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}><Icons.Sun size={14} />Light</button>
            <button type="button" className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}><Icons.Moon size={14} />Dark</button>
          </div>
        </div>
      </section>

      {/* Time zone */}
      <section className="acct-card">
        <div className="acct-card-head">
          <span className="eyebrow"><span className="slash">/</span>Time Zone</span>
        </div>
        <div className="field">
          <label>Time zone</label>
          <select className="select" value={tzDraft} onChange={(e) => setTzDraft(e.target.value)}>
            <option value="">Device default</option>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      </section>

      {/* Daily Reminders */}
      <section className="acct-card">
        <div className="acct-card-head">
          <span className="eyebrow"><span className="slash">/</span>Daily Reminders</span>
          <button className="btn btn-red btn-sm" type="button" onClick={addReminder}>
            <Icons.Plus size={14} />Add Reminder
          </button>
        </div>
        {rDraft.length === 0 && <div className="acct-empty">No reminders yet. Add one to show it on your list.</div>}
        <div className="acct-rem-list">
          {rDraft.map((r, i) => (
            <div className="acct-rem-row" key={i}>
              <div className="acct-rem-move">
                <button type="button" onClick={() => moveReminder(i, -1)} disabled={i === 0} aria-label="Move up" title="Move up">
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15" /></svg>
                </button>
                <button type="button" onClick={() => moveReminder(i, 1)} disabled={i === rDraft.length - 1} aria-label="Move down" title="Move down">
                  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                </button>
              </div>
              <input className="inp" value={r} placeholder="Reminder text…" onChange={(e) => editReminder(i, e.target.value)} />
              <button className="btn btn-ghost btn-sm" type="button" onClick={() => removeReminder(i)} aria-label="Remove reminder" title="Remove"><Icons.Trash size={14} /></button>
            </div>
          ))}
        </div>
      </section>

      {/* Quote of the Time */}
      <section className="acct-card">
        <div className="acct-card-head">
          <span className="eyebrow"><span className="slash">/</span>Quote of the Time</span>
        </div>
        <div className="field">
          <label>Quote</label>
          <textarea value={qDraft.text} placeholder="The quote to feature on your list…" onChange={(e) => setQDraft((q) => ({ ...q, text: e.target.value }))} />
        </div>
        <div className="field">
          <label>Author <span className="acct-optional">(optional)</span></label>
          <input className="inp" value={qDraft.author} placeholder="Who said it" onChange={(e) => setQDraft((q) => ({ ...q, author: e.target.value }))} />
        </div>
      </section>

      {/* Sign out */}
      <section className="acct-card">
        <button className="btn btn-ghost acct-signout" type="button" onClick={onSignOut}>
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign out
        </button>
      </section>

      <p className="acct-note" style={{ textAlign: "center" }}>
        Build {process.env.NEXT_PUBLIC_BUILD_TIME
          ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString()
          : "dev"}
      </p>
    </>
  );
}
