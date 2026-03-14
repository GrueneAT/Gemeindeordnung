---
phase: quick-21
title: "Make header non-sticky on mobile, keep sticky on desktop"
status: complete
---

# Quick Task 21: Summary

## Changes
1. Header uses `sm:sticky` instead of `sticky` — scrolls with page on mobile, stays sticky on desktop
2. Scroll-margin-top for anchored paragraphs is responsive (1rem mobile, 5rem desktop)
3. Removed "Filter gilt nur für Gesetzestexte" note from search results
4. Updated E2E test selectors from `header.sticky` to `header[data-pagefind-ignore]`
5. All 184 E2E tests pass

## Files Modified
- `scripts/generate-pages.js` — `sticky` → `sm:sticky` on header
- `src/css/main.css` — responsive scroll-margin-top, removed `.search-filter-note`
- `src/js/search.js` — removed filter note rendering
- `e2e/tests/mobile.spec.js` — updated header selectors
- `e2e/tests/navigation.spec.js` — updated header selectors
- `e2e/tests/unified-search.spec.js` — removed filter note assertions
