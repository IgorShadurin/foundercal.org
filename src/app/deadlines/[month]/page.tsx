import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { monthsWithDeadlines, monthPrograms } from "@/lib/collections";
import { programs } from "@/lib/catalog";
import { applicationRounds, BASE_URL } from "@/lib/program-model";
import { ProgramCard } from "@/components/program-card";
import { SiteFooter } from "@/components/site-footer";
export const revalidate = 3600;
export const dynamicParams = false;
export function generateStaticParams() {
  return monthsWithDeadlines(programs).map((month) => ({ month }));
}
function monthLabel(month: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T12:00:00Z`));
}
type Props = { params: Promise<{ month: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  if (!monthsWithDeadlines(programs).includes(month)) return {};
  const title = `Startup Application Deadlines in ${monthLabel(month)}`;
  return {
    title,
    description: `Published accelerator and funding deadlines for ${monthLabel(month)}, with official sources and application requirements.`,
    alternates: { canonical: `/deadlines/${month}` },
    openGraph: { title, url: `${BASE_URL}/deadlines/${month}` },
  };
}
export default async function Month({ params }: Props) {
  const { month } = await params;
  if (!monthsWithDeadlines(programs).includes(month)) notFound();
  const now = new Date(),
    items = monthPrograms(month, programs);
  const rows = items
    .map((program) => ({
      program,
      rounds: program.cohorts
        .flatMap((e) => applicationRounds(e, program.facts))
        .filter((r) => r.close_date.startsWith(month)),
    }))
    .sort((a, b) =>
      a.rounds[0].close_date.localeCompare(b.rounds[0].close_date),
    );
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
      <Link href="/" className="text-sm underline">
        FounderCal deadline calendar
      </Link>
      <h1 className="text-3xl font-semibold">
        Startup application deadlines in {monthLabel(month)}
      </h1>
      <p className="max-w-3xl text-muted-foreground">
        {items.length} programs with published application cutoffs. This page
        retains closed windows as historical context; current application status
        is shown separately. Check eligibility and exact cutoff times on each
        program page.
      </p>
      {month < now.toISOString().slice(0, 7) && (
        <p className="rounded-xl border p-4 font-medium">
          Historical month.{" "}
          <Link href="/programs/upcoming-deadlines" className="underline">
            See upcoming deadlines
          </Link>
          .
        </p>
      )}
      <div className="grid items-start gap-4 md:grid-cols-2">
        {rows.map(({ program, rounds }) => (
          <ProgramCard
            key={program.slug}
            program={program}
            now={now.toISOString()}
            highlight={{ date: rounds[0].close_date, label: rounds[0].label }}
          />
        ))}
      </div>
      <SiteFooter />
    </main>
  );
}
