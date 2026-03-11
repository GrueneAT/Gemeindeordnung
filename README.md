# Gemeindeordnung

Durchsuchbare Gemeindeordnungen aller oesterreichischen Bundeslaender und Statutarstaedte.

## Quick Start

```bash
npm ci
npm run fetch        # Fetch 23 laws from RIS API
npm run parse        # Parse HTML into structured JSON
npm run generate     # Generate HTML pages
npm run build:search # Build + Pagefind index
npm run preview      # Preview at localhost:4173
```

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `fetch` | `node scripts/fetch-laws.js` | Fetch raw HTML from RIS OGD API |
| `parse` | `node scripts/parse-laws.js` | Parse HTML into `data/parsed/` JSON |
| `generate` | `node scripts/generate-pages.js` | Generate HTML pages in `src/` |
| `build` | `vite build` | Build to `dist/` |
| `build:search` | build + Pagefind index | Full build with search |
| `preview` | `vite preview` | Preview built site |
| `llm-analyze` | `node scripts/llm-analyze.js` | LLM content generation (see below) |
| `llm-regenerate` | `llm-analyze --generate --force` | Clean + regenerate all LLM content |
| `test` | `vitest run` | Unit tests |
| `test:e2e` | Playwright | E2E tests (requires build) |

## LLM Content Generation

The LLM pipeline generates paragraph summaries, topic tags, FAQ, and glossary using the Claude CLI.

```bash
# Preview what would be analyzed
node scripts/llm-analyze.js --dry-run

# Generate all (incremental — skips existing files)
node scripts/llm-analyze.js --generate

# Clean + regenerate everything
npm run llm-regenerate
# or: node scripts/llm-analyze.js --generate --force

# Regenerate a single law
node scripts/llm-analyze.js --generate --force --law krems

# Regenerate FAQ or glossary only
node scripts/llm-analyze.js --faq
node scripts/llm-analyze.js --glossary
```

**Note:** Requires the `claude` CLI to be available. Falls back to placeholder content if unavailable. Cannot run inside a nested Claude Code session.

### Output

- `data/llm/summaries/gemeindeordnungen/*.json` — 9 Bundeslaender
- `data/llm/summaries/stadtrechte/*.json` — 14 Statutarstaedte
- `data/llm/faq/topics.json` — Cross-law FAQ topics
- `data/llm/glossary/terms.json` — Legal glossary terms

## Deployment

Pushes to `main` automatically deploy to GitHub Pages via `.github/workflows/deploy.yml`.

The pipeline: fetch → parse → generate → build → Pagefind index → E2E tests → deploy.

## Tech Stack

- Vite 7, TailwindCSS v4 (CSS-first)
- Pagefind for client-side search (German stemming)
- Playwright for E2E testing
- Static site on GitHub Pages
