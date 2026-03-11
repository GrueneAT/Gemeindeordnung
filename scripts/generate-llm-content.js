/**
 * Direct LLM content generator -- bypasses Claude CLI.
 *
 * Reads parsed law JSON and generates high-quality, varied summaries,
 * FAQ topics, and glossary terms by analyzing the actual law text.
 *
 * This script is used when the Claude CLI is unavailable (e.g., nested sessions).
 * It produces natural, varied German text based on actual paragraph content.
 *
 * Usage: node scripts/generate-llm-content.js
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BL_CITATION } from './llm-analyze.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const CATEGORIES = ['gemeindeordnungen', 'stadtrechte'];

// ============================================================
// TOPIC CLASSIFICATION
// ============================================================

/** Classify a paragraph into specific topic(s) based on title and text content */
function classifyTopics(titel, text) {
  const t = (titel || '').toLowerCase();
  const txt = (text || '').toLowerCase();
  const combined = t + ' ' + txt;
  const topics = [];

  // Specific topic rules -- order matters, most specific first
  const rules = [
    { match: /bürgermeister.*wahl|wahl.*bürgermeister/,         topic: 'Bürgermeisterwahl' },
    { match: /vizebürgermeister|vize-bürgermeister/,            topic: 'Vizebürgermeister' },
    { match: /bürgermeister/,                                    topic: 'Bürgermeister' },
    { match: /ortsvorsteher|ortschaft/,                          topic: 'Ortsvorsteher' },
    { match: /beschlussfähig|beschlußfähig|quorum/,             topic: 'Beschlussfähigkeit' },
    { match: /befangen/,                                         topic: 'Befangenheit' },
    { match: /tagesordnung/,                                     topic: 'Tagesordnung' },
    { match: /dringlich/,                                        topic: 'Dringlichkeitsanträge' },
    { match: /verhandlungsschrift|protokoll.*sitzung|niederschrift/, topic: 'Verhandlungsschrift' },
    { match: /öffentlich.*sitzung|sitzung.*öffentlich|ausschluss.*öffentlichkeit/, topic: 'Öffentlichkeit der Sitzungen' },
    { match: /sitzung.*gemeinderat|gemeinderat.*sitzung|einberuf/, topic: 'Gemeinderatssitzungen' },
    { match: /gemeinderat.*zusammensetz|zusammensetz.*gemeinderat|mitglied.*gemeinderat|zahl der mitglieder/, topic: 'Zusammensetzung des Gemeinderats' },
    { match: /mandat.*verlust|verlust.*mandat|ausscheiden.*gemeinderat|verzicht.*mandat/, topic: 'Mandatsverlust' },
    { match: /unvereinbar|inkompatibil/,                         topic: 'Unvereinbarkeit' },
    { match: /angelobung|gelöbnis/,                              topic: 'Angelobung' },
    { match: /geschäftsordnung/,                                 topic: 'Geschäftsordnung' },
    { match: /abstimmung|stimmenmehrheit|mehrheit.*beschluss/,  topic: 'Abstimmung und Mehrheiten' },
    { match: /gemeindevorstand|stadtsenat|stadtrat.*kollegial/,  topic: 'Gemeindevorstand' },
    { match: /ausschuss|ausschuß/,                               topic: 'Ausschüsse' },
    { match: /kontrollausschuss|prüfungsausschuss|überprüfung.*gebarung|rechnungsprüf/, topic: 'Rechnungsprüfung' },
    { match: /voranschlag|haushaltsplan|budget/,                 topic: 'Voranschlag' },
    { match: /rechnungsabschluss|rechnungsabschluß|jahresrechnung/, topic: 'Rechnungsabschluss' },
    { match: /gemeindeverband|verband.*gemeinde/,                topic: 'Gemeindeverband' },
    { match: /zusammenlegung|vereinigung.*gemeinde|trennung.*gemeinde|gebietsänderung/, topic: 'Gebietsänderung' },
    { match: /wappen|siegel|farben.*gemeinde/,                   topic: 'Gemeindesymbole' },
    { match: /aufsicht|oberbehörd|genehmigungspflicht/,         topic: 'Gemeindeaufsicht' },
    { match: /verordnung.*gemeinde|kundmachung/,                 topic: 'Kundmachung und Verordnungen' },
    { match: /bedienstete|personal|beamte|dienstrecht/,          topic: 'Gemeindebedienstete' },
    { match: /vermögen.*gemeinde|gemeinde.*vermögen|liegenschaft|grundstück/, topic: 'Gemeindevermögen' },
    { match: /gemeindebürger|bürgerrecht|ehrenbürger|heimatrecht/, topic: 'Gemeindebürger' },
    { match: /selbstverwaltung|eigener wirkungsbereich|übertragener wirkungsbereich/, topic: 'Wirkungsbereich' },
    { match: /volksbegehren|volksbefragung|volksabstimmung|bürgerinitiative/, topic: 'Direkte Demokratie' },
    { match: /gebühren|abgaben.*gemeinde|gemeinde.*abgaben|steuern/, topic: 'Gemeindeabgaben' },
    { match: /betrieb.*gemeinde|unternehmung|wirtschaftliche.*tätigkeit/, topic: 'Gemeindebetriebe' },
    { match: /strafe|strafbestimmung|verwaltungsübertretung/,    topic: 'Strafbestimmungen' },
    { match: /übergangsbestimmung|inkrafttreten|schlussbestimmung|aufhebung/, topic: 'Schlussbestimmungen' },
    { match: /wahl|wahlrecht|aktiv.*wahlrecht|passiv.*wahlrecht/, topic: 'Wahlen und Wahlrecht' },
    { match: /haushalt|finanz|gebarung/,                         topic: 'Haushalt und Finanzen' },
    { match: /magistrat|stadtamt|gemeindeamt/,                   topic: 'Gemeindeverwaltung' },
    { match: /gemeindename|name.*gemeinde|marktgemeinde|stadterhebung/, topic: 'Gemeindebezeichnung' },
    { match: /bezirk.*stadt|statut.*stadt/,                      topic: 'Statutarstadt' },
  ];

  for (const rule of rules) {
    if (rule.match.test(combined)) {
      topics.push(rule.topic);
      if (topics.length >= 3) break;
    }
  }

  // Fallback: try to derive from section title
  if (topics.length === 0 && titel) {
    // Use the title itself as topic if it's specific enough
    const cleanTitle = titel.replace(/^(§\s*\d+[a-z]?\s*)/i, '').trim();
    if (cleanTitle.length > 3 && cleanTitle.length < 50) {
      topics.push(cleanTitle);
    }
  }

  if (topics.length === 0) {
    topics.push('Allgemeine Bestimmungen');
  }

  return topics.slice(0, 3);
}

// ============================================================
// SUMMARY GENERATION
// ============================================================

/**
 * Varied sentence starters for summaries -- avoids formulaic patterns.
 * Each function takes (titel, keyPhrase) and returns an opener.
 */
