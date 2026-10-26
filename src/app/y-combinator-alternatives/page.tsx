import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getResearch, researchStatusLabel } from "@/lib/research";
import { SiteFooter } from "@/components/site-footer";

const comparisonSlugs = [
  "techstars", "500-global", "masschallenge", "antler", "entrepreneur-first",
  "sosv-hax-indiebio", "plug-and-play-tech-center", "berkeley-skydeck",
  "alchemist-accelerator", "launch-accelerator", "founders-inc-fellowship",
  "hf0-residency", "south-park-commons", "pearx", "ai2-incubator",
  "entrepreneurs-roundtable-accelerator", "outlier-ventures-base-camp",
  "startx", "the-batchery", "neo-accelerator",
];
const alternatives = comparisonSlugs.flatMap((slug) => {
  const research = getResearch(slug);
  return research ? [{ slug, research }] : [];
});

export const metadata: Metadata = {
  title: "Y Combinator Alternatives — FounderCal.org",
  description: "Compare founder programs using current official research, published dates, investment details, source links and clearly labeled uncertainties.",
  alternates: { canonical: "https://foundercal.org/y-combinator-alternatives" },
};

export default function YCombinatorAlternativesPage() {
  const yc = getResearch("y-combinator");
  return (
    <main className="bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <section className="rounded-3xl border bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-8 shadow-sm dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Y Combinator at a glance</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Compare YC with other founder programs</h1>
          <p className="mt-4 text-lg text-muted-foreground">{yc?.summary}</p>
          <p className="mt-4 text-muted-foreground">{yc?.proposed_event?.description}</p>
          <p className="mt-4 text-sm">{yc?.proposed_event?.dates.date_range_text}</p>
          <p className="mt-4 text-sm text-muted-foreground">Last checked: {yc?.checked_at}. Program availability and terms can change. Each comparison below links to the evidence behind its current status.</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {yc?.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="underline">{source.title}</a>)}
          </div>
        </section>
        <section className="rounded-3xl border bg-card/60 p-6">
          <h2 className="text-2xl font-semibold">What to compare</h2>
          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <p><strong>Capital and dilution.</strong> Separate cash, credits, fees, equity and future SAFE conversion. An advertised maximum is not a guaranteed investment.</p>
            <p><strong>Eligibility.</strong> Check whether the specific program accepts solo founders, your company stage, sector and country.</p>
            <p><strong>Format.</strong> Confirm relocation, in-person attendance and the precise cohort. Terms can differ by location.</p>
            <p><strong>Application timing.</strong> A program start date does not mean applications are still open. Missing dates remain unknown.</p>
          </div>
        </section>
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">{alternatives.length} researched alternatives</h2>
            <Link href="/" className="text-sm font-medium text-primary hover:underline">Back to calendar</Link>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {alternatives.map(({ slug, research }) => (
              <article key={slug} className="space-y-4 rounded-3xl border bg-background/80 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{researchStatusLabel(research.status)}</p>
                <h3 className="text-xl font-semibold"><Link href={`/deadline/${slug}`} className="hover:underline">{research.accelerator.name}</Link></h3>
                <p className="text-sm">{research.summary}</p>
                {research.proposed_event ? <div className="space-y-2 rounded-2xl border border-dashed p-4 text-sm"><p>{research.proposed_event.description}</p><p className="text-muted-foreground">{research.proposed_event.dates.date_range_text}</p></div> : null}
                {research.notes.length ? <p className="text-sm text-muted-foreground">{research.notes.join(" ")}</p> : null}
                <p className="text-xs text-muted-foreground">Checked {research.checked_at}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {research.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">{source.title}<ExternalLink className="size-3" /></a>)}
                </div>
              </article>
            ))}
          </div>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}
