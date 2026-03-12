---
phase: quick-8
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/llm-analyze.js
autonomous: true
requirements: [QUICK-8]
must_haves:
  truths:
    - "FAQ LLM prompt instructs feminine-default Doppelpunkt gendering"
    - "Prompt includes concrete good/bad examples of sentence restructuring"
    - "Prompt instructs avoiding half-gendered constructions with gender-neutral alternatives"
  artifacts:
    - path: "scripts/llm-analyze.js"
      provides: "Expanded gendering instruction in FAQ prompt"
      contains: "Satzbau umformulieren"
  key_links: []
---

<objective>
Expand the gendering instruction in the FAQ LLM prompt (scripts/llm-analyze.js line 532) from a simple word-list to a comprehensive instruction that teaches the LLM to restructure sentences for natural, readable gender-inclusive German.

Purpose: Current instruction only lists gendered noun forms but the LLM produces awkward half-gendered text like "der:die Buergermeister:in als Vorsitzender und Aussenvertreter" where adjectives/roles stay masculine.
Output: Updated prompt instruction in scripts/llm-analyze.js
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/llm-analyze.js (line 520-555 — FAQ prompt section)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Expand gendering instruction in FAQ LLM prompt</name>
  <files>scripts/llm-analyze.js</files>
  <action>
Replace line 532 in scripts/llm-analyze.js (the single gendering instruction line) with an expanded multi-line instruction block. The new instruction must cover:

1. **Feminine-default rule:** Use feminine form as default base with Doppelpunkt: "die Buergermeister:in" (not "der:die Buergermeister:in"). The colon signals inclusion of all genders from the feminine base form.

2. **Sentence restructuring mandate:** Do NOT just insert colons into masculine sentences. Restructure the entire sentence so it reads naturally. Avoid grammatically half-gendered constructions where articles, adjectives, or role descriptions remain masculine.

3. **Gender-neutral alternatives:** Where possible, prefer gender-neutral formulations over gendered ones:
   - "Vorsitz" instead of "Vorsitzende:r"
   - "Aussenvertretung" instead of "Aussenvertreter:in"
   - "Amtsfuehrung" instead of "Amtsfuehrer:in"
   - "Mitglieder des Gemeinderats" instead of "Gemeinderaet:innen" (when it reads better)

4. **Concrete examples of BAD vs GOOD:**

BAD: "Der:die Buergermeister:in ist Vorsitzender des Gemeinderats und Aussenvertreter der Gemeinde."
GOOD: "Die Buergermeister:in fuehrt den Vorsitz im Gemeinderat und vertritt die Gemeinde nach aussen."

BAD: "Ein Gemeinderat ist als gewaehlter Vertreter der Buerger taetig."
GOOD: "Gemeinderaet:innen sind als gewaehlte Vertretung der Gemeindebuerger:innen taetig."

BAD: "Der Vizebuergermeister vertritt den Buergermeister bei dessen Abwesenheit."
GOOD: "Die Vizebuergermeister:in vertritt die Buergermeister:in bei deren Abwesenheit."

5. **Keep the existing noun list** as reference examples: Buergermeister:in, Vizebuergermeister:in, Gemeinderaet:innen, Stadttraet:innen, Gemeindebuerger:innen, Ehrenbuerger:innen.

IMPORTANT: All text in the prompt must use proper German umlauts (ae, oe, ue, ss), not ASCII-safe spellings. The examples above use ASCII for this plan document only.

Keep the instruction as a single bullet point block (using sub-items or line breaks within the bullet) so it fits naturally in the existing WICHTIG list structure.
  </action>
  <verify>
    <automated>grep -c "Satzbau\|umformulieren\|Vorsitz\|SCHLECHT\|GUT" scripts/llm-analyze.js | xargs test 1 -le</automated>
  </verify>
  <done>Line 532 area contains expanded gendering instruction with feminine-default rule, restructuring mandate, gender-neutral alternatives, and concrete good/bad examples. The instruction reads naturally in the prompt context.</done>
</task>

<task type="auto">
  <name>Task 2: Verify unit tests still pass</name>
  <files>scripts/llm-analyze.js</files>
  <action>
Run the existing unit tests to confirm the prompt change does not break any functionality. The change is prompt-text only (no logic change), so tests should pass unchanged.

Run: npm test

If any test fails, investigate and fix. Likely causes would be snapshot tests or string-matching tests on the prompt content.
  </action>
  <verify>
    <automated>cd /root/workspace && npm test</automated>
  </verify>
  <done>All unit tests pass with the updated gendering instruction.</done>
</task>

</tasks>

<verification>
- scripts/llm-analyze.js contains expanded gendering instruction with examples
- npm test passes
- No other files modified
</verification>

<success_criteria>
The FAQ LLM prompt now instructs the model to use feminine-default Doppelpunkt gendering, restructure sentences for natural readability, prefer gender-neutral alternatives where possible, and includes concrete good/bad examples — all within a single cohesive instruction block.
</success_criteria>

<output>
After completion, create `.planning/quick/8-add-gendering-instructions-to-faq-llm-pr/8-SUMMARY.md`
</output>
