---
phase: quick-22
title: "Mobile header search field + revert sticky header"
status: complete
---

# Quick Task 22: Summary

## Changes
1. Reverted header to `sticky` (fixes iOS Safari issue where `sm:sticky` didn't work)
2. Added compact "Suchen..." text field in header on mobile — tapping opens search modal
3. Desktop keeps the icon button (search field hidden at >=640px)
4. Reverted scroll-margin-top back to simple 5rem
5. All 171 E2E tests pass

## Files Modified
- `scripts/generate-pages.js` — header back to `sticky`, dual search HTML (field + icon)
- `src/css/main.css` — `.header-search-field` styles, responsive show/hide rules
- `src/js/search.js` — wires `#header-search-field` focus/click to `openSearchModal()`
- `e2e/tests/mobile.spec.js` — tests for header search field visibility
- `e2e/tests/navigation.spec.js` — reverted header selector to `header.sticky`
