/**
 * Page generator: reads parsed law JSON and produces branded HTML pages for Vite to process.
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
import { LAWS } from './config.js';

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
  const titel = para.titel ? `<span class="text-gruene-dark/80">${escapeHtml(para.titel)}</span>` : '';
  let body = '';

  if (para.absaetze && para.absaetze.length > 0) {
    const items = para.absaetze.map(a => `<li class="mb-1">${escapeHtml(a.text)}</li>`).join('\n');
    body = `<ol class="list-decimal list-inside ml-4 mt-2">\n${items}\n</ol>`;
  } else if (para.text) {
    body = `<p class="mt-2 whitespace-pre-line">${escapeHtml(para.text)}</p>`;
  }

  return `<article class="mb-6 group" id="p${escapeHtml(para.nummer)}">
  <h3 class="text-lg font-semibold text-gruene-dark flex items-center gap-2">
    <span>&sect; ${escapeHtml(para.nummer)} ${titel}</span>
    <button data-copy-link="p${escapeHtml(para.nummer)}" class="text-gray-400 hover:text-gruene-dark copy-link-btn" title="Link kopieren" aria-label="Link zu &sect; ${escapeHtml(para.nummer)} kopieren">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
    </button>
  </h3>
  ${body}
</article>`;
}

/**
 * Render a section (Abschnitt or Hauptstueck) to HTML.
 */
function renderSection(section) {
  const isHaupt = section.typ === 'hauptstueck';
  const borderClass = isHaupt ? 'border-t-2 border-gruene-green/20' : 'border-t border-gray-200';

  const sectionSlug = isHaupt
    ? `hauptstueck-${section.nummer}`
    : `abschnitt-${section.nummer}`;

  const heading = isHaupt
    ? `<h2 id="${sectionSlug}" class="text-2xl font-bold mt-12 mb-6 text-gruene-dark">${escapeHtml(section.nummer)}. Hauptstueck: ${escapeHtml(section.titel)}</h2>`
    : `<h2 id="${sectionSlug}" class="text-xl font-semibold mt-8 mb-4 text-gruene-dark">${escapeHtml(section.nummer)}. Abschnitt: ${escapeHtml(section.titel)}</h2>`;

  let content = '';

  if (section.abschnitte) {
    content = section.abschnitte.map(abs => renderSection(abs)).join('\n');
  } else if (section.paragraphen) {
    content = section.paragraphen.map(p => renderParagraph(p)).join('\n');
  }

  return `<section class="mb-8 ${borderClass} pt-4">\n${heading}\n${content}\n</section>`;
}

/**
 * Build Table of Contents HTML from law structure.
 */
function buildToC(struktur) {
  function tocSection(section) {
    const label = section.typ === 'hauptstueck'
      ? `${section.nummer}. Hauptstueck: ${escapeHtml(section.titel)}`
      : `${section.nummer}. Abschnitt: ${escapeHtml(section.titel)}`;

    let innerList = '';

    if (section.abschnitte) {
      // Nested: hauptstueck with abschnitte
      const nestedItems = section.abschnitte.map(abs => {
        const absLabel = `${abs.nummer}. Abschnitt: ${escapeHtml(abs.titel)}`;
        let paraLinks = '';
        if (abs.paragraphen) {
          paraLinks = abs.paragraphen
            .map(p => `            <li><a href="#p${escapeHtml(p.nummer)}" class="text-gruene-dark hover:underline">&sect; ${escapeHtml(p.nummer)} ${escapeHtml(p.titel || '')}</a></li>`)
            .join('\n');
        }
        return `          <li class="mt-1">
            <details>
              <summary class="cursor-pointer py-1 px-2 hover:bg-gruene-light rounded text-sm">${absLabel}</summary>
              <ul class="ml-4 mt-1 space-y-1 text-sm">
${paraLinks}
              </ul>
            </details>
          </li>`;
      }).join('\n');
      innerList = `\n        <ul class="ml-4 mt-1 space-y-1">\n${nestedItems}\n        </ul>`;
    } else if (section.paragraphen) {
      const paraLinks = section.paragraphen
        .map(p => `          <li><a href="#p${escapeHtml(p.nummer)}" class="text-gruene-dark hover:underline">&sect; ${escapeHtml(p.nummer)} ${escapeHtml(p.titel || '')}</a></li>`)
        .join('\n');
      innerList = `\n        <ul class="ml-4 mt-1 space-y-1 text-sm">\n${paraLinks}\n        </ul>`;
    }

    return `      <li>
        <details>
          <summary class="cursor-pointer py-2 px-3 hover:bg-gruene-light rounded font-medium" style="min-height:44px;display:flex;align-items:center">${label}</summary>${innerList}
        </details>
      </li>`;
  }

  const items = struktur.map(s => tocSection(s)).join('\n');

  return `    <nav data-pagefind-ignore aria-label="Inhaltsverzeichnis" class="mb-8 bg-white rounded-lg border border-gray-200 p-4">
      <h2 class="text-lg font-bold text-gruene-dark mb-3">Inhaltsverzeichnis</h2>
      <ul class="space-y-1">
${items}
      </ul>
    </nav>`;
}

