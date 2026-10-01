"use client";

import { type ReactNode, useEffect, useState } from "react";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import {
  DraftSaveState,
  type DraftSaveState as DraftSaveStateValue,
} from "@/common/constants/shared/draft-save-states";
import type { DraftSaveStatusTexts } from "@/common/contracts/shared/draft-save-status-texts";
import type { Locale } from "@/config/i18n";
import { formatMomentDay } from "@/lib/i18n/format-moment-day";
import styles from "./draft-save-status.module.css";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export type DraftSaveStatusProps = {
  /** Shown below the line, e.g. the way back to an own text after a parallel save. */
  conflict?: ReactNode;
  /** Why the last save failed, already worded. */
  errorText: string | null;
  locale: Locale;
  onRetryAction: () => void;
  saveState: DraftSaveStateValue;
  savedAt: string | null;
  savedByName: string | null;
  texts: DraftSaveStatusTexts;
};

function savedTime(
  savedAt: string,
  now: number,
  texts: DraftSaveStatusTexts,
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

/** Where an autosave stands and who saved last. The status line is a polite live region. */
export function DraftSaveStatus({
  conflict,
  errorText,
  locale,
  onRetryAction,
  saveState,
  savedAt,
  savedByName,
  texts,
}: DraftSaveStatusProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  let line = savedAt
    ? formatMessage(texts.saved, {
        time: savedTime(savedAt, now, texts, locale),
      })
    : null;
  switch (saveState) {
    case DraftSaveState.Saving:
      line = texts.saving;
      break;
    case DraftSaveState.Unsaved:
      line = texts.unsaved;
      break;
    case DraftSaveState.Failed:
      line = texts.failed;
      break;
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
        {savedByName && saveState !== DraftSaveState.Saving ? (
          <span className={styles.by}>
            {formatMessage(texts.editedBy, { name: savedByName })}
          </span>
        ) : null}
      </p>
      {saveState === DraftSaveState.Failed ? (
        <div className={styles.failed}>
          {errorText ? <p>{errorText}</p> : null}
          <ButtonControl onClick={onRetryAction} type="button" variant="ghost">
            {texts.retry}
          </ButtonControl>
        </div>
      ) : null}
      {conflict}
    </div>
  );
}
