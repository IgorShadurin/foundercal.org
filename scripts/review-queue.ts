import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { programs } from "../src/lib/catalog";
import {
  applicationState,
  nextReviewDate,
  isReviewDue,
} from "../src/lib/program-model";
async function main() {
  const asOf = process.argv.find((arg) => arg.startsWith("--as-of="))?.slice(8);
  const now = asOf ? new Date(`${asOf}T12:00:00Z`) : new Date(),
    out = path.resolve("tmp/review");
  fs.mkdirSync(out, { recursive: true });
  const queue = programs
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      status: p.status,
      checked_at: p.checked_at,
      next_review_due: nextReviewDate(p, now),
      due: isReviewDue(p, now),
      application: applicationState(p, now),
      sources: p.sources.map((s) => s.url),
    }))
    .sort((a, b) => a.next_review_due.localeCompare(b.next_review_due));
  fs.writeFileSync(
    path.join(out, "review-queue.json"),
    JSON.stringify({ generated_at: now.toISOString(), queue }, null, 2) + "\n",
  );
  console.log(
    `${queue.filter((p) => p.due).length} of ${queue.length} programs are due for an evidence review. Queue: tmp/review/review-queue.json`,
  );
  if (process.argv.includes("--check-sources")) {
    type Check = {
      url: string;
      status: number | null;
      hash?: string;
      changed?: boolean;
      error?: string;
    };
    const priorPath = path.resolve("tmp/previous/source-checks.json");
    let previous: Check[] = [];
    try {
      previous = JSON.parse(fs.readFileSync(priorPath, "utf8")).checks;
    } catch {}
    const prior = new Map(previous.map((r) => [r.url, r]));
    const urls = [
      ...new Set(
        queue
          .filter((p) => p.due || process.argv.includes("--all"))
          .flatMap((p) => p.sources),
      ),
    ].slice(
      0,
      Math.min(
        120,
        Math.max(
          1,
          Number(
            process.argv.find((arg) => arg.startsWith("--limit="))?.slice(8) ??
              120,
          ),
        ),
      ),
    );
    const checks: Check[] = [];
    const worker = async () => {
      for (let url = urls.shift(); url; url = urls.shift()) {
        try {
          const r = await fetch(url, {
            signal: AbortSignal.timeout(15000),
            headers: {
              "User-Agent":
                "FounderCal source accessibility monitor (+https://foundercal.org/methodology)",
            },
          });
          let body = "";
          if (r.body) {
            const reader = r.body.getReader();
            let size = 0;
            while (true) {
              const part = await reader.read();
              if (part.done) break;
              size += part.value.length;
              if (size > 1000000) {
                await reader.cancel();
                break;
              }
              body += new TextDecoder().decode(part.value);
            }
          }
          const normalized = body
            .replace(/<script[\s\S]*?<\/script>/gi, "")
            .replace(/<style[\s\S]*?<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          const hash = createHash("sha256").update(normalized).digest("hex");
          checks.push({
            url,
            status: r.status,
            hash,
            changed: prior.has(url) ? prior.get(url)?.hash !== hash : undefined,
          });
        } catch (error) {
          checks.push({
            url,
            status: null,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    fs.writeFileSync(
      path.join(out, "source-checks.json"),
      JSON.stringify(
        {
          generated_at: now.toISOString(),
          note: "Accessibility/content changes only. Never proof of application availability.",
          checks,
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      `Checked ${checks.length} source URLs. ${checks.filter((r) => r.changed).length} changed; ${checks.filter((r) => !r.status || r.status >= 400).length} inaccessible. Evidence dates were not modified.`,
    );
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
