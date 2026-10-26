#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { EventDataset, EventRecord } from "../src/lib/event-data";

type Source = { url: string; title: string; accessed_at: string; supports: string };
type Finding = {
  accelerator: { slug: string; name: string };
  status: "verified" | "needs_review" | "inactive" | "not_found";
  checked_at: string;
  proposed_event: EventRecord | null;
  sources: Source[];
};
type Profile = { name: string; slug: string; checked_at: string; status: Finding["status"]; sources: Source[] };
const dateFields = ["application_open", "application_close", "program_start", "program_end", "demo_day"] as const;
const statusValues = ["verified", "needs_review", "inactive", "not_found"];

/** Date.parse silently accepts e.g. February 30, so require a round trip. */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateDates(dates: EventRecord["dates"], label: string): string[] {
  const errors: string[] = [];
  for (const key of dateFields) {
    if (dates[key] !== null && !isCalendarDate(dates[key])) errors.push(`${label}: dates.${key} is not a real YYYY-MM-DD date`);
  }
  for (const [start, end] of [["application_open", "application_close"], ["program_start", "program_end"], ["program_start", "demo_day"]] as const) {
    if (dates[start] && dates[end] && dates[start] > dates[end]) errors.push(`${label}: ${start} must not follow ${end}`);
  }
  return errors;
}

function validHttpUrl(value: unknown) {
  if (typeof value !== "string") return false;
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function parseCsv(text: string): Record<string, string>[] {
  // These trackers are one record per line, with RFC 4180 quoted fields.
  const split = (line: string) => {
    const fields: string[] = [];
    let field = "";
    let quoted = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') { field += '"'; index++; }
        else quoted = !quoted;
      } else if (char === "," && !quoted) { fields.push(field); field = ""; }
      else field += char;
    }
    fields.push(field);
    return fields;
  };
  const [header, ...lines] = text.trim().split(/\r?\n/);
  if (!header) return [];
  const columns = split(header);
  return lines.filter(Boolean).map((line) => {
    const values = split(line);
    return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""]));
  });
}

