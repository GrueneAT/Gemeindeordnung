# Pitfalls Research

**Domain:** Static legal search tool — UI/UX milestone: unified search, search-hero homepage, readability overhaul
**Researched:** 2026-03-12
**Confidence:** HIGH (Pagefind-specific), MEDIUM (UX patterns)

---

## Critical Pitfalls

### Pitfall 1: data-pagefind-body Opt-In Breaks Entire Site Index

**What goes wrong:**
Once `data-pagefind-body` appears on ANY page in the site, Pagefind stops indexing every page that lacks it. FAQ pages and glossary pages added without this attribute silently disappear from search. The law pages already use `data-pagefind-body` in the generated HTML. Adding new content types (FAQ, glossary) without the attribute means they are invisible to search — no error, no warning.

**Why it happens:**
Pagefind's "opt-in" indexing model is binary: either no page uses `data-pagefind-body` (index everything) or some page uses it (index only tagged pages). Developers add `data-pagefind-body` to new pages piecemeal and miss some.

**How to avoid:**
Before adding unified search, audit every content page (law pages, FAQ pages, glossary page, index page if desired) and confirm each has `data-pagefind-body` on the correct element. Add a CI check: build and run `grep -rL 'data-pagefind-body' src/faq/ src/glossar.html` to detect untagged pages. Keep a content-type inventory table.

**Warning signs:**
Searching for a known FAQ phrase returns zero results. Glossary terms produce no search hits. Pagefind index reports unexpectedly low page count.

**Phase to address:**
Unified search phase (the first phase adding FAQ/glossary to search). Must be verified before any other search UI work.

---

### Pitfall 2: Pagefind Sub-Results Require Heading IDs — Without Them, Results Are Page-Level Only

**What goes wrong:**
Sub-results (paragraph-level search hits shown grouped under their parent law/FAQ page) only work when headings have `id` attributes. The current law pages already inject IDs on `h3[id]` elements. FAQ pages and the glossary page may not have this structure. Without IDs, search returns "Gemeinderatssitzungen FAQ page" as a single result, not the individual Q&A items. Users cannot jump directly to the relevant answer.

**Why it happens:**
Sub-results are an explicit Pagefind feature requiring structured HTML. Hand-authored FAQ/glossary pages often use flat `<dt>/<dd>` or `<h3>` without IDs. The current CSS already has `scroll-margin-top` scoped to `h3[id]` — other heading levels are uncompensated.

**How to avoid:**
For every content type entering the search index:
1. Ensure heading elements (h2 or h3) carry `id` attributes that match the anchor scheme.
2. Verify `scroll-margin-top` covers all anchor-targeted heading levels (not only h3).
3. Test sub-results explicitly after indexing: a known FAQ term should produce a sub-result link, not just a page link.

**Warning signs:**
Search result for an FAQ query shows the FAQ page title but no sub-result accordion. Clicking the result lands on top of the FAQ page, not the relevant answer.

**Phase to address:**
Unified search phase — verify before building the grouped result UI.

---

### Pitfall 3: Unified Search Groups Confuse Users When Content Types Look the Same

**What goes wrong:**
Displaying law paragraphs, FAQ answers, and glossary terms in one results list with no visual differentiation makes results unreadable. Users cannot tell whether a result is "the actual law text" vs. "an FAQ interpretation" vs. "a glossary definition." For a legal tool, this distinction is critical — a glossary entry is not the authoritative source.

**Why it happens:**
The current search code renders all results as `search-result-item` links, with only a "Stadtrecht" badge as differentiation. Adding FAQ/glossary without distinct visual treatment is a one-line copy-paste that looks done but is actively harmful.

**How to avoid:**
Add a `data-pagefind-meta` attribute (e.g. `content-type: Gesetz`, `content-type: FAQ`, `content-type: Glossar`) to every page type at build time. In the search rendering code, read `result.meta['content-type']` and render a content-type badge with distinct color/icon per type. Group results by content type in the rendered list (Gesetze first, then FAQ, then Glossar). Never mix them in a flat list.

**Warning signs:**
A glossary definition appears directly above a law paragraph with no visual separation. Users click a glossary result expecting authoritative law text.

**Phase to address:**
Unified search phase — part of the rendering layer design, not an afterthought.

---