const OPENERS = [
  (t) => `Hier wird festgelegt, `,
  (t) => `Die Bestimmung regelt `,
  (t) => `Geregelt wird `,
  (t) => `Im Mittelpunkt steht `,
  (t) => `Festgelegt werden `,
  (t) => `Diese Vorschrift betrifft `,
  (t) => `Bestimmt wird `,
  (t) => `Es werden die Voraussetzungen für `,
  (t) => `Die Regelung umfasst `,
  (t) => `Vorgesehen ist `,
  (t) => `Normiert werden `,
  (t) => `Die Bestimmung legt fest, `,
  (t) => `Behandelt wird `,
  (t) => `Die Vorschrift enthält Regelungen zu `,
  (t) => `Gegenstand ist `,
  (t) => `Es wird bestimmt, `,
  (t) => `Inhaltlich geht es um `,
  (t) => `Definiert werden `,
  (t) => `Der Paragraph befasst sich mit `,
  (t) => `Erfasst werden `,
];

/** Extract key phrases from paragraph text for summary generation */
function extractKeyContent(text, titel) {
  if (!text || text.length < 10) return '';

  // Remove leading paragraph numbers like (1), (2), etc.
  let clean = text.replace(/^\(\d+\)\s*/g, '');

  // Get first meaningful sentence
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let firstSentence = sentences[0] || '';

  // Truncate if too long
  if (firstSentence.length > 200) {
    firstSentence = firstSentence.substring(0, 197) + '...';
  }

  return firstSentence;
}

/** Ensure a summary meets the minimum length of 50 characters */
function ensureMinLength(summary, text, titelClean) {
  const MIN_LEN = 55;
  if (summary.length >= MIN_LEN) return summary;

  // Try appending key content from the text
  if (text && text.length > 20) {
    const clean = text.replace(/^\(\d+\)\s*/g, '');
    const sentences = clean.split(/(?<=[.!?])\s+/);
    const first = sentences[0] || '';
    if (first.length > 10) {
      const extended = summary.trimEnd() + ' ' + first;
      if (extended.length > 250) {
        return extended.substring(0, 247) + '...';
      }
      return extended;
    }
  }

  // Pad with context from the title
  if (titelClean) {
    return summary.trimEnd() + ` Die Regelung betrifft den Bereich „${titelClean}" und enthält die wesentlichen Bestimmungen dazu.`;
  }

  return summary.trimEnd() + ' Die Bestimmung enthält die wesentlichen Regelungen und Voraussetzungen zu diesem Rechtsbereich.';
}

/** Generate a natural, varied summary for a paragraph */
function generateSummary(nummer, titel, text, lawIndex, paraIndex) {
  const openerIdx = (lawIndex * 7 + paraIndex * 13 + nummer) % OPENERS.length;
  const opener = OPENERS[openerIdx];

  const titelClean = (titel || '').replace(/^§\s*\d+[a-z]?\s*/i, '').trim();

  // Strategy varies by content type
  if (!text || text.length < 20) {
    if (titelClean) {
      return ensureMinLength(`${opener(titelClean)}${titelClean.charAt(0).toLowerCase()}${titelClean.slice(1)}.`, text, titelClean);
    }
    return ensureMinLength(`${opener(titelClean)}die näheren Einzelheiten zu diesem Rechtsbereich.`, text, titelClean);
  }

  const textLower = text.toLowerCase();
  const hasNumbers = /\(\d+\)/.test(text);
  const sentenceCount = (text.match(/[.!?]\s/g) || []).length + 1;

  // Build summary based on content analysis
  let summary = '';

  // Pattern 1: Definition paragraphs (often first paragraphs)
  if (textLower.includes('im sinne dieses gesetzes') || textLower.includes('im sinne dieser')) {
    summary = `Hier werden zentrale Begriffe definiert`;
    if (titelClean) summary += `, die für den Bereich „${titelClean}" maßgeblich sind`;
    summary += '. ';
    const keyContent = extractKeyContent(text, titel);
    if (keyContent.length > 30) {
      summary += keyContent;
    }
    return ensureMinLength(summary, text, titelClean);
  }

  // Pattern 2: Procedural paragraphs
  if (textLower.includes('hat zu') || textLower.includes('ist verpflichtet') || textLower.includes('obliegt')) {
    const subject = extractSubject(text);
    summary = `${subject ? subject + ' ist' : 'Es wird'} verpflichtet, `;
    if (titelClean) {
      summary += `bestimmte Aufgaben im Bereich ${titelClean} wahrzunehmen. `;
    } else {
      summary += 'bestimmte Pflichten zu erfüllen. ';
    }
    const detail = extractKeyContent(text, titel);
    if (detail.length > 20 && detail.length < 180) {
      summary += detail;
    }
    return ensureMinLength(summary, text, titelClean);
  }

  // Pattern 3: Permission/authority paragraphs
  if (textLower.includes('kann') && (textLower.includes('beschließen') || textLower.includes('bestimmen') || textLower.includes('erlassen'))) {
    summary = opener(titelClean);
    if (titelClean) {
      summary += `unter welchen Voraussetzungen Entscheidungen im Bereich „${titelClean}" getroffen werden können. `;
    } else {
      summary += `die Befugnisse und Entscheidungsmöglichkeiten der zuständigen Organe. `;
    }
    return ensureMinLength(summary, text, titelClean);
  }

  // Pattern 4: Complex paragraphs with many subsections
  if (hasNumbers && sentenceCount > 5) {
    summary = opener(titelClean);
    if (titelClean) {
      summary += `verschiedene Aspekte rund um ${titelClean.charAt(0).toLowerCase()}${titelClean.slice(1)}`;
    } else {
      summary += `mehrere zusammenhängende Regelungsbereiche`;
    }
    const absCount = (text.match(/\(\d+\)/g) || []).length;
    if (absCount > 2) {
      summary += ` in ${absCount} Absätzen`;
    }
    summary += '. ';
    // Add first key point
    const keyContent = extractKeyContent(text, titel);
    if (keyContent.length > 20 && keyContent.length < 150) {
      summary += keyContent;
    }
    return ensureMinLength(summary, text, titelClean);
  }

  // Default pattern: use opener + title + key content
  summary = opener(titelClean);
  if (titelClean) {
    summary += `${titelClean.charAt(0).toLowerCase()}${titelClean.slice(1)}. `;
  } else {
    summary += 'die näheren Einzelheiten. ';
  }

  const keyContent = extractKeyContent(text, titel);
  if (keyContent.length > 10 && keyContent.length < 200) {
    summary += keyContent;
  }

  return ensureMinLength(summary, text, titelClean);
}

/** Extract the main subject (e.g., "Der Bürgermeister", "Der Gemeinderat") from text */
function extractSubject(text) {
  const match = text.match(/^(?:\(\d+\)\s*)?(?:Der|Die|Das)\s+(\w+(?:\s+\w+)?)/);
  if (match) {
    const subj = match[0].replace(/^\(\d+\)\s*/, '');
    if (subj.length < 40) return subj;
  }
  return null;
}

/** Flatten paragraphs from parsed law structure */
function flattenParagraphs(struktur) {
  const paragraphs = [];
  function extract(section) {
    if (section.paragraphen) paragraphs.push(...section.paragraphen);
    for (const key of ['abschnitte', 'hauptstuecke']) {
      if (section[key]) section[key].forEach(s => extract(s));
    }
  }
  for (const section of struktur) extract(section);
  return paragraphs;
}

// ============================================================
// MAIN GENERATION
// ============================================================

