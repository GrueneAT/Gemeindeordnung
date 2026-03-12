# Roadmap: Gemeindeordnungs-Recherche

## Milestones

- v1.0 MVP - Phases 1-4.2 (shipped 2026-03-11)
- v1.1 UI/UX Improvements - Phases 4.3, 5-7 (in progress)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

<details>
<summary>v1.0 MVP (Phases 1-4.2) - SHIPPED 2026-03-11</summary>

- [x] **Phase 1: Data Pipeline & Project Foundation** - Fetch all 9 Gemeindeordnungen from RIS, parse into structured data, set up build tooling and deployment
- [x] **Phase 2: Browsing & Branding** - Browsable Gemeindeordnung pages with Gruenes CI, responsive layout, and accessibility
- [x] **Phase 2.1: Frontend Testing Infrastructure** - Playwright E2E tests for all UAT scenarios with CI integration
- [x] **Phase 3: Search** - Pagefind full-text search with Bundesland selection as primary UX
- [x] **Phase 4: LLM Enrichment** - Dev-time generated summaries, FAQs, glossary, and topic tagging
- [x] **Phase 4.1: Visual Polish & Screenshot Review** - Comprehensive visual review and branding fixes
- [x] **Phase 4.2: Improve LLM Content Quality** - Replace placeholder LLM content with high-quality real content

</details>

### v1.1 UI/UX Improvements

- [x] **Phase 4.3: Curated FAQ Topic List & Fix Broken FAQ Generation** (INSERTED) - Research-driven curated topic list, fix FAQ pipeline JSON parse errors, regenerate FAQ content
- [ ] **Phase 5: Unified Search Engine** - Pagefind metadata tagging for FAQ/Glossar, two-pass search architecture, grouped results by content type with rich metadata
- [ ] **Phase 6: Search-Hero Homepage & Navigation** - Search-first homepage layout replacing card grid, quick-access discovery links, polished header and navigation across all pages
- [ ] **Phase 7: Law Text Readability** - Typography overhaul, summary-first layout, visual hierarchy for sections and Absaetze, highlighted key terms

## Phase Details

<details>
<summary>v1.0 MVP Phase Details (Phases 1-4.2)</summary>

### Phase 1: Data Pipeline & Project Foundation
**Goal**: All 9 Gemeindeordnungen + 14 Statutarstadt-Stadtrechte are fetched from RIS, parsed into structured JSON, and the site builds and deploys to GitHub Pages via automated pipeline
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DEPL-01, DEPL-02, DEPL-03, DEPL-04, DSGN-02
**Success Criteria** (what must be TRUE):
  1. Running the fetch script retrieves all 9 Gemeindeordnungen from RIS OGD API and produces structured JSON with Paragraphen, Abschnitte, and Ueberschriften for each Bundesland
  2. The site builds with Vite and TailwindCSS and deploys to GitHub Pages via GitHub Actions without manual intervention
  3. The site displays "Stand: [Datum]" showing when data was last fetched
  4. Dev-scripts for LLM analysis exist and can be run locally (even if LLM content is not yet generated)
  5. LLM-generated content, once created, is committed to repo and not regenerated per deploy
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md -- Project setup (Vite + TailwindCSS v4 + vitest) and RIS law fetch script with complete 23-law registry
- [x] 01-02-PLAN.md -- Cheerio HTML parser with real RIS test fixtures and structured JSON output
- [x] 01-03-PLAN.md -- Page generation, GitHub Actions deployment workflow, and LLM dev-script stub