### Pitfall 4: Search-Hero Homepage Breaks the Pagefind Index If Not Tagged Correctly

**What goes wrong:**
The redesigned homepage (search-hero with prominent search bar, no card grid or with a collapsed card grid) must still be indexed (or explicitly excluded) by Pagefind. If the homepage had `data-pagefind-body` in v1.0 and the hero redesign removes the content area, the homepage page count in the index drops silently. Conversely, if the hero text gets indexed, users find the homepage when searching "Gemeindeordnung" — a useless result.

**Why it happens:**
Homepage redesigns commonly move or remove structural elements. The current `index.html` does not appear to use `data-pagefind-body`, so the homepage is currently NOT in the index (correct). A redesign that accidentally adds `data-pagefind-body` to the hero section will index marketing copy.

**How to avoid:**
The homepage should NOT be in the search index (it adds no legal content). Confirm the homepage has NO `data-pagefind-body` attribute after redesign. Add `data-pagefind-ignore` to the hero section explicitly if needed. Test: searching for headline text from the hero should return zero results.

**Warning signs:**
Search for "Gemeindeordnungen der österreichischen Bundesländer" returns the homepage as a result.

**Phase to address:**
Search-hero homepage redesign phase.

---

### Pitfall 5: Desktop Search Expansion from Dropdown to Panel Loses Keyboard Focus and ARIA State

**What goes wrong:**
Transitioning the desktop search from a small dropdown to a full-width results panel (or modal-style overlay) breaks keyboard navigation. Focus does not move to the results panel, screen readers do not announce new content, and the `aria-expanded` state on the search input is not updated. The current code uses `hidden`/`search-dropdown-expanded` CSS classes without ARIA updates.

**Why it happens:**
CSS visibility changes do not notify assistive technologies. The transition from a small dropdown (in the DOM flow) to an expanded panel (potentially repositioned) requires explicit focus management and ARIA live region announcements. Developers commonly focus on the visual result and skip the screen reader experience.

**How to avoid:**
- Add `aria-expanded="true/false"` on the search input element, toggled by JS on every state change.
- Add `role="region"` and `aria-label="Suchergebnisse"` to the results container.
- When the panel expands significantly (e.g. height transition from 200px to 600px), use an `aria-live="polite"` region to announce the result count.
- When Escape closes the expanded panel, move focus back to the search input explicitly.
- Test with keyboard-only navigation (Tab, Arrow, Escape) on the final design.

**Warning signs:**
Pressing Tab after searching does not land inside the results list. Screen reader does not announce how many results were found.

**Phase to address:**
Desktop search results UX phase — design the ARIA semantics before writing CSS for the panel.

---

### Pitfall 6: Collapsible Law Sections Hide Content from Pagefind Index

**What goes wrong:**
Implementing collapsible sections on law pages (e.g. `<details>/<summary>` or JS-toggled `hidden` divs) to improve readability may cause Pagefind to skip the hidden content during indexing. If paragraphs are inside `<details>` that are closed by default, Pagefind should still index them — but any use of `data-pagefind-ignore` on collapsed wrapper elements will make entire sections invisible to search.

**Why it happens:**
Pagefind indexes the static HTML at build time. `<details>` content is in the DOM regardless of open/closed state, so Pagefind indexes it correctly. However, if a developer adds `data-pagefind-ignore` to hide "boilerplate" section headers, they may inadvertently hide the paragraphs nested inside.

**How to avoid:**
- Use `<details>/<summary>` natively — Pagefind indexes the content inside correctly.
- Never wrap paragraph content in `data-pagefind-ignore` elements.
- After adding collapsible sections, rebuild the index and search for a term known to be inside a collapsed section. Verify it appears.
- If using JS-toggled `hidden` attribute instead of `<details>`, confirm the attribute is NOT present in the static build output (it should only be toggled at runtime).

**Warning signs:**
Search for a term inside a collapsible section returns zero results after the readability refactor.

**Phase to address:**
Law text readability overhaul phase — indexing must be re-verified after each structural HTML change.

---

### Pitfall 7: Sticky Header Scroll Compensation Breaks on New Page Sections

