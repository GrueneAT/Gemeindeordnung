---
phase: quick-7
plan: 1
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-pages.js
  - src/js/main.js
  - src/css/main.css
  - e2e/tests/topic-filter.spec.js
autonomous: false
must_haves:
  truths:
    - "Law page shows a compact search input instead of 200+ inline chips"
    - "Typing in the input filters topics in a dropdown with checkboxes and paragraph counts"
    - "Multiple topics can be selected simultaneously (multi-select with OR logic)"
    - "Selected topics appear as small removable chips below the input"
    - "Clicking outside or pressing Escape closes the dropdown"
    - "Reset link clears all selections and shows all paragraphs"
  artifacts:
    - path: "scripts/generate-pages.js"
      provides: "Tag-select HTML structure replacing inline chips"
    - path: "src/js/main.js"
      provides: "Tag-select interaction logic with search, multi-select, dropdown"
    - path: "src/css/main.css"
      provides: "Styles for tag-select component"
    - path: "e2e/tests/topic-filter.spec.js"
      provides: "Updated E2E tests for new tag-select UI"
  key_links:
    - from: "scripts/generate-pages.js"
      to: "src/js/main.js"
      via: "DOM structure: #topic-filter container with data attributes"
    - from: "src/js/main.js"
      to: "article[data-topics]"
      via: "OR-based filtering using selected topics set"
---

<objective>
Replace the 200+ inline topic filter chips on law pages with a compact searchable tag-select component supporting multi-select with OR filtering.

Purpose: The current chip grid takes enormous vertical space and is hard to navigate. A searchable dropdown with multi-select is far more usable.
Output: Updated generate-pages.js, main.js, main.css, and E2E tests.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js (lines 405-423 — topic chip HTML generation)
@src/js/main.js (lines 122-158 — initTopicFilter function)
@src/css/main.css (lines 290-318 — topic chip styles)
@e2e/tests/topic-filter.spec.js (existing tests to update)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build searchable tag-select component (HTML + CSS + JS)</name>
  <files>scripts/generate-pages.js, src/js/main.js, src/css/main.css</files>
  <action>
**In `scripts/generate-pages.js` (lines 405-423):** Replace the topic chip generation block. Instead of rendering N buttons in a flex-wrap div, generate this HTML structure:

```html
<div id="topic-filter" class="mb-4 relative" data-pagefind-ignore>
  <div class="topic-select-container">
    <input type="text" id="topic-search-input" class="topic-search-input" placeholder="Themen filtern..." autocomplete="off" />
  </div>
  <div id="topic-dropdown" class="topic-dropdown hidden">
    <!-- JS will populate options dynamically -->
  </div>
  <div id="topic-selected-chips" class="topic-selected-chips hidden">
    <!-- JS will populate selected chips -->
  </div>
</div>
```

Also embed the full topic list as a JSON data attribute on `#topic-filter` so JS can build the dropdown. Compute paragraph counts per topic during generation:

```js
const topicCounts = {};
for (const pData of Object.values(llmData.paragraphs)) {
  if (pData.topics) {
    pData.topics.forEach(t => {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
    });
  }
}
const sortedTopics = [...allTopics].sort((a, b) => a.localeCompare(b, 'de'));
const topicData = sortedTopics.map(t => ({ name: t, count: topicCounts[t] || 0 }));
```

Set `data-topics-json="${escapeHtml(JSON.stringify(topicData))}"` on the `#topic-filter` div.

**In `src/css/main.css` (lines 290-318):** Replace the topic chip styles with new tag-select styles. Remove `.topic-chip`, `.topic-chip-active`, `.topic-chip-inactive` classes. Add:

- `.topic-search-input`: Full-width input, border rounded-lg, padding 0.5rem 0.75rem, border-gray-300, focus:border-gruene-green, focus:ring. Prefix with a magnifying glass via background-image or a pseudo-element (use a simple SVG data URI for the search icon, 16px, left-padded).
- `.topic-dropdown`: Absolute positioned below input, full-width, bg-white, border, rounded-lg, shadow-lg, max-height 16rem (256px), overflow-y auto, z-index 50. Each item is a label with checkbox, topic name, and count in parentheses (text-gray-400). Items have hover:bg-gruene-light. Checked items have a subtle gruene-light background.
- `.topic-selected-chips`: Flex wrap gap-2 mt-2. Each chip is inline-flex with gruene-dark bg, white text, rounded-full, px-3 py-1, text-sm. The x button is a small span with cursor-pointer and hover opacity.
- `.topic-reset-link`: Text-sm, text-gruene-link, underline, cursor-pointer, hover text-gruene-link-hover. Displayed inline after the chips.
- `.hidden` utility (if not already from Tailwind): display none.

