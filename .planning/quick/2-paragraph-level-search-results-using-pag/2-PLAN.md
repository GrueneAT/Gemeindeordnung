---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-pages.js
  - src/js/search.js
  - src/css/main.css
  - e2e/tests/search.spec.js
  - e2e/tests/search-highlight.spec.js
autonomous: true
requirements: [QUICK-2]

must_haves:
  truths:
    - "Search results show individual paragraphs, not just page-level matches"
    - "Results are grouped by law name with Treffer count"
    - "Clicking a paragraph result navigates directly to that paragraph anchor"
    - "Stadtrecht badge still appears on Stadtrecht results"
  artifacts:
    - path: "scripts/generate-pages.js"
      provides: "h3 elements with id attributes for Pagefind sub_results"
      contains: "id=\"p${escapeHtml(para.nummer)}\""
    - path: "src/js/search.js"
      provides: "Sub-result rendering grouped by law"
      contains: "sub_results"
    - path: "src/css/main.css"
      provides: "Styling for law-level grouping and indented paragraph results"
      contains: "search-law-heading"
  key_links:
    - from: "scripts/generate-pages.js"
      to: "Pagefind indexer"
      via: "h3 id attributes create sub_results entries"
      pattern: "<h3.*id=\"p"
    - from: "src/js/search.js"
      to: "Pagefind sub_results API"
      via: "iterating result.sub_results instead of page-level excerpt"
      pattern: "sub_results"
---

<objective>
Show paragraph-level search results grouped by law instead of page-level results. Each matching paragraph appears as a separate clickable result with its section number, title, and excerpt. Clicking navigates directly to that paragraph.

Purpose: Users searching for a term like "Initiativantrag" currently see 2 page-level results. After this change they will see individual paragraph matches (e.g., "ss 16a Verfahren des Initiativantrages") grouped under each law name with Treffer counts.

Output: Updated page generator, search renderer, CSS styles, and E2E tests.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js
@src/js/search.js
@src/css/main.css
@e2e/tests/search.spec.js
@e2e/tests/search-highlight.spec.js

<interfaces>
<!-- Current renderParagraph generates article with id but h3 has no id -->
From scripts/generate-pages.js line 63:
```html
<article class="mb-6 group" id="p${escapeHtml(para.nummer)}">
  <h3 class="text-lg font-semibold text-gruene-dark flex items-center gap-2">
```
<!-- h3 needs id="p${nummer}" added so Pagefind creates sub_results at paragraph level -->

From src/js/search.js:
```javascript
// renderResultItem() renders page-level results
// renderGroupedResults() groups by Bundesland
// renderResults() is the main entry point, uses above functions
// executeSearch() returns { totalCount, results (loaded data), hasMore, allResults }
// Each loaded result has: .meta.title, .url, .excerpt, .filters, .sub_results[]
// Each sub_result has: .title, .url, .excerpt, .anchor
```

From src/css/main.css:
```css
.search-group-heading { /* BL group heading - uppercase, gray bg */ }
.search-result-item { /* clickable result link */ }
.search-result-title { /* bold title with flex for badge */ }
.search-result-excerpt { /* gray excerpt text */ }
.search-badge-stadtrecht { /* pill badge for Stadtrecht */ }
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add id to h3 elements and rewrite search rendering for sub_results</name>
  <files>scripts/generate-pages.js, src/js/search.js, src/css/main.css</files>
  <action>
**generate-pages.js** -- In `renderParagraph()`, add `id="p${escapeHtml(para.nummer)}"` to the `<h3>` element. The article already has the same id, so this is a duplicate id on the same page. To avoid duplicate IDs (which is invalid HTML and may confuse Pagefind), change the approach: keep the `id` on the `<h3>` element only, and use a `data-paragraph="p${nummer}"` attribute on the `<article>` element instead. Then update anchor-highlight.js and copy-link.js if they rely on `article#p{nummer}` -- check first whether they use `getElementById` or `querySelector('[id="..."]')`. Actually, since the pre-research says "Keep id on article too (used by anchor-highlight and copy-link)", keep BOTH: article keeps `id="p${nummer}"`, and add a SEPARATE attribute to h3. Pagefind needs the h3 to have an `id` to generate a sub_result. Use `id="p${nummer}"` on the h3 and `id="p${nummer}"` on the article -- but that creates duplicate IDs. Resolution: Move the id to h3, and on article use `data-anchor="p${nummer}"`. Then update any JS that finds elements by paragraph id. Check `src/js/anchor-highlight.js` and `src/js/copy-link.js` for how they find paragraph elements.

SIMPLER APPROACH (preferred): Add `id="p${escapeHtml(para.nummer)}"` to the h3 and REMOVE it from the article. Update anchor-highlight and copy-link to find elements via `closest('article')` from the h3, or query by `[data-copy-link]` attribute which already exists. Check those JS files first to determine impact.

If anchor-highlight and copy-link already work via other selectors (data attributes, hash-based querySelector), just move the id from article to h3 directly.

**search.js** -- Replace the current page-level result rendering with sub_result-based rendering:

