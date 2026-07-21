export type TaskStatus = "open" | "progress" | "blocked" | "done";
export type TaskTag = "work" | "personal";

export type Task = {
  id: string;
  title: string;
  date: string; // "" | "YYYY-MM-DD"
  status: TaskStatus;
  archived: boolean;
  tag: TaskTag;
  description: string; // HTML string (RichText)
  notes: string;
  dateCompleted: string | null;
  backlog?: boolean; // true = lives in the Backlog list, not the main dashboard
};

export type Note = {
  id: string;
  title: string;
  pinned: boolean;
  updated: string; // ISO datetime
  body: string; // plain text, \n-delimited
};

export type Goal = {
  id: string;
  text: string;
  note: string;
};

/* Goals view: one card per category. `body` is HTML from the RichText
   editor. The id exists so future tracker state (progress per group/goal)
   can attach to a stable key without a data migration. */
export type GoalGroup = {
  id: string;
  title: string;
  body: string; // HTML string (RichText)
};

export type CalendarEventSource = "google" | "outlook" | "task";

export type CalendarEvent = {
  title: string;
  time: string; // "H:MM" 24h
  src: CalendarEventSource;
};

export type CalendarEvents = Record<string, CalendarEvent[]>; // keyed by ISO date

export type User = {
  name: string;
  role: string;
  initials: string;
};

export type DashData = {
  user: User;
  quote: { text: string; author: string };
  reminders: string[];
  tasks: Task[];
  notes: Note[];
  goals: Goal[];
  events: CalendarEvents;
};

export type Quote = { text: string; author: string };

/** Editable profile shown on the account block. `avatar` is a small data-URL
    (resized on upload) or null to fall back to initials. */
export type Profile = { name: string; role: string; avatar: string | null };

export type View = "list" | "backlog" | "notes" | "calendar" | "goals" | "budget" | "diet" | "account";

export type FocusTarget = { type: "task" | "note" | "goal"; id: string } | null;
