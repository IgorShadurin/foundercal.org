import type { MetadataRoute } from "next";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = "https://foundercal.org";

const fallbackLastModified = new Date();

const entries: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  filePath?: string;
}> = [
  {
    path: "/",
    changeFrequency: "daily",
    priority: 1,
    filePath: "src/app/page.tsx",
  },
  {
    path: "/imported-accelerators",
    changeFrequency: "weekly",
    priority: 0.6,
    filePath: "src/app/imported-accelerators/page.tsx",
  },
  {
    path: "/events.json",
    changeFrequency: "daily",
    priority: 0.8,
    filePath: "public/events.json",
  },
  {
    path: "/y-combinator-alternatives",
    changeFrequency: "monthly",
    priority: 0.7,
    filePath: "src/app/y-combinator-alternatives/page.tsx",
  },
];

function resolveLastModified(filePath?: string) {
  if (!filePath) {
    return fallbackLastModified;
  }

  const absolutePath = path.join(process.cwd(), filePath);
  try {
    const stats = fs.statSync(absolutePath);
    return stats.mtime;
  } catch {
    return fallbackLastModified;
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    url: `${BASE_URL}${entry.path === "/" ? "" : entry.path}`,
    lastModified: resolveLastModified(entry.filePath),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
