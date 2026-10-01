import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";

const GERMAN_SPELLINGS: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};
const GERMAN_SPECIAL_LETTERS = /[äöüß]/g;
/** The accent marks that `normalize("NFKD")` splits off their letter: é becomes e plus a mark. */
const ACCENT_MARKS = /[\u0300-\u036f]/g;
const EVERYTHING_BUT_LETTERS_AND_DIGITS = /[^a-z0-9]+/g;
const UNDERSCORES_AT_BOTH_ENDS = /^_+|_+$/g;
const UNDERSCORES_AT_THE_END = /_+$/;
const STARTS_WITH_A_LETTER = /^[a-z]/;
/** A key must start with a letter, so a title like "2 Standorte" gets this in front. */
const LETTER_PREFIX = "f_";

/**
 * Turns a title into a key suggestion that satisfies `QUESTIONNAIRE_KEY_PATTERN_SOURCE` where
 * possible (`Logos & Corporate Design` → `logos_corporate_design`). Returns "" for text without
 * letters or digits; a single character stays too short and is left for the validation to report.
 */
export function suggestQuestionnaireKey(text: string): string {
  const germanSpelledOut = text
    .toLowerCase()
    .replace(
      GERMAN_SPECIAL_LETTERS,
      (letter) => GERMAN_SPELLINGS[letter] ?? letter,
    );
  const withoutAccents = germanSpelledOut
    .normalize("NFKD")
    .replace(ACCENT_MARKS, "");
  const words = withoutAccents
    .replace(EVERYTHING_BUT_LETTERS_AND_DIGITS, "_")
    .replace(UNDERSCORES_AT_BOTH_ENDS, "");
  if (!words) return "";

  const key = STARTS_WITH_A_LETTER.test(words)
    ? words
    : `${LETTER_PREFIX}${words}`;
  // Cutting to the maximum length can leave a separator at the end.
  return key
    .slice(0, QUESTIONNAIRE_LIMITS.keyMaxLength)
    .replace(UNDERSCORES_AT_THE_END, "");
}

/** The next free key: the suggestion itself, then `_2`, `_3` … */
export function nextFreeQuestionnaireKey(
  base: string,
  taken: ReadonlySet<string>,
): string {
  if (!taken.has(base)) return base;
  for (let suffix = 2; ; suffix += 1) {
    const tail = `_${suffix}`;
    const room = QUESTIONNAIRE_LIMITS.keyMaxLength - tail.length;
    const candidate = `${base.slice(0, room)}${tail}`;
    if (!taken.has(candidate)) return candidate;
  }
}
