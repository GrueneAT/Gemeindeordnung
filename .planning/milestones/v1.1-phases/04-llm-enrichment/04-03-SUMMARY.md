---
phase: 04-llm-enrichment
plan: 03
subsystem: ui
tags: [faq, glossary, tooltips, html-generation, navigation, pagefind]

requires:
  - phase: 04-llm-enrichment
    provides: FAQ topics.json and glossary terms.json from Plan 01
  - phase: 04-llm-enrichment
    provides: renderParagraph with summary details block from Plan 02

provides:
  - FAQ index page with 10 topic cards at src/faq/index.html
  - 10 per-topic FAQ pages with cross-Bundesland paragraph references
  - Glossary page with A-Z navigation at src/glossar.html
  - Inline glossary tooltips in paragraph body text (dotted underline, hover definition)
  - Header navigation with FAQ and Glossar links on all pages
  - FAQ section on index page with topic cards
  - Extended Vite discoverInputs for FAQ and glossary pages
  - Mobile tap-to-toggle tooltip JS

affects: [04-04]

tech-stack:
  added: []
  patterns:
    - "FAQ page generation: generateFAQIndexPage, generateFAQTopicPage functions"
    - "Glossary page generation: generateGlossaryPage with A-Z letter grouping"
    - "Tooltip injection: injectGlossaryTerms on body text only, first match per paragraph"
    - "Header pathPrefix param for flexible relative path handling across page types"

key-files:
  created:
    - src/faq/index.html
    - src/faq/*.html (10 topic pages)
    - src/glossar.html
  modified:
    - scripts/generate-pages.js
    - vite.config.js
    - src/js/main.js
    - src/css/main.css
    - src/index.html
    - src/gemeindeordnungen/*.html
    - src/stadtrechte/*.html

key-decisions:
  - "generateHeader pathPrefix param defaults based on isLawPage but can be overridden for FAQ subdir pages"
  - "Glossary tooltips injected into body text ONLY, not into Plan 02 summary details blocks"
  - "Only first occurrence of each glossary term per paragraph is highlighted"
  - "Regex matching uses lookbehind for > to avoid matching inside HTML tags"
  - "FAQ/Glossar nav links hidden on mobile (sm breakpoint) to avoid header crowding"

patterns-established:
  - "Tooltip injection: injectGlossaryTerms operates on bodyHtml before assembly with summaryHtml"
  - "FAQ generation: topic cards link to per-topic pages with breadcrumb navigation"
  - "Glossary A-Z: terms grouped by first letter with jump nav and id anchors"
  - "Header nav: pathPrefix param allows flexible path resolution across page hierarchy"

requirements-completed: [LLM-03, LLM-04, LLM-05, LLM-06]

duration: 8min
completed: 2026-03-11
---

# Phase 04 Plan 03: FAQ Pages, Glossary Page, and Inline Tooltips Summary

**FAQ index with 10 topic pages, alphabetical glossary with A-Z navigation, and inline glossary tooltips in legal text body with mobile tap support**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-11T09:19:21Z
- **Completed:** 2026-03-11T09:27:33Z
- **Tasks:** 2
- **Files modified:** 40

## Accomplishments
- Generated FAQ index page with 10 topic cards and 10 per-topic pages with cross-BL paragraph references
- Generated glossary page with 20 terms, A-Z letter navigation, and links to relevant paragraphs
- Injected inline glossary tooltips (dotted underline, hover shows definition) into paragraph body text only
- Extended header on all pages with FAQ and Glossar navigation links
- Added FAQ section to index page with topic cards linking to FAQ pages
- Extended Vite discoverInputs to include FAQ and glossary pages in build
- All 48 unit tests pass, 24/25 E2E tests pass (1 pre-existing search filter test failure)

## Task Commits

Each task was committed atomically:

1. **Task 1: Generate FAQ pages and glossary page** - `cb9a7ba` (feat)
2. **Task 2: Add glossary tooltip injection, Vite config, and tooltip CSS/JS** - `d12cd8e` (feat)

## Files Created/Modified
- `scripts/generate-pages.js` - FAQ/glossary page generators, tooltip injection, header nav links
- `vite.config.js` - Extended discoverInputs for FAQ and glossary pages
- `src/js/main.js` - initGlossaryTooltips for mobile tap-to-toggle
- `src/css/main.css` - Glossary tooltip styles (dotted underline, hover popup)
- `src/faq/index.html` - FAQ overview with 10 topic cards
- `src/faq/*.html` - 10 per-topic FAQ pages with questions and cross-BL references
- `src/glossar.html` - Alphabetical glossary with A-Z jump navigation
- `src/index.html` - FAQ section added with topic cards
- `src/gemeindeordnungen/*.html` - Regenerated with glossary tooltips and header nav
- `src/stadtrechte/*.html` - Regenerated with glossary tooltips and header nav

## Decisions Made
- Added `pathPrefix` parameter to `generateHeader()` for flexible relative path handling across FAQ subdir, law subdirs, and root pages
- Glossary tooltips injected on bodyHtml before assembly with summaryHtml, ensuring tooltips only appear in legal text
- Regex matching uses `(?<=>)` lookbehind to avoid matching inside HTML tag attributes
- FAQ/Glossar nav links use `hidden sm:flex` to avoid crowding the mobile header
- Added `ml-4` margin to nav links for visual separation from logo text

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed header nav spacing**
- **Found during:** Task 2 (visual review)
- **Issue:** FAQ/Glossar links appeared immediately after logo text without visual separation
- **Fix:** Added `ml-4` margin class to nav element
- **Files modified:** scripts/generate-pages.js
- **Verification:** Visual screenshot review confirmed proper spacing
- **Committed in:** d12cd8e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor visual fix, no scope creep.

## Issues Encountered
- Pre-existing Playwright webServer issue: pagefind reports empty directory during the webServer build command. Workaround: build and index manually before starting preview server. This is the same issue documented in Plan 02 summary.
- 1 pre-existing E2E test failure (SUCH-05 search filter toggle) unrelated to this plan's changes.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All FAQ and glossary pages generated and indexed by Pagefind
- 34 pages now in Pagefind search index (up from 23 law pages)
- Glossary tooltips render in all 23 law pages
- Plan 04 (E2E tests for LLM features) can proceed with all UI features in place

## Self-Check: PASSED

- All 7 key files verified present on disk
- FAQ index, 10 topic pages, and glossary page confirmed
- Commits cb9a7ba and d12cd8e verified in git log
- Glossary tooltips in law pages: 73 instances in burgenland.html, 0 inside summary blocks

---
*Phase: 04-llm-enrichment*
*Completed: 2026-03-11*
