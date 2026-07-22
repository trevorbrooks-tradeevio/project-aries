"use client";

/* Two-pane notes: searchable/pinnable titles list (left) + editor (right)
   with autosave feel, edited timestamps, and a live word count. */

import { useEffect, useRef, useState } from "react";
import { Icons } from "./Icons";
import type { Note } from "../_lib/types";

const relTime = (iso: string) => {
  if (!iso) return "just now";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const wordCount = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

function highlight(text: string, q: string) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}
    </>
  );
}

type NotesViewProps = {
  notes: Note[];
  setNotes: (updater: Note[] | ((prev: Note[]) => Note[])) => void;
  focusId?: string | null;
  onFocusConsumed?: () => void;
};

export function NotesView({ notes, setNotes, focusId, onFocusConsumed }: NotesViewProps) {
  const [activeId, setActiveId] = useState<string | null>(notes[0]?.id ?? null);
  const [savedAt, setSavedAt] = useState("Saved");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (focusId) { setActiveId(focusId); setQ(""); setView("list"); onFocusConsumed?.(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const active = notes.find((n) => n.id === activeId) || null;

  const nowIso = () => new Date().toISOString().slice(0, 19);
  const touchSave = () => {
    setSavedAt("Saving…");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSavedAt("Saved"), 700);
  };
  const update = (patch: Partial<Note>) => { setNotes((prev) => prev.map((n) => (n.id === activeId ? { ...n, ...patch, updated: nowIso() } : n))); touchSave(); };
  const togglePin = (id: string) => setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  const addNote = () => {
    const n: Note = { id: "n" + Date.now(), title: "Untitled note", body: "", pinned: false, updated: nowIso() };
    setNotes((prev) => [n, ...prev]);
    setActiveId(n.id);
    setQ("");
  };
  const del = (id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      if (id === activeId) setActiveId(next[0]?.id ?? null);
      return next;
    });
  };

  const filtered = notes.filter((n) =>
    !q || n.title.toLowerCase().includes(q.toLowerCase()) || n.body.toLowerCase().includes(q.toLowerCase())
  );
  const ordered = [...filtered].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <>
      <div className="view-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow"><span className="slash">/</span>Workspace</span>
          <h1 className="view-title">Notes</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="seg" style={{ borderColor: "var(--border-strong)" }}>
            <button type="button" className={view === "list" ? "on" : ""} style={view !== "list" ? { color: "var(--text-3)" } : undefined} onClick={() => setView("list")} aria-label="List view"><Icons.List size={14} /></button>
            <button type="button" className={view === "grid" ? "on" : ""} style={view !== "grid" ? { color: "var(--text-3)" } : undefined} onClick={() => setView("grid")} aria-label="Grid view"><Icons.Grid size={14} /></button>
          </div>
          <button className="btn btn-red" onClick={addNote} type="button"><Icons.Plus size={15} />New Note</button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="notes-gallery-wrap" style={{ height: "calc(100% - 78px)" }}>
          <div className="note-search">
            <Icons.Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" />
            {q && <button className="close-x" style={{ fontSize: 16, padding: 0 }} onClick={() => setQ("")} aria-label="Clear" type="button">×</button>}
          </div>
          {ordered.length === 0 ? (
            <div className="notes-empty">{q ? <>No notes match &ldquo;{q}&rdquo;.</> : "No notes yet. Create one to get started."}</div>
          ) : (
            <div className="notes-gallery">
              {ordered.map((n) => (
                <button
                  key={n.id}
                  className={"note-card" + (n.pinned ? " pinned" : "")}
                  onClick={() => { setActiveId(n.id); setView("list"); }}
                  type="button"
                >
                  <div className="nc-page">
                    <div className="nc-title">{highlight(n.title || "Untitled", q)}</div>
                    <div className="nc-body">{n.body ? n.body.replace(/\n/g, " ") : "No content yet"}</div>
                    {n.pinned && <span className="nc-pin"><Icons.Pin size={13} /></span>}
                  </div>
                  <div className="nc-meta">Edited {relTime(n.updated)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="notes-wrap" style={{ height: "calc(100% - 78px)" }}>
        <div className="notes-list">
          <div className="note-search">
            <Icons.Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" />
            {q && <button className="close-x" style={{ fontSize: 16, padding: 0 }} onClick={() => setQ("")} aria-label="Clear" type="button">×</button>}
          </div>
          {ordered.length === 0 && <div className="notes-empty">No notes match &ldquo;{q}&rdquo;.</div>}
          {ordered.map((n) => (
            <button key={n.id} className={"note-item" + (n.id === activeId ? " active" : "") + (n.pinned ? " pinned" : "")} onClick={() => setActiveId(n.id)} type="button">
              <div className="ni-top">
                <div className="ni-title">{highlight(n.title || "Untitled", q)}</div>
                {n.pinned && <span className="ni-pin"><Icons.Pin size={13} /></span>}
              </div>
              <div className="ni-prev">{n.body ? n.body.replace(/\n/g, " ") : "No content yet"}</div>
              <div className="ni-meta">Edited {relTime(n.updated)}</div>
            </button>
          ))}
        </div>

        <div className="note-editor">
          {active ? (
            <>
              <div className="ne-top">
                <input className="ne-title" value={active.title} onChange={(e) => update({ title: e.target.value })} placeholder="Note title" />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className="autosave"><span className="dot" />{savedAt}</span>
                </div>
              </div>
              <textarea className="ne-body" value={active.body} onChange={(e) => update({ body: e.target.value })} placeholder="Start writing…" />
              <div className="ne-foot">
                <span className="ne-stats">{wordCount(active.body)} words · edited {relTime(active.updated)}</span>
                <div className="ne-actions">
                  <button className={"pin-btn" + (active.pinned ? " on" : "")} onClick={() => togglePin(active.id)} type="button">
                    <Icons.Pin size={14} />{active.pinned ? "Pinned" : "Pin"}
                  </button>
                  <button className="pin-btn" onClick={() => del(active.id)} aria-label="Delete note" type="button"><Icons.Trash size={14} /></button>
                </div>
              </div>
            </>
          ) : (
            <div className="list-empty" style={{ margin: "auto" }}>No note selected. Create one to get started.</div>
          )}
        </div>
      </div>
      )}
    </>
  );
}
