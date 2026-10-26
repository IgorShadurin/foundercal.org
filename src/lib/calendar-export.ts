import {
  applicationRounds,
  roundPassed,
  BASE_URL,
  type Program,
} from "./program-model";
function escapeText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}
function timestamp(date: Date) {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}
function fold(line: string) {
  let current = "",
    result = "";
  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf8") > 73) {
      result += current + "\r\n";
      current = " ";
    }
    current += char;
  }
  return result + current;
}
export function exportCalendar(program: Program, now: Date) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FounderCal//Application deadlines//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const event of program.cohorts)
    for (const round of applicationRounds(event, program.facts).filter(
      (r) => !roundPassed(r, now),
    )) {
      const precise = Boolean(round.closes_at);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${round.id}@foundercal.org`,
        `DTSTAMP:${timestamp(new Date(round.checked_at + "T00:00:00Z"))}`,
        precise
          ? `DTSTART:${timestamp(new Date(round.closes_at!))}`
          : `DTSTART;VALUE=DATE:${round.close_date.replace(/-/g, "")}`,
        `SUMMARY:${escapeText(`${program.name} — ${round.label}${precise ? "" : " (confirm cutoff time)"}`)}`,
        `DESCRIPTION:${escapeText(`Source: ${round.source_url}\nChecked: ${round.checked_at}\n${round.submitter_local ? "Due 5:00 PM in the submitter’s local time. " : ""}${precise ? "Published cutoff time." : "Date-only reminder; not an assumed midnight cutoff."}\nImported calendar copies do not automatically update. Recheck the source before applying.`)}`,
        `URL:${BASE_URL}/deadline/${program.slug}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        "DESCRIPTION:Check application requirements and confirm deadline",
        "END:VALARM",
        "END:VEVENT",
      );
    }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
