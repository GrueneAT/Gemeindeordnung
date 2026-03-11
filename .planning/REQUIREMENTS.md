# Requirements: Gemeindeordnungs-Recherche

**Defined:** 2026-03-10
**Core Value:** GemeinderätInnen können in Sekunden jede Bestimmung über alle 9 Gemeindeordnungen finden

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Data Pipeline

- [x] **DATA-01**: System fetches all 9 Gemeindeordnungen from RIS OGD API v2.6
- [ ] **DATA-02**: System parses fetched HTML into structured data (Paragraphen, Abschnitte, Überschriften)
- [x] **DATA-03**: System handles varying HTML structures across all 9 Bundesländer
- [ ] **DATA-04**: System stores parsed data in a structured JSON format for downstream consumption
- [ ] **DATA-05**: System displays "Stand: [Datum]" showing when data was last fetched

### Browsing

- [ ] **BROW-01**: User can browse each Bundesland's Gemeindeordnung on a dedicated page
- [ ] **BROW-02**: User sees auto-generated table of contents with collapsible sections
- [ ] **BROW-03**: User can link directly to any paragraph via URL-Anker (z.B. `/wien/#p42`)
- [ ] **BROW-04**: User can copy a deep link to any paragraph for sharing
- [ ] **BROW-05**: User can read legal text in readable typography (line-height 1.6+, max-width ~70ch)
- [ ] **BROW-06**: User can use the site on mobile during Gemeinderatssitzungen (responsive layout)

### Search

- [ ] **SUCH-01**: User can search full-text across all 9 Gemeindeordnungen via Pagefind
- [ ] **SUCH-02**: User sees highlighted search terms in results
- [ ] **SUCH-03**: User sees contextual text snippets around matches
- [ ] **SUCH-04**: User can select their Bundesland as primary context (persistent selection)
- [ ] **SUCH-05**: Search defaults to selected Bundesland, with option to search across all
- [ ] **SUCH-06**: User sees total result count (z.B. "23 Treffer")
- [ ] **SUCH-07**: User sees meaningful empty state when no results found

### LLM Content

- [ ] **LLM-01**: User sees plain-language summary per paragraph ("Vereinfachte Zusammenfassung")
- [ ] **LLM-02**: Summaries display disclaimer: "Vereinfachte Zusammenfassung — keine Rechtsberatung"
- [ ] **LLM-03**: User can browse thematic FAQ pages (Sitzungen, Abstimmungen, Befangenheit etc.)
- [ ] **LLM-04**: FAQ answers link to relevant paragraphs across Bundesländer
- [ ] **LLM-05**: User sees glossary page with explanations of legal terms
- [ ] **LLM-06**: User sees inline tooltips for Fachbegriffe in legal text
- [ ] **LLM-07**: User can filter paragraphs by Thema/Topic (via LLM topic tagging)

### Design & Branding

- [ ] **DSGN-01**: Site uses Grünes CI (Farben, Logo) consistent with bildgenerator.gruene.at
- [x] **DSGN-02**: Site uses TailwindCSS for styling
- [ ] **DSGN-03**: Site meets WCAG 2.1 AA accessibility standards (contrast, keyboard nav)

### Deployment

- [ ] **DEPL-01**: Site builds and deploys to GitHub Pages via GitHub Actions
- [ ] **DEPL-02**: GitHub Actions workflow fetches current Gemeindeordnungen at build time
- [ ] **DEPL-03**: Dev-Scripts allow local LLM analysis (summaries, FAQs, glossary generation)
- [ ] **DEPL-04**: LLM-generated content is committed to repo (not regenerated per deploy)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Browsing

- **BROW-07**: User can print sections with clean print stylesheet
- **BROW-08**: User can view cross-Bundesland comparison for same topic

### Enhanced Search

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
| Stadtrechte/Stadtstatute | Nur Gemeindeordnungen in v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| DEPL-01 | Phase 1 | Pending |
| DEPL-02 | Phase 1 | Pending |
| DEPL-03 | Phase 1 | Pending |
| DEPL-04 | Phase 1 | Pending |
| DSGN-02 | Phase 1 | Complete |
| BROW-01 | Phase 2 | Pending |
| BROW-02 | Phase 2 | Pending |
| BROW-03 | Phase 2 | Pending |
| BROW-04 | Phase 2 | Pending |
| BROW-05 | Phase 2 | Pending |
| BROW-06 | Phase 2 | Pending |
| DSGN-01 | Phase 2 | Pending |
| DSGN-03 | Phase 2 | Pending |
| SUCH-01 | Phase 3 | Pending |
| SUCH-02 | Phase 3 | Pending |
| SUCH-03 | Phase 3 | Pending |
| SUCH-04 | Phase 3 | Pending |
| SUCH-05 | Phase 3 | Pending |
| SUCH-06 | Phase 3 | Pending |
| SUCH-07 | Phase 3 | Pending |
| LLM-01 | Phase 4 | Pending |
| LLM-02 | Phase 4 | Pending |
| LLM-03 | Phase 4 | Pending |
| LLM-04 | Phase 4 | Pending |
| LLM-05 | Phase 4 | Pending |
| LLM-06 | Phase 4 | Pending |
| LLM-07 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after roadmap creation*