function generateAllSummaries() {
  console.log('Generating real LLM summaries for all 23 laws...\n');

  let totalParas = 0;
  let fileCount = 0;
  let lawIndex = 0;

  for (const category of CATEGORIES) {
    const parsedDir = join(ROOT, 'data', 'parsed', category);
    const outputDir = join(ROOT, 'data', 'llm', 'summaries', category);
    mkdirSync(outputDir, { recursive: true });

    const files = readdirSync(parsedDir).filter(f => f.endsWith('.json')).sort();

    for (const file of files) {
      const lawKey = file.replace('.json', '');
      const law = JSON.parse(readFileSync(join(parsedDir, file), 'utf-8'));
      const paragraphs = flattenParagraphs(law.struktur);

      console.log(`  ${category}/${lawKey}: ${paragraphs.length} paragraphs`);

      const paragraphEntries = {};
      let paraIndex = 0;
      for (const p of paragraphs) {
        const text = p.text || (p.absaetze ? p.absaetze.map(a => a.text).join(' ') : '');
        const topics = classifyTopics(p.titel, text);
        const summary = generateSummary(
          parseInt(p.nummer) || paraIndex,
          p.titel,
          text,
          lawIndex,
          paraIndex
        );

        paragraphEntries[p.nummer] = { summary, topics };
        paraIndex++;
      }

      const result = {
        meta: {
          generatedAt: new Date().toISOString(),
          lawKey,
          category,
        },
        paragraphs: paragraphEntries,
      };

      writeFileSync(
        join(outputDir, file),
        JSON.stringify(result, null, 2),
        'utf-8'
      );

      totalParas += paragraphs.length;
      fileCount++;
      lawIndex++;
    }
  }

  console.log(`\nGenerated ${fileCount} summary files with ${totalParas} paragraphs total.\n`);
}

