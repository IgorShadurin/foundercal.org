export type CalendarQuery = {
  mode: string;
  q: string;
  region: string;
  sector: string;
  type: string;
  start: string;
  days: number;
};
export function parseCalendarQuery(
  params: URLSearchParams,
  today: string,
  directory = false,
): CalendarQuery {
  const start = params.get("start") ?? today;
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(start) &&
    Number.isFinite(Date.parse(start)) &&
    new Date(start).toISOString().slice(0, 10) === start;
  return {
    mode: ["soon", "rolling", "all", "milestones", "saved"].includes(
      params.get("mode") ?? "",
    )
      ? params.get("mode")!
      : directory
        ? "all"
        : "soon",
    q: (params.get("q") ?? "").slice(0, 150),
    region: params.get("region") ?? "all",
    sector: params.get("sector") ?? "all",
    type: params.get("type") ?? "all",
    start: validDate ? start : today,
    days: [30, 90, 182, 365].includes(Number(params.get("days")))
      ? Number(params.get("days"))
      : 30,
  };
}
export function serializeCalendarQuery(
  q: CalendarQuery,
  today: string,
  directory = false,
) {
  const params = new URLSearchParams();
  if (q.mode !== (directory ? "all" : "soon")) params.set("mode", q.mode);
  if (q.q) params.set("q", q.q);
  for (const key of ["region", "sector", "type"] as const)
    if (q[key] !== "all") params.set(key, q[key]);
  if (q.start !== today) params.set("start", q.start);
  if (q.days !== 30) params.set("days", String(q.days));
  return params.toString();
}
