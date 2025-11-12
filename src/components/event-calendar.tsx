"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  addDays,
  compareAsc,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
} from "date-fns";
import {
  CalendarRange,
  Clock3,
  ExternalLink,
  Filter,
  FilterX,
  Link as LinkIcon,
  Github,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventRecord, Taxonomies } from "@/lib/event-data";

const TIMELINE_KEYS = [
  "application_close",
  "program_start",
  "program_end",
  "demo_day",
] as const;

const DATE_LABELS: Record<TimelineKey, string> = {
  application_close: "Applications close",
  program_start: "Program kicks off",
  program_end: "Program wraps",
  demo_day: "Demo Day",
};

const VIEW_MODES = {
  deadlines: {
    label: "Application focus",
    priority: [
      "application_close",
      "program_start",
      "program_end",
      "demo_day",
    ] as TimelineKey[],
  },
  programs: {
    label: "Program focus",
    priority: [
      "program_start",
      "application_close",
      "program_end",
      "demo_day",
    ] as TimelineKey[],
  },
} as const;

type TimelineKey = (typeof TIMELINE_KEYS)[number];
type ViewMode = keyof typeof VIEW_MODES;

const HERO_ICON = {
  src: "/android-chrome-192x192.png",
  alt: "FounderCal icon",
};

type NormalizedEvent = {
  record: EventRecord;
  parsedDates: Partial<Record<TimelineKey, Date>>;
  locationLabel: string;
  regionCode: string;
  searchIndex: string;
};

type EventCalendarProps = {
  events: EventRecord[];
  taxonomies: Taxonomies;
};

