# Project Instructions

## Visual Review Protocol

After making UI changes (HTML templates, CSS, JavaScript interactions), **always** run the E2E tests and visually review the screenshots:

```bash
npm run build && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium
```

Then **read the relevant screenshot files** to visually verify the result:

```
e2e/screenshots/browse-page-wien.png    # Page layout, header, footer
e2e/screenshots/card-grid-index.png     # Index page card grid
e2e/screenshots/toc-collapsed.png       # Table of contents collapsed
e2e/screenshots/toc-expanded.png        # Table of contents expanded
e2e/screenshots/copy-link-tooltip.png   # Copy link tooltip visible
e2e/screenshots/scroll-to-top-visible.png  # Scroll-to-top button
e2e/screenshots/dropdown-nav-result.png    # Dropdown navigation
e2e/screenshots/anchor-highlight-active.png # Anchor highlight animation
e2e/screenshots/mobile-index.png        # Mobile index layout (375px)
e2e/screenshots/mobile-law-page.png     # Mobile law page (375px)
e2e/screenshots/typography-law-text.png # Typography and readability
e2e/screenshots/accessibility-law-page.png # Accessibility check page
```

**Review checklist:**
- Layout looks correct (no overlapping elements, proper spacing)
- Gruene branding visible (green colors, logo)
- Text is readable (proper contrast, line-height)
- Mobile views are usable (no horizontal overflow)
- Interactive states captured correctly (tooltips, highlights)

If something looks wrong in a screenshot, fix the issue before committing.

## Testing

- **Unit tests (scripts):** `npm test` (vitest)
- **E2E tests (frontend):** `npx playwright test --config=e2e/playwright.config.js`
- **Quick check (desktop only):** `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`

## Tech Stack

- Vite 7, TailwindCSS v4 (CSS-first, no tailwind.config.js)
- Static site deployed to GitHub Pages
- ESM modules throughout
- Playwright for E2E testing
