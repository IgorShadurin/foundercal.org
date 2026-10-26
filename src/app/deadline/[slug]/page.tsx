import type { Metadata } from "next";
import Link from "next/link";
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
  const rounds = p.cohorts.flatMap((e) => applicationRounds(e, p.facts));
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
    <main className="mx-auto min-h-screen max-w-5xl space-y-8 px-4 py-6 sm:px-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm">
        <Link className="underline" href="/">
          Calendar
        </Link>
        <span>/</span>
        <Link className="underline" href="/imported-accelerators">
          Programs
        </Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <header className="space-y-4">
        <p className="text-sm font-medium text-muted-foreground">
          {p.organizer_name}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {p.name}
        </h1>
        <p className="text-lg">Application dates, requirements and funding</p>
        <div className="rounded-xl border bg-muted/40 p-4">
          <p className="font-semibold">{state.label}</p>
          {state.date && (
            <p className="mt-1">
              {state.key === "upcoming" ? "Opens" : "Published cutoff"}:{" "}
              <time dateTime={state.date}>{formatDate(state.date)}</time>
            </p>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            Checked {p.checked_at} ·{" "}
            {due ? "Review due" : "Next review due " + nextReviewDate(p, now)}.
            Confirm current availability with the organizer.
          </p>
        </div>
        <p className="leading-relaxed">
          <span className="font-medium">Research as of {p.checked_at}: </span>
          {p.summary}
        </p>
        <div className="flex flex-wrap gap-3">
          {p.website && (
            <a
              href={p.cohorts[0]?.website ?? p.website}
              target="_blank"
              rel="noreferrer"
              data-track="official_site_click"
              data-program={p.slug}
              className="inline-flex min-h-11 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background"
            >
              Official program information ↗
            </a>
          )}
          <ProgramActions
            slug={p.slug}
            hasDates={rounds.some((r) => !roundPassed(r, now))}
          />
        </div>
      </header>
      <section className="space-y-4" aria-labelledby="dates">
        <h2 id="dates" className="text-2xl font-semibold">
          Application windows & program dates
        </h2>
        {p.cohorts.length ? (
          p.cohorts.map((e) => (
            <article key={e.id} className="space-y-4 rounded-2xl border p-5">
              <h3 className="text-lg font-semibold">{e.name}</h3>
              {applicationRounds(e, p.facts).map((r) => (
                <div key={r.id} className="rounded-lg bg-muted/50 p-3">
                  <p className="font-medium">
                    {r.label}: {formatDate(r.close_date)}
                  </p>
                  {r.open_date && (
                    <p className="text-sm">
                      Applications open {formatDate(r.open_date)}
                    </p>
                  )}
                  {r.closes_at ? (
                    <p className="text-sm">
                      {new Intl.DateTimeFormat("en-US", {
                        timeZone: r.timezone ?? "UTC",
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(r.closes_at))}{" "}
                      ({r.timezone ?? "UTC"})
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {r.submitter_local
                        ? "5:00 PM in the submitter’s local time. Check the solicitation."
                        : "Exact cutoff time not confirmed. Check the source before submitting."}
                    </p>
                  )}
                  <a
                    className="text-sm underline"
                    href={r.source_url}
                    target="_blank"
                    rel="noreferrer"
                    data-track="source_click"
                    data-program={p.slug}
                  >
                    Deadline source
                  </a>
                  <span className="ml-2 text-xs text-muted-foreground">
                    checked {r.checked_at}
                  </span>
                </div>
              ))}
              {!applicationRounds(e, p.facts).length && (
                <p>
                  {p.facts?.rolling?.value ??
                    "No exact application cutoff is confirmed for this program."}
                </p>
              )}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {e.dates.date_range_text}
              </p>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                {(
                  [
                    ["Starts", e.dates.program_start],
                    ["Ends", e.dates.program_end],
                    ["Demo day", e.dates.demo_day],
                  ] as const
                )
                  .filter(([, d]) => d)
                  .map(([label, d]) => (
                    <div key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd>{formatDate(d!)}</dd>
                    </div>
                  ))}
              </dl>
            </article>
          ))
        ) : (
          <p className="rounded-xl border p-4">
            {p.status === "inactive"
              ? "This is a historical program. No current application window is listed."
              : "Current application details could not be confirmed. See the research notes and sources below."}
          </p>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">
          Funding, eligibility & attendance
        </h2>
        {p.cohorts.map((e) => (
          <div key={e.id} className="space-y-3 rounded-2xl border p-5">
            <h3 className="font-semibold">{e.name}</h3>
            <p>{e.description}</p>
            <p className="text-sm text-muted-foreground">
              {[
                e.location.is_hybrid
                  ? "Hybrid attendance"
                  : e.location.is_virtual
                    ? "Online"
                    : null,
                e.location.city,
                e.location.country,
              ]
                .filter(Boolean)
                .join(" · ") || "Location requirements not confirmed."}
            </p>
          </div>
        ))}
        {p.facts?.eligibility && (
          <p>
            {p.facts.eligibility.value}{" "}
            <a href={p.facts.eligibility.source_url} className="underline">
              Eligibility source
            </a>
          </p>
        )}
        {p.notes.length > 0 && (
          <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed">
            {p.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted-foreground">
          Unpublished funding, fees, solo-founder eligibility and residency
          requirements remain unconfirmed. An advertised maximum is not a
          guaranteed investment.
        </p>
      </section>
      <section id="sources" className="space-y-4 scroll-mt-4">
        <h2 className="text-2xl font-semibold">Sources & verification</h2>
        <p className="text-sm">
          {p.status === "verified"
            ? "Official information reviewed"
            : p.status === "inactive"
              ? "Inactive program"
              : p.status === "not_found"
                ? "Program not confirmed"
                : "Current details need confirmation"}{" "}
          ·{" "}
          <Link className="underline" href="/methodology">
            Research policy
          </Link>
        </p>
        <ul className="space-y-4">
          {p.sources.map((s) => (
            <li key={s.url} className="rounded-xl border p-4 text-sm">
              <p className="font-semibold">
                {p.status === "inactive" ? (
                  s.title
                ) : (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    data-track="source_click"
                    data-program={p.slug}
                    className="underline"
                  >
                    {s.title}
                  </a>
                )}
              </p>
              <p className="mt-2">{s.supports}</p>
              <p className="mt-2 text-muted-foreground">
                Checked {s.accessed_at}
              </p>
            </li>
          ))}
        </ul>
        <a
          className="inline-block text-sm underline"
          href={`https://github.com/IgorShadurin/foundercal.org/issues/new?title=${encodeURIComponent("Data correction: " + p.name)}`}
        >
          Report a correction for this program
        </a>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Explore other programs</h2>
        <p className="text-sm text-muted-foreground">
          Related research; eligibility and application availability differ.
        </p>
        <div className="grid items-start gap-4 md:grid-cols-2">
          {related.map((program) => (
            <ProgramCard key={program.slug} program={program} now={iso} />
          ))}
        </div>
      </section>
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
