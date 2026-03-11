/**
 * Page generator: reads parsed law JSON and produces HTML pages for Vite to process.
 *
 * Usage:
 *   node scripts/generate-pages.js           # Generate all pages
 *   import { generatePages } from './generate-pages.js'  # Use as module
 *
 * Reads: data/parsed/{gemeindeordnungen,stadtrechte}/*.json
 * Writes: src/{gemeindeordnungen,stadtrechte}/*.html + src/index.html
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const CATEGORIES = ['gemeindeordnungen', 'stadtrechte'];
const CATEGORY_LABELS = {
  gemeindeordnungen: 'Gemeindeordnungen',
  stadtrechte: 'Stadtrechte',
};

/**
 * Format ISO date string to German date format DD.MM.YYYY.
 */
function formatGermanDate(isoString) {
  const d = new Date(isoString);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render a single paragraph to HTML.
 */
function renderParagraph(para) {
  const titel = para.titel ? `<span class="text-gruene-dark/70">${escapeHtml(para.titel)}</span>` : '';
  let body = '';

  if (para.absaetze && para.absaetze.length > 0) {
    const items = para.absaetze.map(a => `<li class="mb-1">${escapeHtml(a.text)}</li>`).join('\n');
    body = `<ol class="list-decimal list-inside ml-4 mt-2">\n${items}\n</ol>`;
  } else if (para.text) {
    body = `<p class="mt-2 whitespace-pre-line">${escapeHtml(para.text)}</p>`;
  }

  return `<article class="mb-6" id="par-${escapeHtml(para.nummer)}">
  <h3 class="text-lg font-semibold">&sect; ${escapeHtml(para.nummer)} ${titel}</h3>
  ${body}
</article>`;
}

/**
 * Render a section (Abschnitt or Hauptstueck) to HTML.
 */
function renderSection(section) {
  const heading = section.typ === 'hauptstueck'
    ? `<h2 class="text-xl font-bold mt-8 mb-4 text-gruene-dark">${escapeHtml(section.nummer)}. Hauptstueck: ${escapeHtml(section.titel)}</h2>`
    : `<h2 class="text-lg font-bold mt-6 mb-3 text-gruene-dark">${escapeHtml(section.nummer)}. Abschnitt: ${escapeHtml(section.titel)}</h2>`;

  let content = '';

  if (section.abschnitte) {
    // Hauptstueck with nested Abschnitte
    content = section.abschnitte.map(abs => renderSection(abs)).join('\n');
  } else if (section.paragraphen) {
    content = section.paragraphen.map(p => renderParagraph(p)).join('\n');
  }

  return `<section class="mb-8">\n${heading}\n${content}\n</section>`;
}

/**
 * Generate a single law HTML page.
 */
function generateLawPage(law, key, category) {
  const standDatum = formatGermanDate(law.meta.fetchedAt);
  const title = escapeHtml(law.meta.kurztitel);
  const bundesland = escapeHtml(law.meta.bundesland);
  const stadtInfo = law.meta.stadt ? ` (${escapeHtml(law.meta.stadt)})` : '';

  const strukturHtml = law.struktur.map(s => renderSection(s)).join('\n');

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - Gemeindeordnung.at</title>
    <link rel="stylesheet" href="../css/main.css" />
  </head>
  <body class="bg-gruene-light min-h-screen">
    <div class="max-w-4xl mx-auto p-8">
      <nav class="mb-4">
        <a href="../index.html" class="text-gruene-green hover:underline">&larr; Zurueck zur Uebersicht</a>
      </nav>
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gruene-dark">${title}</h1>
        <p class="mt-1 text-gruene-dark/70">${bundesland}${stadtInfo}</p>
        <p class="mt-1 text-sm text-gray-600">Stand: ${standDatum}</p>
        <p class="mt-1 text-sm">
          <a href="${escapeHtml(law.meta.sourceUrl)}" target="_blank" rel="noopener" class="text-gruene-green hover:underline">Quelle: RIS</a>
        </p>
      </header>
      <main>
        ${strukturHtml}
      </main>
    </div>
  </body>
</html>`;
}

/**
 * Generate the index page listing all laws grouped by category.
 */
function generateIndexPage(lawsByCategory) {
  let categorySections = '';

  for (const [category, laws] of Object.entries(lawsByCategory)) {
    const label = CATEGORY_LABELS[category] || category;
    const items = laws
      .map(l => {
        const standDatum = formatGermanDate(l.meta.fetchedAt);
        const name = escapeHtml(l.meta.kurztitel);
        const stadtInfo = l.meta.stadt ? ` (${escapeHtml(l.meta.stadt)})` : '';
        const bundesland = escapeHtml(l.meta.bundesland);
        return `          <li class="py-2 border-b border-gray-200">
            <a href="${category}/${l.key}.html" class="text-gruene-green hover:underline font-medium">${name}</a>${stadtInfo}
            <span class="text-sm text-gray-500 ml-2">${bundesland} &mdash; Stand: ${standDatum}</span>
          </li>`;
      })
      .join('\n');

    categorySections += `
        <section class="mb-8">
          <h2 class="text-2xl font-bold text-gruene-dark mb-4">${label}</h2>
          <ul class="divide-y divide-gray-200">
${items}
          </ul>
        </section>`;
  }

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gemeindeordnungen der oesterreichischen Bundeslaender</title>
    <link rel="stylesheet" href="css/main.css" />
  </head>
  <body class="bg-gruene-light min-h-screen">
    <div id="app" class="max-w-4xl mx-auto p-8">
      <header class="mb-8">
        <h1 class="text-3xl font-bold text-gruene-dark">
          Gemeindeordnungen der oesterreichischen Bundeslaender
        </h1>
        <p class="mt-2 text-lg text-gruene-dark/80">
          Alle 9 Gemeindeordnungen und 14 Statutarstadt-Stadtrechte durchsuchbar aufbereitet.
        </p>
      </header>
      <main>${categorySections}
      </main>
    </div>
    <script type="module" src="js/main.js"></script>
  </body>
</html>`;
}

/**
 * Generate all HTML pages from parsed JSON.
 *
 * @param {string} rootDir - Project root directory (default: actual project root)
 */
export async function generatePages(rootDir = ROOT) {
  const lawsByCategory = {};

  for (const category of CATEGORIES) {
    const parsedDir = join(rootDir, 'data', 'parsed', category);
    if (!existsSync(parsedDir)) {
      console.log(`Skipping ${category}: no parsed data at ${parsedDir}`);
      continue;
    }

    const files = readdirSync(parsedDir).filter(f => f.endsWith('.json'));
    if (files.length === 0) continue;

    const outDir = join(rootDir, 'src', category);
    mkdirSync(outDir, { recursive: true });

    lawsByCategory[category] = [];

    for (const file of files) {
      const key = file.replace('.json', '');
      const law = JSON.parse(readFileSync(join(parsedDir, file), 'utf-8'));

      const html = generateLawPage(law, key, category);
      writeFileSync(join(outDir, `${key}.html`), html);
      console.log(`Generated: src/${category}/${key}.html`);

      lawsByCategory[category].push({ ...law, key });
    }
  }

  // Generate index page
  const indexHtml = generateIndexPage(lawsByCategory);
  writeFileSync(join(rootDir, 'src', 'index.html'), indexHtml);
  console.log('Generated: src/index.html');

  return lawsByCategory;
}

// Run directly
if (process.argv[1] && process.argv[1].endsWith('generate-pages.js')) {
  generatePages().catch(err => {
    console.error('Generate failed:', err.message);
    process.exit(1);
  });
}
