"use client";
import { useEffect } from "react";
export function trackAction(
  name: string,
  properties: Record<string, string | number> = {},
) {
  const win = window as Window & { gtag?: (...args: unknown[]) => void };
  win.gtag?.("event", name, properties);
}
export function AnalyticsEvents() {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest(
        "a[data-track]",
      ) as HTMLAnchorElement | null;
      if (link)
        trackAction(link.dataset.track!, {
          program: link.dataset.program ?? "",
          destination: new URL(link.href).hostname,
        });
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);
  return null;
}
