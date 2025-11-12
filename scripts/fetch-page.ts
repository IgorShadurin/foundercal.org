#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { load } from "cheerio";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npm run fetch-page <url>");
    process.exit(1);
  }

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const html = await response.text();
  const outputDir = path.join(process.cwd(), "tmp", "pages");
  fs.mkdirSync(outputDir, { recursive: true });

  const safeName = url
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  const timestamp = Date.now();
  const htmlPath = path.join(outputDir, `${safeName}-${timestamp}.html`);
  const textPath = path.join(outputDir, `${safeName}-${timestamp}.txt`);

  fs.writeFileSync(htmlPath, html, "utf-8");

  const $ = load(html);
  $("script,style,noscript").remove();
  const text = $("body").text().replace(/\s+/g, " ").trim();
  fs.writeFileSync(textPath, text, "utf-8");

  console.log(JSON.stringify({
    url,
    htmlPath,
    textPath,
    preview: text.slice(0, 400)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
