---
phase: quick-9
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-pages.js
  - src/js/search.js
  - src/css/main.css
  - e2e/tests/hero-section.spec.js
autonomous: true
requirements: [BL-PILLS, FAQ-LAYOUT]
must_haves:
  truths:
    - "First-time visitor sees all 9 Bundesland pills below hero search bar and can select one before searching"
    - "Selected BL pill is visually active and filters search results to that BL"
    - "FAQ and Glossar discovery sections use full page width efficiently with compact chip layout"
    - "User can easily switch between Bundeslaender by clicking a different pill"
    - "Alle Bundeslaender pill allows searching across all BLs"
  artifacts:
    - path: "scripts/generate-pages.js"
      provides: "BL selector pills in hero section, compact FAQ/Glossar layout"
    - path: "src/js/search.js"
      provides: "BL pill selection logic with localStorage persistence"
    - path: "src/css/main.css"
      provides: "BL pill styles and compact discovery section styles"
  key_links:
    - from: "scripts/generate-pages.js"
      to: "src/js/search.js"
      via: "BL pill data-bl attributes wired to search filter logic"
      pattern: "data-bl="
---

<objective>
Add Bundesland selector pills below the hero search bar so first-time visitors can immediately filter by their BL, and improve FAQ/Glossar discovery section layout to use page width more efficiently.

Purpose: First-time users currently cannot select a BL without first visiting a law page. The filter chips only show "Alle Bundeslaender" or a previously-saved BL. This makes initial search frustrating. Also, the FAQ/Glossar discovery sections waste horizontal space.

Output: Updated index page with BL pills, improved discovery layout, updated E2E tests.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js (index page generation, hero section template)
@src/js/search.js (search filter chips, BL selection, localStorage persistence)
@src/css/main.css (search chip styles, discovery chip styles, hero section styles)
@scripts/config.js (LAWS registry with all 9 BLs)
@e2e/tests/hero-section.spec.js (existing hero section E2E tests)

<interfaces>
From src/js/search.js:
```javascript
// Current filter chip rendering — only shows saved BL or "Alle"
function renderFilterChips() // renders into searchChips element
function saveBundesland(bl) // persists to localStorage
function getSavedBundesland() // reads from localStorage
let activeBundesland = null; // current filter state
```

From scripts/generate-pages.js:
```javascript
// Hero section contains:
// - #hero-search-input (search input)
// - #hero-search-chips (filter chips container — currently empty until renderFilterChips)
// - #hero-search-dropdown (results dropdown)

// Discovery section uses grid grid-cols-1 sm:grid-cols-2 with FAQ and Glossar columns
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add BL selector pills to hero section and update search filter logic</name>
  <files>scripts/generate-pages.js, src/js/search.js, src/css/main.css</files>
  <action>
**In `scripts/generate-pages.js` — Hero section (generateIndexPage function):**

1. Extract all unique Bundesland values from the LAWS config (already imported). Build a sorted list of the 9 BLs: Burgenland, Kaernten, Niederoesterreich, Oberoesterreich, Salzburg, Steiermark, Tirol, Vorarlberg, Wien.

2. Replace the empty `#hero-search-chips` div with a pre-rendered BL selector section containing:
   - A row of compact pills for each of the 9 BLs plus an "Alle" option
   - Each pill: `<button class="bl-selector-pill" data-bl="Wien">Wien</button>` etc.
   - The "Alle" pill should be first: `<button class="bl-selector-pill bl-pill-active" data-bl="">Alle</button>`
   - Wrap in: `<div id="hero-search-chips" class="bl-selector-container mt-3 flex flex-wrap justify-center gap-1.5"></div>`
   - Also render these same pills into `#search-chips` in the header search container (so they appear when hero scrolls out)

3. Update the discovery section layout — change from `grid grid-cols-1 sm:grid-cols-2 gap-8` to a more compact single-column flow layout:
   - Use a single container with both FAQ and Glossar chips flowing together
   - Add section labels inline (not as h2 headings — use smaller, lighter labels like `<span class="text-sm font-semibold text-gruene-dark/60 uppercase tracking-wide mr-2">Haeufige Fragen</span>`)
   - Both FAQ and Glossar chips should flow in the same `flex flex-wrap` container, separated by their inline labels
   - This eliminates the two-column grid that wastes space when one column is shorter

**In `src/js/search.js` — renderFilterChips function:**

4. Completely rewrite `renderFilterChips()` to render all 9 BL pills plus "Alle":
   - On index page (heroActive=true): BL pills are pre-rendered in HTML, so just wire up click handlers and update active states
   - On law pages: render the full set of BL pills dynamically (same as before but with all BLs)
   - Active pill gets class `bl-pill-active`, others get `bl-pill-inactive`
   - When a pill is clicked: set `activeBundesland`, call `saveBundesland(bl)`, update pill active states, trigger search if query >= 3 chars
   - On init: check `getSavedBundesland()` and auto-activate the matching pill
   - Keep the existing pattern where header chips also work when hero scrolls out

