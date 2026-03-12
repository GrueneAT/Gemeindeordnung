---
phase: quick-5
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/generate-pages.js
  - src/faq/*.html
autonomous: true
requirements: [QUICK-5]

must_haves:
  truths:
    - "FAQ topic pages no longer show 'Alle Gemeindeordnungen' links block after each question"
    - "FAQ topic pages still show 'Siehe:' paragraph references when present"
    - "All FAQ topic pages render correctly with no visual regressions"
  artifacts:
    - path: "scripts/generate-pages.js"
      provides: "FAQ topic page generation without allLawLinks"
    - path: "src/faq/*.html"
      provides: "Regenerated FAQ topic HTML pages"
  key_links: []
---

<objective>
Remove the "Alle Gemeindeordnungen" links section from FAQ topic pages to reduce page length. Keep the specific "Siehe:" paragraph references that link to relevant law sections.

Purpose: FAQ topic pages are too long because every question card includes a full list of all 23 law links, which is unnecessary noise.
Output: Cleaner FAQ topic pages with only relevant cross-references.
</objective>

<execution_context>
@/opt/claude-config/get-shit-done/workflows/execute-plan.md
@/opt/claude-config/get-shit-done/templates/summary.md
</execution_context>

<context>
@scripts/generate-pages.js
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove allLawLinks code and regenerate pages</name>
  <files>scripts/generate-pages.js, src/faq/*.html</files>
  <action>
In `scripts/generate-pages.js`, function `generateFAQTopicPage`:

1. Delete lines 587-598: the comment, `allLawLinks` array construction loop, and `allLawLinksHtml` template string
2. Delete `${allLawLinksHtml}` from line 612 in the article template (keep `${refsHtml}` which provides the "Siehe:" links)

Then regenerate pages:
```bash
node scripts/generate-pages.js
```

Then follow the Visual Review Protocol from CLAUDE.md:
```bash
npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium
```

Read and visually verify `e2e/screenshots/faq-topic-page.png` -- confirm:
- No "Alle Gemeindeordnungen" links block visible
- "Siehe:" references still present on questions that have them
- Card layout and spacing look correct
- No visual regressions

Also verify `e2e/screenshots/faq-index.png` for no regressions on the FAQ index.
  </action>
  <verify>
    <automated>npm run build && npx pagefind --site dist --force-language de && npx playwright test --config=e2e/playwright.config.js --project=desktop-chromium</automated>
  </verify>
  <done>
- FAQ topic pages no longer contain "Alle Gemeindeordnungen" links
- "Siehe:" reference links still render correctly
- All E2E tests pass
- Screenshots pass visual review
  </done>
</task>

</tasks>

<verification>
- `grep -r "Alle Gemeindeordnungen" src/faq/` returns no matches
- `grep -r "Siehe:" src/faq/` returns matches (references preserved)
- E2E tests pass including faq-topic-page screenshot
</verification>

<success_criteria>
FAQ topic pages are shorter and cleaner, showing only relevant "Siehe:" cross-references without the redundant full law listing.
</success_criteria>

<output>
After completion, create `.planning/quick/5-remove-alle-gemeindeordnungen-links-from/5-SUMMARY.md`
</output>
