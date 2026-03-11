---
phase: 04-llm-enrichment
plan: 02
subsystem: ui
tags: [llm, summaries, topic-filter, disclaimer, html-generation, css, javascript]

requires:
  - phase: 04-llm-enrichment
    provides: LLM summary JSON files (data/llm/summaries/{category}/{key}.json)
  - phase: 01-foundation
    provides: generate-pages.js page generation pipeline

provides:
  - Collapsible paragraph summaries on all 23 law pages
  - Disclaimer info-box rendered once per law page
  - Topic filter chip bar with Alle + sorted topic buttons
  - Topic filter JS interactivity hiding/showing paragraphs by theme
  - Topic chip CSS styling matching site design

affects: [04-03, 04-04]

tech-stack:
  added: []
  patterns:
    - "LLM data loading in generateLawPage() with graceful fallback"
    - "details/summary pattern for collapsible paragraph summaries"
    - "Topic chip filter with delegated click handler on container"
    - "Section visibility toggle based on child article visibility"

key-files:
  created: []
  modified:
    - scripts/generate-pages.js
    - src/js/main.js
    - src/css/main.css
    - src/gemeindeordnungen/*.html
    - src/stadtrechte/*.html

key-decisions:
  - "LLM data loaded per-law in generateLawPage() via rootDir parameter for test compatibility"
  - "Disclaimer and topic chips only rendered when llmData exists (graceful degradation)"
  - "Topic chips sorted alphabetically with German locale collation"
  - "Section-level visibility toggle: sections hide when all child articles are hidden"

patterns-established:
  - "LLM enrichment pattern: load JSON, pass through render chain, graceful fallback if missing"
  - "Topic filter: delegated click on container, data-topics CSV attribute on articles"
  - "Disclaimer placement: between page header and ToC, before topic chips"

requirements-completed: [LLM-01, LLM-02, LLM-07]

duration: 8min
completed: 2026-03-11
---

# Phase 04 Plan 02: LLM UI Rendering Summary

**Collapsible paragraph summaries, disclaimer info-box, and topic filter chips rendered on all 23 law pages with JS interactivity for topic-based paragraph filtering**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-11T09:08:26Z
- **Completed:** 2026-03-11T09:16:57Z
- **Tasks:** 2
- **Files modified:** 26

## Accomplishments
- Extended generate-pages.js to load LLM summary JSON and render collapsible summaries under each paragraph heading
- Added disclaimer info-box ("Vereinfachte Zusammenfassungen dienen der Orientierung und sind keine Rechtsberatung") once per law page
- Built topic filter chip bar with sorted unique topics and "Alle" button above the ToC
- Implemented initTopicFilter() JS for interactive paragraph filtering by topic
- Added topic-chip CSS with active/inactive/hover states matching site design
- All 25 existing E2E tests pass; visual review confirmed correct rendering on desktop and mobile

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend generate-pages.js with summaries, disclaimer, and topic chips** - `6995cdc` (feat)
2. **Task 2: Add topic filter JS and topic chip CSS** - `42a1fb4` (feat)
3. **Generated HTML pages** - `2a950c5` (chore)

## Files Created/Modified
- `scripts/generate-pages.js` - LLM data loading, summary rendering, disclaimer, topic chip generation
- `src/js/main.js` - initTopicFilter() function for topic chip click handling
- `src/css/main.css` - Topic chip styles (active, inactive, hover)
- `src/gemeindeordnungen/*.html` - 9 regenerated law pages with LLM enrichment
- `src/stadtrechte/*.html` - 14 regenerated law pages with LLM enrichment

## Decisions Made
- LLM data loaded via rootDir parameter in generateLawPage() for test compatibility (rootDir defaults to ROOT constant)
- Disclaimer and topic chips only rendered when llmData exists -- pages without LLM data render unchanged
- Topics sorted alphabetically using German locale (`localeCompare('de')`)
- Section-level visibility toggled when all child articles hidden by topic filter
- try/catch around JSON.parse for malformed LLM files (graceful degradation)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Playwright webServer command fails to start (pagefind reports empty directory during rebuild). Pre-existing environment issue unrelated to this plan's changes. Workaround: start preview server manually before running tests. All 25 E2E tests pass.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All law pages now display LLM-enriched content (summaries, disclaimer, topic chips)
- Topic filter JS is wired up and functional
- Plans 03 (FAQ page) and 04 (glossary page) can proceed using the same LLM JSON data

## Self-Check: PASSED

- All 5 key files verified present on disk
- Commits 6995cdc, 42a1fb4, 2a950c5 verified in git log
- Wien page: 212 summary sections, 1 topic-filter, 1 disclaimer confirmed
- main.js: initTopicFilter present; main.css: topic-chip-active present

---
*Phase: 04-llm-enrichment*
*Completed: 2026-03-11*
