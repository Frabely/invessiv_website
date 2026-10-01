"use client";

import { useId } from "react";
import {
  faArrowDown,
  faArrowUp,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  moveListItem,
  removeListItem,
} from "@invessiv/common/patterns/collections/ordered-list";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import type { QuestionnaireChoiceFormValues } from "@/common/contracts/crm/questionnaire/questionnaire-choice-form-values";
import {
  hasFixedQuestionnaireChoices,
  newQuestionnaireChoice,
  withQuestionnaireChoiceLabel,
} from "@/common/patterns/crm/questionnaire/questionnaire-field-form";
import { languageName } from "@invessiv/common/patterns/i18n/language-name";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./questionnaire-choice-editor.module.css";

export type QuestionnaireChoiceEditorProps = {
  choices: QuestionnaireChoiceFormValues[];
  content: CrmQuestionnaireDictionary["editor"]["choices"];
  /** The locale whose labels are edited; the dialog's language tab decides it. */
  editLocale: Locale;
  errorMessage?: string;
  interfaceLocale: Locale;
  onChangeAction: (choices: QuestionnaireChoiceFormValues[]) => void;
  type: FieldType;
};

/**
 * Options of choice, yes/no and scale fields. Keys identify an option across saves (conditions
 * point at them), so only free options can be added, removed or reordered.
 */
export function QuestionnaireChoiceEditor({
  choices,
  content,
  editLocale,
  errorMessage,
  interfaceLocale,
  onChangeAction,
  type,
}: QuestionnaireChoiceEditorProps) {
  const errorId = useId();
  const fixed = hasFixedQuestionnaireChoices(type);
  const isScale = type === QuestionnaireFieldType.Scale;
  const language = languageName(editLocale, interfaceLocale);

  function rowCaption(choice: QuestionnaireChoiceFormValues, index: number) {
    if (isScale) return index === 0 ? content.poles.low : content.poles.high;
    return choice.labels[editLocale] || choice.key;
  }

  return (
    <fieldset
      aria-describedby={errorMessage ? errorId : undefined}
      className={styles.editor}
    >
      <legend className={styles.legend}>
        {isScale ? content.polesLegend : content.legend}
      </legend>
      <p className={styles.hint}>
        {fixed ? content.fixedHint : content.minimumHint}
      </p>
      <ol className={styles.rows}>
        {choices.map((choice, index) => {
          const name = rowCaption(choice, index);
          return (
            <li className={styles.row} key={index}>
              {isScale ? <span className={styles.pole}>{name}</span> : null}
              <label className={styles.keyField}>
                <span className="sr-only">
                  {content.key} {name}
                </span>
                <input
                  autoCapitalize="off"
                  className={styles.keyInput}
                  maxLength={QUESTIONNAIRE_LIMITS.keyMaxLength}
                  onChange={(event) =>
                    onChangeAction(
                      choices.map((other, position) =>
                        position === index
                          ? {
                              ...other,
                              key: event.target.value,
                              keyEdited: true,
                            }
                          : other,
                      ),
                    )
                  }
                  readOnly={fixed}
                  spellCheck={false}
                  value={choice.key}
                />
              </label>
              <label className={styles.labelField}>
                <span className="sr-only">
                  {formatMessage(content.label, { language })} {index + 1}
                </span>
                <input
                  className={styles.labelInput}
                  maxLength={QUESTIONNAIRE_LIMITS.choiceLabelMaxLength}
                  onChange={(event) =>
                    onChangeAction(
                      withQuestionnaireChoiceLabel(
                        choices,
                        index,
                        editLocale,
                        event.target.value,
                        interfaceLocale,
                      ),
                    )
                  }
                  placeholder={formatMessage(content.label, { language })}
                  value={choice.labels[editLocale]}
                />
              </label>
              {fixed ? null : (
                <span className={styles.actions}>
                  <ButtonControl
                    aria-label={formatMessage(content.moveUp, { name })}
                    className={styles.iconButton}
                    disabled={index === 0}
                    onClick={() =>
                      onChangeAction(moveListItem(choices, index, -1))
                    }
                    title={formatMessage(content.moveUp, { name })}
                    type="button"
                    variant="ghost"
                  >
                    <FontAwesomeIcon aria-hidden="true" icon={faArrowUp} />
                  </ButtonControl>
                  <ButtonControl
                    aria-label={formatMessage(content.moveDown, { name })}
                    className={styles.iconButton}
                    disabled={index === choices.length - 1}
                    onClick={() =>
                      onChangeAction(moveListItem(choices, index, 1))
                    }
                    title={formatMessage(content.moveDown, { name })}
                    type="button"
                    variant="ghost"
                  >
                    <FontAwesomeIcon aria-hidden="true" icon={faArrowDown} />
                  </ButtonControl>
                  <ButtonControl
                    aria-label={formatMessage(content.remove, { name })}
                    className={styles.iconButton}
                    onClick={() =>
                      onChangeAction(removeListItem(choices, index))
                    }
                    title={formatMessage(content.remove, { name })}
                    type="button"
                    variant="ghost"
                  >
                    <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
                  </ButtonControl>
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {fixed ? null : (
        <ButtonControl
          className={styles.addButton}
          disabled={choices.length >= QUESTIONNAIRE_LIMITS.choicesPerField}
          onClick={() =>
            onChangeAction([...choices, newQuestionnaireChoice(choices)])
          }
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          {content.add}
        </ButtonControl>
      )}
      {errorMessage ? (
        <p className={styles.error} id={errorId} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </fieldset>
  );
}
