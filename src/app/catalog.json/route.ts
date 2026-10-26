import { programs } from "@/lib/catalog";
import {
  applicationRounds,
  applicationState,
  nextReviewDate,
} from "@/lib/program-model";
export const dynamic = "force-dynamic";
export function GET() {
  const now = new Date();
  return Response.json(
    {
      schema_version: 1,
      generated_at: now.toISOString(),
      organizations: [
        ...new Map(
          programs.map((p) => [
            p.organizer_id,
            { id: p.organizer_id, name: p.organizer_name },
          ]),
        ).values(),
      ],
      programs: programs.map((p) => ({
        ...p,
        application_status: applicationState(p, now),
        next_review_due: nextReviewDate(p, now),
        cohorts: p.cohorts.map((e) => ({
          ...e,
          application_rounds: applicationRounds(e, p.facts),
        })),
      })),
    },
    {
      headers: {
        "X-Robots-Tag": "noindex",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
