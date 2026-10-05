import type { ReactNode } from "react";
import type { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireResolvedBlock } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-block";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-template-read-view.module.css";

type TemplateTexts = Pick<
  CrmQuestionnaireDictionary["templateEditor"]["preview"],
  | "maxLength"
  | "minItems"
  | "maxItems"
  | "acceptedKinds"
  | "options"
  | "condition"
  | "required"
> & {
  fieldTypes: CrmQuestionnaireDictionary["fieldTypes"];
  assetKinds: Partial<Record<AssetKind, string>>;
};

export type OnboardingTemplateReadViewProps = {
  blocks: readonly QuestionnaireResolvedBlock[];
  emptyText?: string;
  texts: TemplateTexts;
};

export function OnboardingTemplateReadView({
  blocks,
  emptyText,
  texts,
}: OnboardingTemplateReadViewProps) {
  if (blocks.length === 0)
    return emptyText ? <p className={styles.empty}>{emptyText}</p> : null;

  function rows(fields: readonly QuestionnaireResolvedField[]): ReactNode {
    return fields.map((field) => {
      const trigger = fields.find((item) => item.id === field.conditionFieldId);
      const choice = trigger?.choices.find(
        (item) => item.id === field.conditionChoiceId,
      );
      const limits: string[] = [];
      if (
        field.type === QuestionnaireFieldType.ShortText ||
        field.type === QuestionnaireFieldType.LongText
      )
        limits.push(
          formatMessage(texts.maxLength, {
            count:
              field.maxLength ??
              (field.type === QuestionnaireFieldType.ShortText
                ? QUESTIONNAIRE_LIMITS.shortTextDefaultMaxLength
                : QUESTIONNAIRE_LIMITS.longTextDefaultMaxLength),
          }),
        );
      if (field.minItems != null)
        limits.push(formatMessage(texts.minItems, { count: field.minItems }));
      if (field.maxItems != null)
        limits.push(formatMessage(texts.maxItems, { count: field.maxItems }));
      if (field.acceptedAssetKinds?.length)
        limits.push(
          formatMessage(texts.acceptedKinds, {
            kinds: field.acceptedAssetKinds
              .map((kind) => texts.assetKinds[kind] ?? kind)
              .join(", "),
          }),
        );
      if (field.choices.length)
        limits.push(
          formatMessage(texts.options, {
            options: field.choices
              .map((item) => item.label)
              .join(field.type === QuestionnaireFieldType.Scale ? " – " : ", "),
          }),
        );

      return (
        <div className={styles.field} key={field.id}>
          <dt className={styles.label}>
            {field.label}
            {field.requirement === QuestionnaireFieldRequirement.Required ? (
              <abbr className={styles.required} title={texts.required}>
                *
              </abbr>
            ) : null}
          </dt>
          <dd className={styles.value}>
            <span className={styles.type}>
              {texts.fieldTypes[field.type]}
              {limits.length ? ` · ${limits.join(" · ")}` : ""}
            </span>
            {field.help ? <p className={styles.help}>{field.help}</p> : null}
            {trigger && choice ? (
              <p className={styles.condition}>
                {formatMessage(texts.condition, {
                  trigger: trigger.label,
                  choice: choice.label,
                })}
              </p>
            ) : null}
            {field.type === QuestionnaireFieldType.Group &&
            field.children.length ? (
              <dl className={styles.children}>{rows(field.children)}</dl>
            ) : null}
          </dd>
        </div>
      );
    });
  }

  return (
    <div className={styles.view}>
      {blocks.map((block) => (
        <section
          className={styles.block}
          data-block-id={block.id}
          key={block.id}
        >
          <h3 className={styles.title}>{block.title}</h3>
          {block.intro ? <p className={styles.help}>{block.intro}</p> : null}
          <dl className={styles.fields}>{rows(block.fields)}</dl>
        </section>
      ))}
    </div>
  );
}
