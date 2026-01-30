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

const rawAccelerators = data as ImportedAccelerator[];

export const importedAccelerators: ImportedAcceleratorWithSlug[] = rawAccelerators.map((accelerator) => ({
  ...accelerator,
  slug: slugify(accelerator.name),
}));

export function getAcceleratorSlug(name: string) {
  return slugify(name);
}

export function getAcceleratorBySlug(slug: string) {
  return importedAccelerators.find((accelerator) => accelerator.slug === slug);
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

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "accelerator";
}
