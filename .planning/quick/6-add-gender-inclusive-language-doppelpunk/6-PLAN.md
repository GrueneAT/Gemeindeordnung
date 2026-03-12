---
phase: quick-6
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/gender.js
  - scripts/generate-pages.js
  - tests/gender.test.js
autonomous: true
requirements: [GENDER-01]
must_haves:
  truths:
    - "FAQ questions, answers, titles, and descriptions use Doppelpunkt-Gendern"
    - "Glossary definitions use Doppelpunkt-Gendern"
    - "Law page content (legal quotes) is NOT modified"
    - "Compound words like Gemeinderatsbeschluss are NOT broken"
    - "genderText() is a reusable utility importable from scripts/gender.js"
  artifacts:
    - path: "scripts/gender.js"
      provides: "Reusable genderText() utility function"
      exports: ["genderText"]
    - path: "tests/gender.test.js"
      provides: "Unit tests for gender utility"
    - path: "scripts/generate-pages.js"
      provides: "FAQ and glossary rendering with gendered text"
  key_links:
    - from: "scripts/generate-pages.js"
      to: "scripts/gender.js"
      via: "import { genderText }"
      pattern: "genderText\\("
---

<objective>
Add gender-inclusive language (Doppelpunkt-Gendern) to all FAQ and glossary content via a reusable utility function.

Purpose: Make LLM-generated content (FAQ, glossary) use inclusive language while preserving original legal text verbatim.
Output: `scripts/gender.js` utility, integration in `generate-pages.js`, unit tests.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js
@data/llm/faq/topics.json
@data/llm/glossary/terms.json
@tests/generate-pages.test.js
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create genderText() utility with tests</name>
  <files>scripts/gender.js, tests/gender.test.js</files>
  <behavior>
    - genderText("Der Bürgermeister leitet die Sitzung") => "Der:die Bürgermeister:in leitet die Sitzung"
    - genderText("Die Vizebürgermeister vertreten") => "Die Vizebürgermeister:innen vertreten"
    - genderText("Gemeinderäte beschließen") => "Gemeinderät:innen beschließen"
    - genderText("der Gemeinderatsbeschluss") => "der Gemeinderatsbeschluss" (compound word NOT changed)
    - genderText("Bürgermeisterwahl") => "Bürgermeisterwahl" (compound NOT changed — the term is part of a larger word)
    - genderText("Gemeindebürger haben Rechte") => "Gemeindebürger:innen haben Rechte"
    - genderText("Ehrenbürger der Stadt") => "Ehrenbürger:innen der Stadt"
    - genderText("Stadträte im Stadtsenat") => "Stadträt:innen im Stadtsenat"
    - genderText("vom Stadtrat beschlossen") => "vom Stadtrat beschlossen" (Stadtrat = the body/organ, not a person — keep as-is when referring to the organ; but "die Stadträte" = members => gender)
    - genderText("") => "" (empty string)
    - genderText(null) => "" (null safety)
    - Handles "des Bürgermeisters" => "des:der Bürgermeisters:in" (genitive)
    - Multiple occurrences in same string are all replaced
  </behavior>
  <action>
    Create `scripts/gender.js` exporting a `genderText(text)` function that applies Doppelpunkt-Gendern using a dictionary approach with regex word-boundary matching.

    **Dictionary of replacements** (all must use word boundaries to avoid compound word corruption):

    Singular standalone terms (replace only when the term stands alone, NOT as prefix of a compound):
    - "Bürgermeister" => "Bürgermeister:in" (but NOT "Bürgermeisterwahl", "Bürgermeisteramt")
    - "Vizebürgermeister" => "Vizebürgermeister:in"
    - "Gemeindebürger" => "Gemeindebürger:innen" (already plural-like usage)
    - "Ehrenbürger" => "Ehrenbürger:innen"

    Plural terms:
    - "Gemeinderäte" => "Gemeinderät:innen"
    - "Stadträte" => "Stadträt:innen"
    - "Vizebürgermeistern" => "Vizebürgermeister:innen" (dative plural)
    - "Bürgermeistern" => "Bürgermeister:innen" (dative plural)
    - "Gemeinderäten" => "Gemeinderät:innen" (dative plural)

    Article/pronoun adaptations (preceding articles):
    - "der Bürgermeister" (nominative) => "der:die Bürgermeister:in"
    - "des Bürgermeisters" => "des:der Bürgermeister:in" (genitive)
    - "dem Bürgermeister" (dative singular) => "dem:der Bürgermeister:in"
    - "den Bürgermeister" (accusative) => "den:die Bürgermeister:in"
    - Same pattern for Vizebürgermeister

    **CRITICAL implementation detail — word boundary strategy:**
    Use a NEGATIVE LOOKAHEAD after the term to ensure no alphanumeric character follows. Pattern: `\bTERM(?![a-zäöüA-ZÄÖÜ])`. This prevents matching "Bürgermeister" inside "Bürgermeisterwahl" or "Gemeinderatsbeschluss" containing "rat".

    Process longer terms first (Vizebürgermeister before Bürgermeister) to avoid partial matches.

    Return input unchanged for null/undefined (return "").

    Create `tests/gender.test.js` with vitest tests covering all behaviors above FIRST, then implement.
  </action>
  <verify>
    <automated>cd /root/workspace && npx vitest run tests/gender.test.js</automated>
  </verify>
  <done>genderText() handles all common Austrian municipal terms with correct word boundary detection, passing all unit tests</done>
