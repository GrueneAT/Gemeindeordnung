---
phase: quick-16
plan: 01
subsystem: law-pipeline
tags: [staleness-detection, fassungVom, RIS, parsing]
dependency_graph:
  requires: []
  provides: [fassungVom-extraction, staleness-check]
  affects: [data/parsed/**/*.json, scripts/parse-laws.js, scripts/fetch-laws.js]
tech_stack:
  added: []
  patterns: [content-hash-comparison, date-extraction-from-html]
key_files:
  created: []
  modified:
    - scripts/parse-laws.js
    - scripts/fetch-laws.js
    - tests/parse-laws.test.js
    - tests/fetch-laws.test.js
decisions:
  - "fassungVom stored as ISO date string (YYYY-MM-DD) for consistency with other date formats"
  - "checkAll() uses parseLaw on fresh HTML to extract new fassungVom rather than regex on raw HTML"
  - "data/parsed/ files are gitignored -- Task 3 re-parse runs locally but no commit for generated data"
metrics:
  duration: "2m"
  completed: "2026-03-13"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 4
---

# Quick Task 16: Staleness Detection and fassungVom Extraction

Extract "Fassung vom" date from RIS HTML during parsing, add --check flag to fetch-laws.js for comparing contentHash to detect law changes without full re-parse.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Extract fassungVom in parseLaw (TDD) | 7a273c4 | extractFassungVom() in parse-laws.js, 4 new tests |
| 2 | Add --check flag to fetch-laws.js (TDD) | 7ad2ab6 | checkAll() export, --check CLI flag, export test |
| 3 | Re-parse all laws to populate fassungVom | n/a (gitignored) | All 23 JSON files updated locally |

## Implementation Details

### fassungVom Extraction (Task 1)
- Added `extractFassungVom($)` helper that reads `h1#Title` text and matches `Fassung vom DD.MM.YYYY`
- Converts German date format (DD.MM.YYYY) to ISO (YYYY-MM-DD)
- Returns null gracefully when pattern not found
- Added to meta object alongside existing contentHash

### Staleness Check (Task 2)
- `checkAll()` iterates all 23 laws, fetches fresh HTML, computes SHA-256 hash
- Compares against stored `meta.contentHash` in `data/parsed/{category}/{key}.json`
- For changed laws: re-parses to extract new fassungVom, reports old vs new dates
- Rate-limited between requests (reuses existing RATE_LIMIT_MS = 1500ms)
- CLI: `node scripts/fetch-laws.js --check`

### Data Re-parse (Task 3)
- Ran `node scripts/parse-laws.js` to populate fassungVom in all 23 parsed JSON files
- All files confirmed to have valid ISO dates (e.g., tirol.json: fassungVom = "2026-03-11")
- No git commit since data/parsed/ is in .gitignore (generated output)

## Deviations from Plan

### Task 3: No commit for gitignored data
- **Found during:** Task 3 commit attempt
- **Issue:** data/parsed/ directory is in .gitignore -- generated data is not tracked
- **Resolution:** Task completed successfully (files populated locally), commit skipped as appropriate for generated output

## Verification

- All 129 unit tests pass across 6 test files
- All 23 parsed JSON files contain meta.fassungVom with valid ISO date
- checkAll() function exported and tested
- --check CLI flag wired up correctly
