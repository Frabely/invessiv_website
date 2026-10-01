import type { Locale } from "@invessiv/common";
import type { QuestionnaireBlockDto } from "../../../contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "../../../contracts/crm/questionnaire/questionnaire-field.dto";
import type { QuestionnaireResolvedBlock } from "../../../contracts/crm/questionnaire/questionnaire-resolved-block";
import type { QuestionnaireResolvedField } from "../../../contracts/crm/questionnaire/questionnaire-resolved-field";
import { resolveQuestionnaireText } from "./questionnaire-translation";

/** Resolves texts for one block and remembers the first locale a text fell back to. */
function createResolver(locale: Locale) {
  let fallbackLocale: Locale | null = null;
  return {
    resolve<T>(translations: Partial<Record<Locale, T>>): T | null {
      const resolved = resolveQuestionnaireText(translations, locale);
      if (resolved?.isFallback) fallbackLocale ??= resolved.locale;
      return resolved?.text ?? null;
    },
    fallbackLocale: () => fallbackLocale,
  };
}

function resolveField(
  field: QuestionnaireFieldDto,
  texts: ReturnType<typeof createResolver>,
): QuestionnaireResolvedField {
  const translation = texts.resolve(field.translations);
  return {
    id: field.id,
    blockId: field.blockId,
    parentFieldId: field.parentFieldId,
    position: field.position,
    type: field.type,
    requirement: field.requirement,
    maxLength: field.maxLength,
    minItems: field.minItems,
    maxItems: field.maxItems,
    acceptedAssetKinds: field.acceptedAssetKinds,
    conditionFieldId: field.conditionFieldId,
    conditionChoiceId: field.conditionChoiceId,
    label: translation?.label ?? "",
    help: translation?.help ?? null,
    choices: field.choices.map((choice) => ({
      id: choice.id,
      position: choice.position,
      label: texts.resolve(choice.labels) ?? "",
    })),
    children: field.children.map((child) => resolveField(child, texts)),
  };
}

/**
 * A block as one reader sees it: every text in the preferred locale, otherwise in the first
 * maintained one. Keys, versions, pre-fill sources and the other locales are left out, so the
 * result is safe to hand to the portal. Portal form and internal read view both start here.
 */
export function resolveQuestionnaireBlock(
  block: QuestionnaireBlockDto,
  locale: Locale,
): QuestionnaireResolvedBlock {
  const texts = createResolver(locale);
  const translation = texts.resolve(block.translations);
  const fields = block.fields.map((field) => resolveField(field, texts));
  return {
    id: block.id,
    title: translation?.title ?? "",
    intro: translation?.intro ?? null,
    fallbackLocale: texts.fallbackLocale(),
    fields,
  };
}
