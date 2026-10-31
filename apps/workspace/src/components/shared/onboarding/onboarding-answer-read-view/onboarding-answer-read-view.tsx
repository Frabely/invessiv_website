import { getOnboardingAnswerFileSlot } from "@/common/patterns/shared/onboarding-answer-file-slot";
import type { ReactNode } from "react";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireAnswerFileRefDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file-ref.dto";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireCompletenessInput } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness-input";
import type { QuestionnaireResolvedBlock } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-block";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import type { OnboardingFormServiceDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-service.dto";
import {
  getQuestionnaireCompleteness,
  isQuestionnaireFieldVisible,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { questionnaireSlotKey } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-answer-slot";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { FormRequiredMarker, LinkedText } from "@invessiv/ui";
import type { OnboardingReadFiles } from "@/common/contracts/shared/onboarding-read-files";
import type { OnboardingReadTexts } from "@/common/contracts/shared/onboarding-read-texts";
import { OnboardingReadAttachments } from "../onboarding-read-attachments/onboarding-read-attachments";
import { OnboardingReadValue } from "../onboarding-read-value/onboarding-read-value";
import styles from "./onboarding-answer-read-view.module.css";

/** What the view shows of a booked service; the CRM's entry and the portal's reduced one both fit. */
type ServiceLine = Pick<
  OnboardingFormServiceDto,
  "title" | "description" | "position"
>;

export type OnboardingAnswerReadViewProps = Omit<
  QuestionnaireCompletenessInput,
  "blocks" | "answerFiles"
> & {
  /** Attached files the viewer may open, with the link each one hangs on. */
  answerFiles: readonly QuestionnaireAnswerFileDto[];
  /** Blocks in form order with texts resolved for the reader. */
  blocks: readonly QuestionnaireResolvedBlock[];
  /** Shown when the form has no blocks at all. */
  emptyText?: string;
  /**
   * How attached files open on the viewer's side: its file texts, download and preview. Without
   * it a files field lists the names only.
   */
  files?: OnboardingReadFiles;
  /** Where files hang that the viewer may not open; they count, and their field says so. */
  hiddenAnswerFiles?: readonly QuestionnaireAnswerFileRefDto[];
  /** The booked services a `project_services` field shows, never with a price. */
  services: readonly ServiceLine[];
  /** Remark the customer left with the confirmation of the services. */
  servicesNote: string | null;
  /** False where the block title already stands above the view, as in a single step. */
  showBlockTitles?: boolean;
  texts: OnboardingReadTexts;
};

/**
 * Every answer of a form, read-only, for the portal and for the CRM alike: text and selections,
 * group entries with their own answers, attached files, the booked services and what the customer
 * said about them. Which fields are visible and which required ones lack an answer comes from
 * `getQuestionnaireCompleteness`, the same function that guards the submission.
 */
export function OnboardingAnswerReadView({
  answerFiles,
  blocks,
  emptyText,
  files,
  hiddenAnswerFiles = [],
  services,
  servicesNote,
  showBlockTitles = true,
  texts,
  ...content
}: OnboardingAnswerReadViewProps) {
  const input = {
    blocks,
    answerFiles: [...answerFiles, ...hiddenAnswerFiles],
    ...content,
  };
  const missing = new Set(
    getQuestionnaireCompleteness(input).missing.map((entry) =>
      questionnaireSlotKey(entry.fieldId, entry.groupEntryId),
    ),
  );

  if (blocks.length === 0)
    return emptyText ? <p className={styles.empty}>{emptyText}</p> : null;

  function none(slotKey: string, emptyLabel = texts.empty): ReactNode {
    const lacking = missing.has(slotKey);
    return (
      <span className={styles.none} data-state={lacking ? "missing" : "empty"}>
        {lacking ? texts.unanswered : emptyLabel}
      </span>
    );
  }

  function renderValue(
    field: QuestionnaireResolvedField,
    groupEntryId: string | null,
  ): ReactNode {
    const slotKey = questionnaireSlotKey(field.id, groupEntryId);

    if (field.type === QuestionnaireFieldType.Files) {
      const { attachments: attached, hiddenCount } =
        getOnboardingAnswerFileSlot(answerFiles, hiddenAnswerFiles, {
          fieldId: field.id,
          groupEntryId,
        });
      const hidden = hiddenCount > 0;
      if (attached.length === 0 && !hidden) return none(slotKey);
      const label = formatMessage(texts.filesLabel, { field: field.label });
      return (
        <OnboardingReadAttachments
          attachments={attached}
          files={files}
          hidden={hidden}
          hiddenText={texts.filesHidden}
          label={label}
        />
      );
    }

    if (field.type === QuestionnaireFieldType.Group) {
      const entries = content.groupEntries
        .filter((entry) => entry.fieldId === field.id)
        .sort((left, right) => left.position - right.position);
      if (entries.length === 0) return none(slotKey, texts.noEntries);
      return (
        <ol className={styles.entries}>
          {entries.map((entry, index) => (
            <li className={styles.entry} key={entry.id}>
              <p className={styles.entryTitle}>
                {formatMessage(texts.entry, { number: index + 1 })}
              </p>
              <dl className={styles.fields}>
                {field.children
                  .filter((child) =>
                    isQuestionnaireFieldVisible(child, input, entry.id),
                  )
                  .map((child) => renderRow(child, entry.id))}
              </dl>
            </li>
          ))}
        </ol>
      );
    }

    if (field.type === QuestionnaireFieldType.ProjectServices)
      return (
        <div className={styles.services}>
          {services.length > 0 ? (
            <ul className={styles.serviceList}>
              {services.map((service) => (
                <li key={service.position}>
                  <span className={styles.serviceTitle}>{service.title}</span>
                  {service.description ? (
                    <span className={styles.serviceDescription}>
                      {service.description}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.plain}>{texts.servicesEmpty}</p>
          )}
          {content.servicesConfirmed ? (
            <p className={styles.plain}>{texts.servicesConfirmed}</p>
          ) : (
            none(slotKey, texts.servicesNotConfirmed)
          )}
          {servicesNote ? (
            <div className={styles.remark}>
              <p className={styles.remarkLabel}>{texts.servicesNote}</p>
              <p className={styles.plain}>
                <LinkedText text={servicesNote} />
              </p>
            </div>
          ) : null}
        </div>
      );

    const answers = content.answers.filter(
      (answer) =>
        answer.fieldId === field.id && answer.groupEntryId === groupEntryId,
    );
    return answers.length > 0 ? (
      <OnboardingReadValue answers={answers} field={field} texts={texts} />
    ) : (
      none(slotKey)
    );
  }

  function renderRow(
    field: QuestionnaireResolvedField,
    groupEntryId: string | null,
  ): ReactNode {
    const required =
      field.requirement === QuestionnaireFieldRequirement.Required;
    return (
      <div className={styles.field} key={field.id}>
        <dt className={styles.label}>
          {field.label}
          {required ? (
            <span>
              <span aria-hidden="true">
                <FormRequiredMarker />
              </span>
              <span className="sr-only">{texts.required}</span>
            </span>
          ) : null}
        </dt>
        <dd className={styles.value}>{renderValue(field, groupEntryId)}</dd>
      </div>
    );
  }

  return (
    <div className={styles.view}>
      {blocks.map((block) => (
        <section className={styles.block} key={block.id}>
          {showBlockTitles ? (
            <h3 className={styles.title}>{block.title}</h3>
          ) : null}
          <dl className={styles.fields}>
            {block.fields
              .filter((field) => isQuestionnaireFieldVisible(field, input))
              .map((field) => renderRow(field, null))}
          </dl>
        </section>
      ))}
    </div>
  );
}
