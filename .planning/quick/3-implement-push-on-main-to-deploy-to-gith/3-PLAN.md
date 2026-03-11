---
phase: quick-3
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .github/workflows/deploy.yml
  - data/llm/summaries/gemeindeordnungen/*.json
  - data/llm/summaries/stadtrechte/*.json
  - data/llm/faq/topics.json
  - data/llm/glossary/terms.json
autonomous: true
must_haves:
  truths:
    - "Push to main triggers automatic deployment to GitHub Pages"
    - "LLM summaries contain real content for all 9 Bundeslaender and 14 Staedte"
    - "FAQ and glossary contain real content, not placeholders"
  artifacts:
    - path: ".github/workflows/deploy.yml"
      provides: "CI/CD pipeline triggered on push to main"
      contains: "push"
    - path: "data/llm/summaries/gemeindeordnungen/"
      provides: "LLM summaries for all 9 Bundeslaender"
    - path: "data/llm/summaries/stadtrechte/"
      provides: "LLM summaries for all 14 Staedte"
    - path: "data/llm/faq/topics.json"
      provides: "Real FAQ content"
    - path: "data/llm/glossary/terms.json"
      provides: "Real glossary content"
  key_links:
    - from: ".github/workflows/deploy.yml"
      to: "GitHub Pages"
      via: "on push to main branch"
      pattern: "on:.*push.*branches.*main"
---

<objective>
Enable automatic deployment to GitHub Pages on push to main, and generate real LLM content (summaries, FAQ, glossary) for all 23 laws replacing the current placeholder data.

Purpose: The deploy workflow currently only triggers on workflow_dispatch (manual). All 23 LLM summary files plus FAQ and glossary contain placeholder content that needs real LLM-generated text.
Output: Updated deploy.yml with push trigger, real LLM data for all laws.
</objective>

<context>
@.github/workflows/deploy.yml
@scripts/llm-analyze.js
@scripts/config.js
@data/llm/summaries/
@data/llm/faq/topics.json
@data/llm/glossary/terms.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add push-to-main trigger to deploy workflow</name>
  <files>.github/workflows/deploy.yml</files>
  <action>
Update the `on:` section in `.github/workflows/deploy.yml` to trigger on push to main in addition to workflow_dispatch:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

Keep everything else in the workflow unchanged. The workflow already has the full pipeline: checkout, npm ci, fetch, parse, generate, build, pagefind, playwright tests, and deploy-pages.
  </action>
  <verify>
    <automated>grep -A3 "^on:" .github/workflows/deploy.yml | grep -q "push" && grep -q "branches.*main" .github/workflows/deploy.yml && grep -q "workflow_dispatch" .github/workflows/deploy.yml && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>deploy.yml triggers on both push to main and workflow_dispatch</done>
</task>

<task type="auto">
  <name>Task 2: Generate real LLM content for all laws, FAQ, and glossary</name>
  <files>data/llm/summaries/gemeindeordnungen/*.json, data/llm/summaries/stadtrechte/*.json, data/llm/faq/topics.json, data/llm/glossary/terms.json</files>
  <action>
Run the LLM analysis pipeline to replace all 23 placeholder summary files plus FAQ and glossary with real content.

1. First do a dry run to confirm all 23 laws are detected as needing analysis:
   ```bash
   node scripts/llm-analyze.js --dry-run
   ```

2. Generate real summaries for all laws (this calls Claude CLI for each law):
   ```bash
   node scripts/llm-analyze.js --generate
   ```

3. Generate real FAQ content:
   ```bash
   node scripts/llm-analyze.js --faq
   ```

4. Generate real glossary content:
   ```bash
   node scripts/llm-analyze.js --glossary
   ```

5. Verify no placeholder files remain:
   ```bash
   grep -rl '"placeholder": true' data/llm/
   ```
   This should return no results.

If the Claude CLI is not available (blocked in nested session), this task CANNOT be completed automatically. In that case, document the exact commands the user must run outside a Claude session and mark as a checkpoint for human action.

IMPORTANT: If any individual law fails, re-run with `--law {key}` for just that law. Do not re-run the entire pipeline.
  </action>
  <verify>
    <automated>test $(grep -rl '"placeholder": true' data/llm/ 2>/dev/null | wc -l) -eq 0 && echo "PASS: no placeholders" || echo "FAIL: placeholders remain"</automated>
  </verify>
  <done>All 23 summary files contain real LLM-generated paragraph summaries and topic tags. FAQ topics.json and glossary terms.json contain real content. Zero files with "placeholder": true.</done>
</task>

</tasks>

<verification>
1. `.github/workflows/deploy.yml` has `on: push: branches: [main]` trigger
2. All 23 files in `data/llm/summaries/` have `"placeholder": false` or no placeholder field
3. `data/llm/faq/topics.json` has real FAQ topics (not placeholder)
4. `data/llm/glossary/terms.json` has real glossary terms (not placeholder)
5. `npm test` still passes (unit tests)
6. Build succeeds: `npm run build`
</verification>

<success_criteria>
- Pushing to main branch will automatically trigger the GitHub Pages deploy workflow
- All LLM enrichment data is real content, zero placeholders remaining
- Existing tests continue to pass
</success_criteria>

<output>
After completion, create `.planning/quick/3-implement-push-on-main-to-deploy-to-gith/3-SUMMARY.md`
</output>
