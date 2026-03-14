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
import { genderText } from './gender.js';

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
 * Escape regex special characters in a string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Inject glossary term tooltips into body HTML text.
 * Only matches first occurrence of each term per call (per paragraph).
 * Does NOT match inside HTML tags or attributes.
 * @param {string} bodyHtml - The paragraph body HTML
 * @param {Array} glossaryTerms - Array of glossary term objects
 * @param {string} categoryPrefix - Path prefix for glossary link (e.g. '../')
 * @returns {string} HTML with glossary tooltips injected
 */
function injectGlossaryTerms(bodyHtml, glossaryTerms, categoryPrefix) {
  if (!bodyHtml || glossaryTerms.length === 0) return bodyHtml;

  let result = bodyHtml;

  for (const term of glossaryTerms) {
    // Match whole word outside HTML tags, first occurrence only
    const pattern = new RegExp(`(?<=>)([^<]*?)\\b(${escapeRegex(term.term)})\\b`, 'i');
    const match = pattern.exec(result);
    if (!match) continue;

    // Get the exact position of the matched word within the full match
    const fullMatchStart = match.index;
    const wordStart = fullMatchStart + match[0].indexOf(match[2]);

    // Check this position isn't inside an existing glossar-tooltip or glossar-term
    const before = result.substring(0, wordStart);
    const inTooltip = (before.match(/class="glossar-tooltip"/g) || []).length >
                      (before.match(/class="glossar-tooltip-link"/g) || []).length;
    if (inTooltip) continue;

    const definition = escapeHtml(term.definition);
    const tooltipHtml = `<span class="glossar-term" tabindex="0">${match[2]}<span class="glossar-tooltip">${definition}<a href="${categoryPrefix}glossar.html#${term.slug}" class="glossar-tooltip-link">&#8594; Glossar</a></span></span>`;

    // Positional replace: splice at exact word position
    result = result.substring(0, wordStart) + tooltipHtml + result.substring(wordStart + match[2].length);
  }
  return result;
}

/**
 * Inject structural marker highlighting into law text HTML.
 * Wraps legal references (Abs., paragraph signs, Z, lit.) in spans.
 * Only operates on text content between HTML tags to avoid modifying attributes.
 * @param {string} html - The HTML string to process
 * @returns {string} HTML with structural markers wrapped in spans
 */
function injectStructuralMarkers(html) {
  if (!html) return html;
  // Match text content between > and < to only modify text nodes
  return html.replace(/>[^<]+</g, (match) => {
    let text = match.slice(1, -1); // Remove > and <
    // Abs. N references
    text = text.replace(/\b(Abs\.\s*\d+[a-z]?)/g, '<span class="legal-ref">$1</span>');
    // Paragraph sign references
    text = text.replace(/(§\s*\d+[a-z]?(?:\s*(?:bis|und|iVm)\s*§?\s*\d+[a-z]?)*)/g, '<span class="legal-ref">$1</span>');
    // Z (Ziffer) references
    text = text.replace(/\b(Z\s*\d+)/g, '<span class="legal-ref">$1</span>');
    // lit. references
    text = text.replace(/\b(lit\.\s*[a-z])/g, '<span class="legal-ref">$1</span>');
    return '>' + text + '<';
  });
}

/**
 * Render a single paragraph to HTML.
 * @param {object} para - Parsed paragraph data
 * @param {object|null} llmData - LLM summary data for the law (optional)
 * @param {Array} glossaryTerms - Glossary terms for tooltip injection
 */
