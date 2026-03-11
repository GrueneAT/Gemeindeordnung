# Project Instructions

## Visual Review Protocol (MANDATORY)

After making UI changes (HTML templates, CSS, JavaScript interactions), you MUST:

### Step 1: Run tests and capture screenshots
```bash
npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium
```

### Step 2: Read screenshots and visually inspect
Use the Read tool on the relevant PNG files in `e2e/screenshots/`. You can see images — look at them critically.

**Desktop screenshots:**
- `browse-page-wien.png` — Page layout, header, footer
- `card-grid-index.png` — Index page card grid
- `search-results.png` — Search dropdown with results
- `search-empty.png` — Search empty state
- `search-filter-active.png` — Bundesland filter active
- `toc-collapsed.png` / `toc-expanded.png` — Table of contents
- `copy-link-tooltip.png` — Copy link tooltip
- `scroll-to-top-visible.png` — Scroll-to-top button
- `dropdown-nav-result.png` — Bundesland dropdown
- `anchor-highlight-active.png` — Anchor highlight
- `typography-law-text.png` — Typography and readability
- `search-highlight-target.png` — On-page search highlighting

**Mobile screenshots (375px):**
- `mobile-index.png` — Mobile index layout
- `mobile-law-page.png` — Mobile law page
- `search-mobile-overlay.png` — Mobile search overlay

### Step 3: Check for issues
Review each screenshot against this checklist:
- [ ] Layout correct — no overlapping elements, proper spacing, z-index correct
- [ ] Text renders with proper characters — umlauts (ö, ä, ü, ß) display correctly
- [ ] Gruene branding visible — correct Austrian logo, green colors
- [ ] Typography readable — proper contrast, line-height, max-width
- [ ] Mobile usable — no horizontal overflow, touch targets adequate
- [ ] Interactive states correct — tooltips, highlights, dropdowns positioned well
- [ ] Search UI polished — dropdown properly layered, results readable, filter chips aligned

### Step 4: Fix issues before committing
If something looks wrong in a screenshot, fix the code, re-run tests, re-read the screenshot. Do NOT commit until the visual result is acceptable.

## Testing

- **Unit tests (scripts):** `npm test` (vitest)
- **E2E tests (frontend):** `npx playwright test --config=e2e/playwright.config.js`
- **Quick check (desktop only):** `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
- **Full with Pagefind:** `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js`

## Tech Stack

- Vite 7, TailwindCSS v4 (CSS-first, no tailwind.config.js)
- Pagefind for client-side search (German stemming, `--force-language de`)
- Static site deployed to GitHub Pages
- ESM modules throughout
- Playwright for E2E testing
