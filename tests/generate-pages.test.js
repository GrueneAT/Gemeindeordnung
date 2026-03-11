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

// Fixture with nested hauptstueck > abschnitte structure for ToC testing
function createNestedFixture() {
  return createFixture({
    struktur: [
      {
        typ: 'hauptstueck',
        nummer: '1',
        titel: 'Allgemeine Bestimmungen',
        abschnitte: [
          {
            typ: 'abschnitt',
            nummer: '1',
            titel: 'Geltungsbereich',
            paragraphen: [
              { nummer: '1', titel: 'Anwendung', text: 'Test text.', absaetze: [] },
            ],
          },
        ],
      },
      {
        typ: 'abschnitt',
        nummer: '2',
        titel: 'Organe der Gemeinde',
        paragraphen: [
          { nummer: '10', titel: 'Gemeinderat', text: 'Der Gemeinderat besteht aus...', absaetze: [] },
        ],
      },
    ],
  });
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

  // --- Phase 2: Branding & Layout Tests ---

  it('Test 5P2: law page contains collapsible ToC with aria-label', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // ToC nav with aria-label
    expect(html).toContain('aria-label="Inhaltsverzeichnis"');
    // Collapsible sections using details/summary
    expect(html).toContain('<details');
    expect(html).toContain('<summary');
  });

  it('Test 6P2: law page contains branded header with logo', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // Header with logo
    expect(html).toContain('<header');
    expect(html).toContain('gruene-logo');
    // Site title in header
    expect(html).toContain('Gemeindeordnung.at');
  });

  it('Test 7P2: law page contains breadcrumb nav', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // Breadcrumb nav
    expect(html).toContain('aria-label="Breadcrumb"');
    // Link back to index
    expect(html).toContain('index.html');
  });

  it('Test 8P2: law page contains footer with disclaimer and RIS link', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // Footer with disclaimer
    expect(html).toContain('<footer');
    expect(html).toContain('Keine Rechtsberatung');
    // RIS link
    expect(html).toContain('ris.bka.gv.at');
    // Stand datum
    expect(html).toContain('Stand');
  });

  it('Test 9P2: law page uses readable typography classes', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // Max-width for readability
    expect(html).toContain('max-w-prose');
    // Relaxed line height
    expect(html).toMatch(/leading-relaxed|leading-7/);
  });

  it('Test 10P2: law page has viewport meta tag for responsive design', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    expect(html).toContain('viewport');
    expect(html).toContain('width=device-width');
  });

  it('Test 11P2: index page uses card-style grid layout', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const indexHtml = readFileSync(join(TEST_DIR, 'src', 'index.html'), 'utf-8');

    // Grid layout classes
    expect(indexHtml).toMatch(/grid/);
    expect(indexHtml).toMatch(/grid-cols/);
    // Card styling
    expect(indexHtml).toContain('rounded');
    expect(indexHtml).toContain('shadow');
  });

  it('Test 12P2: law page uses text-gruene-dark for links (WCAG contrast)', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // Body/link text should use gruene-dark, NOT gruene-green
    // Check that link elements in nav/breadcrumb use text-gruene-dark
    expect(html).toContain('text-gruene-dark');
    // gruene-green should NOT be used for body text links
    expect(html).not.toMatch(/class="[^"]*text-gruene-green[^"]*"[^>]*>[^<]*<\/a>/);
  });

  it('Test 13P2: law page section headings have visual separators', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // Sections have border separators
    expect(html).toMatch(/border-t/);
  });

  it('Test 14P2: law page paragraph IDs use p{nummer} format', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // New ID format: p{nummer}
    expect(html).toContain('id="p1"');
    expect(html).toContain('id="p2"');
    // Old format should NOT be present
    expect(html).not.toContain('id="par-');
  });

  it('Test 16P2: law page contains scroll-to-top button with id', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    expect(html).toContain('id="scroll-to-top"');
    expect(html).toContain('aria-label="Zurueck nach oben"');
  });

  it('Test 17P2: copy-link buttons have data-copy-link matching paragraph nummer', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // Paragraphs 1 and 2 should have copy-link buttons
    expect(html).toContain('data-copy-link="p1"');
    expect(html).toContain('data-copy-link="p2"');
  });

  it('Test 20P2: copy-link button uses CSS class pattern, not inline Tailwind opacity', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    // Article elements should have "group" class for Tailwind group-hover
    expect(html).toMatch(/class="[^"]*\bgroup\b/);

    // Copy-link buttons should use the CSS "copy-link-btn" class
    const buttonMatches = html.match(/<button[^>]*data-copy-link[^>]*>/g);
    expect(buttonMatches).not.toBeNull();
    for (const btn of buttonMatches) {
      expect(btn).toContain('copy-link-btn');
      // Should NOT have inline opacity-0 or group-hover:opacity-100 (handled by CSS)
      expect(btn).not.toContain('opacity-0');
      expect(btn).not.toContain('group-hover:opacity-100');
    }
  });

  it('Test 18P2: law page contains Bundesland dropdown with id', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'testland.html'), 'utf-8');

    expect(html).toContain('id="bundesland-nav"');
    expect(html).toContain('aria-label="Bundesland wechseln"');
    expect(html).toContain('<select');
    expect(html).toContain('<optgroup');
  });

  it('Test 19P2: index page also contains scroll-to-top button', async () => {
    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const indexHtml = readFileSync(join(TEST_DIR, 'src', 'index.html'), 'utf-8');

    expect(indexHtml).toContain('id="scroll-to-top"');
  });

  it('Test 15P2: nested hauptstueck ToC has two-level structure', async () => {
    // Write nested fixture
    writeFileSync(
      join(TEST_DIR, 'data', 'parsed', 'gemeindeordnungen', 'nested.json'),
      JSON.stringify(createNestedFixture()),
    );

    const { generatePages } = await import('../scripts/generate-pages.js');
    await generatePages(TEST_DIR);

    const html = readFileSync(join(TEST_DIR, 'src', 'gemeindeordnungen', 'nested.html'), 'utf-8');

    // ToC should have nested structure
    expect(html).toContain('aria-label="Inhaltsverzeichnis"');
    // Should contain both hauptstueck and abschnitt in ToC
    expect(html).toContain('Allgemeine Bestimmungen');
    expect(html).toContain('Organe der Gemeinde');
    // Links to paragraphs
    expect(html).toContain('href="#p1"');
    expect(html).toContain('href="#p10"');
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
