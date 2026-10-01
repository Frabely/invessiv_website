"use client";

import { type SubmitEvent, useId, useRef, useState } from "react";
import {
  QUESTIONNAIRE_FIELD_TYPE_VALUES,
  QUESTIONNAIRE_GROUP_CHILD_EXCLUDED_TYPE_VALUES,
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { DialogSize } from "@invessiv/common/constants/ui/dialog-sizes";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import {
  SUPPORTED_LOCALES,
  type Locale,
} from "@invessiv/common/contracts/i18n/locale";
import {
  flattenQuestionnaireFields,
  resolveQuestionnaireCondition,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { CustomSelect, FormDialog, FormField } from "@invessiv/ui";
import type { QuestionnaireFieldFormErrors } from "@/common/contracts/crm/questionnaire/questionnaire-field-form-errors";
import type { QuestionnaireFieldFormValues } from "@/common/contracts/crm/questionnaire/questionnaire-field-form-values";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import {
  changeQuestionnaireFieldType,
  createQuestionnaireFieldFormValues,
  hasQuestionnaireChoices,
  validateQuestionnaireFieldForm,
  withQuestionnaireFieldLabel,
} from "@/common/patterns/crm/questionnaire/questionnaire-field-form";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireCheckboxField } from "../questionnaire-checkbox-field/questionnaire-checkbox-field";
import { QuestionnaireChoiceEditor } from "../questionnaire-choice-editor/questionnaire-choice-editor";
import { QuestionnaireConditionSelect } from "../questionnaire-condition-select/questionnaire-condition-select";
import { QuestionnaireFieldConfigFields } from "../questionnaire-field-config-fields/questionnaire-field-config-fields";
import { QuestionnaireLocaleTabs } from "../questionnaire-locale-tabs/questionnaire-locale-tabs";
import styles from "./questionnaire-field-dialog.module.css";

export type QuestionnaireFieldDialogProps = {
  /** The current block; after a conflict it is the fresh one, so candidates and version are right. */
  block: QuestionnaireBlockDto;
  busy: boolean;
  conflict: boolean;
  content: CrmQuestionnaireDictionary;
  failure: QuestionnaireErrorCode | null;
  /** Null creates a field; the type is chosen here and fixed afterwards. */
  field: QuestionnaireFieldDto | null;
  fixedChoiceLabels: QuestionnaireFixedChoiceLabels;
  locale: Locale;
  onCloseAction: () => void;
  onSubmitAction: (values: QuestionnaireFieldFormValues) => void;
  parentFieldId: string | null;
};

function typesFor(
  block: QuestionnaireBlockDto,
  parentFieldId: string | null,
): FieldType[] {
  const hasServices = flattenQuestionnaireFields(block.fields).some(
    (field) => field.type === QuestionnaireFieldType.ProjectServices,
  );
  return QUESTIONNAIRE_FIELD_TYPE_VALUES.filter(
    (type) =>
      !(
        parentFieldId !== null &&
        (
          QUESTIONNAIRE_GROUP_CHILD_EXCLUDED_TYPE_VALUES as readonly string[]
        ).includes(type)
      ) && !(hasServices && type === QuestionnaireFieldType.ProjectServices),
  );
}

export function QuestionnaireFieldDialog({
  block,
  busy,
  conflict,
  content,
  failure,
  field,
  fixedChoiceLabels,
  locale,
  onCloseAction,
  onSubmitAction,
  parentFieldId,
}: QuestionnaireFieldDialogProps) {
  const formId = useId();
  const tabPrefix = useId();
  const panelId = useId();
  const firstRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<QuestionnaireFieldFormValues>(() =>
    createQuestionnaireFieldFormValues(
      field,
      field?.type ?? QuestionnaireFieldType.ShortText,
      fixedChoiceLabels,
    ),
  );
  const [errors, setErrors] = useState<QuestionnaireFieldFormErrors>({});
  const [textLocale, setTextLocale] = useState<Locale>(locale);
  const text = content.editor.fieldDialog;
  const validation = content.catalog.validation;
  const parent = parentFieldId
    ? block.fields.find((candidate) => candidate.id === parentFieldId)
    : undefined;
  const parentName = parent
    ? (resolveQuestionnaireText(parent.translations, locale)?.text.label ??
      parent.key)
    : "";
  const condition = resolveQuestionnaireCondition(
    block,
    parentFieldId,
    field?.id ?? null,
    values.conditionFieldId,
    values.conditionChoiceId,
  );

  function update(patch: Partial<QuestionnaireFieldFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const next = validateQuestionnaireFieldForm(values);
    setErrors(next);
    if (next.label && !values.texts[textLocale].label.trim())
      setTextLocale(locale);
    if (Object.keys(next).length > 0) {
      firstRef.current?.focus();
      return;
    }
    onSubmitAction({ ...values, ...condition });
  }

  const missing = SUPPORTED_LOCALES.filter(
    (candidate) => !values.texts[candidate].label.trim(),
  );

  return (
    <FormDialog
      busy={busy}
      cancelLabel={content.catalog.dialog.cancel}
      closeLabel={content.catalog.dialog.close}
      formId={formId}
      initialFocusRef={firstRef}
      onCloseAction={onCloseAction}
      size={DialogSize.Wide}
      submitLabel={field ? text.submitEdit : text.submitCreate}
      submittingLabel={text.submitting}
      title={
        field
          ? text.editTitle
          : parent
            ? formatMessage(text.createChildTitle, { name: parentName })
            : text.createTitle
      }
    >
      <form
        className={styles.form}
        id={formId}
        noValidate
        onSubmit={handleSubmit}
      >
        {conflict ? (
          <p className={styles.notice} role="alert">
            {text.conflict}
          </p>
        ) : null}
        {failure ? (
          <p className={styles.failure} role="alert">
            {content.errors[failure]}
          </p>
        ) : null}

        <div className={styles.basics}>
          {field ? (
            <div className={styles.fixedType}>
              <span className={styles.fixedTypeLabel}>{text.type}</span>
              <span className={styles.fixedTypeValue}>
                {content.fieldTypes[field.type]}
              </span>
              <span className={styles.fixedTypeHint}>{text.typeFixed}</span>
            </div>
          ) : (
            <FormField
              kind={FormFieldKind.Custom}
              label={text.type}
              renderControl={({ describedBy, id }) => (
                <CustomSelect
                  describedBy={describedBy}
                  id={id}
                  onChange={(next) =>
                    setValues((current) =>
                      changeQuestionnaireFieldType(
                        current,
                        next,
                        fixedChoiceLabels,
                      ),
                    )
                  }
                  options={typesFor(block, parentFieldId).map((type) => ({
                    label: content.fieldTypes[type],
                    value: type,
                  }))}
                  value={values.type}
                />
              )}
              required
            />
          )}
          <QuestionnaireCheckboxField
            checked={
              values.requirement === QuestionnaireFieldRequirement.Required
            }
            hint={text.requiredHint}
            label={text.required}
            onChangeAction={(checked) =>
              update({
                requirement: checked
                  ? QuestionnaireFieldRequirement.Required
                  : QuestionnaireFieldRequirement.Optional,
              })
            }
          />
        </div>

        <fieldset className={styles.texts}>
          <legend className={styles.legend}>{text.texts}</legend>
          <QuestionnaireLocaleTabs
            activeLocale={textLocale}
            content={content.editor.locales}
            idPrefix={tabPrefix}
            interfaceLocale={locale}
            missing={missing}
            onSelectAction={setTextLocale}
            panelId={panelId}
          />
          <div
            aria-labelledby={`${tabPrefix}-${textLocale}`}
            className={styles.panel}
            id={panelId}
            role="tabpanel"
          >
            <FormField
              errorMessage={errors.label ? validation[errors.label] : undefined}
              inputProps={{
                maxLength: QUESTIONNAIRE_LIMITS.labelMaxLength,
                name: `questionnaire-field-label-${textLocale}`,
                onChange: (event) =>
                  setValues((current) =>
                    withQuestionnaireFieldLabel(
                      current,
                      textLocale,
                      event.target.value,
                      locale,
                    ),
                  ),
                value: values.texts[textLocale].label,
              }}
              inputRef={firstRef}
              kind={FormFieldKind.Text}
              label={text.label}
              required
            />
            <FormField
              hint={text.helpHint}
              kind={FormFieldKind.Textarea}
              label={text.help}
              textareaProps={{
                maxLength: QUESTIONNAIRE_LIMITS.helpMaxLength,
                name: `questionnaire-field-help-${textLocale}`,
                onChange: (event) =>
                  update({
                    texts: {
                      ...values.texts,
                      [textLocale]: {
                        ...values.texts[textLocale],
                        help: event.target.value,
                      },
                    },
                  }),
                rows: 2,
                value: values.texts[textLocale].help,
              }}
            />
          </div>
        </fieldset>

        <FormField
          errorMessage={errors.key ? validation[errors.key] : undefined}
          hint={text.keyHint}
          inputProps={{
            autoCapitalize: "off",
            autoComplete: "off",
            maxLength: QUESTIONNAIRE_LIMITS.keyMaxLength,
            name: "questionnaire-field-key",
            onChange: (event) =>
              update({ key: event.target.value, keyEdited: true }),
            spellCheck: false,
            value: values.key,
          }}
          kind={FormFieldKind.Text}
          label={text.key}
          required
        />

        {hasQuestionnaireChoices(values.type) ? (
          <QuestionnaireChoiceEditor
            choices={values.choices}
            content={content.editor.choices}
            editLocale={textLocale}
            errorMessage={
              errors.choices ? validation[errors.choices] : undefined
            }
            interfaceLocale={locale}
            onChangeAction={(choices) => update({ choices })}
            type={values.type}
          />
        ) : null}

        <QuestionnaireFieldConfigFields
          content={content}
          errors={errors}
          onChangeAction={update}
          values={values}
        />

        <QuestionnaireConditionSelect
          block={block}
          choiceId={condition.conditionChoiceId}
          content={content.editor}
          fieldId={field?.id ?? null}
          locale={locale}
          onChangeAction={(conditionFieldId, conditionChoiceId) =>
            update({ conditionFieldId, conditionChoiceId })
          }
          parentFieldId={parentFieldId}
          triggerId={condition.conditionFieldId}
        />
      </form>
    </FormDialog>
  );
}
