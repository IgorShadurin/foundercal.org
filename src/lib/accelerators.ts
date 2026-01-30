import fs from "node:fs";
import path from "node:path";

import data from "@/data/imported-accelerators.json";

export type ImportedAccelerator = {
  name: string;
  website?: string | null;
  applyUrl?: string | null;
  description?: string | null;
  terms?: string | null;
  notes?: string | null;
};

export type ImportedAcceleratorWithSlug = ImportedAccelerator & {
  slug: string;
};

export type CsvAccelerator = {
  accelerator: string;
  website?: string;
  checked_at?: string;
  slug: string;
};

type DeadlineAccelerator = ImportedAccelerator & {
  slug: string;
};

const rawAccelerators = data as ImportedAccelerator[];

export const importedAccelerators: ImportedAcceleratorWithSlug[] = rawAccelerators.map((accelerator) => ({
  ...accelerator,
  slug: slugify(accelerator.name),
}));

const CSV_FILES = ["data/accelerators-master.csv", "data/accelerators-crypto.csv"];

const csvAccelerators: CsvAccelerator[] = CSV_FILES.flatMap((filePath) => loadCsvAccelerators(filePath));

export const deadlineAccelerators: DeadlineAccelerator[] = mergeAccelerators(importedAccelerators, csvAccelerators);

export function getAcceleratorSlug(name: string) {
  return slugify(name);
}

export function getAcceleratorBySlug(slug: string) {
  return deadlineAccelerators.find((accelerator) => accelerator.slug === slug);
}

export function loadCsvAccelerators(filePath: string): CsvAccelerator[] {
  const absolutePath = path.join(process.cwd(), filePath);
  let raw = "";
  try {
    raw = fs.readFileSync(absolutePath, "utf-8").trim();
  } catch {
    return [];
  }

  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header.replace(/"/g, "")] = values[index] ?? "";
    });
    const accelerator = record["accelerator"] ?? "Untitled";
    return {
      accelerator,
      website: record["website"] || undefined,
      checked_at: record["checked_at"] || undefined,
      slug: slugify(accelerator),
    };
  });
}

export function getDeadlineDetails(accelerator: ImportedAccelerator) {
  const candidates = [accelerator.notes, accelerator.terms, accelerator.description].filter(
    (value): value is string => Boolean(value && value.trim().length > 0)
  );
  const matches = new Set<string>();
  const keyword = /(deadline|applications?|apply|application|closing|close|open|due|decision|rolling)/i;

  for (const text of candidates) {
    if (keyword.test(text)) {
      matches.add(text.trim());
    }
  }

  return Array.from(matches);
}

function mergeAccelerators(
  imported: ImportedAcceleratorWithSlug[],
  csvRecords: CsvAccelerator[]
): DeadlineAccelerator[] {
  const merged = new Map<string, DeadlineAccelerator>();

  imported.forEach((accelerator) => {
    merged.set(accelerator.slug, { ...accelerator });
  });

  csvRecords.forEach((record) => {
    const existing = merged.get(record.slug);
    if (existing) {
      if (!existing.website && record.website) {
        existing.website = record.website;
      }
      return;
    }

    merged.set(record.slug, {
      name: record.accelerator,
      website: record.website,
      applyUrl: null,
      description: null,
      terms: null,
      notes: null,
      slug: record.slug,
    });
  });

  return Array.from(merged.values());
}

function splitCsvLine(line: string) {
  let normalized = line.trim();
  if (normalized.startsWith("\"") && normalized.endsWith("\"")) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.split(/","/).map((value) => value.replace(/""/g, "\"").trim());
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "accelerator";
}
