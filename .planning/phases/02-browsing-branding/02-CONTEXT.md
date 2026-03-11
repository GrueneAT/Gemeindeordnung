# Phase 2: Browsing & Branding - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Dedicated browsable pages per Bundesland with auto-generated table of contents, deep links to paragraphs, readable typography, responsive layout, and full Grünes CI/Branding. Phase 1 already generates basic HTML pages — this phase transforms them into a polished, branded browsing experience.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Seitenstruktur
- Startseite: Bundesland-Karten als visuelles Grid, 9 Gemeindeordnungen oben, Stadtrechte als eigene Sektion darunter
- Gesetzesseiten: Breadcrumb oben (Startseite > Wien > § 42), kein Sidebar
- Bundesland-Dropdown im Header zum schnellen Wechsel ohne Umweg über Startseite
- Floating "Zurück nach oben"-Button unten rechts, erscheint beim Runterscrollen

### Inhaltsverzeichnis & Paragraphen-Layout
- Collapsible ToC nach Abschnitten: Hauptstücke/Abschnitte als aufklappbare Gruppen, standardmäßig eingeklappt
- Paragraphen immer komplett sichtbar (kein Accordion) — besser für Browser-Suche und Barrierefreiheit
- Abschnittsgrenzen visuell klar getrennt: horizontale Linie + deutlich größere Überschrift bei Hauptstücken/Abschnitten
- Typografie: System-Font-Stack, max-width ~70ch, line-height 1.6+, optimiert für längeres Lesen

### Grünes Branding & visuelles Design
- Farbschema + Stil vom Bildgenerator (bildgenerator.gruene.at) übernehmen — klar als Grünes Tool erkennbar
- Schlichter Header mit Logo links + Seitentitel auf jeder Seite, auf Gesetzesseiten zusätzlich Bundesland-Dropdown
- Minimaler Footer: Quelle (RIS-Link), Stand-Datum, "Keine Rechtsberatung"-Disclaimer, GitHub-Link
- Kein Dark Mode — nur Light, Grünes Branding ist für Light optimiert

### Deep Links & Sharing
- Hash-basierte Anker: /gemeindeordnungen/wien.html#p42 (nativ mit statischen Seiten)
- Link-kopieren-Icon erscheint bei Hover neben §-Nummer, kopiert Deep Link in Zwischenablage
- "Link kopiert!"-Tooltip nach Kopieren, verschwindet nach 2 Sekunden
- Paragraph wird beim Navigieren per Anker kurz grün hinterlegt (fade out nach 2s)

### Claude's Discretion
- Exakte Farbpalette-Erweiterung über die 3 Grundfarben hinaus (aus Bildgenerator ableiten)
- Genaue Karten-Gestaltung auf der Startseite (Schatten, Rundungen, Hover-Effekte)
- Responsive Breakpoints und Mobile-Anpassungen
- Accessibility-Details (Keyboard-Navigation, ARIA-Attribute, Kontrastwerte)
- Logo-Einbindung (SVG vs. PNG, Größe)
- Exact spacing und Padding-Werte

</decisions>

<specifics>
## Specific Ideas

- Bildgenerator.gruene.at als Design-Referenz (https://bildgenerator.gruene.at/, https://github.com/GrueneAT/bildgenerator)
- Zielgruppe hat geringe technische Affinität — UI muss intuitiv und einfach sein
- Wird in Gemeinderatssitzungen am Handy verwendet — responsive und schnell ladend
- "Keine Rechtsberatung"-Disclaimer wichtig (Haftungsrisiko)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/generate-pages.js`: Page generator already produces per-law HTML — needs enhancement for ToC, better layout, branding
- `src/css/main.css`: TailwindCSS v4 with @theme block (gruene-green, gruene-dark, gruene-light)
- `scripts/config.js`: Complete 23-law registry with all metadata (bundesland, kurztitel, stadt, category)

### Established Patterns
- TailwindCSS v4 CSS-first config (no tailwind.config.js, use @import "tailwindcss" and @theme)
- Vite 7 with @tailwindcss/vite plugin
- Dynamic Vite input discovery for multi-page builds
- German date format DD.MM.YYYY using UTC components

### Integration Points
- `generate-pages.js` produces HTML — all browsing/branding changes flow through this generator
- Paragraph IDs already use `id="par-{nummer}"` — needs alignment to `#p{nummer}` for BROW-03
- Index page already groups by category (gemeindeordnungen/stadtrechte)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-browsing-branding*
*Context gathered: 2026-03-11*
