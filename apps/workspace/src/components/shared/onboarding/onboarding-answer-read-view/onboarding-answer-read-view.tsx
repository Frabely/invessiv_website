import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import {
  QUESTIONNAIRE_NON_ANSWER_ROW_TYPE_VALUES,
  type QuestionnaireFieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { QuestionnaireCompletenessInput } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-completeness-input";
import type { QuestionnaireResolvedBlock } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-block";
import {
  getQuestionnaireCompleteness,
  isQuestionnaireFieldVisible,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-completeness";
import type { OnboardingReadTexts } from "@/common/contracts/shared/onboarding-read-texts";
import { OnboardingReadValue } from "../onboarding-read-value/onboarding-read-value";
import styles from "./onboarding-answer-read-view.module.css";

// Files, groups and the booked services have no answer rows; their read views come with Task 67.
const UNSUPPORTED_TYPES: readonly QuestionnaireFieldType[] =
  QUESTIONNAIRE_NON_ANSWER_ROW_TYPE_VALUES;

export type OnboardingAnswerReadViewProps = Omit<
  QuestionnaireCompletenessInput,
  "blocks"
> & {
  /** Blocks in form order with texts resolved for the reader. */
  blocks: readonly QuestionnaireResolvedBlock[];
  /** Shown when the form has no blocks at all. */
  emptyText?: string;
  /** False where the block title already stands above the view, as in a single step. */
  showBlockTitles?: boolean;
  texts: OnboardingReadTexts;
};

/**
 * Every answer of a form, read-only, for the portal and for the CRM alike. Which fields are
 * visible and which required ones lack an answer comes from `getQuestionnaireCompleteness`, the
 * same function that guards the submission.
 */
export function OnboardingAnswerReadView({
  blocks,
  emptyText,
  showBlockTitles = true,
  texts,
  ...content
}: OnboardingAnswerReadViewProps) {
  const input = { blocks, ...content };
  const missing = new Set(
    getQuestionnaireCompleteness(input).missing.map((entry) => entry.fieldId),
  );

  if (blocks.length === 0)
    return emptyText ? <p className={styles.empty}>{emptyText}</p> : null;

  return (
    <div className={styles.view}>
      {blocks.map((block) => {
        const fields = block.fields.filter(
          (field) =>
            !UNSUPPORTED_TYPES.includes(field.type) &&
            isQuestionnaireFieldVisible(field, input),
        );
        return (
          <section className={styles.block} key={block.id}>
            {showBlockTitles ? (
              <h3 className={styles.title}>{block.title}</h3>
            ) : null}
            <dl className={styles.fields}>
              {fields.map((field) => {
                const answers = content.answers.filter(
                  (answer) =>
                    answer.fieldId === field.id && answer.groupEntryId === null,
                );
                const required =
                  field.requirement === QuestionnaireFieldRequirement.Required;
                return (
                  <div className={styles.field} key={field.id}>
                    <dt className={styles.label}>
                      {field.label}
                      {required ? (
                        <abbr
                          className={styles.required}
                          title={texts.required}
                        >
                          *
                        </abbr>
                      ) : null}
                    </dt>
                    <dd className={styles.value}>
                      {answers.length > 0 ? (
                        <OnboardingReadValue answers={answers} field={field} />
                      ) : (
                        <span
                          className={styles.none}
                          data-state={
                            missing.has(field.id) ? "missing" : "empty"
                          }
                        >
                          {missing.has(field.id)
                            ? texts.unanswered
                            : texts.empty}
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
