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
 * Flatten all paragraphs from a parsed law structure.
 */
function flattenParagraphs(struktur) {
  const paragraphs = [];
  function extract(section) {
    if (section.paragraphen) paragraphs.push(...section.paragraphen);
    if (section.abschnitte) section.abschnitte.forEach(extract);
    if (section.hauptstuecke) section.hauptstuecke.forEach(extract);
  }
  for (const section of struktur) extract(section);
  return paragraphs;
}

/**
 * Get full text for a specific paragraph from a parsed law file.
 *
 * @param {string} rootDir - Project root
 * @param {string} category - 'gemeindeordnungen' or 'stadtrechte'
 * @param {string} key - Law key (e.g. 'burgenland')
 * @param {string} paraNum - Paragraph number (e.g. '41')
 * @returns {string|null} Full paragraph text or null if not found
 */
function getParagraphText(rootDir, category, key, paraNum) {
  const parsedPath = join(rootDir, 'data', 'parsed', category, `${key}.json`);
  if (!existsSync(parsedPath)) return null;
  try {
    const law = JSON.parse(readFileSync(parsedPath, 'utf-8'));
    const paragraphs = flattenParagraphs(law.struktur);
    const para = paragraphs.find(p => String(p.nummer) === String(paraNum));
    if (!para) return null;
    return para.text || (para.absaetze ? para.absaetze.map(a => a.text).join('\n') : null);
  } catch { return null; }
}

/**
 * Cross-reference FAQ answers against actual parsed law texts.
 * Checks numerical claims (fractions, percentages, counts) against source paragraphs.
 *
 * @param {object} faqData - Parsed FAQ JSON
 * @param {string} rootDir - Project root
 * @returns {string[]} Array of warning messages
 */
