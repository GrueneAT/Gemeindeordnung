---
id: fngkx
title: Suche auf die gemeinsame DS-Such-Vorlage zurückführen
status: open
priority: medium
labels:
- enhancement
- design-system
- migration
remote:
- source: github
  id: '15'
  url: https://github.com/GrueneAT/Gemeindeordnung/issues/15
---

## Kontext

Die Gemeindeordnung hat die ausgereifteste Suche im Verbund (Hero-Dropdown ohne
Layout-Shift, Modal + `Strg/Cmd+K`, FAB, eigene Pagefind-Integration in
`src/js/search.js` mit Content-Typ-Gruppierung, Bundesland-Filter und
Stemming-Falsch-Positiv-Filter). Sie ist die **Vorlage** fuer das DS-Issue
**GrueneAT/design-system#26**.

Dieses Issue fuehrt die Gemeindeordnung-Suche nach Fertigstellung der DS-Vorlage
auf die **gemeinsame DS-Basis** zurueck, damit Markup/CSS/Verhalten zentral im
Design System gepflegt werden und werkzeuge + Gemeindeordnung dieselbe Grundlage
teilen.

## Scope

- Suchfeld + Ergebnis-Overlay/Modal-Markup und -CSS auf die **DS-Such-Vorlage**
  umstellen (DS liefert Struktur + Styles; Tailwind-Utilities/Hardcodes ersetzen).
- App-spezifische Logik als **App-Schicht** erhalten: Bundesland-Filter,
  Content-Typ-Gruppierung (Gesetze/FAQ/Glossar), Stemming-Korrektur,
  Custom-Result-Rendering.
- `Strg+K`-/Modal- und FAB-Verhalten auf die DS-Verhaltens-Bausteine mappen.
- Keine Regression bei A11y, Mobile-Full-Screen und Suchqualitaet.

## Abhaengigkeit

- Blockiert durch **GrueneAT/design-system#26** (DS-Vorlage muss existieren).

## Acceptance Criteria

- [ ] Suchfeld + Ergebnis-Overlay/Modal nutzen die DS-Vorlage (Markup + CSS).
- [ ] Bundesland-Filter, Content-Typ-Gruppierung und Stemming-Korrektur bleiben
      funktional (App-Schicht).
- [ ] `Strg+K`, Modal, FAB, Mobile-Full-Screen weiterhin funktionsfaehig.
- [ ] Kein Layout-Shift; A11y (Tastatur/aria/ESC/Focus) erhalten.
- [ ] Keine Regression in den e2e-/Such-Tests; Build + Pagefind-Index sauber.
