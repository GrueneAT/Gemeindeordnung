/**
 * HTML-to-JSON parser for RIS law documents.
 *
 * Reads raw RIS HTML (fetched via GeltendeFassung.wxe) and produces
 * structured JSON with meta + hierarchical struktur (Hauptstuecke/Abschnitte/Paragraphen).
 *
 * Usage:
 *   node scripts/parse-laws.js          # Parse all laws from data/raw/ to data/parsed/
 *   import { parseLaw } from './parse-laws.js'  # Use as module
 */

import * as cheerio from 'cheerio';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { LAWS } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

/**
 * Parse a single RIS law HTML document into structured JSON.
 *
 * @param {string} html - Raw HTML from RIS GeltendeFassung page
 * @param {string} lawKey - Key identifying the law (e.g. 'burgenland')
 * @param {object} lawConfig - Config object from LAWS registry
 * @returns {object} Structured JSON with meta + struktur
 */
export function parseLaw(html, lawKey, lawConfig) {
  const $ = cheerio.load(html);
  const contentHash = 'sha256:' + createHash('sha256').update(html).digest('hex');

  // Build meta
  const meta = {
    bundesland: lawConfig.bundesland,
    kurztitel: lawConfig.name,
    gesetzesnummer: lawConfig.gesetzesnummer,
    abfrage: lawConfig.abfrage,
    kategorie: lawConfig.category,
    stadt: lawConfig.stadt || null,
    fetchedAt: new Date().toISOString(),
    sourceUrl: lawConfig.url,
    contentHash,
    fassungVom: extractFassungVom($),
  };

  // Extract all document content blocks (each is typically one paragraph)
  const contentBlocks = [];
  $('div.documentContent').each((i, el) => {
    const block = $(el);
    const contentDiv = block.find('div.contentBlock');
    if (contentDiv.length === 0) return;

    // Skip Praeambel/TOC sections
    const headerText = block.find('h3').first().text().trim();
    if (headerText === 'Präambel/Promulgationsklausel' || headerText === 'Sonstige Textteile') return;

    contentBlocks.push(contentDiv);
  });

  // Parse blocks into paragraphen with structural context
  const rawParagraphen = [];
  let currentHauptstueck = null;
  let currentAbschnitt = null;

  for (const contentDiv of contentBlocks) {
    const headings = parseHeadings($, contentDiv);

    // Update structural context from headings
    if (headings.hauptstueck) {
      currentHauptstueck = headings.hauptstueck;
      currentAbschnitt = null; // Reset abschnitt when new hauptstueck starts
    }
    if (headings.abschnitt) {
      currentAbschnitt = headings.abschnitt;
    }

    // Extract paragraph if present
    if (headings.paragraphNummer) {
      const para = extractParagraph($, contentDiv, headings);
      para.hauptstueck = currentHauptstueck;
      para.abschnitt = currentAbschnitt;
      rawParagraphen.push(para);
    }
  }

  // Fail-fast: no paragraphs found
  if (rawParagraphen.length === 0) {
    throw new Error(`${lawKey}: No paragraphs found -- HTML structure may have changed`);
  }

  // Build hierarchical struktur
  const struktur = buildStruktur(rawParagraphen);

  return { meta, struktur };
}

/**
 * Extract "Fassung vom DD.MM.YYYY" date from the h1#Title element.
 * Returns ISO date string (YYYY-MM-DD) or null if not found.
 */
