import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";

import { ExternalLink, SearchCheck, UserRound, Users } from "lucide-react";

import rows from "@/data/yc-alternatives-solo-founders-100.json";
import { Card } from "@/components/ui/card";

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

const alternatives = [...(rows as SoloAlternative[])].sort((a, b) => Number(a.rank) - Number(b.rank));

const PAGE_PATH = "/alternatives-to-y-combinator-for-solo-founders";
const BASE_URL = "https://foundercal.org";

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
  title: "Alternatives to Y Combinator for Solo Founders | FounderCal",
  description:
    "Alternatives to Y Combinator for solo founders: 100 vetted options with category, solo-founder fit, YC substitute angle, and source links.",
  keywords: [
    "alternatives to y combinator for solo founders",
    "y combinator alternatives for solo founder",
    "solo founder accelerator alternatives",
    "startup programs for solo founders",
  ],
  alternates: {
    canonical: `${BASE_URL}${PAGE_PATH}`,
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
            <div className="max-h-[75vh] overflow-auto">
              <table className="min-w-[1300px] divide-y divide-border text-sm">
                <thead className="sticky top-0 z-10 bg-muted/95 text-left text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
                  <tr>
                    <th scope="col" className="w-14 px-3 py-3 font-medium">#</th>
                    <th scope="col" className="min-w-[230px] px-3 py-3 font-medium">Option</th>
                    <th scope="col" className="min-w-[160px] px-3 py-3 font-medium">Category</th>
                    <th scope="col" className="min-w-[150px] px-3 py-3 font-medium">Solo founder fit</th>
                    <th scope="col" className="min-w-[280px] px-3 py-3 font-medium">Best for</th>
                    <th scope="col" className="min-w-[220px] px-3 py-3 font-medium">YC substitute</th>
                    <th scope="col" className="min-w-[320px] px-3 py-3 font-medium">Why it works</th>
                    <th scope="col" className="min-w-[320px] px-3 py-3 font-medium">Watch-out</th>
                    <th scope="col" className="min-w-[150px] px-3 py-3 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card text-foreground">
                  {alternatives.map((entry) => (
                    <tr key={`${entry.rank}-${entry.option}`} className="align-top odd:bg-background/70">
                      <td className="px-3 py-3 font-medium text-muted-foreground">{entry.rank}</td>
                      <td className="px-3 py-3">
                        <OptionCell name={entry.option} source={entry.source} />
                      </td>
                      <td className="px-3 py-3">{entry.category}</td>
                      <td className="px-3 py-3">
                        <FitBadge fit={entry.solo_founder_fit} />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{entry.best_for}</td>
                      <td className="px-3 py-3 text-muted-foreground">{entry.yc_substitute}</td>
                      <td className="px-3 py-3 text-muted-foreground">{entry.why_it_works}</td>
                      <td className="px-3 py-3 text-muted-foreground">{entry.watch_out}</td>
                      <td className="px-3 py-3">
                        <Link
                          href={entry.source}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                        >
                          Visit
                          <ExternalLink className="size-3.5" aria-hidden="true" />
                          <span className="sr-only">Visit source for {entry.option}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
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

function OptionCell({ name, source }: { name: string; source: string }) {
  const hostname = getHostnameFromUrl(source);
  const faviconPath = hostname ? resolveFaviconPath(hostname) : undefined;
  return (
    <div className="flex items-center gap-2.5">
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
      <span className="font-medium">{name}</span>
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

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {fit}
      <span className="ml-1 text-[10px] font-medium opacity-80">{FIT_LABELS[fit] ?? "Specialized fit"}</span>
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
