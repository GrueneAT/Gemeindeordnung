---
phase: 06-search-hero-homepage-navigation
verified: 2026-03-12T22:00:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
---

# Phase 6: Search-Hero Homepage & Navigation Verification Report

**Phase Goal:** The homepage communicates "search first" with a prominent central search bar, quick-access discovery links, and polished navigation across all pages and viewports
**Verified:** 2026-03-12T22:00:00Z
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User lands on homepage and sees a large, centered search bar as the primary hero element above all other content | VERIFIED | `dist/index.html` line 38–54: `.hero-section` with `#hero-search-input` appears before discovery section and card grid; screenshot `hero-search.png` confirms centered placement |
| 2 | Below the hero search, user sees "Häufige Fragen" chip links (6-8 FAQ topics) | VERIFIED | `dist/index.html` lines 58–70: `.discovery-section` with 8 `.discovery-chip` links pointing to `faq/*.html`; E2E test SRCH-04 passes |
| 3 | The former card grid is inside a collapsible details/summary section below discovery links | VERIFIED | `dist/index.html` line 75: `<details class="max-w-5xl...">` with `<summary>` — collapsed by default; E2E test SRCH-05 verifies 9+14 cards visible after expand |
| 4 | FAQ and Glossar links are visible in the header on both desktop AND mobile (not hidden behind sm:flex) | VERIFIED | `dist/index.html` line 17-20: nav uses `flex items-center gap-2 text-xs sm:text-sm` (no `hidden` class); mobile screenshot `mobile-nav-links.png` confirms visible on 375px |
| 5 | Header layout is logo left, nav links, search input right — consistent on all pages | VERIFIED | `header-index.png` and `header-law-page.png` screenshots show consistent header; NAV-01 E2E test verifies across index, law, FAQ, and glossar pages |
| 6 | Mobile (375px) shows hero search full-width, discovery chips, no horizontal overflow | VERIFIED | NAV-03 E2E test passes (`scrollWidth <= viewportWidth`); `mobile-hero.png` screenshot confirms full-width hero search and wrapping chips |
| 7 | User types in hero search and sees results in hero dropdown | VERIFIED | `src/js/search.js` lines 914-922: hero input wired as primary `searchInput`; SRCH-01 "hero search produces results" E2E test passes (3.4s) |
| 8 | Typing in hero search syncs the query to the header search input | VERIFIED | `src/js/search.js` line 633-636: sync handler on both hero and header inputs; dual-input pattern established |
| 9 | BL filter chips appear below hero search input and function correctly | VERIFIED | `dist/index.html` line 53: `#hero-search-chips` rendered; `src/js/search.js` line 921-922: `searchChips` set to hero chips; screenshot shows "Alle Bundesländer" chip |
| 10 | On non-index pages, only header search is active | VERIFIED | `src/js/search.js`: heroInput detection is conditional (`if (heroInput)` block at line 919) — law pages have no hero element, header search path unchanged |
| 11 | Ctrl+K focuses hero search on index page | VERIFIED | `src/js/search.js` lines 707-709: keyboard handler checks `heroInput` and `isHeroVisible()` before focusing hero; falls back to header otherwise |
| 12 | E2E tests cover all 6 requirement IDs | VERIFIED | `hero.spec.js` covers SRCH-01/04/05; `navigation.spec.js` covers NAV-01/02/03; all 7 tests pass |
| 13 | All existing E2E tests pass (no regressions) | VERIFIED | Full desktop suite: 63 passed, 1 pre-existing failure (`glossar.spec.js` tooltip test — fails identically on commit prior to phase 06) |
| 14 | Visual Review Protocol screenshots pass inspection | VERIFIED | Screenshots inspected: hero layout clean, green CI gradient correct, umlauts render properly, mobile no overflow, search dropdown layers correctly above content |

