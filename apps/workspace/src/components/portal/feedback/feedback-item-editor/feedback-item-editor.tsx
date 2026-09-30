"use client";

import { type ReactNode, useId } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FEEDBACK_ITEM_KIND_VALUES } from "@invessiv/common/constants/crm/feedback-item-kinds";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
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
            <select
              onChange={(event) =>
                onChangeAction({
                  areaLabel:
                    event.target.value === NONE_VALUE
                      ? null
                      : event.target.value,
                })
              }
              value={item.areaLabel ?? NONE_VALUE}
            >
              <option value={NONE_VALUE}>{texts.general}</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>{texts.kind}</span>
            <select
              onChange={(event) =>
                onChangeAction({
                  kind:
                    FEEDBACK_ITEM_KIND_VALUES.find(
                      (kind) => kind === event.target.value,
                    ) ?? null,
                })
              }
              value={item.kind ?? NONE_VALUE}
            >
              <option value={NONE_VALUE}>{texts.kindNone}</option>
              {FEEDBACK_ITEM_KIND_VALUES.map((kind) => (
                <option key={kind} value={kind}>
                  {content.kinds[kind]}
                </option>
              ))}
            </select>
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