/**
 * Build Bundesland dropdown HTML for the header.
 */
function buildBundeslandDropdown(currentKey, currentCategory) {
  let options = '';
  for (const [cat, laws] of Object.entries(LAWS)) {
    const label = CATEGORY_LABELS[cat] || cat;
    let groupOptions = '';
    for (const [key, law] of Object.entries(laws)) {
      const selected = (key === currentKey && cat === currentCategory) ? ' selected' : '';
      const stadtSuffix = law.stadt ? ` (${law.stadt})` : '';
      groupOptions += `          <option value="${cat}/${key}.html"${selected}>${law.bundesland}${stadtSuffix}</option>\n`;
    }
    options += `        <optgroup label="${label}">\n${groupOptions}        </optgroup>\n`;
  }

  return `        <select id="bundesland-nav" class="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gruene-dark focus:outline-none focus:ring-2 focus:ring-gruene-green/50" aria-label="Bundesland wechseln">
${options}        </select>`;
}

/**
 * Generate the scroll-to-top floating button HTML.
 */
function generateScrollToTop() {
  return `  <button id="scroll-to-top" class="fixed bottom-6 right-6 z-50 bg-gruene-dark text-white rounded-full p-3 shadow-lg hidden hover:bg-gruene-green transition-colors" aria-label="Zurueck nach oben">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
    </svg>
  </button>`;
}

/**
 * Generate the sticky header HTML.
 */
function generateHeader(isLawPage, currentKey, currentCategory) {
  const logoPath = isLawPage ? '../assets/gruene-logo.svg' : 'assets/gruene-logo.svg';
  const indexPath = isLawPage ? '../index.html' : 'index.html';

  const dropdown = isLawPage ? buildBundeslandDropdown(currentKey, currentCategory) : '';
  const rightSection = dropdown
    ? `      <div class="mt-2 sm:mt-0">\n${dropdown}\n      </div>`
    : '';

  return `  <header data-pagefind-ignore class="sticky top-0 bg-white border-b border-gray-200 z-10">
    <div class="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between">
      <a href="${indexPath}" class="flex items-center gap-2 text-gruene-dark hover:text-gruene-dark no-underline">
        <img src="${logoPath}" alt="Gruene Logo" class="w-8 h-8 gruene-logo" />
        <span class="text-lg font-bold">Gemeindeordnung.at</span>
      </a>
${rightSection}
    </div>
  </header>`;
}

/**
 * Generate breadcrumb navigation for law pages.
 */
function generateBreadcrumb(bundesland, kurztitel) {
  return `  <nav data-pagefind-ignore aria-label="Breadcrumb" class="max-w-5xl mx-auto px-4 py-2 text-sm">
    <ol class="flex items-center gap-1 text-gruene-dark">
      <li><a href="../index.html" class="text-gruene-dark hover:underline">Startseite</a></li>
      <li class="text-gray-400">/</li>
      <li><span class="text-gruene-dark">${escapeHtml(bundesland)}</span></li>
      <li class="text-gray-400">/</li>
      <li class="text-gray-500">${escapeHtml(kurztitel)}</li>
    </ol>
    <a href="../index.html" class="sm:hidden text-gruene-dark hover:underline text-sm">&larr; Uebersicht</a>
  </nav>`;
}

/**
 * Generate footer HTML.
 */
