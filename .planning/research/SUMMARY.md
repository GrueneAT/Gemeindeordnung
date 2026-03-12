# Project Research Summary

**Project:** Gemeindeordnungs-Recherche — v1.1 UI/UX Improvements
**Domain:** Static legal document search platform (Austrian Gemeindeordnungen)
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

This v1.1 milestone transforms an existing browse-first legal document archive into a search-first reference tool for Austrian GemeinderätInnen. The platform already has 23 laws indexed (9 Gemeindeordnungen + 14 Stadtrechte), full-text search via Pagefind, LLM-generated summaries, a FAQ, and a glossary — all built on a proven stack of Vite 7, TailwindCSS v4, and Pagefind 1.4.0 deployed to GitHub Pages. The research confirms all v1.1 features are achievable with zero new npm dependencies, using only additive changes to existing templates and JavaScript modules.

The recommended implementation sequence is: (1) add Pagefind content-type metadata to FAQ and glossary pages, (2) extend search.js to render grouped results using a two-pass search strategy, (3) redesign the homepage with a search-hero layout, and (4) improve law text readability through targeted CSS and template adjustments. These phases are partially parallelizable — readability work is independent of the search unification phases. The critical constraint is that every HTML structural change requires a Pagefind re-index before search behavior can be tested.

The primary risk area is Pagefind's binary opt-in indexing model: once any page uses `data-pagefind-body`, all pages lacking it are silently excluded from search. The existing law pages already use this attribute, so FAQ and glossary pages must be audited and correctly tagged before building the unified search UI. Secondary risks include Pagefind's AND-only filter logic (requiring a two-pass search architecture when combining Bundesland filters with cross-type results) and WCAG AA compliance on new interactive elements (badges, collapse toggles, expanded search panels).

## Key Findings

### Recommended Stack

The existing stack is stable and fully sufficient for v1.1. No new packages should be installed. The `@tailwindcss/typography` plugin is confirmed broken on TailwindCSS v4.0.0 (no styles produced) and must not be used — custom scoped CSS in `main.css` is the correct alternative. The `interpolate-size` / `::details-content` CSS approach for animated collapsibles has no Firefox support as of early 2026; the CSS grid `grid-template-rows` animation technique is cross-browser and is the established pattern for this codebase.

**Core technologies:**
- **Vite 7 + TailwindCSS v4**: Build tool and styling — CSS-first config via `@theme`, no `tailwind.config.js`; native Vite plugin, no PostCSS config needed
- **Pagefind 1.4.0**: Full-text search — chunked WASM index, German stemming, `data-pagefind-filter` for content-type grouping, `data-pagefind-meta` for rich result metadata; single unified index is always preferred over `mergeIndex` for same-site content
- **generate-pages.js (Node.js 22)**: The primary change surface for v1.1 — all HTML generation for laws, FAQ, glossary, and index flows through this single script
- **GitHub Pages + GitHub Actions**: Hosting and CI/CD — entirely unchanged for v1.1; `npx pagefind --site dist --force-language de` remains the correct index build command

### Expected Features

**Must have (table stakes):**
- Search-hero homepage — replaces card grid; signals "search first" not "browse"; every comparable tool leads with a centered search input; current card grid signals "choose a law to browse" which is the opposite of the product's value proposition
- Unified search across Gesetze, FAQ, and Glossar — users ask questions answered by the glossary or FAQ, not law text; today those results are invisible to search
- Grouped results by content type — without visual separation, users cannot distinguish authoritative law text from a non-binding FAQ interpretation; this distinction is critical for legal tools
- Rich result metadata in snippets — law name, Bundesland, and paragraph number must appear without clicking through; currently only raw URL paths show

**Should have (differentiators):**
- Summary-first paragraph layout — surfaces plain-language LLM summary before dense legal text; aligns with progressive disclosure principles (GOV.UK, USWDS accordion patterns); existing summary data already embedded in generated HTML
- Mobile full-screen search overlay — extends existing basic overlay to full-screen mode matching iOS/Android system search expectations
- Navigation links to FAQ and Glossar visible on mobile — currently hidden at `sm` breakpoint; a one-line fix

