import { getProgram } from "@/lib/catalog";
import { exportCalendar } from "@/lib/calendar-export";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("program"),
    program = slug ? getProgram(slug) : undefined;
  if (!program || program.status !== "verified")
    return new Response("Program not found", { status: 404 });
  const calendar = exportCalendar(program, new Date());
  if (!calendar.includes("BEGIN:VEVENT"))
    return new Response("No upcoming published deadlines", { status: 404 });
  return new Response(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${program.slug}.ics"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
