/**
 * Tests for page generation (generate-pages.js) and LLM dev-script (llm-analyze.js).
 *
 * Uses minimal in-memory fixtures; no real parsed JSON files needed.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Minimal parsed law fixture matching Plan 02's output schema
function createFixture(overrides = {}) {
  return {
    meta: {
      bundesland: 'Testland',
      kurztitel: 'Testgesetz',
      gesetzesnummer: '99999999',
      abfrage: 'LrTest',
      kategorie: 'gemeindeordnung',
      stadt: null,
      fetchedAt: '2026-03-10T12:00:00.000Z',
      sourceUrl: 'https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrTest&Gesetzesnummer=99999999',
      contentHash: 'sha256:abc123',
      ...overrides.meta,
    },
    struktur: overrides.struktur || [
      {
        typ: 'abschnitt',
        nummer: '1',
        titel: 'Allgemeines',
        paragraphen: [
          {
            nummer: '1',
            titel: 'Geltungsbereich',
            text: '(1) Dieses Gesetz gilt fuer alle Gemeinden.',
            absaetze: [{ nummer: 1, text: '(1) Dieses Gesetz gilt fuer alle Gemeinden.' }],
          },
          {
            nummer: '2',
            titel: 'Begriffsbestimmungen',
            text: 'Im Sinne dieses Gesetzes bezeichnet Gemeinde eine Gebietskoerperschaft.',
            absaetze: [],
          },
        ],
      },
    ],
  };
}

// Temp directory for test output
const TEST_DIR = join(ROOT, '.test-generate');

function setupTestData() {
  // Create parsed data dirs
  mkdirSync(join(TEST_DIR, 'data', 'parsed', 'gemeindeordnungen'), { recursive: true });
  mkdirSync(join(TEST_DIR, 'data', 'parsed', 'stadtrechte'), { recursive: true });
  mkdirSync(join(TEST_DIR, 'src'), { recursive: true });

  // Write a gemeindeordnung fixture
  writeFileSync(
    join(TEST_DIR, 'data', 'parsed', 'gemeindeordnungen', 'testland.json'),
    JSON.stringify(createFixture()),
  );

  // Write a stadtrecht fixture
  writeFileSync(
    join(TEST_DIR, 'data', 'parsed', 'stadtrechte', 'teststadt.json'),
    JSON.stringify(
      createFixture({
        meta: {
          kategorie: 'stadtrecht',
          kurztitel: 'Teststadtrecht',
          stadt: 'Teststadt',
          bundesland: 'Testland',
          fetchedAt: '2026-03-09T08:30:00.000Z',
        },
      }),
    ),
  );
}

describe('generate-pages', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    setupTestData();
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('Test 1: creates HTML files in src/ for each parsed law JSON', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const goPath = join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html');
    const srPath = join(TEST_DIR, 'src', 'stadtrechte', 'teststadt.html');

    expect(existsSync(goPath)).toBe(true);
    expect(existsSync(srPath)).toBe(true);

    const goHtml = readFileSync(goPath, 'utf-8');
    expect(goHtml).toContain('Testgesetz');
    expect(goHtml).toContain('<h1');
  });

  it('Test 2: generated HTML includes "Stand: DD.MM.YYYY" from meta.fetchedAt', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const goHtml = readFileSync(
      join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'),
      'utf-8',
    );
    // fetchedAt: 2026-03-10T12:00:00.000Z -> Stand: 10.03.2026
    expect(goHtml).toContain('Stand: 10.03.2026');
  });

  it('Test 3: generated HTML separates Gemeindeordnungen and Stadtrechte categories', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    // Gemeindeordnung page should exist under gemeindeordnungen/
    expect(existsSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'))).toBe(true);
    // Stadtrecht page should exist under stadtrechte/
    expect(existsSync(join(TEST_DIR, 'src', 'stadtrechte', 'teststadt.html'))).toBe(true);
  });

  it('Test 4: index page lists all laws grouped by category with links', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const indexHtml = readFileSync(join(TEST_DIR, 'src', 'index.html'), 'utf-8');

    // Category headings
    expect(indexHtml).toContain('Gemeindeordnungen');
    expect(indexHtml).toContain('Stadtrechte');

    // Links to generated pages
    expect(indexHtml).toContain('gemeindeordnungen/testland.html');
    expect(indexHtml).toContain('stadtrechte/teststadt.html');

    // Law names
    expect(indexHtml).toContain('Testgesetz');
    expect(indexHtml).toContain('Teststadtrecht');
  });
});

describe('llm-analyze', () => {
  beforeEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    setupTestData();
  });

  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  it('Test 5: --dry-run lists laws that would be analyzed without calling any LLM', async () => {
    const { dryRun } = await import('../scripts/llm-analyze.js');
    const result = await dryRun(TEST_DIR);

    // Should list both laws
    expect(result.laws).toHaveLength(2);
    expect(result.laws.some(l => l.key === 'testland')).toBe(true);
    expect(result.laws.some(l => l.key === 'teststadt')).toBe(true);
    expect(result.totalParagraphs).toBeGreaterThan(0);
  });

  it('Test 6: skips laws that already have LLM output in data/llm/', async () => {
    // Create existing LLM output for testland
    const llmDir = join(TEST_DIR, 'data', 'llm', 'summaries', 'gemeindeordnungen');
    mkdirSync(llmDir, { recursive: true });
    writeFileSync(join(llmDir, 'testland.json'), JSON.stringify({ summary: 'already done' }));

    const { dryRun } = await import('../scripts/llm-analyze.js');
    const result = await dryRun(TEST_DIR);

    // Should only list teststadt (testland already has output)
    expect(result.laws).toHaveLength(1);
    expect(result.laws[0].key).toBe('teststadt');
  });
});