**What goes wrong:**
The current CSS sets `scroll-margin-top` only on `h3[id]`. Adding new sections (hero, FAQ sections, collapsible groups) with anchors linked from search results will cause the sticky header to obscure the target heading. Users navigate to a search result anchor and see the paragraph title cut off behind the header.

**Why it happens:**
`scroll-margin-top` must be set on every element type that serves as an anchor target. When new content structures are introduced (h2 anchors in FAQ, dt anchors in glossary, section-level anchors in law pages), the CSS rule is narrow and does not cover them.

**How to avoid:**
Change the CSS rule from `h3[id]` to a broader selector covering all anchor-targetable elements: `h2[id], h3[id], [id].anchor-target { scroll-margin-top: 5rem; }`. Alternatively use the HTML `scroll-padding-top` on `:root`. Test every new content type by navigating directly to its anchor URL and verifying the heading is fully visible below the sticky header.

**Warning signs:**
Clicking a search result anchor link shows the heading partially hidden behind the sticky header.

**Phase to address:**
Law text readability overhaul phase (when new section structures are introduced) and unified search phase (when anchor links from search results are widened to new content types).

---

### Pitfall 8: Pagefind WASM First-Load Latency Blocks the Search-Hero Experience

**What goes wrong:**
The search-hero homepage makes search the primary interaction. If Pagefind's WASM module has not loaded by the time a user types their first query, there is a noticeable delay (300-800ms on slow connections) before any results appear. This feels broken for a homepage where search is the entire value proposition.

**Why it happens:**
Pagefind loads WASM and index chunks lazily. The current code already calls `loadPagefind()` on DOMContentLoaded, which is good practice. But on the homepage, the user may type before WASM initialization completes, especially on mobile. The current code returns `{ totalCount: 0, results: [] }` if Pagefind is unavailable — indistinguishable from "no results" to the user.

**How to avoid:**
- Keep the existing eager `loadPagefind()` call on DOMContentLoaded.
- On the search-hero homepage, show a loading indicator in the search bar while WASM is initializing (not the full results area — just the input placeholder or a subtle spinner on the icon).
- Track initialization state separately from "no results" state; never render "Keine Treffer" during initialization.
- The Pagefind index for 23 law pages + FAQ + glossary is small (estimated <500KB total); load time is not a structural problem at this scale.

**Warning signs:**
User types 3+ characters immediately on page load and sees "Keine Treffer" flash briefly before real results appear.