5. Update `initSearch()` to handle pre-rendered BL pills:
   - On index page, find all `.bl-selector-pill` buttons in hero-search-chips and attach click handlers
   - Also attach handlers on header-search-chips pills
   - Set initial active state based on `getSavedBundesland()` or "Alle"

**In `src/css/main.css`:**

6. Add BL selector pill styles:
```css
.bl-selector-container {
  /* container styles handled by Tailwind classes */
}

.bl-selector-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.8125rem;
  cursor: pointer;
  border: 1px solid;
  transition: all 0.15s;
  white-space: nowrap;
}

.bl-pill-active {
  background-color: var(--color-gruene-dark);
  color: white;
  border-color: var(--color-gruene-dark);
}

.bl-pill-inactive {
  background-color: white;
  color: var(--color-gruene-dark);
  border-color: #d1d5db;
}

.bl-pill-inactive:hover {
  border-color: var(--color-gruene-green);
  background-color: var(--color-gruene-light);
}
```

7. Update discovery section styles for compact inline flow:
```css
.discovery-section-compact {
  /* Compact flow layout for FAQ + Glossar chips */
}
.discovery-label {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-gruene-dark);
  opacity: 0.6;
  margin-right: 0.5rem;
  white-space: nowrap;
}
```

Make the discovery chips slightly smaller (padding: 0.375rem 0.875rem) to be more compact.

**Important constraints:**
- Keep the existing `search-chip` styles for backward compatibility on law pages (non-index pages still use the old chip pattern)
- The BL pills must work on BOTH hero search and header search (when hero scrolls out of view)
- The mobile overlay search should also show BL pills
- Preserve localStorage persistence behavior
  </action>
  <verify>
    <automated>npm run build && node -e "const fs=require('fs'); const html=fs.readFileSync('dist/index.html','utf8'); const has9=html.match(/bl-selector-pill/g)?.length >= 10; const hasCompact=html.includes('discovery-label'); console.log('BL pills:', has9, 'Compact discovery:', hasCompact); if(!has9||!hasCompact) process.exit(1);"</automated>
  </verify>
  <done>Index page has all 9 BL pills plus "Alle" below search bar; clicking a pill filters search and persists selection; FAQ/Glossar section uses compact full-width layout</done>
</task>

<task type="auto">
  <name>Task 2: Update E2E tests and run visual review</name>
  <files>e2e/tests/hero-section.spec.js</files>
  <action>
1. Update `e2e/tests/hero-section.spec.js` to add tests for BL selector pills:
   - Test that all 9 BL pills plus "Alle" are visible on the index page
   - Test that clicking a BL pill adds the `bl-pill-active` class and removes it from others
   - Test that the "Alle" pill is active by default
   - Update existing hero screenshot test to capture the new BL pills layout
   - Add a screenshot `bl-selector-pills.png` showing the pill row

2. Update the hero-search screenshot test to verify the new compact discovery layout is captured

3. Run the full visual review protocol:
   - `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
   - Read and visually inspect all relevant screenshots (hero-search.png, mobile-hero.png, discovery-links.png, mobile-index.png)
   - Fix any layout issues, overflow, or spacing problems
   - Verify BL pills wrap properly on mobile (375px)
   - Verify discovery section uses width efficiently

4. Run mobile tests too:
   - `npx playwright test --config=e2e/playwright.config.js --project=mobile-safari`
   - Ensure BL pills are scrollable or wrap nicely on 375px width
   - Verify no horizontal overflow
  </action>
  <verify>
    <automated>npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js</automated>
  </verify>
  <done>All E2E tests pass including new BL pill tests; visual review confirms proper layout on desktop and mobile; no regressions in existing screenshots</done>
</task>

</tasks>

<verification>
- Build completes without errors: `npm run build`
- All E2E tests pass: `npx playwright test --config=e2e/playwright.config.js`
- Visual review: all screenshots pass checklist (layout, branding, mobile, typography)
- BL pills visible and functional on index page
- FAQ/Glossar discovery section uses full width
</verification>

<success_criteria>
- First-time visitor sees 9 BL pills + "Alle" below search bar on index page
- Clicking a BL pill immediately filters subsequent searches to that BL
- Selected BL persists in localStorage across page loads
- FAQ and Glossar discovery chips use full page width in compact layout
- No horizontal overflow on mobile (375px)
- All existing E2E tests continue to pass
</success_criteria>

<output>
After completion, create `.planning/quick/9-bl-selector-pills-and-faq-layout-improve/9-SUMMARY.md`
</output>
