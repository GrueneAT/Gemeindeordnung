import { describe, it, expect } from 'vitest';

// Import will fail until we create the module
import { validateSummary, validateFAQ, validateGlossary, validateAll } from '../scripts/llm-validate.js';

describe('validateSummary', () => {
  const validSummary = {
    meta: { generatedAt: '2026-01-01', lawKey: 'burgenland', category: 'gemeindeordnungen' },
    paragraphs: {
      '1': {
        summary: 'Der Gemeinderat ist das oberste beschlussfassende Organ der Gemeinde und besteht aus den von der Wahlbevölkerung bestimmten Mitgliedern.',
        topics: ['Gemeinderatssitzungen'],
      },
      '2': {
        summary: 'Damit ein Kollegialorgan wirksam Entscheidungen treffen kann, muss mindestens die Mehrheit der Mitglieder anwesend sein.',
        topics: ['Beschlussfähigkeit'],
      },
    },
  };

  it('returns no errors for valid summary data', () => {
    const errors = validateSummary(validSummary, 'burgenland');
    expect(errors).toEqual([]);
  });

  it('returns errors for placeholder:true meta', () => {
    const data = {
      ...validSummary,
      meta: { ...validSummary.meta, placeholder: true },
    };
    const errors = validateSummary(data, 'burgenland');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('placeholder'))).toBe(true);
  });

  it('returns errors for summaries shorter than 50 chars', () => {
    const data = {
      ...validSummary,
      paragraphs: {
        '1': { summary: 'Kurze Zusammenfassung.', topics: ['Test'] },
      },
    };
    const errors = validateSummary(data, 'burgenland');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('50'))).toBe(true);
  });

  it('returns errors for summaries starting with "Dieser Paragraph regelt"', () => {
    const data = {
      ...validSummary,
      paragraphs: {
        '1': {
          summary: 'Dieser Paragraph regelt die Zusammensetzung des Gemeinderates und legt die Anzahl der Mitglieder fest.',
          topics: ['Gemeinderatssitzungen'],
        },
      },
    };
    const errors = validateSummary(data, 'burgenland');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('Dieser Paragraph regelt'))).toBe(true);
  });

  it('returns errors for ASCII-safe spellings', () => {
    const data = {
      ...validSummary,
      paragraphs: {
        '1': {
          summary: 'Der Buergermeister ist fuer die Verwaltung der Gemeinde zustaendig und vertritt sie nach aussen.',
          topics: ['Buergermeister'],
        },
      },
    };
    const errors = validateSummary(data, 'burgenland');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => /ASCII|fuer|ueber|oesterreich/i.test(e))).toBe(true);
  });

  it('returns errors for topic "Allgemeine Bestimmungen" in >50% of paragraphs', () => {
    const data = {
      ...validSummary,
      paragraphs: {
        '1': {
          summary: 'Erste Bestimmung die ausreichend lang ist fuer die Validierung und alle Kriterien erfuellt hat.',
          topics: ['Allgemeine Bestimmungen'],
        },
        '2': {
          summary: 'Zweite Bestimmung die auch ausreichend lang ist fuer die Validierung und alle Kriterien erfuellt.',
          topics: ['Allgemeine Bestimmungen'],
        },
        '3': {
          summary: 'Dritte Bestimmung die ebenfalls lang genug ist fuer die Validierung und auch die Kriterien erfuellt.',
          topics: ['Gemeinderatssitzungen'],
        },
      },
    };
    const errors = validateSummary(data, 'burgenland');
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('Allgemeine Bestimmungen'))).toBe(true);
  });
});

