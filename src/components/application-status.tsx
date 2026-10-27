import {
  CalendarDays,
  CircleCheck,
  CircleHelp,
  CircleMinus,
  Clock3,
  Infinity as InfinityIcon,
} from "lucide-react";

export function ApplicationStatus({
  state,
}: {
  state: { key: string; label: string };
}) {
  const accepting = state.key === "open" || state.key === "rolling";
  const Icon =
    state.key === "open"
      ? CircleCheck
      : state.key === "rolling"
        ? InfinityIcon
        : state.key === "upcoming" || state.key === "deadline"
          ? CalendarDays
          : state.key === "closed" || state.key === "inactive"
            ? CircleMinus
            : state.key === "check"
              ? Clock3
              : CircleHelp;
  const style = accepting
    ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
    : state.key === "closed" || state.key === "inactive"
      ? "border-transparent bg-muted text-foreground"
      : state.key === "unknown" || state.key === "check"
        ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
        : "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200";
  return (
    <span
      data-application-status={state.key}
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}
    >
      <Icon size={14} className="shrink-0" aria-hidden="true" />
      {state.label}
    </span>
  );
}
