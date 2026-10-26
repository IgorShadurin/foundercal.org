# FounderCal.org

[FounderCal.org](https://foundercal.org) is a living calendar of accelerator deadlines, fellowships, demo days, and grant programs. It replaces scattered spreadsheets with a single place to scan what is open now, what opens next, and which opportunities fit your region, sector, or company stage.

## Key Features

- **Opportunity Radar** – Pick a start date, choose a 30/90/182/365‑day window, and see a curated list of active programs. Counts show published dates in the selected window; closed applications and unknown dates are labeled.
- **Founder-grade filters** – Search by keyword, region, sector, or program type (accelerator, fellowship, residency, etc.). Filters can be collapsed and their state is saved in `localStorage`, so your preferred view is ready the next time you visit.
- **Dual view modes** – Toggle between deadline-focused and program-start views to prioritize application cutoffs or kick-off dates.
- **Inline context** – Key dates, timeline tags, and tooltips explain application windows without leaving the page. Quick links include UTM tags, so operators know the lead came from FounderCal.org.
- **Manual opportunity tracker** – `/imported-accelerators` exposes reviewed company profiles plus the CSV trackers (`data/accelerators-master.csv`, `data/accelerators-crypto.csv`). Profile names, links, terms and notes are synchronized from source-backed research. Every entry shows a favicon (auto-downloaded via scripts) or a fallback badge for easy scanning.
- **Static assets pipeline** – `npm run favicons` scrapes accelerator sites with 20-way concurrency, logs candidates to `tmp/favicons-manifest.json`, and saves validated icons to `public/favicons/`.
- **CLI-friendly data** – JSON and CSV files live in `src/data/` and `data/` so you can script updates or build alerts without touching the UI.

## Tech Stack

- [Next.js 16](https://nextjs.org/) with the App Router and Turbopack build pipeline.
- Tailwind-esque utility classes via `cn` helpers and custom UI primitives in `src/components/ui/*`.
- `date-fns` for timeline math, `lucide-react` for iconography, and persistent preferences stored in the browser.
- TypeScript-first codebase with linting via `npm run lint` and production builds via `npm run build`.

## Run Locally

```bash
npm install
npm run dev
```

### Useful scripts

- `npm run build` – production build (used in CI or before deploys).
- `npm run lint` – TypeScript-aware ESLint run.
- `npm run validate:data` – validate dates, taxonomies, source coverage and stable profile/CSV slugs.
- `npm run test:data` – regression tests for research replay, retirement, dates and routes.
- `npm run sync:profiles` – synchronize company profiles and CSV trackers from research (run after merging findings).
- `npm run favicons` – Regenerates the favicon cache (scrape + download).

## Contributing

1. **Add or update data** – Edit `public/events.json` and the CSV trackers. Document your steps in `AGENTS.md` for future contributors.
2. **Suggest UX tweaks or new programs** – open an issue with screenshots or links: [GitHub Issues](https://github.com/IgorShadurin/foundercal.org/issues/new).
3. **Ship responsibly** – avoid destructive git commands, run `npm run lint`, and, when relevant, `npm run build` before opening a PR.

FounderCal.org is maintained in the open so the founder community can keep sharing credible, time-sensitive opportunities. If you spot a program that should be listed—or want to extend the tooling—jump into the issues queue and say hello.

---

Try [YumCut](https://yumcut.com)! This is an AI video generator that turns a single prompt into a ready-to-post vertical short video in minutes. It creates the script, images, voice-over, subtitles, and edits everything into a final clip automatically. It’s built for fast testing and making lots of variations without spending hours in an editor.

## Research and freshness

The [26 October 2026 audit](docs/data-refresh-2026-10-26.md) covers all prior tracked programs and the 100-option solo-founder guide. Research records in `data/accelerator-research/` contain official source URLs, review dates, supported facts and uncertainty notes. The calendar and deadline/comparison pages use these records; a check date does not imply applications are open. Research status is distinct from application status.

The original 131-event snapshot is retained in `public/events-archive.json`, explicitly labeled historical and potentially unverified. It is excluded from the current calendar. Do not move old dates forward to a new year or restore unconfirmed cohorts. Unknown exact dates stay null.

For a future refresh, follow `AGENTS.md`, validate findings, merge, synchronize profiles, and run checks:

```bash
npm run accelerator-agents -- validate
npm run accelerator-agents -- merge --dry-run
npm run accelerator-agents -- merge
npm run sync:profiles
npm run validate:data
npm run test:data
npm run lint
npm run build
```

Merging preserves the research `checked_at` date, copies source provenance into the public JSON and removes superseded events from the same research record. An older replay cannot overwrite newer events or CSV dates. `last_verified_utc` is null for uncertain findings; `last_checked_utc` records the attempt date (midnight UTC represents day precision). Stable `slug` fields preserve deadline URLs when a company changes name; known aliases are declared in `data/research-aliases.json`. The 100-option guide records per-row source notes and distinguishes editorial fit assessments from verified eligibility.

## Application discovery and SEO

The public catalog has one canonical URL per program. `data/research-aliases.json`
feeds permanent redirects, canonical links and the deduplicated directory. Preserve
existing canonical URLs across rebrands; do not generate a new page for each name.

`src/lib/catalog.ts` projects research into organizations, programs and cohorts.
A research record can supply `additional_events` for additional confirmed cohorts.
They must have distinct event IDs; sharing an organizer and a date does not make
separate programs duplicates. `data/program-facts.json` holds cohort-bound evidence
for exact cutoff instants, rolling admission, additional application rounds and
eligibility. Cite a source in the program research and preserve its actual check date.
Never infer rolling admission from a missing deadline. Update or remove supplemental
facts when replacing a cohort; validation rejects orphaned facts.

The calendar supports upcoming deadlines, rolling programs, all programs, milestones
and device-local saved programs. Filters are shareable in the query string; their
canonical remains the root calendar/directory. The five curated collections and
non-empty month pages use the same catalog. Inactive programs remain historical;
not-found records are noindex and excluded from the sitemap. The sitemap uses source
review dates and `CONTENT_UPDATED` for significant template changes, never file mtimes.

`/catalog.json` exposes the normalized model; `/events.json` preserves compatibility.
`/calendar.ics?program=<canonical-slug>` exports future application deadlines only.
Exact times retain their offsets; date-only entries are explicitly reminders to
confirm the cutoff. ICS imports are snapshots, not updating subscriptions.

## Review queue and scheduled checks

- `npm run review:queue` writes `tmp/review/review-queue.json` without changing research.
- `npm run review:sources` checks up to 120 source URLs from due programs, with bounded
  responses, timeouts and six concurrent requests. It reports inaccessible/changed
  source content; HTTP success never advances a review date or changes a fact.
- For a deterministic audit use `--as-of=YYYY-MM-DD`; for a small network smoke check
  use `npm run review:sources -- --all --limit=6`.
- `.github/workflows/review-data.yml` validates changes and runs a daily 06:20 UTC
  review queue/source monitor. Scheduled runs compare the previous source-monitor
  artifact and save results as an Actions artifact for 30 days. No automatic issue,
  email, or third-party message is sent. The workflow does not automatically publish
  source-page changes: a reviewer must verify and commit factual updates.
- Near cutoffs (14 days): daily review due; other future/rolling/uncertain programs:
  weekly; remaining records: monthly. This is a queue policy, not a claim that a
  human has completed each review. Overdue records are visibly labeled.

## Search Console and measurement

Set `GOOGLE_SITE_VERIFICATION` in the deployment environment only with a token from
an authorized Search Console property. Domain verification may instead require the
owner's DNS access. Submit `https://foundercal.org/sitemap.xml` and inspect a small
sample of program, collection and month URLs. Verification and submission cannot be
completed from source code alone without access to the property.

GA4 custom events: `program_view` (detail link), `official_site_click`, `source_click`,
`filter_change`, `filters_reset`, `program_search`, `save_program`, `calendar_export`.
Search events omit the actual search text (length and result count only). Standard
page URLs may contain shared search terms. Vercel Analytics is mounted on Vercel
only, avoiding its unavailable endpoint on local production builds.

Compare non-brand organic clicks, impressions/CTR by landing page and query,
indexed canonical pages, and official-site clicks from organic sessions after
release. A Lighthouse SEO score is a technical check, not a ranking prediction.
