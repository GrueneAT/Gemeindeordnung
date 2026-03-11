---
phase: 01-data-pipeline-project-foundation
plan: 01
subsystem: data-pipeline
tags: [vite, tailwindcss-v4, ris, cheerio, vitest, node]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - "Vite 7 + TailwindCSS v4 build tooling with Gruene theme"
  - "Complete 23-law registry (9 GO + 14 Stadtrechte) with verified RIS URLs"
  - "Fetch script with rate limiting, size validation, fail-fast error handling"
  - "Test infrastructure with vitest"
affects: [01-02-PLAN, 01-03-PLAN]

# Tech tracking
tech-stack:
  added: [vite-7, tailwindcss-4, cheerio, vitest]
  patterns: [esm-modules, geltende-fassung-direct-fetch, fail-fast-error-handling]

key-files:
  created:
    - scripts/config.js
    - scripts/fetch-laws.js
    - vite.config.js
    - src/index.html
    - src/css/main.css
    - tests/fetch-laws.test.js
  modified:
    - package.json

key-decisions:
  - "TailwindCSS v4 CSS-first config with @theme block (no tailwind.config.js)"
  - "Composite key abfrage+gesetzesnummer for law uniqueness (gesetzesnummer alone collides)"
  - "10KB minimum response size threshold for error page detection"
  - "NODE_ENV=development required for npm install (production env skips devDeps)"

patterns-established:
  - "ESM modules throughout (type: module in package.json)"
  - "risUrl() helper for consistent GeltendeFassung URL construction"
  - "Rate-limited sequential fetching with 1.5s delay"

requirements-completed: [DATA-01, DATA-03, DSGN-02]

# Metrics
duration: 4min
completed: 2026-03-11
---

# Phase 1 Plan 1: Project Setup & RIS Law Fetch Summary

**Vite 7 + TailwindCSS v4 project with complete 23-law RIS registry and rate-limited fetch script**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-11T02:53:47Z
- **Completed:** 2026-03-11T02:57:23Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Vite 7 project with TailwindCSS v4 builds successfully (no v3 patterns)
- Complete law registry: 9 Gemeindeordnungen + 14 Statutarstadt-Stadtrechte with verified RIS URLs
- Fetch script with HTTP error handling, 10KB size validation, and 1.5s rate limiting
- 6 tests covering config completeness, URL format, key uniqueness, and error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize project with Vite, TailwindCSS v4, and vitest** - `4aae2b4` (feat)
2. **Task 2 RED: Failing tests for law registry and fetch** - `d5a7b7e` (test)
3. **Task 2 GREEN: Implement config and fetch script** - `fdd02b5` (feat)

## Files Created/Modified
- `package.json` - Node.js project with ESM, Vite 7, TailwindCSS v4, cheerio, vitest
- `vite.config.js` - Vite config with @tailwindcss/vite plugin, /gemeindeordnung/ base path
- `src/index.html` - Landing page with German text and Gruene styling
- `src/css/main.css` - TailwindCSS v4 entry with @theme Gruene colors
- `src/js/main.js` - Minimal JS entry point
- `scripts/config.js` - Complete 23-law registry with GeltendeFassung URLs
- `scripts/fetch-laws.js` - RIS fetcher with rate limiting and fail-fast error handling
- `tests/fetch-laws.test.js` - 6 tests for config and fetch validation
- `.gitignore` - Excludes node_modules/, dist/, data/raw/

## Decisions Made
- TailwindCSS v4 CSS-first config: @import "tailwindcss" + @theme block, no tailwind.config.js or postcss.config.js
- Composite key (abfrage+gesetzesnummer) for law uniqueness -- St. Poelten and Tirol share gesetzesnummer 20000101 but different abfrage codes
- 10KB minimum response size for error page detection (real laws are 100KB+)
- risUrl() helper function for DRY URL construction

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- NODE_ENV=production was set in the environment, causing npm to skip devDependencies installation. Fixed by running `NODE_ENV=development npm install`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Build tooling and test infrastructure ready for Phase 1 Plan 2 (HTML parser)
- Config.js provides the law registry that parse-laws.js will consume
- data/raw/ directory structure ready for fetched HTML files

## Self-Check: PASSED

All 9 created files verified present. All 3 commit hashes (4aae2b4, d5a7b7e, fdd02b5) verified in git log.

---
*Phase: 01-data-pipeline-project-foundation*
*Completed: 2026-03-11*