**Defer to v2+:**
- Cross-Bundesland comparison tables — structural variation between laws and liability risk if comparison misleads
- Typeahead/autocomplete — Pagefind is not optimized for sub-50ms suggestion latency; Enter-to-search is sufficient for this corpus
- Faceted sidebar filters — adds RIS-style complexity for a 23-law corpus that already has Bundesland filter + content-type grouping
- AI-powered semantic search — requires backend inference, ongoing cost, explicit out-of-scope decision

### Architecture Approach

All v1.1 changes are confined to two files — `scripts/generate-pages.js` (HTML template changes) and `src/js/search.js` (search rendering logic) — plus additive CSS in `src/css/main.css`. The data pipeline (fetch-laws.js, parse-laws.js, llm-analyze.js), deployment infrastructure (vite.config.js, GitHub Actions), and mobile overlay mechanism are entirely untouched. The key architectural constraint is that Pagefind uses AND logic within a single filter call, making a two-pass search strategy necessary when the Bundesland filter must coexist with cross-type FAQ/Glossar results.

**Major components and v1.1 change scope:**
1. **generate-pages.js** — Modify `generateFAQTopicPage()` and `generateGlossaryPage()` to add `typ` filter meta tags; modify `generateIndexPage()` and `generateHeader()` to produce the search-hero layout; optionally modify `renderParagraph()` and `renderSection()` for summary-first readability
2. **search.js** — Extend `executeSearch()` to use a two-pass strategy (one Pagefind call with Bundesland filter for laws, one without for FAQ/Glossar); extend `renderResults()` to partition results into three content-type sections with distinct visual treatment per type
3. **main.css** — Add typography styles (17px base, 1.75 line-height, 72ch max-width), hero search styles, wider desktop dropdown breakpoint, CSS grid animation for collapsible sections
4. **Pagefind index** — Rebuilt at CI time; every HTML structural change requires `npm run build && npx pagefind --site dist --force-language de` before search behavior is testable

### Critical Pitfalls

1. **Pagefind binary opt-in indexing** — Once any page uses `data-pagefind-body`, ALL pages without it are silently excluded from search. FAQ and glossary pages must be audited and tagged before any unified search UI work begins. Verify with a known FAQ phrase search after each index rebuild.

2. **AND-only Pagefind filter logic requires two-pass search** — A single `debouncedSearch` with both `bundesland` and `typ` filters uses AND logic; FAQ/Glossar pages have no `bundesland` value and return zero results. Use two parallel calls: one with `{ bundesland, typ: ['gemeindeordnungen', 'stadtrechte'] }` and one with `{ typ: ['faq', 'glossar'] }`, then merge into grouped display.

3. **Pagefind reserved filter key names** — The keys `any`, `all`, `none`, and `not` are reserved and silently fail. The content-type filter must be named `typ` or `content-type`.

4. **Homepage must not appear in search results** — The current index page correctly has no `data-pagefind-body`. The hero redesign must not accidentally add this attribute to the hero section. After redesign, verify that searching for the hero headline text returns zero results.

5. **WCAG AA on new interactive elements** — New badges, filter chips, and collapse toggles require `aria-expanded`, `aria-live` regions for result counts, keyboard-navigable focus order, and contrast-checked colors. Green-on-green badge backgrounds are a specific risk given the Gruene CI palette.

## Implications for Roadmap

Based on research, the dependencies between features suggest four phases with Phase 4 being independently parallelizable with Phases 1-3.

### Phase 1: Pagefind Metadata Foundation
**Rationale:** Every unified search feature depends on the Pagefind index containing correct content-type metadata. This phase is purely additive (no UI changes), lowest risk, and must be completed and re-indexed before search UI work can be verified.
**Delivers:** All 3 content types (Gesetze, FAQ, Glossar) correctly tagged in the Pagefind index; verified via known FAQ/glossary term searches returning results; `data-pagefind-body` audit complete across all content pages; heading IDs confirmed on FAQ question elements for sub-result support.
**Addresses:** Foundation for unified search; Pitfall 1 (binary opt-in), Pitfall 3 (reserved key names), Pitfall 4 (homepage not indexed).
**Files changed:** `scripts/generate-pages.js` (generateFAQTopicPage, generateGlossaryPage); Pagefind rebuild required.

