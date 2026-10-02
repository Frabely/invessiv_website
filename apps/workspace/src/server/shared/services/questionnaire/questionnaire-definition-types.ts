import type {
  questionnaireBlocks,
  questionnaireBlockTranslations,
  questionnaireChoiceTranslations,
  questionnaireFieldChoices,
  questionnaireFields,
  questionnaireFieldTranslations,
  questionnaireTemplates,
} from "@invessiv/db/record-configuration";

export type QuestionnaireBlockRow = typeof questionnaireBlocks.$inferSelect;
export type QuestionnaireBlockTranslationRow =
  typeof questionnaireBlockTranslations.$inferSelect;
export type QuestionnaireFieldRow = typeof questionnaireFields.$inferSelect;
export type QuestionnaireFieldTranslationRow =
  typeof questionnaireFieldTranslations.$inferSelect;
export type QuestionnaireChoiceRow =
  typeof questionnaireFieldChoices.$inferSelect;
export type QuestionnaireChoiceTranslationRow =
  typeof questionnaireChoiceTranslations.$inferSelect;
export type QuestionnaireTemplateRow =
  typeof questionnaireTemplates.$inferSelect;

/** Everything that makes up the definitions of a set of blocks, loaded in one batch. */
export type QuestionnaireDefinitionRows = {
  blocks: QuestionnaireBlockRow[];
  blockTranslations: QuestionnaireBlockTranslationRow[];
  fields: QuestionnaireFieldRow[];
  fieldTranslations: QuestionnaireFieldTranslationRow[];
  choices: QuestionnaireChoiceRow[];
  choiceTranslations: QuestionnaireChoiceTranslationRow[];
};

/** Who owns a block: null is the catalog, otherwise the id of the one form it belongs to. */
export type QuestionnaireBlockOwner = string | null;
