import aliases from "../../data/research-aliases.json";
import type { EventRecord } from "./event-data";

export const BASE_URL = "https://foundercal.org";
export const CONTENT_UPDATED = "2026-10-27";
export function canonicalSlug(slug: string) {
  return (aliases as Record<string, string>)[slug] ?? slug;
}
export type Evidence = {
  value: string;
  source_url: string;
  checked_at: string;
};
export type ApplicationRound = {
  id: string;
  label: string;
  close_date: string;
  open_date?: string;
  closes_at?: string;
  timezone?: string;
  submitter_local?: boolean;
  source_url: string;
  checked_at: string;
};
export type ProgramFacts = {
  event_id: string;
  rolling?: Evidence;
  deadline?: {
    closes_at?: string;
    timezone?: string;
    submitter_local?: boolean;
    source_url: string;
    checked_at: string;
  };
  additional_rounds?: ApplicationRound[];
  eligibility?: Evidence;
  funding?: Evidence;
};
export type Program = {
  slug: string;
  name: string;
  organizer_id: string;
  organizer_name: string;
  status: "verified" | "needs_review" | "inactive" | "not_found";
  checked_at: string;
  summary: string;
  website: string | null;
  sources: NonNullable<EventRecord["sources"]>;
  notes: string[];
  cohorts: EventRecord[];
  facts?: ProgramFacts;
};
export function applicationRounds(
  event: EventRecord,
  facts?: ProgramFacts,
): ApplicationRound[] {
  const applicable = facts?.event_id === event.id ? facts : undefined;
  const primary = event.dates.application_close
    ? [
        {
          id: `${event.id}-application`,
          label: "Application deadline",
          close_date: event.dates.application_close,
          open_date: event.dates.application_open ?? undefined,
          timezone: event.dates.timezone ?? undefined,
          source_url:
            applicable?.deadline?.source_url ??
            event.sources?.[0]?.url ??
            event.website ??
            "",
          checked_at:
            applicable?.deadline?.checked_at ??
            event.last_checked_utc?.slice(0, 10) ??
            "",
          ...applicable?.deadline,
        },
      ]
    : [];
  return [...primary, ...(applicable?.additional_rounds ?? [])].sort((a, b) =>
    a.close_date.localeCompare(b.close_date),
  );
}
export function dateInZone(now: Date, timezone = "UTC") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function roundPassed(round: ApplicationRound, now: Date) {
  if (round.closes_at) return now.getTime() >= Date.parse(round.closes_at);
  // With no exact time, never invent a midnight cutoff. Submitter-local deadlines
  // remain uncertain until the date has ended everywhere (UTC-12).
  return dateInZone(now, round.timezone ?? "Etc/GMT+12") > round.close_date;
}
export function nextRound(
  event: EventRecord,
  facts: ProgramFacts | undefined,
  now: Date,
) {
  return applicationRounds(event, facts).find(
    (round) => !roundPassed(round, now),
  );
}
export function applicationState(
  program: Program,
  now: Date,
): { key: string; label: string; date?: string } {
  if (program.status === "inactive")
    return { key: "inactive", label: "Program inactive" };
  if (program.status !== "verified")
    return { key: "unknown", label: "Application status unconfirmed" };
  const rounds = program.cohorts
    .flatMap((e) => applicationRounds(e, program.facts))
    .sort((a, b) => a.close_date.localeCompare(b.close_date));
  const next = rounds.find((r) => !roundPassed(r, now));
  if (next) {
    const day = dateInZone(now, next.timezone ?? "UTC");
    if (next.open_date && day < next.open_date)
      return {
        key: "upcoming",
        label: "Applications open later",
        date: next.open_date,
      };
    if (!next.closes_at && day >= next.close_date)
      return {
        key: "check",
        label: "Deadline day — confirm cutoff time",
        date: next.close_date,
      };
    return {
      key: next.open_date ? "open" : "deadline",
      label: next.open_date
        ? "Application window open"
        : "Upcoming deadline — confirm availability",
      date: next.close_date,
    };
  }
  if (rounds.length)
    return {
      key: "closed",
      label: "Published application windows closed",
      date: rounds.at(-1)?.close_date,
    };
  if (
    program.facts?.rolling &&
    program.cohorts.some((e) => e.id === program.facts?.event_id)
  )
    return { key: "rolling", label: "Rolling applications" };
  return { key: "unknown", label: "No confirmed application deadline" };
}
// Availability takes precedence over alphabetic order or a distant deadline.
// Keep uncertain application forms distinct from confirmed open/rolling intake.
export function compareProgramsByRelevance(
  a: Program,
  b: Program,
  now: Date,
  aDate?: string,
  bDate?: string,
) {
  const left = applicationState(a, now);
  const right = applicationState(b, now);
  const priority = (program: Program, key: string) => {
    if (program.status === "not_found") return 6;
    if (key === "open" || key === "rolling") return 0;
    if (key === "deadline" || key === "check") return 1;
    if (key === "upcoming") return 2;
    if (key === "closed") return 4;
    if (key === "inactive") return 5;
    return 3;
  };
  const rank = priority(a, left.key) - priority(b, right.key);
  if (rank) return rank;
  // Among expired windows, the most recently closed one is most useful.
  const dateOrder =
    left.key === "closed" && right.key === "closed"
      ? (bDate ?? right.date ?? "").localeCompare(aDate ?? left.date ?? "")
      : (aDate ?? left.date ?? "9999").localeCompare(
          bDate ?? right.date ?? "9999",
        );
  return (
    dateOrder ||
    b.checked_at.localeCompare(a.checked_at) ||
    a.name.localeCompare(b.name) ||
    a.slug.localeCompare(b.slug)
  );
}
export function nextReviewDate(program: Program, now: Date) {
  const state = applicationState(program, now);
  const until = state.date
    ? (Date.parse(state.date) - now.getTime()) / 86400000
    : Infinity;
  const cadence = ["inactive", "not_found"].includes(program.status)
    ? 30
    : program.status === "needs_review" || state.key === "rolling"
      ? 7
      : until >= -1 && until <= 14 && state.key !== "closed"
        ? 1
        : ["open", "deadline", "upcoming"].includes(state.key)
          ? 7
          : 30;
  return new Date(Date.parse(program.checked_at) + cadence * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function isReviewDue(program: Program, now: Date) {
  return nextReviewDate(program, now) <= dateInZone(now);
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}
export function relatedPrograms(program: Program, all: Program[]) {
  const sectors = new Set(
    program.cohorts
      .flatMap((e) => e.categories.sectors)
      .filter((s) => s !== "general"),
  );
  return all
    .filter((p) => p.slug !== program.slug && p.status === "verified")
    .map((p) => ({
      p,
      score: p.cohorts.reduce(
        (n, e) => n + e.categories.sectors.filter((s) => sectors.has(s)).length,
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .slice(0, 4)
    .map((x) => x.p);
}
