# Gemeindeordnungs-Recherche

## What This Is

Eine öffentlich zugängliche, statische Webanwendung (GitHub Pages) die alle 9 österreichischen Gemeindeordnungen (eine pro Bundesland) sowie relevante Stadtrechte der Statutarstädte durchsuchbar macht. Zielgruppe sind primär Grüne GemeinderätInnen, die schnell nach Stichwörtern über alle Gemeindeordnungen und Stadtrechte suchen wollen. Die Seite wird mit Grünem Branding versehen und ist öffentlich zugänglich.

## Core Value

GemeinderätInnen können in Sekunden jede Bestimmung über alle 9 Gemeindeordnungen finden — Volltextsuche mit Filtern nach Bundesland und Thema.

## Requirements

### Validated

<!-- Shipped in v1.0 and confirmed working. -->

- ✓ Alle 23 Gesetze (9 GO + 14 Stadtrechte) eingelesen und strukturiert — v1.0
- ✓ Volltextsuche mit Pagefind (German stemming, BL-Filter, Paragraph-Ergebnisse) — v1.0
- ✓ LLM-generierte Paragraph-Zusammenfassungen, 14 FAQ-Themen, 24 Glossar-Begriffe — v1.0
- ✓ Grünes Branding, WCAG AA, responsive Mobile — v1.0
- ✓ GitHub Pages Deployment mit CI — v1.0

### Active

<!-- Current scope: v1.1 UI/UX Improvements — see REQUIREMENTS.md -->

### Out of Scope

- Bundesland-Vergleiche — Komplexität zu hoch für v1, evtl. v2
- Login/Authentifizierung — Seite ist öffentlich
- Stadtrechte nicht-relevanter Statutarstädte — Nur relevante Statutarstädte mit eigenen Stadtrechten
- Echtzeit-API-Abfragen — Statische Seite, Daten werden bei Build verarbeitet
- Mobile App — Web-first, responsive reicht

## Current Milestone: v1.1 UI/UX Improvements

**Goal:** Transform from content-display site to search-first "find answers fast" tool with great readability.

**Target features:**
- Search-hero homepage with central, prominent search bar
- Unified search across Gesetze, FAQ, and Glossar (grouped results)
- Improved desktop search results (bigger, more context, not a tiny dropdown)
- Law text readability overhaul (typography, visual hierarchy, summary-first layout)
- Navigation polish (FAQ/Glossar links, header layout)
- Fewer clicks to answers — surface relevant content directly in search results

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
*Last updated: 2026-03-12 after v1.1 milestone start*