describe('validateFAQ', () => {
  const validFAQ = {
    meta: { generatedAt: '2026-01-01', topicCount: 1 },
    topics: [
      {
        slug: 'gemeinderatssitzungen',
        title: 'Gemeinderatssitzungen',
        description: 'Regelungen zu Gemeinderatssitzungen.',
        questions: [
          {
            question: 'Wie wird eine Gemeinderatssitzung einberufen?',
            answer: 'Die Einberufung erfolgt durch den Buergermeister. In den meisten Bundeslaendern muss die Einladung mit Tagesordnung mindestens eine Woche vor der Sitzung zugestellt werden.',
            references: [
              { category: 'gemeindeordnungen', key: 'burgenland', paragraph: '42', label: 'Par. 42 Bgld. GO' },
            ],
          },
        ],
      },
    ],
  };

  it('returns no errors for valid FAQ data', () => {
    const errors = validateFAQ(validFAQ);
    expect(errors).toEqual([]);
  });

  it('returns errors for placeholder:true meta', () => {
    const data = {
      ...validFAQ,
      meta: { ...validFAQ.meta, placeholder: true },
    };
    const errors = validateFAQ(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('placeholder'))).toBe(true);
  });

  it('returns errors for formulaic questions matching "Was regelt das Thema"', () => {
    const data = {
      ...validFAQ,
      topics: [{
        ...validFAQ.topics[0],
        questions: [{
          question: 'Was regelt das Thema "Gemeinderatssitzungen" in oesterreichischen Gemeindeordnungen?',
          answer: 'Die Regelungen variieren je nach Bundesland. Details finden sich in den jeweiligen Gemeindeordnungen der neun Bundeslaender.',
          references: [{ category: 'gemeindeordnungen', key: 'burgenland', paragraph: '42', label: 'Par. 42 Bgld. GO' }],
        }],
      }],
    };
    const errors = validateFAQ(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => /formulaic|Was regelt/i.test(e))).toBe(true);
  });

  it('returns errors for references using raw key format', () => {
    const data = {
      ...validFAQ,
      topics: [{
        ...validFAQ.topics[0],
        questions: [{
          question: 'Wie wird eine Gemeinderatssitzung einberufen?',
          answer: 'Die Einberufung erfolgt durch den Buergermeister mit mindestens einwoechiger Frist zur Zustellung der Einladung.',
          references: [{ category: 'gemeindeordnungen', key: 'burgenland', paragraph: '42', label: 'Par. 42 burgenland' }],
        }],
      }],
    };
    const errors = validateFAQ(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => /citation|raw|format/i.test(e))).toBe(true);
  });

  it('validateFAQ handles per-topic generated structure with multiple topics', () => {
    const data = {
      meta: { generatedAt: '2026-01-01', topicCount: 3 },
      topics: [
        {
          slug: 'befangenheit-und-ausschluss',
          title: 'Befangenheit und Ausschluss',
          description: 'Regelungen zur Befangenheit von Gemeinderatsmitgliedern.',
          questions: [
            {
              question: 'Wann gilt ein Gemeinderatsmitglied als befangen?',
              answer: 'In den meisten Gemeindeordnungen gilt ein Mitglied als befangen, wenn es selbst oder nahe Angehoerige von einer Angelegenheit persoenlich betroffen sind. Die befangene Person muss die Sitzung fuer die Dauer der Beratung und Abstimmung verlassen.',
              references: [
                { category: 'gemeindeordnungen', key: 'burgenland', paragraph: '35', label: 'Par. 35 Bgld. GO' },
                { category: 'gemeindeordnungen', key: 'tirol', paragraph: '25', label: 'Par. 25 Tir. GO' },
              ],
            },
          ],
        },
        {
          slug: 'gemeindehaushalt',
          title: 'Gemeindehaushalt und Rechnungsabschluss',
          description: 'Regelungen zum Voranschlag und zur Haushaltsfuehrung.',
          questions: [
            {
              question: 'Wie wird der Gemeindevoranschlag beschlossen?',
              answer: 'Der Gemeindevoranschlag wird jaehrlich vom Gemeinderat beschlossen. In den meisten Bundeslaendern muss der Voranschlag vor Beginn des neuen Haushaltsjahres beschlossen werden, andernfalls gelten provisorische Regelungen.',
              references: [
                { category: 'gemeindeordnungen', key: 'salzburg', paragraph: '72', label: 'Par. 72 Sbg. GO' },
              ],
            },
          ],
        },
        {
          slug: 'buergerbeteiligung',
          title: 'Buergerbeteiligung',
          description: 'Instrumente der direkten Demokratie auf Gemeindeebene.',
          questions: [
            {
              question: 'Welche Formen der Buergerbeteiligung gibt es auf Gemeindeebene?',
              answer: 'Die oesterreichischen Gemeindeordnungen sehen verschiedene Formen der direkten Demokratie vor, darunter Volksbegehren, Volksbefragungen und Volksabstimmungen. Die genauen Voraussetzungen und Quoren variieren je nach Bundesland erheblich.',
              references: [
                { category: 'gemeindeordnungen', key: 'oberoesterreich', paragraph: '88', label: 'Par. 88 OOe. GO' },
                { category: 'gemeindeordnungen', key: 'kaernten', paragraph: '55', label: 'Par. 55 Ktn. AGO' },
              ],
            },
          ],
        },
      ],
    };
    const errors = validateFAQ(data);
    expect(errors).toEqual([]);
  });

  it('returns errors for answers shorter than 100 chars', () => {
    const data = {
      ...validFAQ,
      topics: [{
        ...validFAQ.topics[0],
        questions: [{
          question: 'Wie wird einberufen?',
          answer: 'Durch den Buergermeister.',
          references: [],
        }],
      }],
    };
    const errors = validateFAQ(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('100'))).toBe(true);
  });
});

