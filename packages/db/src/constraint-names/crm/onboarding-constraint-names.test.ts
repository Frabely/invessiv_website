import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getTableConfig, PgDialect, type PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import { SUPPORTED_LOCALES } from "@invessiv/common/contracts/i18n/locale";
import {
  onboardingAnswerFiles,
  onboardingAnswers,
  questionnaireBlocks,
  questionnaireBlockTranslations,
  questionnaireChoiceTranslations,
  questionnaireFieldChoices,
  questionnaireFields,
  questionnaireFieldTranslations,
  onboardingFormBlocks,
  onboardingForms,
  onboardingFormServices,
  onboardingGroupEntries,
  questionnaireTemplateBlocks,
  questionnaireTemplates,
} from "@invessiv/db";
import { OnboardingAnswerFilesConstraintName } from "./onboarding-answer-files-constraint-names";
import { OnboardingAnswersConstraintName } from "./onboarding-answers-constraint-names";
import { QuestionnaireBlockTranslationsConstraintName } from "./questionnaire-block-translations-constraint-names";
import { QuestionnaireBlocksConstraintName } from "./questionnaire-blocks-constraint-names";
import { QuestionnaireChoiceTranslationsConstraintName } from "./questionnaire-choice-translations-constraint-names";
import { QuestionnaireFieldChoicesConstraintName } from "./questionnaire-field-choices-constraint-names";
import { QuestionnaireFieldTranslationsConstraintName } from "./questionnaire-field-translations-constraint-names";
import { QuestionnaireFieldsConstraintName } from "./questionnaire-fields-constraint-names";
import { OnboardingFormBlocksConstraintName } from "./onboarding-form-blocks-constraint-names";
import { OnboardingFormServicesConstraintName } from "./onboarding-form-services-constraint-names";
import { OnboardingFormsConstraintName } from "./onboarding-forms-constraint-names";
import { OnboardingGroupEntriesConstraintName } from "./onboarding-group-entries-constraint-names";
import { QuestionnaireTemplateBlocksConstraintName } from "./questionnaire-template-blocks-constraint-names";
import { QuestionnaireTemplatesConstraintName } from "./questionnaire-templates-constraint-names";

vi.mock("server-only", () => ({}));

const migration = readFileSync(
  resolve(process.cwd(), "migrations", "0047_create_onboarding.sql"),
  "utf8",
);

const TABLES: [PgTable, Record<string, string>][] = [
  [questionnaireTemplates, QuestionnaireTemplatesConstraintName],
  [onboardingForms, OnboardingFormsConstraintName],
  [questionnaireBlocks, QuestionnaireBlocksConstraintName],
  [
    questionnaireBlockTranslations,
    QuestionnaireBlockTranslationsConstraintName,
  ],
  [questionnaireFields, QuestionnaireFieldsConstraintName],
  [
    questionnaireFieldTranslations,
    QuestionnaireFieldTranslationsConstraintName,
  ],
  [questionnaireFieldChoices, QuestionnaireFieldChoicesConstraintName],
  [
    questionnaireChoiceTranslations,
    QuestionnaireChoiceTranslationsConstraintName,
  ],
  [questionnaireTemplateBlocks, QuestionnaireTemplateBlocksConstraintName],
  [onboardingFormBlocks, OnboardingFormBlocksConstraintName],
  [onboardingGroupEntries, OnboardingGroupEntriesConstraintName],
  [onboardingAnswers, OnboardingAnswersConstraintName],
  [onboardingAnswerFiles, OnboardingAnswerFilesConstraintName],
  [onboardingFormServices, OnboardingFormServicesConstraintName],
];

function tableSection(tableName: string): string {
  const start = migration.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
  if (start < 0)
    throw new Error(`Table ${tableName} is missing in migration 0047`);
  const end = migration.indexOf("\n);", start);
  return migration.slice(start, end);
}

describe("onboarding models", () => {
  it.each([
    [
      questionnaireBlockTranslations,
      QuestionnaireBlockTranslationsConstraintName,
    ],
    [
      questionnaireFieldTranslations,
      QuestionnaireFieldTranslationsConstraintName,
    ],
    [
      questionnaireChoiceTranslations,
      QuestionnaireChoiceTranslationsConstraintName,
    ],
  ] as const)(
    "keeps locale values aligned between the translation model, migration and supported locales (%#)",
    (table, names) => {
      const configuration = getTableConfig(table);
      const constraint = configuration.checks.find(
        (check) => check.name === names.LocaleCheck,
      );
      expect(constraint).toBeDefined();
      const modelSql = new PgDialect().sqlToQuery(constraint!.value).sql;
      const migrationCheck = tableSection(configuration.name).match(
        new RegExp(
          `CONSTRAINT ${names.LocaleCheck} CHECK \\(locale IN \\(([^)]+)\\)\\)`,
        ),
      );
      expect(migrationCheck).not.toBeNull();
      const expected = [...SUPPORTED_LOCALES].sort();
      for (const sql of [modelSql, migrationCheck![1]]) {
        const locales = [...sql.matchAll(/'([^']*)'/g)].map(
          (match) => match[1],
        );
        expect(locales.sort()).toEqual(expected);
      }
      expect([...table.locale.enumValues!].sort()).toEqual(expected);
    },
  );

  it.each(
    TABLES.map(
      ([table, names]) => [getTableConfig(table).name, table, names] as const,
    ),
  )(
    "keeps %s aligned with its constraint names and migration 0047",
    (tableName, table, constraintNames) => {
      const configuration = getTableConfig(table);
      const names = [
        ...configuration.checks.map((check) => check.name),
        ...configuration.foreignKeys.map((key) => key.getName()),
        ...configuration.uniqueConstraints.map((unique) => unique.getName()),
        ...configuration.indexes.map((index) => index.config.name),
        ...configuration.primaryKeys.map((key) => key.getName()),
      ];
      expect(names.sort()).toEqual(Object.values(constraintNames).sort());
      expect(new Set(names).size).toBe(names.length);
      for (const name of names as string[]) {
        expect(name.startsWith(`${tableName}_`)).toBe(true);
        expect(migration).toContain(name);
      }
      const section = tableSection(tableName);
      for (const column of configuration.columns) {
        const definition = new RegExp(
          `\\n\\s+${column.name} [A-Z]+(\\[\\])?${column.notNull ? " (NOT NULL|PRIMARY KEY)" : ","}`,
        );
        expect(section, column.name).toMatch(definition);
        expect(column.hasDefault).toBe(
          ["created_at", "updated_at"].includes(column.name),
        );
      }
    },
  );

  it("covers every onboarding table of the migration", () => {
    const created = [
      ...migration.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g),
    ].map((match) => match[1]);
    expect(created.sort()).toEqual(
      TABLES.map(([table]) => getTableConfig(table).name).sort(),
    );
  });
});
