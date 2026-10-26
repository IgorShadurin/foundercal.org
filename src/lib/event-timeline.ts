export type TimelineKey = "application_open" | "application_close" | "program_start" | "program_end" | "demo_day";

/** Prefer a milestone in the requested window before falling back to a known date. */
export function selectTimeline(
  dates: Partial<Record<TimelineKey, Date>>,
  priority: readonly TimelineKey[],
  window: { start: Date; end: Date },
) {
  for (const key of priority) {
    const date = dates[key];
    if (date && date >= window.start && date <= window.end) return { key, date };
  }
  for (const key of priority) {
    const date = dates[key];
    if (date) return { key, date };
  }
  return null;
}
