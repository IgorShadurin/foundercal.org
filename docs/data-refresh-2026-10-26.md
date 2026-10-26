# FounderCal data refresh — 26 October 2026

## Scope and initial findings

Repository: `IgorShadurin/foundercal.org`, branch `master`. Initial working tree was clean at `9e06c77`. Data is spread across 131 calendar events, two CSV trackers, 26 imported profiles, 65 research records, a hardcoded 20-program comparison and a 100-option solo-founder guide. The prior research pass was dated 9 June 2026. The older comparison and imported profiles contain conflicting funding, format and application information. Historical and hypothetical events are mixed into the current calendar. Existing merge code incorrectly restamps old research with the merge date.

## Detailed execution plan

1. **Inventory and protect history.** Inspect routes, loaders, taxonomies, Git state and refresh tools. Preserve original records in an explicitly historical archive before replacing obsolete calendar entries. Work in an isolated local checkout, then fast-forward the original clean checkout after the authorized push.
2. **Research every tracked organization.** Follow the repository's parallel worker workflow and existing research schema. Visit official program, application and deal pages. Record source URLs, facts supported, actual check date, confidence and uncertainty. Handle rebrands and retired programs explicitly. Never roll a previous year's dates forward or interpret a failed fetch as a closure.
3. **Audit additional event families.** Review competitions, grants and founder benefits outside the accelerator trackers. Publish exact dates only when the source gives them; otherwise keep an honest review-needed record. Keep old cohorts available as historical data rather than presenting them as upcoming.
4. **Review all 100 solo-founder options.** Correct names and URLs, remove unsupported availability claims, label verification status, distinguish editorial founder-fit assessments from official eligibility, and expose source notes.
5. **Reconcile public surfaces.** Merge findings into the calendar and trackers, update all 26 imported profiles, and drive deadline/comparison pages from the same research. Retain stable slugs for existing links. Show source links, actual research dates, uncertain status and current application information. Remove unsupported aggregate financial statistics and cadence claims.
6. **Prevent recurrence.** Preserve research timestamps during merges; validate calendar dates, taxonomy, duplicates, source coverage and profile linkage. Exclude inactive and unreviewed records from dated upcoming results. Label undated programs and expired deadlines honestly, and make dates independent of build-time clock assumptions where needed.
7. **Validate and ship.** Run research validation, meaningful data integrity/regression checks, lint, typecheck and production build. Inspect the rendered calendar, directory, deadline and comparison pages. Review the final diff, commit, push `master`, verify the remote commit, and synchronize the original checkout if it remains clean.

## Evidence policy

A check date means the source was inspected or access attempted; it does not imply open applications. `needs_review` is used for missing/blocked/ambiguous current information. Only official evidence establishes deadlines and program terms. Unknown dates remain null. Historical snapshots are not reverified or promoted to current data. Source content may lag the review date; expired calls remain expired. No automatic weekly verification is claimed.

## Results

- Reviewed all 65 pre-existing accelerator research records plus 43 legacy/additional program records: **108 research records** in total. **44 verified**, **58 need review**, **4 inactive**, **2 not found**. Five declared aliases preserve old routes; two duplicate verified event proposals are consolidated at merge time.
- Published **42 source-backed calendar entries**, including **18 application cutoffs on or after 26 October 2026**. Source notes distinguish early rounds, geographic cohorts, prerequisite invitations and timezone-specific cutoffs. Verified does not mean currently open: recently closed calls remain explicitly dated.
- Refreshed **26 imported profiles**, both CSV trackers, deadline pages, the 20-program YC comparison and all **100 solo-founder resources**. The solo guide has **96 reviewed offerings and 4 needing confirmation**; its general-offering reviews are distinct from cohort availability and its fit ratings remain editorial.
- Preserved **all 131 original events** intact in the historical archive, including the original hypothetical and obsolete entries. They are excluded from the live catalog; uncertain current programs remain discoverable in the directory with research notes.
- Updated company identities including AI House, 500 Fellowship, YZi Labs EASY Residency, Base Batches, Neo Residency and SOSV NY/SF. Removed unsupported old funding assumptions and uncited average-check/equity statistics. Newchip’s repurposed domain is retained only as explicitly labeled evidence, never as an application destination.
- Refreshed favicons: **17 downloaded, 37 existing, zero download failures**.

### Confirmed examples

| Program | Current published information | Official source |
| --- | --- | --- |
| YC Winter 2027 | November 2, 2026 at 8pm PT; January–March in San Francisco | [Official source](https://www.ycombinator.com/apply) |
| a16z speedrun SR008 | November 1 cutoff; February 1–April 18, 2027 residency | [Official source](https://speedrun.a16z.com/faq) |
| Techstars NYC | November 18 cutoff; March 8, 2027 start | [Official source](https://www.techstars.com/accelerators/nyc) |
| ERA Winter 2027 | November 2 cutoff; January 11 start; $150K for 6% SAFE | [Official source](https://www.eranyc.com/apply/) |
| SXSW Pitch 2027 | November 13 cutoff; March 16–17 event; $225 regular application fee | [Official source](https://sxsw.com/pitch/) |
| Hello Tomorrow | November 30 cutoff; June 2–3, 2027 Amsterdam finals; equity investment prize | [Official source](https://hello-tomorrow.org/global-challenge/) |

The research JSON files contain the authoritative per-program evidence and caveats. XPRIZE Feed the Next Billion is correctly marked concluded in 2024, not a future 2025 finale. NMotion and Blue Ridge Labs still publish past calls; no future cycles were invented. Samsung’s school competition is distinguished from the unsupported global startup-grant listing. Fetch failures, archived pages and general corporate homepages remain review-needed rather than being counted as verified availability.

### Reliability changes and validation

Research dates now survive merging; replaying old findings cannot regress the calendar or CSV check dates. Later inactive or unconfirmed findings retire their old live events. Source links accompany public JSON and cards. Rebrands preserve stable route slugs. Deadline pages read structured dates, avoid hardcoded calendar years and label generic links as program/application information. Milestone selection searches the chosen window before falling back to older dates. The home route renders per request so its initial date is not frozen at deployment.

Data validation covers real Gregorian dates, chronology, taxonomy/index mirrors, source metadata, event/research/profile consistency, aliases, CSV slugs and all 100 solo-resource audit records. Seven regression tests cover invalid dates, CSV quoting, evidence-preserving merges, stale replay, inactive retirement, directory routes and date-window milestones. Lint, TypeScript and a production webpack build pass; webpack is used because the isolated checkout shares the original dependency directory through a symlink.

Browser verification completed against the final local production build: all **108 directory deadline routes returned HTTP 200**; the JSON feeds returned 42 live entries and all 131 archived entries. Inspected the calendar, directory, 500 legacy route, AI2 legacy route, inactive Newchip page, YC comparison and solo-founder guide. Desktop and 390px mobile layouts showed no page overflow. The Base November 17 Demo Day appears in the program-milestone window despite its earlier start. Closed 500 applications no longer display a promise of forthcoming deadline details or a generic Apply action. No application runtime errors were observed; the pre-existing Vercel analytics endpoint returns 404 on localhost only.

Shipping target: `origin/master`. The original checkout was confirmed clean at the original revision before synchronization. The final delivery message identifies the pushed commit; the report copy delivered with the task includes the verified remote revision.

