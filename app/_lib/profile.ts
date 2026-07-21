import type { Profile } from "./types";
import { SEED_DATA } from "./data";

/** Seed for the editable profile — starts from the static seed user. */
export const DEFAULT_PROFILE: Profile = {
  name: SEED_DATA.user.name,
  role: SEED_DATA.user.role,
  avatar: null,
};

/** Two-letter fallback initials derived from a display name. */
export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
