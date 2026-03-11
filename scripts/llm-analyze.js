/**
 * LLM analysis stub for Claude Code CLI integration (Phase 4).
 *
 * Reads parsed law JSON from data/parsed/ and checks for existing LLM output
 * in data/llm/summaries/. Supports --dry-run to preview what would be analyzed.
 *
 * Usage:
 *   node scripts/llm-analyze.js --dry-run    # Preview: list laws needing analysis
 *   node scripts/llm-analyze.js              # Not yet implemented
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const CATEGORIES = ['gemeindeordnungen', 'stadtrechte'];

/**
 * Count total paragraphs in a parsed law structure.
 */
function countParagraphs(struktur) {
  let count = 0;
  for (const section of struktur) {
    if (section.paragraphen) {
      count += section.paragraphen.length;
    }
    if (section.abschnitte) {
      for (const abs of section.abschnitte) {
        if (abs.paragraphen) {
          count += abs.paragraphen.length;
        }
      }
    }
  }
  return count;
}

/**
 * Run dry-run analysis: list laws that would be analyzed (no LLM calls).
 *
 * @param {string} rootDir - Project root directory (default: actual project root)
 * @returns {{ laws: Array<{key, category, name, paragraphs}>, totalParagraphs: number, skipped: number }}
 */
export async function dryRun(rootDir = ROOT) {
  const laws = [];
  let totalParagraphs = 0;
  let skipped = 0;

  for (const category of CATEGORIES) {
    const parsedDir = join(rootDir, 'data', 'parsed', category);
    if (!existsSync(parsedDir)) continue;

    const files = readdirSync(parsedDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const key = file.replace('.json', '');

      // Check if LLM output already exists (incremental processing)
      const llmPath = join(rootDir, 'data', 'llm', 'summaries', category, `${key}.json`);
      if (existsSync(llmPath)) {
        skipped++;
        continue;
      }

      const law = JSON.parse(readFileSync(join(parsedDir, file), 'utf-8'));
      const paragraphs = countParagraphs(law.struktur);

      laws.push({
        key,
        category,
        name: law.meta.kurztitel,
        paragraphs,
      });

      totalParagraphs += paragraphs;
    }
  }

  return { laws, totalParagraphs, skipped };
}

// Run directly
if (process.argv[1] && process.argv[1].endsWith('llm-analyze.js')) {
  const isDryRun = process.argv.includes('--dry-run');

  if (isDryRun) {
    dryRun().then(result => {
      console.log('LLM Analysis Dry Run');
      console.log('====================\n');

      if (result.laws.length === 0) {
        console.log('No laws need analysis (all already processed).');
      } else {
        for (const law of result.laws) {
          console.log(`  ${law.category}/${law.key}: ${law.name} (${law.paragraphs} Paragraphen)`);
        }
        console.log(`\nTotal: ${result.laws.length} laws, ${result.totalParagraphs} paragraphs to analyze`);
      }

      if (result.skipped > 0) {
        console.log(`Skipped: ${result.skipped} laws (already have LLM output)`);
      }
    });
  } else {
    console.log('LLM analysis not yet implemented -- run with --dry-run to preview');
  }
}
