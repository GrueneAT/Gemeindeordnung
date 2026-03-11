/**
 * LLM content quality validation script.
 *
 * Validates generated LLM content (summaries, FAQ, glossary) for quality criteria:
 * - No placeholder flags
 * - Minimum content length
 * - No formulaic patterns
 * - No ASCII-safe spellings (should use proper German umlauts)
 * - Proper citation format
 * - Cross-BL reference coverage
 *
 * Usage:
 *   node scripts/llm-validate.js          # Validate all LLM content
 *   npm run llm:validate                  # Same via npm script
 *
 * Can also be imported as a module:
 *   import { validateSummary, validateFAQ, validateGlossary, validateAll } from './llm-validate.js';
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BL_CITATION } from './llm-analyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const CATEGORIES = ['gemeindeordnungen', 'stadtrechte'];

// Common ASCII-safe spellings that should be proper umlauts in German
const ASCII_SAFE_PATTERNS = [
  { pattern: /\bfuer\b/gi, correct: 'fuer -> fuer (should be proper umlaut)' },
  { pattern: /\bueber\b/gi, correct: 'ueber' },
  { pattern: /\boesterreich/gi, correct: 'oesterreich' },
  { pattern: /\baenderung/gi, correct: 'aenderung' },
  { pattern: /\baerztlich/gi, correct: 'aerztlich' },
  { pattern: /\boeffentlich/gi, correct: 'oeffentlich' },
  { pattern: /\bFaehigkeit\b/g, correct: 'Faehigkeit' },
  { pattern: /\bgueltig/gi, correct: 'gueltig' },
  { pattern: /\bBeschluesse\b/g, correct: 'Beschluesse' },
  { pattern: /\bpruef/gi, correct: 'pruef...' },
  { pattern: /\bHaelfte\b/g, correct: 'Haelfte' },
  { pattern: /\bBuergermeister\b/g, correct: 'Buergermeister' },
  { pattern: /\bAusschuesse\b/g, correct: 'Ausschuesse' },
  { pattern: /\bGemeindeverbaende\b/g, correct: 'Gemeindeverbaende' },
];

// All known BL_CITATION values for checking reference labels
const CITATION_VALUES = new Set(Object.values(BL_CITATION));
const CITATION_KEYS = new Set(Object.keys(BL_CITATION));

/**
 * Validate a single summary JSON file.
 *
 * @param {object} data - Parsed summary JSON
 * @param {string} lawKey - Law key (e.g. 'burgenland')
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateSummary(data, lawKey) {
  const errors = [];

  // Check placeholder flag
  if (data.meta?.placeholder === true) {
    errors.push(`[${lawKey}] Summary has placeholder:true in meta`);
  }

  if (!data.paragraphs) {
    errors.push(`[${lawKey}] Summary has no paragraphs`);
    return errors;
  }

  const paragraphEntries = Object.entries(data.paragraphs);
  let allgemeineCount = 0;

  for (const [num, para] of paragraphEntries) {
    // Check minimum length
    if (para.summary && para.summary.length < 50) {
      errors.push(`[${lawKey}] Par. ${num}: summary shorter than 50 chars (${para.summary.length})`);
    }

    // Check formulaic opener
    if (para.summary && para.summary.startsWith('Dieser Paragraph regelt')) {
      errors.push(`[${lawKey}] Par. ${num}: summary starts with "Dieser Paragraph regelt"`);
    }

    // Check ASCII-safe spellings
    if (para.summary) {
      for (const { pattern, correct } of ASCII_SAFE_PATTERNS) {
        if (pattern.test(para.summary)) {
          errors.push(`[${lawKey}] Par. ${num}: ASCII-safe spelling detected: "${correct}" - should use proper umlauts`);
          // Reset regex lastIndex
          pattern.lastIndex = 0;
          break; // One error per paragraph is enough
        }
        pattern.lastIndex = 0;
      }
    }

    // Count "Allgemeine Bestimmungen" topics
    if (para.topics && para.topics.includes('Allgemeine Bestimmungen')) {
      allgemeineCount++;
    }
  }

  // Check if "Allgemeine Bestimmungen" appears in >50% of paragraphs
  if (paragraphEntries.length > 0 && allgemeineCount / paragraphEntries.length > 0.5) {
    errors.push(`[${lawKey}] "Allgemeine Bestimmungen" topic in ${allgemeineCount}/${paragraphEntries.length} paragraphs (>50%)`);
  }

  return errors;
}

/**
 * Validate FAQ JSON data.
 *
 * @param {object} data - Parsed FAQ JSON
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateFAQ(data) {
  const errors = [];

  // Check placeholder flag
  if (data.meta?.placeholder === true) {
    errors.push('[FAQ] Has placeholder:true in meta');
  }

  if (!data.topics || !Array.isArray(data.topics)) {
    errors.push('[FAQ] No topics array');
    return errors;
  }

  for (const topic of data.topics) {
    if (!topic.questions) continue;

    for (const q of topic.questions) {
      // Check formulaic questions
      if (q.question && /Was regelt das Thema/i.test(q.question)) {
        errors.push(`[FAQ] Formulaic question detected: "${q.question.substring(0, 60)}..."`);
      }

      // Check answer length
      if (q.answer && q.answer.length < 100) {
        errors.push(`[FAQ] ${topic.slug}: answer shorter than 100 chars (${q.answer.length})`);
      }

      // Check reference citation format
      if (q.references) {
        for (const ref of q.references) {
          if (ref.label && ref.key) {
            // Check if label uses raw key instead of proper citation
            if (CITATION_KEYS.has(ref.key) && ref.label.includes(ref.key) && !ref.label.includes(BL_CITATION[ref.key])) {
              errors.push(`[FAQ] ${topic.slug}: raw citation format in label "${ref.label}" - should use "${BL_CITATION[ref.key]}"`);
            }
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Validate glossary JSON data.
 *
 * @param {object} data - Parsed glossary JSON
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validateGlossary(data) {
  const errors = [];

  // Check placeholder flag
  if (data.meta?.placeholder === true) {
    errors.push('[Glossary] Has placeholder:true in meta');
  }

  if (!data.terms || !Array.isArray(data.terms)) {
    errors.push('[Glossary] No terms array');
    return errors;
  }

  for (const term of data.terms) {
    // Check definition length
    if (term.definition && term.definition.length < 30) {
      errors.push(`[Glossary] "${term.term}": definition shorter than 30 chars (${term.definition.length})`);
    }

    // Check cross-BL reference coverage
    if (term.references) {
      const uniqueKeys = new Set(term.references.map(r => r.key));
      if (uniqueKeys.size < 3) {
        errors.push(`[Glossary] "${term.term}": references span only ${uniqueKeys.size} Bundeslaender/Stadtrechte (minimum 3)`);
      }
    }

    // Check ASCII-safe spellings in definitions
    if (term.definition) {
      for (const { pattern, correct } of ASCII_SAFE_PATTERNS) {
        if (pattern.test(term.definition)) {
          errors.push(`[Glossary] "${term.term}": ASCII-safe spelling in definition: "${correct}"`);
          pattern.lastIndex = 0;
          break;
        }
        pattern.lastIndex = 0;
      }
    }
  }

  return errors;
}

/**
 * Validate all LLM content on disk.
 *
 * @param {string} rootDir - Project root
 * @returns {{ valid: boolean, errors: string[] }}
 */
