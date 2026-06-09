#!/usr/bin/env tsx
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

type Command = "list" | "research" | "merge" | "run" | "validate";
type ResearchStatus = "verified" | "needs_review" | "inactive" | "not_found";
type Confidence = "high" | "medium" | "low";

type CsvAccelerator = {
  accelerator: string;
  website: string;
  checked_at: string;
  csvFile: string;
  slug: string;
  sourceType: "csv" | "imported";
  applyUrl?: string;
  sourceContext?: Record<string, string | null | undefined>;
};

type EventDataset = {
  taxonomies: {
    regions: string[];
    types: string[];
    supports: string[];
    sectors: string[];
  };
  events: EventRecord[];
};

type EventRecord = {
  id: string;
  name: string;
  description: string;
  organizer: string | null;
  website: string | null;
  location: {
    is_virtual: boolean;
    is_hybrid: boolean;
    venue: string | null;
    city: string | null;
    city_slug: string | null;
    country: string | null;
    country_code: string | null;
    region_code: string | null;
  };
  dates: {
    application_open: string | null;
    application_close: string | null;
    program_start: string | null;
    program_end: string | null;
    demo_day: string | null;
    timezone: string | null;
    date_range_text: string | null;
  };
  categories: {
    types: string[];
    supports: string[];
    sectors: string[];
  };
  hashtags: string[];
  index: {
    years: string[];
    region_code: string | null;
    country_code: string | null;
    city_slug: string | null;
    type_keys: string[];
    support_keys: string[];
    sector_keys: string[];
    date_sort_key: string | null;
  };
  verification: string | null;
  last_verified_utc: string | null;
};

type AgentResult = {
  accelerator: {
    name: string;
    website: string | null;
    csv_file: string;
    slug: string;
  };
  status: ResearchStatus;
  checked_at: string;
  confidence: Confidence;
  summary: string;
  proposed_event: EventRecord | null;
  sources: Array<{
    title: string;
    url: string;
    publisher: string | null;
    accessed_at: string;
    supports: string;
  }>;
  notes: string[];
};

type Options = {
  command: Command;
  csvFiles: string[];
  outputDir: string;
  inputDir: string;
  model: string;
  reasoning: string;
  runner: "auto" | "codex-proxy" | "codex";
  slugs: string[];
  includeImported: boolean;
  parallel: number;
  limit: number;
  includeChecked: boolean;
  force: boolean;
  dryRun: boolean;
  mergeStatuses: ResearchStatus[];
  agentTimeoutMs: number;
};

const PROJECT_ROOT = process.cwd();
const EVENTS_PATH = path.join(PROJECT_ROOT, "public", "events.json");
const SCHEMA_PATH = path.join(PROJECT_ROOT, "scripts", "schemas", "accelerator-agent.schema.json");
const DEFAULT_CSV_FILES = ["data/accelerators-master.csv", "data/accelerators-crypto.csv"];
const IMPORTED_ACCELERATORS_FILE = "src/data/imported-accelerators.json";
const DEFAULT_OUTPUT_DIR = "data/accelerator-research";
const DEFAULT_MODEL = "gpt-5.5";
const DEFAULT_REASONING = "medium";
const MAX_PARALLEL = 20;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.command === "list") {
    listAccelerators(options);
    return;
  }

  if (options.command === "validate") {
    const findings = loadFindings(options);
    const dataset = loadDataset();
    const result = validateFindings(findings, dataset);
    printValidation(result);
    if (result.errors.length > 0) {
      process.exit(1);
    }
    return;
  }

  if (options.command === "research" || options.command === "run") {
    await researchAccelerators(options);
  }

  if (options.command === "merge" || options.command === "run") {
    mergeFindings(options);
  }
}