</task>

<task type="auto">
  <name>Task 2: Integrate genderText into FAQ and glossary rendering</name>
  <files>scripts/generate-pages.js</files>
  <action>
    Import `genderText` from `./gender.js` at the top of `generate-pages.js`.

    Apply `genderText()` in these specific locations:

    1. **generateFAQTopicPage()** (line ~595-656):
       - `topic.title` in h1 and title tag: `genderText(topic.title)`
       - `topic.description` in p tag: `genderText(topic.description)`
       - `q.question` in h2: `genderText(q.question)`
       - `q.answer` in p: `genderText(q.answer)`

    2. **generateFAQIndexPage()** (line ~547-590):
       - Topic card titles and descriptions: `genderText(t.title)`, `genderText(t.description)`

    3. **generateIndexPage()** FAQ section (line ~493-510):
       - FAQ card titles and descriptions: `genderText(t.title)`, `genderText(t.description)`

    4. **generateGlossaryPage()** (line ~661-741):
       - Term definitions: `genderText(t.definition)` (but NOT term names — "Bürgermeister" as a glossary heading should stay as the legal term)

    Do NOT apply to:
    - `generateLawPage()` — legal text must remain verbatim
    - `renderParagraph()` — legal text
    - `renderSection()` — legal text
    - Reference labels (e.g., "Par. 1 Bgld. GO")
    - HTML attributes, slugs, URLs
    - Glossary term headings (the term itself is a legal concept name)

    After integration, run `node scripts/generate-pages.js` to regenerate all pages and verify no errors.
  </action>
  <verify>
    <automated>cd /root/workspace && npx vitest run tests/gender.test.js && node scripts/generate-pages.js && grep -c "Bürgermeister:in" src/faq/buergermeister-und-wahl.html | head -1</automated>
  </verify>
  <done>FAQ and glossary HTML pages contain gendered terms. Law pages remain unchanged. grep confirms Bürgermeister:in appears in FAQ pages.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Gender-inclusive language (Doppelpunkt-Gendern) applied to all FAQ content and glossary definitions via reusable genderText() utility. Law texts remain unchanged.</what-built>
  <how-to-verify>
    1. Run: npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium
    2. Open FAQ topic page screenshot (e2e/screenshots/faq-topic-page.png) — verify gendered terms visible
    3. Open glossar page screenshot (e2e/screenshots/glossar-page.png) — verify gendered definitions
    4. Open a law page screenshot (e2e/screenshots/browse-page-wien.png) — verify NO gendered terms in legal text
    5. Spot-check a generated FAQ HTML file for correct gendering: grep "Bürgermeister:in" src/faq/buergermeister-und-wahl.html
    6. Spot-check compound words are intact: grep "Gemeinderatsbeschluss" src/faq/*.html (should NOT show "Gemeinderät:innenbeschluss")
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- `npx vitest run tests/gender.test.js` passes all unit tests
- `node scripts/generate-pages.js` completes without errors
- FAQ pages contain gendered terms (grep confirms)
- Law pages do NOT contain gendered terms
- Compound words remain intact
- Visual review of screenshots passes
</verification>

<success_criteria>
- genderText() utility exists in scripts/gender.js, importable and reusable
- All FAQ content (titles, descriptions, questions, answers) uses Doppelpunkt-Gendern
- Glossary definitions use Doppelpunkt-Gendern
- Law page content is completely unchanged
- No compound word corruption (Gemeinderatsbeschluss stays intact)
- Unit tests pass, E2E screenshots pass visual review
</success_criteria>

<output>
After completion, create `.planning/quick/6-add-gender-inclusive-language-doppelpunk/6-SUMMARY.md`
</output>
