import {
  applicationState,
  applicationRounds,
  type Program,
} from "./program-model";
export const collections = {
  "upcoming-deadlines": {
    title: "Upcoming Startup Accelerator Application Deadlines",
    description:
      "Published future cutoffs across accelerator, fellowship and funding programs. A deadline alone does not establish eligibility or guarantee an open application form.",
    guidance:
      "Start with your eligibility and attendance constraints, then check the official application page. Programs with missing deadlines appear in the full directory.",
  },
  "rolling-applications": {
    title: "Founder Programs with Rolling Applications",
    description:
      "Programs whose official sources explicitly describe rolling or year-round applications. No fixed deadline does not mean every application is accepted.",
    guidance:
      "Rolling review is different from a dated cohort. Confirm intake, location and current terms before preparing an application.",
  },
  ai: {
    title: "AI Startup Accelerators & Founder Programs",
    description:
      "Compare researched programs categorized for AI startups, including their published dates, formats and funding notes.",
    guidance:
      "Some programs are generalist with an AI track. Read the individual cohort requirements; the AI category is not a guarantee of eligibility.",
  },
  europe: {
    title: "Startup Accelerators & Funding Programs in Europe",
    description:
      "Research programs located in Europe, with published deadlines and official sources. Location is not the same as applicant residency eligibility.",
    guidance:
      "Check incorporation, residency, relocation and grant eligibility separately. Some opportunities require a successful preliminary proposal.",
  },
  grants: {
    title: "Startup Grants & Grant Programs",
    description:
      "Explore opportunities categorized as grants, with application dates and source evidence. Some programs combine grants with other instruments.",
    guidance:
      "Read the instrument and solicitation carefully: a grant label does not make every offer equity-free, and eligibility may depend on incorporation or a prior invitation.",
  },
} as const;
export type CollectionKey = keyof typeof collections;
export function collectionPrograms(
  key: CollectionKey,
  items: Program[],
  now: Date,
) {
  return items
    .filter((p) => p.status === "verified")
    .filter((p) => {
      const state = applicationState(p, now);
      if (key === "upcoming-deadlines")
        return ["open", "deadline", "upcoming", "check"].includes(state.key);
      if (key === "rolling-applications") return state.key === "rolling";
      return p.cohorts.some((e) =>
        key === "ai"
          ? e.categories.sectors.includes("ai")
          : key === "europe"
            ? e.location.region_code === "eu"
            : e.categories.types.includes("grant"),
      );
    });
}
export function monthsWithDeadlines(items: Program[]) {
  return [
    ...new Set(
      items.flatMap((p) =>
        p.cohorts.flatMap((e) =>
          applicationRounds(e, p.facts).map((r) => r.close_date.slice(0, 7)),
        ),
      ),
    ),
  ].sort();
}
export function monthPrograms(month: string, items: Program[]) {
  return items.filter(
    (p) =>
      p.status === "verified" &&
      p.cohorts.some((e) =>
        applicationRounds(e, p.facts).some((r) =>
          r.close_date.startsWith(month),
        ),
      ),
  );
}
