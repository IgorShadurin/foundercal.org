#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "public", "favicons");
const ICON_PATHS = [
  "/favicon.ico",
  "/favicon.png",
  "/favicon-32x32.png",
  "/favicon-192x192.png",
  "/favicon-196x196.png",
  "/apple-touch-icon.png",
];
const FAVICON_EXTENSIONS = [".png", ".ico", ".jpg", ".jpeg", ".svg", ".webp"];
const USER_AGENT = "foundercal-favicon-fetcher/1.0 (+https://foundercal.org)";

fs.mkdirSync(outputDir, { recursive: true });

const jsonPath = path.join(projectRoot, "src", "data", "imported-accelerators.json");
const notionData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
const csvFiles = [
  path.join(projectRoot, "data", "accelerators-master.csv"),
  path.join(projectRoot, "data", "accelerators-crypto.csv"),
];

const hosts = new Map();

function addUrl(raw) {
  if (!raw) return;
  const trimmed = String(raw).trim();
  if (!trimmed) return;
  let target = trimmed;
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    target = `https://${trimmed.replace(/^\/+/, "")}`;
  }
  try {
    const url = new URL(target);
    if (!url.hostname) return;
    const hostname = url.hostname.toLowerCase();
    if (!hosts.has(hostname)) {
      hosts.set(hostname, { protocols: new Set(), sources: new Set() });
    }
    hosts.get(hostname).protocols.add(url.protocol || "https:");
  } catch {
    // ignore invalid urls
  }
}

notionData.forEach((entry) => {
  addUrl(entry.website);
});

csvFiles.forEach((filePath) => {
  if (!fs.existsSync(filePath)) return;
  const records = parseCsv(filePath);
  records.forEach((record) => addUrl(record.website));
});

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const record = {};
    headers.forEach((header, index) => {
      record[header.replace(/"/g, "")] = values[index] ?? "";
    });
    return record;
  });
}

function splitCsvLine(line) {
  let normalized = line.trim();
  if (normalized.startsWith("\"") && normalized.endsWith("\"")) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.split(/","/).map((value) => value.replace(/""/g, "\"").trim());
}

function sanitizeHost(hostname) {
  return hostname.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
}

function hasLocalIcon(hostname) {
  const safe = sanitizeHost(hostname);
  return FAVICON_EXTENSIONS.some((ext) => fs.existsSync(path.join(outputDir, `${safe}${ext}`)));
}

function extensionFromContentType(type) {
  const normalized = (type || "").split(";")[0].trim();
  switch (normalized) {
    case "image/png":
      return ".png";
    case "image/jpeg":
    case "image/jpg":
      return ".jpg";
    case "image/svg+xml":
      return ".svg";
    case "image/webp":
      return ".webp";
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
    default:
      return ".ico";
  }
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function tryDownload(hostname, protocols) {
  if (hasLocalIcon(hostname)) {
    return "exists";
  }
  const hostVariants = new Set([hostname]);
  if (!hostname.startsWith("www.")) {
    hostVariants.add(`www.${hostname}`);
  }
  const orderedProtocols = ["https:", ...protocols, "http:"].filter((value, index, array) => array.indexOf(value) === index);

  for (const protocol of orderedProtocols) {
    for (const variant of hostVariants) {
      for (const iconPath of ICON_PATHS) {
        const url = `${protocol}//${variant}${iconPath}`;
        try {
          const res = await fetchWithTimeout(url);
          if (!res.ok) continue;
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.startsWith("image/")) continue;
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const ext = extensionFromContentType(contentType);
          const safe = sanitizeHost(hostname);
          const filePath = path.join(outputDir, `${safe}${ext}`);
          fs.writeFileSync(filePath, buffer);
          console.log(`✓ Saved ${hostname} (${contentType})`);
          return "downloaded";
        } catch {
          // ignore fetch errors and continue
        }
      }
    }
  }
  console.warn(`⚠️  Failed to fetch favicon for ${hostname}`);
  return "failed";
}

async function main() {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch API is required (Node 18+).");
  }

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [hostname, meta] of hosts.entries()) {
    const status = await tryDownload(hostname, Array.from(meta.protocols));
    if (status === "downloaded") downloaded += 1;
    else if (status === "exists") skipped += 1;
    else failed += 1;
  }

  console.log(`\nSummary: downloaded ${downloaded}, skipped ${skipped}, failed ${failed}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
