import type { DashData } from "./types";

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

  // Calendar events keyed by ISO date. Seed content is illustrative sample
  // data (originally authored around July 2025) — not tied to any real
  // connected calendar.
  events: {
    "2025-07-02": [{ title: "Standup", src: "google", time: "9:00" }],
    "2025-07-03": [{ title: "KGG payments call", src: "outlook", time: "11:00" }],
    "2025-07-08": [{ title: "Blog review", src: "google", time: "14:00" }, { title: "1:1 Sarah", src: "outlook", time: "16:00" }],
    "2025-07-09": [{ title: "QA sync", src: "google", time: "10:00" }],
    "2025-07-10": [{ title: "Backlog triage", src: "outlook", time: "13:00" }],
    "2025-07-14": [{ title: "AI workshop", src: "google", time: "10:00" }, { title: "Client demo", src: "google", time: "15:00" }, { title: "Retro", src: "outlook", time: "17:00" }],
    "2025-07-16": [{ title: "Vendor call", src: "outlook", time: "12:00" }],
    "2025-07-22": [{ title: "Sprint planning", src: "google", time: "9:30" }],
    "2025-07-25": [{ title: "Invoice run", src: "outlook", time: "11:00" }],
    "2025-07-29": [{ title: "Roadmap review", src: "google", time: "14:00" }],
  },
};
