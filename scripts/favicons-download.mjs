#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

import { ensureDir, sanitizeHost } from "./lib/favicons-data.mjs";

const projectRoot = process.cwd();
const outputDir = path.join(projectRoot, "public", "favicons");
const manifestPath = path.join(projectRoot, "tmp", "favicons-manifest.json");
const overridesPath = path.join(projectRoot, "data", "favicon-overrides.json");
const ALLOWED_EXT = [".png", ".ico", ".jpg", ".jpeg", ".svg", ".webp"];

if (!fs.existsSync(manifestPath)) {
  console.error("Manifest not found. Run npm run favicons:scrape first.");
  process.exit(1);
}

ensureDir(outputDir);

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const entries = manifest.entries ?? [];
const overrides = fs.existsSync(overridesPath)
  ? JSON.parse(fs.readFileSync(overridesPath, "utf-8"))
  : {};

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const entry of entries) {
  const result = await downloadEntry(entry);
  entry.download = result;
  if (result.status === "success" || result.status === "updated") downloaded += 1;
  else if (result.status === "exists") skipped += 1;
  else failed += 1;
}

manifest.downloadedAt = new Date().toISOString();
manifest.summary = { downloaded, skipped, failed };
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Download summary: downloaded ${downloaded}, skipped ${skipped}, failed ${failed}`);

async function downloadEntry(entry) {
  if (!Array.isArray(entry.candidates)) {
    entry.candidates = [];
  }

  if (overrides[entry.hostname]) {
    entry.candidates.unshift({ url: overrides[entry.hostname], type: "override" });
  }

  if (entry.candidates.length === 0) {
    return { status: "no-candidates", checkedAt: new Date().toISOString() };
  }

  const safeHost = sanitizeHost(entry.hostname ?? "unknown");
  const existing = findExistingFile(safeHost);
  if (existing) {
    return {
      status: "exists",
      file: existing,
      checkedAt: new Date().toISOString(),
    };
  }

  for (const candidate of entry.candidates) {
    try {
      const response = await fetchWithTimeout(candidate.url, 15000);
      if (!response.ok) {
        continue;
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.startsWith("image/")) {
        continue;
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extension = pickExtension(candidate.url, contentType);
      const fileName = `${safeHost}${extension}`;
      const filePath = path.join(outputDir, fileName);
      fs.writeFileSync(filePath, buffer);
      return {
        status: existing ? "updated" : "success",
        file: fileName,
        url: candidate.url,
        source: candidate.type,
        contentType,
        checkedAt: new Date().toISOString(),
      };
    } catch {
      // continue trying other candidates
    }
  }

  return {
    status: "failed",
    checkedAt: new Date().toISOString(),
  };
}

function findExistingFile(safeHost) {
  for (const ext of ALLOWED_EXT) {
    const filePath = path.join(outputDir, `${safeHost}${ext}`);
    if (fs.existsSync(filePath)) {
      return path.basename(filePath);
    }
  }
  return null;
}

function pickExtension(url, contentType) {
  const fromContent = contentType.split(";")[0].trim();
  switch (fromContent) {
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
      return ".ico";
    default:
      break;
  }
  const parsed = new URL(url);
  const pathname = parsed.pathname.toLowerCase();
  const match = pathname.match(/\.(png|ico|jpg|jpeg|svg|webp)(?:\?|$)/);
  if (match) {
    return `.${match[1]}`;
  }
  return ".ico";
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "foundercal-favicon-downloader/1.0 (+https://foundercal.org)",
        Accept: "image/*",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}