### Phase 2: Browsing & Branding
**Goal**: Users can browse each Bundesland's Gemeindeordnung on a well-designed, accessible, mobile-friendly site with Gruenes Corporate Identity
**Depends on**: Phase 1
**Requirements**: BROW-01, BROW-02, BROW-03, BROW-04, BROW-05, BROW-06, DSGN-01, DSGN-03
**Success Criteria** (what must be TRUE):
  1. User can navigate to any Bundesland's Gemeindeordnung and browse its full text with auto-generated table of contents and collapsible sections
  2. User can link directly to any paragraph via URL anchor (e.g. /wien/#p42) and copy a deep link for sharing
  3. Legal text is displayed in readable typography (line-height 1.6+, max-width ~70ch) and the site is fully usable on mobile during Gemeinderatssitzungen
  4. Site uses Gruenes CI (colors, logo) consistent with bildgenerator.gruene.at and meets WCAG 2.1 AA accessibility standards
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- Gruene branding theme, page generator rewrite with header/footer, ToC, breadcrumbs, Bundesland cards, responsive typography
- [x] 02-02-PLAN.md -- Interactive JS features (clipboard copy, scroll-to-top, Bundesland dropdown, anchor highlight) and visual verification
- [x] 02-03-PLAN.md -- Gap closure: fix copy button visibility bug (missing group class, orphaned CSS rule)

### Phase 02.1: Frontend Testing Infrastructure (INSERTED)
**Goal:** Playwright E2E tests verify all 10 UAT scenarios from Phase 2 with screenshot capture, mobile viewport testing, and WCAG AA accessibility checks, integrated into CI to gate deployments
**Depends on:** Phase 2
**Requirements**: TEST-01a, TEST-01b, TEST-01c, TEST-01d, TEST-01e, TEST-01f, TEST-01g, TEST-01h, TEST-02, TEST-03, TEST-06
**Success Criteria** (what must be TRUE):
  1. All 10 UAT scenarios from Phase 2 are covered by Playwright E2E tests that pass against the built site
  2. Each test captures screenshots for visual verification, stored as CI artifacts
  3. Mobile viewport test at 375px verifies responsive layout with no horizontal overflow
  4. axe-core WCAG AA scan passes with zero violations on index and law pages
  5. GitHub Actions runs Playwright tests before deployment -- failing tests block deploy
**Plans**: 2 plans

Plans:
- [x] 02.1-01-PLAN.md -- Playwright setup (config, deps, npm scripts) and first 5 UAT tests (browse-page, ToC, card-grid, typography, copy-link)
- [x] 02.1-02-PLAN.md -- Remaining 5 UAT tests (scroll-to-top, dropdown-nav, anchor-highlight, mobile, accessibility) and CI workflow integration

### Phase 3: Search
**Goal**: Users can find any provision across all 9 Gemeindeordnungen in seconds, with their Bundesland as the default search context
**Depends on**: Phase 2
**Requirements**: SUCH-01, SUCH-02, SUCH-03, SUCH-04, SUCH-05, SUCH-06, SUCH-07
**Success Criteria** (what must be TRUE):
  1. User can search full-text across all 9 Gemeindeordnungen via Pagefind with highlighted search terms and contextual snippets around matches
  2. User can select their Bundesland as primary context (persistent selection) and search defaults to that Bundesland with option to search across all
  3. User sees total result count (e.g. "23 Treffer") and a meaningful empty state when no results are found
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md -- Pagefind install, HTML indexing attributes, search JS module, build pipeline + CI update
- [x] 03-02-PLAN.md -- Search UI: header integration, live dropdown results, BL filter chips, empty states, mobile overlay, keyboard shortcuts, on-page highlighting
- [x] 03-03-PLAN.md -- E2E tests for all 7 SUCH requirements and visual verification checkpoint

### Phase 4: LLM Enrichment
**Goal**: Legal text is enriched with plain-language summaries, thematic FAQs, a glossary, and topic tagging -- all generated at dev-time
**Depends on**: Phase 2
**Requirements**: LLM-01, LLM-02, LLM-03, LLM-04, LLM-05, LLM-06, LLM-07
**Success Criteria** (what must be TRUE):
  1. User sees a "Vereinfachte Zusammenfassung" per paragraph with disclaimer "keine Rechtsberatung", displayed alongside the original legal text
  2. User can browse thematic FAQ pages (Sitzungen, Abstimmungen, Befangenheit etc.) with answers that link to relevant paragraphs across Bundeslaender
  3. User can look up legal terms in a glossary page and sees inline tooltips for Fachbegriffe in the legal text
  4. User can filter paragraphs by Thema/Topic using LLM-generated topic tags
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md -- LLM generation pipeline: extend llm-analyze.js and generate all summary, FAQ, and glossary JSON data files
- [x] 04-02-PLAN.md -- Summaries + Topics UI: collapsible summaries, disclaimer info-box, topic filter chips with JS interactivity
- [x] 04-03-PLAN.md -- FAQ pages, glossary page, inline glossary tooltips, Vite config + header navigation extension
- [x] 04-04-PLAN.md -- E2E tests for all 7 LLM requirements and visual verification checkpoint

### Phase 04.1: Visual Polish & Screenshot Review (INSERTED)
**Goal:** Comprehensive visual review of the entire site using Playwright screenshots -- find and fix all usability, layout, and branding issues to ship-quality standard
**Depends on:** Phase 4
**Requirements**: DSGN-01, DSGN-03, BROW-05, BROW-06
**Success Criteria** (what must be TRUE):
  1. Site header shows the correct Austrian Gruene arrow-G logo on every page
  2. All template text uses proper German umlauts
  3. Every screenshot passes visual review with zero layout, typography, or branding issues
  4. Mobile layout at 375px is clean with no overflow
  5. CLAUDE.md contains a mandatory Visual Review Protocol for all future UI work
**Plans**: 2 plans

Plans:
- [x] 04.1-01-PLAN.md -- Logo replacement, umlaut fixes, systematic screenshot review and visual polish of all pages
- [x] 04.1-02-PLAN.md -- Strengthen CLAUDE.md Visual Review Protocol to mandatory for future autonomous validation

### Phase 04.2: Improve LLM Content Quality (INSERTED)
**Goal:** Replace all placeholder LLM content with high-quality, real content
**Depends on:** Phase 4
**Requirements**: LLM-01, LLM-02, LLM-03, LLM-04, LLM-05, LLM-06, LLM-07, DEPL-03
**Success Criteria** (what must be TRUE):
  1. All 23 summary files have no placeholder flag and use varied, natural German language
  2. FAQ topics are substantive with real BL-specific details and proper legal citation format
  3. Glossary terms have comprehensive definitions with cross-BL references and a client-side search filter
  4. Topic tags are specific and granular (not just "Allgemeine Bestimmungen")
  5. npm run llm:validate exits with code 0
  6. Separate npm commands exist for llm:summaries, llm:faq, llm:glossary, llm:all, llm:validate
**Plans**: 3 plans

Plans:
- [x] 04.2-01-PLAN.md -- Improve LLM prompts, add citation map, separate CLI commands, and validation script
- [x] 04.2-02-PLAN.md -- Add client-side glossary filter/search input with E2E tests
- [x] 04.2-03-PLAN.md -- Regenerate all LLM content and human quality verification

</details>

### Phase 04.3: Curated FAQ Topic List & Fix Broken FAQ Generation (INSERTED)
**Goal:** Build a curated, research-driven FAQ topic list that persists across regeneration cycles and fix the broken FAQ generation pipeline
**Depends on:** Phase 4.2
**Requirements**: LLM-02, LLM-05
**Success Criteria** (what must be TRUE):
  1. A curated FAQ topic list exists (e.g. data/llm/faq/curated-topics.json) with predefined topics derived from existing FAQ content, law text analysis, and research — not just LLM serendipity
  2. FAQ topics cover key municipal governance themes (e.g. Sitzungsoeffentlichkeit, Geheimhaltung, Informationspflicht, Befangenheit, Buergermeisterwahl) across all Bundeslaender
  3. The curated topic list is the authoritative input for FAQ generation — LLM uses it as basis but can propose additional topics within guardrails
  4. FAQ generation script (npm run llm:faq) runs without JSON parse errors and produces valid output
  5. Generated FAQ data passes npm run llm:validate
  6. Summary and glossary generation still work correctly — no regressions from FAQ pipeline changes (verify with llm:summaries dry-run and llm:glossary dry-run or targeted test)
**Plans**: 2 plans

Plans:
- [x] 04.3-01-PLAN.md -- Create curated FAQ topic list and refactor generateFAQ to per-topic LLM calls
- [x] 04.3-02-PLAN.md -- Run FAQ generation, validate output, and human quality verification

### Phase 5: Unified Search Engine
**Goal**: Users can search across all content types (Gesetze, FAQ, Glossar) from a single input and see results grouped by source with rich metadata
**Depends on**: Phase 4.3
**Requirements**: SRCH-02, SRCH-03, DSKT-01, DSKT-02, DSKT-03
**Success Criteria** (what must be TRUE):
  1. User types a query and sees results from Gesetze, FAQ, and Glossar grouped into visually distinct sections with content-type badges and per-group result counts
  2. Each search result shows enough context to evaluate relevance without clicking: law name, Bundesland, paragraph number for Gesetze; topic title for FAQ; term name for Glossar
  3. Desktop search results display in a larger panel (not the current small dropdown) that is space-efficient and scannable
  4. Bundesland filter applies only to Gesetze results while FAQ and Glossar results always appear regardless of filter selection
**Plans**: 3 plans

Plans:
- [ ] 05-01-PLAN.md -- Pagefind metadata tagging (typ filter + meta attributes) on law, FAQ, and Glossar page templates
- [ ] 05-02-PLAN.md -- Two-pass search architecture, grouped result rendering, expanded results panel CSS
- [ ] 05-03-PLAN.md -- E2E tests for unified search and visual verification checkpoint

### Phase 6: Search-Hero Homepage & Navigation
**Goal**: The homepage communicates "search first" with a prominent central search bar, quick-access discovery links, and polished navigation across all pages and viewports
**Depends on**: Phase 5
**Requirements**: SRCH-01, SRCH-04, SRCH-05, NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. User lands on the homepage and sees a large, centered search bar as the primary hero element with a value proposition tagline
  2. Below the search hero, user sees quick-access links to FAQ topics and popular glossary terms for browsable discovery without searching
  3. The former card grid of Gesetze is minimized or collapsed below the search hero, not the primary visual element
  4. Header layout is clean and consistent across all pages with FAQ and Glossar links visible and well-integrated on both desktop and mobile
  5. Navigation works on mobile without crowding or misalignment, with FAQ/Glossar links accessible at all breakpoints
**Plans**: 3 plans

Plans:
- [ ] 06-01-PLAN.md — Hero section layout, discovery links, collapsible card grid, and header nav polish
- [ ] 06-02-PLAN.md — Hero search JS integration (dual-input sync, hero dropdown, mobile overlay compatibility)
- [ ] 06-03-PLAN.md — E2E tests for hero, navigation, update existing tests, and visual verification

### Phase 7: Law Text Readability
**Goal**: Law text pages use improved typography, visual hierarchy, and summary-first layout so users can scan and understand content faster
**Depends on**: Phase 4.2
**Requirements**: READ-01, READ-02, READ-03, READ-04, READ-05
**Success Criteria** (what must be TRUE):
  1. Law text body uses improved typography (larger base size, generous line-height, constrained max-width) with clear visual hierarchy distinguishing Hauptstuecke, Abschnitte, and Paragraph headings
  2. LLM summary for each paragraph is visually prominent and always visible as orientation before the law text, not hidden in a collapsed section
  3. Numbered Absaetze within paragraphs are clearly separated and indented, not running together as a wall of text
  4. Important terms, structural markers, or key phrases in law text are visually highlighted to aid scanning
  5. Section headings (Hauptstuecke, Abschnitte) have strong visual hierarchy clearly distinguishing them from individual paragraph headings
**Plans**: TBD

## Progress

**Execution Order:**
Phase 4.3 first (FAQ fix), then Phases 5 and 7 can run in parallel (independent). Phase 6 depends on Phase 5.
Recommended: 4.3 -> 5 -> 6, with 7 parallelizable at any point after 4.3.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Data Pipeline & Project Foundation | v1.0 | 3/3 | Complete | 2026-03-11 |
| 2. Browsing & Branding | v1.0 | 3/3 | Complete | 2026-03-11 |
| 2.1 Frontend Testing Infrastructure | v1.0 | 2/2 | Complete | 2026-03-11 |
| 3. Search | v1.0 | 3/3 | Complete | 2026-03-11 |
| 4. LLM Enrichment | v1.0 | 4/4 | Complete | 2026-03-11 |
| 4.1 Visual Polish & Screenshot Review | v1.0 | 2/2 | Complete | 2026-03-11 |
| 4.2 Improve LLM Content Quality | v1.0 | 3/3 | Complete | 2026-03-11 |
| 4.3 Curated FAQ Topics & Fix FAQ Generation | v1.1 | 2/2 | Complete | 2026-03-12 |
| 5. Unified Search Engine | v1.1 | 0/3 | Not started | - |
| 6. Search-Hero Homepage & Navigation | v1.1 | 0/3 | Not started | - |
| 7. Law Text Readability | v1.1 | 0/? | Not started | - |