function renderParagraph(para, llmData, glossaryTerms) {
  const titel = para.titel ? `<span class="text-gruene-dark/80">${escapeHtml(para.titel)}</span>` : '';
  let body = '';

  if (para.absaetze && para.absaetze.length > 0) {
    const items = para.absaetze.map(a => {
      const numLabel = a.nummer ? `<span class="absatz-num">(${a.nummer})</span>` : '';
      // Strip leading "(N)" from text since we render the number separately
      const cleanText = a.nummer ? a.text.replace(new RegExp(`^\\(${escapeRegex(String(a.nummer))}\\)\\s*`), '') : a.text;
      return `<div class="absatz">${numLabel}<span class="absatz-text">${escapeHtml(cleanText)}</span></div>`;
    }).join('\n');
    body = `<div class="absaetze-container">\n${items}\n</div>`;
  } else if (para.text) {
    body = `<p class="mt-2 whitespace-pre-line">${escapeHtml(para.text)}</p>`;
  }

  // Inject structural markers BEFORE glossary tooltips
  if (body) {
    body = injectStructuralMarkers(body);
  }

  // Inject glossary tooltips into body text ONLY (not summary)
  if (glossaryTerms && glossaryTerms.length > 0 && body) {
    body = injectGlossaryTerms(body, glossaryTerms, '../');
  }

  // LLM enrichment: topics attribute and always-visible summary
  const paraLlm = llmData && llmData.paragraphs && llmData.paragraphs[para.nummer];
  const topicsAttr = paraLlm && paraLlm.topics && paraLlm.topics.length > 0
    ? ` data-topics="${paraLlm.topics.map(t => escapeHtml(t)).join(',')}"`
    : '';
  const summaryHtml = paraLlm && paraLlm.summary
    ? `\n  <div class="law-summary">
    <p>${escapeHtml(paraLlm.summary)}</p>
  </div>`
    : '';

  return `<article class="mb-6 group"${topicsAttr}>
  <h3 id="p${escapeHtml(para.nummer)}" class="text-lg font-semibold text-gruene-dark flex items-center gap-2">
    <span>&sect; ${escapeHtml(para.nummer)} ${titel}</span>
    <button data-copy-link="p${escapeHtml(para.nummer)}" class="text-gray-400 hover:text-gruene-dark copy-link-btn" title="Link kopieren" aria-label="Link zu &sect; ${escapeHtml(para.nummer)} kopieren">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
    </button>
  </h3>${summaryHtml}
  ${body}
</article>`;
}

/**
 * Render a section (Abschnitt or Hauptstück) to HTML.
 */
function renderSection(section, llmData, glossaryTerms) {
  const isHaupt = section.typ === 'hauptstueck';

  const sectionSlug = isHaupt
    ? `hauptstueck-${section.nummer}`
    : `abschnitt-${section.nummer}`;

  const heading = isHaupt
    ? `<h2 id="${sectionSlug}" class="hauptstueck-heading">${escapeHtml(section.nummer)}. Hauptstück: ${escapeHtml(section.titel)}</h2>`
    : `<h2 id="${sectionSlug}" class="abschnitt-heading">${escapeHtml(section.nummer)}. Abschnitt: ${escapeHtml(section.titel)}</h2>`;

  let content = '';

  if (section.abschnitte) {
    content = section.abschnitte.map(abs => renderSection(abs, llmData, glossaryTerms)).join('\n');
  } else if (section.paragraphen) {
    content = section.paragraphen.map(p => renderParagraph(p, llmData, glossaryTerms)).join('\n');
  }

  return `<section class="mb-8 pt-4">\n${heading}\n${content}\n</section>`;
}

/**
 * Build Table of Contents HTML from law structure.
 */
