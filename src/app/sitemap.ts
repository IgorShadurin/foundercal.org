import type { MetadataRoute } from "next";
import { programs, lastContentDate } from "@/lib/catalog";
import {
  collections,
  monthsWithDeadlines,
  monthPrograms,
} from "@/lib/collections";
import { BASE_URL, CONTENT_UPDATED } from "@/lib/program-model";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = [
    "",
    "/imported-accelerators",
    "/y-combinator-alternatives",
    "/alternatives-to-y-combinator-for-solo-founders",
    "/methodology",
  ];
  return [
    ...base.map((path) => ({
      url: BASE_URL + path,
      lastModified: lastContentDate(programs),
    })),
    ...programs
      .filter((p) => p.status !== "not_found")
      .map((p) => ({
        url: `${BASE_URL}/deadline/${p.slug}`,
        lastModified:
          p.checked_at > CONTENT_UPDATED ? p.checked_at : CONTENT_UPDATED,
      })),
    ...Object.keys(collections).map((key) => ({
      url: `${BASE_URL}/programs/${key}`,
      lastModified: lastContentDate(programs),
    })),
    ...monthsWithDeadlines(programs).map((month) => ({
      url: `${BASE_URL}/deadlines/${month}`,
      lastModified: lastContentDate(monthPrograms(month, programs)),
    })),
  ];
}
