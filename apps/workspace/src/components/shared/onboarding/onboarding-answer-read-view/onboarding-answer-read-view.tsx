import type { ReactNode } from "react";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import type { FileAttachmentDto } from "@invessiv/common/contracts/files/file-attachment.dto";
import type { QuestionnaireAnswerFileRefDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file-ref.dto";
import type { QuestionnaireAnswerFileDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-answer-file.dto";
import type { QuestionnaireCompletenessInput } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness-input";
import type { QuestionnaireResolvedBlock } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-block";
import type { OnboardingFormServiceDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-service.dto";
import {
  getQuestionnaireCompleteness,
  isQuestionnaireFieldVisible,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import { questionnaireSlotKey } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-answer-slot";
import { LinkedText } from "@invessiv/ui";
import type { FileAttachmentTexts } from "@/common/contracts/files/file-attachment-texts";
import type { OnboardingReadTexts } from "@/common/contracts/shared/onboarding-read-texts";
import { FileAttachmentList } from "@/components/shared/files/file-attachment-list/file-attachment-list";
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
  files?: {
    loadPreviewAction: (
      file: FileAttachmentDto,
      kind: FilePreviewKind,
    ) => Promise<string | null>;
    locale: string;
    onDownloadAction: (file: FileAttachmentDto) => void;
    texts: FileAttachmentTexts;
  };
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
      const attached = answerFiles
        .filter(
          (link) =>
            link.fieldId === field.id && link.groupEntryId === groupEntryId,
        )
        .sort((left, right) => left.position - right.position)
        .map((link) => link.file);
      const hidden = hiddenAnswerFiles.some(
        (link) =>
          link.fieldId === field.id && link.groupEntryId === groupEntryId,
      );
      if (attached.length === 0 && !hidden) return none(slotKey);
      const label = formatMessage(texts.filesLabel, { field: field.label });
      return (
        <>
          {attached.length === 0 ? null : files ? (
            <FileAttachmentList
              attachments={attached}
              label={label}
              loadPreviewAction={files.loadPreviewAction}
              locale={files.locale}
              onDownloadAction={files.onDownloadAction}
              texts={files.texts}
            />
          ) : (
            <ul aria-label={label} className={styles.names}>
              {attached.map((file) => (
                <li key={file.id}>{file.displayName}</li>
              ))}
            </ul>
          )}
          {hidden ? (
            <span className={styles.none} data-state="empty">
              {texts.filesHidden}
            </span>
          ) : null}
        </>
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
            <abbr className={styles.required} title={texts.required}>
              *
            </abbr>
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
