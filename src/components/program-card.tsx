import Link from "next/link";
import { Info, ArrowUpRight } from "lucide-react";
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
  return (
    <article
      className="min-w-0 rounded-2xl border bg-card p-4 shadow-sm sm:p-5"
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
            <Info size={18} />
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
          className={`rounded-full px-2.5 py-1 font-medium ${state.key === "closed" || state.key === "inactive" ? "bg-muted" : "bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100"}`}
        >
          {state.label}
        </span>
        {event?.categories.types[0] && (
          <span className="rounded-full border px-2.5 py-1 capitalize">
            {event.categories.types[0]}
          </span>
        )}
      </div>
      {date && (
        <p className="mt-3 font-semibold">
          {highlight?.label ??
            (state.key === "upcoming"
              ? "Opens"
              : state.key === "closed"
                ? "Closed"
                : "Apply by")}{" "}
          · <time dateTime={date}>{formatDate(date)}</time>
        </p>
      )}
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {event?.description ?? program.summary}
      </p>
      {format && (
        <p className="mt-2 text-sm text-muted-foreground">
          {[format, event?.location.country].filter(Boolean).join(" · ")}
        </p>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Checked {program.checked_at}
        {due ? " · Review due" : ""}
        {program.status === "needs_review"
          ? " · Details need confirmation"
          : ""}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <Link
          href={`/deadline/${program.slug}`}
          data-track="program_view"
          data-program={program.slug}
          className="font-semibold underline underline-offset-4"
        >
          Program details
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
            Official information
            <ArrowUpRight size={16} />
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
