import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";

import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  ExternalLink,
  List,
  SearchCheck,
  UserRound,
  Users,
} from "lucide-react";

import rows from "@/data/yc-alternatives-solo-founders-100.json";
import { Card } from "@/components/ui/card";
import { SiteFooter } from "@/components/site-footer";

type SoloAlternative = {
  rank: number;
  option: string;
  category: string;
  best_for: string;
  yc_substitute: string;
  why_it_works: string;
  watch_out: string;
  solo_founder_fit: "High" | "Medium" | "Niche" | string;
  source: string;
};

const FIT_SORT_ORDER: Record<string, number> = {
  High: 0,
  Medium: 1,
  Niche: 2,
};

const alternatives = [...(rows as SoloAlternative[])].sort((a, b) => {
  const fitDiff = (FIT_SORT_ORDER[a.solo_founder_fit] ?? 99) - (FIT_SORT_ORDER[b.solo_founder_fit] ?? 99);
  if (fitDiff !== 0) {
    return fitDiff;
  }
  return Number(a.rank) - Number(b.rank);
});

const PAGE_PATH = "/alternatives-to-y-combinator-for-solo-founders";
const BASE_URL = "https://foundercal.org";
const SEO_TITLE = "Alternatives to Y Combinator for Solo Founders: 100 Picks";
const SEO_DESCRIPTION =
  "Compare 100 alternatives to Y Combinator for solo founders, ranked by fit, with why-it-works notes, watch-outs, use cases, and source links for every option.";
const SEO_KEYWORDS = [
  "alternatives to y combinator for solo founders",
  "y combinator alternatives for solo founder",
  "solo founder accelerator alternatives",
  "startup programs for solo founders",
  "yc alternatives for solo founders",
  "best accelerator for solo founders",
  "solo founder startup accelerator list",
  "founder program comparison",
];

const FIT_LABELS: Record<string, string> = {
  High: "Best for solo founders",
  Medium: "Good with caveats",
  Niche: "Narrow fit",
};

const FAVICON_DIR = path.join(process.cwd(), "public", "favicons");
const FAVICON_PUBLIC_PREFIX = "/favicons";
const FAVICON_EXTENSIONS = [".png", ".ico", ".jpg", ".jpeg", ".svg", ".webp"] as const;

const faviconLookup = createFaviconLookup();
const stats = buildStats(alternatives);

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    absolute: SEO_TITLE,
  },
  description: SEO_DESCRIPTION,
  applicationName: "FounderCal.org",
  referrer: "origin-when-cross-origin",
  authors: [{ name: "FounderCal", url: BASE_URL }],
  creator: "FounderCal",
  publisher: "FounderCal",
  generator: "Next.js",
  keywords: SEO_KEYWORDS,
  category: "Startup Accelerators",
  classification: "Startup accelerator alternatives and solo founder program comparison",
  alternates: {
    canonical: PAGE_PATH,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    noarchive: false,
    nosnippet: false,
    noimageindex: false,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "article",
    url: PAGE_PATH,
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    siteName: "FounderCal.org",
    locale: "en_US",
    section: "Startup Accelerators",
    tags: SEO_KEYWORDS,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Alternatives to Y Combinator for Solo Founders",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_TITLE,
    description: SEO_DESCRIPTION,
    creator: "@Web3Igor",
    site: "@Web3Igor",
    images: [
      {
        url: "/og-image.png",
        alt: "Alternatives to Y Combinator for Solo Founders",
      },
    ],
  },
};

export default function SoloFoundersAlternativesPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
        <header className="rounded-3xl border border-dashed bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-6 shadow-sm dark:from-zinc-900 dark:via-zinc-950 dark:to-black sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Solo founder keyword page</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Alternatives to Y Combinator for Solo Founders
          </h1>
          <p className="mt-4 max-w-4xl text-base text-muted-foreground sm:text-lg">
            Exact-match dataset based on your source CSV, converted to JSON and rendered as a searchable-style comparison
            table with source links and icon support where favicon assets exist.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium text-muted-foreground">
            <Link
              className="inline-flex items-center gap-2 underline-offset-4 hover:text-foreground hover:underline"
              href="/"
            >
              <List className="size-4 text-[#f97316]" />
              Back to calendar
            </Link>
            <Link
              className="inline-flex items-center gap-2 underline-offset-4 hover:text-foreground hover:underline"
              href="/y-combinator-alternatives"
            >
              Open YC alternatives page
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<SearchCheck className="size-4" />} label="Total options" value={String(stats.total)} />
            <StatCard icon={<UserRound className="size-4" />} label="High solo fit" value={String(stats.highFit)} />
            <StatCard icon={<Users className="size-4" />} label="Medium solo fit" value={String(stats.mediumFit)} />
            <StatCard icon={<ExternalLink className="size-4" />} label="Unique categories" value={String(stats.uniqueCategories)} />
          </div>
        </header>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">100 alternatives in one table</h2>
            <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Back to FounderCal
            </Link>
          </div>
          <Card className="overflow-hidden border">
            <table className="w-full table-fixed divide-y divide-border text-sm">
              <colgroup>
                <col className="w-[5%]" />
                <col className="w-[31%]" />
                <col className="w-[27%]" />
                <col className="w-[16%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-muted/95 text-left text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
                <tr>
                  <th scope="col" className="px-3 py-3 font-medium">#</th>
                  <th scope="col" className="px-3 py-3 font-medium">Option</th>
                  <th scope="col" className="px-3 py-3 font-medium">Why it works</th>
                  <th scope="col" className="px-3 py-3 font-medium">Best for</th>
                  <th scope="col" className="px-3 py-3 font-medium">YC substitute</th>
                  <th scope="col" className="px-3 py-3 font-medium">Watch-out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card text-foreground">
                {alternatives.map((entry) => (
                  <tr key={`${entry.rank}-${entry.option}`} className="align-top odd:bg-background/70">
                    <td className="px-3 py-3 font-medium text-muted-foreground">{entry.rank}</td>
                    <td className="px-3 py-3 break-words">
                      <OptionCell
                        name={entry.option}
                        source={entry.source}
                        category={entry.category}
                        fit={entry.solo_founder_fit}
                      />
                    </td>
                    <td className="px-3 py-3 break-words text-muted-foreground">{entry.why_it_works}</td>
                    <td className="px-3 py-3 break-words text-muted-foreground">{entry.best_for}</td>
                    <td className="px-3 py-3 break-words text-muted-foreground">{entry.yc_substitute}</td>
                    <td className="px-3 py-3 break-words text-muted-foreground">{entry.watch_out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>
        <SiteFooter />
      </div>
    </main>
  );
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background/80 px-4 py-4 shadow-sm">
      <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function OptionCell({ name, source, category, fit }: { name: string; source: string; category: string; fit: string }) {
  const hostname = getHostnameFromUrl(source);
  const faviconPath = hostname ? resolveFaviconPath(hostname) : undefined;
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-start gap-2.5">
        {faviconPath ? (
          <Image
            src={faviconPath}
            alt={`${name} logo`}
            width={28}
            height={28}
            unoptimized
            className="h-7 w-7 rounded-md border object-cover"
          />
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed text-[10px] font-semibold uppercase text-muted-foreground">
            {getInitials(name)}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link
              href={source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 break-words font-medium underline-offset-4 hover:text-primary hover:underline"
            >
              <span className="break-words">{name}</span>
              <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">Visit source for {name}</span>
            </Link>
            <span
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground"
              title={`Type: ${category}`}
              aria-label={`Type: ${category}`}
            >
              <List className="size-3" aria-hidden="true" />
              <span className="sr-only">Type: {category}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="mt-1">
        <FitBadge fit={fit} />
      </div>
    </div>
  );
}

function FitBadge({ fit }: { fit: string }) {
  const tone =
    fit === "High"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
      : fit === "Medium"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        : "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
  const explanation = FIT_LABELS[fit] ?? "Specialized fit";
  const icon =
    fit === "High"
      ? <CheckCircle2 className="size-3.5" aria-hidden="true" />
      : fit === "Medium"
        ? <AlertTriangle className="size-3.5" aria-hidden="true" />
        : <CircleDashed className="size-3.5" aria-hidden="true" />;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}
      title={explanation}
      aria-label={`${fit}: ${explanation}`}
    >
      {icon}
      {fit} fit
    </span>
  );
}

function createFaviconLookup() {
  if (!fs.existsSync(FAVICON_DIR)) {
    return new Map<string, string>();
  }

  const files = fs.readdirSync(FAVICON_DIR);
  const lookup = new Map<string, string>();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!FAVICON_EXTENSIONS.includes(ext as (typeof FAVICON_EXTENSIONS)[number])) {
      continue;
    }
    const key = path.basename(file, ext).toLowerCase();
    if (!lookup.has(key)) {
      lookup.set(key, `${FAVICON_PUBLIC_PREFIX}/${file}`);
    }
  }

  return lookup;
}

function resolveFaviconPath(hostname: string) {
  const candidates = buildHostCandidates(hostname);
  for (const candidate of candidates) {
    const found = faviconLookup.get(candidate);
    if (found) {
      return found;
    }
  }
  return undefined;
}

function buildHostCandidates(hostname: string) {
  const normalized = hostname.toLowerCase();
  const withoutWww = normalized.replace(/^www\./, "");
  const segments = withoutWww.split(".");
  const list = [normalized, withoutWww];

  if (segments.length > 2) {
    list.push(segments.slice(1).join("."));
  }

  return Array.from(new Set(list));
}

function getHostnameFromUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

function buildStats(records: SoloAlternative[]) {
  return {
    total: records.length,
    highFit: records.filter((record) => record.solo_founder_fit === "High").length,
    mediumFit: records.filter((record) => record.solo_founder_fit === "Medium").length,
    uniqueCategories: new Set(records.map((record) => record.category)).size,
  };
}
