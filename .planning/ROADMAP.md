# Roadmap: Gemeindeordnungs-Recherche

## Overview

This project delivers a static website that makes all 9 Austrian Gemeindeordnungen searchable for Gruene GemeinderaetInnen. The roadmap progresses from data acquisition (fetching and parsing laws from RIS API) through a browsable site with Gruenes branding, then adds Pagefind-powered search with Bundesland selection as the primary UX, and finally enriches the content with LLM-generated summaries, FAQs, and glossary. Each phase delivers a coherent, verifiable capability that builds on the previous.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Data Pipeline & Project Foundation** - Fetch all 9 Gemeindeordnungen from RIS, parse into structured data, set up build tooling and deployment
- [ ] **Phase 2: Browsing & Branding** - Browsable Gemeindeordnung pages with Gruenes CI, responsive layout, and accessibility
- [ ] **Phase 3: Search** - Pagefind full-text search with Bundesland selection as primary UX
- [ ] **Phase 4: LLM Enrichment** - Dev-time generated summaries, FAQs, glossary, and topic tagging

## Phase Details

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
- [ ] 01-01-PLAN.md -- Project setup (Vite + TailwindCSS v4 + vitest) and RIS law fetch script with complete 23-law registry
- [ ] 01-02-PLAN.md -- Cheerio HTML parser with real RIS test fixtures and structured JSON output
- [ ] 01-03-PLAN.md -- Page generation, GitHub Actions deployment workflow, and LLM dev-script stub

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
- [ ] 02-01-PLAN.md -- Gruene branding theme, page generator rewrite with header/footer, ToC, breadcrumbs, Bundesland cards, responsive typography
- [ ] 02-02-PLAN.md -- Interactive JS features (clipboard copy, scroll-to-top, Bundesland dropdown, anchor highlight) and visual verification
- [ ] 02-03-PLAN.md -- Gap closure: fix copy button visibility bug (missing group class, orphaned CSS rule)

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
- [ ] 02.1-01-PLAN.md -- Playwright setup (config, deps, npm scripts) and first 5 UAT tests (browse-page, ToC, card-grid, typography, copy-link)
- [ ] 02.1-02-PLAN.md -- Remaining 5 UAT tests (scroll-to-top, dropdown-nav, anchor-highlight, mobile, accessibility) and CI workflow integration

### Phase 3: Search
**Goal**: Users can find any provision across all 9 Gemeindeordnungen in seconds, with their Bundesland as the default search context
**Depends on**: Phase 2
**Requirements**: SUCH-01, SUCH-02, SUCH-03, SUCH-04, SUCH-05, SUCH-06, SUCH-07
**Success Criteria** (what must be TRUE):
  1. User can search full-text across all 9 Gemeindeordnungen via Pagefind with highlighted search terms and contextual snippets around matches
  2. User can select their Bundesland as primary context (persistent selection) and search defaults to that Bundesland with option to search across all
  3. User sees total result count (e.g. "23 Treffer") and a meaningful empty state when no results are found
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: LLM Enrichment
**Goal**: Legal text is enriched with plain-language summaries, thematic FAQs, a glossary, and topic tagging -- all generated at dev-time
**Depends on**: Phase 2
**Requirements**: LLM-01, LLM-02, LLM-03, LLM-04, LLM-05, LLM-06, LLM-07
**Success Criteria** (what must be TRUE):
  1. User sees a "Vereinfachte Zusammenfassung" per paragraph with disclaimer "keine Rechtsberatung", displayed alongside the original legal text
  2. User can browse thematic FAQ pages (Sitzungen, Abstimmungen, Befangenheit etc.) with answers that link to relevant paragraphs across Bundeslaender
  3. User can look up legal terms in a glossary page and sees inline tooltips for Fachbegriffe in the legal text
  4. User can filter paragraphs by Thema/Topic using LLM-generated topic tags
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 2.1 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Data Pipeline & Project Foundation | 3/3 | Complete | 2026-03-11 |
| 2. Browsing & Branding | 3/3 | Complete | 2026-03-11 |
| 2.1 Frontend Testing Infrastructure | 0/2 | Not started | - |
| 3. Search | 0/? | Not started | - |
| 4. LLM Enrichment | 0/? | Not started | - |