**Phase to address:**
Search-hero homepage redesign phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hard-code content-type labels in render code instead of reading from Pagefind metadata | Faster initial implementation | Cannot add new content types without code changes | Never — use `data-pagefind-meta` from day one |
| Inline `onclick` handlers in dynamically rendered search result HTML | Simpler than event delegation | XSS risk if escaping is ever missed; memory leaks on result re-render | Never — use `data-action` + event delegation (already the pattern in the codebase) |
| Duplicate the search UI for the homepage vs. law pages | Avoids refactoring existing search module | Two codepaths to maintain, state diverges | Only if homepage search is genuinely a different component; prefer parameterizing existing `initSearch()` |
| Use `display:none` on collapsed sections instead of `<details>` | Simpler JS | If `display:none` is in static HTML, content is not read by some screen readers; Pagefind may skip it | Never for law text — always use `<details>` or runtime-only JS toggling |
| Skip `aria-expanded` / `aria-live` on search panel | Saves a few lines | Fails WCAG 2.1.2, fails keyboard users | Never on a public tool with WCAG AA requirement |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Pagefind + mixed content types | Tagging only some pages with `data-pagefind-body` | Audit ALL pages in the site; every page must either be tagged or explicitly ignored |
| Pagefind + collapsible sections | Adding `data-pagefind-ignore` to section containers | Only use `data-pagefind-ignore` on navigation, disclaimers, and structural chrome — never on content paragraphs |
| Pagefind + search-hero homepage | Re-using Pagefind's `highlightParam` URL parameter from law pages on the homepage | The homepage has no in-page content to highlight; ensure the highlight script is not loaded on pages with no indexable content |
| Pagefind + filters | Using `any`, `all`, `none`, `not` as filter key names | These four keys are reserved and silently fail; name content-type filter `type` or `content-type` |
| Pagefind + multiple indexes | Building separate indexes per content directory | A single unified index is always more performant; use filter attributes to separate content types, not separate index builds |
| Pagefind + Node API | Using Node API in isolation for custom content ingestion | Node-API-only builds produce empty pagefind-ui.css and pagefind-ui.js; always run the full CLI indexing step after Node API ingestion |
| TailwindCSS v4 + dynamic class names | Generating class names dynamically in JS search result HTML (`"text-" + color`) | Tailwind v4 scans static source; dynamic strings are not in the build output; use complete class names in JS strings |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all search results at once ("show all" path) | UI freezes when user clicks "Alle X Gesetze" — `Promise.all(allResults.map(r => r.data()))` fetches all chunks simultaneously | Already mitigated in existing code with the 15-result initial load; keep this pattern for the expanded UI | At ~50+ results with slow connections; rare at current site scale |
| Re-rendering the entire results dropdown on every filter chip click | Flickering, lost scroll position | Diff the results before re-render; or clear and re-render only if the result set has changed | Immediately visible with fast typing |
| Rendering law text readability improvements via JavaScript | FOUC (flash of unstyled content) as JS applies collapsible structure after HTML paint | Use `<details>/<summary>` natively — no JS needed for collapse behavior; JS only for analytics or enhanced behavior | Every page load |
| Long inline SVGs in dynamically generated search result HTML | Each result item includes full SVG icon markup — large DOMs on many results | Use CSS classes with background-image or an SVG sprite; never inline full SVGs in JS string templates | At >20 results visible simultaneously |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Hero search bar that looks identical to the header search bar | Users on law pages try to use a "hero" that does not exist; brand dilution | Use a distinct visual treatment for the hero search (larger, centered, different background) but same interaction model |
| Collapsible sections collapsed by default with no visual affordance | Users don't know content exists, miss relevant paragraphs | Use a clear "Abschnitt anzeigen" button with chevron; or collapse only LLM summaries (supplementary content), not the law text itself |
| Content-type badges in search that look like interactive filters | Users click "FAQ" badge expecting to filter to only FAQ results | Either make them genuinely clickable (filter action) or use non-interactive visual styling (colored dot, not a button) |
| "Keine Treffer" shown during WASM initialization | Users think the search is broken or their query is wrong | Show a loading state, not an empty state, during initialization |
| Search results grouped by Bundesland when searching across all content types | FAQ and glossary results mixed into Bundesland groups confuses hierarchy | Group by content type first (Gesetze / FAQ / Glossar), then by Bundesland within Gesetze group |
| Mobile search overlay not dismissible by tapping outside | Users trapped in overlay, no obvious exit | Current code wires `backdrop.addEventListener('click', closeMobileOverlay)` — verify this is preserved in any refactor |
| Summary-first layout that hides the actual law text | Users cannot find the authoritative text; "Keine Rechtsberatung" disclaimer becomes ironic | Always keep law text visible (not behind another click); summaries are supplementary, expandable — law text is the primary content |

---

## "Looks Done But Isn't" Checklist