export function validateData(root = process.cwd()) {
  const errors: string[] = [];
  const read = <T,>(file: string): T => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  const dataset = read<EventDataset>("public/events.json");
  const archive = read<EventDataset>("public/events-archive.json");
  const findings = new Map<string, Finding>();
  const aliases = read<Record<string, string>>("data/research-aliases.json");
  const profileRows = read<Profile[]>("src/data/imported-accelerators.json");
  const checkSources = (sources: Source[] | undefined, label: string, checked: string) => {
    if (!Array.isArray(sources) || !sources.length) { errors.push(`${label}: sources are required`); return; }
    sources.forEach((source, index) => {
      const prefix = `${label}: source ${index + 1}`;
      if (!validHttpUrl(source.url)) errors.push(`${prefix} must have an HTTP(S) URL`);
      if (!source.title?.trim() || !source.supports?.trim()) errors.push(`${prefix} needs a title and supporting evidence`);
      if (!isCalendarDate(source.accessed_at)) errors.push(`${prefix} has an invalid accessed_at date`);
      else if (isCalendarDate(checked) && source.accessed_at > checked) errors.push(`${prefix} was accessed after checked_at`);
    });
  };
  const researchDir = path.join(root, "data/accelerator-research");
  for (const filename of fs.readdirSync(researchDir).filter((file) => file.endsWith(".json")).sort()) {
    const finding = read<Finding>(`data/accelerator-research/${filename}`);
    const label = `research/${filename}`;
    const slug = finding.accelerator?.slug;
    if (!slug || filename !== `${slug}.json`) errors.push(`${label}: filename must match the stable research slug`);
    if (findings.has(slug)) errors.push(`${label}: duplicate research slug`);
    findings.set(slug, finding);
    if (!statusValues.includes(finding.status)) errors.push(`${label}: invalid review status`);
    if (!isCalendarDate(finding.checked_at)) errors.push(`${label}: invalid checked_at`);
    if (finding.status === "verified" && !finding.proposed_event) errors.push(`${label}: verified research requires an event`);
    checkSources(finding.sources, label, finding.checked_at);
    if (finding.proposed_event) errors.push(...validateDates(finding.proposed_event.dates, label));
  }

  function resolve(slug: string): Finding | undefined {
    const visited = new Set<string>();
    let current = slug;
    while (aliases[current]) {
      if (visited.has(current)) { errors.push(`aliases: cycle involving ${slug}`); return; }
      visited.add(current);
      current = aliases[current];
    }
    return findings.get(current);
  }
  for (const alias of Object.keys(aliases)) {
    if (!resolve(alias)) errors.push(`aliases: ${alias} does not resolve to research`);
  }

  const seenIds = new Set<string>();
  for (const event of dataset.events) {
    const label = `events/${event.id}`;
    if (seenIds.has(event.id)) errors.push(`${label}: duplicate event ID`);
    seenIds.add(event.id);
    errors.push(...validateDates(event.dates, label));
    const finding = event.research_slug ? findings.get(event.research_slug) : undefined;
    if (!finding) errors.push(`${label}: must map to a research result`);
    else {
      if (!["verified", "needs_review"].includes(finding.status)) errors.push(`${label}: inactive or unconfirmed program must not be in current calendar`);
      if (!finding.proposed_event || finding.proposed_event.id !== event.id) errors.push(`${label}: event ID must match its research proposal`);
      if (event.last_checked_utc?.slice(0, 10) !== finding.checked_at) errors.push(`${label}: last_checked_utc must preserve research checked_at`);
      if (finding.status === "verified") {
        if (event.last_verified_utc?.slice(0, 10) !== finding.checked_at) errors.push(`${label}: last_verified_utc must preserve research checked_at`);
      } else if (event.last_verified_utc !== null) errors.push(`${label}: needs_review must not have a verification timestamp`);
      checkSources(event.sources, label, finding.checked_at);
      if (JSON.stringify(event.sources) !== JSON.stringify(finding.sources)) errors.push(`${label}: sources must match the research evidence`);
    }
    if (event.website && !validHttpUrl(event.website)) errors.push(`${label}: invalid website`);
    for (const [category, indexKey] of [["types", "type_keys"], ["supports", "support_keys"], ["sectors", "sector_keys"]] as const) {
      const values = event.categories[category];
      if (!values.length || values.some((value) => !dataset.taxonomies[category].includes(value))) errors.push(`${label}: invalid ${category} taxonomy`);
      if (JSON.stringify(values) !== JSON.stringify(event.index[indexKey])) errors.push(`${label}: ${indexKey} must match categories`);
    }
    if (event.location.region_code && !dataset.taxonomies.regions.includes(event.location.region_code)) errors.push(`${label}: invalid region taxonomy`);
    for (const key of ["region_code", "country_code", "city_slug"] as const) {
      if (event.index[key] !== event.location[key]) errors.push(`${label}: index.${key} must match location`);
    }
    const years = Array.from(new Set(dateFields.flatMap((key) => event.dates[key] ? [event.dates[key].slice(0, 4)] : []))).sort();
    if (JSON.stringify(event.index.years) !== JSON.stringify(years)) errors.push(`${label}: index.years must match known dates`);
    const expectedSort = event.dates.application_close ?? event.dates.program_start ?? event.dates.application_open ?? event.dates.demo_day ?? event.dates.program_end;
    if (event.index.date_sort_key !== expectedSort) errors.push(`${label}: incorrect date_sort_key`);
  }

  const profileSlugs = new Set<string>();
  for (const profile of profileRows) {
    const label = `imported/${profile.name}`;
    if (!profile.slug || profileSlugs.has(profile.slug)) errors.push(`${label}: stable unique slug required`);
    profileSlugs.add(profile.slug);
    const finding = resolve(profile.slug);
    if (!finding) errors.push(`${label}: slug must resolve to research`);
    else {
      if (profile.checked_at !== finding.checked_at) errors.push(`${label}: checked_at must match research`);
      if (profile.status !== finding.status) errors.push(`${label}: status must match research`);
    }
    checkSources(profile.sources, label, profile.checked_at);
  }
  for (const file of ["data/accelerators-master.csv", "data/accelerators-crypto.csv"]) {
    const rows = parseCsv(fs.readFileSync(path.join(root, file), "utf8"));
    const slugs = new Set<string>();
    for (const row of rows) {
      const label = `${file}/${row.accelerator}`;
      if (!row.slug || slugs.has(row.slug)) errors.push(`${label}: stable unique slug required`);
      slugs.add(row.slug);
      const finding = resolve(row.slug);
      if (!finding) errors.push(`${label}: slug must resolve to research`);
      else if (row.checked_at !== finding.checked_at) errors.push(`${label}: checked_at must match research`);
    }
  }
  const solo = read<Array<{ rank: number; option: string; source: string; review_status: string; checked_at: string; source_notes: string }>>("src/data/yc-alternatives-solo-founders-100.json");
  const soloAudit = read<{ records: Array<{ rank: number; option: string; sources: string[]; status: string; checked_at: string }> }>("data/solo-alternatives-review.json");
  if (solo.length !== 100 || new Set(solo.map((row) => row.rank)).size !== 100) errors.push("solo: expected 100 uniquely ranked resources");
  for (const row of solo) {
    if (!Number.isInteger(row.rank) || row.rank < 1 || row.rank > 100 || !validHttpUrl(row.source) || !isCalendarDate(row.checked_at) || !row.source_notes?.trim() || !["reviewed", "needs_review"].includes(row.review_status)) errors.push(`solo/${row.rank}: invalid review metadata`);
    const audit = soloAudit.records.find((record) => record.rank === row.rank);
    if (!audit || audit.option !== row.option || audit.status !== row.review_status || audit.checked_at !== row.checked_at || !audit.sources.includes(row.source)) errors.push(`solo/${row.rank}: audit must match published resource`);
  }
  if (!Array.isArray(archive.events) || !archive.events.length) errors.push("archive: original event history must be preserved");
  return { errors, events: dataset.events.length, research: findings.size, profiles: profileRows.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = validateData();
    result.errors.forEach((error) => console.error(`error: ${error}`));
    console.log(`Checked ${result.events} current events, ${result.research} research records, and ${result.profiles} imported profiles.`);
    if (result.errors.length) process.exitCode = 1;
    else console.log("Data integrity checks passed.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
