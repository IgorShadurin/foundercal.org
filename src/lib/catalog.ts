import { researchFindings, getResearch } from "./research";
import { loadEventDataset } from "./event-data";
import facts from "../../data/program-facts.json";
import {
  canonicalSlug,
  type Program,
  type ProgramFacts,
} from "./program-model";

const dataset = loadEventDataset();
export const programs: Program[] = researchFindings
  .filter((f) => canonicalSlug(f.accelerator.slug) === f.accelerator.slug)
  .map((original) => {
    const f = getResearch(original.accelerator.slug) ?? original;
    const slug = canonicalSlug(f.accelerator.slug);
    const cohorts = dataset.events.filter(
      (e) => canonicalSlug(e.research_slug ?? "") === slug,
    );
    const organizer = cohorts[0]?.organizer ?? f.accelerator.name;
    return {
      slug,
      name: f.accelerator.name,
      organizer_id: organizer
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      organizer_name: organizer,
      status: f.status,
      checked_at: f.checked_at,
      summary: f.summary,
      website: ["inactive", "not_found"].includes(f.status)
        ? null
        : f.accelerator.website,
      sources: f.sources,
      notes: f.notes,
      cohorts,
      facts: (facts as Record<string, ProgramFacts>)[slug],
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
export function getProgram(slug: string) {
  return programs.find((p) => p.slug === canonicalSlug(slug));
}
export function lastContentDate(items: Program[]) {
  return items.reduce(
    (latest, p) => (p.checked_at > latest ? p.checked_at : latest),
    "2026-10-27",
  );
}
