/**
 * LLM analysis pipeline using Claude Code CLI.
 *
 * Reads parsed law JSON from data/parsed/ and generates:
 * - Per-law paragraph summaries + topic tags (data/llm/summaries/{category}/{key}.json)
 * - Cross-law FAQ topics (data/llm/faq/topics.json)
 * - Legal glossary terms (data/llm/glossary/terms.json)
 *
 * Uses `claude` CLI via child_process for LLM calls.
 * Fails hard if CLI is unavailable (no placeholders).
 *
 * Usage:
 *   node scripts/llm-analyze.js --dry-run              # Preview: list laws needing analysis
 *   node scripts/llm-analyze.js --generate              # Run full pipeline
 *   node scripts/llm-analyze.js --generate --law krems  # Single law only
 *   node scripts/llm-analyze.js --faq                   # Regenerate FAQ only
 *   node scripts/llm-analyze.js --faq --force           # Clean + regenerate FAQ
 *   node scripts/llm-analyze.js --glossary              # Regenerate glossary only
 *   node scripts/llm-analyze.js --glossary --force      # Clean + regenerate glossary
 */

import { readFileSync, readdirSync, existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const CATEGORIES = ['gemeindeordnungen', 'stadtrechte'];

/**
 * Map of all 23 law keys to proper Austrian legal citation abbreviations.
 * Used in prompts for reference format and in validation.
 */
export const BL_CITATION = {
  // Gemeindeordnungen
  burgenland: 'Bgld. GO',
  kaernten: 'Ktn. AGO',
  niederoesterreich: 'N\u00d6. GO',
  oberoesterreich: 'O\u00d6. GO',
  salzburg: 'Sbg. GO',
  steiermark: 'Stmk. GO',
  tirol: 'Tir. GO',
  vorarlberg: 'Vbg. GG',
  wien: 'Wr. StV',
  // Stadtrechte
  eisenstadt: 'Eisenst\u00e4dter StR',
  rust: 'Ruster StR',
  klagenfurt: 'Klagenfurter StR',
  villach: 'Villacher StR',
  krems: 'Kremser StR',
  st_poelten: 'St. P\u00f6ltner StR',
  waidhofen: 'Waidhofner StR',
  wr_neustadt: 'Wr. Neust\u00e4dter StR',
  linz: 'Linzer StR',
  steyr: 'Steyrer StR',
  wels: 'Welser StR',
  salzburg_stadt: 'Sbg. StR',
  graz: 'Grazer StR',
  innsbruck: 'Innsbrucker StR',
};

/**
 * Flatten all paragraphs from a parsed law structure.
 * Handles nested hauptstueck/abschnitte.
 */
function flattenParagraphs(struktur) {
  const paragraphs = [];

  function extractFromSection(section) {
    if (section.paragraphen) {
      for (const p of section.paragraphen) {
        paragraphs.push(p);
      }
    }
    if (section.abschnitte) {
      for (const abs of section.abschnitte) {
        extractFromSection(abs);
      }
    }
    // Handle nested hauptstuecke
    if (section.hauptstuecke) {
      for (const hs of section.hauptstuecke) {
        extractFromSection(hs);
      }
    }
  }

  for (const section of struktur) {
    extractFromSection(section);
  }

  return paragraphs;
}

/**
 * Count total paragraphs in a parsed law structure.
 */
function countParagraphs(struktur) {
  return flattenParagraphs(struktur).length;
}


/**
 * Call Claude CLI with a prompt and return parsed JSON.
 * Falls back to null if CLI unavailable or call fails.
 */
/**
 * Repair JSON with unescaped double quotes inside string values.
 * Claude often outputs text like: "summary": "den Titel "Marktgemeinde" erhalten"
 * where the inner quotes break JSON parsing.
 */
function repairJSON(text) {
  // Try parsing as-is first
  try { return JSON.parse(text); } catch { /* needs repair */ }

  let result = '';
  let i = 0;
  let inString = false;
  let escaped = false;

  while (i < text.length) {
    const ch = text[i];

    if (escaped) {
      result += ch;
      escaped = false;
      i++;
      continue;
    }

    if (ch === '\\') {
      result += ch;
      escaped = true;
      i++;
      continue;
    }

    if (ch === '"') {
      if (!inString) {
        inString = true;
        result += ch;
      } else {
        // Is this the end of the string, or an unescaped quote inside it?
        // Look ahead past whitespace: if next meaningful char is : , } ] it's structural
        let j = i + 1;
        while (j < text.length && ' \n\r\t'.includes(text[j])) j++;
        const next = text[j];
        if (next === ':' || next === ',' || next === '}' || next === ']' || j >= text.length) {
          inString = false;
          result += ch;
        } else {
          // Unescaped quote inside string value — escape it
          result += '\\"';
        }
      }
    } else {
      result += ch;
    }
    i++;
  }

  return JSON.parse(result);
}

/**
 * Call Claude CLI with a prompt and return parsed JSON.
 * No timeout — let Claude take as long as it needs.
 * Repairs common JSON issues (unescaped quotes in string values).
 *
 * @param {string} prompt - The prompt to send
 * @param {object} options - { maxRetries }
 * @returns {object|null} Parsed JSON or null on failure
 */
function callClaude(prompt, options = {}) {
  const maxRetries = options.maxRetries || 1;
  const promptKB = Math.round(Buffer.byteLength(prompt, 'utf-8') / 1024);

  console.log(`    [claude] Prompt: ${promptKB}KB, no timeout`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    if (attempt > 1) {
      console.log(`    [claude] Retry ${attempt}/${maxRetries}...`);
    }

    try {
      const startTime = Date.now();
      // Clear CLAUDECODE env var so child process doesn't think it's nested
      const env = { ...process.env };
      delete env.CLAUDECODE;

      const child = spawnSync('claude', ['-p', '--output-format', 'json', '--tools', '', '--append-system-prompt', 'You have no tools. Respond ONLY with the requested JSON. Do not output tool_call tags or any other markup.'], {
        input: prompt,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
      });

      const elapsed = Math.round((Date.now() - startTime) / 1000);

      if (child.signal) {
        console.error(`    [claude] Killed by signal ${child.signal} after ${elapsed}s`);
        continue;
      }

      if (child.status !== 0) {
        console.error(`    [claude] Exited with status ${child.status} after ${elapsed}s`);
        if (child.stderr) console.error(`    [claude] stderr: ${child.stderr.substring(0, 500)}`);
        continue;
      }

      console.log(`    [claude] Response received in ${elapsed}s (${Math.round((child.stdout?.length || 0) / 1024)}KB)`);

      const result = child.stdout;

      // Write raw stdout for debugging
      const rawDebugPath = join(ROOT, 'data', 'llm', '_debug_raw_stdout.txt');
      writeFileSync(rawDebugPath, result || '', 'utf-8');
      console.log(`    [claude] Raw stdout written to: ${rawDebugPath}`);

      if (!result || result.trim().length === 0) {
        console.error('    [claude] Empty response');
        continue;
      }

      // The claude CLI with --output-format json wraps response in {"result":"..."}
      const parsed = JSON.parse(result);
      const content = parsed.result || parsed;

      if (typeof content === 'string') {
        // Strip any tool_call XML blocks Claude may have emitted despite --tools ""
        let cleaned = content.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').trim();
        if (cleaned.length === 0) cleaned = content; // fallback if stripping removed everything

        // Find JSON in the response (may have markdown code fences)
        const jsonMatch = cleaned.match(/```json\s*([\s\S]*?)\s*```/) || cleaned.match(/(\{[\s\S]*\})/);
        if (jsonMatch) {
          const extracted = jsonMatch[1];
          try {
            return repairJSON(extracted);
          } catch (innerErr) {
            const pos = parseInt(innerErr.message.match(/position (\d+)/)?.[1] || '0');
            console.error(`    [claude] JSON parse failed (even after repair): ${innerErr.message.substring(0, 200)}`);
            if (pos > 0) {
              console.error(`    [claude] Around position ${pos}: ...${extracted.substring(Math.max(0, pos - 60), pos + 60)}...`);
            }
            // Write debug files
            const debugPath = join(ROOT, 'data', 'llm', '_debug_claude_response.json');
            writeFileSync(debugPath, extracted, 'utf-8');
            console.error(`    [claude] Raw extracted JSON written to: ${debugPath}`);
            continue;
          }
        }
        try {
          return repairJSON(cleaned);
        } catch (innerErr) {
          console.error(`    [claude] Content JSON parse failed (even after repair): ${innerErr.message.substring(0, 200)}`);
          const debugPath = join(ROOT, 'data', 'llm', '_debug_claude_response.json');
          writeFileSync(debugPath, cleaned, 'utf-8');
          console.error(`    [claude] Raw content written to: ${debugPath}`);
          continue;
        }
      }
      return content;
    } catch (err) {
      console.error(`    [claude] Error: ${err.message?.substring(0, 300)}`);
      if (attempt < maxRetries) continue;
    }
  }

  console.error(`    [claude] All ${maxRetries} attempts failed`);
  return null;
}


/**
 * Collect all unique topic labels from generated summaries.
 */
function collectTopicTaxonomy(rootDir = ROOT) {
  const topics = new Set();

  for (const category of CATEGORIES) {
    const summaryDir = join(rootDir, 'data', 'llm', 'summaries', category);
    if (!existsSync(summaryDir)) continue;

    const files = readdirSync(summaryDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const data = JSON.parse(readFileSync(join(summaryDir, file), 'utf-8'));
      if (data.paragraphs) {
        for (const [, para] of Object.entries(data.paragraphs)) {
          if (para.topics) {
            for (const topic of para.topics) {
              topics.add(topic);
            }
          }
        }
      }
    }
  }

  return [...topics].sort();
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

/**
 * Generate summary + topics for a single law.
 *
 * @param {string} lawKey - e.g. "burgenland"
 * @param {string} category - e.g. "gemeindeordnungen"
 * @param {string} rootDir - Project root
 * @returns {object} The generated summary JSON
 */
export async function generateForLaw(lawKey, category, rootDir = ROOT) {
  const parsedPath = join(rootDir, 'data', 'parsed', category, `${lawKey}.json`);
  const outputDir = join(rootDir, 'data', 'llm', 'summaries', category);
  const outputPath = join(outputDir, `${lawKey}.json`);

  // Incremental skip
  if (existsSync(outputPath)) {
    console.log(`  Skipping ${category}/${lawKey} (already exists)`);
    return JSON.parse(readFileSync(outputPath, 'utf-8'));
  }

  if (!existsSync(parsedPath)) {
    throw new Error(`Parsed law not found: ${parsedPath}`);
  }

  const law = JSON.parse(readFileSync(parsedPath, 'utf-8'));
  const paragraphs = flattenParagraphs(law.struktur);

  const paraTextSize = paragraphs.reduce((sum, p) => sum + (p.text?.length || 0), 0);
  console.log(`  Processing ${category}/${lawKey}: ${law.meta.kurztitel} (${paragraphs.length} paragraphs, ~${Math.round(paraTextSize / 1024)}KB text)...`);

  // Build prompt with all paragraphs
  const paraTexts = paragraphs.map(p =>
    `--- Paragraph ${p.nummer}${p.titel ? ': ' + p.titel : ''} ---\n${p.text || p.absaetze?.map(a => a.text).join('\n') || ''}`
  ).join('\n\n');

  const citation = BL_CITATION[lawKey] || lawKey;

  const prompt = `Du bist ein Experte fuer oesterreichisches Gemeinderecht. Analysiere die folgenden Paragraphen aus "${law.meta.kurztitel}" (${law.meta.bundesland}).

Fuer JEDEN Paragraph erstelle:
1. "summary": Eine sachlich-verstaendliche Zusammenfassung in 1-3 Saetzen.
   WICHTIG: Verwende KEINE sich wiederholenden Formulierungen.
   Variiere die Satzanfaenge. Schreibe natuerlich und verstaendlich fuer Laien.
   Verwende NIEMALS "Dieser Paragraph regelt..." als Einstieg.
   Verwende IMMER korrekte deutsche Umlaute (ae, oe, ue, ss).
   WICHTIG: Verwende KEINE Anführungszeichen (") im Text. Verwende stattdessen einfache Anführungszeichen (') oder Guillemets.

2. "topics": 1-3 thematische Labels. Verwende spezifische, praezise Labels
   (NICHT nur "Allgemeine Bestimmungen"). Beispiele guter Labels:
   "Gemeinderatssitzungen", "Buergermeisterwahl", "Beschlussfaehigkeit",
   "Befangenheit", "Rechnungspruefung", "Ortsvorsteher", etc.

Referenz-Format fuer Labels: "Par. {nummer} ${citation}"

Antworte NUR mit validem JSON in diesem Format (ohne Markdown-Formatierung, kein \`\`\`json):
{
  "paragraphs": {
    "1": { "summary": "...", "topics": ["Topic1", "Topic2"] },
    "2": { "summary": "...", "topics": ["Topic1"] }
  }
}

Hier sind die Paragraphen:

${paraTexts}`;

  const claudeResult = callClaude(prompt);
  let result;
  if (claudeResult && claudeResult.paragraphs) {
    result = {
      meta: {
        generatedAt: new Date().toISOString(),
        lawKey,
        category,
      },
      paragraphs: claudeResult.paragraphs,
    };
  }

  if (!result) {
    throw new Error(`FAILED: Claude did not return valid content for ${category}/${lawKey}. Check debug files in data/llm/`);
  }

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  Written: ${outputPath}`);

  return result;
}

/**
 * Generate FAQ topics from all law summaries.
 *
 * @param {string} rootDir - Project root
 * @param {object} options - { force: boolean }
 * @returns {object} The generated FAQ JSON
 */
export async function generateFAQ(rootDir = ROOT, options = {}) {
  const outputDir = join(rootDir, 'data', 'llm', 'faq');
  const outputPath = join(outputDir, 'topics.json');

  // Clean existing file if --force
  if (options.force && existsSync(outputPath)) {
    unlinkSync(outputPath);
    console.log('  Cleaned existing FAQ file');
  }

  console.log('Generating FAQ topics...');

  // Collect topic taxonomy from generated summaries
  const allTopics = collectTopicTaxonomy(rootDir);
  console.log(`  Found ${allTopics.length} unique topics across all laws`);

  // Collect ALL content for each topic (no truncation)
  const topicParagraphs = {};
  for (const category of CATEGORIES) {
    const summaryDir = join(rootDir, 'data', 'llm', 'summaries', category);
    if (!existsSync(summaryDir)) continue;

    const files = readdirSync(summaryDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const lawKey = file.replace('.json', '');
      const data = JSON.parse(readFileSync(join(summaryDir, file), 'utf-8'));
      if (!data.paragraphs) continue;

      for (const [paraNum, para] of Object.entries(data.paragraphs)) {
        if (!para.topics) continue;
        for (const topic of para.topics) {
          if (!topicParagraphs[topic]) topicParagraphs[topic] = [];
          topicParagraphs[topic].push({
            category,
            key: lawKey,
            paragraph: paraNum,
            summary: para.summary,
          });
        }
      }
    }
  }

  // Keep top 100 most frequent topics to stay within prompt size limits (~200KB)
  const sortedTopics = Object.entries(topicParagraphs)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 100);

  console.log(`  Using top ${sortedTopics.length} topics (by frequency) for FAQ prompt`);

  const topicSummary = sortedTopics
      .map(([topic, refs]) => {
        // Show up to 6 refs per topic with short summaries to keep prompt manageable
        const refDetails = refs.slice(0, 6).map(r => {
          const citation = BL_CITATION[r.key] || r.key;
          return `  - Par. ${r.paragraph} ${citation}: ${r.summary?.substring(0, 80)}`;
        }).join('\n');
        return `Topic: ${topic} (${refs.length} Paragraphen)\n${refDetails}`;
      })
      .join('\n\n');

    // Build citation format reference for the prompt
    const citationRef = Object.entries(BL_CITATION)
      .map(([key, abbr]) => `  ${key} = "${abbr}"`)
      .join('\n');

    const prompt = `Du bist ein Experte f\u00fcr \u00f6sterreichisches Gemeinderecht. Analysiere die folgende Thementaxonomie aus 23 Gemeindeordnungen und Stadtrechten und identifiziere die wichtigsten FAQ-Themen.

Bestimme 10-20 FAQ-Themen basierend auf der H\u00e4ufigkeit und Relevanz der Themen. Erstelle f\u00fcr jedes Thema:
- "slug": URL-freundlicher Bezeichner (ASCII, lowercase, Bindestriche)
- "title": Kurzer Titel
- "description": 1-2 S\u00e4tze Beschreibung
- "questions": So viele Fragen wie sinnvoll, jede mit:
  - "question": Eine konkrete, praxisnahe Frage
  - "answer": Beschreibe das ALLGEMEINE Prinzip, das in den meisten österreichischen Gemeindeordnungen gilt. Nenne KEINE einzelnen Bundesländer namentlich. Schreibe NICHT 'Im Burgenland...', 'In Kärnten...' oder ähnliche BL-spezifische Aussagen. Formuliere stattdessen: 'In den meisten Gemeindeordnungen...', 'Die Regelungen sehen typischerweise vor...', 'Je nach Bundesland variieren die Details...' etc.
  - "references": Array von Verweisen { "category", "key", "paragraph", "label" }

WICHTIG:
- Verwende IMMER korrekte deutsche Umlaute (\u00e4, \u00f6, \u00fc, \u00df).
- Referenzen m\u00fcssen das korrekte Zitierformat verwenden:
${citationRef}
- Format: "Par. {nummer} {Abk\u00fcrzung}", z.B. "Par. 42 Bgld. GO"
- Verwende echte Paragraphen-Referenzen aus den folgenden Daten.
- Verwende KEINE Anführungszeichen (") im Antworttext. Verwende stattdessen einfache Anführungszeichen (') oder Guillemets.
- Die Antworten dürfen KEINE Bundesländer namentlich nennen oder BL-spezifische Behauptungen aufstellen. Stattdessen allgemeine Aussagen treffen und auf die einzelnen Gesetze verweisen.
- Verwende IMMER geschlechtergerechte Sprache mit Doppelpunkt-Gendern: Bürgermeister:in, Bürgermeister:innen, Vizebürgermeister:in, Gemeinderät:innen, Stadträt:innen, Gemeindebürger:innen, Ehrenbürger:innen etc. Verwende NICHT die rein männliche Form.
- "references": MUSS Verweise auf ALLE 9 Gemeindeordnungen enthalten, die das jeweilige Thema regeln (nicht nur 2-3). Verwende die relevantesten Paragraphen aus jeder Gemeindeordnung.

Antworte NUR mit validem JSON (ohne Markdown-Formatierung):
{
  "topics": [
    {
      "slug": "...",
      "title": "...",
      "description": "...",
      "questions": [
        {
          "question": "...",
          "answer": "...",
          "references": [{ "category": "gemeindeordnungen", "key": "burgenland", "paragraph": "42", "label": "Par. 42 Bgld. GO" }]
        }
      ]
    }
  ]
}

Thementaxonomie und vollst\u00e4ndige Paragraphen-Daten:

${topicSummary}`;

  const claudeResult = callClaude(prompt);
  let result;
  if (claudeResult && claudeResult.topics) {
    result = {
      meta: {
        generatedAt: new Date().toISOString(),
        topicCount: claudeResult.topics.length,
      },
      topics: claudeResult.topics,
    };
  }

  if (!result) {
    throw new Error('FAILED: Claude did not return valid FAQ content. Check debug files in data/llm/');
  }

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  Written: ${outputPath} (${result.topics.length} topics)`);

  return result;
}

/**
 * Generate glossary of legal terms.
 *
 * @param {string} rootDir - Project root
 * @param {object} options - { force: boolean }
 * @returns {object} The generated glossary JSON
 */
export async function generateGlossary(rootDir = ROOT, options = {}) {
  const outputDir = join(rootDir, 'data', 'llm', 'glossary');
  const outputPath = join(outputDir, 'terms.json');

  // Clean existing file if --force
  if (options.force && existsSync(outputPath)) {
    unlinkSync(outputPath);
    console.log('  Cleaned existing glossary file');
  }

  console.log('Generating glossary...');

  // Collect law text from ALL parsed files (no truncation)
  const lawTexts = [];
  for (const category of CATEGORIES) {
    const parsedDir = join(rootDir, 'data', 'parsed', category);
    if (!existsSync(parsedDir)) continue;

    const files = readdirSync(parsedDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const law = JSON.parse(readFileSync(join(parsedDir, file), 'utf-8'));
      const paragraphs = flattenParagraphs(law.struktur).slice(0, 15);
      lawTexts.push({
        lawKey: file.replace('.json', ''),
        category,
        name: law.meta.kurztitel,
        texts: paragraphs.map(p => `Par. ${p.nummer}: ${p.text?.substring(0, 200) || ''}`),
      });
    }
  }

  // Collect references from summaries
  const summaryRefs = {};
  for (const category of CATEGORIES) {
    const summaryDir = join(rootDir, 'data', 'llm', 'summaries', category);
    if (!existsSync(summaryDir)) continue;

    const files = readdirSync(summaryDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const lawKey = file.replace('.json', '');
      const data = JSON.parse(readFileSync(join(summaryDir, file), 'utf-8'));
      if (!data.paragraphs) continue;
      summaryRefs[`${category}/${lawKey}`] = Object.keys(data.paragraphs);
    }
  }

  const lawContent = lawTexts.map(s => {
      const citation = BL_CITATION[s.lawKey] || s.lawKey;
      return `${s.name} (${citation}, ${s.category}/${s.lawKey}):\n${s.texts.join('\n')}`;
    }).join('\n\n---\n\n');

    // Build citation format reference
    const citationRef = Object.entries(BL_CITATION)
      .map(([key, abbr]) => `  ${key} = "${abbr}"`)
      .join('\n');

    const prompt = `Du bist ein Experte f\u00fcr \u00f6sterreichisches Gemeinderecht. Erstelle ein Glossar von Fachbegriffen (juristische Termini), die ein Laie nicht kennen w\u00fcrde.

Erstelle eine Liste von 15-30 echten Fachbegriffen aus dem Gemeinderecht. Beispiele: Befangenheit, Kollegialorgan, Dringlichkeitsantrag, Gesch\u00e4ftsordnung, Beschlussf\u00e4higkeit, Zweidrittelmehrheit, Verordnung, Kundmachung, etc.

F\u00fcr jeden Begriff:
- "term": Der Fachbegriff (mit korrekten Umlauten)
- "slug": URL-freundlich (ASCII, lowercase, Bindestriche, ae/oe/ue f\u00fcr Umlaute)
- "definition": Verst\u00e4ndliche Definition in 1-3 S\u00e4tzen. Verwende IMMER korrekte deutsche Umlaute (\u00e4, \u00f6, \u00fc, \u00df).
- "references": 3-6 Verweise auf Paragraphen aus VERSCHIEDENEN Bundesl\u00e4ndern und Stadtrechten: { "category", "key", "paragraph", "label" }

WICHTIG:
- Referenzen m\u00fcssen mehrere Bundesl\u00e4nder abdecken (mindestens 3 verschiedene).
- Verwende das korrekte Zitierformat:
${citationRef}
- Format: "Par. {nummer} {Abk\u00fcrzung}", z.B. "Par. 35 Bgld. GO"
- Verwende KEINE Anf\u00fchrungszeichen (") im Antworttext. Verwende stattdessen einfache Anf\u00fchrungszeichen (') oder Guillemets.

Antworte NUR mit validem JSON (ohne Markdown-Formatierung):
{
  "terms": [
    {
      "term": "Befangenheit",
      "slug": "befangenheit",
      "definition": "...",
      "references": [{ "category": "gemeindeordnungen", "key": "burgenland", "paragraph": "35", "label": "Par. 35 Bgld. GO" }]
    }
  ]
}

Hier sind Texte aus ALLEN 23 Gesetzen:

${lawContent}`;

  const claudeResult = callClaude(prompt);
  let result;
  if (claudeResult && claudeResult.terms) {
    result = {
      meta: {
        generatedAt: new Date().toISOString(),
        termCount: claudeResult.terms.length,
      },
      terms: claudeResult.terms,
    };
  }

  if (!result) {
    throw new Error('FAILED: Claude did not return valid glossary content. Check debug files in data/llm/');
  }

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  Written: ${outputPath} (${result.terms.length} terms)`);

  return result;
}

/**
 * Generate all LLM content: summaries, FAQ, and glossary.
 *
 * @param {object} options - { rootDir, lawFilter, force }
 * @returns {object} Summary of what was generated
 */
export async function generateAll(options = {}) {
  const rootDir = options.rootDir || ROOT;
  const lawFilter = options.lawFilter || null;
  const force = options.force || false;

  console.log('LLM Content Generation Pipeline');
  console.log('================================\n');

  // Step 0: Clean existing output if --force
  if (force) {
    console.log('Step 0: Cleaning existing LLM output (--force)...\n');
    let cleaned = 0;
    for (const category of CATEGORIES) {
      const summaryDir = join(rootDir, 'data', 'llm', 'summaries', category);
      if (!existsSync(summaryDir)) continue;
      for (const file of readdirSync(summaryDir).filter(f => f.endsWith('.json'))) {
        if (lawFilter && file !== `${lawFilter}.json`) continue;
        unlinkSync(join(summaryDir, file));
        cleaned++;
      }
    }
    if (!lawFilter) {
      const faqPath = join(rootDir, 'data', 'llm', 'faq', 'topics.json');
      if (existsSync(faqPath)) { unlinkSync(faqPath); cleaned++; }
      const glossaryPath = join(rootDir, 'data', 'llm', 'glossary', 'terms.json');
      if (existsSync(glossaryPath)) { unlinkSync(glossaryPath); cleaned++; }
    }
    console.log(`  Cleaned ${cleaned} files\n`);
  }

  // Step 1: Generate per-law summaries
  console.log('Step 1: Generating per-law summaries...\n');
  let generatedCount = 0;
  let skippedCount = 0;

  for (const category of CATEGORIES) {
    const parsedDir = join(rootDir, 'data', 'parsed', category);
    if (!existsSync(parsedDir)) continue;

    const files = readdirSync(parsedDir).filter(f => f.endsWith('.json'));

    for (const file of files) {
      const key = file.replace('.json', '');

      // Apply law filter if specified
      if (lawFilter && key !== lawFilter) continue;

      const outputPath = join(rootDir, 'data', 'llm', 'summaries', category, `${key}.json`);
      if (existsSync(outputPath)) {
        skippedCount++;
        continue;
      }

      await generateForLaw(key, category, rootDir);
      generatedCount++;
    }
  }

  console.log(`\nSummaries: ${generatedCount} generated, ${skippedCount} skipped\n`);

  // Step 2: Collect topic taxonomy
  console.log('Step 2: Collecting topic taxonomy...');
  const topics = collectTopicTaxonomy(rootDir);
  console.log(`  ${topics.length} unique topics found\n`);

  // Step 3: Generate FAQ (unless only processing single law)
  if (!lawFilter) {
    console.log('Step 3: Generating FAQ...\n');
    await generateFAQ(rootDir);
  }

  // Step 4: Generate glossary (unless only processing single law)
  if (!lawFilter) {
    console.log('\nStep 4: Generating glossary...\n');
    await generateGlossary(rootDir);
  }

  console.log('\nPipeline complete!');
  return { generatedCount, skippedCount, topicCount: topics.length };
}

// CLI entry point
if (process.argv[1] && process.argv[1].endsWith('llm-analyze.js')) {
  const isDryRun = process.argv.includes('--dry-run');
  const isGenerate = process.argv.includes('--generate');
  const isFAQ = process.argv.includes('--faq');
  const isGlossary = process.argv.includes('--glossary');
  const force = process.argv.includes('--force');
  const lawIdx = process.argv.indexOf('--law');
  const lawFilter = lawIdx !== -1 ? process.argv[lawIdx + 1] : null;

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
  } else if (isGenerate) {
    generateAll({ lawFilter, force }).catch(err => {
      console.error('Generation failed:', err.message);
      process.exit(1);
    });
  } else if (isFAQ) {
    generateFAQ(ROOT, { force }).catch(err => {
      console.error('FAQ generation failed:', err.message);
      process.exit(1);
    });
  } else if (isGlossary) {
    generateGlossary(ROOT, { force }).catch(err => {
      console.error('Glossary generation failed:', err.message);
      process.exit(1);
    });
  } else {
    console.log('Usage:');
    console.log('  node scripts/llm-analyze.js --dry-run              # Preview');
    console.log('  node scripts/llm-analyze.js --generate              # Full pipeline (incremental)');
    console.log('  node scripts/llm-analyze.js --generate --force      # Clean + regenerate everything');
    console.log('  node scripts/llm-analyze.js --generate --law krems  # Single law only');
    console.log('  node scripts/llm-analyze.js --generate --force --law krems  # Force single law');
    console.log('  node scripts/llm-analyze.js --faq                   # FAQ only');
    console.log('  node scripts/llm-analyze.js --faq --force           # Clean + regenerate FAQ');
    console.log('  node scripts/llm-analyze.js --glossary              # Glossary only');
    console.log('  node scripts/llm-analyze.js --glossary --force      # Clean + regenerate glossary');
  }
}
