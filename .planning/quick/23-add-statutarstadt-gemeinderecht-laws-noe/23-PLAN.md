---
phase: quick-23
plan: 23
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/config.js
  - scripts/generate-pages.js
  - scripts/fetch-laws.js
  - scripts/parse-laws.js
  - src/js/main.js
  - e2e/tests/dropdown-nav.spec.js
autonomous: false
requirements: [QUICK-23]

must_haves:
  truths:
    - "BL switcher groups laws by actual Bundesland with sub-items (GO + Stadtrechte per BL)"
    - "Index page card grid groups all laws under their parent Bundesland"
    - "NOeSTROG is fetched, parsed, and appears under Niederoesterreich in all views"
    - "Existing 23 laws still render correctly with no regressions"
  artifacts:
    - path: "scripts/config.js"
      provides: "Law registry with parentBundesland mapping and NOeSTROG entry"
    - path: "scripts/generate-pages.js"
      provides: "BL-grouped switcher and index page rendering"
  key_links:
    - from: "scripts/config.js"
      to: "scripts/generate-pages.js"
      via: "LAWS export with parentBundesland field"
      pattern: "parentBundesland|parent_bundesland"
---

<objective>
Restructure the law registry and UI to group all laws (Gemeindeordnungen, Stadtrechte, and new Organisationsgesetze) by their parent Bundesland. Add NOeSTROG as the first new Organisationsgesetz law. Redesign the BL switcher dropdown and index page card grid to show BL-grouped sub-categories.

Purpose: Users can navigate all laws for a given Bundesland together instead of mentally mapping Stadtrechte cities back to their parent BL.
Output: Restructured config, BL-grouped UI, NOeSTROG fetched and rendered.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@scripts/config.js
@scripts/generate-pages.js
@scripts/fetch-laws.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Restructure config.js with parentBundesland and add NOeSTROG</name>
  <files>scripts/config.js</files>
  <action>
1. Add a `parentBundesland` field to every Stadtrecht entry mapping it to the actual BL:
   - Eisenstadt, Rust -> "Burgenland"
   - Klagenfurt, Villach -> "Kaernten"
   - Krems, St. Poelten, Waidhofen, Wr. Neustadt -> "Niederoesterreich"
   - Linz, Steyr, Wels -> "Oberoesterreich"
   - Salzburg Stadt -> "Salzburg"
   - Graz -> "Steiermark"
   - Innsbruck -> "Tirol"

2. Add a third top-level category `organisationsgesetze` to LAWS with NOeSTROG as first entry:
   ```
   organisationsgesetze: {
     noestrog: {
       name: 'NOe. Statutarstadt-Organisationsgesetz (NOeSTROG)',
       abfrage: 'LrNO',
       gesetzesnummer: '20001325',
       url: risUrl('LrNO', '20001325'),
       category: 'organisationsgesetz',
       stadt: null,
       bundesland: 'Niederoesterreich',
       parentBundesland: 'Niederoesterreich',
     },
   }
   ```
   Note: The gesetzesnummer '20001325' needs verification -- look up the actual NOeSTROG on RIS before hardcoding. Search: https://www.ris.bka.gv.at for "NOe Statutarstadt-Organisationsgesetz" or "STROG" in LrNO. If the exact number cannot be confirmed, add a comment `// TODO: verify gesetzesnummer` and proceed.

3. Add `parentBundesland` to Gemeindeordnung entries too (same as `bundesland` for them, for uniform access).

4. Update CATEGORIES array to include 'organisationsgesetze'.

5. Add CATEGORY_LABELS entry: `organisationsgesetze: 'Organisationsgesetze'`.

6. Update the comment at the top to reflect the new count (24 laws).
  </action>
  <verify>
    <automated>node -e "import('./scripts/config.js').then(m => { const L = m.LAWS; console.log('GO:', Object.keys(L.gemeindeordnungen).length); console.log('SR:', Object.keys(L.stadtrechte).length); console.log('OG:', Object.keys(L.organisationsgesetze).length); const sr = L.stadtrechte.eisenstadt; console.log('parentBL:', sr.parentBundesland); if(sr.parentBundesland !== 'Burgenland') throw new Error('Missing parentBundesland'); console.log('OK'); })"</automated>
  </verify>
  <done>All Stadtrecht entries have correct parentBundesland, NOeSTROG entry exists in organisationsgesetze, CATEGORIES includes new category</done>
</task>

<task type="auto">
  <name>Task 2: Fetch, parse, and generate NOeSTROG; update BL-grouped UI</name>
  <files>scripts/generate-pages.js, scripts/fetch-laws.js, scripts/parse-laws.js, src/js/main.js, e2e/tests/dropdown-nav.spec.js</files>
  <action>
