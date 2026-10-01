"use client";

import { useId } from "react";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { questionnaireConditionCandidates } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { CustomSelect } from "@invessiv/ui";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./questionnaire-condition-select.module.css";

export type QuestionnaireConditionSelectProps = {
  block: QuestionnaireBlockDto;
  choiceId: string | null;
  content: CrmQuestionnaireDictionary["editor"];
  /** Null while the field is new; it is appended, so every trigger of the level qualifies. */
  fieldId: string | null;
  locale: Locale;
  onChangeAction: (fieldId: string | null, choiceId: string | null) => void;
  parentFieldId: string | null;
  triggerId: string | null;
};

const ALWAYS = "";

/** Offers only valid triggers: choice or yes/no fields above this one on the same level. */
export function QuestionnaireConditionSelect({
  block,
  choiceId,
  content,
  fieldId,
  locale,
  onChangeAction,
  parentFieldId,
  triggerId,
}: QuestionnaireConditionSelectProps) {
  const triggerSelectId = useId();
  const choiceSelectId = useId();
  const candidates = questionnaireConditionCandidates(
    block,
    parentFieldId,
    fieldId,
  );
  const trigger = candidates.find((candidate) => candidate.id === triggerId);
  const text = content.condition;

  if (candidates.length === 0)
    return (
      <div className={styles.group}>
        <span className={styles.legend}>{text.legend}</span>
        <p className={styles.hint}>{text.noCandidates}</p>
      </div>
    );

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{text.legend}</legend>
      <div className={styles.row}>
        <label className={styles.caption} htmlFor={triggerSelectId}>
          {text.trigger}
        </label>
        <CustomSelect
          id={triggerSelectId}
          onChange={(next) => {
            const nextTrigger = candidates.find(
              (candidate) => candidate.id === next,
            );
            onChangeAction(
              nextTrigger?.id ?? null,
              nextTrigger?.choices[0]?.id ?? null,
            );
          }}
          options={[
            { label: text.always, value: ALWAYS },
            ...candidates.map((candidate) => ({
              label:
                resolveQuestionnaireText(candidate.translations, locale)?.text
                  .label ?? candidate.key,
              value: candidate.id,
            })),
          ]}
          value={trigger?.id ?? ALWAYS}
        />
      </div>
      {trigger ? (
        <div className={styles.row}>
          <label className={styles.caption} htmlFor={choiceSelectId}>
            {text.choice}
          </label>
          <CustomSelect
            id={choiceSelectId}
            onChange={(next) => onChangeAction(trigger.id, next)}
            options={trigger.choices.map((choice) => ({
              label:
                resolveQuestionnaireText(choice.labels, locale)?.text ??
                choice.key,
              value: choice.id,
            }))}
            value={choiceId ?? trigger.choices[0]?.id ?? ALWAYS}
          />
        </div>
      ) : null}
    </fieldset>
  );
}
