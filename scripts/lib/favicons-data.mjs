import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const notionPath = path.join(projectRoot, "src", "data", "imported-accelerators.json");
const csvPaths = [
  path.join(projectRoot, "data", "accelerators-master.csv"),
  path.join(projectRoot, "data", "accelerators-crypto.csv"),
];

export function collectWebsiteEntries() {
  const entries = [];

  if (fs.existsSync(notionPath)) {
    const data = JSON.parse(fs.readFileSync(notionPath, "utf-8"));
    data.forEach((record) => {
      if (record?.website) {
        entries.push({
          name: record.name ?? "Untitled",
          website: record.website,
          source: "notion",
        });
      }
    });
  }

  csvPaths.forEach((csvPath) => {
    if (!fs.existsSync(csvPath)) return;
    const records = parseCsv(csvPath);
    records.forEach((record) => {
      if (record.website) {
        entries.push({
          name: record.accelerator ?? record.website,
          website: record.website,
          source: path.basename(csvPath),
        });
      }
    });
  });

  return entries;
}

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

export function normalizePageUrl(raw) {
  if (!raw) return undefined;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function sanitizeHost(hostname) {
  return hostname.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

