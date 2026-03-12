# Phase 3: Search - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Pagefind full-text search with Bundesland selection as primary UX. Users can find any provision across all Gemeindeordnungen and Stadtrechte in seconds, with their Bundesland as the default search context. Search is integrated into the existing browsing experience from Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Suchfeld-Platzierung & Verhalten
- Suchfeld im Header auf jeder Seite (neben Logo und Bundesland-Dropdown)
- Ergebnisse als Dropdown/Overlay direkt unter dem Suchfeld — kein Seitenwechsel
- Live-Suche beim Tippen (ab 3 Zeichen), Pagefind ist performant genug für ~23 Gesetze
- Immer globale Suche (über alle Gesetze / gewähltes BL), nicht kontext-sensitiv pro Seite
- Auf Mobile: Such-Icon im Header, expandiert bei Klick als Overlay/Fullscreen
- Keyboard-Shortcut / oder Ctrl+K zum Fokussieren des Suchfelds (dezenter Hinweis im Placeholder)
- Mindestens 3 Zeichen bevor Suche startet, darunter Hinweis "Bitte mindestens 3 Zeichen eingeben"

### Bundesland-Kontext & Filterung
- Bundesland-Auswahl persistent via LocalStorage — beim nächsten Besuch gleiches BL vorausgewählt
- Toggle-Chips unter dem Suchfeld: "[Mein BL]" (aktiv) | "Alle Bundesländer"
- Stadtrechte zählen zum jeweiligen Bundesland (nicht separat filterbar), werden in Ergebnissen als Stadtrecht markiert
- Bei "Alle Bundesländer": Ergebnisse nach Bundesland gruppiert mit Gruppen-Überschriften und Trefferzahl pro BL

### Ergebnis-Darstellung
- 1-2 Zeilen Kontext-Snippet mit hervorgehobenem Suchbegriff (fett/markiert)
- Trefferzahl prominent oben im Dropdown: "23 Treffer" oder "12 Treffer in Wien"
- Max 10-15 Treffer im Dropdown (scrollbar), danach Link "Alle X Treffer anzeigen" für Vollansicht
- Bei Klick auf Treffer: Suchbegriff auf Zielseite gelb/grün markiert (zusätzlich zum Scroll zum §)

### Leere Zustände & Fehlerfälle
- "Keine Treffer für '[Begriff]' in [BL/Alle]" mit hilfreichen Vorschlägen:
  - "Versuchen Sie einen anderen Suchbegriff"
  - "In allen Bundesländern suchen" (wenn BL gefiltert)
  - "Zur Übersicht"
- Freundliche, nicht-technische Sprache

### Claude's Discretion
- Pagefind-Konfiguration (Index-Granularität, Gewichtung, Stemming-Einstellungen)
- Exaktes Dropdown-Design (Schatten, Breite, max-height, Scroll-Verhalten)
- Highlighting-Implementierung auf Zielseite (CSS :target, URL-Parameter, etc.)
- "Alle Treffer anzeigen" Vollansicht-Layout
- Debounce-Timing für Live-Suche
- Pagefind UI vs. custom UI decision

</decisions>

<specifics>
## Specific Ideas

- Pagefind ist bereits als Such-Library entschieden (WASM-basiert, chunked index, German stemming)
- Zielgruppe nutzt die Site in Gemeinderatssitzungen am Handy — Suche muss schnell und intuitiv sein
- UI komplett Deutsch
- Suchergebnisse auf Mobile müssen touch-freundlich sein (ausreichend große Tap-Targets)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 2 Header mit Logo + Bundesland-Dropdown — Suchfeld wird hier integriert
- `scripts/generate-pages.js`: Generiert HTML-Seiten die von Pagefind indexiert werden
- Paragraph-IDs (`#p{nummer}`) aus Phase 2 für Deep Links in Suchergebnissen
- TailwindCSS v4 Gruene-Theme für konsistentes Styling

### Established Patterns
- TailwindCSS v4 CSS-first (kein tailwind.config.js)
- Vite 7 Build-Pipeline — Pagefind muss nach Vite-Build laufen (indexiert fertiges HTML)
- Multi-Page Static Site — jede Gesetzesseite ist eigenes HTML
- German date format DD.MM.YYYY

### Integration Points
- Pagefind muss in GitHub Actions deploy.yml als Post-Build-Step integriert werden
- Bundesland-Dropdown im Header wird für Such-Filter wiederverwendet (gleiche Datenquelle)
- Suchergebnis-Links nutzen bestehende URL-Struktur: /gemeindeordnungen/wien.html#p42

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-search*
*Context gathered: 2026-03-11*
