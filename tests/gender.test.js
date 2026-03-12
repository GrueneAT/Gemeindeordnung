import { describe, it, expect } from 'vitest';
import { genderText } from '../scripts/gender.js';

describe('genderText', () => {
  // Null safety
  it('returns empty string for null', () => {
    expect(genderText(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(genderText(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(genderText('')).toBe('');
  });

  // Singular standalone terms
  it('genders Bürgermeister standalone', () => {
    expect(genderText('Der Bürgermeister leitet die Sitzung')).toBe(
      'Der:die Bürgermeister:in leitet die Sitzung'
    );
  });

  it('genders Vizebürgermeister standalone', () => {
    expect(genderText('Die Vizebürgermeister vertreten')).toBe(
      'Die Vizebürgermeister:in vertreten'
    );
  });

  it('genders Gemeindebürger', () => {
    expect(genderText('Gemeindebürger haben Rechte')).toBe(
      'Gemeindebürger:innen haben Rechte'
    );
  });

  it('genders Ehrenbürger', () => {
    expect(genderText('Ehrenbürger der Stadt')).toBe(
      'Ehrenbürger:innen der Stadt'
    );
  });

  // Plural terms
  it('genders Gemeinderäte', () => {
    expect(genderText('Gemeinderäte beschließen')).toBe(
      'Gemeinderät:innen beschließen'
    );
  });

  it('genders Stadträte', () => {
    expect(genderText('Stadträte im Stadtsenat')).toBe(
      'Stadträt:innen im Stadtsenat'
    );
  });

  it('genders Vizebürgermeistern (dative plural)', () => {
    expect(genderText('von den Vizebürgermeistern')).toBe(
      'von den Vizebürgermeister:innen'
    );
  });

  it('genders Bürgermeistern (dative plural)', () => {
    expect(genderText('von den Bürgermeistern')).toBe(
      'von den Bürgermeister:innen'
    );
  });

  it('genders Gemeinderäten (dative plural)', () => {
    expect(genderText('von den Gemeinderäten')).toBe(
      'von den Gemeinderät:innen'
    );
  });

  // Compound word protection — must NOT change
  it('does NOT change Gemeinderatsbeschluss', () => {
    expect(genderText('der Gemeinderatsbeschluss')).toBe(
      'der Gemeinderatsbeschluss'
    );
  });

  it('does NOT change Bürgermeisterwahl', () => {
    expect(genderText('Bürgermeisterwahl')).toBe('Bürgermeisterwahl');
  });

  it('does NOT change Bürgermeisteramt', () => {
    expect(genderText('das Bürgermeisteramt')).toBe('das Bürgermeisteramt');
  });

  it('does NOT change Gemeinderatssitzung', () => {
    expect(genderText('die Gemeinderatssitzung')).toBe('die Gemeinderatssitzung');
  });

  it('does NOT change Stadtratsbeschluss', () => {
    expect(genderText('Stadtratsbeschluss')).toBe('Stadtratsbeschluss');
  });

  // Stadtrat as organ stays unchanged
  it('does NOT change Stadtrat when referring to the organ', () => {
    expect(genderText('vom Stadtrat beschlossen')).toBe(
      'vom Stadtrat beschlossen'
    );
  });

  // Multiple occurrences
  it('handles multiple occurrences in same string', () => {
    const input = 'Bürgermeister und Gemeinderäte arbeiten zusammen';
    const expected = 'Bürgermeister:in und Gemeinderät:innen arbeiten zusammen';
    expect(genderText(input)).toBe(expected);
  });

  // Genitive
  it('handles genitive des Bürgermeisters', () => {
    expect(genderText('des Bürgermeisters')).toBe('des:der Bürgermeister:in');
  });

  // Dative singular
  it('handles dative dem Bürgermeister', () => {
    expect(genderText('dem Bürgermeister ist')).toBe(
      'dem:der Bürgermeister:in ist'
    );
  });

  // Accusative
  it('handles accusative den Bürgermeister', () => {
    expect(genderText('den Bürgermeister wählen')).toBe(
      'den:die Bürgermeister:in wählen'
    );
  });

  // Case at end of string
  it('handles term at end of string', () => {
    expect(genderText('Wahl des Bürgermeisters')).toBe(
      'Wahl des:der Bürgermeister:in'
    );
  });

  // Does not affect unrelated text
  it('does not change unrelated text', () => {
    expect(genderText('Das Wetter ist schön')).toBe('Das Wetter ist schön');
  });

  // Bürgermeister with period after (sentence end)
  it('handles term before punctuation', () => {
    expect(genderText('Das entscheidet der Bürgermeister.')).toBe(
      'Das entscheidet der:die Bürgermeister:in.'
    );
  });

  // Term at start of string (no preceding article)
  it('handles Bürgermeister at start without article', () => {
    expect(genderText('Bürgermeister leitet die Sitzung')).toBe(
      'Bürgermeister:in leitet die Sitzung'
    );
  });
});
