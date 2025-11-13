# Event Verification & Data Entry Playbook

This document is a reminder for “future us” on how to research accelerator programs, update `public/events.json`, and mark the corresponding CSV entry as checked.

## 1. Find The Next Accelerator To Verify
1. Identify the CSV you’re working from (e.g. `data/accelerators-master.csv` or `data/accelerators-crypto.csv`).
2. Search for the first row whose `checked_at` column is blank:
   ```bash
   python - <<'PY'
   import csv
   with open('data/accelerators-crypto.csv') as f:
       reader = csv.reader(f)
       header = next(reader)
       for row in reader:
           if len(row) < 3 or not row[2].strip():
               print(row)
               break
   PY
   ```
3. The first result is the “next” accelerator to process.

## 2. Gather Up-To-Date Program Info
1. Visit the accelerator’s website via `curl` or `r.jina.ai` (useful when the site is heavy or requires JS):
   ```bash
   curl -sL https://example.com/ | head
   curl -sL https://example.com/ -o tmp/example.html
   curl -sL https://r.jina.ai/https://example.com/
   ```
2. Capture the key details for the JSON entry:
   - Program name, organizer, website.
   - A concise description (what founders get, funding, format).
   - Categories → `types`, `supports`, `sectors` (align with existing taxonomy values).
   - Dates block: include any known application window, runtime, cadence, timezone.
   - Location information (city, country, region code, hybrid/virtual flags).
   - Any hashtags or metadata that help with filtering.
3. When needed, download supporting pages into `tmp/` for reference with `curl -o` so you can grep or `rg` for specific phrases (program length, funding, etc.). Clean `tmp/` afterward.

## 3. Update `public/events.json`
1. Compose the JSON object following the existing schema (see other entries for reference).
2. Use a short Python snippet to insert or replace the event:
   ```bash
   python - <<'PY'
   import json, datetime, pathlib
   path = pathlib.Path('public/events.json')
   data = json.loads(path.read_text())
   now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
   new_event = {
       "id": "example-2025",
       "name": "Example Accelerator",
       ...,
       "last_verified_utc": now
   }
   data['events'] = [ev for ev in data['events'] if ev['id'] != new_event['id']]
   data['events'].append(new_event)
   path.write_text(json.dumps(data, indent=2) + '\n')
   PY
   ```
3. Confirm the new block using `rg` or `nl` to spot-check formatting.

## 4. Mark The CSV Entry As Checked
1. Edit the relevant row’s `checked_at` column to today’s date (UTC) using `apply_patch` or a small Python script:
   ```bash
   python - <<'PY'
   import csv
   from pathlib import Path
   path = Path('data/accelerators-crypto.csv')
   rows = list(csv.reader(path.open()))
   for row in rows:
       if row[0] == 'Alliance DAO':
           row[2] = '2025-11-12'
           break
   path.write_text('\n'.join(','.join(r) for r in rows) + '\n')
   PY
   ```
2. Alternatively, a targeted `apply_patch` works well for single-line date updates.

## 5. Clean Up & Verify
1. Remove temporary files: `rm -rf tmp/*`.
2. `git status -sb` to ensure only the intended files changed.
3. In your response to the user, summarize the new event and the CSV update.

## Tips & Reminders
- Prefer authoritative sources (official site, recent blog posts, TechCrunch coverage if needed). Use `r.jina.ai` when JS-heavy pages block `curl`.
- Note program cadence precisely (weeks on-site, remote phases, demo day) so cards render accurately.
- When taxonomies lack a perfect sector tag, choose the closest existing one (e.g., `web3` for on-chain accelerators).
- Always set `last_verified_utc` using `datetime.utcnow()`.
- Maintain alphabetical consistency when adding to JSON; the script above appends to the list, so ordering is not critical but stay consistent if manual edits are needed.

Following these steps keeps the event catalog accurate and ensures we don’t revisit the same accelerator twice.
