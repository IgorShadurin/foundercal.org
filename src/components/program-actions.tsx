"use client";
import { useEffect, useState } from "react";
import { Bookmark, CalendarPlus } from "lucide-react";
import { trackAction } from "./analytics-events";
export const SAVED_KEY = "foundercal:saved-programs";
export function readSaved(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}
export function ProgramActions({
  slug,
  hasDates,
}: {
  slug: string;
  hasDates: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const sync = () => setSaved(readSaved().includes(slug));
    sync();
    window.addEventListener("foundercal:saved", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("foundercal:saved", sync);
      window.removeEventListener("storage", sync);
    };
  }, [slug]);
  const toggle = () => {
    try {
      const items = new Set(readSaved());
      if (items.has(slug)) items.delete(slug);
      else items.add(slug);
      localStorage.setItem(SAVED_KEY, JSON.stringify([...items]));
      window.dispatchEvent(new Event("foundercal:saved"));
      trackAction("save_program", {
        program: slug,
        saved: items.has(slug) ? 1 : 0,
      });
      setError("");
    } catch {
      setError("Saving is unavailable in this browser.");
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={saved}
        aria-label={`${saved ? "Unsave" : "Save"} this program`}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 hover:bg-muted"
      >
        <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved" : "Save"}
      </button>
      {hasDates && (
        <a
          href={`/calendar.ics?program=${slug}`}
          data-track="calendar_export"
          data-program={slug}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 hover:bg-muted"
        >
          <CalendarPlus size={16} />
          Add dates to calendar
        </a>
      )}
      {error && <span role="status">{error}</span>}
    </div>
  );
}
