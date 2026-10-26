import type { Metadata } from "next";
import { EventCalendar } from "@/components/event-calendar";
import { SiteFooter } from "@/components/site-footer";
import { programs } from "@/lib/catalog";
import { parseCalendarQuery } from "@/lib/calendar-query";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Startup Accelerator & Funding Directory",
  description:
    "Search unique founder programs by name, region, sector and type. See application status, published deadlines and dated research sources.",
  alternates: { canonical: "/imported-accelerators" },
  openGraph: {
    url: "/imported-accelerators",
    title: "Startup Accelerator & Funding Directory",
  },
};
export default async function Directory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const now = new Date().toISOString(),
    params = await searchParams;
  const query = parseCalendarQuery(
    new URLSearchParams(
      Object.entries(params).flatMap(([k, v]) =>
        typeof v === "string" ? [[k, v]] : [],
      ),
    ),
    now.slice(0, 10),
    true,
  );
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <EventCalendar
        programs={programs}
        initialNow={now}
        initialQuery={query}
        directory
      />
      <section className="mt-8 text-sm">
        <h2 className="font-semibold">Research downloads</h2>
        <div className="mt-3 flex flex-wrap gap-4">
          <a className="underline" href="/events.json">
            Calendar JSON
          </a>
          <a
            className="underline"
            href="https://raw.githubusercontent.com/IgorShadurin/foundercal.org/master/data/accelerators-master.csv"
          >
            Core CSV
          </a>
          <a
            className="underline"
            href="https://raw.githubusercontent.com/IgorShadurin/foundercal.org/master/data/accelerators-crypto.csv"
          >
            Crypto CSV
          </a>
          <a className="underline" href="/events-archive.json">
            Historical JSON archive
          </a>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