### Phase 2: Unified Search Results Rendering
**Rationale:** With correct metadata in the index, this phase builds the grouped results UI. Must follow Phase 1 so the two-pass search architecture can be verified against real indexed data.
**Delivers:** Search results grouped into three sections (Gesetze / FAQ-Themen / Glossar), each with result count, content-type badge with distinct color per type, rich metadata in snippets (law name, Bundesland, paragraph number), correct Bundesland filter behavior (laws filtered, FAQ/Glossar always shown), ARIA live regions for result count announcements.
**Addresses:** Table-stakes: result count and content-type orientation; Differentiators: grouped results, rich snippet metadata.
**Avoids:** Pitfall 2 (two-pass search), Pitfall 3 (visual differentiation), Pitfall 5 (ARIA on expanded search panel).
**Files changed:** `src/js/search.js` (executeSearch, renderResults, renderGroupedResults); `src/css/main.css`.

### Phase 3: Search-Hero Homepage
**Rationale:** With unified search working and verified, the homepage redesign can use the proven search module without risk of discovering search bugs during a visually-intensive phase.
**Delivers:** Search-hero index page with large centered input, value proposition tagline, and quick links to FAQ/Glossar and Alle Gesetze; header on index page hides duplicate search input via `hideSearch` option; wider desktop dropdown; WASM loading state displayed on hero (not "Keine Treffer" flash).
**Addresses:** Table-stakes: prominent homepage search bar; Pitfall 4 (homepage not indexed), Pitfall 8 (WASM latency UX).
**Files changed:** `scripts/generate-pages.js` (generateIndexPage, generateHeader); `src/css/main.css`; Visual Review Protocol mandatory (card-grid-index.png, search-results.png).

### Phase 4: Law Text Readability
**Rationale:** Independent of Phases 1-3; can be parallelized. Separated because it touches the law page template structure and requires its own E2E visual review cycle distinct from the search-focused phases.
**Delivers:** Improved typography (17px base, 1.75 line-height, 72ch max-width for law body text); native `<details>`/`<summary>` collapsible sections with CSS grid animation and `prefers-reduced-motion` support; `scroll-margin-top` expanded to cover h2, h3, and dt elements; optional summary-first paragraph layout with clearly-labeled "Volltext anzeigen" toggle.
**Addresses:** Differentiators: summary-first progressive disclosure, readability.
**Avoids:** Pitfall 6 (collapsible sections must not use `data-pagefind-ignore` on content wrappers; `<details>` content is indexed by Pagefind correctly), Pitfall 7 (scroll-margin-top must cover all anchor types beyond h3).
**Files changed:** `scripts/generate-pages.js` (renderParagraph, renderSection, generateLawPage); `src/css/main.css`; Pagefind re-index required; Visual Review Protocol mandatory (typography-law-text.png, browse-page-wien.png, llm-summary-expanded.png).

### Phase Ordering Rationale

- Phase 1 before Phase 2 is a hard dependency: the two-pass search JS cannot be meaningfully tested until the Pagefind index has `typ` filter values on FAQ and glossary pages.
- Phase 2 before Phase 3 reduces risk: homepage visual work is expensive to redo if search bugs surface during a combined phase; completing the search layer first provides confidence before the visual-heavy redesign.
- Phase 4 is independent and can be pulled forward to run in parallel with Phase 1 or 2 if developer capacity allows.
- Every phase that modifies indexed HTML pages requires a full Pagefind rebuild — this must be explicit in each phase plan's verification steps.

### Research Flags