export function crossReferenceFAQ(faqData, rootDir = ROOT) {
  const warnings = [];
  if (!faqData.topics) return warnings;

  // Numerical patterns to extract from FAQ answers
  const numericalPatterns = [
    /(\b(?:ein|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\s+(?:Drittel|Viertel|Fünftel|Prozent))\b/gi,
    /(\b(?:der|die|des)\s+Hälfte)\b/gi,
    /(\b\d+\s*(?:Prozent|%|v\.\s*H\.))\b/gi,
    /(\b(?:mindestens|wenigstens|höchstens)\s+\d+\s+(?:Mitglieder|Wochen|Monate|Tage))\b/gi,
    /(\b\d+\s+Mitglieder(?:n)?)\b/gi,
  ];

  for (const topic of faqData.topics) {
    if (!topic.questions) continue;

    for (const q of topic.questions) {
      if (!q.answer || !q.references || q.references.length === 0) continue;

      // Extract BL-specific claims from the answer
      // Pattern: "In {BL} {claim}" or "Im {BL} {claim}"
      const blClaims = q.answer.match(/(?:In|Im)\s+(Burgenland|Kärnten|Niederösterreich|Oberösterreich|Salzburg|Steiermark|Tirol|Vorarlberg|Wien|Linz|Graz|Innsbruck|Klagenfurt|Eisenstadt|Villach|Wels|Steyr)[^.]*\./g);
      if (!blClaims) continue;

      for (const claim of blClaims) {
        // Extract the BL name
        const blMatch = claim.match(/(?:In|Im)\s+(\S+)/);
        if (!blMatch) continue;
        const blName = blMatch[1];

        // Find numbers/fractions in the claim
        let hasNumerical = false;
        for (const pat of numericalPatterns) {
          pat.lastIndex = 0;
          if (pat.test(claim)) { hasNumerical = true; break; }
        }
        if (!hasNumerical) continue;

        // Find the matching reference for this BL
        const blNameToKey = {
          'Burgenland': 'burgenland', 'Kärnten': 'kaernten', 'Niederösterreich': 'niederoesterreich',
          'Oberösterreich': 'oberoesterreich', 'Salzburg': 'salzburg', 'Steiermark': 'steiermark',
          'Tirol': 'tirol', 'Vorarlberg': 'vorarlberg', 'Wien': 'wien',
          'Linz': 'linz', 'Graz': 'graz', 'Innsbruck': 'innsbruck', 'Klagenfurt': 'klagenfurt',
          'Eisenstadt': 'eisenstadt', 'Villach': 'villach', 'Wels': 'wels', 'Steyr': 'steyr',
        };
        const key = blNameToKey[blName];
        if (!key) continue;

        const matchingRefs = q.references.filter(r => r.key === key);
        if (matchingRefs.length === 0) continue;

        // Check each referenced paragraph for consistency
        for (const ref of matchingRefs) {
          const text = getParagraphText(rootDir, ref.category, ref.key, ref.paragraph);
          if (!text) continue;

          // Extract numbers from claim and source
          const claimNumbers = claim.match(/\b(\d+)\b/g) || [];
          const claimFractions = claim.match(/(?:Hälfte|Drittel|Viertel|Fünftel|zwei Drittel|ein Drittel|ein Viertel)/gi) || [];

          // Check: if claim says "Hälfte" but source says "zwei Drittel" (or vice versa)
          const claimSaysHalf = /Hälfte/i.test(claim);
          const claimSaysTwoThirds = /zwei\s*Drittel/i.test(claim);
          const sourceSaysHalf = /Hälfte/i.test(text);
          const sourceSaysTwoThirds = /zwei\s*Drittel|2\/3/i.test(text);

          if (claimSaysHalf && sourceSaysTwoThirds && !sourceSaysHalf) {
            warnings.push(`[FAQ cross-ref] ${topic.slug}: Claim says 'Hälfte' for ${blName} (Par. ${ref.paragraph}), but source says 'zwei Drittel'`);
          }
          if (claimSaysTwoThirds && sourceSaysHalf && !sourceSaysTwoThirds) {
            warnings.push(`[FAQ cross-ref] ${topic.slug}: Claim says 'zwei Drittel' for ${blName} (Par. ${ref.paragraph}), but source says 'Hälfte'`);
          }

          // Check: if claim says "ein Drittel" but source says "ein Viertel" (or vice versa)
          const claimSaysThird = /ein(?:em)?\s*Drittel/i.test(claim);
          const claimSaysQuarter = /ein(?:em)?\s*Viertel/i.test(claim);
          const sourceSaysThird = /ein(?:em)?\s*Drittel/i.test(text);
          const sourceSaysQuarter = /ein(?:em)?\s*Viertel/i.test(text);

          if (claimSaysThird && sourceSaysQuarter && !sourceSaysThird) {
            warnings.push(`[FAQ cross-ref] ${topic.slug}: Claim says 'ein Drittel' for ${blName} (Par. ${ref.paragraph}), but source says 'ein Viertel'`);
          }
          if (claimSaysQuarter && sourceSaysThird && !sourceSaysQuarter) {
            warnings.push(`[FAQ cross-ref] ${topic.slug}: Claim says 'ein Viertel' for ${blName} (Par. ${ref.paragraph}), but source says 'ein Drittel'`);
          }

          // Check: percentage claims (e.g. "5 Prozent" vs "2 %")
          const claimPct = claim.match(/(\d+)\s*(?:Prozent|%|v\.\s*H\.)/);
          const sourcePct = text.match(/(\d+)\s*(?:Prozent|%|v\.\s*H\.)/);
          if (claimPct && sourcePct && claimPct[1] !== sourcePct[1]) {
            warnings.push(`[FAQ cross-ref] ${topic.slug}: Claim says '${claimPct[0]}' for ${blName} (Par. ${ref.paragraph}), but source says '${sourcePct[0]}'`);
          }

          // Check: member count claims (e.g. "100 Mitglieder")
          const claimMembers = claim.match(/(\d+)\s*Mitglieder/);
          const sourceMembers = text.match(/(\d+)\s*Mitglieder/);
          if (claimMembers && sourceMembers && claimMembers[1] !== sourceMembers[1]) {
            warnings.push(`[FAQ cross-ref] ${topic.slug}: Claim says '${claimMembers[0]}' for ${blName} (Par. ${ref.paragraph}), but source says '${sourceMembers[0]}'`);
          }
        }
      }
    }
  }

  return warnings;
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
      errors.push(...crossReferenceFAQ(data, rootDir));
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
