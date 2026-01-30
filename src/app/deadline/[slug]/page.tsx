import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BadgeDollarSign,
  Bell,
  CalendarClock,
  ExternalLink,
  FileText,
  Globe,
  HelpCircle,
  List,
  ListChecks,
  StickyNote,
  Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { getAcceleratorBySlug, getDeadlineDetails, importedAccelerators } from "@/lib/accelerators";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return importedAccelerators.map((accelerator) => ({
    slug: accelerator.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const accelerator = getAcceleratorBySlug(slug);
  const year = new Date().getFullYear();
  if (!accelerator) {
    return {
      title: "Accelerator deadline not found — FounderCal.org",
      description: "We couldn’t match that accelerator to a deadline page.",
    };
  }
  const title = `${accelerator.name} application deadline ${year}`;
  const description = `Track the latest application deadline details for ${accelerator.name}.`;
  return {
    title: { absolute: title },
    description,
    keywords: [
      accelerator.name,
      "accelerator application deadline",
      "startup accelerator",
      "founder program",
      "application dates",
    ],
    alternates: {
      canonical: `/deadline/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `/deadline/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function DeadlinePage({ params }: PageProps) {
  const { slug } = await params;
  const accelerator = getAcceleratorBySlug(slug);
  if (!accelerator) {
    notFound();
  }

  const year = new Date().getFullYear();
  const deadlineDetails = getDeadlineDetails(accelerator);
  const websiteUrl = normalizeUrl(accelerator.website);
  const applyUrl = normalizeUrl(accelerator.applyUrl);
  const hasDeadlineDetails = deadlineDetails.length > 0;
  const summaryItems = [
    { label: "Description", value: accelerator.description?.trim() || "—", icon: FileText },
    { label: "Terms", value: accelerator.terms?.trim() || "—", icon: BadgeDollarSign },
    { label: "Notes", value: accelerator.notes?.trim() || "—", icon: StickyNote },
  ];
  const baseUrl = "https://foundercal.org";
  const pageUrl = `${baseUrl}/deadline/${accelerator.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${accelerator.name} application deadline ${year}`,
    description: accelerator.description || `Application deadline details for ${accelerator.name}.`,
    url: pageUrl,
    about: {
      "@type": "Organization",
      name: accelerator.name,
      url: websiteUrl ?? applyUrl ?? pageUrl,
    },
    isPartOf: {
      "@type": "WebSite",
      name: "FounderCal.org",
      url: baseUrl,
    },
  };
  const faqItems = buildFaqItems({
    acceleratorName: accelerator.name,
    description: accelerator.description,
    terms: accelerator.terms,
    notes: accelerator.notes,
    websiteUrl,
    applyUrl,
    deadlineDetails,
    hasDeadlineDetails,
  });

  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-muted-foreground">
          <Link
            className="inline-flex items-center gap-2 underline-offset-4 hover:text-foreground hover:underline"
            href="/imported-accelerators"
          >
            <List className="size-4 text-[#f97316]" /> Back to imported accelerators
          </Link>
          <Link
            className="inline-flex items-center gap-2 underline-offset-4 hover:text-foreground hover:underline"
            href="/"
          >
            <CalendarClock className="size-4 text-[#2da6df]" /> FounderCal calendar
          </Link>
        </div>

        <header className="space-y-4 rounded-3xl border border-dashed bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-6 shadow-sm dark:from-zinc-900 dark:via-zinc-950 dark:to-black sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <CalendarClock className="size-4" /> Accelerator deadline
          </div>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {accelerator.name} application deadline {year}
          </h1>
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-3 py-1">
              <CalendarClock className="size-3 text-primary" aria-hidden="true" />
              {hasDeadlineDetails ? "Deadline info available" : "Deadline info coming soon"}
            </span>
            {websiteUrl ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-3 py-1">
                <ExternalLink className="size-3 text-primary" aria-hidden="true" />
                Official site
              </span>
            ) : null}
          </div>
          {accelerator.description ? (
            <p className="text-base text-muted-foreground">{accelerator.description}</p>
          ) : null}
        </header>

        <Card className="space-y-6 p-6">
          <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Program snapshot</div>
          <div className="grid gap-4 text-sm text-foreground sm:grid-cols-3">
            {summaryItems.map((item) => {
              const Icon = item.icon;
              return (
              <div key={item.label} className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {item.label}
                </p>
                <p className="mt-2 text-sm text-foreground">{item.value}</p>
              </div>
            );
            })}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <CalendarClock className="size-4 text-primary" aria-hidden="true" />
            Deadline details
          </div>
          {hasDeadlineDetails ? (
            <ul className="space-y-3 text-sm text-foreground">
              {deadlineDetails.map((detail) => (
                <li key={detail} className="rounded-2xl border border-border bg-muted/40 px-4 py-3">
                  {detail}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Deadline information will be available soon. Subscribe to the{" "}
              <Link
                href="https://t.me/Web3IgorBuzz"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Telegram channel
              </Link>{" "}
              to get the actual information.
            </p>
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <ExternalLink className="size-4 text-primary" aria-hidden="true" />
            Program links
          </div>
          <div className="flex flex-col gap-3 text-sm">
            {websiteUrl ? (
              <ExternalLinkRow label="Website" href={websiteUrl} />
            ) : (
              <span className="text-muted-foreground">Website: —</span>
            )}
            {applyUrl ? (
              <ExternalLinkRow label="Apply" href={applyUrl} />
            ) : (
              <span className="text-muted-foreground">Apply: —</span>
            )}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <HelpCircle className="size-4 text-primary" aria-hidden="true" />
            FAQ
          </div>
          <div className="space-y-4 text-sm">
            {faqItems.map((item, index) => (
              <div key={`faq-${index}`} className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <item.icon className="size-4 text-primary" aria-hidden="true" />
                  {item.question}
                </p>
                <div className="mt-2 text-muted-foreground">{item.answer}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

function ExternalLinkRow({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-[72px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <Link
        className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
        href={href}
        target="_blank"
        rel="noreferrer"
      >
        {getDisplayHostname(href)}
        <ExternalLink className="size-3 text-muted-foreground" aria-hidden="true" />
      </Link>
    </div>
  );
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

function buildFaqItems({
  acceleratorName,
  description,
  terms,
  notes,
  websiteUrl,
  applyUrl,
  deadlineDetails,
  hasDeadlineDetails,
}: {
  acceleratorName: string;
  description?: string | null;
  terms?: string | null;
  notes?: string | null;
  websiteUrl?: string;
  applyUrl?: string;
  deadlineDetails: string[];
  hasDeadlineDetails: boolean;
}) {
  const items: { question: string; answer: ReactNode; icon: React.ComponentType<{ className?: string }> }[] = [];
  const cleanedDescription = description?.trim();
  const cleanedTerms = terms?.trim();
  const cleanedNotes = notes?.trim();

  items.push({
    question: `What is ${acceleratorName}?`,
    answer: cleanedDescription || "We’re still collecting a program summary for this accelerator.",
    icon: FileText,
  });

  items.push({
    question: "Where do I apply?",
    answer: applyUrl ? (
      <Link
        href={applyUrl}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        Apply on {getDisplayHostname(applyUrl)}
      </Link>
    ) : (
      "We’re still confirming the official application link."
    ),
    icon: ExternalLink,
  });

  items.push({
    question: "What is the current application deadline?",
    answer: hasDeadlineDetails ? (
      <span>{deadlineDetails.join(" ")}</span>
    ) : (
      <>
        Deadline information will be available soon. Subscribe to the{" "}
        <Link
          href="https://t.me/Web3IgorBuzz"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Telegram channel
        </Link>{" "}
        to get the actual information.
      </>
    ),
    icon: CalendarClock,
  });

  items.push({
    question: "Who is this accelerator best for?",
    answer: cleanedDescription || "We’re still collecting a founder profile summary for this program.",
    icon: Users,
  });

  items.push({
    question: "What does the program include?",
    answer: cleanedDescription || cleanedNotes || "Program highlights will be added soon.",
    icon: ListChecks,
  });

  items.push({
    question: "What funding or equity terms are mentioned?",
    answer: cleanedTerms || "Funding and equity details will be added once confirmed.",
    icon: BadgeDollarSign,
  });

  items.push({
    question: "Any important notes or caveats?",
    answer: cleanedNotes || "Important notes will be added once confirmed.",
    icon: StickyNote,
  });

  items.push({
    question: "Are there batch timing or schedule details?",
    answer: cleanedNotes || (hasDeadlineDetails ? deadlineDetails.join(" ") : "Batch timing details coming soon."),
    icon: CalendarClock,
  });

  items.push({
    question: "What is the official website?",
    answer: websiteUrl ? (
      <Link
        href={websiteUrl}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        {getDisplayHostname(websiteUrl)}
      </Link>
    ) : (
      "Official program site not available yet."
    ),
    icon: Globe,
  });

  items.push({
    question: "How do I get deadline updates?",
    answer: websiteUrl ? (
      <span>
        Check {getDisplayHostname(websiteUrl)} for updates, or follow the{" "}
        <Link
          href="https://t.me/Web3IgorBuzz"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Telegram channel
        </Link>
        .
      </span>
    ) : (
      <>
        Follow the{" "}
        <Link
          href="https://t.me/Web3IgorBuzz"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Telegram channel
        </Link>{" "}
        for deadline updates.
      </>
    ),
    icon: Bell,
  });

  return items;
}
