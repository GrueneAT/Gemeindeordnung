---
phase: quick-21
title: "Make header non-sticky on mobile, keep sticky on desktop"
status: complete
---

# Quick Task 21: Make header non-sticky on mobile, keep sticky on desktop

## Plan 21-01: Header sticky behavior

### Task 1: CSS and template changes
- **files:** scripts/generate-pages.js, src/css/main.css
- **action:** Change `sticky` to `sm:sticky` on header element. Add responsive scroll-margin-top for anchored paragraphs (1rem on mobile, 5rem on desktop).
- **verify:** Header scrolls with page on mobile, stays sticky on desktop.

### Task 2: Fix E2E test selectors
- **files:** e2e/tests/mobile.spec.js, e2e/tests/navigation.spec.js
- **action:** Replace `header.sticky` selectors with `header[data-pagefind-ignore]` since the sticky class is now responsive.
- **verify:** All E2E tests pass.

### Task 3: Remove filter note (bundled)
- **files:** src/js/search.js, src/css/main.css, e2e/tests/unified-search.spec.js
- **action:** Remove "Filter gilt nur für Gesetzestexte" note text, CSS class, and test assertions.
- **verify:** No filter note appears in search results.
