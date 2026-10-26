import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
export const metadata: Metadata = {
  title: "Research Policy & Data Corrections",
  description:
    "How FounderCal verifies application dates, distinguishes uncertainty, schedules reviews and handles data corrections.",
  alternates: { canonical: "/methodology" },
};
export default function Methodology() {
  return (
    <main className="mx-auto max-w-3xl space-y-7 px-4 py-8 sm:px-8">
      <Link href="/" className="underline">
        FounderCal
      </Link>
      <h1 className="text-3xl font-semibold">
        How we verify founder opportunities
      </h1>
      <p>
        FounderCal is an independent research project maintained by{" "}
        <a href="https://x.com/Web3Igor" className="underline">
          Igor Shadurin
        </a>
        . We collect evidence from official program pages, FAQs, application
        forms and organizer announcements. We do not represent the programs
        listed.
      </p>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">What a review means</h2>
        <p>
          “Official information reviewed” means the cited evidence supports the
          described program information. It is separate from application status,
          eligibility and funding terms. A review date is the date the evidence
          was checked; it is never automatically advanced because a build or
          link check succeeded.
        </p>
        <p>
          Unknown dates stay unknown. We do not derive an exact day from a
          month-only schedule. If an official page omits a year but clearly
          identifies the upcoming cohort, any interpretation must be explained
          in the research notes. Conflicting sources and inaccessible forms stay
          visible as uncertainties.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Organizations, programs and cohorts
        </h2>
        <p>
          An organization can run several programs, and a program can have
          multiple cohorts or application rounds. Deadlines, residency
          requirements and funding offers belong to their particular program and
          cohort. Checking one location does not verify every program from that
          organization.
        </p>
        <p>
          Application dates are separate from program starts and demo days.
          Rolling intake is shown only when an official source explicitly
          supports it. A future deadline without a confirmed opening is labeled
          as a deadline, not a guarantee that the form is open.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Freshness and repeat checks</h2>
        <p>
          Our review queue prioritizes cutoffs within 14 days for daily review;
          other future deadlines, rolling programs and unresolved research for
          weekly review; remaining records for monthly review. “Review due” is a
          warning that a scheduled evidence review has not yet been completed.
        </p>
        <p>
          A daily repository workflow prepares a queue and checks source
          accessibility and content changes. It does not certify facts or
          publish new dates automatically. A successful HTTP request is not
          proof that applications are open. Source changes are reviewed before
          publication.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Funding and editorial comparisons
        </h2>
        <p>
          Cash, credits, grants, fees, equity and conditional follow-on funding
          are different things. We preserve these distinctions and flag
          unconfirmed instruments. Solo-founder fit ratings in the resources
          guide are editorial judgments, not official admission guarantees.
        </p>
        <p>
          Listing order in the calendar is determined by published dates or
          program name, not paid placement. General resources and software
          benefits in the solo-founder guide are not interchangeable with
          accelerator funding.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Corrections and history</h2>
        <p>
          Every program page links to its evidence and a correction form.
          Include the program name, the disputed fact and an official source.
          Corrections are reviewed before publication, and research changes are
          recorded in the{" "}
          <a
            href="https://github.com/IgorShadurin/foundercal.org/commits/master/data/accelerator-research"
            className="underline"
          >
            public revision history
          </a>
          .
        </p>
        <p>
          Closed cohorts remain labeled historical. Inactive programs lose
          application links. Retired legacy events are preserved in the{" "}
          <a href="/events-archive.json" className="underline">
            historical data archive
          </a>{" "}
          and are not treated as current evidence.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          Saved programs, calendars and analytics
        </h2>
        <p>
          Saved programs are stored on your device, without an account.
          Downloaded calendar entries are snapshots and do not update
          automatically. Exact times are included only when published; otherwise
          the export is an all-day reminder to check the official cutoff.
        </p>
        <p>
          We use Google Analytics and Vercel Analytics to understand page visits
          and interactions such as filters, program links, saves and calendar
          downloads. Custom search events contain search length and result
          count, not the search text. Shared filter URLs can contain your search
          terms; avoid entering personal information.
        </p>
      </section>
      <SiteFooter />
    </main>
  );
}
