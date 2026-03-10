# Phase 1: Data Pipeline & Project Foundation - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Fetch all 9 Gemeindeordnungen + relevant Statutarstadt-Stadtrechte from RIS, parse into structured JSON, set up Vite+TailwindCSS build tooling, deploy to GitHub Pages via GitHub Actions. Dev-scripts for LLM analysis prepared (but LLM content generation is Phase 4).

**Scope expansion from discussion:** Originally 9 Gemeindeordnungen only. Now includes Wien (Wiener Stadtverfassung) + other relevant Statutarstädte with their Stadtrechte. Claude to research which Statutarstädte have relevante eigene Stadtrechte. Two categories in UI: "Gemeindeordnungen" and "Stadtrechte".

</domain>

<decisions>
## Implementation Decisions

### Data Structure
- Originaltext 1:1 aus RIS übernehmen — keine inhaltliche Bereinigung, exakter Wortlaut
- Metadaten pro Paragraph: §-Nummer, Titel, Abschnitt/Hauptstück (+ sinnvolle Extras nach Claudes Ermessen)
- JSON-Format und Gliederungstiefe: Claude's Discretion (basierend auf tatsächlicher Gesetzesstruktur)
- Gesetzesverweise (§ X des Y-Gesetzes): Claude's Discretion (Machbarkeit prüfen)

### Wien & Statutarstädte
- Wien: Wiener Stadtverfassung als Wiens Äquivalent zur Gemeindeordnung inkludieren
- Andere Statutarstädte: Relevante Stadtrechte ebenfalls aufnehmen
- Welche Statutarstädte relevant sind: Claude recherchiert (alle 15 oder Subset)
- UI-Darstellung: Eigene Kategorie "Stadtrechte" getrennt von "Gemeindeordnungen"
- Beides gleich durchsuchbar, aber klar unterscheidbar

### Update Workflow
- Manuell getriggerter GitHub Actions Workflow (kein automatischer Schedule)
- Nur "Stand: [Datum]" anzeigen — kein Änderungs-Diff
- Gemeindeordnungen ändern sich ~jährlich, manueller Trigger reicht

### Dev-Scripts & LLM
- LLM-Analyse via Claude Code CLI (Subscription nutzen, keine separate API)
- Script bereitet Paragraphen vor, ruft Claude Code CLI auf, sammelt Output
- Inkrementell: Nur Paragraphen ohne bestehende Analyse verarbeiten
- Output automatisch committen ohne manuellen Review
- Script-Sprache: Claude's Discretion
- Storage-Struktur für LLM-Output: Claude's Discretion

### Fehlerbehandlung
- Build bricht ab wenn ein Bundesland nicht abrufbar ist — kein partielles Deployment
- Build bricht ab wenn Parser auf unerwartete HTML-Struktur trifft — lieber kein Update als kaputte Daten

### Testbarkeit
- Automatisierte Tests für Parser sind wichtig — mit echten RIS-Samples
- Validierungsstrategie (Zählung, Stichprobe): Claude's Discretion

### Projekt-Setup
- Package Manager: Claude's Discretion
- Projektstruktur (Monorepo vs. flat): Claude's Discretion

### GitHub Actions & Deployment
- GitHub Actions Pages (direktes Deployment, kein gh-pages Branch)
- Custom Domain: Erstmal github.io, Custom Domain später möglich
- UI-Sprache: Komplett Deutsch (Code-Variablen können Englisch sein)

### Claude's Discretion
- JSON-Format und Gliederungstiefe
- Gesetzesverweise-Handling
- Script-Sprache (Node.js vs. Python)
- Projektstruktur
- Package Manager
- LLM-Output Storage-Struktur
- Validierungsstrategie für Parser

</decisions>

<specifics>
## Specific Ideas

- Claude Code CLI für LLM-Analyse nutzen statt API — Subscription-Kosten statt Token-Kosten
- Grüner Bildgenerator (https://bildgenerator.gruene.at/, https://github.com/GrueneAT/bildgenerator) als Design-Referenz
- Wiener Stadtverfassung separat kennzeichnen (nicht als "Gemeindeordnung" labeln)
- RIS OGD API v2.6 als Datenquelle (live getestet in Research-Phase, kein Auth nötig)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project

### Established Patterns
- None — first phase establishes patterns

### Integration Points
- RIS OGD API v2.6 (https://data.bka.gv.at/ris/api/v2.6/)
- GitHub Actions Pages deployment
- Grüner Bildgenerator repo as design/stack reference

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-data-pipeline-project-foundation*
*Context gathered: 2026-03-10*
