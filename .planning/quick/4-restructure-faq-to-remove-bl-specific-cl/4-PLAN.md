---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/llm-analyze.js
  - scripts/generate-pages.js
  - data/llm/faq/topics.json
  - src/faq/index.html
  - src/faq/*.html
  - src/index.html
autonomous: false
requirements: [FAQ-RESTRUCTURE]

must_haves:
  truths:
    - "FAQ answers describe general/common principles without naming specific Bundeslaender"
    - "FAQ answers do NOT make BL-specific claims (e.g. 'Im Burgenland sind es...')"
    - "Each FAQ topic page shows a disclaimer that details may vary between Bundeslaender"
    - "Each FAQ question links to relevant paragraphs across ALL 9 Gemeindeordnungen (not just a few)"
  artifacts:
    - path: "scripts/llm-analyze.js"
      provides: "Updated FAQ prompt instructing LLM to produce general answers"
    - path: "scripts/generate-pages.js"
      provides: "Updated FAQ topic page template with BL-variation disclaimer and all-BL reference links"
    - path: "data/llm/faq/topics.json"
      provides: "Regenerated FAQ content with general answers"
  key_links:
    - from: "scripts/llm-analyze.js"
      to: "data/llm/faq/topics.json"
      via: "Claude CLI call with updated prompt"
    - from: "scripts/generate-pages.js"
      to: "src/faq/*.html"
      via: "generateFAQTopicPage renders disclaimer + all-BL links"
---

<objective>
Restructure FAQ content to remove Bundesland-specific claims and replace with general Austrian municipal law answers.

Purpose: Current FAQ answers name specific Bundeslaender with claims that are often wrong or oversimplified, creating liability risk. Instead, answers should describe the common/general principle and link to ALL relevant Gemeindeordnungen so users can check the details themselves.

Output: Updated LLM prompt, regenerated FAQ JSON, updated FAQ page template with disclaimer and comprehensive cross-BL links.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/llm-analyze.js (FAQ generation prompt in generateFAQ function, lines 447-575)
@scripts/generate-pages.js (FAQ topic page template in generateFAQTopicPage function, lines 583-641)
@scripts/config.js (LAWS registry with all 23 law keys)
@data/llm/faq/topics.json (current FAQ content to be replaced)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update FAQ prompt and template, regenerate content</name>
  <files>scripts/llm-analyze.js, scripts/generate-pages.js, data/llm/faq/topics.json</files>
  <action>
**Part A: Update the FAQ LLM prompt in `scripts/llm-analyze.js` (`generateFAQ` function, around line 513).**

Change the prompt instructions to:
1. REPLACE the current instruction `"answer": Beantworte zuerst klar und direkt, dann ergaenze Bundeslaender-spezifische Details.` with:
   `"answer": Beschreibe das ALLGEMEINE Prinzip, das in den meisten oesterreichischen Gemeindeordnungen gilt. Nenne KEINE einzelnen Bundeslaender namentlich. Schreibe NICHT 'Im Burgenland...', 'In Kaernten...' oder aehnliche BL-spezifische Aussagen. Formuliere stattdessen: 'In den meisten Gemeindeordnungen...', 'Die Regelungen sehen typischerweise vor...', 'Je nach Bundesland variieren die Details...' etc.`
2. ADD a new instruction line after the references format: `- Die Antworten duerfen KEINE Bundeslaender namentlich nennen oder BL-spezifische Behauptungen aufstellen. Stattdessen allgemeine Aussagen treffen und auf die einzelnen Gesetze verweisen.`
3. ADD instruction for references: `- "references": MUSS Verweise auf ALLE 9 Gemeindeordnungen enthalten, die das jeweilige Thema regeln (nicht nur 2-3). Verwende die relevantesten Paragraphen aus jeder Gemeindeordnung.`

**Part B: Update the FAQ topic page template in `scripts/generate-pages.js` (`generateFAQTopicPage` function, around line 583).**

1. ADD a new disclaimer box AFTER the existing KI-Hinweis disclaimer (line 627), BEFORE the `<main>` tag:
```html
<div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-gruene-dark" data-pagefind-ignore>
  <strong>Wichtig:</strong> Die Regelungen koennen je nach Bundesland erheblich voneinander abweichen. Pruefen Sie die Details in der jeweiligen Gemeindeordnung Ihres Bundeslandes.
</div>
```
(Use proper umlauts: oe -> oe, ue -> ue, etc. -- actually use real umlauts in the HTML output)

2. CHANGE the references section in `generateFAQTopicPage` (around line 588-592). Currently it shows only LLM-provided references with "Siehe:". Replace this with TWO sections:

   a. Keep existing "Siehe:" references from LLM data (these are the most relevant paragraphs)
   b. ADD a new "Alle Gemeindeordnungen:" section below that links to ALL 9 Gemeindeordnungen. Import `LAWS` from `./config.js` (already imported at line 15) and generate links for all gemeindeordnungen keys. Use the bundesland name as link text, linking to `../{category}/{key}.html`. Format as a compact comma-separated list.

   The "Alle Gemeindeordnungen:" links should look like:
   ```html
   <div class="mt-2 text-sm">
     <span class="text-gray-500 font-medium">Alle Gemeindeordnungen:</span>
     <span class="ml-1">
       <a href="../gemeindeordnungen/burgenland.html">Burgenland</a>,
       <a href="../gemeindeordnungen/kaernten.html">Kaernten</a>,
       ...
     </span>
   </div>
   ```
   Use proper display names from LAWS config (bundesland field). Apply `text-gruene-dark hover:underline text-sm` classes to each link. Separate with `, ` (comma space).

**Part C: Regenerate FAQ content.**

Run: `node scripts/llm-analyze.js --faq --force`

This will delete the existing `data/llm/faq/topics.json` and regenerate it with the updated prompt.

**Part D: Regenerate HTML pages.**

Run: `node scripts/generate-pages.js`

This will regenerate all HTML pages including FAQ topic pages with the new template.

IMPORTANT: Do NOT change any other LLM prompts (summary, glossary). Only the FAQ prompt.
  </action>
  <verify>
    <automated>
# Verify no BL-specific claims in FAQ answers
node -e "
const d = JSON.parse(require('fs').readFileSync('data/llm/faq/topics.json','utf-8'));
const blNames = ['Im Burgenland','In K\u00e4rnten','In Nieder\u00f6sterreich','In Ober\u00f6sterreich','In Salzburg','In der Steiermark','In Tirol','In Vorarlberg','In Wien'];
let issues = 0;
for (const t of d.topics) {
  for (const q of t.questions) {
    for (const bl of blNames) {
      if (q.answer.includes(bl)) {
        console.log('BL-specific claim found:', bl, 'in', t.slug, '-', q.question.substring(0,50));
        issues++;
      }
    }
  }
}
console.log(issues === 0 ? 'PASS: No BL-specific claims found' : 'FAIL: ' + issues + ' BL-specific claims');
process.exit(issues > 0 ? 1 : 0);
"
    </automated>
  </verify>
  <done>
  - FAQ prompt instructs LLM to produce general answers without naming Bundeslaender
  - Regenerated topics.json has no BL-specific claims like "Im Burgenland..." or "In Kaernten..."
  - FAQ answers describe common principles with hedging language ("in den meisten...", "je nach Bundesland...")
  - FAQ topic pages show amber disclaimer about BL variation
  - FAQ topic pages show "Alle Gemeindeordnungen:" links section with all 9 BL links
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Restructured FAQ with general answers, BL-variation disclaimer, and all-BL links</what-built>
  <how-to-verify>
    1. Run: npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium
    2. Read screenshots: e2e/screenshots/faq-index.png and e2e/screenshots/faq-topic-page.png
    3. Verify:
       - FAQ topic page shows amber "Regelungen koennen je nach Bundesland abweichen" disclaimer
       - FAQ answers are general, not BL-specific
       - Each question has "Alle Gemeindeordnungen:" links to all 9 BL
       - Existing KI disclaimer still present
    4. Spot-check 2-3 FAQ answers in data/llm/faq/topics.json for quality and no BL-naming
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues to fix</resume-signal>
</task>

</tasks>

<verification>
- No FAQ answer text contains "Im Burgenland", "In Kaernten", "In Niederoesterreich" etc.
- FAQ answers use general hedging language
- FAQ topic pages have BL-variation disclaimer
- FAQ topic pages have "Alle Gemeindeordnungen" links section
- All E2E tests pass
- Visual review passes for faq-index.png and faq-topic-page.png
</verification>

<success_criteria>
- FAQ content is liability-safe: no BL-specific claims that could be wrong
- Users can navigate from any FAQ answer to ALL 9 Gemeindeordnungen to check details
- Disclaimer clearly communicates that details vary by Bundesland
</success_criteria>

<output>
After completion, create `.planning/quick/4-restructure-faq-to-remove-bl-specific-cl/4-SUMMARY.md`
</output>
