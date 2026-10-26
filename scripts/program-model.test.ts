import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  applicationRounds,
  applicationState,
  roundPassed,
  nextReviewDate,
  canonicalSlug,
  CONTENT_UPDATED,
  type Program,
} from "../src/lib/program-model";
import { programs, getProgram } from "../src/lib/catalog";
import { exportCalendar } from "../src/lib/calendar-export";
import {
  parseCalendarQuery,
  serializeCalendarQuery,
} from "../src/lib/calendar-query";
import {
  collectionPrograms,
  monthsWithDeadlines,
} from "../src/lib/collections";
import sitemap from "../src/app/sitemap";
const now = new Date("2026-10-27T12:00:00Z");
test("canonical program identities collapse aliases while preserving lookup", () => {
  assert.equal(canonicalSlug("500-startups"), "500-global");
  assert.equal(getProgram("500-startups"), getProgram("500-global"));
  assert.equal(new Set(programs.map((p) => p.slug)).size, programs.length);
  for (const p of programs) {
    assert.equal(canonicalSlug(p.slug), p.slug);
    for (const e of p.cohorts)
      assert.equal(canonicalSlug(e.research_slug!), p.slug);
  }
});
test("published exact cutoffs respect timezone and DST", () => {
  const p = getProgram("y-combinator")!,
    r = applicationRounds(p.cohorts[0], p.facts)[0];
  assert.equal(roundPassed(r, new Date("2026-11-03T03:59:59Z")), false);
  assert.equal(roundPassed(r, new Date("2026-11-03T04:00:00Z")), true);
  const speed = getProgram("a16z-speedrun")!,
    s = applicationRounds(speed.cohorts[0], speed.facts)[0];
  assert.equal(s.closes_at, "2026-11-01T23:59:00-08:00");
  assert.equal(applicationState(speed, now).key, "open");
});
test("date-only and submitter-local deadlines never invent a midnight UTC cutoff", () => {
  const p = getProgram("nsf-sbir-sttr")!,
    r = applicationRounds(p.cohorts[0], p.facts)[0];
  assert.equal(roundPassed(r, new Date("2026-11-05T01:00:00Z")), false);
  assert.equal(roundPassed(r, new Date("2026-11-05T13:00:00Z")), true);
  assert.equal(
    applicationState(p, new Date("2026-11-04T20:00:00Z")).key,
    "check",
  );
});
test("later application rounds remain discoverable after first cutoff passes", () => {
  const p = getProgram("nsf-sbir-sttr")!;
  assert.equal(applicationRounds(p.cohorts[0], p.facts).length, 2);
  assert.equal(
    applicationState(p, new Date("2026-11-06T00:00:00Z")).date,
    "2027-03-04",
  );
  assert.ok(monthsWithDeadlines(programs).includes("2027-03"));
});
test("rolling requires explicit cohort-bound evidence; unknown is not open", () => {
  assert.equal(applicationState(getProgram("pearx")!, now).key, "rolling");
  const p = structuredClone(getProgram("pearx")!);
  delete p.facts;
  assert.equal(applicationState(p, now).key, "unknown");
  p.facts = {
    event_id: "old-cohort",
    rolling: {
      value: "Rolling",
      source_url: "https://example.org",
      checked_at: "2026-10-27",
    },
  };
  assert.equal(applicationState(p, now).key, "unknown");
  assert.ok(
    collectionPrograms("rolling-applications", programs, now).length >= 3,
  );
});
test("freshness changes review due date without advancing evidence dates", () => {
  const p = getProgram("y-combinator")!;
  const checked = p.checked_at;
  assert.equal(nextReviewDate(p, now), "2026-10-27");
  assert.equal(p.checked_at, checked);
  const pending = {
    ...p,
    status: "needs_review",
    checked_at: "2026-10-27",
  } as Program;
  assert.equal(nextReviewDate(pending, now), "2026-11-03");
});
test("shareable filters round-trip, invalid dates and ranges are rejected", () => {
  const q = parseCalendarQuery(
    new URLSearchParams(
      "mode=rolling&q=AI%20%26%20climate&start=2027-03-04&days=90&sector=ai",
    ),
    "2026-10-27",
  );
  assert.deepEqual(
    parseCalendarQuery(
      new URLSearchParams(serializeCalendarQuery(q, "2026-10-27")),
      "2026-10-27",
    ),
    q,
  );
  assert.equal(
    parseCalendarQuery(
      new URLSearchParams("start=2026-02-30&days=-1&mode=bad"),
      "2026-10-27",
    ).start,
    "2026-10-27",
  );
  assert.deepEqual(parseCalendarQuery(new URLSearchParams(), "2026-10-27"), {
    mode: "soon",
    q: "",
    region: "all",
    sector: "all",
    type: "all",
    start: "2026-10-27",
    days: 30,
  });
});
test("calendar exports use UTC for precise cutoffs, all-day for unknown time, and exclude expired rounds", () => {
  const yc = exportCalendar(getProgram("y-combinator")!, now);
  assert.match(yc, /DTSTART:20261103T040000Z/);
  assert.match(yc, /BEGIN:VALARM/);
  const nsf = exportCalendar(
    getProgram("nsf-sbir-sttr")!,
    new Date("2026-11-06T00:00:00Z"),
  );
  assert.match(nsf, /DTSTART;VALUE=DATE:20270304/);
  assert.doesNotMatch(nsf, /DTSTART;VALUE=DATE:20261104/);
  for (const line of nsf.split("\r\n"))
    assert.ok(Buffer.byteLength(line) <= 75);
  assert.ok(nsf.endsWith("END:VCALENDAR\r\n"));
});
test("sitemap includes canonical program and landing URLs with stable content dates", () => {
  const urls = sitemap();
  assert.equal(new Set(urls.map((x) => x.url)).size, urls.length);
  for (const p of programs.filter((p) => p.status !== "not_found"))
    assert.ok(
      urls.some((x) => x.url === `https://foundercal.org/deadline/${p.slug}`),
    );
  assert.ok(!urls.some((x) => x.url.includes("/500-startups")));
  assert.ok(!urls.some((x) => x.url.endsWith("events.json")));
  for (const item of urls)
    assert.match(String(item.lastModified), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(CONTENT_UPDATED, "2026-10-27");
});
test("curated field evidence matches live cohort and official research sources", () => {
  const facts = JSON.parse(fs.readFileSync("data/program-facts.json", "utf8"));
  for (const [slug, value] of Object.entries(facts)) {
    const p = getProgram(slug)!;
    assert.ok(p, slug);
    const f = value as NonNullable<Program["facts"]>;
    assert.ok(
      p.cohorts.some((e) => e.id === f.event_id),
      slug,
    );
    for (const evidence of [
      f.rolling,
      f.deadline,
      f.eligibility,
      f.funding,
      ...(f.additional_rounds ?? []),
    ].filter(Boolean)) {
      assert.ok(
        p.sources.some((s) => s.url === evidence!.source_url),
        `${slug}: source must be in reviewed research`,
      );
      assert.match(evidence!.checked_at, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
});
test("merge accepts multiple cohorts for one research program and retains both", () => {
  const root = process.cwd(),
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "foundercal-cohorts-"));
  const require = createRequire(import.meta.url);
  try {
    fs.mkdirSync(path.join(dir, "public"));
    fs.mkdirSync(path.join(dir, "data/accelerator-research"), {
      recursive: true,
    });
    const dataset = JSON.parse(fs.readFileSync("public/events.json", "utf8"));
    fs.writeFileSync(
      path.join(dir, "public/events.json"),
      JSON.stringify({ ...dataset, events: [] }),
    );
    const f = JSON.parse(
      fs.readFileSync("data/accelerator-research/y-combinator.json", "utf8"),
    );
    f.accelerator.csv_file = "none";
    f.additional_events = [structuredClone(f.proposed_event)];
    f.additional_events[0].id = "second-cohort";
    f.additional_events[0].name = "Second independent cohort";
    // Two distinct cohorts may intentionally share the same cutoff.
    fs.writeFileSync(
      path.join(dir, "data/accelerator-research/y-combinator.json"),
      JSON.stringify(f),
    );
    execFileSync(
      process.execPath,
      [
        "--import",
        require.resolve("tsx"),
        path.join(root, "scripts/accelerator-agents.ts"),
        "merge",
      ],
      { cwd: dir, encoding: "utf8" },
    );
    const results = JSON.parse(
      fs.readFileSync(path.join(dir, "public/events.json"), "utf8"),
    ).events;
    assert.equal(results.length, 2);
    assert.equal(
      new Set(results.map((e: { research_slug: string }) => e.research_slug))
        .size,
      1,
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