export async function validateAll(rootDir = ROOT) {
  const errors = [];

  // Validate summaries
  for (const category of CATEGORIES) {
    const summaryDir = join(rootDir, 'data', 'llm', 'summaries', category);
    if (!existsSync(summaryDir)) continue;

    const files = readdirSync(summaryDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const lawKey = file.replace('.json', '');
      try {
        const data = JSON.parse(readFileSync(join(summaryDir, file), 'utf-8'));
        errors.push(...validateSummary(data, lawKey));
      } catch (err) {
        errors.push(`[${lawKey}] Failed to parse summary JSON: ${err.message}`);
      }
    }
  }

  // Validate FAQ
  const faqPath = join(rootDir, 'data', 'llm', 'faq', 'topics.json');
  if (existsSync(faqPath)) {
    try {
      const data = JSON.parse(readFileSync(faqPath, 'utf-8'));
      errors.push(...validateFAQ(data));
    } catch (err) {
      errors.push(`[FAQ] Failed to parse JSON: ${err.message}`);
    }
  }

  // Validate glossary
  const glossaryPath = join(rootDir, 'data', 'llm', 'glossary', 'terms.json');
  if (existsSync(glossaryPath)) {
    try {
      const data = JSON.parse(readFileSync(glossaryPath, 'utf-8'));
      errors.push(...validateGlossary(data));
    } catch (err) {
      errors.push(`[Glossary] Failed to parse JSON: ${err.message}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('llm-validate.js')) {
  validateAll().then(result => {
    if (result.valid) {
      console.log('LLM Content Validation: PASSED');
      console.log('All content meets quality criteria.');
      process.exit(0);
    } else {
      console.log('LLM Content Validation: FAILED');
      console.log(`Found ${result.errors.length} issue(s):\n`);
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
      process.exit(1);
    }
  });
}
