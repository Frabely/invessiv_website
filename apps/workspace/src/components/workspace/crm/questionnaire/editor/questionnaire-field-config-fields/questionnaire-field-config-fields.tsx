"use client";

import { QUESTIONNAIRE_ACCEPTED_ASSET_KIND_VALUES } from "@invessiv/common/constants/crm/questionnaire/questionnaire-accepted-asset-kinds";
import {
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnairePrefillSource } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { CustomSelect, FormField } from "@invessiv/ui";
import type { QuestionnaireFieldFormErrors } from "@/common/contracts/crm/questionnaire/questionnaire-field-form-errors";
import type { QuestionnaireFieldFormValues } from "@/common/contracts/crm/questionnaire/questionnaire-field-form-values";
import {
  hasQuestionnaireItemCount,
  hasQuestionnaireLengthLimit,
  questionnairePrefillSourcesFor,
} from "@/common/patterns/crm/questionnaire/questionnaire-field-form";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireCheckboxField } from "../questionnaire-checkbox-field/questionnaire-checkbox-field";
import styles from "./questionnaire-field-config-fields.module.css";

export type QuestionnaireFieldConfigFieldsProps = {
  content: CrmQuestionnaireDictionary;
  errors: QuestionnaireFieldFormErrors;
  onChangeAction: (patch: Partial<QuestionnaireFieldFormValues>) => void;
  values: QuestionnaireFieldFormValues;
};

const NO_PREFILL = "";

const DEFAULT_MAX_LENGTH: Partial<Record<FieldType, number>> = {
  [QuestionnaireFieldType.ShortText]:
    QUESTIONNAIRE_LIMITS.shortTextDefaultMaxLength,
  [QuestionnaireFieldType.LongText]:
    QUESTIONNAIRE_LIMITS.longTextDefaultMaxLength,
};

/** Shows exactly the settings of the chosen type; nothing of another type is ever visible. */
export function QuestionnaireFieldConfigFields({
  content,
  errors,
  onChangeAction,
  values,
}: QuestionnaireFieldConfigFieldsProps) {
  const text = content.editor.fieldDialog;
  const validation = content.catalog.validation;
  const prefillSources = questionnairePrefillSourcesFor(values.type);
  const itemHint =
    values.type === QuestionnaireFieldType.Files ||
    values.type === QuestionnaireFieldType.Group ||
    values.type === QuestionnaireFieldType.MultiChoice
      ? text.itemsHint[values.type]
      : undefined;

  const showsAnything =
    hasQuestionnaireLengthLimit(values.type) ||
    hasQuestionnaireItemCount(values.type) ||
    values.type === QuestionnaireFieldType.Files ||
    prefillSources.length > 0;
  if (!showsAnything) return null;

  return (
    <fieldset className={styles.config}>
      <legend className={styles.legend}>{text.config}</legend>
      {hasQuestionnaireLengthLimit(values.type) ? (
        <FormField
          errorMessage={
            errors.maxLength ? validation[errors.maxLength] : undefined
          }
          hint={formatMessage(text.maxLengthHint, {
            count: DEFAULT_MAX_LENGTH[values.type] ?? "",
          })}
          inputProps={{
            inputMode: "numeric",
            name: "questionnaire-field-max-length",
            onChange: (event) =>
              onChangeAction({ maxLength: event.target.value }),
            value: values.maxLength,
          }}
          kind={FormFieldKind.Text}
          label={text.maxLength}
        />
      ) : null}
      {hasQuestionnaireItemCount(values.type) ? (
        <div className={styles.pair}>
          <FormField
            errorMessage={
              errors.minItems ? validation[errors.minItems] : undefined
            }
            hint={itemHint}
            inputProps={{
              inputMode: "numeric",
              name: "questionnaire-field-min-items",
              onChange: (event) =>
                onChangeAction({ minItems: event.target.value }),
              value: values.minItems,
            }}
            kind={FormFieldKind.Text}
            label={text.minItems}
          />
          <FormField
            errorMessage={
              errors.maxItems ? validation[errors.maxItems] : undefined
            }
            inputProps={{
              inputMode: "numeric",
              name: "questionnaire-field-max-items",
              onChange: (event) =>
                onChangeAction({ maxItems: event.target.value }),
              value: values.maxItems,
            }}
            kind={FormFieldKind.Text}
            label={text.maxItems}
          />
        </div>
      ) : null}
      {values.type === QuestionnaireFieldType.Files ? (
        <fieldset className={styles.kinds}>
          <legend className={styles.subLegend}>{text.acceptedKinds}</legend>
          <p className={styles.hint}>{text.acceptedKindsHint}</p>
          <div className={styles.kindOptions}>
            {QUESTIONNAIRE_ACCEPTED_ASSET_KIND_VALUES.map((kind) => (
              <QuestionnaireCheckboxField
                checked={values.acceptedAssetKinds.includes(kind)}
                key={kind}
                label={content.assetKinds[kind]}
                onChangeAction={(checked) =>
                  onChangeAction({
                    acceptedAssetKinds: checked
                      ? QUESTIONNAIRE_ACCEPTED_ASSET_KIND_VALUES.filter(
                          (candidate) =>
                            candidate === kind ||
                            values.acceptedAssetKinds.includes(candidate),
                        )
                      : values.acceptedAssetKinds.filter(
                          (candidate) => candidate !== kind,
                        ),
                  })
                }
              />
            ))}
          </div>
        </fieldset>
      ) : null}
      {prefillSources.length > 0 ? (
        <FormField
          hint={text.prefillHint}
          kind={FormFieldKind.Custom}
          label={text.prefill}
          renderControl={({ describedBy, id }) => (
            <CustomSelect
              describedBy={describedBy}
              id={id}
              onChange={(next) =>
                onChangeAction({
                  prefillSource:
                    prefillSources.find((source) => source === next) ?? null,
                })
              }
              options={[
                { label: text.prefillNone, value: NO_PREFILL },
                ...prefillSources.map((source: QuestionnairePrefillSource) => ({
                  label: content.prefillSources[source],
                  value: source,
                })),
              ]}
              value={values.prefillSource ?? NO_PREFILL}
            />
          )}
        />
      ) : null}
    </fieldset>
  );
}
