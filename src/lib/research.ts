import fs from "node:fs";
import path from "node:path";
import aliases from "../../data/research-aliases.json";
import type { EventRecord } from "./event-data";

export type ResearchFinding = {
  accelerator: { name: string; website: string | null; csv_file: string; slug: string };
  status: "verified" | "needs_review" | "inactive" | "not_found";
  checked_at: string;
  summary: string;
  proposed_event: EventRecord | null;
  additional_events?: EventRecord[];
  sources: NonNullable<EventRecord["sources"]>;
  notes: string[];
};

export const researchFindings: ResearchFinding[] = fs
  .readdirSync(path.join(process.cwd(), "data", "accelerator-research"))
  .filter((name) => name.endsWith(".json"))
  .sort()
  .map((name) => JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "accelerator-research", name), "utf8")));

export function getResearch(slug: string) {
  const canonical = (aliases as Record<string, string>)[slug] ?? slug;
  return researchFindings.find((finding) => finding.accelerator.slug === canonical);
}

export function researchStatusLabel(status: ResearchFinding["status"]) {
  return {
    verified: "Official information reviewed",
    needs_review: "Current details need confirmation",
    inactive: "Inactive program",
    not_found: "Program not confirmed",
  }[status];
}

export function getProgramTerms(finding: ResearchFinding) {
  const financial = /investment|equity|SAFE|[$€£]|fees?|cash|credits|funding/i;
  const candidates = [finding.proposed_event?.description, finding.summary, ...finding.notes];
  return candidates.find((text) => text && financial.test(text)) ?? "Current funding, fee and equity terms were not confirmed. Check official program information.";
}