function generateFooter(options = {}) {
  const { sourceUrl, standDatum, isLawPage } = options;
  const risLink = sourceUrl
    ? `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener" class="text-gruene-dark hover:underline">Quelle: RIS</a>`
    : `<a href="https://www.ris.bka.gv.at" target="_blank" rel="noopener" class="text-gruene-dark hover:underline">Quelle: RIS (ris.bka.gv.at)</a>`;

  const stand = standDatum || formatGermanDate(new Date().toISOString());

  return `  <footer data-pagefind-ignore class="border-t border-gray-200 mt-12">
    <div class="max-w-5xl mx-auto px-4 py-6 text-sm text-gray-600">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-4">
          ${risLink}
          <span>Stand: ${stand}</span>
        </div>
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <span class="font-medium">Keine Rechtsberatung</span>
          <a href="#" class="text-gruene-dark hover:underline">GitHub</a>
        </div>
      </div>
    </div>
  </footer>`;
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
  const tocHtml = buildToC(law.struktur);
  const headerHtml = generateHeader(true, key, category);
  const breadcrumbHtml = generateBreadcrumb(law.meta.bundesland, law.meta.kurztitel);
  const footerHtml = generateFooter({
    sourceUrl: law.meta.sourceUrl,
    standDatum,
    isLawPage: true,
  });

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - Gemeindeordnung.at</title>
    <link rel="stylesheet" href="../css/main.css" />
    <meta data-pagefind-filter="bundesland[content]" content="${escapeHtml(law.meta.bundesland)}" />
    <meta data-pagefind-filter="typ[content]" content="${escapeHtml(category)}" />
  </head>
  <body class="bg-white min-h-screen flex flex-col">
${headerHtml}
${breadcrumbHtml}
    <div class="max-w-5xl mx-auto px-4 py-6 flex-1 w-full">
      <header class="mb-6">
        <h1 class="text-3xl font-bold text-gruene-dark">${title}</h1>
        <p class="mt-1 text-gruene-dark/80">${bundesland}${stadtInfo}</p>
        <p class="mt-1 text-sm text-gray-600">Stand: ${standDatum}</p>
      </header>
${tocHtml}
      <main data-pagefind-body class="max-w-prose mx-auto leading-relaxed">
        ${strukturHtml}
      </main>
    </div>
${footerHtml}
${generateScrollToTop()}
    <script type="module" src="../js/main.js"></script>
  </body>
</html>`;
}

/**
 * Generate a card for the index page.
 */
function generateCard(law, category) {
  const standDatum = formatGermanDate(law.meta.fetchedAt);
  const name = escapeHtml(law.meta.kurztitel);
  const stadtInfo = law.meta.stadt ? ` (${escapeHtml(law.meta.stadt)})` : '';
  const bundesland = escapeHtml(law.meta.bundesland);

  return `          <a href="${category}/${law.key}.html" class="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4">
            <p class="font-bold text-gruene-dark">${bundesland}${stadtInfo}</p>
            <p class="text-sm text-gruene-dark/80 mt-1">${name}</p>
            <p class="text-xs text-gray-500 mt-2">Stand: ${standDatum}</p>
          </a>`;
}

/**
 * Generate the index page listing all laws grouped by category.
 */
function generateIndexPage(lawsByCategory) {
  let categorySections = '';

  for (const [category, laws] of Object.entries(lawsByCategory)) {
    const label = CATEGORY_LABELS[category] || category;
    const cards = laws.map(l => generateCard(l, category)).join('\n');

    categorySections += `
        <section class="mb-10">
          <h2 class="text-2xl font-bold text-gruene-dark mb-4">${label}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
${cards}
          </div>
        </section>`;
  }

  const headerHtml = generateHeader(false);
  const footerHtml = generateFooter({ isLawPage: false });

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gemeindeordnungen der oesterreichischen Bundeslaender</title>
    <link rel="stylesheet" href="css/main.css" />
  </head>
  <body class="bg-gray-50 min-h-screen flex flex-col">
${headerHtml}
    <div class="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gruene-dark">
          Gemeindeordnungen der oesterreichischen Bundeslaender
        </h1>
        <p class="mt-2 text-lg text-gruene-dark/80">
          Alle 9 Gemeindeordnungen und 14 Statutarstadt-Stadtrechte durchsuchbar aufbereitet.
        </p>
      </div>
      <main>${categorySections}
      </main>
    </div>
${footerHtml}
${generateScrollToTop()}
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
