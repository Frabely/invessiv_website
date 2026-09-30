import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ONBOARDING_LIMITS as L } from "@invessiv/common/constants/crm/onboarding/onboarding-limits";
import {
  ONBOARDING_CHOICE_KEY_PATTERN_SOURCE,
  ONBOARDING_KEY_PATTERN_SOURCE,
} from "@invessiv/common/constants/crm/onboarding/onboarding-key-patterns";

const migration = readFileSync(
  path.resolve(__dirname, "../../../migrations/0047_create_onboarding.sql"),
  "utf8",
);

const EXPECTED_FRAGMENTS: readonly [string, string][] = [
  ["title", `length(title) <= ${L.titleMaxLength}`],
  [
    "template description",
    `length(description) <= ${L.templateDescriptionMaxLength}`,
  ],
  ["services note", `length(services_note) <= ${L.noteMaxLength}`],
  ["block intro", `length(intro) <= ${L.introMaxLength}`],
  ["field label", `length(label) <= ${L.labelMaxLength}`],
  ["field help", `length(help) <= ${L.helpMaxLength}`],
  ["choice label", `length(label) <= ${L.choiceLabelMaxLength}`],
  ["review note", `length(review_note) <= ${L.noteMaxLength}`],
  ["position", `position < ${L.storedPositionCeiling}`],
  ["choice position", `position < ${L.storedChoicePositionCeiling}`],
  ["sort order", `sort_order < ${L.storedPositionCeiling}`],
  ["max length", `max_length BETWEEN 1 AND ${L.storedValueMaxLength}`],
  ["min items", `min_items BETWEEN 0 AND ${L.storedItemCountCeiling}`],
  ["max items", `max_items BETWEEN 1 AND ${L.storedItemCountCeiling}`],
  ["answer value", `length(value) <= ${L.storedValueMaxLength}`],
  ["key pattern", `key ~ '${ONBOARDING_KEY_PATTERN_SOURCE}'`],
  ["choice key pattern", `key ~ '${ONBOARDING_CHOICE_KEY_PATTERN_SOURCE}'`],
];

describe("migration 0047 limits", () => {
  it.each(EXPECTED_FRAGMENTS)(
    "repeats the %s limit of the shared constants",
    (_name, fragment) => {
      expect(migration).toContain(fragment);
    },
  );
});
