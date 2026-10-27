import Link from "next/link";
import {
  Info,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  CircleCheck,
  CircleHelp,
  Clock3,
  CircleMinus,
  Infinity as InfinityIcon,
  MapPin,
  Monitor,
  Layers,
  Rocket,
  CircleDollarSign,
  Trophy,
  History,
} from "lucide-react";
import {
  applicationState,
  applicationRounds,
  roundPassed,
  formatDate,
  isReviewDue,
  type Program,
} from "@/lib/program-model";
import { ProgramActions } from "./program-actions";
export function ProgramCard({
  program,
  now,
  highlight,
}: {
  program: Program;
  now: string;
  highlight?: { date: string; label: string };
}) {
  const at = new Date(now),
    state = applicationState(program, at),
    event = program.cohorts[0];
  const date = highlight?.date ?? state.date;
  const format = event?.location.is_hybrid
    ? "Hybrid"
    : event?.location.is_virtual
      ? "Online"
      : event?.location.city;
  const due = isReviewDue(program, at);
  const accepting = state.key === "open" || state.key === "rolling";
  const StatusIcon =
    state.key === "open"
      ? CircleCheck
      : state.key === "rolling"
        ? InfinityIcon
        : state.key === "upcoming" || state.key === "deadline"
          ? CalendarDays
          : state.key === "closed" || state.key === "inactive"
            ? CircleMinus
            : state.key === "check"
              ? Clock3
              : CircleHelp;
  const statusStyle = accepting
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
    : state.key === "closed" || state.key === "inactive"
      ? "border-transparent bg-muted text-muted-foreground"
      : state.key === "unknown" || state.key === "check"
        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
        : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200";
  const category = event?.categories.types[0];
  const TypeIcon =
    category === "accelerator" || category === "incubator"
      ? Rocket
      : category === "grant"
        ? CircleDollarSign
        : category === "competition"
          ? Trophy
          : Layers;
  const LocationIcon =
    event?.location.is_virtual && !event.location.is_hybrid ? Monitor : MapPin;
  return (
    <article
      className={`min-w-0 rounded-2xl border bg-card p-4 shadow-sm sm:p-5 ${accepting ? "border-t-2 border-t-emerald-500 dark:border-t-emerald-600" : ""}`}
      data-program-card={program.slug}
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="min-h-10 py-1.5 text-lg font-semibold leading-snug">
            <Link
              href={`/deadline/${program.slug}`}
              data-track="program_view"
              data-program={program.slug}
              className="hover:underline"
            >
              {program.name}
            </Link>
          </h2>
        </div>
        <details className="relative shrink-0">
          <summary
            aria-label={`Sources for ${program.name}`}
            title="Sources and review details"
            className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border hover:bg-muted [&::-webkit-details-marker]:hidden"
          >
            <Info size={18} aria-hidden="true" />
          </summary>
          <div className="absolute right-0 z-10 mt-2 w-[min(17rem,75vw)] rounded-xl border bg-background p-4 text-sm shadow-lg">
            <p className="font-semibold">Checked {program.checked_at}</p>
            <p className="my-2 text-muted-foreground">
              {due
                ? "Review due. Reconfirm before applying."
                : "Official sources and published information."}
            </p>
            {program.sources.slice(0, 3).map((s) => (
              <p key={s.url} className="mt-2">
                {program.status === "inactive" ? (
                  s.title
                ) : (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                    data-track="source_click"
                    data-program={program.slug}
                  >
                    {s.title}
                  </a>
                )}
              </p>
            ))}
            <Link
              className="mt-3 inline-block underline"
              href={`/deadline/${program.slug}#sources`}
            >
              All evidence
            </Link>
          </div>
        </details>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${statusStyle}`}
          data-application-status={state.key}
        >
          <StatusIcon size={14} className="shrink-0" aria-hidden="true" />
          {state.label}
        </span>
        {category && (
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 capitalize text-muted-foreground">
            <TypeIcon size={14} aria-hidden="true" />
            {category}
          </span>
        )}
      </div>
      {date && (
        <p className="mt-3 flex items-start gap-2 font-semibold">
          <CalendarDays
            size={17}
            className="mt-0.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span>
            {highlight?.label ??
              (state.key === "upcoming"
                ? "Opens"
                : state.key === "closed"
                  ? "Closed"
                  : "Apply by")}{" "}
            · <time dateTime={date}>{formatDate(date)}</time>
          </span>
        </p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {event?.description ?? program.summary}
      </p>
      {format && (
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <LocationIcon size={15} className="shrink-0" aria-hidden="true" />
          {[format, event?.location.country].filter(Boolean).join(" · ")}
        </p>
      )}
      <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
        <History size={14} className="shrink-0" aria-hidden="true" />
        <span>
          Checked {program.checked_at}
          {due ? " · Review due" : ""}
          {program.status === "needs_review"
            ? " · Details need confirmation"
            : ""}
        </span>
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t pt-3 text-sm">
        <Link
          href={`/deadline/${program.slug}`}
          data-track="program_view"
          data-program={program.slug}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-foreground px-3 font-medium text-background hover:opacity-90"
        >
          View program
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        {program.website && (
          <a
            href={event?.website ?? program.website}
            target="_blank"
            rel="noreferrer"
            data-track="official_site_click"
            data-program={program.slug}
            className="inline-flex min-h-10 items-center gap-1 underline underline-offset-4"
          >
            Official site
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        )}
      </div>
      <div className="mt-3">
        <ProgramActions
          slug={program.slug}
          hasDates={program.cohorts.some((e) =>
            applicationRounds(e, program.facts).some(
              (r) => !roundPassed(r, at),
            ),
          )}
        />
      </div>
    </article>
  );
}