**Score:** 14/14 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/generate-pages.js` | Rewritten generateIndexPage() with hero, discovery links, collapsible grid; updated generateHeader() | VERIFIED | Hero HTML at lines 544+; discovery chips at lines 510-528; details/summary at line 573; generateHeader() nav has no `hidden` class |
| `src/css/main.css` | Hero section styles, discovery chip styles, collapsible card grid styles | VERIFIED | `.hero-section` at line 52; `.discovery-chip` at line 73; `details[open] .details-open-rotate` at line 90; `.hero-search-container` at line 62 |
| `src/js/search.js` | Hero input binding, dual-input sync, hero dropdown targeting, mobile overlay compatibility, IntersectionObserver | VERIFIED | `heroInput`/`heroDropdown` module-level vars; `initSearch()` wires hero at lines 914-922; `IntersectionObserver` at line 860; `_restoreDesktop` at line 808 |
| `e2e/tests/hero.spec.js` | Tests for SRCH-01, SRCH-04, SRCH-05 | VERIFIED | 4 tests, all pass — hero visible, search produces results, discovery chips, collapsible card grid |
| `e2e/tests/navigation.spec.js` | Tests for NAV-01, NAV-02, NAV-03 | VERIFIED | 3 tests, all pass — header consistency, FAQ/Glossar links, mobile navigation |
| `e2e/tests/card-grid.spec.js` | Updated to expand details before asserting card visibility | VERIFIED | Tests click `summary` to expand before checking cards; `details .grid > a` selectors |
| `e2e/tests/mobile.spec.js` | Updated for hero section layout | VERIFIED | Checks `#hero-search-input` and `.discovery-chip` on mobile |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `scripts/generate-pages.js` | `data/llm/faq/topics.json` | Reads FAQ topics at build time for discovery chips | VERIFIED | Line 840: `join(rootDir, 'data', 'llm', 'faq', 'topics.json')` — plan mentioned `curated-topics.json` but implementation correctly uses the full `topics.json` (315KB, 15 topics with full content vs 7KB curated list) |
| `scripts/generate-pages.js` | `data/llm/glossary/terms.json` | Reads glossary terms if file exists (graceful fallback) | VERIFIED | Line 484: `existsSync(glossaryPath)` guard; file does not exist so glossary section is omitted — fallback working correctly |
| `scripts/generate-pages.js` | `src/css/main.css` | Hero HTML uses CSS classes defined in main.css | VERIFIED | `hero-section` at CSS line 52, `discovery-chip` at line 73, `details-open-rotate` at line 90; all match HTML class usage |
| `src/js/search.js` | `#hero-search-input` | `getElementById` in `initSearch()`, input event listener | VERIFIED | Line 914: `heroInput = document.getElementById('hero-search-input')` |
| `src/js/search.js` | `#hero-search-dropdown` | Dropdown target set to hero container on index page | VERIFIED | Line 915: `heroDropdown = document.getElementById('hero-search-dropdown')`; line 922: `searchDropdown = heroDropdown` |
| `src/js/search.js` | Mobile overlay | `_restoreDesktop` handles hero refs correctly | VERIFIED | Line 808: `overlay._restoreDesktop` closure captures hero refs when hero is active |
| `e2e/tests/hero.spec.js` | `dist/index.html` | `page.goto('./index.html')` with assertions on hero elements | VERIFIED | Tests assert `#hero-search-input`, `.hero-section`, `.discovery-chip`, `details` elements |
| `e2e/tests/navigation.spec.js` | `dist/index.html` and `dist/gemeindeordnungen/wien.html` | `page.goto()` on multiple pages to verify header consistency | VERIFIED | Tests navigate to index, Wien, FAQ index, and Glossar pages |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SRCH-01 | 06-01, 06-02, 06-03 | User sees central, prominent search bar as hero element on homepage | SATISFIED | `#hero-search-input` in `.hero-section` above all content; wired to Pagefind; E2E `hero.spec.js` tests 1 and 2 pass |
| SRCH-04 | 06-01, 06-03 | Homepage shows quick-access links below search hero (FAQ topics, popular terms) | SATISFIED | `.discovery-section` with 8 FAQ `.discovery-chip` links; E2E `hero.spec.js` test 3 passes |
| SRCH-05 | 06-01, 06-03 | Homepage card grid replaced by search-hero layout (GO/Stadtrechte list collapsed) | SATISFIED | Card grid inside `<details>` element, collapsed by default; E2E `hero.spec.js` test 4 passes |
| NAV-01 | 06-01, 06-03 | Header layout clean and consistent across all pages | SATISFIED | NAV-01 E2E test verifies identical header structure on index, law, FAQ, glossar pages; screenshots confirm |
| NAV-02 | 06-01, 06-03 | FAQ and Glossar navigation links polished and well-integrated into header | SATISFIED | Nav links visible with no `hidden` class; `header-index.png` confirms placement |
| NAV-03 | 06-01, 06-03 | Navigation works on both desktop and mobile without crowding or misalignment | SATISFIED | `mobile-nav-links.png` shows FAQ/Glossar in header at 375px; NAV-03 E2E test confirms no horizontal overflow |

All 6 phase requirement IDs accounted for. No orphaned requirements.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | — | — | — | — |

No TODO/FIXME/placeholder comments, no empty implementations, no stub handlers found in phase-modified files.

---

## Human Verification Required

### 1. Hero Search Visual Prominence

**Test:** Open http://localhost:4173 and observe the homepage first impression
**Expected:** The hero search bar should feel like the dominant CTA — larger than header search, visually distinct green gradient background, centered
**Why human:** Subjective design quality assessment — "prominent" and "search-first" are experiential qualities. Screenshots confirmed by human reviewer in Plan 03 checkpoint.
**Note:** Human approved in Plan 03 Task 3 (checkpoint:human-verify gate). No additional human review needed.

---

## Implementation Notes

### Key Deviation: FAQ data source

The plan specified `data/llm/faq/curated-topics.json` as the data source for discovery chips, but the implementation loads `data/llm/faq/topics.json` instead. Both files exist with the same 15 topics, but `topics.json` (315KB) contains full enriched content while `curated-topics.json` (7KB) is a minimal index. The implementation choice of `topics.json` is correct and produces working discovery chips — this is a naming deviation that does not affect correctness.

### Pre-existing test failure

`glossar.spec.js` "LLM-06: inline tooltips for Fachbegriffe in legal text" fails because `data/llm/glossary/terms.json` does not exist. This failure is pre-existing (confirmed by testing on commit `9d0706d` before phase 06) and is out of scope for phase 06.

---

## Gaps Summary

No gaps. All observable truths verified. All artifacts substantive and wired. All key links connected. All 6 requirements satisfied. Build succeeds, E2E tests pass, visual screenshots approved by human in Plan 03.

---

_Verified: 2026-03-12T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
