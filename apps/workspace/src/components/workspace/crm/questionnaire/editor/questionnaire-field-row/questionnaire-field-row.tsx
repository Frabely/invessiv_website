"use client";

import type { ReactNode } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowDown,
  faArrowUp,
  faAt,
  faCircleCheck,
  faCircleDot,
  faCodeBranch,
  faDatabase,
  faFont,
  faHandshake,
  faLayerGroup,
  faLink,
  faListCheck,
  faPalette,
  faPaperclip,
  faPenToSquare,
  faPhone,
  faSliders,
  faSquareCheck,
  faTextHeight,
  faToggleOn,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  QuestionnaireFieldType,
  type QuestionnaireFieldType as FieldType,
} from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { findQuestionnaireField } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { resolveQuestionnaireText } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import { questionnaireFieldName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import { languageName } from "@invessiv/common/patterns/i18n/language-name";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./questionnaire-field-row.module.css";

const TYPE_ICONS: Record<FieldType, IconDefinition> = {
  [QuestionnaireFieldType.ShortText]: faFont,
  [QuestionnaireFieldType.LongText]: faTextHeight,
  [QuestionnaireFieldType.Email]: faAt,
  [QuestionnaireFieldType.Phone]: faPhone,
  [QuestionnaireFieldType.Url]: faLink,
  [QuestionnaireFieldType.Choice]: faCircleDot,
  [QuestionnaireFieldType.MultiChoice]: faListCheck,
  [QuestionnaireFieldType.YesNo]: faToggleOn,
  [QuestionnaireFieldType.Scale]: faSliders,
  [QuestionnaireFieldType.Color]: faPalette,
  [QuestionnaireFieldType.Files]: faPaperclip,
  [QuestionnaireFieldType.Confirmation]: faSquareCheck,
  [QuestionnaireFieldType.Group]: faLayerGroup,
  [QuestionnaireFieldType.ProjectServices]: faHandshake,
};

export type QuestionnaireFieldRowProps = {
  block: QuestionnaireBlockDto;
  /** Sub-fields of a group, rendered by the list below the row. */
  children?: ReactNode;
  content: CrmQuestionnaireDictionary["editor"];
  fieldTypes: CrmQuestionnaireDictionary["fieldTypes"];
  field: QuestionnaireFieldDto;
  isFirst: boolean;
  isLast: boolean;
  locale: Locale;
  /** Absent without write access; the actions are then not rendered at all. */
  actions?: {
    busy: boolean;
    onDeleteAction: () => void;
    onEditAction: () => void;
    onMoveAction: (direction: -1 | 1) => void;
  };
};

function conditionText(
  block: QuestionnaireBlockDto,
  field: QuestionnaireFieldDto,
  locale: Locale,
  content: CrmQuestionnaireDictionary["editor"],
): string | null {
  if (!field.conditionFieldId) return null;
  const trigger = findQuestionnaireField(block, field.conditionFieldId);
  const choice = trigger?.choices.find((c) => c.id === field.conditionChoiceId);
  if (!trigger || !choice) return null;
  return formatMessage(content.fields.condition, {
    trigger: questionnaireFieldName(trigger, locale, content.fields.untitled),
    choice: resolveQuestionnaireText(choice.labels, locale)?.text ?? choice.key,
  });
}

/** One question as the customer will meet it: type, text, whether it is required and when it shows. */
export function QuestionnaireFieldRow({
  actions,
  block,
  children,
  content,
  fieldTypes,
  field,
  isFirst,
  isLast,
  locale,
}: QuestionnaireFieldRowProps) {
  const text = content.fields;
  const resolved = resolveQuestionnaireText(field.translations, locale);
  const name = resolved?.text.label ?? text.untitled;
  const condition = conditionText(block, field, locale, content);

  return (
    <li
      className={styles.item}
      data-conditional={condition ? "true" : undefined}
      data-group={
        field.type === QuestionnaireFieldType.Group ? "true" : undefined
      }
    >
      <div className={styles.row} data-field-id={field.id}>
        <span aria-hidden="true" className={styles.typeIcon}>
          <FontAwesomeIcon icon={TYPE_ICONS[field.type]} />
        </span>
        <div className={styles.body}>
          <span className={styles.name}>
            {name}
            {resolved?.isFallback ? (
              <span className={styles.fallback}>
                {formatMessage(text.fallback, {
                  language: languageName(resolved.locale, locale),
                })}
              </span>
            ) : null}
          </span>
          <span className={styles.meta}>
            <span>{fieldTypes[field.type]}</span>
            <span className={styles.key}>{field.key}</span>
            {field.requirement === QuestionnaireFieldRequirement.Required ? (
              <span className={styles.required}>
                <FontAwesomeIcon aria-hidden="true" icon={faCircleCheck} />
                {text.required}
              </span>
            ) : null}
            {field.prefillSource ? (
              <span className={styles.flag}>
                <FontAwesomeIcon aria-hidden="true" icon={faDatabase} />
                {text.prefill}
              </span>
            ) : null}
          </span>
          {condition ? (
            <span className={styles.condition}>
              <FontAwesomeIcon aria-hidden="true" icon={faCodeBranch} />
              {condition}
            </span>
          ) : null}
        </div>
        {actions ? (
          <span className={styles.actions}>
            <ButtonControl
              aria-label={formatMessage(text.moveUp, { name })}
              className={styles.iconButton}
              data-control="up"
              disabled={isFirst || actions.busy}
              onClick={() => actions.onMoveAction(-1)}
              title={formatMessage(text.moveUp, { name })}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faArrowUp} />
            </ButtonControl>
            <ButtonControl
              aria-label={formatMessage(text.moveDown, { name })}
              className={styles.iconButton}
              data-control="down"
              disabled={isLast || actions.busy}
              onClick={() => actions.onMoveAction(1)}
              title={formatMessage(text.moveDown, { name })}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faArrowDown} />
            </ButtonControl>
            <ButtonControl
              aria-label={formatMessage(text.edit, { name })}
              className={styles.iconButton}
              data-control="edit"
              disabled={actions.busy}
              onClick={actions.onEditAction}
              title={formatMessage(text.edit, { name })}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
            </ButtonControl>
            <ButtonControl
              aria-label={formatMessage(text.delete, { name })}
              className={styles.iconButton}
              disabled={actions.busy}
              onClick={actions.onDeleteAction}
              title={formatMessage(text.delete, { name })}
              type="button"
              variant="ghost"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faTrashCan} />
            </ButtonControl>
          </span>
        ) : null}
      </div>
      {children}
    </li>
  );
}
