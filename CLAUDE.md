# Project Instructions

## Visual Review Protocol (MANDATORY)

**Trigger:** Any plan that modifies HTML templates (`scripts/generate-pages.js`), CSS (`src/css/main.css`), JavaScript (`src/js/main.js`, `src/js/search.js`), or assets (`src/assets/`) MUST follow this protocol. Do NOT commit until all screenshots pass visual review.

### Step 1: Build, index, and capture screenshots
```bash
npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium
```

### Step 2: Read screenshots and visually inspect
Use the Read tool on the relevant PNG files in `e2e/screenshots/`. You MUST visually inspect each screenshot -- look critically for regressions.

**Desktop -- Layout & Branding:**
- `card-grid-index.png` -- Index page card grid, header with arrow-G logo
- `browse-page-wien.png` -- Law page layout, header, footer
- `scroll-to-top-visible.png` -- Scroll-to-top button position
- `scroll-to-top-hidden.png` -- Scroll-to-top hidden state

**Desktop -- Search:**
- `search-results.png` -- Search dropdown with results
- `search-empty.png` -- Search empty state
- `search-filter-active.png` -- Bundesland filter active
- `search-filter-all.png` -- All-filter state
- `search-count.png` -- Result count display
- `search-highlight-target.png` -- On-page search highlighting

**Desktop -- Unified Search:**
- `unified-search-panel.png` -- Expanded panel with grouped results
- `unified-search-grouped.png` -- Content-type groups with badges and counts
- `unified-search-bl-filter.png` -- BL filter active with filter note

**Desktop -- Interactive States:**
- `toc-collapsed.png` / `toc-expanded.png` -- Table of contents
- `copy-link-tooltip.png` -- Copy link tooltip
- `dropdown-nav-result.png` -- Bundesland dropdown navigation
- `anchor-highlight-active.png` -- Anchor highlight on navigation
- `anchor-highlight-faded.png` -- Anchor highlight fade-out

**Desktop -- LLM Enrichment:**
- `llm-summary-expanded.png` -- LLM summary section expanded
- `llm-disclaimer.png` -- LLM disclaimer display
- `topic-filter-chips.png` -- Topic filter chip display
- `topic-filter-active.png` -- Active topic filter state
- `topic-filter-reset.png` -- Topic filter reset state

**Desktop -- Content Pages:**
- `faq-index.png` -- FAQ index page
- `faq-topic-page.png` -- FAQ topic detail page
- `glossar-page.png` -- Glossar overview page
- `glossar-tooltip.png` -- Glossar tooltip on hover

**Desktop -- Accessibility & Typography:**
- `accessibility-index.png` -- Accessibility on index page
- `accessibility-law-page.png` -- Accessibility on law page
- `typography-law-text.png` -- Typography and readability

**Mobile (375px):**
- `mobile-index.png` -- Mobile index layout
- `mobile-law-page.png` -- Mobile law page
- `search-mobile-overlay.png` -- Mobile search overlay
- `unified-search-mobile.png` -- Mobile overlay with grouped results

### Step 3: Check each screenshot against this checklist
You MUST verify every applicable dimension. Fail any screenshot that does not pass.

- [ ] **Layout** -- No overlapping elements, proper spacing, correct z-index layering
- [ ] **Branding** -- Austrian Gruene arrow-G logo visible, green colors match CI (#6BA539)
- [ ] **Typography** -- WCAG AA contrast (4.5:1 min), line-height 1.6+, max-width ~70ch for body text
- [ ] **Text rendering** -- German umlauts (oe, ae, ue, ss) display correctly, no ASCII-safe spellings in UI
- [ ] **Mobile** -- No horizontal overflow, touch targets >= 44px, readable without zoom
- [ ] **Interactive states** -- Tooltips, highlights, dropdowns positioned correctly and not clipped
- [ ] **Search UI** -- Dropdown properly layered above content, results readable, filter chips aligned

### Step 4: Fix issues before committing
If any screenshot fails a checklist item: fix the code, re-run Step 1, re-read the screenshot. Repeat until all pass. Do NOT commit until the visual result is acceptable.

## Testing

- **Unit tests (scripts):** `npm test` (vitest)
- **E2E tests (frontend):** `npx playwright test --config=e2e/playwright.config.js`
- **Quick check (desktop only):** `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
- **Full with Pagefind:** `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js`

### E2E Test Coverage (MANDATORY for new features)

**Every plan that adds or changes user-facing functionality MUST include E2E tests.** This is not optional.

1. **New features need new test specs** in `e2e/tests/`. If you add a search results panel, there must be a test that verifies it renders correctly with results grouped by type. If you add a hero section, there must be a test that verifies the hero layout, search input, and discovery links.
2. **New screenshots for new UI elements.** Any new visual element must have a corresponding screenshot captured in the E2E tests and listed in the Visual Review Protocol screenshot list above.
3. **No regressions.** All existing E2E tests must continue to pass. Run the full suite before committing.
4. **Mobile coverage.** Any feature that affects layout must be tested at 375px viewport width.

Failing to include E2E tests for new functionality is a blocking issue -- fix it before committing.

## Tech Stack

- Vite 7, TailwindCSS v4 (CSS-first, no tailwind.config.js)
- Pagefind for client-side search (German stemming, `--force-language de`)
- Static site deployed to GitHub Pages
- ESM modules throughout
- Playwright for E2E testing
