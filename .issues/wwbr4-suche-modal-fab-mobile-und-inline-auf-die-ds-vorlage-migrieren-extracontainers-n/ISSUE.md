---
id: wwbr4
title: 'Suche: Modal, FAB, Mobile und Inline auf die DS-Vorlage migrieren + extraContainers
  nutzen'
status: open
priority: medium
labels:
- enhancement
- design-system
- migration
remote:
- source: github
  id: '17'
  url: https://github.com/GrueneAT/Gemeindeordnung/issues/17
---

## Kontext

Folge zu GrueneAT/Gemeindeordnung#15: dort wurde das **Hero-Suchfeld** auf die
DS-Such-Vorlage (`.gat-search` + `gat-search.js`) migriert. Bewusst **noch nicht**
migriert (um funktionierende Logik nicht zu regressieren): **Modal/`Strg+K`,
FAB, Mobile-Header-Feld und die Inline-Suchleisten** auf BL-/FAQ-/Glossar-Seiten.

Ausserdem wurde im Hero-Rollout der document-level Click-outside des DS-Moduls
per `pointerdown`-Stop umgangen, weil die App ihre Treffer in ein eigenes Panel
ausserhalb des DS-Overlays rendert. Das DS hat dafuer jetzt eine first-class
Option **`extraContainers`** (design-system v2.3.1, design-system#28).

## Ziel

Die restlichen Such-Einstiege auf die DS-Vorlage bringen und den Workaround
durch die saubere DS-Option ersetzen.

## Scope

- **Modal/`Strg+K`** auf die DS-`mode: 'modal'`-Variante (nativer `<dialog
  class="gat-modal …">` mit `.gat-search--modal`, Focus-Trap + `returnFocus`
  vom Modul). Sticky-Trigger-Fokus-Verhalten erhalten.
- **FAB** und **Mobile-Header-Suchfeld** auf die DS-Trigger/`triggers`-Logik.
- **Inline-Suchleisten** (BL-/FAQ-/Glossar-Seiten) auf `.gat-search` + `createSearch`.
- **`extraContainers`** statt des `pointerdown`-Workarounds nutzen (App-Ergebnis-
  Panel(s) registrieren); Workaround entfernen.
- App-Schicht unveraendert erhalten: BL-Filter, Content-Typ-Gruppierung,
  Stemming-Filter, `?highlight=`.

## Acceptance Criteria

- [ ] Modal, FAB, Mobile-Feld und Inline-Suchen nutzen die DS-Vorlage; kein Layout-Shift.
- [ ] `extraContainers` ersetzt den `pointerdown`-Workaround (entfernt).
- [ ] BL-Filter, Gruppierung, Stemming, `?highlight=`, `Strg+K`/`/`/ESC, Mobile-Full-Screen unveraendert funktional.
- [ ] Unit- und E2E-/Such-Tests gruen (an neue Markup-Selektoren angepasst, keine Coverage geloescht).
- [ ] Build + Pagefind-Index sauber.
