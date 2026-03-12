---
phase: 05-unified-search-engine
plan: 01
subsystem: search
tags: [pagefind, metadata, filters, content-types]

# Dependency graph
requires:
  - phase: 04.3-curated-faq-topics
    provides: FAQ topic pages with data-pagefind-body
provides:
  - "Pagefind typ filter with values Gesetz, FAQ, Glossar on all content types"
  - "topic_title metadata on FAQ topic pages"
  - "FAQ index page excluded from Pagefind indexing"
affects: [05-02-two-pass-search, 05-03-unified-search-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: ["data-pagefind-filter typ[content] for content type classification"]

key-files:
  created: []
  modified:
    - scripts/generate-pages.js
    - src/glossar.html

key-decisions:
  - "Used 'Gesetz' as unified typ value for all law pages instead of category slugs (gemeindeordnungen/stadtrechte)"
  - "Added typ filter directly to existing src/glossar.html since glossary terms.json data file is missing and generate-pages.js skips glossary regeneration"

patterns-established:
  - "Content type tagging: all indexed pages must have data-pagefind-filter typ[content] with one of Gesetz, FAQ, Glossar"
  - "Navigation pages (FAQ index) use data-pagefind-ignore on main to exclude from search"

requirements-completed: [SRCH-02]

# Metrics
duration: 10min
completed: 2026-03-12
---

# Phase 5 Plan 01: Pagefind Metadata Tagging Summary

**Pagefind typ filter added to all 57 indexed pages (Gesetz/FAQ/Glossar) with topic_title metadata on FAQ pages**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-12T20:29:23Z
- **Completed:** 2026-03-12T20:39:19Z
- **Tasks:** 2
- **Files modified:** 42

## Accomplishments
- Law pages now use typ:Gesetz filter instead of category slug (gemeindeordnungen/stadtrechte)
- FAQ topic pages have typ:FAQ filter and topic_title metadata for rich result rendering
- Glossary page has typ:Glossar filter
- FAQ index page explicitly excluded from Pagefind indexing with data-pagefind-ignore
- Pagefind index builds successfully with 2 filters (bundesland, typ) across 57 pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Pagefind typ filter and meta attributes to all page templates** - `b78df61` (feat)
2. **Task 2: Verify Pagefind index contains typ filter values** - verification only, no code changes

## Files Created/Modified
- `scripts/generate-pages.js` - Updated 4 template functions: generateLawPage (typ:Gesetz), generateFAQTopicPage (typ:FAQ + topic_title meta), generateGlossaryPage (typ:Glossar), generateFAQIndexPage (data-pagefind-ignore)
- `src/glossar.html` - Added typ:Glossar meta tag directly (glossary data file missing, generate-pages.js skips regeneration)
- `src/gemeindeordnungen/*.html` (9 files) - Regenerated with typ:Gesetz
- `src/stadtrechte/*.html` (14 files) - Regenerated with typ:Gesetz
- `src/faq/*.html` (16 files) - Regenerated/created with typ:FAQ and topic_title meta
- `src/index.html` - Regenerated (no typ changes, just regenerated alongside)

## Decisions Made
- Used "Gesetz" as unified typ value for all law pages (both gemeindeordnungen and stadtrechte) to enable simple content type filtering in the unified search
- Added typ:Glossar meta tag directly to existing src/glossar.html because the glossary terms.json data file does not exist in the repository, causing generate-pages.js to skip glossary page regeneration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added typ:Glossar directly to src/glossar.html**
- **Found during:** Task 1 (Adding Pagefind metadata)
- **Issue:** The glossary data file (data/llm/glossary/terms.json) does not exist, so generate-pages.js skips glossary page regeneration. The template change would never be applied.
- **Fix:** Added the `<meta data-pagefind-filter="typ[content]" content="Glossar" />` tag directly to the existing src/glossar.html file
- **Files modified:** src/glossar.html
- **Verification:** grep confirmed typ:Glossar present in both src and dist glossar.html
- **Committed in:** b78df61 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix to ensure glossary page is properly tagged despite missing data file. No scope creep.

## Issues Encountered
- Pre-existing test failure: glossar.spec.js LLM-06 test (inline tooltips) fails because glossary terms.json data file is missing -- not caused by this plan's changes
- Pre-existing test failure: llm-analyze.test.js summary schema validation fails due to LLM data quality -- not caused by this plan's changes

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Pagefind index now contains typ filter values for all three content types (Gesetz, FAQ, Glossar)
- Plan 05-02 (two-pass search architecture) can now implement filtered search using `typ` filter
- topic_title metadata available for rich FAQ result rendering in unified search UI

---
*Phase: 05-unified-search-engine*
*Completed: 2026-03-12*
