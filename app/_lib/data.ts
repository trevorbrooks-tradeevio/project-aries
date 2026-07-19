import type { DashData, CalendarEvent, CalendarEvents } from "./types";

/**
 * Recurring work / New Elevation meetings, generated from the current week
 * through the end of 2026. These are Teams meetings, tagged `outlook` (blue).
 * Recurrence rules:
 *   - Any Store Daily Standup + Pre Sales Daily: weekdays (Mon–Fri)
 *   - Trevor/Joseph Weekly: Thursdays
 *   - Pre-Sales Intake Call: Tuesdays & Thursdays
 *   - Builder Steer Co / Progress Update (FSA): Tuesdays, 3:00–3:30
 *   - Algolia + New Elevation: one-time (Wed Jul 22, 2026)
 */
function buildWorkEvents(): CalendarEvents {
  const map: CalendarEvents = {};
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const add = (key: string, ev: CalendarEvent) => { (map[key] ||= []).push(ev); };

  const start = new Date(2026, 6, 19); // Sun Jul 19, 2026
  const end = new Date(2026, 11, 31);  // Thu Dec 31, 2026
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dow = d.getDay(); // 0 Sun … 6 Sat
    const key = iso(d);
    if (dow >= 1 && dow <= 5) {
      add(key, { title: "Any Store - Daily Standup", time: "11:00", src: "outlook" });
      add(key, { title: "Pre Sales - Daily", time: "11:15", src: "outlook" });
    }
    if (dow === 4) add(key, { title: "Trevor/Joseph Weekly", time: "10:00", src: "outlook" });
    if (dow === 2 || dow === 4) add(key, { title: "Pre-Sales - Intake Call", time: "15:00", src: "outlook" });
    if (dow === 2) add(key, { title: "Builder Steer Co / Progress Update (FSA)", time: "15:00", src: "outlook" });
    if (dow === 2) add(key, { title: "Jenna / Trevor TB (FSA)", time: "14:30", src: "outlook" });
    if (dow === 2) add(key, { title: "Builder Migration Weekly TB (FSA)", time: "12:00", src: "outlook" });
  }

  // One-off (not recurring)
  add("2026-07-22", { title: "Algolia + New Elevation", time: "14:30", src: "outlook" });

  // Sort each day's events by time.
  for (const key of Object.keys(map)) map[key]!.sort((a, b) => a.time.localeCompare(b.time));
  return map;
}

/**
 * Seed data — used only the first time the dashboard loads on a given
 * browser (see storage.ts). Ported from the original design-system export;
 * `dateCompleted` is added explicitly (the source seed omitted it).
 */
export const SEED_DATA: DashData = {
  user: { name: "Project Aries", role: "Personal", initials: "PA" },

  quote: { text: "Everybody dies, but not everyone lives.", author: "" },

  reminders: [
    "Finance: Invest, Save, Repeat",
    "Act with Courage",
    "Wake up at 7 AM",
    "Sweat every day",
  ],

  tasks: [
    { id: "t1", title: "OpenClaw — Personal AI Assistant", date: "", status: "open", archived: false, tag: "personal",
      description: "<p>OpenClaw — The AI that actually does things. Your personal assistant on any device.</p><p><a href=\"https://openclaw.ai\">openclaw.ai</a></p>", notes: "", dateCompleted: null },
    { id: "t2", title: "Determine your hourly rate for different clients", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t3", title: "Study for the Google Cert Class", date: "", status: "open", archived: false, tag: "personal", description: "", notes: "", dateCompleted: null },
    { id: "t4", title: "Create a Personal App with its own AI", date: "", status: "open", archived: false, tag: "personal", description: "", notes: "", dateCompleted: null },
    { id: "t5", title: "Attach the business skills to the Claude instance", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t6", title: "Create the monthly reporting", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t7", title: "KGG Monthly Status Report and Information Radar Website", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t8", title: "create the article from the Section video", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t9", title: "Finish Ethos: https://agent.askethos.com/pollen/agent/dashboard", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t10", title: "Add the New Elevation Articles for your resume:", date: "", status: "open", archived: false, tag: "personal", description: "", notes: "", dateCompleted: null },
    { id: "t11", title: "Conversation Skilll for context", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t12", title: "JIRA Skill for Comcast", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t13", title: "Look into Glean: https://www.glean.com/", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t14", title: "Rohit to create a Runbook for the KGG to do an overview of the security recommendations from Jostens and then apply to KGG", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t15", title: "Update the onboarding document for the credentials for the tools", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t16", title: "Claude Training Course", date: "", status: "open", archived: false, tag: "personal", description: "", notes: "", dateCompleted: null },
    { id: "t17", title: "Add the Perf test result tickets", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t18", title: "Update the bullet points on the NE Site", date: "", status: "open", archived: false, tag: "work", description: "", notes: "", dateCompleted: null },
    { id: "t19", title: "Google AI Certification", date: "", status: "open", archived: false, tag: "personal", description: "", notes: "", dateCompleted: null },
  ],

  notes: [
    { id: "n1", title: "Square → Chase cutover", pinned: true, updated: "2025-07-09T14:20:00", body: "Square flagged terms violation: card-not-present on service payments. KGG does not sell prescriptions.\n\nPlan: move off Square, use Chase (authorize.net). Deadline 6/25 for the website integration. In-person payments are the higher priority right now." },
    { id: "n2", title: "AnyStore positioning", pinned: false, updated: "2025-07-08T09:05:00", body: "Composable Solutions. Experts Only.\n\nAnyCommerce / AnySearch / AnyCMS / AnyMobile. Lead with MACH + AEO. The reader is a director-or-above enterprise buyer — do not explain fundamentals." },
    { id: "n3", title: "Workshop outline", pinned: false, updated: "2025-07-06T16:40:00", body: "1. AI coding environment setup (Cursor, Copilot, Claude Code)\n2. Custom prompt libraries & rule configs\n3. Team onboarding\n4. Ongoing troubleshooting\n5. Cost & productivity benchmarking" },
    { id: "n4", title: "Q3 goals", pinned: false, updated: "2025-07-01T11:00:00", body: "Ship 3 client sites. Stand up the marketing agent blog pipeline end to end. Close 2 AI-agent engagements." },
  ],

  goals: [
    { id: "g1", text: "Ship 3 client sites this quarter", note: "AnyStore, KGG, and one inbound." },
    { id: "g2", text: "Close 2 AI-agent engagements", note: "" },
    { id: "g3", text: "Stand up the marketing blog pipeline end to end", note: "" },
    { id: "g4", text: "Wake up at 7 AM, sweat every day", note: "Non-negotiable." },
    { id: "g5", text: "Read 12 books this year", note: "" },
    { id: "g6", text: "Invest, save, repeat — every month", note: "" },
  ],

  // Calendar events keyed by ISO date — real recurring work / New Elevation
  // Teams meetings, generated through the end of 2026 (see buildWorkEvents).
  events: buildWorkEvents(),
};
