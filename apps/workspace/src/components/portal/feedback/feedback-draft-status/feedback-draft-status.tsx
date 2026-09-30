"use client";

import { useEffect, useState } from "react";
import type { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import {
  FeedbackDraftSaveState,
  type FeedbackDraftSaveState as FeedbackDraftSaveStateValue,
} from "@/common/constants/portal/feedback-draft-save-states";
import type { FeedbackDraftItem } from "@/common/contracts/portal/feedback-draft-item";
import { feedbackDraftItems } from "@/common/patterns/portal/feedback-draft-items";
import type { Locale } from "@/config/i18n";
import type { PortalFeedbackDictionary } from "@/i18n/dictionaries/portal";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./feedback-draft-status.module.css";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export type FeedbackDraftStatusProps = {
  conflictItems: readonly FeedbackDraftItem[] | null;
  content: PortalFeedbackDictionary;
  errorCode: PortalFeedbackErrorCode | null;
  locale: Locale;
  onDismissConflictAction: () => void;
  onRestoreConflictAction: () => void;
  onRetryAction: () => void;
  saveState: FeedbackDraftSaveStateValue;
  savedAt: string | null;
  savedByName: string | null;
};

function savedTime(
  savedAt: string,
  now: number,
  texts: PortalFeedbackDictionary["draft"],
  locale: Locale,
): string {
  const age = Math.max(0, now - new Date(savedAt).getTime());
  if (age < MINUTE_MS) return texts.justNow;
  if (age < HOUR_MS)
    return formatMessage(texts.minutesAgo, {
      count: Math.floor(age / MINUTE_MS),
    });
  return formatMessage(texts.at, { date: formatMomentDay(savedAt, locale) });
}

/**
 * Where the draft stands, who saved last and — after a parallel save of another contact — the
 * way back to the own text. The status line is a polite live region; the conflict is an alert.
 */
export function FeedbackDraftStatus({
  conflictItems,
  content,
  errorCode,
  locale,
  onDismissConflictAction,
  onRestoreConflictAction,
  onRetryAction,
  saveState,
  savedAt,
  savedByName,
}: FeedbackDraftStatusProps) {
  const texts = content.draft;
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const saved = savedAt
    ? formatMessage(texts.saved, {
        time: savedTime(savedAt, now, texts, locale),
      })
    : null;
  const line =
    saveState === FeedbackDraftSaveState.Saving
      ? texts.saving
      : saveState === FeedbackDraftSaveState.Unsaved
        ? texts.unsaved
        : saveState === FeedbackDraftSaveState.Failed
          ? texts.failed
          : saved;

  async function copy() {
    if (!conflictItems) return;
    try {
      await navigator.clipboard.writeText(
        feedbackDraftItems.toPlainText(conflictItems),
      );
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={styles.status}>
      <p
        aria-live="polite"
        className={styles.line}
        data-state={saveState}
        role="status"
      >
        {line ? <span>{line}</span> : null}
        {savedByName && saveState !== FeedbackDraftSaveState.Saving ? (
          <span className={styles.by}>
            {formatMessage(texts.editedBy, { name: savedByName })}
          </span>
        ) : null}
      </p>
      {saveState === FeedbackDraftSaveState.Failed ? (
        <div className={styles.failed}>
          {errorCode ? <p>{content.errors[errorCode]}</p> : null}
          <ButtonControl onClick={onRetryAction} type="button" variant="ghost">
            {texts.retry}
          </ButtonControl>
        </div>
      ) : null}
      {conflictItems ? (
        <div className={styles.conflict} role="alert">
          <p className={styles.conflictTitle}>{texts.conflict.title}</p>
          <p>{texts.conflict.description}</p>
          <div className={styles.conflictActions}>
            <ButtonControl onClick={onRestoreConflictAction} type="button">
              {texts.conflict.restore}
            </ButtonControl>
            <ButtonControl
              onClick={() => void copy()}
              type="button"
              variant="ghost"
            >
              {copied ? texts.conflict.copied : texts.conflict.copy}
            </ButtonControl>
            <ButtonControl
              onClick={onDismissConflictAction}
              type="button"
              variant="ghost"
            >
              {texts.conflict.dismiss}
            </ButtonControl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