1. Add a new function `renderLawGroup(lawTitle, subResults, query, isStadtrecht)`:
   - Renders a law-level heading: `<div class="search-law-heading">{lawTitle} <span class="search-law-count">({N} Treffer)</span></div>`
   - Add Stadtrecht badge to law heading if applicable
   - Under it, renders each sub_result as an indented item with:
     - Title from `sub.title` (will be "ss {nummer} {titel}")
     - Excerpt from `sub.excerpt`
     - Link URL from `sub.url` (Pagefind already includes highlight param and anchor)

2. Modify `renderResults()` and the "show all" handler:
   - For each loaded result, access `result.sub_results` array
   - If sub_results exist and length > 0: group and render as law group
   - If sub_results is empty or missing: fall back to current page-level rendering
   - Count total sub_results across all results for the header count

3. Modify `renderGroupedResults()`:
   - Currently groups by Bundesland. Now within each BL group, render law groups with sub_results
   - BL heading stays as-is (uppercase, count = total sub_results in that BL)
   - Under each BL heading, render law groups

4. Keep `renderResultItem()` as fallback for results without sub_results.

**main.css** -- Add styles:
```css
.search-law-heading {
  font-weight: 600;
  font-size: 0.8125rem;
  color: var(--color-gruene-dark);
  padding: 0.375rem 0.75rem;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.search-law-count {
  font-weight: 400;
  color: #6b7280;
}

/* Indent paragraph results under law heading */
.search-sub-result {
  padding-left: 1.25rem;
}
```

The `.search-sub-result` class goes on the result item anchor elements that are sub-results, adding left indent to visually nest them under the law heading.
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium -g "SUCH-01"</automated>
  </verify>
  <done>
  - h3 elements have id attributes, Pagefind generates paragraph-level sub_results
  - Search results render grouped by law with individual paragraph results
  - Each paragraph result links directly to the paragraph anchor with highlight param
  - Stadtrecht badge appears on Stadtrecht law headings
  - Fallback works for results without sub_results
  </done>
</task>

<task type="auto">
  <name>Task 2: Update E2E tests and verify screenshots</name>
  <files>e2e/tests/search.spec.js, e2e/tests/search-highlight.spec.js</files>
  <action>
**search.spec.js** -- Update tests to reflect new sub_result rendering:

1. SUCH-01 test: Update selector expectations. Results are now `.search-sub-result` items nested under `.search-law-heading` elements. Assert that at least one `.search-law-heading` is visible and at least one `.search-sub-result` item exists.

2. SUCH-02 test: Update to look for `mark` tags within `.search-sub-result` items (previously `.search-result-item`).

3. SUCH-03 test: Update excerpt selector to `.search-sub-result .search-result-excerpt`.

4. SUCH-06 test: Count header should still show total count. If sub_results change the count (now counting paragraphs not pages), update the expected pattern. The count should reflect total paragraph-level matches.

5. Add new test `SUCH-10: results grouped by law with paragraph sub-results`:
   - Search for "Initiativantrag"
   - Wait for results
   - Assert `.search-law-heading` elements are visible
   - Assert law headings contain Treffer count in parentheses
   - Assert `.search-sub-result` items exist with paragraph titles (containing "ss")
   - Screenshot: `e2e/screenshots/search-results.png`

**search-highlight.spec.js** -- Update click-through test:
   - The first clickable result is now `.search-sub-result` (not `.search-result-item` at top level, unless fallback)
   - Update the selector to click a `.search-sub-result` link or `.search-result-item` (whichever appears first)
   - After clicking, verify URL contains both `highlight=` and a `#p` anchor fragment
   - Verify the target paragraph's h3 is in or near viewport

Run full test suite and capture all screenshots. Read screenshots to verify:
- Search results show law-level groupings with paragraph results indented
- Paragraph titles show section numbers
- Excerpts display under each paragraph result
- Layout is clean, no overlapping, proper spacing
  </action>
  <verify>
    <automated>cd /root/workspace && npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium</automated>
  </verify>
  <done>
  - All E2E tests pass with updated selectors
  - New SUCH-10 test verifies law grouping and paragraph sub-results
  - search-highlight test verifies paragraph-level click-through with anchor
  - Screenshots visually confirm grouped layout with indented paragraph results
  </done>
</task>

</tasks>

<verification>
- `npm run build && npx pagefind --site dist --force-language de` succeeds
- `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium` all pass
- Search for "Initiativantrag" shows individual paragraph results grouped under law names
- Clicking a paragraph result navigates to the correct anchor on the law page
- Visual review of screenshots confirms clean layout
</verification>

<success_criteria>
- Searching shows paragraph-level results grouped by law (not page-level)
- Each result shows paragraph number, title, and excerpt
- Clicking navigates to exact paragraph with highlight
- Stadtrecht badge visible on Stadtrecht results
- All existing and new E2E tests pass
- Screenshots reviewed and visually acceptable
</success_criteria>

<output>
After completion, create `.planning/quick/2-paragraph-level-search-results-using-pag/2-01-SUMMARY.md`
</output>
