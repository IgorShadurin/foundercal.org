import type { Metadata } from "next";
import type { ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";

import { CalendarClock, Github, Link as LinkGlyph, List, MessageSquarePlus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { importedAccelerators, type ImportedAcceleratorWithSlug } from "@/lib/accelerators";

export const metadata: Metadata = {
  title: "FounderCal.org — Static Accelerator Lists",
  description:
    "Browse every accelerator FounderCal tracks, including core programs, crypto cohorts, and community-submitted deadlines.",
  keywords: [
    "accelerator database",
    "startup accelerator list",
    "crypto accelerator directory",
    "community accelerator tracker",
    "founder program CSV",
    "manual accelerator research",
  ],
};

const HERO_ICON = {
  src: "/android-chrome-192x192.png",
  alt: "FounderCal icon",
};

const accelerators: ImportedAcceleratorWithSlug[] = importedAccelerators;

type CsvAccelerator = {
  accelerator: string;
  website?: string;
  checked_at?: string;
};

const CSV_FILES = [
  {
    title: "Core Accelerators",
    description: "Source of truth for every program powering FounderCal.",
    file: "data/accelerators-master.csv",
  },
  {
    title: "Crypto Accelerators",
    description: "Specialized list focused on Web3 and crypto-native cohorts.",
    file: "data/accelerators-crypto.csv",
  },
];

const csvSections = CSV_FILES.map((section) => ({
  ...section,
  records: parseCsvFile(section.file),
}));

const FAVICON_DIR = path.join(process.cwd(), "public", "favicons");
const FAVICON_PUBLIC_PREFIX = "/favicons";
const FAVICON_EXTENSIONS = [".png", ".ico", ".jpg", ".jpeg", ".svg", ".webp"] as const;

type TableRow = Record<string, ReactNode>;

type TableColumn = {
  key: string;
  label: string;
  className?: string;
};

const notionColumns: TableColumn[] = [
  { key: "name", label: "Name" },
  { key: "apply", label: "Apply URL" },
  { key: "description", label: "Description", className: "min-w-[16rem]" },
  { key: "terms", label: "Terms", className: "min-w-[12rem]" },
  { key: "notes", label: "Notes", className: "min-w-[16rem]" },
];

const csvColumns: TableColumn[] = [
  { key: "name", label: "Accelerator" },
  { key: "website", label: "Website" },
];

const notionRows: TableRow[] = accelerators.map((accelerator) => {
  const websiteUrl = normalizeUrl(accelerator.website);
  const applyUrl = normalizeUrl(accelerator.applyUrl);
  const deadlineHref = `/deadline/${accelerator.slug}`;
  return {
    name: <NameCell label={accelerator.name} websiteUrl={websiteUrl} />,
    apply: <ApplyCell applyUrl={applyUrl} deadlineHref={deadlineHref} />,
    description: renderRichText(accelerator.description),
    terms: renderRichText(accelerator.terms),
    notes: renderRichText(accelerator.notes),
  } satisfies TableRow;
});

const csvSectionsRows = csvSections.map((section) => ({
  ...section,
  rows: section.records.map((record) => {
    const websiteUrl = normalizeUrl(record.website);
    return {
      name: <NameCell label={record.accelerator} websiteUrl={websiteUrl} />,
      website: websiteUrl ? <InlineLink href={websiteUrl}>{getDisplayHostname(websiteUrl)}</InlineLink> : "—",
    } satisfies TableRow;
  }),
}));

export default function ImportedAcceleratorsPage() {
  const totalTracked =
    accelerators.length + csvSectionsRows.reduce((total, section) => total + section.rows.length, 0);

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <Hero totalTracked={totalTracked} />

        <section className="space-y-10">
          <DatasetSection
            title="Community snapshot"
            description="Curated submissions from the FounderCal community."
          >
            <DataTable columns={notionColumns} rows={notionRows} emptyMessage="No accelerators found in the snapshot." />
          </DatasetSection>

          {csvSectionsRows.map((section) => (
            <DatasetSection key={section.title} title={section.title} description={section.description}>
              <DataTable columns={csvColumns} rows={section.rows} emptyMessage="No entries yet." />
            </DatasetSection>
          ))}
        </section>

        <Footer />
      </div>
    </main>
  );
}

function Hero({ totalTracked }: { totalTracked: number }) {
  const formatNumber = (value: number) => value.toLocaleString();
  return (
    <header className="rounded-3xl border border-dashed bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-6 text-foreground shadow-sm dark:from-zinc-900 dark:via-zinc-950 dark:to-black sm:p-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 text-left">
          <div className="flex items-center gap-3">
            <Image
              src={HERO_ICON.src}
              alt={HERO_ICON.alt}
              width={96}
              height={96}
              className="h-14 w-14 flex-shrink-0 object-contain sm:h-20 sm:w-20"
              priority
            />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-wide text-primary">FounderCal.org</p>
              <h1 className="text-2xl font-semibold sm:text-4xl">Manual opportunity trackers</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground sm:text-lg">
            The same data that powers the calendar, formatted for deep dives and ready reference.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm font-medium text-muted-foreground sm:justify-start">
            <Link className="inline-flex items-center gap-2 underline-offset-4 hover:text-foreground hover:underline" href="/">
              <List className="size-4 text-[#f97316]" /> Back to calendar
            </Link>
            <Link
              className="inline-flex items-center gap-2 underline-offset-4 hover:text-foreground hover:underline"
              href="https://github.com/IgorShadurin/foundercal.org/issues/new"
              target="_blank"
              rel="noreferrer"
            >
              <MessageSquarePlus className="size-4 text-[#22c55e]" /> Send a suggestion
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-4 lg:min-w-[260px]">
          <div className="space-y-3 rounded-2xl border bg-white/70 px-6 py-5 text-center shadow-sm dark:bg-zinc-900/80 sm:px-8 sm:py-6">
            <div className="flex items-center justify-center gap-4">
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2da6df]/40" style={{ animationDuration: "3s" }} />
                <span className="inline-flex h-3 w-3 rounded-full bg-[#2da6df]" />
              </span>
              <p className="text-5xl font-black text-foreground sm:text-6xl">{formatNumber(totalTracked)}</p>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Programs catalogued</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function DatasetSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <SectionHeader title={title} description={description} />
      {children}
    </section>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function DataTable({ columns, rows, emptyMessage }: { columns: TableColumn[]; rows: TableRow[]; emptyMessage: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <Card className="overflow-hidden border">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={`px-4 py-3 font-medium ${column.className ?? ""}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card text-foreground">
            {rows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`} className="hover:bg-muted/60">
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column.key}`} className={`px-4 py-3 align-top ${column.className ?? ""}`}>
                    {row[column.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Footer() {
  return (
    <footer className="border-t border-dashed border-muted-foreground/40 pt-6 text-sm text-muted-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="https://github.com/IgorShadurin/foundercal.org"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 font-medium text-foreground transition hover:text-primary"
        >
          <Github className="size-4" /> Source code on GitHub
        </Link>
        <p>
          Ship a feature or add an event via{' '}
          <Link
            href="https://github.com/IgorShadurin/foundercal.org/issues/new"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Send a suggestion
          </Link>
          —collabs keep FounderCal sharp.
        </p>
      </div>
      <div className="mt-3 text-xs text-muted-foreground/80">
        <p>
          Built by{' '}
          <Link
            href="https://x.com/Web3Igor"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            @Web3Igor
          </Link>
          {' '}– Inspired by{' '}
          <Link
            href="https://x.com/nestymee/status/1988231483153321985"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            @nestymee
          </Link>
        </p>
        <p className="mt-1">
          Want to create a viral video with AI? Visit{' '}
          <Link
            href="https://yumcut.com/?utm_source=foundercal"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            YumCut
          </Link>
        </p>
      </div>
    </footer>
  );
}

function NameCell({ label, websiteUrl }: { label: string; websiteUrl?: string }) {
  const hostname = getHostnameFromUrl(websiteUrl);
  return (
    <div className="flex items-center gap-3">
      <FaviconBadge hostname={hostname} label={label} />
      <span className="font-medium">{label}</span>
    </div>
  );
}

function ApplyCell({ applyUrl, deadlineHref }: { applyUrl?: string; deadlineHref: string }) {
  return (
    <div className="flex flex-col gap-1">
      {applyUrl ? (
        <InlineLink href={applyUrl}>{getDisplayHostname(applyUrl)}</InlineLink>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
      <DeadlineLink href={deadlineHref} />
    </div>
  );
}

function DeadlineLink({ href }: { href: string }) {
  return (
    <Link className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline" href={href}>
      <CalendarClock className="size-3 text-muted-foreground" aria-hidden="true" />
      Deadline
    </Link>
  );
}

function FaviconBadge({ hostname, label }: { hostname?: string; label: string }) {
  const assetPath = resolveFaviconPath(hostname);
  if (assetPath) {
    return (
      <Image
        src={assetPath}
        alt={`${label} logo`}
        width={32}
        height={32}
        unoptimized
        className="h-8 w-8 rounded-md border border-border object-cover"
      />
    );
  }

  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-zinc-100 text-xs font-semibold uppercase text-muted-foreground">
      {getInitials(label)}
    </span>
  );
}

function InlineLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <LinkGlyph className="size-3 text-muted-foreground" aria-hidden="true" />
    </Link>
  );
}

function resolveFaviconPath(hostname?: string) {
  if (!hostname) return undefined;
  const candidates = new Set<string>();
  candidates.add(sanitizeHost(hostname));
  const withoutWww = hostname.replace(/^www\./, "");
  candidates.add(sanitizeHost(withoutWww));
  if (!hostname.startsWith("www.")) {
    candidates.add(sanitizeHost(`www.${withoutWww}`));
  }

  for (const candidate of candidates) {
    if (!candidate) continue;
    for (const ext of FAVICON_EXTENSIONS) {
      const filename = `${candidate}${ext}`;
      if (fs.existsSync(path.join(FAVICON_DIR, filename))) {
        return `${FAVICON_PUBLIC_PREFIX}/${filename}`;
      }
    }
  }
  return undefined;
}

function sanitizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
}

function getHostnameFromUrl(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function getInitials(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return "?";
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

function normalizeUrl(raw?: string | null) {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function getDisplayHostname(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function renderRichText(value?: string | null): ReactNode {
  if (!value || value.trim().length === 0) {
    return "—";
  }
  const text = value;
  const regex = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let matchFound = false;

  text.replace(regex, (match, _p1, offset) => {
    matchFound = true;
    const start = offset as number;
    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }
    const normalized = normalizeUrl(match) ?? match;
    nodes.push(
      <InlineLink key={`auto-link-${start}`} href={normalized}>
        {match}
      </InlineLink>
    );
    lastIndex = start + match.length;
    return match;
  });

  if (!matchFound) {
    return text;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function parseCsvFile(filePath: string): CsvAccelerator[] {
  const absolutePath = path.join(process.cwd(), filePath);
  const raw = fs.readFileSync(absolutePath, "utf-8").trim();
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header.replace(/"/g, "")] = values[index] ?? "";
    });
    return {
      accelerator: record["accelerator"] ?? "Untitled",
      website: record["website"] || undefined,
      checked_at: record["checked_at"] || undefined,
    } satisfies CsvAccelerator;
  });
}

function splitCsvLine(line: string) {
  let normalized = line.trim();
  if (normalized.startsWith("\"") && normalized.endsWith("\"")) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.split(/","/).map((value) => value.replace(/""/g, "\"").trim());
}