**In `src/js/main.js` (lines 122-158):** Replace `initTopicFilter()` entirely with the new tag-select logic:

```js
function initTopicFilter() {
  const filterContainer = document.getElementById('topic-filter');
  if (!filterContainer) return;

  const topicDataJson = filterContainer.dataset.topicsJson;
  if (!topicDataJson) return;
  const topics = JSON.parse(topicDataJson);

  const input = document.getElementById('topic-search-input');
  const dropdown = document.getElementById('topic-dropdown');
  const chipsContainer = document.getElementById('topic-selected-chips');
  const selectedTopics = new Set();

  // Render dropdown items
  function renderDropdown(filter = '') {
    const filtered = filter
      ? topics.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()))
      : topics;
    dropdown.innerHTML = filtered.map(t => `
      <label class="topic-dropdown-item">
        <input type="checkbox" value="${t.name}" ${selectedTopics.has(t.name) ? 'checked' : ''} />
        <span class="topic-dropdown-name">${t.name}</span>
        <span class="topic-dropdown-count">(${t.count})</span>
      </label>
    `).join('');
  }

  // Render selected chips
  function renderChips() {
    if (selectedTopics.size === 0) {
      chipsContainer.classList.add('hidden');
      return;
    }
    chipsContainer.classList.remove('hidden');
    const chips = [...selectedTopics].map(t =>
      `<span class="topic-selected-chip" data-topic="${t}">${t} <span class="topic-chip-remove">&times;</span></span>`
    ).join('');
    chipsContainer.innerHTML = chips + ' <button class="topic-reset-link">Alle zurücksetzen</button>';
  }

  // Apply OR filter to paragraphs
  function applyFilter() {
    document.querySelectorAll('article[data-topics]').forEach(article => {
      if (selectedTopics.size === 0) {
        article.style.display = '';
      } else {
        const articleTopics = article.dataset.topics.split(',');
        const match = articleTopics.some(t => selectedTopics.has(t));
        article.style.display = match ? '' : 'none';
      }
    });
    // Hide/show sections
    document.querySelectorAll('main section').forEach(section => {
      const articles = section.querySelectorAll('article[data-topics]');
      if (articles.length === 0) return;
      const allHidden = Array.from(articles).every(a => a.style.display === 'none');
      section.style.display = allHidden ? 'none' : '';
    });
  }

  // Event: input focus opens dropdown
  input.addEventListener('focus', () => {
    renderDropdown(input.value);
    dropdown.classList.remove('hidden');
  });

  // Event: input typing filters dropdown
  input.addEventListener('input', () => {
    renderDropdown(input.value);
    dropdown.classList.remove('hidden');
  });

  // Event: checkbox change in dropdown
  dropdown.addEventListener('change', (e) => {
    const checkbox = e.target;
    if (checkbox.type !== 'checkbox') return;
    if (checkbox.checked) {
      selectedTopics.add(checkbox.value);
    } else {
      selectedTopics.delete(checkbox.value);
    }
    renderChips();
    applyFilter();
  });

  // Event: remove chip
  chipsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.topic-chip-remove');
    if (removeBtn) {
      const chip = removeBtn.closest('.topic-selected-chip');
      selectedTopics.delete(chip.dataset.topic);
      renderChips();
      renderDropdown(input.value);
      applyFilter();
      return;
    }
    const resetBtn = e.target.closest('.topic-reset-link');
    if (resetBtn) {
      selectedTopics.clear();
      input.value = '';
      renderChips();
      renderDropdown();
      applyFilter();
    }
  });

  // Event: click outside closes dropdown
  document.addEventListener('click', (e) => {
    if (!filterContainer.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });

  // Event: Escape closes dropdown
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
      input.blur();
    }
  });
}
```

