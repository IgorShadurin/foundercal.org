import fs from "node:fs";
import path from "node:path";
import { getResearch, getProgramTerms } from "../src/lib/research";

const slugify = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const importedPath = path.join(process.cwd(), "src/data/imported-accelerators.json");
const imported = JSON.parse(fs.readFileSync(importedPath, "utf8")) as Array<{ name: string; slug?: string }>;
const updated = imported.map((profile) => {
  const slug = profile.slug ?? slugify(profile.name);
  const finding = getResearch(slug);
  if (!finding) throw new Error(`No research for ${slug}`);
  const unavailable = finding.status === "inactive" || finding.status === "not_found";
  const event = finding.proposed_event;
  return {
    name: finding.accelerator.name,
    slug,
    website: unavailable ? null : finding.accelerator.website,
    applyUrl: finding.status === "verified" ? event?.website ?? null : null,
    description: event?.description ?? finding.summary,
    terms: getProgramTerms(finding),
    notes: [finding.summary, event?.dates.date_range_text, ...finding.notes].filter(Boolean).join(" "),
    checked_at: finding.checked_at,
    status: finding.status,
    sources: finding.sources,
  };
});
fs.writeFileSync(importedPath, JSON.stringify(updated, null, 2) + "\n");
for (const file of ["data/accelerators-master.csv", "data/accelerators-crypto.csv"]) {
  const lines = fs.readFileSync(file, "utf8").trim().split(/\r?\n/);
  const split = (line: string) => line.replace(/^"|"$/g, "").split('\",\"').map((value) => value.replace(/""/g, '"'));
  const headers = split(lines[0]);
  const records = lines.slice(1).map((line) => Object.fromEntries(split(line).map((value, index) => [headers[index], value])));
  const rows = records.map((record) => {
    const slug = record.slug || slugify(record.accelerator);
    const finding = getResearch(slug);
    if (!finding) throw new Error(`No research for ${slug}`);
    const unavailable = finding.status === "inactive" || finding.status === "not_found";
    return [finding.accelerator.name, unavailable ? "" : finding.accelerator.website ?? "", finding.checked_at, slug, finding.status];
  });
  const serialize = (row: string[]) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",");
  fs.writeFileSync(file, [["accelerator", "website", "checked_at", "slug", "status"], ...rows].map(serialize).join("\n") + "\n");
}
console.log(`Synchronized ${updated.length} profiles and both CSV trackers from research.`);