1. **Fetch and parse NOeSTROG:**
   - Run `node scripts/fetch-laws.js` to fetch all laws including the new NOeSTROG entry (or fetch just the new one manually if the script supports it).
   - Run `node scripts/parse-laws.js` to parse the fetched HTML.
   - Verify `data/parsed/organisationsgesetze/noestrog.json` exists.

2. **Update `buildBundeslandSwitcher()` in generate-pages.js:**
   Replace the current two-optgroup structure (Gemeindeordnungen / Stadtrechte) with a BL-grouped structure. Group by actual Bundesland, showing all laws for that BL:

   ```
   <optgroup label="Burgenland">
     <option value="../gemeindeordnungen/burgenland.html">Gemeindeordnung</option>
     <option value="../stadtrechte/eisenstadt.html">Eisenstadt (Stadtrecht)</option>
     <option value="../stadtrechte/rust.html">Rust (Stadtrecht)</option>
   </optgroup>
   <optgroup label="Niederoesterreich">
     <option value="../gemeindeordnungen/niederoesterreich.html">Gemeindeordnung</option>
     <option value="../stadtrechte/krems.html">Krems (Stadtrecht)</option>
     ...
     <option value="../organisationsgesetze/noestrog.html">NOeSTROG</option>
   </optgroup>
   ```

   Build this by iterating all three categories, collecting laws into a Map keyed by parentBundesland (or bundesland for GOs), then rendering optgroups. Sort BLs alphabetically. Within each BL group: GO first, then Stadtrechte alphabetically, then Organisationsgesetze.

3. **Update `buildHeroBundeslandSelect()` similarly:**
   Same BL-grouped optgroup structure for the hero search filter.

4. **Update `generateIndexPage()` card grid:**
   Instead of grouping by category (Gemeindeordnungen section, Stadtrechte section), group by Bundesland. Each BL section shows its GO card plus any Stadtrecht/OG cards. Use the BL name as section heading. Keep the collapsible `<details>` wrapper.

5. **Update `generatePages()` function:**
   - Add 'organisationsgesetze' to the CATEGORIES array loop.
   - Ensure `src/organisationsgesetze/` directory is created.

6. **Run `node scripts/generate-pages.js`** to regenerate all pages.

7. **Update E2E tests in `e2e/tests/dropdown-nav.spec.js`:**
   - Update test expectations to match new BL-grouped optgroup structure (optgroups are now BL names, not category names).
   - Add test that NOeSTROG appears in the Niederoesterreich optgroup.
   - Ensure existing dropdown navigation tests still pass with new structure.

8. **Update `src/js/main.js`** if it has any hardcoded references to the old optgroup labels "Gemeindeordnungen" / "Stadtrechte". Search for these strings and update to work with BL-grouped optgroups.

9. **Run full build and tests:**
   ```
   npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium
   ```
  </action>
  <verify>
    <automated>npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium</automated>
  </verify>
  <done>NOeSTROG page renders at src/organisationsgesetze/noestrog.html, BL switcher shows BL-grouped optgroups, index page groups laws by BL, all E2E tests pass</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>BL-grouped law navigation with NOeSTROG as new Organisationsgesetz under Niederoesterreich</what-built>
  <how-to-verify>
    1. Open the index page -- verify laws are grouped by Bundesland (not by category)
    2. Open any law page -- verify BL switcher dropdown shows optgroups by BL name (Burgenland, Kaernten, etc.) with sub-items
    3. Navigate to the NOeSTROG page via the switcher -- verify it renders correctly
    4. Check mobile layout at 375px -- verify dropdown is usable
    5. Use search to find content in NOeSTROG -- verify it appears in search results
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- All 24 laws render (9 GO + 14 Stadtrechte + 1 Organisationsgesetz)
- BL switcher groups by Bundesland with sub-items per BL
- Index page shows BL-grouped card grid
- NOeSTROG accessible at /organisationsgesetze/noestrog.html
- Pagefind indexes NOeSTROG content
- All existing E2E tests pass
- Visual review protocol passes for affected screenshots
</verification>

<success_criteria>
- BL switcher shows 9 BL optgroups (Wien has only GO, Burgenland has GO + 2 Stadtrechte, etc.)
- NOeSTROG page loads with parsed law text, TOC, and search
- No regressions in existing law pages
- E2E tests updated and passing
</success_criteria>

<output>
After completion, create `.planning/quick/23-add-statutarstadt-gemeinderecht-laws-noe/23-SUMMARY.md`
</output>
