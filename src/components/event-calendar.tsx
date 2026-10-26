"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { parseISO, format, addDays } from "date-fns";
import {
  applicationState,
  applicationRounds,
  roundPassed,
  type Program,
} from "@/lib/program-model";
import {
  parseCalendarQuery,
  serializeCalendarQuery,
  type CalendarQuery,
} from "@/lib/calendar-query";
import { ProgramCard } from "./program-card";
import { readSaved } from "./program-actions";
import { trackAction } from "./analytics-events";
const modes = [
  ["soon", "Upcoming deadlines"],
  ["rolling", "Rolling applications"],
  ["all", "All programs"],
  ["milestones", "Program dates"],
  ["saved", "Saved"],
];
export function EventCalendar({
  programs,
  initialNow,
  initialQuery,
  directory = false,
}: {
  programs: Program[];
  initialNow: string;
  initialQuery: CalendarQuery;
  directory?: boolean;
}) {
  const [now, setNow] = useState(initialNow),
    [query, setQuery] = useState(initialQuery),
    [month, setMonth] = useState(() => parseISO(initialQuery.start)),
    [saved, setSaved] = useState<string[]>([]);
  const today = now.slice(0, 10);
  useEffect(() => {
    const sync = () => setSaved(readSaved());
    sync();
    const timer = setInterval(() => setNow(new Date().toISOString()), 60000);
    window.addEventListener("storage", sync);
    window.addEventListener("foundercal:saved", sync);
    const back = () => {
      const q = parseCalendarQuery(
        new URLSearchParams(location.search),
        new Date().toISOString().slice(0, 10),
        directory,
      );
      setQuery(q);
      setMonth(parseISO(q.start));
    };
    window.addEventListener("popstate", back);
    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", sync);
      window.removeEventListener("foundercal:saved", sync);
      window.removeEventListener("popstate", back);
    };
  }, [directory]);
  const update = (changes: Partial<CalendarQuery>) => {
    const next = { ...query, ...changes };
    setQuery(next);
    const value = serializeCalendarQuery(next, today, directory);
    history.replaceState(
      null,
      "",
      location.pathname + (value ? "?" + value : ""),
    );
    if (changes.q === undefined)
      trackAction("filter_change", {
        mode: next.mode,
        region: next.region,
        sector: next.sector,
        type: next.type,
      });
  };
  const reset = () => {
    const next = parseCalendarQuery(new URLSearchParams(), today, directory);
    setQuery(next);
    setMonth(parseISO(today));
    history.replaceState(null, "", location.pathname);
    trackAction("filters_reset");
  };
  const choices = useMemo(
    () => ({
      regions: [
        ...new Set(
          programs.flatMap((p) =>
            p.cohorts
              .map((e) => e.location.region_code)
              .filter((x): x is string => Boolean(x)),
          ),
        ),
      ].sort(),
      sectors: [
        ...new Set(
          programs.flatMap((p) =>
            p.cohorts.flatMap((e) => e.categories.sectors),
          ),
        ),
      ].sort(),
      types: [
        ...new Set(
          programs.flatMap((p) => p.cohorts.flatMap((e) => e.categories.types)),
        ),
      ].sort(),
    }),
    [programs],
  );
  const end = format(
    addDays(parseISO(query.start), query.days - 1),
    "yyyy-MM-dd",
  );
  const rows = useMemo(
    () =>
      programs
        .flatMap((program) => {
          const q = query.q.trim().toLowerCase();
          const events = program.cohorts;
          const state = applicationState(program, new Date(now));
          if (
            q &&
            !`${program.name} ${program.summary} ${events.map((e) => `${e.name} ${e.location.city ?? ""} ${e.location.country ?? ""} ${e.categories.sectors.join(" ")}`).join(" ")}`
              .toLowerCase()
              .includes(q)
          )
            return [];
          // Facets must match the same cohort, not unrelated locations of one organizer.
          const matching = events.filter(
            (e) =>
              (query.region === "all" ||
                e.location.region_code === query.region) &&
              (query.sector === "all" ||
                e.categories.sectors.includes(query.sector)) &&
              (query.type === "all" || e.categories.types.includes(query.type)),
          );
          if (
            !matching.length &&
            (query.region !== "all" ||
              query.sector !== "all" ||
              query.type !== "all")
          )
            return [];
          if (query.mode === "saved" && !saved.includes(program.slug))
            return [];
          if (query.mode === "rolling" && state.key !== "rolling") return [];
          let highlight: { date: string; label: string } | undefined;
          if (query.mode === "soon") {
            if (program.status !== "verified") return [];
            const rounds = matching
              .flatMap((e) => applicationRounds(e, program.facts))
              .filter(
                (r) =>
                  r.close_date >= query.start &&
                  r.close_date <= end &&
                  !roundPassed(r, new Date(now)),
              )
              .sort((a, b) => a.close_date.localeCompare(b.close_date));
            if (!rounds.length) return [];
            highlight = { date: rounds[0].close_date, label: rounds[0].label };
          }
          if (query.mode === "milestones") {
            const dates = matching
              .flatMap((e) => [
                { date: e.dates.program_start, label: "Program starts" },
                { date: e.dates.demo_day, label: "Demo day" },
                { date: e.dates.program_end, label: "Program ends" },
              ])
              .filter((x): x is { date: string; label: string } =>
                Boolean(x.date && x.date >= query.start && x.date <= end),
              )
              .sort((a, b) => a.date.localeCompare(b.date));
            if (!dates.length) return [];
            highlight = dates[0];
          }
          return [{ program, highlight }];
        })
        .sort(
          (a, b) =>
            (a.highlight?.date ?? "9999").localeCompare(
              b.highlight?.date ?? "9999",
            ) || a.program.name.localeCompare(b.program.name),
        ),
    [programs, query, end, now, saved],
  );
  const dates = programs.flatMap((p) =>
    p.cohorts.flatMap((e) =>
      applicationRounds(e, p.facts).map((r) => parseISO(r.close_date)),
    ),
  );
  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <Link href="/" className="text-sm font-bold tracking-wide">
          FOUNDERCAL
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {directory
            ? "Startup accelerator & funding directory"
            : "Startup accelerator deadlines"}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Find your next founder program. Compare published deadlines,
          eligibility and funding with dated sources.
        </p>
        <nav
          aria-label="Browse opportunities"
          className="flex flex-wrap gap-x-4 gap-y-2 text-sm"
        >
          <Link
            href={directory ? "/" : "/imported-accelerators"}
            className="underline"
          >
            {directory ? "Deadline calendar" : "All programs"}
          </Link>
          <Link href="/programs/ai" className="underline">
            AI programs
          </Link>
          <Link href="/programs/grants" className="underline">
            Grants
          </Link>
          <Link href="/methodology" className="underline">
            How we verify
          </Link>
        </nav>
      </header>
      <section
        aria-label="Find programs"
        className="space-y-4 rounded-2xl border bg-card p-4"
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="View">
          <>
            {modes.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={query.mode === value}
                onClick={() => update({ mode: value })}
                className={`min-h-10 rounded-lg border px-3 text-sm ${query.mode === value ? "bg-foreground text-background" : "hover:bg-muted"}`}
              >
                {label}
              </button>
            ))}
          </>
        </div>
        <div className="space-y-3">
          <label className="block text-sm">
            Search programs
            <input
              type="search"
              value={query.q}
              onChange={(e) => update({ q: e.target.value })}
              onBlur={() => {
                if (query.q)
                  trackAction("program_search", {
                    query_length: query.q.length,
                    result_count: rows.length,
                  });
              }}
              placeholder="Name, city or sector"
              className="mt-1 block min-h-11 w-full rounded-lg border bg-background px-3"
            />
          </label>
          <details
            open={
              query.region !== "all" ||
              query.sector !== "all" ||
              query.type !== "all"
            }
          >
            <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium">
              Region, sector &amp; program type
            </summary>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["region", "Region", choices.regions],
                  ["sector", "Sector", choices.sectors],
                  ["type", "Program type", choices.types],
                ] as const
              ).map(([key, label, values]) => (
                <label key={key} className="text-sm">
                  {label}
                  <select
                    value={query[key]}
                    onChange={(e) => update({ [key]: e.target.value })}
                    className="mt-1 block min-h-11 w-full rounded-lg border bg-background px-3 capitalize"
                  >
                    <option value="all">All {label.toLowerCase()}s</option>
                    {values.map((v) => (
                      <option key={v} value={v}>
                        {v === "na"
                          ? "North America"
                          : v === "eu"
                            ? "Europe"
                            : v === "ai"
                              ? "AI"
                              : v}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </details>
        </div>
        {["soon", "milestones"].includes(query.mode) && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              From (UTC date)
              <input
                type="date"
                value={query.start}
                onChange={(e) => {
                  if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
                    update({ start: e.target.value });
                    setMonth(parseISO(e.target.value));
                  }
                }}
                className="mt-1 block min-h-10 rounded-lg border bg-background px-3"
              />
            </label>
            <label className="text-sm">
              Window
              <select
                value={query.days}
                onChange={(e) => update({ days: Number(e.target.value) })}
                className="mt-1 block min-h-10 rounded-lg border bg-background px-3"
              >
                {[30, 90, 182, 365].map((d) => (
                  <option key={d} value={d}>
                    {d} days
                  </option>
                ))}
              </select>
            </label>
            <details className="basis-full">
              <summary className="min-h-10 cursor-pointer rounded-lg border px-3 py-2 text-sm">
                Choose on calendar
              </summary>
              <div className="mt-2 w-fit max-w-full rounded-xl border bg-background shadow-lg">
                <Calendar
                  mode="single"
                  month={month}
                  onMonthChange={setMonth}
                  selected={parseISO(query.start)}
                  onSelect={(d) =>
                    d && update({ start: format(d, "yyyy-MM-dd") })
                  }
                  modifiers={{ hasEvent: dates }}
                />
              </div>
            </details>
          </div>
        )}
        <button
          type="button"
          onClick={reset}
          className="min-h-10 text-sm underline"
        >
          Reset all filters and dates
        </button>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p role="status" aria-live="polite">
          {rows.length} {rows.length === 1 ? "program" : "programs"}
          {["soon", "milestones"].includes(query.mode)
            ? ` · ${query.start} to ${end}`
            : ""}
        </p>
        <span className="text-muted-foreground">
          {query.mode === "saved"
            ? "Saved on this device"
            : `${programs.length} unique programs tracked`}
        </span>
      </div>
      {rows.length ? (
        <div className="grid items-start gap-4 md:grid-cols-2">
          {rows.map(({ program, highlight }) => (
            <ProgramCard
              key={program.slug}
              program={program}
              now={now}
              highlight={highlight}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <h2 className="font-semibold">
            {query.mode === "saved"
              ? "No saved programs match"
              : "No matching programs"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try all programs, a wider date range, or reset your filters.
          </p>
          <button
            onClick={() => update({ mode: "all" })}
            className="mt-4 min-h-10 rounded-lg border px-4"
          >
            Browse all programs
          </button>
        </div>
      )}
    </div>
  );
}
