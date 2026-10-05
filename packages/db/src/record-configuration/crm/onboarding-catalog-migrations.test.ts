import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES,
  QuestionnaireFieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS as L } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { QUESTIONNAIRE_SCALE_CHOICE_KEY_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-scale-choice-keys";
import { QUESTIONNAIRE_YES_NO_CHOICE_KEY_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-yes-no-choice-keys";

type Row = (string | null)[];

const LOCALES = ["de", "en"];

/** Splits one `(…)` row into its values; quoted strings may contain commas and doubled quotes. */
function parseRow(line: string): Row {
  const body = line.slice(line.indexOf("(") + 1, line.lastIndexOf(")"));
  const values: Row = [];
  let index = 0;
  while (index < body.length) {
    if (body[index] === "'") {
      let text = "";
      index += 1;
      while (index < body.length) {
        if (body[index] === "'" && body[index + 1] === "'") {
          text += "'";
          index += 2;
        } else if (body[index] === "'") {
          index += 1;
          break;
        } else {
          text += body[index];
          index += 1;
        }
      }
      values.push(text);
    } else {
      const depthEnd = body.startsWith("ARRAY[", index)
        ? body.indexOf("::TEXT[]", index) + "::TEXT[]".length
        : index;
      const comma = body.indexOf(",", depthEnd);
      const end = comma === -1 ? body.length : comma;
      const raw = body.slice(index, end).trim();
      values.push(raw === "NULL" ? null : raw);
      index = end;
    }
    while (body[index] === "," || body[index] === " ") index += 1;
  }
  return values;
}

/** Reads a catalog migration: one multi-row `INSERT` per table and round. */
function readCatalog(fileName: string) {
  const sql = readFileSync(
    path.resolve(__dirname, "../../../migrations", fileName),
    "utf8",
  );
  const rowsOf = (table: string): Row[] =>
    sql
      .split(/^-->\s*statement-breakpoint\s*$/m)
      .filter((statement) => statement.includes(`INSERT INTO ${table} (`))
      .flatMap((statement) =>
        statement
          .slice(statement.indexOf("VALUES"))
          .split("\n")
          .filter((line) => /^(VALUES|\s+)\s*\('/.test(line))
          .map(parseRow),
      );

  return {
    sql,
    rowsOf,
    blocks: rowsOf("questionnaire_blocks").map(([id, , , key]) => ({
      id: id!,
      key: key!,
    })),
    fields: rowsOf("questionnaire_fields").map((row) => ({
      id: row[0]!,
      blockId: row[1]!,
      parentId: row[2],
      key: row[3]!,
      position: Number(row[4]),
      type: row[5]!,
      requirement: row[6]!,
      minItems: row[8] === null ? null : Number(row[8]),
      maxItems: row[9] === null ? null : Number(row[9]),
      conditionFieldId: row[12],
      conditionChoiceId: row[13],
    })),
    choices: rowsOf("questionnaire_field_choices").map((row) => ({
      id: row[0]!,
      fieldId: row[1]!,
      key: row[2]!,
    })),
    blockTexts: rowsOf("questionnaire_block_translations"),
    fieldTexts: rowsOf("questionnaire_field_translations"),
    choiceTexts: rowsOf("questionnaire_choice_translations"),
  };
}

function localesOf(texts: Row[], id: string): string[] {
  return texts
    .filter((row) => row[0] === id)
    .map((row) => row[1]!)
    .sort();
}

const standard = readCatalog("0052_replace_onboarding_standard_catalog.sql");
const extra = readCatalog("0053_add_onboarding_extra_catalog_blocks.sql");

const EXTRA_BLOCK_KEYS = [
  "blog_news",
  "careers",
  "products_pricing",
  "events",
  "downloads",
  "newsletter",
  "inquiry_forms",
  "campaign_ads",
  "languages",
];

// A further catalog migration joins this list and inherits every rule below.
describe.each([
  ["0052 standard catalog", standard],
  ["0053 extra catalog blocks", extra],
])("catalog migration %s", (_name, catalog) => {
  const { blocks, fields, choices, blockTexts, fieldTexts, choiceTexts } =
    catalog;
  const choiceKeysOf = (fieldId: string): string[] =>
    choices
      .filter((choice) => choice.fieldId === fieldId)
      .map((choice) => choice.key);

  it("translates every block, field and option into both locales", () => {
    for (const block of blocks)
      expect(localesOf(blockTexts, block.id), block.key).toEqual(LOCALES);
    for (const field of fields)
      expect(localesOf(fieldTexts, field.id), field.key).toEqual(LOCALES);
    for (const choice of choices)
      expect(localesOf(choiceTexts, choice.id), choice.key).toEqual(LOCALES);
  });

  it("keeps texts within the shared limits", () => {
    for (const [, , title, intro] of blockTexts) {
      expect(title!.length).toBeLessThanOrEqual(L.titleMaxLength);
      expect((intro ?? "").length).toBeLessThanOrEqual(L.introMaxLength);
    }
    for (const [, , label, help] of fieldTexts) {
      expect(label!.length).toBeLessThanOrEqual(L.labelMaxLength);
      expect((help ?? "").length).toBeLessThanOrEqual(L.helpMaxLength);
    }
    for (const [, , label] of choiceTexts)
      expect(label!.length).toBeLessThanOrEqual(L.choiceLabelMaxLength);
  });

  it("keeps field counts and item limits within the shared limits", () => {
    const ceilings: Record<string, number> = {
      [QuestionnaireFieldType.Files]: L.filesPerField,
      [QuestionnaireFieldType.Group]: L.groupEntriesPerField,
    };
    for (const block of blocks) {
      const own = fields.filter((field) => field.blockId === block.id);
      expect(own.length, block.key).toBeLessThanOrEqual(L.fieldsPerBlock);
      expect(new Set(own.map((field) => field.key)).size, block.key).toBe(
        own.length,
      );
    }
    for (const field of fields) {
      const ceiling = ceilings[field.type];
      if (ceiling !== undefined)
        expect(
          Math.max(field.minItems ?? 0, field.maxItems ?? 0),
          field.key,
        ).toBeLessThanOrEqual(ceiling);
      expect(choiceKeysOf(field.id).length, field.key).toBeLessThanOrEqual(
        L.choicesPerField,
      );
    }
  });

  it("gives yes/no and scale fields their fixed options and every other choice field at least two", () => {
    for (const field of fields) {
      const keys = choiceKeysOf(field.id);
      if (field.type === QuestionnaireFieldType.YesNo)
        expect(keys, field.key).toEqual([
          ...QUESTIONNAIRE_YES_NO_CHOICE_KEY_VALUES,
        ]);
      else if (field.type === QuestionnaireFieldType.Scale)
        expect(keys, field.key).toEqual([
          ...QUESTIONNAIRE_SCALE_CHOICE_KEY_VALUES,
        ]);
      else if (
        field.type === QuestionnaireFieldType.Choice ||
        field.type === QuestionnaireFieldType.MultiChoice
      )
        expect(keys.length, field.key).toBeGreaterThanOrEqual(2);
      else expect(keys, field.key).toEqual([]);
    }
  });

  it("points every condition at an earlier trigger on the same level of the same block", () => {
    const conditional = fields.filter(
      (field) => field.conditionFieldId !== null,
    );
    expect(conditional.length).toBeGreaterThan(0);
    for (const field of conditional) {
      const trigger = fields.find(
        (candidate) => candidate.id === field.conditionFieldId,
      );
      expect(trigger, field.key).toBeDefined();
      expect(trigger!.blockId).toBe(field.blockId);
      expect(trigger!.parentId).toBe(field.parentId);
      expect(trigger!.position).toBeLessThan(field.position);
      expect(QUESTIONNAIRE_CONDITION_TRIGGER_TYPE_VALUES).toContain(
        trigger!.type,
      );
      expect(
        choices.some(
          (choice) =>
            choice.id === field.conditionChoiceId &&
            choice.fieldId === trigger!.id,
        ),
        field.key,
      ).toBe(true);
    }
  });

  it("nests groups exactly one level deep", () => {
    for (const field of fields.filter((child) => child.parentId !== null)) {
      const parent = fields.find(
        (candidate) => candidate.id === field.parentId,
      );
      expect(parent?.type, field.key).toBe(QuestionnaireFieldType.Group);
      expect(parent?.parentId, field.key).toBeNull();
      expect(field.type).not.toBe(QuestionnaireFieldType.Group);
    }
  });
});

describe("migration 0052 standard catalog", () => {
  const BLOCK_COUNT = 22;
  const templateBlocks = standard.rowsOf("questionnaire_template_blocks");

  it("removes templates before the catalog blocks they restrict", () => {
    const templates = standard.sql.indexOf(
      "DELETE FROM questionnaire_templates;",
    );
    const catalogBlocks = standard.sql.indexOf(
      "DELETE FROM questionnaire_blocks WHERE owner_form_id IS NULL;",
    );
    expect(templates).toBeGreaterThanOrEqual(0);
    expect(catalogBlocks).toBeGreaterThan(templates);
  });

  it("ships the agreed blocks with unique keys and one template listing all of them in order", () => {
    const { blocks } = standard;
    expect(blocks).toHaveLength(BLOCK_COUNT);
    expect(new Set(blocks.map((block) => block.key)).size).toBe(BLOCK_COUNT);
    expect(standard.rowsOf("questionnaire_templates")).toHaveLength(1);
    expect(templateBlocks.map((row) => row[1])).toEqual(
      blocks.map((block) => block.id),
    );
    expect(templateBlocks.map((row) => Number(row[2]))).toEqual(
      blocks.map((_block, index) => index),
    );
  });
});

describe("migration 0053 extra catalog blocks", () => {
  it("ships the agreed blocks in the agreed order", () => {
    expect(extra.blocks.map((block) => block.key)).toEqual(EXTRA_BLOCK_KEYS);
  });

  it("reuses neither a block key nor an id of the standard catalog", () => {
    const standardKeys = new Set(standard.blocks.map((block) => block.key));
    const standardIds = new Set(
      [...standard.blocks, ...standard.fields, ...standard.choices].map(
        (row) => row.id,
      ),
    );
    for (const block of extra.blocks)
      expect(standardKeys.has(block.key), block.key).toBe(false);
    for (const row of [...extra.blocks, ...extra.fields, ...extra.choices])
      expect(standardIds.has(row.id), row.key).toBe(false);
  });

  it("only adds rows and leaves every template untouched", () => {
    expect(extra.sql).not.toMatch(/^\s*(DELETE|UPDATE|ALTER|DROP)\b/m);
    expect(extra.sql).not.toContain("questionnaire_templates");
    expect(extra.sql).not.toContain("questionnaire_template_blocks");
  });

  it("asks at most one required question on the top level of a block", () => {
    for (const block of extra.blocks) {
      const unconditional = extra.fields.filter(
        (field) =>
          field.blockId === block.id &&
          field.parentId === null &&
          field.conditionFieldId === null &&
          field.requirement === "required",
      );
      expect(unconditional.length, block.key).toBeLessThanOrEqual(1);
    }
  });
});