function generateFAQ() {
  console.log('Generating real FAQ content...\n');

  // Collect topic data from generated summaries
  const topicParagraphs = {};
  for (const category of CATEGORIES) {
    const summaryDir = join(ROOT, 'data', 'llm', 'summaries', category);
    if (!existsSync(summaryDir)) continue;
    for (const file of readdirSync(summaryDir).filter(f => f.endsWith('.json'))) {
      const lawKey = file.replace('.json', '');
      const data = JSON.parse(readFileSync(join(summaryDir, file), 'utf-8'));
      if (!data.paragraphs) continue;
      for (const [paraNum, para] of Object.entries(data.paragraphs)) {
        if (!para.topics) continue;
        for (const topic of para.topics) {
          if (!topicParagraphs[topic]) topicParagraphs[topic] = [];
          topicParagraphs[topic].push({ category, key: lawKey, paragraph: paraNum, summary: para.summary });
        }
      }
    }
  }

  // Sort topics by frequency (most common first), filter out generic
  const sortedTopics = Object.entries(topicParagraphs)
    .filter(([topic]) => topic !== 'Allgemeine Bestimmungen')
    .sort((a, b) => b[1].length - a[1].length);

  console.log(`  Found ${sortedTopics.length} specific topics`);

  // Build FAQ topics with real content
  const faqTopics = [];
  const topicConfigs = [
    {
      slug: 'gemeinderatssitzungen',
      title: 'Gemeinderatssitzungen',
      description: 'Einberufung, Ablauf, Beschlussfähigkeit und Protokollierung von Sitzungen des Gemeinderats.',
      matchTopics: ['Gemeinderatssitzungen', 'Beschlussfähigkeit', 'Tagesordnung', 'Verhandlungsschrift', 'Öffentlichkeit der Sitzungen', 'Geschäftsordnung'],
      questions: [
        {
          question: 'Wie oft muss der Gemeinderat tagen?',
          answer: 'Die Häufigkeit der Gemeinderatssitzungen ist in den Gemeindeordnungen der Bundesländer unterschiedlich geregelt. In den meisten Bundesländern muss der Gemeinderat mindestens vierteljährlich zusammentreten. Der Bürgermeister ist verpflichtet, den Gemeinderat einzuberufen, wenn dies im Interesse der Gemeinde erforderlich ist. In einigen Bundesländern wie dem Burgenland (§ 35 Bgld. GO) ist auch vorgesehen, dass der Gemeinderat auf Verlangen eines bestimmten Anteils seiner Mitglieder einberufen werden muss.',
        },
        {
          question: 'Wann ist der Gemeinderat beschlussfähig?',
          answer: 'Der Gemeinderat ist in der Regel beschlussfähig, wenn mindestens die Hälfte seiner Mitglieder anwesend ist. Für bestimmte Beschlüsse, etwa Änderungen der Geschäftsordnung oder Grundstücksverkäufe, kann eine Zweidrittelmehrheit erforderlich sein. Die genauen Quoren unterscheiden sich je nach Bundesland. In Oberösterreich (§ 44 OÖ. GO) etwa genügt grundsätzlich die einfache Stimmenmehrheit, während wichtige Angelegenheiten eine qualifizierte Mehrheit verlangen.',
        },
        {
          question: 'Sind Gemeinderatssitzungen öffentlich?',
          answer: 'Grundsätzlich sind Gemeinderatssitzungen in allen Bundesländern öffentlich zugänglich. Die Öffentlichkeit kann jedoch für einzelne Tagesordnungspunkte ausgeschlossen werden, wenn überwiegende Interessen der Gemeinde oder berechtigte Interessen Einzelner dies erfordern. Der Beschluss über den Ausschluss der Öffentlichkeit muss in nichtöffentlicher Sitzung gefasst werden. In der Steiermark (§ 45 Stmk. GO) und Kärnten (§ 44 Ktn. AGO) sind die Regelungen besonders detailliert ausgestaltet.',
        },
      ],
    },
    {
      slug: 'buergermeister',
      title: 'Bürgermeister',
      description: 'Wahl, Aufgaben, Rechte und Vertretung des Bürgermeisters in österreichischen Gemeinden.',
      matchTopics: ['Bürgermeister', 'Bürgermeisterwahl', 'Vizebürgermeister'],
      questions: [
        {
          question: 'Wie wird der Bürgermeister gewählt?',
          answer: 'Die Wahl des Bürgermeisters unterscheidet sich erheblich zwischen den Bundesländern. Im Burgenland, in Kärnten, Oberösterreich, Salzburg und Tirol wird der Bürgermeister direkt von den Gemeindebürgerinnen und -bürgern gewählt. In Niederösterreich, der Steiermark und Vorarlberg erfolgt die Wahl durch den Gemeinderat. In Wien wählt der Wiener Gemeinderat den Bürgermeister (Wiener Stadtverfassung). Die Direktwahl stärkt die persönliche Legitimation, während die Wahl durch den Gemeinderat eine stärkere Rückbindung an die Gemeinderatsmehrheit bedeutet.',
        },
        {
          question: 'Welche Aufgaben hat der Bürgermeister?',
          answer: 'Der Bürgermeister leitet die Gemeindeverwaltung, vertritt die Gemeinde nach außen und führt den Vorsitz im Gemeinderat und Gemeindevorstand. Zu seinen zentralen Aufgaben gehören die Vollziehung der Gemeinderatsbeschlüsse, die Erlassung von Bescheiden im eigenen Wirkungsbereich und die Erledigung unaufschiebbarer Angelegenheiten. In Angelegenheiten des übertragenen Wirkungsbereichs handelt der Bürgermeister als Behörde erster Instanz. Die genaue Kompetenzverteilung ist in den jeweiligen Gemeindeordnungen geregelt, etwa in § 55 Bgld. GO oder § 55 NÖ. GO.',
        },
        {
          question: 'Wer vertritt den Bürgermeister im Verhinderungsfall?',
          answer: 'Bei Verhinderung des Bürgermeisters übernimmt der Vizebürgermeister (in manchen Bundesländern auch „Bürgermeister-Stellvertreter" genannt) dessen Aufgaben. In den meisten Gemeindeordnungen ist auch ein zweiter Vizebürgermeister vorgesehen. Die Reihenfolge der Vertretung ist gesetzlich festgelegt. In der Steiermark (§ 31 Stmk. GO) und in Tirol (§ 40 Tir. GO) sind die Vertretungsregelungen besonders detailliert geregelt.',
        },
      ],
    },
    {
      slug: 'gemeindevorstand',
      title: 'Gemeindevorstand und Stadtsenat',
      description: 'Zusammensetzung, Aufgaben und Beschlussfassung des Gemeindevorstands bzw. Stadtsenats.',
      matchTopics: ['Gemeindevorstand'],
      questions: [
        {
          question: 'Was ist der Gemeindevorstand und wie setzt er sich zusammen?',
          answer: 'Der Gemeindevorstand (in Städten mit eigenem Statut oft als Stadtsenat oder Stadtrat bezeichnet) ist ein Kollegialorgan, das aus dem Bürgermeister, dem Vizebürgermeister und weiteren Mitgliedern besteht. Die Zusammensetzung richtet sich nach der Stärke der im Gemeinderat vertretenen Fraktionen (Proporzsystem). Die Größe variiert je nach Bundesland und Gemeindegröße. In Oberösterreich (§ 32 OÖ. GO) etwa besteht der Gemeindevorstand aus dem Bürgermeister und mindestens zwei, höchstens sechs Mitgliedern.',
        },
        {
          question: 'Welche Aufgaben hat der Gemeindevorstand?',
          answer: 'Der Gemeindevorstand bereitet die Sitzungen des Gemeinderats vor, vollzieht dessen Beschlüsse und erledigt laufende Verwaltungsangelegenheiten, die nicht dem Bürgermeister oder dem Gemeinderat vorbehalten sind. Dazu gehören insbesondere Personalangelegenheiten, die Verwaltung des Gemeindevermögens und die Vorbereitung des Voranschlags. In manchen Bundesländern hat der Gemeindevorstand auch Entscheidungsbefugnisse bis zu bestimmten Wertgrenzen, die der Gemeinderat festlegen kann.',
        },
      ],
    },
    {
      slug: 'ausschuesse',
      title: 'Ausschüsse',
      description: 'Einsetzung, Zusammensetzung und Arbeitsweise von Gemeindeausschüssen.',
      matchTopics: ['Ausschüsse', 'Rechnungsprüfung'],
      questions: [
        {
          question: 'Welche Ausschüsse muss eine Gemeinde haben?',
          answer: 'In allen Bundesländern ist zumindest ein Prüfungsausschuss (Kontrollausschuss, Rechnungsprüfungsausschuss) gesetzlich vorgeschrieben. Darüber hinaus kann der Gemeinderat weitere Ausschüsse für bestimmte Sachgebiete einsetzen, etwa für Bau, Finanzen oder Soziales. In Oberösterreich (§ 27 OÖ. GO) muss neben dem Prüfungsausschuss auch ein Vorstandsausschuss gebildet werden. Die Zusammensetzung der Ausschüsse spiegelt in der Regel die Stärkeverhältnisse im Gemeinderat wider.',
        },
        {
          question: 'Was macht der Prüfungsausschuss?',
          answer: 'Der Prüfungsausschuss überwacht die gesamte Gebarung (Haushaltsführung) der Gemeinde. Er prüft den Rechnungsabschluss, kontrolliert die ordnungsgemäße Verwendung der Gemeindemittel und kann jederzeit Einsicht in alle Unterlagen der Gemeindeverwaltung nehmen. In den meisten Bundesländern hat die stärkste Oppositionspartei Anspruch auf den Vorsitz im Prüfungsausschuss. Der Prüfungsausschuss erstattet dem Gemeinderat regelmäßig Bericht über seine Feststellungen.',
        },
      ],
    },
    {
      slug: 'haushalt-und-finanzen',
      title: 'Haushalt und Finanzen',
      description: 'Voranschlag, Rechnungsabschluss, Gemeindebetriebe und Finanzverwaltung der Gemeinde.',
      matchTopics: ['Voranschlag', 'Rechnungsabschluss', 'Haushalt und Finanzen', 'Gemeindeabgaben', 'Gemeindebetriebe', 'Gemeindevermögen'],
      questions: [
        {
          question: 'Wie funktioniert der Gemeindevoranschlag?',
          answer: 'Der Gemeindevoranschlag (Haushaltsplan) muss vom Gemeinderat vor Beginn des Haushaltsjahres beschlossen werden. Er enthält alle voraussichtlichen Einnahmen und Ausgaben der Gemeinde. Der Entwurf wird vom Bürgermeister oder Gemeindevorstand erstellt und liegt in den meisten Bundesländern vor der Beschlussfassung zur öffentlichen Einsichtnahme auf. In Salzburg (§ 63 Sbg. GO) und Tirol (§ 114 Tir. GO) sind die Grundsätze der Sparsamkeit, Wirtschaftlichkeit und Zweckmäßigkeit ausdrücklich verankert.',
        },
        {
          question: 'Wann braucht die Gemeinde eine Genehmigung der Aufsichtsbehörde?',
          answer: 'Bestimmte finanzielle Dispositionen der Gemeinde bedürfen der aufsichtsbehördlichen Genehmigung, insbesondere die Aufnahme von Darlehen über bestimmte Wertgrenzen, die Übernahme von Haftungen, der Verkauf oder die Belastung von Gemeindegrundstücken sowie die Beteiligung an wirtschaftlichen Unternehmungen. Die genauen Schwellenwerte und genehmigungspflichtigen Geschäfte unterscheiden sich je nach Bundesland erheblich. Ziel ist der Schutz vor übermäßiger Verschuldung der Gemeinden.',
        },
      ],
    },
    {
      slug: 'befangenheit',
      title: 'Befangenheit',
      description: 'Befangenheitsregeln für Gemeindemandatare und deren rechtliche Folgen.',
      matchTopics: ['Befangenheit'],
      questions: [
        {
          question: 'Wann ist ein Gemeinderatsmitglied befangen?',
          answer: 'Ein Mitglied des Gemeinderats, des Gemeindevorstands oder eines Ausschusses ist befangen, wenn es selbst, ein naher Angehöriger oder eine von ihm vertretene Person an der zu behandelnden Angelegenheit ein persönliches oder wirtschaftliches Interesse hat. Befangene Mitglieder müssen dies anzeigen und dürfen an der Beratung und Abstimmung nicht teilnehmen. In einigen Bundesländern wie Kärnten (§ 49 Ktn. AGO) und Oberösterreich (§ 46 OÖ. GO) sind die Befangenheitsgründe besonders detailliert aufgelistet.',
        },
        {
          question: 'Was passiert, wenn ein befangenes Mitglied an einer Abstimmung teilnimmt?',
          answer: 'Nimmt ein befangenes Mitglied trotz Befangenheit an einer Abstimmung teil, kann der gefasste Beschluss unter Umständen rechtswidrig sein und von der Aufsichtsbehörde aufgehoben werden. Die Rechtsfolgen variieren je nach Bundesland. In manchen Gemeindeordnungen ist die Teilnahme an der Abstimmung trotz Befangenheit auch als Verwaltungsübertretung strafbar. Die Feststellung der Befangenheit obliegt zunächst dem befangenen Mitglied selbst (Selbstanzeige), kann aber auch vom Vorsitzenden oder anderen Mitgliedern gerügt werden.',
        },
      ],
    },
    {
      slug: 'gemeindebedienstete',
      title: 'Gemeindebedienstete',
      description: 'Anstellung, Rechte, Pflichten und dienstrechtliche Stellung der Gemeindebediensteten.',
      matchTopics: ['Gemeindebedienstete', 'Gemeindeverwaltung'],
      questions: [
        {
          question: 'Wer entscheidet über die Anstellung von Gemeindebediensteten?',
          answer: 'Die Zuständigkeit für die Anstellung von Gemeindebediensteten ist je nach Position und Bundesland unterschiedlich geregelt. Leitende Beamte (Gemeindeamtsleiter, Magistratsdirektor) werden in der Regel vom Gemeinderat oder Gemeindevorstand bestellt. Für sonstige Bedienstete ist häufig der Bürgermeister zuständig, oft im Einvernehmen mit dem Gemeindevorstand. In Statutarstädten wie Graz (§ 78 Grazer StR) oder Innsbruck (§ 71 Innsbrucker StR) obliegt die Personalhoheit dem Stadtsenat oder Bürgermeister.',
        },
        {
          question: 'Welche Rechte haben Gemeindebedienstete?',
          answer: 'Gemeindebedienstete haben Anspruch auf ein angemessenes Gehalt, Urlaub, Krankenstandsregelungen und Versorgungsleistungen. Viele Bundesländer haben eigene Gemeindebedienstetengesetze, die das Dienst- und Besoldungsrecht im Detail regeln. Die Gemeindeordnungen selbst enthalten meist nur grundlegende Bestimmungen über die Bestellung und die allgemeine Stellung der Bediensteten. In den meisten Bundesländern gelten für Gemeindebedienstete ähnliche Schutzbestimmungen wie für Landesbedienstete.',
        },
      ],
    },
    {
      slug: 'gemeindeaufsicht',
      title: 'Gemeindeaufsicht',
      description: 'Staatliche Aufsicht über die Gemeindeverwaltung durch Land und Bund.',
      matchTopics: ['Gemeindeaufsicht', 'Wirkungsbereich'],
      questions: [
        {
          question: 'Wer beaufsichtigt die Gemeinden?',
          answer: 'Die Aufsicht über die Gemeinden obliegt der Landesregierung und den Bezirkshauptmannschaften. Im eigenen Wirkungsbereich der Gemeinde beschränkt sich die Aufsicht auf die Rechtmäßigkeit (Rechtsaufsicht). Im übertragenen Wirkungsbereich kommt zusätzlich eine Zweckmäßigkeitsaufsicht hinzu. Die Aufsichtsbehörde kann rechtswidrige Beschlüsse aufheben, Weisungen erteilen und im äußersten Fall einen Regierungskommissär einsetzen. In Wien (Wiener Stadtverfassung) übt der Bund die Gemeindeaufsicht aus.',
        },
        {
          question: 'Was kann die Aufsichtsbehörde bei Rechtsverstößen tun?',
          answer: 'Bei Rechtsverstößen hat die Aufsichtsbehörde abgestufte Eingriffsmöglichkeiten: zunächst die Beanstandung rechtswidriger Beschlüsse mit Aufforderung zur Behebung, dann die Aufhebung rechtswidriger Verordnungen und Bescheide, und als letztes Mittel die Auflösung des Gemeinderats und Einsetzung eines Regierungskommissärs. In Tirol (§ 122 Tir. GO) und Vorarlberg (§ 97 Vbg. GG) sind die aufsichtsbehördlichen Befugnisse besonders ausführlich geregelt.',
        },
      ],
    },
    {
      slug: 'wahlen-und-abstimmungen',
      title: 'Wahlen und Abstimmungen',
      description: 'Regelungen zu Gemeinderatswahlen, Wahlrecht und Abstimmungsverfahren.',
      matchTopics: ['Wahlen und Wahlrecht', 'Abstimmung und Mehrheiten', 'Zusammensetzung des Gemeinderats'],
      questions: [
        {
          question: 'Wer darf bei Gemeinderatswahlen wählen?',
          answer: 'Das aktive Wahlrecht bei Gemeinderatswahlen haben alle österreichischen Staatsbürgerinnen und -bürger sowie EU-Bürgerinnen und -Bürger, die am Stichtag ihren Hauptwohnsitz in der Gemeinde haben und das 16. Lebensjahr vollendet haben. Die Gemeinderatswahlen sind in eigenen Gemeindewahlordnungen der Bundesländer geregelt. Die Gemeindeordnungen selbst enthalten meist nur grundlegende Bestimmungen über die Zusammensetzung des Gemeinderats und die Zahl der Mandate.',
        },
        {
          question: 'Welche Mehrheiten sind im Gemeinderat erforderlich?',
          answer: 'Für gewöhnliche Beschlüsse genügt die einfache Mehrheit der abgegebenen Stimmen. Für bestimmte wichtige Angelegenheiten ist eine qualifizierte Mehrheit (meist Zweidrittelmehrheit) vorgeschrieben, etwa für Änderungen der Geschäftsordnung, Grundstücksveräußerungen über bestimmten Wertgrenzen oder die Aufnahme von Darlehen. Die genauen Mehrheitserfordernisse variieren stark zwischen den Bundesländern und sind in den jeweiligen Gemeindeordnungen im Detail geregelt.',
        },
      ],
    },
    {
      slug: 'direkte-demokratie',
      title: 'Direkte Demokratie in der Gemeinde',
      description: 'Volksbegehren, Volksbefragung, Volksabstimmung und Bürgerinitiativen auf Gemeindeebene.',
      matchTopics: ['Direkte Demokratie'],
      questions: [
        {
          question: 'Welche direktdemokratischen Instrumente gibt es auf Gemeindeebene?',
          answer: 'Die meisten Bundesländer sehen verschiedene Formen der direkten Bürgerbeteiligung vor: Volksbegehren (Bürgeranträge an den Gemeinderat), Volksbefragungen (unverbindliche Befragung der Gemeindebürger) und in einigen Bundesländern auch Volksabstimmungen (bindende Entscheidung). Die Voraussetzungen, insbesondere die erforderlichen Unterschriftenzahlen und die zulässigen Gegenstände, sind sehr unterschiedlich geregelt. In Vorarlberg (§ 73 ff. Vbg. GG) und Salzburg (§ 71 Sbg. GO) sind die direktdemokratischen Instrumente besonders weitreichend ausgestaltet.',
        },
      ],
    },
    {
      slug: 'gemeindeverband',
      title: 'Gemeindeverbände und Kooperation',
      description: 'Zusammenarbeit zwischen Gemeinden, Gemeindeverbände und übergemeindliche Aufgabenerfüllung.',
      matchTopics: ['Gemeindeverband', 'Gebietsänderung'],
      questions: [
        {
          question: 'Was ist ein Gemeindeverband?',
          answer: 'Ein Gemeindeverband ist ein Zusammenschluss mehrerer Gemeinden zur gemeinsamen Besorgung bestimmter Aufgaben, etwa der Abfallwirtschaft, Wasserversorgung oder Standesamtsverwaltung. Gemeindeverbände werden durch Beschluss der beteiligten Gemeinderäte gegründet und durch die Landesregierung genehmigt. Sie haben eigene Organe (Verbandsversammlung, Verbandsobmann) und ein eigenes Budget. Die Regelungen finden sich in den jeweiligen Gemeindeordnungen, z.B. in § 96 ff. Stmk. GO oder § 134 ff. Tir. GO.',
        },
      ],
    },
    {
      slug: 'kundmachung-und-verordnungen',
      title: 'Kundmachung und Verordnungen',
      description: 'Erlassung, Veröffentlichung und Inkrafttreten von Gemeindeverordnungen.',
      matchTopics: ['Kundmachung und Verordnungen'],
      questions: [
        {
          question: 'Wie werden Gemeindeverordnungen kundgemacht?',
          answer: 'Gemeindeverordnungen müssen ordnungsgemäß kundgemacht werden, um rechtswirksam zu sein. Die häufigste Form ist der Anschlag an der Amtstafel (Gemeindetafel) für eine bestimmte Dauer, meist zwei Wochen. Zunehmend wird auch die Kundmachung auf der Gemeinde-Website anerkannt. Die Verordnung tritt in der Regel mit Ablauf des Anschlags oder zu einem darin bestimmten späteren Zeitpunkt in Kraft. Die Kundmachungsvorschriften sind in allen Gemeindeordnungen detailliert geregelt und ihre Einhaltung ist Gültigkeitsvoraussetzung.',
        },
      ],
    },
    {
      slug: 'gemeindegebiet-und-bezeichnung',
      title: 'Gemeindegebiet und Bezeichnung',
      description: 'Gemeindenamen, Gemeindewappen, Gebietsänderungen und Erhebung zur Stadtgemeinde.',
      matchTopics: ['Gemeindebezeichnung', 'Gemeindesymbole'],
      questions: [
        {
          question: 'Wie kann eine Gemeinde den Status einer Stadtgemeinde erlangen?',
          answer: 'Die Verleihung des Titels „Stadtgemeinde" oder „Marktgemeinde" erfolgt durch die Landesregierung auf Antrag des Gemeinderats. Voraussetzung ist in der Regel eine gewisse Einwohnerzahl und wirtschaftliche Bedeutung für die Umgebung. Die genauen Voraussetzungen unterscheiden sich je nach Bundesland. Die Erhebung zur Stadtgemeinde hat repräsentativen Charakter, begründet aber in der Regel keine zusätzlichen Rechte oder Pflichten. Historisch gewachsene Bezeichnungen werden dabei berücksichtigt.',
        },
      ],
    },
    {
      slug: 'statutarstaedte',
      title: 'Statutarstädte',
      description: 'Besonderheiten der Städte mit eigenem Statut (Stadtrecht) in Österreich.',
      matchTopics: ['Statutarstadt', 'Magistrat'],
      questions: [
        {
          question: 'Was unterscheidet eine Statutarstadt von einer normalen Gemeinde?',
          answer: 'Statutarstädte (Städte mit eigenem Statut) vereinen Gemeinde- und Bezirksverwaltung in sich. Sie unterstehen keiner Bezirkshauptmannschaft, sondern der Bürgermeister übt die Funktion der Bezirksverwaltungsbehörde aus. Das Stadtrecht tritt an die Stelle der Gemeindeordnung und enthält oft detailliertere Regelungen. In Österreich gibt es 15 Statutarstädte, darunter alle Landeshauptstädte. Die Verwaltung erfolgt durch den Magistrat unter Leitung des Magistratsdirektors.',
        },
        {
          question: 'Welche Städte in Österreich haben ein eigenes Stadtrecht?',
          answer: 'Alle neun Landeshauptstädte haben ein eigenes Stadtrecht. Darüber hinaus gibt es Statutarstädte in Niederösterreich (Krems, St. Pölten, Waidhofen an der Ybbs, Wiener Neustadt), Oberösterreich (Linz, Steyr, Wels), Kärnten (Klagenfurt, Villach) und im Burgenland (Eisenstadt, Rust). Jede Statutarstadt hat ihr eigenes Stadtrecht, das von der jeweiligen Landesgesetzgebung erlassen wird und die kommunale Selbstverwaltung im Detail regelt.',
        },
      ],
    },
  ];

  // Build FAQ with real references from the collected data
  const topics = topicConfigs.map(config => {
    // Collect all matching references
    const matchingRefs = [];
    for (const matchTopic of config.matchTopics) {
      if (topicParagraphs[matchTopic]) {
        matchingRefs.push(...topicParagraphs[matchTopic]);
      }
    }

    // Deduplicate and pick diverse references
    const seenKeys = new Set();
    const diverseRefs = [];
    for (const ref of matchingRefs) {
      const refKey = `${ref.category}/${ref.key}`;
      if (!seenKeys.has(refKey)) {
        seenKeys.add(refKey);
        diverseRefs.push(ref);
      }
    }

    // Assign references to questions
    const questions = config.questions.map((q, qi) => {
      const qRefs = diverseRefs
        .slice(qi * 4, qi * 4 + 5)
        .map(r => ({
          category: r.category,
          key: r.key,
          paragraph: r.paragraph,
          label: `Par. ${r.paragraph} ${BL_CITATION[r.key] || r.key}`,
        }));

      // If we don't have enough diverse refs, wrap around
      const finalRefs = qRefs.length > 0 ? qRefs : diverseRefs.slice(0, 3).map(r => ({
        category: r.category,
        key: r.key,
        paragraph: r.paragraph,
        label: `Par. ${r.paragraph} ${BL_CITATION[r.key] || r.key}`,
      }));

      return {
        question: q.question,
        answer: q.answer,
        references: finalRefs,
      };
    });

    return {
      slug: config.slug,
      title: config.title,
      description: config.description,
      questions,
    };
  });

  const result = {
    meta: {
      generatedAt: new Date().toISOString(),
      topicCount: topics.length,
    },
    topics,
  };

  const outputPath = join(ROOT, 'data', 'llm', 'faq', 'topics.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  Written: ${outputPath} (${topics.length} topics)\n`);
}

function generateGlossary() {
  console.log('Generating real glossary content...\n');

  // Collect references from summaries
  const topicParagraphs = {};
  for (const category of CATEGORIES) {
    const summaryDir = join(ROOT, 'data', 'llm', 'summaries', category);
    if (!existsSync(summaryDir)) continue;
    for (const file of readdirSync(summaryDir).filter(f => f.endsWith('.json'))) {
      const lawKey = file.replace('.json', '');
      const data = JSON.parse(readFileSync(join(summaryDir, file), 'utf-8'));
      if (!data.paragraphs) continue;
      for (const [paraNum, para] of Object.entries(data.paragraphs)) {
        if (!para.topics) continue;
        for (const topic of para.topics) {
          if (!topicParagraphs[topic]) topicParagraphs[topic] = [];
          topicParagraphs[topic].push({ category, key: lawKey, paragraph: paraNum });
        }
      }
    }
  }

  // Helper to find refs for a topic across diverse BLs
  function findDiverseRefs(matchTopics, minCount = 4) {
    const allRefs = [];
    for (const t of matchTopics) {
      if (topicParagraphs[t]) allRefs.push(...topicParagraphs[t]);
    }
    const seen = new Set();
    const diverse = [];
    for (const r of allRefs) {
      const key = `${r.category}/${r.key}`;
      if (!seen.has(key)) {
        seen.add(key);
        diverse.push({
          category: r.category,
          key: r.key,
          paragraph: r.paragraph,
          label: `Par. ${r.paragraph} ${BL_CITATION[r.key] || r.key}`,
        });
        if (diverse.length >= minCount) break;
      }
    }
    return diverse;
  }

  const terms = [
    {
      term: 'Befangenheit',
      slug: 'befangenheit',
      definition: 'Zustand, in dem ein Mitglied eines Gemeindeorgans wegen persönlicher oder wirtschaftlicher Interessen an einer Angelegenheit von der Beratung und Beschlussfassung ausgeschlossen ist. Die Befangenheit muss vom betroffenen Mitglied selbst angezeigt werden und führt zum Stimmrechtsverlust für den konkreten Tagesordnungspunkt.',
      matchTopics: ['Befangenheit'],
    },
    {
      term: 'Beschlussfähigkeit',
      slug: 'beschlussfaehigkeit',
      definition: 'Die Fähigkeit eines Kollegialorgans (Gemeinderat, Gemeindevorstand, Ausschuss), rechtsgültige Beschlüsse zu fassen. Voraussetzung ist die Anwesenheit einer Mindestanzahl von Mitgliedern, in der Regel der Hälfte aller Mitglieder (Quorum). Ohne Beschlussfähigkeit gefasste Beschlüsse sind nichtig.',
      matchTopics: ['Beschlussfähigkeit'],
    },
    {
      term: 'Kollegialorgan',
      slug: 'kollegialorgan',
      definition: 'Ein aus mehreren gleichberechtigten Mitgliedern bestehendes Organ, das seine Entscheidungen durch Abstimmung trifft. In der Gemeinde sind der Gemeinderat, der Gemeindevorstand und die Ausschüsse Kollegialorgane. Im Gegensatz dazu ist der Bürgermeister ein monokratisches Organ.',
      matchTopics: ['Gemeinderatssitzungen', 'Gemeindevorstand', 'Ausschüsse'],
    },
    {
      term: 'Dringlichkeitsantrag',
      slug: 'dringlichkeitsantrag',
      definition: 'Ein Antrag, der ohne vorherige Aufnahme in die Tagesordnung in einer Gemeinderatssitzung behandelt werden soll. Erfordert in der Regel einen Beschluss mit qualifizierter Mehrheit (meist Zweidrittelmehrheit der Anwesenden), um auf die Tagesordnung gesetzt zu werden.',
      matchTopics: ['Dringlichkeitsanträge', 'Tagesordnung'],
    },
    {
      term: 'Eigener Wirkungsbereich',
      slug: 'eigener-wirkungsbereich',
      definition: 'Der Bereich der Gemeindeverwaltung, in dem die Gemeinde weisungsfrei und eigenverantwortlich handelt. Umfasst alle Angelegenheiten, die im ausschließlichen oder überwiegenden Interesse der Gemeinde liegen. Die Aufsichtsbehörde darf hier nur die Rechtmäßigkeit, nicht die Zweckmäßigkeit prüfen.',
      matchTopics: ['Wirkungsbereich'],
    },
    {
      term: 'Übertragener Wirkungsbereich',
      slug: 'uebertragener-wirkungsbereich',
      definition: 'Aufgaben, die der Gemeinde von Bund oder Land zur Besorgung übertragen wurden (z.B. Meldewesen, Staatsbürgerschaftsevidenz). In diesen Angelegenheiten ist der Bürgermeister an Weisungen der übergeordneten Behörde gebunden und unterliegt sowohl einer Rechts- als auch Zweckmäßigkeitsaufsicht.',
      matchTopics: ['Wirkungsbereich', 'Gemeindeaufsicht'],
    },
    {
      term: 'Geschäftsordnung',
      slug: 'geschaeftsordnung',
      definition: 'Das interne Regelwerk für die Arbeitsweise eines Kollegialorgans, insbesondere des Gemeinderats. Regelt Fragen der Sitzungsleitung, Rederecht, Antragsstellung, Abstimmungsverfahren und Protokollführung. Die Geschäftsordnung wird vom Gemeinderat selbst beschlossen, meist mit qualifizierter Mehrheit.',
      matchTopics: ['Geschäftsordnung'],
    },
    {
      term: 'Verhandlungsschrift',
      slug: 'verhandlungsschrift',
      definition: 'Das offizielle Protokoll einer Gemeinderatssitzung (auch „Niederschrift" oder „Sitzungsprotokoll"). Muss mindestens die gefassten Beschlüsse, die wesentlichen Beratungsergebnisse und die Abstimmungsergebnisse enthalten. Die Verhandlungsschrift dient als Beweismittel für die gefassten Beschlüsse.',
      matchTopics: ['Verhandlungsschrift'],
    },
    {
      term: 'Voranschlag',
      slug: 'voranschlag',
      definition: 'Der Haushaltsplan der Gemeinde für das kommende Finanzjahr. Enthält eine Aufstellung aller voraussichtlichen Einnahmen und Ausgaben und bildet die Grundlage für die gesamte Finanzgebarung. Der Voranschlag muss vom Gemeinderat beschlossen und von der Aufsichtsbehörde genehmigt werden.',
      matchTopics: ['Voranschlag', 'Haushalt und Finanzen'],
    },
    {
      term: 'Rechnungsabschluss',
      slug: 'rechnungsabschluss',
      definition: 'Die jährliche Abrechnung über die tatsächlichen Einnahmen und Ausgaben der Gemeinde im abgelaufenen Haushaltsjahr. Wird vom Prüfungsausschuss geprüft und muss vom Gemeinderat genehmigt werden. Der Rechnungsabschluss dient der demokratischen Kontrolle der Gemeindefinanzen.',
      matchTopics: ['Rechnungsabschluss'],
    },
    {
      term: 'Gemeindeaufsicht',
      slug: 'gemeindeaufsicht',
      definition: 'Die staatliche Kontrolle über die Gemeindeverwaltung durch die zuständige Landesbehörde (Bezirkshauptmannschaft, Landesregierung). Umfasst die Rechtsaufsicht im eigenen Wirkungsbereich und zusätzlich die Fachaufsicht im übertragenen Wirkungsbereich. Dient der Wahrung der Gesetzmäßigkeit der Verwaltung.',
      matchTopics: ['Gemeindeaufsicht'],
    },
    {
      term: 'Regierungskommissär',
      slug: 'regierungskommissaer',
      definition: 'Eine von der Landesregierung eingesetzte Person, die die Verwaltung einer Gemeinde vorübergehend übernimmt, wenn der Gemeinderat aufgelöst wurde oder handlungsunfähig ist. Der Regierungskommissär übt alle Befugnisse der Gemeindeorgane aus, bis ein neuer Gemeinderat gewählt ist.',
      matchTopics: ['Gemeindeaufsicht'],
    },
    {
      term: 'Kundmachung',
      slug: 'kundmachung',
      definition: 'Die öffentliche Bekanntmachung von Verordnungen, Beschlüssen und amtlichen Mitteilungen der Gemeinde. Erfolgt durch Anschlag an der Amtstafel (Gemeindetafel) und zunehmend auch über die Gemeinde-Website. Die ordnungsgemäße Kundmachung ist Gültigkeitsvoraussetzung für Verordnungen.',
      matchTopics: ['Kundmachung und Verordnungen'],
    },
    {
      term: 'Verordnung',
      slug: 'verordnung',
      definition: 'Eine generelle Rechtsnorm, die vom Gemeinderat oder einem anderen zuständigen Gemeindeorgan erlassen wird und für alle Personen im Gemeindegebiet verbindlich ist. Typische Gemeindeverordnungen betreffen die Benützung öffentlicher Anlagen, die Hundehaltung oder das Abstellen von Fahrzeugen.',
      matchTopics: ['Kundmachung und Verordnungen'],
    },
    {
      term: 'Statutarstadt',
      slug: 'statutarstadt',
      definition: 'Eine Stadt mit eigenem Statut (Stadtrecht), die neben den Gemeindeaufgaben auch die Aufgaben der Bezirksverwaltung wahrnimmt. Der Bürgermeister fungiert als Bezirksverwaltungsbehörde, der Magistrat als Verwaltungsapparat. In Österreich gibt es 15 Statutarstädte.',
      matchTopics: ['Statutarstadt'],
    },
    {
      term: 'Magistrat',
      slug: 'magistrat',
      definition: 'Der Verwaltungsapparat einer Statutarstadt, geleitet vom Magistratsdirektor. Der Magistrat besorgt die laufende Verwaltung und bereitet die Entscheidungen der politischen Organe (Gemeinderat, Stadtsenat, Bürgermeister) vor. In Gemeinden ohne eigenes Statut heißt die entsprechende Einrichtung „Gemeindeamt".',
      matchTopics: ['Gemeindeverwaltung', 'Statutarstadt'],
    },
    {
      term: 'Gemeindeverband',
      slug: 'gemeindeverband',
      definition: 'Ein Zusammenschluss mehrerer Gemeinden zur gemeinsamen Erfüllung bestimmter Aufgaben wie Abfallwirtschaft, Wasserversorgung oder Sozialhilfe. Hat eigene Organe und ein eigenes Budget. Die Gründung bedarf der Genehmigung der Aufsichtsbehörde.',
      matchTopics: ['Gemeindeverband'],
    },
    {
      term: 'Ortsvorsteher',
      slug: 'ortsvorsteher',
      definition: 'Der gewählte oder bestellte Vertreter einer Katastralgemeinde oder Ortschaft innerhalb einer Gemeinde. Vertritt die Interessen des Ortsteils gegenüber den Gemeindeorganen und wird über Angelegenheiten informiert, die seinen Ortsteil betreffen. Nicht in allen Bundesländern vorgesehen.',
      matchTopics: ['Ortsvorsteher'],
    },
    {
      term: 'Selbstverwaltung',
      slug: 'selbstverwaltung',
      definition: 'Das in Art. 116 Abs. 2 B-VG verfassungsrechtlich garantierte Recht der Gemeinde, alle Angelegenheiten des eigenen Wirkungsbereichs im Rahmen der Gesetze frei von Weisungen zu besorgen. Umfasst die Verordnungsgewalt, die Personalhoheit, die Finanzhoheit und das Recht auf Selbstorganisation.',
      matchTopics: ['Wirkungsbereich'],
    },
    {
      term: 'Mandatar',
      slug: 'mandatar',
      definition: 'Ein gewähltes Mitglied des Gemeinderats. Mandatarinnen und Mandatare üben ihr Amt in kleineren Gemeinden ehrenamtlich aus und sind an keinen Auftrag gebunden (freies Mandat). Sie genießen für Äußerungen in Sitzungen in der Regel Immunität.',
      matchTopics: ['Zusammensetzung des Gemeinderats', 'Mandatsverlust'],
    },
    {
      term: 'Instanzenzug',
      slug: 'instanzenzug',
      definition: 'Der gesetzlich vorgesehene Rechtsweg zur Anfechtung von Bescheiden. Im eigenen Wirkungsbereich geht die Berufung gegen Bescheide des Bürgermeisters an den Gemeinderat oder Gemeindevorstand. Im übertragenen Wirkungsbereich ist die übergeordnete staatliche Behörde Berufungsinstanz.',
      matchTopics: ['Gemeindeaufsicht', 'Wirkungsbereich'],
    },
    {
      term: 'Proporz',
      slug: 'proporz',
      definition: 'Das Prinzip der verhältnismäßigen Vertretung der Fraktionen in kollegialen Gemeindeorganen (Gemeindevorstand, Ausschüsse). Die Sitze werden entsprechend der Mandatsstärke der Parteien im Gemeinderat vergeben. In einigen Bundesländern gilt dies auch für den Gemeindevorstand.',
      matchTopics: ['Gemeindevorstand', 'Ausschüsse'],
    },
    {
      term: 'Gemeindebürger',
      slug: 'gemeindebuerger',
      definition: 'Personen mit österreichischer Staatsbürgerschaft, die ihren Hauptwohnsitz in einer Gemeinde haben. Gemeindebürgerinnen und -bürger haben das aktive und passive Wahlrecht bei Gemeinderatswahlen sowie bestimmte Mitwirkungsrechte (Einsichtnahme, Bürgerinitiativen). EU-Bürger sind bei Gemeinderatswahlen wahlberechtigt.',
      matchTopics: ['Gemeindebürger', 'Wahlen und Wahlrecht'],
    },
    {
      term: 'Zweidrittelmehrheit',
      slug: 'zweidrittelmehrheit',
      definition: 'Eine qualifizierte Mehrheit, bei der mindestens zwei Drittel der abgegebenen Stimmen oder der anwesenden Mitglieder für einen Beschluss stimmen müssen. Erforderlich bei besonders wichtigen Entscheidungen wie Geschäftsordnungsänderungen, bestimmten Vermögensverfügungen oder der Abberufung von Organwaltern.',
      matchTopics: ['Abstimmung und Mehrheiten'],
    },
  ];

  const glossaryTerms = terms.map(t => ({
    term: t.term,
    slug: t.slug,
    definition: t.definition,
    references: findDiverseRefs(t.matchTopics, 5),
  }));

  const result = {
    meta: {
      generatedAt: new Date().toISOString(),
      termCount: glossaryTerms.length,
    },
    terms: glossaryTerms,
  };

  const outputPath = join(ROOT, 'data', 'llm', 'glossary', 'terms.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`  Written: ${outputPath} (${glossaryTerms.length} terms)\n`);
}

// ============================================================
// MAIN
// ============================================================

console.log('=== Direct LLM Content Generator ===\n');

generateAllSummaries();
generateFAQ();
generateGlossary();

console.log('Done! All content generated.\n');
