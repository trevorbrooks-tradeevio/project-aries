"use client";

/* Goals — long-range goals grouped by category. Each group is its own
   rounded card ("pill") with a rich-text body: view mode renders the saved
   HTML, edit mode swaps in the shared RichText editor (same one the task
   detail panel uses) plus an editable title. Groups can be added and
   deleted, and everything persists through useCloudState ("goalGroups"),
   so it syncs across devices like tasks and notes.

   Future (per Trevor): a progress tracker per group/goal. The GoalGroup
   model carries an id specifically so tracker state can hang off it later
   without a data migration. */

import { useState } from "react";
import { RichText } from "./RichText";
import { Icons } from "./Icons";
import { useCloudState } from "../_lib/cloudState";
import type { GoalGroup } from "../_lib/types";

/* Previous static content, converted to the seeded rich-text model. */
const SEED_GROUPS: GoalGroup[] = [
  {
    id: "g-travel",
    title: "Travel",
    body: "<ul><li>South Korea</li><li>Ireland</li><li>Portugal</li><li>Caribbean Island</li></ul>",
  },
  {
    id: "g-financial",
    title: "Investment & Financial",
    body: "<ul><li>One property</li><li>Double Roth IRA</li><li>$500,000 in revenue</li></ul>",
  },
  {
    id: "g-personal",
    title: "Personal",
    body: "<ul><li>Build relationships</li><li>Read/listen</li><li>One book a month</li><li>One blog a week</li><li>Seven hours of sleep</li></ul>",
  },
];

const newId = () => "g-" + Math.random().toString(36).slice(2, 9);

export function GoalsView() {
  const [groups, setGroups] = useCloudState<GoalGroup[]>("goalGroups", SEED_GROUPS);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Draft state while a card is in edit mode (committed on Done).
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const startEdit = (g: GoalGroup) => {
    setEditingId(g.id);
    setDraftTitle(g.title);
    setDraftBody(g.body);
  };

  const commitEdit = () => {
    if (!editingId) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === editingId ? { ...g, title: draftTitle.trim() || "Untitled", body: draftBody } : g
      )
    );
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const addGroup = () => {
    const g: GoalGroup = { id: newId(), title: "New group", body: "<ul><li></li></ul>" };
    setGroups((prev) => [...prev, g]);
    startEdit(g);
  };

  const deleteGroup = (id: string) => {
    if (!window.confirm("Delete this goal group?")) return;
    setGroups((prev) => prev.filter((g) => g.id !== id));
    if (editingId === id) setEditingId(null);
  };

  return (
    <>
      <div className="view-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <span className="eyebrow"><span className="slash">/</span>Focus</span>
          <h1 className="view-title">Goals</h1>
        </div>
        <button className="btn btn-red" type="button" onClick={addGroup}>
          <Icons.Plus size={15} />Add Group
        </button>
      </div>

      <div className="goal-grid">
        {groups.map((g) => {
          const editing = editingId === g.id;
          return (
            <div key={g.id} className="goal-card">
              <div className="goal-card-head">
                {editing ? (
                  <input
                    className="goal-title-input"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                    aria-label="Group title"
                    autoFocus
                  />
                ) : (
                  <h2 className="goal-title">{g.title}</h2>
                )}
                <div className="goal-actions">
                  {editing ? (
                    <>
                      <button type="button" onClick={commitEdit} aria-label="Done" title="Done"><Icons.Check size={14} /></button>
                      <button type="button" onClick={cancelEdit} aria-label="Cancel" title="Cancel"><Icons.X size={14} /></button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => startEdit(g)} aria-label="Edit" title="Edit"><Icons.Edit size={14} /></button>
                      <button type="button" onClick={() => deleteGroup(g.id)} aria-label="Delete" title="Delete"><Icons.Trash size={14} /></button>
                    </>
                  )}
                </div>
              </div>

              {editing ? (
                <RichText key={g.id} value={draftBody} onChange={setDraftBody} placeholder="Add goals…" />
              ) : (
                <div
                  className="goal-body"
                  // Own-device content authored via the RichText editor
                  // (same trust model as task detail notes).
                  dangerouslySetInnerHTML={{ __html: g.body }}
                />
              )}
            </div>
          );
        })}

        {groups.length === 0 && (
          <div className="list-empty">No goal groups yet. Add one to get started.</div>
        )}
      </div>
    </>
  );
}