Important implementation notes:
- Do NOT add any external libraries. Pure vanilla JS + Tailwind/CSS.
- Keep the same `data-topics` attribute system on `article` elements (no changes to paragraph HTML).
- The `#topic-filter` div ID must remain the same for E2E test compatibility.
- Escape HTML in topic names when building dropdown items (use the same escapeHtml pattern as generate-pages.js, or build DOM elements directly in JS to avoid XSS).
- The dropdown should use `position: absolute` relative to the `#topic-filter` container which has `position: relative`.
  </action>
  <verify>
    <automated>npm run build && node -e "const fs=require('fs'); const html=fs.readFileSync('dist/src/gemeindeordnungen/wien.html','utf8'); const hasInput=html.includes('topic-search-input'); const hasDropdown=html.includes('topic-dropdown'); const hasJson=html.includes('data-topics-json'); const noOldChips=!html.includes('topic-chip-inactive'); console.log({hasInput,hasDropdown,hasJson,noOldChips}); if(!hasInput||!hasDropdown||!hasJson||!noOldChips) process.exit(1);"</automated>
  </verify>
  <done>Law pages render the new tag-select HTML structure with search input, dropdown container, and embedded topic JSON data. Old inline chip buttons are gone. CSS styles support the new component. JS handles search filtering, multi-select, chip rendering, OR-based paragraph filtering, click-outside close, and Escape key.</done>
</task>

<task type="auto">
  <name>Task 2: Update E2E tests for new tag-select UI</name>
  <files>e2e/tests/topic-filter.spec.js</files>
  <action>
Rewrite `e2e/tests/topic-filter.spec.js` to test the new tag-select component. The tests must cover:

1. **Tag-select visible on law page**: `#topic-filter` exists, `#topic-search-input` is visible, no old-style chip buttons present.

2. **Search filters dropdown**: Focus input, type "Bürger", verify dropdown shows filtered results containing "Bürger" in topic names, dropdown items have checkbox and count.

3. **Multi-select and OR filtering**: Select 2 topics via dropdown checkboxes, verify both appear as chips below input, verify visible articles match EITHER topic (OR logic), verify some articles are hidden.

4. **Remove chip**: After selecting topics, click the x on one chip, verify it's removed, verify filter updates.

5. **Reset all**: Click "Alle zurücksetzen", verify all chips removed, all articles visible.

6. **Click outside closes dropdown**: Open dropdown by focusing input, click outside `#topic-filter`, verify dropdown is hidden.

Screenshots to capture (matching CLAUDE.md visual review protocol names):
- `topic-filter-chips.png` — the compact input UI (replaces old chip grid screenshot)
- `topic-filter-active.png` — with selections made and filtered paragraphs
- `topic-filter-reset.png` — after reset, all visible

Keep using `./gemeindeordnungen/burgenland.html` as test page. Use `page.goto()` with the same relative path pattern as existing tests.
  </action>
  <verify>
    <automated>npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium --grep="Topic Filter"</automated>
  </verify>
  <done>All topic filter E2E tests pass with the new tag-select UI. Screenshots captured at the expected paths.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Searchable tag-select component replacing 200+ inline topic filter chips on law pages. Features: search input, dropdown with checkboxes and counts, multi-select with OR filtering, removable chips, reset link.</what-built>
  <how-to-verify>
    1. Run: `npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium`
    2. Review screenshots in `e2e/screenshots/`:
       - `topic-filter-chips.png` — compact input instead of chip wall
       - `topic-filter-active.png` — selected topics filtering paragraphs
       - `topic-filter-reset.png` — clean reset state
    3. Open `dist/src/gemeindeordnungen/wien.html` in browser to verify:
       - Search input is clean and compact
       - Typing filters topics in dropdown
       - Selecting multiple topics shows chips + filters paragraphs with OR logic
       - Dropdown closes on click outside / Escape
       - "Alle zurücksetzen" clears everything
  </how-to-verify>
  <resume-signal>Type "approved" or describe visual/functional issues to fix</resume-signal>
</task>

</tasks>

<verification>
- `npm run build` succeeds without errors
- `npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium --grep="Topic Filter"` — all tests pass
- Screenshots show compact UI, not 200+ inline chips
- Multi-select OR filtering works correctly
</verification>

<success_criteria>
- Law pages show a search input instead of hundreds of inline chips
- Topics are searchable with prefix/substring matching
- Multiple topics can be selected (OR logic) with visual chip feedback
- Dropdown closes on click outside or Escape
- All E2E tests pass
- Visual review passes per CLAUDE.md protocol
</success_criteria>

<output>
After completion, create `.planning/quick/7-redesign-topic-filter-chips-ui-searchabl/7-SUMMARY.md`
</output>
