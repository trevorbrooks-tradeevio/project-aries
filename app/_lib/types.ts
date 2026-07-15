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

export type CalendarEventSource = "google" | "outlook";

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

export type View = "list" | "notes" | "calendar" | "goals";

export type FocusTarget = { type: "task" | "note" | "goal"; id: string } | null;