function buildToC(struktur) {
  function tocSection(section) {
    const label = section.typ === 'hauptstueck'
      ? `${section.nummer}. Hauptstück: ${escapeHtml(section.titel)}`
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
 * Build styled BL switcher select dropdown for the header on law pages.
 * Two optgroups: Gemeindeordnungen (9 BLs) and Stadtrechte (14 cities).
 */
function buildBundeslandSwitcher(currentKey, currentCategory) {
  const goOptions = [];
  for (const [key, law] of Object.entries(LAWS.gemeindeordnungen)) {
    const isSelected = key === currentKey && currentCategory === 'gemeindeordnungen';
    const selected = isSelected ? ' selected' : '';
    goOptions.push(`            <option value="../gemeindeordnungen/${key}.html"${selected}>${escapeHtml(law.bundesland)}</option>`);
  }

  const stadtOptions = [];
  for (const [key, law] of Object.entries(LAWS.stadtrechte)) {
    const isSelected = key === currentKey && currentCategory === 'stadtrechte';
    const selected = isSelected ? ' selected' : '';
    stadtOptions.push(`            <option value="../stadtrechte/${key}.html"${selected}>${escapeHtml(law.bundesland)}</option>`);
  }

  return `          <select id="bl-switcher-select" class="bl-header-select" aria-label="Andere Gemeindeordnung anzeigen" data-pagefind-ignore onchange="if(this.value) window.location.href=this.value">
            <optgroup label="Gemeindeordnungen">
${goOptions.join('\n')}
            </optgroup>
            <optgroup label="Stadtrechte">
${stadtOptions.join('\n')}
            </optgroup>
          </select>`;
}

/**
 * Build BL select dropdown for the index page hero (filter-only, does not navigate).
 * Used to set the Bundesland filter for search on the index page.
 */
function buildHeroBundeslandSelect() {
  const goOptions = [];
  for (const [, law] of Object.entries(LAWS.gemeindeordnungen)) {
    goOptions.push(`              <option value="${escapeHtml(law.bundesland)}">${escapeHtml(law.bundesland)}</option>`);
  }

  const stadtOptions = [];
  for (const [, law] of Object.entries(LAWS.stadtrechte)) {
    stadtOptions.push(`              <option value="${escapeHtml(law.bundesland)}">${escapeHtml(law.bundesland)}</option>`);
  }

  return `          <select id="hero-bl-select" class="bl-header-select" aria-label="Bundesland filtern" data-pagefind-ignore>
              <option value="">Alle Bundesl\u00E4nder</option>
              <optgroup label="Gemeindeordnungen">
${goOptions.join('\n')}
              </optgroup>
              <optgroup label="Stadtrechte">
${stadtOptions.join('\n')}
              </optgroup>
            </select>`;
}

/**
 * Generate the scroll-to-top floating button HTML.
 */
function generateScrollToTop() {
  return `  <button id="scroll-to-top" class="fixed bottom-6 right-6 z-50 bg-gruene-dark text-white rounded-full p-3 shadow-lg hidden hover:bg-gruene-green transition-colors" aria-label="Zurück nach oben">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
    </svg>
  </button>`;
}

/**
 * Generate the search trigger HTML for the header.
 * Mobile: compact text field that opens modal on tap.
 * Desktop: icon button that opens modal on click.
 */
function generateSearchHTML() {
  return `      <input id="header-search-field" type="text" readonly class="header-search-field" placeholder="Suchen..." aria-label="Suche oeffnen" />
      <button id="search-modal-trigger" class="search-trigger-btn" aria-label="Suche oeffnen (Ctrl+K)" title="Suche (Ctrl+K)">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </button>`;
}

/**
 * Generate the sticky header HTML.
 * @param {boolean} isLawPage - Whether this is a law subpage
 * @param {string} [currentKey] - Current law key (for dropdown)
 * @param {string} [currentCategory] - Current category (for dropdown)
 * @param {string} [pathPrefix] - Override path prefix (defaults based on isLawPage)
 */
function generateHeader(isLawPage, currentKey, currentCategory, pathPrefix) {
  const prefix = pathPrefix !== undefined ? pathPrefix : (isLawPage ? '../' : '');
  const logoPath = `${prefix}assets/gruene-logo.png`;
  const indexPath = `${prefix}index.html`;

  const switcher = isLawPage ? buildBundeslandSwitcher(currentKey, currentCategory) : '';

  const searchHTML = generateSearchHTML();

  const navLinks = `      <nav class="flex items-center gap-1.5 text-xs shrink-0" data-pagefind-ignore>
        <a href="${prefix}faq/index.html" class="text-gruene-dark hover:underline whitespace-nowrap">FAQ</a>
        <span class="text-gray-300">|</span>
        <a href="${prefix}glossar.html" class="text-gruene-dark hover:underline whitespace-nowrap">Glossar</a>
      </nav>`;

  return `  <header data-pagefind-ignore class="sticky top-0 bg-white border-b border-gray-200 z-10">
    <div class="max-w-5xl mx-auto px-4 py-2 flex items-center gap-2">
      <a href="${indexPath}" class="flex items-center gap-1.5 text-gruene-dark hover:text-gruene-dark no-underline shrink-0">
        <img src="${logoPath}" alt="Gruene Logo" class="w-7 h-7 gruene-logo" />
        <span class="header-site-name text-sm sm:text-lg font-bold">gemeindeordnung.gruene.at</span>
      </a>
      <div class="flex-1"></div>
${switcher}
${navLinks}
${searchHTML}
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
    <a href="../index.html" class="sm:hidden text-gruene-dark hover:underline text-sm">&larr; Übersicht</a>
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
function generateLawPage(law, key, category, rootDir = ROOT) {
  const standDatum = formatGermanDate(law.meta.fetchedAt);
  const title = escapeHtml(law.meta.kurztitel);
  // Use bundesland from config (authoritative, includes Statutarstadt overrides)
  const configLaw = LAWS[category]?.[key];
  const blFromConfig = configLaw ? configLaw.bundesland : law.meta.bundesland;
  // Override law.meta.bundesland for downstream use (meta tags, search filters, etc.)
  law.meta.bundesland = blFromConfig;
  const bundesland = escapeHtml(blFromConfig);
  const stadtInfo = law.meta.stadt ? ` (${escapeHtml(law.meta.stadt)})` : '';

  // Load LLM summary data if available
  const llmPath = join(rootDir, 'data', 'llm', 'summaries', category, `${key}.json`);
  let llmData = null;
  if (existsSync(llmPath)) {
    try {
      llmData = JSON.parse(readFileSync(llmPath, 'utf-8'));
    } catch {
      // Malformed JSON -- skip LLM enrichment gracefully
      llmData = null;
    }
  }

  // Load glossary terms for tooltip injection
  const glossaryTermPath = join(rootDir, 'data', 'llm', 'glossary', 'terms.json');
  let glossaryTerms = [];
  if (existsSync(glossaryTermPath)) {
    try {
      glossaryTerms = JSON.parse(readFileSync(glossaryTermPath, 'utf-8')).terms || [];
    } catch {
      glossaryTerms = [];
    }
  }

  const strukturHtml = law.struktur.map(s => renderSection(s, llmData, glossaryTerms)).join('\n');
  const tocHtml = buildToC(law.struktur);
  const headerHtml = generateHeader(true, key, category);
  const breadcrumbHtml = generateBreadcrumb(law.meta.bundesland, law.meta.kurztitel);
  const footerHtml = generateFooter({
    sourceUrl: law.meta.sourceUrl,
    standDatum,
    isLawPage: true,
  });

  // Disclaimer info-box (only if LLM data exists)
  const disclaimerHtml = llmData
    ? `      <div class="bg-gruene-light/50 border border-gruene-green/30 rounded-lg p-3 mb-6 text-sm text-gruene-dark" data-pagefind-ignore>
        <strong>Hinweis:</strong> Der Gesetzestext ist im Original wiedergegeben. Die Zusammenfassungen zu den einzelnen Paragraphen wurden mittels KI (LLM) erstellt und nicht redaktionell überprüft. Sie dienen ausschließlich der Orientierung und sind keine Rechtsberatung.
      </div>\n`
    : '';

  // Topic filter tag-select (only if LLM data has topics)
  let topicChipsHtml = '';
  if (llmData && llmData.paragraphs) {
    const allTopics = new Set();
    const topicCounts = {};
    for (const pData of Object.values(llmData.paragraphs)) {
      if (pData.topics) {
        pData.topics.forEach(t => {
          allTopics.add(t);
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
      }
    }
    if (allTopics.size > 0) {
      const sortedTopics = [...allTopics].sort((a, b) => a.localeCompare(b, 'de'));
      const topicData = sortedTopics.map(t => ({ name: t, count: topicCounts[t] || 0 }));
      topicChipsHtml = `      <div id="topic-filter" class="mb-4 relative" data-pagefind-ignore data-topics-json="${escapeHtml(JSON.stringify(topicData))}">
        <div class="topic-select-container">
          <input type="text" id="topic-search-input" class="topic-search-input" placeholder="Themen filtern..." autocomplete="off" />
        </div>
        <div id="topic-dropdown" class="topic-dropdown hidden"></div>
        <div id="topic-selected-chips" class="topic-selected-chips hidden"></div>
      </div>\n`;
    }
  }

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - gemeindeordnung.gruene.at</title>
    <link rel="stylesheet" href="../css/main.css" />
    <meta data-pagefind-filter="bundesland[content]" content="${escapeHtml(law.meta.bundesland)}" />
    <meta data-pagefind-filter="typ[content]" content="Gesetz" />
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
      <div class="inline-search-container hidden sm:block" data-pagefind-ignore data-search-scope="gesetz" data-search-filter-bundesland="${escapeHtml(law.meta.bundesland)}">
        <div class="relative">
          <input type="search" class="inline-search-input" autocomplete="off"
            placeholder="In ${escapeHtml(law.meta.bundesland)} suchen..." minlength="3" />
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <div class="inline-search-dropdown hidden"></div>
      </div>
${disclaimerHtml}${topicChipsHtml}${tocHtml}
      <main data-pagefind-body class="law-text max-w-prose mx-auto leading-relaxed">
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
function generateIndexPage(lawsByCategory, faqTopics) {
  // Read glossary terms for discovery links (graceful fallback if missing)
  const glossaryPath = join(ROOT, 'data', 'llm', 'glossary', 'terms.json');
  let glossaryTerms = [];
  if (existsSync(glossaryPath)) {
    try {
      const data = JSON.parse(readFileSync(glossaryPath, 'utf-8'));
      glossaryTerms = (data.terms || []).slice(0, 8);
    } catch { /* ignore parse errors */ }
  }

  // Build card grid sections for collapsible details
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

  // Build FAQ discovery chips
  let faqChipsHtml = '';
  if (faqTopics && faqTopics.length > 0) {
    const faqChips = faqTopics.slice(0, 8).map(t =>
      `<a href="faq/${t.slug}.html" class="discovery-chip">${genderText(escapeHtml(t.title))}</a>`
    ).join('\n              ');

    faqChipsHtml = `<span class="discovery-label">Häufige Fragen</span>
              ${faqChips}`;
  }

  // Build Glossary discovery chips (only if terms.json exists)
  let glossarChipsHtml = '';
  if (glossaryTerms.length > 0) {
    const glossarChips = glossaryTerms.map(t =>
      `<a href="glossar.html#${t.slug}" class="discovery-chip">${escapeHtml(t.term)}</a>`
    ).join('\n              ');

    glossarChipsHtml = `<span class="discovery-label">Glossar</span>
              ${glossarChips}`;
  }

  // Build hero BL select dropdown (filter-only, does not navigate)
  const heroBlSelectHtml = buildHeroBundeslandSelect();

  const headerHtml = generateHeader(false);
  const footerHtml = generateFooter({ isLawPage: false });

  // Hero section with large centered search
  const heroHtml = `    <section class="hero-section" data-pagefind-ignore>
      <div class="max-w-3xl mx-auto px-4">
        <h1 class="text-3xl sm:text-4xl font-bold text-gruene-dark mb-2">
          Gemeindeordnungen der österreichischen Bundesländer
        </h1>
        <p class="text-lg text-gruene-dark/80 mb-6">
          Alle Gemeindeordnungen und Stadtrechte durchsuchen, vergleichen und verstehen.
        </p>
        <div class="hero-search-container max-w-2xl mx-auto relative">
          <div class="relative">
            <input id="hero-search-input" type="search" minlength="3" autocomplete="off"
              placeholder="Gesetz, Thema oder Begriff suchen..."
              class="w-full text-lg py-4 pl-12 pr-4 rounded-xl border-2 border-gruene-green/50 shadow-lg bg-white text-gruene-dark focus:outline-none focus:ring-2 focus:ring-gruene-green/50 focus:border-gruene-green" />
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
          <div class="mt-3 flex justify-center">
            ${heroBlSelectHtml}
          </div>
          <div id="hero-search-dropdown" class="search-dropdown hidden mt-2"></div>
        </div>
      </div>
    </section>`;

  // Discovery links section — compact inline flow layout
  const hasDiscovery = faqChipsHtml || glossarChipsHtml;
  const discoveryHtml = hasDiscovery ? `    <section class="discovery-section max-w-5xl mx-auto px-4 py-8" data-pagefind-ignore>
        <div class="discovery-section-compact flex flex-wrap items-center gap-2">
              ${faqChipsHtml}
              ${glossarChipsHtml}
        </div>
    </section>` : '';

  // Collapsible card grid
  const chevronSvg = `<svg class="w-5 h-5 details-open-rotate inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>`;
  const collapsibleGrid = `    <details class="max-w-5xl mx-auto px-4 py-4">
      <summary class="cursor-pointer text-lg font-semibold text-gruene-dark hover:text-gruene-green py-3 list-none flex items-center">
        ${chevronSvg}Alle Gesetze durchblättern
      </summary>
      <main class="mt-4">${categorySections}
      </main>
    </details>`;

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gemeindeordnungen der österreichischen Bundesländer</title>
    <link rel="stylesheet" href="css/main.css" />
  </head>
  <body class="bg-gray-50 min-h-screen flex flex-col">
${headerHtml}
${heroHtml}
${discoveryHtml}
${collapsibleGrid}
${footerHtml}
${generateScrollToTop()}
    <script type="module" src="js/main.js"></script>
  </body>
</html>`;
}

/**
 * Generate the FAQ index page listing all topic cards.
 */
function generateFAQIndexPage(topics) {
  const headerHtml = generateHeader(false, undefined, undefined, '../');
  const footerHtml = generateFooter({ isLawPage: false });

  const cards = topics.map(t => {
    return `          <a href="${t.slug}.html" class="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4">
            <p class="font-bold text-gruene-dark">${genderText(escapeHtml(t.title))}</p>
            <p class="text-sm text-gruene-dark/80 mt-1">${genderText(escapeHtml(t.description))}</p>
            <p class="text-xs text-gray-500 mt-2">${t.questions.length} Fragen</p>
          </a>`;
  }).join('\n');

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Häufige Fragen - gemeindeordnung.gruene.at</title>
    <link rel="stylesheet" href="../css/main.css" />
  </head>
  <body class="bg-gray-50 min-h-screen flex flex-col">
${headerHtml}
    <div class="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gruene-dark">Häufige Fragen zu Gemeindeordnungen</h1>
        <p class="mt-2 text-lg text-gruene-dark/80">
          Thematische Übersichten mit Vergleich aller Bundesländer
        </p>
      </div>
      <div class="bg-gruene-light/50 border border-gruene-green/30 rounded-lg p-3 mb-6 text-sm text-gruene-dark" data-pagefind-ignore>
        <strong>Hinweis:</strong> Diese Inhalte wurden mittels KI (LLM) erstellt und nicht redaktionell überprüft. Sie dienen ausschließlich der Orientierung und sind keine Rechtsberatung.
      </div>
      <div class="inline-search-container hidden sm:block" data-pagefind-ignore data-search-scope="faq">
        <div class="relative">
          <input type="search" class="inline-search-input" autocomplete="off"
            placeholder="FAQ durchsuchen..." minlength="3" />
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <div class="inline-search-dropdown hidden"></div>
      </div>
      <main data-pagefind-ignore>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
${cards}
        </div>
      </main>
    </div>
${footerHtml}
${generateScrollToTop()}
    <script type="module" src="../js/main.js"></script>
  </body>
</html>`;
}

/**
 * Generate a single FAQ topic page with questions and cross-BL references.
 */
function generateFAQTopicPage(topic) {
  const headerHtml = generateHeader(false, undefined, undefined, '../');
  const footerHtml = generateFooter({ isLawPage: false });

  const questionsHtml = topic.questions.map(q => {
    const refsHtml = q.references && q.references.length > 0
      ? `<div class="mt-3 text-sm">
            <span class="text-gray-500 font-medium">Siehe:</span>
            ${q.references.map(r => `<a href="../${r.category}/${r.key}.html#p${encodeURIComponent(r.paragraph)}" class="text-gruene-dark hover:underline ml-2">${escapeHtml(r.label)}</a>`).join('')}
          </div>`
      : '';

    return `      <article class="mb-8 bg-white rounded-lg border border-gray-200 p-5">
        <h2 class="text-lg font-semibold text-gruene-dark">${genderText(escapeHtml(q.question))}</h2>
        <p class="mt-2 text-gruene-dark/80 leading-relaxed">${genderText(escapeHtml(q.answer))}</p>
        ${refsHtml}
      </article>`;
  }).join('\n');

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${genderText(escapeHtml(topic.title))} - FAQ - gemeindeordnung.gruene.at</title>
    <link rel="stylesheet" href="../css/main.css" />
    <meta data-pagefind-filter="typ[content]" content="FAQ" />
    <meta data-pagefind-meta="topic_title[content]" content="${genderText(escapeHtml(topic.title))}" />
  </head>
  <body class="bg-gray-50 min-h-screen flex flex-col">
${headerHtml}
    <nav data-pagefind-ignore aria-label="Breadcrumb" class="max-w-5xl mx-auto px-4 py-2 text-sm">
      <ol class="flex items-center gap-1 text-gruene-dark">
        <li><a href="../index.html" class="text-gruene-dark hover:underline">Startseite</a></li>
        <li class="text-gray-400">/</li>
        <li><a href="index.html" class="text-gruene-dark hover:underline">FAQ</a></li>
        <li class="text-gray-400">/</li>
        <li class="text-gray-500">${genderText(escapeHtml(topic.title))}</li>
      </ol>
    </nav>
    <div class="max-w-5xl mx-auto px-4 py-6 flex-1 w-full">
      <header class="mb-6">
        <h1 class="text-3xl font-bold text-gruene-dark">${genderText(escapeHtml(topic.title))}</h1>
        <p class="mt-1 text-gruene-dark/80">${genderText(escapeHtml(topic.description))}</p>
      </header>
      <div class="inline-search-container hidden sm:block" data-pagefind-ignore data-search-scope="faq">
        <div class="relative">
          <input type="search" class="inline-search-input" autocomplete="off"
            placeholder="FAQ durchsuchen..." minlength="3" />
          <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <div class="inline-search-dropdown hidden"></div>
      </div>
      <div class="bg-gruene-light/50 border border-gruene-green/30 rounded-lg p-3 mb-6 text-sm text-gruene-dark" data-pagefind-ignore>
        <strong>Hinweis:</strong> Diese Inhalte wurden mittels KI (LLM) erstellt und nicht redaktionell überprüft. Sie dienen ausschließlich der Orientierung und sind keine Rechtsberatung.
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-sm text-gruene-dark" data-pagefind-ignore>
        <strong>Wichtig:</strong> Die Regelungen können je nach Bundesland erheblich voneinander abweichen. Prüfen Sie die Details in der jeweiligen Gemeindeordnung Ihres Bundeslandes.
      </div>
      <main data-pagefind-body>
${questionsHtml}
      </main>
      <div class="mt-6">
        <a href="index.html" class="text-gruene-dark hover:underline">&larr; Alle Themen</a>
      </div>
    </div>
${footerHtml}
${generateScrollToTop()}
    <script type="module" src="../js/main.js"></script>
  </body>
</html>`;
}

/**
 * Generate the glossary page with A-Z navigation.
 */
function generateGlossaryPage(terms) {
  const headerHtml = generateHeader(false);
  const footerHtml = generateFooter({ isLawPage: false });

  // Group terms by first letter
  const grouped = {};
  for (const term of terms) {
    const letter = term.term.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(term);
  }
  const sortedLetters = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'de'));

  // A-Z navigation bar
  const azNav = sortedLetters
    .map(l => `<a href="#letter-${l}" class="text-gruene-dark hover:underline font-medium">${l}</a>`)
    .join('\n          ');

  // Term sections
  const termSections = sortedLetters.map(letter => {
    const letterTerms = grouped[letter].sort((a, b) => a.term.localeCompare(b.term, 'de'));
    const termsHtml = letterTerms.map(t => {
      const refsHtml = t.references && t.references.length > 0
        ? `\n        <div class="mt-2 text-sm">
          <span class="text-gray-500">Siehe:</span>
          ${t.references.map(r => `<a href="${r.category}/${r.key}.html#p${encodeURIComponent(r.paragraph)}" class="text-gruene-dark hover:underline ml-1">${escapeHtml(r.label)}</a>`).join('')}
        </div>`
        : '';
      return `      <div id="${t.slug}" class="mb-4">
        <h3 class="text-lg font-semibold text-gruene-dark">${escapeHtml(t.term)}</h3>
        <p class="text-gruene-dark/80 mt-1">${genderText(escapeHtml(t.definition))}</p>${refsHtml}
      </div>`;
    }).join('\n');

    return `      <div class="mb-8">
        <h2 id="letter-${letter}" class="text-2xl font-bold text-gruene-dark mb-4 border-b border-gray-200 pb-2">${letter}</h2>
${termsHtml}
      </div>`;
  }).join('\n');

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Glossar der Rechtsbegriffe - gemeindeordnung.gruene.at</title>
    <link rel="stylesheet" href="css/main.css" />
    <meta data-pagefind-filter="typ[content]" content="Glossar" />
  </head>
  <body class="bg-gray-50 min-h-screen flex flex-col">
${headerHtml}
    <div class="max-w-5xl mx-auto px-4 py-8 flex-1 w-full">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gruene-dark">Glossar der Rechtsbegriffe</h1>
        <p class="mt-2 text-lg text-gruene-dark/80">
          Wichtige Fachbegriffe aus den österreichischen Gemeindeordnungen
        </p>
      </div>
      <div class="bg-gruene-light/50 border border-gruene-green/30 rounded-lg p-3 mb-6 text-sm text-gruene-dark" data-pagefind-ignore>
        <strong>Hinweis:</strong> Diese Definitionen wurden mittels KI (LLM) erstellt und nicht redaktionell überprüft. Sie dienen ausschließlich der Orientierung und sind keine Rechtsberatung.
      </div>
      <div class="mb-6" data-pagefind-ignore>
        <input id="glossar-filter" type="search" data-pagefind-ignore
          placeholder="Begriff suchen..."
          class="w-full sm:w-96 border border-gray-300 rounded-lg px-4 py-2 text-sm
                 bg-white text-gruene-dark focus:outline-none focus:ring-2
                 focus:ring-gruene-green/50 focus:border-gruene-green"
          aria-label="Glossarbegriffe filtern" />
      </div>
      <nav class="mb-8 flex flex-wrap gap-3" data-pagefind-ignore>
          ${azNav}
      </nav>
      <main data-pagefind-body>
${termSections}
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

      const html = generateLawPage(law, key, category, rootDir);
      writeFileSync(join(outDir, `${key}.html`), html);
      console.log(`Generated: src/${category}/${key}.html`);

      lawsByCategory[category].push({ ...law, key });
    }
  }

  // Load FAQ data for index page
  const faqPath = join(rootDir, 'data', 'llm', 'faq', 'topics.json');
  let faqTopics = [];
  if (existsSync(faqPath)) {
    try {
      faqTopics = JSON.parse(readFileSync(faqPath, 'utf-8')).topics || [];
    } catch {
      faqTopics = [];
    }
  }

  // Generate index page (with FAQ section if data exists)
  const indexHtml = generateIndexPage(lawsByCategory, faqTopics);
  writeFileSync(join(rootDir, 'src', 'index.html'), indexHtml);
  console.log('Generated: src/index.html');

  // Generate FAQ pages
  if (faqTopics.length > 0) {
    const faqDir = join(rootDir, 'src', 'faq');
    mkdirSync(faqDir, { recursive: true });

    writeFileSync(join(faqDir, 'index.html'), generateFAQIndexPage(faqTopics));
    console.log('Generated: src/faq/index.html');

    for (const topic of faqTopics) {
      writeFileSync(join(faqDir, `${topic.slug}.html`), generateFAQTopicPage(topic));
      console.log(`Generated: src/faq/${topic.slug}.html`);
    }
  }

  // Generate glossary page
  const glossaryPath = join(rootDir, 'data', 'llm', 'glossary', 'terms.json');
  if (existsSync(glossaryPath)) {
    try {
      const glossaryData = JSON.parse(readFileSync(glossaryPath, 'utf-8'));
      if (glossaryData.terms && glossaryData.terms.length > 0) {
        writeFileSync(join(rootDir, 'src', 'glossar.html'), generateGlossaryPage(glossaryData.terms));
        console.log('Generated: src/glossar.html');
      }
    } catch {
      // Malformed glossary JSON -- skip
    }
  }

  return lawsByCategory;
}

// Run directly
if (process.argv[1] && process.argv[1].endsWith('generate-pages.js')) {
  generatePages().catch(err => {
    console.error('Generate failed:', err.message);
    process.exit(1);
  });
}
