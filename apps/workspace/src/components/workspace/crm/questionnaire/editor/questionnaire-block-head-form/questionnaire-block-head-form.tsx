"use client";

import { type SubmitEvent, useId, useState } from "react";
import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import {
  QUESTIONNAIRE_CATALOG_STATUS_VALUES,
  type QuestionnaireCatalogStatus,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-catalog-statuses";
import { QUESTIONNAIRE_KEY_PATTERN_SOURCE } from "@invessiv/common/constants/crm/questionnaire/questionnaire-key-patterns";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireBlockTranslationDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-translation.dto";
import {
  SUPPORTED_LOCALES,
  type Locale,
} from "@invessiv/common/contracts/i18n/locale";
import { CustomSelect, FormField, PrimaryCtaButton } from "@invessiv/ui";
import { QuestionnaireFormValidationCode } from "@/common/constants/crm/questionnaire/questionnaire-form-validation-codes";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireCheckboxField } from "../questionnaire-checkbox-field/questionnaire-checkbox-field";
import { QuestionnaireLocaleTabs } from "../questionnaire-locale-tabs/questionnaire-locale-tabs";
import styles from "./questionnaire-block-head-form.module.css";

export type QuestionnaireBlockHeadFormProps = {
  api: QuestionnaireDefinitionClientApi;
  block: QuestionnaireBlockDto;
  canWrite: boolean;
  content: CrmQuestionnaireDictionary;
  locale: Locale;
  /** A written block, fresh from the server, or the current one after a conflict. */
  onBlockAction: (block: QuestionnaireBlockDto) => void;
  /** Only catalog blocks can be archived; a form's block has no status. */
  showStatus: boolean;
};

type HeadTexts = Record<Locale, { title: string; intro: string }>;

const KEY = new RegExp(QUESTIONNAIRE_KEY_PATTERN_SOURCE);

function textsOf(block: QuestionnaireBlockDto): HeadTexts {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      {
        title: block.translations[locale]?.title ?? "",
        intro: block.translations[locale]?.intro ?? "",
      },
    ]),
  ) as HeadTexts;
}

/** Takes over what the other editor changed, except where this form was edited since `base`. */
function mergeTexts(
  current: HeadTexts,
  base: HeadTexts,
  next: HeadTexts,
): HeadTexts {
  return Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [
      locale,
      {
        title:
          current[locale].title === base[locale].title
            ? next[locale].title
            : current[locale].title,
        intro:
          current[locale].intro === base[locale].intro
            ? next[locale].intro
            : current[locale].intro,
      },
    ]),
  ) as HeadTexts;
}

type Outcome =
  | { kind: "saved" }
  | { kind: "conflict" }
  | { kind: "failure"; code: QuestionnaireErrorCode }
  | null;

