import Link from "next/link";

import { EventCalendar } from "@/components/event-calendar";
import { loadEventDataset, type EventRecord } from "@/lib/event-data";

const BASE_URL = "https://foundercal.org";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/IgorShadurin/foundercal.org/main";

export default function Home() {
  const { events, taxonomies } = loadEventDataset();
  const structuredData = buildDatasetSchema(events);

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto max-w-6xl">
        <EventCalendar events={events} taxonomies={taxonomies} />
        <FAQSection eventCount={events.length} />
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </div>
    </main>
  );
}

function buildDatasetSchema(events: EventRecord[]) {
  const eventSchemas = events.slice(0, 120).map(buildEventSchema).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "FounderCal Accelerator & Fellowship Deadlines",
    description:
      "Structured calendar of accelerator, fellowship, and grant programs with verified application windows and program timelines.",
    url: BASE_URL,
    keywords: [
      "startup accelerators",
      "founder fellowships",
      "grant deadlines",
      "demo day calendar",
    ],
    creator: {
      "@type": "Organization",
      name: "FounderCal",
      url: BASE_URL,
    },
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${BASE_URL}/events.json`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `${GITHUB_RAW_BASE}/data/accelerators-master.csv`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `${GITHUB_RAW_BASE}/data/accelerators-crypto.csv`,
      },
    ],
    hasPart: eventSchemas,
  };
}

function buildEventSchema(event: EventRecord) {
  const {
    name,
    description,
    website,
    organizer,
    categories,
    location,
    dates,
    id,
  } = event;

  const startDate = dates.program_start ?? dates.application_close ?? dates.application_open ?? undefined;
  const endDate = dates.program_end ?? dates.demo_day ?? undefined;
  const eventAttendanceMode = location.is_virtual
    ? "https://schema.org/OnlineEventAttendanceMode"
    : location.is_hybrid
      ? "https://schema.org/MixedEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode";

  const place = buildLocation(location);

  const schema = pruneEmpty({
    "@type": "Event",
    name,
    description,
    url: website ?? `${BASE_URL}#${id}`,
    startDate,
    endDate,
    eventAttendanceMode,
    eventStatus: "https://schema.org/EventScheduled",
    organizer: organizer
      ? {
          "@type": "Organization",
          name: organizer,
        }
      : undefined,
    location: place,
    about:
      categories.sectors.length > 0
        ? categories.sectors.map((sector) => ({
            "@type": "Thing",
            name: sector,
          }))
        : undefined,
    offers:
      categories.supports.length > 0
        ? [
            pruneEmpty({
              "@type": "Offer",
              name: `${name} application`,
              url: website ?? undefined,
              availabilityStarts: dates.application_open ?? undefined,
              availabilityEnds: dates.application_close ?? undefined,
            }),
          ]
        : undefined,
  });

  return schema;
}

function buildLocation(location: EventRecord["location"]) {
  if (!location.city && !location.country && !location.venue) {
    return location.is_virtual
      ? {
          "@type": "VirtualLocation",
          url: BASE_URL,
        }
      : undefined;
  }

  const fallbackLabel = [location.city, location.country].filter(Boolean).join(", ") || "Program venue";
  const locationName = location.venue ?? fallbackLabel;

  return {
    "@type": "Place",
    name: locationName,
    address: pruneEmpty({
      "@type": "PostalAddress",
      addressLocality: location.city ?? undefined,
      addressCountry: location.country_code ?? location.country ?? undefined,
    }),
  };
}

function pruneEmpty<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => {
      if (value == null) {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as Record<string, unknown>).length === 0) {
        return false;
      }
      return true;
    }),
  ) as T;
}

function FAQSection({ eventCount }: { eventCount: number }) {
  const faqs = [
    {
      question: "How do I plan accelerator applications with FounderCal?",
      answer:
        "Pick a start date, choose a 30/90/182/365-day window, and filter by region, sector, and support type. The calendar highlights how many programs are open now so you can stack applications without date conflicts.",
    },
    {
      question: "What information is stored in each program card?",
      answer:
        "Every card pulls from a verified record in events.json—application windows, program run dates, demo days, funding/support tags, and hybrid/virtual flags—so founders can quickly assess fit.",
    },
    {
      question: "Can researchers or AI assistants access the raw data?",
      answer:
        "Yes. Use the JSON feed for real-time cards, or download the core and crypto CSV trackers on /imported-accelerators to audit entries in bulk or power your own alerts.",
    },
    {
      question: "How often is the calendar verified?",
      answer:
        `Each of the ${eventCount} tracked programs carries a last_verified_utc or checked_at timestamp. The team re-checks rolling cohorts weekly and seasonal cohorts ahead of new application cycles.`,
    },
  ];

  return (
    <section className="mt-16 space-y-6 rounded-3xl border bg-card/40 p-6 shadow-sm">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ & How-To</p>
        <h2 className="text-2xl font-bold">Make the most of FounderCal</h2>
        <p className="text-muted-foreground">
          Practical answers for founders, operators, and researchers using the accelerator intelligence map.
        </p>
      </div>
      <dl className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.question} className="rounded-2xl border border-dashed bg-background/70 p-4">
            <dt className="text-lg font-semibold">{faq.question}</dt>
            <dd className="mt-2 text-muted-foreground leading-relaxed">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-12 border-t pt-6 text-sm text-muted-foreground">
      <p>
        Looking for deeper diligence? Read our <Link href="/y-combinator-alternatives" className="text-primary underline-offset-2 hover:underline">Y Combinator alternatives guide</Link> for check sizes,
        equity asks, and specialized cohorts.
      </p>
    </footer>
  );
}
