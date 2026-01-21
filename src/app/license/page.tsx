import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FounderCal.org — Data License",
  description: "License terms for FounderCal datasets and public exports.",
};

export default function LicensePage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Data License</p>
          <h1 className="text-3xl font-bold">FounderCal data usage terms</h1>
          <p className="text-muted-foreground">
            FounderCal datasets are published to help founders and researchers track accelerator, fellowship, and grant
            timelines.
          </p>
        </header>
        <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            All data, text, and content on FounderCal.org are provided for informational use. The datasets and exports
            (including JSON and CSV files) are copyright FounderCal. All rights reserved.
          </p>
          <p>
            You may view, link to, and reference the data in personal or internal research workflows. Any redistribution,
            resale, or automated bulk reuse requires prior written permission from FounderCal.
          </p>
        </section>
      </div>
    </main>
  );
}
