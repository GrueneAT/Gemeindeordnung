# Gemeindeordnungs-Recherche

## What This Is

Eine öffentlich zugängliche, statische Webanwendung (GitHub Pages) die alle 9 österreichischen Gemeindeordnungen (eine pro Bundesland) sowie relevante Stadtrechte der Statutarstädte durchsuchbar macht. Zielgruppe sind primär Grüne GemeinderätInnen, die schnell nach Stichwörtern über alle Gemeindeordnungen und Stadtrechte suchen wollen. Die Seite wird mit Grünem Branding versehen und ist öffentlich zugänglich.

## Core Value

GemeinderätInnen können in Sekunden jede Bestimmung über alle 9 Gemeindeordnungen finden — Volltextsuche mit Filtern nach Bundesland und Thema.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Alle 9 Gemeindeordnungen (eine pro Bundesland) + relevante Statutarstadt-Stadtrechte einlesen und strukturiert verarbeiten
- [ ] Volltextsuche über alle Gemeindeordnungen mit Ergebnisanzeige
- [ ] Filter nach Bundesland und Abschnitt/Thema
- [ ] LLM-generierte Paragraph-Zusammenfassungen in einfacher Sprache (Dev-Time)
- [ ] LLM-generierte Themen-FAQs (Sitzungen, Abstimmungen, Befangenheit etc.) (Dev-Time)
- [ ] LLM-generiertes Glossar juristischer Fachbegriffe (Dev-Time)
- [ ] Modernes Frontend mit TailwindCSS und Grünem CI/Branding
- [ ] Client-seitige Suche mit geeigneter Library (z.B. Lunr.js, FlexSearch)
- [ ] Deployment via GitHub Pages mit GitHub Actions
- [ ] Dev-Scripts zum lokalen Einlesen/Verarbeiten der Gemeindeordnungen
- [ ] Dev-Scripts für LLM-Analyse (Zusammenfassungen, FAQs, Glossar)
- [ ] Suchindex wird bei Build/Deployment generiert

### Out of Scope

- Bundesland-Vergleiche — Komplexität zu hoch für v1, evtl. v2
- Login/Authentifizierung — Seite ist öffentlich
- Stadtrechte nicht-relevanter Statutarstädte — Nur relevante Statutarstädte mit eigenen Stadtrechten
- Echtzeit-API-Abfragen — Statische Seite, Daten werden bei Build verarbeitet
- Mobile App — Web-first, responsive reicht

## Context

- Österreich hat 9 Bundesländer, jedes mit eigener Gemeindeordnung; Wien hat die Wiener Stadtverfassung
- Relevante Statutarstädte (bis zu 15) haben eigene Stadtrechte — eigene Kategorie in der UI
- Datenquellen: RIS (ris.bka.gv.at) und/oder Landes-Rechtsdatenbanken — genaue Quelle wird in Research-Phase geklärt
- LLM-Analyse passiert nur zur Entwicklungszeit, nicht bei jedem Deployment
- Bei Deployment werden aktuelle Gesetzestexte eingelesen und verarbeitet (Parsing, Indexierung)
- Grünes Corporate Identity/Styleguide vorhanden für Branding
- Design-Referenz: https://bildgenerator.gruene.at/ (Repo: https://github.com/GrueneAT/bildgenerator)
- Zielgruppe hat geringe technische Affinität — UI muss intuitiv und einfach sein

## Constraints

- **Hosting**: GitHub Pages — rein statisch, kein Server-Side-Code
- **Setup-Komplexität**: TailwindCSS ja, aber kein überladenes Build-Setup
- **Kosten**: LLM-Analyse nur bei Entwicklung, nicht bei jedem Build (Kosteneffizienz)
- **Datenaktualität**: Gesetzestexte werden bei Deployment neu eingelesen
- **Browser-only**: Suche muss komplett client-seitig funktionieren

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Statische Seite (GitHub Pages) | Einfach, kostenlos, kein Server nötig | — Pending |
| Client-seitige Suche | Kein Backend möglich bei GitHub Pages | — Pending |
| LLM nur zur Dev-Time | Kosten sparen, statische Ergebnisse reichen | — Pending |
| TailwindCSS | Modern, flexibel, gut für Branding | — Pending |
| Grünes CI/Branding | Öffentlich als Grünes Tool erkennbar | — Pending |
| Statutarstädte inkludieren | GemeinderätInnen in Statutarstädten brauchen auch Zugang | — Pending |
| Pagefind für Suche | WASM-basiert, chunked index, German stemming, ideal für statische Seiten | — Pending |
| RIS OGD API v2.6 | Offizielle API, kein Auth nötig, live getestet | — Pending |
| Claude Code CLI für LLM | Subscription nutzen statt API-Kosten | — Pending |

---
*Last updated: 2026-03-10 after Phase 1 discussion*
