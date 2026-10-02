"use client";

import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import { questionnaireFieldName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import { QuestionnaireFieldRow } from "../questionnaire-field-row/questionnaire-field-row";
import styles from "./questionnaire-field-list.module.css";

type QuestionnaireFieldListActions = {
  busy: boolean;
  onAddChildAction: (group: QuestionnaireFieldDto) => void;
  onDeleteAction: (field: QuestionnaireFieldDto) => void;
  onEditAction: (field: QuestionnaireFieldDto) => void;
  onMoveAction: (field: QuestionnaireFieldDto, direction: -1 | 1) => void;
};

export type QuestionnaireFieldListProps = {
  /** Absent without write access. */
  actions?: QuestionnaireFieldListActions;
  block: QuestionnaireBlockDto;
  content: CrmQuestionnaireDictionary;
  locale: Locale;
};

/** Block-level fields in order; a group shows its sub-fields indented along a guide line. */
export function QuestionnaireFieldList({
  actions,
  block,
  content,
  locale,
}: QuestionnaireFieldListProps) {
  const text = content.editor.fields;

  function rows(fields: readonly QuestionnaireFieldDto[]) {
    return fields.map((field, index) => (
      <QuestionnaireFieldRow
        actions={
          actions
            ? {
                busy: actions.busy,
                onDeleteAction: () => actions.onDeleteAction(field),
                onEditAction: () => actions.onEditAction(field),
                onMoveAction: (direction) =>
                  actions.onMoveAction(field, direction),
              }
            : undefined
        }
        block={block}
        content={content.editor}
        field={field}
        fieldTypes={content.fieldTypes}
        isFirst={index === 0}
        isLast={index === fields.length - 1}
        key={field.id}
        locale={locale}
      >
        {field.type === QuestionnaireFieldType.Group ? (
          <div className={styles.group}>
            {field.children.length > 0 ? (
              <ol className={styles.children}>{rows(field.children)}</ol>
            ) : (
              <p className={styles.groupEmpty}>{text.groupEmpty}</p>
            )}
            {actions ? (
              <ButtonControl
                aria-label={formatMessage(text.addChildTo, {
                  name: questionnaireFieldName(field, locale, text.untitled),
                })}
                className={styles.addChild}
                disabled={
                  actions.busy ||
                  field.children.length >=
                    QUESTIONNAIRE_LIMITS.childFieldsPerGroup
                }
                onClick={() => actions.onAddChildAction(field)}
                type="button"
                variant="ghost"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
                {text.addChild}
              </ButtonControl>
            ) : null}
          </div>
        ) : null}
      </QuestionnaireFieldRow>
    ));
  }

  return <ol className={styles.list}>{rows(block.fields)}</ol>;
}
