# Requirements: Gemeindeordnungs-Recherche

**Defined:** 2026-03-10
**Core Value:** GemeinderätInnen können in Sekunden jede Bestimmung über alle 9 Gemeindeordnungen finden

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data Pipeline

- [x] **DATA-01**: System fetches all 9 Gemeindeordnungen from RIS OGD API v2.6
- [x] **DATA-02**: System parses fetched HTML into structured data (Paragraphen, Abschnitte, Überschriften)
- [x] **DATA-03**: System handles varying HTML structures across all 9 Bundesländer
- [x] **DATA-04**: System stores parsed data in a structured JSON format for downstream consumption
- [x] **DATA-05**: System displays "Stand: [Datum]" showing when data was last fetched

### Browsing

- [x] **BROW-01**: User can browse each Bundesland's Gemeindeordnung on a dedicated page
- [x] **BROW-02**: User sees auto-generated table of contents with collapsible sections
- [x] **BROW-03**: User can link directly to any paragraph via URL-Anker (z.B. `/wien/#p42`)
- [x] **BROW-04**: User can copy a deep link to any paragraph for sharing
- [x] **BROW-05**: User can read legal text in readable typography (line-height 1.6+, max-width ~70ch)
- [x] **BROW-06**: User can use the site on mobile during Gemeinderatssitzungen (responsive layout)

### Search

- [x] **SUCH-01**: User can search full-text across all 9 Gemeindeordnungen via Pagefind
- [x] **SUCH-02**: User sees highlighted search terms in results
- [x] **SUCH-03**: User sees contextual text snippets around matches
- [x] **SUCH-04**: User can select their Bundesland as primary context (persistent selection)
- [x] **SUCH-05**: Search defaults to selected Bundesland, with option to search across all
- [x] **SUCH-06**: User sees total result count (z.B. "23 Treffer")
- [x] **SUCH-07**: User sees meaningful empty state when no results found

### LLM Content

- [x] **LLM-01**: User sees plain-language summary per paragraph ("Vereinfachte Zusammenfassung")
- [x] **LLM-02**: Summaries display disclaimer: "Vereinfachte Zusammenfassung — keine Rechtsberatung"
- [x] **LLM-03**: User can browse thematic FAQ pages (Sitzungen, Abstimmungen, Befangenheit etc.)
- [x] **LLM-04**: FAQ answers link to relevant paragraphs across Bundesländer
- [x] **LLM-05**: User sees glossary page with explanations of legal terms
- [x] **LLM-06**: User sees inline tooltips for Fachbegriffe in legal text
- [x] **LLM-07**: User can filter paragraphs by Thema/Topic (via LLM topic tagging)

### Design & Branding

- [x] **DSGN-01**: Site uses Grünes CI (Farben, Logo) consistent with bildgenerator.gruene.at
- [x] **DSGN-02**: Site uses TailwindCSS for styling
- [x] **DSGN-03**: Site meets WCAG 2.1 AA accessibility standards (contrast, keyboard nav)

### Deployment

- [x] **DEPL-01**: Site builds and deploys to GitHub Pages via GitHub Actions
- [x] **DEPL-02**: GitHub Actions workflow fetches current Gemeindeordnungen at build time
- [x] **DEPL-03**: Dev-Scripts allow local LLM analysis (summaries, FAQs, glossary generation)
- [x] **DEPL-04**: LLM-generated content is committed to repo (not regenerated per deploy)

## v1.1 Requirements

Requirements for UI/UX Improvements milestone. Each maps to roadmap phases.

### Search UX

- [ ] **SRCH-01**: User sees a central, prominent search bar as the hero element on the homepage
- [ ] **SRCH-02**: User can search across Gesetze, FAQ, and Glossar from a single search input
- [ ] **SRCH-03**: Search results are grouped by content type (FAQ Antworten, Glossar, Paragraphen) so user can distinguish result sources
- [ ] **SRCH-04**: Homepage shows quick-access links below search hero (FAQ topics, popular terms) for browsable discovery
- [ ] **SRCH-05**: Homepage card grid is replaced by search-hero layout (GO/Stadtrechte list minimized or collapsed below)

### Desktop Search Results

- [ ] **DSKT-01**: Desktop search results use a larger display area (not the current small dropdown)
- [ ] **DSKT-02**: Each search result shows enough context (snippet, source type, location) to evaluate relevance without clicking
- [ ] **DSKT-03**: Search results are space-efficient — rich enough to be useful without overwhelming the view

### Law Text Readability

- [ ] **READ-01**: Law text has improved typography (line height, paragraph spacing, visual hierarchy between sections/Absätze/sub-items)
- [ ] **READ-02**: LLM summary is visually prominent and always visible as orientation before the law text (not hidden, not replacing law text)
- [ ] **READ-03**: Important terms, structural markers, or key phrases in law text are visually highlighted (color, weight, or underline) to aid scanning
- [ ] **READ-04**: Numbered Absätze within paragraphs are clearly separated and indented, not running together as wall of text
- [ ] **READ-05**: Section headings (Hauptstücke, Abschnitte) have strong visual hierarchy distinguishing them from paragraph headings

