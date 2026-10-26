import type { Metadata } from "next";
import { EventCalendar } from "@/components/event-calendar";
import { SiteFooter } from "@/components/site-footer";
import { programs } from "@/lib/catalog";
import { parseCalendarQuery } from "@/lib/calendar-query";
import { BASE_URL } from "@/lib/program-model";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Startup Accelerator Deadlines & Funding Programs",
  description:
    "Find published startup accelerator deadlines, rolling applications and grants. Compare programs, check official sources and save upcoming dates.",
  alternates: { canonical: BASE_URL },
  openGraph: {
    url: BASE_URL,
    title: "Startup Accelerator Deadlines & Funding Programs",
  },
};
export default async function Home({
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
  );
  const schema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "FounderCal program deadlines",
    description:
      "Published application deadlines with evidence links and review dates.",
    url: BASE_URL,
    license: `${BASE_URL}/license`,
    creator: { "@type": "Organization", name: "FounderCal", url: BASE_URL },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${BASE_URL}/events.json`,
    },
  };
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
      <EventCalendar
        programs={programs}
        initialNow={now}
        initialQuery={query}
      />
      <section className="mt-10 space-y-4 rounded-2xl border p-5">
        <h2 className="text-xl font-semibold">
          How to use the deadline calendar
        </h2>
        <p className="text-sm text-muted-foreground">
          Upcoming deadlines shows published application cutoffs in your
          selected window. Rolling applications have no fixed cutoff. Program
          dates are starts, finishes and demo days, not application windows.
        </p>
        <p className="text-sm text-muted-foreground">
          Sources and review dates appear on every program page. A review date
          does not guarantee that applications are still open. Confirm
          eligibility and any changes on the official site before applying.
        </p>
        <p className="text-sm">
          Saved programs stay in this browser. Calendar downloads include
          published deadlines; imported copies do not update automatically.
        </p>
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
