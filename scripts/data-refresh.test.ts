import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { isCalendarDate, parseCsv, validateData, validateDates } from "./validate-data";
import type { EventRecord } from "../src/lib/event-data";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const emptyDates: EventRecord["dates"] = {
  application_open: null, application_close: null, program_start: null,
  program_end: null, demo_day: null, timezone: null, date_range_text: null,
};

test("calendar dates reject rollover and respect Gregorian leap years", () => {
  for (const invalid of ["2026-02-29", "2026-02-30", "2026-04-31", "1900-02-29", "2026-13-01", "2026-00-01", "2026-1-01", "2026-10-26T00:00:00Z"]) {
    assert.equal(isCalendarDate(invalid), false, invalid);
  }
  for (const valid of ["2024-02-29", "2000-02-29", "2026-10-26"]) assert.equal(isCalendarDate(valid), true, valid);
});

test("date order checks allow rolling admissions after a program starts", () => {
  assert.deepEqual(validateDates({ ...emptyDates, application_close: "2027-02-01", program_start: "2027-01-01" }, "rolling"), []);
  assert.match(validateDates({ ...emptyDates, application_open: "2027-02-01", application_close: "2027-01-01" }, "bad").join("\n"), /application_open must not follow/);
  assert.match(validateDates({ ...emptyDates, program_start: "2027-02-01", program_end: "2027-01-01" }, "bad").join("\n"), /program_start must not follow/);
  assert.match(validateDates({ ...emptyDates, program_start: "2027-02-01", demo_day: "2027-01-01" }, "bad").join("\n"), /program_start must not follow/);
});

test("CSV slugs survive names containing commas and quotes", () => {
  const rows = parseCsv('"accelerator","website","checked_at","slug"\n"Renamed, \"\"New\"\" Program","https://example.org/","2001-02-03","original-program"\n');
  assert.equal(rows[0].accelerator, 'Renamed, "New" Program');
  assert.equal(rows[0].slug, "original-program");
});