function extractFassungVom($) {
  const titleText = $('h1#Title').text();
  const match = titleText.match(/Fassung vom (\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

/**
 * Parse headings from a content block to extract structural context.
 */
function parseHeadings($, contentDiv) {
  const result = {
    hauptstueck: null,
    abschnitt: null,
    paragraphNummer: null,
    paragraphTitel: null,
  };

  contentDiv.find('h4').each((i, h4) => {
    const el = $(h4);
    const className = el.attr('class') || '';
    // Get the aria-hidden text (preferred) or visible text
    const text = getVisibleText($, el).trim();

    // Detect Hauptstueck headers
    if (isHauptstueckHeader(className, text)) {
      result.hauptstueck = parseHauptstueckInfo(text);
    }
    // Detect Abschnitt headers
    else if (isAbschnittHeader(className, text)) {
      result.abschnitt = parseAbschnittInfo(text);
    }
    // Detect paragraph number (§ N)
    else if (isParagraphNumber(text)) {
      const parsed = parseParagraphNumber(text);
      if (parsed) {
        result.paragraphNummer = parsed.nummer;
        if (parsed.titel) {
          result.paragraphTitel = parsed.titel;
        }
      }
    }
    // Detect paragraph title (comes after § number, class UeberschrPara without §)
    else if (className.includes('UeberschrPara') && !isParagraphNumber(text) && !isAbschnittHeader(className, text)) {
      if (!result.paragraphTitel) {
        result.paragraphTitel = text;
      }
    }
  });

  return result;
}

function isHauptstueckHeader(className, text) {
  // Matches: "1. Hauptstück", "I. HAUPTSTÜCK", "I. Hauptstück"
  const lcText = text.toLowerCase();
  if (lcText.includes('hauptstück') || lcText.includes('hauptstueck')) {
    // Must have a number/roman numeral before "Hauptstück"
    if (/^\s*[\dIVXLC]+[\.\s]/i.test(text) || /hauptstück/i.test(text)) {
      return true;
    }
  }
  // Also check class-based identification
  if (className.includes('UeberschrG1') && /hauptstück/i.test(text)) {
    return true;
  }
  if (className.includes('UeberschrArt') && /hauptstück/i.test(text.toUpperCase())) {
    return true;
  }
  return false;
}

function isAbschnittHeader(className, text) {
  const lcText = text.toLowerCase();
  // Must contain "abschnitt" and have a number prefix
  if (lcText.includes('abschnitt') && /^\s*[\d]+[a-z]?[\.\s]/i.test(text)) {
    return true;
  }
  // Class-based: UeberschrG1, UeberschrG1-AfterG2 with "Abschnitt" text
  if ((className.includes('UeberschrG1') || className.includes('UeberschrArt')) && lcText.includes('abschnitt')) {
    return true;
  }
  return false;
}

function isParagraphNumber(text) {
  return /§\s*\d+/.test(text) || /Paragraph\s+\d+/i.test(text);
}

function parseHauptstueckInfo(text) {
  // Extract nummer and titel from "1. Hauptstück\nDie Gemeinde" or "I. HAUPTSTÜCK\nDie Gemeinde"
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  let nummer = '';
  let titel = '';

  const firstLine = lines[0] || '';
  // Match Roman numeral or Arabic number before "Hauptstück"
  const numMatch = firstLine.match(/^([\dIVXLC]+[a-z]?)[\.\s]+Hauptst/i);
  if (numMatch) {
    nummer = numMatch[1];
  }

  // Title is everything after "Hauptstück" (possibly on same line after \n or on next lines)
  const afterHS = firstLine.replace(/^.*?Hauptstück:?\s*/i, '').trim();
  if (afterHS) {
    titel = afterHS;
  } else if (lines.length > 1) {
    titel = lines.slice(1).join(' ').trim();
  }

  return { nummer, titel };
}

function parseAbschnittInfo(text) {
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  let nummer = '';
  let titel = '';

  const firstLine = lines[0] || '';
  const numMatch = firstLine.match(/^(\d+[a-z]?)[\.\s]+Abschnitt/i);
  if (numMatch) {
    nummer = numMatch[1];
  }

  // Title after "Abschnitt:" or "Abschnitt" (may include colon)
  const afterAbs = firstLine.replace(/^.*?Abschnitt:?\s*/i, '').trim();
  if (afterAbs) {
    titel = afterAbs;
  } else if (lines.length > 1) {
    titel = lines.slice(1).join(' ').trim();
  }

  return { nummer, titel };
}

function parseParagraphNumber(text) {
  // "§ 1" or "§ 1\nBegriff und rechtliche Stellung" or "§ 15a"
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);

  const numMatch = lines[0].match(/§\s*(\d+[a-z]?)/);
  if (!numMatch) return null;

  const nummer = numMatch[1];
  let titel = null;

  // Check if title is on the same line after the number
  const afterNum = lines[0].replace(/§\s*\d+[a-z]?\s*/, '').trim();
  if (afterNum && !afterNum.startsWith('(')) {
    titel = afterNum;
  } else if (lines.length > 1) {
    // Title on subsequent lines (OOe pattern: "§ 1\nBegriff...")
    titel = lines.slice(1).join(' ').trim();
  }

  return { nummer, titel: titel || null };
}

/**
 * Get visible text from an element, preferring aria-hidden content.
 * RIS uses aria-hidden="true" spans for the actual text and sr-only spans for screen readers.
 * We want the aria-hidden text (which contains the real formatted text).
 */
function getVisibleText($, el) {
  // Clone the element and remove sr-only spans
  const clone = el.clone();
  clone.find('.sr-only').remove();
  // Get text, normalize whitespace
  return clone.text().replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extract paragraph data from a content block.
 */
function extractParagraph($, contentDiv, headings) {
  // Get the full text of the paragraph (excluding headings)
  const textParts = [];
  const absaetze = [];

  // Check for Absaetze (numbered sub-paragraphs in <ol class="wai-absatz-list">)
  const absatzList = contentDiv.find('ol.wai-absatz-list');
  if (absatzList.length > 0) {
    absatzList.find('> li').each((i, li) => {
      const liEl = $(li);
      const absText = getVisibleText($, liEl).trim();
      if (absText) {
        // Extract absatz number from (1), (2) etc
        const numMatch = absText.match(/^\((\d+[a-z]?)\)/);
        const nummer = numMatch ? parseInt(numMatch[1], 10) : i + 1;
        absaetze.push({ nummer, text: absText });
        textParts.push(absText);
      }
    });
  }

  // Also get non-list text content (paragraphs without Absaetze)
  if (absaetze.length === 0) {
    contentDiv.find('.Abs, .ErlText, .SchlussteilE0, .GldSymbol').each((i, el) => {
      const t = getVisibleText($, $(el)).trim();
      if (t) textParts.push(t);
    });
  }

  const fullText = textParts.join('\n');

  return {
    nummer: headings.paragraphNummer,
    titel: headings.paragraphTitel || '',
    text: fullText,
    absaetze: absaetze.length > 0 ? absaetze : [],
    hauptstueck: null, // filled by caller
    abschnitt: null,   // filled by caller
  };
}

/**
 * Build hierarchical struktur from flat list of paragraphen with structural context.
 */
function buildStruktur(rawParagraphen) {
  // Determine if law uses Hauptstuecke
  const hasHauptstuecke = rawParagraphen.some(p => p.hauptstueck !== null);
  const hasAbschnitte = rawParagraphen.some(p => p.abschnitt !== null);

  if (hasHauptstuecke) {
    return buildWithHauptstuecke(rawParagraphen);
  } else if (hasAbschnitte) {
    return buildWithAbschnitte(rawParagraphen);
  } else {
    // Flat: all paragraphen at top level in a single virtual section
    return [{
      typ: 'abschnitt',
      nummer: '1',
      titel: '',
      paragraphen: rawParagraphen.map(cleanParagraph),
    }];
  }
}

function buildWithHauptstuecke(rawParagraphen) {
  const hauptstuecke = [];
  let currentHS = null;
  let currentAbs = null;

  for (const para of rawParagraphen) {
    // New Hauptstueck?
    if (para.hauptstueck && (!currentHS || para.hauptstueck.nummer !== currentHS.nummer)) {
      currentHS = {
        typ: 'hauptstueck',
        nummer: para.hauptstueck.nummer,
        titel: para.hauptstueck.titel,
        abschnitte: [],
      };
      hauptstuecke.push(currentHS);
      currentAbs = null;
    }

    // Ensure we have a Hauptstueck
    if (!currentHS) {
      currentHS = {
        typ: 'hauptstueck',
        nummer: '',
        titel: '',
        abschnitte: [],
      };
      hauptstuecke.push(currentHS);
    }

    // New Abschnitt?
    if (para.abschnitt && (!currentAbs || para.abschnitt.nummer !== currentAbs.nummer ||
        (currentHS.abschnitte.length > 0 && para.hauptstueck &&
         para.hauptstueck.nummer !== hauptstuecke[hauptstuecke.length - 1]?.nummer))) {
      currentAbs = {
        typ: 'abschnitt',
        nummer: para.abschnitt.nummer,
        titel: para.abschnitt.titel,
        paragraphen: [],
      };
      currentHS.abschnitte.push(currentAbs);
    }

    // If no abschnitt yet, create a default one
    if (!currentAbs) {
      currentAbs = {
        typ: 'abschnitt',
        nummer: '',
        titel: '',
        paragraphen: [],
      };
      currentHS.abschnitte.push(currentAbs);
    }

    currentAbs.paragraphen.push(cleanParagraph(para));
  }

  return hauptstuecke;
}

function buildWithAbschnitte(rawParagraphen) {
  const abschnitte = [];
  let currentAbs = null;

  for (const para of rawParagraphen) {
    if (para.abschnitt && (!currentAbs || para.abschnitt.nummer !== currentAbs.nummer)) {
      currentAbs = {
        typ: 'abschnitt',
        nummer: para.abschnitt.nummer,
        titel: para.abschnitt.titel,
        paragraphen: [],
      };
      abschnitte.push(currentAbs);
    }

    if (!currentAbs) {
      currentAbs = {
        typ: 'abschnitt',
        nummer: '',
        titel: '',
        paragraphen: [],
      };
      abschnitte.push(currentAbs);
    }

    currentAbs.paragraphen.push(cleanParagraph(para));
  }

  return abschnitte;
}

/**
 * Clean a paragraph for output (remove internal tracking fields).
 */
function cleanParagraph(para) {
  return {
    nummer: para.nummer,
    titel: para.titel,
    text: para.text,
    absaetze: para.absaetze,
  };
}

/**
 * Parse all laws from data/raw/ and write JSON to data/parsed/.
 */
export async function parseAll() {
  const categories = ['gemeindeordnungen', 'stadtrechte', 'organisationsgesetze'];

  for (const category of categories) {
    const lawEntries = LAWS[category];
    if (!lawEntries) continue;

    const rawDir = join(ROOT, 'data', 'raw', category);
    const parsedDir = join(ROOT, 'data', 'parsed', category);

    if (!existsSync(rawDir)) {
      console.log(`Skipping ${category}: ${rawDir} does not exist`);
      continue;
    }

    mkdirSync(parsedDir, { recursive: true });

    for (const [key, config] of Object.entries(lawEntries)) {
      const htmlPath = join(rawDir, `${key}.html`);
      if (!existsSync(htmlPath)) {
        throw new Error(`Missing raw HTML: ${htmlPath}`);
      }

      const html = readFileSync(htmlPath, 'utf-8');
      console.log(`Parsing ${config.name}...`);

      const result = parseLaw(html, key, config);

      const allParas = [];
      for (const item of result.struktur) {
        if (item.paragraphen) allParas.push(...item.paragraphen);
        if (item.abschnitte) {
          for (const abs of item.abschnitte) {
            if (abs.paragraphen) allParas.push(...abs.paragraphen);
          }
        }
      }

      const sectionCount = result.struktur.length;
      console.log(`  Parsed ${config.name}: ${allParas.length} Paragraphen in ${sectionCount} Abschnitte`);

      const outputPath = join(parsedDir, `${key}.json`);
      writeFileSync(outputPath, JSON.stringify(result, null, 2));
    }
  }
}

// Run directly: parse all
if (process.argv[1] && process.argv[1].endsWith('parse-laws.js')) {
  parseAll().catch(err => {
    console.error('Parse failed:', err.message);
    process.exit(1);
  });
}
