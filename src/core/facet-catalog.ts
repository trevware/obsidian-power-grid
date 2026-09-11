import { isDateProperty } from "./dates";
import type { ClippingRecord } from "./scan";

/**
 * Which frontmatter properties are worth offering as filter facets.
 *
 * Pure, no DOM and no Obsidian: the settings tab renders what this returns.
 */

/** Free text, or plugin plumbing. Never suggested, but the settings list
    still shows them, so a user who wants one can add it by hand. */
const RESERVED = new Set(["title", "description", "source", "cover", "grid", "media"]);

const MIN_DISTINCT = 2;
const MAX_DISTINCT = 50;
/**
 * Occurrences per distinct value. Below this the values barely recur, so
 * grouping by them puts almost every clipping in its own bucket: an author
 * field with sixteen authors across sixteen notes scores 1.00 and is no use
 * as a facet, however much you might want it.
 */
const MIN_REPETITION = 1.5;

export interface PropertyStat {
  key: string;
  /** Records carrying the key at all. */
  notes: number;
  /** Total values across those records; a list contributes each entry. */
  occurrences: number;
  distinct: number;
  suggested: boolean;
}

export function surveyProperties(records: ClippingRecord[]): PropertyStat[] {
  const notes = new Map<string, number>();
  const occurrences = new Map<string, number>();
  const values = new Map<string, Set<string>>();

  for (const record of records) {
    for (const [key, list] of Object.entries(record.properties)) {
      if (list.length === 0) continue;
      notes.set(key, (notes.get(key) ?? 0) + 1);
      occurrences.set(key, (occurrences.get(key) ?? 0) + list.length);
      let seen = values.get(key);
      if (!seen) {
        seen = new Set<string>();
        values.set(key, seen);
      }
      for (const value of list) seen.add(value);
    }
  }

  const stats: PropertyStat[] = [];
  for (const [key, seen] of values) {
    const distinct = seen.size;
    const total = occurrences.get(key) ?? 0;
    // A date is judged on distinct values alone. The rules below exist to
    // reject properties whose values barely recur, because grouping by them
    // puts almost every clipping in its own bucket; bucketing does that
    // grouping for a date, so a published date that is unique per clipping
    // still collapses to five groups and is worth offering.
    const suggested = RESERVED.has(key)
      ? false
      : isDateProperty(seen)
        ? distinct >= MIN_DISTINCT
        : distinct >= MIN_DISTINCT &&
          distinct <= MAX_DISTINCT &&
          total / distinct >= MIN_REPETITION;
    stats.push({ key, notes: notes.get(key) ?? 0, occurrences: total, distinct, suggested });
  }

  // Suggested first, then the most widely used, then alphabetically so the
  // order is stable between openings rather than shuffling as counts tie.
  return stats.sort(
    (a, b) =>
      Number(b.suggested) - Number(a.suggested) ||
      b.notes - a.notes ||
      a.key.localeCompare(b.key)
  );
}

/**
 * The properties worth offering for one of the two tile corners.
 *
 * Dates for the top corner and everything else for the bottom, split by what
 * the values actually look like rather than by the key's name. The current
 * choice is kept at the head even when it no longer survives the survey, so
 * a corner set months ago still shows what it is set to instead of reading
 * as unset.
 */
export function slotCandidates(
  records: ClippingRecord[],
  dates: boolean,
  current: string
): string[] {
  const byKey = new Map<string, Set<string>>();
  for (const record of records) {
    for (const [key, list] of Object.entries(record.properties)) {
      if (list.length === 0) continue;
      let seen = byKey.get(key);
      if (!seen) byKey.set(key, (seen = new Set()));
      for (const value of list) seen.add(value);
    }
  }

  const keys = surveyProperties(records)
    .map((stat) => stat.key)
    .filter((key) => isDateProperty(byKey.get(key) ?? []) === dates);

  if (current && !keys.includes(current)) keys.unshift(current);
  return keys;
}
