import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Link as LinkIcon } from "lucide-react";

const YC_BASELINE = {
  duration: "12-week core program with onboarding + Demo Day",
  capital: "$500k total — $125k post-money SAFE for 7% equity plus a $375k uncapped MFN SAFE that mirrors your next-round terms",
  format: "Hybrid batches twice per year with remote programming and optional Bay Area meetups",
  expectations: "Requires full-time founding teams; partners lean on metrics, week-by-week updates, and mandatory office hours culminating in Demo Day.",
};

type Alternative = {
  name: string;
  icon: string;
  url: string;
  headline: string;
  investment: string;
  equity: string;
  format: string;
  idealFor: string;
};

const ALTERNATIVES: Alternative[] = [
  {
    name: "Techstars",
    icon: "/favicons/www.techstars.com.png",
    url: "https://www.techstars.com/",
    headline: "Mentor-driven programs in 50+ cities",
    investment: "$220k total ($20k for 5% common + $200k uncapped MFN SAFE)",
    equity: "5% immediate ownership plus whatever the SAFE converts into at your next priced round; no program fees.",
    format: "13-week sprints with daily mentor meetings, corporate partner access, and lifetime network membership.",
    idealFor: "Teams that want YC-level capital but prefer local cohorts or industry-specific tracks (fintech, space, climate).",
  },
  {
    name: "500 Global",
    icon: "/favicons/500.global.ico",
    url: "https://500.global/accelerators",
    headline: "Flagship Seed Program, Palo Alto",
    investment: "$150k SAFE for ~6% (net $112.5k after the $37.5k program fee)",
    equity: "Standard post-money SAFE with pro-rata rights plus growth marketing bootcamps.",
    format: "4-month residency emphasizing distribution hacks, hands-on fundraising prep, and a global mentor bench.",
    idealFor: "Founders who need intense growth coaching and don’t mind a tuition-style fee deducted from the check.",
  },
  {
    name: "MassChallenge",
    icon: "/favicons/masschallenge.org.png",
    url: "https://masschallenge.org/",
    headline: "Zero-equity global accelerators",
    investment: "No upfront capital; compete for six-figure equity-free cash awards and corporate pilots.",
    equity: "Keep 100% ownership — the nonprofit simply provides curriculum, mentors, and prize pools.",
    format: "Hybrid four-month tracks across healthcare, finance, climate, security, and food with showcase weeks.",
    idealFor: "Companies that want enterprise intros and visibility without giving up cap table real estate.",
  },
  {
    name: "Antler",
    icon: "/favicons/www.antler.co.png",
    url: "https://www.antler.co/",
    headline: "Day-zero residencies + pre-seed checks",
    investment: "Typical £210k package (£125k for ~8.5% plus £85k on a note) with up to £330k pre-committed follow-on (UK terms).",
    equity: "Initial stake purchased immediately, with structured follow-on reserved for the next round.",
    format: "Six-week team formation sprint followed by rapid validation, then investment decisions and a global demo platform.",
    idealFor: "Solo operators or new duos that want help finding a cofounder and a meaningful seed lead outside the US.",
  },
  {
    name: "Entrepreneur First",
    icon: "/favicons/www.joinef.com.png",
    url: "https://www.joinef.com/",
    headline: "Residency for individuals before the idea",
    investment: "$125k SAFE for 8% plus an optional $125k uncapped MFN SAFE when you relocate to San Francisco and incorporate in Delaware.",
    equity: "Equity only triggers once you form a company; grants cover exploration time for those still ideating.",
    format: "Two-phase journey: FORM (team + concept) and LAUNCH (company building + private Demo Day).",
    idealFor: "Technical talent who want structured cofounder matching and capital the moment they commit full-time.",
  },
  {
    name: "IndieBio (SOSV)",
    icon: "/favicons/indiebio.co.png",
    url: "https://indiebio.co/",
    headline: "Biotech builder with wet-lab access",
    investment: "$525k early capital split between cash and in-kind lab resources, with SOSV reserving follow-on dollars.",
    equity: "SOSV targets ~10% long-term ownership, aligning their stake with major future rounds.",
    format: "Four-month on-site program in SF or NYC with 24/7 lab access, FDA/regulatory mentorship, and investor showcases.",
    idealFor: "Deep tech and synbio teams that need bench space, CRO-style support, and a fund committed to later rounds.",
  },
  {
    name: "HAX (SOSV)",
    icon: "/favicons/hax.co.png",
    url: "https://hax.co/",
    headline: "Hard-tech residency for hardware + robotics",
    investment: "$250k initial package (cash plus in-kind engineering support) with up to $3M follow-on potential.",
    equity: "Equity exchanged up front; SOSV often takes observer seats to stay close to manufacturing milestones.",
    format: "180-day program across Newark, Shenzhen, and Tokyo with fabrication labs, supply-chain experts, and demo tours.",
    idealFor: "Hardware founders who need DFM help, manufacturing partners, and investors comfortable with capex-heavy roadmaps.",
  },
  {
    name: "Plug and Play Tech Center",
    icon: "/favicons/www.plugandplaytechcenter.com.ico",
    url: "https://www.plugandplaytechcenter.com/",
    headline: "Corporate-driven pilots without equity",
    investment: "Variable — most batches provide perks, customer pilots, and optional VC follow-on without taking ownership.",
    equity: "Core accelerator tracks are equity-free; Plug and Play may invest separately in later rounds.",
    format: "12-week vertical tracks (fintech, health, mobility, supply chain, etc.) culminating in corporate dealflow expos.",
    idealFor: "Scale-ready startups courting Fortune 500 partnerships more than seed capital.",
  },
  {
    name: "Berkeley SkyDeck",
    icon: "/favicons/skydeck.berkeley.edu.png",
    url: "https://skydeck.berkeley.edu/",
    headline: "UC-backed accelerator with $200k checks",
    investment: "$200k investment from the SkyDeck Fund for roughly 7.5% equity plus optional follow-on rights.",
    equity: "Standard SAFE terms paired with a profit-sharing model that funnels returns back to UC Berkeley.",
    format: "Six-month BAM program featuring Key Advisors, chip/aerospace/climate tracks, and a 600+ investor Demo Day.",
    idealFor: "Founders who want Bay Area positioning, university research ties, and a structured six-month runway.",
  },
  {
    name: "StartX",
    icon: "/favicons/startx.com.ico",
    url: "https://startx.com/",
    headline: "Stanford founder community, zero equity",
    investment: "Program itself is equity- and fee-free; StartX Fund can co-invest alongside top-tier rounds when invited.",
    equity: "No automatic dilution — the ethos is community-driven support and optional follow-on capital.",
    format: "Cohort-based accelerator with continual alumni access, resident doctors, and campus-grade resources.",
    idealFor: "Stanford-affiliated teams seeking long-term peer support without changing their cap table.",
  },
  {
    name: "Alchemist Accelerator",
    icon: "/favicons/www.alchemistaccelerator.com.png",
    url: "https://www.alchemistaccelerator.com/",
    headline: "Enterprise GTM bootcamp",
    investment: "Average $25k seed investment (net of tuition offset) for roughly 5% ownership.",
    equity: "Flexible terms for later-stage entrants, but most companies grant a single-digit stake tied to the cash advance.",
    format: "Six-month curriculum laser-focused on B2B sales, procurement cycles, and corporate design partners.",
    idealFor: "Deep enterprise founders who need help converting pilots into seven-figure contracts.",
  },
  {
    name: "LAUNCH Accelerator",
    icon: "/favicons/launch.co.png",
    url: "https://launch.co/accelerator",
    headline: "Jason Calacanis’s 14-week sprint",
    investment: "$125k for 7% equity with potential syndicate follow-on through TheSyndicate.com.",
    equity: "Standard deal closed on entry; LAUNCH often re-ups via its fund as you raise seed and Series A.",
    format: "Weekly investor meetings, pitch practice across 200+ sessions, and distributed cohorts with SF meetups.",
    idealFor: "Post-revenue startups seeking a concentrated investor roadshow and media exposure.",
  },
  {
    name: "Founders Inc",
    icon: "/favicons/founders.inc.png",
    url: "https://founders.inc/",
    headline: "Community + capital at Fort Mason",
    investment: "Up to $150k for 5–10% equity, with campus access, credits, and frequent build weeks.",
    equity: "Checks are milestone-based; smaller initial stakes can scale if the team keeps building within the lab ecosystem.",
    format: "Rolling admission, hackathons, and themed residencies (AI, biotech, climate) instead of fixed cohorts.",
    idealFor: "Builders who thrive in hacker-house environments and want ongoing micro-grants tied to progress.",
  },
  {
    name: "HF0 Residency",
    icon: "/favicons/hf0.com.ico",
    url: "https://hf0.com/",
    headline: "Live-in ‘hacker monastery’",
    investment: "$1M uncapped MFN SAFE for 5% (or $500k for 3%) across a 12-week residency.",
    equity: "Equity converts via SAFE terms identical to your next round, keeping dilution tied to market pricing.",
    format: "Founders live on-site, removing all distractions while mentors push weekly product and fundraising goals.",
    idealFor: "Serial builders ready to ship v1 in 90 days and who value intense, co-living accountability.",
  },
  {
    name: "South Park Commons",
    icon: "/favicons/southparkcommons.com.png",
    url: "https://southparkcommons.com/",
    headline: "-1 to 0 fellowship with patient capital",
    investment: "$400k for 7% upfront plus a guaranteed $600k follow-on once you raise an external round.",
    equity: "Two-stage structure: modest initial dilution, then automatic participation in your next priced round.",
    format: "Small cohorts, no fixed demo day, and deep partner time across SF, NYC, and Bengaluru hubs.",
    idealFor: "Exploratory founders who want time to find founder-market fit before sprinting toward PMF.",
  },
  {
    name: "PearX (Pear VC)",
    icon: "/favicons/pear.vc.png",
    url: "https://pear.vc/pearx",
    headline: "Boutique pre-seed accelerator",
    investment: "$250k–$2M via SAFE (terms customized per team) plus $1M+ in cloud credits.",
    equity: "Ownership varies with check size; Pear often leads the round and supports future raises.",
    format: "12-week in-person program at Pear Studio with hiring help, customer development, and partner-led workshops.",
    idealFor: "Technical founding teams that want a concentrated pre-seed lead and help scaling the first sales motion.",
  },
  {
    name: "AI2 Incubator",
    icon: "/favicons/incubator.allenai.org.png",
    url: "https://incubator.allenai.org/",
    headline: "Applied AI company studio",
    investment: "Up to $500k staged — $50k–$150k upfront (solo vs. team) with the rest unlocked as you hit traction milestones.",
    equity: "Structured as SAFEs (often capped around $10M) plus massive non-dilutive compute credits.",
    format: "12–18 month engagement with co-founder matching, product squads, and AI House resources in Seattle.",
    idealFor: "AI-native teams that need research-grade mentorship, compute, and a partner willing to stay involved post-Demo Day.",
  },
  {
    name: "The Batchery",
    icon: "/favicons/batchery.com.png",
    url: "https://batchery.com/",
    headline: "Investor-advisor collective in Berkeley",
    investment: "Membership includes workspace, mentor access, and a 4.5% warrant executed at your first priced round.",
    equity: "Rather than cash-on-day-one, Batchery advisors earn the right to buy shares later, aligning incentives with traction.",
    format: "Rolling admission with pragmatic AI programming, investor readiness scoring, and tailored support services.",
    idealFor: "Founders who want a flexible, community-driven incubator with light-touch dilution until they raise institutional capital.",
  },
  {
    name: "Entrepreneurs Roundtable Accelerator (ERA)",
    icon: "/favicons/www.eranyc.com.png",
    url: "https://www.eranyc.com/",
    headline: "NYC’s longest-running accelerator",
    investment: "$150k post-money SAFE for 6% equity plus access to ERA’s follow-on fund.",
    equity: "Simple, transparent SAFE that mirrors coastal norms and unlocks future participation rights.",
    format: "Four-month Manhattan cohort featuring domain-specific mentors, corporate pilots, and curated investor salons.",
    idealFor: "Founders targeting US East Coast markets or regulated industries that benefit from ERA’s NYC network.",
  },
  {
    name: "Outlier Ventures Base Camp",
    icon: "/favicons/outlierventures.io.jpg",
    url: "https://outlierventures.io/base-camp/",
    headline: "Web3 + AI accelerator",
    investment: "Up to $100k stipend plus access to $200k follow-on, in exchange for 6% equity and 6% future token supply.",
    equity: "Dual exposure (equity + token) lets Outlier fund both your company and protocol economics.",
    format: "12-week fully remote cohorts with token engineering, legal structuring, and BD support, followed by fundraising help.",
    idealFor: "DePIN, agentic AI, or RWA teams that need tokenomics expertise alongside traditional venture prep.",
  },
];

