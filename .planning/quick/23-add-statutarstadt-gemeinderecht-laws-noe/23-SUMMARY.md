---
phase: quick-23
plan: 23
subsystem: law-registry, page-generation, navigation-ui
tags: [config, ui-restructure, new-law, bl-grouping]
dependency_graph:
  requires: []
  provides: [bl-grouped-navigation, organisationsgesetze-category, noestrog-law]
  affects: [scripts/config.js, scripts/generate-pages.js, scripts/fetch-laws.js, scripts/parse-laws.js, vite.config.js, all-law-pages, index-page, e2e-tests]
tech_stack:
  added: []
  patterns: [parentBundesland-mapping, bl-grouped-optgroups, category-order-sorting]
key_files:
  created:
    - src/organisationsgesetze/noestrog.html
    - data/raw/organisationsgesetze/noestrog.html
    - data/parsed/organisationsgesetze/noestrog.json
  modified:
    - scripts/config.js
    - scripts/generate-pages.js
    - scripts/fetch-laws.js
    - scripts/parse-laws.js
    - vite.config.js
    - src/index.html
    - e2e/tests/dropdown-nav.spec.js
    - e2e/tests/card-grid.spec.js
    - e2e/tests/hero-section.spec.js
    - e2e/tests/hero.spec.js
    - tests/generate-pages.test.js
decisions:
  - "Used gesetzesnummer 20000300 for NOeSTROG (plan's 20001325 returned 404)"
  - "Grouped index page cards by parentBundesland using parsed data with config lookup fallback"
  - "BL switcher labels: GO='Gemeindeordnung', SR='Stadt (Stadtrecht)', OG=law name without prefix"
metrics:
  duration: 17m
  completed: "2026-03-15"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 51
---

# Quick Task 23: Add Statutarstadt-Gemeinderecht Laws (NOeSTROG) Summary

BL-grouped law navigation with parentBundesland mapping and NOeSTROG (117 paragraphs) as first Organisationsgesetz under Niederoesterreich.

## What Was Done

### Task 1: Restructure config.js with parentBundesland and add NOeSTROG
- Added `parentBundesland` field to all 9 Gemeindeordnung entries (same as bundesland)
- Added `parentBundesland` field to all 14 Stadtrecht entries mapping to actual parent BL (e.g., Eisenstadt -> Burgenland, Graz -> Steiermark)
- Added new `organisationsgesetze` category with NOeSTROG entry (gesetzesnummer 20000300, LrNO)
- Updated law count comment to 24

### Task 2: Fetch, parse, generate NOeSTROG; BL-grouped UI
- Fetched NOeSTROG from RIS (611KB HTML, 117 paragraphs in 8 sections)
- Rewrote `buildBundeslandSwitcher()`: 9 BL optgroups with sub-items (GO first, then Stadtrechte, then OG)
- Rewrote `buildHeroBundeslandSelect()`: same BL-grouped structure for hero search filter
- Rewrote index page card grid: groups laws by parent Bundesland instead of by category
- Added `organisationsgesetze` to Vite config, fetch-laws, and parse-laws pipelines
- Updated 4 E2E test files and 1 unit test file for new BL-grouped structure
- All 98 E2E tests pass, all 142 unit tests pass

### Task 3: Human verification checkpoint
- Visual review passed: BL-grouped card grid, header dropdown, mobile layout all correct

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected gesetzesnummer for NOeSTROG**
- **Found during:** Task 2
- **Issue:** Plan specified gesetzesnummer `20001325` which returned HTTP 404 from RIS
- **Fix:** Searched RIS for "STROG" in LrNO, found correct gesetzesnummer `20000300` (NOe Stadtrechtsorganisationsgesetz)
- **Files modified:** `scripts/config.js`
- **Commit:** 67f1608

**2. [Rule 3 - Blocking] Added organisationsgesetze to Vite config**
- **Found during:** Task 2
- **Issue:** `vite.config.js` only discovered `gemeindeordnungen` and `stadtrechte` directories, causing noestrog.html to be missing from dist/
- **Fix:** Added `organisationsgesetze` to the categories array in `discoverInputs()`
- **Files modified:** `vite.config.js`
- **Commit:** 67f1608

**3. [Rule 1 - Bug] Updated unit test for BL switcher structure**
- **Found during:** Task 2
- **Issue:** Test 18P2 checked for old CSS classes (`bl-switcher`, `bl-switcher-label`) that were removed in a previous quick task
- **Fix:** Updated to check for `bl-header-select` class and `<optgroup` elements
- **Files modified:** `tests/generate-pages.test.js`
- **Commit:** 67f1608

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 29bf626 | feat(quick-23): restructure config.js with parentBundesland and add NOeSTROG |
| 2 | 67f1608 | feat(quick-23): BL-grouped UI, NOeSTROG fetched and rendered |

## Verification Results

- All 24 laws render (9 GO + 14 Stadtrechte + 1 Organisationsgesetz)
- BL switcher shows 9 BL optgroups with correct sub-items per BL
- Index page shows BL-grouped card grid (Burgenland: 3 cards, Niederoesterreich: 6 cards, Wien: 1 card, etc.)
- NOeSTROG accessible at /organisationsgesetze/noestrog.html with 117 paragraphs, TOC, and search
- Pagefind indexes NOeSTROG content
- All 98 E2E tests pass
- All 142 unit tests pass
- Visual review protocol passed

## Self-Check: PASSED

All files exist, all commits verified.
