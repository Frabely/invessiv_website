"use client";

import { type ReactNode, useId } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FEEDBACK_ITEM_KIND_VALUES } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { CustomSelect } from "@invessiv/ui";
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

/** One point of the sheet: where, what kind, the text and its files. */
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
  const areaSelectId = `${baseId}-area`;
  const kindSelectId = `${baseId}-kind`;
  const texts = content.editor;
  const itemLabel = formatMessage(texts.itemLabel, { number });
  const headingId = `${baseId}-heading`;
  const counterId = `${baseId}-counter`;
  const errorId = `${baseId}-error`;
  const showCounter = item.body.length >= COUNTER_FROM;
  // An area that left the snapshot still shows instead of silently jumping to "general".
  const areas =
    item.areaLabel && !areaOptions.includes(item.areaLabel)
      ? [...areaOptions, item.areaLabel]
      : areaOptions;
  const describedBy =
    [showCounter ? counterId : "", invalid ? errorId : ""]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <li
      aria-labelledby={headingId}
      className={styles.item}
      data-invalid={invalid ? "true" : undefined}
    >
      <span aria-hidden="true" className={styles.number}>
        {number}
      </span>
      <div className={styles.body}>
        <h3 className="sr-only" id={headingId}>
          {itemLabel}
        </h3>
        <div className={styles.head}>
          <label className={styles.field}>
            <span>{texts.area}</span>
            <CustomSelect
              ariaLabel={`${itemLabel}: ${texts.area}`}
              id={areaSelectId}
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
          </label>
          <label className={styles.field}>
            <span>{texts.kind}</span>
            <CustomSelect
              ariaLabel={`${itemLabel}: ${texts.kind}`}
              id={kindSelectId}
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
          </label>
          <button
            aria-label={formatMessage(texts.remove, { number })}
            className={styles.remove}
            onClick={onRemoveAction}
            title={formatMessage(texts.remove, { number })}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </button>
        </div>
        <label className={styles.textField}>
          <span className="sr-only">
            {itemLabel}: {texts.body}
          </span>
          <textarea
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            maxLength={FEEDBACK_LIMITS.itemBodyMaxLength}
            onChange={(event) => onChangeAction({ body: event.target.value })}
            placeholder={texts.bodyPlaceholder}
            rows={3}
            value={item.body}
          />
        </label>
        {invalid ? (
          <p className={styles.error} id={errorId}>
            {texts.bodyRequired}
          </p>
        ) : null}
        {showCounter ? (
          <p className={styles.counter} id={counterId}>
            {formatMessage(texts.counter, {
              count: item.body.length,
              max: FEEDBACK_LIMITS.itemBodyMaxLength,
            })}
          </p>
        ) : null}
        {attachments}
      </div>
    </li>
  );
}