export const metadata: Metadata = {
  title: "Y Combinator Alternatives — FounderCal.org",
  description:
    "Compare Y Combinator’s $500K deal with 20 vetted accelerator alternatives, including their check sizes, equity asks, and ideal founder profiles.",
  alternates: {
    canonical: "https://foundercal.org/y-combinator-alternatives",
  },
};

export default function YCombinatorAlternativesPage() {
  return (
    <main className="bg-background px-4 py-12 text-foreground sm:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <Hero />
        <ComparisonGrid />
        <EvaluationGuide />
        <AlternativesList />
      </div>
    </main>
  );
}

function Hero() {
  return (
    <section className="rounded-3xl border bg-gradient-to-br from-white via-zinc-50 to-zinc-100 p-8 shadow-sm dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary">Y Combinator at a glance</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Understand YC’s $500K offer before picking an alternative</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        YC now wires $500K on day one: $125K on a post-money SAFE for 7% equity plus a $375K uncapped MFN SAFE that mirrors the best terms you cut until your next priced round. Batches run twice per year, expect weekly partner meetings, group office hours, and Demo Day exposure to thousands of investors. The program is remote-first with Bay Area touchpoints and expects full-time founding teams.
      </p>
      <ul className="mt-6 space-y-2 text-sm text-foreground">
        <li className="rounded-2xl border border-dashed bg-white/70 px-4 py-3 dark:bg-zinc-900/40"><strong>Duration:</strong> {YC_BASELINE.duration}</li>
        <li className="rounded-2xl border border-dashed bg-white/70 px-4 py-3 dark:bg-zinc-900/40"><strong>Capital:</strong> {YC_BASELINE.capital}</li>
        <li className="rounded-2xl border border-dashed bg-white/70 px-4 py-3 dark:bg-zinc-900/40"><strong>Format:</strong> {YC_BASELINE.format}</li>
        <li className="rounded-2xl border border-dashed bg-white/70 px-4 py-3 dark:bg-zinc-900/40"><strong>Expectations:</strong> {YC_BASELINE.expectations}</li>
      </ul>
      <p className="mt-6 text-base text-muted-foreground">
        The 20 programs below either match YC’s check size, take zero equity, or specialize in sectors (AI, biotech, hardware) where YC’s breadth can feel generic. Use them to benchmark terms before committing to a batch.
      </p>
    </section>
  );
}

