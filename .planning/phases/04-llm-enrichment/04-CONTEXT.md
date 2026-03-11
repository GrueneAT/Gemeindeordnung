# Phase 4: LLM Enrichment - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Dev-time LLM-generated content: plain-language summaries per paragraph, thematic FAQ pages, glossary with inline tooltips, and topic tagging with filtering. All content generated via Claude Code CLI at development time, committed to repo, and served statically. No runtime LLM calls.

</domain>

<decisions>
## Implementation Decisions

### Zusammenfassungen — Ton & Darstellung
- Ton: Sachlich-verständlich, klare einfache Sprache ohne Juristendeutsch, nicht umgangssprachlich. "Dieser Paragraph regelt, dass..."
- Länge: 1-3 Sätze pro Paragraph, kurz und prägnant
- Platzierung: Aufklappbar unter §-Überschrift, standardmäßig eingeklappt. Kleiner Link "Vereinfachte Zusammenfassung" — Klick klappt auf
- Disclaimer: Einmal pro Seite oben als Info-Box: "Vereinfachte Zusammenfassungen dienen der Orientierung und sind keine Rechtsberatung"
- Nicht bei jeder Zusammenfassung wiederholen

### FAQ-Themen & Struktur
- Themen: Komplett von Claude generiert basierend auf tatsächlichem Gesetzesinhalt
- Struktur: Eine eigene Seite pro Thema (/faq/abstimmungen.html etc.)
- Antworten: Erwähnen Unterschiede zwischen Bundesländern, verlinken auf relevante §§ über alle BL hinweg
- Navigation: "FAQ" als Link im Header + Sektion "Häufige Fragen" auf der Startseite mit Themen als Karten/Links
- Disclaimer auf FAQ-Seiten analog zu Zusammenfassungen

### Glossar & Inline-Tooltips
- Inline-Tooltips: Fachbegriffe im Gesetzestext dezent unterstrichen (gestrichelt), Hover zeigt Tooltip mit Erklärung, Mobile: Tap öffnet Tooltip, Link zum Glossar-Eintrag
- Glossar-Seite: Alphabetisch mit A-Z Sprungmarken, jeder Eintrag mit Erklärung + Verweis auf relevante §§
- Umfang: Konservativ — nur echte Fachbegriffe die ein Laie nicht kennt (Befangenheit, Kollegialorgan, Dringlichkeitsantrag etc.), nicht jedes juristische Wort
- Suchbarkeit: Glossar-Einträge werden von Pagefind mitindexiert
- Navigation: "Glossar" als Link im Header

### Topic-Tagging & Filterung
- Taxonomie: Von Claude frei generiert basierend auf Gesetzesinhalt (konsistent mit FAQ-Themen)
- Mehrere Topics pro Paragraph möglich (Paragraph kann z.B. "Abstimmungen" UND "Gemeinderatssitzungen" haben)
- Filter-UI: Tag-Chips als horizontale Reihe über dem ToC auf Gesetzesseiten
- Filter-Modus: Nicht-relevante Paragraphen ausblenden, "Alle" zeigt wieder alles
- Topics sollten mit FAQ-Themen konsistent sein (gleiche oder ähnliche Kategorien)

### Claude's Discretion
- Exakte Prompt-Gestaltung für LLM-Generierung (Zusammenfassungen, FAQs, Glossar, Topics)
- Reihenfolge der Generierungsschritte (Topics first vs. Summaries first)
- JSON-Struktur der LLM-Outputs
- Anzahl der FAQ-Themen (Claude bestimmt basierend auf Inhalt)
- Anzahl der Glossar-Einträge
- Tooltip-Bibliothek vs. custom CSS
- Wie Topics und FAQ-Themen synchron gehalten werden

</decisions>

<specifics>
## Specific Ideas

- Claude Code CLI für LLM-Analyse (Subscription nutzen, keine API-Kosten) — bereits in Phase 1 entschieden
- Inkrementell: Nur Paragraphen ohne bestehende Analyse verarbeiten
- Output automatisch committen ohne manuellen Review
- LLM stub script existiert bereits (`scripts/llm-analyze.js` mit --dry-run)
- FAQ-Antworten als "Mini-Bundesländervergleich" — das ist ein einzigartiger Mehrwert für GemeinderätInnen
- Topics und FAQ-Themen aus gleicher Analyse ableiten (ein LLM-Pass, nicht zwei separate)

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `scripts/llm-analyze.js`: LLM stub script mit --dry-run und inkrementellem Skip (aus Phase 1)
- `data/llm/summaries/{category}/{key}.json`: Storage-Struktur bereits angelegt
- `scripts/generate-pages.js`: Page generator muss erweitert werden für Zusammenfassungen, Tooltips, Topic-Chips
- `scripts/config.js`: 23-law registry mit allen Metadaten
- Phase 2 Collapsible ToC-Pattern: Wiederverwendbar für Zusammenfassungs-Aufklappfunktion

### Established Patterns
- TailwindCSS v4 CSS-first
- Vite 7 Multi-Page Build mit dynamischem Input Discovery
- HTML-Generierung in `generate-pages.js` — alle LLM-UI-Elemente fließen hierüber ein
- Pagefind indexiert statisches HTML — Glossar/FAQ-Seiten werden automatisch mitindexiert

### Integration Points
- `generate-pages.js` muss LLM-JSON lesen und in HTML rendern (Zusammenfassungen, Tooltips, Topic-Chips)
- Neue Seiten: /faq/*.html, /glossar.html — müssen in Vite Input Discovery und Navigation eingebunden werden
- Pagefind muss FAQ- und Glossar-Seiten mitindexieren
- Header-Navigation muss um FAQ + Glossar Links erweitert werden

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-llm-enrichment*
*Context gathered: 2026-03-11*
