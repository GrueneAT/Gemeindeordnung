/**
 * Gender-inclusive language utility using Doppelpunkt-Gendern.
 *
 * Applies Austrian Doppelpunkt-Gendern to common municipal terms.
 * Uses negative lookahead to protect compound words (e.g., Bürgermeisterwahl).
 *
 * Usage:
 *   import { genderText } from './gender.js';
 *   genderText("Der Bürgermeister leitet die Sitzung")
 *   // => "Der:die Bürgermeister:in leitet die Sitzung"
 */

/**
 * Apply Doppelpunkt-Gendern to a text string.
 * Replaces standalone municipal role terms with gender-inclusive forms.
 * Compound words (Bürgermeisterwahl, Gemeinderatsbeschluss) are preserved.
 *
 * @param {string|null|undefined} text - Input text
 * @returns {string} Text with gender-inclusive language applied
 */
export function genderText(text) {
  if (text == null) return '';
  if (text === '') return '';

  let result = text;

  // Word boundary end pattern: no alphanumeric, German chars, or colon following
  // The colon check prevents double-matching already-gendered terms (e.g., Bürgermeister:in)
  const END = '(?![a-zäöüßA-ZÄÖÜ:])';

  // === Article + noun patterns (must come first, longer matches first) ===

  // Genitive: des Bürgermeisters / des Vizebürgermeisters
  result = result.replace(
    new RegExp(`\\b(des)\\s+(Vizebürgermeisters)${END}`, 'g'),
    'des:der Vizebürgermeister:in'
  );
  result = result.replace(
    new RegExp(`\\b(des)\\s+(Bürgermeisters)${END}`, 'g'),
    'des:der Bürgermeister:in'
  );

  // Dative: dem Bürgermeister / dem Vizebürgermeister
  result = result.replace(
    new RegExp(`\\b(dem)\\s+(Vizebürgermeister)${END}`, 'g'),
    'dem:der Vizebürgermeister:in'
  );
  result = result.replace(
    new RegExp(`\\b(dem)\\s+(Bürgermeister)${END}`, 'g'),
    'dem:der Bürgermeister:in'
  );

  // Accusative: den Bürgermeister / den Vizebürgermeister
  result = result.replace(
    new RegExp(`\\b(den)\\s+(Vizebürgermeister)${END}`, 'g'),
    'den:die Vizebürgermeister:in'
  );
  result = result.replace(
    new RegExp(`\\b(den)\\s+(Bürgermeister)${END}`, 'g'),
    'den:die Bürgermeister:in'
  );

  // Nominative: der/Der Bürgermeister / der/Der Vizebürgermeister
  result = result.replace(
    new RegExp(`\\b([Dd]er)\\s+(Vizebürgermeister)${END}`, 'g'),
    (_, art) => `${art}:die Vizebürgermeister:in`
  );
  result = result.replace(
    new RegExp(`\\b([Dd]er)\\s+(Bürgermeister)${END}`, 'g'),
    (_, art) => `${art}:die Bürgermeister:in`
  );

  // === Plural/dative plural terms (longer first) ===

  // Vizebürgermeistern (dative plural) — before Bürgermeistern
  result = result.replace(
    new RegExp(`\\bVizebürgermeistern${END}`, 'g'),
    'Vizebürgermeister:innen'
  );

  // Bürgermeistern (dative plural)
  result = result.replace(
    new RegExp(`\\bBürgermeistern${END}`, 'g'),
    'Bürgermeister:innen'
  );

  // Gemeinderäten (dative plural)
  result = result.replace(
    new RegExp(`\\bGemeinderäten${END}`, 'g'),
    'Gemeinderät:innen'
  );

  // Gemeinderäte (plural)
  result = result.replace(
    new RegExp(`\\bGemeinderäte${END}`, 'g'),
    'Gemeinderät:innen'
  );

  // Stadträte (plural)
  result = result.replace(
    new RegExp(`\\bStadträte${END}`, 'g'),
    'Stadträt:innen'
  );

  // === Singular standalone terms (longer first) ===

  // Vizebürgermeister (before Bürgermeister to avoid partial match)
  result = result.replace(
    new RegExp(`\\bVizebürgermeister${END}`, 'g'),
    'Vizebürgermeister:in'
  );

  // Ehrenbürger
  result = result.replace(
    new RegExp(`\\bEhrenbürger${END}`, 'g'),
    'Ehrenbürger:innen'
  );

  // Gemeindebürger
  result = result.replace(
    new RegExp(`\\bGemeindebürger${END}`, 'g'),
    'Gemeindebürger:innen'
  );

  // Bürgermeister (standalone, not already gendered, not part of compound)
  result = result.replace(
    new RegExp(`\\bBürgermeister${END}`, 'g'),
    'Bürgermeister:in'
  );

  return result;
}
