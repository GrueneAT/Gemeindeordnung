---
phase: 01-data-pipeline-project-foundation
plan: 02
subsystem: data-pipeline
tags: [cheerio, ris, html-parser, vitest, json-schema]

# Dependency graph
requires:
  - phase: 01-data-pipeline-project-foundation
    provides: "Complete 23-law registry in scripts/config.js"
provides:
  - "Cheerio-based RIS HTML parser handling 4+ Bundeslaender structural variants"
  - "Structured JSON output with meta (contentHash, fetchedAt) and hierarchical struktur"
  - "Real RIS HTML test fixtures for regression testing"
  - "parseAll() function for batch processing raw HTML to parsed JSON"
affects: [01-03-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns: [adaptive-html-parsing, aria-hidden-text-extraction, fail-fast-validation]

key-files:
  created:
    - scripts/parse-laws.js
    - tests/parse-laws.test.js
    - tests/fixtures/burgenland-sample.html
    - tests/fixtures/oberoesterreich-sample.html
    - tests/fixtures/wien-sample.html
    - tests/fixtures/kaernten-sample.html
    - tests/fixtures/README.md
  modified:
    - package.json

key-decisions:
  - "Adaptive parser detects hierarchy (Hauptstuecke/Abschnitte) per law -- no per-Bundesland hardcoding"
  - "Use aria-hidden text over sr-only text for accurate content extraction"
  - "SHA-256 contentHash in meta for future change detection"

patterns-established:
  - "getVisibleText() strips sr-only spans, uses aria-hidden content"
  - "buildStruktur() adapts output hierarchy based on detected structural elements"
  - "Fail-fast: parseLaw() throws if zero paragraphs extracted"

requirements-completed: [DATA-02, DATA-03, DATA-04]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 1 Plan 2: RIS HTML Parser Summary

**Cheerio-based parser extracting structured JSON from 4 Bundeslaender RIS HTML with adaptive hierarchy detection and SHA-256 content hashing**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T03:00:53Z
- **Completed:** 2026-03-11T03:04:47Z
- **Tasks:** 2 (Task 1 + Task 2 TDD)
- **Files modified:** 8

## Accomplishments
- Real RIS HTML fixtures for 4 Bundeslaender (Burgenland 615KB, OOe 960KB, Wien 756KB, Kaernten 619KB) committed as regression test anchors
- Adaptive parser handles structural variation: Hauptstuecke > Abschnitte > Paragraphen (Burgenland, OOe, Wien) and Abschnitte > Paragraphen (Kaernten)
- 10 parser tests covering extraction, schema validation, Absaetze, and fail-fast behavior
- Full test suite: 16 tests pass (10 parser + 6 fetch)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fetch real RIS HTML samples and create test fixtures** - `7b403b7` (feat)
2. **Task 2 RED: Failing tests for RIS HTML parser** - `048e2f7` (test)
3. **Task 2 GREEN: Implement cheerio-based parser** - `963ef5c` (feat)

## Files Created/Modified
- `scripts/parse-laws.js` - Cheerio-based HTML parser with parseLaw() and parseAll() exports
- `tests/parse-laws.test.js` - 10 tests covering 4 Bundeslaender, schema, Absaetze, fail-fast
- `tests/fixtures/burgenland-sample.html` - Real RIS HTML (Hauptstueck hierarchy)
- `tests/fixtures/oberoesterreich-sample.html` - Real RIS HTML (combined headers pattern)
- `tests/fixtures/wien-sample.html` - Real RIS HTML (Wiener Stadtverfassung)
- `tests/fixtures/kaernten-sample.html` - Real RIS HTML (Abschnitte only, no Hauptstuecke)
- `tests/fixtures/README.md` - Structural pattern documentation per Bundesland
- `package.json` - Added "parse" npm script

## Decisions Made
- Adaptive parser auto-detects hierarchy level (Hauptstuecke vs Abschnitte only) rather than hardcoding per Bundesland -- simpler and more maintainable
- Use aria-hidden text content (real formatted text) over sr-only spans (screen reader paraphrasing) for accurate Originaltext extraction
- SHA-256 contentHash enables future change detection without re-parsing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Parser produces structured JSON ready for page generation (Plan 3)
- Test fixtures establish regression safety net for future parser changes
- parseAll() function ready to process data/raw/ into data/parsed/ in build pipeline

## Self-Check: PASSED
