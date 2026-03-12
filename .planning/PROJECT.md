# Gemeindeordnungs-Recherche

## What This Is

Eine öffentlich zugängliche, statische Webanwendung (GitHub Pages) die alle 9 österreichischen Gemeindeordnungen sowie 14 Statutarstadt-Stadtrechte durchsuchbar macht — mit Volltextsuche, LLM-generierten Zusammenfassungen, FAQ, Glossar und search-first UX. Zielgruppe sind primär Grüne GemeinderätInnen. Grünes Branding, WCAG AA, responsive.

## Core Value

GemeinderätInnen können in Sekunden jede Bestimmung über alle 9 Gemeindeordnungen finden — Volltextsuche mit Filtern nach Bundesland und Thema.

## Requirements

### Validated

- ✓ Alle 23 Gesetze (9 GO + 14 Stadtrechte) eingelesen und strukturiert — v1.0
- ✓ Volltextsuche mit Pagefind (German stemming, BL-Filter, Paragraph-Ergebnisse) — v1.0
- ✓ LLM-generierte Paragraph-Zusammenfassungen, 14 FAQ-Themen, 24 Glossar-Begriffe — v1.0
- ✓ Grünes Branding, WCAG AA, responsive Mobile — v1.0
- ✓ GitHub Pages Deployment mit CI — v1.0
- ✓ Unified cross-content search (Gesetze, FAQ, Glossar) mit gruppierten Ergebnissen — v1.1
- ✓ Search-hero Homepage mit zentraler Suchleiste und FAQ Discovery Links — v1.1
- ✓ Verbessertes Desktop-Suchresultat-Panel (größer, mehr Kontext, Content-Type Badges) — v1.1
- ✓ Law Text Readability (Typography, Absatz-Separation, Summary-first Layout) — v1.1
- ✓ Navigation-Polish (Header, FAQ/Glossar Links, Mobile) — v1.1
- ✓ Curated FAQ Topics (15 Themen) mit per-topic LLM Generation Pipeline — v1.1

### Active

<!-- Next milestone scope TBD — see /gsd:new-milestone -->

### Out of Scope

- Bundesland-Vergleiche — Komplexität zu hoch, evtl. v2
- Login/Authentifizierung — Seite ist öffentlich
- Echtzeit-API-Abfragen — Statische Seite, Daten werden bei Build verarbeitet
- Mobile App — Web-first, responsive reicht
- AI Chat / Q&A Interface — Haftungsrisiko (Winkelschreiberei), Halluzination, laufende Kosten
- @tailwindcss/typography — Confirmed broken on TailwindCSS v4; use scoped CSS

## Context

- Österreich hat 9 Bundesländer, jedes mit eigener Gemeindeordnung; Wien hat die Wiener Stadtverfassung
- 14 Statutarstädte haben eigene Stadtrechte — eigene Kategorie in der UI
- Datenquelle: RIS OGD API v2.6 (ris.bka.gv.at)
- LLM-Analyse passiert nur zur Entwicklungszeit via Claude Code CLI (Subscription statt API-Kosten)
- Bei Deployment werden aktuelle Gesetzestexte eingelesen und verarbeitet (Parsing, Indexierung)
- Grünes CI/Styleguide: https://bildgenerator.gruene.at/
- Zielgruppe hat geringe technische Affinität — UI muss intuitiv und einfach sein
- Tech stack: Vite 7, TailwindCSS v4 (CSS-first), Pagefind (German stemming), Playwright E2E
- Shipped v1.0 + v1.1 with ~195 source files, ~43K lines added in v1.1 alone

## Constraints

- **Hosting**: GitHub Pages — rein statisch, kein Server-Side-Code
- **Setup-Komplexität**: TailwindCSS ja, aber kein überladenes Build-Setup
- **Kosten**: LLM-Analyse nur bei Entwicklung, nicht bei jedem Build (Kosteneffizienz)
- **Datenaktualität**: Gesetzestexte werden bei Deployment neu eingelesen
- **Browser-only**: Suche muss komplett client-seitig funktionieren

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Statische Seite (GitHub Pages) | Einfach, kostenlos, kein Server nötig | ✓ Good |
| Client-seitige Suche (Pagefind) | WASM, chunked index, German stemming, ideal für statische Seiten | ✓ Good |
| LLM nur zur Dev-Time | Kosten sparen, statische Ergebnisse reichen | ✓ Good |
| TailwindCSS v4 (CSS-first) | Modern, flexibel, kein tailwind.config.js nötig | ✓ Good |
| Grünes CI/Branding | Öffentlich als Grünes Tool erkennbar | ✓ Good |
| Statutarstädte inkludieren | GemeinderätInnen in Statutarstädten brauchen auch Zugang | ✓ Good |
| RIS OGD API v2.6 | Offizielle API, kein Auth nötig, live getestet | ✓ Good |
| Claude Code CLI für LLM | Subscription nutzen statt API-Kosten | ✓ Good |
| Per-topic FAQ generation | Fixes 32K token overflow, better quality per topic | ✓ Good (v1.1) |
| Two-pass Pagefind search | BL filter for laws only, FAQ/Glossar always shown | ✓ Good (v1.1) |
| Scoped .law-text CSS class | Law-page-only typography without affecting other pages | ✓ Good (v1.1) |
| Always-visible summaries | Collapsed toggles defeated orientation purpose | ✓ Good (v1.1) |
| Hero search with IntersectionObserver | Dual-input sync, header takes over on scroll | ✓ Good (v1.1) |

---
*Last updated: 2026-03-12 after v1.1 milestone*
