import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  collections,
  collectionPrograms,
  monthsWithDeadlines,
  type CollectionKey,
} from "@/lib/collections";
import { programs, lastContentDate } from "@/lib/catalog";
import { BASE_URL } from "@/lib/program-model";
import { ProgramCard } from "@/components/program-card";
import { SiteFooter } from "@/components/site-footer";
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ collection: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection } = await params;
  if (!Object.hasOwn(collections, collection)) return {};
  const c = collections[collection as CollectionKey];
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/programs/${collection}` },
    openGraph: {
      title: c.title,
      description: c.description,
      url: `${BASE_URL}/programs/${collection}`,
    },
  };
}
export default async function Collection({ params }: Props) {
  const { collection } = await params;
  if (!Object.hasOwn(collections, collection)) notFound();
  const c = collections[collection as CollectionKey],
    now = new Date(),
    items = collectionPrograms(collection as CollectionKey, programs, now);
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
      <Link href="/" className="text-sm underline">
        FounderCal deadline calendar
      </Link>
      <h1 className="text-3xl font-semibold sm:text-4xl">{c.title}</h1>
      <p className="max-w-3xl leading-relaxed text-muted-foreground">
        {c.description}
      </p>
      <p className="max-w-3xl rounded-xl border p-4 text-sm">{c.guidance}</p>
      <p className="text-sm">
        {items.length} researched programs · Open and rolling applications
        first. Latest page or source update {lastContentDate(items)}. Each
        program has its own review date.
      </p>
      <div className="grid items-start gap-4 md:grid-cols-2">
        {items.map((program) => (
          <ProgramCard
            key={program.slug}
            program={program}
            now={now.toISOString()}
          />
        ))}
      </div>
      {!items.length && (
        <p>
          No qualifying opportunities are currently confirmed.{" "}
          <Link href="/imported-accelerators" className="underline">
            Browse all research
          </Link>
          .
        </p>
      )}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Application deadlines by month
        </h2>
        <div className="flex flex-wrap gap-4">
          {monthsWithDeadlines(programs)
            .filter((m) => m >= now.toISOString().slice(0, 7))
            .map((m) => (
              <Link className="underline" key={m} href={`/deadlines/${m}`}>
                {m}
              </Link>
            ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