/** Title and note per language, key, company-wide flag and status; saved in one versioned write. */
export function QuestionnaireBlockHeadForm({
  api,
  block,
  canWrite,
  content,
  locale,
  onBlockAction,
  showStatus,
}: QuestionnaireBlockHeadFormProps) {
  const formId = useId();
  const tabPrefix = useId();
  const panelId = useId();
  const statusId = useId();
  const [texts, setTexts] = useState<HeadTexts>(() => textsOf(block));
  const [key, setKey] = useState(block.key);
  const [carryOver, setCarryOver] = useState(block.carryOver);
  const [status, setStatus] = useState<QuestionnaireCatalogStatus>(
    block.status,
  );
  const [base, setBase] = useState(block);
  // A field action can adopt a newer block while this form stays mounted. Untouched inputs must
  // follow it, or the next save would send the old head with the fresh version and undo it.
  if (base.version !== block.version) {
    setBase(block);
    setTexts(mergeTexts(texts, textsOf(base), textsOf(block)));
    if (key === base.key) setKey(block.key);
    if (carryOver === base.carryOver) setCarryOver(block.carryOver);
    if (status === base.status) setStatus(block.status);
  }
  const [textLocale, setTextLocale] = useState<Locale>(locale);
  const [errors, setErrors] = useState<{
    title?: QuestionnaireFormValidationCode;
    key?: QuestionnaireFormValidationCode;
  }>({});
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const text = content.editor.head;
  const validation = content.catalog.validation;
  const missing = SUPPORTED_LOCALES.filter(
    (candidate) => !texts[candidate].title.trim(),
  );

  function setText(field: "title" | "intro", value: string) {
    setTexts((current) => ({
      ...current,
      [textLocale]: { ...current[textLocale], [field]: value },
    }));
    setOutcome(null);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const next = {
      title:
        missing.length === SUPPORTED_LOCALES.length
          ? QuestionnaireFormValidationCode.Required
          : undefined,
      key: !key
        ? QuestionnaireFormValidationCode.Required
        : KEY.test(key)
          ? undefined
          : QuestionnaireFormValidationCode.Key,
    };
    setErrors(next);
    if (next.title || next.key) return;

    const translations: Partial<
      Record<Locale, QuestionnaireBlockTranslationDto>
    > = {};
    for (const candidate of SUPPORTED_LOCALES)
      if (texts[candidate].title.trim())
        translations[candidate] = {
          title: texts[candidate].title.trim(),
          intro: texts[candidate].intro.trim() || null,
        };

    setBusy(true);
    setOutcome(null);
    const result = await api.updateBlock(block.id, {
      key,
      carryOver,
      status,
      translations,
      version: block.version,
    });
    setBusy(false);
    if (result.ok) {
      onBlockAction(result.value);
      setOutcome({ kind: "saved" });
      return;
    }
    if ("current" in result) {
      onBlockAction(result.current);
      setOutcome({ kind: "conflict" });
      return;
    }
    setOutcome({ kind: "failure", code: result.code });
  }

  return (
    <form
      className={styles.form}
      id={formId}
      noValidate
      onSubmit={handleSubmit}
    >
      <fieldset className={styles.fieldset} disabled={!canWrite}>
        <legend className={styles.legend}>{text.legend}</legend>
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
            errorMessage={errors.title ? validation[errors.title] : undefined}
            inputProps={{
              maxLength: QUESTIONNAIRE_LIMITS.titleMaxLength,
              name: `questionnaire-block-title-${textLocale}`,
              onChange: (event) => setText("title", event.target.value),
              readOnly: !canWrite,
              value: texts[textLocale].title,
            }}
            kind={FormFieldKind.Text}
            label={text.title}
            required
          />
          <FormField
            hint={text.introHint}
            kind={FormFieldKind.Textarea}
            label={text.intro}
            textareaProps={{
              maxLength: QUESTIONNAIRE_LIMITS.introMaxLength,
              name: `questionnaire-block-intro-${textLocale}`,
              onChange: (event) => setText("intro", event.target.value),
              readOnly: !canWrite,
              rows: 2,
              value: texts[textLocale].intro,
            }}
          />
        </div>
        <div className={styles.settings}>
          <FormField
            errorMessage={errors.key ? validation[errors.key] : undefined}
            inputProps={{
              autoCapitalize: "off",
              maxLength: QUESTIONNAIRE_LIMITS.keyMaxLength,
              name: "questionnaire-block-key",
              onChange: (event) => {
                setKey(event.target.value);
                setOutcome(null);
              },
              readOnly: !canWrite,
              spellCheck: false,
              value: key,
            }}
            kind={FormFieldKind.Text}
            label={text.key}
            required
          />
          {showStatus ? (
            <FormField
              controlId={statusId}
              kind={FormFieldKind.Custom}
              label={text.status}
              renderControl={({ describedBy, id }) => (
                <CustomSelect
                  describedBy={describedBy}
                  disabled={!canWrite}
                  id={id}
                  onChange={(next) => {
                    setStatus(next);
                    setOutcome(null);
                  }}
                  options={QUESTIONNAIRE_CATALOG_STATUS_VALUES.map((value) => ({
                    label: content.catalog.status[value],
                    value,
                  }))}
                  value={status}
                />
              )}
            />
          ) : null}
        </div>
        <QuestionnaireCheckboxField
          checked={carryOver}
          disabled={!canWrite}
          hint={text.carryOverHint}
          label={text.carryOver}
          onChangeAction={(checked) => {
            setCarryOver(checked);
            setOutcome(null);
          }}
        />
      </fieldset>
      {canWrite ? (
        <div className={styles.footer}>
          <p
            aria-live="polite"
            className={styles.outcome}
            data-kind={outcome?.kind}
          >
            {outcome?.kind === "saved" ? text.saved : null}
            {outcome?.kind === "conflict" ? content.editor.conflict : null}
            {outcome?.kind === "failure" ? content.errors[outcome.code] : null}
          </p>
          <PrimaryCtaButton disabled={busy} type="submit">
            {busy ? text.saving : text.save}
          </PrimaryCtaButton>
        </div>
      ) : null}
    </form>
  );
}
