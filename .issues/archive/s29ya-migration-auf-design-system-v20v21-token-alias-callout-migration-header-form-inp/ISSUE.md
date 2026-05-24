---
id: s29ya
title: Migration auf design-system v2.0/v2.1 (Token-Alias, Callout-Migration, Header,
  Form-Inputs nach DS-v2.1)
status: open
priority: medium
labels:
- migration
- design-system
- umbrella
remote:
- source: github
  id: '3'
  url: https://github.com/GrueneAT/Gemeindeordnung/issues/3
---

Migration der Gemeindeordnung-Site auf das Gruene-AT-Design-System (v2.0/v2.1). Heute komplett DS-unverbunden — Tailwind v4 mit eigenem `@theme {}` Token-Block und eigenen Farb-Tokens (`--color-gruene-dark: #005538` etc.), die nicht an `--gat-*` koppeln. Silent drift garantiert. 92 Banner im Repo, davon 33 in nicht-DS Tailwind-Amber.

Umbrella-Migrationsticket. Bezugnehmend auf Cross-Repo-Audit (2026-05-23). Siehe `notes/audit.md` fuer den vollstaendigen Befund + `https://github.com/GrueneAT/design-system/issues/13` fuer die DS-v2.1-Welle.

## Migrations-Phasen

### Phase 0 — Quick-Wins (unabhaengig, sofort umsetzbar)

1. **DS-CSS-Link einbinden** — `<link rel="stylesheet" href="https://grueneat.github.io/design-system/design-system.css">` in `src/index.html` + Templates.
2. **Lokale Tokens an DS koppeln** — `src/css/main.css` Z. ~1–60: `--color-gruene-dark: var(--gat-color-dunkelgruen)` etc. Drift-Versicherung ohne Markup-Touch.
3. **DS-Logo per CDN** — `<img src="https://grueneat.github.io/design-system/assets/gruene-logo.svg">`.
4. **`.gat-skiplink`** ergaenzen — central in `scripts/generate-pages.js` (ein Touch-Point fuer alle Seiten).
5. **`prefers-reduced-motion`-Block** lokal ergaenzen (DS hat ihn; die 3 Keyframe-Animationen ohne Reduced-Motion-Override sind a11y-Problem).

### Phase 1 — Warten auf DS-v2.1 (extern)

Dieses Repo bekommt v2.1 automatisch durch CDN-Refresh, sobald `grueneat/design-system#13` gemerged ist. v2.1 liefert: `.gat-input`-Familie, `.gat-modal`, `.gat-callout`-/-`.gat-tag`-Modifier.

### Phase 2 — Voll-Migration (nach DS-v2.1)

1. **Callout-Migration** — alle 92 Banner auf `.gat-callout --info/--warn/--error/--legal` umstellen. Die 33 Tailwind-Amber-Banner verschwinden. Single Touchpoint: `scripts/generate-pages.js`.
2. **Form-Inputs** auf `.gat-input`/`.gat-select`/`.gat-checkbox` umstellen.
3. **Cmd-K-Search-Modal** — Skeleton auf `.gat-modal` umbauen; `<mark>`-Highlight bleibt lokal (`.app-search-mark`).
4. **Header** auf `.gat-header` (weisse Brandbar) umstellen — Sticky-Search-Trigger bleibt App-spezifisch und kommt in `.gat-header__a11y-toggle`-Stil als zusaetzlicher Knopf.
5. **List-Card-Atom** — wenn `.gat-card --neutral` in v2.x explizit landet, dort migrieren; sonst lokal.
6. **App-spezifische Klassen** als `.app-*`-Namespace umbenennen: `.law-text`, `.hauptstueck-heading`, `.abschnitt-heading`, `.absatz`, `.legal-ref`, `.law-summary`, `.glossar-term`, BL-Switcher, TOC, Topic-Multiselect.
7. **Hartkodierte Werte normalisieren** — Tailwind-Amber raus, Hex-Werte im Hero-Gradient durch Tokens, `rgba(107,165,57,…)`-Transparenzen durch DS-konforme Werte. Border-Radien vereinheitlichen.
8. **11px-Schrift (`0.6875rem`)** ueberpruefen — entweder in DS-Skala bringen oder als app-spezifischer Sonderwert dokumentieren.
9. **Doku-Abschluss**: `notes/iteration-abschluss.md` mit Migrations-Zusammenfassung.

## Akzeptanzkriterien

### Phase 0
- [ ] `<link>` auf DS-CSS in Templates
- [ ] `--color-gruene-*` per `var(--gat-color-*)` aliased
- [ ] DS-Logo per CDN, lokale Asset-Kopie geloescht
- [ ] `.gat-skiplink` central im Page-Generator
- [ ] `prefers-reduced-motion`-Block fuer die 3 Keyframe-Animationen

### Phase 2 (nach DS-v2.1)
- [ ] `grep -rE "bg-amber-|text-amber-" src/` liefert 0
- [ ] Alle Banner sind `.gat-callout` mit Modifier
- [ ] Modal/Cmd-K nutzt `.gat-modal`
- [ ] Form-Inputs sind `.gat-input` etc.
- [ ] `.law-*`/`.hauptstueck-*`/`.abschnitt-*` etc. sind `.app-*`-Namespace
- [ ] `notes/iteration-abschluss.md` dokumentiert Migration

### Querschnitt
- [ ] `grep -rE "claude|Generated with|Co-Authored-By" .` liefert 0
- [ ] Keine neuen Vendoring-Verzeichnisse
- [ ] Konsumenten-URL als Quelle
- [ ] Pages-Deploy nach Merge funktioniert

## Constraints

- **Kein Vendoring.** DS-CSS, DS-Logo per CDN.
- **Keine Werkzeug-Attribution.**
- **Phase 0 zuerst.** Phase 2 wartet auf DS-v2.1-Release.
- **`scripts/generate-pages.js`** ist der zentrale Hebel — Aenderungen dort propagieren ueber alle Seiten.

## Hintergrund

Aus dem Cross-Repo-Audit: 10 DS-Aufnahme-Kandidaten, 5 Hybrid, 8 app-spezifisch. Tailwind v4 ist gleicher Stack wie DS v2 — Migration besonders sauber moeglich. Siehe `notes/audit.md` + `notes/SYNTHESIS.md`.