function ComparisonGrid() {
  const stats = [
    { label: "Average initial check", value: "$268K" },
    { label: "Median equity ask", value: "6%" },
    { label: "Zero-equity options", value: "3 programs" },
    { label: "Follow-on guarantees", value: "6 programs" },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border bg-card px-4 py-6 text-center shadow-sm">
          <p className="text-3xl font-semibold">{stat.value}</p>
          <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </section>
  );
}

function EvaluationGuide() {
  const bullets = [
    {
      title: "Capital vs. dilution",
      body: "YC, Techstars, HF0, and South Park Commons cluster around $400K–$1M. Equity-free models like MassChallenge, Plug and Play, and StartX preserve ownership but rely on competitions or pilots instead of guaranteed funding.",
    },
    {
      title: "Stage fit",
      body: "Pre-idea builders gravitate toward Entrepreneur First, Antler, SPC, or Founders Inc. Product-ready teams often prefer 500 Global, LAUNCH, or ERA where traction thresholds are explicit.",
    },
    {
      title: "Sector focus",
      body: "IndieBio and HAX bundle lab or fabrication resources into their checks, while AI2 Incubator and Outlier Ventures combine capital with compute or token engineering.",
    },
    {
      title: "Geography & network",
      body: "YC’s brand is global, but you may want Berkeley SkyDeck for UC access, StartX for Stanford roots, ERA for NYC buyers, or Plug and Play for corporate pilots across 17+ industries.",
    },
  ];

  return (
    <section className="rounded-3xl border bg-card/60 p-6">
      <h2 className="text-2xl font-semibold">How to benchmark an accelerator offer</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {bullets.map((bullet) => (
          <div key={bullet.title} className="rounded-2xl border border-dashed bg-background/60 p-4">
            <p className="font-medium">{bullet.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{bullet.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AlternativesList() {
  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">20 vetted alternatives</h2>
        <Link href="/" className="text-sm font-medium text-primary hover:underline">
          Back to Opportunity Radar
        </Link>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {ALTERNATIVES.map((alt) => (
          <article key={alt.name} className="rounded-3xl border bg-background/80 p-5 shadow-sm">
            <header className="flex items-start gap-3">
              <Image
                src={alt.icon}
                alt={`${alt.name} logo`}
                width={44}
                height={44}
                className="h-11 w-11 rounded-xl border bg-white object-contain p-2"
              />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{alt.headline}</p>
                <h3 className="mt-1 text-xl font-semibold">
                  <Link
                    href={alt.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    {alt.name}
                    <LinkIcon className="h-4 w-4 text-primary" aria-hidden="true" />
                    <span className="sr-only">Visit {alt.name}</span>
                  </Link>
                </h3>
              </div>
            </header>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl border border-dashed px-4 py-3">
                <dt className="font-medium text-foreground">Investment & perks</dt>
                <dd className="text-muted-foreground">{alt.investment}</dd>
              </div>
              <div className="rounded-2xl border border-dashed px-4 py-3">
                <dt className="font-medium text-foreground">Equity structure</dt>
                <dd className="text-muted-foreground">{alt.equity}</dd>
              </div>
              <div className="rounded-2xl border border-dashed px-4 py-3">
                <dt className="font-medium text-foreground">Format & cadence</dt>
                <dd className="text-muted-foreground">{alt.format}</dd>
              </div>
              <div className="rounded-2xl border border-dashed px-4 py-3">
                <dt className="font-medium text-foreground">Best if you need</dt>
                <dd className="text-muted-foreground">{alt.idealFor}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