### Navigation & Polish

- [ ] **NAV-01**: Header layout is clean and consistent across all pages (search positioning, logo, nav links)
- [ ] **NAV-02**: FAQ and Glossar navigation links are visually polished and well-integrated into the header
- [ ] **NAV-03**: Navigation works well on both desktop and mobile without crowding or misalignment

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Browsing

- **BROW-07**: User can print sections with clean print stylesheet
- **BROW-08**: User can view cross-Bundesland comparison for same topic

### Enhanced Search

- **SRCH-06**: User can search within FAQ pages independently (dedicated FAQ search)
- **SRCH-07**: Search suggestions/autocomplete as user types
- **SUCH-07**: User sees recent searches (LocalStorage)

### Notifications

- **NOTF-01**: Site detects when Gemeindeordnungen were amended

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI Chat / Q&A Interface | Haftungsrisiko (Winkelschreiberei), Halluzination, laufende Kosten, benötigt Backend |
| User Accounts / Login | Backend-Abhängigkeit, DSGVO-Komplexität, Overkill für Referenz-Tool |
| Real-time RIS Sync | Bricht statisches Modell, Gemeindeordnungen ändern sich ~jährlich |
| Server-seitige Suche | GitHub Pages Constraint, Korpus nur 9 Gesetze — client-side reicht |
| PDF Export | Browser Print-to-PDF existiert, Link zu Original-RIS-Dokument |
| Mehrsprachigkeit | Zielgruppe ausschließlich deutschsprachig |
| Mobile App | Web-first, responsive reicht |
| Full-text search engine replacement | Pagefind validated and working; no need to switch |
| @tailwindcss/typography plugin | Confirmed broken on TailwindCSS v4; use scoped CSS instead |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| DATA-05 | Phase 1 | Complete |
| DEPL-01 | Phase 1 | Complete |
| DEPL-02 | Phase 1 | Complete |
| DEPL-03 | Phase 1 | Complete |
| DEPL-04 | Phase 1 | Complete |
| DSGN-02 | Phase 1 | Complete |
| BROW-01 | Phase 2 | Complete |
| BROW-02 | Phase 2 | Complete |
| BROW-03 | Phase 2 | Complete |
| BROW-04 | Phase 2 | Complete |
| BROW-05 | Phase 2 | Complete |
| BROW-06 | Phase 2 | Complete |
| DSGN-01 | Phase 2 | Complete |
| DSGN-03 | Phase 2 | Complete |
| SUCH-01 | Phase 3 | Complete |
| SUCH-02 | Phase 3 | Complete |
| SUCH-03 | Phase 3 | Complete |
| SUCH-04 | Phase 3 | Complete |
| SUCH-05 | Phase 3 | Complete |
| SUCH-06 | Phase 3 | Complete |
| SUCH-07 | Phase 3 | Complete |
| LLM-01 | Phase 4 | Complete |
| LLM-02 | Phase 4 | Complete |
| LLM-03 | Phase 4 | Complete |
| LLM-04 | Phase 4 | Complete |
| LLM-05 | Phase 4 | Complete |
| LLM-06 | Phase 4 | Complete |
| LLM-07 | Phase 4 | Complete |
| SRCH-02 | Phase 5 | Pending |
| SRCH-03 | Phase 5 | Pending |
| DSKT-01 | Phase 5 | Pending |
| DSKT-02 | Phase 5 | Pending |
| DSKT-03 | Phase 5 | Pending |
| SRCH-01 | Phase 6 | Pending |
| SRCH-04 | Phase 6 | Pending |
| SRCH-05 | Phase 6 | Pending |
| NAV-01 | Phase 6 | Pending |
| NAV-02 | Phase 6 | Pending |
| NAV-03 | Phase 6 | Pending |
| READ-01 | Phase 7 | Pending |
| READ-02 | Phase 7 | Pending |
| READ-03 | Phase 7 | Pending |
| READ-04 | Phase 7 | Pending |
| READ-05 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 32 total — all complete
- v1.1 requirements: 16 total — all mapped
- Phase 5 (Unified Search Engine): SRCH-02, SRCH-03, DSKT-01, DSKT-02, DSKT-03 (5 reqs)
- Phase 6 (Search-Hero Homepage & Navigation): SRCH-01, SRCH-04, SRCH-05, NAV-01, NAV-02, NAV-03 (6 reqs)
- Phase 7 (Law Text Readability): READ-01, READ-02, READ-03, READ-04, READ-05 (5 reqs)

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-12 after v1.1 roadmap creation*
