"use client";

import { type ReactNode, useId } from "react";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { FEEDBACK_ITEM_KIND_VALUES } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, CustomSelect, FormField } from "@invessiv/ui";
import type { FeedbackDraftItem } from "@/common/contracts/portal/feedback-draft-item";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import styles from "./feedback-item-editor.module.css";

// The counter appears once most of the room is used, so short items stay uncluttered.
const COUNTER_FROM = Math.floor(FEEDBACK_LIMITS.itemBodyMaxLength * 0.8);
const NONE_VALUE = "";

export type FeedbackItemEditorProps = {
  areaOptions: readonly string[];
  /** Upload and file list; absent without the file right. */
  attachments?: ReactNode;
  content: PortalFeedbackDictionary;
  /** The server found this item without text on submit. */
  invalid: boolean;
  item: FeedbackDraftItem;
  number: number;
  onChangeAction: (
    patch: Partial<Pick<FeedbackDraftItem, "areaLabel" | "kind" | "body">>,
  ) => void;
  onRemoveAction: () => void;
};

/** One point of the sheet as a card: its number, where and what kind, the text and its files. */
export function FeedbackItemEditor({
  areaOptions,
  attachments,
  content,
  invalid,
  item,
  number,
  onChangeAction,
  onRemoveAction,
}: FeedbackItemEditorProps) {
  const baseId = useId();
  const texts = content.editor;
  const itemLabel = formatMessage(texts.itemLabel, { number });
  const headingId = `${baseId}-heading`;
  const removeLabel = formatMessage(texts.remove, { number });
  // An area that left the snapshot still shows instead of silently jumping to "general".
  const areas =
    item.areaLabel && !areaOptions.includes(item.areaLabel)
      ? [...areaOptions, item.areaLabel]
      : areaOptions;

  return (
    <li
      aria-labelledby={headingId}
      className={styles.item}
      data-invalid={invalid ? "true" : undefined}
    >
      <div className={styles.head}>
        <h3 className={styles.title} id={headingId}>
          {itemLabel}
        </h3>
        <ButtonControl
          aria-label={removeLabel}
          onClick={onRemoveAction}
          size={ButtonSize.Icon}
          title={removeLabel}
          type="button"
          variant={ButtonVariant.Quiet}
        >
          <FontAwesomeIcon aria-hidden="true" icon={faTrashCan} />
        </ButtonControl>
      </div>
      <div className={styles.selects}>
        <FormField
          kind={FormFieldKind.Custom}
          label={texts.area}
          renderControl={({ id, describedBy }) => (
            <CustomSelect
              ariaLabel={`${itemLabel}: ${texts.area}`}
              describedBy={describedBy}
              id={id}
              onChange={(areaLabel) =>
                onChangeAction({
                  areaLabel: areaLabel === NONE_VALUE ? null : areaLabel,
                })
              }
              options={[
                { label: texts.general, value: NONE_VALUE },
                ...areas.map((area) => ({ label: area, value: area })),
              ]}
              value={item.areaLabel ?? NONE_VALUE}
            />
          )}
          reserveErrorSpace={false}
        />
        <FormField
          kind={FormFieldKind.Custom}
          label={texts.kind}
          renderControl={({ id, describedBy }) => (
            <CustomSelect
              ariaLabel={`${itemLabel}: ${texts.kind}`}
              describedBy={describedBy}
              id={id}
              onChange={(kindValue) =>
                onChangeAction({
                  kind:
                    FEEDBACK_ITEM_KIND_VALUES.find(
                      (kind) => kind === kindValue,
                    ) ?? null,
                })
              }
              options={[
                { label: texts.kindNone, value: NONE_VALUE },
                ...FEEDBACK_ITEM_KIND_VALUES.map((kind) => ({
                  label: content.kinds[kind],
                  value: kind,
                })),
              ]}
              value={item.kind ?? NONE_VALUE}
            />
          )}
          reserveErrorSpace={false}
        />
      </div>
      <FormField
        autoGrow
        errorMessage={invalid ? texts.bodyRequired : undefined}
        hint={
          item.body.length >= COUNTER_FROM
            ? formatMessage(texts.counter, {
                count: item.body.length,
                max: FEEDBACK_LIMITS.itemBodyMaxLength,
              })
            : undefined
        }
        kind={FormFieldKind.Textarea}
        label={texts.body}
        reserveErrorSpace={false}
        textareaProps={{
          "aria-label": `${itemLabel}: ${texts.body}`,
          maxLength: FEEDBACK_LIMITS.itemBodyMaxLength,
          onChange: (event) => onChangeAction({ body: event.target.value }),
          placeholder: texts.bodyPlaceholder,
          rows: 3,
          value: item.body,
        }}
      />
      {attachments ? <div className={styles.files}>{attachments}</div> : null}
    </li>
  );
}