function parseArgs(argv: string[]): Options {
  const first = argv[0];
  const command: Command =
    first === "list" || first === "research" || first === "merge" || first === "run" || first === "validate"
      ? first
      : "research";
  const args = command === first ? argv.slice(1) : argv;
  const options: Options = {
    command,
    csvFiles: [...DEFAULT_CSV_FILES],
    outputDir: DEFAULT_OUTPUT_DIR,
    inputDir: DEFAULT_OUTPUT_DIR,
    model: DEFAULT_MODEL,
    reasoning: DEFAULT_REASONING,
    runner: "auto",
    slugs: [],
    includeImported: false,
    parallel: 1,
    limit: 0,
    includeChecked: false,
    force: false,
    dryRun: false,
    mergeStatuses: ["verified", "needs_review"],
    agentTimeoutMs: 20 * 60 * 1000,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--csv") {
      options.csvFiles = [requiredValue(args, ++index, arg)];
      continue;
    }
    if (arg === "--add-csv") {
      options.csvFiles.push(requiredValue(args, ++index, arg));
      continue;
    }
    if (arg === "--output-dir") {
      options.outputDir = requiredValue(args, ++index, arg);
      if (options.inputDir === DEFAULT_OUTPUT_DIR) {
        options.inputDir = options.outputDir;
      }
      continue;
    }
    if (arg === "--input-dir") {
      options.inputDir = requiredValue(args, ++index, arg);
      continue;
    }
    if (arg === "--model") {
      options.model = requiredValue(args, ++index, arg);
      continue;
    }
    if (arg === "--reasoning") {
      options.reasoning = requiredValue(args, ++index, arg);
      continue;
    }
    if (arg === "--runner") {
      const runner = requiredValue(args, ++index, arg);
      if (runner !== "auto" && runner !== "codex-proxy" && runner !== "codex") {
        throw new Error(`Unknown runner: ${runner}`);
      }
      options.runner = runner;
      continue;
    }
    if (arg === "--slug") {
      options.slugs.push(slugify(requiredValue(args, ++index, arg)));
      continue;
    }
    if (arg === "--parallel") {
      options.parallel = clamp(Number(requiredValue(args, ++index, arg)), 1, MAX_PARALLEL, 1);
      continue;
    }
    if (arg === "--limit") {
      options.limit = clamp(Number(requiredValue(args, ++index, arg)), 0, 10_000, 0);
      continue;
    }
    if (arg === "--agent-timeout-ms") {
      options.agentTimeoutMs = clamp(Number(requiredValue(args, ++index, arg)), 60_000, 60 * 60 * 1000, options.agentTimeoutMs);
      continue;
    }
    if (arg === "--include-checked") {
      options.includeChecked = true;
      continue;
    }
    if (arg === "--include-imported") {
      options.includeImported = true;
      continue;
    }
    if (arg === "--all") {
      options.includeChecked = true;
      options.includeImported = true;
      continue;
    }
    if (arg === "--force") {
      options.force = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--merge-status") {
      const value = requiredValue(args, ++index, arg) as ResearchStatus;
      if (!["verified", "needs_review", "inactive", "not_found"].includes(value)) {
        throw new Error(`Unknown merge status: ${value}`);
      }
      options.mergeStatuses = [value];
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function requiredValue(args: string[], index: number, flag: string) {
  const value = args[index];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function printHelp() {
  console.log(
    [
      "Usage: npm run accelerator-agents -- <command> [options]",
      "",
      "Commands:",
      "  list       Show accelerators selected from configured sources.",
      "  research   Run one Codex worker per selected accelerator. Default command.",
      "  merge      Merge JSON files into public/events.json and CSV checked_at values.",
      "  run        Research then merge.",
      "  validate   Validate JSON files without writing site data.",
      "",
      "Options:",
      "  --csv <path>             Replace the CSV list with one file.",
      "  --add-csv <path>         Add another CSV file.",
      "  --include-checked      Include CSV rows that already have checked_at.",
      "  --include-imported     Include src/data/imported-accelerators.json records.",
      "  --all                  Include checked CSV rows and imported records.",
      "  --limit <n>              Limit selected accelerators. Default 0 means no limit.",
      "  --parallel <n>           Number of Codex workers. Default 1, max 20.",
      "  --model <name>           Codex model. Default gpt-5.5.",
      "  --reasoning <effort>     model_reasoning_effort. Default medium.",
      "  --runner <name>          auto, codex-proxy, or codex. Default auto.",
      "  --slug <slug>            Select one accelerator slug. Repeatable.",
      "  --output-dir <path>      Worker JSON directory. Default data/accelerator-research.",
      "  --input-dir <path>       Merge/validate JSON directory. Default data/accelerator-research.",
      "  --force                  Re-run workers even when output JSON already exists.",
      "  --dry-run                Print intended work without spawning workers or writing merges.",
      "  --agent-timeout-ms <n>   Per-worker timeout. Default 1200000.",
    ].join("\n"),
  );
}

function listAccelerators(options: Options) {
  const selected = selectAccelerators(options);
  selected.forEach((record, index) => {
    console.log(
      `${index + 1}. ${record.accelerator} | ${record.website || record.applyUrl || "no website"} | ${record.csvFile} | source=${record.sourceType} | checked_at=${record.checked_at || "-"}`,
    );
  });
  console.log(`Selected ${selected.length} accelerator(s).`);
}

async function researchAccelerators(options: Options) {
  const selected = selectAccelerators(options);
  const outputDir = path.resolve(PROJECT_ROOT, options.outputDir);
  const logsDir = path.join(outputDir, "_logs");
  const runner = resolveRunner(options.runner);

  if (selected.length === 0) {
    console.log("No accelerators selected.");
    return;
  }

  console.log(
    `Selected ${selected.length} accelerator(s); runner=${runner}; model=${options.model}; reasoning=${options.reasoning}; parallel=${options.parallel}.`,
  );

  if (options.dryRun) {
    selected.forEach((record) => {
      console.log(`dry-run: ${record.accelerator} -> ${path.join(outputDir, `${record.slug}.json`)}`);
    });
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  let cursor = 0;
  let completed = 0;
  const failures: string[] = [];
  const workers = Array.from({ length: Math.min(options.parallel, selected.length) }, async () => {
    while (cursor < selected.length) {
      const record = selected[cursor++];
      const outputPath = path.join(outputDir, `${record.slug}.json`);
      const logPath = path.join(logsDir, `${record.slug}.log`);

      if (!options.force && fs.existsSync(outputPath)) {
        completed += 1;
        console.log(`skip existing ${record.slug} (${completed}/${selected.length})`);
        continue;
      }

      try {
        await runCodexWorker({ record, outputPath, logPath, runner, options });
        completed += 1;
        console.log(`done ${record.slug} (${completed}/${selected.length})`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${record.slug}: ${message}`);
        completed += 1;
        console.error(`failed ${record.slug} (${completed}/${selected.length}): ${message}`);
      }
    }
  });

  await Promise.all(workers);
  if (failures.length > 0) {
    console.error("Research failures:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  }
}

function runCodexWorker(params: {
  record: CsvAccelerator;
  outputPath: string;
  logPath: string;
  runner: "codex-proxy" | "codex";
  options: Options;
}) {
  return new Promise<void>((resolve, reject) => {
    const command = [
      "source ~/.zshrc >/dev/null 2>&1;",
      params.runner,
      "exec",
      `-C ${quote(PROJECT_ROOT)}`,
      `-m ${quote(params.options.model)}`,
      `-c model_reasoning_effort=\\\"${params.options.reasoning}\\\"`,
      `--output-schema ${quote(SCHEMA_PATH)}`,
      `-o ${quote(params.outputPath)}`,
      "-",
    ].join(" ");
    const child = spawn("zsh", ["-lc", command], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const logStream = fs.createWriteStream(params.logPath, { flags: "a" });
    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      logStream.write(`[${new Date().toISOString()}] timeout after ${params.options.agentTimeoutMs}ms\n`);
      if (child.pid) {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {
          child.kill("SIGTERM");
        }
        setTimeout(() => {
          if (!settled && child.pid) {
            try {
              process.kill(-child.pid, "SIGKILL");
            } catch {
              child.kill("SIGKILL");
            }
          }
        }, 5000).unref();
      }
    }, params.options.agentTimeoutMs);
    timeout.unref();

    logStream.write(`[${new Date().toISOString()}] ${params.record.slug} start\n`);
    logStream.write(`[command] ${command.replace(/ -$/, " -")}\n`);
    child.stdout.pipe(logStream, { end: false });
    child.stderr.pipe(logStream, { end: false });
    child.stdin.end(buildAgentPrompt(params.record));

    child.once("error", (error) => {
      settled = true;
      clearTimeout(timeout);
      logStream.end(`[${new Date().toISOString()}] error: ${error.message}\n`);
      reject(error);
    });
    child.once("close", (code) => {
      settled = true;
      clearTimeout(timeout);
      logStream.end(`[${new Date().toISOString()}] exit ${code}\n`);
      if (code === 0) {
        resolve();
      } else if (code === null) {
        reject(new Error(`Codex worker timed out. See ${params.logPath}`));
      } else {
        reject(new Error(`Codex worker exited with ${code}. See ${params.logPath}`));
      }
    });
  });
}

function buildAgentPrompt(record: CsvAccelerator) {
  const dataset = loadDataset();
  const existingEvents = dataset.events
    .filter((event) => {
      const haystack = `${event.id} ${event.name} ${event.website ?? ""}`.toLowerCase();
      return haystack.includes(record.slug.replace(/-/g, " ")) || haystack.includes(record.accelerator.toLowerCase());
    })
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  return [
    "You are a FounderCal accelerator verification worker.",
    "",
    "Goal: research the named accelerator using current public information and return exactly one JSON object matching the provided output schema. Do not edit repository files.",
    "",
    "Research requirements:",
    "- Prefer authoritative sources: the official accelerator site, official application page, official FAQ/blog, or organizer pages.",
    "- Use curl, r.jina.ai/http://r.jina.ai/http:// only as needed, and normal web search only when official pages do not expose dates clearly.",
    "- Today is " + today + ". Treat dates before today as past and avoid presenting stale application windows as current unless the event record name explicitly describes a past cohort.",
    "- If exact dates are not published, use null for the unknown date fields and summarize cadence in dates.date_range_text.",
    "- Do not fabricate application deadlines, funding amounts, batch dates, locations, demo days, or organizer names.",
    "- Include at least one source for verified or needs_review results. Each source.supports field should state the exact facts it supports.",
    "- Never return status needs_review with an empty sources array. If current dates are not visible, cite the official page or attempted official application page and explain that it did not publish current dates.",
    "- If you cannot complete live verification, keep researching with curl or r.jina.ai until you have at least one public source URL to cite.",
    "- If the program is inactive, not found, or has no current public application/cadence info, return proposed_event null and explain why in summary/notes.",
    "",
    "Event shaping requirements:",
    "- proposed_event must follow public/events.json structure.",
    "- Use taxonomy values only from the provided taxonomy lists.",
    "- Pick the closest sector values; use web3 for blockchain/crypto/on-chain programs.",
    "- Use ISO dates YYYY-MM-DD where known. Otherwise use null.",
    "- Set dates.timezone to an IANA timezone or common abbreviation only if the source states it.",
    "- Use a concise description, under 160 characters when possible.",
    "- Event id should be stable and lowercase-kebab-case. Include a cohort/year suffix if the source names a dated cohort; otherwise use the accelerator slug.",
    "- Set verification to reported for official/public source evidence, needs_review for uncertain but useful findings, inactive for inactive programs, or not_found.",
    "- Set last_verified_utc to null; the merge stage will stamp it.",
    "- Set index and hashtags if you can, but the merge stage will recompute them.",
    "",
    "Accelerator to verify:",
    JSON.stringify(
      {
        name: record.accelerator,
        website: record.website || null,
        apply_url: record.applyUrl || null,
        csv_file: record.csvFile,
        slug: record.slug,
        source_type: record.sourceType,
        source_context: record.sourceContext ?? null,
      },
      null,
      2,
    ),
    "",
    "Allowed taxonomies:",
    JSON.stringify(dataset.taxonomies, null, 2),
    "",
    "Possibly related existing events:",
    JSON.stringify(existingEvents, null, 2),
  ].join("\n");
}

function mergeFindings(options: Options) {
  const findings = loadFindings(options);
  const dataset = loadDataset();
  const validation = validateFindings(findings, dataset);
  printValidation(validation);

  if (validation.errors.length > 0) {
    throw new Error("Refusing to merge because validation failed.");
  }

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const selected = findings
    .filter((finding) => options.mergeStatuses.includes(finding.result.status) && finding.result.proposed_event)
    .sort(compareFindingPriority);

  const changedCsvRows = new Map<string, Set<string>>();
  for (const finding of findings) {
    const csvFile = normalizeRepoPath(finding.result.accelerator.csv_file);
    if (!csvFile.endsWith(".csv")) {
      continue;
    }
    if (!changedCsvRows.has(csvFile)) {
      changedCsvRows.set(csvFile, new Set());
    }
    changedCsvRows.get(csvFile)?.add(finding.result.accelerator.name);
  }

  const nextEvents = [...dataset.events];
  const eventIndexes = new Map<string, number>();
  nextEvents.forEach((event, index) => eventIndexes.set(event.id, index));
  const selectedEventKeys = new Set<string>();
  const upserted: string[] = [];
  for (const finding of selected) {
    const event = normalizeEvent(finding.result.proposed_event as EventRecord, dataset, finding.result, now);
    const duplicateKey = eventDedupeKeys(event).find((key) => selectedEventKeys.has(key));
    if (duplicateKey) {
      console.warn(`warning: skipping duplicate proposed event ${event.id} from ${finding.filePath} (${duplicateKey})`);
      continue;
    }
    eventDedupeKeys(event).forEach((key) => selectedEventKeys.add(key));
    const existingIndex = eventIndexes.get(event.id);
    if (typeof existingIndex === "number") {
      nextEvents[existingIndex] = event;
    } else {
      eventIndexes.set(event.id, nextEvents.length);
      nextEvents.push(event);
    }
    upserted.push(`${event.id} (${finding.filePath})`);
  }

  if (options.dryRun) {
    console.log(`dry-run: would upsert ${upserted.length} event(s):`);
    upserted.forEach((item) => console.log(`- ${item}`));
    changedCsvRows.forEach((names, csvFile) => {
      console.log(`dry-run: would mark ${names.size} row(s) checked in ${csvFile}`);
    });
    return;
  }

  if (upserted.length > 0) {
    const nextDataset: EventDataset = {
      ...dataset,
      events: nextEvents,
    };
    fs.writeFileSync(EVENTS_PATH, `${stringifyJson(nextDataset)}\n`, "utf-8");
  }
  updateCsvCheckedAt(changedCsvRows, now.slice(0, 10));
  const checkedRows = Array.from(changedCsvRows.values()).reduce((sum, names) => sum + names.size, 0);
  console.log(`Upserted ${upserted.length} event(s) and marked ${checkedRows} CSV row(s) checked.`);
}

function normalizeEvent(event: EventRecord, dataset: EventDataset, finding: AgentResult, verifiedAt: string): EventRecord {
  const taxonomies = dataset.taxonomies;
  const types = filterTaxonomy(event.categories?.types, taxonomies.types, ["accelerator"]);
  const supports = filterTaxonomy(event.categories?.supports, taxonomies.supports, ["mentorship"]);
  const sectors = filterTaxonomy(event.categories?.sectors, taxonomies.sectors, ["general"]);
  const city = nullIfBlank(event.location?.city);
  const citySlug = nullIfBlank(event.location?.city_slug) ?? (city ? slugify(city) : null);
  const region = filterOne(event.location?.region_code, taxonomies.regions);
  const countryCode = normalizeCountryCode(event.location?.country_code);
  const dates = {
    application_open: normalizeDate(event.dates?.application_open),
    application_close: normalizeDate(event.dates?.application_close),
    program_start: normalizeDate(event.dates?.program_start),
    program_end: normalizeDate(event.dates?.program_end),
    demo_day: normalizeDate(event.dates?.demo_day),
    timezone: nullIfBlank(event.dates?.timezone),
    date_range_text: nullIfBlank(event.dates?.date_range_text),
  };
  const dateSortKey =
    dates.application_close ?? dates.program_start ?? dates.application_open ?? dates.demo_day ?? dates.program_end;
  const years = collectYears(dates);
  const location = {
    is_virtual: Boolean(event.location?.is_virtual),
    is_hybrid: Boolean(event.location?.is_hybrid),
    venue: nullIfBlank(event.location?.venue),
    city,
    city_slug: citySlug,
    country: nullIfBlank(event.location?.country),
    country_code: countryCode,
    region_code: region,
  };

  return {
    id: slugify(event.id || finding.accelerator.slug),
    name: event.name.trim(),
    description: event.description.trim(),
    organizer: nullIfBlank(event.organizer),
    website: nullIfBlank(event.website) ?? finding.accelerator.website,
    location,
    dates,
    categories: { types, supports, sectors },
    hashtags: buildHashtags({ location, sectors, supports }),
    index: {
      years,
      region_code: location.region_code,
      country_code: location.country_code,
      city_slug: location.city_slug,
      type_keys: types,
      support_keys: supports,
      sector_keys: sectors,
      date_sort_key: dateSortKey,
    },
    verification: finding.status === "verified" ? "reported" : finding.status,
    last_verified_utc: verifiedAt,
  };
}

function validateFindings(findings: Array<{ filePath: string; result: AgentResult }>, dataset: EventDataset) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  for (const { filePath, result } of findings) {
    if (!result.accelerator?.name) errors.push(`${filePath}: missing accelerator.name`);
    if (!DATE_RE.test(result.checked_at)) errors.push(`${filePath}: checked_at must be YYYY-MM-DD`);
    if (!["verified", "needs_review", "inactive", "not_found"].includes(result.status)) {
      errors.push(`${filePath}: invalid status ${String(result.status)}`);
    }
    if (result.status === "verified" && !result.proposed_event) {
      errors.push(`${filePath}: verified result must include proposed_event`);
    }
    if ((result.status === "verified" || result.status === "needs_review") && result.sources.length === 0) {
      errors.push(`${filePath}: ${result.status} result must include sources`);
    }
    if (!result.proposed_event) {
      continue;
    }

    const event = result.proposed_event;
    const id = slugify(event.id || result.accelerator.slug);
    if (seenIds.has(id)) {
      warnings.push(`${filePath}: duplicate proposed event id ${id}; merge will use the first finding only`);
    }
    seenIds.add(id);

    for (const [field, value] of Object.entries(event.dates)) {
      if (value !== null && field !== "timezone" && field !== "date_range_text" && !DATE_RE.test(String(value))) {
        errors.push(`${filePath}: dates.${field} must be YYYY-MM-DD or null`);
      }
    }
    warnUnknownTaxonomy(filePath, "types", event.categories.types, dataset.taxonomies.types, warnings);
    warnUnknownTaxonomy(filePath, "supports", event.categories.supports, dataset.taxonomies.supports, warnings);
    warnUnknownTaxonomy(filePath, "sectors", event.categories.sectors, dataset.taxonomies.sectors, warnings);
    if (event.location.region_code && !dataset.taxonomies.regions.includes(event.location.region_code)) {
      warnings.push(`${filePath}: unknown region_code ${event.location.region_code}; merge will set null`);
    }
  }

  return { errors, warnings, count: findings.length };
}

function printValidation(result: { errors: string[]; warnings: string[]; count: number }) {
  console.log(`Validated ${result.count} finding file(s).`);
  result.warnings.forEach((warning) => console.warn(`warning: ${warning}`));
  result.errors.forEach((error) => console.error(`error: ${error}`));
}

function compareFindingPriority(
  a: { filePath: string; result: AgentResult },
  b: { filePath: string; result: AgentResult },
) {
  const confidenceRank: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };
  const score = (finding: { result: AgentResult }) => {
    const sourceScore = finding.result.accelerator.csv_file.endsWith(".csv") ? 10 : 0;
    return confidenceRank[finding.result.confidence] * 100 + sourceScore + finding.result.sources.length;
  };
  const diff = score(b) - score(a);
  return diff || a.filePath.localeCompare(b.filePath);
}

function eventDedupeKeys(event: EventRecord) {
  const keys = [`id:${event.id}`];
  const normalizedUrl = normalizeUrlKey(event.website);
  if (normalizedUrl) {
    keys.push(`name-url:${slugify(event.name)}|${normalizedUrl}`);
  }
  const host = normalizedUrl?.split("/")[0] ?? null;
  const dateKey = [
    event.dates.application_close,
    event.dates.program_start,
    event.dates.application_open,
    event.dates.demo_day,
  ]
    .filter(Boolean)
    .join("|");
  if (host && dateKey) {
    keys.push(`host-dates:${host}|${dateKey}`);
  }
  return keys;
}

function normalizeUrlKey(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.hostname.toLowerCase().replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}`.replace(/\/$/, "");
  } catch {
    return slugify(value);
  }
}

function warnUnknownTaxonomy(
  filePath: string,
  field: string,
  values: string[],
  allowed: string[],
  warnings: string[],
) {
  values.forEach((value) => {
    if (!allowed.includes(value)) {
      warnings.push(`${filePath}: unknown ${field} value ${value}; merge will drop it`);
    }
  });
}

function loadFindings(options: Options) {
  const inputDir = path.resolve(PROJECT_ROOT, options.inputDir);
  if (!fs.existsSync(inputDir)) {
    return [] as Array<{ filePath: string; result: AgentResult }>;
  }
  return fs
    .readdirSync(inputDir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => {
      const filePath = path.join(inputDir, fileName);
      return {
        filePath: normalizeRepoPath(filePath),
        result: JSON.parse(fs.readFileSync(filePath, "utf-8")) as AgentResult,
      };
    });
}

function loadDataset(): EventDataset {
  return JSON.parse(fs.readFileSync(EVENTS_PATH, "utf-8")) as EventDataset;
}

function selectAccelerators(options: Options) {
  const existingOutput = new Set<string>();
  const outputDir = path.resolve(PROJECT_ROOT, options.outputDir);
  if (fs.existsSync(outputDir)) {
    fs.readdirSync(outputDir)
      .filter((fileName) => fileName.endsWith(".json"))
      .forEach((fileName) => existingOutput.add(fileName.replace(/\.json$/, "")));
  }

  let rows = options.csvFiles.flatMap((csvFile) => parseCsv(csvFile));
  if (options.includeImported) {
    rows.push(...parseImportedAccelerators(IMPORTED_ACCELERATORS_FILE));
  }
  rows = dedupeAccelerators(rows);
  if (!options.includeChecked) {
    rows = rows.filter((row) => row.sourceType === "imported" || !row.checked_at.trim());
  }
  if (!options.force) {
    rows = rows.filter((row) => !existingOutput.has(row.slug));
  }
  if (options.slugs.length > 0) {
    const selectedSlugs = new Set(options.slugs);
    rows = rows.filter((row) => selectedSlugs.has(row.slug));
  }
  if (options.limit > 0) {
    rows = rows.slice(0, options.limit);
  }
  return rows;
}

function parseCsv(csvFile: string): CsvAccelerator[] {
  const fullPath = path.resolve(PROJECT_ROOT, csvFile);
  const raw = fs.readFileSync(fullPath, "utf-8").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0]).map((header) => header.replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });
    const accelerator = record.accelerator || "Untitled";
    return {
      accelerator,
      website: record.website || "",
      checked_at: record.checked_at || "",
      csvFile: normalizeRepoPath(csvFile),
      slug: slugify(accelerator),
      sourceType: "csv",
    };
  });
}

function parseImportedAccelerators(filePath: string): CsvAccelerator[] {
  const fullPath = path.resolve(PROJECT_ROOT, filePath);
  if (!fs.existsSync(fullPath)) return [];
  const records = JSON.parse(fs.readFileSync(fullPath, "utf-8")) as Array<{
    name?: string;
    website?: string | null;
    applyUrl?: string | null;
    description?: string | null;
    terms?: string | null;
    notes?: string | null;
  }>;
  return records
    .filter((record) => record.name)
    .map((record) => ({
      accelerator: record.name as string,
      website: record.website ?? record.applyUrl ?? "",
      applyUrl: record.applyUrl ?? undefined,
      checked_at: "",
      csvFile: normalizeRepoPath(filePath),
      slug: slugify(record.name as string),
      sourceType: "imported",
      sourceContext: {
        description: record.description,
        terms: record.terms,
        notes: record.notes,
      },
    }));
}

function dedupeAccelerators(rows: CsvAccelerator[]) {
  const bySlug = new Map<string, CsvAccelerator>();
  for (const row of rows) {
    const existing = bySlug.get(row.slug);
    if (!existing) {
      bySlug.set(row.slug, { ...row });
      continue;
    }
    existing.applyUrl = existing.applyUrl || row.applyUrl;
    existing.website = existing.website || row.website;
    existing.sourceContext = {
      ...(row.sourceContext ?? {}),
      ...(existing.sourceContext ?? {}),
    };
  }
  return Array.from(bySlug.values());
}

function updateCsvCheckedAt(changedRows: Map<string, Set<string>>, checkedAt: string) {
  changedRows.forEach((names, csvFile) => {
    const fullPath = path.resolve(PROJECT_ROOT, csvFile);
    const raw = fs.readFileSync(fullPath, "utf-8").trim();
    if (!raw) return;
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const headers = splitCsvLine(lines[0]).map((header) => header.replace(/"/g, ""));
    const checkedIndex = headers.indexOf("checked_at");
    const acceleratorIndex = headers.indexOf("accelerator");
    if (checkedIndex === -1 || acceleratorIndex === -1) {
      throw new Error(`${csvFile} must include accelerator and checked_at columns`);
    }

    const nextRows = [headers, ...lines.slice(1).map(splitCsvLine)];
    for (const row of nextRows.slice(1)) {
      if (names.has(row[acceleratorIndex])) {
        row[checkedIndex] = checkedAt;
      }
    }
    fs.writeFileSync(fullPath, `${nextRows.map(formatCsvLine).join("\n")}\n`, "utf-8");
  });
}

function splitCsvLine(line: string) {
  let normalized = line.trim();
  if (normalized.startsWith("\"") && normalized.endsWith("\"")) {
    normalized = normalized.slice(1, -1);
  }
  return normalized.split(/","/).map((value) => value.replace(/""/g, "\"").trim());
}

function formatCsvLine(values: string[]) {
  return `"${values.map((value) => value.replace(/"/g, "\"\"")).join("\",\"")}"`;
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2).replace(/[^\x00-\x7F]/g, (character) =>
    Array.from(character)
      .map((codePoint) => {
        const value = codePoint.codePointAt(0) ?? 0;
        if (value <= 0xffff) {
          return `\\u${value.toString(16).padStart(4, "0")}`;
        }
        const adjusted = value - 0x10000;
        const high = 0xd800 + (adjusted >> 10);
        const low = 0xdc00 + (adjusted & 0x3ff);
        return `\\u${high.toString(16)}\\u${low.toString(16)}`;
      })
      .join(""),
  );
}

