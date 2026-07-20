"use client";

/* List view — task rows with manual drag-reorder, filter bar (order & numbers
   hold), Active/Archived toggle, quick-add, inline title edit, inline status
   dropdown, Personal/Work tags, per-row edit/archive/delete, a full detail
   editor (rich-text description) that slides in from the right, plus the
   Quote-of-the-Time banner + Daily Reminders. */

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icons } from "./Icons";
import { RichText } from "./RichText";
import type { Task, TaskStatus, TaskTag as TaskTagType } from "../_lib/types";

const STATUS_LABEL: Record<TaskStatus, string> = { open: "Open", progress: "In Progress", blocked: "Blocked", done: "Completed" };

const fmtDate = (iso: string) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const today = () => new Date().toISOString().slice(0, 10);

function StatusChip({ status }: { status: TaskStatus }) {
  const cls = status === "done" ? "done" : status === "progress" ? "progress" : status === "blocked" ? "blocked" : "open";
  return <span className={"chip " + cls}><span className="dot" />{STATUS_LABEL[status]}</span>;
}

function StatusSelect({ status, onChange }: { status: TaskStatus; onChange: (s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="status-select" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button className="status-trigger" onClick={() => setOpen((o) => !o)} title="Change status" type="button">
        <StatusChip status={status} />
        <span className="chev"><Icons.ChevD size={13} /></span>
      </button>
      {open && (
        <div className="status-menu">
          {(["open", "progress", "blocked", "done"] as const).map((s) => (
            <button key={s} className="status-opt" type="button" onClick={() => { onChange(s); setOpen(false); }}>
              <StatusChip status={s} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskTag({ tag }: { tag: TaskTagType }) {
  const t = tag === "personal" ? "personal" : "work";
  return <span className={"tag " + t}>{t === "work" ? "Work" : "Personal"}</span>;
}

type ListViewProps = {
  tasks: Task[];
  setTasks: (updater: Task[] | ((prev: Task[]) => Task[])) => void;
  quote?: { text: string; author: string };
  reminders?: string[];
  focusId?: string | null;
  onFocusConsumed?: () => void;
  /** "dashboard" (default) shows non-backlog tasks; "backlog" shows only
      backlog tasks. Each mode gets a button to send a task to the other list. */
  mode?: "dashboard" | "backlog";
};

export function ListView({ tasks, setTasks, quote = { text: "", author: "" }, reminders = [], focusId, onFocusConsumed, mode = "dashboard" }: ListViewProps) {
  const isBacklog = mode === "backlog";
  const [statusF, setStatusF] = useState<TaskStatus | "all">("all");
  const [fromD, setFromD] = useState("");
  const [toD, setToD] = useState("");
  const [sortBy, setSortBy] = useState<"manual" | "date" | "status">("manual");
  const [showArchived, setShowArchived] = useState(false);
  const [selId, setSelId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Task | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [quickDate, setQuickDate] = useState("");
  const [quickTag, setQuickTag] = useState<TaskTagType>("work");
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const dragId = useRef<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);

  useEffect(() => { setPortalEl(document.getElementById("appFrame")); }, []);

  const posOf = useMemo(() => {
    const m: Record<string, number> = {};
    let i = 0;
    tasks.forEach((t) => {
      if (isBacklog ? !t.backlog : !!t.backlog) return;
      m[t.id] = ++i;
    });
    return m;
  }, [tasks, isBacklog]);
  const reorderEnabled = sortBy === "manual" && statusF === "all" && !fromD && !toD && !showArchived;

  let display = tasks.filter((t) => {
    if (isBacklog ? !t.backlog : !!t.backlog) return false;
    if (showArchived ? !t.archived : t.archived) return false;
    if (statusF !== "all" && t.status !== statusF) return false;
    if (fromD && t.date < fromD) return false;
    if (toD && t.date > toD) return false;
    return true;
  });
  if (sortBy === "date") display = [...display].sort((a, b) => a.date.localeCompare(b.date));
  else if (sortBy === "status") {
    const rank: Record<TaskStatus, number> = { progress: 0, blocked: 1, open: 2, done: 3 };
    display = [...display].sort((a, b) => rank[a.status] - rank[b.status]);
  }

  const filterActive = statusF !== "all" || !!fromD || !!toD || sortBy !== "manual";

  const onDragStart = (id: string) => (e: React.DragEvent) => { if (!reorderEnabled) return; dragId.current = id; setDragging(id); e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (id: string) => (e: React.DragEvent) => { if (!reorderEnabled || dragId.current == null) return; e.preventDefault(); setDropId(id); };
  const onDrop = (id: string) => (e: React.DragEvent) => {
    if (!reorderEnabled || dragId.current == null) return;
    e.preventDefault();
    const from = dragId.current;
    if (from === id) { reset(); return; }
    setTasks((prev) => { const arr = [...prev]; const fi = arr.findIndex((t) => t.id === from); const [moved] = arr.splice(fi, 1); const ti = arr.findIndex((t) => t.id === id); arr.splice(ti, 0, moved!); return arr; });
    reset();
  };
  const reset = () => { dragId.current = null; setDragging(null); setDropId(null); };

  // Up/down reorder (mobile-friendly alternative to drag). Swaps a task with
  // its neighbor in the displayed order, applied to the underlying array.
  const moveTask = (id: string, dir: -1 | 1) => {
    if (!reorderEnabled) return;
    const di = display.findIndex((t) => t.id === id);
    const nj = di + dir;
    if (di < 0 || nj < 0 || nj >= display.length) return;
    const neighborId = display[nj]!.id;
    setTasks((prev) => {
      const arr = [...prev];
      const a = arr.findIndex((t) => t.id === id);
      const b = arr.findIndex((t) => t.id === neighborId);
      if (a < 0 || b < 0) return prev;
      [arr[a], arr[b]] = [arr[b]!, arr[a]!];
      return arr;
    });
  };

  const openDetail = (t: Task) => { setSelId(t.id); setDraft({ ...t }); setIsNew(false); };

  useEffect(() => {
    if (focusId) { const t = tasks.find((x) => x.id === focusId); if (t) openDetail(t); onFocusConsumed?.(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId]);

  const openNew = () => {
    setDraft({ id: "t" + Date.now(), title: "", date: today(), status: "open", description: "", notes: "", dateCompleted: null, archived: false, tag: "work", backlog: isBacklog });
    setIsNew(true);
    setSelId("new");
  };
  const closeDetail = () => { setSelId(null); setDraft(null); setIsNew(false); };
  const saveDraft = () => {
    if (!draft || !draft.title.trim()) return;
    const clean = { ...draft };
    if (clean.status === "done" && !clean.dateCompleted) clean.dateCompleted = today();
    if (clean.status !== "done") clean.dateCompleted = null;
    setTasks((prev) => (isNew ? [...prev, clean] : prev.map((t) => (t.id === clean.id ? clean : t))));
    closeDetail();
  };
  const deleteDraft = () => { if (!draft) return; setTasks((prev) => prev.filter((t) => t.id !== draft.id)); closeDetail(); };
  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  // Move a task between the main dashboard list and the backlog. In backlog
  // mode this sends it to the dashboard; in dashboard mode it sends it down to
  // the backlog. New arrivals go to the top of their destination list.
  const moveToOtherList = (id: string) =>
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx < 0) return prev;
      const arr = [...prev];
      const [moved] = arr.splice(idx, 1);
      arr.unshift({ ...moved!, backlog: !isBacklog });
      return arr;
    });
  const toggleArchive = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, archived: !t.archived } : t)));
  const setStatus = (id: string, s: TaskStatus) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: s, dateCompleted: s === "done" ? (t.dateCompleted || today()) : null } : t)));

  const startEdit = (t: Task) => { setEditingId(t.id); setEditTitle(t.title); };
  const commitEdit = () => {
    if (editingId && editTitle.trim()) setTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, title: editTitle.trim() } : t)));
    setEditingId(null);
    setEditTitle("");
  };

  const addQuick = () => {
    if (!quickTitle.trim()) return;
    const t: Task = { id: "t" + Date.now(), title: quickTitle.trim(), date: quickDate || today(), status: "open", description: "", notes: "", dateCompleted: null, archived: false, tag: quickTag, backlog: isBacklog };
    setTasks((prev) => [t, ...prev]);
    setQuickTitle("");
    setQuickDate("");
  };

  const panelOpen = selId != null && draft != null;

  const panelUI = (
    <>
      <div className={"overlay" + (panelOpen ? " show" : "")} onClick={closeDetail} />
      {draft && (
        <div className={"panel" + (panelOpen ? " show" : "")}>
          <div className="panel-head">
            <span className="ph-title">{isNew ? "New Task" : "Task Detail"}</span>
            <button className="close-x" onClick={closeDetail} aria-label="Close" type="button">×</button>
          </div>
          <div className="panel-body">
            <div className="field">
              <label>Title</label>
              <input className="inp" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="What needs doing?" />
            </div>
            <div className="field">
              <label>Description</label>
              <RichText key={draft.id} value={draft.description || ""} onChange={(html) => setDraft({ ...draft, description: html })} placeholder="Add detail… use the toolbar to format" />
            </div>
            <div className="field">
              <label>Tag</label>
              <div className="fb-seg" style={{ width: "fit-content" }}>
                <button type="button" className={(draft.tag || "work") === "personal" ? "on" : ""} onClick={() => setDraft({ ...draft, tag: "personal" })}>Personal</button>
                <button type="button" className={(draft.tag || "work") === "work" ? "on" : ""} onClick={() => setDraft({ ...draft, tag: "work" })}>Work</button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="field">
                <label>Date</label>
                <input className="inp" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
              </div>
              <div className="field">
                <label>Status</label>
                <select className="select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}>
                  <option value="open">Open</option>
                  <option value="progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Completed</option>
                </select>
              </div>
            </div>
            {draft.status === "done" && (
              <div className="field">
                <label>Date Completed</label>
                <input className="inp" type="date" value={draft.dateCompleted || today()} onChange={(e) => setDraft({ ...draft, dateCompleted: e.target.value })} />
              </div>
            )}
            <div className="field">
              <label>Notes</label>
              <textarea value={draft.notes || ""} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} placeholder="Private notes…" />
            </div>
          </div>
          <div className="panel-foot">
            <button className="btn btn-red" onClick={saveDraft} style={{ flex: 1, justifyContent: "center" }} type="button">{isNew ? "Add Task" : "Save"}</button>
            {!isNew && <button className="btn btn-ghost" onClick={() => toggleArchive(draft.id)} title={draft.archived ? "Unarchive" : "Archive"} type="button"><Icons.Archive size={15} /></button>}
            {!isNew && <button className="btn btn-ghost" onClick={deleteDraft} title="Delete" type="button"><Icons.Trash size={15} /></button>}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="view-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow"><span className="slash">/</span>{isBacklog ? "Not prioritized" : "Today"}</span>
          <h1 className="view-title">{isBacklog ? "Backlog" : "My List"}</h1>
        </div>
        <button className="btn btn-red" onClick={openNew} type="button"><Icons.Plus size={15} />Add Task</button>
      </div>

      {!isBacklog && reminders.length > 0 && (
        <div className="rem-block">
          <span className="eyebrow"><span className="slash">/</span>Daily Reminders</span>
          <div className="reminders">
            {reminders.map((r, i) => (<div className="reminder" key={i}><span className="rdot" /><span>{r}</span></div>))}
          </div>
        </div>
      )}

      {!isBacklog && (
        <div className="quote-banner">
          <div className="qlabel">Quote of the Time</div>
          <div className="qtext">&ldquo;{quote.text}&rdquo;</div>
          {quote.author && <div className="qauthor">— {quote.author}</div>}
        </div>
      )}

      <div className="filterbar">
        <span className="fb-label">Filter</span>
        <select className="select" value={statusF} onChange={(e) => setStatusF(e.target.value as TaskStatus | "all")}>
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Completed</option>
        </select>
        <input className="inp" type="date" value={fromD} onChange={(e) => setFromD(e.target.value)} aria-label="From date" />
        <span className="fb-label">to</span>
        <input className="inp" type="date" value={toD} onChange={(e) => setToD(e.target.value)} aria-label="To date" />
        <span className="fb-label" style={{ marginLeft: 4 }}>Sort</span>
        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value as "manual" | "date" | "status")}>
          <option value="manual">Manual order</option>
          <option value="date">Date</option>
          <option value="status">Status</option>
        </select>
        {/* Active/Archived view toggle lives on the Backlog only — the main
            dashboard list always shows active tasks. */}
        {isBacklog && (
          <div className="fb-seg">
            <button type="button" className={!showArchived ? "on" : ""} onClick={() => setShowArchived(false)}>Active</button>
            <button type="button" className={showArchived ? "on" : ""} onClick={() => setShowArchived(true)}>Archived</button>
          </div>
        )}
        {filterActive && <button className="btn btn-ghost btn-sm" type="button" onClick={() => { setStatusF("all"); setFromD(""); setToD(""); setSortBy("manual"); }}>Clear</button>}
        <span className="fb-note">
          {reorderEnabled ? <span>Drag to reorder</span> : <span><b>Reorder locked</b> — numbers hold</span>}
        </span>
      </div>

      {!showArchived && (
        <div className="qa-block">
          <span className="eyebrow"><span className="slash">/</span>Add Task</span>
          <div className="quick-add">
            <input className="qa-title" value={quickTitle} placeholder="Task title…" onChange={(e) => setQuickTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addQuick(); }} />
            <div className="fb-seg qa-tag">
              <button type="button" className={quickTag === "personal" ? "on" : ""} onClick={() => setQuickTag("personal")}>Personal</button>
              <button type="button" className={quickTag === "work" ? "on" : ""} onClick={() => setQuickTag("work")}>Work</button>
            </div>
            <input className="qa-date" type="date" value={quickDate} onChange={(e) => setQuickDate(e.target.value)} aria-label="Due date (optional)" />
            <button className="btn btn-red btn-sm" type="button" onClick={addQuick} disabled={!quickTitle.trim()} style={!quickTitle.trim() ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>Add</button>
          </div>
        </div>
      )}

      <div className="tasklist">
        {display.length === 0 && <div className="list-empty">{showArchived ? "No archived tasks." : isBacklog ? "Backlog is empty. Move lower-priority tasks here from your list." : "No tasks match this filter."}</div>}

        {display.map((t) => (
          <div
            key={t.id}
            className={"task-row" + (t.status === "done" ? " completed" : "") + (dragging === t.id ? " dragging" : "") + (dropId === t.id && dragging !== t.id ? " dropbefore" : "")}
            style={{ "--tag-accent": t.tag === "personal" ? "var(--success)" : "var(--pink)" } as React.CSSProperties}
            draggable={reorderEnabled && editingId !== t.id}
            onDragStart={onDragStart(t.id)}
            onDragOver={onDragOver(t.id)}
            onDrop={onDrop(t.id)}
            onDragEnd={reset}
            onClick={() => { if (editingId !== t.id) openDetail(t); }}
          >
            <div className="t-num">{posOf[t.id]}</div>
            <div className={"t-handle" + (reorderEnabled ? "" : " disabled")} onClick={(e) => e.stopPropagation()}><Icons.Drag size={16} /></div>
            <div className="t-main">
              {editingId === t.id ? (
                <input
                  className="t-title-input"
                  autoFocus
                  value={editTitle}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingId(null); }}
                  onBlur={commitEdit}
                />
              ) : (
                <div className="t-title">{t.title}</div>
              )}
            </div>
            <div className="t-meta">
              <TaskTag tag={t.tag} />
              <StatusSelect status={t.status} onChange={(s) => setStatus(t.id, s)} />
              <span className="t-date">{t.status === "done" && t.dateCompleted ? "✓ " + fmtDate(t.dateCompleted) : fmtDate(t.date)}</span>
            </div>
            <div className="t-actions" onClick={(e) => e.stopPropagation()}>
              {reorderEnabled && (
                <>
                  <button className="t-move" onClick={() => moveTask(t.id, -1)} disabled={display[0]?.id === t.id} aria-label="Move up" title="Move up" type="button">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15" /></svg>
                  </button>
                  <button className="t-move" onClick={() => moveTask(t.id, 1)} disabled={display[display.length - 1]?.id === t.id} aria-label="Move down" title="Move down" type="button">
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9" /></svg>
                  </button>
                </>
              )}
              <button
                onClick={() => moveToOtherList(t.id)}
                aria-label={isBacklog ? "Move to dashboard" : "Move to backlog"}
                title={isBacklog ? "Move to dashboard" : "Move to backlog"}
                type="button"
              >
                {isBacklog ? (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                ) : (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                )}
              </button>
              <button onClick={() => startEdit(t)} aria-label="Edit title" title="Edit title" type="button"><Icons.Edit size={14} /></button>
              <button onClick={() => toggleArchive(t.id)} aria-label={t.archived ? "Unarchive" : "Archive"} title={t.archived ? "Unarchive" : "Archive"} type="button"><Icons.Archive size={14} /></button>
              <button onClick={() => deleteTask(t.id)} aria-label="Delete task" title="Delete" type="button"><Icons.Trash size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {portalEl ? createPortal(panelUI, portalEl) : panelUI}
    </>
  );
}
