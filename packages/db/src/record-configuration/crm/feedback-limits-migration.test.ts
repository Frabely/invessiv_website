import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";

const migration = readFileSync(
  path.resolve(
    __dirname,
    "../../../migrations/0045_create_feedback_rounds.sql",
  ),
  "utf8",
);

const EXPECTED_CHECKS: readonly [string, string][] = [
  [
    "round number",
    `round_number BETWEEN 1 AND ${FEEDBACK_LIMITS.roundsPerProject}`,
  ],
  [
    "preview url",
    `length(preview_url) <= ${FEEDBACK_LIMITS.previewUrlMaxLength}`,
  ],
  [
    "handover note",
    `length(handover_note) <= ${FEEDBACK_LIMITS.noteMaxLength}`,
  ],
  [
    "customer notice",
    `length(customer_notice) <= ${FEEDBACK_LIMITS.noteMaxLength}`,
  ],
  ["result note", `length(result_note) <= ${FEEDBACK_LIMITS.noteMaxLength}`],
  [
    "area options",
    `cardinality(area_options) <= ${FEEDBACK_LIMITS.areasPerProject}`,
  ],
  [
    "project areas",
    `cardinality(feedback_areas) <= ${FEEDBACK_LIMITS.areasPerProject}`,
  ],
  ["item position", `position < ${FEEDBACK_LIMITS.itemsPerRound}`],
  ["area label", `length(area_label) <= ${FEEDBACK_LIMITS.areaLabelMaxLength}`],
  ["item body", `length(body) <= ${FEEDBACK_LIMITS.itemBodyMaxLength}`],
];

describe("migration 0045 limits", () => {
  it.each(EXPECTED_CHECKS)(
    "repeats the %s limit of FEEDBACK_LIMITS",
    (_name, fragment) => {
      expect(migration).toContain(fragment);
    },
  );
});
