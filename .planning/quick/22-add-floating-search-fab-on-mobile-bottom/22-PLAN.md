---
phase: quick-22
title: "Mobile header search field + revert sticky header"
status: complete
---

# Quick Task 22: Mobile header search field, revert sticky header

## Plan 22-01

### Task 1: Revert header to sticky, add mobile search field
- **files:** scripts/generate-pages.js, src/css/main.css, src/js/search.js
- **action:** Revert `sm:sticky` back to `sticky` (fixes iOS). Replace icon-only search button with a compact "Suchen..." text field on mobile that opens the search modal on tap. Desktop keeps icon button. Revert scroll-margin-top to simple 5rem.
- **verify:** Header sticky on all viewports, mobile shows search field, desktop shows icon button.

### Task 2: Update E2E tests
- **files:** e2e/tests/mobile.spec.js, e2e/tests/navigation.spec.js
- **action:** Revert header selectors back to `header.sticky`. Update mobile search test to check for `#header-search-field` instead of `#search-modal-trigger`.
- **verify:** All E2E tests pass.