test("merge preserves research dates and sources and updates renamed CSV rows by stable slug", () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "foundercal-merge-"));
  try {
    fs.mkdirSync(path.join(fixture, "public"));
    fs.mkdirSync(path.join(fixture, "data/accelerator-research"), { recursive: true });
    const dataset = JSON.parse(fs.readFileSync(path.join(root, "public/events.json"), "utf8"));
    fs.writeFileSync(path.join(fixture, "public/events.json"), JSON.stringify({ taxonomies: dataset.taxonomies, events: [] }));
    const original = JSON.parse(fs.readFileSync(path.join(root, "data/accelerator-research/y-combinator.json"), "utf8"));
    original.accelerator = { name: "Renamed Program", slug: "original-program", website: "https://example.org/", csv_file: "data/accelerators-master.csv" };
    original.checked_at = "2001-02-03";
    original.sources = [{ title: "Program terms", url: "https://example.org/terms", publisher: "Example", accessed_at: "2001-02-03", supports: "Program details checked on the original research date." }];
    original.proposed_event.id = "fixture-program";
    original.proposed_event.name = "Renamed Program";
    original.proposed_event.website = "https://example.org/";
    fs.writeFileSync(path.join(fixture, "data/accelerator-research/original-program.json"), JSON.stringify(original));
    const uncertain = structuredClone(original);
    uncertain.accelerator = { ...original.accelerator, name: "Uncertain Program", slug: "uncertain-program", website: "https://uncertain.example/" };
    uncertain.status = "needs_review";
    uncertain.proposed_event.id = "uncertain-program";
    uncertain.proposed_event.name = "Uncertain Program";
    uncertain.proposed_event.website = "https://uncertain.example/";
    fs.writeFileSync(path.join(fixture, "data/accelerator-research/uncertain-program.json"), JSON.stringify(uncertain));
    fs.writeFileSync(path.join(fixture, "data/accelerators-master.csv"), '"accelerator","website","checked_at","slug"\n"Renamed Program","https://example.org/","1999-01-01","original-program"\n"Uncertain Program","https://uncertain.example/","1999-01-01","uncertain-program"\n');
    execFileSync(process.execPath, ["--import", require.resolve("tsx"), path.join(root, "scripts/accelerator-agents.ts"), "merge"], { cwd: fixture, encoding: "utf8" });
    const merged = JSON.parse(fs.readFileSync(path.join(fixture, "public/events.json"), "utf8"));
    const verified = merged.events.find((event: EventRecord) => event.id === "fixture-program");
    assert.equal(verified.last_verified_utc, "2001-02-03T00:00:00Z");
    assert.equal(verified.last_checked_utc, "2001-02-03T00:00:00Z");
    assert.equal(verified.research_slug, "original-program");
    assert.deepEqual(verified.sources, original.sources);
    const pending = merged.events.find((event: EventRecord) => event.id === "uncertain-program");
    assert.equal(pending.last_verified_utc, null);
    assert.equal(pending.last_checked_utc, "2001-02-03T00:00:00Z");
    assert.equal(pending.verification, "needs_review");
    const rows = parseCsv(fs.readFileSync(path.join(fixture, "data/accelerators-master.csv"), "utf8"));
    assert.equal(rows.find((row) => row.slug === "original-program")?.checked_at, "2001-02-03");

    // Replaying an older saved finding must not regress the published facts.
    const older = structuredClone(original);
    older.checked_at = "2000-01-01";
    older.sources[0].accessed_at = "2000-01-01";
    older.proposed_event.name = "Stale program name";
    fs.writeFileSync(path.join(fixture, "data/accelerator-research/original-program.json"), JSON.stringify(older));
    execFileSync(process.execPath, ["--import", require.resolve("tsx"), path.join(root, "scripts/accelerator-agents.ts"), "merge"], { cwd: fixture, encoding: "utf8" });
    const replayed = JSON.parse(fs.readFileSync(path.join(fixture, "public/events.json"), "utf8"));
    assert.equal(replayed.events.find((event: EventRecord) => event.id === "fixture-program")?.name, "Renamed Program", "older findings must not overwrite current event details");
    const replayedRows = parseCsv(fs.readFileSync(path.join(fixture, "data/accelerators-master.csv"), "utf8"));
    assert.equal(replayedRows.find((row) => row.slug === "original-program")?.checked_at, "2001-02-03", "older findings must not regress CSV review dates");

    // A later finding with no event must retire the formerly published listing.
    const retired = { ...original, checked_at: "2002-01-01", status: "inactive", proposed_event: null };
    fs.writeFileSync(path.join(fixture, "data/accelerator-research/original-program.json"), JSON.stringify(retired));
    execFileSync(process.execPath, ["--import", require.resolve("tsx"), path.join(root, "scripts/accelerator-agents.ts"), "merge"], { cwd: fixture, encoding: "utf8" });
    const afterRetirement = JSON.parse(fs.readFileSync(path.join(fixture, "public/events.json"), "utf8"));
    assert.equal(afterRetirement.events.some((event: EventRecord) => event.id === "fixture-program"), false, "inactive findings must retire prior current events");
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test("directory routes preserve explicit slugs across company renames", async () => {
  const { loadCsvAccelerators, getAcceleratorBySlug } = await import("../src/lib/accelerators");
  for (const file of ["data/accelerators-master.csv", "data/accelerators-crypto.csv"]) {
    const stored = parseCsv(fs.readFileSync(path.join(root, file), "utf8"));
    const loaded = loadCsvAccelerators(file);
    assert.deepEqual(loaded.map((row) => row.slug), stored.map((row) => row.slug));
    for (const row of stored) assert.equal(getAcceleratorBySlug(row.slug)?.slug, row.slug, row.accelerator);
  }
});

test("published calendar, company directory and research retain consistent provenance", () => {
  const result = validateData(root);
  assert.deepEqual(result.errors, []);
});

// A past start must not hide a future demo day, nor a later deadline hide an opening.
import { selectTimeline } from "../src/lib/event-timeline";
test("timeline picks relevant milestones inside the selected window", () => {
  const window = { start: new Date("2026-10-26"), end: new Date("2026-11-24") };
  assert.equal(selectTimeline({ program_start: new Date("2026-09-29"), demo_day: new Date("2026-11-17") }, ["program_start", "demo_day"], window)?.key, "demo_day");
  assert.equal(selectTimeline({ application_open: new Date("2026-11-01"), application_close: new Date("2027-01-17") }, ["application_close", "application_open"], window)?.key, "application_open");
  assert.equal(selectTimeline({}, ["application_close"], window), null);
});