Phases needing an explicit design step before implementation:
- **Phase 2 (Unified Search Rendering):** The two-pass search architecture and result partitioning logic have non-obvious edge cases (null returns from superseded queries, AND-filter behavior, BL-filter interaction with FAQ/Glossar). Design the `executeSearch` function signature and the result data model before writing code. The "Looks Done But Isn't" checklist in PITFALLS.md provides 12 explicit verification items.
- **Phase 3 (Search-Hero Homepage):** The `generateHeader()` refactoring to support `hideSearch` touches the shared header used on all page types — scope the change carefully to avoid regression on law pages and FAQ pages.

Phases with well-documented, low-risk patterns (standard implementation):
- **Phase 1 (Metadata):** Adding `<meta data-pagefind-filter>` tags is a one-to-two line change per template function; fully documented in Pagefind official docs with confirmed behavior.
- **Phase 4 (Readability):** CSS typography improvements and native `<details>`/`<summary>` patterns are well-established; no framework changes, no new packages.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified against official docs and GitHub releases; `@tailwindcss/typography` breakage confirmed with issue link; no new packages needed |
| Features | HIGH | Table stakes derived from established search UX research (NN/G, GOV.UK, IxDF); Pagefind capabilities verified against official filtering and metadata docs |
| Architecture | HIGH | Based on direct code inspection of the existing codebase (`search.js`, `generate-pages.js`, `main.css`, `vite.config.js`); no assumptions about unread code |
| Pitfalls | HIGH (Pagefind), MEDIUM (UX) | Pagefind-specific pitfalls verified against official docs and GitHub issues; UX pitfalls based on NN/G and accessibility research with strong community consensus |

**Overall confidence:** HIGH

### Gaps to Address

- **Sub-result anchor IDs on FAQ pages:** PITFALLS.md flags that FAQ pages may not have `id` attributes on question headings, which prevents Pagefind sub-results from linking directly to individual Q&As. This was not verified by direct code inspection during research. Phase 1 must audit the generated FAQ HTML and add heading IDs where missing.
- **Baseline Pagefind index page count:** The current indexed page count was not recorded. Establishing a baseline before Phase 1 changes makes it easier to verify the re-indexed count is correct after adding FAQ/glossary type tags.
- **Mobile overlay behavior after hero refactor:** The mobile overlay injects its own DOM and swaps `searchInput` / `searchDropdown` module-level refs at runtime. The Phase 3 hero layout removes the header search from the index page — verify the mobile overlay injection still targets the correct element after this change, since the overlay currently assumes a header-resident search input exists.

## Sources

### Primary (HIGH confidence)
- Pagefind filtering docs: https://pagefind.app/docs/filtering/ — `data-pagefind-filter` syntax, AND logic behavior
- Pagefind metadata docs: https://pagefind.app/docs/metadata/ — `data-pagefind-meta`, `result.meta` object
- Pagefind sub-results docs: https://pagefind.app/docs/sub-results/ — heading ID requirement
- Pagefind GitHub Discussion #699 — maintainer recommendation against `mergeIndex` for same-site content
- TailwindCSS Discussion #17073 — confirmed `@tailwindcss/typography` broken on v4.0.0, no fix available as of 2026-03
- Chrome for Developers: styling details — `::details-content` pseudo-element Chrome 130+ only; no Firefox support
- Direct code inspection: `src/js/search.js`, `scripts/generate-pages.js`, `src/css/main.css`, `vite.config.js`
- RIS OGD API v2.6: https://data.bka.gv.at/ris/api/v2.6/ — live-tested, JSON response confirmed, no auth required

### Secondary (MEDIUM confidence)
- NN/G: Anatomy of search results page — grouped results UX pattern validation
- NN/G: Accordions on desktop — progressive disclosure for dense reference content
- GOV.UK Design System: Accordion component — collapse dense content, surface human-readable version first
- IxDF: Progressive disclosure — summary-first layout rationale
- nerdy.dev: details element transitions — CSS grid `grid-template-rows` animation vs. `interpolate-size`
- Algolia: Federated search UX — grouped results pattern (Reuters, Twitch, Apple examples)

### Tertiary (LOW confidence)
- DesignMonks, LogRocket search UX best practices — supporting sources for search hero pattern; main findings independently confirmed by NN/G primary sources

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