export function EventCalendar({ events, taxonomies }: EventCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("deadlines");
  const [regionFilter, setRegionFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [windowStart, setWindowStart] = useState(() => startOfDay(new Date()));
  const [restrictToWindow, setRestrictToWindow] = useState(true);
  const today = startOfDay(new Date());

  const normalized = useMemo(() => normalizeEvents(events), [events]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return normalized.filter((entry) => {
      const matchesRegion =
        regionFilter === "all" || entry.regionCode === regionFilter;
      const matchesSector =
        sectorFilter === "all" ||
        entry.record.categories.sectors.includes(sectorFilter);
      const matchesType =
        typeFilter === "all" || entry.record.categories.types.includes(typeFilter);
      const matchesSearch =
        query.length === 0 || entry.searchIndex.includes(query);

      return matchesRegion && matchesSector && matchesType && matchesSearch;
    });
  }, [normalized, regionFilter, sectorFilter, typeFilter, search]);

  const prioritized = useMemo(() => {
    const priority = VIEW_MODES[viewMode].priority;

    return filtered
      .map((entry) => ({
        ...entry,
        timeline: pickTimeline(entry, priority),
      }))
      .sort((a, b) => {
        if (!a.timeline && !b.timeline) return 0;
        if (!a.timeline) return 1;
        if (!b.timeline) return -1;
        return compareAsc(a.timeline.date, b.timeline.date);
      });
  }, [filtered, viewMode]);

  const windowRange = useMemo(() => {
    return { start: windowStart, end: addDays(windowStart, 30) };
  }, [windowStart]);

  const eventsInWindow = useMemo(() => {
    return prioritized.filter((entry) => {
      if (!entry.timeline) return false;
      return isWithinInterval(entry.timeline.date, windowRange);
    });
  }, [prioritized, windowRange]);

  const visibleEvents = restrictToWindow ? eventsInWindow : prioritized;

  const calendarDates = useMemo(() => {
    return prioritized
      .map((entry) => entry.timeline?.date)
      .filter(Boolean) as Date[];
  }, [prioritized]);

  const noResults = visibleEvents.length === 0;
  const filtersActive =
    regionFilter !== "all" ||
    sectorFilter !== "all" ||
    typeFilter !== "all" ||
    search.trim().length > 0 ||
    !restrictToWindow;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-dashed bg-gradient-to-br from-zinc-50 via-white to-zinc-100 p-8 dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <Image
              src={HERO_ICON.src}
              alt={HERO_ICON.alt}
              width={112}
              height={112}
              className="h-24 w-24 object-contain"
              priority
            />
            <div className="space-y-3">
              <p className="text-sm font-medium text-primary">FounderCal</p>
              <h1 className="text-3xl font-semibold sm:text-4xl">
                A single calendar for founders.
              </h1>
              <p className="text-base text-muted-foreground sm:text-lg">
                Tracks the accelerators, fellowships, and resource drops that quietly unlock funding so you never miss a door before it closes.
              </p>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border bg-white/70 px-8 py-6 text-center shadow-sm dark:bg-zinc-900/80">
            <div className="flex items-center justify-center gap-4">
              <span className="relative flex h-8 w-8 items-center justify-center">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2da6df]/40"
                  style={{ animationDuration: "3s" }}
                />
                <span className="inline-flex h-3 w-3 rounded-full bg-[#2da6df]" />
              </span>
              <p className="text-6xl font-black text-foreground">
                {eventsInWindow.length.toString().padStart(2, "0")}
              </p>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Live opportunities this month
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="size-4" /> Opportunity radar
            </CardTitle>
            <CardDescription>
              Pick a month to spotlight deadlines or broaden to the full pipeline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Calendar
              mode="single"
              month={windowStart}
              selected={windowStart}
              onSelect={(date) => date && setWindowStart(startOfDay(date))}
              onMonthChange={(date) => setWindowStart(startOfDay(date))}
              modifiers={{ hasEvent: calendarDates }}
              className="rounded-xl border"
            />
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWindowStart(today)}
                disabled={windowStart.getTime() === today.getTime()}
              >
                Jump to today
              </Button>
            </div>
            <Separator />
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total in view</span>
                <span className="font-medium">{visibleEvents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium">{prioritized.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[720px]">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-xl">Upcoming opportunities</CardTitle>
              <CardDescription>
                Filters stack so you can zero in on the right geography, sector, and stage.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
                  <TabsTrigger value="programs">Program starts</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Filter className="size-4" /> {visibleEvents.length} matches
                </span>
                {filtersActive ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setRegionFilter("all");
                      setSectorFilter("all");
                      setTypeFilter("all");
                      setSearch("");
                      setRestrictToWindow(true);
                    }}
                  >
                    <FilterX className="size-4" />
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, city, hashtag..."
                className="md:col-span-2 xl:col-span-2"
              />
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {taxonomies.regions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {formatLabel(region)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sectors</SelectItem>
                  {taxonomies.sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {formatLabel(sector)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Program type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {taxonomies.types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {noResults ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed">
                <p className="text-base font-medium">No matches yet</p>
                <p className="text-sm text-muted-foreground">
                  Try loosening a filter or switch to the full upcoming list.
                </p>
                <Button variant="secondary" onClick={() => setRestrictToWindow(false)}>
                  Show all upcoming
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleEvents.map((entry) => (
                  <EventCard key={entry.record.id} entry={entry} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <footer className="mt-10 flex flex-col gap-3 border-t border-dashed border-muted-foreground/40 pt-6 text-sm text-muted-foreground">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="https://github.com/IgorShadurin/foundercal.org"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 font-medium text-foreground transition hover:text-primary"
          >
            <Github className="size-4" />
            Source code on GitHub
          </a>
          <p>
            Ship a feature or add an event via <a
              href="https://github.com/IgorShadurin/foundercal.org/issues/new"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >GitHub</a>
            —collabs keep FounderCal sharp.
          </p>
        </div>
        <div className="text-xs text-muted-foreground/80">
          <p>
            Built by <a
              href="https://x.com/Web3Igor"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >@Web3Igor</a> -
             Inspired by <a
              href="https://x.com/nestymee/status/1988231483153321985"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >@nestymee</a>
          </p>
          <p className="mt-1">
            Want to create a viral video with AI? Visit <a
              href="https://yumcut.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >YumCut</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function EventCard({
  entry,
}: {
  entry: NormalizedEvent & {
    timeline: ReturnType<typeof pickTimeline>;
  };
}) {
  const { record, locationLabel, timeline } = entry;
  const primaryType = record.categories.types[0];
  const websiteUrl = withUtmSource(record.website);

  return (
    <Card className="border-muted bg-background/80 shadow-sm">
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 p-1 text-primary">
                    <LinkIcon className="size-3.5" />
                  </span>
                  {record.name}
                </a>
              ) : (
                record.name
              )}
            </CardTitle>
            <CardDescription>{record.description}</CardDescription>
          </div>
          {primaryType ? (
            <Badge variant="outline" className="self-start capitalize">
              {formatLabel(primaryType)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-primary">
            <Clock3 className="size-4" />
            {timeline
              ? `${DATE_LABELS[timeline.key]} · ${format(
                  timeline.date,
                  "MMM d, yyyy"
                )}`
              : "Timeline TBA"}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-4" />
            {locationLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {record.categories.sectors.slice(0, 3).map((sector) => (
            <Badge key={sector} variant="secondary" className="capitalize">
              {formatLabel(sector)}
            </Badge>
          ))}
          {record.categories.supports.slice(0, 2).map((support) => (
            <Badge key={support} variant="outline" className="capitalize">
              {formatLabel(support)}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {record.hashtags.map((tag) => (
            <Badge key={tag} variant="ghost">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {websiteUrl ? (
            <Button size="sm" asChild>
              <a href={websiteUrl} target="_blank" rel="noreferrer">
                Visit site <ExternalLink className="ml-1 size-3.5" />
              </a>
            </Button>
          ) : null}
          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline">
                Key dates
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-sm" align="start">
              <div className="space-y-2">
                {TIMELINE_KEYS.map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {DATE_LABELS[key]}
                    </span>
                    <span className="font-medium">
                      {entry.parsedDates[key]
                        ? format(entry.parsedDates[key]!, "MMM d, yyyy")
                        : "TBA"}
                    </span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}

function normalizeEvents(events: EventRecord[]): NormalizedEvent[] {
  return events.map((record) => {
    const parsedDates: Partial<Record<TimelineKey, Date>> = {};

    for (const key of TIMELINE_KEYS) {
      const parsed = safeParseDate(record.dates?.[key]);
      if (parsed) {
        parsedDates[key] = parsed;
      }
    }

    const city = record.location?.city;
    const country = record.location?.country_code;
    const locationLabel = city
      ? [city, country].filter(Boolean).join(", ")
      : formatLabel(record.location?.region_code ?? "global");

    const regionCode = (record.location?.region_code ?? record.index?.region_code ?? "global").toLowerCase();

    const searchIndex = [
      record.name,
      record.description,
      locationLabel,
      record.categories.sectors.join(" "),
      record.categories.types.join(" "),
      record.categories.supports.join(" "),
      record.hashtags.join(" "),
    ]
      .map((chunk) => chunk?.toLowerCase() ?? "")
      .join(" ");

    return {
      record,
      parsedDates,
      locationLabel,
      regionCode,
      searchIndex,
    } satisfies NormalizedEvent;
  });
}

function pickTimeline(
  entry: NormalizedEvent,
  priority: TimelineKey[]
) {
  for (const key of priority) {
    const date = entry.parsedDates[key];
    if (date) {
      return { key, date } as const;
    }
  }
  return null;
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "TBA";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function safeParseDate(value?: string | null) {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function withUtmSource(url?: string | null) {
  if (!url) return null;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}utm_source=foundercal.org`;
}
