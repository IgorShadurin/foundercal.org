import fs from "node:fs";
import path from "node:path";

export type Taxonomies = {
  regions: string[];
  types: string[];
  supports: string[];
  sectors: string[];
};

export type EventCategories = {
  types: string[];
  supports: string[];
  sectors: string[];
};

export type EventDates = {
  application_open: string | null;
  application_close: string | null;
  program_start: string | null;
  program_end: string | null;
  demo_day: string | null;
  timezone: string | null;
  date_range_text: string | null;
};

export type EventLocation = {
  is_virtual: boolean;
  is_hybrid: boolean;
  venue: string | null;
  city: string | null;
  city_slug: string | null;
  country: string | null;
  country_code: string | null;
  region_code: string | null;
};

export type EventIndex = {
  years: string[];
  region_code: string | null;
  country_code: string | null;
  city_slug: string | null;
  type_keys: string[];
  support_keys: string[];
  sector_keys: string[];
  date_sort_key: string | null;
};

export type EventRecord = {
  id: string;
  name: string;
  description: string;
  organizer: string | null;
  website: string | null;
  location: EventLocation;
  dates: EventDates;
  categories: EventCategories;
  hashtags: string[];
  index: EventIndex;
  verification: string | null;
  last_verified_utc: string | null;
};

export type EventDataset = {
  taxonomies: Taxonomies;
  events: EventRecord[];
};

const EVENTS_FILE = path.join(process.cwd(), "public", "events.json");

export function loadEventDataset(): EventDataset {
  const raw = fs.readFileSync(EVENTS_FILE, "utf-8");
  const parsed = JSON.parse(raw) as EventDataset;
  return parsed;
}