describe('validateGlossary', () => {
  const validGlossary = {
    meta: { generatedAt: '2026-01-01', termCount: 1 },
    terms: [
      {
        term: 'Befangenheit',
        slug: 'befangenheit',
        definition: 'Zustand, in dem ein Organmitglied wegen persoenlicher Interessen von der Beratung und Abstimmung ausgeschlossen ist.',
        references: [
          { category: 'gemeindeordnungen', key: 'burgenland', paragraph: '35', label: 'Par. 35 Bgld. GO' },
          { category: 'gemeindeordnungen', key: 'kaernten', paragraph: '30', label: 'Par. 30 Ktn. AGO' },
          { category: 'gemeindeordnungen', key: 'tirol', paragraph: '25', label: 'Par. 25 Tir. GO' },
        ],
      },
    ],
  };

  it('returns no errors for valid glossary data', () => {
    const errors = validateGlossary(validGlossary);
    expect(errors).toEqual([]);
  });

  it('returns errors for placeholder:true meta', () => {
    const data = {
      ...validGlossary,
      meta: { ...validGlossary.meta, placeholder: true },
    };
    const errors = validateGlossary(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('placeholder'))).toBe(true);
  });

  it('returns errors for definitions shorter than 30 chars', () => {
    const data = {
      ...validGlossary,
      terms: [{
        ...validGlossary.terms[0],
        definition: 'Ein rechtlicher Begriff.',
      }],
    };
    const errors = validateGlossary(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('30'))).toBe(true);
  });

  it('returns errors for references spanning fewer than 3 BL', () => {
    const data = {
      ...validGlossary,
      terms: [{
        ...validGlossary.terms[0],
        references: [
          { category: 'gemeindeordnungen', key: 'burgenland', paragraph: '35', label: 'Par. 35 Bgld. GO' },
          { category: 'gemeindeordnungen', key: 'burgenland', paragraph: '36', label: 'Par. 36 Bgld. GO' },
        ],
      }],
    };
    const errors = validateGlossary(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => /Bundesl|BL|3/i.test(e))).toBe(true);
  });

  it('returns errors for ASCII-safe spellings in definitions', () => {
    const data = {
      ...validGlossary,
      terms: [{
        ...validGlossary.terms[0],
        definition: 'Die Faehigkeit eines Kollegialorgans, gueltige Beschluesse zu fassen und Entscheidungen zu treffen.',
      }],
    };
    const errors = validateGlossary(data);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => /ASCII/i.test(e))).toBe(true);
  });
});

describe('validateAll', () => {
  it('returns { valid, errors } structure', async () => {
    const result = await validateAll();
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('errors');
    expect(typeof result.valid).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
  });
});

describe('clean data passes all validations', () => {
  it('valid summary has zero errors', () => {
    const data = {
      meta: { generatedAt: '2026-01-01', lawKey: 'burgenland', category: 'gemeindeordnungen' },
      paragraphs: {
        '1': {
          summary: 'Der Gemeinderat ist das oberste beschlussfassende Organ der Gemeinde und besteht aus gewaehlten Mitgliedern.',
          topics: ['Gemeinderatssitzungen'],
        },
        '2': {
          summary: 'Jedes Gemeinderatsmitglied hat bei Abstimmungen eine Stimme und ist an keinen Auftrag gebunden.',
          topics: ['Beschlussfaehigkeit'],
        },
        '3': {
          summary: 'Die Geschaeftsordnung regelt den inneren Betrieb des Gemeinderats einschliesslich Redeordnung und Antragsrecht.',
          topics: ['Geschaeftsordnung'],
        },
      },
    };
    const errors = validateSummary(data, 'burgenland');
    expect(errors).toEqual([]);
  });

  it('valid FAQ has zero errors', () => {
    const data = {
      meta: { generatedAt: '2026-01-01', topicCount: 1 },
      topics: [{
        slug: 'test',
        title: 'Test',
        description: 'Test topic',
        questions: [{
          question: 'Wie funktioniert die Beschlussfassung im Gemeinderat?',
          answer: 'Die Beschlussfassung im Gemeinderat erfordert in der Regel die Anwesenheit der Haelfte der Mitglieder (Beschlussfaehigkeit). Beschluesse werden mit einfacher Mehrheit gefasst, wobei einige Bundeslaender fuer bestimmte Angelegenheiten qualifizierte Mehrheiten vorsehen.',
          references: [{ category: 'gemeindeordnungen', key: 'burgenland', paragraph: '42', label: 'Par. 42 Bgld. GO' }],
        }],
      }],
    };
    const errors = validateFAQ(data);
    expect(errors).toEqual([]);
  });

  it('valid glossary has zero errors', () => {
    const data = {
      meta: { generatedAt: '2026-01-01', termCount: 1 },
      terms: [{
        term: 'Befangenheit',
        slug: 'befangenheit',
        definition: 'Zustand, in dem ein Organmitglied wegen persoenlicher Interessen von der Beratung und Abstimmung ausgeschlossen ist.',
        references: [
          { category: 'gemeindeordnungen', key: 'burgenland', paragraph: '35', label: 'Par. 35 Bgld. GO' },
          { category: 'gemeindeordnungen', key: 'kaernten', paragraph: '30', label: 'Par. 30 Ktn. AGO' },
          { category: 'gemeindeordnungen', key: 'tirol', paragraph: '25', label: 'Par. 25 Tir. GO' },
        ],
      }],
    };
    const errors = validateGlossary(data);
    expect(errors).toEqual([]);
  });
});
