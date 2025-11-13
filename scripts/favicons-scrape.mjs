#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";

import {
  collectWebsiteEntries,
  normalizePageUrl,
  ensureDir,
} from "./lib/favicons-data.mjs";

const CONCURRENCY = 20;
const DEFAULT_ICON_PATHS = [
  "/favicon.ico",
  "/favicon.png",
  "/favicon-32x32.png",
  "/favicon-196x196.png",
  "/favicon-512x512.png",
  "/apple-touch-icon.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
];

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "tmp");
const manifestPath = path.join(outputDir, "favicons-manifest.json");
const overridesPath = path.join(projectRoot, "data", "favicon-overrides.json");
ensureDir(outputDir);

const overrides = fs.existsSync(overridesPath)
  ? JSON.parse(fs.readFileSync(overridesPath, "utf-8"))
  : {};

const entries = collectWebsiteEntries();
if (entries.length === 0) {
  console.error("No website entries found.");
  process.exit(1);
}

const hostMap = new Map();
entries.forEach((entry) => {
  const normalized = normalizePageUrl(entry.website);
  if (!normalized) return;
  try {
    const url = new URL(normalized);
    const hostname = url.hostname.toLowerCase();
    if (!hostMap.has(hostname)) {
      hostMap.set(hostname, {
        hostname,
        pageUrl: normalized,
        sources: new Set([entry.source]),
        inputs: new Set([normalized]),
      });
    } else {
      const meta = hostMap.get(hostname);
      meta.sources.add(entry.source);
      meta.inputs.add(normalized);
    }
  } catch {
    // ignore invalid URLs
  }
});

const hostEntries = Array.from(hostMap.values()).map((meta) => ({
  hostname: meta.hostname,
  pageUrl: Array.from(meta.inputs)[0],
  sources: Array.from(meta.sources),
}));

console.log(`Scraping ${hostEntries.length} host pages with concurrency ${CONCURRENCY}...`);

const scraped = await mapWithConcurrency(hostEntries, CONCURRENCY, scrapeHost);

const manifest = {
  generatedAt: new Date().toISOString(),
  totalHosts: hostEntries.length,
  entries: scraped,
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Manifest saved to ${manifestPath}`);

async function scrapeHost(meta) {
  const result = {
    hostname: meta.hostname,
    pageUrl: meta.pageUrl,
    sources: meta.sources,
    scrapedAt: new Date().toISOString(),
    candidates: [],
    errors: [],
  };

  const seen = new Set();
  const pushCandidate = (url, type, extra = {}) => {
    if (!url) return;
    try {
      const resolved = new URL(url, meta.pageUrl).href;
      if (seen.has(resolved)) return;
      seen.add(resolved);
      result.candidates.push({ url: resolved, type, ...extra });
    } catch {
      // ignore invalid URLs
    }
  };

  if (overrides[meta.hostname]) {
    pushCandidate(overrides[meta.hostname], "override");
  }

  try {
    const response = await fetchWithTimeout(meta.pageUrl, 15000);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const $ = load(html);

    $("link[rel]").each((_, element) => {
      const relValue = ($(element).attr("rel") ?? "").toLowerCase();
      if (!relValue.includes("icon")) return;
      const href = $(element).attr("href");
      pushCandidate(href, "link", {
        rel: relValue,
        sizes: $(element).attr("sizes") ?? null,
      });
    });

    $("meta[property='og:image'], meta[name='msapplication-TileImage']").each((_, element) => {
      const content = $(element).attr("content");
      pushCandidate(content, "meta", {});
    });
  } catch (error) {
    result.errors.push(String(error?.message ?? error));
  }

  try {
    const origin = new URL(meta.pageUrl).origin;
    DEFAULT_ICON_PATHS.forEach((iconPath) => {
      pushCandidate(new URL(iconPath, origin).href, "fallback");
    });
  } catch {
    // ignore origin issues
  }

  return result;
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (true) {
      const current = index;
      index += 1;
      if (current >= items.length) {
        break;
      }
      try {
        results[current] = await mapper(items[current], current);
      } catch (error) {
        results[current] = {
          hostname: items[current].hostname,
          pageUrl: items[current].pageUrl,
          sources: items[current].sources,
          scrapedAt: new Date().toISOString(),
          candidates: [],
          errors: [String(error?.message ?? error)],
        };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "foundercal-favicon-scraper/1.0 (+https://foundercal.org)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
