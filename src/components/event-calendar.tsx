"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  CircleDollarSign,
  Layers,
  ListFilter,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { parseISO, format, addDays } from "date-fns";
import {
  applicationState,
  compareProgramsByRelevance,
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
  { value: "soon", label: "Upcoming", icon: CalendarDays },
  { value: "rolling", label: "Rolling", icon: InfinityIcon },
  { value: "all", label: "All", icon: Layers },
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
    [saved, setSaved] = useState<string[]>([]),
    [filtersOpen, setFiltersOpen] = useState(false);
  const filterCount = [
    query.region !== "all",
    query.sector !== "all",
    query.type !== "all",
    query.start !== now.slice(0, 10),
    query.days !== 30,
  ].filter(Boolean).length;
  const hasChanges = Boolean(
    serializeCalendarQuery(query, now.slice(0, 10), directory),
  );
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
        .sort((a, b) => {
          // The explicit program-dates view remains a chronological timeline.
          const chronology =
            query.mode === "milestones"
              ? (a.highlight?.date ?? "9999").localeCompare(
                  b.highlight?.date ?? "9999",
                )
              : 0;
          return (
            chronology ||
            compareProgramsByRelevance(
              a.program,
              b.program,
              new Date(now),
              a.highlight?.date,
              b.highlight?.date,
            )
          );
        }),
    [programs, query, end, now, saved],
  );
  const dates = programs.flatMap((p) =>
    p.cohorts.flatMap((e) =>
      applicationRounds(e, p.facts).map((r) => parseISO(r.close_date)),
    ),
  );
  return (
    <div className="space-y-5">
      <header className="space-y-5 pb-1">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2.5 text-sm font-bold tracking-wide"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
              <CalendarDays size={20} aria-hidden="true" />
            </span>
            FOUNDERCAL
          </Link>
          <nav
            aria-label="Browse opportunities"
            className="flex flex-wrap gap-x-3 text-xs text-muted-foreground sm:gap-x-4 sm:text-sm"
          >
            <Link
              href={directory ? "/" : "/imported-accelerators"}
              className="inline-flex min-h-11 items-center gap-1.5 hover:text-foreground"
            >
              <Layers size={15} aria-hidden="true" />
              {directory ? "Calendar" : "Directory"}
            </Link>
            <Link
              href="/programs/ai"
              className="inline-flex min-h-11 items-center gap-1.5 hover:text-foreground"
            >
              <Sparkles size={15} aria-hidden="true" />
              AI Accelerators
            </Link>
            <Link
              href="/programs/grants"
              className="inline-flex min-h-11 items-center gap-1.5 hover:text-foreground"
            >
              <CircleDollarSign size={15} aria-hidden="true" />
              Grants
            </Link>
            <Link
              href="/methodology"
              className="inline-flex min-h-11 items-center gap-1.5 hover:text-foreground"
            >
              <ShieldCheck size={15} aria-hidden="true" />
              Sources
            </Link>
          </nav>
        </div>
        <div className="space-y-2">
          <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            {directory
              ? "Startup accelerator & funding directory"
              : "Startup accelerator deadlines"}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Startup accelerator deadlines, rolling applications and grants —
            with dated sources.
          </p>
        </div>
      </header>
      <section
        aria-label="Find programs"
        className="rounded-2xl border bg-muted/30 p-3 sm:p-4"
      >
        <div className="relative">
          <Search
            size={19}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-3.5 text-muted-foreground"
          />
          <label htmlFor="program-search" className="sr-only">
            Search programs
          </label>
          <input
            id="program-search"
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
            placeholder="Search programs or locations"
            className="block min-h-12 w-full rounded-xl border bg-background pl-11 pr-3 text-sm shadow-sm"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1" role="group" aria-label="View">
            {modes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-label={
                  value === "all"
                    ? "All programs"
                    : value === "rolling"
                      ? "Rolling applications"
                      : "Upcoming deadlines"
                }
                aria-pressed={query.mode === value}
                onClick={() => update({ mode: value })}
                className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium sm:px-3 ${query.mode === value ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              aria-pressed={query.mode === "saved"}
              onClick={() => update({ mode: "saved" })}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm ${query.mode === "saved" ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >
              <Bookmark size={16} aria-hidden="true" />
              Saved
              {saved.length > 0 && (
                <span className="text-xs">({saved.length})</span>
              )}
            </button>
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="advanced-filters"
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium ${filtersOpen ? "bg-background" : "hover:bg-background"}`}
            >
              <ListFilter size={16} aria-hidden="true" />
              Filters
              {filterCount > 0 && (
                <span
                  className="rounded-full bg-foreground px-1.5 text-xs text-background"
                  aria-label={`${filterCount} active filters`}
                >
                  {filterCount}
                </span>
              )}
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={filtersOpen ? "rotate-180" : ""}
              />
            </button>
          </div>
        </div>
        <div
          id="advanced-filters"
          hidden={!filtersOpen}
          className="mt-3 space-y-4 border-t pt-4"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["region", "Region", choices.regions],
                ["sector", "Sector", choices.sectors],
                ["type", "Program type", choices.types],
              ] as const
            ).map(([key, label, values]) => (
              <label key={key} className="text-sm font-medium">
                {label}
                <select
                  value={query[key]}
                  onChange={(e) => update({ [key]: e.target.value })}
                  className="mt-1 block min-h-11 w-full rounded-lg border bg-background px-3 font-normal capitalize"
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
          <button
            type="button"
            aria-pressed={query.mode === "milestones"}
            onClick={() =>
              update({
                mode: query.mode === "milestones" ? "soon" : "milestones",
              })
            }
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm ${query.mode === "milestones" ? "bg-foreground text-background" : "bg-background hover:bg-muted"}`}
          >
            <CalendarRange size={16} aria-hidden="true" />
            Program dates &amp; demo days
          </button>
          {["soon", "milestones"].includes(query.mode) && (
            <div className="flex flex-wrap items-end gap-3">
              <label className="min-w-0 text-sm">
                From (UTC date)
                <input
                  type="date"
                  value={query.start}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
                      Number.isFinite(Date.parse(value))
                    ) {
                      update({ start: value });
                      setMonth(parseISO(value));
                    }
                  }}
                  className="mt-1 block min-h-11 max-w-full rounded-lg border bg-background px-3"
                />
              </label>
              <label className="text-sm">
                Window
                <select
                  value={query.days}
                  onChange={(e) => update({ days: Number(e.target.value) })}
                  className="mt-1 block min-h-11 rounded-lg border bg-background px-3"
                >
                  {[30, 90, 182, 365].map((d) => (
                    <option key={d} value={d}>
                      {d} days
                    </option>
                  ))}
                </select>
              </label>
              <details className="basis-full">
                <summary className="min-h-11 cursor-pointer py-2.5 text-sm">
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
        </div>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
        <div>
          <p role="status" aria-live="polite" className="font-medium">
            {rows.length} {rows.length === 1 ? "program" : "programs"}
            {query.mode === "saved"
              ? " saved on this device"
              : query.mode === "milestones"
                ? " · Program dates"
                : ""}
          </p>
          {["soon", "milestones"].includes(query.mode) && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {format(parseISO(query.start), "MMM d")} –{" "}
              {format(parseISO(end), "MMM d, yyyy")}
            </p>
          )}
        </div>
        {hasChanges ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Reset filters
          </button>
        ) : (
          <Link
            href="/imported-accelerators"
            className="inline-flex min-h-11 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {programs.length} programs tracked
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        )}
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
