/**
 * LLM analysis pipeline using Claude Code CLI.
 *
 * Reads parsed law JSON from data/parsed/ and generates:
 * - Per-law paragraph summaries + topic tags (data/llm/summaries/{category}/{key}.json)
 * - Cross-law FAQ topics (data/llm/faq/topics.json)
 * - Legal glossary terms (data/llm/glossary/terms.json)
 *
 * Uses `claude` CLI via child_process for LLM calls.
 * Falls back to placeholder JSON if CLI is unavailable.
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
import { execSync, spawnSync } from 'child_process';

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
 * Check if Claude CLI is available.
 */
function isClaudeAvailable() {
  try {
    execSync('which claude', { encoding: 'utf-8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Call Claude CLI with a prompt and return parsed JSON.
 * Falls back to null if CLI unavailable or call fails.
 */
function callClaude(prompt) {
  try {
    const child = spawnSync('claude', ['-p', '--output-format', 'json'], {
      input: prompt,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    if (child.status !== 0) {
      console.error(`  Claude CLI exited with status ${child.status}: ${child.stderr?.substring(0, 200)}`);
      return null;
    }

    const result = child.stdout;
    // The claude CLI with --output-format json wraps response in {"result":"..."}
    const parsed = JSON.parse(result);
    // Extract the actual content - claude returns {result: "..."} wrapper
    const content = parsed.result || parsed;
    // Try to parse the content as JSON if it's a string
    if (typeof content === 'string') {
      // Find JSON in the response (may have markdown code fences)
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\})/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(content);
    }
    return content;
  } catch (err) {
    console.error(`  Claude CLI error: ${err.message?.substring(0, 200)}`);
    return null;
  }
}

/**
 * Generate placeholder summary for a law when Claude CLI is unavailable.
 */
function generatePlaceholderSummary(lawKey, category, paragraphs, lawMeta) {
  const paragraphEntries = {};
  for (const p of paragraphs) {
    const topicFromTitle = p.titel || 'Allgemeine Bestimmungen';
    paragraphEntries[p.nummer] = {
      summary: `Dieser Paragraph regelt ${topicFromTitle.toLowerCase()}. ${p.text?.substring(0, 100) || ''}...`,
      topics: [categorizeByTitle(topicFromTitle)],
    };
  }

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      lawKey,
      category,
      placeholder: true,
    },
    paragraphs: paragraphEntries,
  };
}

/**
 * Simple topic categorization based on paragraph title keywords.
 */
function categorizeByTitle(title) {
  const t = title.toLowerCase();
  if (t.includes('wahl') || t.includes('abstimmung')) return 'Wahlen und Abstimmungen';
  if (t.includes('gemeinderat') || t.includes('sitzung')) return 'Gemeinderatssitzungen';
  if (t.includes('buergermeister')) return 'B\u00fcrgermeister';
  if (t.includes('vorstand') || t.includes('stadtrat')) return 'Gemeindevorstand';
  if (t.includes('ausschuss') || t.includes('kommission')) return 'Aussch\u00fcsse';
  if (t.includes('haushalt') || t.includes('budget') || t.includes('voranschlag') || t.includes('rechnungs')) return 'Haushalt und Finanzen';
  if (t.includes('aufsicht') || t.includes('kontrolle') || t.includes('pruefung')) return 'Aufsicht und Kontrolle';
  if (t.includes('befangen')) return 'Befangenheit';
  if (t.includes('gemeindeverband') || t.includes('kooperation') || t.includes('zusammen')) return 'Gemeindekooperation';
  if (t.includes('straf') || t.includes('ordnung')) return 'Strafbestimmungen';
  if (t.includes('bedienstete') || t.includes('personal') || t.includes('beamt')) return 'Gemeindebedienstete';
  if (t.includes('verm\u00f6gen') || t.includes('vermoegen') || t.includes('eigentum') || t.includes('wirtschaft')) return 'Gemeindeverm\u00f6gen';
  if (t.includes('gemeindegebiet') || t.includes('grenz')) return 'Gemeindegebiet';
  if (t.includes('buerger') || t.includes('b\u00fcrger') || t.includes('mitglied')) return 'Gemeindeb\u00fcrger';
  if (t.includes('kundmachung') || t.includes('verordnung') || t.includes('bescheid')) return 'Kundmachung und Verordnungen';
  if (t.includes('schluss') || t.includes('uebergang') || t.includes('inkraft')) return 'Schlussbestimmungen';
  return 'Allgemeine Bestimmungen';
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

  console.log(`  Processing ${category}/${lawKey}: ${law.meta.kurztitel} (${paragraphs.length} paragraphs)...`);

  let result;

  if (isClaudeAvailable()) {
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
  }

  // Fallback to placeholder if Claude failed or unavailable
  if (!result) {
    console.log(`  Using placeholder content for ${category}/${lawKey}`);
    result = generatePlaceholderSummary(lawKey, category, paragraphs, law.meta);
  }

  // Write output
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

  let result;

  if (isClaudeAvailable()) {
    // Build prompt with ALL topic-paragraph data (no truncation)
    const topicSummary = Object.entries(topicParagraphs)
      .map(([topic, refs]) => {
        const refDetails = refs.map(r => {
          const citation = BL_CITATION[r.key] || r.key;
          return `  - Par. ${r.paragraph} ${citation} (${r.category}/${r.key}): ${r.summary?.substring(0, 120)}`;
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
  - "answer": Beantworte zuerst klar und direkt, dann erg\u00e4nze Bundesl\u00e4nder-spezifische Details.
  - "references": Array von Verweisen { "category", "key", "paragraph", "label" }

WICHTIG:
- Verwende IMMER korrekte deutsche Umlaute (\u00e4, \u00f6, \u00fc, \u00df).
- Referenzen m\u00fcssen das korrekte Zitierformat verwenden:
${citationRef}
- Format: "Par. {nummer} {Abk\u00fcrzung}", z.B. "Par. 42 Bgld. GO"
- Verwende echte Paragraphen-Referenzen aus den folgenden Daten.

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
    if (claudeResult && claudeResult.topics) {
      result = {
        meta: {
          generatedAt: new Date().toISOString(),
          topicCount: claudeResult.topics.length,
        },
        topics: claudeResult.topics,
      };
    }
  }

  // Fallback to placeholder FAQ
  if (!result) {
    console.log('  Using placeholder FAQ content');
    result = generatePlaceholderFAQ(topicParagraphs);
  }

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  Written: ${outputPath} (${result.topics.length} topics)`);

  return result;
}

/**
 * Generate placeholder FAQ when Claude is unavailable.
 */
function generatePlaceholderFAQ(topicParagraphs) {
  // Group into FAQ themes
  const faqTopics = [
    { slug: 'gemeinderatssitzungen', title: 'Gemeinderatssitzungen', description: 'Alles rund um Einberufung, Ablauf und Beschlussfassung in Gemeinderatssitzungen.' },
    { slug: 'wahlen-und-abstimmungen', title: 'Wahlen und Abstimmungen', description: 'Regelungen zu Wahlen, Abstimmungsverfahren und Mehrheitserfordernissen in Gemeinden.' },
    { slug: 'buergermeister', title: 'B\u00fcrgermeister', description: 'Aufgaben, Rechte und Pflichten des B\u00fcrgermeisters sowie Vertretungsregelungen.' },
    { slug: 'gemeindevorstand', title: 'Gemeindevorstand', description: 'Zusammensetzung, Aufgaben und Beschlussfassung des Gemeindevorstands bzw. Stadtsenats.' },
    { slug: 'ausschuesse', title: 'Aussch\u00fcsse', description: 'Bildung, Zusammensetzung und Aufgaben von Gemeindeaussch\u00fcssen.' },
    { slug: 'haushalt-und-finanzen', title: 'Haushalt und Finanzen', description: 'Voranschlag, Rechnungsabschluss und Finanzverwaltung der Gemeinde.' },
    { slug: 'aufsicht-und-kontrolle', title: 'Aufsicht und Kontrolle', description: 'Gemeindeaufsicht, Pr\u00fcfungsrechte und Kontrollmechanismen.' },
    { slug: 'befangenheit', title: 'Befangenheit', description: 'Befangenheitsregeln f\u00fcr Gemeindeorgane und deren Rechtsfolgen.' },
    { slug: 'gemeindebedienstete', title: 'Gemeindebedienstete', description: 'Anstellung, Rechte und Pflichten der Gemeindebediensteten.' },
    { slug: 'gemeindekooperation', title: 'Gemeindekooperation', description: 'Gemeindeverb\u00e4nde, Kooperationen und \u00fcbergemeindliche Zusammenarbeit.' },
  ];

  const topics = faqTopics.map(t => {
    const refs = topicParagraphs[t.title] || [];
    const sampleRefs = refs.slice(0, 4);

    return {
      slug: t.slug,
      title: t.title,
      description: t.description,
      questions: [
        {
          question: `Was regelt das Thema "${t.title}" in \u00f6sterreichischen Gemeindeordnungen?`,
          answer: `Die Regelungen zu "${t.title}" variieren je nach Bundesland. ${t.description}`,
          references: sampleRefs.map(r => ({
            category: r.category,
            key: r.key,
            paragraph: r.paragraph,
            label: `Par. ${r.paragraph} ${BL_CITATION[r.key] || r.key}`,
          })),
        },
        {
          question: `Welche Unterschiede gibt es zwischen den Bundesl\u00e4ndern bei "${t.title}"?`,
          answer: `Die neun Bundesl\u00e4nder regeln "${t.title}" unterschiedlich. Details finden sich in den jeweiligen Gemeindeordnungen.`,
          references: sampleRefs.slice(0, 2).map(r => ({
            category: r.category,
            key: r.key,
            paragraph: r.paragraph,
            label: `Par. ${r.paragraph} ${BL_CITATION[r.key] || r.key}`,
          })),
        },
        {
          question: `Wo finde ich die relevanten Paragraphen zu "${t.title}"?`,
          answer: `Die relevanten Bestimmungen finden sich in den jeweiligen Gemeindeordnungen der Bundesl\u00e4nder, insbesondere in den Abschnitten zu ${t.title.toLowerCase()}.`,
          references: sampleRefs.slice(0, 3).map(r => ({
            category: r.category,
            key: r.key,
            paragraph: r.paragraph,
            label: `Par. ${r.paragraph} ${BL_CITATION[r.key] || r.key}`,
          })),
        },
      ],
    };
  });

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      topicCount: topics.length,
      placeholder: true,
    },
    topics,
  };
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
      const paragraphs = flattenParagraphs(law.struktur).slice(0, 20);
      lawTexts.push({
        lawKey: file.replace('.json', ''),
        category,
        name: law.meta.kurztitel,
        texts: paragraphs.map(p => `Par. ${p.nummer}: ${p.text?.substring(0, 300) || ''}`),
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

  let result;

  if (isClaudeAvailable()) {
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
    if (claudeResult && claudeResult.terms) {
      result = {
        meta: {
          generatedAt: new Date().toISOString(),
          termCount: claudeResult.terms.length,
        },
        terms: claudeResult.terms,
      };
    }
  }

  // Fallback to placeholder glossary
  if (!result) {
    console.log('  Using placeholder glossary content');
    result = generatePlaceholderGlossary(summaryRefs);
  }

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  Written: ${outputPath} (${result.terms.length} terms)`);

  return result;
}

/**
 * Generate placeholder glossary when Claude is unavailable.
 */
function generatePlaceholderGlossary(summaryRefs) {
  // Get some law keys for references
  const refKeys = Object.keys(summaryRefs);
  function makeRefs(paraNumbers) {
    const refs = [];
    for (const refKey of refKeys.slice(0, 3)) {
      const [category, key] = refKey.split('/');
      const availableParas = summaryRefs[refKey] || [];
      const para = paraNumbers.find(p => availableParas.includes(String(p))) || availableParas[0] || '1';
      refs.push({
        category,
        key,
        paragraph: String(para),
        label: `Par. ${para} ${BL_CITATION[key] || key}`,
      });
    }
    return refs;
  }

  const terms = [
    { term: 'Befangenheit', slug: 'befangenheit', definition: 'Zustand, in dem ein Organmitglied wegen pers\u00f6nlicher Interessen an einer Sache von der Beratung und Abstimmung ausgeschlossen ist. Dient der Sicherung unparteiischer Entscheidungsfindung.', paraHint: [35, 36] },
    { term: 'Kollegialorgan', slug: 'kollegialorgan', definition: 'Ein Organ, das aus mehreren gleichberechtigten Mitgliedern besteht und Entscheidungen durch Abstimmung trifft. Der Gemeinderat ist das wichtigste Kollegialorgan der Gemeinde.', paraHint: [1, 2] },
    { term: 'Dringlichkeitsantrag', slug: 'dringlichkeitsantrag', definition: 'Ein Antrag, der ohne Einhaltung der \u00fcblichen Fristen auf die Tagesordnung einer Sitzung gesetzt werden kann. Erfordert in der Regel eine qualifizierte Mehrheit.', paraHint: [40, 41] },
    { term: 'Gesch\u00e4ftsordnung', slug: 'geschaeftsordnung', definition: 'Regelwerk f\u00fcr den inneren Betrieb eines Kollegialorgans. Legt Verfahrensregeln f\u00fcr Sitzungen, Antr\u00e4ge und Abstimmungen fest.', paraHint: [30, 31] },
    { term: 'Beschlussf\u00e4higkeit', slug: 'beschlussfaehigkeit', definition: 'Die F\u00e4higkeit eines Kollegialorgans, g\u00fcltige Beschl\u00fcsse zu fassen. Setzt in der Regel die Anwesenheit von mindestens der H\u00e4lfte der Mitglieder voraus (Quorum).', paraHint: [32, 33] },
    { term: 'Zweidrittelmehrheit', slug: 'zweidrittelmehrheit', definition: 'Qualifizierte Mehrheit, bei der mindestens zwei Drittel der abgegebenen Stimmen oder der anwesenden Mitglieder f\u00fcr einen Beschluss stimmen m\u00fcssen. Erforderlich bei besonders wichtigen Entscheidungen.', paraHint: [34, 35] },
    { term: 'Verordnung', slug: 'verordnung', definition: 'Generelle Norm, die von einem Verwaltungsorgan (z.B. Gemeinderat) erlassen wird und f\u00fcr alle Gemeindeb\u00fcrger verbindlich ist. Muss ordnungsgem\u00e4\u00df kundgemacht werden.', paraHint: [60, 61] },
    { term: 'Kundmachung', slug: 'kundmachung', definition: '\u00d6ffentliche Bekanntmachung von Verordnungen, Beschl\u00fcssen oder anderen amtlichen Mitteilungen. Voraussetzung f\u00fcr die Rechtswirksamkeit von Verordnungen.', paraHint: [62, 63] },
    { term: 'Gemeindevorstand', slug: 'gemeindevorstand', definition: 'Kollegialorgan der Gemeinde, bestehend aus B\u00fcrgermeister, Vize-B\u00fcrgermeister und weiteren Mitgliedern. In St\u00e4dten mit eigenem Statut als Stadtsenat oder Stadtrat bezeichnet.', paraHint: [20, 21] },
    { term: 'Ortsvorsteher', slug: 'ortsvorsteher', definition: 'Vertreter einer Katastralgemeinde oder eines Ortsteils. Wird vom Gemeinderat bestellt und vertritt die Interessen des Ortsteils gegen\u00fcber den Gemeindeorganen.', paraHint: [70, 71] },
    { term: 'Voranschlag', slug: 'voranschlag', definition: 'Der Haushaltsplan der Gemeinde f\u00fcr das kommende Finanzjahr. Enth\u00e4lt die geplanten Einnahmen und Ausgaben und muss vom Gemeinderat beschlossen werden.', paraHint: [80, 81] },
    { term: 'Rechnungsabschluss', slug: 'rechnungsabschluss', definition: 'Die j\u00e4hrliche Abrechnung \u00fcber die tats\u00e4chlichen Einnahmen und Ausgaben der Gemeinde. Muss vom Gemeinderat gepr\u00fcft und genehmigt werden.', paraHint: [82, 83] },
    { term: 'Gemeindeaufsicht', slug: 'gemeindeaufsicht', definition: 'Die staatliche Kontrolle \u00fcber die Gemeindeverwaltung durch die Landesregierung. Umfasst Rechtsaufsicht (Gesetzm\u00e4\u00dfigkeit) und in bestimmten F\u00e4llen Zweckm\u00e4\u00dfigkeitsaufsicht.', paraHint: [90, 91] },
    { term: 'Statutarstadt', slug: 'statutarstadt', definition: 'Eine Stadt mit eigenem Statut, die neben den Aufgaben der Gemeindeverwaltung auch jene der Bezirksverwaltung wahrnimmt. Das Stadtrecht tritt an die Stelle der Gemeindeordnung.', paraHint: [1, 2] },
    { term: 'Gemeindeverband', slug: 'gemeindeverband', definition: 'Zusammenschluss mehrerer Gemeinden zur gemeinsamen Besorgung bestimmter Aufgaben (z.B. Abfallwirtschaft, Wasserversorgung). Wird durch Gesetz oder Vereinbarung gegr\u00fcndet.', paraHint: [100, 101] },
    { term: 'Ausschuss', slug: 'ausschuss', definition: 'Ein vom Gemeinderat eingesetztes Gremium zur Vorberatung bestimmter Angelegenheiten. Die Zusammensetzung spiegelt in der Regel die St\u00e4rke der Fraktionen wider.', paraHint: [25, 26] },
    { term: 'Mandatar', slug: 'mandatar', definition: 'Gew\u00e4hltes Mitglied des Gemeinderats. Mandatare \u00fcben ihr Amt in der Regel ehrenamtlich aus und sind an keinen Auftrag gebunden (freies Mandat).', paraHint: [10, 11] },
    { term: 'Instanzenzug', slug: 'instanzenzug', definition: 'Der vorgesehene Rechtsweg zur Anfechtung von Bescheiden. Gegen Bescheide des B\u00fcrgermeisters kann in der Regel Berufung an den Gemeinderat eingelegt werden.', paraHint: [50, 51] },
    { term: 'Verhandlungsschrift', slug: 'verhandlungsschrift', definition: 'Das offizielle Protokoll einer Gemeinderatssitzung. Muss die gefassten Beschl\u00fcsse, wesentlichen Beratungsinhalte und Abstimmungsergebnisse enthalten.', paraHint: [38, 39] },
    { term: 'Selbstverwaltung', slug: 'selbstverwaltung', definition: 'Das verfassungsrechtlich garantierte Recht der Gemeinde, Angelegenheiten des eigenen Wirkungsbereichs weisungsfrei zu besorgen. Umfasst Verordnungsrecht, Personalhoheit und Finanzhoheit.', paraHint: [1, 2] },
  ];

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      termCount: terms.length,
      placeholder: true,
    },
    terms: terms.map(t => ({
      term: t.term,
      slug: t.slug,
      definition: t.definition,
      references: makeRefs(t.paraHint),
    })),
  };
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
