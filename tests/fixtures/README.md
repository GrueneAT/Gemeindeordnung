# RIS HTML Test Fixtures

Real HTML samples fetched from RIS (Rechtsinformationssystem) for parser regression testing.

## Structural Patterns

### Common Structure
- Each paragraph is wrapped in `<div class="documentContent">`
- Paragraph content is inside `<div class="contentBlock">`
- Paragraph numbers use `<h4 class="UeberschrArt">` or `<h4 class="UeberschrPara">` with `§ N` pattern
- Paragraph titles use `<h4 class="UeberschrPara">`
- Numbered sub-paragraphs (Absaetze) use `<ol class="wai-absatz-list">` with `<li>` items
- Absatz numbering: `<span class="Absatzzahl">(1)</span>` inside `<div class="Abs">`
- Screen-reader text in `<span class="sr-only">` should be ignored (use `aria-hidden="true"` text)
- Table of contents in `<table class="tableOfContent">` should be skipped
- Praeambel/Promulgationsklausel section contains TOC -- skip

### Burgenland (burgenland-sample.html)
- **Hierarchy:** Hauptstueck > Abschnitt > Paragraph
- **Hauptstueck headers:** `<span class="Fett">1. Hauptstück:</span>` in `<div class="SchlussteilE0">` (TOC only)
- **Content headers:** `<h4 class="UeberschrG1">1. Hauptstück` with nested `<span class="UeberschrG2">`
- **Abschnitt headers:** `<h4 class="UeberschrG1-AfterG2">1. Abschnitt`
- **Paragraph number:** `<h4 class="UeberschrArt">§ 1</h4>` (separate from title)
- **Paragraph title:** `<h4 class="UeberschrPara">Begriff und rechtliche Stellung</h4>` (separate tag)
- **Paragraphs:** ~99 (§1 to §99)

### Oberoesterreich (oberoesterreich-sample.html)
- **Hierarchy:** HAUPTSTUECK > Abschnitt > Paragraph
- **HAUPTSTUECK headers:** `<h4 class="UeberschrArt">I. HAUPTSTÜCK<br>Die Gemeinde</h4>` (Roman numerals)
- **Abschnitt headers:** `<h4 class="UeberschrArt">1. Abschnitt<br>Allgemeine Bestimmungen</h4>`
- **Paragraph number+title combined:** `<h4 class="UeberschrPara">§ 1<br>Begriff und rechtliche Stellung</h4>`
- **Note:** Some headers combine § number and title with `<br>` in one h4
- **Paragraphs:** ~120+

### Wien (wien-sample.html)
- **Hierarchy:** Hauptstueck > Abschnitt > Paragraph (Wiener Stadtverfassung)
- **Complex structure:** More deeply nested than other Bundeslaender
- **Paragraphs:** 100+

### Kaernten (kaernten-sample.html)
- **Hierarchy:** Abschnitt > Paragraph (NO Hauptstuecke)
- **Abschnitt headers:** `<h4 class="UeberschrG1">1. Abschnitt` with `<span class="UeberschrG2">`
- **Paragraph number:** `<h4 class="UeberschrPara">§ 1</h4>` (separate)
- **Paragraph title:** `<h4 class="UeberschrPara">Rechtliche Stellung der Gemeinde</h4>` (separate)
- **Paragraphs:** ~107

## Key Differences
1. OOe combines § number and title in one `<h4>` with `<br>`; others use separate `<h4>` tags
2. Kaernten has no Hauptstuecke -- only Abschnitte directly containing Paragraphen
3. Burgenland uses `UeberschrG1-AfterG2` class for Abschnitt after Hauptstueck
4. OOe uses `UeberschrArt` for both HAUPTSTUECK and Abschnitt headers (distinguished by content)
5. All use `aria-hidden="true"` / `sr-only` pattern -- parser should use `aria-hidden` text