function resolveRunner(runner: Options["runner"]) {
  if (runner === "codex-proxy" || runner === "codex") {
    return runner;
  }
  if (commandExists("codex-proxy")) {
    return "codex-proxy";
  }
  if (commandExists("codex")) {
    return "codex";
  }
  throw new Error("Neither codex-proxy nor codex is available on PATH.");
}

function commandExists(command: string) {
  const result = spawnSync("zsh", ["-lc", `source ~/.zshrc >/dev/null 2>&1; command -v ${quote(command)} >/dev/null 2>&1`], {
    cwd: PROJECT_ROOT,
    stdio: "ignore",
  });
  return result.status === 0;
}

function filterTaxonomy(values: string[] | undefined, allowed: string[], fallback: string[]) {
  const filtered = unique((values ?? []).filter((value) => allowed.includes(value)));
  return filtered.length > 0 ? filtered : fallback;
}

function filterOne(value: string | null | undefined, allowed: string[]) {
  if (!value) return null;
  return allowed.includes(value) ? value : null;
}

function normalizeDate(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  return DATE_RE.test(trimmed) ? trimmed : null;
}

function normalizeCountryCode(value: string | null | undefined) {
  const trimmed = nullIfBlank(value);
  return trimmed ? trimmed.toUpperCase() : null;
}