- [ ] **Unified search:** All 3 content types (Gesetze, FAQ, Glossar) appear in search results — not just law pages
- [ ] **Unified search:** Content-type badge visible on every result so users know what kind of content they are seeing
- [ ] **Unified search:** Sub-results work for FAQ pages (individual Q&As linkable, not just the FAQ page title)
- [ ] **Search hero:** Searching for homepage headline text returns zero Pagefind results (homepage not indexed)
- [ ] **Search hero:** WASM loading state shown; "Keine Treffer" never appears during initialization
- [ ] **Search panel expansion:** `aria-expanded` on input, `aria-live` on result count, focus managed correctly on Escape
- [ ] **Collapsible sections:** Searching for content inside a collapsed section still returns that result
- [ ] **Scroll compensation:** Every anchor-linked element (h2, h3, dt, section) has `scroll-margin-top` matching header height
- [ ] **Mobile:** Overlay close-by-tap-outside still works after any search UI refactor
- [ ] **Mobile:** Touch targets on filter chips and content-type badges are at least 44px
- [ ] **WCAG:** All new interactive elements (badges, chips, collapse toggles) keyboard-navigable and labeled with aria
- [ ] **Pagefind rebuild:** After ANY HTML structure change to indexed pages, re-run `npx pagefind --site dist --force-language de` before testing search

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| FAQ/glossary pages missing from index | LOW | Add `data-pagefind-body` to the correct element on each page, rebuild Pagefind index, redeploy |
| Sub-results not working for FAQ | LOW-MEDIUM | Add `id` attributes to all FAQ answer headings, rebuild index |
| Homepage appearing in search results | LOW | Remove `data-pagefind-body` from homepage, rebuild index |
| Collapsible sections hiding content from search | MEDIUM | Restructure HTML to use `<details>` without `data-pagefind-ignore` wrappers; rebuild index |
| ARIA/keyboard navigation broken on search panel | MEDIUM | Add `aria-expanded`, `aria-live`, focus management — test with screen reader; no rebuild needed |
| Search result grouping confuses content types | MEDIUM | Refactor render functions to group by content-type metadata before Bundesland; no index rebuild needed |
| scroll-margin-top missing on new anchor types | LOW | Add CSS selector to cover new element types; no rebuild needed |
| WASM loading shows "Keine Treffer" flash | LOW | Add initialization flag to distinguish "loading" from "no results" state |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| data-pagefind-body opt-in breaks index (#1) | Unified search — first task | Build and search for known FAQ term; check index page count |
| Sub-results require heading IDs (#2) | Unified search — HTML structure design | Search for FAQ term; verify sub-result links appear |
| Content types look the same in results (#3) | Unified search — result renderer | Visual review of search results showing all 3 content types |
| Homepage indexed after hero redesign (#4) | Search-hero homepage redesign | Search for hero headline text; expect zero results |
| Keyboard/ARIA on expanded search panel (#5) | Desktop search UX phase | Tab through results with keyboard only; test with screen reader |
| Collapsible sections hide indexed content (#6) | Law text readability overhaul | Search for term inside a collapsed section after rebuild |
| Scroll compensation on new anchor types (#7) | Readability overhaul + unified search | Navigate to each new anchor type via URL; verify heading visibility |
| WASM load latency on hero (#8) | Search-hero homepage redesign | Throttle network to Slow 3G; type query immediately on load |

---

## Previously Identified Pitfalls (v1.0 — Still Relevant)

The following pitfalls from the v1.0 research remain relevant for the v1.1 milestone and are not superseded:

- **Pagefind indexes non-content elements** (Pitfall 6 in original) — `data-pagefind-ignore` must stay on header, footer, nav; any new chrome added to law pages must also carry this attribute.
- **TailwindCSS v4 migration confusion** (Pitfall 7 in original) — new components must use `@theme` CSS variables, not `tailwind.config.js` patterns. Especially relevant for search panel, hero section.
- **Green brand colors fail WCAG AA** (Pitfall 9 in original) — new badges, chips, and hero elements must be contrast-checked. Green-on-green badge backgrounds are a particular risk.
- **GitHub Pages path handling** (Pitfall 8 in original) — new assets (icons for content-type badges, etc.) must use Vite's `BASE_URL` pattern.
- **LLM hallucination in summaries** (Pitfall 3 in original) — the readability overhaul showing summaries more prominently increases this risk; disclaimer must remain prominent.

---

## Sources

- Pagefind indexing docs: https://pagefind.app/docs/indexing/
- Pagefind filtering docs: https://pagefind.app/docs/filtering/
- Pagefind sub-results docs: https://pagefind.app/docs/sub-results/
- Pagefind highlighting docs: https://pagefind.app/docs/highlighting/
- Pagefind content-type discussion: https://github.com/pagefind/pagefind/discussions/699
- Pagefind known issues: https://github.com/pagefind/pagefind/issues
- W3C Accordion Pattern (ARIA): https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
- WCAG 2.1 Keyboard Accessibility: https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html
- Accessible accordions with details/summary: https://www.hassellinclusion.com/blog/accessible-accordions-part-2-using-details-summary/
- Sticky header anchor compensation: https://gomakethings.com/how-to-prevent-anchor-links-from-scrolling-behind-a-sticky-header-with-one-line-of-css/
- NN/G dropdown usability: https://www.nngroup.com/articles/drop-down-menus/
- Search UX best practices: https://www.pencilandpaper.io/articles/search-ux

---
*Pitfalls research for: Gemeindeordnung.gruene.at — v1.1 UI/UX milestone*
*Researched: 2026-03-12*
