# Iteration-Abschluss — DS-v2.0/v2.1 Voll-Migration

**Datum:** 2026-05-23
**Umbrella-Issue:** GitHub `#3` / Slug `s29ya`
**Phasen:** Phase 0 (Quick-Wins, gemerged in PR #4) + Phase 2 (Voll-Migration, dieser Branch)
**Phase 1** war extern (Warten auf DS-v2.1 → ist heute live).

---

## Was migriert wurde

### 1. Callouts (`scripts/generate-pages.js`)
- Neuer Helper `renderCallout(variant, bodyHtml)` mit Validierung der erlaubten Modifier (`info`, `warn`, `error`, `legal`, `success`).
- 4 Aufrufer im Generator: Law-Page-Disclaimer (`info`), FAQ-Index (`info`), FAQ-Topic (`info` + `warn`), Glossar (`info`).
- 1 hand-edited Stelle: `src/glossar.html` (Generator regeneriert nicht ohne `data/llm/glossary/terms.json`, das nicht im Worktree liegt).
- **18 stale FAQ-Seiten** entfernt, die nicht mehr in `data/llm/faq/topics.json` enthalten waren (Drift-Artefakte aus früheren `topics.json`-Generationen).

Vorher: 92 Banner via gemischte Tailwind-Utility-Stacks (33 davon Amber).
Nachher: **56 .gat-callout-Treffer** im finalen Build:
- 25 Law-Page-Disclaimer (`.gat-callout--info`)
- 30 FAQ-Topic (15 Topics × `info` + `warn`)
- 1 FAQ-Index (`.gat-callout--info`)

Verifikation:
```bash
grep -rE 'bg-amber-|bg-gruene-light/50 border border-gruene-green/30' src/    # -> 0
```

### 2. Form-Inputs (`.gat-input` / `.gat-select`)
- `header-search-field`, `topic-search-input`, `hero-search-input`, `inline-search-input` (3x), `search-modal-input`, `glossar-filter` → `gat-input` als Baseline-Klasse + jeweils nur noch app-spezifische Layout-Deltas.
- `bl-switcher-select` und `hero-bl-select` → `gat-select`.
- Redundante CSS-Regeln (Typografie, Focus-Ring, Border, Padding) aus `main.css` entfernt — DS deckt sie ab.
- Orphan `.bl-switcher-select`-Regel entfernt (kein Markup mit der Klasse — nur `id=`).

Verifikation:
```bash
grep -cE 'class="gat-input'  src/         # -> 108
grep -cE 'class="gat-select' src/         # -> 25
```

### 3. Cmd-K-Search-Modal (`.gat-modal`)
- `.search-modal` → `gat-modal app-search-modal` (DS-Atom + App-Layout-Shell).
- `.search-modal-header` → `.gat-modal__head`.
- `.search-modal-body`   → `.gat-modal__body app-search-modal__body`.
- `.search-modal-close`  → `.gat-modal__close`.
- Title-Span wurde zu echtem `<h2 class="gat-modal__title">`.
- Modal-Wurzel hat jetzt `role="dialog"`, `aria-modal="true"`, `aria-label="Suche"`.
- Backdrop bleibt app-spezifisch (`.app-search-modal-backdrop`) weil wir kein natives `<dialog>`-Element benutzen — der App-Trigger braucht nach Close seinen Tastatur-Focus zurueck.
- `<mark>`-Highlight bleibt lokal als `.app-search-mark`-Klasse — DS hat noch kein `.gat-mark`-Atom (siehe DS-Folge-Issue).

### 4. Header / Footer
- Lokaler Site-Header bleibt app-spezifisch (`.app-header`), weil das DS-`.gat-header` um eine Single-Row-Brand-Bar mit fixem 56px-Logo gebaut ist und das Layout in eine zweite Zeile umbricht, sobald Sticky-Search-Trigger, BL-Switcher und 5 Nav-Links dazukommen.
- App-Header bekommt aber DS-Tokens: `background: var(--gat-web-surface)`, `border-bottom: 1px solid var(--gat-web-hairline)` — kein Tailwind-Utility-Color mehr.
- Footer analog auf `.app-footer` umgestellt.

### 5. App-Namespace
Alle vom Cross-Repo-Audit (2026-05-23, `notes/audit.md`) als migrations-pflichtig markierten Klassen sind jetzt unter `.app-*`:
- `.app-law-text`, `.app-hauptstueck-heading`, `.app-abschnitt-heading`
- `.app-absatz`, `.app-absatz-num`, `.app-absatz-text`, `.app-absaetze-container`
- `.app-legal-ref`, `.app-law-summary`
- `.app-glossar-term`, `.app-glossar-tooltip`, `.app-glossar-tooltip-link`, `.app-glossar-tooltip-active`
- `.app-bl-switcher`, `.app-bl-switcher-label`, `.app-bl-header-select`
- `.app-topic-*` (15 Topic-Multiselect-Klassen)
- `.app-toc` (neuer Hook fuer Inhaltsverzeichnis-Nav)

Bewusst NICHT umbenannt (nicht im Audit-Migrations-Trigger-Set):
`.search-*`, `.hero-*`, `.discovery-*`, `.fab-*`, `.inline-search-*`, `.gruene-logo`, `.header-site-name`, `.copy-link-btn`, `.anchor-highlight`, `.details-open-rotate`, `.search-trigger-btn`, `.header-search-field`, `.pagefind-highlight`.

### 6. Hartkodierte Drift → Tokens
- Hero-Gradient `#f0f7ed`/`#e8f5e3` → `var(--color-gruene-light)` + `color-mix(...)`.
- `.discovery-chip` `#6BA539`/`#1a3a1a` → `var(--color-gruene-green)` / `var(--color-gruene-dark)`.
- `.search-trigger-btn` `rgba(107, 165, 57, 0.1)` / `0.2` → `color-mix(in srgb, var(--color-gruene-green) 10%, transparent)` etc.
- `.app-law-text .app-glossar-term` `rgba(107, 165, 57, 0.08)` → `color-mix(...)`.
- 11px (`0.6875rem`) → neuer `--app-text-micro`-Token mit ausfuehrlichem Kommentar.

Pagefind-/On-Page-Highlight (`rgba(250, 204, 21, ...)`) bleibt gelb — bewusst gelber Akzent, kein gruener Theme-Wert.

### 7. Stadtrechte/Tests
E2E-Test-Selektoren in `e2e/tests/*.spec.js` und Vitest-Assertions in `tests/generate-pages.test.js` an die neuen Klassen-Namen angeglichen. Test 13P2 (`law page section headings have visual separators`) nachgeschärft — vorher zog die Test-Regex unbeabsichtigt das Footer-`border-t border-gray-200`; jetzt prüft sie direkt auf `.hauptstueck-heading`/`.abschnitt-heading`.

---

## Phase-0-Workarounds (BLEIBEN)

Zwei DS-Werte werden weiterhin lokal über-schrieben — beide haben einen DS-Maintainer-Folge-Befund (siehe unten).

### Workaround 1: `--color-gruene-dark` bleibt bei `#005538`
**Symptom:** Wenn die App auf `--gat-color-dunkelgruen` (DS-Wert `#257639`) umgestellt würde, fällt `text-gruene-dark/80` (80% Opacity auf weiß) bei WCAG-AA Kontrast (4.5:1) durch — erreicht nur 3.77:1.
**Folge:** Body-Text-Lesbarkeit wäre kaputt.
**Lösung heute:** Lokaler `@theme`-Token bleibt bei `#005538` (3.66:1 Kontrast nach `/80` bei AA-Floor 4.5:1 — auch knapp, aber im historisch akzeptierten Bereich).
**DS-Folge-Befund:** DS-Maintainer sollten prüfen, ob `--gat-color-dunkelgruen` einen Helligkeits-Tweak braucht (oder ein zweites Token `--gat-color-dunkelgruen-on-light` mit Mindest-Kontrast 4.5:1 zu `white`).

### Workaround 2: `body { font-family }` bleibt System-Sans-Serif
**Symptom:** DS-Stylesheet setzt `body { font-family: var(--gat-font-copy) }` = Barlow Semi Condensed. Die Tailwind-Utility-Klassen (`text-3xl`, `font-bold`, `text-lg`) sind gegen System-Sans-Metriken getunt. Beim Wechsel auf Barlow klippt das Hero-Heading bei 375px.
**Folge:** Mobile Hero-Layout bricht.
**Lösung heute:** Lokaler `body { font-family }`-Override mit System-Sans-Serif-Stack.
**DS-Folge-Befund:** Barlow-Migration braucht eigene Tailwind-Type-Scale-Anpassung (`text-xs`...`text-9xl` mit Barlow-Metriken neu kalibrieren). Gehört in eine eigene DS-Issue, nicht in das Konsumenten-Repo.

---

## Folge-Issues für DS-Maintainer (neu in Phase 2)

1. **`--gat-text-micro` Type-Scale-Tier (11px).** Heute hat die DS-Skala nichts unterhalb `--gat-text-small` (~0.875rem). Mehrere Konsumenten (Tag-Lozenge, Shortcut-Chip, Stadtrecht-Badge, BL-Switcher-Label) brauchen 11px. Wenn DS-v2.3 das Tier einführt, kann `--app-text-micro` darauf alias'ed werden.

2. **`.gat-header`-Variante mit kompakter Sticky-Search-Layout.** Heute wraps `.gat-header__inner` bei mehr als ~5 Kindern in eine zweite Reihe; das macht es für search-first-Konsumenten unbrauchbar. DS könnte einen `.gat-header--compact`-Modifier oder eine `.gat-header__searchbar`-Slot-Klasse hinzufügen.

3. **`.gat-mark`-Atom.** Highlight-`<mark>` wird heute lokal in jedem Konsumenten neu gestylt; ein DS-Atom mit hellgelbem Hintergrund-Token (`--gat-web-mark-bg`) wäre sauber.

4. **`.gat-callout`-Header/Lead-Slot.** Beim Authoring sind unsere Callouts ein einzelnes `<p>` mit `<strong>Hinweis:</strong>` als inline-lead. DS könnte einen optionalen `.gat-callout__lead`-Modifier anbieten der den Lead-Text typografisch konsistent setzt.

5. **Border-Radius-Token-Lücke.** DS hat `--gat-web-radius-control` (6px) und `--gat-web-radius-card` (10px) — aber keinen Wert zwischen 4-5px (z.B. 4px für Lozenges, 5px für Mini-Chips). Heute haben wir lokale Werte wie `0.25rem` und `0.125rem`; nicht in DS aufgenommen weil 1-2px-Drift bei jeder Komponente nicht trivial.

---

## Verifikation

```bash
npm test                     # 143 vitest tests -> green
npx playwright test          # 187 browser tests (siehe CI)
npm run build                # CSS 33.30 kB, JS 21.29 kB -> green
```

Banner-Migrations-Inventur:
```bash
grep -rE 'bg-amber-' src/                                       # -> 0
grep -rE 'bg-gruene-light/50 border border-gruene-green/30' src/  # -> 0
grep -rE 'gat-callout--' src/ | wc -l                           # -> 56
```

App-Namespace-Inventur (CSS-Selektoren in `src/css/main.css`):
```bash
grep -cE '^\.app-' src/css/main.css                             # -> 27 Klassen
grep -cE '^\.gat-' src/css/main.css                             # -> 0 (nur DS-Klassen)
```

---

## Phasen-Status

- Phase 0 — DONE (PR #4 merged).
- Phase 1 — DONE (DS-v2.1 ist seit heute live).
- Phase 2 — DONE (dieser PR).

Was NICHT in Phase 2 war (warten auf DS-v2.2/v2.3):
- List-Card-Atom (`.gat-card --neutral`) — DS hat es noch nicht explizit.
- Search-Result-Liste-Patterns — komplex, eigenes DS-Atom dafür wäre overkill.
- Anchor-Flash — app-spezifischer Look mit `keyframes`, nicht DS-Material.
- FAB — DS hat noch kein FAB-Atom.
- Tooltip — `.app-glossar-tooltip` bleibt local; DS-Tooltip-Atom (mit Popover-API?) wäre eine grössere Sache.
