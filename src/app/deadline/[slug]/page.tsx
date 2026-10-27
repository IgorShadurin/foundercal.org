import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileText,
  Globe2,
  History,
  Layers,
  MapPin,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { ApplicationStatus } from "@/components/application-status";
import { notFound, permanentRedirect } from "next/navigation";
import { programs, getProgram, lastContentDate } from "@/lib/catalog";
import {
  BASE_URL,
  canonicalSlug,
  applicationState,
  applicationRounds,
  roundPassed,
  formatDate,
  isReviewDue,
  nextReviewDate,
  relatedPrograms,
} from "@/lib/program-model";
import { ProgramCard } from "@/components/program-card";
import { ProgramActions } from "@/components/program-actions";
import { SiteFooter } from "@/components/site-footer";
export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return programs.map((p) => ({ slug: p.slug }));
}
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params,
    p = getProgram(slug);
  if (!p)
    return {
      title: "Program not found",
      robots: { index: false, follow: true },
    };
  const title = `${p.name}: Application Dates & Requirements`;
  const state = applicationState(p, new Date());
  const description = `${p.name}: ${state.label}. ${state.date ? `Published ${state.key === "upcoming" ? "opening" : "cutoff"}: ${formatDate(state.date)}. ` : ""}Compare requirements, funding and official sources. Checked ${p.checked_at}.`;
  return {
    title,
    description,
    alternates: { canonical: `/deadline/${p.slug}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/deadline/${p.slug}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: p.status !== "not_found", follow: true },
  };
}
export default async function DeadlinePage({ params }: Props) {
  const { slug } = await params;
  if (canonicalSlug(slug) !== slug)
    permanentRedirect(`/deadline/${canonicalSlug(slug)}`);
  const p = getProgram(slug);
  if (!p) notFound();
  const now = new Date(),
    iso = now.toISOString(),
    state = applicationState(p, now),
    due = isReviewDue(p, now),
    related = relatedPrograms(p, programs);
  const rounds = p.cohorts
    .flatMap((e) => applicationRounds(e, p.facts))
    .sort((a, b) => a.close_date.localeCompare(b.close_date));
  const primary = p.cohorts[0];
  const category = primary?.categories.types[0];
  const TypeIcon =
    category === "competition"
      ? Trophy
      : category === "grant"
        ? CircleDollarSign
        : category === "accelerator" || category === "incubator"
          ? Rocket
          : Layers;
  const activeRound = rounds.find((r) => !roundPassed(r, now));
  const location = primary
    ? [
        primary.location.is_hybrid
          ? "Hybrid"
          : primary.location.is_virtual
            ? "Online"
            : null,
        primary.location.city,
        primary.location.country,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const sectors = [...new Set(p.cohorts.flatMap((e) => e.categories.sectors))];
  const officialUrl = p.website ? (primary?.website ?? p.website) : null;
  const showCohortNames = p.cohorts.length > 1;
  const uniqueDescriptions = [
    ...new Set(
      p.cohorts
        .map((e) => e.description)
        .filter((text) => text && text !== p.summary),
    ),
  ];
  const nextDateLabel =
    state.key === "upcoming"
      ? "Applications open"
      : state.key === "closed"
        ? "Last published deadline"
        : "Application deadline";
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: `${p.name}: Application Dates & Requirements`,
        url: `${BASE_URL}/deadline/${p.slug}`,
        dateModified: lastContentDate([p]),
        about: {
          "@type": "Organization",
          name: p.organizer_name,
          ...(p.website ? { url: p.website } : {}),
        },
        isPartOf: { "@type": "WebSite", name: "FounderCal", url: BASE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Programs",
            item: `${BASE_URL}/imported-accelerators`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: p.name,
            item: `${BASE_URL}/deadline/${p.slug}`,
          },
        ],
      },
    ],
  };
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-5 sm:px-8 sm:py-8">
      <nav
        aria-label="Site navigation"
        className="flex flex-wrap items-center justify-between gap-3 border-b pb-5"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2.5 text-sm font-bold tracking-wide"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <CalendarDays size={20} aria-hidden="true" />
          </span>
          FOUNDERCAL
        </Link>
        <Link
          href="/imported-accelerators"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <Layers size={16} aria-hidden="true" />
          Browse programs
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </nav>
      <nav
        aria-label="Breadcrumb"
        className="my-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
      >
        <Link
          href="/"
          className="inline-flex min-h-8 items-center gap-1 hover:text-foreground"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Calendar
        </Link>
        <ChevronRight size={12} aria-hidden="true" />
        <Link href="/imported-accelerators" className="hover:text-foreground">
          Programs
        </Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span aria-current="page" className="text-foreground">
          {p.name}
        </span>
      </nav>
      <section
        id="overview"
        aria-labelledby="program-title"
        className="scroll-mt-6 rounded-3xl border bg-gradient-to-br from-emerald-50/70 via-background to-background p-5 sm:p-8 dark:from-emerald-950/30"
      >
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-x-10 lg:gap-y-0">
          <header className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl border border-emerald-200 bg-background text-emerald-800 dark:border-emerald-800 dark:text-emerald-200">
                <TypeIcon size={24} aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {category ?? "Founder program"}
              </span>
            </div>
            <h1
              id="program-title"
              className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-[2.6rem]"
            >
              {p.name}
            </h1>
            {p.organizer_name !== p.name && (
              <p className="mt-2 text-sm text-muted-foreground">
                By {p.organizer_name}
              </p>
            )}
          </header>
          <aside
            aria-label="Application summary"
            className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm sm:p-6 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          >
            <ApplicationStatus state={state} />
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {state.date
                  ? nextDateLabel
                  : state.key === "rolling"
                    ? "Application schedule"
                    : "Application information"}
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {state.date ? (
                  <time dateTime={state.date}>{formatDate(state.date)}</time>
                ) : state.key === "rolling" ? (
                  "Rolling intake"
                ) : state.key === "inactive" ? (
                  "Program inactive"
                ) : (
                  "Not confirmed"
                )}
              </p>
              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                <Clock3
                  size={15}
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>
                  {state.key === "upcoming"
                    ? "Applications have not opened yet. Check the full schedule below."
                    : state.key === "closed"
                      ? "The published application window has ended. A new round is not confirmed."
                      : state.key === "rolling"
                        ? "No fixed cutoff. Confirm the next intake with the organizer."
                        : activeRound?.closes_at
                          ? new Intl.DateTimeFormat("en-US", {
                              timeZone: activeRound.timezone ?? "UTC",
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(activeRound.closes_at)) +
                            ` (${activeRound.timezone ?? "UTC"})`
                          : activeRound?.submitter_local
                            ? "5:00 PM in the submitter’s local time. Check the solicitation."
                            : state.date
                              ? "Exact cutoff time not confirmed. Check before submitting."
                              : "Check the official source for current application availability."}
                </span>
              </p>
            </div>
            {officialUrl ? (
              <a
                href={officialUrl}
                target="_blank"
                rel="noreferrer"
                data-track="official_site_click"
                data-program={p.slug}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Visit official program
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            ) : (
              <Link
                href="/programs/upcoming-deadlines"
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-3 text-sm font-semibold text-background"
              >
                Find current programs
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            )}
            <div className="mt-3">
              <ProgramActions
                slug={p.slug}
                hasDates={rounds.some((r) => !roundPassed(r, now))}
              />
            </div>
          </aside>
          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <p className="text-base leading-relaxed text-muted-foreground lg:mt-5">
              {p.summary}
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 text-sm">
              {location && (
                <span className="inline-flex items-start gap-2">
                  <MapPin
                    size={17}
                    className="mt-0.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {location}
                </span>
              )}
              {sectors.length > 0 && (
                <span className="inline-flex items-center gap-2">
                  <Sparkles
                    size={17}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="capitalize">
                    {sectors.map((s) => (s === "ai" ? "AI" : s)).join(" · ")}
                  </span>
                </span>
              )}
            </div>
            <a
              href="#sources"
              className="mt-5 inline-flex min-h-10 items-center gap-2 text-xs text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
            >
              <History size={15} aria-hidden="true" />
              Sources checked {formatDate(p.checked_at)}
            </a>
          </div>
        </div>
      </section>
      <nav
        aria-label="On this page"
        className="my-6 flex flex-wrap gap-x-6 gap-y-1 border-b text-sm"
      >
        <a
          href="#dates"
          className="inline-flex min-h-12 items-center gap-2 border-b-2 border-emerald-700 font-medium"
        >
          <CalendarDays size={16} aria-hidden="true" />
          Key dates
        </a>
        <a
          href="#requirements"
          className="inline-flex min-h-12 items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Users size={16} aria-hidden="true" />
          Before you apply
        </a>
        <a
          href="#sources"
          className="inline-flex min-h-12 items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <FileText size={16} aria-hidden="true" />
          Sources
        </a>
      </nav>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="min-w-0 space-y-6">
          <section
            id="dates"
            aria-labelledby="dates-title"
            className="scroll-mt-6 rounded-2xl border p-5 sm:p-6"
          >
            <h2
              id="dates-title"
              className="flex items-center gap-2.5 text-xl font-semibold"
            >
              <CalendarDays
                size={20}
                className="text-emerald-700 dark:text-emerald-300"
                aria-hidden="true"
              />
              Key dates
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Application deadlines and published program milestones.
            </p>
            {p.cohorts.length ? (
              p.cohorts.map((e) => {
                const cohortRounds = applicationRounds(e, p.facts);
                const milestones = [
                  ["Program starts", e.dates.program_start],
                  ["Program ends", e.dates.program_end],
                  ["Demo day", e.dates.demo_day],
                ].filter((item): item is [string, string] => Boolean(item[1]));
                const extraDateText =
                  e.dates.date_range_text &&
                  e.dates.date_range_text !== p.summary &&
                  e.dates.date_range_text !== e.description
                    ? e.dates.date_range_text
                    : null;
                return (
                  <article key={e.id} className="mt-5">
                    {showCohortNames && (
                      <h3 className="mb-4 font-semibold">{e.name}</h3>
                    )}
                    <ol className="ml-2 space-y-5 border-l pl-5">
                      {cohortRounds.map((r) => (
                        <li key={r.id} className="relative">
                          <span
                            className={`absolute -left-[25px] top-1.5 size-2 rounded-full ${roundPassed(r, now) ? "bg-muted-foreground" : "bg-emerald-700"}`}
                            aria-hidden="true"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-sm font-medium">{r.label}</h3>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                              {roundPassed(r, now)
                                ? "Past deadline"
                                : "Published deadline"}
                            </span>
                          </div>
                          <p className="mt-1 text-xl font-semibold">
                            <time dateTime={r.close_date}>
                              {formatDate(r.close_date)}
                            </time>
                          </p>
                          {r.open_date && (
                            <p className="mt-2 text-sm text-muted-foreground">
                              Opens {formatDate(r.open_date)}
                            </p>
                          )}
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {r.closes_at
                              ? new Intl.DateTimeFormat("en-US", {
                                  timeZone: r.timezone ?? "UTC",
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(r.closes_at)) +
                                ` (${r.timezone ?? "UTC"})`
                              : r.submitter_local
                                ? "5:00 PM in the submitter’s local time. Check the solicitation."
                                : "Exact cutoff time not confirmed."}
                          </p>
                          <a
                            href={r.source_url}
                            target="_blank"
                            rel="noreferrer"
                            data-track="source_click"
                            data-program={p.slug}
                            className="mt-1 inline-flex min-h-9 items-center gap-1.5 text-xs underline underline-offset-4"
                          >
                            Deadline source
                            <ArrowUpRight size={13} aria-hidden="true" />
                          </a>
                          <span className="ml-2 text-xs text-muted-foreground">
                            Checked {r.checked_at}
                          </span>
                        </li>
                      ))}
                      {milestones.map(([label, date]) => (
                        <li key={label} className="relative">
                          <span
                            className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-muted-foreground"
                            aria-hidden="true"
                          />
                          <p className="text-sm text-muted-foreground">
                            {label}
                          </p>
                          <p className="mt-1 font-semibold">
                            <time dateTime={date}>{formatDate(date)}</time>
                          </p>
                        </li>
                      ))}
                    </ol>
                    {!cohortRounds.length && (
                      <p className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed">
                        {p.facts?.event_id === e.id && p.facts.rolling
                          ? p.facts.rolling.value
                          : "An exact application cutoff has not been confirmed."}
                      </p>
                    )}
                    {extraDateText && (
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {extraDateText}
                      </p>
                    )}
                    {!milestones.length && (
                      <p className="mt-4 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
                        Exact program milestones are not confirmed. Any broader
                        event dates in the overview do not establish the precise
                        cohort or pitch schedule.
                      </p>
                    )}
                  </article>
                );
              })
            ) : (
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                {p.status === "inactive"
                  ? "This is a historical program. No current application window is listed."
                  : "Current application details could not be confirmed. Review the sources before planning an application."}
              </p>
            )}
          </section>
          <section
            id="requirements"
            aria-labelledby="requirements-title"
            className="scroll-mt-6 rounded-2xl border p-5 sm:p-6"
          >
            <h2
              id="requirements-title"
              className="flex items-center gap-2.5 text-xl font-semibold"
            >
              <Users
                size={20}
                className="text-emerald-700 dark:text-emerald-300"
                aria-hidden="true"
              />
              Before you apply
            </h2>
            {uniqueDescriptions.map((text) => (
              <p key={text} className="mt-4 text-sm leading-relaxed">
                {text}
              </p>
            ))}
            {p.facts?.funding && (
              <div className="mt-4 rounded-xl bg-muted/40 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CircleDollarSign size={16} aria-hidden="true" />
                  Funding &amp; costs
                </h3>
                <p className="mt-2 text-sm leading-relaxed">
                  {p.facts.funding.value}
                </p>
                <a
                  href={p.facts.funding.source_url}
                  className="mt-2 inline-block text-xs underline"
                >
                  Funding source
                </a>
              </div>
            )}
            {p.facts?.eligibility && (
              <div className="mt-4 rounded-xl bg-muted/40 p-4">
                <h3 className="text-sm font-semibold">Eligibility</h3>
                <p className="mt-2 text-sm leading-relaxed">
                  {p.facts.eligibility.value}
                </p>
                <a
                  href={p.facts.eligibility.source_url}
                  className="mt-2 inline-block text-xs underline"
                >
                  Eligibility source
                </a>
              </div>
            )}
            {showCohortNames &&
              p.cohorts.map((e) => (
                <p key={e.id} className="mt-3 text-sm">
                  <span className="font-medium">{e.name}: </span>
                  {[
                    e.location.is_hybrid
                      ? "Hybrid"
                      : e.location.is_virtual
                        ? "Online"
                        : null,
                    e.location.city,
                    e.location.country,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Location requirements not confirmed."}
                </p>
              ))}
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Use the official program page to confirm these details before
              committing time or paying an application fee:
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Users
                  size={17}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-medium">Your eligibility</strong>
                  <span className="mt-0.5 block text-muted-foreground">
                    Company stage, team size and sector requirements.
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CircleDollarSign
                  size={17}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-medium">Funding &amp; fees</strong>
                  <span className="mt-0.5 block text-muted-foreground">
                    Entry costs, investment terms and any equity commitments.
                  </span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Globe2
                  size={17}
                  className="mt-0.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-medium">
                    Attendance &amp; residency
                  </strong>
                  <span className="mt-0.5 block text-muted-foreground">
                    Travel, incorporation and in-person participation
                    requirements.
                  </span>
                </span>
              </li>
            </ul>
            {p.notes.length > 0 && (
              <details className="mt-5 border-t pt-2">
                <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium">
                  Program-specific research notes ({p.notes.length})
                </summary>
                <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {p.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        </div>
        <aside
          id="sources"
          aria-labelledby="sources-title"
          className="min-w-0 scroll-mt-6 rounded-2xl border bg-muted/20 p-5 sm:p-6"
        >
          <h2
            id="sources-title"
            className="flex items-center gap-2 text-xl font-semibold"
          >
            <FileText size={20} aria-hidden="true" />
            Sources &amp; review
          </h2>
          <div className="mt-4 border-b pb-4">
            <p className="flex items-start gap-2 text-sm font-medium">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              {p.status === "verified"
                ? "Official information reviewed"
                : p.status === "inactive"
                  ? "Inactive program"
                  : p.status === "not_found"
                    ? "Program not confirmed"
                    : "Details need confirmation"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Last checked {formatDate(p.checked_at)}.<br />
              {due
                ? "Review due — reconfirm with the organizer."
                : `Next review due ${formatDate(nextReviewDate(p, now))}.`}
            </p>
          </div>
          <ul className="mt-4 space-y-5">
            {p.sources.map((source, index) => (
              <li key={source.url}>
                <div className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border bg-background text-[10px] font-semibold"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-relaxed">
                      {p.status === "inactive" ? (
                        source.title
                      ) : (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          data-track="source_click"
                          data-program={p.slug}
                          className="break-words underline decoration-border underline-offset-4 hover:decoration-current"
                        >
                          {source.title}
                          <ArrowUpRight
                            size={13}
                            className="ml-1 inline"
                            aria-hidden="true"
                          />
                        </a>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Checked {formatDate(source.accessed_at)}
                    </p>
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="min-h-9 cursor-pointer py-2 text-xs font-medium">
                    What this source confirms
                  </summary>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {source.supports}
                  </p>
                </details>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t pt-4 text-xs leading-relaxed text-muted-foreground">
            <p>
              Source review and application availability are separate.
              Unpublished terms remain unconfirmed.
            </p>
            <Link
              href="/methodology"
              className="inline-flex min-h-9 items-center gap-1 underline underline-offset-4"
            >
              How we verify programs
              <ArrowRight size={13} aria-hidden="true" />
            </Link>
            <a
              className="block min-h-9 py-2 underline underline-offset-4"
              href={`https://github.com/IgorShadurin/foundercal.org/issues/new?title=${encodeURIComponent("Data correction: " + p.name)}`}
            >
              Report a correction
            </a>
          </div>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="mt-10 space-y-4 border-t pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              Explore other programs
            </h2>
            <Link
              href="/imported-accelerators"
              className="inline-flex min-h-11 items-center gap-2 text-sm underline underline-offset-4"
            >
              View directory
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            Related programs with their own requirements and application
            schedules.
          </p>
          <div className="grid items-start gap-4 md:grid-cols-2">
            {related.map((program) => (
              <ProgramCard key={program.slug} program={program} now={iso} />
            ))}
          </div>
        </section>
      )}
      <SiteFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
        }}
      />
    </main>
  );
}