function collectYears(dates: EventRecord["dates"]) {
  const years = new Set<string>();
  Object.entries(dates).forEach(([field, value]) => {
    if (field === "timezone" || field === "date_range_text" || !value) return;
    const year = value.slice(0, 4);
    if (/^\d{4}$/.test(year)) years.add(year);
  });
  return Array.from(years).sort();
}

function buildHashtags(params: {
  location: EventRecord["location"];
  sectors: string[];
  supports: string[];
}) {
  const tags = new Set<string>();
  if (params.location.country_code === "US") tags.add("#usa");
  else if (params.location.country) tags.add(`#${slugify(params.location.country).replace(/-/g, "")}`);
  if (params.location.city_slug) tags.add(`#${params.location.city_slug.replace(/-/g, "")}`);
  params.sectors.slice(0, 2).forEach((sector) => tags.add(`#${sector}`));
  params.supports.slice(0, 2).forEach((support) => tags.add(`#${support}`));
  return Array.from(tags);
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function nullIfBlank(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "accelerator";
}

function quote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function normalizeRepoPath(filePath: string) {
  const absolute = path.isAbsolute(filePath) ? filePath : path.resolve(PROJECT_ROOT, filePath);
  return path.relative(PROJECT_ROOT, absolute).replace(/\\/g, "/");
}

function clamp(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
