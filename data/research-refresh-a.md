# Accelerator research refresh A — 2026-10-26

All 32 assigned research records were checked against the official pages or explicitly identified official search-index content. `needs_review` means no sufficiently confirmed current calendar entry, not that the organization is inactive. Alias records intentionally have no proposed event.

| Record | Status | Finding |
|---|---|---|
| 500-global | verified | 500 Global now presents its flagship as the 500 Fellowship. |
| 500-startups | needs_review | 500 Startups is the former name of 500 Global; use the 500 Fellowship record. |
| a16z-crypto-startup-school | needs_review | The current CSX page describes crypto startup acceleration but publishes no new application window. |
| a16z-speedrun | verified | SR008 applications are open. Speedrun now covers many sectors. |
| a16z-games-speedrun | needs_review | Legacy games-specific listing is the same speedrun program; see a16z-speedrun. |
| accel-atoms | needs_review | Accel Atoms supports Indian and Indian-origin founders. The site lists the 2026 AI cohort and Atoms X, with signup for future cohorts. |
| ai-grant | needs_review | AI Grant explicitly says Batch 4 applications are closed. It offers a $250K uncapped MFN SAFE investment, not a grant. |
| ai2-incubator | verified | AI2 Incubator rebranded to AI House in June 2026. |
| alchemist-accelerator | needs_review | Indexed official FAQ describes six-month enterprise acceleration and rolling application deadlines, but live pages failed to load. |
| alliance-accelerator | verified | ALL19 is the next announced cohort. |
| alliance-dao | needs_review | Alliance DAO is an alias of the Alliance accelerator; use the ALL19 record. |
| angelpad | needs_review | AngelPad applications are currently closed. The site describes three-month cohorts in San Francisco and New York and a $120K investment. |
| antler-residency | verified | Antler US confirms year-round review; investment follows its committee process. |
| antler | verified | Antler publishes location-specific starts, not a single global deadline. |
| berkeley-skydeck | verified | Batch 23 is closed and starts November 2. The homepage advertises Batch 24 applications opening in January without an exact day. |
| betaworks-camp | verified | Fall 2026 Camp is in progress; the announcement explicitly closes applications. |
| binance-labs-incubation-program | verified | The legacy Binance Labs incubation listing now points to YZi Labs EASY Residency. |
| boost-vc | needs_review | Boost VC currently presents itself as a deep-tech pre-seed investor writing $500K checks, without a current accelerator cohort calendar. |
| cleantech-open | verified | The official 2026 page says applications closed. Its final event dates have passed. |
| coinbase-builders-base-camp | verified | The current official Base accelerator is Base Batches; Batch 004 is underway. |
| conviction-embed | needs_review | Embed advertises early applications for cohort seven and $250K on an uncapped, no-discount MFN SAFE (or a recent round price). |
| deep-science-ventures | needs_review | Deep Science Ventures is a venture creator in agriculture, computation, climate, pharma and education, with founder opportunities rather than one accelerator intake. |
| endless-frontier-labs | verified | The 2026–27 final deadline was extended from July 31 to August 12. |
| entrepreneur-first | verified | EF now lists Winter 2027 programs; Bangalore has a November 2 second-round deadline. |
| european-innovation-council-eic-accelerator | verified | November 4 is the remaining published 2026 full-proposal cutoff. |
| fastercapital | needs_review | FasterCapital provides online venture-building, technical development and fundraising services; support terms depend on the selected program. |
| financial-health-network-accelerator | inactive | Financial Solutions Lab, including its accelerator, concluded in 2022. |
| forum-accelerator | needs_review | Forum Ventures offers a B2B tech accelerator with $100K pre-seed funding and hands-on founder support. |
| founder-institute | verified | The apply page resolves to Silicon Valley Spring 2027, with a December 8 early deadline. |
| founders-inc-fellowship | verified | The former fellowship URL redirects to the fund and campus offering. |
| gener8tor | needs_review | gener8tor operates multiple investment, free and sector-specific programs; dates and eligibility depend on the individual program. |
| google-for-startups-accelerator | needs_review | Google for Startups runs regional and themed accelerators offering equity-free technical mentoring and product support. |

## Integration notes

- Use new cohort IDs for speedrun SR008, Alliance ALL19, 500 Fellowship, Base Batches 004, EF Bangalore and FI Silicon Valley. Preserve historical cohorts only as history.
- Duplicate aliases: 500-startups → 500-global; a16z-games-speedrun → a16z-speedrun; alliance-dao → alliance-accelerator.
- Names/URLs changed: AI2 Incubator → AI House; Entrepreneur First → Entrepreneurs First; Binance Labs incubation → YZi Labs EASY Residency; Coinbase Builders/Base Camp → Base Batches.
- Do not label closed applications as open: 500 Fellowship, SkyDeck B23, AI Grant, AngelPad, Betaworks Fall 2026, EASY S5, Base Batches 004, EFL and Cleantech Open.
- Source conflicts are explicitly retained in JSON notes: SkyDeck investment amount, YZi S5 duration, Cleantech stale weekday copy, Embed yearless dates and Alchemist fetch failures.
- Verified deadline semantics matter: FI December 8 is early; EF November 2 is second selection round; EIC November 4 is full-proposal batching after short-proposal approval.
- Source URLs and access dates are in each research JSON. No fabricated day-of-month was assigned to month-only schedules.
